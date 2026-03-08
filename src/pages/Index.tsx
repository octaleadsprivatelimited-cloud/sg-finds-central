import { useState, useEffect, useMemo } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import SearchFilters from "@/components/SearchFilters";
import ListingCard, { Listing } from "@/components/ListingCard";
import FeaturedListings from "@/components/FeaturedListings";
import CitySelector from "@/components/CitySelector";
import MapView from "@/components/MapView";
import { Building2, MapPin, List, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DEMO_LISTINGS: (Listing)[] = [
  {
    id: "1", name: "Singapore Delights Pte Ltd", uen: "201912345A",
    category: "Food & Beverage", district: "Orchard", address: "391 Orchard Road, #B2-01, Singapore 238872",
    postalCode: "238872", phone: "+65 6234 5678", website: "https://sgdelights.com",
    email: "info@sgdelights.com", whatsapp: "+6592345678",
    description: "Award-winning local cuisine serving traditional Peranakan dishes with a modern twist.",
    status: "approved", ownerId: "demo", lat: 1.3048, lng: 103.8318,
    verified: true, featured: true, rating: 4.8, reviewCount: 127,
  },
  {
    id: "2", name: "TechHub Solutions", uen: "202301234B",
    category: "Technology & IT", district: "CBD / Raffles Place", address: "1 Raffles Place, #30-01, Singapore 048616",
    postalCode: "048616", phone: "+65 6789 0123", website: "https://techhub.sg",
    email: "hello@techhub.sg", whatsapp: "+6597890123",
    description: "Full-service IT consultancy specializing in cloud infrastructure and cybersecurity.",
    status: "approved", ownerId: "demo", lat: 1.2840, lng: 103.8510,
    verified: true, featured: true, rating: 4.9, reviewCount: 89,
  },
  {
    id: "3", name: "Glow Aesthetics Clinic", uen: "202212345C",
    category: "Beauty & Wellness", district: "Novena", address: "10 Sinaran Drive, #10-05, Singapore 307506",
    postalCode: "307506", phone: "+65 6345 6789", email: "appointments@glowaesthetics.sg",
    description: "Premium aesthetic treatments using FDA-approved technology.",
    status: "approved", ownerId: "demo", lat: 1.3204, lng: 103.8447,
    verified: true, rating: 4.7, reviewCount: 64,
  },
  {
    id: "4", name: "LearnSG Academy", uen: "201854321D",
    category: "Education & Training", district: "Tampines", address: "1 Tampines Walk, #03-12, Singapore 528523",
    postalCode: "528523", phone: "+65 6456 7890", email: "enrol@learnsg.com",
    description: "Enrichment centre offering coding, robotics, and STEM courses for ages 5–16.",
    status: "approved", ownerId: "demo", lat: 1.3530, lng: 103.9453,
    rating: 4.6, reviewCount: 42,
  },
  {
    id: "5", name: "HomeFixSG Services", uen: "202098765E",
    category: "Home Services", district: "Jurong East", address: "21 Jurong East St 31, Singapore 609517",
    postalCode: "609517", phone: "+65 6567 8901", whatsapp: "+6595678901",
    description: "Reliable plumbing, electrical, and aircon servicing across Singapore.",
    status: "approved", ownerId: "demo", lat: 1.3329, lng: 103.7436,
    verified: true, featured: true, rating: 4.5, reviewCount: 156,
  },
];

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [district, setDistrict] = useState("All Districts");
  const [category, setCategory] = useState("All Categories");
  const [listings, setListings] = useState<Listing[]>(DEMO_LISTINGS);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>();
  const [selectedCity, setSelectedCity] = useState("singapore");

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const q = query(collection(db, "listings"), where("status", "==", "approved"));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Listing));
          setListings(data);
        }
      } catch {
        // Use demo data
      }
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

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setShowMap(true);
        toast.success("Location detected");
      },
      () => toast.error("Unable to detect location")
    );
  };

  return (
    <div className="min-h-screen bg-background bg-noise">
      {/* Hero */}
      <section className="relative border-b border-border/50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh" />
        <div className="absolute inset-0 bg-dot-pattern opacity-50" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/8 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative container mx-auto px-4 py-10 md:py-16">
          <div className="max-w-2xl mx-auto text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium backdrop-blur-sm">
                <Building2 className="w-4 h-4" />
                Business Directory
              </div>
              <CitySelector selectedCity={selectedCity} onCityChange={setSelectedCity} />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-3">
              Find trusted businesses
              <br />
              <span className="text-gradient">across Singapore</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Discover verified local businesses from Orchard to Jurong and everywhere in between.
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <SearchFilters
              query={searchQuery}
              onQueryChange={setSearchQuery}
              district={district}
              onDistrictChange={setDistrict}
              category={category}
              onCategoryChange={setCategory}
              onDetectLocation={handleDetectLocation}
            />
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="container mx-auto px-4 py-8">
        {/* Featured */}
        <FeaturedListings listings={filtered} />

        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{filtered.length}</span> businesses found
          </p>
          <div className="md:hidden">
            <Button variant="outline" size="sm" onClick={() => setShowMap(!showMap)}>
              {showMap ? <List className="w-4 h-4 mr-1.5" /> : <MapIcon className="w-4 h-4 mr-1.5" />}
              {showMap ? "List" : "Map"}
            </Button>
          </div>
        </div>

        <div className="flex gap-6">
          <div className={`flex-1 space-y-3 ${showMap ? "hidden md:block" : ""}`}>
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <MapPin className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No businesses found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            ) : (
              filtered.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onSelect={(l) => {
                    setSelectedListing(l);
                    if (l.lat && l.lng) setMapCenter({ lat: l.lat, lng: l.lng });
                  }}
                />
              ))
            )}
          </div>

          <div className={`md:w-[480px] lg:w-[560px] h-[calc(100vh-280px)] sticky top-24 rounded-xl overflow-hidden ${showMap ? "" : "hidden md:block"}`}>
            <MapView
              listings={filtered}
              selectedId={selectedListing?.id}
              onSelectListing={setSelectedListing}
              center={mapCenter}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
