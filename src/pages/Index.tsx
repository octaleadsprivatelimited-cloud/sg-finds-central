import { useState, useEffect, useMemo } from "react";
import { useSearch } from "@/contexts/SearchContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ListingCard, { Listing } from "@/components/ListingCard";
import FeaturedListings from "@/components/FeaturedListings";
import CategoryGrid from "@/components/CategoryGrid";
import PromoBanner from "@/components/PromoBanner";
import MapView from "@/components/MapView";
import { MapPin, List, Map as MapIcon, Search, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SearchWithSuggestions from "@/components/SearchWithSuggestions";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SINGAPORE_DISTRICTS, BUSINESS_CATEGORIES } from "@/lib/districts";
import { toast } from "sonner";

const DEMO_LISTINGS: (Listing)[] = [
  { id: "1", name: "Singapore Delights Pte Ltd", uen: "201912345A", category: "Food & Beverage", district: "Orchard", address: "391 Orchard Road, #B2-01, Singapore 238872", postalCode: "238872", phone: "+65 6234 5678", website: "https://sgdelights.com", email: "info@sgdelights.com", whatsapp: "+6592345678", description: "Award-winning local cuisine serving traditional Peranakan dishes with a modern twist.", status: "approved", ownerId: "demo", lat: 1.3048, lng: 103.8318, verified: true, featured: true, rating: 4.8, reviewCount: 127 },
  { id: "1b", name: "Hawker King", uen: "202011111A", category: "Food & Beverage", district: "Chinatown", address: "335 Smith Street, Singapore 050335", postalCode: "050335", phone: "+65 6111 1111", description: "Authentic hawker-style dishes in a modern setting. Famous for chicken rice and laksa.", status: "approved", ownerId: "demo", lat: 1.2822, lng: 103.8441, rating: 4.6, reviewCount: 203 },
  { id: "6", name: "Orchard Lifestyle Store", uen: "202100001F", category: "Retail & Shopping", district: "Orchard", address: "290 Orchard Road, #05-12, Singapore 238859", postalCode: "238859", phone: "+65 6600 1001", website: "https://orchardlifestyle.sg", description: "Curated lifestyle products from local and international brands.", status: "approved", ownerId: "demo", lat: 1.3040, lng: 103.8325, verified: true, featured: true, rating: 4.5, reviewCount: 78 },
  { id: "6b", name: "ShopLocal SG", uen: "202200099Z", category: "Retail & Shopping", district: "Bugis", address: "200 Victoria Street, #02-48, Singapore 188021", postalCode: "188021", phone: "+65 6600 2002", description: "Supporting local artisans — handmade crafts, fashion, and gifts.", status: "approved", ownerId: "demo", lat: 1.2993, lng: 103.8555, rating: 4.3, reviewCount: 45 },
  { id: "7", name: "HealthFirst Medical Clinic", uen: "201800002G", category: "Healthcare & Medical", district: "Novena", address: "6 Napier Road, #08-01, Singapore 258499", postalCode: "258499", phone: "+65 6700 2002", website: "https://healthfirst.sg", description: "Comprehensive family medicine and specialist consultations.", status: "approved", ownerId: "demo", lat: 1.3115, lng: 103.8260, verified: true, rating: 4.9, reviewCount: 210 },
  { id: "7b", name: "SmileBright Dental", uen: "202133344H", category: "Healthcare & Medical", district: "Toa Payoh", address: "490 Lorong 6 Toa Payoh, #02-11, Singapore 310490", postalCode: "310490", phone: "+65 6700 3003", description: "Gentle dental care for the whole family, from braces to implants.", status: "approved", ownerId: "demo", lat: 1.3343, lng: 103.8500, rating: 4.7, reviewCount: 92 },
  { id: "4", name: "LearnSG Academy", uen: "201854321D", category: "Education & Training", district: "Tampines", address: "1 Tampines Walk, #03-12, Singapore 528523", postalCode: "528523", phone: "+65 6456 7890", email: "enrol@learnsg.com", description: "Enrichment centre offering coding, robotics, and STEM courses for ages 5–16.", status: "approved", ownerId: "demo", lat: 1.3530, lng: 103.9453, rating: 4.6, reviewCount: 42 },
  { id: "4b", name: "TutorHub SG", uen: "202244455I", category: "Education & Training", district: "Bishan", address: "9 Bishan Place, #04-01, Singapore 579837", postalCode: "579837", phone: "+65 6456 8901", description: "Expert tutoring in Math, Science, and English for primary to JC levels.", status: "approved", ownerId: "demo", lat: 1.3508, lng: 103.8491, verified: true, rating: 4.8, reviewCount: 135 },
  { id: "8", name: "PrimeConsult Advisory", uen: "201900003H", category: "Professional Services", district: "CBD / Raffles Place", address: "80 Robinson Road, #15-01, Singapore 068898", postalCode: "068898", phone: "+65 6800 3003", website: "https://primeconsult.sg", description: "Business advisory, accounting, and corporate secretarial services.", status: "approved", ownerId: "demo", lat: 1.2810, lng: 103.8500, verified: true, rating: 4.7, reviewCount: 63 },
  { id: "3", name: "Glow Aesthetics Clinic", uen: "202212345C", category: "Beauty & Wellness", district: "Novena", address: "10 Sinaran Drive, #10-05, Singapore 307506", postalCode: "307506", phone: "+65 6345 6789", email: "appointments@glowaesthetics.sg", description: "Premium aesthetic treatments using FDA-approved technology.", status: "approved", ownerId: "demo", lat: 1.3204, lng: 103.8447, verified: true, rating: 4.7, reviewCount: 64 },
  { id: "3b", name: "Zen Spa & Massage", uen: "202355566J", category: "Beauty & Wellness", district: "Kallang", address: "1 Stadium Place, #01-35, Singapore 397628", postalCode: "397628", phone: "+65 6345 7890", description: "Traditional Thai and Swedish massage in a tranquil oasis.", status: "approved", ownerId: "demo", lat: 1.3025, lng: 103.8753, rating: 4.5, reviewCount: 88 },
  { id: "5", name: "HomeFixSG Services", uen: "202098765E", category: "Home Services", district: "Jurong East", address: "21 Jurong East St 31, Singapore 609517", postalCode: "609517", phone: "+65 6567 8901", whatsapp: "+6595678901", description: "Reliable plumbing, electrical, and aircon servicing across Singapore.", status: "approved", ownerId: "demo", lat: 1.3329, lng: 103.7436, verified: true, featured: true, rating: 4.5, reviewCount: 156 },
  { id: "5b", name: "CleanPro SG", uen: "202466677K", category: "Home Services", district: "Clementi", address: "321 Clementi Ave 3, #01-05, Singapore 129905", postalCode: "129905", phone: "+65 6567 2222", description: "Professional home and office cleaning services with eco-friendly products.", status: "approved", ownerId: "demo", lat: 1.3150, lng: 103.7650, rating: 4.4, reviewCount: 112 },
  { id: "9", name: "SpeedWorks Auto", uen: "202000004I", category: "Automotive", district: "Bukit Merah", address: "163 Bukit Merah Central, #01-20, Singapore 150163", postalCode: "150163", phone: "+65 6900 4004", description: "Full car servicing, grooming, and performance tuning.", status: "approved", ownerId: "demo", lat: 1.2870, lng: 103.8160, verified: true, rating: 4.6, reviewCount: 97 },
  { id: "2", name: "TechHub Solutions", uen: "202301234B", category: "Technology & IT", district: "CBD / Raffles Place", address: "1 Raffles Place, #30-01, Singapore 048616", postalCode: "048616", phone: "+65 6789 0123", website: "https://techhub.sg", email: "hello@techhub.sg", whatsapp: "+6597890123", description: "Full-service IT consultancy specializing in cloud infrastructure and cybersecurity.", status: "approved", ownerId: "demo", lat: 1.2840, lng: 103.8510, verified: true, featured: true, rating: 4.9, reviewCount: 89 },
  { id: "2b", name: "AppCraft Studio", uen: "202577788L", category: "Technology & IT", district: "Queenstown", address: "71 Ayer Rajah Crescent, Singapore 139951", postalCode: "139951", phone: "+65 6789 3333", description: "Mobile app development and UI/UX design for startups and SMEs.", status: "approved", ownerId: "demo", lat: 1.2966, lng: 103.7870, rating: 4.8, reviewCount: 56 },
  { id: "10", name: "Prestige Properties SG", uen: "201700005J", category: "Real Estate", district: "Marina Bay", address: "10 Marina Boulevard, #28-01, Singapore 018983", postalCode: "018983", phone: "+65 6100 5005", website: "https://prestigeproperties.sg", description: "Luxury residential and commercial property consultancy.", status: "approved", ownerId: "demo", lat: 1.2815, lng: 103.8536, verified: true, featured: true, rating: 4.7, reviewCount: 74 },
  { id: "11", name: "LawPoint LLP", uen: "201600006K", category: "Legal Services", district: "CBD / Raffles Place", address: "50 Collyer Quay, #10-01, Singapore 049321", postalCode: "049321", phone: "+65 6200 6006", description: "Corporate law, IP protection, and dispute resolution.", status: "approved", ownerId: "demo", lat: 1.2830, lng: 103.8530, verified: true, rating: 4.8, reviewCount: 51 },
  { id: "12", name: "WealthBridge Advisors", uen: "201500007L", category: "Financial Services", district: "Bukit Timah", address: "1 Bukit Timah Road, #09-01, Singapore 229899", postalCode: "229899", phone: "+65 6300 7007", description: "Independent financial planning, insurance, and investment advisory.", status: "approved", ownerId: "demo", lat: 1.3100, lng: 103.8150, verified: true, rating: 4.6, reviewCount: 38 },
  { id: "13", name: "SwiftMove Logistics", uen: "202100008M", category: "Logistics & Transport", district: "Changi", address: "5 Changi Business Park Ave 1, Singapore 486038", postalCode: "486038", phone: "+65 6400 8008", description: "Same-day delivery, warehousing, and freight forwarding services.", status: "approved", ownerId: "demo", lat: 1.3340, lng: 103.9630, rating: 4.4, reviewCount: 67 },
  { id: "14", name: "Celebrate! Events Co", uen: "202200009N", category: "Events & Entertainment", district: "Kallang", address: "1 Stadium Place, #03-01, Singapore 397628", postalCode: "397628", phone: "+65 6500 9009", website: "https://celebrateevents.sg", description: "Full-service event planning for weddings, corporate events, and parties.", status: "approved", ownerId: "demo", lat: 1.3045, lng: 103.8745, verified: true, rating: 4.7, reviewCount: 83 },
  { id: "15", name: "BuildRight Contractors", uen: "201800010P", category: "Construction & Renovation", district: "Ang Mo Kio", address: "53 Ang Mo Kio Ave 3, #01-01, Singapore 569933", postalCode: "569933", phone: "+65 6600 1010", description: "HDB & condo renovation specialists with 15 years of experience.", status: "approved", ownerId: "demo", lat: 1.3691, lng: 103.8454, verified: true, rating: 4.5, reviewCount: 121 },
];

