import { Sparkles, MapPin, Star, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import VerifiedBadge from "./VerifiedBadge";
import type { Listing } from "./ListingCard";
import { useNavigate } from "react-router-dom";
import { getBusinessUrl } from "@/lib/url-helpers";

interface FeaturedListingsProps {
  listings: Listing[];
}

const FeaturedListings = ({ listings }: FeaturedListingsProps) => {
  const navigate = useNavigate();
  const featured = listings.filter((l) => l.featured);

  if (featured.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-warning" />
        <h2 className="text-lg font-semibold text-foreground">Featured Businesses</h2>
        <Badge variant="secondary" className="text-xs">Sponsored</Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {featured.map((listing) => {
          return (
            <div
              key={listing.id}
              className="group relative overflow-hidden rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background p-5 cursor-pointer hover-lift"
              onClick={() => navigate(getBusinessUrl(listing))}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">{listing.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-foreground truncate text-sm">{listing.name}</h3>
                      {listing.verified && <VerifiedBadge size="sm" />}
                    </div>
                    <Badge variant="secondary" className="text-xs mt-0.5">{listing.category}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{listing.district}</span>
                </div>
                {listing.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{listing.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                    <span className="text-xs font-medium text-foreground">
                      {listing.rating?.toFixed(1) || "4.8"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({listing.reviewCount || 24})
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
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
