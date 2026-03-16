import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Listing } from "@/components/ListingCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Shield, Check, X, ExternalLink, FileText, Building2, Clock,
  Loader2, AlertTriangle, LayoutDashboard, Inbox, Settings,
  LogOut, Search, Bell, ChevronRight, Eye, Store,
} from "lucide-react";
import { toast } from "sonner";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

/* ── Sidebar Nav Item ─────────────────────────────────────── */
const SideItem = ({
  icon: Icon, label, active, onClick,
}: { icon: any; label: string; active?: boolean; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all
      ${active
        ? "bg-[hsl(262,60%,55%)] text-white shadow-md"
        : "text-[hsl(262,15%,45%)] hover:bg-[hsl(262,40%,95%)]"
      }`}
  >
    <Icon className="w-[18px] h-[18px]" />
    {label}
  </button>
);

/* ── Stat Card ────────────────────────────────────────────── */
const StatCard = ({
  icon: Icon, label, value, color,
}: { icon: any; label: string; value: number | string; color: string }) => (
  <div className="bg-white dark:bg-[hsl(262,20%,12%)] rounded-2xl p-5 shadow-sm border border-[hsl(262,20%,92%)] dark:border-[hsl(262,20%,20%)]">
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-xs font-medium text-[hsl(262,15%,50%)]">{label}</span>
    </div>
    <p className="text-3xl font-bold text-foreground">{value}</p>
  </div>
);

/* ── Listing Review Card ─────────────────────────────────── */
const ListingReviewCard = ({
  listing, actionLoading, onApprove, onReject,
}: {
  listing: Listing;
  actionLoading: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) => (
  <div className="bg-white dark:bg-[hsl(262,20%,12%)] rounded-2xl p-5 shadow-sm border border-[hsl(262,20%,92%)] dark:border-[hsl(262,20%,20%)] hover:shadow-md transition-shadow">
    {/* Top row */}
    <div className="flex items-start gap-4 mb-4">
      {/* Logo */}
      <div className="w-14 h-14 rounded-xl bg-[hsl(262,40%,95%)] dark:bg-[hsl(262,20%,18%)] flex items-center justify-center overflow-hidden flex-shrink-0 border border-[hsl(262,20%,90%)] dark:border-[hsl(262,20%,25%)]">
        {listing.logoUrl ? (
          <img src={listing.logoUrl} alt={listing.name} className="w-full h-full object-cover rounded-xl" />
        ) : (
          <Store className="w-6 h-6 text-[hsl(262,40%,60%)]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-semibold text-foreground truncate">{listing.name}</h3>
          <Badge className="bg-[hsl(38,92%,50%)] text-white border-0 text-[10px] px-2 py-0.5 rounded-full font-medium">
            Pending
          </Badge>
        </div>
        <p className="text-xs text-[hsl(262,15%,50%)] truncate">{listing.address}</p>
      </div>
      <Badge className="bg-[hsl(262,40%,95%)] text-[hsl(262,50%,45%)] dark:bg-[hsl(262,20%,18%)] dark:text-[hsl(262,50%,70%)] border-0 text-xs font-medium rounded-full px-3">
        {listing.category}
      </Badge>
    </div>

    {/* Info grid */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4 bg-[hsl(262,30%,97%)] dark:bg-[hsl(262,20%,10%)] rounded-xl p-3">
      <div>
        <span className="text-[hsl(262,15%,55%)]">UEN</span>
        <p className="font-semibold text-foreground mt-0.5">{listing.uen}</p>
      </div>
      <div>
        <span className="text-[hsl(262,15%,55%)]">District</span>
        <p className="font-semibold text-foreground mt-0.5">{listing.district}</p>
      </div>
      <div>
        <span className="text-[hsl(262,15%,55%)]">Phone</span>
        <p className="font-semibold text-foreground mt-0.5">{listing.phone || "—"}</p>
      </div>
      <div>
        <span className="text-[hsl(262,15%,55%)]">Postal</span>
        <p className="font-semibold text-foreground mt-0.5">{listing.postalCode}</p>
      </div>
    </div>

    {/* Description */}
    {listing.description && (
      <p className="text-xs text-[hsl(262,15%,50%)] mb-4 line-clamp-2">{listing.description}</p>
    )}

    {/* Documents */}
    {listing.documentsUrl && listing.documentsUrl.length > 0 && (
      <div className="flex gap-2 mb-4 flex-wrap">
        {listing.documentsUrl.map((url, i) => (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[hsl(262,60%,55%)] hover:underline bg-[hsl(262,40%,96%)] dark:bg-[hsl(262,20%,18%)] px-2.5 py-1.5 rounded-lg"
          >
            <FileText className="w-3 h-3" />
            Doc {i + 1}
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        ))}
      </div>
    )}

    {/* Actions */}
    <div className="flex gap-2 pt-3 border-t border-[hsl(262,20%,93%)] dark:border-[hsl(262,20%,20%)]">
      <Button
        size="sm"
        onClick={() => onApprove(listing.id)}
        disabled={actionLoading === listing.id}
        className="bg-[hsl(152,69%,40%)] hover:bg-[hsl(152,69%,35%)] text-white rounded-xl text-xs px-4"
      >
        {actionLoading === listing.id ? (
          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
        ) : (
          <Check className="w-3.5 h-3.5 mr-1.5" />
        )}
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onReject(listing.id)}
        disabled={actionLoading === listing.id}
        className="border-[hsl(0,70%,60%)] text-[hsl(0,70%,50%)] hover:bg-[hsl(0,70%,97%)] rounded-xl text-xs px-4"
      >
        <X className="w-3.5 h-3.5 mr-1.5" />
        Reject
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="ml-auto text-[hsl(262,40%,55%)] hover:bg-[hsl(262,40%,95%)] rounded-xl text-xs"
      >
        <Eye className="w-3.5 h-3.5 mr-1.5" />
        Preview
      </Button>
    </div>
  </div>
);

/* ── Main Admin Page ─────────────────────────────────────── */
const Admin = () => {
  const { user, isAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/");
      return;
    }
    fetchPending();
  }, [authLoading, user, isAdmin]);

  const fetchPending = async () => {
    try {
      const q = query(collection(db, "listings"), where("status", "==", "pending_approval"));
      const snap = await getDocs(q);
      setListings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing)));
    } catch {
      setListings([
        {
          id: "pending-1", name: "New Café SG", uen: "202399999F",
          category: "Food & Beverage", district: "Tiong Bahru",
          address: "78 Yong Siak Street, Singapore 163078", postalCode: "163078",
          phone: "+65 6111 2222", status: "pending_approval", ownerId: "demo",
          documentsUrl: ["https://example.com/doc.pdf"],
        },
      ]);
    }
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await updateDoc(doc(db, "listings", id), { status: "approved", rejectionReason: "" });
      setListings((prev) => prev.filter((l) => l.id !== id));
      toast.success("Listing approved");
    } catch {
      toast.error("Failed to update listing");
    }
    setActionLoading(null);
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setActionLoading(rejectingId);
    try {
      await updateDoc(doc(db, "listings", rejectingId), {
        status: "rejected",
        rejectionReason: rejectionReason.trim(),
      });
      setListings((prev) => prev.filter((l) => l.id !== rejectingId));
      toast.success("Listing rejected");
    } catch {
      toast.error("Failed to update listing");
    }
    setActionLoading(null);
    setRejectingId(null);
    setRejectionReason("");
  };

  const filteredListings = listings.filter((l) =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(262,30%,97%)]">
        <Loader2 className="w-6 h-6 animate-spin text-[hsl(262,60%,55%)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(262,30%,97%)] dark:bg-[hsl(262,20%,7%)] flex">
      {/* ── Left Sidebar ──────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-[240px] bg-white dark:bg-[hsl(262,20%,10%)] border-r border-[hsl(262,20%,92%)] dark:border-[hsl(262,20%,18%)] p-5 sticky top-0 h-screen">
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[hsl(262,60%,55%)] flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-foreground">Admin</span>
        </div>

        {/* Nav sections */}
        <div className="space-y-1 mb-6">
          <p className="text-[10px] uppercase tracking-widest text-[hsl(262,15%,60%)] font-semibold px-4 mb-2">Overview</p>
          <SideItem icon={LayoutDashboard} label="Dashboard" active />
          <SideItem icon={Inbox} label="Enquiries" onClick={() => navigate("/dashboard")} />
        </div>

        <div className="space-y-1 mb-6">
          <p className="text-[10px] uppercase tracking-widest text-[hsl(262,15%,60%)] font-semibold px-4 mb-2">Management</p>
          <SideItem icon={Building2} label="All Listings" onClick={() => navigate("/")} />
          {isSuperAdmin && (
            <SideItem icon={Settings} label="Super Admin" onClick={() => navigate("/super-admin")} />
          )}
        </div>

        <div className="mt-auto space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-[hsl(262,15%,60%)] font-semibold px-4 mb-2">Settings</p>
          <SideItem icon={Settings} label="Settings" />
          <SideItem
            icon={LogOut}
            label="Logout"
            onClick={async () => { await signOut(auth); navigate("/"); }}
          />
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-[hsl(262,20%,10%)]/80 backdrop-blur-xl border-b border-[hsl(262,20%,92%)] dark:border-[hsl(262,20%,18%)] px-6 py-3 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(262,15%,55%)]" />
            <input
              type="text"
              placeholder="Search pending listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(262,30%,96%)] dark:bg-[hsl(262,20%,14%)] text-sm text-foreground placeholder:text-[hsl(262,15%,55%)] border-0 focus:outline-none focus:ring-2 focus:ring-[hsl(262,60%,55%)] transition"
            />
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button className="w-10 h-10 rounded-xl bg-[hsl(262,30%,96%)] dark:bg-[hsl(262,20%,14%)] flex items-center justify-center hover:bg-[hsl(262,30%,92%)] transition">
              <Bell className="w-4 h-4 text-[hsl(262,15%,45%)]" />
            </button>
            <div className="flex items-center gap-2.5 pl-3 border-l border-[hsl(262,20%,90%)] dark:border-[hsl(262,20%,20%)]">
              <div className="w-9 h-9 rounded-full bg-[hsl(262,60%,55%)] flex items-center justify-center text-white text-sm font-bold">
                {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || "A"}
              </div>
              <span className="text-sm font-medium text-foreground hidden sm:block">
                {user?.displayName || user?.email?.split("@")[0] || "Admin"}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Hero Banner */}
          <div className="bg-gradient-to-br from-[hsl(262,60%,55%)] to-[hsl(262,70%,45%)] rounded-2xl p-8 mb-6 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-12 w-24 h-24 rounded-full border-2 border-white/30" />
              <div className="absolute bottom-4 right-32 w-16 h-16 rounded-full border-2 border-white/20" />
              <svg className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 text-white/20" viewBox="0 0 100 100">
                <path d="M50 10 L50 90 M10 50 L90 50 M25 25 L75 75 M75 25 L25 75" stroke="currentColor" strokeWidth="1" fill="none" />
              </svg>
            </div>
            <p className="text-white/70 text-xs uppercase tracking-widest font-semibold mb-2">Admin Dashboard</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Review & Manage Listings
            </h1>
            <p className="text-white/70 text-sm max-w-md">
              Approve or reject business listings to keep the directory trusted and up-to-date.
            </p>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard icon={Clock} label="Pending Review" value={listings.length} color="bg-[hsl(262,40%,93%)] text-[hsl(262,60%,50%)]" />
            <StatCard icon={Check} label="Approved Today" value="—" color="bg-[hsl(152,50%,92%)] text-[hsl(152,69%,35%)]" />
            <StatCard icon={AlertTriangle} label="Rejected Today" value="—" color="bg-[hsl(0,60%,94%)] text-[hsl(0,70%,50%)]" />
          </div>

          {/* Queue heading */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Pending Queue</h2>
            <span className="text-xs text-[hsl(262,15%,55%)]">{filteredListings.length} listing{filteredListings.length !== 1 ? "s" : ""}</span>
          </div>

          {/* Listing Queue */}
          {loading ? (
            <div className="text-center py-20">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-[hsl(262,60%,55%)]" />
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-[hsl(262,20%,12%)] rounded-2xl border border-[hsl(262,20%,92%)] dark:border-[hsl(262,20%,20%)]">
              <div className="w-14 h-14 rounded-full bg-[hsl(152,50%,92%)] flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-[hsl(152,69%,40%)]" />
              </div>
              <p className="font-semibold text-foreground mb-1">All caught up!</p>
              <p className="text-sm text-[hsl(262,15%,50%)]">No pending listings to review</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredListings.map((listing) => (
                <ListingReviewCard
                  key={listing.id}
                  listing={listing}
                  actionLoading={actionLoading}
                  onApprove={handleApprove}
                  onReject={(id) => {
                    setRejectingId(id);
                    setRejectionReason("");
                  }}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ── Right Sidebar ────────────────────────────────── */}
      <aside className="hidden xl:flex flex-col w-[280px] bg-white dark:bg-[hsl(262,20%,10%)] border-l border-[hsl(262,20%,92%)] dark:border-[hsl(262,20%,18%)] p-5 sticky top-0 h-screen overflow-y-auto">
        {/* Admin Profile */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-3">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[hsl(262,60%,55%)] to-[hsl(262,70%,45%)] flex items-center justify-center text-white text-2xl font-bold mx-auto ring-4 ring-[hsl(262,40%,92%)]">
              {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[hsl(152,69%,40%)] flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          </div>
          <h3 className="font-bold text-foreground">
            {user?.displayName || "Admin"} 🔒
          </h3>
          <p className="text-xs text-[hsl(262,15%,50%)] mt-1">
            {isSuperAdmin ? "Super Administrator" : "Administrator"}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="bg-[hsl(262,30%,97%)] dark:bg-[hsl(262,20%,8%)] rounded-2xl p-4 mb-6">
          <h4 className="text-sm font-bold text-foreground mb-3">Quick Stats</h4>
          <div className="space-y-3">
            {[
              { label: "Pending", val: listings.length, color: "bg-[hsl(38,92%,50%)]" },
              { label: "Approved", val: "—", color: "bg-[hsl(152,69%,40%)]" },
              { label: "Rejected", val: "—", color: "bg-[hsl(0,70%,55%)]" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                  <span className="text-xs text-[hsl(262,15%,50%)]">{s.label}</span>
                </div>
                <span className="text-sm font-bold text-foreground">{s.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-foreground">Recent Activity</h4>
            <button className="text-[10px] text-[hsl(262,60%,55%)] font-medium">See all</button>
          </div>
          <div className="space-y-3">
            {listings.slice(0, 3).map((l) => (
              <div key={l.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[hsl(262,40%,95%)] dark:bg-[hsl(262,20%,18%)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {l.logoUrl ? (
                    <img src={l.logoUrl} alt={l.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <Store className="w-4 h-4 text-[hsl(262,40%,60%)]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{l.name}</p>
                  <p className="text-[10px] text-[hsl(262,15%,55%)]">{l.category}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[hsl(262,15%,60%)] flex-shrink-0" />
              </div>
            ))}
            {listings.length === 0 && (
              <p className="text-xs text-[hsl(262,15%,55%)] text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </aside>

      {/* ── Rejection Dialog ─────────────────────────────── */}
      <Dialog open={!!rejectingId} onOpenChange={(open) => { if (!open) { setRejectingId(null); setRejectionReason(""); } }}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-[hsl(262,20%,12%)] border-[hsl(262,20%,90%)] dark:border-[hsl(262,20%,20%)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <X className="w-5 h-5 text-[hsl(0,70%,55%)]" />
              Reject Listing
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-[hsl(262,15%,50%)]">
              Please provide a reason. This will be visible to the business owner.
            </p>
            <div className="space-y-2">
              <Label className="text-foreground">Rejection Reason *</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Missing ACRA business profile document, invalid UEN number..."
                rows={3}
                className="bg-[hsl(262,30%,97%)] dark:bg-[hsl(262,20%,8%)] border-[hsl(262,20%,90%)] dark:border-[hsl(262,20%,20%)] rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setRejectingId(null); setRejectionReason(""); }} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={!rejectionReason.trim() || actionLoading === rejectingId}
              className="bg-[hsl(0,70%,55%)] hover:bg-[hsl(0,70%,48%)] text-white rounded-xl"
            >
              {actionLoading === rejectingId ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <X className="w-4 h-4 mr-1.5" />
              )}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
