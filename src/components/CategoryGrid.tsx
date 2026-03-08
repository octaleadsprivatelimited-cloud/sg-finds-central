import { useNavigate } from "react-router-dom";
import { toSlug } from "@/lib/url-helpers";

const CATEGORIES = [
  { name: "Food & Beverage", subtitle: "Restaurants & Cafés", emoji: "🍜", bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
  { name: "Retail & Shopping", subtitle: "Stores & Markets", emoji: "🛍️", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
  { name: "Healthcare & Medical", subtitle: "Doctors & Clinics", emoji: "🏥", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
  { name: "Education & Training", subtitle: "Schools & Tutors", emoji: "📚", bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700" },
  { name: "Professional Services", subtitle: "Consulting & Advisory", emoji: "💼", bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700" },
  { name: "Beauty & Wellness", subtitle: "Spas & Salons", emoji: "💅", bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700" },
  { name: "Home Services", subtitle: "Plumbing & Cleaning", emoji: "🏠", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
  { name: "Automotive", subtitle: "Workshops & Dealers", emoji: "🚗", bg: "bg-zinc-50", border: "border-zinc-200", text: "text-zinc-700" },
  { name: "Technology & IT", subtitle: "Software & Support", emoji: "💻", bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700" },
  { name: "Real Estate", subtitle: "Property & Agents", emoji: "🏢", bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-700" },
  { name: "Legal Services", subtitle: "Lawyers & Notary", emoji: "⚖️", bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" },
  { name: "Financial Services", subtitle: "Banking & Insurance", emoji: "💰", bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
  { name: "Logistics & Transport", subtitle: "Delivery & Moving", emoji: "🚚", bg: "bg-stone-50", border: "border-stone-200", text: "text-stone-700" },
  { name: "Events & Entertainment", subtitle: "Parties & Shows", emoji: "🎉", bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700" },
  { name: "Construction & Renovation", subtitle: "Build & Renovate", emoji: "🔨", bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
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

        {/* Top row — large cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 mb-6">
          {topCategories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => navigate(`/singapore/${toSlug(cat.name)}`)}
              className={`group relative rounded-2xl ${cat.bg} border ${cat.border} p-4 md:p-5 min-h-[140px] md:min-h-[170px] flex flex-col justify-between text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg`}
            >
              <span className="text-3xl md:text-4xl">{cat.emoji}</span>
              <div>
                <h3 className={`font-semibold text-sm md:text-base ${cat.text} leading-tight`}>
                  {cat.name}
                </h3>
                <p className="text-muted-foreground text-[11px] md:text-xs mt-0.5">
                  {cat.subtitle}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Bottom rows — compact tiles */}
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-10 gap-2 md:gap-3">
          {bottomCategories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => navigate(`/singapore/${toSlug(cat.name)}`)}
              className={`group flex flex-col items-center gap-1.5 p-3 rounded-xl border border-transparent hover:border-border hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5`}
            >
              <span className="text-2xl md:text-3xl">{cat.emoji}</span>
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
