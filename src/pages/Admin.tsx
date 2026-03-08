import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Listing } from "@/components/ListingCard";
import {
  Shield, Check, X, ExternalLink, FileText, ArrowLeft,
  Building2, Clock, Loader2, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

const Admin = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
      // Demo pending listings
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

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    setActionLoading(id);
    try {
      await updateDoc(doc(db, "listings", id), { status });
      setListings((prev) => prev.filter((l) => l.id !== id));
      toast.success(`Listing ${status}`);
    } catch {
      toast.error("Failed to update listing");
    }
    setActionLoading(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" size="sm" className="mb-6" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Directory
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Review and manage pending listings</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Pending</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{listings.length}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 text-success mb-1">
              <Check className="w-4 h-4" />
              <span className="text-sm">Approved Today</span>
            </div>
            <p className="text-2xl font-bold text-foreground">—</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 text-destructive mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Rejected Today</span>
            </div>
            <p className="text-2xl font-bold text-foreground">—</p>
          </div>
        </div>

        {/* Listing Queue */}
        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 glass-card rounded-2xl">
            <Check className="w-10 h-10 text-success mx-auto mb-3" />
            <p className="font-medium text-foreground">All caught up!</p>
            <p className="text-sm text-muted-foreground">No pending listings to review</p>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => (
              <div key={listing.id} className="glass-card rounded-xl p-5 animate-fade-in">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{listing.name}</h3>
                      <Badge variant="outline" className="text-xs">Pending</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{listing.address}</p>
                  </div>
                  <Badge variant="secondary">{listing.category}</Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
                  <div>
                    <span className="text-muted-foreground">UEN</span>
                    <p className="font-medium">{listing.uen}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">District</span>
                    <p className="font-medium">{listing.district}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone</span>
                    <p className="font-medium">{listing.phone || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Postal Code</span>
                    <p className="font-medium">{listing.postalCode}</p>
                  </div>
                </div>

                {/* Documents */}
                {listing.documentsUrl && listing.documentsUrl.length > 0 && (
                  <div className="mb-4">
                    <span className="text-sm text-muted-foreground">Uploaded Documents</span>
                    <div className="flex gap-2 mt-1">
                      {listing.documentsUrl.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Document {i + 1}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-border">
                  <Button
                    size="sm"
                    onClick={() => handleAction(listing.id, "approved")}
                    disabled={actionLoading === listing.id}
                    className="bg-success hover:bg-success/90 text-success-foreground"
                  >
                    {actionLoading === listing.id ? (
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-1.5" />
                    )}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleAction(listing.id, "rejected")}
                    disabled={actionLoading === listing.id}
                  >
                    <X className="w-4 h-4 mr-1.5" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
