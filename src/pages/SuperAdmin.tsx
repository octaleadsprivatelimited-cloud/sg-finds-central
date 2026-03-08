import { useState } from "react";
import {
  Users, Building2, BarChart3, Settings, Search, MoreHorizontal,
  Check, X, Eye, Trash2, Ban, UserCheck, Shield, Crown, 
  TrendingUp, Activity, FileText, ExternalLink, ChevronDown,
  Mail, Phone, Calendar, LayoutDashboard, PieChart, LogOut,
  ChevronRight, DollarSign, ArrowUpRight, ArrowDownRight,
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
} from "@/components/ui/dialog";
import { Listing } from "@/components/ListingCard";
import { DEMO_USERS, DEMO_ALL_LISTINGS, PlatformUser } from "@/lib/demo-data";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from "recharts";

const statusBadge = (status: string) => {
  switch (status) {
    case "active": return <Badge className="bg-emerald-100 text-emerald-700 border-transparent">Active</Badge>;
    case "suspended": return <Badge className="bg-amber-100 text-amber-700 border-transparent">Suspended</Badge>;
    case "banned": return <Badge className="bg-red-100 text-red-700 border-transparent">Banned</Badge>;
    case "approved": return <Badge className="bg-emerald-100 text-emerald-700 border-transparent">Approved</Badge>;
    case "pending_approval": return <Badge className="bg-amber-100 text-amber-700 border-transparent">Pending</Badge>;
    case "rejected": return <Badge className="bg-red-100 text-red-700 border-transparent">Rejected</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

const roleBadge = (role: string) => {
  switch (role) {
    case "superadmin": return <Badge className="bg-indigo-100 text-indigo-700 border-transparent">Super Admin</Badge>;
    case "admin": return <Badge className="bg-primary/10 text-primary border-transparent">Admin</Badge>;
    case "business_owner": return <Badge className="bg-cyan-100 text-cyan-700 border-transparent">Business</Badge>;
    default: return <Badge variant="outline">User</Badge>;
  }
};

// Chart data
const listingTrendData = [
  { month: "Jan", value: 12 },
  { month: "Feb", value: 19 },
  { month: "Mar", value: 15 },
  { month: "Apr", value: 27 },
  { month: "May", value: 23 },
  { month: "Jun", value: 34 },
];

const categoryData = [
  { name: "F&B", value: 35, color: "#6366f1" },
  { name: "Tech", value: 25, color: "#22c55e" },
  { name: "Retail", value: 20, color: "#f59e0b" },
  { name: "Services", value: 20, color: "#ec4899" },
];

type NavItem = "dashboard" | "users" | "listings" | "statistics" | "settings";

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

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === "active").length;
  const totalListings = listings.length;
  const approvedListings = listings.filter(l => l.status === "approved").length;
  const pendingListings = listings.filter(l => l.status === "pending_approval").length;

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

  const navItems: { id: NavItem; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: "users", label: "Users", icon: <Users className="w-5 h-5" /> },
    { id: "listings", label: "Listings", icon: <Building2 className="w-5 h-5" /> },
    { id: "statistics", label: "Statistics", icon: <PieChart className="w-5 h-5" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? "w-20" : "w-64"} bg-card border-r border-border flex flex-col transition-all duration-300 hidden md:flex`}>
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <Crown className="w-5 h-5 text-white" />
          </div>
          {!sidebarCollapsed && <span className="font-semibold text-foreground">Veritas</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          <p className={`text-xs text-muted-foreground uppercase tracking-wider px-3 mb-2 ${sidebarCollapsed ? "hidden" : ""}`}>Main Menu</p>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activeNav === item.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {item.icon}
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Teams section */}
        {!sidebarCollapsed && (
          <div className="px-3 py-4 border-t border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider px-3 mb-2">Teams</p>
            <div className="space-y-1">
              <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Marketing</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <span>Development</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-border">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && <span>Back to Site</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Analytics</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-muted rounded-lg p-1">
              <button className="px-3 py-1.5 text-sm font-medium bg-card rounded-md shadow-sm text-foreground">Full Statistics</button>
              <button className="px-3 py-1.5 text-sm font-medium text-muted-foreground">Sender Summary</button>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-indigo-600">A</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        {activeNav === "dashboard" && (
          <div className="p-6 space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Listing Trend Card */}
              <div className="bg-card rounded-2xl p-5 border border-border col-span-1 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Listings Growth</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">07 Day progress</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 text-sm">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>2%</span>
                  </div>
                </div>
                <div className="h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={listingTrendData}>
                      <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Total Listings */}
              <div className="bg-card rounded-2xl p-5 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Listings</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{totalListings}</p>
                <p className="text-xs text-muted-foreground mt-1">{approvedListings} approved</p>
              </div>

              {/* Category Breakdown */}
              <div className="bg-card rounded-2xl p-5 border border-border">
                <p className="text-sm text-muted-foreground mb-3">Categories</p>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={18}
                          outerRadius={28}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1 text-xs">
                    {categoryData.map((cat, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-muted-foreground">{cat.name}</span>
                        <span className="text-muted-foreground/70">{cat.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Promo Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-card rounded-2xl p-5 border border-border">
                <h3 className="font-semibold text-foreground mb-4">Recent Submissions</h3>
                <div className="space-y-3">
                  {listings.slice(0, 4).map((listing, i) => (
                    <div key={listing.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-muted to-muted/80 flex items-center justify-center">
                          <span className="text-sm font-semibold text-muted-foreground">{listing.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{listing.name}</p>
                          <p className="text-xs text-muted-foreground">{listing.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {statusBadge(listing.status)}
                        <span className="text-xs text-muted-foreground">{listing.district}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Highlight Card */}
              <div className="bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute top-4 right-4 text-white/20">
                  <Crown className="w-20 h-20" />
                </div>
                <div className="relative z-10">
                  <p className="text-4xl font-bold">{pendingListings}</p>
                  <p className="text-white/80 mt-1">Pending Reviews</p>
                  <p className="text-sm text-white/60 mt-4">Action required for approval</p>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0" onClick={() => setActiveNav("listings")}>
                      View All
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h3 className="font-semibold text-foreground">Recent Users</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="pl-9 h-9 w-48"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">User</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Role</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Status</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Date</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Listings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.slice(0, 5).map((u) => (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedUser(u)}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                              <span className="text-xs font-semibold text-primary">{u.displayName.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{u.displayName}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">{roleBadge(u.role)}</td>
                        <td className="px-5 py-4">{statusBadge(u.status)}</td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">{u.joinedAt}</td>
                        <td className="px-5 py-4 text-sm text-foreground font-medium">{u.listingsCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeNav === "users" && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  className="pl-10"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
              <p className="text-sm text-muted-foreground">{filteredUsers.length} users</p>
            </div>

            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">User</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Role</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Listings</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Last Active</th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">{u.displayName.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{u.displayName}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">{roleBadge(u.role)}</td>
                      <td className="px-5 py-4">{statusBadge(u.status)}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{u.listingsCount}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{u.lastActive}</td>
                      <td className="px-5 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedUser(u)}>
                              <Eye className="w-4 h-4 mr-2" />View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {u.status !== "active" && (
                              <DropdownMenuItem onClick={() => handleUserAction(u.id, "activate")}>
                                <UserCheck className="w-4 h-4 mr-2" />Activate
                              </DropdownMenuItem>
                            )}
                            {u.status === "active" && u.role !== "superadmin" && (
                              <DropdownMenuItem onClick={() => handleUserAction(u.id, "suspend")}>
                                <Ban className="w-4 h-4 mr-2" />Suspend
                              </DropdownMenuItem>
                            )}
                            {u.role !== "admin" && u.role !== "superadmin" && (
                              <DropdownMenuItem onClick={() => handleUserAction(u.id, "promote_admin")}>
                                <Shield className="w-4 h-4 mr-2" />Promote to Admin
                              </DropdownMenuItem>
                            )}
                            {u.role === "admin" && (
                              <DropdownMenuItem onClick={() => handleUserAction(u.id, "demote")}>
                                <ChevronDown className="w-4 h-4 mr-2" />Demote to User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {u.role !== "superadmin" && (
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteUser(u.id)}>
                                <Trash2 className="w-4 h-4 mr-2" />Delete User
                              </DropdownMenuItem>
                            )}
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

        {/* Listings Tab */}
        {activeNav === "listings" && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search listings..."
                  className="pl-10"
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
                    className={listingFilter === f ? "" : ""}
                  >
                    {f === "all" ? "All" : f === "pending_approval" ? "Pending" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredListings.map((listing) => (
                <div key={listing.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-muted to-muted/80 flex items-center justify-center">
                        <span className="text-lg font-bold text-muted-foreground">{listing.name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{listing.name}</h3>
                          {statusBadge(listing.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{listing.address}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>UEN: {listing.uen}</span>
                          <span>·</span>
                          <span>{listing.category}</span>
                          <span>·</span>
                          <span>{listing.district}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {listing.status === "pending_approval" && (
                        <>
                          <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600" onClick={() => handleListingAction(listing.id, "approved")}>
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
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteListing(listing.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics Tab */}
        {activeNav === "statistics" && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard icon={<Users className="w-5 h-5" />} label="Total Users" value={totalUsers} change="+12%" positive />
              <StatCard icon={<Building2 className="w-5 h-5" />} label="Total Listings" value={totalListings} change="+8%" positive />
              <StatCard icon={<Activity className="w-5 h-5" />} label="Active Users" value={activeUsers} change="+5%" positive />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4">Listings Trend</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={listingTrendData}>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4">Category Distribution</h3>
                <div className="flex items-center justify-center gap-8">
                  <div className="w-40 h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {categoryData.map((cat, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-sm text-muted-foreground">{cat.name}</span>
                        <span className="text-sm font-medium text-foreground">{cat.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeNav === "settings" && (
          <div className="p-6 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Platform Settings</h3>
              <div className="space-y-4">
                <SettingRow title="Auto-approve listings" description="Skip manual review for verified owners" enabled={false} />
                <SettingRow title="Email notifications" description="Send alerts for new submissions" enabled={true} />
                <SettingRow title="SMS verification" description="Require phone verification" enabled={true} />
                <SettingRow title="Document upload required" description="Require ACRA profile" enabled={true} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                  <span className="text-xl font-bold text-indigo-600">{selectedUser.displayName.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-800">{selectedUser.displayName}</h3>
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
              <div className="flex gap-2 pt-4 border-t border-slate-200">
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
                <h3 className="font-semibold text-lg text-slate-800">{selectedListing.name}</h3>
                {statusBadge(selectedListing.status)}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoRow icon={<Building2 className="w-4 h-4" />} label="UEN" value={selectedListing.uen} />
                <InfoRow icon={<Building2 className="w-4 h-4" />} label="Category" value={selectedListing.category} />
                <InfoRow icon={<Building2 className="w-4 h-4" />} label="District" value={selectedListing.district} />
                <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={selectedListing.phone || "—"} />
              </div>
              <div className="text-sm">
                <span className="text-slate-500">Address:</span>
                <p className="text-slate-800">{selectedListing.address}</p>
              </div>
              {selectedListing.description && (
                <div className="text-sm">
                  <span className="text-slate-500">Description:</span>
                  <p className="text-slate-800">{selectedListing.description}</p>
                </div>
              )}
              <div className="flex gap-2 pt-4 border-t border-slate-200">
                {selectedListing.status !== "approved" && (
                  <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600"
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
const StatCard = ({ icon, label, value, change, positive }: { icon: React.ReactNode; label: string; value: number; change: string; positive: boolean }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5">
    <div className="flex items-center justify-between mb-3">
      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
        {icon}
      </div>
      <div className={`flex items-center gap-1 text-sm ${positive ? "text-emerald-600" : "text-red-600"}`}>
        {positive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        {change}
      </div>
    </div>
    <p className="text-3xl font-bold text-slate-800">{value}</p>
    <p className="text-sm text-slate-500 mt-1">{label}</p>
  </div>
);

const SettingRow = ({ title, description, enabled }: { title: string; description: string; enabled: boolean }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
    <div>
      <p className="text-sm font-medium text-slate-800">{title}</p>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
    <div className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors cursor-pointer ${enabled ? "bg-indigo-600" : "bg-slate-200"}`}>
      <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-4" : ""}`} />
    </div>
  </div>
);

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-2">
    <div className="text-slate-400 mt-0.5 shrink-0">{icon}</div>
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-800 break-all">{value}</p>
    </div>
  </div>
);

export default SuperAdmin;
