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
  { name: "Travel & Tourism", subtitle: "Hotels & Tours", emoji: "✈️", bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-700" },
  { name: "Pet Services", subtitle: "Grooming & Vets", emoji: "🐾", bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700" },
  { name: "Fitness & Sports", subtitle: "Gyms & Coaches", emoji: "🏋️", bg: "bg-red-50", border: "border-red-200", text: "text-red-700" },
  { name: "Photography", subtitle: "Studios & Shoots", emoji: "📸", bg: "bg-fuchsia-50", border: "border-fuchsia-200", text: "text-fuchsia-700" },
  { name: "Cleaning Services", subtitle: "Home & Office", emoji: "🧹", bg: "bg-lime-50", border: "border-lime-200", text: "text-lime-700" },
];

const CategoryGrid = () => {
  const navigate = useNavigate();

  const topCategories = CATEGORIES.slice(0, 5);

  return (
    <section className="py-4 lg:py-0">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm md:text-base font-bold text-foreground">Browse by Category</h2>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">Find what you need in Singapore</p>
          </div>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-1.5 md:gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => navigate(`/singapore/${toSlug(cat.name)}`)}
              className="group flex flex-col items-center gap-1 p-1.5 md:p-2 rounded-lg border border-border hover:shadow-sm hover:border-primary/30 transition-all duration-200 hover:-translate-y-0.5"
            >
              <span className="text-lg md:text-xl">{cat.emoji}</span>
              <span className="text-[8px] md:text-[9px] font-medium text-foreground text-center leading-tight line-clamp-2">
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
