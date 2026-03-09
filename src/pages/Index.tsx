import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearch } from "@/contexts/SearchContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ListingCard, { Listing, DEFAULT_OPERATING_HOURS } from "@/components/ListingCard";
import FeaturedListings from "@/components/FeaturedListings";
import ExclusiveDeals from "@/components/ExclusiveDeals";
import CategoryHighlights from "@/components/CategoryHighlights";
import CategoryGrid from "@/components/CategoryGrid";
import PromoBanner from "@/components/PromoBanner";
import MapView from "@/components/MapView";
import { DEMO_LISTINGS } from "@/lib/demo-listings";
import { MapPin, List, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SINGAPORE_DISTRICTS, BUSINESS_CATEGORIES } from "@/lib/districts";
import { toast } from "sonner";

const Index = () => {
  const { searchQuery, setSearchQuery, setListings: setSearchListings } = useSearch();
  const [district, setDistrict] = useState("All Districts");
  const [category, setCategory] = useState("All Categories");
  const [listings, setListings] = useState<Listing[]>(DEMO_LISTINGS);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>();
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);

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

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      const matchQ = !searchQuery || l.name.toLowerCase().includes(searchQuery.toLowerCase()) || l.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchD = district === "All Districts" || l.district === district;
      const matchC = category === "All Categories" || l.category === category;
      return matchQ && matchD && matchC;
    });
  }, [listings, searchQuery, district, category]);

  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation is not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMapCenter(userLoc);
        setShowMap(true);
        const withDistance = listings.filter((l) => l.lat && l.lng).map((l) => ({ ...l, _distance: getDistance(userLoc.lat, userLoc.lng, l.lat!, l.lng!) })).filter((l) => l._distance <= 15).sort((a, b) => a._distance - b._distance);
        if (withDistance.length > 0) { setListings(withDistance); toast.success(`Found ${withDistance.length} businesses near you`); }
        else {
          const allSorted = listings.filter((l) => l.lat && l.lng).map((l) => ({ ...l, _distance: getDistance(userLoc.lat, userLoc.lng, l.lat!, l.lng!) })).sort((a, b) => a._distance - b._distance);
          setListings(allSorted.length > 0 ? allSorted : DEMO_LISTINGS);
          toast.info("No businesses within 15km — showing all results sorted by distance");
        }
      },
      () => toast.error("Unable to detect location — please enable location access")
    );
  };

  const hasActiveFilters = searchQuery || district !== "All Districts" || category !== "All Categories";

  return (
    <div className="min-h-screen bg-background">

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

      {/* ═══ ALL BUSINESSES ═══ */}
      <section className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-2">
          <div>
            <h2 className="text-base md:text-lg font-bold text-foreground">All Businesses</h2>
            <p className="text-xs md:text-sm text-muted-foreground">{filtered.length} results found</p>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 w-full sm:w-auto overflow-x-auto">
            <Select value={district} onValueChange={setDistrict}>
              <SelectTrigger className="w-auto min-w-[120px] md:min-w-[140px] h-8 md:h-9 text-xs md:text-sm">
                <SelectValue placeholder="All Districts" />
              </SelectTrigger>
              <SelectContent>
                {SINGAPORE_DISTRICTS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-8 md:h-9 text-xs md:text-sm px-2 md:px-3 shrink-0" onClick={() => setShowMap(!showMap)}>
              {showMap ? <List className="w-3.5 h-3.5 mr-1" /> : <MapIcon className="w-3.5 h-3.5 mr-1" />}
              {showMap ? "List" : "Map"}
            </Button>
            <Button variant="outline" size="sm" className="h-8 md:h-9 text-xs md:text-sm px-2 md:px-3 shrink-0" onClick={handleDetectLocation}>
              <MapPin className="w-3.5 h-3.5 mr-1" />Near Me
            </Button>
          </div>
        </div>

        <div className="flex gap-4 md:gap-6 overflow-hidden">
          {/* Listings column */}
          <div className={`w-full lg:w-1/2 xl:w-[55%] min-w-0 space-y-2 md:space-y-3 ${showMap ? "hidden lg:block" : ""}`}>
            <div className="lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto lg:pr-2 space-y-2 md:space-y-3 scrollbar-thin">
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
                    onSelect={(l) => {
                      setSelectedListing(l);
                      if (l.lat && l.lng) setMapCenter({ lat: l.lat, lng: l.lng });
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {/* Map column — always visible on desktop, toggle on mobile */}
          <div className={`lg:block lg:w-1/2 xl:w-[45%] ${showMap ? "block w-full" : "hidden"}`}>
            <div className="h-[calc(100vh-200px)] rounded-xl overflow-hidden border border-border shadow-lg sticky top-24">
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
      </section>
    </div>
  );
};

export default Index;
