import { useState, useEffect, useMemo } from "react";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  LogOut, Search, Bell, ChevronRight, Eye, Store, Trash2,
  MessageSquare, Mail, Phone, ChevronDown, ChevronUp, Menu,
} from "lucide-react";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════════════
   SHARED PURPLE THEME CONSTANTS
   ═══════════════════════════════════════════════════════════ */
const P = {
  bg: "bg-[hsl(262,30%,97%)] dark:bg-[hsl(262,20%,7%)]",
  card: "bg-white dark:bg-[hsl(262,20%,12%)] border border-[hsl(262,20%,92%)] dark:border-[hsl(262,20%,20%)]",
  cardHover: "hover:shadow-md transition-shadow",
  subtle: "bg-[hsl(262,30%,97%)] dark:bg-[hsl(262,20%,10%)]",
  muted: "text-[hsl(262,15%,50%)]",
  accent: "hsl(262,60%,55%)",
  accentBg: "bg-[hsl(262,60%,55%)]",
  accentLight: "bg-[hsl(262,40%,95%)] dark:bg-[hsl(262,20%,18%)]",
  border: "border-[hsl(262,20%,92%)] dark:border-[hsl(262,20%,20%)]",
  gradient: "bg-gradient-to-br from-[hsl(262,60%,55%)] to-[hsl(262,70%,45%)]",
};

type AdminTab = "dashboard" | "listings" | "enquiries" | "settings";

/* ═══════════════════════════════════════════════════════════
   SIDEBAR NAV ITEM
   ═══════════════════════════════════════════════════════════ */
const SideItem = ({
  icon: Icon, label, active, count, onClick,
}: { icon: any; label: string; active?: boolean; count?: number; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all
      ${active
        ? `${P.accentBg} text-white shadow-md`
        : `${P.muted} hover:bg-[hsl(262,40%,95%)] dark:hover:bg-[hsl(262,20%,15%)]`
      }`}
  >
    <Icon className="w-[18px] h-[18px]" />
    <span className="flex-1 text-left">{label}</span>
    {count !== undefined && count > 0 && (
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
        active ? "bg-white/20 text-white" : "bg-[hsl(262,60%,55%)] text-white"
      }`}>{count}</span>
    )}
  </button>
);

/* ═══════════════════════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════════════════════ */
const StatCard = ({
  icon: Icon, label, value, color,
}: { icon: any; label: string; value: number | string; color: string }) => (
  <div className={`${P.card} rounded-2xl p-5 shadow-sm`}>
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className={`text-xs font-medium ${P.muted}`}>{label}</span>
    </div>
    <p className="text-3xl font-bold text-foreground">{value}</p>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   LISTING REVIEW CARD (Pending Queue)
   ═══════════════════════════════════════════════════════════ */
const ListingReviewCard = ({
  listing, actionLoading, onApprove, onReject,
}: {
  listing: Listing;
  actionLoading: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) => (
  <div className={`${P.card} rounded-2xl p-5 shadow-sm ${P.cardHover}`}>
    <div className="flex items-start gap-4 mb-4">
      <div className={`w-14 h-14 rounded-xl ${P.accentLight} flex items-center justify-center overflow-hidden flex-shrink-0 border ${P.border}`}>
        {listing.logoUrl ? (
          <img src={listing.logoUrl} alt={listing.name} className="w-full h-full object-cover rounded-xl" />
        ) : (
          <Store className="w-6 h-6 text-[hsl(262,40%,60%)]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-semibold text-foreground truncate">{listing.name}</h3>
          <Badge className="bg-[hsl(38,92%,50%)] text-white border-0 text-[10px] px-2 py-0.5 rounded-full font-medium">Pending</Badge>
        </div>
        <p className={`text-xs ${P.muted} truncate`}>{listing.address}</p>
      </div>
      <Badge className={`${P.accentLight} text-[hsl(262,50%,45%)] dark:text-[hsl(262,50%,70%)] border-0 text-xs font-medium rounded-full px-3`}>
        {listing.category}
      </Badge>
    </div>
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4 ${P.subtle} rounded-xl p-3`}>
      {[
        { l: "UEN", v: listing.uen },
        { l: "District", v: listing.district },
        { l: "Phone", v: listing.phone || "—" },
        { l: "Postal", v: listing.postalCode },
      ].map((f) => (
        <div key={f.l}>
          <span className={P.muted}>{f.l}</span>
          <p className="font-semibold text-foreground mt-0.5">{f.v}</p>
        </div>
      ))}
    </div>
    {listing.description && <p className={`text-xs ${P.muted} mb-4 line-clamp-2`}>{listing.description}</p>}
    {listing.documentsUrl && listing.documentsUrl.length > 0 && (
      <div className="flex gap-2 mb-4 flex-wrap">
        {listing.documentsUrl.map((url, i) => (
          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 text-xs text-[hsl(262,60%,55%)] hover:underline ${P.accentLight} px-2.5 py-1.5 rounded-lg`}>
            <FileText className="w-3 h-3" />Doc {i + 1}<ExternalLink className="w-2.5 h-2.5" />
          </a>
        ))}
      </div>
    )}
    <div className={`flex gap-2 pt-3 border-t ${P.border}`}>
      <Button size="sm" onClick={() => onApprove(listing.id)} disabled={actionLoading === listing.id}
        className="bg-[hsl(152,69%,40%)] hover:bg-[hsl(152,69%,35%)] text-white rounded-xl text-xs px-4">
        {actionLoading === listing.id ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}
        Approve
      </Button>
      <Button size="sm" variant="outline" onClick={() => onReject(listing.id)} disabled={actionLoading === listing.id}
        className="border-[hsl(0,70%,60%)] text-[hsl(0,70%,50%)] hover:bg-[hsl(0,70%,97%)] rounded-xl text-xs px-4">
        <X className="w-3.5 h-3.5 mr-1.5" />Reject
      </Button>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   ALL LISTINGS CARD
   ═══════════════════════════════════════════════════════════ */
