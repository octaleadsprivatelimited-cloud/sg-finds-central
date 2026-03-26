import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toSlug } from "@/lib/url-helpers";
import foodImg from "@/assets/highlights/food.png";
import beautyImg from "@/assets/highlights/beauty.png";
import cleaningImg from "@/assets/highlights/cleaning.png";
import petservicesImg from "@/assets/highlights/petservices.png";

const highlights = [
  {
    title: "FOOD",
    subtitle: "Delicious\nMeals Nearby",
    bg: "bg-blue-600",
    image: foodImg,
    category: "Food & Beverage",
  },
  {
    title: "BEAUTY",
    subtitle: "Book\nNow",
    bg: "bg-emerald-600",
    image: beautyImg,
    category: "Beauty & Wellness",
  },
  {
    title: "CLEANING",
    subtitle: "Professional\nServices",
    bg: "bg-purple-600",
    image: cleaningImg,
    category: "Home Services",
  },
  {
    title: "PET\nSERVICES",
    subtitle: "Grooming &\nWalking",
    bg: "bg-indigo-800",
    image: petservicesImg,
    category: "Pet Services",
  },
];

const CategoryHighlights = () => {
  const navigate = useNavigate();

  return (
    <section className="mb-4 md:mb-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4">
        {highlights.map((item, i) => (
          <div
            key={i}
            className={`relative overflow-hidden rounded-2xl ${item.bg} cursor-pointer active:scale-[0.97] hover:scale-[1.02] transition-transform duration-200 min-h-[180px] md:min-h-[240px] flex flex-col justify-between p-4 md:p-5`}
            onClick={() => navigate(`/city/singapore/${item.category.toLowerCase().replace(/ /g, "-")}`)}
          >
            <div className="relative z-10">
              <h3 className="font-extrabold text-white text-base md:text-xl leading-tight tracking-tight whitespace-pre-line">
                {item.title}
              </h3>
              <p className="text-white/80 text-xs md:text-sm mt-1.5 whitespace-pre-line leading-relaxed">
                {item.subtitle}
              </p>
            </div>

            <div className="relative z-10 mt-3">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
              </div>
            </div>

            <img
              src={item.image}
              alt={item.title}
              loading="lazy"
              width={512}
              height={512}
              className="absolute bottom-0 right-0 w-[55%] md:w-[60%] h-auto object-contain pointer-events-none"
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default CategoryHighlights;
