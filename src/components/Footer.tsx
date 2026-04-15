import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Linkedin, Mail } from "lucide-react";
import { toSlug } from "@/lib/url-helpers";

const Footer = () => {
  return (
    <footer className="border-t-2 border-foreground/8 bg-secondary/30 retro-dot-bg">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block mb-3">
              <img src={nearbuyLogo} alt="NearBuy" className="h-9 w-auto" />
            </Link>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Singapore's trusted business directory. Discover, connect, and grow with local businesses.
            </p>
            <div className="flex items-center gap-2">
              {[Facebook, Instagram, Twitter, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 rounded-full bg-background hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-all duration-200 text-muted-foreground"
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-xs text-foreground mb-3 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { label: "Home", to: "/" },
                { label: "About Us", to: "/about" },
                { label: "Contact Us", to: "/contact" },
                { label: "Add Business", to: "/add-listing" },
                { label: "Dashboard", to: "/dashboard" },
              ].map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-xs text-foreground mb-3 uppercase tracking-wider">Categories</h4>
            <ul className="space-y-2">
              {["Tuition", "Beauty", "Music / Art / Craft", "Home Food", "Baking", "Pet Services", "Event Services", "Cleaning"].map((cat) => (
                <li key={cat}>
                  <Link to={`/singapore/${toSlug(cat)}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-xs text-foreground mb-3 uppercase tracking-wider">Contact</h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 shrink-0" />
                <span>hello@nearbuy.sg</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-border/60">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Nearbuy.SG. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;