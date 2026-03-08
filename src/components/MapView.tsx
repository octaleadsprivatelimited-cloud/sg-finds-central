import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import { Listing } from "./ListingCard";
import { Loader2 } from "lucide-react";

interface MapViewProps {
  listings: Listing[];
  selectedId?: string;
  onSelectListing?: (listing: Listing) => void;
  center?: { lat: number; lng: number };
}

const DEFAULT_CENTER = { lat: 1.3521, lng: 103.8198 }; // Singapore
const MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
];

const MapView = ({ listings, selectedId, onSelectListing, center }: MapViewProps) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyDDhWNlCm0mtDySOTuXixmbWnHP6Gr6EVc",
  });

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-secondary rounded-xl">
        <div className="text-center text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading map...</p>
          <p className="text-xs mt-1">Add your Google Maps API key to enable</p>
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
