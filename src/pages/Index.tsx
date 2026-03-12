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
import MobileFiltersMap from "@/components/MobileFiltersMap";
import { DEMO_LISTINGS } from "@/lib/demo-listings";
import { MapPin, SlidersHorizontal, Search } from "lucide-react";
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
  const { searchQuery, setSearchQuery, setListings: setSearchListings } = useSearch();
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

  return (
    <div className="min-h-screen bg-background">

      {/* ═══ ALL BUSINESSES (TOP) ═══ */}
      <section className="container mx-auto px-3 md:px-4 pt-2 md:pt-4 pb-4 md:pb-8">

        {/* Mobile: Sticky filters + Map */}
        <MobileFiltersMap
          category={category}
          setCategory={setCategory}
          openNow={openNow}
          setOpenNow={setOpenNow}
          filtersOpen={filtersOpen}
          setFiltersOpen={setFiltersOpen}
          radiusKm={radiusKm}
          setRadiusKm={setRadiusKm}
          district={district}
          setDistrict={setDistrict}
          userLocation={userLocation}
          handleDetectLocation={handleDetectLocation}
          hasActiveFilters={!!hasActiveFilters}
          activeFilterCount={activeFilterCount}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setOpenNowState={setOpenNow}
          filtered={filtered}
          selectedListing={selectedListing}
          setSelectedListing={setSelectedListing}
          hoveredListingId={hoveredListingId}
          setHoveredListingId={setHoveredListingId}
          mapCenter={mapCenter}
          setMapCenter={setMapCenter}
        />

        {/* Desktop: Inline filters (hidden on mobile) */}
        <div className="hidden lg:block">
          <div className="bg-card border border-border rounded-xl p-3 mb-4 space-y-2">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-nowrap flex-1 min-w-0">
                {[
                  { value: "All Categories", label: "All", emoji: "✦" },
                  { value: "Food & Beverage", label: "Food", emoji: "🍰" },
                  { value: "Beauty & Wellness", label: "Beauty", emoji: "💅" },
                  { value: "Education & Training", label: "Tutoring", emoji: "📚" },
                  { value: "Home Services", label: "Home", emoji: "🏠" },
                  { value: "Healthcare & Medical", label: "Health", emoji: "🏥" },
                  { value: "Retail & Shopping", label: "Retail", emoji: "🛍️" },
                ].map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
                      category === c.value
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    <span>{c.emoji}</span>
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setOpenNow(!openNow)}
                  className={`px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap flex items-center gap-1 ${
                    openNow
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${openNow ? "bg-white" : "bg-emerald-500"}`} />
                  Open
                </button>
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className={`px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap flex items-center gap-1 ${
                    filtersOpen || hasActiveFilters
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  {activeFilterCount > 0 ? activeFilterCount : ""}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-nowrap">
              <span className="text-xs font-medium text-muted-foreground shrink-0">Distance</span>
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
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                    radiusKm === r.value
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {r.label}
                </button>
              ))}
              {radiusKm !== null && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 bg-primary/10 text-primary border border-primary/20">
                  <MapPin className="w-2.5 h-2.5" />
                  {userLocation ? "GPS" : district !== "All Districts" ? district : "—"}
                </span>
              )}
            </div>

            {filtersOpen && (
              <div className="space-y-2 pt-1 border-t border-border">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-nowrap">
                  <span className="text-[11px] font-medium text-muted-foreground shrink-0">Area:</span>
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
                    onClick={() => { setCategory("All Categories"); setDistrict("All Districts"); setSearchQuery(""); setRadiusKm(null); setOpenNow(false); }}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Split view: Featured list + Map */}
        <div className="flex gap-4 md:gap-6 overflow-hidden">
          {/* Listings column */}
          <div className="w-full lg:w-1/2 xl:w-[55%] min-w-0">
            <div className="bg-card border border-border rounded-xl p-3 md:p-4">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <h2 className="text-sm md:text-lg font-bold text-foreground">
                  {filtered.length} <span className="font-normal text-muted-foreground text-xs md:text-sm">{category !== "All Categories" ? category : ""} businesses{radiusKm ? ` within ${radiusKm >= 1 ? radiusKm + ' km' : (radiusKm * 1000) + 'm'}` : ""}</span>
                </h2>
              </div>
              <div className="lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto lg:pr-1 space-y-2 scrollbar-thin">
                {filtered.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">No businesses found</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  filtered.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
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
          </div>

          {/* Map column (desktop only) */}
          <div className="hidden lg:block lg:w-1/2 xl:w-[45%]">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base md:text-lg font-bold text-foreground">Map</h2>
                <Button variant="outline" size="sm" className="h-8 text-xs rounded-full" onClick={() => setMapCenter(undefined)}>
                  Reset
                </Button>
              </div>
              <div className="h-[calc(100vh-280px)] rounded-xl overflow-hidden border border-border">
                <MapView
                  listings={filtered}
                  selectedId={selectedListing?.id}
                  hoveredId={hoveredListingId}
                  onHoverListing={setHoveredListingId}
                  onSelectListing={setSelectedListing}
                  center={mapCenter}
                />
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
