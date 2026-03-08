import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import { Listing } from "./ListingCard";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface MapViewProps {
  listings: Listing[];
  selectedId?: string;
  onSelectListing?: (listing: Listing) => void;
  center?: { lat: number; lng: number };
}

const GOOGLE_MAPS_API_KEY = "AIzaSyDDhWNlCm0mtDySOTuXixmbWnHP6Gr6EVc";
const DEFAULT_CENTER = { lat: 1.3521, lng: 103.8198 }; // Singapore
const MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
];

const MapView = ({ listings, selectedId, onSelectListing, center }: MapViewProps) => {
  const [loadError, setLoadError] = useState<string | null>(null);

  const { isLoaded, loadError: apiLoadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  useEffect(() => {
    if (apiLoadError) {
      setLoadError(apiLoadError.message);
    }
  }, [apiLoadError]);

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-secondary rounded-xl">
        <div className="text-center text-muted-foreground p-4">
          <p className="text-sm">Map temporarily unavailable</p>
          <p className="text-xs mt-1">Please refresh the page</p>
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
    >
      {listings.map((listing) => {
        if (!listing.lat || !listing.lng) return null;
        return (
          <MarkerF
            key={listing.id}
            position={{ lat: listing.lat, lng: listing.lng }}
            onClick={() => onSelectListing?.(listing)}
          />
        );
      })}
    </GoogleMap>
  );
};

export default MapView;
