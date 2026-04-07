import { useNavigate } from "react-router-dom";
import { toSlug } from "@/lib/url-helpers";

import educationImg from "@/assets/categories/education.webp";
import foodImg from "@/assets/categories/food.webp";
import beautyImg from "@/assets/categories/beauty.webp";
import petImg from "@/assets/categories/pet.webp";
import eventsImg from "@/assets/categories/events.webp";
import cleaningImg from "@/assets/categories/cleaning.webp";
import homeImg from "@/assets/categories/home.webp";
import photographyImg from "@/assets/categories/photography.webp";

const CATEGORIES = [
  { name: "Tuition", image: educationImg, bg: "bg-blue-50 dark:bg-blue-950/30" },
  { name: "Baking", image: foodImg, bg: "bg-amber-50 dark:bg-amber-950/30" },
  { name: "Music / Art / Craft", image: beautyImg, bg: "bg-purple-50 dark:bg-purple-950/30" },
  { name: "Home Food", image: foodImg, bg: "bg-orange-50 dark:bg-orange-950/30" },
  { name: "Beauty", image: beautyImg, bg: "bg-pink-50 dark:bg-pink-950/30" },
  { name: "Pet Services", image: petImg, bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  { name: "Event Services", image: eventsImg, bg: "bg-rose-50 dark:bg-rose-950/30" },
  { name: "Tailoring", image: homeImg, bg: "bg-violet-50 dark:bg-violet-950/30" },
  { name: "Cleaning", image: cleaningImg, bg: "bg-sky-50 dark:bg-sky-950/30" },
  { name: "Handyman", image: homeImg, bg: "bg-yellow-50 dark:bg-yellow-950/30" },
  { name: "Photography / Videography", image: photographyImg, bg: "bg-slate-50 dark:bg-slate-950/30" },
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
              <img
                src={cat.image}
                alt={cat.name}
                width={48}
                height={48}
                className="w-11 h-11 md:w-13 md:h-13 object-contain"
                loading="eager"
                decoding="async"
              />
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
