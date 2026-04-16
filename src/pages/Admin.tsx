import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
  MessageSquare, MessageCircle, Mail, Phone, Menu, MoreHorizontal,
  ChevronRight, Activity, Users, Database, TrendingUp, ArrowUpRight,
  ChevronDown, Filter, RefreshCw, Zap, Download, BarChart3,
  Globe, Server, Cpu, HardDrive, Wifi, Star, Target, Layers,
  PieChart, ArrowUp, ArrowDown, Sparkles, CheckSquare, Square, MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════
   ENTERPRISE ADMIN CONSOLE — Azure/GCP inspired
   ═══════════════════════════════════════════════════════════ */

type AdminTab = "dashboard" | "listings" | "enquiries" | "users" | "analytics" | "activity" | "settings";

interface AppUser {
  id: string;
  email?: string;
  phone?: string;
  createdAt?: any;
}
type EnquiryStatus = "unread" | "contacted" | "qualified" | "not_qualified" | "converted" | "spam";

const ENQUIRY_STATUSES: { key: EnquiryStatus; label: string; color: string; dot: string }[] = [
  { key: "unread", label: "New", color: "bg-[hsl(220,70%,93%)] text-[hsl(220,70%,35%)]", dot: "bg-[hsl(220,70%,50%)]" },
  { key: "contacted", label: "Contacted", color: "bg-[hsl(210,70%,92%)] text-[hsl(210,70%,40%)]", dot: "bg-[hsl(210,70%,50%)]" },
  { key: "qualified", label: "Qualified", color: "bg-[hsl(152,50%,92%)] text-[hsl(152,69%,35%)]", dot: "bg-[hsl(152,69%,40%)]" },
  { key: "not_qualified", label: "Not Qualified", color: "bg-[hsl(38,70%,92%)] text-[hsl(38,80%,35%)]", dot: "bg-[hsl(38,85%,50%)]" },
  { key: "converted", label: "Converted", color: "bg-[hsl(152,60%,88%)] text-[hsl(152,80%,28%)]", dot: "bg-[hsl(152,80%,35%)]" },
  { key: "spam", label: "Spam", color: "bg-[hsl(0,60%,94%)] text-[hsl(0,70%,45%)]", dot: "bg-[hsl(0,70%,50%)]" },
];

interface Enquiry {
  id: string; listingId: string; listingName: string;
  name: string; email: string; phone?: string; message: string;
  status: EnquiryStatus; createdAt: any;
}

