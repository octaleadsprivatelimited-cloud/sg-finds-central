import { MapPin, Star, Clock, Phone, MessageCircle, Mail, Share2, Bookmark, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import VerifiedBadge from "@/components/VerifiedBadge";
import type { Listing } from "@/components/ListingCard";
import { useState } from "react";
import { toast } from "sonner";

interface BusinessHeaderProps {
  listing: Listing & { verified?: boolean; featured?: boolean; rating?: number; reviewCount?: number };
  shareUrl: string;
}

const BusinessHeader = ({ listing, shareUrl }: BusinessHeaderProps) => {
  const [copied, setCopied] = useState(false);

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
    <div className="space-y-6">
      {/* Name + badges — Apple-style large title */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              {listing.logoUrl ? (
                <img src={listing.logoUrl} alt={listing.name} className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-border/50 shadow-sm" />
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shadow-sm">
                  <span className="text-2xl font-bold text-primary">{listing.name.charAt(0)}</span>
                </div>
              )}
              <div>
                <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-tight">{listing.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  {listing.verified && <VerifiedBadge size="md" />}
                  {listing.featured && (
                    <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[11px] font-semibold">⭐ Featured</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-1.5 shrink-0">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-secondary" onClick={handleShare}>
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Share2 className="w-4 h-4 text-muted-foreground" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-secondary">
              <Bookmark className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Rating pill + meta — clean horizontal layout */}
        <div className="flex items-center gap-3 flex-wrap">
          {listing.rating && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground text-background text-sm font-bold">
              {listing.rating}
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="text-xs font-normal opacity-70 ml-0.5">({listing.reviewCount})</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span className="font-medium">{listing.district}</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-border" />
          <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Open now
          </div>
        </div>

        {/* Category — minimal pill */}
        <div>
          <Badge variant="secondary" className="rounded-full px-3.5 py-1 text-xs font-medium">{listing.category}</Badge>
        </div>
      </div>

      {/* CTA buttons - inline on desktop — Apple-style rounded, spacious */}
      <div className="hidden sm:flex items-center gap-3">
        {listing.phone && (
          <a href={`tel:${listing.phone}`}>
            <Button className="h-11 rounded-full bg-foreground hover:bg-foreground/90 text-background gap-2.5 font-semibold px-6 text-sm shadow-sm">
              <Phone className="w-4 h-4 shrink-0" />
              {listing.phone}
            </Button>
          </a>
        )}
        {listing.email && (
          <a href={`mailto:${listing.email}`}>
            <Button className="h-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2.5 font-semibold px-6 text-sm shadow-sm">
              <Mail className="w-4 h-4 shrink-0" />
              Enquire Now
            </Button>
          </a>
        )}
        {listing.whatsapp && (
          <a href={`https://wa.me/${listing.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="h-11 rounded-full gap-2.5 font-semibold px-6 text-sm border-border hover:bg-secondary">
              <MessageCircle className="w-4 h-4 shrink-0" />
              WhatsApp
            </Button>
          </a>
        )}
      </div>

      {/* CTA buttons - sticky bottom bar on mobile — frosted glass Apple-style */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/50 px-4 py-3 safe-bottom">
        <div className="grid grid-cols-3 gap-2.5">
          {listing.phone && (
            <a href={`tel:${listing.phone}`} className="min-w-0">
              <Button className="w-full h-[52px] rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5 font-bold text-[13px] shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
                <Phone className="w-5 h-5 shrink-0" />
                Call
              </Button>
            </a>
          )}
          {listing.lat && listing.lng && (
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${listing.lat},${listing.lng}`} target="_blank" rel="noopener noreferrer" className="min-w-0">
              <Button className="w-full h-[52px] rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 font-bold text-[13px] shadow-lg shadow-primary/20 transition-all active:scale-95">
                <MapPin className="w-5 h-5 shrink-0" />
                Location
              </Button>
            </a>
          )}
          {listing.whatsapp && (
            <a href={`https://wa.me/${listing.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="min-w-0">
              <Button className="w-full h-[52px] rounded-2xl bg-card hover:bg-secondary border border-border text-foreground gap-1.5 font-bold text-[13px] shadow-lg transition-all active:scale-95">
                <MessageCircle className="w-5 h-5 shrink-0 text-emerald-500" />
                WhatsApp
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessHeader;
