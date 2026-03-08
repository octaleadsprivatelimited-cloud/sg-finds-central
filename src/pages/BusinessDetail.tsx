import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, MapPin, Phone, Globe, Mail, MessageCircle, Star, Clock,
  ExternalLink, Share2, Bookmark, BadgeCheck, Building2, Copy, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VerifiedBadge from "@/components/VerifiedBadge";
import ReviewSection, { type Review } from "@/components/ReviewSection";
import OffersSection, { type Offer } from "@/components/OffersSection";
import MapView from "@/components/MapView";
import type { Listing } from "@/components/ListingCard";
import { toast } from "sonner";
import { toSlug } from "@/lib/url-helpers";

// Demo listings
const ALL_LISTINGS: (Listing & { verified?: boolean; featured?: boolean; rating?: number; reviewCount?: number })[] = [
  {
    id: "1", name: "Singapore Delights Pte Ltd", uen: "201912345A",
    category: "Food & Beverage", district: "Orchard", address: "391 Orchard Road, #B2-01, Singapore 238872",
    postalCode: "238872", phone: "+65 6234 5678", website: "https://sgdelights.com",
    email: "info@sgdelights.com", whatsapp: "+6592345678",
    description: "Award-winning local cuisine serving traditional Peranakan dishes with a modern twist. Our chefs bring decades of experience crafting authentic flavours with contemporary presentation. From signature laksa to handmade kuehs, every dish tells a story of Singapore's rich culinary heritage.",
    status: "approved", ownerId: "demo", lat: 1.3048, lng: 103.8318,
    verified: true, featured: true, rating: 4.8, reviewCount: 127,
  },
  {
    id: "2", name: "TechHub Solutions", uen: "202301234B",
    category: "Technology & IT", district: "CBD / Raffles Place", address: "1 Raffles Place, #30-01, Singapore 048616",
    postalCode: "048616", phone: "+65 6789 0123", website: "https://techhub.sg",
    email: "hello@techhub.sg", whatsapp: "+6597890123",
    description: "Full-service IT consultancy specializing in cloud infrastructure and cybersecurity. We help businesses of all sizes transform their digital operations with enterprise-grade solutions, 24/7 support, and proactive security monitoring.",
    status: "approved", ownerId: "demo", lat: 1.2840, lng: 103.8510,
    verified: true, featured: true, rating: 4.9, reviewCount: 89,
  },
  {
    id: "3", name: "Glow Aesthetics Clinic", uen: "202212345C",
    category: "Beauty & Wellness", district: "Novena", address: "10 Sinaran Drive, #10-05, Singapore 307506",
    postalCode: "307506", phone: "+65 6345 6789",
    email: "appointments@glowaesthetics.sg",
    description: "Premium aesthetic treatments using FDA-approved technology. Our clinic offers a comprehensive range of non-invasive procedures including laser treatments, dermal fillers, and skin rejuvenation therapies performed by certified medical professionals.",
    status: "approved", ownerId: "demo", lat: 1.3204, lng: 103.8447,
    verified: true, rating: 4.7, reviewCount: 64,
  },
  {
    id: "4", name: "LearnSG Academy", uen: "201854321D",
    category: "Education & Training", district: "Tampines", address: "1 Tampines Walk, #03-12, Singapore 528523",
    postalCode: "528523", phone: "+65 6456 7890",
    email: "enrol@learnsg.com",
    description: "Enrichment centre offering coding, robotics, and STEM courses for ages 5–16. Our curriculum is designed by experienced educators and tech professionals to nurture the next generation of innovators.",
    status: "approved", ownerId: "demo", lat: 1.3530, lng: 103.9453,
    rating: 4.6, reviewCount: 42,
  },
  {
    id: "5", name: "HomeFixSG Services", uen: "202098765E",
    category: "Home Services", district: "Jurong East", address: "21 Jurong East St 31, Singapore 609517",
    postalCode: "609517", phone: "+65 6567 8901",
    whatsapp: "+6595678901",
    description: "Reliable plumbing, electrical, and aircon servicing across Singapore. Our certified technicians respond within 2 hours for emergency jobs. Transparent pricing with no hidden charges.",
    status: "approved", ownerId: "demo", lat: 1.3329, lng: 103.7436,
    verified: true, featured: true, rating: 4.5, reviewCount: 156,
  },
];

