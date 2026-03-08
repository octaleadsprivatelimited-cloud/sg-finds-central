import { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Building2, Star, Camera, Clock, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReviewSection from "@/components/ReviewSection";
import OffersSection from "@/components/OffersSection";
import MapView from "@/components/MapView";
import type { Listing } from "@/components/ListingCard";
import { DEFAULT_OPERATING_HOURS, type SpecialHours } from "@/components/ListingCard";
import { toSlug } from "@/lib/url-helpers";
import PhotoGallery from "@/components/business-detail/PhotoGallery";
import BusinessHeader from "@/components/business-detail/BusinessHeader";
import CatalogueSection from "@/components/business-detail/CatalogueSection";
import QuickInfo from "@/components/business-detail/QuickInfo";
import ContactSidebar from "@/components/business-detail/ContactSidebar";

// Gallery images
import food1 from "@/assets/businesses/food1.jpg";
import food1b from "@/assets/businesses/food1-b.jpg";
import food1c from "@/assets/businesses/food1-c.jpg";
import tech1 from "@/assets/businesses/tech1.jpg";
import tech1b from "@/assets/businesses/tech1-b.jpg";
import tech1c from "@/assets/businesses/tech1-c.jpg";
import beauty1 from "@/assets/businesses/beauty1.jpg";
import beauty1b from "@/assets/businesses/beauty1-b.jpg";
import beauty1c from "@/assets/businesses/beauty1-c.jpg";
import education1 from "@/assets/businesses/education1.jpg";
import education1b from "@/assets/businesses/education1-b.jpg";
import education1c from "@/assets/businesses/education1-c.jpg";
import home1 from "@/assets/businesses/home1.jpg";
import home1b from "@/assets/businesses/home1-b.jpg";
import home1c from "@/assets/businesses/home1-c.jpg";

// Photo gallery map per listing ID
const GALLERY_MAP: Record<string, string[]> = {
  "1": [food1, food1b, food1c],
  "2": [tech1, tech1b, tech1c],
  "3": [beauty1, beauty1b, beauty1c],
  "4": [education1, education1b, education1c],
  "5": [home1, home1b, home1c],
};

// Demo listings
const ALL_LISTINGS: (Listing & { verified?: boolean; featured?: boolean; rating?: number; reviewCount?: number })[] = [
  {
    id: "1", name: "Singapore Delights Pte Ltd", uen: "201912345A",
    category: "Food & Beverage", district: "Orchard", address: "391 Orchard Road, #B2-01, Singapore 238872",
    postalCode: "238872", phone: "+65 6234 5678", website: "https://sgdelights.com",
    email: "info@sgdelights.com", whatsapp: "+6592345678",
    description: "Award-winning local cuisine serving traditional Peranakan dishes with a modern twist. Our chefs bring decades of experience crafting authentic flavours with contemporary presentation. From signature laksa to handmade kuehs, every dish tells a story of Singapore's rich culinary heritage.",
    status: "approved", ownerId: "demo", lat: 1.3048, lng: 103.8318,
    verified: true, featured: true, rating: 4.8, reviewCount: 127, coverImage: food1,
  },
  {
    id: "2", name: "TechHub Solutions", uen: "202301234B",
    category: "Technology & IT", district: "CBD / Raffles Place", address: "1 Raffles Place, #30-01, Singapore 048616",
    postalCode: "048616", phone: "+65 6789 0123", website: "https://techhub.sg",
    email: "hello@techhub.sg", whatsapp: "+6597890123",
    description: "Full-service IT consultancy specializing in cloud infrastructure and cybersecurity. We help businesses of all sizes transform their digital operations with enterprise-grade solutions, 24/7 support, and proactive security monitoring.",
    status: "approved", ownerId: "demo", lat: 1.2840, lng: 103.8510,
    verified: true, featured: true, rating: 4.9, reviewCount: 89, coverImage: tech1,
  },
  {
    id: "3", name: "Glow Aesthetics Clinic", uen: "202212345C",
    category: "Beauty & Wellness", district: "Novena", address: "10 Sinaran Drive, #10-05, Singapore 307506",
    postalCode: "307506", phone: "+65 6345 6789",
    email: "appointments@glowaesthetics.sg",
    description: "Premium aesthetic treatments using FDA-approved technology. Our clinic offers a comprehensive range of non-invasive procedures including laser treatments, dermal fillers, and skin rejuvenation therapies performed by certified medical professionals.",
    status: "approved", ownerId: "demo", lat: 1.3204, lng: 103.8447,
    verified: true, rating: 4.7, reviewCount: 64, coverImage: beauty1,
  },
  {
    id: "4", name: "LearnSG Academy", uen: "201854321D",
    category: "Education & Training", district: "Tampines", address: "1 Tampines Walk, #03-12, Singapore 528523",
    postalCode: "528523", phone: "+65 6456 7890",
    email: "enrol@learnsg.com",
    description: "Enrichment centre offering coding, robotics, and STEM courses for ages 5–16. Our curriculum is designed by experienced educators and tech professionals to nurture the next generation of innovators.",
    status: "approved", ownerId: "demo", lat: 1.3530, lng: 103.9453,
    rating: 4.6, reviewCount: 42, coverImage: education1,
  },
  {
    id: "5", name: "HomeFixSG Services", uen: "202098765E",
    category: "Home Services", district: "Jurong East", address: "21 Jurong East St 31, Singapore 609517",
    postalCode: "609517", phone: "+65 6567 8901",
    whatsapp: "+6595678901",
    description: "Reliable plumbing, electrical, and aircon servicing across Singapore. Our certified technicians respond within 2 hours for emergency jobs. Transparent pricing with no hidden charges.",
    status: "approved", ownerId: "demo", lat: 1.3329, lng: 103.7436,
    verified: true, featured: true, rating: 4.5, reviewCount: 156, coverImage: home1,
  },
];

const formatTime = (time: string) => {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
};

const BusinessDetail = () => {
  const { areaSlug, categorySlug, businessSlug } = useParams<{
    areaSlug: string;
    categorySlug: string;
    businessSlug: string;
  }>();
  const navigate = useNavigate();

  const listing = useMemo(
    () =>
      ALL_LISTINGS.find((l) => {
        const matchArea = toSlug(l.district) === areaSlug;
        const matchCategory = toSlug(l.category) === categorySlug;
        const matchBusiness = (l.customSlug || toSlug(l.name)) === businessSlug;
        return matchArea && matchCategory && matchBusiness;
      }),
    [areaSlug, categorySlug, businessSlug]
  );

  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground mb-2">Business Not Found</h1>
          <p className="text-muted-foreground mb-4">The business you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/")}>Back to Directory</Button>
        </div>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/${areaSlug}/${categorySlug}/${businessSlug}`;
  const galleryPhotos = GALLERY_MAP[listing.id] || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border/50 bg-secondary/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground overflow-x-auto scrollbar-hide whitespace-nowrap">
              <Link to="/" className="hover:text-primary transition-colors shrink-0">Directory</Link>
              <span className="shrink-0">›</span>
              <Link to={`/${areaSlug}`} className="hover:text-primary transition-colors shrink-0">{listing.district}</Link>
              <span className="shrink-0">›</span>
              <Link to={`/${areaSlug}/${categorySlug}`} className="hover:text-primary transition-colors shrink-0 hidden sm:inline">{listing.category}</Link>
              <span className="shrink-0 hidden sm:inline">›</span>
              <span className="text-foreground font-medium truncate max-w-[120px] sm:max-w-[200px]">{listing.name}</span>
            </div>
            <Button variant="ghost" size="sm" className="shrink-0" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Photo Gallery */}
      <div className="container mx-auto px-4 pt-4">
        <PhotoGallery photos={galleryPhotos} businessName={listing.name} />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Header + Tabs */}
          <div className="lg:col-span-2 space-y-6">
            <BusinessHeader listing={listing} shareUrl={shareUrl} />

            {/* Tabs */}
            <Tabs defaultValue="overview">
              <TabsList className="bg-secondary border border-border w-full justify-start overflow-x-auto scrollbar-hide flex-nowrap">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="catalogue" className="relative">
                  Catalogue
                  <span className="ml-1 w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                </TabsTrigger>
                <TabsTrigger value="quick-info">Quick Info</TabsTrigger>
                <TabsTrigger value="photos">Photos</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="offers">Offers</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">About</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{listing.description}</p>
                </div>
                <CatalogueSection />

                {/* Operating Hours */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    Operating Hours
                  </h3>
                  <div className="space-y-2 text-sm">
                    {(() => {
                      const hours = listing.operatingHours || DEFAULT_OPERATING_HOURS;
                      return Object.entries(hours).map(([day, info]) => {
                        const time = info.closed
                          ? "Closed"
                          : `${formatTime(info.open)} – ${formatTime(info.close)}`;
                        return (
                          <div key={day} className="flex items-center justify-between max-w-xs">
                            <span className="text-muted-foreground">{day}</span>
                            <span className={`font-medium ${time === "Closed" ? "text-destructive" : "text-foreground"}`}>
                              {time}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  {/* Special / Holiday Hours */}
                  {listing.specialHours && listing.specialHours.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                        Special Hours
                      </h4>
                      <div className="space-y-1.5 text-sm">
                        {listing.specialHours.map((sh, i) => {
                          const dateStr = sh.date ? new Date(sh.date + "T00:00:00").toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" }) : "";
                          const time = sh.closed ? "Closed" : `${formatTime(sh.open)} – ${formatTime(sh.close)}`;
                          return (
                            <div key={i} className="flex items-center justify-between max-w-sm">
                              <span className="text-muted-foreground">{sh.label || dateStr}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{dateStr}</span>
                                <span className={`font-medium ${time === "Closed" ? "text-destructive" : "text-foreground"}`}>{time}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="catalogue" className="mt-6">
                <CatalogueSection />
              </TabsContent>

              <TabsContent value="quick-info" className="mt-6">
                <QuickInfo listing={listing} />
              </TabsContent>

              <TabsContent value="photos" className="mt-6">
                <PhotoGallery photos={galleryPhotos} businessName={listing.name} />
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <ReviewSection businessId={listing.id} reviews={[]} />
              </TabsContent>

              <TabsContent value="offers" className="mt-6">
                <OffersSection offers={[]} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Map */}
            {listing.lat && listing.lng && (
              <div className="rounded-xl overflow-hidden h-[250px] border border-border">
                <MapView
                  listings={[listing]}
                  selectedId={listing.id}
                  center={{ lat: listing.lat, lng: listing.lng }}
                />
              </div>
            )}

            <ContactSidebar listing={listing} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;
