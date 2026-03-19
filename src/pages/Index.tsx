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
    { value: "Automotive", label: "Auto Services", emoji: "🚗" },
    { value: "Beauty & Wellness", label: "Beauty", emoji: "💅" },
    { value: "Home Services", label: "Home Services", emoji: "🏠" },
    { value: "Financial Services", label: "Insurance", emoji: "🛡️" },
    { value: "Legal Services", label: "Legal Services", emoji: "⚖️" },
    { value: "Healthcare & Medical", label: "Medical Services", emoji: "🏥" },
    { value: "Food & Beverage", label: "Restaurants", emoji: "🍽️" },
    { value: "Retail & Shopping", label: "Retail", emoji: "🛍️" },
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

        {/* Page heading */}
        <h1 className="text-lg md:text-2xl font-bold text-foreground mb-4">
          {category !== "All Categories" ? category : "All Businesses"} in Singapore
          {district !== "All Districts" && `, ${district}`}
        </h1>

        {/* Toolbar: Map View, Filters, Sort */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs rounded-full"
              onClick={() => setShowMap(!showMap)}
            >
              <MapIcon className="w-3.5 h-3.5 mr-1" />
              Map View
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs rounded-full"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
              All Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[9px] rounded-full">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            {openNow && (
              <Badge variant="outline" className="text-[11px] gap-1 rounded-full text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Open Now
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Sort:</span>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-auto h-8 text-xs border-border rounded-full px-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="name">Name A–Z</SelectItem>
                <SelectItem value="distance">Distance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Open 24 Hours banner */}
        <button
          onClick={() => setOpenNow(!openNow)}
          className={`w-full flex items-center gap-2 px-4 py-2.5 border rounded-lg mb-3 text-xs transition-colors ${
            openNow
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
              : "bg-card border-border hover:bg-muted/50"
          }`}
        >
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">View all businesses that are </span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">OPEN 24 Hours</span>
        </button>

        {/* Filters panel (expandable) */}
        {filtersOpen && (
          <div className="bg-card border border-border rounded-lg p-3 mb-3 space-y-2.5">
            {/* Distance */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-nowrap">
              <span className="text-xs font-medium text-muted-foreground shrink-0">Distance:</span>
              {[
                { value: 0.5, label: "500m" },
                { value: 1, label: "1 km" },
                { value: 2, label: "2 km" },
                { value: 3, label: "3 km" },
                { value: 5, label: "5 km" },
                { value: null as number | null, label: "All SG" },
              ].map((r) => (
                <button
                  key={r.label}
                  onClick={() => {
                    if (r.value !== null && !userLocation && district === "All Districts") handleDetectLocation();
                    setRadiusKm(r.value);
                  }}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-colors whitespace-nowrap shrink-0 ${
                    radiusKm === r.value
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Postal code */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground shrink-0">Postal:</span>
              <div className="relative flex-1 max-w-[200px]">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit postal code"
                  value={pincode}
                  onChange={(e) => handlePincodeSearch(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-7 px-2.5 pr-7 text-[11px] rounded-full border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              </div>
              {pincodeAddress && (
                <span className="text-[10px] text-primary font-medium truncate max-w-[180px]">{pincodeAddress}</span>
              )}
            </div>

            {/* Area */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-nowrap">
              <span className="text-xs font-medium text-muted-foreground shrink-0">Area:</span>
              {["All Districts", "Bedok", "Tampines", "Orchard", "CBD / Raffles Place", "Novena", "Bishan"].map((d) => (
                <button
                  key={d}
                  onClick={() => setDistrict(d)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors whitespace-nowrap shrink-0 ${
                    district === d
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {d === "All Districts" ? "All" : d}
                </button>
              ))}
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger className="w-auto h-6 text-[11px] border-border rounded-full px-2.5 shrink-0">
                  <SelectValue placeholder="More" />
                </SelectTrigger>
                <SelectContent>
                  {SINGAPORE_DISTRICTS.filter(d => !["All Districts", "Bedok", "Tampines", "Orchard", "CBD / Raffles Place", "Novena", "Bishan"].includes(d)).map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={() => { setCategory("All Categories"); setDistrict("All Districts"); setSearchQuery(""); setRadiusKm(null); setOpenNow(false); setPincode(""); setPincodeAddress(""); setUserLocation(null); }}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* Split layout: Listings + Map/Sidebar */}
        <div className="flex gap-5 overflow-hidden">
          {/* Listings column - Yellow Pages style stacked cards */}
          <div className={`min-w-0 ${showMap ? "w-full lg:w-3/5" : "w-full"}`}>
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

          {/* Map / Sidebar column */}
          {showMap && (
            <div className="hidden lg:block lg:w-2/5">
              <div className="sticky top-16">
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="h-[calc(100vh-200px)]">
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
                </div>

                {/* Sidebar CTA */}
                <div className="mt-4 border border-border rounded-lg bg-card p-5 text-center">
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
          )}

          {/* Sidebar when map is hidden */}
          {!showMap && (
            <div className="hidden lg:block lg:w-72 shrink-0">
              <div className="sticky top-16 space-y-4">
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
          )}
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

      {/* ═══ FEATURED BUSINESSES ═══ */}
      <section className="container mx-auto px-3 md:px-4 py-3 md:py-6">
        <FeaturedListings listings={filtered} />
      </section>

      {/* ═══ EXCLUSIVE DEALS ═══ */}
      <section className="container mx-auto px-3 md:px-4">
        <ExclusiveDeals listings={filtered} />
      </section>
    </div>
  );
};

export default Index;
