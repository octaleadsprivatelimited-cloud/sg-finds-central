import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
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
import { Slider } from "@/components/ui/slider";
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
  useEffect(() => { setShowMap(true); }, [setShowMap]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>();
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState<number | null>(0.5);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const [openNow, setOpenNow] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [pincode, setPincode] = useState("");
  const [pincodeAddress, setPincodeAddress] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const listingsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (listingsScrollRef.current) {
        listingsScrollRef.current.scrollTop = 0;
        listingsScrollRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    });
  }, [currentPage]);

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
      const q = searchQuery.toLowerCase();
      const matchQ = !searchQuery || l.name.toLowerCase().includes(q) || l.category.toLowerCase().includes(q) || l.district.toLowerCase().includes(q);
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

  // Auto-detect location on mount for default 5km radius
  useEffect(() => {
    handleDetectLocation();
  }, []);

  const hasActiveFilters = searchQuery || district !== "All Districts" || category !== "All Categories" || radiusKm !== null || openNow || pincode;
  const activeFilterCount = [district !== "All Districts", category !== "All Categories", radiusKm !== null, openNow, !!searchQuery, !!pincode].filter(Boolean).length;

  const [sortBy, setSortBy] = useState<"default" | "name" | "distance">("default");

  const sortedFiltered = useMemo(() => {
    const arr = [...filtered];
    if (sortBy === "name") arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }, [filtered, sortBy]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, category, district, radiusKm, openNow, sortBy]);

  const totalPages = Math.ceil(sortedFiltered.length / ITEMS_PER_PAGE);
  const paginatedListings = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedFiltered.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedFiltered, currentPage, ITEMS_PER_PAGE]);

  const CATEGORY_NAV = [
    { value: "Tuition", label: "Tuition" },
    { value: "Baking", label: "Baking" },
    { value: "Music / Art / Craft", label: "Music / Art" },
    { value: "Home Food", label: "Home Food" },
    { value: "Beauty", label: "Beauty" },
    { value: "Pet Services", label: "Pet Services" },
    { value: "Event Services", label: "Events" },
    { value: "Tailoring", label: "Tailoring" },
    { value: "Cleaning", label: "Cleaning" },
    { value: "Handyman", label: "Handyman" },
    { value: "Photography / Videography", label: "Photo / Video" },
  ];

  const scrollRevealRef = useScrollReveal<HTMLDivElement>();

  return (
    <div className="min-h-screen bg-background" ref={scrollRevealRef}>

      {/* ═══ MOBILE LAYOUT ═══ */}
      <div className="lg:hidden">
        {/* Row 1: Category chips */}
        <div className="border-b border-border bg-card px-3 py-2">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setCategory("All Categories")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 border transition-all active:scale-95 ${
                category === "All Categories"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border"
              }`}
            >
              All
            </button>
            {CATEGORY_NAV.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value === category ? "All Categories" : c.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 border transition-all active:scale-95 ${
                  category === c.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Distance slider + Open Now */}
        <div className="border-b border-border bg-card px-3 py-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground shrink-0">Distance</span>
            <Slider
              value={[radiusKm ?? 10]}
              onValueChange={([v]) => {
                setRadiusKm(v);
                if (!userLocation) handleDetectLocation();
              }}
              min={0.5}
              max={10}
              step={0.5}
              className="flex-1"
            />
            <span className="text-xs font-semibold text-foreground shrink-0 w-12 text-right">
              {radiusKm ? (radiusKm < 1 ? `${radiusKm * 1000}m` : `${radiusKm} km`) : "All"}
            </span>
            <button
              onClick={() => setOpenNow(!openNow)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 border transition-all active:scale-95 ${
                openNow
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-card text-foreground border-border"
              }`}
            >
              Open Now
            </button>
          </div>
        </div>

        {/* Row 3: Map */}
        <div className="h-[200px] relative">
          <MapView
            listings={sortedFiltered}
            selectedId={selectedListing?.id}
            hoveredId={hoveredListingId}
            onHoverListing={setHoveredListingId}
            onSelectListing={setSelectedListing}
            center={mapCenter}
            radiusKm={radiusKm}
          />
          {/* GPS button overlay */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            <button
              onClick={handleDetectLocation}
              className="w-8 h-8 rounded-lg bg-card/90 backdrop-blur-sm border border-border shadow-sm flex items-center justify-center active:scale-90 transition-transform"
            >
              <MapPin className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>


        {/* Listings */}
        <div className="px-3 pb-6 space-y-3">
          {sortedFiltered.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg border border-border">
              <MapPin className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-foreground font-semibold">No businesses found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              {paginatedListings.map((listing, idx) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  index={(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                  highlighted={hoveredListingId === listing.id}
                  onHover={setHoveredListingId}
                  distanceKm={getListingDistance(listing)}
                  onSelect={(l) => {
                    setSelectedListing(l);
                    if (l.lat && l.lng) setMapCenter({ lat: l.lat, lng: l.lng });
                  }}
                />
              ))}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 pt-4 pb-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-card text-foreground disabled:opacity-40 transition-colors hover:bg-secondary"
                  >
                    ‹ Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                    .reduce<(number | "...")[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1]) > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "..." ? (
                        <span key={`dots-${i}`} className="px-1.5 text-xs text-muted-foreground">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => { setCurrentPage(p as number); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                          className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                            currentPage === p
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "border border-border bg-card text-foreground hover:bg-secondary"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-card text-foreground disabled:opacity-40 transition-colors hover:bg-secondary"
                  >
                    Next ›
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Category Grid & extras (mobile) */}
        {!hasActiveFilters && (
          <section className="px-3 py-4" data-reveal>
            <CategoryGrid />
          </section>
        )}
        {!hasActiveFilters && <div data-reveal><PromoBanner /></div>}
        {!hasActiveFilters && (
          <section className="px-3 py-3" data-reveal>
            <CategoryHighlights />
          </section>
        )}
      </div>

      {/* ═══ DESKTOP LAYOUT ═══ */}
      <div className="hidden lg:block">
        {/* Filter chips bar */}
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2.5">
              <button
                onClick={() => {
                  setCategory("All Categories");
                  setRadiusKm(null);
                  setOpenNow(false);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors shrink-0 border ${
                  !hasActiveFilters
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:border-foreground/30"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                All
              </button>

              <button
                onClick={() => setOpenNow(!openNow)}
                className={`px-3.5 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors shrink-0 border ${
                  openNow
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:border-foreground/30"
                }`}
              >
                Open Now
              </button>

              <div className="flex items-center gap-2 shrink-0" style={{ minWidth: 180 }}>
                <Slider
                  value={[radiusKm ?? 10]}
                  onValueChange={([v]) => {
                    setRadiusKm(v);
                    if (!userLocation) handleDetectLocation();
                  }}
                  min={0.5}
                  max={10}
                  step={0.5}
                  className="w-28"
                />
                <span className="text-xs font-semibold text-foreground w-12 text-right">
                  {radiusKm ? (radiusKm < 1 ? `${radiusKm * 1000}m` : `${radiusKm} km`) : "All"}
                </span>
              </div>

              <div className="w-px h-5 bg-border shrink-0" />

              {CATEGORY_NAV.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value === category ? "All Categories" : c.value)}
                  className={`px-3.5 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors shrink-0 border ${
                    category === c.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:border-foreground/30"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop split view */}
        <div className="container mx-auto px-4">
          <div className="flex gap-0">
            {/* LEFT: Listings */}
            <div className="min-w-0 w-[58%] border-r border-border pr-5">
              {category !== "All Categories" && (
                <div className="flex items-center pt-4 pb-3">
                  <nav className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span className="text-foreground font-medium">{category}</span>
                  </nav>
                </div>
              )}


              <div ref={listingsScrollRef} className="max-h-[calc(100vh-64px)] overflow-y-auto scrollbar-hide pb-6">
                <div className="space-y-4">
                  {sortedFiltered.length === 0 ? (
                    <div className="text-center py-16 bg-card rounded-lg border border-border">
                      <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                      <p className="text-foreground font-semibold">No businesses found</p>
                      <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
                    </div>
                  ) : (
                    <>
                      {paginatedListings.map((listing, idx) => (
                        <ListingCard
                          key={listing.id}
                          listing={listing}
                          index={(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                          highlighted={hoveredListingId === listing.id}
                          onHover={setHoveredListingId}
                          distanceKm={getListingDistance(listing)}
                          onSelect={(l) => {
                            setSelectedListing(l);
                            if (l.lat && l.lng) setMapCenter({ lat: l.lat, lng: l.lng });
                          }}
                        />
                      ))}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-1.5 pt-4">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-border bg-card text-foreground disabled:opacity-40 transition-colors hover:bg-secondary"
                          >
                            ‹ Prev
                          </button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                            .reduce<(number | "...")[]>((acc, p, i, arr) => {
                              if (i > 0 && p - (arr[i - 1]) > 1) acc.push("...");
                              acc.push(p);
                              return acc;
                            }, [])
                            .map((p, i) =>
                              p === "..." ? (
                                <span key={`dots-${i}`} className="px-1 text-sm text-muted-foreground">…</span>
                              ) : (
                                <button
                                  key={p}
                                  onClick={() => setCurrentPage(p as number)}
                                  className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                                    currentPage === p
                                      ? "bg-primary text-primary-foreground shadow-sm"
                                      : "border border-border bg-card text-foreground hover:bg-secondary"
                                  }`}
                                >
                                  {p}
                                </button>
                              )
                            )}
                          <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-border bg-card text-foreground disabled:opacity-40 transition-colors hover:bg-secondary"
                          >
                            Next ›
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: Map */}
            <div className="w-[42%]">
              <div className="sticky top-0 h-[calc(100vh-64px)]">
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
          </div>
        </div>

        {/* Desktop extras */}
        {!hasActiveFilters && (
          <section className="container mx-auto px-4 py-8" data-reveal>
            <CategoryGrid />
          </section>
        )}
        {!hasActiveFilters && <div data-reveal><PromoBanner /></div>}
        {!hasActiveFilters && (
          <section className="container mx-auto px-4 py-6" data-reveal>
            <CategoryHighlights />
          </section>
        )}
      </div>
    </div>
  );
};

export default Index;