const AllListingRow = ({
  listing, onDelete, deleting,
}: { listing: Listing; onDelete: (id: string) => void; deleting: string | null }) => {
  const statusMap: Record<string, { bg: string; text: string; label: string }> = {
    approved: { bg: "bg-[hsl(152,50%,92%)]", text: "text-[hsl(152,69%,35%)]", label: "Live" },
    pending_approval: { bg: "bg-[hsl(38,70%,92%)]", text: "text-[hsl(38,80%,35%)]", label: "Pending" },
    rejected: { bg: "bg-[hsl(0,60%,94%)]", text: "text-[hsl(0,70%,45%)]", label: "Rejected" },
  };
  const s = statusMap[listing.status] || statusMap.approved;

  return (
    <div className={`${P.card} rounded-xl p-4 shadow-sm flex items-center gap-4 ${P.cardHover}`}>
      <div className={`w-11 h-11 rounded-lg ${P.accentLight} flex items-center justify-center overflow-hidden flex-shrink-0`}>
        {listing.logoUrl ? (
          <img src={listing.logoUrl} alt={listing.name} className="w-full h-full object-cover rounded-lg" />
        ) : (
          <Store className="w-5 h-5 text-[hsl(262,40%,60%)]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">{listing.name}</p>
        <p className={`text-xs ${P.muted} truncate`}>{listing.category} · {listing.district}</p>
      </div>
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.bg} ${s.text}`}>{s.label}</span>
      <Button size="sm" variant="ghost" onClick={() => onDelete(listing.id)} disabled={deleting === listing.id}
        className="text-[hsl(0,70%,55%)] hover:bg-[hsl(0,70%,97%)] rounded-lg h-8 w-8 p-0">
        {deleting === listing.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      </Button>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   ENQUIRY CARD
   ═══════════════════════════════════════════════════════════ */
interface Enquiry {
  id: string; listingId: string; listingName: string;
  name: string; email: string; phone?: string; message: string;
  status: "unread" | "read" | "replied"; createdAt: any;
}

const EnquiryCard = ({ e }: { e: Enquiry }) => {
  const statusColor = e.status === "unread"
    ? "bg-[hsl(262,60%,55%)]"
    : e.status === "replied"
      ? "bg-[hsl(152,69%,40%)]"
      : "bg-[hsl(38,92%,50%)]";

  return (
    <div className={`${P.card} rounded-xl p-4 shadow-sm ${P.cardHover}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full ${P.accentLight} flex items-center justify-center flex-shrink-0 text-sm font-bold text-[hsl(262,60%,55%)]`}>
          {e.name[0]?.toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-sm text-foreground">{e.name}</p>
            <div className={`w-2 h-2 rounded-full ${statusColor}`} />
          </div>
          <p className={`text-xs ${P.muted} mb-1`}>{e.listingName}</p>
          <p className="text-xs text-foreground line-clamp-2">{e.message}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            {e.email && (
              <a href={`mailto:${e.email}`} className="w-7 h-7 rounded-lg bg-[hsl(262,40%,95%)] dark:bg-[hsl(262,20%,18%)] flex items-center justify-center hover:bg-[hsl(262,40%,90%)] transition">
                <Mail className="w-3 h-3 text-[hsl(262,60%,55%)]" />
              </a>
            )}
            {e.phone && (
              <a href={`tel:${e.phone}`} className="w-7 h-7 rounded-lg bg-[hsl(262,40%,95%)] dark:bg-[hsl(262,20%,18%)] flex items-center justify-center hover:bg-[hsl(262,40%,90%)] transition">
                <Phone className="w-3 h-3 text-[hsl(262,60%,55%)]" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN ADMIN PAGE
   ═══════════════════════════════════════════════════════════ */
const Admin = () => {
  const { user, isAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [listingFilter, setListingFilter] = useState<"all" | "approved" | "pending_approval" | "rejected">("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Settings state
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
      // Fetch all listings
      const allSnap = await getDocs(collection(db, "listings"));
      const all = allSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing));
      setAllListings(all);
      setPendingListings(all.filter((l) => l.status === "pending_approval"));

      // Fetch enquiries
      try {
        const eSnap = await getDocs(collection(db, "enquiries"));
        setEnquiries(eSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Enquiry)));
      } catch {}
    } catch {
      // Demo fallback
      const demo: Listing[] = [{
        id: "pending-1", name: "New Café SG", uen: "202399999F",
        category: "Food & Beverage", district: "Tiong Bahru",
        address: "78 Yong Siak Street, Singapore 163078", postalCode: "163078",
        phone: "+65 6111 2222", status: "pending_approval", ownerId: "demo",
        documentsUrl: ["https://example.com/doc.pdf"],
      }];
      setAllListings(demo);
      setPendingListings(demo);
    }
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await updateDoc(doc(db, "listings", id), { status: "approved", rejectionReason: "" });
      setPendingListings((prev) => prev.filter((l) => l.id !== id));
      setAllListings((prev) => prev.map((l) => l.id === id ? { ...l, status: "approved" } : l));
      toast.success("Listing approved");
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
      <div className={`min-h-screen flex items-center justify-center ${P.bg}`}>
        <Loader2 className="w-6 h-6 animate-spin text-[hsl(262,60%,55%)]" />
      </div>
    );
  }

  const searchPlaceholder: Record<AdminTab, string> = {
    dashboard: "Search pending listings...",
    listings: "Search all listings...",
    enquiries: "Search enquiries...",
    settings: "Search settings...",
  };

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2.5 mb-8">
        <div className={`w-9 h-9 rounded-xl ${P.accentBg} flex items-center justify-center`}>
          <Shield className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg text-foreground">Admin</span>
      </div>
      <div className="space-y-1 mb-6">
        <p className={`text-[10px] uppercase tracking-widest ${P.muted} font-semibold px-4 mb-2`}>Overview</p>
        <SideItem icon={LayoutDashboard} label="Dashboard" active={activeTab === "dashboard"} count={stats.pending} onClick={() => { setActiveTab("dashboard"); setMobileMenuOpen(false); }} />
        <SideItem icon={Building2} label="All Listings" active={activeTab === "listings"} count={stats.total} onClick={() => { setActiveTab("listings"); setMobileMenuOpen(false); }} />
        <SideItem icon={MessageSquare} label="Enquiries" active={activeTab === "enquiries"} count={stats.unreadEnquiries} onClick={() => { setActiveTab("enquiries"); setMobileMenuOpen(false); }} />
      </div>
      <div className="space-y-1 mb-6">
        <p className={`text-[10px] uppercase tracking-widest ${P.muted} font-semibold px-4 mb-2`}>System</p>
        <SideItem icon={Settings} label="Settings" active={activeTab === "settings"} onClick={() => { setActiveTab("settings"); setMobileMenuOpen(false); }} />
        {isSuperAdmin && (
          <SideItem icon={Shield} label="Super Admin" onClick={() => navigate("/super-admin")} />
        )}
      </div>
      <div className="mt-auto space-y-1">
        <SideItem icon={LogOut} label="Logout" onClick={async () => { await signOut(auth); navigate("/"); }} />
      </div>
    </>
  );

  return (
    <div className={`min-h-screen ${P.bg} flex`}>
      {/* ── Desktop Sidebar ──────────────────────────────── */}
      <aside className={`hidden lg:flex flex-col w-[240px] bg-white dark:bg-[hsl(262,20%,10%)] border-r ${P.border} p-5 sticky top-0 h-screen`}>
        {sidebarContent}
      </aside>

      {/* ── Mobile sidebar overlay ───────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <aside className={`relative w-[260px] h-full bg-white dark:bg-[hsl(262,20%,10%)] p-5 flex flex-col shadow-2xl`}>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* ── Main ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className={`sticky top-0 z-30 bg-white/80 dark:bg-[hsl(262,20%,10%)]/80 backdrop-blur-xl border-b ${P.border} px-4 sm:px-6 py-3 flex items-center gap-3`}>
          <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden w-9 h-9 rounded-xl bg-[hsl(262,30%,96%)] dark:bg-[hsl(262,20%,14%)] flex items-center justify-center">
            <Menu className="w-4 h-4 text-[hsl(262,15%,45%)]" />
          </button>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(262,15%,55%)]" />
            <input type="text" placeholder={searchPlaceholder[activeTab]} value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(262,30%,96%)] dark:bg-[hsl(262,20%,14%)] text-sm text-foreground placeholder:text-[hsl(262,15%,55%)] border-0 focus:outline-none focus:ring-2 focus:ring-[hsl(262,60%,55%)] transition" />
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button className="w-9 h-9 rounded-xl bg-[hsl(262,30%,96%)] dark:bg-[hsl(262,20%,14%)] flex items-center justify-center relative">
              <Bell className="w-4 h-4 text-[hsl(262,15%,45%)]" />
              {stats.pending > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[hsl(0,70%,55%)] text-white text-[9px] font-bold flex items-center justify-center">{stats.pending}</span>}
            </button>
            <div className={`hidden sm:flex items-center gap-2.5 pl-3 border-l ${P.border}`}>
              <div className={`w-8 h-8 rounded-full ${P.accentBg} flex items-center justify-center text-white text-xs font-bold`}>
                {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || "A"}
              </div>
              <span className="text-sm font-medium text-foreground">{user?.displayName || user?.email?.split("@")[0] || "Admin"}</span>
            </div>
          </div>
        </header>

        {/* ── Tab Content ─────────────────────────────────── */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">

          {/* ═══ DASHBOARD TAB ═══════════════════════════════ */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Hero */}
              <div className={`${P.gradient} rounded-2xl p-6 sm:p-8 relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 right-12 w-24 h-24 rounded-full border-2 border-white/30" />
                  <div className="absolute bottom-4 right-32 w-16 h-16 rounded-full border-2 border-white/20" />
                </div>
                <p className="text-white/70 text-xs uppercase tracking-widest font-semibold mb-2">Admin Dashboard</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Review & Manage Listings</h1>
                <p className="text-white/70 text-sm max-w-md">Approve or reject business listings to keep the directory trusted.</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard icon={Clock} label="Pending" value={stats.pending} color="bg-[hsl(262,40%,93%)] text-[hsl(262,60%,50%)]" />
                <StatCard icon={Check} label="Approved" value={stats.approved} color="bg-[hsl(152,50%,92%)] text-[hsl(152,69%,35%)]" />
                <StatCard icon={AlertTriangle} label="Rejected" value={stats.rejected} color="bg-[hsl(0,60%,94%)] text-[hsl(0,70%,50%)]" />
                <StatCard icon={MessageSquare} label="Enquiries" value={stats.enquiries} color="bg-[hsl(210,60%,93%)] text-[hsl(210,80%,45%)]" />
              </div>

              {/* Pending Queue */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-foreground">Pending Queue</h2>
                  <span className={`text-xs ${P.muted}`}>{filteredPending.length} listing{filteredPending.length !== 1 ? "s" : ""}</span>
                </div>
                {loading ? (
                  <div className="text-center py-16"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[hsl(262,60%,55%)]" /></div>
                ) : filteredPending.length === 0 ? (
                  <div className={`text-center py-16 ${P.card} rounded-2xl`}>
                    <div className="w-14 h-14 rounded-full bg-[hsl(152,50%,92%)] flex items-center justify-center mx-auto mb-4">
                      <Check className="w-6 h-6 text-[hsl(152,69%,40%)]" />
                    </div>
                    <p className="font-semibold text-foreground mb-1">All caught up!</p>
                    <p className={`text-sm ${P.muted}`}>No pending listings to review</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPending.map((listing) => (
                      <ListingReviewCard key={listing.id} listing={listing} actionLoading={actionLoading}
                        onApprove={handleApprove} onReject={(id) => { setRejectingId(id); setRejectionReason(""); }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ ALL LISTINGS TAB ════════════════════════════ */}
          {activeTab === "listings" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">All Listings</h1>
                <p className={`text-sm ${P.muted}`}>Manage all business listings across the platform</p>
              </div>

              {/* Filter chips */}
              <div className="flex gap-2 flex-wrap">
                {([
                  { key: "all", label: "All", count: allListings.length },
                  { key: "approved", label: "Live", count: stats.approved },
                  { key: "pending_approval", label: "Pending", count: stats.pending },
                  { key: "rejected", label: "Rejected", count: stats.rejected },
                ] as const).map((f) => (
                  <button key={f.key} onClick={() => setListingFilter(f.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      listingFilter === f.key
                        ? `${P.accentBg} text-white shadow-sm`
                        : `${P.accentLight} ${P.muted} hover:bg-[hsl(262,40%,90%)]`
                    }`}>
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>

              {/* Listing rows */}
              {loading ? (
                <div className="text-center py-16"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[hsl(262,60%,55%)]" /></div>
              ) : filteredAllListings.length === 0 ? (
                <div className={`text-center py-16 ${P.card} rounded-2xl`}>
                  <Building2 className="w-10 h-10 mx-auto mb-3 text-[hsl(262,40%,70%)]" />
                  <p className="font-semibold text-foreground mb-1">No listings found</p>
                  <p className={`text-sm ${P.muted}`}>Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAllListings.map((l) => (
                    <AllListingRow key={l.id} listing={l} onDelete={handleDelete} deleting={actionLoading} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ ENQUIRIES TAB ═══════════════════════════════ */}
          {activeTab === "enquiries" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">Enquiries</h1>
                <p className={`text-sm ${P.muted}`}>{stats.unreadEnquiries} unread · {stats.enquiries} total</p>
              </div>

              {loading ? (
                <div className="text-center py-16"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[hsl(262,60%,55%)]" /></div>
              ) : filteredEnquiries.length === 0 ? (
                <div className={`text-center py-16 ${P.card} rounded-2xl`}>
                  <Inbox className="w-10 h-10 mx-auto mb-3 text-[hsl(262,40%,70%)]" />
                  <p className="font-semibold text-foreground mb-1">No enquiries yet</p>
                  <p className={`text-sm ${P.muted}`}>Enquiries from business listings will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEnquiries.map((e) => <EnquiryCard key={e.id} e={e} />)}
                </div>
              )}
            </div>
          )}

          {/* ═══ SETTINGS TAB ════════════════════════════════ */}
          {activeTab === "settings" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">Settings</h1>
                <p className={`text-sm ${P.muted}`}>Configure platform-wide preferences</p>
              </div>

              <div className={`${P.card} rounded-2xl p-6 shadow-sm space-y-6`}>
                {[
                  { key: "autoApprove" as const, label: "Auto-approve listings", desc: "Automatically approve new listings without manual review" },
                  { key: "emailNotifications" as const, label: "Email notifications", desc: "Send email alerts for new listings and enquiries" },
                  { key: "documentRequired" as const, label: "Require documents", desc: "Require ACRA business profile upload during listing submission" },
                ].map((s) => (
                  <div key={s.key} className={`flex items-center justify-between py-3 ${s.key !== "documentRequired" ? `border-b ${P.border}` : ""}`}>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{s.label}</p>
                      <p className={`text-xs ${P.muted} mt-0.5`}>{s.desc}</p>
                    </div>
                    <Switch
                      checked={settings[s.key]}
                      onCheckedChange={() => setSettings((prev) => ({ ...prev, [s.key]: !prev[s.key] }))}
                    />
                  </div>
                ))}
              </div>

              <div className={`${P.card} rounded-2xl p-6 shadow-sm`}>
                <h3 className="text-sm font-bold text-foreground mb-3">Account</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${P.muted}`}>Email</span>
                    <span className="text-sm font-medium text-foreground">{user?.email || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${P.muted}`}>Role</span>
                    <Badge className={`${P.accentLight} text-[hsl(262,50%,45%)] border-0 text-xs`}>
                      {isSuperAdmin ? "Super Admin" : "Admin"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Right Sidebar ────────────────────────────────── */}
      <aside className={`hidden xl:flex flex-col w-[280px] bg-white dark:bg-[hsl(262,20%,10%)] border-l ${P.border} p-5 sticky top-0 h-screen overflow-y-auto`}>
        {/* Profile */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-3">
            <div className={`w-20 h-20 rounded-full ${P.gradient} flex items-center justify-center text-white text-2xl font-bold mx-auto ring-4 ring-[hsl(262,40%,92%)]`}>
              {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[hsl(152,69%,40%)] flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          </div>
          <h3 className="font-bold text-foreground">{user?.displayName || "Admin"} 🔒</h3>
          <p className={`text-xs ${P.muted} mt-1`}>{isSuperAdmin ? "Super Administrator" : "Administrator"}</p>
        </div>

        {/* Stats */}
        <div className={`${P.subtle} rounded-2xl p-4 mb-6`}>
          <h4 className="text-sm font-bold text-foreground mb-3">Platform Stats</h4>
          <div className="space-y-3">
            {[
              { label: "Total Listings", val: stats.total, color: "bg-[hsl(262,60%,55%)]" },
              { label: "Pending", val: stats.pending, color: "bg-[hsl(38,92%,50%)]" },
              { label: "Approved", val: stats.approved, color: "bg-[hsl(152,69%,40%)]" },
              { label: "Rejected", val: stats.rejected, color: "bg-[hsl(0,70%,55%)]" },
              { label: "Enquiries", val: stats.enquiries, color: "bg-[hsl(210,80%,50%)]" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                  <span className={`text-xs ${P.muted}`}>{s.label}</span>
                </div>
                <span className="text-sm font-bold text-foreground">{s.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Listings */}
        <div>
          <h4 className="text-sm font-bold text-foreground mb-3">Recent Listings</h4>
          <div className="space-y-3">
            {allListings.slice(0, 5).map((l) => (
              <div key={l.id} className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${P.accentLight} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                  {l.logoUrl ? (
                    <img src={l.logoUrl} alt={l.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <Store className="w-4 h-4 text-[hsl(262,40%,60%)]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{l.name}</p>
                  <p className={`text-[10px] ${P.muted}`}>{l.category}</p>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 ${P.muted} flex-shrink-0`} />
              </div>
            ))}
            {allListings.length === 0 && <p className={`text-xs ${P.muted} text-center py-4`}>No listings yet</p>}
          </div>
        </div>
      </aside>

      {/* ── Rejection Dialog ─────────────────────────────── */}
      <Dialog open={!!rejectingId} onOpenChange={(open) => { if (!open) { setRejectingId(null); setRejectionReason(""); } }}>
        <DialogContent className={`sm:max-w-md bg-white dark:bg-[hsl(262,20%,12%)] ${P.border}`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <X className="w-5 h-5 text-[hsl(0,70%,55%)]" />Reject Listing
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className={`text-sm ${P.muted}`}>Please provide a reason. This will be visible to the business owner.</p>
            <div className="space-y-2">
              <Label className="text-foreground">Rejection Reason *</Label>
              <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Missing ACRA business profile document..." rows={3}
                className={`${P.subtle} ${P.border} rounded-xl`} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setRejectingId(null); setRejectionReason(""); }} className="rounded-xl">Cancel</Button>
            <Button onClick={handleReject} disabled={!rejectionReason.trim() || actionLoading === rejectingId}
              className="bg-[hsl(0,70%,55%)] hover:bg-[hsl(0,70%,48%)] text-white rounded-xl">
              {actionLoading === rejectingId ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <X className="w-4 h-4 mr-1.5" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
