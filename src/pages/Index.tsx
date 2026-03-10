import { useState, useEffect, useMemo } from "react";
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
import { DEMO_LISTINGS } from "@/lib/demo-listings";
import { MapPin, SlidersHorizontal } from "lucide-react";
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
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setSearchListings(listings.map((l) => ({ id: l.id, name: l.name, category: l.category, district: l.district })));
  }, [listings, setSearchListings]);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const q = query(collection(db, "listings"), where("status", "==", "approved"));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Listing));
          setListings(data);
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

  const handleDetectLocation = () => {
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
  };

  // Register the detect location function for the header
  useEffect(() => {
    registerDetectLocation(handleDetectLocation);
  }, [registerDetectLocation]);

  const hasActiveFilters = searchQuery || district !== "All Districts" || category !== "All Categories" || radiusKm !== null || openNow;
  const activeFilterCount = [district !== "All Districts", category !== "All Categories", radiusKm !== null, openNow, !!searchQuery].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">

      {/* ═══ ALL BUSINESSES (TOP) ═══ */}
      <section className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="bg-card border border-border rounded-xl p-3 mb-4 space-y-2">

          {/* Row 1: Category chips + toggle */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-nowrap flex-1 min-w-0">
              {[
                { value: "All Categories", label: "All" },
                { value: "Food & Beverage", label: "Food" },
                { value: "Beauty & Wellness", label: "Beauty" },
                { value: "Education & Training", label: "Tutoring" },
                { value: "Home Services", label: "Home" },
                { value: "Healthcare & Medical", label: "Health" },
                { value: "Retail & Shopping", label: "Retail" },
              ].map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors whitespace-nowrap shrink-0 ${
                    category === c.value
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Filter toggle + Open Now + Clear */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setOpenNow(!openNow)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors whitespace-nowrap flex items-center gap-1 ${
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
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors whitespace-nowrap flex items-center gap-1 ${
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

          {/* Row 2: Expanded filters (collapsible) */}
          {filtersOpen && (
            <div className="space-y-2 pt-1 border-t border-border">
              {/* District */}
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

              {/* Distance row */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-nowrap">
                <span className="text-[11px] font-medium text-muted-foreground shrink-0">Dist:</span>
                {[
                  { value: null as number | null, label: "Any" },
                  { value: 2, label: "2km" },
                  { value: 5, label: "5km" },
                  { value: 10, label: "10km" },
                ].map((r) => (
                  <button
                    key={r.label}
                    onClick={() => {
                      if (r.value !== null && !userLocation && district === "All Districts") {
                        handleDetectLocation();
                      }
                      setRadiusKm(r.value);
                    }}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors whitespace-nowrap shrink-0 ${
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

        {/* Active filter chips (visible when panel is collapsed) */}
        {!filtersOpen && hasActiveFilters && (
          <div className="flex items-center gap-1.5 pt-1.5 border-t border-border overflow-x-auto scrollbar-hide flex-nowrap">
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 whitespace-nowrap shrink-0">
                "{searchQuery}"
                <button onClick={() => setSearchQuery("")} className="hover:text-destructive">×</button>
              </span>
            )}
            {district !== "All Districts" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 whitespace-nowrap shrink-0">
                {district}
                <button onClick={() => setDistrict("All Districts")} className="hover:text-destructive">×</button>
              </span>
            )}
            {category !== "All Categories" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 whitespace-nowrap shrink-0">
                {category}
                <button onClick={() => setCategory("All Categories")} className="hover:text-destructive">×</button>
              </span>
            )}
            {radiusKm !== null && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 whitespace-nowrap shrink-0">
                ≤{radiusKm}km
                <button onClick={() => setRadiusKm(null)} className="hover:text-destructive">×</button>
              </span>
            )}
            {openNow && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-600/10 text-emerald-600 border border-emerald-600/20 whitespace-nowrap shrink-0">
                Open Now
                <button onClick={() => setOpenNow(false)} className="hover:text-destructive">×</button>
              </span>
            )}
          </div>
        )}

        {/* Split view: Featured list + Map */}
        <div className="flex gap-4 md:gap-6 overflow-hidden">
          {/* Listings column */}
          <div className={`w-full lg:w-1/2 xl:w-[55%] min-w-0 ${showMap ? "hidden lg:block" : ""}`}>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base md:text-lg font-bold text-foreground">Featured</h2>
                <span className="text-sm text-muted-foreground">{filtered.length} found</span>
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

          {/* Map column */}
          <div className={`lg:block lg:w-1/2 xl:w-[45%] ${showMap ? "block w-full" : "hidden"}`}>
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