import { GoogleMap, MarkerF, InfoWindowF, OverlayViewF, OverlayView } from "@react-google-maps/api";
import { Listing } from "./ListingCard";
import { getBusinessUrl } from "@/lib/url-helpers";
import { Loader2, MapPin, Navigation } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

interface MapViewProps {
  listings: Listing[];
  selectedId?: string;
  hoveredId?: string | null;
  onSelectListing?: (listing: Listing) => void;
  onHoverListing?: (id: string | null) => void;
  center?: { lat: number; lng: number };
  radiusKm?: number | null;
}

const radiusToZoom = (km: number): number => {
  if (km <= 0.5) return 20;
  if (km <= 1) return 18;
  if (km <= 2) return 17;
  if (km <= 3) return 16;
  if (km <= 5) return 15;
  return 14;
};

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

const CATEGORY_EMOJI: Record<string, string> = {
  "Tuition": "📚",
  "Baking": "🧁",
  "Music / Art / Craft": "🎨",
  "Home Food": "🍱",
  "Beauty": "💄",
  "Pet Services": "🐾",
  "Event Services": "🎉",
  "Tailoring": "🧵",
  "Cleaning": "🧹",
  "Handyman": "🔧",
  "Photography / Videography": "📷",
};

const MapView = ({ listings, selectedId, hoveredId, onSelectListing, onHoverListing, center, radiusKm }: MapViewProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const pinClickRef = useRef(false);
  const clickedRef = useRef(false); // true when user explicitly clicked a pin
  const navigate = useNavigate();

  const smoothZoomTo = useCallback((map: google.maps.Map, target: { lat: number; lng: number }, targetZoom: number) => {
    const currentZoom = map.getZoom() ?? 14;
    map.panTo(target);
    if (currentZoom === targetZoom) return;
    const step = targetZoom > currentZoom ? 1 : -1;
    let z = currentZoom;
    const interval = setInterval(() => {
      z += step;
      map.setZoom(z);
      if (z === targetZoom) clearInterval(interval);
    }, 180);
  }, []);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Sync hoveredId from parent → auto-open that marker's popup & flyTo (debounced)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (hoveredId) {
      setActiveId(hoveredId);
      hoverTimerRef.current = setTimeout(() => {
        const listing = listings.find(l => l.id === hoveredId);
        if (listing?.lat && listing?.lng && mapRef.current) {
          mapRef.current.panTo({ lat: listing.lat, lng: listing.lng });
        }
      }, 400);
    }
    return () => { if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current); };
  }, [hoveredId, listings]);

  // Sync selectedId from parent
  useEffect(() => {
    if (selectedId) {
      setActiveId(selectedId);
      const listing = listings.find(l => l.id === selectedId);
      if (listing?.lat && listing?.lng && mapRef.current) {
        smoothZoomTo(mapRef.current, { lat: listing.lat, lng: listing.lng }, 16);
      }
    }
  }, [selectedId, listings]);

  // Draw radius circle
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setMap(null);
      circleRef.current = null;
    }
    if (!mapRef.current || !center || !radiusKm) return;

    smoothZoomTo(mapRef.current, center, radiusToZoom(radiusKm));

    circleRef.current = new google.maps.Circle({
      map: mapRef.current,
      center,
      radius: radiusKm * 1000,
      fillColor: "#4f7a5c",
      fillOpacity: 0.08,
      strokeColor: "#A1BE95",
      strokeOpacity: 0.55,
      strokeWeight: 1.5,
    });

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
    };
  }, [center, radiusKm, isLoaded]);

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

  const previewListing = listings.find(l => l.id === activeId);

  return (
    <GoogleMap
      onLoad={onMapLoad}
      mapContainerClassName="w-full h-full rounded-xl"
      center={center || DEFAULT_CENTER}
      zoom={center ? (radiusKm ? radiusToZoom(radiusKm) : 17) : 14}
      options={{
        styles: MAP_STYLES,
        disableDefaultUI: true,
        zoomControl: true,
      }}
      onClick={() => { if (pinClickRef.current) { pinClickRef.current = false; return; } setActiveId(null); clickedRef.current = false; }}
    >
      {/* Custom pin markers */}
      {listings.map((listing) => {
        if (!listing.lat || !listing.lng) return null;
        const isActive = listing.id === activeId || listing.id === hoveredId || listing.id === selectedId;
        const emoji = CATEGORY_EMOJI[listing.category] || "📍";

        return (
          <OverlayViewF
            key={listing.id}
            position={{ lat: listing.lat, lng: listing.lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                pinClickRef.current = true;
                clickedRef.current = true;
                setActiveId(listing.id);
                onSelectListing?.(listing);
                const card = document.querySelector(`[data-listing-id="${listing.id}"]`);
                if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              onMouseEnter={() => {
                if (!clickedRef.current) setActiveId(listing.id);
                onHoverListing?.(listing.id);
              }}
              onMouseLeave={() => {
                if (!clickedRef.current) setActiveId(null);
                onHoverListing?.(null);
              }}
              style={{
                width: isActive ? 44 : 36,
                height: isActive ? 44 : 36,
                borderRadius: "50%",
                background: isActive ? "#16a34a" : "#31473A",
                border: isActive ? "3px solid white" : "2.5px solid white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: isActive ? 18 : 15,
                lineHeight: 1,
                boxShadow: isActive
                  ? "0 0 0 8px rgba(22,163,74,0.20), 0 4px 18px rgba(2,6,23,0.32)"
                  : "0 3px 12px rgba(2,6,23,0.30)",
                cursor: "pointer",
                transition: "all 0.15s ease",
                transform: "translate(-50%, -50%)",
                zIndex: isActive ? 1000 : 1,
                position: "relative",
              }}
            >
              {emoji}
            </div>
          </OverlayViewF>
        );
      })}

      {/* InfoWindow popup for active marker */}
      {activeId && previewListing && previewListing.lat && previewListing.lng && (
        <InfoWindowF
          position={{ lat: previewListing.lat, lng: previewListing.lng }}
          onCloseClick={() => setActiveId(null)}
          options={{ pixelOffset: new google.maps.Size(0, -24), maxWidth: 200 }}
        >
          <div
            style={{ width: 180, cursor: "pointer", padding: 0 }}
            onClick={() => navigate(getBusinessUrl(previewListing))}
          >
            {/* Image */}
            {(previewListing.coverImage || previewListing.logoUrl || previewListing.imageUrls?.[0]) && (
              <img
                src={previewListing.coverImage || previewListing.logoUrl || previewListing.imageUrls?.[0]}
                alt={previewListing.name}
                style={{
                  width: "100%",
                  height: 60,
                  objectFit: "cover",
                  borderRadius: 6,
                  marginBottom: 6,
                }}
              />
            )}
            {/* Name & category */}
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: "#1f3a2e", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {previewListing.name}
              </div>
              <div style={{ fontSize: 10, fontWeight: 500, color: "rgba(31,58,46,0.55)", marginTop: 1 }}>
                {previewListing.category}
              </div>
            </div>
            {/* Address */}
            {previewListing.district && (
              <div style={{ fontSize: 10, fontWeight: 500, color: "rgba(15,23,42,0.4)", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                📍 {previewListing.district}{previewListing.postalCode ? ` · ${previewListing.postalCode}` : ""}
              </div>
            )}
            {/* Actions */}
            <div style={{ display: "flex", gap: 4 }}>
              <span style={{
                padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                background: "#1f3a2e", color: "white", flex: 1, textAlign: "center",
              }}>
                View →
              </span>
              {previewListing.lat && previewListing.lng && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${previewListing.lat},${previewListing.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                    background: "rgba(37,99,235,0.07)", border: "1px solid rgba(37,99,235,0.18)", color: "#1d4ed8",
                    textDecoration: "none",
                  }}
                >
                  🧭
                </a>
              )}
            </div>
          </div>
        </InfoWindowF>
      )}

      {/* User location marker */}
      {center && (
        <OverlayViewF
          position={center}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
          <div style={{
            width: 16, height: 16, borderRadius: "50%",
            background: "#3b82f6", border: "3px solid white",
            boxShadow: "0 0 0 6px rgba(59,130,246,0.20), 0 2px 8px rgba(2,6,23,0.25)",
            transform: "translate(-50%, -50%)",
          }} />
        </OverlayViewF>
      )}
    </GoogleMap>
  );
};

export default MapView;