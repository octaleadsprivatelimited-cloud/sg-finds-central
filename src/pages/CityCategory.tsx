import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MapPin, Building2, ArrowLeft, ChevronRight, Loader2, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCityBySlug, CITIES } from "@/lib/cities";
import { BUSINESS_CATEGORIES } from "@/lib/districts";
import { getSubcategoriesForCategory } from "@/lib/listing-form-config";
import ListingCard, { type Listing } from "@/components/ListingCard";
import { getBusinessUrl, toSlug } from "@/lib/url-helpers";

// Subcategory images — all WebP for fast loading
// Beauty
import nailsImg from "@/assets/subcategories/nails.webp";
import lashesImg from "@/assets/subcategories/lashes.webp";
import browsImg from "@/assets/subcategories/brows.webp";
import hairImg from "@/assets/subcategories/hair.webp";
import makeupImg from "@/assets/subcategories/makeup.webp";
// Music / Art / Craft
import musicImg from "@/assets/subcategories/music.webp";
import artImg from "@/assets/subcategories/art.webp";
import craftImg from "@/assets/subcategories/craft.webp";
// Pet Services
import dogWalkingImg from "@/assets/subcategories/dog-walking.webp";
import petSittingImg from "@/assets/subcategories/pet-sitting.webp";
import groomingImg from "@/assets/subcategories/basic-grooming.webp";
// Handyman
import carpenterImg from "@/assets/subcategories/carpenter.webp";
import plumberImg from "@/assets/subcategories/plumber.webp";
import electricalImg from "@/assets/subcategories/minor-electrical.webp";
import paintingImg from "@/assets/subcategories/patching-painting.webp";
// Tuition
import mathsImg from "@/assets/subcategories/maths.webp";
import englishImg from "@/assets/subcategories/english.webp";
import biologyImg from "@/assets/subcategories/biology.webp";
import physicsImg from "@/assets/subcategories/physics.webp";
import chemistryImg from "@/assets/subcategories/chemistry.webp";
import economicsImg from "@/assets/subcategories/economics.webp";
import languagesImg from "@/assets/subcategories/languages.webp";
// Home Food
import malayCuisineImg from "@/assets/subcategories/malay-cuisine.webp";
import indianCuisineImg from "@/assets/subcategories/indian-cuisine.webp";
import chineseCuisineImg from "@/assets/subcategories/chinese-cuisine.webp";
import westernCuisineImg from "@/assets/subcategories/western-cuisine.webp";
import vegetarianVeganImg from "@/assets/subcategories/vegetarian-vegan.webp";
import mealPrepImg from "@/assets/subcategories/meal-prep.webp";
// Baking
import cakesImg from "@/assets/subcategories/cakes.webp";
import cookiesImg from "@/assets/subcategories/cookies.webp";
import pastriesImg from "@/assets/subcategories/pastries.webp";
import breadImg from "@/assets/subcategories/bread.webp";
import cupcakesImg from "@/assets/subcategories/cupcakes.webp";
import customCakesImg from "@/assets/subcategories/custom-cakes.webp";
// Photography / Videography
import portraitImg from "@/assets/subcategories/portrait.webp";
import eventWeddingImg from "@/assets/subcategories/event-wedding.webp";
import productImg from "@/assets/subcategories/product.webp";
import videographyImg from "@/assets/subcategories/videography.webp";
import droneImg from "@/assets/subcategories/drone.webp";
// Tailoring
import alterationsImg from "@/assets/subcategories/alterations.webp";
import customClothingImg from "@/assets/subcategories/custom-clothing.webp";
import curtainsImg from "@/assets/subcategories/curtains.webp";
import traditionalWearImg from "@/assets/subcategories/traditional-wear.webp";
// Event Services
import balloonDecorationImg from "@/assets/subcategories/balloon-decoration.webp";
import partyPlanningImg from "@/assets/subcategories/party-planning.webp";
import cateringCoordinationImg from "@/assets/subcategories/catering-coordination.webp";
import floralImg from "@/assets/subcategories/floral.webp";
import photoBoothImg from "@/assets/subcategories/photo-booth.webp";
// Cleaning
import regularCleaningImg from "@/assets/subcategories/regular-cleaning.webp";
import deepCleaningImg from "@/assets/subcategories/deep-cleaning.webp";
import moveInOutImg from "@/assets/subcategories/move-in-out.webp";
import postRenovationImg from "@/assets/subcategories/post-renovation.webp";
import springCleaningImg from "@/assets/subcategories/spring-cleaning.webp";

