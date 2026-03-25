import { Listing } from "@/components/ListingCard";

// Demo users for the platform
export interface PlatformUser {
  id: string;
  email: string;
  displayName: string;
  role: "superadmin" | "admin" | "business_owner" | "user";
  status: "active" | "suspended" | "banned";
  joinedAt: string;
  listingsCount: number;
  lastActive: string;
  phone?: string;
  avatar?: string;
}

export const DEMO_USERS: PlatformUser[] = [
  {
    id: "u1", email: "admin@nearbuy.sg", displayName: "Nearbuy Admin",
    role: "superadmin", status: "active", joinedAt: "2024-01-15",
    listingsCount: 0, lastActive: "2026-03-08", phone: "+65 9000 0001",
  },
  {
    id: "u2", email: "john.tan@gmail.com", displayName: "John Tan",
    role: "business_owner", status: "active", joinedAt: "2024-06-20",
    listingsCount: 3, lastActive: "2026-03-07", phone: "+65 9123 4567",
  },
  {
    id: "u3", email: "sarah.lim@outlook.com", displayName: "Sarah Lim",
    role: "business_owner", status: "active", joinedAt: "2024-09-10",
    listingsCount: 1, lastActive: "2026-03-06", phone: "+65 9234 5678",
  },
  {
    id: "u4", email: "david.wong@hotmail.com", displayName: "David Wong",
    role: "user", status: "active", joinedAt: "2025-01-05",
    listingsCount: 0, lastActive: "2026-03-05",
  },
  {
    id: "u5", email: "mei.chen@yahoo.com", displayName: "Mei Chen",
    role: "business_owner", status: "suspended", joinedAt: "2025-02-14",
    listingsCount: 2, lastActive: "2026-02-28", phone: "+65 9345 6789",
  },
  {
    id: "u6", email: "rajesh.kumar@gmail.com", displayName: "Rajesh Kumar",
    role: "admin", status: "active", joinedAt: "2024-03-22",
    listingsCount: 0, lastActive: "2026-03-08", phone: "+65 9456 7890",
  },
  {
    id: "u7", email: "lisa.ng@gmail.com", displayName: "Lisa Ng",
    role: "business_owner", status: "active", joinedAt: "2025-05-10",
    listingsCount: 1, lastActive: "2026-03-04", phone: "+65 9567 8901",
  },
  {
    id: "u8", email: "spam.user@temp.com", displayName: "Spam User",
    role: "user", status: "banned", joinedAt: "2025-11-01",
    listingsCount: 0, lastActive: "2025-12-01",
  },
];

export const DEMO_ALL_LISTINGS: Listing[] = [
  {
    id: "1", name: "Singapore Delights Pte Ltd", uen: "201912345A",
    category: "Food & Beverage", district: "Orchard", address: "391 Orchard Road, #B2-01, Singapore 238872",
    postalCode: "238872", phone: "+65 6234 5678", website: "https://sgdelights.com",
    description: "Award-winning local cuisine serving traditional Peranakan dishes with a modern twist.",
    status: "approved", ownerId: "u2", lat: 1.3048, lng: 103.8318,
  },
  {
    id: "2", name: "TechHub Solutions", uen: "202301234B",
    category: "Technology & IT", district: "CBD / Raffles Place", address: "1 Raffles Place, #30-01, Singapore 048616",
    postalCode: "048616", phone: "+65 6789 0123", website: "https://techhub.sg",
    description: "Full-service IT consultancy specializing in cloud infrastructure and cybersecurity.",
    status: "approved", ownerId: "u2", lat: 1.2840, lng: 103.8510,
  },
  {
    id: "3", name: "Glow Aesthetics Clinic", uen: "202212345C",
    category: "Beauty & Wellness", district: "Novena", address: "10 Sinaran Drive, #10-05, Singapore 307506",
    postalCode: "307506", phone: "+65 6345 6789",
    description: "Premium aesthetic treatments using FDA-approved technology.",
    status: "approved", ownerId: "u3", lat: 1.3204, lng: 103.8447,
  },
  {
    id: "4", name: "LearnSG Academy", uen: "201854321D",
    category: "Education & Training", district: "Tampines", address: "1 Tampines Walk, #03-12, Singapore 528523",
    postalCode: "528523", phone: "+65 6456 7890",
    description: "Enrichment centre offering coding, robotics, and STEM courses for ages 5–16.",
    status: "approved", ownerId: "u2", lat: 1.3530, lng: 103.9453,
  },
  {
    id: "5", name: "HomeFixSG Services", uen: "202098765E",
    category: "Home Services", district: "Jurong East", address: "21 Jurong East St 31, Singapore 609517",
    postalCode: "609517", phone: "+65 6567 8901",
    description: "Reliable plumbing, electrical, and aircon servicing across Singapore.",
    status: "approved", ownerId: "u7", lat: 1.3329, lng: 103.7436,
  },
  {
    id: "p1", name: "New Café SG", uen: "202399999F",
    category: "Food & Beverage", district: "Tiong Bahru",
    address: "78 Yong Siak Street, Singapore 163078", postalCode: "163078",
    phone: "+65 6111 2222", status: "pending_approval", ownerId: "u5",
    documentsUrl: ["https://example.com/doc1.pdf"],
  },
  {
    id: "p2", name: "FastTrack Logistics", uen: "202455555G",
    category: "Logistics & Transport", district: "Changi",
    address: "5 Changi Business Park Ave 1, Singapore 486038", postalCode: "486038",
    phone: "+65 6222 3333", status: "pending_approval", ownerId: "u5",
    documentsUrl: ["https://example.com/doc2.pdf", "https://example.com/doc3.pdf"],
  },
  {
    id: "r1", name: "Suspicious Business Co", uen: "199900001H",
    category: "Financial Services", district: "Woodlands",
    address: "123 Woodlands Ave 6, Singapore 738999", postalCode: "738999",
    phone: "+65 6333 4444", status: "rejected", ownerId: "u8",
  },
];
