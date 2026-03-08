import { Link } from "react-router-dom";
import { Building2, Facebook, Instagram, Twitter, Linkedin, Youtube, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      {/* Main footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Building2 className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">FindLocal.SG</span>
            </Link>
            <p className="text-sm opacity-70 mb-4 leading-relaxed">
              Singapore's trusted business directory. Discover, connect, and grow with local businesses.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: Facebook, href: "#" },
                { icon: Instagram, href: "#" },
                { icon: Twitter, href: "#" },
                { icon: Linkedin, href: "#" },
                { icon: Youtube, href: "#" },
              ].map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-8 h-8 rounded-full bg-background/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors"
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 opacity-90">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { label: "Home", to: "/" },
                { label: "Add Business", to: "/add-listing" },
                { label: "Dashboard", to: "/dashboard" },
                { label: "Admin Panel", to: "/admin" },
              ].map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="text-sm opacity-70 hover:opacity-100 hover:text-primary transition-all">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 opacity-90">Top Categories</h4>
            <ul className="space-y-2.5">
              {["Food & Beverage", "Healthcare & Medical", "Home Services", "Technology & IT", "Beauty & Wellness"].map(
                (cat) => (
                  <li key={cat}>
                    <span className="text-sm opacity-70 hover:opacity-100 hover:text-primary transition-all cursor-pointer">
                      {cat}
                    </span>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 opacity-90">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm opacity-70">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <span>71 Ayer Rajah Crescent, Singapore 139951</span>
              </li>
              <li className="flex items-center gap-2 text-sm opacity-70">
                <Phone className="w-4 h-4 shrink-0" />
                <span>+65 6100 0000</span>
              </li>
              <li className="flex items-center gap-2 text-sm opacity-70">
                <Mail className="w-4 h-4 shrink-0" />
                <span>hello@findlocal.sg</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-background/10">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs opacity-60">© {new Date().getFullYear()} FindLocal.SG. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {["Privacy Policy", "Terms of Service", "Sitemap"].map((item) => (
              <span key={item} className="text-xs opacity-60 hover:opacity-100 cursor-pointer transition-opacity">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
