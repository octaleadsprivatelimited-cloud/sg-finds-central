import { useNavigate } from "react-router-dom";
import { toSlug } from "@/lib/url-helpers";

import foodIcon from "@/assets/categories/food.png";
import retailIcon from "@/assets/categories/retail.png";
import healthcareIcon from "@/assets/categories/healthcare.png";
import educationIcon from "@/assets/categories/education.png";
import professionalIcon from "@/assets/categories/professional.png";
import beautyIcon from "@/assets/categories/beauty.png";
import homeIcon from "@/assets/categories/home.png";
import automotiveIcon from "@/assets/categories/automotive.png";
import technologyIcon from "@/assets/categories/technology.png";
import realestateIcon from "@/assets/categories/realestate.png";
import legalIcon from "@/assets/categories/legal.png";
import financialIcon from "@/assets/categories/financial.png";
import logisticsIcon from "@/assets/categories/logistics.png";
import eventsIcon from "@/assets/categories/events.png";
import constructionIcon from "@/assets/categories/construction.png";

const CATEGORIES = [
  { name: "Food & Beverage", icon: foodIcon, color: "from-orange-400 to-red-500", bg: "bg-orange-50 dark:bg-orange-950/30" },
  { name: "Retail & Shopping", icon: retailIcon, color: "from-sky-400 to-blue-500", bg: "bg-sky-50 dark:bg-sky-950/30" },
  { name: "Healthcare & Medical", icon: healthcareIcon, color: "from-emerald-400 to-teal-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  { name: "Education & Training", icon: educationIcon, color: "from-indigo-400 to-blue-600", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
  { name: "Professional Services", icon: professionalIcon, color: "from-slate-500 to-slate-700", bg: "bg-slate-50 dark:bg-slate-900/30" },
  { name: "Beauty & Wellness", icon: beautyIcon, color: "from-pink-400 to-rose-500", bg: "bg-pink-50 dark:bg-pink-950/30" },
  { name: "Home Services", icon: homeIcon, color: "from-amber-400 to-orange-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
  { name: "Automotive", icon: automotiveIcon, color: "from-zinc-400 to-zinc-600", bg: "bg-zinc-50 dark:bg-zinc-900/30" },
  { name: "Technology & IT", icon: technologyIcon, color: "from-violet-400 to-purple-600", bg: "bg-violet-50 dark:bg-violet-950/30" },
  { name: "Real Estate", icon: realestateIcon, color: "from-cyan-400 to-blue-500", bg: "bg-cyan-50 dark:bg-cyan-950/30" },
  { name: "Legal Services", icon: legalIcon, color: "from-yellow-500 to-amber-600", bg: "bg-yellow-50 dark:bg-yellow-950/30" },
  { name: "Financial Services", icon: financialIcon, color: "from-yellow-400 to-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950/30" },
  { name: "Logistics & Transport", icon: logisticsIcon, color: "from-stone-400 to-stone-600", bg: "bg-stone-50 dark:bg-stone-900/30" },
  { name: "Events & Entertainment", icon: eventsIcon, color: "from-rose-400 to-pink-600", bg: "bg-rose-50 dark:bg-rose-950/30" },
  { name: "Construction & Renovation", icon: constructionIcon, color: "from-orange-500 to-amber-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
];

const CategoryGrid = () => {
  const navigate = useNavigate();

  return (
    <section className="py-10">
      <div className="container mx-auto px-4">
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2 text-center">
          Browse by Category
        </h2>
        <p className="text-muted-foreground text-center mb-8 text-sm">
          Explore businesses across all categories in Singapore
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-4 md:gap-6 max-w-4xl mx-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => navigate(`/singapore/${toSlug(cat.name)}`)}
              className="group flex flex-col items-center gap-2.5 p-3 md:p-4 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 border border-transparent hover:border-border"
            >
              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl ${cat.bg} flex items-center justify-center p-2.5 transition-transform duration-300 group-hover:scale-110`}>
                <img
                  src={cat.icon}
                  alt={cat.name}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
              <span className="text-xs md:text-sm font-medium text-foreground text-center leading-tight">
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
