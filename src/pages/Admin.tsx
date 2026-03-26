import { useState, useEffect, useMemo, forwardRef } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { DEMO_ALL_LISTINGS } from "@/lib/demo-data";
import { signOut } from "firebase/auth";
import { useAuth } from "@/contexts/AuthContext";
import { notifyImageApproval } from "@/lib/notify-image-approval";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Listing } from "@/components/ListingCard";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Shield, Check, X, ExternalLink, FileText, Building2, Clock,
  Loader2, AlertTriangle, LayoutDashboard, Inbox, Settings,
  LogOut, Search, Bell, Eye, Store, Trash2, Edit3, Upload, Image,
  MessageSquare, Mail, Phone, Menu, MoreHorizontal,
  ChevronRight, Activity, Users, Database,
} from "lucide-react";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════════════
   TEAMS THEME — dark indigo rail, flat cards, clean typography
   ═══════════════════════════════════════════════════════════ */

type AdminTab = "dashboard" | "listings" | "enquiries" | "settings";

/* ── Icon Rail Item (far-left vertical bar like Teams) ──── */
const RailIcon = forwardRef<HTMLButtonElement, { icon: any; label: string; active?: boolean; badge?: number; onClick?: () => void }>(
  ({ icon: Icon, label, active, badge, onClick }, ref) => (
    <button
      ref={ref}
      onClick={onClick}
      title={label}
      className={`relative flex flex-col items-center gap-1 w-full py-3 transition-all group
        ${active
          ? "text-white before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:bg-white before:rounded-r-full"
          : "text-[hsl(250,20%,65%)] hover:text-white hover:bg-white/5"
        }`}
    >
      <div className="relative">
        <Icon className="w-5 h-5" />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[hsl(354,70%,54%)] text-white text-[9px] font-bold flex items-center justify-center">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium leading-tight">{label}</span>
    </button>
  )
);
RailIcon.displayName = "RailIcon";

/* ── Enquiry interface ──────────────────────────────────── */
interface Enquiry {
  id: string; listingId: string; listingName: string;
  name: string; email: string; phone?: string; message: string;
  status: "unread" | "read" | "replied"; createdAt: any;
}

/* ═══════════════════════════════════════════════════════════
   MAIN ADMIN PAGE — TEAMS LAYOUT
   ═══════════════════════════════════════════════════════════ */
