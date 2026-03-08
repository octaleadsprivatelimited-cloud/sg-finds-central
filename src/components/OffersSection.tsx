import { Tag, Clock, Percent, Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface Offer {
  id: string;
  title: string;
  description: string;
  discount: string;
  validUntil: string;
  code?: string;
}

interface OffersSectionProps {
  offers: Offer[];
}

const DEMO_OFFERS: Offer[] = [
  {
    id: "o1",
    title: "Grand Opening Special",
    description: "Enjoy special discounts on all services for the month of March.",
    discount: "20% OFF",
    validUntil: "2026-03-31",
    code: "OPEN20",
  },
  {
    id: "o2",
    title: "Refer a Friend",
    description: "Get $10 credit when you refer a friend who makes a purchase.",
    discount: "$10 Credit",
    validUntil: "2026-06-30",
  },
];

const OffersSection = ({ offers: propOffers }: OffersSectionProps) => {
  const offers = propOffers.length > 0 ? propOffers : DEMO_OFFERS;

  return (
    <div className="space-y-3">
      {offers.map((offer) => (
        <div
          key={offer.id}
          className="relative overflow-hidden rounded-xl border border-primary/20 bg-primary/5 p-4"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Gift className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{offer.title}</h4>
                  <p className="text-xs text-muted-foreground">{offer.description}</p>
                </div>
              </div>
              <Badge className="bg-primary text-primary-foreground shrink-0 font-bold">
                {offer.discount}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Valid until {offer.validUntil}
              </span>
              {offer.code && (
                <span className="flex items-center gap-1 font-mono bg-background px-2 py-0.5 rounded border border-border">
                  <Tag className="w-3 h-3" />
                  {offer.code}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OffersSection;
