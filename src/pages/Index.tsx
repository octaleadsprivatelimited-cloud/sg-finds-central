import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useGoogleOneTap } from "@/hooks/useGoogleOneTap";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useSearch } from "@/contexts/SearchContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ListingCard, { Listing, DEFAULT_OPERATING_HOURS, getIsOpenNow } from "@/components/ListingCard";
import ListingCardSkeleton from "@/components/ListingCardSkeleton";
import FeaturedListings from "@/components/FeaturedListings";

import CategoryHighlights from "@/components/CategoryHighlights";
import CategoryGrid from "@/components/CategoryGrid";

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
  const { searchQuery, setSearchQuery, setListings: setSearchListings, setOnPincodeSearch, setOnDistrictSelect } = useSearch();
  const [district, setDistrict] = useState("All Districts");
  const [category, setCategory] = useState("All Categories");
  const [listings, setListings] = useState<Listing[]>(DEMO_LISTINGS);
  useEffect(() => { setShowMap(true); }, [setShowMap]);
  useGoogleOneTap(); // Show Google One Tap on homepage for returning users
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

  // Scroll to top on initial page load
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  const mobileListingsRef = useRef<HTMLDivElement>(null);

  const scrollToListings = () => {
    setTimeout(() => {
      // Desktop: scroll the inner scrollable container to top
      if (listingsScrollRef.current) {
        listingsScrollRef.current.scrollTop = 0;
      }
      // Mobile: scroll the page so listings start at the top
      if (mobileListingsRef.current) {
        mobileListingsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  };

  const isInitialPageMount = useRef(true);
  useEffect(() => {
    if (isInitialPageMount.current) {
      isInitialPageMount.current = false;
      return;
    }
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
    setOnDistrictSelect(() => (d: string) => {
      setDistrict(d);
      setSearchQuery("");
    });
    return () => setOnDistrictSelect(null);
  }, [setOnDistrictSelect, setDistrict, setSearchQuery]);

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
    { value: "Tuition", label: "Tuition", icon: "📚" },
    { value: "Baking", label: "Baking", icon: "🧁" },
    { value: "Music / Art / Craft", label: "Music / Art", icon: "🎨" },
    { value: "Home Food", label: "Home Food", icon: "🍱" },
    { value: "Beauty", label: "Beauty", icon: "💅" },
    { value: "Pet Services", label: "Pet Services", icon: "🐾" },
    { value: "Event Services", label: "Events", icon: "🎉" },
    { value: "Tailoring", label: "Tailoring", icon: "🧵" },
    { value: "Cleaning", label: "Cleaning", icon: "🧹" },
    { value: "Handyman", label: "Handyman", icon: "🔧" },
    { value: "Photography / Videography", label: "Photo / Video", icon: "📸" },
  ];

  const scrollRevealRef = useScrollReveal<HTMLDivElement>();

  return (
    <div className="min-h-screen bg-background retro-dot-bg" ref={scrollRevealRef}>

      {/* ═══ MOBILE LAYOUT ═══ */}
      <div className="lg:hidden">

        {/* Wrapper: sticky filters+map unstick when listings end */}
        <div>
        {/* Category + Distance + Map: All sticky */}
        <div className="sticky top-0 z-20">
        {/* Row 1: Category chips */}
        <div className="border-b-2 border-foreground/6 bg-background/90 backdrop-blur-xl px-3 py-2">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setCategory("All Categories")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all active:scale-95 ${
                category === "All Categories"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary/80 text-muted-foreground border border-border/40"
              }`}
            >
              All
            </button>
            {CATEGORY_NAV.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value === category ? "All Categories" : c.value)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all active:scale-95 ${
                  category === c.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary/80 text-muted-foreground border border-border/40"
                }`}
              >
                <span className="text-sm">{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>
          <div className="border-b-2 border-foreground/6 bg-background/90 backdrop-blur-xl px-3 py-2.5">
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
            </div>
          </div>
          <div className="h-[200px] relative border-b-2 border-foreground/6">
            <MapView
              listings={sortedFiltered}
              selectedId={selectedListing?.id}
              hoveredId={hoveredListingId}
              onHoverListing={setHoveredListingId}
              onSelectListing={setSelectedListing}
              center={mapCenter}
              radiusKm={radiusKm}
            />
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              <button
                onClick={handleDetectLocation}
                className="w-8 h-8 rounded-lg bg-card/90 backdrop-blur-sm border border-border shadow-sm flex items-center justify-center active:scale-90 transition-transform"
              >
                <MapPin className="w-4 h-4 text-foreground" />
              </button>
            </div>
          </div>
        </div>


        {/* Listings */}
        <div ref={mobileListingsRef} className="px-3 pb-6 space-y-3">
          {sortedFiltered.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border-2 border-border/60 retro-shadow">
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
                    onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); scrollToListings(); }}
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
                          onClick={() => { setCurrentPage(p as number); scrollToListings(); }}
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
                    onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); scrollToListings(); }}
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
        </div>{/* end wrapper for sticky unstick */}

        {/* Extras before footer (mobile) */}
        <section className="px-3 py-4" data-reveal>
          <CategoryGrid />
        </section>
        <section className="px-3 py-3" data-reveal>
          <CategoryHighlights />
        </section>
      </div>

      {/* ═══ DESKTOP LAYOUT ═══ */}
      <div className="hidden lg:block">

        {/* Filter bar */}
        <div className="bg-background/90 backdrop-blur-xl border-b-2 border-foreground/6 mb-4">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-2.5">
              <button
                onClick={() => {
                  setCategory("All Categories");
                  setRadiusKm(null);
                  setOpenNow(false);
                }}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
                  !hasActiveFilters
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary/80 text-foreground hover:bg-secondary border border-border/40 hover:border-primary/30"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                All
              </button>


              <div className="flex items-center gap-2 bg-secondary/80 border border-border/40 rounded-full px-3 py-1.5 shrink-0">
                <Slider
                  value={[radiusKm ?? 10]}
                  onValueChange={([v]) => {
                    setRadiusKm(v);
                    if (!userLocation) handleDetectLocation();
                  }}
                  min={0.5}
                  max={10}
                  step={0.5}
                  className="w-20"
                />
                <span className="text-xs font-medium text-foreground w-10 text-right">
                  {radiusKm ? (radiusKm < 1 ? `${radiusKm * 1000}m` : `${radiusKm}km`) : "All"}
                </span>
              </div>

              <div className="w-px h-5 bg-border shrink-0" />

              {CATEGORY_NAV.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value === category ? "All Categories" : c.value)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
                    category === c.value
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-secondary/80 text-foreground hover:bg-secondary border border-border/40 hover:border-primary/30"
                  }`}
                >
                  <span className="text-base">{c.icon}</span>
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
            <div className="min-w-0 w-[35%] border-r border-border pr-5">
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
                    <div className="text-center py-16 bg-card rounded-xl border-2 border-border/60 retro-shadow">
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
                            onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); scrollToListings(); }}
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
                                  onClick={() => { setCurrentPage(p as number); scrollToListings(); }}
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
                            onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); scrollToListings(); }}
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
            <div className="w-[65%]">
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
        <section className="container mx-auto px-4 py-6" data-reveal>
          <CategoryGrid />
        </section>
        
        <section className="container mx-auto px-4 py-4" data-reveal>
          <CategoryHighlights />
        </section>
      </div>
    </div>
  );
};

export default Index;
