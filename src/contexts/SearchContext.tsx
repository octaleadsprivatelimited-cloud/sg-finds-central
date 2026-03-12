import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface SearchableListing {
  id: string;
  name: string;
  category: string;
  district: string;
}

const DEMO_SEARCH_LISTINGS: SearchableListing[] = [
  { id: "1", name: "Singapore Delights Pte Ltd", category: "Food & Beverage", district: "Orchard" },
  { id: "1b", name: "Hawker King", category: "Food & Beverage", district: "Chinatown" },
  { id: "6", name: "Orchard Lifestyle Store", category: "Retail & Shopping", district: "Orchard" },
  { id: "6b", name: "ShopLocal SG", category: "Retail & Shopping", district: "Bugis" },
  { id: "7", name: "HealthFirst Medical Clinic", category: "Healthcare & Medical", district: "Novena" },
  { id: "7b", name: "SmileBright Dental", category: "Healthcare & Medical", district: "Toa Payoh" },
  { id: "4", name: "LearnSG Academy", category: "Education & Training", district: "Tampines" },
  { id: "4b", name: "TutorHub SG", category: "Education & Training", district: "Bishan" },
  { id: "8", name: "PrimeConsult Advisory", category: "Professional Services", district: "CBD / Raffles Place" },
  { id: "3", name: "Glow Aesthetics Clinic", category: "Beauty & Wellness", district: "Novena" },
  { id: "3b", name: "Zen Spa & Massage", category: "Beauty & Wellness", district: "Kallang" },
  { id: "5", name: "HomeFixSG Services", category: "Home Services", district: "Jurong East" },
  { id: "5b", name: "CleanPro SG", category: "Home Services", district: "Clementi" },
  { id: "9", name: "SpeedWorks Auto", category: "Automotive", district: "Bukit Merah" },
  { id: "2", name: "TechHub Solutions", category: "Technology & IT", district: "CBD / Raffles Place" },
  { id: "2b", name: "AppCraft Studio", category: "Technology & IT", district: "Queenstown" },
  { id: "10", name: "Prestige Properties SG", category: "Real Estate", district: "Marina Bay" },
  { id: "11", name: "LawPoint LLP", category: "Legal Services", district: "CBD / Raffles Place" },
  { id: "12", name: "WealthBridge Advisors", category: "Financial Services", district: "Bukit Timah" },
  { id: "13", name: "SwiftMove Logistics", category: "Logistics & Transport", district: "Changi" },
  { id: "14", name: "Celebrate! Events Co", category: "Events & Entertainment", district: "Kallang" },
  { id: "15", name: "BuildRight Contractors", category: "Construction & Renovation", district: "Ang Mo Kio" },
];

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  listings: SearchableListing[];
  setListings: (listings: SearchableListing[]) => void;
  onPincodeSearch: ((code: string) => void) | null;
  setOnPincodeSearch: (fn: ((code: string) => void) | null) => void;
}

const SearchContext = createContext<SearchContextType>({
  searchQuery: "",
  setSearchQuery: () => {},
  listings: [],
  setListings: () => {},
});

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [listings, setListings] = useState<SearchableListing[]>(DEMO_SEARCH_LISTINGS);

  // Try to fetch real listings for suggestions
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const q = query(collection(db, "listings"), where("status", "==", "approved"));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs.map((doc) => {
            const d = doc.data();
            return { id: doc.id, name: d.name, category: d.category, district: d.district } as SearchableListing;
          });
          setListings(data);
        }
      } catch {
        // Keep demo data
      }
    };
    fetchListings();
  }, []);

  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery, listings, setListings }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => useContext(SearchContext);
