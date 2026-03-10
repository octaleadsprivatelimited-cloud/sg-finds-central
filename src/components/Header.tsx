import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Plus, Menu, X, LogOut, Shield, LayoutDashboard, Crown,
  MapPin, User, ChevronDown, List, Map as MapIcon, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSearch } from "@/contexts/SearchContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import AuthModal from "./AuthModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BUSINESS_CATEGORIES } from "@/lib/districts";

interface HeaderProps {
  showMap?: boolean;
  onToggleMap?: () => void;
  onDetectLocation?: () => void;
}

const Header = ({ showMap, onToggleMap, onDetectLocation }: HeaderProps) => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const { searchQuery, setSearchQuery } = useSearch();
  const location = useLocation();
  const [showAuth, setShowAuth] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isHomePage = location.pathname === "/";

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <>
      {/* ═══ ANNOUNCEMENT BAR ═══ */}
      <Link to="/signup" className="group block bg-[hsl(220,60%,15%)] text-white hover:bg-[hsl(220,60%,20%)] transition-all cursor-pointer">
        <div className="container mx-auto px-4 h-8 sm:h-9 flex items-center justify-center text-[11px] sm:text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-bold hidden sm:inline">List your business for FREE — Reach thousands of customers</span>
            <span className="font-bold sm:hidden">FREE Business Listing →</span>
            <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-400 text-black text-[10px] sm:text-[11px] font-bold group-hover:bg-yellow-300 transition-colors">
              Get Started
            </span>
          </div>
        </div>
      </Link>

      {/* ═══ MAIN HEADER ═══ */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center gap-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-extrabold tracking-tight text-foreground uppercase">
              FIND<span className="text-primary">LOCAL</span>
            </span>
          </Link>

          {/* Search + GPS + Map toggle — visible on homepage */}
          {isHomePage && (
            <div className="hidden md:flex items-center gap-2 ml-4 flex-1 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search snacks, nails, tutoring, candles..."
                  className="w-full pl-10 pr-4 h-9 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {onDetectLocation && (
                <Button variant="outline" size="sm" className="h-9 px-4 text-sm shrink-0" onClick={onDetectLocation}>
                  <MapPin className="w-4 h-4 mr-1.5" />GPS
                </Button>
              )}
              {onToggleMap && (
                <Button variant="outline" size="sm" className="h-9 px-4 text-sm shrink-0" onClick={onToggleMap}>
                  {showMap ? <List className="w-4 h-4 mr-1.5" /> : <MapIcon className="w-4 h-4 mr-1.5" />}
                  {showMap ? "List" : "Map"}
                </Button>
              )}
            </div>
          )}

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-2 ml-auto">
            <Link to="/add-listing">
              <Button size="sm" className="h-9 bg-yellow-400 hover:bg-yellow-500 text-black font-bold shadow-sm">
                <Plus className="w-4 h-4 mr-1" />List Free
              </Button>
            </Link>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold">
                    <User className="w-4 h-4 mr-1.5" />Account
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard"><LayoutDashboard className="w-4 h-4 mr-2" />Dashboard</Link>
                  </DropdownMenuItem>
                  {isAdmin && !isSuperAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin"><Shield className="w-4 h-4 mr-2" />Admin Panel</Link>
                    </DropdownMenuItem>
                  )}
                  {isSuperAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/super-admin"><Crown className="w-4 h-4 mr-2" />Super Admin</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm" className="h-9 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold" onClick={() => setShowAuth(true)}>
                <User className="w-4 h-4 mr-1.5" />Sign In
              </Button>
            )}
          </div>

          {/* Mobile: search + GPS + Map + hamburger */}
          <div className="flex items-center gap-2 flex-1 md:hidden">
            {isHomePage && (
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search businesses..."
                  className="w-full pl-8 pr-3 h-8 rounded-lg border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
            <div className="flex items-center gap-1.5 shrink-0">
              <Link to="/add-listing">
                <Button size="sm" className="h-8 px-2.5 text-xs bg-yellow-400 hover:bg-yellow-500 text-black font-bold">
                  <Plus className="w-3.5 h-3.5 mr-0.5" />List Free
                </Button>
              </Link>
              {isHomePage && onDetectLocation && (
                <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs" onClick={onDetectLocation}>
                  <MapPin className="w-3.5 h-3.5" />
                </Button>
              )}
              {isHomePage && onToggleMap && (
                <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs" onClick={onToggleMap}>
                  {showMap ? <List className="w-3.5 h-3.5" /> : <MapIcon className="w-3.5 h-3.5" />}
                </Button>
              )}
              <button
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>


        {/* ═══ MOBILE NAV DROPDOWN ═══ */}
        {mobileOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 border-t border-border bg-card p-4 space-y-1.5 animate-fade-in shadow-lg z-50">
            {isSuperAdmin && (
              <Button variant="ghost" className="w-full justify-start" asChild onClick={() => setMobileOpen(false)}>
                <Link to="/super-admin"><Crown className="w-4 h-4 mr-2 text-warning" />Super Admin</Link>
              </Button>
            )}
            {isAdmin && !isSuperAdmin && (
              <Button variant="ghost" className="w-full justify-start" asChild onClick={() => setMobileOpen(false)}>
                <Link to="/admin"><Shield className="w-4 h-4 mr-2" />Admin</Link>
              </Button>
            )}
            {user && (
              <Button variant="ghost" className="w-full justify-start" asChild onClick={() => setMobileOpen(false)}>
                <Link to="/dashboard"><LayoutDashboard className="w-4 h-4 mr-2" />Dashboard</Link>
              </Button>
            )}
            <Button variant="ghost" className="w-full justify-start" asChild onClick={() => setMobileOpen(false)}>
              <Link to="/add-listing"><Plus className="w-4 h-4 mr-2" />Add Listing</Link>
            </Button>
            {user ? (
              <Button variant="ghost" className="w-full justify-start text-destructive" onClick={() => { handleSignOut(); setMobileOpen(false); }}>
                <LogOut className="w-4 h-4 mr-2" />Sign Out
              </Button>
            ) : (
              <Button className="w-full bg-primary text-primary-foreground" onClick={() => { setShowAuth(true); setMobileOpen(false); }}>
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