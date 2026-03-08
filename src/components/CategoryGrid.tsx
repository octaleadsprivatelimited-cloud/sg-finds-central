import { useNavigate } from "react-router-dom";
import { toSlug } from "@/lib/url-helpers";

import foodImg from "@/assets/categories/food.png";
import retailImg from "@/assets/categories/retail.png";
import healthcareImg from "@/assets/categories/healthcare.png";
import educationImg from "@/assets/categories/education.png";
import professionalImg from "@/assets/categories/professional.png";
import beautyImg from "@/assets/categories/beauty.png";
import homeImg from "@/assets/categories/home.png";
import automotiveImg from "@/assets/categories/automotive.png";
import technologyImg from "@/assets/categories/technology.png";
import realestateImg from "@/assets/categories/realestate.png";
import legalImg from "@/assets/categories/legal.png";
import financialImg from "@/assets/categories/financial.png";
import logisticsImg from "@/assets/categories/logistics.png";
import eventsImg from "@/assets/categories/events.png";
import constructionImg from "@/assets/categories/construction.png";
import travelImg from "@/assets/categories/travel.png";
import petImg from "@/assets/categories/pet.png";
import fitnessImg from "@/assets/categories/fitness.png";
import photographyImg from "@/assets/categories/photography.png";
import cleaningImg from "@/assets/categories/cleaning.png";

const CATEGORIES = [
  { name: "Food & Beverage", image: foodImg },
  { name: "Retail & Shopping", image: retailImg },
  { name: "Healthcare & Medical", image: healthcareImg },
  { name: "Education & Training", image: educationImg },
  { name: "Professional Services", image: professionalImg },
  { name: "Beauty & Wellness", image: beautyImg },
  { name: "Home Services", image: homeImg },
  { name: "Automotive", image: automotiveImg },
  { name: "Technology & IT", image: technologyImg },
  { name: "Real Estate", image: realestateImg },
  { name: "Legal Services", image: legalImg },
  { name: "Financial Services", image: financialImg },
  { name: "Logistics & Transport", image: logisticsImg },
  { name: "Events & Entertainment", image: eventsImg },
  { name: "Construction & Renovation", image: constructionImg },
  { name: "Travel & Tourism", image: travelImg },
  { name: "Pet Services", image: petImg },
  { name: "Fitness & Sports", image: fitnessImg },
  { name: "Photography", image: photographyImg },
  { name: "Cleaning Services", image: cleaningImg },
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
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <img
                src={cat.image}
                alt={cat.name}
                width={32}
                height={32}
                className="w-5 h-5 md:w-8 md:h-8 object-contain"
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
