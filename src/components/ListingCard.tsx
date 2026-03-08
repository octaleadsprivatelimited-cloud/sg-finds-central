import { useMemo } from "react";
import { MapPin, Phone, Globe, Star, Clock, ExternalLink, MessageCircle, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import VerifiedBadge from "./VerifiedBadge";
import { useNavigate } from "react-router-dom";
import { getBusinessUrl } from "@/lib/url-helpers";

export interface ListingOffer {
  id: string;
  title: string;
  description: string;
  discount: string;
  validUntil: string;
  code?: string;
}

export interface OperatingHours {
  [key: string]: { open: string; close: string; closed?: boolean };
}

export interface SpecialHours {
  date: string; // YYYY-MM-DD
  label: string; // e.g. "Christmas", "CNY Day 1"
  open: string;
  close: string;
  closed?: boolean;
}

export const DEFAULT_OPERATING_HOURS: OperatingHours = {
  Monday: { open: "09:00", close: "18:00" },
  Tuesday: { open: "09:00", close: "18:00" },
  Wednesday: { open: "09:00", close: "18:00" },
  Thursday: { open: "09:00", close: "18:00" },
  Friday: { open: "09:00", close: "18:00" },
  Saturday: { open: "10:00", close: "16:00" },
  Sunday: { open: "", close: "", closed: true },
};

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
  coverImage?: string;
  offers?: ListingOffer[];
  operatingHours?: OperatingHours;
  specialHours?: SpecialHours[];
}

interface ListingCardProps {
  listing: Listing;
  compact?: boolean;
  onSelect?: (listing: Listing) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Food & Beverage": "from-orange-500 to-red-500",
  "Retail & Shopping": "from-sky-500 to-blue-600",
  "Healthcare & Medical": "from-emerald-500 to-teal-600",
  "Education & Training": "from-indigo-500 to-blue-700",
  "Professional Services": "from-slate-500 to-slate-700",
  "Beauty & Wellness": "from-pink-500 to-rose-600",
  "Home Services": "from-amber-500 to-orange-600",
  "Automotive": "from-zinc-500 to-zinc-700",
  "Technology & IT": "from-violet-500 to-purple-700",
  "Real Estate": "from-cyan-500 to-blue-600",
  "Legal Services": "from-yellow-600 to-amber-700",
  "Financial Services": "from-green-500 to-emerald-700",
  "Logistics & Transport": "from-stone-500 to-stone-700",
  "Events & Entertainment": "from-rose-500 to-pink-700",
  "Construction & Renovation": "from-orange-600 to-amber-700",
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getIsOpenNow(listing: Listing): boolean | null {
  const hours = listing.operatingHours;
  if (!hours) return null; // no data → don't show badge

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // Check special hours first
  if (listing.specialHours) {
    const special = listing.specialHours.find((sh) => sh.date === todayStr);
    if (special) {
      if (special.closed) return false;
      return isWithinTime(now, special.open, special.close);
    }
  }

  const dayName = DAYS[now.getDay()];
  const todayHours = hours[dayName];
  if (!todayHours || todayHours.closed) return false;
  return isWithinTime(now, todayHours.open, todayHours.close);
}

function isWithinTime(now: Date, open: string, close: string): boolean {
  if (!open || !close) return false;
  const [oh, om] = open.split(":").map(Number);
  const [ch, cm] = close.split(":").map(Number);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin >= oh * 60 + om && nowMin < ch * 60 + cm;
}

const ListingCard = ({ listing, compact, onSelect }: ListingCardProps) => {
  const navigate = useNavigate();
  const gradient = CATEGORY_COLORS[listing.category] || "from-primary to-accent";
  const isOpen = useMemo(() => getIsOpenNow(listing), [listing]);

  const handleClick = () => {
    if (onSelect) onSelect(listing);
    navigate(getBusinessUrl(listing));
  };

  return (
    <div
      className={`glass-card rounded-xl overflow-hidden hover-lift cursor-pointer animate-fade-in group ${listing.featured ? "gradient-border" : ""}`}
      onClick={handleClick}
    >
      <div className="flex">
        {/* Image thumbnail */}
        <div className="w-24 h-24 sm:w-36 sm:h-36 shrink-0 bg-muted overflow-hidden">
          {listing.coverImage ? (
            <img
              src={listing.coverImage}
              alt={listing.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : listing.logoUrl ? (
            <img
              src={listing.logoUrl}
              alt={listing.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <span className="text-3xl sm:text-4xl font-bold text-white/90">{listing.name.charAt(0)}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 p-3 sm:p-4 overflow-hidden">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 flex-wrap">
            <h3 className="font-semibold text-foreground truncate text-sm sm:text-base group-hover:text-primary transition-colors">{listing.name}</h3>
            {listing.verified && <VerifiedBadge size="sm" />}
            {listing.featured && (
              <Badge className="bg-gradient-to-r from-warning/20 to-orange-500/20 text-warning border-warning/30 text-[10px] sm:text-xs shrink-0 font-medium">
                ⭐ Featured
              </Badge>
            )}
            {isOpen !== null && (
              isOpen ? (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-transparent text-[10px] sm:text-xs shrink-0 font-medium">
                  <Clock className="w-2.5 h-2.5 mr-0.5" />Open
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 border-transparent text-[10px] sm:text-xs shrink-0 font-medium">
                  <Clock className="w-2.5 h-2.5 mr-0.5" />Closed
                </Badge>
              )
            )}
          </div>

          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge variant="secondary" className="text-[10px] sm:text-xs font-medium">{listing.category}</Badge>
            {listing.rating && (
              <span className="flex items-center gap-1 text-xs">
                <Star className="w-3 h-3 text-warning fill-warning" />
                <span className="font-semibold text-foreground">{listing.rating}</span>
                {listing.reviewCount && <span className="text-muted-foreground">({listing.reviewCount})</span>}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground mb-2">
            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-accent" />
            <span className="truncate">{listing.address}</span>
          </div>

          {!compact && listing.description && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 sm:line-clamp-2 mb-2">{listing.description}</p>
          )}

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
