import { Gift, Clock, Tag, ArrowRight, Percent, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { getBusinessUrl } from "@/lib/url-helpers";
import type { Listing } from "./ListingCard";

interface ExclusiveDealsProps {
  listings: Listing[];
}

const dealColors = [
  { bg: "from-rose-500/15 to-pink-500/10", accent: "text-rose-600 dark:text-rose-400", badge: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400", icon: "text-rose-500", glow: "bg-rose-500/10" },
  { bg: "from-violet-500/15 to-purple-500/10", accent: "text-violet-600 dark:text-violet-400", badge: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400", icon: "text-violet-500", glow: "bg-violet-500/10" },
  { bg: "from-amber-500/15 to-orange-500/10", accent: "text-amber-600 dark:text-amber-400", badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400", icon: "text-amber-500", glow: "bg-amber-500/10" },
  { bg: "from-cyan-500/15 to-teal-500/10", accent: "text-cyan-600 dark:text-cyan-400", badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400", icon: "text-cyan-500", glow: "bg-cyan-500/10" },
  { bg: "from-emerald-500/15 to-green-500/10", accent: "text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400", icon: "text-emerald-500", glow: "bg-emerald-500/10" },
  { bg: "from-blue-500/15 to-indigo-500/10", accent: "text-blue-600 dark:text-blue-400", badge: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400", icon: "text-blue-500", glow: "bg-blue-500/10" },
];

const ExclusiveDeals = ({ listings }: ExclusiveDealsProps) => {
  const navigate = useNavigate();
  const now = new Date().toISOString().split("T")[0];

  const dealsListings = listings.filter(
    (l) =>
      l.offers &&
      l.offers.length > 0 &&
      l.offers.some((o) => !o.validUntil || o.validUntil >= now)
  );

  if (dealsListings.length === 0) return null;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const displayCount = isMobile ? 3 : 6;

  return (
    <section className="mb-4 md:mb-10">
      <div className="flex items-center gap-2 mb-2.5 md:mb-5">
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-rose-500/20 flex items-center justify-center">
          <Flame className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-500" />
        </div>
        <div>
          <h2 className="text-sm md:text-lg font-bold text-foreground">Exclusive Deals This Week</h2>
          <p className="text-[10px] md:text-xs text-muted-foreground">Limited-time offers from top businesses</p>
        </div>
      </div>

      {/* Mobile: horizontal scroll cards | Desktop: grid */}
      <div className="flex md:hidden gap-2.5 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-none">
        {dealsListings.slice(0, displayCount).map((listing, i) => {
          const color = dealColors[i % dealColors.length];
          const activeOffers = listing.offers!.filter((o) => !o.validUntil || o.validUntil >= now);
          const topOffer = activeOffers[0];

          return (
            <div
              key={listing.id}
              className={`snap-start shrink-0 w-[72vw] relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br ${color.bg} p-3 cursor-pointer active:scale-[0.98] transition-transform`}
              onClick={() => navigate(getBusinessUrl(listing))}
            >
              <div className={`absolute top-0 right-0 w-16 h-16 ${color.glow} rounded-full -translate-y-1/2 translate-x-1/3 blur-xl`} />
              
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-background/80 flex items-center justify-center overflow-hidden border border-border/30 shadow-sm">
                    {listing.logoUrl ? (
                      <img src={listing.logoUrl} alt={listing.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className={`text-sm font-bold ${color.accent}`}>{listing.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate text-xs">{listing.name}</h3>
                    <p className="text-[10px] text-muted-foreground">{listing.category}</p>
                  </div>
                  <Badge className={`${color.badge} border-transparent font-bold text-[10px] px-2 py-0.5`}>
                    {topOffer.discount}
                  </Badge>
                </div>

                <div className="bg-background/60 backdrop-blur-sm rounded-lg p-2 mb-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Gift className={`w-3 h-3 ${color.icon}`} />
                    <span className="text-xs font-medium text-foreground truncate">{topOffer.title}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{topOffer.description}</p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-2">
                    {topOffer.validUntil && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {topOffer.validUntil}
                      </span>
                    )}
                    {topOffer.code && (
                      <span className="font-mono bg-background/80 px-1.5 py-0.5 rounded text-[9px] border border-border/50">
                        {topOffer.code}
                      </span>
                    )}
                  </div>
                  <span className={`${color.accent} font-medium flex items-center gap-0.5`}>
                    View <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop grid */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
        {dealsListings.slice(0, 6).map((listing, i) => {
          const color = dealColors[i % dealColors.length];
          const activeOffers = listing.offers!.filter((o) => !o.validUntil || o.validUntil >= now);
          const topOffer = activeOffers[0];

          return (
            <div
              key={listing.id}
              className={`group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br ${color.bg} p-5 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all duration-200`}
              onClick={() => navigate(getBusinessUrl(listing))}
            >
              <div className={`absolute top-0 right-0 w-24 h-24 ${color.glow} rounded-full -translate-y-1/2 translate-x-1/3 blur-xl`} />

              <div className="relative">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-background/80 flex items-center justify-center overflow-hidden border border-border/30 shadow-sm">
                    {listing.logoUrl ? (
                      <img src={listing.logoUrl} alt={listing.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className={`text-base font-bold ${color.accent}`}>{listing.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate text-sm group-hover:text-primary transition-colors">
                      {listing.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{listing.category}</p>
                  </div>
                  <Badge className={`${color.badge} border-transparent font-bold shrink-0`}>
                    {topOffer.discount}
                  </Badge>
                </div>

                <div className="bg-background/60 backdrop-blur-sm rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Gift className={`w-3.5 h-3.5 ${color.icon}`} />
                    <span className="text-sm font-medium text-foreground">{topOffer.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{topOffer.description}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    {topOffer.validUntil && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Until {topOffer.validUntil}
                      </span>
                    )}
                    {topOffer.code && (
                      <span className="flex items-center gap-1 font-mono bg-background/80 px-2 py-0.5 rounded border border-border/50">
                        <Tag className="w-3 h-3" />
                        {topOffer.code}
                      </span>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 ${color.accent} font-medium opacity-0 group-hover:opacity-100 transition-opacity`}>
                    View <ArrowRight className="w-3 h-3" />
                  </div>
                </div>

                {activeOffers.length > 1 && (
                  <p className={`text-xs ${color.accent} mt-2 font-medium`}>
                    +{activeOffers.length - 1} more offer{activeOffers.length > 2 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ExclusiveDeals;
