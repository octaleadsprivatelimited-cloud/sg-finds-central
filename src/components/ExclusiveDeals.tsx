import { Gift, Clock, Tag, ArrowRight, Percent } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { getBusinessUrl } from "@/lib/url-helpers";
import type { Listing } from "./ListingCard";

interface ExclusiveDealsProps {
  listings: Listing[];
}

const ExclusiveDeals = ({ listings }: ExclusiveDealsProps) => {
  const navigate = useNavigate();
  const now = new Date().toISOString().split("T")[0];

  // Get listings that have active (non-expired) offers
  const dealsListings = listings.filter(
    (l) =>
      l.offers &&
      l.offers.length > 0 &&
      l.offers.some((o) => !o.validUntil || o.validUntil >= now)
  );

  if (dealsListings.length === 0) return null;

  return (
    <section className="mb-6 md:mb-10">
      <div className="flex items-center gap-2 md:gap-2.5 mb-3 md:mb-5">
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
          <Percent className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-base md:text-lg font-bold text-foreground">Exclusive Deals This Week</h2>
          <p className="text-[10px] md:text-xs text-muted-foreground">Special offers from top businesses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-4">
        {dealsListings.slice(0, 6).map((listing) => {
          const activeOffers = listing.offers!.filter(
            (o) => !o.validUntil || o.validUntil >= now
          );
          const topOffer = activeOffers[0];

          return (
            <div
              key={listing.id}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
              onClick={() => navigate(getBusinessUrl(listing))}
            >
              {/* Decorative */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/3" />

              <div className="relative">
                {/* Business info */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center overflow-hidden border border-border/30">
                    {listing.logoUrl ? (
                      <img src={listing.logoUrl} alt={listing.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-base font-bold text-primary">{listing.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate text-sm group-hover:text-primary transition-colors">
                      {listing.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{listing.category}</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-transparent font-bold shrink-0">
                    {topOffer.discount}
                  </Badge>
                </div>

                {/* Offer details */}
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Gift className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-sm font-medium text-foreground">{topOffer.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{topOffer.description}</p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    {topOffer.validUntil && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Until {topOffer.validUntil}
                      </span>
                    )}
                    {topOffer.code && (
                      <span className="flex items-center gap-1 font-mono bg-background px-2 py-0.5 rounded border border-border">
                        <Tag className="w-3 h-3" />
                        {topOffer.code}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    View <ArrowRight className="w-3 h-3" />
                  </div>
                </div>

                {activeOffers.length > 1 && (
                  <p className="text-xs text-emerald-600 mt-2 font-medium">
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
