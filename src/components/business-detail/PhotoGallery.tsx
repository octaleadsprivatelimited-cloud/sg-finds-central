import { useState, useEffect, useCallback } from "react";
import { Camera, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface PhotoGalleryProps {
  photos: string[];
  businessName: string;
}

const DEMO_PHOTOS = [
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
];

const PhotoGallery = ({ photos, businessName }: PhotoGalleryProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const allPhotos = photos.length > 0 ? photos : DEMO_PHOTOS;
  const visiblePhotos = allPhotos.slice(0, 4);
  const remaining = allPhotos.length - 4;

  const goPrev = useCallback(() => setActiveIndex((i) => Math.max(0, i - 1)), []);
  const goNext = useCallback(() => setActiveIndex((i) => Math.min(allPhotos.length - 1, i + 1)), [allPhotos.length]);

  const openLightbox = (idx: number) => {
    setActiveIndex(idx);
    setLightboxOpen(true);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
      else if (e.key === "Escape") { setLightboxOpen(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen, goPrev, goNext]);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 sm:grid-rows-2 gap-1 sm:gap-1.5 h-[200px] sm:h-[300px] md:h-[360px] rounded-2xl overflow-hidden">
        {/* Large main photo */}
        <div
          className="col-span-2 row-span-2 relative cursor-pointer group"
          onClick={() => openLightbox(0)}
        >
          <img
            src={visiblePhotos[0]}
            alt={businessName}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Smaller photos */}
        {visiblePhotos.slice(1, 4).map((photo, idx) => (
          <div
            key={idx}
            className="relative cursor-pointer group overflow-hidden"
            onClick={() => openLightbox(idx + 1)}
          >
            <img
              src={photo}
              alt={`${businessName} photo ${idx + 2}`}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {idx === 2 && remaining > 0 && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center text-white cursor-pointer transition-colors hover:bg-black/60">
                <span className="text-2xl sm:text-3xl font-bold">+{remaining}</span>
                <span className="text-xs sm:text-sm font-medium opacity-80">Photos</span>
              </div>
            )}
          </div>
        ))}

        {/* Fill empty slots */}
        {visiblePhotos.length < 4 &&
          Array.from({ length: 4 - visiblePhotos.length }).map((_, idx) => (
            <div key={`empty-${idx}`} className="bg-secondary/50 flex items-center justify-center">
              <Camera className="w-6 h-6 text-muted-foreground/20" />
            </div>
          ))}
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl p-0 bg-black/95 backdrop-blur-2xl border-none rounded-2xl overflow-hidden [&>button:last-child]:hidden" aria-describedby={undefined}>
          <div className="relative flex items-center justify-center min-h-[50vh] sm:min-h-[70vh]">
            <img
              src={allPhotos[activeIndex]}
              alt={`${businessName} photo`}
              className="w-full max-h-[85vh] object-contain"
            />
            {/* Counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-medium">
              {activeIndex + 1} / {allPhotos.length}
            </div>
            {/* Close */}
            <button
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 flex items-center justify-center transition-colors z-10"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            {/* Prev */}
            {activeIndex > 0 && (
              <button
                className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/35 active:scale-95 transition-all z-10 shadow-lg"
                onClick={goPrev}
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {/* Next */}
            {activeIndex < allPhotos.length - 1 && (
              <button
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/35 active:scale-95 transition-all z-10 shadow-lg"
                onClick={goNext}
                aria-label="Next photo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {allPhotos.map((_, idx) => (
                <button
                  key={idx}
                  aria-label={`Go to photo ${idx + 1}`}
                  className={`rounded-full transition-all duration-300 ${idx === activeIndex ? "w-6 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40 hover:bg-white/60"}`}
                  onClick={() => setActiveIndex(idx)}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PhotoGallery;
