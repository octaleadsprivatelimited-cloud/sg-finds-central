import { Phone, Mail, Globe, MapPin, Building2, ExternalLink, Copy, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ContactSidebarProps {
  listing: {
    phone?: string;
    email?: string;
    website?: string;
    address: string;
    uen: string;
  };
}

const ContactSidebar = ({ listing }: ContactSidebarProps) => {
  const copyAddress = () => {
    navigator.clipboard.writeText(listing.address);
    toast.success("Address copied!");
  };

  const getDirections = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.address)}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Contact */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="font-semibold text-foreground">Contact</h3>
        <div className="space-y-3 text-sm">
          {listing.phone && (
            <a href={`tel:${listing.phone}`} className="flex items-center gap-3 text-primary hover:underline font-medium">
              <Phone className="w-4 h-4 shrink-0" />
              {listing.phone}
            </a>
          )}
          {listing.email && (
            <a href={`mailto:${listing.email}`} className="flex items-center gap-3 text-primary hover:underline">
              <Mail className="w-4 h-4 shrink-0" />
              Send Enquiry by Email
            </a>
          )}
          {listing.website && (
            <a href={listing.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-primary hover:underline">
              <Globe className="w-4 h-4 shrink-0" />
              {listing.website.replace(/https?:\/\//, "")}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="font-semibold text-foreground">Address</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{listing.address}</p>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2 text-primary" onClick={getDirections}>
            <Navigation className="w-3.5 h-3.5" />
            Get Directions
          </Button>
          <Button variant="outline" size="sm" className="gap-2 text-primary" onClick={copyAddress}>
            <Copy className="w-3.5 h-3.5" />
            Copy
          </Button>
        </div>
      </div>

      {/* UEN */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="w-4 h-4" />
          <span>UEN: {listing.uen}</span>
        </div>
      </div>
    </div>
  );
};

export default ContactSidebar;
