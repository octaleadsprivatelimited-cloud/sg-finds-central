import { MapPin, Phone, Globe, Star, Clock, ExternalLink, MessageCircle, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import VerifiedBadge from "./VerifiedBadge";
import { useNavigate } from "react-router-dom";
import { getBusinessUrl } from "@/lib/url-helpers";

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
  customSlug?: string;
  logoUrl?: string;
}

interface ListingCardProps {
  listing: Listing;
  compact?: boolean;
  onSelect?: (listing: Listing) => void;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  "Food & Beverage": "🍜",
  "Retail & Shopping": "🛍️",
  "Healthcare & Medical": "🏥",
  "Education & Training": "📚",
  "Professional Services": "💼",
  "Beauty & Wellness": "💅",
  "Home Services": "🏠",
  "Automotive": "🚗",
  "Technology & IT": "💻",
  "Real Estate": "🏢",
  "Legal Services": "⚖️",
  "Financial Services": "💰",
  "Logistics & Transport": "🚚",
  "Events & Entertainment": "🎉",
  "Construction & Renovation": "🔨",
};

const CATEGORY_COLORS: Record<string, string> = {
  "Food & Beverage": "bg-orange-100 text-orange-700",
  "Retail & Shopping": "bg-blue-100 text-blue-700",
  "Healthcare & Medical": "bg-emerald-100 text-emerald-700",
  "Education & Training": "bg-indigo-100 text-indigo-700",
  "Professional Services": "bg-slate-100 text-slate-700",
  "Beauty & Wellness": "bg-pink-100 text-pink-700",
  "Home Services": "bg-amber-100 text-amber-700",
  "Automotive": "bg-zinc-100 text-zinc-700",
  "Technology & IT": "bg-violet-100 text-violet-700",
  "Real Estate": "bg-cyan-100 text-cyan-700",
  "Legal Services": "bg-yellow-100 text-yellow-700",
  "Financial Services": "bg-green-100 text-green-700",
  "Logistics & Transport": "bg-stone-100 text-stone-700",
  "Events & Entertainment": "bg-rose-100 text-rose-700",
  "Construction & Renovation": "bg-orange-100 text-orange-700",
};

const ListingCard = ({ listing, compact, onSelect }: ListingCardProps) => {
  const navigate = useNavigate();
  const colorClass = CATEGORY_COLORS[listing.category] || "bg-primary/10 text-primary";
  const emoji = CATEGORY_EMOJIS[listing.category] || "📍";

  const handleClick = () => {
    if (onSelect) onSelect(listing);
    navigate(getBusinessUrl(listing));
  };

  return (
    <div
      className={`bg-card rounded-xl border border-border p-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group ${listing.featured ? "ring-1 ring-warning/30" : ""}`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">{listing.name}</h3>
            {listing.verified && <VerifiedBadge size="sm" />}
            <Badge variant="secondary" className="shrink-0 text-xs font-medium">{listing.category}</Badge>
            {listing.featured && (
              <Badge className="bg-gradient-to-r from-warning/20 to-orange-500/20 text-warning border-warning/30 text-xs shrink-0 font-medium">
                ⭐ Featured
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-accent" />
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
                className="flex items-center gap-1 text-xs text-success font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                <MessageCircle className="w-3 h-3" />WhatsApp
              </a>
            )}
            {listing.email && (
              <a href={`mailto:${listing.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors" onClick={(e) => e.stopPropagation()}>
                <Mail className="w-3 h-3" />Email
              </a>
            )}
            {listing.website && (
              <a href={listing.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-info font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                <Globe className="w-3 h-3" />Website<ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
            {listing.rating && (
              <span className="flex items-center gap-1 text-xs">
                <Star className="w-3 h-3 text-warning fill-warning" />
                <span className="font-semibold text-foreground">{listing.rating}</span>
                {listing.reviewCount && <span className="text-muted-foreground">({listing.reviewCount})</span>}
              </span>
            )}
          </div>
        </div>
        <div className={`w-14 h-14 md:w-16 md:h-16 rounded-xl ${colorClass} flex items-center justify-center shrink-0 shadow-sm`}
          style={{ perspective: "200px" }}>
          {listing.logoUrl ? (
            <img src={listing.logoUrl} alt={listing.name} className="w-full h-full object-cover rounded-xl" />
          ) : (
            <span className="text-2xl md:text-3xl" style={{ transform: "rotateY(-8deg) rotateX(5deg)" }}>{emoji}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