/* ── Sidebar Nav Item ─────────────────────────────────────── */
const NavItem = ({ icon: Icon, label, active, badge, onClick }: {
  icon: any; label: string; active?: boolean; badge?: number; onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all
      ${active
        ? "bg-[hsl(220,70%,96%)] text-[hsl(220,70%,40%)] shadow-sm"
        : "text-[hsl(220,10%,45%)] hover:bg-[hsl(220,20%,96%)] hover:text-[hsl(220,10%,25%)]"
      }`}
  >
    <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? "text-[hsl(220,70%,45%)]" : ""}`} />
    <span className="flex-1 text-left">{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center
        ${active ? "bg-[hsl(220,70%,45%)] text-white" : "bg-[hsl(220,20%,90%)] text-[hsl(220,10%,45%)]"}`}>
        {badge > 99 ? "99+" : badge}
      </span>
    )}
  </button>
);

/* ═══════════════════════════════════════════════════════════
   MAIN ADMIN PAGE
   ═══════════════════════════════════════════════════════════ */
const Admin = () => {
  const { user, isSuperAdmin, loading: authLoading, isDevMode, devLogout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
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
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [enquiryFilter, setEnquiryFilter] = useState<"all" | EnquiryStatus>("all");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const prevEnquiryCountRef = useRef<number | null>(null);
  const prevPendingCountRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create audio element for notification sound (Web Audio API beep)
  const playNotifSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
      // Second beep
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
      gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.6);
    } catch {}
  }, []);

  const requestNotifPermission = useCallback(async () => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      const result = await Notification.requestPermission();
      setNotifPermission(result);
    }
  }, []);

  const sendBrowserNotif = useCallback((title: string, body: string) => {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          icon: `${import.meta.env.BASE_URL}favicon.png`,
          badge: `${import.meta.env.BASE_URL}favicon.png`,
          tag: "admin-notif",
        });
      } catch {}
    }
  }, []);

  const [settings, setSettings] = useState({
    autoApprove: false,
    emailNotifications: true,
    documentRequired: true,
    whatsappPrefill: "Hi {{name}}, thanks for your enquiry about {{business}}. ",
  });

  // ── Data operations ──
  const handleSeedDemoData = async () => {
    setSeeding(true);
    try {
      let count = 0;
      for (const listing of DEMO_ALL_LISTINGS) {
        const { id, ...data } = listing;
        const cleanData = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
        await setDoc(doc(db, "listings", id), cleanData);
        count++;
      }
      toast.success(`Seeded ${count} demo listings to Firestore`);
      await fetchData();
    } catch (err: any) { toast.error(err.message || "Failed to seed demo data"); }
    setSeeding(false);
  };

  const handleDeleteEnquiry = async (enquiryId: string) => {
    if (!confirm("Delete this enquiry permanently?")) return;
    setActionLoading(enquiryId);
    try {
      await deleteDoc(doc(db, "enquiries", enquiryId));
      setEnquiries((prev) => prev.filter((e) => e.id !== enquiryId));
      toast.success("Enquiry deleted");
    } catch { toast.error("Failed to delete enquiry"); }
    setActionLoading(null);
  };

  const getWhatsAppUrl = (enquiry: Enquiry) => {
    const phone = (enquiry.phone || "").replace(/[^0-9]/g, "");
    if (!phone) return null;
    const msg = settings.whatsappPrefill.replace("{{name}}", enquiry.name).replace("{{business}}", enquiry.listingName);
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  const handleEnquiryStatus = async (enquiryId: string, newStatus: EnquiryStatus) => {
    try {
      await updateDoc(doc(db, "enquiries", enquiryId), { status: newStatus });
      setEnquiries((prev) => prev.map((e) => e.id === enquiryId ? { ...e, status: newStatus } : e));
      toast.success(`Marked as ${ENQUIRY_STATUSES.find(s => s.key === newStatus)?.label}`);
    } catch { toast.error("Failed to update status"); }
  };

  const handleDeleteSingleImage = async (listingId: string, imageIndex: number, field: "imageUrls" | "pendingImageUrls") => {
    const listing = allListings.find(l => l.id === listingId) || pendingListings.find(l => l.id === listingId);
    if (!listing) return;
    const images = [...(listing[field] || [])];
    images.splice(imageIndex, 1);
    try {
      await updateDoc(doc(db, "listings", listingId), { [field]: images });
      const updater = (l: Listing) => l.id === listingId ? { ...l, [field]: images } : l;
      setAllListings(prev => prev.map(updater));
      setPendingListings(prev => prev.map(updater));
      toast.success("Image removed");
    } catch { toast.error("Failed to remove image"); }
  };

  const handleApproveSinglePendingImage = async (listingId: string, imageIndex: number) => {
    const listing = allListings.find(l => l.id === listingId) || pendingListings.find(l => l.id === listingId);
    if (!listing) return;
    const pending = [...(listing.pendingImageUrls || [])];
    const approved = [...(listing.imageUrls || [])];
    const [img] = pending.splice(imageIndex, 1);
    approved.push(img);
    try {
      await updateDoc(doc(db, "listings", listingId), { imageUrls: approved, pendingImageUrls: pending });
      const updater = (l: Listing) => l.id === listingId ? { ...l, imageUrls: approved, pendingImageUrls: pending } : l;
      setAllListings(prev => prev.map(updater));
      setPendingListings(prev => prev.map(updater));
      toast.success("Image approved");
    } catch { toast.error("Failed to approve image"); }
  };

  useEffect(() => {
    if (!authLoading && (!user || !isSuperAdmin)) { navigate("/", { replace: true }); return; }
    if (!authLoading && user && isSuperAdmin) fetchData();
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
      try {
        const uSnap = await getDocs(collection(db, "users"));
        setAppUsers(uSnap.docs.map((d) => ({ id: d.id, ...d.data() } as AppUser)));
      } catch {}
    } catch {
      setAllListings(DEMO_ALL_LISTINGS);
      setPendingListings(DEMO_ALL_LISTINGS.filter((l) => l.status === "pending_approval"));
    }
    setLoading(false);
  };

  // Request notification permission on mount
  useEffect(() => { requestNotifPermission(); }, [requestNotifPermission]);

  // Detect new enquiries/pending and alert
  useEffect(() => {
    const enquiryCount = enquiries.filter(e => e.status === "unread").length;
    const pendingCount = pendingListings.length;

    if (prevEnquiryCountRef.current !== null && enquiryCount > prevEnquiryCountRef.current) {
      const diff = enquiryCount - prevEnquiryCountRef.current;
      playNotifSound();
      sendBrowserNotif("New Enquiry", `${diff} new enquir${diff > 1 ? "ies" : "y"} received`);
      toast.info(`🔔 ${diff} new enquir${diff > 1 ? "ies" : "y"} received!`);
    }
    if (prevPendingCountRef.current !== null && pendingCount > prevPendingCountRef.current) {
      const diff = pendingCount - prevPendingCountRef.current;
      playNotifSound();
      sendBrowserNotif("New Listing", `${diff} listing${diff > 1 ? "s" : ""} pending approval`);
      toast.info(`🔔 ${diff} new listing${diff > 1 ? "s" : ""} pending review!`);
    }

    prevEnquiryCountRef.current = enquiryCount;
    prevPendingCountRef.current = pendingCount;
  }, [enquiries, pendingListings, playNotifSound, sendBrowserNotif]);

  // Auto-refresh every 30s to detect new data
  useEffect(() => {
    const interval = setInterval(() => { fetchData(); }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const listing = allListings.find(l => l.id === id);
      const updates: Record<string, any> = { status: "approved", rejectionReason: "", previousApproved: {} };
      if (listing?.pendingLogoUrl) { updates.logoUrl = listing.pendingLogoUrl; updates.pendingLogoUrl = ""; }
      if (listing?.pendingImageUrls && listing.pendingImageUrls.length > 0) { updates.imageUrls = listing.pendingImageUrls; updates.pendingImageUrls = []; }
      await updateDoc(doc(db, "listings", id), updates);
      setPendingListings((prev) => prev.filter((l) => l.id !== id));
      setAllListings((prev) => prev.map((l) => l.id === id ? { ...l, ...updates } : l));
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

  const openAdminEdit = (listing: Listing) => {
    setEditingListing(listing);
    setAdminEditData({
      name: listing.name, category: listing.category, district: listing.district,
      address: listing.address, phone: listing.phone || "", email: listing.email || "",
      website: listing.website || "", description: listing.description || "",
      imageUrls: listing.imageUrls || [], logoUrl: listing.logoUrl || "", status: listing.status,
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

  // ── Computed ──
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
      const q = searchQuery.toLowerCase();
      const matchSearch = l.name.toLowerCase().includes(q) || l.category.toLowerCase().includes(q) || (l.postalCode && l.postalCode.includes(searchQuery.trim())) || (l.district && l.district.toLowerCase().includes(q)) || (l.address && l.address.toLowerCase().includes(q));
      const matchFilter = listingFilter === "all" || l.status === listingFilter;
      return matchSearch && matchFilter;
    });
  }, [allListings, searchQuery, listingFilter]);

  const filteredPending = pendingListings.filter((l) => {
    const q = searchQuery.toLowerCase();
    return l.name.toLowerCase().includes(q) || l.category.toLowerCase().includes(q) || (l.postalCode && l.postalCode.includes(searchQuery.trim())) || (l.district && l.district.toLowerCase().includes(q));
  });

  const filteredEnquiries = enquiries.filter((e) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = e.name.toLowerCase().includes(q) || e.listingName.toLowerCase().includes(q) || (e.phone && e.phone.includes(searchQuery.trim()));
    const matchFilter = enquiryFilter === "all" || e.status === enquiryFilter;
    return matchSearch && matchFilter;
  });

  const notifications = useMemo(() => {
    const items: { id: string; icon: any; text: string; time: string; color: string; action?: () => void }[] = [];
    if (stats.pending > 0) items.push({ id: "n-pending", icon: Clock, text: `${stats.pending} listing${stats.pending > 1 ? "s" : ""} awaiting approval`, time: "Action required", color: "hsl(38,85%,50%)", action: () => { setActiveTab("dashboard"); setNotifOpen(false); } });
    if (stats.unreadEnquiries > 0) items.push({ id: "n-unread", icon: MessageSquare, text: `${stats.unreadEnquiries} new enquir${stats.unreadEnquiries > 1 ? "ies" : "y"} received`, time: "Unread", color: "hsl(220,70%,50%)", action: () => { setActiveTab("enquiries"); setEnquiryFilter("unread"); setNotifOpen(false); } });
    pendingListings.filter(l => l.pendingLogoUrl).forEach(l => items.push({ id: `n-logo-${l.id}`, icon: Image, text: `${l.name} uploaded a new logo`, time: "Needs review", color: "hsl(280,60%,55%)", action: () => { setActiveTab("dashboard"); setNotifOpen(false); } }));
    pendingListings.filter(l => l.pendingImageUrls && l.pendingImageUrls.length > 0).forEach(l => items.push({ id: `n-img-${l.id}`, icon: Image, text: `${l.name} uploaded ${l.pendingImageUrls!.length} new photo${l.pendingImageUrls!.length > 1 ? "s" : ""}`, time: "Needs review", color: "hsl(200,70%,50%)", action: () => { setActiveTab("dashboard"); setNotifOpen(false); } }));
    pendingListings.filter(l => (l as any).previousApproved && Object.keys((l as any).previousApproved).length > 0).forEach(l => items.push({ id: `n-edit-${l.id}`, icon: Edit3, text: `${l.name} edited ${Object.keys((l as any).previousApproved).length} field(s)`, time: "Review changes", color: "hsl(354,70%,54%)", action: () => { setActiveTab("dashboard"); setNotifOpen(false); } }));
    enquiries.filter(e => e.status === "unread").slice(0, 5).forEach(e => items.push({ id: `n-enq-${e.id}`, icon: Mail, text: `${e.name} enquired about ${e.listingName}`, time: e.createdAt?.toDate ? e.createdAt.toDate().toLocaleDateString() : "Recently", color: "hsl(152,69%,40%)", action: () => { setActiveTab("enquiries"); setNotifOpen(false); } }));
    return items;
  }, [stats, pendingListings, enquiries]);

  const enquiryStatusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: enquiries.length };
    ENQUIRY_STATUSES.forEach(s => { counts[s.key] = enquiries.filter(e => e.status === s.key).length; });
    return counts;
  }, [enquiries]);

  // ── Computed analytics ──
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    allListings.forEach(l => { map[l.category] = (map[l.category] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [allListings]);

  const districtBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    allListings.forEach(l => { if (l.district) map[l.district] = (map[l.district] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [allListings]);

  const topListings = useMemo(() =>
    [...allListings].filter(l => l.status === "approved").sort((a, b) => ((b as any).viewCount || 0) - ((a as any).viewCount || 0)).slice(0, 5),
  [allListings]);

  const activityLog = useMemo(() => {
    const items: { id: string; type: string; icon: any; text: string; time: string; color: string }[] = [];
    enquiries.slice(0, 5).forEach(e => items.push({
      id: `e-${e.id}`, type: "enquiry", icon: MessageSquare,
      text: `${e.name} enquired about ${e.listingName}`,
      time: e.createdAt?.toDate ? e.createdAt.toDate().toLocaleDateString() : "Recently",
      color: "hsl(220,70%,50%)",
    }));
    pendingListings.slice(0, 3).forEach(l => items.push({
      id: `p-${l.id}`, type: "pending", icon: Clock,
      text: `${l.name} submitted for review`,
      time: "Pending",
      color: "hsl(38,85%,50%)",
    }));
    return items.slice(0, 8);
  }, [enquiries, pendingListings]);

  const enquiryConversion = useMemo(() => {
    const total = enquiries.length || 1;
    return {
      contacted: Math.round((enquiries.filter(e => e.status === "contacted").length / total) * 100),
      qualified: Math.round((enquiries.filter(e => e.status === "qualified").length / total) * 100),
      converted: Math.round((enquiries.filter(e => e.status === "converted").length / total) * 100),
    };
  }, [enquiries]);

  const toggleSelect = (id: string) => setSelectedIds(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAllListings.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredAllListings.map(l => l.id)));
  };
  const handleBulkApprove = async () => {
    for (const id of selectedIds) { await handleApprove(id); }
    setSelectedIds(new Set());
  };
  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} listing(s) permanently?`)) return;
    for (const id of selectedIds) { await handleDelete(id); }
    setSelectedIds(new Set());
  };

  const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
    const escape = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const csv = [headers.map(escape).join(","), ...rows.map(r => r.map(escape).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} records to ${filename}`);
  };

  const exportListings = () => {
    const headers = ["Name", "Category", "District", "Status", "Phone", "Email", "Address", "Verified", "Featured"];
    const rows = filteredAllListings.map(l => [
      l.name, l.category, l.district || "", l.status || "", l.phone || "", l.email || "",
      l.address || "", l.verified ? "Yes" : "No", l.featured ? "Yes" : "No",
    ]);
    downloadCSV(`listings_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  const exportEnquiries = () => {
    const headers = ["Name", "Email", "Phone", "Business", "Message", "Status", "Date"];
    const rows = filteredEnquiries.map(e => [
      e.name, e.email, e.phone || "", e.listingName, e.message, e.status,
      e.createdAt?.toDate ? e.createdAt.toDate().toLocaleDateString() : "",
    ]);
    downloadCSV(`enquiries_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(220,15%,97%)]">
        <Loader2 className="w-6 h-6 animate-spin text-[hsl(220,70%,50%)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(220,15%,97%)] flex" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif" }}>

      {/* ══════════════════════════════════════════════════════
         SIDEBAR — Azure-inspired clean white sidebar
         ══════════════════════════════════════════════════════ */}
      <aside className={`hidden md:flex flex-col bg-white border-r border-[hsl(220,15%,90%)] shrink-0 transition-all duration-300 ${sidebarCollapsed ? "w-[68px]" : "w-[240px]"}`}>
        {/* Logo area */}
        <div className="h-14 flex items-center px-4 border-b border-[hsl(220,15%,92%)] gap-3">
          <div className="w-8 h-8 rounded-lg bg-[hsl(220,70%,50%)] flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-[hsl(220,15%,15%)] truncate">Admin Console</p>
              <p className="text-[10px] text-[hsl(220,10%,55%)]">NearBuy Platform</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {!sidebarCollapsed && <p className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(220,10%,60%)] px-3 mb-2">Overview</p>}
          <NavItem icon={LayoutDashboard} label={sidebarCollapsed ? "" : "Dashboard"} active={activeTab === "dashboard"} badge={stats.pending} onClick={() => setActiveTab("dashboard")} />
          <NavItem icon={Building2} label={sidebarCollapsed ? "" : "All Listings"} active={activeTab === "listings"} badge={stats.total} onClick={() => setActiveTab("listings")} />
          <NavItem icon={MessageSquare} label={sidebarCollapsed ? "" : "Enquiries"} active={activeTab === "enquiries"} badge={stats.unreadEnquiries} onClick={() => setActiveTab("enquiries")} />
          
          {!sidebarCollapsed && <p className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(220,10%,60%)] px-3 mt-5 mb-2">People</p>}
          <NavItem icon={Users} label={sidebarCollapsed ? "" : "Users"} active={activeTab === "users"} badge={appUsers.length} onClick={() => setActiveTab("users")} />

          {!sidebarCollapsed && <p className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(220,10%,60%)] px-3 mt-5 mb-2">Insights</p>}
          <NavItem icon={BarChart3} label={sidebarCollapsed ? "" : "Analytics"} active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")} />
          <NavItem icon={Activity} label={sidebarCollapsed ? "" : "Activity Log"} active={activeTab === "activity"} onClick={() => setActiveTab("activity")} />

          {!sidebarCollapsed && <p className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(220,10%,60%)] px-3 mt-5 mb-2">System</p>}
          <NavItem icon={Settings} label={sidebarCollapsed ? "" : "Settings"} active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-[hsl(220,15%,92%)]">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5 px-3 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-[hsl(220,70%,50%)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[hsl(220,15%,15%)] truncate">{user?.displayName || user?.email?.split("@")[0] || "Admin"}</p>
                <p className="text-[10px] text-[hsl(220,10%,55%)] truncate">{user?.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={async () => { if (isDevMode) devLogout(); else await signOut(auth); navigate("/"); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-[hsl(0,60%,50%)] hover:bg-[hsl(0,60%,97%)] transition"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-[hsl(220,15%,90%)] flex items-center px-4 h-14 shadow-sm">
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[hsl(220,20%,96%)] text-[hsl(220,10%,30%)]">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 ml-3">
          <div className="w-7 h-7 rounded-lg bg-[hsl(220,70%,50%)] flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-sm text-[hsl(220,15%,15%)]">Admin</span>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-[280px] h-full bg-white flex flex-col py-5 px-4 shadow-2xl">
            <div className="flex items-center gap-2.5 mb-6 px-2">
              <div className="w-8 h-8 rounded-lg bg-[hsl(220,70%,50%)] flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-[hsl(220,15%,15%)]">Admin Console</span>
            </div>
            <div className="space-y-1">
              {([
                { tab: "dashboard" as const, icon: LayoutDashboard, label: "Dashboard", badge: stats.pending },
                { tab: "listings" as const, icon: Building2, label: "All Listings", badge: stats.total },
                { tab: "enquiries" as const, icon: MessageSquare, label: "Enquiries", badge: stats.unreadEnquiries },
                { tab: "users" as const, icon: Users, label: "Users", badge: appUsers.length },
                { tab: "analytics" as const, icon: BarChart3, label: "Analytics" },
                { tab: "activity" as const, icon: Activity, label: "Activity Log" },
                { tab: "settings" as const, icon: Settings, label: "Settings" },
              ]).map((item) => (
                <NavItem key={item.tab} icon={item.icon} label={item.label} active={activeTab === item.tab} badge={item.badge}
                  onClick={() => { setActiveTab(item.tab); setMobileMenuOpen(false); }} />
              ))}
            </div>
            <div className="mt-auto pt-4 border-t border-[hsl(220,15%,92%)]">
              <button onClick={async () => { if (isDevMode) devLogout(); else await signOut(auth); navigate("/"); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-[hsl(0,60%,50%)] hover:bg-[hsl(0,60%,97%)] transition">
                <LogOut className="w-[18px] h-[18px]" /><span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
         MAIN CONTENT
         ══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 md:pt-0 pt-14">

        {/* ── Top command bar ── */}
        <header className="sticky top-0 z-30 bg-white border-b border-[hsl(220,15%,90%)] px-6 h-14 flex items-center gap-4 shadow-[0_1px_3px_hsl(220,15%,90%)]">
          <div className="flex items-center gap-3">
            <h1 className="text-[15px] font-semibold text-[hsl(220,15%,15%)]">
              {{ dashboard: "Dashboard", listings: "Listings", enquiries: "Enquiries", analytics: "Analytics", activity: "Activity Log", settings: "Settings" }[activeTab]}
            </h1>
            {stats.pending > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(38,90%,94%)] text-[hsl(38,85%,30%)] text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(38,85%,50%)] animate-pulse" />
                {stats.pending} pending
              </span>
            )}
          </div>

          <div className="relative flex-1 max-w-md ml-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(220,10%,60%)]" />
            <input
              type="text"
              placeholder="Search by name, category, postal code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-[hsl(220,15%,97%)] text-sm text-[hsl(220,15%,15%)] placeholder:text-[hsl(220,10%,60%)] border border-[hsl(220,15%,90%)] focus:border-[hsl(220,70%,55%)] focus:ring-2 focus:ring-[hsl(220,70%,55%)/0.15] focus:outline-none transition"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => activeTab === "enquiries" ? exportEnquiries() : exportListings()} className="h-8 rounded-lg text-xs border-[hsl(220,15%,88%)] text-[hsl(220,10%,40%)] hover:bg-[hsl(220,20%,96%)]">
              <Download className="w-3.5 h-3.5 mr-1.5" />Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={fetchData} className="h-8 rounded-lg text-xs border-[hsl(220,15%,88%)] text-[hsl(220,10%,40%)] hover:bg-[hsl(220,20%,96%)]">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh
            </Button>
            <div className="w-px h-6 bg-[hsl(220,15%,90%)] mx-1" />
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)} className="relative w-9 h-9 rounded-lg hover:bg-[hsl(220,20%,96%)] flex items-center justify-center transition">
                <Bell className="w-[18px] h-[18px] text-[hsl(220,10%,45%)]" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[hsl(354,70%,54%)] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                    {notifications.length > 9 ? "9+" : notifications.length}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-11 z-50 w-[380px] bg-white rounded-xl border border-[hsl(220,15%,88%)] shadow-xl overflow-hidden animate-fade-in">
                    <div className="px-4 py-3 border-b border-[hsl(220,15%,92%)] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-[hsl(220,15%,15%)]">Notifications</h3>
                        {notifications.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[hsl(354,70%,94%)] text-[hsl(354,70%,45%)] text-[10px] font-bold">{notifications.length}</span>
                        )}
                      </div>
                      <button onClick={() => setNotifOpen(false)} className="w-7 h-7 rounded-md hover:bg-[hsl(220,20%,96%)] flex items-center justify-center">
                        <X className="w-4 h-4 text-[hsl(220,10%,55%)]" />
                      </button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="text-center py-10">
                          <Bell className="w-8 h-8 mx-auto mb-2 text-[hsl(220,10%,75%)]" />
                          <p className="text-sm font-medium text-[hsl(220,15%,15%)]">All clear!</p>
                          <p className="text-xs text-[hsl(220,10%,55%)] mt-0.5">No new notifications</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-[hsl(220,15%,95%)]">
                          {notifications.map((n) => (
                            <button key={n.id} onClick={n.action} className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-[hsl(220,20%,98%)] transition-colors text-left">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${n.color}12` }}>
                                <n.icon className="w-4 h-4" style={{ color: n.color }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] text-[hsl(220,15%,15%)] leading-snug">{n.text}</p>
                                <p className="text-[11px] text-[hsl(220,10%,55%)] mt-0.5 font-medium">{n.time}</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-[hsl(220,10%,70%)] shrink-0 mt-1" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-2 pl-3 ml-1 border-l border-[hsl(220,15%,90%)]">
              <div className="w-8 h-8 rounded-full bg-[hsl(220,70%,50%)] flex items-center justify-center text-white text-[11px] font-bold">
                {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || "A"}
              </div>
            </div>
          </div>
        </header>

        {/* ── Content ── */}
        <main className="flex-1 p-6 overflow-y-auto">

          {/* ═══ DASHBOARD ════════════════════════════════════ */}
          {activeTab === "dashboard" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Stat cards — 6 cards with trend indicators */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {([
                  { icon: Building2, label: "Total Listings", value: stats.total, accent: "hsl(220,70%,50%)", bg: "hsl(220,70%,97%)", trend: "+12%" },
                  { icon: Clock, label: "Pending Review", value: stats.pending, accent: "hsl(38,85%,50%)", bg: "hsl(38,90%,97%)", trend: null },
                  { icon: Check, label: "Approved", value: stats.approved, accent: "hsl(152,69%,40%)", bg: "hsl(152,50%,97%)", trend: "+8%" },
                  { icon: X, label: "Rejected", value: stats.rejected, accent: "hsl(354,70%,54%)", bg: "hsl(354,70%,97%)", trend: null },
                  { icon: MessageSquare, label: "Total Enquiries", value: stats.enquiries, accent: "hsl(280,60%,55%)", bg: "hsl(280,60%,97%)", trend: "+23%" },
                  { icon: Users, label: "Unread Leads", value: stats.unreadEnquiries, accent: "hsl(200,70%,50%)", bg: "hsl(200,70%,97%)", trend: null },
                ] as const).map((s) => (
                  <div key={s.label} className="relative bg-white rounded-xl border border-[hsl(220,15%,90%)] p-4 overflow-hidden hover:shadow-md transition-shadow group">
                    <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: s.accent }} />
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[10px] font-medium text-[hsl(220,10%,50%)] mb-1">{s.label}</p>
                        <p className="text-2xl font-bold text-[hsl(220,15%,12%)] tabular-nums">{s.value}</p>
                        {s.trend && (
                          <div className="flex items-center gap-1 mt-1">
                            <ArrowUp className="w-3 h-3 text-[hsl(152,69%,40%)]" />
                            <span className="text-[10px] font-semibold text-[hsl(152,69%,35%)]">{s.trend}</span>
                          </div>
                        )}
                      </div>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.bg }}>
                        <s.icon className="w-4 h-4" style={{ color: s.accent }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions + Platform Health */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Quick Actions */}
                <div className="bg-white rounded-xl border border-[hsl(220,15%,90%)] overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-[hsl(220,15%,92%)] flex items-center gap-2.5">
                    <Zap className="w-4 h-4 text-[hsl(38,85%,50%)]" />
                    <h3 className="text-sm font-semibold text-[hsl(220,15%,15%)]">Quick Actions</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 p-4">
                    {[
                      { icon: Check, label: "Approve All Pending", color: "hsl(152,69%,40%)", bg: "hsl(152,50%,95%)", action: () => { pendingListings.forEach(l => handleApprove(l.id)); } },
                      { icon: Download, label: "Export All Data", color: "hsl(220,70%,50%)", bg: "hsl(220,70%,96%)", action: exportListings },
                      { icon: RefreshCw, label: "Refresh Data", color: "hsl(200,70%,50%)", bg: "hsl(200,70%,95%)", action: fetchData },
                      { icon: Database, label: "Seed Demo Data", color: "hsl(280,60%,55%)", bg: "hsl(280,60%,95%)", action: handleSeedDemoData },
                    ].map((a) => (
                      <button key={a.label} onClick={a.action}
                        className="flex items-center gap-2.5 p-3 rounded-lg border border-[hsl(220,15%,92%)] hover:border-[hsl(220,15%,80%)] hover:shadow-sm transition-all text-left group">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: a.bg }}>
                          <a.icon className="w-4 h-4" style={{ color: a.color }} />
                        </div>
                        <span className="text-xs font-medium text-[hsl(220,15%,20%)] group-hover:text-[hsl(220,70%,50%)] transition-colors">{a.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Platform Health */}
                <div className="bg-white rounded-xl border border-[hsl(220,15%,90%)] overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-[hsl(220,15%,92%)] flex items-center gap-2.5">
                    <Server className="w-4 h-4 text-[hsl(152,69%,40%)]" />
                    <h3 className="text-sm font-semibold text-[hsl(220,15%,15%)]">Platform Health</h3>
                    <span className="ml-auto inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[hsl(152,50%,93%)] text-[hsl(152,69%,35%)] text-[10px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[hsl(152,69%,40%)] animate-pulse" />All Systems Operational
                    </span>
                  </div>
                  <div className="p-4 space-y-3">
                    {[
                      { icon: Globe, label: "Website", status: "Operational", uptime: "99.9%", color: "hsl(152,69%,40%)" },
                      { icon: Database, label: "Firestore DB", status: "Operational", uptime: "99.8%", color: "hsl(152,69%,40%)" },
                      { icon: HardDrive, label: "Storage", status: "Operational", uptime: "100%", color: "hsl(152,69%,40%)" },
                      { icon: Wifi, label: "API Gateway", status: "Operational", uptime: "99.7%", color: "hsl(152,69%,40%)" },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2.5">
                          <s.icon className="w-4 h-4 text-[hsl(220,10%,50%)]" />
                          <span className="text-xs font-medium text-[hsl(220,15%,20%)]">{s.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-medium text-[hsl(220,10%,55%)]">{s.uptime} uptime</span>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category Breakdown + Top Listings + Enquiry Funnel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Category Breakdown */}
                <div className="bg-white rounded-xl border border-[hsl(220,15%,90%)] overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-[hsl(220,15%,92%)] flex items-center gap-2.5">
                    <PieChart className="w-4 h-4 text-[hsl(280,60%,55%)]" />
                    <h3 className="text-sm font-semibold text-[hsl(220,15%,15%)]">By Category</h3>
                  </div>
                  <div className="p-4 space-y-2.5">
                    {categoryBreakdown.length === 0 ? (
                      <p className="text-xs text-[hsl(220,10%,55%)] text-center py-4">No data yet</p>
                    ) : categoryBreakdown.map(([cat, count], i) => {
                      const max = categoryBreakdown[0][1];
                      const colors = ["hsl(220,70%,55%)", "hsl(152,69%,45%)", "hsl(38,85%,50%)", "hsl(280,60%,55%)", "hsl(354,70%,55%)", "hsl(200,70%,50%)", "hsl(170,60%,45%)", "hsl(320,60%,55%)"];
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-[hsl(220,15%,20%)] truncate flex-1">{cat}</span>
                            <span className="text-[11px] font-bold text-[hsl(220,15%,15%)] tabular-nums ml-2">{count}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[hsl(220,15%,94%)] overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${(count / max) * 100}%`, backgroundColor: colors[i % colors.length] }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top Listings Leaderboard */}
                <div className="bg-white rounded-xl border border-[hsl(220,15%,90%)] overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-[hsl(220,15%,92%)] flex items-center gap-2.5">
                    <Star className="w-4 h-4 text-[hsl(38,85%,50%)]" />
                    <h3 className="text-sm font-semibold text-[hsl(220,15%,15%)]">Top Listings</h3>
                  </div>
                  <div className="divide-y divide-[hsl(220,15%,94%)]">
                    {topListings.length === 0 ? (
                      <p className="text-xs text-[hsl(220,10%,55%)] text-center py-8">No approved listings</p>
                    ) : topListings.map((l, i) => (
                      <div key={l.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[hsl(220,20%,99%)] transition-colors">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          i === 0 ? "bg-[hsl(38,85%,92%)] text-[hsl(38,85%,35%)]" : i === 1 ? "bg-[hsl(220,15%,93%)] text-[hsl(220,10%,45%)]" : "bg-[hsl(220,15%,96%)] text-[hsl(220,10%,55%)]"
                        }`}>{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-[hsl(220,15%,15%)] truncate">{l.name}</p>
                          <p className="text-[10px] text-[hsl(220,10%,55%)]">{l.category}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-[hsl(220,15%,15%)] tabular-nums">{((l as any).viewCount || 0).toLocaleString()}</p>
                          <p className="text-[10px] text-[hsl(220,10%,55%)]">views</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enquiry Conversion Funnel */}
                <div className="bg-white rounded-xl border border-[hsl(220,15%,90%)] overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-[hsl(220,15%,92%)] flex items-center gap-2.5">
                    <Target className="w-4 h-4 text-[hsl(152,69%,40%)]" />
                    <h3 className="text-sm font-semibold text-[hsl(220,15%,15%)]">Enquiry Funnel</h3>
                  </div>
                  <div className="p-5 space-y-4">
                    {[
                      { label: "Total Enquiries", value: stats.enquiries, pct: 100, color: "hsl(220,70%,50%)" },
                      { label: "Contacted", value: enquiries.filter(e => e.status === "contacted").length, pct: enquiryConversion.contacted, color: "hsl(200,70%,50%)" },
                      { label: "Qualified", value: enquiries.filter(e => e.status === "qualified").length, pct: enquiryConversion.qualified, color: "hsl(38,85%,50%)" },
                      { label: "Converted", value: enquiries.filter(e => e.status === "converted").length, pct: enquiryConversion.converted, color: "hsl(152,69%,40%)" },
                    ].map((step, i) => (
                      <div key={step.label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-medium text-[hsl(220,15%,20%)]">{step.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[hsl(220,15%,15%)] tabular-nums">{step.value}</span>
                            <span className="text-[10px] text-[hsl(220,10%,55%)]">{step.pct}%</span>
                          </div>
                        </div>
                        <div className="h-2.5 rounded-full bg-[hsl(220,15%,94%)] overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${step.pct}%`, backgroundColor: step.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pending Queue */}
              <div className="bg-white rounded-xl border border-[hsl(220,15%,90%)] overflow-hidden">
                <div className="px-5 py-4 border-b border-[hsl(220,15%,92%)] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[hsl(38,90%,95%)] flex items-center justify-center">
                      <Clock className="w-4 h-4 text-[hsl(38,85%,45%)]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[hsl(220,15%,15%)]">Pending Review</h3>
                      <p className="text-[11px] text-[hsl(220,10%,55%)]">{filteredPending.length} listing{filteredPending.length !== 1 ? "s" : ""} awaiting approval</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab("listings")} className="text-xs font-medium text-[hsl(220,70%,50%)] hover:underline flex items-center gap-1">
                    View all <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-16"><Loader2 className="w-5 h-5 animate-spin mx-auto text-[hsl(220,10%,60%)]" /></div>
                ) : filteredPending.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-full bg-[hsl(152,50%,95%)] flex items-center justify-center mx-auto mb-3">
                      <Check className="w-5 h-5 text-[hsl(152,69%,40%)]" />
                    </div>
                    <p className="font-semibold text-[hsl(220,15%,15%)] text-sm">All caught up!</p>
                    <p className="text-xs text-[hsl(220,10%,55%)] mt-0.5">No pending listings to review</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[hsl(220,15%,94%)]">
                    {filteredPending.map((listing) => {
                      const changeCount = (listing as any).previousApproved ? Object.keys((listing as any).previousApproved).length : 0;
                      return (
                        <div key={listing.id} className="p-5 hover:bg-[hsl(220,20%,99%)] transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="w-11 h-11 rounded-lg bg-[hsl(220,15%,96%)] flex items-center justify-center overflow-hidden shrink-0 border border-[hsl(220,15%,90%)]">
                              {listing.logoUrl ? (
                                <img src={listing.logoUrl} alt={listing.name} className="w-full h-full object-cover" />
                              ) : (
                                <Store className="w-5 h-5 text-[hsl(220,10%,55%)]" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <h4 className="font-semibold text-sm text-[hsl(220,15%,15%)] truncate">{listing.name}</h4>
                                <Badge className="bg-[hsl(38,85%,92%)] text-[hsl(38,85%,30%)] border-0 text-[10px] px-2 py-0 rounded-md font-medium">Pending</Badge>
                                {changeCount > 0 && (
                                  <Badge className="bg-[hsl(280,60%,93%)] text-[hsl(280,60%,40%)] border-0 text-[10px] px-2 py-0 rounded-md font-medium flex items-center gap-1">
                                    <Edit3 className="w-2.5 h-2.5" />
                                    {changeCount} changed
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-[hsl(220,10%,55%)] truncate">{listing.address}</p>
                              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[hsl(220,10%,55%)]">
                                <span className="font-medium">{listing.category}</span>
                                <span className="text-[hsl(220,15%,85%)]">·</span>
                                <span>{listing.district}</span>
                                {listing.phone && <><span className="text-[hsl(220,15%,85%)]">·</span><span>{listing.phone}</span></>}
                              </div>
                            </div>
                          </div>

                          {/* Images */}
                          {listing.imageUrls && listing.imageUrls.length > 0 && (
                            <div className="mt-3 ml-14">
                              <p className="text-[10px] font-semibold text-[hsl(220,10%,55%)] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <Image className="w-3 h-3" />Current Images ({listing.imageUrls.length})
                              </p>
                              <div className="flex gap-1.5 overflow-x-auto">
                                {listing.imageUrls.map((url, i) => (
                                  <div key={i} className="relative group shrink-0">
                                    <img src={url} alt={`${listing.name} ${i + 1}`} onClick={() => setPreviewImage(url)}
                                      className="w-14 h-14 rounded-lg object-cover border border-[hsl(220,15%,88%)] cursor-pointer hover:opacity-80 transition" />
                                    <button onClick={() => handleDeleteSingleImage(listing.id, i, "imageUrls")}
                                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[hsl(354,70%,54%)] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                      title="Delete"><X className="w-3 h-3" /></button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Pending Logo */}
                          {listing.pendingLogoUrl && (
                            <div className="mt-3 ml-14">
                              <p className="text-[10px] font-semibold text-[hsl(38,85%,40%)] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" />Pending Logo
                              </p>
                              <div className="flex items-center gap-3">
                                <img src={listing.pendingLogoUrl} alt="Pending logo" className="w-14 h-14 rounded-lg object-cover border-2 border-[hsl(38,85%,60%)] shrink-0" />
                                <div className="flex gap-1.5">
                                  <Button size="sm" onClick={async () => {
                                    try {
                                      await updateDoc(doc(db, "listings", listing.id), { logoUrl: listing.pendingLogoUrl, pendingLogoUrl: "" });
                                      setAllListings(prev => prev.map(l => l.id === listing.id ? { ...l, logoUrl: listing.pendingLogoUrl, pendingLogoUrl: "" } : l));
                                      setPendingListings(prev => prev.map(l => l.id === listing.id ? { ...l, logoUrl: listing.pendingLogoUrl, pendingLogoUrl: "" } : l));
                                      if (listing.email || listing.ownerId) notifyImageApproval({ type: "image_approved", recipientEmail: listing.email || "", recipientName: listing.name, businessName: listing.name, imageType: "logo", listingId: listing.id, ownerId: listing.ownerId || "" }).catch(() => {});
                                      toast.success("Logo approved");
                                    } catch { toast.error("Failed to approve logo"); }
                                  }} className="bg-[hsl(152,69%,40%)] hover:bg-[hsl(152,69%,35%)] text-white text-[10px] h-7 px-2 rounded-lg">
                                    <Check className="w-3 h-3 mr-1" />Approve
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={async () => {
                                    try {
                                      await updateDoc(doc(db, "listings", listing.id), { pendingLogoUrl: "" });
                                      setAllListings(prev => prev.map(l => l.id === listing.id ? { ...l, pendingLogoUrl: "" } : l));
                                      setPendingListings(prev => prev.map(l => l.id === listing.id ? { ...l, pendingLogoUrl: "" } : l));
                                      if (listing.email || listing.ownerId) notifyImageApproval({ type: "image_rejected", recipientEmail: listing.email || "", recipientName: listing.name, businessName: listing.name, imageType: "logo", listingId: listing.id, ownerId: listing.ownerId || "" }).catch(() => {});
                                      toast.success("Logo rejected");
                                    } catch { toast.error("Failed"); }
                                  }} className="border-[hsl(354,50%,80%)] text-[hsl(354,70%,50%)] text-[10px] h-7 px-2 rounded-lg">
                                    <X className="w-3 h-3 mr-1" />Reject
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Pending Images */}
                          {listing.pendingImageUrls && listing.pendingImageUrls.length > 0 && (
                            <div className="mt-3 ml-14">
                              <p className="text-[10px] font-semibold text-[hsl(38,85%,40%)] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" />Pending Images ({listing.pendingImageUrls.length})
                              </p>
                              <div className="flex gap-2 overflow-x-auto">
                                {listing.pendingImageUrls.map((url, i) => (
                                  <div key={i} className="relative shrink-0 group">
                                    <img src={url} alt={`Pending ${i + 1}`} onClick={() => setPreviewImage(url)}
                                      className="w-14 h-14 rounded-lg object-cover border-2 border-[hsl(38,85%,60%)] cursor-pointer hover:opacity-80 transition" />
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => handleApproveSinglePendingImage(listing.id, i)} className="w-5 h-5 rounded-full bg-[hsl(152,69%,40%)] text-white flex items-center justify-center shadow-md"><Check className="w-3 h-3" /></button>
                                      <button onClick={() => handleDeleteSingleImage(listing.id, i, "pendingImageUrls")} className="w-5 h-5 rounded-full bg-[hsl(354,70%,54%)] text-white flex items-center justify-center shadow-md"><X className="w-3 h-3" /></button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="flex gap-1.5 mt-2">
                                <Button size="sm" onClick={async () => {
                                  try {
                                    const merged = [...(listing.imageUrls || []), ...(listing.pendingImageUrls || [])];
                                    await updateDoc(doc(db, "listings", listing.id), { imageUrls: merged, pendingImageUrls: [] });
                                    const updater = (l: Listing) => l.id === listing.id ? { ...l, imageUrls: merged, pendingImageUrls: [] } : l;
                                    setAllListings(prev => prev.map(updater));
                                    setPendingListings(prev => prev.map(updater));
                                    if (listing.email || listing.ownerId) notifyImageApproval({ type: "image_approved", recipientEmail: listing.email || "", recipientName: listing.name, businessName: listing.name, imageType: "photos", listingId: listing.id, ownerId: listing.ownerId || "" }).catch(() => {});
                                    toast.success("All images approved");
                                  } catch { toast.error("Failed"); }
                                }} className="bg-[hsl(152,69%,40%)] hover:bg-[hsl(152,69%,35%)] text-white text-[10px] h-7 px-2 rounded-lg">
                                  <Check className="w-3 h-3 mr-1" />Approve All
                                </Button>
                                <Button size="sm" variant="outline" onClick={async () => {
                                  try {
                                    await updateDoc(doc(db, "listings", listing.id), { pendingImageUrls: [] });
                                    const updater = (l: Listing) => l.id === listing.id ? { ...l, pendingImageUrls: [] } : l;
                                    setAllListings(prev => prev.map(updater));
                                    setPendingListings(prev => prev.map(updater));
                                    if (listing.email || listing.ownerId) notifyImageApproval({ type: "image_rejected", recipientEmail: listing.email || "", recipientName: listing.name, businessName: listing.name, imageType: "photos", listingId: listing.id, ownerId: listing.ownerId || "" }).catch(() => {});
                                    toast.success("All pending images rejected");
                                  } catch { toast.error("Failed"); }
                                }} className="border-[hsl(354,50%,80%)] text-[hsl(354,70%,50%)] text-[10px] h-7 px-2 rounded-lg">
                                  <X className="w-3 h-3 mr-1" />Reject All
                                </Button>
                              </div>
                            </div>
                          )}

                          {listing.description && (
                            <p className="text-xs text-[hsl(220,10%,55%)] mt-2 line-clamp-2 ml-14">{listing.description}</p>
                          )}

                          {/* Changed Fields Highlight */}
                          {(listing as any).previousApproved && Object.keys((listing as any).previousApproved).length > 0 && (
                            <div className="mt-3 ml-14 rounded-lg border border-[hsl(38,85%,80%)] bg-[hsl(38,90%,98%)] p-3">
                              <p className="text-[10px] font-semibold text-[hsl(38,85%,35%)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <AlertTriangle className="w-3 h-3" />
                                {Object.keys((listing as any).previousApproved).length} Field{Object.keys((listing as any).previousApproved).length !== 1 ? "s" : ""} Modified
                              </p>
                              <div className="space-y-1.5">
                                {Object.entries((listing as any).previousApproved).map(([field, oldValue]) => {
                                  const newValue = (listing as any)[field];
                                  const label = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, " $1");
                                  const oldStr = typeof oldValue === "object" ? JSON.stringify(oldValue) : String(oldValue || "—");
                                  const newStr = typeof newValue === "object" ? JSON.stringify(newValue) : String(newValue || "—");
                                  if (field === "operatingHours") return (
                                    <div key={field} className="text-[11px]">
                                      <span className="font-semibold text-[hsl(220,15%,20%)]">{label}:</span>
                                      <span className="ml-1 text-[hsl(38,85%,35%)] italic">Hours were modified</span>
                                    </div>
                                  );
                                  return (
                                    <div key={field} className="text-[11px]">
                                      <span className="font-semibold text-[hsl(220,15%,20%)]">{label}:</span>
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 mt-0.5">
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[hsl(354,70%,96%)] text-[hsl(354,70%,45%)] line-through text-[10px] max-w-[200px] truncate">{oldStr}</span>
                                        <ChevronRight className="w-3 h-3 text-[hsl(220,10%,60%)] hidden sm:block shrink-0" />
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[hsl(152,50%,93%)] text-[hsl(152,69%,30%)] font-medium text-[10px] max-w-[200px] truncate">{newStr}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {listing.documentsUrl && listing.documentsUrl.length > 0 && (
                            <div className="flex gap-1.5 mt-2 ml-14 flex-wrap">
                              {listing.documentsUrl.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] text-[hsl(220,70%,50%)] hover:underline bg-[hsl(220,70%,97%)] px-2 py-1 rounded-md">
                                  <FileText className="w-3 h-3" />Doc {i + 1}<ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 mt-3 ml-14 pt-3 border-t border-[hsl(220,15%,93%)]">
                            <Button size="sm" onClick={() => handleApprove(listing.id)} disabled={actionLoading === listing.id}
                              className="bg-[hsl(152,69%,40%)] hover:bg-[hsl(152,69%,35%)] text-white rounded-lg text-xs h-8 px-3">
                              {actionLoading === listing.id ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { setRejectingId(listing.id); setRejectionReason(""); }} disabled={actionLoading === listing.id}
                              className="border-[hsl(354,50%,82%)] text-[hsl(354,70%,50%)] hover:bg-[hsl(354,70%,98%)] rounded-lg text-xs h-8 px-3">
                              <X className="w-3.5 h-3.5 mr-1" />Reject
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openAdminEdit(listing)}
                              className="rounded-lg text-xs h-8 px-3 border-[hsl(220,15%,85%)] text-[hsl(220,10%,40%)]">
                              <Edit3 className="w-3.5 h-3.5 mr-1" />Edit
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ═══ ALL LISTINGS ═════════════════════════════════ */}
          {activeTab === "listings" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold text-[hsl(220,15%,15%)]">All Listings</h1>
                  <p className="text-xs text-[hsl(220,10%,55%)] mt-0.5">{stats.total} total listings on the platform</p>
                </div>
              </div>

              {/* Filter pills */}
              <div className="flex gap-2 flex-wrap">
                {([
                  { key: "all", label: "All", count: allListings.length },
                  { key: "approved", label: "Live", count: stats.approved },
                  { key: "pending_approval", label: "Pending", count: stats.pending },
                  { key: "rejected", label: "Rejected", count: stats.rejected },
                ] as const).map((f) => (
                  <button key={f.key} onClick={() => setListingFilter(f.key)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition border
                      ${listingFilter === f.key
                        ? "bg-[hsl(220,70%,50%)] text-white border-transparent shadow-sm"
                        : "bg-white text-[hsl(220,10%,45%)] border-[hsl(220,15%,88%)] hover:border-[hsl(220,70%,60%)] hover:text-[hsl(220,70%,50%)]"
                      }`}>
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>

              {/* Bulk Actions Bar */}
              {selectedIds.size > 0 && (
                <div className="bg-[hsl(220,70%,97%)] border border-[hsl(220,70%,85%)] rounded-xl px-4 py-3 flex items-center gap-3 animate-fade-in">
                  <CheckSquare className="w-4 h-4 text-[hsl(220,70%,50%)]" />
                  <span className="text-xs font-semibold text-[hsl(220,70%,40%)]">{selectedIds.size} selected</span>
                  <div className="flex gap-2 ml-auto">
                    <Button size="sm" onClick={handleBulkApprove} className="bg-[hsl(152,69%,40%)] hover:bg-[hsl(152,69%,35%)] text-white text-[11px] h-7 px-3 rounded-lg">
                      <Check className="w-3 h-3 mr-1" />Approve All
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleBulkDelete} className="border-[hsl(354,50%,82%)] text-[hsl(354,70%,50%)] text-[11px] h-7 px-3 rounded-lg">
                      <Trash2 className="w-3 h-3 mr-1" />Delete All
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="text-[11px] h-7 px-2">Clear</Button>
                  </div>
                </div>
              )}

              {/* Listings table */}
              {loading ? (
                <div className="text-center py-16"><Loader2 className="w-5 h-5 animate-spin mx-auto text-[hsl(220,10%,60%)]" /></div>
              ) : filteredAllListings.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-[hsl(220,15%,90%)]">
                  <Building2 className="w-8 h-8 mx-auto mb-2 text-[hsl(220,10%,60%)]" />
                  <p className="font-medium text-[hsl(220,15%,15%)] text-sm">No listings found</p>
                  <p className="text-xs text-[hsl(220,10%,55%)] mt-0.5">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="bg-white border border-[hsl(220,15%,90%)] rounded-xl overflow-hidden">
                  {/* Table header */}
                  <div className="grid grid-cols-[32px_1fr_120px_100px_80px] gap-3 px-5 py-2.5 border-b border-[hsl(220,15%,92%)] bg-[hsl(220,15%,98%)]">
                    <button onClick={toggleSelectAll} className="w-5 h-5 rounded border border-[hsl(220,15%,80%)] flex items-center justify-center hover:bg-[hsl(220,20%,95%)] transition">
                      {selectedIds.size === filteredAllListings.length && filteredAllListings.length > 0 ? <Check className="w-3 h-3 text-[hsl(220,70%,50%)]" /> : null}
                    </button>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(220,10%,55%)]">Business</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(220,10%,55%)] hidden sm:block">Category</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(220,10%,55%)] hidden sm:block">Status</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(220,10%,55%)] text-right">Actions</span>
                  </div>
                  <div className="divide-y divide-[hsl(220,15%,94%)]">
                    {filteredAllListings.map((l) => {
                      const statusMap: Record<string, { bg: string; text: string; label: string }> = {
                        approved: { bg: "bg-[hsl(152,50%,93%)]", text: "text-[hsl(152,69%,35%)]", label: "Live" },
                        pending_approval: { bg: "bg-[hsl(38,70%,93%)]", text: "text-[hsl(38,80%,35%)]", label: "Pending" },
                        rejected: { bg: "bg-[hsl(0,60%,95%)]", text: "text-[hsl(0,70%,45%)]", label: "Rejected" },
                      };
                      const s = statusMap[l.status] || statusMap.approved;
                      return (
                        <div key={l.id} className={`grid grid-cols-[32px_1fr_120px_100px_80px] gap-3 items-center px-5 py-3 hover:bg-[hsl(220,20%,99%)] transition-colors ${selectedIds.has(l.id) ? "bg-[hsl(220,70%,98%)]" : ""}`}>
                          <button onClick={() => toggleSelect(l.id)} className={`w-5 h-5 rounded border flex items-center justify-center transition ${selectedIds.has(l.id) ? "bg-[hsl(220,70%,50%)] border-[hsl(220,70%,50%)]" : "border-[hsl(220,15%,80%)] hover:bg-[hsl(220,20%,95%)]"}`}>
                            {selectedIds.has(l.id) && <Check className="w-3 h-3 text-white" />}
                          </button>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-[hsl(220,15%,96%)] flex items-center justify-center overflow-hidden shrink-0 border border-[hsl(220,15%,90%)]">
                              {l.logoUrl ? <img src={l.logoUrl} alt={l.name} className="w-full h-full object-cover" /> : <Store className="w-4 h-4 text-[hsl(220,10%,55%)]" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-[hsl(220,15%,15%)] truncate">{l.name}</p>
                              <p className="text-[11px] text-[hsl(220,10%,55%)] truncate">{l.district}</p>
                            </div>
                          </div>
                          <span className="text-xs text-[hsl(220,10%,45%)] hidden sm:block truncate">{l.category}</span>
                          <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold w-fit ${s.bg} ${s.text}`}>{s.label}</span>
                          <div className="flex items-center gap-1 justify-end">
                            {l.imageUrls && l.imageUrls.length > 0 && (
                              <button onClick={() => setViewingImages({ listing: l })} className="w-7 h-7 rounded-md hover:bg-[hsl(220,20%,95%)] flex items-center justify-center transition" title="View images">
                                <Image className="w-3.5 h-3.5 text-[hsl(220,10%,55%)]" />
                              </button>
                            )}
                            <button onClick={() => openAdminEdit(l)} className="w-7 h-7 rounded-md hover:bg-[hsl(220,20%,95%)] flex items-center justify-center transition" title="Edit">
                              <Edit3 className="w-3.5 h-3.5 text-[hsl(220,10%,55%)]" />
                            </button>
                            <button onClick={() => handleDelete(l.id)} disabled={actionLoading === l.id}
                              className="w-7 h-7 rounded-md hover:bg-[hsl(354,70%,97%)] flex items-center justify-center transition" title="Delete">
                              {actionLoading === l.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[hsl(220,10%,55%)]" /> : <Trash2 className="w-3.5 h-3.5 text-[hsl(354,70%,55%)]" />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ═══ ENQUIRIES ════════════════════════════════════ */}
          {activeTab === "enquiries" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div>
                <h1 className="text-lg font-semibold text-[hsl(220,15%,15%)]">Enquiries</h1>
                <p className="text-xs text-[hsl(220,10%,55%)] mt-0.5">{stats.unreadEnquiries} new · {stats.enquiries} total</p>
              </div>

              <div className="flex gap-2 flex-wrap">
                {[{ key: "all" as const, label: "All" }, ...ENQUIRY_STATUSES].map((f) => (
                  <button key={f.key} onClick={() => setEnquiryFilter(f.key)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition border
                      ${enquiryFilter === f.key
                        ? "bg-[hsl(220,70%,50%)] text-white border-transparent shadow-sm"
                        : "bg-white text-[hsl(220,10%,45%)] border-[hsl(220,15%,88%)] hover:border-[hsl(220,70%,60%)]"
                      }`}>
                    {f.label} ({enquiryStatusCounts[f.key] || 0})
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="text-center py-16"><Loader2 className="w-5 h-5 animate-spin mx-auto text-[hsl(220,10%,60%)]" /></div>
              ) : filteredEnquiries.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-[hsl(220,15%,90%)]">
                  <Inbox className="w-8 h-8 mx-auto mb-2 text-[hsl(220,10%,60%)]" />
                  <p className="font-medium text-[hsl(220,15%,15%)] text-sm">No enquiries found</p>
                  <p className="text-xs text-[hsl(220,10%,55%)] mt-0.5">Try adjusting your search or filter</p>
                </div>
              ) : (
                <div className="bg-white border border-[hsl(220,15%,90%)] rounded-xl overflow-hidden divide-y divide-[hsl(220,15%,94%)]">
                  {filteredEnquiries.map((e) => {
                    const statusInfo = ENQUIRY_STATUSES.find(s => s.key === e.status) || ENQUIRY_STATUSES[0];
                    return (
                      <div key={e.id} className="flex items-start gap-3 px-5 py-4 hover:bg-[hsl(220,20%,99%)] transition-colors">
                        <div className="w-10 h-10 rounded-full bg-[hsl(220,70%,96%)] flex items-center justify-center shrink-0 text-xs font-bold text-[hsl(220,70%,50%)]">
                          {e.name[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <p className="font-medium text-sm text-[hsl(220,15%,15%)]">{e.name}</p>
                            <select
                              value={e.status}
                              onChange={(ev) => handleEnquiryStatus(e.id, ev.target.value as EnquiryStatus)}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border-0 cursor-pointer outline-none ${statusInfo.color}`}
                            >
                              {ENQUIRY_STATUSES.map(s => (<option key={s.key} value={s.key}>{s.label}</option>))}
                            </select>
                          </div>
                          <p className="text-[11px] text-[hsl(220,10%,55%)] mb-1">{e.listingName}</p>
                          {e.phone && <p className="text-[11px] text-[hsl(220,10%,55%)] mb-0.5 flex items-center gap-1"><Phone className="w-3 h-3" />{e.phone}</p>}
                          <p className="text-xs text-[hsl(220,15%,30%)] line-clamp-2">{e.message}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {(() => {
                            const waUrl = getWhatsAppUrl(e);
                            return waUrl ? (
                              <a href={waUrl} target="_blank" rel="noopener noreferrer"
                                className="w-8 h-8 rounded-lg hover:bg-[hsl(152,50%,95%)] flex items-center justify-center transition" title="Reply via WhatsApp">
                                <MessageCircle className="w-4 h-4 text-[hsl(152,69%,40%)]" />
                              </a>
                            ) : null;
                          })()}
                          {e.email && (
                            <a href={`mailto:${e.email}`} className="w-8 h-8 rounded-lg hover:bg-[hsl(220,20%,95%)] flex items-center justify-center transition" title="Email">
                              <Mail className="w-4 h-4 text-[hsl(220,10%,55%)]" />
                            </a>
                          )}
                          <button onClick={() => handleDeleteEnquiry(e.id)} disabled={actionLoading === e.id}
                            className="w-8 h-8 rounded-lg hover:bg-[hsl(354,70%,97%)] flex items-center justify-center transition" title="Delete">
                            {actionLoading === e.id ? <Loader2 className="w-4 h-4 animate-spin text-[hsl(220,10%,55%)]" /> : <Trash2 className="w-4 h-4 text-[hsl(354,70%,55%)]" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══ ANALYTICS ══════════════════════════════════ */}
          {activeTab === "analytics" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h1 className="text-lg font-semibold text-[hsl(220,15%,15%)]">Analytics</h1>
                <p className="text-xs text-[hsl(220,10%,55%)] mt-0.5">Platform performance insights and data breakdown</p>
              </div>

              {/* KPI Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Approval Rate", value: `${stats.total ? Math.round((stats.approved / stats.total) * 100) : 0}%`, sub: "of total listings", icon: TrendingUp, color: "hsl(152,69%,40%)" },
                  { label: "Enquiry Rate", value: `${stats.total ? (stats.enquiries / stats.total).toFixed(1) : 0}`, sub: "per listing avg", icon: Target, color: "hsl(220,70%,50%)" },
                  { label: "Response Rate", value: `${enquiryConversion.contacted}%`, sub: "enquiries contacted", icon: MessageSquare, color: "hsl(200,70%,50%)" },
                  { label: "Conversion", value: `${enquiryConversion.converted}%`, sub: "enquiries converted", icon: Sparkles, color: "hsl(38,85%,50%)" },
                ].map((k) => (
                  <div key={k.label} className="bg-white rounded-xl border border-[hsl(220,15%,90%)] p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <k.icon className="w-4 h-4" style={{ color: k.color }} />
                      <span className="text-[11px] font-medium text-[hsl(220,10%,50%)]">{k.label}</span>
                    </div>
                    <p className="text-3xl font-bold text-[hsl(220,15%,12%)] tabular-nums">{k.value}</p>
                    <p className="text-[10px] text-[hsl(220,10%,55%)] mt-1">{k.sub}</p>
                  </div>
                ))}
              </div>

              {/* Category + District breakdown side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Category */}
                <div className="bg-white rounded-xl border border-[hsl(220,15%,90%)] overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-[hsl(220,15%,92%)] flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-[hsl(280,60%,55%)]" />
                    <h3 className="text-sm font-semibold text-[hsl(220,15%,15%)]">Listings by Category</h3>
                  </div>
                  <div className="p-5 space-y-3">
                    {categoryBreakdown.length === 0 ? (
                      <p className="text-xs text-center py-8 text-[hsl(220,10%,55%)]">No data</p>
                    ) : categoryBreakdown.map(([cat, count], i) => {
                      const max = categoryBreakdown[0][1];
                      const colors = ["hsl(220,70%,55%)", "hsl(152,69%,45%)", "hsl(38,85%,50%)", "hsl(280,60%,55%)", "hsl(354,70%,55%)", "hsl(200,70%,50%)", "hsl(170,60%,45%)", "hsl(320,60%,55%)"];
                      return (
                        <div key={cat} className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                          <span className="text-xs font-medium text-[hsl(220,15%,20%)] flex-1 truncate">{cat}</span>
                          <div className="w-32 h-2 rounded-full bg-[hsl(220,15%,94%)] overflow-hidden shrink-0">
                            <div className="h-full rounded-full" style={{ width: `${(count / max) * 100}%`, backgroundColor: colors[i % colors.length] }} />
                          </div>
                          <span className="text-[11px] font-bold text-[hsl(220,15%,15%)] tabular-nums w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* District */}
                <div className="bg-white rounded-xl border border-[hsl(220,15%,90%)] overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-[hsl(220,15%,92%)] flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-[hsl(200,70%,50%)]" />
                    <h3 className="text-sm font-semibold text-[hsl(220,15%,15%)]">Listings by District</h3>
                  </div>
                  <div className="p-5 space-y-3">
                    {districtBreakdown.length === 0 ? (
                      <p className="text-xs text-center py-8 text-[hsl(220,10%,55%)]">No data</p>
                    ) : districtBreakdown.map(([dist, count], i) => {
                      const max = districtBreakdown[0][1];
                      return (
                        <div key={dist} className="flex items-center gap-3">
                          <MapPin className="w-3.5 h-3.5 text-[hsl(220,10%,55%)] shrink-0" />
                          <span className="text-xs font-medium text-[hsl(220,15%,20%)] flex-1 truncate">{dist}</span>
                          <div className="w-32 h-2 rounded-full bg-[hsl(220,15%,94%)] overflow-hidden shrink-0">
                            <div className="h-full rounded-full bg-[hsl(220,70%,55%)]" style={{ width: `${(count / max) * 100}%` }} />
                          </div>
                          <span className="text-[11px] font-bold text-[hsl(220,15%,15%)] tabular-nums w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Enquiry Status Distribution */}
              <div className="bg-white rounded-xl border border-[hsl(220,15%,90%)] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[hsl(220,15%,92%)] flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-[hsl(220,70%,50%)]" />
                  <h3 className="text-sm font-semibold text-[hsl(220,15%,15%)]">Enquiry Status Distribution</h3>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {ENQUIRY_STATUSES.map((s) => {
                      const count = enquiryStatusCounts[s.key] || 0;
                      return (
                        <div key={s.key} className={`rounded-xl p-4 text-center ${s.color}`}>
                          <p className="text-2xl font-bold tabular-nums">{count}</p>
                          <p className="text-[10px] font-semibold mt-1">{s.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ ACTIVITY LOG ═════════════════════════════════ */}
          {activeTab === "activity" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div>
                <h1 className="text-lg font-semibold text-[hsl(220,15%,15%)]">Activity Log</h1>
                <p className="text-xs text-[hsl(220,10%,55%)] mt-0.5">Recent platform events and actions</p>
              </div>

              <div className="bg-white rounded-xl border border-[hsl(220,15%,90%)] overflow-hidden">
                {activityLog.length === 0 ? (
                  <div className="text-center py-16">
                    <Activity className="w-8 h-8 mx-auto mb-2 text-[hsl(220,10%,60%)]" />
                    <p className="font-medium text-[hsl(220,15%,15%)] text-sm">No recent activity</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[hsl(220,15%,94%)]">
                    {activityLog.map((item, i) => (
                      <div key={item.id} className="flex items-start gap-4 px-5 py-4 hover:bg-[hsl(220,20%,99%)] transition-colors">
                        <div className="relative">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                            <item.icon className="w-4 h-4" style={{ color: item.color }} />
                          </div>
                          {i < activityLog.length - 1 && (
                            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-px h-6 bg-[hsl(220,15%,90%)]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <p className="text-sm text-[hsl(220,15%,20%)]">{item.text}</p>
                          <p className="text-[11px] text-[hsl(220,10%,55%)] mt-0.5">{item.time}</p>
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          item.type === "enquiry" ? "bg-[hsl(220,70%,95%)] text-[hsl(220,70%,40%)]" : "bg-[hsl(38,90%,93%)] text-[hsl(38,85%,35%)]"
                        }`}>
                          {item.type === "enquiry" ? "Enquiry" : "Listing"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ═══ USERS ═══════════════════════════════════════ */}
          {activeTab === "users" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold text-[hsl(220,15%,15%)]">Registered Users</h1>
                  <p className="text-xs text-[hsl(220,10%,55%)] mt-0.5">{appUsers.length} user{appUsers.length !== 1 ? "s" : ""} registered</p>
                </div>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs rounded-lg" onClick={() => {
                  const csv = ["Email,Phone,Registered"].concat(appUsers.map(u => `${u.email || ""},${u.phone || ""},${u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : ""}`)).join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = "users.csv"; a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Users exported");
                }}>
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </Button>
              </div>

              <div className="bg-white border border-[hsl(220,15%,90%)] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[hsl(220,15%,93%)] bg-[hsl(220,20%,97%)]">
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[hsl(220,10%,50%)]">#</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[hsl(220,10%,50%)]">Email</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[hsl(220,10%,50%)]">Mobile Number</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[hsl(220,10%,50%)]">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[hsl(220,15%,94%)]">
                      {appUsers.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-10 text-[hsl(220,10%,55%)] text-sm">No registered users yet</td></tr>
                      ) : appUsers.map((u, i) => (
                        <tr key={u.id} className="hover:bg-[hsl(220,20%,98%)] transition-colors">
                          <td className="px-4 py-3 text-[hsl(220,10%,55%)] text-xs">{i + 1}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-[hsl(220,70%,50%)]" />
                              <span className="text-[hsl(220,15%,20%)]">{u.email || "—"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-[hsl(152,69%,40%)]" />
                              <span className="text-[hsl(220,15%,20%)] font-medium">{u.phone || "—"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-[hsl(220,10%,55%)]">
                            {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ SETTINGS ═════════════════════════════════════ */}
          {activeTab === "settings" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-2xl">
              <div>
                <h1 className="text-lg font-semibold text-[hsl(220,15%,15%)]">Settings</h1>
                <p className="text-xs text-[hsl(220,10%,55%)] mt-0.5">Configure platform-wide preferences</p>
              </div>

              <div className="bg-white border border-[hsl(220,15%,90%)] rounded-xl overflow-hidden divide-y divide-[hsl(220,15%,94%)]">
                {[
                  { key: "autoApprove" as const, label: "Auto-approve listings", desc: "Automatically approve new listings without manual review", icon: Zap },
                  { key: "emailNotifications" as const, label: "Email notifications", desc: "Send email alerts for new listings and enquiries", icon: Mail },
                  { key: "documentRequired" as const, label: "Require documents", desc: "Require ACRA business profile upload during listing submission", icon: FileText },
                ].map((s) => (
                  <div key={s.key} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[hsl(220,15%,97%)] flex items-center justify-center">
                        <s.icon className="w-4 h-4 text-[hsl(220,10%,45%)]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[hsl(220,15%,15%)]">{s.label}</p>
                        <p className="text-[11px] text-[hsl(220,10%,55%)] mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                    <Switch checked={settings[s.key]} onCheckedChange={() => setSettings((prev) => ({ ...prev, [s.key]: !prev[s.key] }))} />
                  </div>
                ))}

                {/* Browser Push Notifications */}
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[hsl(220,15%,97%)] flex items-center justify-center">
                      <Bell className="w-4 h-4 text-[hsl(220,10%,45%)]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[hsl(220,15%,15%)]">Browser push notifications</p>
                      <p className="text-[11px] text-[hsl(220,10%,55%)] mt-0.5">
                        {notifPermission === "granted" ? "Enabled — you'll receive alerts for new enquiries & listings" :
                         notifPermission === "denied" ? "Blocked — enable in browser settings" :
                         "Click to enable desktop alerts"}
                      </p>
                    </div>
                  </div>
                  {notifPermission === "granted" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(152,50%,93%)] text-[hsl(152,69%,35%)] text-[11px] font-semibold">
                      <Check className="w-3 h-3" />Active
                    </span>
                  ) : notifPermission === "denied" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(354,70%,95%)] text-[hsl(354,70%,45%)] text-[11px] font-semibold">
                      <X className="w-3 h-3" />Blocked
                    </span>
                  ) : (
                    <Button size="sm" onClick={requestNotifPermission} className="bg-[hsl(220,70%,50%)] hover:bg-[hsl(220,70%,45%)] text-white rounded-lg text-xs h-8">
                      <Bell className="w-3.5 h-3.5 mr-1.5" />Enable
                    </Button>
                  )}
                </div>
              </div>

              <div className="bg-white border border-[hsl(220,15%,90%)] rounded-xl px-5 py-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[hsl(152,50%,95%)] flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-[hsl(152,69%,40%)]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[hsl(220,15%,15%)]">WhatsApp Quick Reply</h3>
                    <p className="text-[11px] text-[hsl(220,10%,55%)]">
                      Use <code className="px-1 py-0.5 bg-[hsl(220,15%,96%)] rounded text-[10px]">{"{{name}}"}</code> and <code className="px-1 py-0.5 bg-[hsl(220,15%,96%)] rounded text-[10px]">{"{{business}}"}</code>
                    </p>
                  </div>
                </div>
                <Textarea value={settings.whatsappPrefill} onChange={(e) => setSettings((prev) => ({ ...prev, whatsappPrefill: e.target.value }))}
                  rows={3} className="rounded-lg text-sm border-[hsl(220,15%,88%)]" />
              </div>

              <div className="bg-white border border-[hsl(220,15%,90%)] rounded-xl px-5 py-4">
                <h3 className="text-sm font-semibold text-[hsl(220,15%,15%)] mb-3">Account</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[hsl(220,10%,50%)]">Email</span>
                    <span className="text-sm font-medium text-[hsl(220,15%,15%)]">{user?.email || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[hsl(220,10%,50%)]">Role</span>
                    <Badge className="bg-[hsl(220,70%,95%)] text-[hsl(220,70%,40%)] border-0 text-xs font-semibold">Super Admin</Badge>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </main>
      </div>

      {/* ── Rejection Dialog ── */}
      <Dialog open={!!rejectingId} onOpenChange={(open) => { if (!open) { setRejectingId(null); setRejectionReason(""); } }}>
        <DialogContent className="sm:max-w-md rounded-xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[hsl(220,15%,15%)]">
              <div className="w-8 h-8 rounded-lg bg-[hsl(354,70%,95%)] flex items-center justify-center">
                <X className="w-4 h-4 text-[hsl(354,70%,50%)]" />
              </div>
              Reject Listing
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-[hsl(220,10%,50%)]">Please provide a reason. This will be visible to the business owner.</p>
            <div className="space-y-2">
              <Label className="text-[hsl(220,15%,15%)] text-xs font-medium">Rejection Reason *</Label>
              <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Missing ACRA business profile document..." rows={3} className="rounded-lg border-[hsl(220,15%,88%)]" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setRejectingId(null); setRejectionReason(""); }} className="rounded-lg border-[hsl(220,15%,85%)]">Cancel</Button>
            <Button onClick={handleReject} disabled={!rejectionReason.trim() || actionLoading === rejectingId}
              className="bg-[hsl(354,70%,54%)] hover:bg-[hsl(354,70%,48%)] text-white rounded-lg">
              {actionLoading === rejectingId ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <X className="w-4 h-4 mr-1.5" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Admin Edit Dialog ── */}
      <Dialog open={!!editingListing} onOpenChange={(open) => { if (!open) setEditingListing(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[hsl(220,15%,15%)]">
              <div className="w-8 h-8 rounded-lg bg-[hsl(220,70%,95%)] flex items-center justify-center">
                <Edit3 className="w-4 h-4 text-[hsl(220,70%,50%)]" />
              </div>
              Edit Listing
            </DialogTitle>
          </DialogHeader>
          {editingListing && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-[hsl(220,15%,15%)] text-xs font-medium">Business Name</Label>
                <Input value={adminEditData.name || ""} onChange={e => setAdminEditData(prev => ({ ...prev, name: e.target.value }))} className="rounded-lg border-[hsl(220,15%,88%)]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[hsl(220,15%,15%)]">Category</Label>
                  <Input value={adminEditData.category || ""} onChange={e => setAdminEditData(prev => ({ ...prev, category: e.target.value }))} className="rounded-lg border-[hsl(220,15%,88%)]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[hsl(220,15%,15%)]">District</Label>
                  <Input value={adminEditData.district || ""} onChange={e => setAdminEditData(prev => ({ ...prev, district: e.target.value }))} className="rounded-lg border-[hsl(220,15%,88%)]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[hsl(220,15%,15%)]">Address</Label>
                <Input value={adminEditData.address || ""} onChange={e => setAdminEditData(prev => ({ ...prev, address: e.target.value }))} className="rounded-lg border-[hsl(220,15%,88%)]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[hsl(220,15%,15%)]">Phone</Label>
                  <Input value={adminEditData.phone || ""} onChange={e => setAdminEditData(prev => ({ ...prev, phone: e.target.value }))} className="rounded-lg border-[hsl(220,15%,88%)]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[hsl(220,15%,15%)]">Email</Label>
                  <Input value={adminEditData.email || ""} onChange={e => setAdminEditData(prev => ({ ...prev, email: e.target.value }))} className="rounded-lg border-[hsl(220,15%,88%)]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[hsl(220,15%,15%)]">Website</Label>
                <Input value={adminEditData.website || ""} onChange={e => setAdminEditData(prev => ({ ...prev, website: e.target.value }))} className="rounded-lg border-[hsl(220,15%,88%)]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[hsl(220,15%,15%)]">Description</Label>
                <Textarea value={adminEditData.description || ""} onChange={e => setAdminEditData(prev => ({ ...prev, description: e.target.value }))} rows={3} className="rounded-lg border-[hsl(220,15%,88%)]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[hsl(220,15%,15%)]">Status</Label>
                <select value={adminEditData.status || "pending_approval"} onChange={e => setAdminEditData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full rounded-lg border border-[hsl(220,15%,88%)] bg-white px-3 py-2 text-sm text-[hsl(220,15%,15%)]">
                  <option value="approved">Approved (Live)</option>
                  <option value="pending_approval">Pending Review</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {editingListing.documentsUrl && editingListing.documentsUrl.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-[hsl(220,15%,92%)]">
                  <Label className="text-xs font-medium text-[hsl(220,15%,15%)] flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />Documents</Label>
                  <div className="space-y-1.5">
                    {editingListing.documentsUrl.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-[hsl(220,70%,50%)] hover:underline bg-[hsl(220,70%,98%)] px-3 py-2 rounded-lg">
                        <FileText className="w-4 h-4 shrink-0" /><span className="truncate flex-1">{url}</span><ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {adminEditData.imageUrls && adminEditData.imageUrls.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-[hsl(220,15%,92%)]">
                  <Label className="text-xs font-medium text-[hsl(220,15%,15%)] flex items-center gap-1.5"><Image className="w-3.5 h-3.5" />Images ({adminEditData.imageUrls.length})</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(adminEditData.imageUrls as string[]).map((url, i) => (
                      <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-[hsl(220,15%,90%)]">
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
                <Button variant="outline" onClick={() => setEditingListing(null)} className="rounded-lg border-[hsl(220,15%,85%)]">Cancel</Button>
                <Button onClick={saveAdminEdit} disabled={adminSaving}
                  className="bg-[hsl(220,70%,50%)] hover:bg-[hsl(220,70%,45%)] text-white rounded-lg">
                  {adminSaving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Image Viewer ── */}
      <Dialog open={!!viewingImages} onOpenChange={(open) => { if (!open) setViewingImages(null); }}>
        <DialogContent className="sm:max-w-lg rounded-xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[hsl(220,15%,15%)]">
              <Image className="w-5 h-5 text-[hsl(220,70%,50%)]" />{viewingImages?.listing.name} — Images
            </DialogTitle>
          </DialogHeader>
          {viewingImages && (
            <div className="grid grid-cols-2 gap-3 py-2">
              {(viewingImages.listing.imageUrls || []).map((url, i) => (
                <div key={i} className="relative group">
                  <img src={url} alt={`Image ${i + 1}`} onClick={() => setPreviewImage(url)}
                    className="w-full aspect-square rounded-lg object-cover border border-[hsl(220,15%,90%)] cursor-pointer hover:opacity-80 transition" />
                  <button onClick={() => handleDeleteSingleImage(viewingImages.listing.id, i, "imageUrls")}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-[hsl(354,70%,54%)] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Full-Screen Preview ── */}
      <Dialog open={!!previewImage} onOpenChange={(open) => { if (!open) setPreviewImage(null); }}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl p-0 bg-black/95 border-none rounded-2xl overflow-hidden [&>button:last-child]:hidden" aria-describedby={undefined}>
          <div className="relative flex items-center justify-center min-h-[50vh] sm:min-h-[70vh]">
            {previewImage && <img src={previewImage} alt="Preview" className="w-full max-h-[85vh] object-contain" />}
            <button className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 flex items-center justify-center transition-colors z-10"
              onClick={() => setPreviewImage(null)}><X className="w-5 h-5" /></button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
