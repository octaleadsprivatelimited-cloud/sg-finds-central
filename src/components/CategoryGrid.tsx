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
  { name: "Tuition", image: educationImg },
  { name: "Baking", image: foodImg },
  { name: "Music / Art / Craft", image: beautyImg },
  { name: "Home Food", image: foodImg },
  { name: "Beauty", image: beautyImg },
  { name: "Pet Services", image: petImg },
  { name: "Event Services", image: eventsImg },
  { name: "Tailoring", image: homeImg },
  { name: "Cleaning", image: cleaningImg },
  { name: "Handyman", image: homeImg },
  { name: "Photography / Videography", image: photographyImg },
];

const CategoryGrid = () => {
  const navigate = useNavigate();

  return (
    <section>
      <h2 className="hidden md:block text-lg font-bold text-foreground mb-4">Browse by Category</h2>
      <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-1.5 md:gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            onClick={() => navigate(`/singapore/${toSlug(cat.name)}`)}
            className="group flex flex-col items-center gap-1 md:gap-2 p-1.5 md:p-3 rounded-lg md:rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center">
              <img
                src={cat.image}
                alt={cat.name}
                width={40}
                height={40}
                className="w-8 h-8 md:w-11 md:h-11 object-contain"
                loading="eager"
                decoding="async"
              />
            </div>
            <span className="text-[8px] md:text-xs font-medium text-foreground text-center leading-tight line-clamp-2">
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default CategoryGrid;
