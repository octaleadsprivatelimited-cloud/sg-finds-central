import { MapPin, Star, Clock, Phone, MessageCircle, Mail, Share2, Bookmark, Check } from "lucide-react";
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
    <div className="space-y-4">
      {/* Name + badges */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            {listing.logoUrl ? (
              <img src={listing.logoUrl} alt={listing.name} className="w-12 h-12 rounded-xl object-cover border border-border" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">{listing.name.charAt(0)}</span>
              </div>
            )}
            <h1 className="text-2xl font-bold text-foreground">{listing.name}</h1>
            {listing.verified && <VerifiedBadge size="md" />}
            {listing.featured && (
              <Badge className="bg-warning/10 text-warning border-warning/20 text-xs">⭐ Featured</Badge>
            )}
          </div>

          {/* Rating + meta */}
          <div className="flex items-center gap-4 flex-wrap">
            {listing.rating && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-success text-success-foreground text-sm font-semibold">
                  {listing.rating} <Star className="w-3.5 h-3.5 fill-current" />
                </span>
                <span className="text-sm text-muted-foreground">
                  {listing.reviewCount} Ratings
                </span>
              </div>
            )}
            {listing.verified && (
              <span className="text-sm font-semibold text-primary">✓ Verified</span>
            )}
          </div>

          {/* Location + hours */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {listing.district}
            </span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1 text-success">
              <Clock className="w-3.5 h-3.5" />
              Open now
            </span>
          </div>

          {/* Category tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">{listing.category}</Badge>
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

      {/* Prominent CTA buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        {listing.phone && (
          <a href={`tel:${listing.phone}`}>
            <Button className="bg-success hover:bg-success/90 text-success-foreground gap-2 font-semibold">
              <Phone className="w-4 h-4" />
              {listing.phone}
            </Button>
          </a>
        )}
        {listing.email && (
          <a href={`mailto:${listing.email}`}>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-semibold">
              <Mail className="w-4 h-4" />
              Enquire Now
            </Button>
          </a>
        )}
        {listing.whatsapp && (
          <a
            href={`https://wa.me/${listing.whatsapp.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="gap-2 font-semibold border-success/30 text-success hover:bg-success/10">
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
          </a>
        )}
      </div>
    </div>
  );
};

export default BusinessHeader;
