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
  "Tuition": "from-blue-500 to-indigo-600",
  "Baking": "from-amber-400 to-orange-500",
  "Music / Art / Craft": "from-purple-500 to-pink-600",
  "Home Food": "from-orange-500 to-red-500",
  "Beauty": "from-pink-500 to-rose-600",
  "Pet Services": "from-emerald-500 to-teal-600",
  "Event Services": "from-rose-500 to-pink-700",
  "Tailoring": "from-violet-500 to-purple-700",
  "Cleaning": "from-sky-500 to-blue-600",
  "Handyman": "from-amber-500 to-orange-600",
  "Photography / Videography": "from-slate-500 to-slate-700",
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
      className={`bg-card rounded-lg border border-border p-4 cursor-pointer transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] ${
        highlighted ? "ring-2 ring-primary shadow-[var(--shadow-card-hover)]" : "shadow-[var(--shadow-card)]"
      }`}
      onClick={handleClick}
      onMouseEnter={() => onHover?.(listing.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="flex gap-4">
        {/* Left: Image */}
        <div className="w-[140px] h-[130px] md:w-[200px] md:h-[160px] shrink-0 rounded-md overflow-hidden bg-muted">
          {listing.logoUrl ? (
            <img src={listing.logoUrl} alt={listing.name} className="w-full h-full object-cover" />
          ) : listing.coverImage ? (
            <img src={listing.coverImage} alt={listing.name} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <span className="text-3xl md:text-4xl font-bold text-white/90">{listing.name.charAt(0)}</span>
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-bold text-foreground text-base md:text-lg leading-tight">
            {index !== undefined && <span className="text-muted-foreground mr-1.5">{index}.</span>}
            <span className="text-primary hover:underline">{listing.name}</span>
          </h3>

          {/* Location + Open status */}
          <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{listing.district}</span>
            {listing.priceRange && (
              <>
                <span>•</span>
                <span>{listing.priceRange}</span>
              </>
            )}
            {isOpen === true && (
              <>
                <span>•</span>
                <span className="text-[hsl(var(--success))] font-semibold">Open</span>
              </>
            )}
            {isOpen === false && (
              <>
                <span>•</span>
                <span className="text-destructive font-medium">{nextOpenInfo || "Closed"}</span>
              </>
            )}
          </div>

          {/* Distance */}
          {distanceKm != null && (
            <p className="text-xs text-muted-foreground mt-1">
              {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m away` : `${distanceKm.toFixed(1)} km away`}
            </p>
          )}

          {/* Description */}
          {listing.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
              {listing.description}
            </p>
          )}

          {/* Tags */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md border border-border text-xs font-medium text-foreground bg-secondary">
              {listing.category}
            </span>
            {listing.verified && (
              <span className="px-2.5 py-0.5 rounded-md border border-[hsl(var(--success))]/30 text-xs font-medium text-[hsl(var(--success))] bg-[hsl(var(--success))]/10">
                ✓ Verified
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3">
              {listing.website && (
                <button onClick={handleWebsiteClick} className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />Website
                </button>
              )}
              {listing.phone && (
                <button onClick={handlePhoneClick} className="text-sm font-medium text-foreground hover:text-primary flex items-center gap-1 transition-colors">
                  <Phone className="w-3.5 h-3.5" />{listing.phone}
                </button>
              )}
            </div>
            {listing.lat && listing.lng && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${listing.lat},${listing.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                <Navigation className="w-3.5 h-3.5" />
                Get Directions
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
