import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getBusinessUrl, toSlug } from "@/lib/url-helpers";
import { processImageFiles, compressFileToBase64 } from "@/lib/image-utils";
import {
  Building2, Plus, Edit3, Eye, Trash2, Clock, Check, X, BarChart3,
  ExternalLink, MapPin, Phone, Globe, ArrowLeft, TrendingUp,
  MessageSquare, MoreHorizontal, FileText, Loader2, Sparkles, Gift, Tag,
  CalendarDays, RefreshCw, ArrowUpRight, Activity, Users, Zap, Upload, Image, BookOpen,
  LayoutDashboard, Inbox, Settings, LogOut, Search, Bell, ChevronRight,
  Store, Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Listing, ListingOffer, OperatingHours, SpecialHours, DEFAULT_OPERATING_HOURS } from "@/components/ListingCard";
import { SINGAPORE_DISTRICTS, BUSINESS_CATEGORIES } from "@/lib/districts";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth as firebaseAuth } from "@/lib/firebase";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import LogoUpload from "@/components/LogoUpload";
import { Switch } from "@/components/ui/switch";
import EnquiryInbox from "@/components/EnquiryInbox";
import { useListingViewCounts } from "@/hooks/useViewTracking";
import ViewAnalyticsChart from "@/components/ViewAnalyticsChart";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Change Password Form ─── */
const ChangePasswordForm = () => {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = async () => {
    if (!currentPw) { toast.error("Enter your current password"); return; }
    if (newPw.length < 6) { toast.error("New password must be at least 6 characters"); return; }
    if (newPw !== confirmPw) { toast.error("Passwords do not match"); return; }
    const user = firebaseAuth.currentUser;
    if (!user || !user.email) { toast.error("Not signed in"); return; }
    setSaving(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPw);
      toast.success("Password updated successfully!");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err: any) {
      const msg = err?.code === "auth/wrong-password" ? "Current password is incorrect" : err?.message || "Failed to update password";
      toast.error(msg);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Current Password</Label>
        <Input type="password" placeholder="••••••••" value={currentPw} onChange={e => setCurrentPw(e.target.value)} className="h-9 text-sm" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">New Password</Label>
        <Input type="password" placeholder="••••••••" value={newPw} onChange={e => setNewPw(e.target.value)} className="h-9 text-sm" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Confirm New Password</Label>
        <Input type="password" placeholder="••••••••" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className="h-9 text-sm" />
      </div>
      <Button onClick={handleChange} disabled={saving} className="h-9 text-sm">
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Update Password
      </Button>
    </div>
  );
};

const statusConfig: Record<string, { variant: "approved" | "pending" | "rejected"; label: string; dotColor: string }> = {
  approved: { variant: "approved", label: "Live", dotColor: "bg-emerald-500" },
  pending_approval: { variant: "pending", label: "In Review", dotColor: "bg-amber-500" },
  rejected: { variant: "rejected", label: "Rejected", dotColor: "bg-red-500" },
};

type DashTab = "dashboard" | "listings" | "enquiries" | "offers" | "catalogue" | "featured" | "hours" | "settings";

