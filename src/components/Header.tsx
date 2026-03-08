import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Search, Plus, Menu, X, LogOut, Shield, LayoutDashboard, Crown,
  MapPin, User, ChevronDown, Truck, Heart, ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchWithSuggestions from "./SearchWithSuggestions";
import { useAuth } from "@/contexts/AuthContext";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BUSINESS_CATEGORIES } from "@/lib/districts";

const Header = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const location = useLocation();
  const [showAuth, setShowAuth] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchCategory, setSearchCategory] = useState("all");

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <>
      {/* ═══ ANNOUNCEMENT BAR ═══ */}
      <Link to="/signup" className="block bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer">
        <div className="container mx-auto px-4 h-9 flex items-center justify-center text-xs">
          <div className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 shrink-0" />
            <span className="font-medium whitespace-nowrap">List your business for FREE — Reach thousands of customers</span>
          </div>
        </div>
      </Link>

      {/* ═══ MAIN HEADER ═══ */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-extrabold tracking-tight text-foreground uppercase">
              FIND<span className="text-primary">LOCAL</span>
            </span>
          </Link>

          {/* Search bar — desktop */}
          <div className="hidden md:flex items-center flex-1 max-w-2xl mx-4">
            <div className="flex items-center w-full border border-border rounded-lg overflow-hidden bg-background shadow-sm">
              {/* Category dropdown */}
              <Select value={searchCategory} onValueChange={setSearchCategory}>
                <SelectTrigger className="w-[160px] border-0 border-r border-border rounded-none h-10 text-sm bg-secondary/40 focus:ring-0 focus:ring-offset-0 [&>svg]:ml-0">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {BUSINESS_CATEGORIES.filter(c => c !== "All Categories").map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Search input */}
              <div className="flex-1 relative">
                <SearchWithSuggestions compact placeholder="What are you looking for?" />
              </div>
              {/* Search button */}
              <button className="h-10 w-11 flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground transition-colors shrink-0">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-1 ml-auto">
            <Link to="#" className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg hover:bg-secondary/60 transition-colors text-foreground">
              <MapPin className="w-4.5 h-4.5 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground">Find a Store</span>
            </Link>

            {/* User menu */}
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

          {/* Mobile: compact search + hamburger */}
          <div className="flex items-center gap-2 flex-1 md:hidden">
            <div className="flex-1 relative">
              <div className="flex items-center border border-border rounded-lg overflow-hidden bg-background h-9">
                <div className="flex items-center justify-center w-8 h-9 shrink-0">
                  <Search className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <SearchWithSuggestions compact placeholder="Search businesses..." />
              </div>
            </div>
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
              <Link
                to="/add-listing"
                className="flex items-center gap-1 px-3 h-full text-[13px] font-semibold text-destructive hover:text-destructive/80 whitespace-nowrap transition-colors ml-auto"
              >
                List Free
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
