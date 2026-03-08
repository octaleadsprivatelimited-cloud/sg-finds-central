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
  { name: "Food & Beverage", subtitle: "Restaurants & Cafés", image: foodImg },
  { name: "Retail & Shopping", subtitle: "Stores & Markets", image: retailImg },
  { name: "Healthcare & Medical", subtitle: "Doctors & Clinics", image: healthcareImg },
  { name: "Education & Training", subtitle: "Schools & Tutors", image: educationImg },
  { name: "Professional Services", subtitle: "Consulting & Advisory", image: professionalImg },
  { name: "Beauty & Wellness", subtitle: "Spas & Salons", image: beautyImg },
  { name: "Home Services", subtitle: "Plumbing & Cleaning", image: homeImg },
  { name: "Automotive", subtitle: "Workshops & Dealers", image: automotiveImg },
  { name: "Technology & IT", subtitle: "Software & Support", image: technologyImg },
  { name: "Real Estate", subtitle: "Property & Agents", image: realestateImg },
  { name: "Legal Services", subtitle: "Lawyers & Notary", image: legalImg },
  { name: "Financial Services", subtitle: "Banking & Insurance", image: financialImg },
  { name: "Logistics & Transport", subtitle: "Delivery & Moving", image: logisticsImg },
  { name: "Events & Entertainment", subtitle: "Parties & Shows", image: eventsImg },
  { name: "Construction & Renovation", subtitle: "Build & Renovate", image: constructionImg },
  { name: "Travel & Tourism", subtitle: "Hotels & Tours", image: travelImg },
  { name: "Pet Services", subtitle: "Grooming & Vets", image: petImg },
  { name: "Fitness & Sports", subtitle: "Gyms & Coaches", image: fitnessImg },
  { name: "Photography", subtitle: "Studios & Shoots", image: photographyImg },
  { name: "Cleaning Services", subtitle: "Home & Office", image: cleaningImg },
];

const CategoryGrid = () => {
  const navigate = useNavigate();

  return (
    <section className="py-4 lg:py-0">
      <div>
        <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-1.5 md:gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => navigate(`/singapore/${toSlug(cat.name)}`)}
              className="group flex flex-col items-center gap-1 p-1.5 md:p-2 rounded-lg border border-border lg:border-white/20 lg:bg-white/10 lg:backdrop-blur-sm hover:shadow-sm hover:border-primary/30 lg:hover:border-white/40 lg:hover:bg-white/20 transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
              <span className="text-[8px] md:text-[9px] font-medium text-foreground lg:text-white/90 text-center leading-tight line-clamp-2">
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
