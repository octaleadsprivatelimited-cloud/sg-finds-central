import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Plus, Menu, X, LogOut, Shield, LayoutDashboard, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import AuthModal from "./AuthModal";

const Header = () => {
  const { user, isAdmin, isSuperAdmin, isBusinessOwner } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <>
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Search className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight hidden sm:block">SGDirectory</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            {isSuperAdmin && (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/super-admin">
                  <Crown className="w-4 h-4 mr-1.5" />
                  Super Admin
                </Link>
              </Button>
            )}
            {isAdmin && !isSuperAdmin && (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin">
                  <Shield className="w-4 h-4 mr-1.5" />
                  Admin
                </Link>
              </Button>
            )}
            {user && (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">
                  <LayoutDashboard className="w-4 h-4 mr-1.5" />
                  Dashboard
                </Link>
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link to="/add-listing">
                <Plus className="w-4 h-4 mr-1.5" />
                Add Listing
              </Link>
            </Button>
            {user ? (
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-1.5" />
                Sign Out
              </Button>
            ) : (
              <Button size="sm" onClick={() => setShowAuth(true)}>
                Sign In
              </Button>
            )}
          </nav>

          {/* Mobile toggle */}
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border/50 bg-background p-4 space-y-2 animate-fade-in">
            {isSuperAdmin && (
              <Button variant="ghost" className="w-full justify-start" asChild onClick={() => setMobileOpen(false)}>
                <Link to="/super-admin"><Crown className="w-4 h-4 mr-2" />Super Admin</Link>
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
            <Button variant="outline" className="w-full justify-start" asChild onClick={() => setMobileOpen(false)}>
              <Link to="/add-listing"><Plus className="w-4 h-4 mr-2" />Add Listing</Link>
            </Button>
            {user ? (
              <Button variant="ghost" className="w-full justify-start" onClick={() => { handleSignOut(); setMobileOpen(false); }}>
                <LogOut className="w-4 h-4 mr-2" />Sign Out
              </Button>
            ) : (
              <Button className="w-full" onClick={() => { setShowAuth(true); setMobileOpen(false); }}>
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
