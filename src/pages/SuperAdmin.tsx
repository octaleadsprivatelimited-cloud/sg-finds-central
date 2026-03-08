import { useState } from "react";
import {
  Users, Building2, BarChart3, Settings, Search, MoreHorizontal,
  Check, X, Eye, Trash2, Ban, UserCheck, Shield, Crown, ArrowUpDown,
  TrendingUp, Activity, Clock, FileText, ExternalLink, ChevronDown,
  Mail, Phone, Calendar, AlertTriangle, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "@/components/ui/dialog";
import { Listing } from "@/components/ListingCard";
import { DEMO_USERS, DEMO_ALL_LISTINGS, PlatformUser } from "@/lib/demo-data";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const statusBadge = (status: string) => {
  switch (status) {
    case "active": return <Badge variant="approved">Active</Badge>;
    case "suspended": return <Badge variant="warning">Suspended</Badge>;
    case "banned": return <Badge variant="rejected">Banned</Badge>;
    case "approved": return <Badge variant="approved">Approved</Badge>;
    case "pending_approval": return <Badge variant="pending">Pending</Badge>;
    case "rejected": return <Badge variant="rejected">Rejected</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

const roleBadge = (role: string) => {
  switch (role) {
    case "superadmin": return <Badge className="bg-indigo-600 text-primary-foreground border-transparent">Super Admin</Badge>;
    case "admin": return <Badge variant="default">Admin</Badge>;
    case "business_owner": return <Badge variant="secondary">Business Owner</Badge>;
    default: return <Badge variant="outline">User</Badge>;
  }
};

const SuperAdmin = () => {
  const { user, isSuperAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState<PlatformUser[]>(DEMO_USERS);
  const [listings, setListings] = useState<Listing[]>(DEMO_ALL_LISTINGS);
  const [userSearch, setUserSearch] = useState("");
  const [listingSearch, setListingSearch] = useState("");
  const [listingFilter, setListingFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === "active").length;
  const totalListings = listings.length;
  const approvedListings = listings.filter(l => l.status === "approved").length;
  const pendingListings = listings.filter(l => l.status === "pending_approval").length;
  const rejectedListings = listings.filter(l => l.status === "rejected").length;

  const filteredUsers = users.filter(u =>
    u.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredListings = listings.filter(l => {
    const matchSearch = l.name.toLowerCase().includes(listingSearch.toLowerCase()) ||
      l.uen.toLowerCase().includes(listingSearch.toLowerCase());
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

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    toast.success("User deleted");
  };

  const handleListingAction = (listingId: string, status: "approved" | "rejected") => {
    setListings(prev => prev.map(l =>
      l.id === listingId ? { ...l, status } : l
    ));
    toast.success(`Listing ${status}`);
  };

  const handleDeleteListing = (listingId: string) => {
    setListings(prev => prev.filter(l => l.id !== listingId));
    toast.success("Listing deleted");
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg">
              <Crown className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Super Admin Console</h1>
              <p className="text-sm text-muted-foreground">Full platform management</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/")}>
            ← Back to Directory
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-background border border-border">
            <TabsTrigger value="overview" className="gap-1.5">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="listings" className="gap-1.5">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Listings</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<Users className="w-5 h-5" />} label="Total Users" value={totalUsers} sub={`${activeUsers} active`} color="text-primary" />
              <StatCard icon={<Building2 className="w-5 h-5" />} label="Total Listings" value={totalListings} sub={`${approvedListings} approved`} color="text-primary" />
              <StatCard icon={<Clock className="w-5 h-5" />} label="Pending Review" value={pendingListings} sub="Awaiting action" color="text-amber-600" />
              <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="Rejected" value={rejectedListings} sub="This period" color="text-destructive" />
            </div>

            {/* Activity & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-background rounded-2xl border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {[
                    { action: "New listing submitted", detail: "New Café SG", time: "2 hours ago", icon: <Building2 className="w-4 h-4" /> },
                    { action: "User registered", detail: "lisa.ng@gmail.com", time: "5 hours ago", icon: <UserCheck className="w-4 h-4" /> },
                    { action: "Listing approved", detail: "HomeFixSG Services", time: "1 day ago", icon: <Check className="w-4 h-4" /> },
                    { action: "User suspended", detail: "mei.chen@yahoo.com", time: "2 days ago", icon: <Ban className="w-4 h-4" /> },
                    { action: "New listing submitted", detail: "FastTrack Logistics", time: "3 days ago", icon: <Building2 className="w-4 h-4" /> },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{item.action}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-background rounded-2xl border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Platform Summary
                </h3>
                <div className="space-y-4">
                  <SummaryRow label="Business Owners" value={users.filter(u => u.role === "business_owner").length} total={totalUsers} />
                  <SummaryRow label="Admins" value={users.filter(u => u.role === "admin" || u.role === "superadmin").length} total={totalUsers} />
                  <SummaryRow label="Approved Listings" value={approvedListings} total={totalListings} />
                  <SummaryRow label="Pending Listings" value={pendingListings} total={totalListings} />
                  <SummaryRow label="Active Users" value={activeUsers} total={totalUsers} />
                </div>
                <div className="mt-6 pt-4 border-t border-border">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-2xl font-bold text-foreground">{DEMO_ALL_LISTINGS.filter(l => l.category === "Food & Beverage").length}</p>
                      <p className="text-xs text-muted-foreground">F&B</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{DEMO_ALL_LISTINGS.filter(l => l.category === "Technology & IT").length}</p>
                      <p className="text-xs text-muted-foreground">Tech</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{DEMO_ALL_LISTINGS.filter(l => l.category !== "Food & Beverage" && l.category !== "Technology & IT").length}</p>
                      <p className="text-xs text-muted-foreground">Others</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* USERS TAB */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  className="pl-10 bg-background"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
              <p className="text-sm text-muted-foreground">{filteredUsers.length} users</p>
            </div>

            <div className="bg-background rounded-2xl border border-border overflow-hidden">
              {/* Table Header */}
              <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_60px] gap-4 px-6 py-3 border-b border-border bg-secondary/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <span>User</span>
                <span>Role</span>
                <span>Status</span>
                <span>Listings</span>
                <span>Last Active</span>
                <span></span>
              </div>

              {/* User Rows */}
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_60px] gap-2 lg:gap-4 px-6 py-4 border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedUser(u)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-primary">{u.displayName.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{u.displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center">{roleBadge(u.role)}</div>
                  <div className="flex items-center">{statusBadge(u.status)}</div>
                  <div className="flex items-center text-sm text-muted-foreground">{u.listingsCount}</div>
                  <div className="flex items-center text-sm text-muted-foreground">{u.lastActive}</div>
                  <div className="flex items-center justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedUser(u); }}>
                          <Eye className="w-4 h-4 mr-2" />View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {u.status !== "active" && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUserAction(u.id, "activate"); }}>
                            <UserCheck className="w-4 h-4 mr-2" />Activate
                          </DropdownMenuItem>
                        )}
                        {u.status === "active" && u.role !== "superadmin" && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUserAction(u.id, "suspend"); }}>
                            <Ban className="w-4 h-4 mr-2" />Suspend
                          </DropdownMenuItem>
                        )}
                        {u.role !== "admin" && u.role !== "superadmin" && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUserAction(u.id, "promote_admin"); }}>
                            <Shield className="w-4 h-4 mr-2" />Promote to Admin
                          </DropdownMenuItem>
                        )}
                        {u.role === "admin" && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUserAction(u.id, "demote"); }}>
                            <ChevronDown className="w-4 h-4 mr-2" />Demote to User
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {u.role !== "superadmin" && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => { e.stopPropagation(); handleDeleteUser(u.id); }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />Delete User
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* LISTINGS TAB */}
          <TabsContent value="listings" className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search listings by name or UEN..."
                  className="pl-10 bg-background"
                  value={listingSearch}
                  onChange={(e) => setListingSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                {["all", "pending_approval", "approved", "rejected"].map(f => (
                  <Button
                    key={f}
                    variant={listingFilter === f ? "default" : "outline"}
                    size="sm"
                    onClick={() => setListingFilter(f)}
                  >
                    {f === "all" ? "All" : f === "pending_approval" ? "Pending" : f.charAt(0).toUpperCase() + f.slice(1)}
                    <span className="ml-1 text-xs opacity-70">
                      ({f === "all" ? listings.length : listings.filter(l => l.status === f).length})
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredListings.map((listing) => (
                <div key={listing.id} className="bg-background rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-foreground">{listing.name}</h3>
                        {statusBadge(listing.status)}
                        <Badge variant="secondary" className="text-xs">{listing.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{listing.address}</p>
                      <p className="text-xs text-muted-foreground mt-1">UEN: {listing.uen} · District: {listing.district}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {listing.status === "pending_approval" && (
                        <>
                          <Button size="sm" onClick={() => handleListingAction(listing.id, "approved")} className="bg-success hover:bg-success/90 text-success-foreground">
                            <Check className="w-4 h-4 mr-1" />Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleListingAction(listing.id, "rejected")}>
                            <X className="w-4 h-4 mr-1" />Reject
                          </Button>
                        </>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedListing(listing)}>
                            <Eye className="w-4 h-4 mr-2" />View Details
                          </DropdownMenuItem>
                          {listing.status !== "approved" && (
                            <DropdownMenuItem onClick={() => handleListingAction(listing.id, "approved")}>
                              <Check className="w-4 h-4 mr-2" />Approve
                            </DropdownMenuItem>
                          )}
                          {listing.status !== "rejected" && (
                            <DropdownMenuItem onClick={() => handleListingAction(listing.id, "rejected")}>
                              <X className="w-4 h-4 mr-2" />Reject
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteListing(listing.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />Delete Listing
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Documents */}
                  {listing.documentsUrl && listing.documentsUrl.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {listing.documentsUrl.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline bg-primary/5 rounded-md px-2 py-1">
                          <FileText className="w-3 h-3" />Doc {i + 1}<ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings" className="space-y-6">
            <div className="bg-background rounded-2xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">Platform Settings</h3>
              <div className="space-y-4">
                <SettingRow title="Auto-approve listings" description="Skip manual review for verified business owners" enabled={false} />
                <SettingRow title="Email notifications" description="Send email alerts for new submissions" enabled={true} />
                <SettingRow title="SMS OTP verification" description="Require phone verification for registration" enabled={true} />
                <SettingRow title="Document upload required" description="Require ACRA profile for all submissions" enabled={true} />
              </div>
            </div>

            <div className="bg-background rounded-2xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">Danger Zone</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl border border-destructive/20 bg-destructive/5">
                  <div>
                    <p className="text-sm font-medium text-foreground">Export all data</p>
                    <p className="text-xs text-muted-foreground">Download all users and listings as CSV</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1.5" />Export
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">{selectedUser.displayName.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">{selectedUser.displayName}</h3>
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
                  <Button variant="outline" size="sm" onClick={() => { handleUserAction(selectedUser.id, "suspend"); setSelectedUser(null); }}>
                    <Ban className="w-4 h-4 mr-1.5" />Suspend
                  </Button>
                )}
                {selectedUser.status !== "active" && (
                  <Button size="sm" onClick={() => { handleUserAction(selectedUser.id, "activate"); setSelectedUser(null); }}>
                    <UserCheck className="w-4 h-4 mr-1.5" />Activate
                  </Button>
                )}
                {selectedUser.role !== "superadmin" && (
                  <Button variant="destructive" size="sm" onClick={() => { handleDeleteUser(selectedUser.id); setSelectedUser(null); }}>
                    <Trash2 className="w-4 h-4 mr-1.5" />Delete
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Listing Detail Dialog */}
      <Dialog open={!!selectedListing} onOpenChange={() => setSelectedListing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Listing Details</DialogTitle>
          </DialogHeader>
          {selectedListing && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-lg text-foreground">{selectedListing.name}</h3>
                {statusBadge(selectedListing.status)}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoRow icon={<Building2 className="w-4 h-4" />} label="UEN" value={selectedListing.uen} />
                <InfoRow icon={<Building2 className="w-4 h-4" />} label="Category" value={selectedListing.category} />
                <InfoRow icon={<Building2 className="w-4 h-4" />} label="District" value={selectedListing.district} />
                <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={selectedListing.phone || "—"} />
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Address:</span>
                <p className="text-foreground">{selectedListing.address}</p>
              </div>
              {selectedListing.description && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Description:</span>
                  <p className="text-foreground">{selectedListing.description}</p>
                </div>
              )}
              {selectedListing.documentsUrl && selectedListing.documentsUrl.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Documents:</span>
                  <div className="flex gap-2 mt-1">
                    {selectedListing.documentsUrl.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                        <FileText className="w-3.5 h-3.5" />Document {i + 1}<ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-4 border-t border-border">
                {selectedListing.status !== "approved" && (
                  <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground"
                    onClick={() => { handleListingAction(selectedListing.id, "approved"); setSelectedListing(null); }}>
                    <Check className="w-4 h-4 mr-1.5" />Approve
                  </Button>
                )}
                {selectedListing.status !== "rejected" && (
                  <Button size="sm" variant="destructive"
                    onClick={() => { handleListingAction(selectedListing.id, "rejected"); setSelectedListing(null); }}>
                    <X className="w-4 h-4 mr-1.5" />Reject
                  </Button>
                )}
                <Button variant="outline" size="sm"
                  onClick={() => { handleDeleteListing(selectedListing.id); setSelectedListing(null); }}>
                  <Trash2 className="w-4 h-4 mr-1.5" />Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Sub-components
const StatCard = ({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: number; sub: string; color: string }) => (
  <div className="bg-background rounded-2xl border border-border p-5">
    <div className={`${color} mb-3`}>{icon}</div>
    <p className="text-3xl font-bold text-foreground">{value}</p>
    <p className="text-sm font-medium text-foreground mt-1">{label}</p>
    <p className="text-xs text-muted-foreground">{sub}</p>
  </div>
);

const SummaryRow = ({ label, value, total }: { label: string; value: number; total: number }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${total > 0 ? (value / total) * 100 : 0}%` }} />
    </div>
  </div>
);

const SettingRow = ({ title, description, enabled }: { title: string; description: string; enabled: boolean }) => (
  <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
    <div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
    <div className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors cursor-pointer ${enabled ? "bg-primary" : "bg-secondary"}`}>
      <div className={`w-4 h-4 rounded-full bg-background shadow transition-transform ${enabled ? "translate-x-4" : ""}`} />
    </div>
  </div>
);

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-2">
    <div className="text-muted-foreground mt-0.5 shrink-0">{icon}</div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground break-all">{value}</p>
    </div>
  </div>
);

export default SuperAdmin;
