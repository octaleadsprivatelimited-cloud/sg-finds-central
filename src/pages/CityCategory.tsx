import { useParams, Link, useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MapPin, Building2, ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCityBySlug, CITIES } from "@/lib/cities";
import { BUSINESS_CATEGORIES } from "@/lib/districts";
import ListingCard, { type Listing } from "@/components/ListingCard";
import { getBusinessUrl, toSlug } from "@/lib/url-helpers";

// Fallback demo listings for when Firestore is unavailable
const DEMO_LISTINGS: (Listing & { verified?: boolean; featured?: boolean; rating?: number; reviewCount?: number })[] = [
  {
    id: "1", name: "Singapore Delights Pte Ltd", uen: "201912345A",
    category: "Food & Beverage", district: "Orchard", address: "391 Orchard Road, #B2-01, Singapore 238872",
    postalCode: "238872", phone: "+65 6234 5678", website: "https://sgdelights.com",
    description: "Award-winning local cuisine serving traditional Peranakan dishes with a modern twist.",
    status: "approved", ownerId: "demo", lat: 1.3048, lng: 103.8318,
    verified: true, featured: true, rating: 4.8, reviewCount: 127,
  },
  {
    id: "2", name: "TechHub Solutions", uen: "202301234B",
    category: "Technology & IT", district: "CBD / Raffles Place", address: "1 Raffles Place, #30-01, Singapore 048616",
    postalCode: "048616", phone: "+65 6789 0123", website: "https://techhub.sg",
    description: "Full-service IT consultancy specializing in cloud infrastructure and cybersecurity.",
    status: "approved", ownerId: "demo", lat: 1.2840, lng: 103.8510,
    verified: true, rating: 4.9, reviewCount: 89,
  },
  {
    id: "3", name: "Glow Aesthetics Clinic", uen: "202212345C",
    category: "Beauty & Wellness", district: "Novena", address: "10 Sinaran Drive, #10-05, Singapore 307506",
    postalCode: "307506", phone: "+65 6345 6789",
    description: "Premium aesthetic treatments using FDA-approved technology.",
    status: "approved", ownerId: "demo", lat: 1.3204, lng: 103.8447,
    verified: true, rating: 4.7, reviewCount: 64,
  },
  {
    id: "4", name: "LearnSG Academy", uen: "201854321D",
    category: "Education & Training", district: "Tampines", address: "1 Tampines Walk, #03-12, Singapore 528523",
    postalCode: "528523", phone: "+65 6456 7890",
    description: "Enrichment centre offering coding, robotics, and STEM courses for ages 5–16.",
    status: "approved", ownerId: "demo", lat: 1.3530, lng: 103.9453,
    rating: 4.6, reviewCount: 42,
  },
  {
    id: "5", name: "HomeFixSG Services", uen: "202098765E",
    category: "Home Services", district: "Jurong East", address: "21 Jurong East St 31, Singapore 609517",
    postalCode: "609517", phone: "+65 6567 8901",
    description: "Reliable plumbing, electrical, and aircon servicing across Singapore.",
    status: "approved", ownerId: "demo", lat: 1.3329, lng: 103.7436,
    verified: true, featured: true, rating: 4.5, reviewCount: 156,
  },
];

const CityCategory = () => {
  const { citySlug, categorySlug } = useParams<{ citySlug: string; categorySlug?: string }>();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>(DEMO_LISTINGS);
  const [loadingListings, setLoadingListings] = useState(true);

  const city = getCityBySlug(citySlug || "singapore");

  // Fetch approved listings from Firestore
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
        // Use demo data as fallback
      }
      setLoadingListings(false);
    };
    fetchListings();
  }, []);

  const matchedCategory = useMemo(() => {
    if (!categorySlug) return null;
    return BUSINESS_CATEGORIES.find(
      (c) => c !== "All Categories" && toSlug(c) === categorySlug
    ) || null;
  }, [categorySlug]);

  const filtered = useMemo(() => {
    if (!matchedCategory) return listings;
    return listings.filter((l) => l.category === matchedCategory);
  }, [matchedCategory, listings]);

  const categories = BUSINESS_CATEGORIES.filter((c) => c !== "All Categories");

  const pageTitle = matchedCategory
    ? `${matchedCategory} in ${city?.name || "Singapore"}`
    : `Businesses in ${city?.name || "Singapore"}`;

  const pageDescription = matchedCategory
    ? `Find the best ${matchedCategory.toLowerCase()} businesses in ${city?.name || "Singapore"}. Browse verified listings, read reviews, and connect directly.`
    : `Explore top businesses across all categories in ${city?.name || "Singapore"}. Your trusted local business directory.`;

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Hero */}
      <section className="border-b border-border/50 bg-secondary/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to={`/${citySlug}`} className="hover:text-primary transition-colors">{city?.name || citySlug}</Link>
            {matchedCategory && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground">{matchedCategory}</span>
              </>
            )}
          </div>

          <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2">{pageTitle}</h1>
          <p className="text-muted-foreground max-w-2xl">{pageDescription}</p>

          {city && (
            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {city.description}
            </div>
          )}
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar - Categories */}
          {!matchedCategory && (
            <aside className="hidden lg:block w-64 shrink-0">
              <h2 className="text-sm font-semibold text-foreground mb-3">Browse by Category</h2>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <Link
                    key={cat}
                    to={`/${citySlug}/${toSlug(cat)}`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  >
                    <span>{cat}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                ))}
              </div>
            </aside>
          )}

          {/* Listings */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{filtered.length}</span> businesses found
              </p>
              {matchedCategory && (
                <Button variant="outline" size="sm" onClick={() => navigate(`/${citySlug}`)}>
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  All Categories
                </Button>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No businesses found</p>
                <p className="text-sm text-muted-foreground">Check back soon for new listings</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onSelect={(l) => navigate(getBusinessUrl(l))}
                  />
                ))}
              </div>
            )}

            {/* Category cards (on city page without category) */}
            {!matchedCategory && (
              <div className="mt-12">
                <h2 className="text-lg font-semibold text-foreground mb-4">Popular Categories</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {categories.slice(0, 9).map((cat) => (
                    <Link
                      key={cat}
                      to={`/${citySlug}/${toSlug(cat)}`}
                      className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all text-center"
                    >
                      <p className="text-sm font-medium text-foreground">{cat}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {listings.filter((l) => l.category === cat).length} listings
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CityCategory;
