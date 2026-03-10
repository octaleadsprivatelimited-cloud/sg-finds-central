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
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

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

      {/* ═══ ALL BUSINESSES (TOP) ═══ */}
      <section className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Search + Location bar */}
        <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search snacks, nails, tutoring, candles..."
                className="w-full pl-10 pr-4 h-10 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-10 px-4 text-sm shrink-0" onClick={handleDetectLocation}>
                <MapPin className="w-4 h-4 mr-1.5" />GPS
              </Button>
              <Button variant="outline" size="sm" className="h-10 px-4 text-sm shrink-0" onClick={() => setShowMap(!showMap)}>
                {showMap ? <List className="w-4 h-4 mr-1.5" /> : <MapIcon className="w-4 h-4 mr-1.5" />}
                {showMap ? "List" : "Map"}
              </Button>
            </div>
          </div>

          {/* District chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {["All Districts", "Bedok", "Tampines", "Pasir Ris", "Punggol", "Hougang", "Ang Mo Kio", "Bishan"].map((d) => (
              <button
                key={d}
                onClick={() => setDistrict(d)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  district === d
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-foreground border-border hover:bg-muted"
                }`}
              >
                {d === "All Districts" ? "All" : d}
              </button>
            ))}
            <Select value={district} onValueChange={setDistrict}>
              <SelectTrigger className="w-auto h-7 text-xs border-border rounded-full px-3">
                <SelectValue placeholder="More..." />
              </SelectTrigger>
              <SelectContent>
                {SINGAPORE_DISTRICTS.filter(d => !["All Districts", "Bedok", "Tampines", "Pasir Ris", "Punggol", "Hougang", "Ang Mo Kio", "Bishan"].includes(d)).map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { value: "All Categories", label: "All" },
              { value: "Food & Beverage", label: "Food" },
              { value: "Beauty & Wellness", label: "Beauty" },
              { value: "Education & Training", label: "Tutoring" },
              { value: "Home Services", label: "Home Services" },
              { value: "Healthcare & Medical", label: "Healthcare" },
              { value: "Retail & Shopping", label: "Retail" },
            ].map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  category === c.value
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-foreground border-border hover:bg-muted"
                }`}
              >
                {c.label}
              </button>
            ))}
            {(category !== "All Categories" || district !== "All Districts" || searchQuery) && (
              <button
                onClick={() => { setCategory("All Categories"); setDistrict("All Districts"); setSearchQuery(""); }}
                className="px-3 py-1.5 rounded-full text-xs font-medium border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

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
