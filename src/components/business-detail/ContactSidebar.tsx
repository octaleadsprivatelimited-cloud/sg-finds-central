import { Phone, Mail, Globe, MapPin, Building2, ExternalLink, Copy, Navigation, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ContactSidebarProps {
  listing: {
    phone?: string;
    email?: string;
    website?: string;
    address: string;
    uen: string;
    whatsapp?: string;
    contactDetails?: {
      whatsapp?: string;
      whatsappMessage?: string;
    };
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

  const whatsappNumber = listing.contactDetails?.whatsapp || listing.whatsapp;
  const whatsappMessage = listing.contactDetails?.whatsappMessage || "";

  const openWhatsApp = () => {
    if (!whatsappNumber) return;
    const cleaned = whatsappNumber.replace(/[^0-9]/g, "");
    const msgParam = whatsappMessage ? `&text=${encodeURIComponent(whatsappMessage)}` : "";
    window.open(`https://wa.me/${cleaned}?${msgParam}`, "_blank");
  };

  return (
    <div className="space-y-4">
      {/* Contact Card */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
        <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">Contact</h3>
        <div className="space-y-4">
          {listing.phone && (
            <a href={`tel:${listing.phone}`} className="flex items-center gap-3.5 group">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                <Phone className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{listing.phone}</span>
            </a>
          )}
          {whatsappNumber && (
            <button onClick={openWhatsApp} className="flex items-center gap-3.5 group w-full text-left">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                <MessageCircle className="w-4 h-4 text-emerald-600 group-hover:text-emerald-700 transition-colors" />
              </div>
              <span className="text-sm font-medium text-emerald-600 group-hover:text-emerald-700 transition-colors">WhatsApp</span>
            </button>
          )}
          {listing.email && (
            <a href={`mailto:${listing.email}`} className="flex items-center gap-3.5 group">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                <Mail className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Send Enquiry</span>
            </a>
          )}
          {listing.website && (
            <a href={listing.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3.5 group">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                <Globe className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                {listing.website.replace(/https?:\/\/(www\.)?/, "")}
              </span>
              <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
            </a>
          )}
        </div>
      </div>

      {/* Address Card */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
        <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">Address</h3>
        <p className="text-sm text-foreground leading-relaxed">{listing.address}</p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-full gap-2 text-xs font-semibold px-4 hover:bg-secondary"
            onClick={getDirections}
          >
            <Navigation className="w-3.5 h-3.5" />
            Directions
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-full gap-2 text-xs font-semibold px-4 hover:bg-secondary"
            onClick={copyAddress}
          >
            <Copy className="w-3.5 h-3.5" />
            Copy
          </Button>
        </div>
      </div>

      {/* UEN Card */}
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">UEN Registration</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{listing.uen}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSidebar;
