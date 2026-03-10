import { createContext, useContext, useState, type ReactNode } from "react";

interface MapControlsContextType {
  showMap: boolean;
  setShowMap: (val: boolean) => void;
  onDetectLocation: (() => void) | null;
  setOnDetectLocation: (fn: (() => void) | null) => void;
}

const MapControlsContext = createContext<MapControlsContextType>({
  showMap: false,
  setShowMap: () => {},
  onDetectLocation: null,
  setOnDetectLocation: () => {},
});

export const MapControlsProvider = ({ children }: { children: ReactNode }) => {
  const [showMap, setShowMap] = useState(false);
  const [onDetectLocation, setOnDetectLocation] = useState<(() => void) | null>(null);

  return (
    <MapControlsContext.Provider value={{ showMap, setShowMap, onDetectLocation, setOnDetectLocation }}>
      {children}
    </MapControlsContext.Provider>
  );
};

export const useMapControls = () => useContext(MapControlsContext);
