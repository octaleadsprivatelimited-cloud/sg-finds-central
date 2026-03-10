import { useMemo, useState } from "react";
import { MapPin, Star, Clock, Heart } from "lucide-react";
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
  date: string;
  label: string;
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
  priceRange?: string;
}

interface ListingCardProps {
  listing: Listing;
  compact?: boolean;
  highlighted?: boolean;
  onSelect?: (listing: Listing) => void;
  onHover?: (id: string | null) => void;
  distanceKm?: number | null;
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

const CATEGORY_SHORT: Record<string, string> = {
  "Food & Beverage": "Food",
  "Retail & Shopping": "Retail",
  "Healthcare & Medical": "Healthcare",
  "Education & Training": "Education",
  "Professional Services": "Professional",
  "Beauty & Wellness": "Beauty",
  "Home Services": "Home Services",
  "Automotive": "Automotive",
  "Technology & IT": "Tech",
  "Real Estate": "Real Estate",
  "Legal Services": "Legal",
  "Financial Services": "Finance",
  "Logistics & Transport": "Logistics",
  "Events & Entertainment": "Events",
  "Construction & Renovation": "Construction",
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function getIsOpenNow(listing: Listing): boolean | null {
  const hours = listing.operatingHours;
  if (!hours) return null;
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
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

const ListingCard = ({ listing, compact, highlighted, onSelect, onHover, distanceKm }: ListingCardProps) => {
  const navigate = useNavigate();
  const gradient = CATEGORY_COLORS[listing.category] || "from-primary to-accent";
  const isOpen = useMemo(() => getIsOpenNow(listing), [listing]);
  const [liked, setLiked] = useState(false);
  const shortCategory = CATEGORY_SHORT[listing.category] || listing.category;

  const handleClick = () => {
    if (onSelect) onSelect(listing);
    navigate(getBusinessUrl(listing));
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
  };

  return (
    <div
      data-listing-id={listing.id}
      className={`bg-card rounded-xl border border-border p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${highlighted ? "ring-2 ring-primary shadow-lg" : ""}`}
      onClick={handleClick}
      onMouseEnter={() => onHover?.(listing.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Top row: Logo + Name + Heart */}
      <div className="flex items-start gap-3 mb-3">
        {/* Logo / Avatar */}
        <div className="w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-muted">
          {listing.logoUrl ? (
            <img src={listing.logoUrl} alt={listing.name} className="w-full h-full object-cover" />
          ) : listing.coverImage ? (
            <img src={listing.coverImage} alt={listing.name} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <span className="text-lg font-bold text-white/90">{listing.name.charAt(0)}</span>
            </div>
          )}
        </div>

        {/* Name + Category·District */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm truncate">{listing.name}</h3>
          <p className="text-xs text-muted-foreground truncate">{shortCategory} · {listing.district}</p>
        </div>

        {/* Heart */}
        <button onClick={handleLike} className="shrink-0 p-1 hover:bg-muted rounded-lg transition-colors">
          <Heart className={`w-5 h-5 ${liked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
        </button>
      </div>

      {/* Badge pills row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {listing.rating && (
          <Badge variant="outline" className="text-[11px] font-medium px-2 py-0.5 gap-1 rounded-full">
            <Star className="w-3 h-3 text-warning fill-warning" />
            {listing.rating}{listing.reviewCount ? ` (${listing.reviewCount})` : ""}
          </Badge>
        )}
        {listing.verified && (
          <Badge variant="outline" className="text-[11px] font-medium px-2 py-0.5 gap-1 rounded-full text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800">
            ✓ Verified
          </Badge>
        )}
        {listing.priceRange && (
          <Badge variant="outline" className="text-[11px] font-medium px-2 py-0.5 rounded-full">
            {listing.priceRange}
          </Badge>
        )}
        {listing.city && (
          <Badge variant="outline" className="text-[11px] font-medium px-2 py-0.5 rounded-full">
            {listing.city}
          </Badge>
        )}
        {!listing.city && (
          <Badge variant="outline" className="text-[11px] font-medium px-2 py-0.5 rounded-full">
            Singapore
          </Badge>
        )}
        {listing.featured && (
          <Badge className="bg-warning/10 text-warning border-warning/30 text-[11px] font-medium px-2 py-0.5 rounded-full">
            ⭐ Featured
          </Badge>
        )}
        {distanceKm != null && (
          <Badge variant="outline" className="text-[11px] font-medium px-2 py-0.5 gap-1 rounded-full text-primary border-primary/30">
            <MapPin className="w-3 h-3" />
            {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)} km`}
          </Badge>
        )}
      </div>
    </div>
  );
};

export default ListingCard;
