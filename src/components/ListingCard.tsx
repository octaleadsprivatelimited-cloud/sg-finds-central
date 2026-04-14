import { useMemo, useState } from "react";
import { MapPin, Clock, Heart, Globe, Phone, Navigation, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import VerifiedBadge from "./VerifiedBadge";
import { useNavigate } from "react-router-dom";
import { getBusinessUrl } from "@/lib/url-helpers";
import whatsappLogo from "@/assets/whatsapp-logo.png";
import { getPlaceholderLogo } from "@/lib/placeholder-logos";

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
  city?: string;
  customSlug?: string;
  logoUrl?: string;
  coverImage?: string;
  offers?: ListingOffer[];
  operatingHours?: OperatingHours;
  specialHours?: SpecialHours[];
  priceRange?: string;
  imageUrls?: string[];
  ownerName?: string;
  contactEmail?: string;
  catalogueEnabled?: boolean;
  catalogueItems?: { id: string; title: string; description: string; price: string; image?: string }[];
  pendingLogoUrl?: string;
  pendingImageUrls?: string[];
  subcategoryData?: Record<string, any>;
  subcategoryList?: string[];
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

const CATEGORY_BORDER: Record<string, string> = {
  "Tuition": "border-l-blue-400",
  "Baking": "border-l-amber-400",
  "Music / Art / Craft": "border-l-purple-400",
  "Home Food": "border-l-orange-400",
  "Beauty": "border-l-pink-400",
  "Pet Services": "border-l-emerald-400",
  "Event Services": "border-l-rose-400",
  "Tailoring": "border-l-violet-400",
  "Cleaning": "border-l-sky-400",
  "Handyman": "border-l-yellow-400",
  "Photography / Videography": "border-l-slate-400",
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
  const catBorder = CATEGORY_BORDER[listing.category] || "";
  const isOpen = useMemo(() => getIsOpenNow(listing), [listing]);
  const nextOpenInfo = useMemo(() => (isOpen === false ? getNextOpenInfo(listing) : null), [listing, isOpen]);

  const handleClick = () => {
    if (onSelect) onSelect(listing);
    navigate(getBusinessUrl(listing));
  };

  const handlePhoneClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (listing.phone) window.open(`tel:${listing.phone}`, "_self");
  };

  return (
    <div
      data-listing-id={listing.id}
      className={`rounded-xl bg-card border-2 cursor-pointer transition-all duration-200 ${
        highlighted
          ? "border-primary/40 retro-shadow-primary scale-[1.01]"
          : "border-border/60 retro-shadow-sm"
      } hover:retro-shadow hover:-translate-y-0.5 mb-2 last:mb-0`}
      onClick={handleClick}
      onMouseEnter={() => onHover?.(listing.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* ── MOBILE ── */}
      <div className={`flex gap-3 p-3.5 md:hidden rounded-2xl border-l-[3px] ${catBorder}`}>
        <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-secondary">
          <img
            src={listing.logoUrl || listing.coverImage || getPlaceholderLogo(listing.id || listing.name)}
            alt={listing.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm leading-tight truncate">{listing.name}</h3>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
            {distanceKm != null && (
              <span>{distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`}</span>
            )}
            {isOpen === true && <span className="text-[hsl(var(--success))] font-semibold">• Open</span>}
            {isOpen === false && <span className="text-destructive font-medium">• Closed</span>}
          </div>

          {listing.subcategoryList && listing.subcategoryList.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {listing.subcategoryList.slice(0, 3).map((sub) => (
                <span key={sub} className="px-1.5 py-0.5 rounded-full bg-secondary text-[10px] font-medium text-muted-foreground capitalize">{sub.replace(/-/g, " ")}</span>
              ))}
              {listing.subcategoryList.length > 3 && (
                <span className="px-1.5 py-0.5 rounded-full bg-secondary text-[10px] font-medium text-muted-foreground">+{listing.subcategoryList.length - 3}</span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            {listing.phone && (
              <a
                href={`tel:${listing.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-[11px] font-semibold text-primary-foreground active:scale-95 transition-transform"
              >
                <Phone className="w-3 h-3" />Call
              </a>
            )}
            {(listing.whatsapp || listing.phone) && (
              <a
                href={`https://wa.me/${(listing.whatsapp || listing.phone || "").replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-border text-[11px] font-semibold text-foreground active:scale-95 transition-transform"
              >
                <img src={whatsappLogo} alt="WhatsApp" className="w-4 h-4 rounded-sm" />WhatsApp
              </a>
            )}
            {listing.lat && listing.lng && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${listing.lat},${listing.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-[11px] font-semibold text-foreground active:scale-95 transition-transform"
              >
                <Navigation className="w-3 h-3" />Map
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── DESKTOP ── */}
      <div className="hidden md:block p-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 shrink-0 rounded-xl overflow-hidden bg-secondary flex items-center justify-center">
            <img
              src={listing.logoUrl || listing.coverImage || getPlaceholderLogo(listing.id || listing.name)}
              alt={listing.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{listing.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              <MapPin className="w-3 h-3 inline mr-0.5 -mt-0.5" />
              {listing.district}
              {isOpen === true && <span className="text-[hsl(var(--success))] ml-1.5">• Open</span>}
              {isOpen === false && <span className="text-destructive ml-1.5">• {nextOpenInfo || "Closed"}</span>}
            </p>
          </div>

          {distanceKm != null && (
            <span className="shrink-0 text-xs font-semibold text-primary bg-primary/5 rounded-full px-2.5 py-0.5">
              {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/8 text-primary">{listing.category}</span>
          {listing.subcategoryList && listing.subcategoryList.slice(0, 3).map((sub) => (
            <span key={sub} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-muted-foreground capitalize">{sub.replace(/-/g, " ")}</span>
          ))}
          {listing.subcategoryList && listing.subcategoryList.length > 3 && (
            <span className="text-[11px] font-medium text-muted-foreground">+{listing.subcategoryList.length - 3}</span>
          )}
          {listing.verified && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[hsl(var(--success))]/8 text-[hsl(var(--success))]">✓ Verified</span>
          )}
          {listing.phone && (
            <button onClick={handlePhoneClick} className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
              <Phone className="w-3 h-3" />{listing.phone}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingCard;