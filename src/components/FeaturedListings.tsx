import { Sparkles, MapPin, Star, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import VerifiedBadge from "./VerifiedBadge";
import type { Listing } from "./ListingCard";
import { useNavigate } from "react-router-dom";
import { getBusinessUrl } from "@/lib/url-helpers";

interface FeaturedListingsProps {
  listings: Listing[];
  compact?: boolean;
}

const CARD_GRADIENTS = [
  "from-violet-500/10 via-purple-500/5 to-blue-500/10",
  "from-rose-500/10 via-pink-500/5 to-orange-500/10",
  "from-emerald-500/10 via-teal-500/5 to-cyan-500/10",
  "from-amber-500/10 via-yellow-500/5 to-orange-500/10",
  "from-blue-500/10 via-indigo-500/5 to-violet-500/10",
];

const ACCENT_COLORS = [
  "bg-violet-500",
  "bg-rose-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-blue-500",
];

const FeaturedListings = ({ listings, compact = false }: FeaturedListingsProps) => {
  const navigate = useNavigate();
  const featured = listings.filter((l) => l.featured);

  if (featured.length === 0) return null;

  return (
    <section className={compact ? "" : "mb-10"}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${compact ? "bg-white/15" : "bg-gradient-to-br from-warning/20 to-orange-500/20"}`}>
          <Sparkles className={`w-3.5 h-3.5 ${compact ? "text-white" : "text-warning"}`} />
        </div>
        <div>
          <h2 className={`${compact ? "text-base text-white" : "text-lg text-foreground"} font-bold`}>Featured Businesses</h2>
          <p className={`text-xs ${compact ? "text-white/70" : "text-muted-foreground"}`}>Handpicked top-rated businesses</p>
        </div>
        <Badge variant="secondary" className={`text-xs ml-auto ${compact ? "bg-white/15 text-white border-white/20" : ""}`}>Sponsored</Badge>
      </div>
      <div className={`grid gap-3 ${compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"}`}>
        {(compact ? featured.slice(0, 4) : featured).map((listing, i) => {
          const gradientBg = CARD_GRADIENTS[i % CARD_GRADIENTS.length];
          const accentColor = ACCENT_COLORS[i % ACCENT_COLORS.length];
          
          return (
            <div
              key={listing.id}
              className={`group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br ${gradientBg} ${compact ? "p-3.5" : "p-5"} cursor-pointer hover-lift`}
              onClick={() => navigate(getBusinessUrl(listing))}
            >
              {/* Decorative accent */}
              <div className={`absolute top-0 right-0 w-20 h-20 ${accentColor} opacity-[0.07] rounded-full -translate-y-1/2 translate-x-1/3`} />
              
              <div className="relative">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`${compact ? "w-9 h-9" : "w-11 h-11"} rounded-xl bg-gradient-to-br ${accentColor.replace('bg-', 'from-')}/20 to-transparent flex items-center justify-center overflow-hidden border border-border/30`}>
                    {listing.logoUrl ? (
                      <img src={listing.logoUrl} alt={listing.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className={`${compact ? "text-base" : "text-lg"} font-bold text-primary`}>{listing.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-foreground truncate text-sm group-hover:text-primary transition-colors">{listing.name}</h3>
                      {listing.verified && <VerifiedBadge size="sm" />}
                    </div>
                    <Badge variant="secondary" className="text-[10px] mt-0.5">{listing.category}</Badge>
                  </div>
                </div>
                {!compact && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                    <MapPin className="w-3 h-3 shrink-0 text-accent" />
                    <span className="truncate">{listing.district}</span>
                  </div>
                )}
                {!compact && listing.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{listing.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                    <span className="text-xs font-semibold text-foreground">
                      {listing.rating?.toFixed(1) || "4.8"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({listing.reviewCount || 24})
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    View <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FeaturedListings;
