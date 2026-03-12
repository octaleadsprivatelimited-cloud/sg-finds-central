import { useState, useRef, useEffect } from "react";
import { MapPin, SlidersHorizontal, ChevronUp, ChevronDown, Maximize2, Minimize2, LocateFixed, Search } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SINGAPORE_DISTRICTS } from "@/lib/districts";
import MapView from "@/components/MapView";
import { Listing } from "@/components/ListingCard";

interface MobileFiltersMapProps {
  category: string;
  setCategory: (val: string) => void;
  openNow: boolean;
  setOpenNow: (val: boolean) => void;
  filtersOpen: boolean;
  setFiltersOpen: (val: boolean) => void;
  radiusKm: number | null;
  setRadiusKm: (val: number | null) => void;
  district: string;
  setDistrict: (val: string) => void;
  userLocation: { lat: number; lng: number } | null;
  handleDetectLocation: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  setOpenNowState: (val: boolean) => void;
  pincode: string;
  onPincodeSearch: (code: string) => void;
  pincodeAddress: string;
  // Map
  filtered: Listing[];
  selectedListing: Listing | null;
  setSelectedListing: (l: Listing | null) => void;
  hoveredListingId: string | null;
  setHoveredListingId: (id: string | null) => void;
  mapCenter?: { lat: number; lng: number };
  setMapCenter: (c: { lat: number; lng: number } | undefined) => void;
}

const CATEGORIES = [
  { value: "All Categories", label: "All", emoji: "✦" },
  { value: "Food & Beverage", label: "Food", emoji: "🍰" },
  { value: "Beauty & Wellness", label: "Beauty", emoji: "💅" },
  { value: "Education & Training", label: "Tutoring", emoji: "📚" },
  { value: "Home Services", label: "Home", emoji: "🏠" },
  { value: "Healthcare & Medical", label: "Health", emoji: "🏥" },
  { value: "Retail & Shopping", label: "Retail", emoji: "🛍️" },
];

const DISTANCES = [
  { value: 0.5, label: "500m" },
  { value: 1, label: "1 km" },
  { value: 2, label: "2 km" },
  { value: 3, label: "3 km" },
  { value: 5, label: "5 km" },
  { value: null as number | null, label: "All SG" },
];

const QUICK_DISTRICTS = ["All Districts", "Bedok", "Tampines", "Orchard", "CBD / Raffles Place", "Novena", "Bishan"];

const MobileFiltersMap = ({
  category, setCategory, openNow, setOpenNow, filtersOpen, setFiltersOpen,
  radiusKm, setRadiusKm, district, setDistrict, userLocation, handleDetectLocation,
  hasActiveFilters, activeFilterCount, searchQuery, setSearchQuery, setOpenNowState,
  pincode, onPincodeSearch, pincodeAddress,
  filtered, selectedListing, setSelectedListing, hoveredListingId, setHoveredListingId,
  mapCenter, setMapCenter,
}: MobileFiltersMapProps) => {
  const [isSticky, setIsSticky] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [mapVisible, setMapVisible] = useState(true);
  const stickyRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Intersection observer for sticky detection
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-1px 0px 0px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="lg:hidden">
      {/* Sentinel element for sticky detection */}
      <div ref={sentinelRef} className="h-0" />
      
      {/* Sticky filter container */}
      <div
        ref={stickyRef}
        className={`sticky top-0 z-30 transition-shadow duration-200 ${
          isSticky ? "shadow-md bg-background/95 backdrop-blur-md -mx-3 px-3 py-1.5" : ""
        }`}
      >
        <div className={`bg-card border border-border rounded-xl p-2 space-y-1.5 ${isSticky ? "rounded-t-none border-t-0" : ""}`}>
          {/* Row 1: Category chips */}
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-nowrap flex-1 min-w-0">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`px-2 py-1 rounded-full text-[11px] font-medium border transition-all whitespace-nowrap shrink-0 flex items-center gap-0.5 active:scale-95 ${
                    category === c.value
                      ? "bg-foreground text-background border-foreground shadow-sm"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  <span className="text-[10px]">{c.emoji}</span>
                  {c.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={`px-2 py-1 rounded-full text-[11px] font-medium border transition-all whitespace-nowrap flex items-center gap-0.5 active:scale-95 ${
                  filtersOpen || hasActiveFilters
                    ? "bg-foreground text-background border-foreground shadow-sm"
                    : "bg-background text-foreground border-border hover:bg-muted"
                }`}
              >
                <SlidersHorizontal className="w-3 h-3" />
                {activeFilterCount > 0 ? activeFilterCount : ""}
              </button>
            </div>
          </div>

          {/* Row 2: Distance chips */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-nowrap">
            <span className="text-[11px] font-medium text-muted-foreground shrink-0">Distance</span>
            {DISTANCES.map((r) => (
              <button
                key={r.label}
                onClick={() => {
                  if (r.value !== null && !userLocation && district === "All Districts") {
                    handleDetectLocation();
                  }
                  setRadiusKm(r.value);
                }}
                className={`px-2 py-1 rounded-full text-[11px] font-medium border transition-all whitespace-nowrap shrink-0 active:scale-95 ${
                  radiusKm === r.value
                    ? "bg-foreground text-background border-foreground shadow-sm"
                    : "bg-background text-foreground border-border hover:bg-muted"
                }`}
              >
                {r.label}
              </button>
            ))}
            {radiusKm !== null && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium shrink-0 bg-primary/10 text-primary border border-primary/20">
                <MapPin className="w-2.5 h-2.5" />
                {userLocation ? "GPS" : district !== "All Districts" ? district : "—"}
              </span>
            )}
          </div>

          {/* Expanded filters */}
          {filtersOpen && (
            <div className="space-y-1.5 pt-1 border-t border-border">
              {/* Pincode search */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-medium text-muted-foreground shrink-0">Postal:</span>
                <div className="relative flex-1 max-w-[160px]">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit postal code"
                    value={pincode}
                    onChange={(e) => onPincodeSearch(e.target.value.replace(/\D/g, ''))}
                    className="w-full h-6 px-2 pr-6 text-[10px] rounded-full border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <Search className="absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-muted-foreground" />
                </div>
                {pincodeAddress && (
                  <span className="text-[9px] text-primary font-medium truncate max-w-[120px]">{pincodeAddress}</span>
                )}
              </div>
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-nowrap">
                <span className="text-[10px] font-medium text-muted-foreground shrink-0">Area:</span>
                {QUICK_DISTRICTS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDistrict(d)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all whitespace-nowrap shrink-0 active:scale-95 ${
                      district === d
                        ? "bg-foreground text-background border-foreground shadow-sm"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {d === "All Districts" ? "All" : d}
                  </button>
                ))}
                <Select value={district} onValueChange={setDistrict}>
                  <SelectTrigger className="w-auto h-5 text-[10px] border-border rounded-full px-2 shrink-0">
                    <SelectValue placeholder="More" />
                  </SelectTrigger>
                  <SelectContent>
                    {SINGAPORE_DISTRICTS.filter(d => !QUICK_DISTRICTS.includes(d)).map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={() => { setCategory("All Categories"); setDistrict("All Districts"); setSearchQuery(""); setRadiusKm(null); setOpenNowState(false); onPincodeSearch(""); }}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors active:scale-95"
                >
                  Clear All
                </button>
              )}
            </div>
          )}
        </div>

        {/* Active filter chips when collapsed */}
        {!filtersOpen && hasActiveFilters && (
          <div className="flex items-center gap-1 pt-1 overflow-x-auto scrollbar-hide flex-nowrap">
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 whitespace-nowrap shrink-0">
                "{searchQuery}"
                <button onClick={() => setSearchQuery("")} className="hover:text-destructive">×</button>
              </span>
            )}
            {district !== "All Districts" && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 whitespace-nowrap shrink-0">
                {district}
                <button onClick={() => setDistrict("All Districts")} className="hover:text-destructive">×</button>
              </span>
            )}
            {category !== "All Categories" && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 whitespace-nowrap shrink-0">
                {category}
                <button onClick={() => setCategory("All Categories")} className="hover:text-destructive">×</button>
              </span>
            )}
            {radiusKm !== null && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 whitespace-nowrap shrink-0">
                ≤{radiusKm}km
                <button onClick={() => setRadiusKm(null)} className="hover:text-destructive">×</button>
              </span>
            )}
            {openNow && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-600/10 text-emerald-600 border border-emerald-600/20 whitespace-nowrap shrink-0">
                Open Now
                <button onClick={() => setOpenNowState(false)} className="hover:text-destructive">×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Mobile Map with controls */}
      <div className="mb-3 mt-2">
        <div className="relative">
          {/* Map toggle bar */}
          <button
            onClick={() => setMapVisible(!mapVisible)}
            className="w-full flex items-center justify-between px-3 py-1.5 bg-card border border-border rounded-t-xl text-[11px] font-medium text-muted-foreground active:scale-[0.99] transition-transform"
          >
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />
              Map
              {radiusKm !== null && (
                <span className="text-primary font-medium">
                  · {userLocation ? "GPS" : district !== "All Districts" ? district : "—"} · {radiusKm >= 1 ? radiusKm + ' km' : (radiusKm * 1000) + 'm'}
                </span>
              )}
              <span className="text-muted-foreground/60">· {filtered.length} results</span>
            </span>
            {mapVisible ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {mapVisible && (
            <div className={`relative border border-t-0 border-border rounded-b-xl overflow-hidden transition-all duration-300 ${mapExpanded ? "h-[280px]" : "h-[130px]"}`}>
              <MapView
                listings={filtered}
                selectedId={selectedListing?.id}
                hoveredId={hoveredListingId}
                onHoverListing={setHoveredListingId}
                onSelectListing={setSelectedListing}
                center={mapCenter}
              />

              {/* Map overlay controls */}
              <div className="absolute top-2 right-2 flex flex-col gap-1">
                <button
                  onClick={() => setMapExpanded(!mapExpanded)}
                  className="w-7 h-7 rounded-lg bg-card/90 backdrop-blur-sm border border-border shadow-sm flex items-center justify-center active:scale-90 transition-transform"
                  title={mapExpanded ? "Shrink map" : "Expand map"}
                >
                  {mapExpanded ? <Minimize2 className="w-3.5 h-3.5 text-foreground" /> : <Maximize2 className="w-3.5 h-3.5 text-foreground" />}
                </button>
                <button
                  onClick={handleDetectLocation}
                  className="w-7 h-7 rounded-lg bg-card/90 backdrop-blur-sm border border-border shadow-sm flex items-center justify-center active:scale-90 transition-transform"
                  title="My location"
                >
                  <LocateFixed className="w-3.5 h-3.5 text-foreground" />
                </button>
                <button
                  onClick={() => setMapCenter(undefined)}
                  className="w-7 h-7 rounded-lg bg-card/90 backdrop-blur-sm border border-border shadow-sm flex items-center justify-center active:scale-90 transition-transform text-[10px] font-bold text-foreground"
                  title="Reset view"
                >
                  ↻
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileFiltersMap;
