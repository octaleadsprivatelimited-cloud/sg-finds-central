import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getBusinessUrl, toSlug } from "@/lib/url-helpers";
import {
  Building2, Plus, Edit3, Eye, Trash2, Clock, Check, X, BarChart3,
  ExternalLink, MapPin, Phone, Globe, ArrowLeft, TrendingUp, Star,
  MessageSquare, MoreHorizontal, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Listing } from "@/components/ListingCard";
import { SINGAPORE_DISTRICTS, BUSINESS_CATEGORIES } from "@/lib/districts";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Demo data for the business owner
const MY_LISTINGS: Listing[] = [
  {
    id: "my-1", name: "Singapore Delights Pte Ltd", uen: "201912345A",
    category: "Food & Beverage", district: "Orchard",
    address: "391 Orchard Road, #B2-01, Singapore 238872", postalCode: "238872",
    phone: "+65 6234 5678", website: "https://sgdelights.com", email: "info@sgdelights.com",
    description: "Award-winning local cuisine serving traditional Peranakan dishes with a modern twist.",
    status: "approved", ownerId: "me", lat: 1.3048, lng: 103.8318,
  },
  {
    id: "my-2", name: "TechHub Solutions", uen: "202301234B",
    category: "Technology & IT", district: "CBD / Raffles Place",
    address: "1 Raffles Place, #30-01, Singapore 048616", postalCode: "048616",
    phone: "+65 6789 0123", website: "https://techhub.sg", email: "hello@techhub.sg",
    description: "Full-service IT consultancy specializing in cloud infrastructure and cybersecurity.",
    status: "approved", ownerId: "me", lat: 1.2840, lng: 103.8510,
  },
  {
    id: "my-3", name: "Quick Bites Express", uen: "202499999C",
    category: "Food & Beverage", district: "Tampines",
    address: "1 Tampines Central 5, Singapore 529508", postalCode: "529508",
    phone: "+65 6345 9999",
    description: "Fast casual dining with local favourites.",
    status: "pending_approval", ownerId: "me",
    documentsUrl: ["https://example.com/doc.pdf"],
  },
];

const statusConfig: Record<string, { variant: "approved" | "pending" | "rejected"; label: string }> = {
  approved: { variant: "approved", label: "Approved" },
  pending_approval: { variant: "pending", label: "Pending Review" },
  rejected: { variant: "rejected", label: "Rejected" },
};

const BusinessDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("listings");
  const [listings, setListings] = useState<Listing[]>(MY_LISTINGS);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [viewingListing, setViewingListing] = useState<Listing | null>(null);

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

  const stats = useMemo(() => ({
    total: listings.length,
    approved: listings.filter(l => l.status === "approved").length,
    pending: listings.filter(l => l.status === "pending_approval").length,
    rejected: listings.filter(l => l.status === "rejected").length,
  }), [listings]);

  const openEdit = (listing: Listing) => {
    setEditingListing(listing);
    setEditName(listing.name);
    setEditCategory(listing.category);
    setEditDistrict(listing.district);
    setEditAddress(listing.address);
    setEditPhone(listing.phone || "");
    setEditWebsite(listing.website || "");
    setEditEmail(listing.email || "");
    setEditDescription(listing.description || "");
  };

  const saveEdit = () => {
    if (!editingListing) return;
    setListings(prev => prev.map(l =>
      l.id === editingListing.id ? {
        ...l,
        name: editName,
        category: editCategory,
        district: editDistrict,
        address: editAddress,
        phone: editPhone,
        website: editWebsite,
        email: editEmail,
        description: editDescription,
      } : l
    ));
    setEditingListing(null);
    toast.success("Listing updated");
  };

  const deleteListing = (id: string) => {
    setListings(prev => prev.filter(l => l.id !== id));
    toast.success("Listing deleted");
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Business Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage your business listings</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              ← Directory
            </Button>
            <Button size="sm" onClick={() => navigate("/add-listing")}>
              <Plus className="w-4 h-4 mr-1.5" />New Listing
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-background border border-border">
            <TabsTrigger value="listings" className="gap-1.5">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">My Listings</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* LISTINGS TAB */}
          <TabsContent value="listings" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <MiniStat label="Total Listings" value={stats.total} icon={<Building2 className="w-4 h-4" />} />
              <MiniStat label="Approved" value={stats.approved} icon={<Check className="w-4 h-4" />} color="text-emerald-600" />
              <MiniStat label="Pending" value={stats.pending} icon={<Clock className="w-4 h-4" />} color="text-amber-600" />
              <MiniStat label="Rejected" value={stats.rejected} icon={<X className="w-4 h-4" />} color="text-destructive" />
            </div>

            {/* Listing Cards */}
            <div className="space-y-4">
              {listings.length === 0 ? (
                <div className="text-center py-16 bg-background rounded-2xl border border-border">
                  <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="font-medium text-foreground">No listings yet</p>
                  <p className="text-sm text-muted-foreground mb-4">Add your first business listing</p>
                  <Button onClick={() => navigate("/add-listing")}>
                    <Plus className="w-4 h-4 mr-1.5" />Add Listing
                  </Button>
                </div>
              ) : listings.map((listing) => {
                const sc = statusConfig[listing.status];
                return (
                  <div key={listing.id} className="bg-background rounded-xl border border-border p-5 hover:shadow-md transition-shadow animate-fade-in">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-foreground">{listing.name}</h3>
                          <Badge variant={sc.variant}>{sc.label}</Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{listing.address}</span>
                        </div>
                        {listing.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{listing.description}</p>
                        )}
                        <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{listing.category}</span>
                          {listing.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{listing.phone}</span>}
                          {listing.website && (
                            <a href={listing.website} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary hover:underline">
                              <Globe className="w-3 h-3" />Website<ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewingListing(listing)}>
                            <Eye className="w-4 h-4 mr-2" />View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(listing)}>
                            <Edit3 className="w-4 h-4 mr-2" />Edit Listing
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => deleteListing(listing.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {listing.status === "pending_approval" && (
                      <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2 text-xs text-amber-600">
                        <Clock className="w-3.5 h-3.5" />
                        Your listing is under review. This usually takes 1–2 business days.
                      </div>
                    )}
                    {listing.status === "rejected" && (
                      <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2 text-xs text-destructive">
                        <X className="w-3.5 h-3.5" />
                        Your listing was rejected. Please update and resubmit.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <AnalyticCard title="Total Views" value="1,247" change="+12%" icon={<Eye className="w-5 h-5" />} />
              <AnalyticCard title="Contact Clicks" value="89" change="+8%" icon={<Phone className="w-5 h-5" />} />
              <AnalyticCard title="Website Visits" value="234" change="+15%" icon={<Globe className="w-5 h-5" />} />
            </div>

            <div className="bg-background rounded-2xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Performance by Listing
              </h3>
              <div className="space-y-4">
                {listings.filter(l => l.status === "approved").map(listing => (
                  <div key={listing.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{listing.name}</p>
                      <p className="text-xs text-muted-foreground">{listing.district}</p>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold text-foreground">{Math.floor(Math.random() * 500 + 100)}</p>
                        <p className="text-xs text-muted-foreground">Views</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-foreground">{Math.floor(Math.random() * 50 + 10)}</p>
                        <p className="text-xs text-muted-foreground">Clicks</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-foreground flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-500" />
                          {(Math.random() * 1.5 + 3.5).toFixed(1)}
                        </p>
                        <p className="text-xs text-muted-foreground">Rating</p>
                      </div>
                    </div>
                  </div>
                ))}
                {listings.filter(l => l.status === "approved").length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No approved listings to show analytics for</p>
                )}
              </div>
            </div>

            <div className="bg-background rounded-2xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Recent Enquiries
              </h3>
              <div className="space-y-3">
                {[
                  { name: "Alice Tan", message: "Do you cater for events?", time: "2 hours ago", listing: "Singapore Delights" },
                  { name: "Bob Lee", message: "What are your office hours?", time: "1 day ago", listing: "TechHub Solutions" },
                  { name: "Carol Ng", message: "Any promotions this month?", time: "3 days ago", listing: "Singapore Delights" },
                ].map((enquiry, i) => (
                  <div key={i} className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-primary">{enquiry.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{enquiry.name}</p>
                        <span className="text-xs text-muted-foreground">{enquiry.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{enquiry.message}</p>
                      <p className="text-xs text-primary mt-0.5">Re: {enquiry.listing}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* View Listing Dialog */}
      <Dialog open={!!viewingListing} onOpenChange={() => setViewingListing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Listing Details</DialogTitle>
          </DialogHeader>
          {viewingListing && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{viewingListing.name}</h3>
                <Badge variant={statusConfig[viewingListing.status].variant}>
                  {statusConfig[viewingListing.status].label}
                </Badge>
              </div>
              <p className="text-muted-foreground">{viewingListing.description}</p>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">UEN:</span> {viewingListing.uen}</div>
                <div><span className="text-muted-foreground">Category:</span> {viewingListing.category}</div>
                <div><span className="text-muted-foreground">District:</span> {viewingListing.district}</div>
                <div><span className="text-muted-foreground">Phone:</span> {viewingListing.phone || "—"}</div>
              </div>
              <div><span className="text-muted-foreground">Address:</span> {viewingListing.address}</div>
              {viewingListing.website && (
                <a href={viewingListing.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />{viewingListing.website}<ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Listing Dialog */}
      <Dialog open={!!editingListing} onOpenChange={() => setEditingListing(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Listing</DialogTitle>
          </DialogHeader>
          {editingListing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BUSINESS_CATEGORIES.filter(c => c !== "All Categories").map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>District</Label>
                  <Select value={editDistrict} onValueChange={setEditDistrict}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SINGAPORE_DISTRICTS.filter(d => d !== "All Districts").map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={editAddress} onChange={e => setEditAddress(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={editEmail} onChange={e => setEditEmail(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input value={editWebsite} onChange={e => setEditWebsite(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={3} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={saveEdit}>Save Changes</Button>
                <Button variant="outline" onClick={() => setEditingListing(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const MiniStat = ({ label, value, icon, color = "text-primary" }: { label: string; value: number; icon: React.ReactNode; color?: string }) => (
  <div className="bg-background rounded-xl border border-border p-4">
    <div className={`${color} mb-2`}>{icon}</div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

const AnalyticCard = ({ title, value, change, icon }: { title: string; value: string; change: string; icon: React.ReactNode }) => (
  <div className="bg-background rounded-2xl border border-border p-5">
    <div className="flex items-center justify-between mb-3">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{change}</span>
    </div>
    <p className="text-3xl font-bold text-foreground">{value}</p>
    <p className="text-sm text-muted-foreground mt-1">{title}</p>
  </div>
);

export default BusinessDashboard;
