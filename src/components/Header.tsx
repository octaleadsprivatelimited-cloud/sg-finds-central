import { useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
import nearbuyLogo from "@/assets/nearbuy-logo.png";
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
  const { onDistrictSelect, onPincodeSearch } = useSearch();
  const location = useLocation();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState("All Districts");
  const [locationOpen, setLocationOpen] = useState(false);
  const [pincode, setPincode] = useState("");
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");
  const [resolvedLocation, setResolvedLocation] = useState<{ address: string; pincode: string } | null>(null);

  const handleDistrictSelect = (d: string) => {
    setSelectedDistrict(d);
    setLocationOpen(false);
    setResolvedLocation(null);
    if (onDistrictSelect) onDistrictSelect(d);
  };

  const handlePincodeLookup = async (val: string) => {
    setPincodeError("");
    if (!/^\d{6}$/.test(val)) {
      setPincodeError("Enter a valid 6-digit Singapore postal code");
      return;
    }
    setPincodeLoading(true);
    try {
      const wasOffHome = location.pathname !== "/";
      if (wasOffHome) navigate("/");

      const { geocodeSingaporePostalCode } = await import('@/lib/geocode-pincode');
      const result = await geocodeSingaporePostalCode(val);
      if (!result) {
        setPincodeError("Postal code not found");
        return;
      }
      const { DISTRICT_COORDINATES } = await import('@/lib/districts');
      let nearest = "All Districts";
      let minDist = Infinity;
      for (const [name, coords] of Object.entries(DISTRICT_COORDINATES)) {
        const d = Math.sqrt(Math.pow(result.lat - coords.lat, 2) + Math.pow(result.lng - coords.lng, 2));
        if (d < minDist) { minDist = d; nearest = name; }
      }
      setSelectedDistrict(nearest);
      setResolvedLocation({ address: result.address, pincode: val });
      setLocationOpen(false);
      // Drop pin + zoom map to exact lat/lng via Index page handler.
      setTimeout(() => {
        if (onPincodeSearch) onPincodeSearch(val);
      }, wasOffHome ? 200 : 0);
    } catch {
      setPincodeError("Lookup failed, try again");
    } finally {
      setPincodeLoading(false);
    }
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
          <Link to="/" className="flex items-center shrink-0">
            <img src={nearbuyLogo} alt="NearBuy" className="h-9 w-auto" />
          </Link>

          {/* Location Selector */}
          <Popover open={locationOpen} onOpenChange={setLocationOpen}>
            <PopoverTrigger asChild>
              <button className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border-2 border-border/60 bg-card hover:border-primary/40 transition-colors text-sm font-medium shrink-0">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span className="max-w-[180px] truncate">
                  {resolvedLocation
                    ? `${resolvedLocation.pincode} · ${selectedDistrict === "All Districts" ? "SG" : selectedDistrict}`
                    : selectedDistrict === "All Districts" ? "All Areas" : selectedDistrict}
                </span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3 max-h-[420px] overflow-y-auto" align="start">
              {/* Pincode search */}
              <div className="mb-3">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Search by Postal Code</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={pincode}
                    placeholder="e.g. 560123"
                    className="flex-1 h-8 px-2.5 rounded-md border-2 border-border/60 bg-background text-sm focus:outline-none focus:border-primary/50"
                    onChange={(e) => { setPincode(e.target.value.replace(/\D/g, '')); setPincodeError(""); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handlePincodeLookup(pincode); }}
                  />
                  <Button
                    size="sm"
                    className="h-8 px-3 text-xs"
                    disabled={pincodeLoading || pincode.length !== 6}
                    onClick={() => handlePincodeLookup(pincode)}
                  >
                    {pincodeLoading ? "…" : "Find"}
                  </Button>
                </div>
                {pincodeError && (
                  <p className="text-[11px] text-destructive mt-1">{pincodeError}</p>
                )}
                {resolvedLocation && !pincodeError && (
                  <div className="mt-2 p-2 rounded-md bg-primary/5 border border-primary/20">
                    <p className="text-[11px] font-semibold text-primary">📍 {resolvedLocation.pincode}</p>
                    <p className="text-[11px] text-foreground/80 leading-tight mt-0.5 line-clamp-2">{resolvedLocation.address}</p>
                  </div>
                )}
              </div>
              <div className="border-t border-border/40 pt-2">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Select District</label>
                {SINGAPORE_DISTRICTS.map((d) => (
                  <button
                    key={d}
                    onClick={() => handleDistrictSelect(d)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedDistrict === d
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "hover:bg-secondary text-foreground"
                    }`}
                  >
                    {d === "All Districts" ? "All Areas" : d}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

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
          <div className="flex items-center gap-1.5 flex-1 md:hidden">
            {/* Mobile Location with area name */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 h-9 px-2.5 rounded-lg border-2 border-border/60 bg-card shrink-0 max-w-[140px]">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-xs font-medium truncate">{selectedDistrict === "All Districts" ? "All Areas" : selectedDistrict}</span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3 max-h-80 overflow-y-auto" align="start">
                {/* Pincode search */}
                <div className="mb-3">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Search by Postal Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="e.g. 560123"
                      className="flex-1 h-8 px-2.5 rounded-md border-2 border-border/60 bg-background text-sm focus:outline-none focus:border-primary/50"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value.trim();
                          handlePincodeLookup(val);
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="border-t border-border/40 pt-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Select District</label>
                  {SINGAPORE_DISTRICTS.map((d) => (
                    <button
                      key={d}
                      onClick={() => handleDistrictSelect(d)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedDistrict === d
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "hover:bg-secondary text-foreground"
                      }`}
                    >
                      {d === "All Districts" ? "All Areas" : d}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
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