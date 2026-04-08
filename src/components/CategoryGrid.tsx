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
      <h2 className="hidden md:block text-lg font-semibold text-foreground mb-4 tracking-tight">Browse by Category</h2>
      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2.5 md:gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            onClick={() => navigate(`/singapore/${toSlug(cat.name)}`)}
            className="group flex flex-col items-center gap-1.5 md:gap-2 p-2 md:p-3 rounded-2xl bg-secondary hover:shadow-[0_10px_25px_-5px_hsl(0,0%,0%,0.08)] transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-secondary/60 flex items-center justify-center group-hover:bg-secondary transition-colors">
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