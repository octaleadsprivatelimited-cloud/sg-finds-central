import { useState } from "react";
import { Camera, Plus, X } from "lucide-react";
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
  "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800&h=600&fit=crop",
];

const PhotoGallery = ({ photos, businessName }: PhotoGalleryProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const allPhotos = photos.length > 0 ? photos : DEMO_PHOTOS;
  const visiblePhotos = allPhotos.slice(0, 4);
  const remaining = allPhotos.length - 4;

  const openLightbox = (idx: number) => {
    setActiveIndex(idx);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-4 grid-rows-2 gap-1.5 h-[320px] rounded-xl overflow-hidden">
        {/* Large main photo */}
        <div
          className="col-span-2 row-span-2 relative cursor-pointer group"
          onClick={() => openLightbox(0)}
        >
          <img
            src={visiblePhotos[0]}
            alt={businessName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>

        {/* Smaller photos */}
        {visiblePhotos.slice(1, 4).map((photo, idx) => (
          <div
            key={idx}
            className={`relative cursor-pointer group ${idx === 2 && remaining > 0 ? "" : ""}`}
            onClick={() => openLightbox(idx + 1)}
          >
            <img
              src={photo}
              alt={`${businessName} photo ${idx + 2}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            {idx === 2 && remaining > 0 && (
              <div
                className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  openLightbox(0);
                }}
              >
                <span className="text-3xl font-bold">+{remaining}</span>
                <span className="text-sm font-medium">More</span>
              </div>
            )}
          </div>
        ))}

        {/* Fill empty slots if < 4 photos */}
        {visiblePhotos.length < 4 &&
          Array.from({ length: 4 - visiblePhotos.length }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="bg-secondary flex items-center justify-center"
            >
              <Camera className="w-8 h-8 text-muted-foreground/30" />
            </div>
          ))}
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black border-none">
          <div className="relative">
            <img
              src={allPhotos[activeIndex]}
              alt={`${businessName} photo`}
              className="w-full max-h-[80vh] object-contain"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {allPhotos.map((_, idx) => (
                <button
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${idx === activeIndex ? "bg-white" : "bg-white/40"}`}
                  onClick={() => setActiveIndex(idx)}
                />
              ))}
            </div>
            <button
              className="absolute top-2 right-2 text-white/80 hover:text-white"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
            {activeIndex > 0 && (
              <button
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                onClick={() => setActiveIndex(activeIndex - 1)}
              >
                ‹
              </button>
            )}
            {activeIndex < allPhotos.length - 1 && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                onClick={() => setActiveIndex(activeIndex + 1)}
              >
                ›
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PhotoGallery;
