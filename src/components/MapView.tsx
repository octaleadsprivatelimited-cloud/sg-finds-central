import { GoogleMap, MarkerF, InfoWindowF } from "@react-google-maps/api";
import { Listing } from "./ListingCard";
import { Loader2, Star } from "lucide-react";
import { useEffect, useState } from "react";

interface MapViewProps {
  listings: Listing[];
  selectedId?: string;
  hoveredId?: string | null;
  onSelectListing?: (listing: Listing) => void;
  onHoverListing?: (id: string | null) => void;
  center?: { lat: number; lng: number };
}

const GOOGLE_MAPS_API_KEY = "AIzaSyDDhWNlCm0mtDySOTuXixmbWnHP6Gr6EVc";
const GOOGLE_MAPS_SCRIPT_ID = "google-maps-script";
const DEFAULT_CENTER = { lat: 1.3521, lng: 103.8198 };
const MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
];

const getMapsScriptSrc = (apiKey: string) =>
  `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=maps&v=weekly`;

const MapView = ({ listings, selectedId, hoveredId, onSelectListing, onHoverListing, center }: MapViewProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setLoadError("Missing Google Maps API key");
      return;
    }

    if ((window as any).google?.maps) {
      setIsLoaded(true);
      return;
    }

    const desiredSrc = getMapsScriptSrc(GOOGLE_MAPS_API_KEY);
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;

    if (existingScript) {
      const existingSrc = existingScript.getAttribute("src") ?? "";
      if (existingSrc !== desiredSrc) {
        existingScript.remove();
      } else {
        const handleLoad = () => setIsLoaded(true);
        const handleError = () => setLoadError("Failed to load Google Maps");

        existingScript.addEventListener("load", handleLoad);
        existingScript.addEventListener("error", handleError);

        return () => {
          existingScript.removeEventListener("load", handleLoad);
          existingScript.removeEventListener("error", handleError);
        };
      }
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = desiredSrc;
    script.async = true;
    script.defer = true;

    const handleLoad = () => setIsLoaded(true);
    const handleError = () => setLoadError("Failed to load Google Maps");

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);
    document.head.appendChild(script);

    return () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };
  }, []);

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-secondary rounded-xl">
        <div className="text-center text-muted-foreground p-4">
          <p className="text-sm">Map temporarily unavailable</p>
          <p className="text-xs mt-1">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-secondary rounded-xl">
        <div className="text-center text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  const activeListing = listings.find((l) => l.id === activeMarker);

  return (
    <GoogleMap
      mapContainerClassName="w-full h-full rounded-xl"
      center={center || DEFAULT_CENTER}
      zoom={12}
      options={{
        styles: MAP_STYLES,
        disableDefaultUI: true,
        zoomControl: true,
      }}
      onClick={() => setActiveMarker(null)}
    >
      {listings.map((listing) => {
        if (!listing.lat || !listing.lng) return null;
        return (
          <MarkerF
            key={listing.id}
            position={{ lat: listing.lat, lng: listing.lng }}
            onClick={() => {
              setActiveMarker(listing.id);
              onSelectListing?.(listing);
            }}
            onMouseOver={() => onHoverListing?.(listing.id)}
            onMouseOut={() => onHoverListing?.(null)}
            opacity={hoveredId === listing.id || selectedId === listing.id ? 1 : 0.7}
            icon={hoveredId === listing.id ? {
              url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              scaledSize: (window as any).google?.maps ? new (window as any).google.maps.Size(44, 44) : undefined,
            } : undefined}
          >
            {activeMarker === listing.id && activeListing && (
              <InfoWindowF
                position={{ lat: listing.lat, lng: listing.lng }}
                onCloseClick={() => setActiveMarker(null)}
              >
                <div
                  style={{ maxWidth: 220, cursor: "pointer" }}
                  onClick={() => onSelectListing?.(activeListing)}
                >
                  {activeListing.coverImage && (
                    <img
                      src={activeListing.coverImage}
                      alt={activeListing.name}
                      style={{
                        width: "100%",
                        height: 100,
                        objectFit: "cover",
                        borderRadius: 6,
                        marginBottom: 8,
                      }}
                    />
                  )}
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: "#1a1a1a" }}>
                    {activeListing.name}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#555" }}>
                    <span style={{ color: "#f59e0b" }}>★</span>
                    <span>{activeListing.rating?.toFixed(1) || "N/A"}</span>
                    {activeListing.reviewCount != null && (
                      <span style={{ color: "#999" }}>({activeListing.reviewCount})</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                    {activeListing.category}
                  </div>
                </div>
              </InfoWindowF>
            )}
          </MarkerF>
        );
      })}
    </GoogleMap>
  );
};

export default MapView;
