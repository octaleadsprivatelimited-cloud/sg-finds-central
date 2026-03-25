import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Linkedin, Mail, Phone, MapPin, Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      {/* Main footer */}
      <div className="container mx-auto px-3 md:px-4 py-6 md:py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <span className="text-xl font-extrabold tracking-tight text-foreground uppercase">
                NEAR<span className="text-primary">BUY</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
Singapore's trusted business directory. Discover, connect, and grow with local businesses.
            </p>
            <div className="flex items-center gap-2">
              {[Facebook, Instagram, Twitter, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-lg border border-border bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary flex items-center justify-center transition-all duration-200 text-muted-foreground"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { label: "Home", to: "/" },
                { label: "About Us", to: "/about" },
                { label: "Contact Us", to: "/contact" },
                { label: "Add Business", to: "/add-listing" },
                { label: "Dashboard", to: "/dashboard" },
              ].map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-4">Top Categories</h4>
            <ul className="space-y-2.5">
              {["Food & Beverage", "Healthcare & Medical", "Home Services", "Technology & IT", "Beauty & Wellness"].map(
                (cat) => (
                  <li key={cat}>
                    <span className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                      {cat}
                    </span>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                <span>71 Ayer Rajah Crescent, Singapore 139951</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 shrink-0 text-primary" />
                <span>+65 6100 0000</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 shrink-0 text-primary" />
                <span>hello@nearbuy.sg</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            © {new Date().getFullYear()} Nearbuy.SG — Made with <Heart className="w-3 h-3 text-destructive fill-destructive" /> in Singapore
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
