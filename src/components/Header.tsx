import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Plus, Menu, X, LogOut, Shield, LayoutDashboard,
  MapPin, User, Search, ChevronDown,
} from "lucide-react";
import { SINGAPORE_DISTRICTS } from "@/lib/districts";
import { useSearch } from "@/contexts/SearchContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import AuthModal from "./AuthModal";
import SearchWithSuggestions from "./SearchWithSuggestions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  showMap?: boolean;
  onToggleMap?: () => void;
  onDetectLocation?: () => void;
}

const Header = ({ showMap, onToggleMap, onDetectLocation }: HeaderProps) => {
  const { user, isAdmin, isSuperAdmin, isDevMode, devLogout, role } = useAuth();
  const { onDistrictSelect } = useSearch();
  const location = useLocation();
  const [showAuth, setShowAuth] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState("All Districts");
  const [locationOpen, setLocationOpen] = useState(false);

  const handleDistrictSelect = (d: string) => {
    setSelectedDistrict(d);
    setLocationOpen(false);
    if (onDistrictSelect) onDistrictSelect(d);
  };

  const handleSignOut = async () => {
    if (isDevMode) { devLogout(); return; }
    await signOut(auth);
  };

  return (
    <>

      {/* ═══ MAIN HEADER — Apple frosted glass ═══ */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl backdrop-saturate-150 border-b-2 border-foreground/8">
        <div className="container mx-auto px-4 h-14 flex items-center gap-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-extrabold tracking-tighter text-foreground uppercase" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Near<span className="text-primary border-b-2 border-primary pb-0.5">Buy</span>
            </span>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex items-center gap-2 ml-6 flex-1 max-w-md">
            <div className="flex-1 relative flex items-center h-9 rounded-lg bg-card border-2 border-border/60 hover:border-foreground/15 transition-colors">
              <Search className="w-3.5 h-3.5 text-muted-foreground ml-3 shrink-0" />
              <SearchWithSuggestions
                placeholder="Search businesses or postal code..."
                className="flex-1"
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-2 ml-auto">
            <Link to="/add-listing">
              <Button size="sm" className="h-8 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-4 uppercase tracking-wide border-2 border-primary retro-shadow-sm hover:retro-shadow transition-all">
                <Plus className="w-3.5 h-3.5 mr-1" />List Free
              </Button>
            </Link>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 rounded-full text-foreground font-medium text-xs hover:bg-secondary">
                    <User className="w-3.5 h-3.5 mr-1" />Account
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-border/60">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard"><LayoutDashboard className="w-4 h-4 mr-2" />Dashboard</Link>
                  </DropdownMenuItem>
                  {isSuperAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin"><Shield className="w-4 h-4 mr-2" />Admin Panel</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" className="h-8 rounded-full text-primary font-medium text-xs hover:bg-primary/5" onClick={() => setShowAuth(true)}>
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile */}
            <div className="flex items-center gap-2 flex-1 md:hidden">
            <div className="flex-1 flex items-center h-9 rounded-lg border-2 border-border/60 bg-card px-3">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <SearchWithSuggestions
                compact
                placeholder="Search..."
                className="flex-1"
              />
            </div>
            <button
              className="p-2 rounded-full hover:bg-secondary transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ═══ MOBILE NAV ═══ */}
        {mobileOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 border-t border-border/60 bg-background/95 backdrop-blur-xl p-4 space-y-1 animate-fade-in shadow-lg z-50">
            {isSuperAdmin && (
              <Link to="/admin" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start rounded-xl h-11 font-medium">
                  <Shield className="w-4 h-4 mr-2" />Admin Panel
                </Button>
              </Link>
            )}
            {user && (
              <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start rounded-xl h-11 font-medium">
                  <LayoutDashboard className="w-4 h-4 mr-2" />Dashboard
                </Button>
              </Link>
            )}
            <Link to="/add-listing" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full justify-start rounded-xl h-11 font-medium">
                <Plus className="w-4 h-4 mr-2" />Add Listing
              </Button>
            </Link>
            {user ? (
              <Button variant="ghost" className="w-full justify-start rounded-xl h-11 font-medium text-destructive" onClick={() => { handleSignOut(); setMobileOpen(false); }}>
                <LogOut className="w-4 h-4 mr-2" />Sign Out
              </Button>
            ) : (
              <Button className="w-full rounded-xl h-11 bg-primary text-primary-foreground font-medium" onClick={() => { setShowAuth(true); setMobileOpen(false); }}>
                Sign In
              </Button>
            )}
          </div>
        )}
      </header>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
};

export default Header;