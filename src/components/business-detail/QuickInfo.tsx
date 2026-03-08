import { Building2 } from "lucide-react";

interface QuickInfoProps {
  listing: {
    name: string;
    uen: string;
    description?: string;
    category: string;
  };
}

const QuickInfo = ({ listing }: QuickInfoProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Quick Information</h3>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Business Summary</p>
            <p className="text-sm text-foreground leading-relaxed">{listing.description || "No description available."}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Category</p>
              <p className="text-sm font-medium text-foreground">{listing.category}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">UEN</p>
              <p className="text-sm font-medium text-foreground">{listing.uen}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickInfo;