const Index = () => {
  const { searchQuery, setSearchQuery, setListings: setSearchListings } = useSearch();
  const [district, setDistrict] = useState("All Districts");
  const [category, setCategory] = useState("All Categories");
  const [listings, setListings] = useState<Listing[]>(DEMO_LISTINGS);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>();

  // Sync listings to search context for suggestions
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

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background border-b border-border/40">
        <div className="container mx-auto px-4 py-6 md:py-14">
          <h1 className="text-xl md:text-4xl font-bold tracking-tight text-foreground mb-1 md:mb-2 leading-tight">
            Find the best businesses{" "}
            <span className="text-primary">in Singapore</span>
          </h1>
          <p className="text-muted-foreground text-xs md:text-base mb-4 md:mb-8 max-w-lg">
            Search across 5,000+ verified businesses — restaurants, clinics, services and more.
          </p>

          {/* Desktop search bar */}
          <div className="hidden md:flex items-stretch gap-0 max-w-2xl bg-card rounded-xl border border-border shadow-sm">
            <div className="flex items-center gap-2 px-4 py-3 border-r border-border min-w-[150px]">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-medium text-foreground">Singapore</span>
            </div>
            <SearchWithSuggestions
              placeholder="Search for restaurants, services, businesses..."
              className="flex-1"
            />
            <Button className="h-auto min-h-[48px] rounded-l-none rounded-r-xl px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm border-0">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap gap-2 mt-3 md:mt-4 max-w-2xl">
            <Select value={district} onValueChange={setDistrict}>
              <SelectTrigger className="w-auto min-w-[120px] md:min-w-[140px] h-8 md:h-9 text-xs md:text-sm bg-card border-border">
                <SelectValue placeholder="All Districts" />
              </SelectTrigger>
              <SelectContent>
                {SINGAPORE_DISTRICTS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-auto min-w-[120px] md:min-w-[140px] h-8 md:h-9 text-xs md:text-sm bg-card border-border">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" className="h-8 md:h-9 text-xs md:text-sm hidden md:flex" onClick={handleDetectLocation}>
              <MapPin className="w-3.5 h-3.5 mr-1.5" />
              Near Me
            </Button>
          </div>
          
          {/* Quick stats */}
          <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-4 md:mt-6 text-[11px] md:text-xs text-muted-foreground">
            <span><strong className="text-foreground">5,000+</strong> Businesses</span>
            <span><strong className="text-foreground">15</strong> Categories</span>
            <span><strong className="text-foreground">50+</strong> Districts</span>
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      {!hasActiveFilters && <PromoBanner />}

      {/* Category Grid */}
      {!hasActiveFilters && <CategoryGrid />}

      {/* Results */}
      <section className="container mx-auto px-4 py-8">
        <FeaturedListings listings={filtered} />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-foreground">All Businesses</h2>
            <p className="text-xs text-muted-foreground">{filtered.length} results found</p>
          </div>
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
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-muted-foreground/40" />
                </div>
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

          <div className={`md:w-[480px] lg:w-[560px] h-[calc(100vh-280px)] sticky top-24 rounded-xl overflow-hidden border border-border/50 shadow-lg ${showMap ? "" : "hidden md:block"}`}>
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
