import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, MapPin, Star, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearch } from "@/contexts/SearchContext";
import { cn } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface SearchWithSuggestionsProps {
  compact?: boolean;
  placeholder?: string;
  className?: string;
}

const SearchWithSuggestions = ({ compact, placeholder = "Search businesses...", className }: SearchWithSuggestionsProps) => {
  const { searchQuery, setSearchQuery, listings } = useSearch();
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    
    // Match by name or category
    const matches = listings.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        l.district.toLowerCase().includes(q)
    );

    // Deduplicate and limit
    return matches.slice(0, 6);
  }, [searchQuery, listings]);

  // Also suggest matching categories
  const categoryMatches = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    const cats = [...new Set(listings.map((l) => l.category))];
    return cats.filter((c) => c.toLowerCase().includes(q)).slice(0, 3);
  }, [searchQuery, listings]);

  const showDropdown = focused && searchQuery.length >= 2 && (suggestions.length > 0 || categoryMatches.length > 0);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (name: string) => {
    setSearchQuery(name);
    setFocused(false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {compact ? (
        <Input
          placeholder={placeholder}
          className="h-9 border-0 bg-transparent pl-0 pr-3 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setFocused(true)}
        />
      ) : (
        <Input
          placeholder={placeholder}
          className="h-full min-h-[48px] rounded-none border-border bg-card pl-4 pr-12 focus-visible:ring-0 focus-visible:ring-offset-0 border text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setFocused(true)}
        />
      )}

      {showDropdown && (
        <div className={cn(
          "absolute left-0 right-0 bg-card border border-border/80 rounded-xl shadow-xl z-[100] overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200",
          compact ? "top-10 -left-8" : "top-full mt-1",
          compact ? "min-w-[280px]" : ""
        )}>
          {/* Category suggestions */}
          {categoryMatches.length > 0 && (
            <div className="px-3 pt-2.5 pb-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Categories</p>
              <div className="flex flex-wrap gap-1.5">
                {categoryMatches.map((cat) => (
                  <button
                    key={cat}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                    onClick={() => handleSelect(cat)}
                  >
                    <Building2 className="w-3 h-3" />
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Business suggestions */}
          {suggestions.length > 0 && (
            <div className="py-1.5">
              {categoryMatches.length > 0 && (
                <p className="px-3 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Businesses</p>
              )}
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent/10 transition-colors text-left"
                  onClick={() => handleSelect(item.name)}
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center shrink-0">
                    <Search className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {item.category} · {item.district}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchWithSuggestions;
