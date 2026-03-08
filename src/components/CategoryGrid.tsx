import { useNavigate } from "react-router-dom";
import { toSlug } from "@/lib/url-helpers";
import CategoryIcon3D from "./3d/CategoryIcon3D";

const CATEGORIES = [
  { name: "Food & Beverage", subtitle: "Restaurants & Cafés", emoji: "🍜", color: "#f97316" },
  { name: "Retail & Shopping", subtitle: "Stores & Markets", emoji: "🛍️", color: "#3b82f6" },
  { name: "Healthcare & Medical", subtitle: "Doctors & Clinics", emoji: "🏥", color: "#10b981" },
  { name: "Education & Training", subtitle: "Schools & Tutors", emoji: "📚", color: "#6366f1" },
  { name: "Professional Services", subtitle: "Consulting & Advisory", emoji: "💼", color: "#475569" },
  { name: "Beauty & Wellness", subtitle: "Spas & Salons", emoji: "💅", color: "#ec4899" },
  { name: "Home Services", subtitle: "Plumbing & Cleaning", emoji: "🏠", color: "#f59e0b" },
  { name: "Automotive", subtitle: "Workshops & Dealers", emoji: "🚗", color: "#71717a" },
  { name: "Technology & IT", subtitle: "Software & Support", emoji: "💻", color: "#8b5cf6" },
  { name: "Real Estate", subtitle: "Property & Agents", emoji: "🏢", color: "#06b6d4" },
  { name: "Legal Services", subtitle: "Lawyers & Notary", emoji: "⚖️", color: "#ca8a04" },
  { name: "Financial Services", subtitle: "Banking & Insurance", emoji: "💰", color: "#22c55e" },
  { name: "Logistics & Transport", subtitle: "Delivery & Moving", emoji: "🚚", color: "#78716c" },
  { name: "Events & Entertainment", subtitle: "Parties & Shows", emoji: "🎉", color: "#f43f5e" },
  { name: "Construction & Renovation", subtitle: "Build & Renovate", emoji: "🔨", color: "#ea580c" },
];

const CategoryGrid = () => {
  const navigate = useNavigate();

  const topCategories = CATEGORIES.slice(0, 5);
  const bottomCategories = CATEGORIES.slice(5);

  return (
    <section className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg md:text-2xl font-bold text-foreground">Browse by Category</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Find what you need in Singapore</p>
          </div>
        </div>

        {/* Top row — large cards with 3D icons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 mb-6">
          {topCategories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => navigate(`/singapore/${toSlug(cat.name)}`)}
              className="group rounded-2xl bg-card border border-border p-4 md:p-5 min-h-[150px] md:min-h-[180px] flex flex-col items-center justify-center gap-2 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30"
            >
              <CategoryIcon3D color={cat.color} emoji={cat.emoji} size={64} />
              <div>
                <h3 className="font-semibold text-sm md:text-base text-foreground leading-tight">
                  {cat.name}
                </h3>
                <p className="text-muted-foreground text-[11px] md:text-xs mt-0.5">
                  {cat.subtitle}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Bottom rows — compact 3D tiles */}
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-10 gap-2 md:gap-3">
          {bottomCategories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => navigate(`/singapore/${toSlug(cat.name)}`)}
              className="group flex flex-col items-center gap-1.5 p-3 rounded-xl border border-transparent hover:border-border hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5"
            >
              <CategoryIcon3D color={cat.color} emoji={cat.emoji} size={40} />
              <span className="text-[10px] md:text-xs font-medium text-foreground text-center leading-tight">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
