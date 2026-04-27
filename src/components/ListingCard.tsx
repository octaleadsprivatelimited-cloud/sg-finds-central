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
  ownerEmail?: string;
  contactEmail?: string;
  contactDetails?: {
    whatsapp?: string;
    whatsappMessage?: string;
    instagram?: string;
    website?: string;
    secondary?: { method: string; value: string } | null;
  };
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

  const displayPhone = listing.phone || listing.whatsapp || listing.contactDetails?.whatsapp;

  return (
    <div
      data-listing-id={listing.id}
      className={`group relative rounded-2xl bg-white border cursor-pointer transition-all duration-300 overflow-hidden ${
        highlighted
          ? "border-primary/40 shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.15)]"
          : "border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      } hover:border-primary/30 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 mb-3 last:mb-0`}
      onClick={handleClick}
      onMouseEnter={() => onHover?.(listing.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Soft gradient accent strip */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient} opacity-60`} />

      {/* ── MOBILE ── */}
      <div className="flex gap-2.5 p-2.5 md:hidden">
        <div className="w-11 h-11 shrink-0 rounded-xl overflow-hidden bg-secondary/50 ring-1 ring-border/40">
          <img
            src={listing.logoUrl || listing.coverImage || getPlaceholderLogo(listing.id || listing.name)}
            alt={listing.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground text-[13px] leading-tight truncate">{listing.name}</h3>
            {listing.verified && <span className="text-[10px] shrink-0">✓</span>}
          </div>
          <div className="flex items-center gap-1 mt-0.5 text-[11px] text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{listing.district}</span>
            {distanceKm != null && (
              <span className="text-muted-foreground/60">· {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`}</span>
            )}
            {isOpen === true && <span className="ml-auto text-[9px] font-semibold text-[hsl(var(--success))] bg-[hsl(var(--success))]/10 px-1.5 py-0.5 rounded-full">Open</span>}
            {isOpen === false && <span className="ml-auto text-[9px] font-semibold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">Closed</span>}
          </div>
        </div>
      </div>

      {/* ── DESKTOP ── */}
      <div className="hidden md:block px-5 py-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 shrink-0 rounded-2xl overflow-hidden bg-secondary/50 ring-1 ring-border/40">
            <img
              src={listing.logoUrl || listing.coverImage || getPlaceholderLogo(listing.id || listing.name)}
              alt={listing.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[15px] text-foreground truncate">{listing.name}</h3>
              {listing.verified && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] text-[10px] font-bold">✓</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span>{listing.district}</span>
              {distanceKm != null && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="font-medium">{distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2.5">
              <span className="inline-flex items-center text-xs font-semibold text-primary">
                {listing.category}
              </span>
              {isOpen === true && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[hsl(var(--success))]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))]" />Open now
                </span>
              )}
              {isOpen === false && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive/70" />{nextOpenInfo || "Closed"}
                </span>
              )}
            </div>
          </div>

          {displayPhone && (
            <button
              onClick={handlePhoneClick}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 hover:bg-primary/10 text-xs font-semibold text-primary transition-all"
            >
              <Phone className="w-3.5 h-3.5" />{displayPhone}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingCard;