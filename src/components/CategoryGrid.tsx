import { useNavigate } from "react-router-dom";
import { toSlug } from "@/lib/url-helpers";
import { ChevronRight } from "lucide-react";

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
  { name: "Food & Beverage", subtitle: "Best Restaurants", icon: foodIcon, gradient: "from-orange-500 to-red-600" },
  { name: "Retail & Shopping", subtitle: "Top Stores", icon: retailIcon, gradient: "from-sky-500 to-blue-600" },
  { name: "Healthcare & Medical", subtitle: "Find Doctors", icon: healthcareIcon, gradient: "from-emerald-500 to-teal-600" },
  { name: "Education & Training", subtitle: "Learn & Grow", icon: educationIcon, gradient: "from-indigo-500 to-blue-700" },
  { name: "Professional Services", subtitle: "Expert Help", icon: professionalIcon, gradient: "from-slate-600 to-slate-800" },
  { name: "Beauty & Wellness", subtitle: "Book Now", icon: beautyIcon, gradient: "from-pink-500 to-rose-600" },
  { name: "Home Services", subtitle: "Get Nearest Vendor", icon: homeIcon, gradient: "from-amber-500 to-orange-600" },
  { name: "Automotive", subtitle: "Car Services", icon: automotiveIcon, gradient: "from-zinc-500 to-zinc-700" },
  { name: "Technology & IT", subtitle: "Quick Quotes", icon: technologyIcon, gradient: "from-violet-500 to-purple-700" },
  { name: "Real Estate", subtitle: "Finest Agents", icon: realestateIcon, gradient: "from-cyan-500 to-blue-600" },
  { name: "Legal Services", subtitle: "Get Advice", icon: legalIcon, gradient: "from-yellow-600 to-amber-700" },
  { name: "Financial Services", subtitle: "Smart Money", icon: financialIcon, gradient: "from-green-500 to-emerald-700" },
  { name: "Logistics & Transport", subtitle: "Fast Delivery", icon: logisticsIcon, gradient: "from-stone-500 to-stone-700" },
  { name: "Events & Entertainment", subtitle: "Plan Events", icon: eventsIcon, gradient: "from-rose-500 to-pink-700" },
  { name: "Construction & Renovation", subtitle: "Build & Renew", icon: constructionIcon, gradient: "from-orange-600 to-amber-700" },
];

const CategoryGrid = () => {
  const navigate = useNavigate();

  // Top row: first 5 as large cards
  const topCategories = CATEGORIES.slice(0, 5);
  // Bottom rows: remaining as smaller icon cards
  const bottomCategories = CATEGORIES.slice(5);

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        {/* Top row — large vibrant cards like JustDial */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
          {topCategories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => navigate(`/singapore/${toSlug(cat.name)}`)}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${cat.gradient} p-4 md:p-5 min-h-[160px] md:min-h-[200px] flex flex-col justify-between text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
            >
              {/* Background icon */}
              <div className="absolute -bottom-2 -right-2 w-24 h-24 md:w-28 md:h-28 opacity-20 group-hover:opacity-30 transition-opacity">
                <img src={cat.icon} alt="" className="w-full h-full object-contain" />
              </div>

              <div className="relative z-10">
                <h3 className="text-white font-bold text-sm md:text-base leading-tight uppercase tracking-wide">
                  {cat.name.split(" & ")[0]}
                  {cat.name.includes("&") && (
                    <>
                      <br />
                      <span className="text-white/90">& {cat.name.split(" & ")[1]}</span>
                    </>
                  )}
                </h3>
                <p className="text-white/80 text-xs md:text-sm mt-1.5 font-medium">
                  {cat.subtitle}
                </p>
              </div>

              <div className="relative z-10 flex items-center gap-1 text-white/70 group-hover:text-white transition-colors mt-auto pt-2">
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>

        {/* Bottom rows — icon-based category tiles */}
        <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-10 gap-3 md:gap-4">
          {bottomCategories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => navigate(`/singapore/${toSlug(cat.name)}`)}
              className="group flex flex-col items-center gap-2 p-2 md:p-3 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-md border border-transparent hover:border-border"
            >
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${cat.gradient} p-2.5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
                <img
                  src={cat.icon}
                  alt={cat.name}
                  className="w-full h-full object-contain brightness-0 invert"
                  loading="lazy"
                />
              </div>
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
