import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  MapPin, Building2, ArrowLeft, ChevronRight, Loader2, LayoutGrid,
  Calculator, BookOpen, Leaf, Atom, FlaskConical, TrendingUp,
  Languages, Music, Palette, Scissors, Sparkles, Eye, EyeOff,
  PaintBucket, Dog, Cat, Bath, Hammer, Wrench, Zap, PaintRoller,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCityBySlug, CITIES } from "@/lib/cities";
import { BUSINESS_CATEGORIES } from "@/lib/districts";
import { getSubcategoriesForCategory } from "@/lib/listing-form-config";
import ListingCard, { type Listing } from "@/components/ListingCard";
import { getBusinessUrl, toSlug } from "@/lib/url-helpers";

// Icon map for subcategories
const SUBCATEGORY_ICONS: Record<string, LucideIcon> = {
  maths: Calculator, english: BookOpen, biology: Leaf, physics: Atom,
  chemistry: FlaskConical, economics: TrendingUp,
  hindi: Languages, chinese: Languages, spanish: Languages,
  french: Languages, tamil: Languages, malay: Languages,
  music: Music, art: Palette, craft: Scissors,
  nails: Sparkles, lashes: Eye, brows: EyeOff, hair: Scissors, makeup: PaintBucket,
  "dog-walking": Dog, "pet-sitting": Cat, "basic-grooming": Bath,
  carpenter: Hammer, plumber: Wrench, "minor-electrical": Zap, "patching-painting": PaintRoller,
};

const SUBCATEGORY_COLORS: Record<string, string> = {
  maths: "bg-blue-50 text-blue-600", english: "bg-amber-50 text-amber-600",
  biology: "bg-green-50 text-green-600", physics: "bg-indigo-50 text-indigo-600",
  chemistry: "bg-purple-50 text-purple-600", economics: "bg-teal-50 text-teal-600",
  hindi: "bg-orange-50 text-orange-600", chinese: "bg-red-50 text-red-600",
  spanish: "bg-yellow-50 text-yellow-600", french: "bg-sky-50 text-sky-600",
  tamil: "bg-rose-50 text-rose-600", malay: "bg-emerald-50 text-emerald-600",
  music: "bg-violet-50 text-violet-600", art: "bg-pink-50 text-pink-600", craft: "bg-amber-50 text-amber-600",
  nails: "bg-pink-50 text-pink-600", lashes: "bg-purple-50 text-purple-600",
  brows: "bg-rose-50 text-rose-600", hair: "bg-fuchsia-50 text-fuchsia-600", makeup: "bg-red-50 text-red-500",
  "dog-walking": "bg-amber-50 text-amber-600", "pet-sitting": "bg-orange-50 text-orange-600",
  "basic-grooming": "bg-cyan-50 text-cyan-600",
  carpenter: "bg-yellow-50 text-yellow-700", plumber: "bg-blue-50 text-blue-600",
  "minor-electrical": "bg-amber-50 text-amber-600", "patching-painting": "bg-lime-50 text-lime-600",
};
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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>(DEMO_LISTINGS);
  const [loadingListings, setLoadingListings] = useState(true);

  const city = getCityBySlug(citySlug || "singapore");
  const activeSub = searchParams.get("sub");

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

  // Get subcategories for the matched category
  const subcategories = useMemo(() => {
    if (!matchedCategory) return null;
    return getSubcategoriesForCategory(matchedCategory);
  }, [matchedCategory]);

  // Show subcategory selection if category has subs and none is selected yet
  const showSubcategoryPicker = !!subcategories && !activeSub;

  const filtered = useMemo(() => {
    if (!matchedCategory) return listings;
    let result = listings.filter((l) => l.category === matchedCategory);
    // Further filter by subcategory if selected
    if (activeSub && activeSub !== "all") {
      result = result.filter((l) => (l as any).subcategory === activeSub);
    }
    return result;
  }, [matchedCategory, listings, activeSub]);

  const categories = BUSINESS_CATEGORIES.filter((c) => c !== "All Categories");

  const subLabel = subcategories?.find((s) => s.value === activeSub)?.label;

  const pageTitle = activeSub && subLabel
    ? `${subLabel} — ${matchedCategory} in ${city?.name || "Singapore"}`
    : matchedCategory
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
                {activeSub ? (
                  <Link to={`/${citySlug}/${categorySlug}`} className="hover:text-primary transition-colors">{matchedCategory}</Link>
                ) : (
                  <span className="text-foreground">{matchedCategory}</span>
                )}
              </>
            )}
            {activeSub && subLabel && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground">{subLabel}</span>
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

          {/* Listings or Subcategory Picker */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              {showSubcategoryPicker ? (
                <p className="text-sm text-muted-foreground">
                  Choose a <span className="font-medium text-foreground">{matchedCategory}</span> subcategory
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{filtered.length}</span> businesses found
                </p>
              )}
              <div className="flex gap-2">
                {activeSub && (
                  <Button variant="outline" size="sm" onClick={() => setSearchParams({})}>
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    All {matchedCategory}
                  </Button>
                )}
                {matchedCategory && !activeSub && (
                  <Button variant="outline" size="sm" onClick={() => navigate(`/${citySlug}`)}>
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    All Categories
                  </Button>
                )}
              </div>
            </div>

            {/* Subcategory picker cards */}
            {showSubcategoryPicker ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {subcategories.map((sub) => {
                  const Icon = SUBCATEGORY_ICONS[sub.value] || Building2;
                  const colorClass = SUBCATEGORY_COLORS[sub.value] || "bg-muted text-muted-foreground";
                  return (
                    <button
                      key={sub.value}
                      onClick={() => setSearchParams({ sub: sub.value })}
                      className="flex flex-col items-center gap-3 p-5 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-lg transition-all duration-200 group active:scale-95"
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClass} group-hover:scale-110 transition-transform duration-200`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{sub.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {listings.filter((l) => l.category === matchedCategory && (l as any).subcategory === sub.value).length} listings
                        </p>
                      </div>
                    </button>
                  );
                })}
                {/* View all option */}
                <button
                  onClick={() => setSearchParams({ sub: "all" })}
                  className="flex flex-col items-center gap-3 p-5 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:shadow-lg transition-all duration-200 active:scale-95"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/10 text-primary">
                    <LayoutGrid className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-primary">View All</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {listings.filter((l) => l.category === matchedCategory).length} listings
                    </p>
                  </div>
                </button>
              </div>
            ) : filtered.length === 0 ? (
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