const Admin = () => {
  const { user, isSuperAdmin, loading: authLoading, isDevMode, devLogout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AdminTab>("listings");
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [listingFilter, setListingFilter] = useState<"all" | "approved" | "pending_approval" | "rejected">("pending_approval");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [adminEditData, setAdminEditData] = useState<Record<string, any>>({});
  const [adminSaving, setAdminSaving] = useState(false);
  const [viewingImages, setViewingImages] = useState<{ listing: Listing } | null>(null);
  const [seeding, setSeeding] = useState(false);

  const handleSeedDemoData = async () => {
    setSeeding(true);
    try {
      let count = 0;
      for (const listing of DEMO_ALL_LISTINGS) {
        const { id, ...data } = listing;
        // Remove undefined fields — Firestore rejects them
        const cleanData = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
        await setDoc(doc(db, "listings", id), cleanData);
        count++;
      }
      toast.success(`Seeded ${count} demo listings to Firestore`);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to seed demo data");
    }
    setSeeding(false);
  };

  const [settings, setSettings] = useState({
    autoApprove: false,
    emailNotifications: true,
    documentRequired: true,
  });

  useEffect(() => {
    if (!authLoading && (!user || !isSuperAdmin)) {
      navigate("/");
      return;
    }
    fetchData();
  }, [authLoading, user, isSuperAdmin]);

  const fetchData = async () => {
    try {
      const allSnap = await getDocs(collection(db, "listings"));
      const all = allSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing));
      setAllListings(all);
      setPendingListings(all.filter((l) => l.status === "pending_approval"));
      try {
        const eSnap = await getDocs(collection(db, "enquiries"));
        setEnquiries(eSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Enquiry)));
      } catch {}
    } catch {
      setAllListings(DEMO_ALL_LISTINGS);
      setPendingListings(DEMO_ALL_LISTINGS.filter((l) => l.status === "pending_approval"));
    }
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const listing = allListings.find(l => l.id === id);
      const updates: Record<string, any> = { status: "approved", rejectionReason: "" };
      // Auto-approve any pending images when listing is approved
      if (listing?.pendingLogoUrl) {
        updates.logoUrl = listing.pendingLogoUrl;
        updates.pendingLogoUrl = "";
      }
      if (listing?.pendingImageUrls && listing.pendingImageUrls.length > 0) {
        updates.imageUrls = listing.pendingImageUrls;
        updates.pendingImageUrls = [];
      }
      await updateDoc(doc(db, "listings", id), updates);
      setPendingListings((prev) => prev.filter((l) => l.id !== id));
      setAllListings((prev) => prev.map((l) => l.id === id ? { ...l, ...updates } : l));
      toast.success("Listing approved (including pending images)");
    } catch { toast.error("Failed to update listing"); }
    setActionLoading(null);
  };

  const handleReject = async () => {
    if (!rejectingId || !rejectionReason.trim()) { toast.error("Please provide a reason"); return; }
    setActionLoading(rejectingId);
    try {
      await updateDoc(doc(db, "listings", rejectingId), { status: "rejected", rejectionReason: rejectionReason.trim() });
      setPendingListings((prev) => prev.filter((l) => l.id !== rejectingId));
      setAllListings((prev) => prev.map((l) => l.id === rejectingId ? { ...l, status: "rejected" } : l));
      toast.success("Listing rejected");
    } catch { toast.error("Failed to update listing"); }
    setActionLoading(null); setRejectingId(null); setRejectionReason("");
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    try {
      await deleteDoc(doc(db, "listings", id));
      setAllListings((prev) => prev.filter((l) => l.id !== id));
      setPendingListings((prev) => prev.filter((l) => l.id !== id));
      toast.success("Listing deleted");
    } catch { toast.error("Failed to delete"); }
    setActionLoading(null);
  };

  const openAdminEdit = (listing: Listing) => {
    setEditingListing(listing);
    setAdminEditData({
      name: listing.name, category: listing.category, district: listing.district,
      address: listing.address, phone: listing.phone || "", email: listing.email || "",
      website: listing.website || "", description: listing.description || "",
      imageUrls: listing.imageUrls || [], logoUrl: listing.logoUrl || "",
      status: listing.status,
    });
  };

  const saveAdminEdit = async () => {
    if (!editingListing) return;
    setAdminSaving(true);
    try {
      await updateDoc(doc(db, "listings", editingListing.id), adminEditData);
      setAllListings(prev => prev.map(l => l.id === editingListing.id ? { ...l, ...adminEditData } : l));
      setPendingListings(prev => prev.filter(l => l.id !== editingListing.id || adminEditData.status === "pending_approval")
        .map(l => l.id === editingListing.id ? { ...l, ...adminEditData } : l));
      setEditingListing(null);
      toast.success("Listing updated by admin");
    } catch { toast.error("Failed to update"); }
    setAdminSaving(false);
  };

  const stats = useMemo(() => ({
    total: allListings.length,
    pending: pendingListings.length,
    approved: allListings.filter((l) => l.status === "approved").length,
    rejected: allListings.filter((l) => l.status === "rejected").length,
    enquiries: enquiries.length,
    unreadEnquiries: enquiries.filter((e) => e.status === "unread").length,
  }), [allListings, pendingListings, enquiries]);

  const filteredAllListings = useMemo(() => {
    return allListings.filter((l) => {
      const matchSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFilter = listingFilter === "all" || l.status === listingFilter;
      return matchSearch && matchFilter;
    });
  }, [allListings, searchQuery, listingFilter]);

  const filteredPending = pendingListings.filter((l) =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEnquiries = enquiries.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.listingName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(250,25%,10%)]">
        <Loader2 className="w-6 h-6 animate-spin text-white" />
      </div>
    );
  }

  const tabTitles: Record<AdminTab, string> = {
    dashboard: "Dashboard",
    listings: "All Listings",
    enquiries: "Enquiries",
    settings: "Settings",
  };

  return (
    <div className="min-h-screen bg-[hsl(0,0%,96%)] dark:bg-[hsl(250,15%,8%)] flex">

      {/* ══════════════════════════════════════════════════════
         FAR-LEFT ICON RAIL — Teams-style dark indigo bar
         ══════════════════════════════════════════════════════ */}
      <nav className="hidden md:flex flex-col w-[68px] bg-[hsl(250,40%,16%)] items-center py-4 shrink-0">
        {/* Logo */}
        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-6">
          <Shield className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1 flex flex-col gap-0.5 w-full">
          <RailIcon icon={Activity} label="Dashboard" active={activeTab === "dashboard"} badge={stats.pending} onClick={() => setActiveTab("dashboard")} />
          <RailIcon icon={Building2} label="Listings" active={activeTab === "listings"} badge={stats.total} onClick={() => setActiveTab("listings")} />
          <RailIcon icon={MessageSquare} label="Enquiries" active={activeTab === "enquiries"} badge={stats.unreadEnquiries} onClick={() => setActiveTab("enquiries")} />
          <RailIcon icon={Settings} label="Settings" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
        </div>

        {/* Bottom: avatar + logout */}
        <div className="flex flex-col items-center gap-3 mt-auto pt-4 border-t border-white/10 w-full">
          <div className="w-8 h-8 rounded-full bg-[hsl(250,50%,55%)] flex items-center justify-center text-white text-xs font-bold">
            {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || "A"}
          </div>
          <button onClick={async () => { if (isDevMode) devLogout(); else await signOut(auth); navigate("/"); }} title="Sign out"
            className="text-[hsl(250,20%,60%)] hover:text-white transition p-2">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════
         MOBILE TOP BAR
         ══════════════════════════════════════════════════════ */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[hsl(250,40%,16%)] flex items-center px-3 h-14">
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="w-10 h-10 flex items-center justify-center text-white">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 ml-2">
          <Shield className="w-5 h-5 text-white" />
          <span className="text-white font-semibold text-sm">{tabTitles[activeTab]}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="relative w-9 h-9 flex items-center justify-center text-[hsl(250,20%,65%)]">
            <Bell className="w-4 h-4" />
            {stats.pending > 0 && <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-[hsl(354,70%,54%)]" />}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-[260px] h-full bg-[hsl(250,40%,16%)] flex flex-col py-6 px-4 shadow-2xl">
            <div className="flex items-center gap-2.5 mb-8 px-2">
              <Shield className="w-6 h-6 text-white" />
              <span className="text-white font-bold text-lg">Admin</span>
            </div>
            {([
              { tab: "dashboard" as const, icon: Activity, label: "Dashboard", badge: stats.pending },
              { tab: "listings" as const, icon: Building2, label: "All Listings", badge: stats.total },
              { tab: "enquiries" as const, icon: MessageSquare, label: "Enquiries", badge: stats.unreadEnquiries },
              { tab: "settings" as const, icon: Settings, label: "Settings" },
            ]).map((item) => (
              <button
                key={item.tab}
                onClick={() => { setActiveTab(item.tab); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium transition mb-0.5
                  ${activeTab === item.tab
                    ? "bg-white/10 text-white"
                    : "text-[hsl(250,20%,65%)] hover:bg-white/5 hover:text-white"
                  }`}
              >
                <item.icon className="w-[18px] h-[18px]" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-[10px] font-bold bg-[hsl(354,70%,54%)] text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{item.badge}</span>
                )}
              </button>
            ))}
            <div className="mt-auto pt-4 border-t border-white/10">
              <button onClick={async () => { if (isDevMode) devLogout(); else await signOut(auth); navigate("/"); }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm text-[hsl(250,20%,65%)] hover:bg-white/5 hover:text-white transition">
                <LogOut className="w-[18px] h-[18px]" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
         MAIN CONTENT AREA
         ══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 md:pt-0 pt-14">

        {/* ── Teams-style top toolbar ─────────────────────── */}
        <header className="sticky top-0 z-30 bg-white dark:bg-[hsl(250,15%,12%)] border-b border-[hsl(0,0%,90%)] dark:border-[hsl(250,15%,18%)] px-5 sm:px-6 h-12 flex items-center gap-3">
          <h2 className="text-sm font-semibold text-foreground mr-4 flex items-center gap-2">
            {tabTitles[activeTab]}
            {stats.pending > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[hsl(38,85%,92%)] dark:bg-[hsl(38,60%,18%)] text-[hsl(38,85%,30%)] dark:text-[hsl(38,85%,70%)] text-[11px] font-bold">
                <Clock className="w-3 h-3" />
                {stats.pending} pending
              </span>
            )}
          </h2>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-md bg-[hsl(0,0%,96%)] dark:bg-[hsl(250,15%,15%)] text-sm text-foreground placeholder:text-muted-foreground border border-transparent focus:border-[hsl(250,50%,55%)] focus:outline-none transition"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="relative w-8 h-8 rounded-md hover:bg-[hsl(0,0%,93%)] dark:hover:bg-[hsl(250,15%,16%)] flex items-center justify-center transition">
              <Bell className="w-4 h-4 text-muted-foreground" />
              {stats.pending > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[hsl(354,70%,54%)] ring-2 ring-white dark:ring-[hsl(250,15%,12%)]" />}
            </button>
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[hsl(0,0%,90%)] dark:border-[hsl(250,15%,20%)]">
              <div className="w-7 h-7 rounded-full bg-[hsl(250,50%,55%)] flex items-center justify-center text-white text-[11px] font-bold">
                {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || "A"}
              </div>
              <span className="text-xs font-medium text-foreground">{user?.displayName || user?.email?.split("@")[0] || "Admin"}</span>
            </div>
          </div>
        </header>

        {/* ── Content ─────────────────────────────────────── */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">

          {/* ═══ DASHBOARD ════════════════════════════════════ */}
          {activeTab === "dashboard" && (
            <div className="space-y-5">
              {/* Welcome banner — Teams flat style */}
              <div className="bg-[hsl(250,40%,16%)] rounded-lg p-5 sm:p-6">
                <p className="text-[hsl(250,30%,75%)] text-xs uppercase tracking-wider font-semibold mb-1">Admin Overview</p>
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Review & Manage Listings</h1>
                <p className="text-[hsl(250,30%,70%)] text-sm">Approve or reject business listings to keep the directory trusted.</p>
              </div>

              {/* Stats grid — Teams card style */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([
                  { icon: Clock, label: "Pending", value: stats.pending, color: "hsl(38,85%,50%)" },
                  { icon: Check, label: "Approved", value: stats.approved, color: "hsl(152,69%,40%)" },
                  { icon: AlertTriangle, label: "Rejected", value: stats.rejected, color: "hsl(354,70%,54%)" },
                  { icon: MessageSquare, label: "Enquiries", value: stats.enquiries, color: "hsl(210,80%,50%)" },
                ] as const).map((s) => (
                  <div key={s.label} className="bg-white dark:bg-[hsl(250,15%,12%)] border border-[hsl(0,0%,91%)] dark:border-[hsl(250,15%,18%)] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <s.icon className="w-4 h-4" style={{ color: s.color }} />
                      <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Pending Queue */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">Pending Review</h3>
                  <span className="text-xs text-muted-foreground">{filteredPending.length} item{filteredPending.length !== 1 ? "s" : ""}</span>
                </div>
                {loading ? (
                  <div className="text-center py-16"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>
                ) : filteredPending.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-[hsl(250,15%,12%)] rounded-lg border border-[hsl(0,0%,91%)] dark:border-[hsl(250,15%,18%)]">
                    <div className="w-12 h-12 rounded-full bg-[hsl(152,50%,92%)] dark:bg-[hsl(152,30%,15%)] flex items-center justify-center mx-auto mb-3">
                      <Check className="w-5 h-5 text-[hsl(152,69%,40%)]" />
                    </div>
                    <p className="font-semibold text-foreground text-sm mb-0.5">All caught up!</p>
                    <p className="text-xs text-muted-foreground">No pending listings to review</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredPending.map((listing) => (
                      <div key={listing.id} className="bg-white dark:bg-[hsl(250,15%,12%)] border border-[hsl(0,0%,91%)] dark:border-[hsl(250,15%,18%)] rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-md bg-[hsl(250,30%,95%)] dark:bg-[hsl(250,20%,18%)] flex items-center justify-center overflow-hidden shrink-0">
                            {listing.logoUrl ? (
                              <img src={listing.logoUrl} alt={listing.name} className="w-full h-full object-cover" />
                            ) : (
                              <Store className="w-5 h-5 text-[hsl(250,30%,55%)]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="font-semibold text-sm text-foreground truncate">{listing.name}</h4>
                              <Badge className="bg-[hsl(38,85%,92%)] text-[hsl(38,85%,30%)] border-0 text-[10px] px-2 py-0 rounded font-medium">Pending</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{listing.address}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span>{listing.category}</span>
                              <span>·</span>
                              <span>{listing.district}</span>
                              {listing.phone && <><span>·</span><span>{listing.phone}</span></>}
                            </div>
                          </div>
                        </div>

                        {/* Business Images Preview */}
                        {listing.imageUrls && listing.imageUrls.length > 0 && (
                          <div className="mt-3 ml-[52px]">
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                              <Image className="w-3 h-3" />Current Images ({listing.imageUrls.length})
                            </p>
                            <div className="flex gap-1.5 overflow-x-auto">
                              {listing.imageUrls.map((url, i) => (
                                <img key={i} src={url} alt={`${listing.name} ${i + 1}`}
                                  className="w-16 h-16 rounded-md object-cover border border-[hsl(0,0%,90%)] dark:border-[hsl(250,15%,20%)] shrink-0" />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Pending Logo */}
                        {listing.pendingLogoUrl && (
                          <div className="mt-3 ml-[52px]">
                            <p className="text-[11px] font-semibold text-[hsl(38,85%,40%)] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" />Pending Logo (Awaiting Approval)
                            </p>
                            <div className="flex items-center gap-3">
                              <img src={listing.pendingLogoUrl} alt="Pending logo"
                                className="w-16 h-16 rounded-md object-cover border-2 border-[hsl(38,85%,50%)] shrink-0" />
                              <div className="flex gap-1.5">
                                <Button size="sm" onClick={async () => {
                                  try {
                                    await updateDoc(doc(db, "listings", listing.id), { logoUrl: listing.pendingLogoUrl, pendingLogoUrl: "" });
                                    setAllListings(prev => prev.map(l => l.id === listing.id ? { ...l, logoUrl: listing.pendingLogoUrl, pendingLogoUrl: "" } : l));
                                    setPendingListings(prev => prev.map(l => l.id === listing.id ? { ...l, logoUrl: listing.pendingLogoUrl, pendingLogoUrl: "" } : l));
                                    if (listing.email || listing.ownerId) {
                                      notifyImageApproval({ type: "image_approved", recipientEmail: listing.email || "", recipientName: listing.name, businessName: listing.name, imageType: "logo", listingId: listing.id, ownerId: listing.ownerId || "" }).catch(() => {});
                                    }
                                    toast.success("Logo approved — owner notified");
                                  } catch { toast.error("Failed to approve logo"); }
                                }} className="bg-[hsl(152,69%,40%)] hover:bg-[hsl(152,69%,35%)] text-white text-[10px] h-7 px-2 rounded">
                                  <Check className="w-3 h-3 mr-1" />Approve
                                </Button>
                                <Button size="sm" variant="outline" onClick={async () => {
                                  try {
                                    await updateDoc(doc(db, "listings", listing.id), { pendingLogoUrl: "" });
                                    setAllListings(prev => prev.map(l => l.id === listing.id ? { ...l, pendingLogoUrl: "" } : l));
                                    setPendingListings(prev => prev.map(l => l.id === listing.id ? { ...l, pendingLogoUrl: "" } : l));
                                    if (listing.email || listing.ownerId) {
                                      notifyImageApproval({ type: "image_rejected", recipientEmail: listing.email || "", recipientName: listing.name, businessName: listing.name, imageType: "logo", listingId: listing.id, ownerId: listing.ownerId || "" }).catch(() => {});
                                    }
                                    toast.success("Pending logo rejected — owner notified");
                                  } catch { toast.error("Failed"); }
                                }} className="border-[hsl(354,50%,80%)] text-[hsl(354,70%,50%)] text-[10px] h-7 px-2 rounded">
                                  <X className="w-3 h-3 mr-1" />Reject
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Pending Images */}
                        {listing.pendingImageUrls && listing.pendingImageUrls.length > 0 && (
                          <div className="mt-3 ml-[52px]">
                            <p className="text-[11px] font-semibold text-[hsl(38,85%,40%)] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" />Pending Images ({listing.pendingImageUrls.length}) — Awaiting Approval
                            </p>
                            <div className="flex gap-1.5 overflow-x-auto">
                              {listing.pendingImageUrls.map((url, i) => (
                                <img key={i} src={url} alt={`Pending ${i + 1}`}
                                  className="w-16 h-16 rounded-md object-cover border-2 border-[hsl(38,85%,50%)] shrink-0" />
                              ))}
                            </div>
                            <div className="flex gap-1.5 mt-2">
                              <Button size="sm" onClick={async () => {
                                try {
                                  await updateDoc(doc(db, "listings", listing.id), { imageUrls: listing.pendingImageUrls, pendingImageUrls: [] });
                                  setAllListings(prev => prev.map(l => l.id === listing.id ? { ...l, imageUrls: listing.pendingImageUrls, pendingImageUrls: [] } : l));
                                  setPendingListings(prev => prev.map(l => l.id === listing.id ? { ...l, imageUrls: listing.pendingImageUrls, pendingImageUrls: [] } : l));
                                  if (listing.email || listing.ownerId) {
                                    notifyImageApproval({ type: "image_approved", recipientEmail: listing.email || "", recipientName: listing.name, businessName: listing.name, imageType: "photos", listingId: listing.id, ownerId: listing.ownerId || "" }).catch(() => {});
                                  }
                                  toast.success("Images approved — owner notified");
                                } catch { toast.error("Failed to approve images"); }
                              }} className="bg-[hsl(152,69%,40%)] hover:bg-[hsl(152,69%,35%)] text-white text-[10px] h-7 px-2 rounded">
                                <Check className="w-3 h-3 mr-1" />Approve All
                              </Button>
                              <Button size="sm" variant="outline" onClick={async () => {
                                try {
                                  await updateDoc(doc(db, "listings", listing.id), { pendingImageUrls: [] });
                                  setAllListings(prev => prev.map(l => l.id === listing.id ? { ...l, pendingImageUrls: [] } : l));
                                  setPendingListings(prev => prev.map(l => l.id === listing.id ? { ...l, pendingImageUrls: [] } : l));
                                  if (listing.email || listing.ownerId) {
                                    notifyImageApproval({ type: "image_rejected", recipientEmail: listing.email || "", recipientName: listing.name, businessName: listing.name, imageType: "photos", listingId: listing.id, ownerId: listing.ownerId || "" }).catch(() => {});
                                  }
                                  toast.success("Pending images rejected — owner notified");
                                } catch { toast.error("Failed"); }
                              }} className="border-[hsl(354,50%,80%)] text-[hsl(354,70%,50%)] text-[10px] h-7 px-2 rounded">
                                <X className="w-3 h-3 mr-1" />Reject All
                              </Button>
                            </div>
                          </div>
                        )}

                        {listing.description && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2 ml-[52px]">{listing.description}</p>
                        )}

                        {listing.documentsUrl && listing.documentsUrl.length > 0 && (
                          <div className="flex gap-1.5 mt-2 ml-[52px] flex-wrap">
                            {listing.documentsUrl.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-[hsl(250,50%,55%)] hover:underline bg-[hsl(250,30%,96%)] dark:bg-[hsl(250,20%,16%)] px-2 py-1 rounded">
                                <FileText className="w-3 h-3" />Doc {i + 1}<ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2 mt-3 ml-[52px] pt-3 border-t border-[hsl(0,0%,93%)] dark:border-[hsl(250,15%,18%)]">
                          <Button size="sm" onClick={() => handleApprove(listing.id)} disabled={actionLoading === listing.id}
                            className="bg-[hsl(152,69%,40%)] hover:bg-[hsl(152,69%,35%)] text-white rounded-md text-xs h-8 px-3">
                            {actionLoading === listing.id ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setRejectingId(listing.id); setRejectionReason(""); }} disabled={actionLoading === listing.id}
                            className="border-[hsl(354,50%,80%)] text-[hsl(354,70%,50%)] hover:bg-[hsl(354,70%,97%)] rounded-md text-xs h-8 px-3">
                            <X className="w-3.5 h-3.5 mr-1" />Reject
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openAdminEdit(listing)}
                            className="rounded-md text-xs h-8 px-3">
                            <Edit3 className="w-3.5 h-3.5 mr-1" />Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ ALL LISTINGS ═════════════════════════════════ */}
          {activeTab === "listings" && (
            <div className="space-y-4 max-w-5xl">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold text-foreground">All Listings</h1>
                  <p className="text-xs text-muted-foreground mt-0.5">{stats.total} total listings on the platform</p>
                </div>
              </div>

              {/* Filter pills */}
              <div className="flex gap-1.5 flex-wrap">
                {([
                  { key: "all", label: "All", count: allListings.length },
                  { key: "approved", label: "Live", count: stats.approved },
                  { key: "pending_approval", label: "Pending", count: stats.pending },
                  { key: "rejected", label: "Rejected", count: stats.rejected },
                ] as const).map((f) => (
                  <button key={f.key} onClick={() => setListingFilter(f.key)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition border
                      ${listingFilter === f.key
                        ? "bg-[hsl(250,40%,16%)] text-white border-transparent"
                        : "bg-white dark:bg-[hsl(250,15%,12%)] text-muted-foreground border-[hsl(0,0%,90%)] dark:border-[hsl(250,15%,18%)] hover:border-[hsl(250,30%,70%)]"
                      }`}>
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>

              {/* Table-like list */}
              {loading ? (
                <div className="text-center py-16"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>
              ) : filteredAllListings.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-[hsl(250,15%,12%)] rounded-lg border border-[hsl(0,0%,91%)] dark:border-[hsl(250,15%,18%)]">
                  <Building2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-medium text-foreground text-sm">No listings found</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-[hsl(250,15%,12%)] border border-[hsl(0,0%,91%)] dark:border-[hsl(250,15%,18%)] rounded-lg overflow-hidden divide-y divide-[hsl(0,0%,93%)] dark:divide-[hsl(250,15%,18%)]">
                  {filteredAllListings.map((l) => {
                    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
                      approved: { bg: "bg-[hsl(152,50%,92%)] dark:bg-[hsl(152,30%,15%)]", text: "text-[hsl(152,69%,35%)]", label: "Live" },
                      pending_approval: { bg: "bg-[hsl(38,70%,92%)] dark:bg-[hsl(38,30%,15%)]", text: "text-[hsl(38,80%,35%)]", label: "Pending" },
                      rejected: { bg: "bg-[hsl(0,60%,94%)] dark:bg-[hsl(0,30%,15%)]", text: "text-[hsl(0,70%,45%)]", label: "Rejected" },
                    };
                    const s = statusMap[l.status] || statusMap.approved;
                    return (
                      <div key={l.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[hsl(0,0%,98%)] dark:hover:bg-[hsl(250,15%,14%)] transition-colors">
                        <div className="w-9 h-9 rounded-md bg-[hsl(250,30%,95%)] dark:bg-[hsl(250,20%,18%)] flex items-center justify-center overflow-hidden shrink-0">
                          {l.logoUrl ? <img src={l.logoUrl} alt={l.name} className="w-full h-full object-cover" /> : <Store className="w-4 h-4 text-[hsl(250,30%,55%)]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{l.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{l.category} · {l.district}</p>
                        </div>
                        <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${s.bg} ${s.text}`}>{s.label}</span>
                        {l.documentsUrl && l.documentsUrl.length > 0 && (
                          <div className="hidden sm:flex items-center gap-1">
                            {l.documentsUrl.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 text-[10px] text-[hsl(250,50%,55%)] hover:underline bg-[hsl(250,30%,96%)] dark:bg-[hsl(250,20%,16%)] px-1.5 py-0.5 rounded">
                                <FileText className="w-3 h-3" />Doc<ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ))}
                          </div>
                        )}
                        {l.imageUrls && l.imageUrls.length > 0 && (
                          <button onClick={() => setViewingImages({ listing: l })} className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition">
                            <Image className="w-3 h-3" />{l.imageUrls.length}
                          </button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => openAdminEdit(l)}
                          className="rounded-md h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(l.id)} disabled={actionLoading === l.id}
                          className="text-[hsl(354,70%,55%)] hover:bg-[hsl(354,70%,97%)] rounded-md h-7 w-7 p-0">
                          {actionLoading === l.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══ ENQUIRIES ════════════════════════════════════ */}
          {activeTab === "enquiries" && (
            <div className="space-y-4 max-w-5xl">
              <div>
                <h1 className="text-lg font-semibold text-foreground">Enquiries</h1>
                <p className="text-xs text-muted-foreground mt-0.5">{stats.unreadEnquiries} unread · {stats.enquiries} total</p>
              </div>

              {loading ? (
                <div className="text-center py-16"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>
              ) : filteredEnquiries.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-[hsl(250,15%,12%)] rounded-lg border border-[hsl(0,0%,91%)] dark:border-[hsl(250,15%,18%)]">
                  <Inbox className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-medium text-foreground text-sm">No enquiries yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Enquiries from listings will appear here</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-[hsl(250,15%,12%)] border border-[hsl(0,0%,91%)] dark:border-[hsl(250,15%,18%)] rounded-lg overflow-hidden divide-y divide-[hsl(0,0%,93%)] dark:divide-[hsl(250,15%,18%)]">
                  {filteredEnquiries.map((e) => {
                    const dotColor = e.status === "unread"
                      ? "bg-[hsl(250,50%,55%)]"
                      : e.status === "replied"
                        ? "bg-[hsl(152,69%,40%)]"
                        : "bg-[hsl(0,0%,75%)]";
                    return (
                      <div key={e.id} className="flex items-start gap-3 px-4 py-3.5 hover:bg-[hsl(0,0%,98%)] dark:hover:bg-[hsl(250,15%,14%)] transition-colors">
                        <div className="w-9 h-9 rounded-full bg-[hsl(250,30%,94%)] dark:bg-[hsl(250,20%,18%)] flex items-center justify-center shrink-0 text-xs font-bold text-[hsl(250,50%,50%)]">
                          {e.name[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-medium text-sm text-foreground">{e.name}</p>
                            <div className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
                          </div>
                          <p className="text-[11px] text-muted-foreground mb-1">{e.listingName}</p>
                          <p className="text-xs text-foreground/80 line-clamp-2">{e.message}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {e.email && (
                            <a href={`mailto:${e.email}`} className="w-7 h-7 rounded-md hover:bg-[hsl(0,0%,93%)] dark:hover:bg-[hsl(250,15%,16%)] flex items-center justify-center transition">
                              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                            </a>
                          )}
                          {e.phone && (
                            <a href={`tel:${e.phone}`} className="w-7 h-7 rounded-md hover:bg-[hsl(0,0%,93%)] dark:hover:bg-[hsl(250,15%,16%)] flex items-center justify-center transition">
                              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══ SETTINGS ═════════════════════════════════════ */}
          {activeTab === "settings" && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <h1 className="text-lg font-semibold text-foreground">Settings</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Configure platform-wide preferences</p>
              </div>

              <div className="bg-white dark:bg-[hsl(250,15%,12%)] border border-[hsl(0,0%,91%)] dark:border-[hsl(250,15%,18%)] rounded-lg divide-y divide-[hsl(0,0%,93%)] dark:divide-[hsl(250,15%,18%)]">
                {[
                  { key: "autoApprove" as const, label: "Auto-approve listings", desc: "Automatically approve new listings without manual review" },
                  { key: "emailNotifications" as const, label: "Email notifications", desc: "Send email alerts for new listings and enquiries" },
                  { key: "documentRequired" as const, label: "Require documents", desc: "Require ACRA business profile upload during listing submission" },
                ].map((s) => (
                  <div key={s.key} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                    </div>
                    <Switch
                      checked={settings[s.key]}
                      onCheckedChange={() => setSettings((prev) => ({ ...prev, [s.key]: !prev[s.key] }))}
                    />
                  </div>
                ))}
              </div>

              <div className="bg-white dark:bg-[hsl(250,15%,12%)] border border-[hsl(0,0%,91%)] dark:border-[hsl(250,15%,18%)] rounded-lg px-5 py-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Account</h3>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="text-sm font-medium text-foreground">{user?.email || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Role</span>
                    <Badge className="bg-[hsl(250,30%,94%)] dark:bg-[hsl(250,20%,18%)] text-[hsl(250,50%,45%)] border-0 text-xs">
                      Super Admin
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Seed Demo Data */}
              <div className="bg-white dark:bg-[hsl(250,15%,12%)] border border-[hsl(0,0%,91%)] dark:border-[hsl(250,15%,18%)] rounded-lg px-5 py-4">
                <h3 className="text-sm font-semibold text-foreground mb-1">Demo Data</h3>
                <p className="text-xs text-muted-foreground mb-3">Seed 110 demo businesses (10 per category) to Firestore. Existing demo entries will be overwritten.</p>
                <Button onClick={handleSeedDemoData} disabled={seeding}
                  className="bg-[hsl(250,50%,55%)] hover:bg-[hsl(250,50%,48%)] text-white rounded-md text-xs">
                  {seeding ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Database className="w-4 h-4 mr-1.5" />}
                  {seeding ? "Seeding..." : "Seed 110 Demo Listings"}
                </Button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── Rejection Dialog ─────────────────────────────── */}
      <Dialog open={!!rejectingId} onOpenChange={(open) => { if (!open) { setRejectingId(null); setRejectionReason(""); } }}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <X className="w-5 h-5 text-[hsl(354,70%,54%)]" />Reject Listing
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Please provide a reason. This will be visible to the business owner.</p>
            <div className="space-y-2">
              <Label className="text-foreground">Rejection Reason *</Label>
              <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Missing ACRA business profile document..." rows={3}
                className="rounded-md" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setRejectingId(null); setRejectionReason(""); }} className="rounded-md">Cancel</Button>
            <Button onClick={handleReject} disabled={!rejectionReason.trim() || actionLoading === rejectingId}
              className="bg-[hsl(354,70%,54%)] hover:bg-[hsl(354,70%,48%)] text-white rounded-md">
              {actionLoading === rejectingId ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <X className="w-4 h-4 mr-1.5" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Admin Edit Dialog ───────────────────────────── */}
      <Dialog open={!!editingListing} onOpenChange={(open) => { if (!open) setEditingListing(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Edit3 className="w-5 h-5 text-[hsl(250,50%,55%)]" />Edit Listing (Admin)
            </DialogTitle>
          </DialogHeader>
          {editingListing && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-foreground text-xs font-semibold uppercase tracking-wider">Business Name</Label>
                <Input value={adminEditData.name || ""} onChange={e => setAdminEditData(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-foreground text-xs font-semibold uppercase tracking-wider">Category</Label>
                  <Input value={adminEditData.category || ""} onChange={e => setAdminEditData(prev => ({ ...prev, category: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground text-xs font-semibold uppercase tracking-wider">District</Label>
                  <Input value={adminEditData.district || ""} onChange={e => setAdminEditData(prev => ({ ...prev, district: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground text-xs font-semibold uppercase tracking-wider">Address</Label>
                <Input value={adminEditData.address || ""} onChange={e => setAdminEditData(prev => ({ ...prev, address: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-foreground text-xs font-semibold uppercase tracking-wider">Phone</Label>
                  <Input value={adminEditData.phone || ""} onChange={e => setAdminEditData(prev => ({ ...prev, phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground text-xs font-semibold uppercase tracking-wider">Email</Label>
                  <Input value={adminEditData.email || ""} onChange={e => setAdminEditData(prev => ({ ...prev, email: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground text-xs font-semibold uppercase tracking-wider">Website</Label>
                <Input value={adminEditData.website || ""} onChange={e => setAdminEditData(prev => ({ ...prev, website: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground text-xs font-semibold uppercase tracking-wider">Description</Label>
                <Textarea value={adminEditData.description || ""} onChange={e => setAdminEditData(prev => ({ ...prev, description: e.target.value }))} rows={3} />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground text-xs font-semibold uppercase tracking-wider">Status</Label>
                <select value={adminEditData.status || "pending_approval"}
                  onChange={e => setAdminEditData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="approved">Approved (Live)</option>
                  <option value="pending_approval">Pending Review</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Verification Documents */}
              {editingListing.documentsUrl && editingListing.documentsUrl.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-[hsl(0,0%,90%)] dark:border-[hsl(250,15%,18%)]">
                  <Label className="text-foreground text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />Verification Documents
                  </Label>
                  <div className="space-y-1.5">
                    {editingListing.documentsUrl.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-[hsl(250,50%,55%)] hover:underline bg-[hsl(250,30%,96%)] dark:bg-[hsl(250,20%,16%)] px-3 py-2 rounded-md">
                        <FileText className="w-4 h-4 shrink-0" />
                        <span className="truncate flex-1">{url}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Images Review */}
              {adminEditData.imageUrls && adminEditData.imageUrls.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-[hsl(0,0%,90%)] dark:border-[hsl(250,15%,18%)]">
                  <Label className="text-foreground text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Image className="w-3.5 h-3.5" />Business Images ({adminEditData.imageUrls.length})
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(adminEditData.imageUrls as string[]).map((url, i) => (
                      <div key={i} className="relative group aspect-square rounded-md overflow-hidden border border-[hsl(0,0%,90%)] dark:border-[hsl(250,15%,20%)]">
                        <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                        <button onClick={() => setAdminEditData(prev => ({ ...prev, imageUrls: prev.imageUrls.filter((_: string, idx: number) => idx !== i) }))}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[hsl(354,70%,54%)] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter className="gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditingListing(null)} className="rounded-md">Cancel</Button>
                <Button onClick={saveAdminEdit} disabled={adminSaving}
                  className="bg-[hsl(250,50%,55%)] hover:bg-[hsl(250,50%,48%)] text-white rounded-md">
                  {adminSaving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Image Viewer Dialog ─────────────────────────── */}
      <Dialog open={!!viewingImages} onOpenChange={(open) => { if (!open) setViewingImages(null); }}>
        <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Image className="w-5 h-5 text-[hsl(250,50%,55%)]" />
              {viewingImages?.listing.name} — Images
            </DialogTitle>
          </DialogHeader>
          {viewingImages && (
            <div className="grid grid-cols-2 gap-3 py-2">
              {(viewingImages.listing.imageUrls || []).map((url, i) => (
                <img key={i} src={url} alt={`Image ${i + 1}`} className="w-full aspect-square rounded-lg object-cover border border-[hsl(0,0%,90%)] dark:border-[hsl(250,15%,20%)]" />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
