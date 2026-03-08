import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  gradient: string;
  accent: string;
}

const BANNERS: Banner[] = [
  {
    id: "1",
    title: "Find Curated Offerings For You",
    subtitle: "Discover top-rated businesses handpicked by our editors",
    cta: "Explore Now",
    gradient: "from-indigo-600 via-blue-600 to-violet-700",
    accent: "bg-white/20",
  },
  {
    id: "2",
    title: "List Your Business for Free",
    subtitle: "Reach thousands of customers across Singapore — zero cost to get started",
    cta: "Add Listing",
    gradient: "from-emerald-600 via-teal-600 to-cyan-700",
    accent: "bg-white/20",
  },
  {
    id: "3",
    title: "Verified & Trusted Businesses",
    subtitle: "All our featured businesses are UEN-verified for your peace of mind",
    cta: "Browse Verified",
    gradient: "from-orange-500 via-red-500 to-pink-600",
    accent: "bg-white/20",
  },
  {
    id: "4",
    title: "Exclusive Deals This Week",
    subtitle: "Save up to 50% with partner businesses — limited time offers",
    cta: "View Deals",
    gradient: "from-fuchsia-600 via-purple-600 to-indigo-700",
    accent: "bg-white/20",
  },
];

const PromoBanner = () => {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % BANNERS.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + BANNERS.length) % BANNERS.length);
  }, []);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next, isHovered]);

  const banner = BANNERS[current];

  return (
    <section className="py-2 md:py-4">
      <div className="container mx-auto px-3 md:px-4">
        <div
          className="relative overflow-hidden rounded-2xl"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Banner */}
          <div
            className={`relative bg-gradient-to-r ${banner.gradient} p-4 md:p-10 min-h-[120px] md:min-h-[200px] flex items-center transition-all duration-500`}
          >
            {/* Decorative shapes */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
            <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2" />

            <div className="relative z-10 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-white/80" />
                <span className="text-white/70 text-xs font-medium uppercase tracking-wider">
                  Featured
                </span>
              </div>
              <h3 className="text-white font-bold text-xl md:text-3xl leading-tight mb-2 max-w-lg">
                {banner.title}
              </h3>
              <p className="text-white/80 text-sm md:text-base mb-4 max-w-md">
                {banner.subtitle}
              </p>
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-foreground font-semibold text-sm hover:bg-white/90 transition-colors shadow-lg">
                {banner.cta}
              </button>
            </div>
          </div>

          {/* Nav arrows */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm"
            onClick={prev}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm"
            onClick={next}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {BANNERS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-6 h-2 bg-white"
                    : "w-2 h-2 bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoBanner;
