import { createContext, useContext, useState, type ReactNode } from "react";

export interface SearchableListing {
  id: string;
  name: string;
  category: string;
  district: string;
}

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  listings: SearchableListing[];
  setListings: (listings: SearchableListing[]) => void;
}

const SearchContext = createContext<SearchContextType>({
  searchQuery: "",
  setSearchQuery: () => {},
  listings: [],
  setListings: () => {},
});

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [listings, setListings] = useState<SearchableListing[]>([]);
  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery, listings, setListings }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => useContext(SearchContext);
