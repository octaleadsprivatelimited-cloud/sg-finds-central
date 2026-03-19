import { useMemo, useState } from "react";
import { MapPin, Clock, Heart, Globe, Phone, Navigation } from "lucide-react";
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
  index?: number;
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

function formatTime12(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${ampm}` : `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function getNextOpenInfo(listing: Listing): string | null {
  const hours = listing.operatingHours;
  if (!hours) return null;
  const now = new Date();
  const currentDayIndex = now.getDay();
  const todayName = DAYS[currentDayIndex];
  const todayHours = hours[todayName];
  if (todayHours && !todayHours.closed && todayHours.open) {
    const [oh, om] = todayHours.open.split(":").map(Number);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    if (nowMin < oh * 60 + om) {
      return `Opens today at ${formatTime12(todayHours.open)}`;
    }
  }
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (currentDayIndex + i) % 7;
    const dayName = DAYS[nextDayIndex];
    const dayHours = hours[dayName];
    if (dayHours && !dayHours.closed && dayHours.open) {
      const label = i === 1 ? "tomorrow" : dayName;
      return `Opens ${label} at ${formatTime12(dayHours.open)}`;
    }
  }
  return null;
}

const ListingCard = ({ listing, compact, highlighted, onSelect, onHover, distanceKm, index }: ListingCardProps) => {
  const navigate = useNavigate();
  const gradient = CATEGORY_COLORS[listing.category] || "from-primary to-accent";
  const isOpen = useMemo(() => getIsOpenNow(listing), [listing]);
  const nextOpenInfo = useMemo(() => (isOpen === false ? getNextOpenInfo(listing) : null), [listing, isOpen]);

  const handleClick = () => {
    if (onSelect) onSelect(listing);
    navigate(getBusinessUrl(listing));
  };

  const handleWebsiteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (listing.website) window.open(listing.website, "_blank");
  };

  const handlePhoneClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (listing.phone) window.open(`tel:${listing.phone}`, "_self");
  };

  return (
    <div
      data-listing-id={listing.id}
      className={`bg-card border border-border p-4 md:p-5 cursor-pointer transition-all duration-200 hover:bg-accent/5 ${highlighted ? "ring-2 ring-primary bg-primary/5" : ""}`}
      onClick={handleClick}
      onMouseEnter={() => onHover?.(listing.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="flex gap-4">
        {/* Left: Image */}
        <div className="w-[100px] h-[100px] md:w-[130px] md:h-[110px] shrink-0 rounded-lg overflow-hidden bg-muted border border-border">
          {listing.logoUrl ? (
            <img src={listing.logoUrl} alt={listing.name} className="w-full h-full object-cover" />
          ) : listing.coverImage ? (
            <img src={listing.coverImage} alt={listing.name} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <span className="text-2xl md:text-3xl font-bold text-white/90">{listing.name.charAt(0)}</span>
            </div>
          )}
        </div>

        {/* Middle: Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-primary text-sm md:text-base hover:underline truncate">
                {index !== undefined && <span className="text-muted-foreground mr-1">{index}.</span>}
                {listing.name}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{listing.category}</p>
            </div>

            {/* Right: Phone & Address */}
            <div className="hidden sm:flex flex-col items-end shrink-0 gap-1">
              {listing.phone && (
                <button
                  onClick={handlePhoneClick}
                  className="text-sm md:text-base font-bold text-foreground hover:text-primary transition-colors"
                >
                  {listing.phone}
                </button>
              )}
              <p className="text-[11px] md:text-xs text-muted-foreground text-right max-w-[180px]">
                {listing.address}
              </p>
              {isOpen === true && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <Clock className="w-3 h-3" />
                  OPEN NOW
                </span>
              )}
              {isOpen === false && (
                <span className="flex items-center gap-1 text-[11px] text-destructive">
                  <Clock className="w-3 h-3" />
                  {nextOpenInfo || "Closed"}
                </span>
              )}
            </div>
          </div>

          {/* Action links */}
          <div className="flex items-center gap-3 mt-2">
            {listing.website && (
              <button onClick={handleWebsiteClick} className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                <Globe className="w-3 h-3" />Website
              </button>
            )}
            <button onClick={handleClick} className="text-xs font-medium text-primary hover:underline">
              More Info
            </button>
          </div>

          {/* Description */}
          {listing.description && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {listing.description}
            </p>
          )}

          {/* Badge row */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {listing.verified && (
              <span className="inline-flex items-center gap-1 text-[10px] md:text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                ✓ Verified
              </span>
            )}
            {distanceKm != null && (
              <span className="inline-flex items-center gap-1 text-[10px] md:text-[11px] font-medium text-primary">
                <MapPin className="w-3 h-3" />
                {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)} km`}
              </span>
            )}
            {listing.priceRange && (
              <span className="text-[10px] md:text-[11px] text-muted-foreground">{listing.priceRange}</span>
            )}
          </div>

          {/* Mobile: phone & status */}
          <div className="flex items-center gap-3 mt-2 sm:hidden">
            {listing.phone && (
              <button onClick={handlePhoneClick} className="text-xs font-bold text-foreground flex items-center gap-1">
                <Phone className="w-3 h-3" />{listing.phone}
              </button>
            )}
            {isOpen === true && (
              <span className="text-[11px] font-semibold text-emerald-600">OPEN NOW</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
