import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearch } from "@/contexts/SearchContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ListingCard, { Listing, DEFAULT_OPERATING_HOURS, getIsOpenNow } from "@/components/ListingCard";
import FeaturedListings from "@/components/FeaturedListings";
import ExclusiveDeals from "@/components/ExclusiveDeals";
import CategoryHighlights from "@/components/CategoryHighlights";
import CategoryGrid from "@/components/CategoryGrid";
import PromoBanner from "@/components/PromoBanner";
import MapView from "@/components/MapView";
import { Link } from "react-router-dom";
import MobileFiltersMap from "@/components/MobileFiltersMap";
import { DEMO_LISTINGS } from "@/lib/demo-listings";
import { MapPin, SlidersHorizontal, Search, Map as MapIcon, ChevronRight, Clock, ArrowUpDown } from "lucide-react";
import { geocodeSingaporePostalCode } from "@/lib/geocode-pincode";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SINGAPORE_DISTRICTS, BUSINESS_CATEGORIES, DISTRICT_COORDINATES } from "@/lib/districts";
import { toast } from "sonner";

interface IndexProps {
  showMap: boolean;
  setShowMap: (val: boolean) => void;
  registerDetectLocation: (fn: () => void) => void;
}

const Index = ({ showMap, setShowMap, registerDetectLocation }: IndexProps) => {
  const { searchQuery, setSearchQuery, setListings: setSearchListings, setOnPincodeSearch } = useSearch();
  const [district, setDistrict] = useState("All Districts");
  const [category, setCategory] = useState("All Categories");
  const [listings, setListings] = useState<Listing[]>(DEMO_LISTINGS);
  // Map is always shown by default
  useEffect(() => { setShowMap(true); }, [setShowMap]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>();
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const [openNow, setOpenNow] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [pincode, setPincode] = useState("");
  const [pincodeAddress, setPincodeAddress] = useState("");

  const handlePincodeSearch = useCallback(async (code: string) => {
    setPincode(code);
    if (code.length !== 6) { setPincodeAddress(""); return; }
    const result = await geocodeSingaporePostalCode(code);
    if (result) {
      setUserLocation({ lat: result.lat, lng: result.lng });
      setMapCenter({ lat: result.lat, lng: result.lng });
      setPincodeAddress(result.address);
      if (!radiusKm) setRadiusKm(2);
      setShowMap(true);
      toast.success(`Found: ${result.address}`);
    } else {
      setPincodeAddress("");
      toast.error("Invalid postal code — try a 6-digit Singapore postal code");
    }
  }, [radiusKm, setShowMap]);

  useEffect(() => {
    setSearchListings(listings.map((l) => ({ id: l.id, name: l.name, category: l.category, district: l.district })));
  }, [listings, setSearchListings]);

  // Register pincode search handler globally
  useEffect(() => {
    setOnPincodeSearch(() => handlePincodeSearch);
    return () => setOnPincodeSearch(null);
  }, [handlePincodeSearch, setOnPincodeSearch]);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const q = query(collection(db, "listings"), where("status", "==", "approved"));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const firestoreData = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Listing));
          const firestoreIds = new Set(firestoreData.map(l => l.id));
          const uniqueDemo = DEMO_LISTINGS.filter(l => !firestoreIds.has(l.id));
          setListings([...firestoreData, ...uniqueDemo]);
        }
      } catch { /* demo fallback */ }
    };
    fetchListings();
  }, []);

  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const filterOrigin = useMemo(() => 
    userLocation || (district !== "All Districts" ? DISTRICT_COORDINATES[district] : null),
    [userLocation, district]
  );

  const filtered = useMemo(() => {
    const result = listings.filter((l) => {
      const matchQ = !searchQuery || l.name.toLowerCase().includes(searchQuery.toLowerCase()) || l.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchD = (radiusKm && filterOrigin) || district === "All Districts" || l.district === district;
      const matchC = category === "All Categories" || l.category === category;
      const matchR = !radiusKm || !filterOrigin || !l.lat || !l.lng || getDistance(filterOrigin.lat, filterOrigin.lng, l.lat, l.lng) <= radiusKm;
      const matchO = !openNow || getIsOpenNow(l) === true;
      return matchQ && matchD && matchC && matchR && matchO;
    });
    if (filterOrigin) {
      result.sort((a, b) => {
        const distA = a.lat && a.lng ? getDistance(filterOrigin.lat, filterOrigin.lng, a.lat, a.lng) : Infinity;
        const distB = b.lat && b.lng ? getDistance(filterOrigin.lat, filterOrigin.lng, b.lat, b.lng) : Infinity;
        return distA - distB;
      });
    }
    return result;
  }, [listings, searchQuery, district, category, radiusKm, userLocation, filterOrigin, openNow]);

  const getListingDistance = (listing: { lat?: number; lng?: number }) => {
    if (!filterOrigin || !listing.lat || !listing.lng) return null;
    return getDistance(filterOrigin.lat, filterOrigin.lng, listing.lat, listing.lng);
  };

  const handleDetectLocation = useCallback(() => {
    if (!navigator.geolocation) { toast.error("Geolocation is not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(userLoc);
        setMapCenter(userLoc);
        setShowMap(true);
        toast.success("Location detected — use distance filters to narrow results");
      },
      () => toast.error("Unable to detect location — please enable location access")
    );
  }, [setShowMap]);

  useEffect(() => {
    registerDetectLocation(handleDetectLocation);
  }, [registerDetectLocation, handleDetectLocation]);

  const hasActiveFilters = searchQuery || district !== "All Districts" || category !== "All Categories" || radiusKm !== null || openNow || pincode;
  const activeFilterCount = [district !== "All Districts", category !== "All Categories", radiusKm !== null, openNow, !!searchQuery, !!pincode].filter(Boolean).length;

  const [sortBy, setSortBy] = useState<"default" | "name" | "distance">("default");

  const sortedFiltered = useMemo(() => {
    const arr = [...filtered];
    if (sortBy === "name") arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }, [filtered, sortBy]);

  const CATEGORY_NAV = [
    { value: "Tuition", label: "Tuition", emoji: "📚" },
    { value: "Baking", label: "Baking", emoji: "🧁" },
    { value: "Music / Art / Craft", label: "Music / Art", emoji: "🎵" },
    { value: "Home Food", label: "Home Food", emoji: "🍱" },
    { value: "Beauty", label: "Beauty", emoji: "💅" },
    { value: "Pet Services", label: "Pet Services", emoji: "🐾" },
    { value: "Event Services", label: "Events", emoji: "🎈" },
    { value: "Tailoring", label: "Tailoring", emoji: "🧵" },
    { value: "Cleaning", label: "Cleaning", emoji: "🧹" },
    { value: "Handyman", label: "Handyman", emoji: "🔧" },
    { value: "Photography / Videography", label: "Photo / Video", emoji: "📸" },
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* ═══ CATEGORY NAV BAR ═══ */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-3 md:px-4">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2">
            {CATEGORY_NAV.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value === category ? "All Categories" : c.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                  category === c.value
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <span>{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ DISTANCE FILTER BAR ═══ */}
      <div className="border-b border-border bg-card/80">
        <div className="container mx-auto px-3 md:px-4">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1.5">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground shrink-0">Distance:</span>
            {[
              { label: "500m", value: 0.5 },
              { label: "1 km", value: 1 },
              { label: "2 km", value: 2 },
              { label: "3 km", value: 3 },
              { label: "5 km", value: 5 },
              { label: "All SG", value: null as number | null },
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={() => {
                  setRadiusKm(opt.value);
                  if (opt.value && !userLocation) handleDetectLocation();
                }}
                className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                  radiusKm === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <section className="container mx-auto px-3 md:px-4 pt-3 md:pt-5 pb-4 md:pb-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span>Singapore</span>
          {category !== "All Categories" && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground font-medium">{category}</span>
            </>
          )}
        </nav>

        {/* Split layout: Listings + Map */}
        <div className="flex gap-5 overflow-hidden">
          {/* Listings column */}
          <div className="min-w-0 w-full lg:w-3/5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">
                {sortedFiltered.length} result{sortedFiltered.length !== 1 ? "s" : ""}
                {radiusKm ? ` within ${radiusKm >= 1 ? radiusKm + ' km' : (radiusKm * 1000) + 'm'}` : ""}
              </p>
            </div>

            <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
              {sortedFiltered.length === 0 ? (
                <div className="text-center py-16 bg-card">
                  <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">No businesses found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
                </div>
              ) : (
                sortedFiltered.map((listing, idx) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    index={idx + 1}
                    highlighted={hoveredListingId === listing.id}
                    onHover={setHoveredListingId}
                    distanceKm={getListingDistance(listing)}
                    onSelect={(l) => {
                      setSelectedListing(l);
                      if (l.lat && l.lng) setMapCenter({ lat: l.lat, lng: l.lng });
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {/* Map column - always visible on desktop */}
          <div className="hidden lg:block lg:w-2/5">
            <div className="flex flex-col gap-3">
              <div className="bg-card border border-border rounded-lg overflow-hidden h-[400px]">
                <MapView
                  listings={sortedFiltered}
                  selectedId={selectedListing?.id}
                  hoveredId={hoveredListingId}
                  onHoverListing={setHoveredListingId}
                  onSelectListing={setSelectedListing}
                  center={mapCenter}
                  radiusKm={radiusKm}
                />
              </div>

              {/* Sidebar CTA */}
              <div className="border border-border rounded-lg bg-card p-5 text-center">
                <h3 className="text-base font-bold text-foreground mb-1">Manage your <span className="underline decoration-primary decoration-2">free</span> listing</h3>
                <p className="text-xs text-muted-foreground mb-3">Update your business information in a few steps.</p>
                <Link to="/add-listing">
                  <Button className="w-full bg-primary text-primary-foreground font-bold">
                    Claim Your Listing
                  </Button>
                </Link>
                <p className="text-[10px] text-muted-foreground mt-2">or email hello@nearly.sg</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CATEGORY GRID ═══ */}
      {!hasActiveFilters && (
        <section className="container mx-auto px-3 md:px-4 py-4 md:py-8">
          <CategoryGrid />
        </section>
      )}

      {/* ═══ PROMO BANNER ═══ */}
      {!hasActiveFilters && <PromoBanner />}

      {/* ═══ CATEGORY HIGHLIGHTS ═══ */}
      {!hasActiveFilters && (
        <section className="container mx-auto px-3 md:px-4 py-3 md:py-6">
          <CategoryHighlights />
        </section>
      )}


    </div>
  );
};

export default Index;
