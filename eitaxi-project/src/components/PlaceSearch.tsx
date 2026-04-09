"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface PlaceResult {
  name: string;
  displayName: string;
  lat: number;
  lon: number;
  type: string;
}

interface PlaceSearchProps {
  value?: string;
  onChange: (place: PlaceResult | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function PlaceSearch({
  value = "",
  onChange,
  placeholder = "Buscar lugar...",
  className = "",
  disabled = false,
}: PlaceSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar resultados al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Actualizar query si cambia el value externamente
  useEffect(() => {
    if (value && value !== query) {
      setQuery(value);
    }
  }, [value]);

  // Buscar lugares con Nominatim (OpenStreetMap)
  const searchPlaces = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Usar la API de Nominatim con foco en Suiza y Liechtenstein
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&q=${encodeURIComponent(searchQuery)}` +
        `&limit=8` +
        `&viewbox=5.9,47.5,10.5,45.8` + // Bounding box Suiza/Liechtenstein
        `&bounded=0` + // También buscar fuera del bbox
        `&addressdetails=1` +
        `&accept-language=es,de,en`
      );

      if (!response.ok) throw new Error("Error en la búsqueda");

      const data = await response.json();

      const places: PlaceResult[] = data.map((item: any) => ({
        name: item.name || item.display_name.split(",")[0],
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type || item.addresstype || "place",
      }));

      setResults(places);
      setShowResults(true);
    } catch (error) {
      console.error("Error buscando lugares:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce para la búsqueda
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setSelectedPlace(null);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (newQuery.length >= 2) {
      debounceRef.current = setTimeout(() => {
        searchPlaces(newQuery);
      }, 400);
    } else {
      setResults([]);
      setShowResults(false);
    }
  };

  // Seleccionar un lugar
  const handleSelectPlace = (place: PlaceResult) => {
    setQuery(place.name);
    setSelectedPlace(place);
    setShowResults(false);
    onChange(place);
  };

  // Limpiar selección
  const handleClear = () => {
    setQuery("");
    setSelectedPlace(null);
    setResults([]);
    onChange(null);
  };

  // Obtener icono según tipo de lugar
  const getPlaceIcon = (type: string) => {
    switch (type) {
      case "airport":
        return "✈️";
      case "train_station":
      case "station":
        return "🚂";
      case "hotel":
        return "🏨";
      case "city":
      case "town":
      case "village":
      case "municipality":
        return "🏙️";
      case "townhall":
        return "🏛️";
      case "hospital":
        return "🏥";
      case "school":
      case "university":
        return "🎓";
      case "shopping_mall":
      case "supermarket":
        return "🛒";
      case "restaurant":
        return "🍽️";
      case "attraction":
      case "tourism":
        return "🎯";
      default:
        return "📍";
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.length >= 2 && results.length > 0) {
              setShowResults(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`pl-10 pr-10 ${selectedPlace ? "border-green-500/50" : ""}`}
        />
        {loading && (
          <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {query && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Indicador de selección */}
      {selectedPlace && (
        <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
          <MapPin className="h-3 w-3" />
          <span className="truncate">
            {selectedPlace.lat.toFixed(4)}, {selectedPlace.lon.toFixed(4)}
          </span>
        </div>
      )}

      {/* Resultados */}
      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {results.map((place, index) => (
            <button
              key={`${place.lat}-${place.lon}-${index}`}
              type="button"
              onClick={() => handleSelectPlace(place)}
              className="w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors flex items-start gap-2"
            >
              <span className="text-lg flex-shrink-0">{getPlaceIcon(place.type)}</span>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm truncate">{place.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {place.displayName}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Sin resultados */}
      {showResults && query.length >= 2 && !loading && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">
            No se encontraron lugares. Intenta con otro nombre.
          </p>
        </div>
      )}
    </div>
  );
}
