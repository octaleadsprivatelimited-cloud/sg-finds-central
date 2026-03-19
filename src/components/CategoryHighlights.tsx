import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import businessImg from "@/assets/highlights/business.png";
import repairsImg from "@/assets/highlights/repairs.png";
import realestateImg from "@/assets/highlights/realestate.png";
import doctorsImg from "@/assets/highlights/doctors.png";

const highlights = [
  {
    title: "TUITION",
    subtitle: "Find Expert\nTutors",
    bg: "bg-blue-600",
    image: businessImg,
    category: "Tuition",
  },
  {
    title: "HOME\nFOOD",
    subtitle: "Fresh\nHome-cooked",
    bg: "bg-indigo-800",
    image: repairsImg,
    category: "Home Food",
  },
  {
    title: "PET\nSERVICES",
    subtitle: "Grooming &\nWalking",
    bg: "bg-purple-600",
    image: realestateImg,
    category: "Pet Services",
  },
  {
    title: "BEAUTY",
    subtitle: "Book\nNow",
    bg: "bg-emerald-600",
    image: doctorsImg,
    category: "Beauty",
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
            {/* Text content */}
            <div className="relative z-10">
              <h3 className="font-extrabold text-white text-base md:text-xl leading-tight tracking-tight whitespace-pre-line">
                {item.title}
              </h3>
              <p className="text-white/80 text-xs md:text-sm mt-1.5 whitespace-pre-line leading-relaxed">
                {item.subtitle}
              </p>
            </div>

            {/* Arrow button */}
            <div className="relative z-10 mt-3">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
              </div>
            </div>

            {/* Image positioned bottom-right */}
            <img
              src={item.image}
              alt={item.title}
              className="absolute bottom-0 right-0 w-[55%] md:w-[60%] h-auto object-contain pointer-events-none"
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default CategoryHighlights;