const SUBCATEGORY_IMAGES: Record<string, string> = {
  // Beauty
  nails: nailsImg, lashes: lashesImg, brows: browsImg, hair: hairImg, makeup: makeupImg,
  // Music / Art / Craft
  music: musicImg, art: artImg, craft: craftImg,
  // Pet Services
  "dog-walking": dogWalkingImg, "pet-sitting": petSittingImg, "basic-grooming": groomingImg,
  // Handyman
  carpenter: carpenterImg, plumber: plumberImg, "minor-electrical": electricalImg, "patching-painting": paintingImg,
  // Tuition
  maths: mathsImg, english: englishImg, biology: biologyImg, physics: physicsImg,
  chemistry: chemistryImg, economics: economicsImg,
  hindi: languagesImg, chinese: languagesImg, spanish: languagesImg,
  french: languagesImg, tamil: languagesImg, malay: languagesImg,
  // Home Food
  "malay-cuisine": malayCuisineImg, "indian-cuisine": indianCuisineImg,
  "chinese-cuisine": chineseCuisineImg, "western-cuisine": westernCuisineImg,
  "vegetarian-vegan": vegetarianVeganImg, "meal-prep": mealPrepImg,
  // Baking
  cakes: cakesImg, cookies: cookiesImg, pastries: pastriesImg,
  bread: breadImg, cupcakes: cupcakesImg, "custom-cakes": customCakesImg,
  // Photography / Videography
  portrait: portraitImg, "event-wedding": eventWeddingImg, product: productImg,
  videography: videographyImg, drone: droneImg,
  // Tailoring
  alterations: alterationsImg, "custom-clothing": customClothingImg,
  curtains: curtainsImg, "traditional-wear": traditionalWearImg,
  // Event Services
  "balloon-decoration": balloonDecorationImg, "party-planning": partyPlanningImg,
  "catering-coordination": cateringCoordinationImg, floral: floralImg, "photo-booth": photoBoothImg,
  // Cleaning
  "regular-cleaning": regularCleaningImg, "deep-cleaning": deepCleaningImg,
  "move-in-out": moveInOutImg, "post-renovation": postRenovationImg, "spring-cleaning": springCleaningImg,
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
      {/* Breadcrumb */}
      <div className="border-b border-border/50 bg-secondary/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
        </div>
      </div>

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
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {subcategories.map((sub) => {
                  const img = SUBCATEGORY_IMAGES[sub.value];
                  return (
                    <button
                      key={sub.value}
                      onClick={() => setSearchParams({ sub: sub.value })}
                      className="relative overflow-hidden rounded-lg border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 group active:scale-95"
                    >
                      <div className="aspect-square overflow-hidden">
                        {img ? (
                          <img
                            src={img}
                            alt={sub.label}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-muted to-secondary flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="p-1.5 text-center">
                        <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">{sub.label}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {listings.filter((l) => l.category === matchedCategory && (l as any).subcategory === sub.value).length} listings
                        </p>
                      </div>
                    </button>
                  );
                })}
                {/* View all option */}
                <button
                  onClick={() => setSearchParams({ sub: "all" })}
                  className="relative overflow-hidden rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:shadow-md transition-all duration-200 active:scale-95"
                >
                  <div className="aspect-square flex items-center justify-center bg-primary/10">
                    <LayoutGrid className="w-6 h-6 text-primary" />
                  </div>
                  <div className="p-1.5 text-center">
                    <p className="text-xs font-semibold text-primary">View All</p>
                    <p className="text-[10px] text-muted-foreground">
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
