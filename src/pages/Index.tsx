import { useState, useEffect, useMemo } from "react";
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
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SINGAPORE_DISTRICTS, BUSINESS_CATEGORIES } from "@/lib/districts";
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

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      const matchQ = !searchQuery || l.name.toLowerCase().includes(searchQuery.toLowerCase()) || l.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchD = district === "All Districts" || l.district === district;
      const matchC = category === "All Categories" || l.category === category;
      const matchR = !radiusKm || !userLocation || !l.lat || !l.lng || getDistance(userLocation.lat, userLocation.lng, l.lat, l.lng) <= radiusKm;
      return matchQ && matchD && matchC && matchR;
    });
  }, [listings, searchQuery, district, category, radiusKm, userLocation]);

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

  const hasActiveFilters = searchQuery || district !== "All Districts" || category !== "All Categories" || radiusKm !== null;

  return (
    <div className="min-h-screen bg-background">

      {/* ═══ ALL BUSINESSES (TOP) ═══ */}
      <section className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">

          {/* Category chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-nowrap md:flex-wrap">
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
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                  category === c.value
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-foreground border-border hover:bg-muted"
                }`}
              >
                {c.label}
              </button>
            ))}
            {(category !== "All Categories" || district !== "All Districts" || searchQuery || radiusKm !== null) && (
              <button
                onClick={() => { setCategory("All Categories"); setDistrict("All Districts"); setSearchQuery(""); setRadiusKm(null); }}
                className="px-3 py-1.5 rounded-full text-xs font-medium border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Distance filter chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground mr-1">Distance:</span>
            {[
              { value: null as number | null, label: "Any" },
              { value: 1, label: "< 1 km" },
              { value: 2, label: "< 2 km" },
              { value: 3, label: "< 3 km" },
              { value: 5, label: "< 5 km" },
              { value: 10, label: "< 10 km" },
            ].map((r) => (
              <button
                key={r.label}
                onClick={() => {
                  if (r.value !== null && !userLocation) {
                    handleDetectLocation();
                    setRadiusKm(r.value);
                  } else {
                    setRadiusKm(r.value);
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  radiusKm === r.value
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-foreground border-border hover:bg-muted"
                }`}
              >
                {r.label}
              </button>
            ))}
            {!userLocation && (
              <span className="text-xs text-muted-foreground italic ml-1">Enable GPS first</span>
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