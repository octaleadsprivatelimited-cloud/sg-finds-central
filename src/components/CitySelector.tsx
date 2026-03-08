import { MapPin, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CITIES, type City } from "@/lib/cities";

interface CitySelectorProps {
  selectedCity: string;
  onCityChange: (citySlug: string) => void;
}

const CitySelector = ({ selectedCity, onCityChange }: CitySelectorProps) => {
  return (
    <Select value={selectedCity} onValueChange={onCityChange}>
      <SelectTrigger className="w-[180px] h-9 text-sm">
        <MapPin className="w-3.5 h-3.5 mr-1.5 text-primary shrink-0" />
        <SelectValue placeholder="Select City" />
      </SelectTrigger>
      <SelectContent>
        {CITIES.map((city) => (
          <SelectItem key={city.id} value={city.slug}>
            <span className="flex items-center gap-2">
              {city.name}
              <span className="text-xs text-muted-foreground">{city.country}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CitySelector;