const BusinessDetail = () => {
  const { areaSlug, categorySlug, businessSlug } = useParams<{
    areaSlug: string;
    categorySlug: string;
    businessSlug: string;
  }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: listing.name, url: shareUrl });
      } catch {}
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb + Back */}
      <div className="border-b border-border/50 bg-secondary/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-primary transition-colors">Directory</Link>
              <span>/</span>
              <Link to={`/${areaSlug}`} className="hover:text-primary transition-colors">
                {listing.district}
              </Link>
              <span>/</span>
              <Link to={`/${areaSlug}/${categorySlug}`} className="hover:text-primary transition-colors">
                {listing.category}
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium truncate max-w-[200px]">{listing.name}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-2xl font-bold text-primary">{listing.name.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl font-bold text-foreground">{listing.name}</h1>
                      {listing.verified && <VerifiedBadge size="md" />}
                      {listing.featured && (
                        <Badge className="bg-warning/10 text-warning border-warning/20 text-xs">
                          ⭐ Featured
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <Badge variant="secondary">{listing.category}</Badge>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        {listing.district}
                      </span>
                      {listing.rating && (
                        <span className="flex items-center gap-1 text-sm">
                          <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                          <span className="font-medium text-foreground">{listing.rating}</span>
                          <span className="text-muted-foreground">({listing.reviewCount})</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleShare}>
                    {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <Bookmark className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed">{listing.description}</p>
            </div>

            <Separator />

            {/* Contact buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {listing.phone && (
                <a href={`tel:${listing.phone}`} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                  <Phone className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium text-foreground">Call</span>
                </a>
              )}
              {listing.whatsapp && (
                <a
                  href={`https://wa.me/${listing.whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">WhatsApp</span>
                </a>
              )}
              {listing.email && (
                <a href={`mailto:${listing.email}`} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                  <Mail className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium text-foreground">Email</span>
                </a>
              )}
              {listing.website && (
                <a href={listing.website} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                  <Globe className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium text-foreground">Website</span>
                </a>
              )}
            </div>

            {/* Tabs: Reviews, Offers */}
            <Tabs defaultValue="reviews">
              <TabsList className="bg-secondary border border-border">
                <TabsTrigger value="reviews" className="gap-1.5">
                  <Star className="w-4 h-4" />Reviews
                </TabsTrigger>
                <TabsTrigger value="offers" className="gap-1.5">
                  <Badge className="w-4 h-4 p-0 bg-transparent border-0 text-inherit">%</Badge>
                  Offers
                </TabsTrigger>
              </TabsList>
              <TabsContent value="reviews" className="mt-6">
                <ReviewSection businessId={listing.id} reviews={[]} />
              </TabsContent>
              <TabsContent value="offers" className="mt-6">
                <OffersSection offers={[]} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
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

            {/* Business Info Card */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h3 className="font-semibold text-foreground text-sm">Business Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{listing.address}</span>
                </div>
                {listing.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    <a href={`tel:${listing.phone}`} className="text-primary hover:underline">{listing.phone}</a>
                  </div>
                )}
                {listing.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <a href={`mailto:${listing.email}`} className="text-primary hover:underline">{listing.email}</a>
                  </div>
                )}
                {listing.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                    <a href={listing.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      {listing.website.replace(/https?:\/\//, "")}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">UEN: {listing.uen}</span>
                </div>
              </div>
            </div>

            {/* Operating Hours (demo) */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Operating Hours
              </h3>
              <div className="space-y-2 text-sm">
                {[
                  { day: "Mon – Fri", time: "9:00 AM – 6:00 PM" },
                  { day: "Saturday", time: "10:00 AM – 4:00 PM" },
                  { day: "Sunday", time: "Closed" },
                ].map(({ day, time }) => (
                  <div key={day} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{day}</span>
                    <span className={`font-medium ${time === "Closed" ? "text-destructive" : "text-foreground"}`}>
                      {time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;
