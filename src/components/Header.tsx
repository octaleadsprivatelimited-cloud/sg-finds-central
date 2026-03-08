import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Plus, Menu, X, LogOut, Shield, LayoutDashboard, Crown, Sun, Moon, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchWithSuggestions from "./SearchWithSuggestions";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import AuthModal from "./AuthModal";

const Header = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [showAuth, setShowAuth] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isHome = location.pathname === "/";

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <>
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between gap-2 md:gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-primary to-[hsl(280,85%,55%)] flex items-center justify-center shadow-lg glow-primary transition-transform group-hover:scale-105">
              <Search className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight hidden lg:block">
              <span className="text-gradient">SG</span>
              <span className="text-foreground">Directory</span>
            </span>
          </Link>

          {/* Mobile/Tablet: Compact search bar in header */}
          <div className="flex items-center gap-1.5 flex-1 max-w-md md:hidden mx-2 relative">
            <div className="flex items-center gap-0 bg-secondary/60 border border-border/50 rounded-xl flex-1 h-9">
              <div className="flex items-center justify-center w-8 h-9 shrink-0">
                <MapPin className="w-3.5 h-3.5 text-accent" />
              </div>
              <SearchWithSuggestions compact placeholder="Search businesses..." />
            </div>
          </div>

          {/* Desktop: Search bar in header for non-home pages */}
          {!isHome && (
            <div className="hidden md:flex items-center flex-1 max-w-lg mx-4 relative">
              <div className="flex items-center gap-0 bg-secondary/60 border border-border/50 rounded-xl flex-1 h-9">
                <div className="flex items-center justify-center w-9 h-9 shrink-0">
                  <Search className="w-4 h-4 text-muted-foreground" />
                </div>
                <SearchWithSuggestions compact placeholder="Search businesses..." />
              </div>
            </div>
          )}

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1.5">
            {isSuperAdmin && (
              <Button variant="ghost" size="sm" asChild className="hover:bg-primary/10 hover:text-primary">
                <Link to="/super-admin"><Crown className="w-4 h-4 mr-1.5 text-warning" />Super Admin</Link>
              </Button>
            )}
            {isAdmin && !isSuperAdmin && (
              <Button variant="ghost" size="sm" asChild className="hover:bg-primary/10 hover:text-primary">
                <Link to="/admin"><Shield className="w-4 h-4 mr-1.5" />Admin</Link>
              </Button>
            )}
            {user && (
              <Button variant="ghost" size="sm" asChild className="hover:bg-primary/10 hover:text-primary">
                <Link to="/dashboard"><LayoutDashboard className="w-4 h-4 mr-1.5" />Dashboard</Link>
              </Button>
            )}
            <Button variant="outline" size="sm" asChild className="border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50">
              <Link to="/add-listing"><Plus className="w-4 h-4 mr-1.5" />Add Listing</Link>
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-accent/10" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4 text-primary" />}
            </Button>
            {user ? (
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="w-4 h-4 mr-1.5" />Sign Out
              </Button>
            ) : (
              <Button size="sm" onClick={() => setShowAuth(true)} className="bg-gradient-to-r from-primary to-[hsl(280,85%,55%)] hover:opacity-90 glow-primary text-primary-foreground border-0">
                Sign In
              </Button>
            )}
          </nav>

          {/* Mobile toggle */}
          <button className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors shrink-0" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border/50 bg-card/95 backdrop-blur-xl p-4 space-y-1.5 animate-fade-in">
            {isSuperAdmin && (
              <Button variant="ghost" className="w-full justify-start hover:bg-primary/10 hover:text-primary" asChild onClick={() => setMobileOpen(false)}>
                <Link to="/super-admin"><Crown className="w-4 h-4 mr-2 text-warning" />Super Admin</Link>
              </Button>
            )}
            {isAdmin && !isSuperAdmin && (
              <Button variant="ghost" className="w-full justify-start hover:bg-primary/10 hover:text-primary" asChild onClick={() => setMobileOpen(false)}>
                <Link to="/admin"><Shield className="w-4 h-4 mr-2" />Admin</Link>
              </Button>
            )}
            {user && (
              <Button variant="ghost" className="w-full justify-start hover:bg-primary/10 hover:text-primary" asChild onClick={() => setMobileOpen(false)}>
                <Link to="/dashboard"><LayoutDashboard className="w-4 h-4 mr-2" />Dashboard</Link>
              </Button>
            )}
            <Button variant="outline" className="w-full justify-start border-primary/30 text-primary" asChild onClick={() => setMobileOpen(false)}>
              <Link to="/add-listing"><Plus className="w-4 h-4 mr-2" />Add Listing</Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="w-4 h-4 mr-2 text-warning" /> : <Moon className="w-4 h-4 mr-2 text-primary" />}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </Button>
            {user ? (
              <Button variant="ghost" className="w-full justify-start hover:bg-destructive/10 hover:text-destructive" onClick={() => { handleSignOut(); setMobileOpen(false); }}>
                <LogOut className="w-4 h-4 mr-2" />Sign Out
              </Button>
            ) : (
              <Button className="w-full bg-gradient-to-r from-primary to-[hsl(280,85%,55%)] text-primary-foreground border-0" onClick={() => { setShowAuth(true); setMobileOpen(false); }}>
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
