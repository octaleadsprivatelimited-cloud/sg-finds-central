import { Link } from "react-router-dom";
import { Building2, Facebook, Instagram, Twitter, Linkedin, Youtube, Mail, Phone, MapPin, Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative overflow-hidden">
      {/* Gradient top border */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-warning" />
      
      <div className="bg-foreground text-background">
        {/* Main footer */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-2.5 mb-4 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-[hsl(280,85%,55%)] flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                  <Building2 className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">FindLocal.SG</span>
              </Link>
              <p className="text-sm opacity-70 mb-5 leading-relaxed">
                Singapore's trusted business directory. Discover, connect, and grow with local businesses.
              </p>
              <div className="flex items-center gap-2">
                {[
                  { icon: Facebook, href: "#", color: "hover:bg-blue-600" },
                  { icon: Instagram, href: "#", color: "hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-500" },
                  { icon: Twitter, href: "#", color: "hover:bg-sky-500" },
                  { icon: Linkedin, href: "#", color: "hover:bg-blue-700" },
                  { icon: Youtube, href: "#", color: "hover:bg-red-600" },
                ].map(({ icon: Icon, href, color }, i) => (
                  <a
                    key={i}
                    href={href}
                    className={`w-9 h-9 rounded-xl bg-background/10 ${color} hover:text-white flex items-center justify-center transition-all duration-300 hover:scale-110`}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-4 text-primary">Quick Links</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Home", to: "/" },
                  { label: "Add Business", to: "/add-listing" },
                  { label: "Dashboard", to: "/dashboard" },
                  { label: "Admin Panel", to: "/admin" },
                ].map(({ label, to }) => (
                  <li key={to}>
                    <Link to={to} className="text-sm opacity-70 hover:opacity-100 hover:text-accent transition-all duration-200 hover:translate-x-1 inline-block">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-4 text-accent">Top Categories</h4>
              <ul className="space-y-2.5">
                {["Food & Beverage", "Healthcare & Medical", "Home Services", "Technology & IT", "Beauty & Wellness"].map(
                  (cat) => (
                    <li key={cat}>
                      <span className="text-sm opacity-70 hover:opacity-100 hover:text-accent transition-all duration-200 cursor-pointer hover:translate-x-1 inline-block">
                        {cat}
                      </span>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-4 text-warning">Contact Us</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5 text-sm opacity-70">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-accent" />
                  <span>71 Ayer Rajah Crescent, Singapore 139951</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm opacity-70">
                  <Phone className="w-4 h-4 shrink-0 text-success" />
                  <span>+65 6100 0000</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm opacity-70">
                  <Mail className="w-4 h-4 shrink-0 text-info" />
                  <span>hello@findlocal.sg</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-background/10">
          <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs opacity-60 flex items-center gap-1">
              © {new Date().getFullYear()} FindLocal.SG — Made with <Heart className="w-3 h-3 text-destructive fill-destructive" /> in Singapore
            </p>
            <div className="flex items-center gap-4">
              {["Privacy Policy", "Terms of Service", "Sitemap"].map((item) => (
                <span key={item} className="text-xs opacity-60 hover:opacity-100 cursor-pointer transition-opacity hover:text-accent">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
