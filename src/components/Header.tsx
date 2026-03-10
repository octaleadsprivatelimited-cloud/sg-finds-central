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
          <div className="hidden md:flex items-center gap-1 ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg hover:bg-secondary/60 transition-colors text-foreground">
                  <User className="w-4.5 h-4.5 text-muted-foreground" />
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {user ? "Account" : "Sign in"}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {user ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard"><LayoutDashboard className="w-4 h-4 mr-2" />Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/add-listing"><Plus className="w-4 h-4 mr-2" />Add Listing</Link>
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
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => setShowAuth(true)}>
                      <User className="w-4 h-4 mr-2" />Sign In / Register
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/add-listing"><Plus className="w-4 h-4 mr-2" />Add Listing</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile: GPS + Map + hamburger */}
          <div className="flex items-center gap-2 flex-1 md:hidden justify-end">
            {isHomePage && onDetectLocation && (
              <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={onDetectLocation}>
                <MapPin className="w-3.5 h-3.5 mr-1" />GPS
              </Button>
            )}
            {isHomePage && onToggleMap && (
              <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={onToggleMap}>
                {showMap ? <List className="w-3.5 h-3.5 mr-1" /> : <MapIcon className="w-3.5 h-3.5 mr-1" />}
                {showMap ? "List" : "Map"}
              </Button>
            )}
            <button
              className="p-2 rounded-lg hover:bg-secondary transition-colors shrink-0"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ═══ CATEGORY NAVIGATION BAR ═══ */}
        <div className="hidden md:block border-t border-border">
          <div className="container mx-auto px-4">
            <nav className="flex items-center gap-0 h-10 overflow-x-auto scrollbar-hide">
              {BUSINESS_CATEGORIES.filter(c => c !== "All Categories").slice(0, 8).map(cat => (
                <Link
                  key={cat}
                  to={`/singapore/${cat.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}`}
                  className="flex items-center gap-1 px-3 h-full text-[13px] font-medium text-muted-foreground hover:text-primary whitespace-nowrap transition-colors border-b-2 border-transparent hover:border-primary"
                >
                  {cat}
                </Link>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 px-3 h-full text-[13px] font-medium text-muted-foreground hover:text-primary whitespace-nowrap transition-colors">
                    More <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {BUSINESS_CATEGORIES.filter(c => c !== "All Categories").slice(8).map(cat => (
                    <DropdownMenuItem key={cat} asChild>
                      <Link to={`/singapore/${cat.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}`}>{cat}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Link to="/add-listing" className="ml-auto">
                <span className="inline-flex items-center gap-2 px-5 py-1.5 rounded-lg bg-yellow-400 text-black text-xs font-bold hover:bg-yellow-300 transition-all shadow-md shadow-yellow-400/25 hover:shadow-lg hover:shadow-yellow-400/30 hover:-translate-y-0.5 pulse">
                  List Free
                  <span className="px-1.5 py-0.5 rounded bg-black/10 text-[10px] font-extrabold tracking-wide uppercase">$0</span>
                </span>
              </Link>
            </nav>
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