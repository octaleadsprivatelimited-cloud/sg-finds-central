import { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Building2, Clock, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReviewSection from "@/components/ReviewSection";
import OffersSection from "@/components/OffersSection";
import MapView from "@/components/MapView";
import type { Listing } from "@/components/ListingCard";
import { DEFAULT_OPERATING_HOURS } from "@/components/ListingCard";
import { toSlug } from "@/lib/url-helpers";
import PhotoGallery from "@/components/business-detail/PhotoGallery";
import BusinessHeader from "@/components/business-detail/BusinessHeader";
import CatalogueSection from "@/components/business-detail/CatalogueSection";
import QuickInfo from "@/components/business-detail/QuickInfo";
import ContactSidebar from "@/components/business-detail/ContactSidebar";
import { DEMO_LISTINGS, GALLERY_MAP } from "@/lib/demo-listings";

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
      DEMO_LISTINGS.find((l) => {
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
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
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
                <OffersSection offers={listing.offers || []} />
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
