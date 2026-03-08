import { MapPin, Phone, Globe, Star, Clock, ExternalLink, MessageCircle, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import VerifiedBadge from "./VerifiedBadge";
import { useNavigate } from "react-router-dom";

export interface Listing {
  id: string;
  name: string;
  uen: string;
  category: string;
  district: string;
  address: string;
  postalCode: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  email?: string;
  description?: string;
  status: "pending_approval" | "approved" | "rejected";
  ownerId: string;
  documentsUrl?: string[];
  lat?: number;
  lng?: number;
  createdAt?: any;
  verified?: boolean;
  featured?: boolean;
  rating?: number;
  reviewCount?: number;
  city?: string;
}

interface ListingCardProps {
  listing: Listing;
  compact?: boolean;
  onSelect?: (listing: Listing) => void;
}

const ListingCard = ({ listing, compact, onSelect }: ListingCardProps) => {
  const navigate = useNavigate();
  const slug = listing.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleClick = () => {
    if (onSelect) onSelect(listing);
    navigate(`/business/${slug}`);
  };

  return (
    <div
      className={`glass-card rounded-xl p-4 hover-lift cursor-pointer animate-fade-in ${listing.featured ? "border-primary/20 ring-1 ring-primary/10" : ""}`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{listing.name}</h3>
            {listing.verified && <VerifiedBadge size="sm" />}
            <Badge variant="secondary" className="shrink-0 text-xs">{listing.category}</Badge>
            {listing.featured && (
              <Badge className="bg-warning/10 text-warning border-warning/20 text-xs shrink-0">⭐ Featured</Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{listing.address}</span>
          </div>
          {!compact && listing.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{listing.description}</p>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            {listing.phone && (
              <a href={`tel:${listing.phone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors" onClick={(e) => e.stopPropagation()}>
                <Phone className="w-3 h-3" />{listing.phone}
              </a>
            )}
            {listing.whatsapp && (
              <a href={`https://wa.me/${listing.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-emerald-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                <MessageCircle className="w-3 h-3" />WhatsApp
              </a>
            )}
            {listing.email && (
              <a href={`mailto:${listing.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors" onClick={(e) => e.stopPropagation()}>
                <Mail className="w-3 h-3" />Email
              </a>
            )}
            {listing.website && (
              <a href={listing.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                <Globe className="w-3 h-3" />Website<ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
            {listing.rating && (
              <span className="flex items-center gap-1 text-xs">
                <Star className="w-3 h-3 text-warning fill-warning" />
                <span className="font-medium text-foreground">{listing.rating}</span>
                {listing.reviewCount && <span className="text-muted-foreground">({listing.reviewCount})</span>}
              </span>
            )}
          </div>
        </div>
        <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center shrink-0">
          <span className="text-2xl font-bold text-primary/30">{listing.name.charAt(0)}</span>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
