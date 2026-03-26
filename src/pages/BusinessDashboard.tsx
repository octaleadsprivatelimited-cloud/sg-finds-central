import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getBusinessUrl, toSlug } from "@/lib/url-helpers";
import { processImageFiles } from "@/lib/image-utils";
import {
  Building2, Plus, Edit3, Eye, Trash2, Clock, Check, X, BarChart3,
  ExternalLink, MapPin, Phone, Globe, ArrowLeft, TrendingUp,
  MessageSquare, MoreHorizontal, FileText, Loader2, Sparkles, Gift, Tag,
  CalendarDays, RefreshCw, ArrowUpRight, Activity, Users, Zap, Upload, Image, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import LogoUpload from "@/components/LogoUpload";
import { Switch } from "@/components/ui/switch";
import EnquiryInbox from "@/components/EnquiryInbox";
import { useListingViewCounts } from "@/hooks/useViewTracking";
import ViewAnalyticsChart from "@/components/ViewAnalyticsChart";
import { motion, AnimatePresence } from "framer-motion";


const statusConfig: Record<string, { variant: "approved" | "pending" | "rejected"; label: string; dotColor: string }> = {
  approved: { variant: "approved", label: "Live", dotColor: "bg-emerald-500" },
  pending_approval: { variant: "pending", label: "In Review", dotColor: "bg-amber-500" },
  rejected: { variant: "rejected", label: "Rejected", dotColor: "bg-red-500" },
};

const BusinessDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("listings");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [viewingListing, setViewingListing] = useState<Listing | null>(null);
  const [saving, setSaving] = useState(false);

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
      await updateDoc(doc(db, "listings", offerListingId), { offers: updatedOffers, status: "pending_approval" });
      setListings(prev => prev.map(l => l.id === offerListingId ? { ...l, offers: updatedOffers, status: "pending_approval" } : l));
      setOfferTitle(""); setOfferDescription(""); setOfferDiscount(""); setOfferValidUntil(""); setOfferCode("");
      toast.success("Offer added — pending admin approval before going live.");
    } catch (err: any) { toast.error(err.message || "Failed to add offer"); }
    setOfferSaving(false);
  };

  const removeOffer = async (listingId: string, offerId: string) => {
    try {
      const listing = listings.find(l => l.id === listingId);
      const updatedOffers = (listing?.offers || []).filter(o => o.id !== offerId);
      await updateDoc(doc(db, "listings", listingId), { offers: updatedOffers, status: "pending_approval" });
      setListings(prev => prev.map(l => l.id === listingId ? { ...l, offers: updatedOffers, status: "pending_approval" } : l));
      toast.success("Offer removed — pending admin re-approval.");
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
      // Determine if logo or images changed — route to pending fields
      const logoChanged = editLogoUrl !== (editingListing.logoUrl || "");
      const imagesChanged = JSON.stringify(editImageUrls) !== JSON.stringify(editingListing.imageUrls || []);

      const updates: Record<string, any> = {
        name: editName, category: editCategory, district: editDistrict, address: editAddress,
        phone: editPhone, website: editWebsite, email: editEmail, description: editDescription,
        customSlug: sanitizedSlug, operatingHours: editHours,
        specialHours: editSpecialHours, catalogueEnabled: editCatalogueEnabled, status: "pending_approval",
      };

      // Logo: if changed, save to pendingLogoUrl; keep existing logoUrl
      if (logoChanged) {
        updates.pendingLogoUrl = editLogoUrl;
      } else {
        updates.logoUrl = editLogoUrl;
      }

      // Images: if changed, save to pendingImageUrls; keep existing imageUrls
      if (imagesChanged) {
        updates.pendingImageUrls = editImageUrls;
      } else {
        updates.imageUrls = editImageUrls;
      }

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
      const { validFiles, errors } = await processImageFiles(Array.from(files), remaining);
      errors.forEach(e => toast.error(e));

      if (validFiles.length > 0) {
        const uploadPromises = validFiles.map(async (file) => {
          const ext = file.name.split(".").pop() || "jpg";
          const storageRef = ref(storage, `listings/${user.uid}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`);
          await uploadBytes(storageRef, file);
          return getDownloadURL(storageRef);
        });
        const urls = await Promise.all(uploadPromises);
        setEditImageUrls(prev => [...prev, ...urls]);
        toast.success(`${urls.length} image(s) uploaded`);
      }
    } catch (err: any) { toast.error(err.message || "Failed to upload images"); }
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary)/0.08)] via-transparent to-[hsl(var(--primary)/0.04)]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,hsl(var(--primary)/0.06)_0%,transparent_70%)]" />
        
        <div className="relative container mx-auto px-6 pt-8 pb-6 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary-glow))] flex items-center justify-center shadow-lg glow-primary">
                <Building2 className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="glass border-border/50 hover:bg-muted/50"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />Directory
              </Button>
              <Button
                className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-glow))] text-primary-foreground shadow-lg glow-primary hover:opacity-90 transition-opacity"
                onClick={() => navigate("/add-listing")}
              >
                <Plus className="w-4 h-4 mr-2" />New Listing
              </Button>
            </div>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-8"
          >
            <StatCard icon={<Building2 className="w-5 h-5" />} label="Total Listings" value={stats.total} gradient="from-[hsl(var(--primary)/0.1)] to-[hsl(var(--primary)/0.05)]" />
            <StatCard icon={<Zap className="w-5 h-5" />} label="Live" value={stats.approved} gradient="from-[hsl(var(--success)/0.1)] to-[hsl(var(--success)/0.05)]" valueColor="text-[hsl(var(--success))]" />
            <StatCard icon={<Clock className="w-5 h-5" />} label="In Review" value={stats.pending} gradient="from-[hsl(var(--warning)/0.1)] to-[hsl(var(--warning)/0.05)]" valueColor="text-[hsl(var(--warning))]" />
            <StatCard icon={<X className="w-5 h-5" />} label="Rejected" value={stats.rejected} gradient="from-[hsl(var(--destructive)/0.1)] to-[hsl(var(--destructive)/0.05)]" valueColor="text-destructive" />
            <StatCard icon={<Eye className="w-5 h-5" />} label="Total Views" value={totalViews} gradient="from-[hsl(var(--info)/0.1)] to-[hsl(var(--info)/0.05)]" valueColor="text-[hsl(var(--info))]" />
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 pb-12 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="glass border-border/40 p-1 h-auto gap-1 rounded-xl">
            {[
              { value: "listings", icon: Building2, label: "Listings" },
              { value: "analytics", icon: BarChart3, label: "Analytics" },
              { value: "offers", icon: Gift, label: "Offers" },
              { value: "featured", icon: Sparkles, label: "Featured" },
              { value: "enquiries", icon: MessageSquare, label: "Enquiries" },
              { value: "hours", icon: Clock, label: "Hours" },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* LISTINGS TAB */}
          <TabsContent value="listings" className="mt-8">
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
              {listings.length === 0 ? (
                <motion.div variants={itemVariants} className="glass-card p-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <p className="font-semibold text-lg text-foreground">No listings yet</p>
                  <p className="text-muted-foreground mt-1 mb-6">Create your first business listing to get started</p>
                  <Button onClick={() => navigate("/add-listing")} className="glow-primary">
                    <Plus className="w-4 h-4 mr-2" />Add Listing
                  </Button>
                </motion.div>
              ) : listings.map((listing, i) => {
                const sc = statusConfig[listing.status];
                return (
                  <motion.div
                    key={listing.id}
                    variants={itemVariants}
                    className="glass-card p-6 hover-lift group"
                  >
                    <div className="flex items-start justify-between gap-5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          {listing.logoUrl ? (
                            <img src={listing.logoUrl} alt="" className="w-10 h-10 rounded-xl object-cover border border-border/50" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--primary)/0.15)] to-[hsl(var(--primary)/0.05)] flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-primary" />
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
                              className="flex items-center gap-1.5 text-primary hover:underline font-medium">
                              <Globe className="w-3.5 h-3.5" />Website<ArrowUpRight className="w-3 h-3" />
                            </a>
                          )}
                          {viewCounts[listing.id] > 0 && (
                            <span className="flex items-center gap-1.5 text-primary font-semibold">
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
                        <div className="w-6 h-6 rounded-lg bg-[hsl(var(--warning)/0.1)] flex items-center justify-center">
                          <Image className="w-3.5 h-3.5" />
                        </div>
                        {listing.pendingLogoUrl && "Logo"}{listing.pendingLogoUrl && listing.pendingImageUrls?.length ? " & " : ""}{listing.pendingImageUrls?.length ? `${listing.pendingImageUrls.length} image(s)` : ""} pending admin approval.
                      </div>
                    )}
                    {listing.status === "pending_approval" && (
                      <div className="mt-4 pt-4 border-t border-border/30 flex items-center gap-2 text-xs text-[hsl(var(--warning))]">
                        <div className="w-6 h-6 rounded-lg bg-[hsl(var(--warning)/0.1)] flex items-center justify-center">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        Your listing is under review. This usually takes 1–2 business days.
                      </div>
                    )}
                    {listing.status === "rejected" && (
                      <div className="mt-4 pt-4 border-t border-border/30">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs text-destructive flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                              <X className="w-3.5 h-3.5" />
                            </div>
                            Fix the issues and resubmit for review.
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
                  </motion.div>
                );
              })}
            </motion.div>
          </TabsContent>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics" className="mt-8 space-y-6">
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <motion.div variants={itemVariants}>
                <AnalyticCard title="Total Views" value={totalViews.toLocaleString()} icon={<Eye className="w-5 h-5" />} accent="primary" />
              </motion.div>
              <motion.div variants={itemVariants}>
                <AnalyticCard title="Contact Clicks" value="—" icon={<Phone className="w-5 h-5" />} accent="success" />
              </motion.div>
              <motion.div variants={itemVariants}>
                <AnalyticCard title="Website Visits" value="—" icon={<Globe className="w-5 h-5" />} accent="info" />
              </motion.div>
            </motion.div>

            {user && <ViewAnalyticsChart listings={listings} userId={user.uid} />}

            <div className="glass-card p-6">
              <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2.5 text-lg tracking-tight">
                <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                Performance by Listing
              </h3>
              <div className="space-y-0 divide-y divide-border/40">
                {listings.filter(l => l.status === "approved").map(listing => (
                  <div key={listing.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(var(--primary)/0.1)] to-transparent flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{listing.name}</p>
                        <p className="text-xs text-muted-foreground">{listing.district}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 text-sm">
                      <div className="text-right">
                        <p className="font-bold text-foreground tabular-nums">{(viewCounts[listing.id] || 0).toLocaleString()}</p>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Views</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground tabular-nums">—</p>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Clicks</p>
                      </div>
                    </div>
                  </div>
                ))}
                {listings.filter(l => l.status === "approved").length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-12">No approved listings to show analytics for</p>
                )}
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2.5 text-lg tracking-tight">
                <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-primary" />
                </div>
                Recent Enquiries
              </h3>
              <div className="space-y-0 divide-y divide-border/40">
                {recentEnquiries.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                      <MessageSquare className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm text-muted-foreground">No enquiries yet</p>
                  </div>
                ) : recentEnquiries.map((enquiry, i) => (
                  <div key={i} className="flex items-start gap-3.5 py-4 first:pt-0 last:pb-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(var(--primary)/0.15)] to-[hsl(var(--primary)/0.05)] flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">{enquiry.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">{enquiry.name}</p>
                        <span className="text-[11px] text-muted-foreground font-medium">{enquiry.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{enquiry.message}</p>
                      {enquiry.listing && <p className="text-xs text-primary mt-1 font-medium">Re: {enquiry.listing}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* OFFERS TAB */}
          <TabsContent value="offers" className="mt-8 space-y-6">
            <motion.div variants={itemVariants} initial="hidden" animate="visible" className="glass-card p-6">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2.5 text-lg tracking-tight">
                <div className="w-8 h-8 rounded-lg bg-[hsl(var(--success)/0.1)] flex items-center justify-center">
                  <Gift className="w-4 h-4 text-[hsl(var(--success))]" />
                </div>
                Create New Offer
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Active offers appear in <span className="font-semibold text-foreground">"Exclusive Deals This Week"</span> on the homepage.
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Listing</Label>
                  <Select value={offerListingId} onValueChange={setOfferListingId}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Choose a listing" /></SelectTrigger>
                    <SelectContent>
                      {listings.filter(l => l.status === "approved").map(l => (
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
                    <Input className="rounded-xl" value={offerDiscount} onChange={e => setOfferDiscount(e.target.value)} placeholder="e.g. 20% OFF or $10 Credit" />
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
                <Button onClick={addOfferToListing} disabled={offerSaving || !offerListingId} className="rounded-xl glow-primary">
                  {offerSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Gift className="w-4 h-4 mr-2" />Add Offer
                </Button>
              </div>
            </motion.div>

            <div className="glass-card p-6">
              <h3 className="font-semibold text-foreground mb-4 text-lg tracking-tight">Active Offers</h3>
              {listings.filter(l => l.offers && l.offers.length > 0).length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    <Tag className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground">No offers yet. Create your first one above!</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {listings.filter(l => l.offers && l.offers.length > 0).map(listing => (
                    <div key={listing.id}>
                      <p className="text-sm font-semibold text-foreground mb-2">{listing.name}</p>
                      <div className="space-y-2">
                        {listing.offers!.map(offer => (
                          <div key={offer.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card transition-colors">
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
          </TabsContent>

          {/* FEATURED REQUEST TAB */}
          <TabsContent value="featured" className="mt-8 space-y-6">
            <motion.div variants={itemVariants} initial="hidden" animate="visible" className="glass-card p-6">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2.5 text-lg tracking-tight">
                <div className="w-8 h-8 rounded-lg bg-[hsl(var(--warning)/0.1)] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[hsl(var(--warning))]" />
                </div>
                Request Featured Status
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Featured businesses get premium visibility on the homepage with priority placement.
              </p>
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
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Why should your business be featured?</Label>
                  <Textarea className="rounded-xl" value={featuredTicketReason} onChange={e => setFeaturedTicketReason(e.target.value)} placeholder="Tell us why your business deserves to be featured..." rows={3} />
                </div>
                <Button onClick={submitFeaturedTicket} disabled={featuredTicketLoading || !selectedListingForFeatured} className="rounded-xl glow-primary">
                  {featuredTicketLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Sparkles className="w-4 h-4 mr-2" />Submit Request
                </Button>
              </div>
            </motion.div>

            {featuredTickets.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="font-semibold text-foreground mb-4 text-lg tracking-tight">Your Requests</h3>
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
          </TabsContent>

          {/* ENQUIRIES TAB */}
          <TabsContent value="enquiries" className="mt-8">
            <EnquiryInbox />
          </TabsContent>

          {/* HOURS TAB */}
          <TabsContent value="hours" className="mt-8">
            <div className="glass-card p-6">
              <h3 className="font-semibold text-foreground flex items-center gap-2.5 mb-1 text-lg tracking-tight">
                <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                Operating Hours
              </h3>
              <p className="text-sm text-muted-foreground mb-6 ml-[42px]">Manage open/close times for all your listings.</p>

              {listings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No listings yet.</p>
              ) : (
                <div className="space-y-4">
                  {listings.map((listing) => (
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
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* View Listing Dialog */}
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
                <a href={viewingListing.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1.5 font-medium">
                  <Globe className="w-4 h-4" />{viewingListing.website}<ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Listing Dialog */}
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
                <Button className="flex-1 rounded-xl glow-primary" onClick={saveEdit} disabled={!!slugError || saving}>
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

const StatCard = ({ icon, label, value, gradient, valueColor = "text-foreground" }: {
  icon: React.ReactNode; label: string; value: number; gradient: string; valueColor?: string;
}) => (
  <motion.div
    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
    className={`glass-card p-5 bg-gradient-to-br ${gradient}`}
  >
    <div className="flex items-center justify-between mb-3">
      <div className="w-10 h-10 rounded-xl bg-background/60 backdrop-blur-sm flex items-center justify-center text-muted-foreground">
        {icon}
      </div>
    </div>
    <p className={`text-3xl font-bold tracking-tight ${valueColor} tabular-nums`}>{value.toLocaleString()}</p>
    <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">{label}</p>
  </motion.div>
);

const AnalyticCard = ({ title, value, icon, accent }: {
  title: string; value: string; icon: React.ReactNode; accent: string;
}) => (
  <div className="glass-card p-6 hover-lift">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-10 h-10 rounded-xl bg-[hsl(var(--${accent})/0.1)] flex items-center justify-center text-[hsl(var(--${accent}))]`}>
        {icon}
      </div>
      <Activity className="w-4 h-4 text-muted-foreground/30" />
    </div>
    <p className="text-3xl font-bold text-foreground tracking-tight tabular-nums">{value}</p>
    <p className="text-sm text-muted-foreground mt-1 font-medium">{title}</p>
  </div>
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
    <div className="glass-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <h4 className="font-semibold text-sm text-foreground">{listing.name}</h4>
        </div>
        <Button size="sm" disabled={!dirty || saving} onClick={handleSave} className="h-8 text-xs rounded-lg glow-primary">
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