/* ─── Sidebar Nav Item ─── */
const SidebarItem = ({ icon: Icon, label, active, badge, onClick }: {
  icon: any; label: string; active?: boolean; badge?: number; onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
      ${active
        ? "bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))]"
        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      }`}
  >
    <Icon className="w-5 h-5 shrink-0" />
    <span className="truncate">{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-[hsl(var(--primary))] text-primary-foreground text-[10px] font-bold flex items-center justify-center">
        {badge > 99 ? "99+" : badge}
      </span>
    )}
  </button>
);

const BusinessDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DashTab>("dashboard");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [viewingListing, setViewingListing] = useState<Listing | null>(null);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Featured ticket state
  const [featuredTicketReason, setFeaturedTicketReason] = useState("");
  const [featuredTicketLoading, setFeaturedTicketLoading] = useState(false);
  const [featuredTickets, setFeaturedTickets] = useState<any[]>([]);
  const [selectedListingForFeatured, setSelectedListingForFeatured] = useState("");

  // Recent enquiries for analytics
  const [recentEnquiries, setRecentEnquiries] = useState<{ name: string; message: string; time: string; listing: string }[]>([]);

  // Offers state
  const [offerListingId, setOfferListingId] = useState("");
  const [offerTitle, setOfferTitle] = useState("");
  const [offerDescription, setOfferDescription] = useState("");
  const [offerDiscount, setOfferDiscount] = useState("");
  const [offerValidUntil, setOfferValidUntil] = useState("");
  const [offerCode, setOfferCode] = useState("");
  const [offerSaving, setOfferSaving] = useState(false);

  // Catalogue state
  const [catListingId, setCatListingId] = useState("");
  const [catTitle, setCatTitle] = useState("");
  const [catDescription, setCatDescription] = useState("");
  const [catPrice, setCatPrice] = useState("");
  const [catImage, setCatImage] = useState<string>("");
  const [catSaving, setCatSaving] = useState(false);
  const [editingCatItem, setEditingCatItem] = useState<{ listingId: string; itemId: string } | null>(null);
  const [editCatTitle, setEditCatTitle] = useState("");
  const [editCatDescription, setEditCatDescription] = useState("");
  const [editCatPrice, setEditCatPrice] = useState("");
  const [editCatImage, setEditCatImage] = useState<string>("");

  // Load user's listings from Firestore
  useEffect(() => {
    const fetchMyListings = async () => {
      if (!user) { setLoadingListings(false); return; }
      try {
        const q = query(collection(db, "listings"), where("ownerId", "==", user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setListings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing)));
        }
      } catch {}
      setLoadingListings(false);
    };
    fetchMyListings();
  }, [user]);

  // Load featured tickets
  useEffect(() => {
    const fetchTickets = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, "featured_tickets"), where("ownerId", "==", user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setFeaturedTickets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch {}
    };
    fetchTickets();
  }, [user]);

  // Load recent enquiries from Firestore
  useEffect(() => {
    const fetchRecentEnquiries = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, "enquiries"), where("ownerId", "==", user.uid));
        const snap = await getDocs(q);
        const items = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as any))
          .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
          .slice(0, 5)
          .map((e: any) => {
            const seconds = e.createdAt?.seconds || 0;
            const diff = Math.floor((Date.now() / 1000 - seconds) / 60);
            let time = "";
            if (diff < 60) time = `${diff}m ago`;
            else if (diff < 1440) time = `${Math.floor(diff / 60)}h ago`;
            else time = `${Math.floor(diff / 1440)}d ago`;
            return { name: e.name || "Anonymous", message: e.message || "", time, listing: e.listingName || "" };
          });
        setRecentEnquiries(items);
      } catch {}
    };
    fetchRecentEnquiries();
  }, [user]);

  const submitFeaturedTicket = async () => {
    if (!user || !selectedListingForFeatured) return;
    const listing = listings.find(l => l.id === selectedListingForFeatured);
    if (!listing) return;
    setFeaturedTicketLoading(true);
    try {
      const ticketDoc = await addDoc(collection(db, "featured_tickets"), {
        listingId: listing.id, listingName: listing.name, ownerId: user.uid,
        ownerEmail: user.email, reason: featuredTicketReason.trim(),
        status: "pending", createdAt: serverTimestamp(),
      });
      setFeaturedTickets(prev => [...prev, {
        id: ticketDoc.id, listingId: listing.id, listingName: listing.name,
        status: "pending", reason: featuredTicketReason.trim(),
      }]);
      setFeaturedTicketReason(""); setSelectedListingForFeatured("");
      toast.success("Featured request submitted! Admin will review shortly.");
    } catch (err: any) { toast.error(err.message || "Failed to submit request"); }
    setFeaturedTicketLoading(false);
  };

  const addOfferToListing = async () => {
    if (!offerListingId || !offerTitle || !offerDiscount) { toast.error("Please fill in offer title and discount"); return; }
    setOfferSaving(true);
    try {
      const listing = listings.find(l => l.id === offerListingId);
      const existingOffers: ListingOffer[] = listing?.offers || [];
      const newOffer: ListingOffer = {
        id: `offer-${Date.now()}`, title: offerTitle, description: offerDescription,
        discount: offerDiscount, validUntil: offerValidUntil,
        ...(offerCode ? { code: offerCode } : {}),
      };
      const updatedOffers = [...existingOffers, newOffer];
      await updateDoc(doc(db, "listings", offerListingId), { offers: updatedOffers });
      setListings(prev => prev.map(l => l.id === offerListingId ? { ...l, offers: updatedOffers } : l));
      setOfferTitle(""); setOfferDescription(""); setOfferDiscount(""); setOfferValidUntil(""); setOfferCode("");
      toast.success("Offer added successfully!");
    } catch (err: any) { toast.error(err.message || "Failed to add offer"); }
    setOfferSaving(false);
  };

  const removeOffer = async (listingId: string, offerId: string) => {
    try {
      const listing = listings.find(l => l.id === listingId);
      const updatedOffers = (listing?.offers || []).filter(o => o.id !== offerId);
      await updateDoc(doc(db, "listings", listingId), { offers: updatedOffers });
      setListings(prev => prev.map(l => l.id === listingId ? { ...l, offers: updatedOffers } : l));
      toast.success("Offer removed successfully.");
    } catch (err: any) { toast.error(err.message || "Failed to remove offer"); }
  };

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDistrict, setEditDistrict] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCustomSlug, setEditCustomSlug] = useState("");
  const [editLogoUrl, setEditLogoUrl] = useState("");
  const [editHours, setEditHours] = useState<OperatingHours>(DEFAULT_OPERATING_HOURS);
  const [editSpecialHours, setEditSpecialHours] = useState<SpecialHours[]>([]);
  const [editImageUrls, setEditImageUrls] = useState<string[]>([]);
  const [editUploadingImages, setEditUploadingImages] = useState(false);
  const [editCatalogueEnabled, setEditCatalogueEnabled] = useState(true);
  const editImageInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => ({
    total: listings.length,
    approved: listings.filter(l => l.status === "approved").length,
    pending: listings.filter(l => l.status === "pending_approval").length,
    rejected: listings.filter(l => l.status === "rejected").length,
  }), [listings]);

  const listingIds = useMemo(() => listings.map(l => l.id), [listings]);
  const viewCounts = useListingViewCounts(listingIds);
  const totalViews = useMemo(() => Object.values(viewCounts).reduce((a, b) => a + b, 0), [viewCounts]);

  const openEdit = (listing: Listing) => {
    setEditingListing(listing);
    setEditName(listing.name); setEditCategory(listing.category); setEditDistrict(listing.district);
    setEditAddress(listing.address); setEditPhone(listing.phone || ""); setEditWebsite(listing.website || "");
    setEditEmail(listing.email || ""); setEditDescription(listing.description || "");
    setEditCustomSlug(listing.customSlug || toSlug(listing.name)); setEditLogoUrl(listing.logoUrl || "");
    setEditHours(listing.operatingHours || { ...DEFAULT_OPERATING_HOURS });
    setEditSpecialHours(listing.specialHours || []);
    setEditImageUrls(listing.imageUrls || []);
    setEditCatalogueEnabled(listing.catalogueEnabled !== false);
  };

  const slugError = useMemo(() => {
    if (!editingListing) return "";
    const slug = toSlug(editCustomSlug || editName);
    if (!slug) return "URL slug cannot be empty";
    if (slug.length < 3) return "URL slug must be at least 3 characters";
    if (slug.length > 80) return "URL slug must be less than 80 characters";
    const areaSlug = toSlug(editDistrict); const catSlug = toSlug(editCategory);
    const duplicate = listings.find(l => l.id !== editingListing.id && toSlug(l.district) === areaSlug && toSlug(l.category) === catSlug && (l.customSlug || toSlug(l.name)) === slug);
    if (duplicate) return `This URL is already taken by "${duplicate.name}"`;
    return "";
  }, [editCustomSlug, editName, editDistrict, editCategory, editingListing, listings]);

  const saveEdit = async () => {
    if (!editingListing) return;
    if (slugError) { toast.error(slugError); return; }
    const sanitizedSlug = toSlug(editCustomSlug || editName);
    setSaving(true);
    try {
      const logoChanged = editLogoUrl !== (editingListing.logoUrl || "");
      const imagesChanged = JSON.stringify(editImageUrls) !== JSON.stringify(editingListing.imageUrls || []);
      const updates: Record<string, any> = {
        name: editName, category: editCategory, district: editDistrict, address: editAddress,
        phone: editPhone, website: editWebsite, email: editEmail, description: editDescription,
        customSlug: sanitizedSlug, operatingHours: editHours,
        specialHours: editSpecialHours, catalogueEnabled: editCatalogueEnabled, status: "pending_approval",
      };
      if (logoChanged) { updates.pendingLogoUrl = editLogoUrl; } else { updates.logoUrl = editLogoUrl; }
      if (imagesChanged) { updates.pendingImageUrls = editImageUrls; } else { updates.imageUrls = editImageUrls; }
      await updateDoc(doc(db, "listings", editingListing.id), updates);
      setListings(prev => prev.map(l => l.id === editingListing.id ? { ...l, ...updates } : l));
      setEditingListing(null);
      if (logoChanged || imagesChanged) {
        toast.success("Listing updated — logo/image changes pending admin approval.");
      } else {
        toast.success("Listing updated — pending admin re-approval before going public");
      }
    } catch (err: any) { toast.error(err.message || "Failed to update listing"); }
    setSaving(false);
  };

  const deleteListing = async (id: string) => {
    try {
      await deleteDoc(doc(db, "listings", id));
      setListings(prev => prev.filter(l => l.id !== id));
      toast.success("Listing deleted");
    } catch (err: any) { toast.error(err.message || "Failed to delete listing"); }
  };

  const handleEditImageUpload = async (files: FileList) => {
    if (!user) return;
    const remaining = 5 - editImageUrls.length;
    if (remaining <= 0) { toast.error("Maximum 5 images allowed"); return; }
    setEditUploadingImages(true);
    try {
      const { validBase64, errors } = await processImageFiles(Array.from(files), remaining);
      errors.forEach(e => toast.error(e));
      if (validBase64.length > 0) {
        setEditImageUrls(prev => [...prev, ...validBase64]);
        toast.success(`${validBase64.length} image(s) added`);
      }
    } catch (err: any) { toast.error(err.message || "Failed to process images"); }
    setEditUploadingImages(false);
  };

  const [resubmitting, setResubmitting] = useState<string | null>(null);
  const resubmitListing = async (id: string) => {
    setResubmitting(id);
    try {
      await updateDoc(doc(db, "listings", id), { status: "pending_approval", rejectionReason: "" });
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: "pending_approval" } : l));
      toast.success("Listing resubmitted for review!");
    } catch (err: any) { toast.error(err.message || "Failed to resubmit listing"); }
    setResubmitting(null);
  };

  const userName = listings[0]?.ownerName || user?.displayName || user?.email?.split("@")[0] || "User";
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 18) return "Good Afternoon";
    return "Good Evening";
  })();

  const navItems: { key: DashTab; icon: any; label: string; badge?: number }[] = [
    { key: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { key: "listings", icon: Store, label: "My Listings", badge: stats.total },
    { key: "enquiries", icon: Inbox, label: "Enquiries", badge: recentEnquiries.length },
    { key: "offers", icon: Gift, label: "Offers" },
    { key: "catalogue", icon: BookOpen, label: "Catalogue" },
    { key: "featured", icon: Sparkles, label: "Featured" },
    { key: "hours", icon: Clock, label: "Hours" },
  ];

  if (loadingListings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex">
      {/* ═══════════════════════════════════════════
          LEFT SIDEBAR
          ═══════════════════════════════════════════ */}
      <aside className={`${sidebarOpen ? "w-[240px]" : "w-0 overflow-hidden"} shrink-0 border-r border-border bg-card transition-all duration-300 flex flex-col h-screen sticky top-0`}>
        {/* Logo area */}
        <div className="h-16 flex items-center px-5 border-b border-border gap-3 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary-glow))] flex items-center justify-center">
            <Building2 className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground text-base tracking-tight">NearBuy</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-4 mb-2">Overview</p>
          {navItems.map(item => (
            <SidebarItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.key}
              badge={item.badge}
              onClick={() => setActiveTab(item.key)}
            />
          ))}
        </nav>

        {/* Bottom settings */}
        <div className="px-3 py-4 border-t border-border space-y-1 shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-4 mb-2">Settings</p>
          <SidebarItem icon={Settings} label="Settings" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[hsl(var(--destructive))] hover:bg-destructive/5 transition-all"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Back to Site</span>
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════
          MAIN AREA (top bar + content + right sidebar)
          ═══════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card flex items-center px-6 gap-4 shrink-0 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground lg:hidden">
            <LayoutDashboard className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search your listings..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors relative">
              <Mail className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors relative">
              <Bell className="w-4 h-4 text-muted-foreground" />
              {recentEnquiries.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[hsl(var(--primary))] text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                  {recentEnquiries.length}
                </span>
              )}
            </button>
            {/* User avatar */}
            <div className="flex items-center gap-3 ml-2 pl-3 border-l border-border">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(var(--primary)/0.2)] to-[hsl(var(--primary)/0.05)] flex items-center justify-center">
                <span className="text-sm font-bold text-[hsl(var(--primary))]">{userName.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-sm font-semibold text-foreground hidden sm:block">{userName}</span>
            </div>
          </div>
        </header>

        {/* Content body */}
        <div className="flex-1 flex overflow-hidden">
          {/* ═══ Main content area ═══ */}
          <main className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* ─── DASHBOARD TAB ─── */}
            {activeTab === "dashboard" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {/* Welcome Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-glow))] p-8 text-primary-foreground">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
                  <div className="absolute bottom-0 right-20 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
                  <div className="relative z-10">
                    <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-2">Business Dashboard</p>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                      Manage Your Business<br />Listings & Performance
                    </h1>
                    <Button
                      onClick={() => navigate("/add-listing")}
                      className="mt-4 bg-white/20 backdrop-blur-sm border border-white/20 text-white hover:bg-white/30 rounded-full px-6"
                    >
                      <Plus className="w-4 h-4 mr-2" />Add New Listing
                    </Button>
                  </div>
                </div>

                {/* Quick Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <QuickStatCard icon={<Building2 className="w-5 h-5" />} label="Total Listings" value={stats.total} color="primary" />
                  <QuickStatCard icon={<Zap className="w-5 h-5" />} label="Live" value={stats.approved} color="success" />
                  <QuickStatCard icon={<Clock className="w-5 h-5" />} label="In Review" value={stats.pending} color="warning" />
                  <QuickStatCard icon={<Eye className="w-5 h-5" />} label="Total Views" value={totalViews} color="info" />
                </div>

                {/* Quick Actions */}
                <div>
                  <h2 className="text-lg font-semibold text-foreground tracking-tight mb-3">Quick Actions</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { icon: <Plus className="w-5 h-5" />, label: "Add Listing", desc: "Create a new business", action: () => navigate("/add-listing"), color: "primary" },
                      { icon: <Gift className="w-5 h-5" />, label: "Create Offer", desc: "Promote with deals", action: () => setActiveTab("offers"), color: "success" },
                      { icon: <BookOpen className="w-5 h-5" />, label: "Catalogue", desc: "Manage products", action: () => setActiveTab("catalogue"), color: "info" },
                      { icon: <Settings className="w-5 h-5" />, label: "Settings", desc: "Account & security", action: () => setActiveTab("settings"), color: "warning" },
                    ].map(item => (
                      <motion.button
                        key={item.label}
                        whileHover={{ y: -2, boxShadow: "0 6px 24px -8px hsl(var(--foreground) / 0.1)" }}
                        whileTap={{ scale: 0.97 }}
                        onClick={item.action}
                        className="flex flex-col items-start gap-3 rounded-xl border border-border/60 bg-card p-5 text-left hover:border-[hsl(var(--${item.color})/0.3)] transition-all group"
                      >
                        <div className={`w-10 h-10 rounded-lg bg-[hsl(var(--${item.color})/0.08)] flex items-center justify-center text-[hsl(var(--${item.color}))] group-hover:bg-[hsl(var(--${item.color})/0.14)] transition-colors`}>
                          {item.icon}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-foreground block">{item.label}</span>
                          <span className="text-xs text-muted-foreground">{item.desc}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Getting Started Tips */}
                {listings.length <= 1 && (
                  <div className="rounded-xl border border-[hsl(var(--primary)/0.15)] bg-[hsl(var(--primary)/0.03)] p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5 text-[hsl(var(--primary))]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm mb-1">Get the most out of your dashboard</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-3">Complete these steps to maximise your business visibility and attract more customers.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {[
                            { done: listings.length > 0, text: "Create your first listing" },
                            { done: listings.some(l => l.catalogueItems?.length), text: "Add catalogue items" },
                            { done: listings.some(l => l.offers?.length), text: "Set up a special offer" },
                          ].map((step, i) => (
                            <div key={i} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${step.done ? "bg-[hsl(var(--success)/0.08)] text-[hsl(var(--success))]" : "bg-card border border-border/60 text-muted-foreground"}`}>
                              {step.done ? <Check className="w-3.5 h-3.5 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/30 shrink-0" />}
                              {step.text}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Listings preview row */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground tracking-tight">Your Listings</h2>
                    <button onClick={() => setActiveTab("listings")} className="text-sm text-[hsl(var(--primary))] font-medium flex items-center gap-1 hover:underline">
                      See all <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {listings.length === 0 ? (
                      <div className="col-span-full rounded-2xl border border-dashed border-border bg-card p-12 text-center">
                        <Building2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="font-semibold text-foreground">No listings yet</p>
                        <p className="text-sm text-muted-foreground mt-1 mb-4">Create your first listing to get started</p>
                        <Button onClick={() => navigate("/add-listing")} size="sm">
                          <Plus className="w-4 h-4 mr-2" />Add Listing
                        </Button>
                      </div>
                    ) : listings.slice(0, 3).map(listing => {
                      const sc = statusConfig[listing.status];
                      return (
                        <div key={listing.id} className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow group">
                          {/* Card image */}
                          <div className="h-36 bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden">
                            {listing.imageUrls?.[0] ? (
                              <img src={listing.imageUrls[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Building2 className="w-10 h-10 text-muted-foreground/20" />
                              </div>
                            )}
                            <Badge className={`absolute top-3 left-3 ${
                              listing.status === "approved" ? "bg-emerald-500/90 text-white border-transparent" :
                              listing.status === "pending_approval" ? "bg-amber-500/90 text-white border-transparent" :
                              "bg-red-500/90 text-white border-transparent"
                            }`}>
                              {sc.label}
                            </Badge>
                          </div>
                          <div className="p-4">
                            <div className="flex items-center gap-2 mb-1">
                              {listing.logoUrl && (
                                <img src={listing.logoUrl} alt="" className="w-6 h-6 rounded-md object-cover" />
                              )}
                              <h3 className="font-semibold text-foreground text-sm truncate">{listing.name}</h3>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3 shrink-0" />{listing.district}
                            </p>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                              <span className="text-xs text-muted-foreground">{listing.category}</span>
                              <span className="text-xs font-semibold text-[hsl(var(--primary))] flex items-center gap-1">
                                <Eye className="w-3 h-3" />{(viewCounts[listing.id] || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Enquiries */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground tracking-tight">Recent Enquiries</h2>
                    <button onClick={() => setActiveTab("enquiries")} className="text-sm text-[hsl(var(--primary))] font-medium flex items-center gap-1 hover:underline">
                      See all <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    {recentEnquiries.length === 0 ? (
                      <div className="p-12 text-center">
                        <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No enquiries yet</p>
                      </div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Listing</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Message</th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentEnquiries.map((eq, i) => (
                            <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center shrink-0">
                                    <span className="text-xs font-bold text-[hsl(var(--primary))]">{eq.name.charAt(0)}</span>
                                  </div>
                                  <span className="font-medium text-foreground">{eq.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 hidden sm:table-cell">
                                <Badge variant="secondary" className="text-xs">{eq.listing || "—"}</Badge>
                              </td>
                              <td className="py-3 px-4 hidden md:table-cell">
                                <span className="text-muted-foreground line-clamp-1">{eq.message}</span>
                              </td>
                              <td className="py-3 px-4 text-right text-muted-foreground text-xs">{eq.time}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── LISTINGS TAB ─── */}
            {activeTab === "listings" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground tracking-tight">My Listings</h2>
                  <Button onClick={() => navigate("/add-listing")} size="sm" className="rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />Add Listing
                  </Button>
                </div>
                {listings.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center">
                    <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="font-semibold text-lg text-foreground">No listings yet</p>
                    <p className="text-muted-foreground mt-1 mb-6">Create your first business listing to get started</p>
                    <Button onClick={() => navigate("/add-listing")}>
                      <Plus className="w-4 h-4 mr-2" />Add Listing
                    </Button>
                  </div>
                ) : listings.map(listing => {
                  const sc = statusConfig[listing.status];
                  return (
                    <div key={listing.id} className="rounded-2xl border border-border bg-card p-5 hover:shadow-sm transition-shadow group">
                      <div className="flex items-start justify-between gap-5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            {listing.logoUrl ? (
                              <img src={listing.logoUrl} alt="" className="w-10 h-10 rounded-xl object-cover border border-border/50" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--primary)/0.15)] to-[hsl(var(--primary)/0.05)] flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-[hsl(var(--primary))]" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-foreground text-lg tracking-tight">{listing.name}</h3>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`w-2 h-2 rounded-full ${sc.dotColor} animate-pulse`} />
                                <span className="text-xs font-medium text-muted-foreground">{sc.label}</span>
                                <span className="text-muted-foreground/30">·</span>
                                <span className="text-xs text-muted-foreground">{listing.category}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2 ml-[52px]">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground/60" />
                            <span className="truncate">{listing.address}</span>
                          </div>
                          {listing.status === "rejected" && (listing as any).rejectionReason && (
                            <div className="ml-[52px] mb-3 p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                              <p className="text-xs font-medium text-destructive mb-0.5">Rejection Reason</p>
                              <p className="text-sm text-destructive/80">{(listing as any).rejectionReason}</p>
                            </div>
                          )}
                          {listing.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 ml-[52px]">{listing.description}</p>
                          )}
                          <div className="flex items-center gap-5 flex-wrap text-xs text-muted-foreground mt-3 ml-[52px]">
                            {listing.phone && (
                              <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{listing.phone}</span>
                            )}
                            {listing.website && (
                              <a href={listing.website} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-[hsl(var(--primary))] hover:underline font-medium">
                                <Globe className="w-3.5 h-3.5" />Website<ArrowUpRight className="w-3 h-3" />
                              </a>
                            )}
                            {viewCounts[listing.id] > 0 && (
                              <span className="flex items-center gap-1.5 text-[hsl(var(--primary))] font-semibold">
                                <Eye className="w-3.5 h-3.5" />{viewCounts[listing.id].toLocaleString()} views
                              </span>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl">
                            <DropdownMenuItem onClick={() => setViewingListing(listing)} className="rounded-lg">
                              <Eye className="w-4 h-4 mr-2" />View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(listing)} className="rounded-lg">
                              <Edit3 className="w-4 h-4 mr-2" />Edit Listing
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive rounded-lg" onClick={() => deleteListing(listing.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {(listing.pendingLogoUrl || (listing.pendingImageUrls && listing.pendingImageUrls.length > 0)) && (
                        <div className="mt-4 pt-4 border-t border-border/30 flex items-center gap-2 text-xs text-[hsl(var(--warning))]">
                          <Image className="w-3.5 h-3.5" />
                          {listing.pendingLogoUrl && "Logo"}{listing.pendingLogoUrl && listing.pendingImageUrls?.length ? " & " : ""}{listing.pendingImageUrls?.length ? `${listing.pendingImageUrls.length} image(s)` : ""} pending admin approval.
                        </div>
                      )}
                      {listing.status === "pending_approval" && (
                        <div className="mt-4 pt-4 border-t border-border/30 flex items-center gap-2 text-xs text-[hsl(var(--warning))]">
                          <Clock className="w-3.5 h-3.5" />
                          Your listing is under review. This usually takes 1–2 business days.
                        </div>
                      )}
                      {listing.status === "rejected" && (
                        <div className="mt-4 pt-4 border-t border-border/30">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs text-destructive flex items-center gap-2">
                              <X className="w-3.5 h-3.5" />Fix the issues and resubmit for review.
                            </p>
                            <div className="flex gap-2 shrink-0">
                              <Button size="sm" variant="outline" className="rounded-lg" onClick={() => openEdit(listing)}>
                                <Edit3 className="w-3.5 h-3.5 mr-1.5" />Edit
                              </Button>
                              <Button size="sm" className="rounded-lg" onClick={() => resubmitListing(listing.id)} disabled={resubmitting === listing.id}>
                                {resubmitting === listing.id ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
                                Resubmit
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* ─── ENQUIRIES TAB ─── */}
            {activeTab === "enquiries" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-xl font-bold text-foreground tracking-tight mb-6">Enquiries</h2>
                {user && <EnquiryInbox />}
              </motion.div>
            )}

            {/* ─── OFFERS TAB ─── */}
            {activeTab === "offers" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <h2 className="text-xl font-bold text-foreground tracking-tight">Offers & Deals</h2>
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[hsl(var(--success)/0.1)] flex items-center justify-center">
                      <Gift className="w-4 h-4 text-[hsl(var(--success))]" />
                    </div>
                    Create New Offer
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Active offers appear in "Exclusive Deals This Week" on the homepage.
                  </p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Listing</Label>
                      <Select value={offerListingId} onValueChange={setOfferListingId}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="Choose a listing" /></SelectTrigger>
                        <SelectContent>
                          {listings.map(l => (
                            <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Offer Title *</Label>
                        <Input className="rounded-xl" value={offerTitle} onChange={e => setOfferTitle(e.target.value)} placeholder="e.g. Grand Opening Special" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Discount *</Label>
                        <Input className="rounded-xl" value={offerDiscount} onChange={e => setOfferDiscount(e.target.value)} placeholder="e.g. 20% OFF" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</Label>
                      <Textarea className="rounded-xl" value={offerDescription} onChange={e => setOfferDescription(e.target.value)} placeholder="Describe your offer..." rows={2} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valid Until</Label>
                        <Input className="rounded-xl" type="date" value={offerValidUntil} onChange={e => setOfferValidUntil(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Promo Code (optional)</Label>
                        <Input className="rounded-xl" value={offerCode} onChange={e => setOfferCode(e.target.value)} placeholder="e.g. SAVE20" />
                      </div>
                    </div>
                    <Button onClick={addOfferToListing} disabled={offerSaving || !offerListingId} className="rounded-xl">
                      {offerSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <Gift className="w-4 h-4 mr-2" />Add Offer
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-semibold text-foreground mb-4">Active Offers</h3>
                  {listings.filter(l => l.offers && l.offers.length > 0).length === 0 ? (
                    <div className="text-center py-12">
                      <Tag className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No offers yet</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {listings.filter(l => l.offers && l.offers.length > 0).map(listing => (
                        <div key={listing.id}>
                          <p className="text-sm font-semibold text-foreground mb-2">{listing.name}</p>
                          <div className="space-y-2">
                            {listing.offers!.map(offer => (
                              <div key={offer.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-3">
                                  <Badge className="bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] border-transparent font-bold">{offer.discount}</Badge>
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">{offer.title}</p>
                                    {offer.description && <p className="text-xs text-muted-foreground">{offer.description}</p>}
                                  </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg" onClick={() => removeOffer(listing.id, offer.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ─── CATALOGUE TAB ─── */}
            {activeTab === "catalogue" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <h2 className="text-xl font-bold text-foreground tracking-tight">Catalogue Management</h2>

                {/* Add Item Form */}
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                      <Plus className="w-4 h-4 text-[hsl(var(--primary))]" />
                    </div>
                    Add Catalogue Item
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Listing</Label>
                      <Select value={catListingId} onValueChange={setCatListingId}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="Choose a listing" /></SelectTrigger>
                        <SelectContent>
                          {listings.map(l => (
                            <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Item Title *</Label>
                        <Input className="rounded-xl" value={catTitle} onChange={e => setCatTitle(e.target.value)} placeholder="e.g. Premium Haircut" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price</Label>
                        <Input className="rounded-xl" value={catPrice} onChange={e => setCatPrice(e.target.value)} placeholder="e.g. $50 onwards" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</Label>
                      <Textarea className="rounded-xl" value={catDescription} onChange={e => setCatDescription(e.target.value)} placeholder="Brief description of this item..." rows={2} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Item Image</Label>
                      <div className="flex items-center gap-3">
                        {catImage && (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border shrink-0">
                            <img src={catImage} alt="Preview" className="w-full h-full object-cover" />
                            <button onClick={() => setCatImage("")} className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-bl-md p-0.5">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-border cursor-pointer hover:bg-secondary/50 transition-colors text-sm text-muted-foreground">
                          <Upload className="w-4 h-4" />
                          {catImage ? "Change" : "Upload image"}
                          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const base64 = await compressFileToBase64(file);
                            if (base64) {
                              setCatImage(base64);
                            } else {
                              toast.error("Failed to process image");
                            }
                            e.target.value = "";
                          }} />
                        </label>
                      </div>
                    </div>
                    <Button
                      className="rounded-xl"
                      disabled={catSaving || !catListingId || !catTitle.trim()}
                      onClick={async () => {
                        setCatSaving(true);
                        try {
                          const listing = listings.find(l => l.id === catListingId);
                          const existing = listing?.catalogueItems || [];
                          const newItem = { id: `cat_${Date.now()}`, title: catTitle.trim(), description: catDescription.trim(), price: catPrice.trim(), image: catImage || undefined };
                          const updated = [...existing, newItem];
                          await updateDoc(doc(db, "listings", catListingId), { catalogueItems: updated });
                          setListings(prev => prev.map(l => l.id === catListingId ? { ...l, catalogueItems: updated } : l));
                          setCatTitle(""); setCatDescription(""); setCatPrice(""); setCatImage("");
                          toast.success("Catalogue item added!");
                        } catch (err: any) { toast.error(err.message || "Failed to add item"); }
                        setCatSaving(false);
                      }}
                    >
                      {catSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <Plus className="w-4 h-4 mr-2" /> Add Item
                    </Button>
                  </div>
                </div>

                {/* Existing Items per Listing */}
                {listings.filter(l => l.catalogueItems && l.catalogueItems.length > 0).length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No catalogue items yet. Add your first item above.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {listings.filter(l => l.catalogueItems && l.catalogueItems.length > 0).map(listing => (
                      <div key={listing.id} className="rounded-2xl border border-border bg-card p-5">
                        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                          <Store className="w-4 h-4 text-muted-foreground" />
                          {listing.name}
                          <Badge variant="outline" className="ml-auto text-xs">{listing.catalogueItems!.length} items</Badge>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {listing.catalogueItems!.map(item => {
                            const isEditing = editingCatItem?.listingId === listing.id && editingCatItem?.itemId === item.id;
                            return (
                            <div key={item.id} className="rounded-xl border border-border/60 bg-background p-4 space-y-2 group">
                              {isEditing ? (
                                <div className="space-y-3">
                                  <Input className="rounded-lg text-sm" value={editCatTitle} onChange={e => setEditCatTitle(e.target.value)} placeholder="Title" />
                                  <Input className="rounded-lg text-sm" value={editCatPrice} onChange={e => setEditCatPrice(e.target.value)} placeholder="Price" />
                                  <Textarea className="rounded-lg text-sm" value={editCatDescription} onChange={e => setEditCatDescription(e.target.value)} placeholder="Description" rows={2} />
                                  <div className="flex items-center gap-2">
                                    {editCatImage && (
                                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-border shrink-0">
                                        <img src={editCatImage} alt="Preview" className="w-full h-full object-cover" />
                                        <button onClick={() => setEditCatImage("")} className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-bl-md p-0.5">
                                          <X className="w-2.5 h-2.5" />
                                        </button>
                                      </div>
                                    )}
                                    <label className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-dashed border-border cursor-pointer hover:bg-secondary/50 transition-colors text-xs text-muted-foreground">
                                      <Upload className="w-3 h-3" />
                                      {editCatImage ? "Change" : "Add image"}
                                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const base64 = await compressFileToBase64(file);
                                        if (base64) setEditCatImage(base64);
                                        else toast.error("Failed to process image");
                                        e.target.value = "";
                                      }} />
                                    </label>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" className="rounded-lg text-xs" disabled={!editCatTitle.trim()}
                                      onClick={async () => {
                                        try {
                                          const updated = listing.catalogueItems!.map(c => c.id === item.id ? { ...c, title: editCatTitle.trim(), description: editCatDescription.trim(), price: editCatPrice.trim(), image: editCatImage || undefined } : c);
                                          await updateDoc(doc(db, "listings", listing.id), { catalogueItems: updated });
                                          setListings(prev => prev.map(l => l.id === listing.id ? { ...l, catalogueItems: updated } : l));
                                          setEditingCatItem(null);
                                          toast.success("Item updated!");
                                        } catch (err: any) { toast.error(err.message || "Failed to update"); }
                                      }}>
                                      <Check className="w-3 h-3 mr-1" /> Save
                                    </Button>
                                    <Button size="sm" variant="ghost" className="rounded-lg text-xs" onClick={() => setEditingCatItem(null)}>
                                      <X className="w-3 h-3 mr-1" /> Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {item.image && (
                                    <div className="w-full aspect-[4/3] rounded-lg overflow-hidden mb-2 bg-muted">
                                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                    </div>
                                  )}
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                      <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-foreground"
                                        onClick={() => { setEditingCatItem({ listingId: listing.id, itemId: item.id }); setEditCatTitle(item.title); setEditCatDescription(item.description); setEditCatPrice(item.price); setEditCatImage(item.image || ""); }}>
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-destructive"
                                        onClick={async () => {
                                          try {
                                            const updated = listing.catalogueItems!.filter(c => c.id !== item.id);
                                            await updateDoc(doc(db, "listings", listing.id), { catalogueItems: updated });
                                            setListings(prev => prev.map(l => l.id === listing.id ? { ...l, catalogueItems: updated } : l));
                                            toast.success("Item removed");
                                          } catch (err: any) { toast.error(err.message || "Failed to remove item"); }
                                        }}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                  {item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
                                  {item.price && <p className="text-sm font-semibold text-foreground">{item.price}</p>}
                                </>
                              )}
                            </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── FEATURED TAB ─── */}
            {activeTab === "featured" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <h2 className="text-xl font-bold text-foreground tracking-tight">Featured Requests</h2>
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[hsl(var(--warning)/0.1)] flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-[hsl(var(--warning))]" />
                    </div>
                    Request Featured Status
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">Featured businesses get premium visibility on the homepage.</p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Listing</Label>
                      <Select value={selectedListingForFeatured} onValueChange={setSelectedListingForFeatured}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="Choose a listing" /></SelectTrigger>
                        <SelectContent>
                          {listings.filter(l => l.status === "approved" && !l.featured).map(l => (
                            <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Why featured?</Label>
                      <Textarea className="rounded-xl" value={featuredTicketReason} onChange={e => setFeaturedTicketReason(e.target.value)} placeholder="Tell us why..." rows={3} />
                    </div>
                    <Button onClick={submitFeaturedTicket} disabled={featuredTicketLoading || !selectedListingForFeatured} className="rounded-xl">
                      {featuredTicketLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <Sparkles className="w-4 h-4 mr-2" />Submit Request
                    </Button>
                  </div>
                </div>

                {featuredTickets.length > 0 && (
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <h3 className="font-semibold text-foreground mb-4">Your Requests</h3>
                    <div className="space-y-0 divide-y divide-border/40">
                      {featuredTickets.map(ticket => (
                        <div key={ticket.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{ticket.listingName}</p>
                            {ticket.reason && <p className="text-xs text-muted-foreground mt-0.5">{ticket.reason}</p>}
                          </div>
                          <Badge className={
                            ticket.status === "approved"
                              ? "bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] border-transparent"
                              : ticket.status === "rejected"
                              ? "bg-destructive/10 text-destructive border-transparent"
                              : "bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))] border-transparent"
                          }>
                            {ticket.status === "approved" ? "Approved" : ticket.status === "rejected" ? "Rejected" : "Pending"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── HOURS TAB ─── */}
            {activeTab === "hours" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-xl font-bold text-foreground tracking-tight mb-6">Operating Hours</h2>
                <p className="text-sm text-muted-foreground mb-6">Manage open/close times for all your listings.</p>
                {listings.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">No listings yet.</p>
                ) : (
                  <div className="space-y-4">
                    {listings.map(listing => (
                      <HoursEditor
                        key={listing.id}
                        listing={listing}
                        onSave={async (hours) => {
                          try {
                            await updateDoc(doc(db, "listings", listing.id), { operatingHours: hours, status: "pending_approval" });
                            setListings(prev => prev.map(l => l.id === listing.id ? { ...l, operatingHours: hours, status: "pending_approval" } : l));
                            toast.success(`Hours updated for ${listing.name} — pending admin re-approval.`);
                          } catch (err: any) { toast.error(err.message || "Failed to update hours"); }
                        }}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── SETTINGS TAB ─── */}
            {activeTab === "settings" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <h2 className="text-xl font-bold text-foreground tracking-tight">Settings</h2>

                {/* Change Password */}
                <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Change Password</h3>
                    <p className="text-sm text-muted-foreground mt-1">Update your account password</p>
                  </div>
                  <ChangePasswordForm />
                </div>
              </motion.div>
            )}
          </main>

          {/* ═══════════════════════════════════════════
              RIGHT SIDEBAR
              ═══════════════════════════════════════════ */}
          <aside className="hidden xl:block w-[300px] shrink-0 border-l border-border bg-card p-5 overflow-y-auto h-[calc(100vh-64px)] sticky top-16 space-y-6">
            {/* Greeting */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(var(--primary)/0.15)] to-[hsl(var(--primary)/0.05)] flex items-center justify-center mx-auto mb-3 border-2 border-[hsl(var(--primary)/0.2)]">
                <span className="text-2xl font-bold text-[hsl(var(--primary))]">{userName.charAt(0).toUpperCase()}</span>
              </div>
              <h3 className="font-bold text-foreground">{greeting} {userName} 🔥</h3>
              <p className="text-xs text-muted-foreground mt-1">Manage your business to grow further!</p>
            </div>

            {/* Stats summary */}
            <div className="rounded-2xl border border-border p-4 space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Statistics</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Live Listings</span>
                  <span className="text-sm font-bold text-foreground">{stats.approved}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-[hsl(var(--success))]" style={{ width: `${stats.total ? (stats.approved / stats.total * 100) : 0}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">In Review</span>
                  <span className="text-sm font-bold text-[hsl(var(--warning))]">{stats.pending}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Total Views</span>
                  <span className="text-sm font-bold text-[hsl(var(--info))]">{totalViews.toLocaleString()}</span>
                </div>
              </div>
            </div>


            {/* Recent Enquiries compact */}
            <div className="rounded-2xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">Recent Enquiries</h4>
                {recentEnquiries.length > 0 && (
                  <button onClick={() => setActiveTab("enquiries")} className="text-[10px] text-[hsl(var(--primary))] font-semibold hover:underline">See All</button>
                )}
              </div>
              {recentEnquiries.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No enquiries yet</p>
              ) : recentEnquiries.slice(0, 3).map((eq, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-[hsl(var(--primary))]">{eq.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground truncate">{eq.name}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{eq.time}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{eq.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>

      {/* ═══ View Listing Dialog ═══ */}
      <Dialog open={!!viewingListing} onOpenChange={() => setViewingListing(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-xl tracking-tight">Listing Details</DialogTitle>
          </DialogHeader>
          {viewingListing && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-lg tracking-tight">{viewingListing.name}</h3>
                <Badge variant={statusConfig[viewingListing.status].variant}>
                  {statusConfig[viewingListing.status].label}
                </Badge>
              </div>
              <p className="text-muted-foreground">{viewingListing.description}</p>
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-muted/30">
                <div><span className="text-muted-foreground text-xs uppercase tracking-wider">UEN</span><p className="font-medium">{viewingListing.uen}</p></div>
                <div><span className="text-muted-foreground text-xs uppercase tracking-wider">Category</span><p className="font-medium">{viewingListing.category}</p></div>
                <div><span className="text-muted-foreground text-xs uppercase tracking-wider">District</span><p className="font-medium">{viewingListing.district}</p></div>
                <div><span className="text-muted-foreground text-xs uppercase tracking-wider">Phone</span><p className="font-medium">{viewingListing.phone || "—"}</p></div>
              </div>
              <div className="p-4 rounded-xl bg-muted/30">
                <span className="text-muted-foreground text-xs uppercase tracking-wider">Address</span>
                <p className="font-medium mt-0.5">{viewingListing.address}</p>
              </div>
              {viewingListing.website && (
                <a href={viewingListing.website} target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--primary))] hover:underline flex items-center gap-1.5 font-medium">
                  <Globe className="w-4 h-4" />{viewingListing.website}<ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Edit Listing Dialog ═══ */}
      <Dialog open={!!editingListing} onOpenChange={() => setEditingListing(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-xl tracking-tight">Edit Listing</DialogTitle>
          </DialogHeader>
          {editingListing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Business Name</Label>
                <Input className="rounded-xl" value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Custom URL Slug</Label>
                <div className="flex items-center gap-0 rounded-xl border border-input overflow-hidden bg-background">
                  <span className="px-3 py-2 text-xs text-muted-foreground bg-muted border-r border-input whitespace-nowrap">
                    {window.location.origin}/{toSlug(editDistrict || "area")}/{toSlug(editCategory || "category")}/
                  </span>
                  <Input className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none" value={editCustomSlug}
                    onChange={e => setEditCustomSlug(toSlug(e.target.value.replace(/[^a-z0-9-\s]/gi, "")))}
                    placeholder={toSlug(editName || "business-name")} />
                </div>
                <p className={`text-xs ${slugError ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                  {slugError || "Unique business URL. Lowercase letters, numbers, and hyphens only."}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</Label>
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{BUSINESS_CATEGORIES.filter(c => c !== "All Categories").map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">District</Label>
                  <Select value={editDistrict} onValueChange={setEditDistrict}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{SINGAPORE_DISTRICTS.filter(d => d !== "All Districts").map(d => (<SelectItem key={d} value={d}>{d}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Address</Label>
                <Input className="rounded-xl" value={editAddress} onChange={e => setEditAddress(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</Label>
                  <Input className="rounded-xl" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
                  <Input className="rounded-xl" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Website</Label>
                <Input className="rounded-xl" value={editWebsite} onChange={e => setEditWebsite(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</Label>
                <Textarea className="rounded-xl" value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={3} />
              </div>
              {/* Catalogue Toggle */}
              <div className="flex items-center justify-between pt-4 border-t border-border/40">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-medium text-foreground">Show Catalogue</Label>
                    <p className="text-xs text-muted-foreground">Display catalogue section on your business page</p>
                  </div>
                </div>
                <Switch checked={editCatalogueEnabled} onCheckedChange={setEditCatalogueEnabled} />
              </div>
              {/* Operating Hours */}
              <div className="space-y-3 pt-4 border-t border-border/40">
                <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Clock className="w-4 h-4" />Operating Hours
                </Label>
                {Object.keys(DEFAULT_OPERATING_HOURS).map((day) => {
                  const dayHours = editHours[day] || { open: "", close: "", closed: false };
                  return (
                    <div key={day} className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-24 shrink-0">{day}</span>
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                        <input type="checkbox" checked={!!dayHours.closed}
                          onChange={(e) => setEditHours((prev) => ({ ...prev, [day]: { ...prev[day], closed: e.target.checked } }))}
                          className="rounded border-border" />Closed
                      </label>
                      {!dayHours.closed && (
                        <>
                          <Input type="time" className="w-[120px] text-xs rounded-lg" value={dayHours.open}
                            onChange={(e) => setEditHours((prev) => ({ ...prev, [day]: { ...prev[day], open: e.target.value } }))} />
                          <span className="text-xs text-muted-foreground">to</span>
                          <Input type="time" className="w-[120px] text-xs rounded-lg" value={dayHours.close}
                            onChange={(e) => setEditHours((prev) => ({ ...prev, [day]: { ...prev[day], close: e.target.value } }))} />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Special / Holiday Hours */}
              <div className="space-y-3 pt-4 border-t border-border/40">
                <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <CalendarDays className="w-4 h-4" />Holiday / Special Hours
                </Label>
                <p className="text-xs text-muted-foreground">Override hours for specific dates.</p>
                {editSpecialHours.map((sh, idx) => (
                  <div key={idx} className="flex items-center gap-2 flex-wrap">
                    <Input type="date" className="w-[140px] text-xs rounded-lg" value={sh.date}
                      onChange={(e) => { const updated = [...editSpecialHours]; updated[idx] = { ...updated[idx], date: e.target.value }; setEditSpecialHours(updated); }} />
                    <Input className="w-[110px] text-xs rounded-lg" placeholder="Label" value={sh.label}
                      onChange={(e) => { const updated = [...editSpecialHours]; updated[idx] = { ...updated[idx], label: e.target.value }; setEditSpecialHours(updated); }} />
                    <label className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <input type="checkbox" checked={!!sh.closed}
                        onChange={(e) => { const updated = [...editSpecialHours]; updated[idx] = { ...updated[idx], closed: e.target.checked }; setEditSpecialHours(updated); }}
                        className="rounded border-border" />Closed
                    </label>
                    {!sh.closed && (
                      <>
                        <Input type="time" className="w-[100px] text-xs rounded-lg" value={sh.open}
                          onChange={(e) => { const updated = [...editSpecialHours]; updated[idx] = { ...updated[idx], open: e.target.value }; setEditSpecialHours(updated); }} />
                        <span className="text-xs text-muted-foreground">to</span>
                        <Input type="time" className="w-[100px] text-xs rounded-lg" value={sh.close}
                          onChange={(e) => { const updated = [...editSpecialHours]; updated[idx] = { ...updated[idx], close: e.target.value }; setEditSpecialHours(updated); }} />
                      </>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0 rounded-lg"
                      onClick={() => setEditSpecialHours(prev => prev.filter((_, i) => i !== idx))}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="text-xs rounded-lg"
                  onClick={() => setEditSpecialHours(prev => [...prev, { date: "", label: "", open: "09:00", close: "18:00", closed: false }])}>
                  <Plus className="w-3.5 h-3.5 mr-1" />Add Special Date
                </Button>
              </div>
              {/* Business Images */}
              <div className="space-y-3 pt-4 border-t border-border/40">
                <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Image className="w-4 h-4" />Business Images ({editImageUrls.length}/5)
                </Label>
                <p className="text-xs text-muted-foreground">Upload 3–5 high-quality images. Image changes require admin re-approval.</p>
                {editImageUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {editImageUrls.map((url, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-border/50">
                        <img src={url} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                        <button onClick={() => setEditImageUrls(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {editImageUrls.length < 5 && (
                  <>
                    <input ref={editImageInputRef} type="file" accept="image/*" multiple className="hidden"
                      onChange={(e) => e.target.files && handleEditImageUpload(e.target.files)} />
                    <Button variant="outline" size="sm" className="rounded-lg text-xs" disabled={editUploadingImages}
                      onClick={() => editImageInputRef.current?.click()}>
                      {editUploadingImages ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                      Upload Images
                    </Button>
                  </>
                )}
              </div>
              {user && (
                <div className="pt-4 border-t border-border/40">
                  <LogoUpload currentUrl={editLogoUrl || undefined} userId={user.uid}
                    onUploaded={(url) => setEditLogoUrl(url)} onRemoved={() => setEditLogoUrl("")} />
                  <p className="text-xs text-[hsl(var(--warning))] mt-2 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    Logo and image changes require admin approval before going live.
                  </p>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <Button className="flex-1 rounded-xl" onClick={saveEdit} disabled={!!slugError || saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={() => setEditingListing(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ─── Subcomponents ─── */

const QuickStatCard = ({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number; color: string;
}) => (
  <motion.div
    whileHover={{ y: -2, boxShadow: "0 8px 30px -12px hsl(var(--foreground) / 0.12)" }}
    transition={{ duration: 0.2 }}
    className="group relative overflow-hidden rounded-xl bg-card border border-border/60 p-6 cursor-default"
  >
    {/* Subtle top accent bar */}
    <div className={`absolute top-0 left-0 right-0 h-[3px] bg-[hsl(var(--${color}))] opacity-80`} />

    <div className="flex items-start justify-between">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-4xl font-semibold tracking-tight text-foreground tabular-nums">{value.toLocaleString()}</p>
      </div>
      <div className={`w-11 h-11 rounded-lg bg-[hsl(var(--${color})/0.08)] flex items-center justify-center text-[hsl(var(--${color}))] group-hover:bg-[hsl(var(--${color})/0.14)] transition-colors`}>
        {icon}
      </div>
    </div>
  </motion.div>
);

const DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const HoursEditor = ({ listing, onSave }: { listing: Listing; onSave: (hours: OperatingHours) => Promise<void> }) => {
  const [hours, setHours] = useState<OperatingHours>(listing.operatingHours || { ...DEFAULT_OPERATING_HOURS });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const update = (day: string, field: string, value: string | boolean) => {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true); await onSave(hours); setSaving(false); setDirty(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
            <Building2 className="w-4 h-4 text-[hsl(var(--primary))]" />
          </div>
          <h4 className="font-semibold text-sm text-foreground">{listing.name}</h4>
        </div>
        <Button size="sm" disabled={!dirty || saving} onClick={handleSave} className="h-8 text-xs rounded-lg">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
      <div className="space-y-1.5">
        {DAYS_ORDER.map((day) => {
          const dh = hours[day] || { open: "09:00", close: "18:00", closed: false };
          return (
            <div key={day} className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground w-10 sm:w-20 shrink-0 font-medium">{day.slice(0, 3)}</span>
              <label className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                <input type="checkbox" checked={!!dh.closed} onChange={e => update(day, "closed", e.target.checked)} className="rounded border-border" />Closed
              </label>
              {!dh.closed ? (
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <Input type="time" className="w-[100px] h-8 text-xs rounded-lg flex-shrink-0" value={dh.open} onChange={e => update(day, "open", e.target.value)} />
                  <span className="text-[11px] text-muted-foreground">–</span>
                  <Input type="time" className="w-[100px] h-8 text-xs rounded-lg flex-shrink-0" value={dh.close} onChange={e => update(day, "close", e.target.value)} />
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">Closed</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BusinessDashboard;
