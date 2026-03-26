import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CatalogueItem {
  id: string;
  title: string;
  description: string;
  price: string;
}

const DEMO_CATALOGUE: CatalogueItem[] = [
  {
    id: "c1",
    title: "Premium Consultation Package",
    description: "Comprehensive consultation with detailed report and follow-up...",
    price: "$150 onwards",
  },
  {
    id: "c2",
    title: "Standard Service Package",
    description: "Our most popular package for regular clients and new customers...",
    price: "$80 onwards",
  },
  {
    id: "c3",
    title: "Basic Service Package",
    description: "Essential services designed for budget-conscious customers...",
    price: "$50 onwards",
  },
];

interface CatalogueSectionProps {
  items?: CatalogueItem[];
  whatsappNumber?: string;
  businessName?: string;
}

const CatalogueSection = ({ items, whatsappNumber, businessName }: CatalogueSectionProps) => {
  const catalogue = items && items.length > 0 ? items : DEMO_CATALOGUE;

  const handleEnquire = (item: CatalogueItem) => {
    const sanitized = (whatsappNumber || "").replace(/[^0-9+]/g, "");
    const message = `Hi${businessName ? ` ${businessName}` : ""},\n\nI'm interested in:\n📦 *${item.title}*\n💰 ${item.price}\n\nCould you share more details?\n\nThank you!`;
    const url = `https://wa.me/${sanitized}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Catalogue</h3>
        <Button variant="link" className="text-primary text-sm p-0 h-auto">View all</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {catalogue.map((item) => (
          <div key={item.id} className="border border-border rounded-xl p-4 space-y-3 hover:shadow-md transition-shadow bg-card">
            <h4 className="font-semibold text-foreground text-sm line-clamp-2">{item.title}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
            <p className="text-sm font-semibold text-foreground">{item.price}</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950"
              onClick={() => handleEnquire(item)}
            >
              <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
              Enquire Now
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CatalogueSection;
