"use client";

import { useState, useEffect, useRef } from "react";
import {
  Route,
  Plus,
  X,
  Loader2,
  MapPin,
  DollarSign,
  ArrowRight,
  Calculator,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { POPULAR_PLACES } from "@/lib/geo-data";

// Tipo para una ruta con precio fijo
export interface FixedRoute {
  id?: string;
  origin: string;
  originLat?: number;
  originLon?: number;
  destination: string;
  destinationLat?: number;
  destinationLon?: number;
  price?: number | null;
  distance?: number | null; // en km
  isVerified?: boolean;
}

// Tipo para resultados de la API de ubicaciones (mismo que el buscador principal)
interface LocationSuggestion {
  id: string;
  name: string;
  type: string;
  typeName?: string;
  icon?: string;
  city?: string | null;
  state?: string | null;
  street?: string | null;
  housenumber?: string | null;
  postcode?: string | null;
  poiName?: string | null;
  fullAddress?: string;
  shortAddress?: string;
  lat?: number;
  lon?: number;
}

interface FixedRoutesManagerProps {
  /** Rutas iniciales */
  initialRoutes?: FixedRoute[];
  /** Callback cuando cambian las rutas */
  onRoutesChange?: (routes: FixedRoute[]) => void;
  /** Modo: create (registro), edit (dashboard) */
  mode?: "create" | "edit";
  /** Mostrar título del componente */
  showTitle?: boolean;
  /** Callback de error */
  onError?: (error: string) => void;
  /** Callback de éxito */
  onSuccess?: (message: string) => void;
  /** ID del conductor (necesario para modo edit) */
  driverId?: string;
}

// Componente de búsqueda de ubicaciones usando la MISMA API que el buscador principal
function LocationSearchInput({
  value,
  onSelect,
  placeholder,
  label,
}: {
  value: string;
  onSelect: (location: LocationSuggestion) => void;
  placeholder: string;
  label: string;
}) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sincronizar valor externo
  useEffect(() => {
    if (value !== query) {
      setQuery(value);
    }
  }, [value]);

  // Buscar ubicaciones usando la MISMA API que el buscador principal
  const searchLocations = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Usar la misma API que el buscador principal: /api/locations
      const response = await fetch(`/api/locations?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setSuggestions(data.data);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Error buscando ubicaciones:", error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce para la búsqueda
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (newQuery.length >= 2) {
      debounceRef.current = setTimeout(() => {
        searchLocations(newQuery);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Seleccionar ubicación
  const handleSelect = (location: LocationSuggestion) => {
    setQuery(location.shortAddress || location.name);
    setShowSuggestions(false);
    setSuggestions([]);
    onSelect(location);
  };

  // Limpiar
  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    onSelect({
      id: "",
      name: "",
      type: "address",
      lat: undefined,
      lon: undefined,
    });
  };

  return (
    <div ref={containerRef} className="relative">
      <Label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
        <MapPin className="h-3 w-3" />
        {label}
      </Label>
      <div className="relative">
        <Input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.length >= 2 && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className="pr-10"
        />
        {loading && (
          <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {query && (
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

      {/* Lista de sugerencias */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {suggestions.map((location, index) => (
            <button
              key={`${location.id}-${index}`}
              type="button"
              onClick={() => handleSelect(location)}
              className="w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors flex items-start gap-2"
            >
              <span className="text-lg flex-shrink-0">{location.icon || "📍"}</span>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm truncate">
                  {location.poiName || location.name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {location.shortAddress || location.fullAddress}
                </div>
                {location.typeName && (
                  <Badge variant="outline" className="text-xs h-4 mt-1">
                    {location.typeName}
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Sin resultados */}
      {showSuggestions && query.length >= 2 && !loading && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">
            No se encontraron ubicaciones. Intenta con otro término.
          </p>
        </div>
      )}
    </div>
  );
}

export default function FixedRoutesManager({
  initialRoutes = [],
  onRoutesChange,
  mode = "create",
  showTitle = true,
  onError,
  onSuccess,
  driverId,
}: FixedRoutesManagerProps) {
  const [routes, setRoutes] = useState<FixedRoute[]>(initialRoutes);
  const [newRoute, setNewRoute] = useState<FixedRoute>({
    origin: "",
    originLat: undefined,
    originLon: undefined,
    destination: "",
    destinationLat: undefined,
    destinationLon: undefined,
    price: undefined,
  });
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [estimatedDistance, setEstimatedDistance] = useState<number | null>(null);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);

  // Sincronizar con rutas iniciales
  useEffect(() => {
    if (initialRoutes && initialRoutes.length > 0) {
      setRoutes(initialRoutes);
    }
  }, [initialRoutes]);

  // Calcular distancia con OSRM cuando origen y destino están definidos
  useEffect(() => {
    const calculateRoute = async () => {
      if (
        newRoute.originLat &&
        newRoute.originLon &&
        newRoute.destinationLat &&
        newRoute.destinationLon
      ) {
        setCalculatingDistance(true);
        try {
          // Usar OSRM para calcular la distancia (mismo que el buscador principal)
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${newRoute.originLon},${newRoute.originLat};${newRoute.destinationLon},${newRoute.destinationLat}?overview=false`
          );
          const data = await response.json();

          if (data.code === "Ok" && data.routes && data.routes[0]) {
            const distanceKm = data.routes[0].distance / 1000;
            setEstimatedDistance(Math.round(distanceKm * 10) / 10);

            // Estimar precio (CHF 2.5/km + CHF 5 base como referencia)
            const estimatedTotal = Math.round((distanceKm * 2.5 + 5) * 10) / 10;
            setEstimatedPrice(estimatedTotal);
          }
        } catch (error) {
          console.error("Error calculando distancia:", error);
        } finally {
          setCalculatingDistance(false);
        }
      } else {
        setEstimatedDistance(null);
        setEstimatedPrice(null);
      }
    };

    const debounce = setTimeout(calculateRoute, 500);
    return () => clearTimeout(debounce);
  }, [
    newRoute.originLat,
    newRoute.originLon,
    newRoute.destinationLat,
    newRoute.destinationLon,
  ]);

  // Manejar selección de origen
  const handleOriginSelect = (location: LocationSuggestion) => {
    setNewRoute({
      ...newRoute,
      origin: location.shortAddress || location.name || "",
      originLat: location.lat,
      originLon: location.lon,
    });
  };

  // Manejar selección de destino
  const handleDestinationSelect = (location: LocationSuggestion) => {
    setNewRoute({
      ...newRoute,
      destination: location.shortAddress || location.name || "",
      destinationLat: location.lat,
      destinationLon: location.lon,
    });
  };

  // Añadir ruta
  const addRoute = () => {
    if (!newRoute.origin || !newRoute.destination) {
      onError?.("Debes especificar origen y destino");
      return;
    }

    const routeToAdd: FixedRoute = {
      ...newRoute,
      id: `route_${Date.now()}`,
      distance: estimatedDistance,
      isVerified: !!(newRoute.originLat && newRoute.destinationLat),
    };

    const updatedRoutes = [...routes, routeToAdd];
    setRoutes(updatedRoutes);
    onRoutesChange?.(updatedRoutes);

    // Reset form
    setNewRoute({
      origin: "",
      originLat: undefined,
      originLon: undefined,
      destination: "",
      destinationLat: undefined,
      destinationLon: undefined,
      price: undefined,
    });
    setEstimatedDistance(null);
    setEstimatedPrice(null);

    onSuccess?.("Ruta añadida correctamente");
  };

  // Eliminar ruta
  const removeRoute = (index: number) => {
    const updatedRoutes = routes.filter((_, i) => i !== index);
    setRoutes(updatedRoutes);
    onRoutesChange?.(updatedRoutes);
  };

  // Usar precio estimado
  const useEstimatedPrice = () => {
    if (estimatedPrice) {
      setNewRoute({ ...newRoute, price: estimatedPrice });
    }
  };

  // Seleccionar lugar popular (aeropuertos, estaciones)
  const selectPopularPlace = (place: { name: string; lat: number; lon: number }) => {
    setNewRoute({
      ...newRoute,
      destination: place.name,
      destinationLat: place.lat,
      destinationLon: place.lon,
    });
  };

  return (
    <Card className="border-border bg-card">
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Route className="h-5 w-5 text-yellow-400" />
            Rutas con precio fijo
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Define rutas populares con precios fijos. Usa el mismo buscador de direcciones que la página principal.
          </p>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {/* Formulario para añadir ruta */}
        <div className="space-y-4">
          {/* Origen y Destino - Usando la MISMA API que el buscador principal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LocationSearchInput
              value={newRoute.origin}
              onSelect={handleOriginSelect}
              placeholder="Buscar origen..."
              label="Origen"
            />
            <LocationSearchInput
              value={newRoute.destination}
              onSelect={handleDestinationSelect}
              placeholder="Buscar destino..."
              label="Destino"
            />
          </div>

          {/* Lugares populares */}
          <details className="text-sm">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />
              Lugares populares (aeropuertos, estaciones...)
            </summary>
            <div className="mt-3 space-y-3 p-3 bg-muted/30 rounded-lg">
              <div>
                <span className="text-xs text-muted-foreground">Aeropuertos:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {POPULAR_PLACES.airports.map((airport) => (
                    <Button
                      key={airport.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => selectPopularPlace(airport)}
                      className="text-xs h-7"
                    >
                      ✈️ {airport.code}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Estaciones de tren:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {POPULAR_PLACES.trainStations.slice(0, 8).map((station) => (
                    <Button
                      key={station.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => selectPopularPlace(station)}
                      className="text-xs h-7"
                    >
                      🚂 {station.nameDE}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </details>

          {/* Distancia y precio estimado */}
          {calculatingDistance && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Calculando distancia con OSRM...
            </div>
          )}

          {estimatedDistance !== null && !calculatingDistance && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-blue-400" />
                <span className="text-sm">
                  <strong>Distancia:</strong> {estimatedDistance} km
                </span>
              </div>
              {estimatedPrice && (
                <>
                  <Separator orientation="vertical" className="h-6 hidden sm:block" />
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-400" />
                    <span className="text-sm">
                      <strong>Precio estimado:</strong> CHF {estimatedPrice}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={useEstimatedPrice}
                      className="text-xs text-green-400 hover:text-green-300"
                    >
                      Usar
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Precio y botón añadir */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Precio fijo (CHF)
              </Label>
              <Input
                type="number"
                placeholder="Ej: 45"
                value={newRoute.price || ""}
                onChange={(e) =>
                  setNewRoute({ ...newRoute, price: parseFloat(e.target.value) || undefined })
                }
                min={0}
                step="0.1"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                onClick={addRoute}
                disabled={!newRoute.origin || !newRoute.destination}
                className="w-full sm:w-auto bg-yellow-400 text-black hover:bg-yellow-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Añadir ruta
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Lista de rutas existentes */}
        {routes.length > 0 ? (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Rutas configuradas ({routes.length})
            </Label>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {routes.map((route, index) => (
                <div
                  key={route.id || index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border hover:border-yellow-400/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                      <span className="font-medium truncate">{route.origin}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <MapPin className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                      <span className="font-medium truncate">{route.destination}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {route.distance && <span>{route.distance} km</span>}
                      {route.isVerified && (
                        <Badge variant="outline" className="text-xs h-5 border-green-500/50 text-green-400">
                          ✓ Verificada
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    {route.price && (
                      <span className="text-yellow-400 font-semibold whitespace-nowrap">
                        CHF {route.price}
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRoute(index)}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Route className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay rutas configuradas</p>
            <p className="text-xs mt-1">Añade rutas populares para mostrar precios fijos a tus clientes</p>
          </div>
        )}

        {/* Info box */}
        <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-400">
            💡 <strong>Consejo:</strong> Las rutas verificadas (con coordenadas exactas) permiten a los clientes ver el precio exacto antes de contactarte.
            El buscador usa la misma API que la página principal.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
