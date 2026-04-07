import { useNavigate } from "react-router-dom";
import { toSlug } from "@/lib/url-helpers";

const CATEGORIES = [
  { name: "Tuition", emoji: "📚" },
  { name: "Baking", emoji: "🎂" },
  { name: "Music / Art / Craft", emoji: "🎨" },
  { name: "Home Food", emoji: "🍳" },
  { name: "Beauty", emoji: "💅" },
  { name: "Pet Services", emoji: "🐾" },
  { name: "Event Services", emoji: "🎉" },
  { name: "Tailoring", emoji: "✂️" },
  { name: "Cleaning", emoji: "🧹" },
  { name: "Handyman", emoji: "🔧" },
  { name: "Photography / Videography", emoji: "📷" },
];

const CategoryGrid = () => {
  const navigate = useNavigate();

  return (
    <section>
      <h2 className="hidden md:block text-lg font-bold text-foreground mb-4">Browse by Category</h2>
      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2 md:gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            onClick={() => navigate(`/singapore/${toSlug(cat.name)}`)}
            className="group flex flex-col items-center gap-1.5 md:gap-2 p-2 md:p-3 rounded-xl border border-gray-300 bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-white flex items-center justify-center">
              <span className="text-3xl md:text-4xl">{cat.emoji}</span>
            </div>
            <span className="text-[9px] md:text-xs font-medium text-foreground text-center leading-tight line-clamp-2">
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default CategoryGrid;
