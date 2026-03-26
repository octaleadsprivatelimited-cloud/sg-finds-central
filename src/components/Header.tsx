import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Plus, Menu, X, LogOut, Shield, LayoutDashboard, Crown,
  MapPin, User, List, Map as MapIcon,
} from "lucide-react";
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
  const location = useLocation();
  const [showAuth, setShowAuth] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isHomePage = location.pathname === "/";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };
  const greeting = getGreeting();

  const handleSignOut = async () => {
    if (isDevMode) {
      devLogout();
      return;
    }
    await signOut(auth);
  };

  return (
    <>
      {/* ═══ ANNOUNCEMENT BAR ═══ */}
      <Link to="/signup" className="group block bg-[hsl(220,60%,15%)] text-white hover:bg-[hsl(220,60%,20%)] transition-all cursor-pointer">
        <div className="container mx-auto px-4 h-8 sm:h-9 flex items-center justify-between text-[11px] sm:text-xs">
          <span className="text-white/70 font-medium">{greeting} 👋</span>
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
              NEAR<span className="text-primary">BUY</span>
            </span>
          </Link>

          {/* Search */}
          <div className="hidden md:flex items-center gap-2 ml-4 flex-1 max-w-xl">
            <div className="flex-1 relative flex items-center h-10 rounded-lg border border-[hsl(220,15%,78%)] bg-card hover:border-[hsl(220,15%,65%)] focus-within:border-primary focus-within:shadow-[0_0_0_1px_hsl(var(--primary))] transition-all">
              <Search className="w-4 h-4 text-muted-foreground ml-3 shrink-0" />
              <SearchWithSuggestions
                placeholder="Search businesses, categories, or postal code..."
                className="flex-1"
              />
            </div>
          </div>

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
              <Button variant="outline" size="sm" className="h-9 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold" onClick={() => setShowAuth(true)}>
                <User className="w-4 h-4 mr-1.5" />Sign In
              </Button>
            )}
          </div>

          {/* Mobile: search + GPS + Map + hamburger */}
          <div className="flex items-center gap-2 flex-1 md:hidden">
            <SearchWithSuggestions
              compact
              placeholder="Search or postal code..."
              className="flex-1"
            />
            <div className="flex items-center gap-1.5 shrink-0">
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
              <Link to="/admin" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <Shield className="w-4 h-4 mr-2" />Admin Panel
                </Button>
              </Link>
            )}
            {user && (
              <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <LayoutDashboard className="w-4 h-4 mr-2" />Dashboard
                </Button>
              </Link>
            )}
            <Link to="/add-listing" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />Add Listing
              </Button>
            </Link>
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