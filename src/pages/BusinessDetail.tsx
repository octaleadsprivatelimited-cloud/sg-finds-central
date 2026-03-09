import { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Building2, Clock, CalendarDays, ChevronRight } from "lucide-react";
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
          <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Business Not Found</h1>
          <p className="text-sm text-muted-foreground mb-6">The business you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/")} className="rounded-full px-6">Back to Directory</Button>
        </div>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/${areaSlug}/${categorySlug}/${businessSlug}`;
  const galleryPhotos = GALLERY_MAP[listing.id] || [];

  return (
    <div className="min-h-screen bg-background pb-24 sm:pb-0">
      {/* Breadcrumb — Apple-style minimal */}
      <div className="border-b border-border/40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground overflow-x-auto scrollbar-hide whitespace-nowrap">
            <Link to="/" className="hover:text-foreground transition-colors shrink-0 font-medium">Directory</Link>
            <ChevronRight className="w-3 h-3 shrink-0 text-muted-foreground/50" />
            <Link to={`/${areaSlug}`} className="hover:text-foreground transition-colors shrink-0 font-medium">{listing.district}</Link>
            <ChevronRight className="w-3 h-3 shrink-0 text-muted-foreground/50" />
            <span className="hidden sm:inline font-medium hover:text-foreground transition-colors shrink-0">{listing.category}</span>
            <ChevronRight className="w-3 h-3 shrink-0 text-muted-foreground/50 hidden sm:inline" />
            <span className="text-foreground font-semibold truncate max-w-[150px] sm:max-w-[250px]">{listing.name}</span>
          </div>
        </div>
      </div>

      {/* Photo Gallery */}
      <div className="container mx-auto px-4 pt-5">
        <PhotoGallery photos={galleryPhotos} businessName={listing.name} />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Header + Tabs */}
          <div className="lg:col-span-2 space-y-8">
            <BusinessHeader listing={listing} shareUrl={shareUrl} />

            {/* Tabs — Apple-style clean segmented control */}
            <Tabs defaultValue="overview">
              <TabsList className="bg-secondary/60 border border-border/40 w-full justify-start overflow-x-auto scrollbar-hide flex-nowrap rounded-full p-1 h-auto">
                <TabsTrigger value="overview" className="rounded-full text-xs sm:text-sm px-4 py-2 data-[state=active]:shadow-sm">Overview</TabsTrigger>
                <TabsTrigger value="catalogue" className="rounded-full text-xs sm:text-sm px-4 py-2 data-[state=active]:shadow-sm relative">
                  Catalogue
                  <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                </TabsTrigger>
                <TabsTrigger value="quick-info" className="rounded-full text-xs sm:text-sm px-4 py-2 data-[state=active]:shadow-sm">Info</TabsTrigger>
                <TabsTrigger value="photos" className="rounded-full text-xs sm:text-sm px-4 py-2 data-[state=active]:shadow-sm">Photos</TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-full text-xs sm:text-sm px-4 py-2 data-[state=active]:shadow-sm">Reviews</TabsTrigger>
                <TabsTrigger value="offers" className="rounded-full text-xs sm:text-sm px-4 py-2 data-[state=active]:shadow-sm">Offers</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-8 space-y-8">
                {/* About — clean typography */}
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-foreground mb-3">About</h3>
                  <p className="text-[15px] text-muted-foreground leading-[1.7]">{listing.description}</p>
                </div>

                <CatalogueSection />

                {/* Operating Hours — Apple-style card */}
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-foreground mb-4 flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    Operating Hours
                  </h3>
                  <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
                    <div className="space-y-3">
                      {(() => {
                        const hours = listing.operatingHours || DEFAULT_OPERATING_HOURS;
                        return Object.entries(hours).map(([day, info]) => {
                          const time = info.closed
                            ? "Closed"
                            : `${formatTime(info.open)} – ${formatTime(info.close)}`;
                          return (
                            <div key={day} className="flex items-center justify-between py-1">
                              <span className="text-sm text-muted-foreground">{day}</span>
                              <span className={`text-sm font-semibold ${time === "Closed" ? "text-destructive" : "text-foreground"}`}>
                                {time}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* Special / Holiday Hours */}
                    {listing.specialHours && listing.specialHours.length > 0 && (
                      <div className="mt-5 pt-5 border-t border-border/40">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5" />
                          Special Hours
                        </h4>
                        <div className="space-y-2">
                          {listing.specialHours.map((sh, i) => {
                            const dateStr = sh.date ? new Date(sh.date + "T00:00:00").toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" }) : "";
                            const time = sh.closed ? "Closed" : `${formatTime(sh.open)} – ${formatTime(sh.close)}`;
                            return (
                              <div key={i} className="flex items-center justify-between py-1">
                                <span className="text-sm text-muted-foreground">{sh.label || dateStr}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-muted-foreground/70">{dateStr}</span>
                                  <span className={`text-sm font-semibold ${time === "Closed" ? "text-destructive" : "text-foreground"}`}>{time}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="catalogue" className="mt-8">
                <CatalogueSection />
              </TabsContent>

              <TabsContent value="quick-info" className="mt-8">
                <QuickInfo listing={listing} />
              </TabsContent>

              <TabsContent value="photos" className="mt-8">
                <PhotoGallery photos={galleryPhotos} businessName={listing.name} />
              </TabsContent>

              <TabsContent value="reviews" className="mt-8">
                <ReviewSection businessId={listing.id} reviews={[]} />
              </TabsContent>

              <TabsContent value="offers" className="mt-8">
                <OffersSection offers={listing.offers || []} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Map — rounded Apple-style */}
            {listing.lat && listing.lng && (
              <div className="rounded-2xl overflow-hidden h-[250px] border border-border/60 shadow-sm">
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
