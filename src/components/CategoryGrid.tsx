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
      <div className="flex items-center gap-3 mb-5">
        <div className="h-px flex-1 bg-border" />
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Browse by Category
        </h2>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-6 sm:grid-cols-6 md:grid-cols-6 lg:grid-cols-11 gap-1.5 md:gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            onClick={() => navigate(`/singapore/${toSlug(cat.name)}`)}
            className="group flex flex-col items-center gap-1 md:gap-2 p-1.5 md:p-3.5 rounded-xl bg-card border-2 border-border/60 hover:border-primary/30 retro-shadow-sm hover:retro-shadow transition-all duration-200 hover:-translate-y-1 active:translate-y-0 active:shadow-none"
          >
            <div className="w-9 h-9 md:w-14 md:h-14 rounded-lg bg-secondary/80 border border-border/40 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
              <span className="text-lg md:text-3xl">{cat.emoji}</span>
            </div>
            <span className="text-[8px] md:text-[11px] font-semibold text-foreground text-center leading-tight line-clamp-2 uppercase tracking-tight md:tracking-wide">
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default CategoryGrid;
