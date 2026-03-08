import { useState, useEffect, useMemo } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminAddBusiness from "@/components/admin/AdminAddBusiness";
import { getBusinessUrl } from "@/lib/url-helpers";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Users, Building2, BarChart3, Settings, Search, MoreHorizontal,
  Check, X, Eye, Trash2, Ban, UserCheck, Shield, Crown,
  TrendingUp, Activity, FileText, ExternalLink, ChevronDown,
  Mail, Phone, Calendar, LayoutDashboard, PieChart, LogOut,
  ChevronRight, DollarSign, ArrowUpRight, ArrowDownRight, Sparkles, Ticket, Loader2,
  Home, Package, Store, Bell, MessageSquare, Globe, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Listing } from "@/components/ListingCard";
import { DEMO_USERS, DEMO_ALL_LISTINGS, PlatformUser } from "@/lib/demo-data";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
  PieChart as RechartsPie, Pie, Cell, AreaChart, Area, BarChart, Bar,
} from "recharts";

// ── Status & Role badges ──
const statusBadge = (status: string) => {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: "bg-emerald-50 dark:bg-emerald-950", text: "text-emerald-700 dark:text-emerald-400", label: "Active" },
    suspended: { bg: "bg-amber-50 dark:bg-amber-950", text: "text-amber-700 dark:text-amber-400", label: "Suspended" },
    banned: { bg: "bg-red-50 dark:bg-red-950", text: "text-red-700 dark:text-red-400", label: "Banned" },
    approved: { bg: "bg-emerald-50 dark:bg-emerald-950", text: "text-emerald-700 dark:text-emerald-400", label: "Approved" },
    pending_approval: { bg: "bg-amber-50 dark:bg-amber-950", text: "text-amber-700 dark:text-amber-400", label: "Pending" },
    rejected: { bg: "bg-red-50 dark:bg-red-950", text: "text-red-700 dark:text-red-400", label: "Rejected" },
  };
  const s = map[status] || { bg: "bg-muted", text: "text-foreground", label: status };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</span>;
};

const roleBadge = (role: string) => {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    superadmin: { bg: "bg-indigo-50 dark:bg-indigo-950", text: "text-indigo-700 dark:text-indigo-400", label: "Super Admin" },
    admin: { bg: "bg-primary/10", text: "text-primary", label: "Admin" },
    business_owner: { bg: "bg-cyan-50 dark:bg-cyan-950", text: "text-cyan-700 dark:text-cyan-400", label: "Business" },
  };
  const r = map[role] || { bg: "bg-muted", text: "text-foreground", label: "User" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${r.bg} ${r.text}`}>{r.label}</span>;
};

const CHART_COLORS = ["#5c6ac4", "#47c1bf", "#f49342", "#9c6ade", "#e06c9f", "#50b83c", "#de3618", "#f4d03f"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type NavItem = "dashboard" | "users" | "listings" | "tickets" | "statistics" | "settings";

const SuperAdmin = () => {
  const { user, isSuperAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState<NavItem>("dashboard");
  const [users, setUsers] = useState<PlatformUser[]>(DEMO_USERS);
  const [listings, setListings] = useState<Listing[]>(DEMO_ALL_LISTINGS);
  const [userSearch, setUserSearch] = useState("");
  const [listingSearch, setListingSearch] = useState("");
  const [listingFilter, setListingFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [featuredTickets, setFeaturedTickets] = useState<any[]>([]);
  const [rejectingListingId, setRejectingListingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showAddBusiness, setShowAddBusiness] = useState(false);
  const [platformSettings, setPlatformSettings] = useState({
    autoApprove: false,
    emailNotifications: true,
    smsVerification: true,
    documentRequired: true,
  });

  const toggleSetting = async (key: keyof typeof platformSettings) => {
    const newVal = !platformSettings[key];
    setPlatformSettings(prev => ({ ...prev, [key]: newVal }));
    try {
      await setDoc(doc(db, "platform_settings", "general"), { ...platformSettings, [key]: newVal }, { merge: true });
      toast.success("Setting updated");
    } catch { toast.error("Failed to save setting"); }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDocs(collection(db, "platform_settings"));
        snap.docs.forEach(d => { if (d.id === "general") setPlatformSettings(prev => ({ ...prev, ...d.data() })); });
      } catch {}
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const snap = await getDocs(collection(db, "listings"));
        if (!snap.empty) setListings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing)));
      } catch {}
    };
    fetchListings();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        if (!snap.empty) {
          setUsers(snap.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              email: data.email || "",
              displayName: data.displayName || data.name || "Unknown",
              role: data.role || "user",
              status: data.status || "active",
              joinedAt: data.joinedAt || data.createdAt?.toDate?.()?.toISOString?.()?.split("T")[0] || "—",
              listingsCount: data.listingsCount || 0,
              lastActive: data.lastActive || "—",
              phone: data.phone || "",
            } as PlatformUser;
          }));
        }
      } catch {}
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const snap = await getDocs(collection(db, "featured_tickets"));
        if (!snap.empty) setFeaturedTickets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch {}
    };
    fetchTickets();
  }, []);

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === "active").length;
  const totalListings = listings.length;
  const approvedListings = listings.filter(l => l.status === "approved").length;
  const pendingListings = listings.filter(l => l.status === "pending_approval").length;
  const rejectedListings = listings.filter(l => l.status === "rejected").length;
  const featuredListings = listings.filter(l => l.featured).length;

  // Compute category distribution from real data
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    listings.forEach(l => { counts[l.category] = (counts[l.category] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const total = listings.length || 1;
    return sorted.slice(0, 4).map(([name, count], i) => ({
      name: name.length > 12 ? name.split(" ")[0] : name,
      fullName: name,
      value: Math.round((count / total) * 100),
      count,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [listings]);

  // Top categories (top 5)
  const topCategoriesData = useMemo(() => {
    const counts: Record<string, number> = {};
    listings.forEach(l => { counts[l.category] = (counts[l.category] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [listings]);

  // Listing trend by month (from createdAt)
  const listingTrendData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const monthCounts: Record<string, { current: number; previous: number }> = {};
    MONTHS.forEach(m => { monthCounts[m] = { current: 0, previous: 0 }; });
    listings.forEach(l => {
      if (!l.createdAt) return;
      const d = l.createdAt.toDate ? l.createdAt.toDate() : new Date(l.createdAt);
      const year = d.getFullYear();
      const month = MONTHS[d.getMonth()];
      if (year === currentYear) monthCounts[month].current++;
      else if (year === currentYear - 1) monthCounts[month].previous++;
    });
    return MONTHS.map(m => ({ month: m, ...monthCounts[m] }));
  }, [listings]);

  // Sparkline data based on listing trend
  const sparkData = useMemo(() => listingTrendData.map(d => d.current), [listingTrendData]);

  // Platform breakdown from real data
  const breakdownData = useMemo(() => {
    const uniqueCategories = new Set(listings.map(l => l.category)).size;
    return [
      { label: "Total listings", value: String(totalListings), change: `${totalListings}`, positive: true },
      { label: "Pending review", value: String(pendingListings), change: pendingListings > 0 ? `${pendingListings} pending` : "—", positive: pendingListings === 0 },
      { label: "Rejected", value: String(rejectedListings), change: rejectedListings > 0 ? `${rejectedListings} rejected` : "—", positive: rejectedListings === 0 },
      { label: "Active listings", value: String(approvedListings), change: `${approvedListings}`, positive: true },
      { label: "Featured", value: String(featuredListings), change: featuredListings > 0 ? `${featuredListings} featured` : "—", positive: true },
      { label: "Categories", value: String(uniqueCategories), change: `${uniqueCategories} types`, positive: true },
    ];
  }, [totalListings, pendingListings, rejectedListings, approvedListings, featuredListings, listings]);

  // Avg views placeholder (computed from listing count per month)
  const avgOrderData = useMemo(() => {
    return listingTrendData.filter((_, i) => i % 2 === 1).map(d => ({ month: d.month, value: d.current }));
  }, [listingTrendData]);

  const filteredUsers = users.filter(u =>
    u.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );
  const filteredListings = listings.filter(l => {
    const matchSearch = l.name.toLowerCase().includes(listingSearch.toLowerCase()) || l.uen.toLowerCase().includes(listingSearch.toLowerCase());
    const matchFilter = listingFilter === "all" || l.status === listingFilter;
    return matchSearch && matchFilter;
  });

  const handleUserAction = (userId: string, action: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      switch (action) {
        case "activate": return { ...u, status: "active" as const };
        case "suspend": return { ...u, status: "suspended" as const };
        case "ban": return { ...u, status: "banned" as const };
        case "promote_admin": return { ...u, role: "admin" as const };
        case "demote": return { ...u, role: "user" as const };
        default: return u;
      }
    }));
    toast.success(`User ${action.replace("_", " ")} successfully`);
  };
  const handleDeleteUser = (userId: string) => { setUsers(prev => prev.filter(u => u.id !== userId)); toast.success("User deleted"); };

  const handleListingApprove = async (listingId: string) => {
    setActionLoading(listingId);
    try {
      await updateDoc(doc(db, "listings", listingId), { status: "approved", rejectionReason: "" });
      setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: "approved" } : l));
      toast.success("Listing approved");
    } catch (err: any) { toast.error(err.message || "Failed to update listing"); }
    setActionLoading(null);
  };
  const handleListingReject = async () => {
    if (!rejectingListingId || !rejectionReason.trim()) { toast.error("Please provide a reason"); return; }
    setActionLoading(rejectingListingId);
    try {
      await updateDoc(doc(db, "listings", rejectingListingId), { status: "rejected", rejectionReason: rejectionReason.trim() });
      setListings(prev => prev.map(l => l.id === rejectingListingId ? { ...l, status: "rejected" } : l));
      toast.success("Listing rejected");
    } catch (err: any) { toast.error(err.message || "Failed"); }
    setActionLoading(null); setRejectingListingId(null); setRejectionReason("");
  };
  const handleDeleteListing = async (listingId: string) => {
    setActionLoading(listingId);
    try { await deleteDoc(doc(db, "listings", listingId)); setListings(prev => prev.filter(l => l.id !== listingId)); toast.success("Deleted"); }
    catch (err: any) { toast.error(err.message || "Failed"); }
    setActionLoading(null);
  };
  const handleTicketAction = async (ticketId: string, action: "approved" | "rejected") => {
    setActionLoading(ticketId);
    try {
      const ticket = featuredTickets.find(t => t.id === ticketId);
      await updateDoc(doc(db, "featured_tickets", ticketId), { status: action });
      if (action === "approved" && ticket?.listingId) {
        await updateDoc(doc(db, "listings", ticket.listingId), { featured: true });
        setListings(prev => prev.map(l => l.id === ticket.listingId ? { ...l, featured: true } : l));
      }
      setFeaturedTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: action } : t));
      toast.success(`Ticket ${action}`);
    } catch (err: any) { toast.error(err.message || "Failed"); }
    setActionLoading(null);
  };

  const navItems: { id: NavItem; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "dashboard", label: "Home", icon: <Home className="w-[18px] h-[18px]" /> },
    { id: "listings", label: "Listings", icon: <Package className="w-[18px] h-[18px]" />, count: pendingListings || undefined },
    { id: "users", label: "Users", icon: <Users className="w-[18px] h-[18px]" /> },
    { id: "tickets", label: "Tickets", icon: <Ticket className="w-[18px] h-[18px]" /> },
    { id: "statistics", label: "Analytics", icon: <BarChart3 className="w-[18px] h-[18px]" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-[18px] h-[18px]" /> },
  ];

  const navTitle: Record<NavItem, string> = {
    dashboard: "Overview",
    users: "Users",
    listings: "Listings",
    tickets: "Featured Tickets",
    statistics: "Analytics",
    settings: "Settings",
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: "#f6f6f7" }}>
      {/* ═══ DARK SIDEBAR (Shopify-style) ═══ */}
      <aside className="hidden md:flex flex-col w-[220px] shrink-0" style={{ background: "#1a1a1a" }}>
        {/* Logo */}
        <div className="h-14 flex items-center gap-2.5 px-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#95bf47" }}>
            <Store className="w-4 h-4 text-white" />
          </div>
          <span className="text-[13px] font-semibold text-white/90 tracking-tight">SG Biz Finder</span>
        </div>

        {/* Search */}
        <div className="px-3 mb-1">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/40 text-xs" style={{ background: "#303030" }}>
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
            <span className="ml-auto text-[10px] border border-white/20 rounded px-1">⌘K</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] font-medium transition-colors ${
                activeNav === item.id
                  ? "text-white bg-white/[0.12]"
                  : "text-white/60 hover:text-white/90 hover:bg-white/[0.06]"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.count && (
                <span className="ml-auto text-[11px] bg-white/20 text-white/80 rounded-full px-1.5 py-px min-w-[20px] text-center">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2 py-3 border-t border-white/10">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
          >
            <Globe className="w-[18px] h-[18px]" />
            <span>Back to site</span>
          </button>
        </div>
      </aside>

      {/* ═══ MOBILE BOTTOM NAV ═══ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around py-2 px-1" style={{ background: "#1a1a1a" }}>
        {navItems.slice(0, 5).map(item => (
          <button
            key={item.id}
            onClick={() => setActiveNav(item.id)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] transition-colors ${
              activeNav === item.id ? "text-white" : "text-white/40"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {/* Top bar */}
        <header className="sticky top-0 z-40 h-14 flex items-center justify-between px-5 border-b" style={{ background: "#f6f6f7", borderColor: "#e1e3e5" }}>
          <h1 className="text-[15px] font-semibold" style={{ color: "#202223" }}>{navTitle[activeNav]}</h1>
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors">
              <Bell className="w-[18px] h-[18px]" style={{ color: "#6d7175" }} />
            </button>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: "#5c6ac4" }}>
              A
            </div>
          </div>
        </header>

        {/* ─── DASHBOARD ─── */}
        {activeNav === "dashboard" && (
          <div className="p-4 md:p-5 space-y-4">
            {/* Date filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[13px] font-medium" style={{ borderColor: "#c9cccf", color: "#202223", background: "white" }}>
                <Calendar className="w-3.5 h-3.5" />
                Last 365 days
              </button>
              <span className="text-[13px]" style={{ color: "#6d7175" }}>Compare to: Previous period</span>
            </div>

            {/* Metric cards row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard title="Total Listings" value={String(totalListings)} change={`${totalListings} total`} positive sparkColor="#5c6ac4" sparkData={sparkData} />
              <MetricCard title="Active Users" value={String(activeUsers)} change={`${activeUsers} active`} positive sparkColor="#47c1bf" sparkData={sparkData} />
              <MetricCard title="Approved" value={String(approvedListings)} change={`${approvedListings} approved`} positive sparkColor="#5c6ac4" sparkData={sparkData} />
              <MetricCard title="Pending" value={String(pendingListings)} change={pendingListings > 0 ? `${pendingListings} pending` : "—"} positive={pendingListings === 0} sparkColor="#f49342" sparkData={sparkData} />
            </div>

            {/* Main chart + breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Area Chart */}
              <div className="lg:col-span-2 rounded-xl border p-5" style={{ background: "white", borderColor: "#e1e3e5" }}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-[13px] font-semibold" style={{ color: "#202223" }}>Total listings over time</h3>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl font-bold" style={{ color: "#202223" }}>{totalListings}</span>
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ background: "#e4f3e5", color: "#1a7f37" }}>↑ 31%</span>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={listingTrendData}>
                      <defs>
                        <linearGradient id="currentGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#5c6ac4" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#5c6ac4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e1e3e5" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6d7175" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6d7175" }} width={30} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: "1px solid #e1e3e5", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                      />
                      <Area type="monotone" dataKey="previous" stroke="#c4cdd5" strokeWidth={1.5} strokeDasharray="4 4" fill="none" dot={false} />
                      <Area type="monotone" dataKey="current" stroke="#5c6ac4" strokeWidth={2} fill="url(#currentGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-6 mt-3 text-[11px]" style={{ color: "#6d7175" }}>
                  <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 rounded" style={{ background: "#5c6ac4" }} /> Current period</span>
                  <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 rounded border-t border-dashed" style={{ borderColor: "#c4cdd5" }} /> Previous period</span>
                </div>
              </div>

              {/* Breakdown table */}
              <div className="rounded-xl border p-5" style={{ background: "white", borderColor: "#e1e3e5" }}>
                <h3 className="text-[13px] font-semibold mb-4" style={{ color: "#202223" }}>Platform breakdown</h3>
                <div className="space-y-0">
                  {breakdownData.map((row, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5" style={{ borderBottom: i < breakdownData.length - 1 ? "1px solid #f1f2f3" : "none" }}>
                      <span className="text-[13px]" style={{ color: "#6d7175" }}>{row.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold" style={{ color: "#202223" }}>{row.value}</span>
                        <span className="text-[11px]" style={{ color: row.positive ? "#1a7f37" : "#d72c0d" }}>{row.change}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Donut - Categories */}
              <div className="rounded-xl border p-5" style={{ background: "white", borderColor: "#e1e3e5" }}>
                <h3 className="text-[13px] font-semibold mb-3" style={{ color: "#202223" }}>Listings by category</h3>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={28} outerRadius={42} dataKey="value" strokeWidth={0}>
                          {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                      </RechartsPie>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-sm font-bold" style={{ color: "#202223" }}>{totalListings}</span>
                      <span className="text-[9px]" style={{ color: "#6d7175" }}>↑ 31%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {categoryData.map((cat, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: cat.color }} />
                        <span className="text-[12px]" style={{ color: "#6d7175" }}>{cat.name} {cat.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Avg views over time */}
              <div className="rounded-xl border p-5" style={{ background: "white", borderColor: "#e1e3e5" }}>
                <h3 className="text-[13px] font-semibold" style={{ color: "#202223" }}>Avg. views per listing</h3>
                <div className="flex items-center gap-2 mt-1 mb-3">
                  <span className="text-xl font-bold" style={{ color: "#202223" }}>68.4</span>
                  <span className="text-[11px]" style={{ color: "#1a7f37" }}>↑ 1.7%</span>
                </div>
                <div className="h-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={avgOrderData}>
                      <Line type="monotone" dataKey="value" stroke="#5c6ac4" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top categories bar */}
              <div className="rounded-xl border p-5" style={{ background: "white", borderColor: "#e1e3e5" }}>
                <h3 className="text-[13px] font-semibold mb-3" style={{ color: "#202223" }}>Top categories</h3>
                <div className="space-y-2">
                  {topCategoriesData.map((cat, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between text-[12px] mb-0.5">
                        <span style={{ color: "#6d7175" }}>{cat.name}</span>
                        <span className="font-medium" style={{ color: "#202223" }}>{cat.value}</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "#f1f2f3" }}>
                        <div className="h-full rounded-full" style={{ background: "#5c6ac4", width: `${(cat.value / (topCategoriesData[0]?.value || 1)) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── USERS TAB ─── */}
        {activeNav === "users" && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6d7175" }} />
                <Input placeholder="Search users by name or email..." className="pl-10 border-[#c9cccf] bg-white" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
              </div>
              <span className="text-[13px]" style={{ color: "#6d7175" }}>{filteredUsers.length} users</span>
            </div>

            <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "#e1e3e5" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e1e3e5" }}>
                    <th className="text-left text-[11px] font-medium uppercase tracking-wide px-4 py-3" style={{ color: "#6d7175" }}>User</th>
                    <th className="text-left text-[11px] font-medium uppercase tracking-wide px-4 py-3" style={{ color: "#6d7175" }}>Role</th>
                    <th className="text-left text-[11px] font-medium uppercase tracking-wide px-4 py-3" style={{ color: "#6d7175" }}>Status</th>
                    <th className="text-left text-[11px] font-medium uppercase tracking-wide px-4 py-3" style={{ color: "#6d7175" }}>Listings</th>
                    <th className="text-left text-[11px] font-medium uppercase tracking-wide px-4 py-3" style={{ color: "#6d7175" }}>Last Active</th>
                    <th className="text-right text-[11px] font-medium uppercase tracking-wide px-4 py-3" style={{ color: "#6d7175" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[#f9fafb] cursor-pointer" style={{ borderBottom: "1px solid #f1f2f3" }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: "#5c6ac4" }}>
                            {u.displayName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[13px] font-medium" style={{ color: "#202223" }}>{u.displayName}</p>
                            <p className="text-[11px]" style={{ color: "#6d7175" }}>{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{roleBadge(u.role)}</td>
                      <td className="px-4 py-3">{statusBadge(u.status)}</td>
                      <td className="px-4 py-3 text-[13px] font-medium" style={{ color: "#202223" }}>{u.listingsCount}</td>
                      <td className="px-4 py-3 text-[13px]" style={{ color: "#6d7175" }}>{u.lastActive}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedUser(u)}><Eye className="w-4 h-4 mr-2" />View</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setActiveNav("listings"); setListingSearch(u.email); }}><Package className="w-4 h-4 mr-2" />View Listings</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {u.status !== "active" && <DropdownMenuItem onClick={() => handleUserAction(u.id, "activate")}><UserCheck className="w-4 h-4 mr-2" />Activate</DropdownMenuItem>}
                            {u.status === "active" && u.role !== "superadmin" && <DropdownMenuItem onClick={() => handleUserAction(u.id, "suspend")}><Ban className="w-4 h-4 mr-2" />Suspend</DropdownMenuItem>}
                            {u.role !== "admin" && u.role !== "superadmin" && <DropdownMenuItem onClick={() => handleUserAction(u.id, "promote_admin")}><Shield className="w-4 h-4 mr-2" />Promote to Admin</DropdownMenuItem>}
                            {u.role === "admin" && <DropdownMenuItem onClick={() => handleUserAction(u.id, "demote")}><ChevronDown className="w-4 h-4 mr-2" />Demote</DropdownMenuItem>}
                            <DropdownMenuSeparator />
                            {u.role !== "superadmin" && <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteUser(u.id)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── LISTINGS TAB ─── */}
        {activeNav === "listings" && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6d7175" }} />
                <Input placeholder="Search listings..." className="pl-10 border-[#c9cccf] bg-white" value={listingSearch} onChange={(e) => setListingSearch(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" className="h-8 text-xs" onClick={() => setShowAddBusiness(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" />Add Business
                </Button>
                <div className="flex gap-1.5">
                  {["all", "pending_approval", "approved", "rejected"].map(f => (
                    <button
                      key={f}
                      onClick={() => setListingFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-colors ${
                        listingFilter === f ? "bg-white border-[#c9cccf] text-[#202223] shadow-sm" : "border-transparent text-[#6d7175] hover:bg-white/60"
                      }`}
                    >
                      {f === "all" ? "All" : f === "pending_approval" ? "Pending" : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {filteredListings.map((listing) => (
                <div key={listing.id} className="rounded-xl border p-4 hover:shadow-sm transition-shadow" style={{ background: "white", borderColor: "#e1e3e5" }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: "#f4f5f7", color: "#6d7175" }}>
                        {listing.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-[13px] font-semibold" style={{ color: "#202223" }}>{listing.name}</span>
                          {statusBadge(listing.status)}
                        </div>
                        <p className="text-[12px]" style={{ color: "#6d7175" }}>{listing.address}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px]" style={{ color: "#8c9196" }}>
                          <span>UEN: {listing.uen}</span>
                          <span>·</span>
                          <span>{listing.category}</span>
                          <span>·</span>
                          <span>{listing.district}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {listing.status === "pending_approval" && (
                        <>
                          <Button size="sm" className="h-8 text-xs bg-[#1a7f37] hover:bg-[#15652c] text-white" onClick={() => handleListingApprove(listing.id)} disabled={actionLoading === listing.id}>
                            <Check className="w-3.5 h-3.5 mr-1" />Approve
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 text-xs border-[#c9cccf] text-[#d72c0d] hover:bg-red-50" onClick={() => { setRejectingListingId(listing.id); setRejectionReason(""); }} disabled={actionLoading === listing.id}>
                            <X className="w-3.5 h-3.5 mr-1" />Reject
                          </Button>
                        </>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedListing(listing)}><Eye className="w-4 h-4 mr-2" />View Details</DropdownMenuItem>
                          {listing.status === "approved" && (
                            <DropdownMenuItem onClick={() => navigate(getBusinessUrl(listing))}><ExternalLink className="w-4 h-4 mr-2" />View Live Page</DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteListing(listing.id)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TICKETS TAB ─── */}
        {activeNav === "tickets" && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[13px]" style={{ color: "#6d7175" }}>{featuredTickets.filter(t => t.status === "pending").length} pending</p>
            </div>
            {featuredTickets.length === 0 ? (
              <div className="text-center py-16 rounded-xl border" style={{ background: "white", borderColor: "#e1e3e5" }}>
                <Ticket className="w-10 h-10 mx-auto mb-3" style={{ color: "#c4cdd5" }} />
                <p className="text-[14px] font-medium" style={{ color: "#202223" }}>No featured requests</p>
                <p className="text-[13px]" style={{ color: "#6d7175" }}>Business owners haven't submitted any requests yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {featuredTickets.map(ticket => (
                  <div key={ticket.id} className="rounded-xl border p-4" style={{ background: "white", borderColor: "#e1e3e5" }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-[13px] font-semibold" style={{ color: "#202223" }}>{ticket.listingName}</span>
                          {statusBadge(ticket.status === "approved" ? "approved" : ticket.status === "rejected" ? "rejected" : "pending_approval")}
                        </div>
                        <p className="text-[12px]" style={{ color: "#6d7175" }}>{ticket.ownerEmail}</p>
                        {ticket.reason && <p className="text-[12px] mt-2 p-2.5 rounded-lg italic" style={{ background: "#f4f5f7", color: "#6d7175" }}>"{ticket.reason}"</p>}
                      </div>
                      {ticket.status === "pending" && (
                        <div className="flex gap-1.5 shrink-0">
                          <Button size="sm" className="h-8 text-xs bg-[#1a7f37] hover:bg-[#15652c] text-white" onClick={() => handleTicketAction(ticket.id, "approved")} disabled={actionLoading === ticket.id}>
                            <Check className="w-3.5 h-3.5 mr-1" />Approve
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 text-xs border-[#c9cccf] text-[#d72c0d] hover:bg-red-50" onClick={() => handleTicketAction(ticket.id, "rejected")} disabled={actionLoading === ticket.id}>
                            <X className="w-3.5 h-3.5 mr-1" />Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── STATISTICS TAB ─── */}
        {activeNav === "statistics" && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border p-5" style={{ background: "white", borderColor: "#e1e3e5" }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px]" style={{ color: "#6d7175" }}>Total Users</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: "#e4f3e5", color: "#1a7f37" }}>↑ 12%</span>
                </div>
                <p className="text-3xl font-bold" style={{ color: "#202223" }}>{totalUsers}</p>
              </div>
              <div className="rounded-xl border p-5" style={{ background: "white", borderColor: "#e1e3e5" }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px]" style={{ color: "#6d7175" }}>Total Listings</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: "#e4f3e5", color: "#1a7f37" }}>↑ 8%</span>
                </div>
                <p className="text-3xl font-bold" style={{ color: "#202223" }}>{totalListings}</p>
              </div>
              <div className="rounded-xl border p-5" style={{ background: "white", borderColor: "#e1e3e5" }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px]" style={{ color: "#6d7175" }}>Active Users</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: "#e4f3e5", color: "#1a7f37" }}>↑ 5%</span>
                </div>
                <p className="text-3xl font-bold" style={{ color: "#202223" }}>{activeUsers}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border p-5" style={{ background: "white", borderColor: "#e1e3e5" }}>
                <h3 className="text-[13px] font-semibold mb-4" style={{ color: "#202223" }}>Listings Trend</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={listingTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e1e3e5" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6d7175" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6d7175" }} width={30} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e1e3e5", fontSize: 12 }} />
                      <Area type="monotone" dataKey="current" stroke="#5c6ac4" strokeWidth={2} fill="url(#currentGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-xl border p-5" style={{ background: "white", borderColor: "#e1e3e5" }}>
                <h3 className="text-[13px] font-semibold mb-4" style={{ color: "#202223" }}>Category Distribution</h3>
                <div className="flex items-center justify-center gap-8">
                  <div className="w-40 h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                          {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {categoryData.map((cat, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: cat.color }} />
                        <span className="text-[13px]" style={{ color: "#6d7175" }}>{cat.name}</span>
                        <span className="text-[13px] font-medium" style={{ color: "#202223" }}>{cat.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── SETTINGS TAB ─── */}
        {activeNav === "settings" && (
          <div className="p-5 space-y-4">
            <div className="rounded-xl border p-5" style={{ background: "white", borderColor: "#e1e3e5" }}>
              <h3 className="text-[13px] font-semibold mb-4" style={{ color: "#202223" }}>Platform Settings</h3>
              <div className="space-y-0">
                {[
                  { key: "autoApprove" as const, title: "Auto-approve listings", desc: "Skip manual review for verified owners" },
                  { key: "emailNotifications" as const, title: "Email notifications", desc: "Send alerts for new submissions" },
                  { key: "smsVerification" as const, title: "SMS verification", desc: "Require phone verification" },
                  { key: "documentRequired" as const, title: "Document upload required", desc: "Require ACRA profile" },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-3.5" style={{ borderBottom: i < 3 ? "1px solid #f1f2f3" : "none" }}>
                    <div>
                      <p className="text-[13px] font-medium" style={{ color: "#202223" }}>{s.title}</p>
                      <p className="text-[12px]" style={{ color: "#6d7175" }}>{s.desc}</p>
                    </div>
                    <div
                      onClick={() => toggleSetting(s.key)}
                      className={`w-10 h-[22px] rounded-full flex items-center px-[3px] cursor-pointer transition-colors ${platformSettings[s.key] ? "bg-[#5c6ac4]" : "bg-[#c4cdd5]"}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${platformSettings[s.key] ? "translate-x-[18px]" : ""}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border p-5" style={{ background: "white", borderColor: "#e1e3e5" }}>
              <h3 className="text-[13px] font-semibold mb-4" style={{ color: "#202223" }}>Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button variant="outline" className="justify-start h-auto py-3 px-4" onClick={() => setActiveNav("users")}>
                  <Users className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <p className="text-[13px] font-medium">Manage Users</p>
                    <p className="text-[11px] text-muted-foreground">{users.length} total users</p>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-3 px-4" onClick={() => setActiveNav("listings")}>
                  <Package className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <p className="text-[13px] font-medium">Manage Listings</p>
                    <p className="text-[11px] text-muted-foreground">{listings.length} total listings</p>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-3 px-4" onClick={() => setShowAddBusiness(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <p className="text-[13px] font-medium">Add New Business</p>
                    <p className="text-[11px] text-muted-foreground">Create a listing for any category</p>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-3 px-4" onClick={() => navigate("/")}>
                  <Globe className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <p className="text-[13px] font-medium">View Public Site</p>
                    <p className="text-[11px] text-muted-foreground">Open the directory homepage</p>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ═══ DIALOGS ═══ */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>User Details</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ background: "#5c6ac4" }}>{selectedUser.displayName.charAt(0)}</div>
                <div>
                  <h3 className="font-semibold text-lg" style={{ color: "#202223" }}>{selectedUser.displayName}</h3>
                  <div className="flex gap-2 mt-1">{roleBadge(selectedUser.role)}{statusBadge(selectedUser.status)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={selectedUser.email} />
                <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={selectedUser.phone || "—"} />
                <InfoRow icon={<Calendar className="w-4 h-4" />} label="Joined" value={selectedUser.joinedAt} />
                <InfoRow icon={<Activity className="w-4 h-4" />} label="Last Active" value={selectedUser.lastActive} />
                <InfoRow icon={<Building2 className="w-4 h-4" />} label="Listings" value={String(selectedUser.listingsCount)} />
              </div>
              <div className="flex gap-2 pt-4 border-t border-border">
                {selectedUser.status === "active" && selectedUser.role !== "superadmin" && (
                  <Button variant="outline" size="sm" onClick={() => { handleUserAction(selectedUser.id, "suspend"); setSelectedUser(null); }}><Ban className="w-4 h-4 mr-1.5" />Suspend</Button>
                )}
                {selectedUser.status !== "active" && (
                  <Button size="sm" onClick={() => { handleUserAction(selectedUser.id, "activate"); setSelectedUser(null); }}><UserCheck className="w-4 h-4 mr-1.5" />Activate</Button>
                )}
                {selectedUser.role !== "superadmin" && (
                  <Button variant="destructive" size="sm" onClick={() => { handleDeleteUser(selectedUser.id); setSelectedUser(null); }}><Trash2 className="w-4 h-4 mr-1.5" />Delete</Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedListing} onOpenChange={() => setSelectedListing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Listing Details</DialogTitle></DialogHeader>
          {selectedListing && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-lg" style={{ color: "#202223" }}>{selectedListing.name}</h3>
                {statusBadge(selectedListing.status)}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoRow icon={<Building2 className="w-4 h-4" />} label="UEN" value={selectedListing.uen} />
                <InfoRow icon={<Building2 className="w-4 h-4" />} label="Category" value={selectedListing.category} />
                <InfoRow icon={<Building2 className="w-4 h-4" />} label="District" value={selectedListing.district} />
                <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={selectedListing.phone || "—"} />
              </div>
              <div className="text-sm">
                <span style={{ color: "#6d7175" }}>Address:</span>
                <p style={{ color: "#202223" }}>{selectedListing.address}</p>
              </div>
              {selectedListing.description && (
                <div className="text-sm">
                  <span style={{ color: "#6d7175" }}>Description:</span>
                  <p style={{ color: "#202223" }}>{selectedListing.description}</p>
                </div>
              )}
              <div className="flex gap-2 pt-4 border-t border-border">
                {selectedListing.status !== "approved" && (
                  <Button size="sm" className="bg-[#1a7f37] hover:bg-[#15652c] text-white" onClick={() => { handleListingApprove(selectedListing.id); setSelectedListing(null); }}>
                    <Check className="w-4 h-4 mr-1.5" />Approve
                  </Button>
                )}
                {selectedListing.status !== "rejected" && (
                  <Button size="sm" variant="outline" className="border-[#c9cccf] text-[#d72c0d]" onClick={() => { setRejectingListingId(selectedListing.id); setRejectionReason(""); setSelectedListing(null); }}>
                    <X className="w-4 h-4 mr-1.5" />Reject
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => { handleDeleteListing(selectedListing.id); setSelectedListing(null); }}>
                  <Trash2 className="w-4 h-4 mr-1.5" />Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectingListingId} onOpenChange={(open) => { if (!open) { setRejectingListingId(null); setRejectionReason(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><X className="w-5 h-5 text-[#d72c0d]" />Reject Listing</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-[13px]" style={{ color: "#6d7175" }}>Please provide a reason. This will be visible to the business owner.</p>
            <div className="space-y-2">
              <Label>Rejection Reason *</Label>
              <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="e.g. Missing ACRA business profile document..." rows={3} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setRejectingListingId(null); setRejectionReason(""); }}>Cancel</Button>
            <Button className="bg-[#d72c0d] hover:bg-[#b71c1c] text-white" onClick={handleListingReject} disabled={!rejectionReason.trim() || actionLoading === rejectingListingId}>
              {actionLoading === rejectingListingId ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <X className="w-4 h-4 mr-1.5" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Business Dialog */}
      <AdminAddBusiness
        open={showAddBusiness}
        onOpenChange={setShowAddBusiness}
        onCreated={(listing) => setListings(prev => [listing, ...prev])}
        adminUserId={user?.uid || "admin"}
      />
    </div>
  );
};

// ── Sub-components ──
const MetricCard = ({ title, value, change, positive, sparkColor, sparkData }: { title: string; value: string; change: string; positive: boolean; sparkColor: string; sparkData: number[] }) => {
  const data = sparkData.map((v, i) => ({ i, v }));
  return (
    <div className="rounded-xl border p-4" style={{ background: "white", borderColor: "#e1e3e5" }}>
      <p className="text-[12px] mb-1" style={{ color: "#6d7175" }}>{title}</p>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xl font-bold" style={{ color: "#202223" }}>{value}</p>
          <span className="text-[11px]" style={{ color: positive ? "#1a7f37" : "#d72c0d" }}>{change}</span>
        </div>
        <div className="w-16 h-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-2">
    <div className="mt-0.5 shrink-0" style={{ color: "#6d7175" }}>{icon}</div>
    <div>
      <p className="text-[11px]" style={{ color: "#8c9196" }}>{label}</p>
      <p className="text-[13px] font-medium break-all" style={{ color: "#202223" }}>{value}</p>
    </div>
  </div>
);

export default SuperAdmin;
