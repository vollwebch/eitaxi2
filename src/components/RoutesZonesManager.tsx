"use client";

import { useState, useEffect } from "react";
import {
  Route,
  Plus,
  X,
  Loader2,
  MapPin,
  Globe,
  ArrowRightLeft,
  Plane,
  Train,
  Mountain,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { POPULAR_PLACES } from "@/lib/geo-data";
import { useTranslations } from 'next-intl';
import ZoneSelector, { ServiceZone } from "@/components/ZoneSelector";
import PlaceSearch, { PlaceResult } from "@/components/PlaceSearch";

interface DriverRoute {
  id: string;
  origin: string;
  destination: string;
  originType: string;
  destType: string;
  isActive: boolean;
}

interface RoutesZonesManagerProps {
  driverId: string;
  baseCity: string;
  baseCanton: string;
  onZonesChange?: (zones: ServiceZone[]) => void;
}

export default function RoutesZonesManager({ driverId, baseCity, baseCanton, onZonesChange }: RoutesZonesManagerProps) {
  const [zones, setZones] = useState<ServiceZone[]>([]);
  const [routes, setRoutes] = useState<DriverRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"zones" | "routes">("zones");
  const tBooking = useTranslations('booking');
  const tServices = useTranslations('services');

  // Form state for routes
  const [newOrigin, setNewOrigin] = useState("");
  const [newOriginType, setNewOriginType] = useState("city");
  const [newDestination, setNewDestination] = useState("");
  const [newDestType, setNewDestType] = useState("city");

  // Fetch zones and routes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [zonesRes, routesRes] = await Promise.all([
          fetch(`/api/driver/zones?driverId=${driverId}`),
          fetch(`/api/driver/routes?driverId=${driverId}`),
        ]);

        const zonesData = await zonesRes.json();
        const routesData = await routesRes.json();

        if (zonesData.success) {
          setZones(zonesData.zones);
          if (onZonesChange) onZonesChange(zonesData.zones);
        }
        if (routesData.success) setRoutes(routesData.routes);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId]); // onZonesChange removido para evitar bucle infinito

  // Add route
  const handleAddRoute = async () => {
    if (!newOrigin || !newDestination) return;

    try {
      const res = await fetch("/api/driver/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId,
          origin: newOrigin,
          destination: newDestination,
          originType: newOriginType,
          destType: newDestType,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRoutes([...routes, data.route]);
        setNewOrigin("");
        setNewDestination("");
      }
    } catch (error) {
      console.error("Error adding route:", error);
    }
  };

  // Delete route
  const handleDeleteRoute = async (routeId: string) => {
    try {
      const res = await fetch(`/api/driver/routes/${routeId}?driverId=${driverId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        setRoutes(routes.filter((r) => r.id !== routeId));
      }
    } catch (error) {
      console.error("Error deleting route:", error);
    }
  };

  // Get icon for place type
  const getPlaceIcon = (type: string) => {
    switch (type) {
      case "airport":
        return <Plane className="h-4 w-4" />;
      case "train_station":
        return <Train className="h-4 w-4" />;
      case "mountain":
        return <Mountain className="h-4 w-4" />;
      case "city":
      default:
        return <Building className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-yellow-400" />
          Zonas y Rutas
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Define dónde trabajas y qué rutas haces. Los clientes te encontrarán según estas zonas.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tab selector */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === "zones" ? "default" : "outline"}
            onClick={() => setActiveTab("zones")}
            className={activeTab === "zones" ? "bg-yellow-400 text-black" : ""}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Zonas de servicio
          </Button>
          <Button
            variant={activeTab === "routes" ? "default" : "outline"}
            onClick={() => setActiveTab("routes")}
            className={activeTab === "routes" ? "bg-yellow-400 text-black" : ""}
          >
            <Route className="h-4 w-4 mr-2" />
            Rutas específicas
          </Button>
        </div>

        {/* ZONES TAB - Using Shared Component */}
        {/* Usar mode="register" para que NO guarde directamente, solo actualice estado */}
        {activeTab === "zones" && (
          <ZoneSelector
            initialZones={zones}
            onZonesChange={(newZones) => {
              setZones(newZones);
              if (onZonesChange) onZonesChange(newZones);
            }}
            baseCity={baseCity}
            mode="register"
          />
        )}

        {/* ROUTES TAB */}
        {activeTab === "routes" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-yellow-400" />
                Rutas específicas
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Define rutas específicas que ofreces con regularidad.
              </p>
            </div>

            {/* Existing routes */}
            {routes.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Tus rutas:</Label>
                <div className="space-y-2">
                  {routes.map((route) => (
                    <div
                      key={route.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border"
                    >
                      <div className="flex items-center gap-2">
                        {getPlaceIcon(route.originType)}
                        <span className="font-medium">{route.origin}</span>
                        <span className="text-muted-foreground">→</span>
                        {getPlaceIcon(route.destType)}
                        <span className="font-medium">{route.destination}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRoute(route.id)}
                        className="text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Add new route */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Añadir nueva ruta:</Label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Origin */}
                <div>
                  <Label className="text-xs text-muted-foreground">Origen</Label>
                  <div className="flex gap-2 mt-1">
                    <Select value={newOriginType} onValueChange={setNewOriginType}>
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="city">{tServices('city')}</SelectItem>
                        <SelectItem value="airport">{tServices('airport')}</SelectItem>
                        <SelectItem value="train_station">Estación</SelectItem>
                        <SelectItem value="place">Lugar</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Ej: Vaduz"
                      value={newOrigin}
                      onChange={(e) => setNewOrigin(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Destination */}
                <div>
                  <Label className="text-xs text-muted-foreground">{tBooking('destination')}</Label>
                  <div className="flex gap-2 mt-1">
                    <Select value={newDestType} onValueChange={setNewDestType}>
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="city">{tServices('city')}</SelectItem>
                        <SelectItem value="airport">{tServices('airport')}</SelectItem>
                        <SelectItem value="train_station">Estación</SelectItem>
                        <SelectItem value="place">Lugar</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Ej: Aeropuerto Zúrich"
                      value={newDestination}
                      onChange={(e) => setNewDestination(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Popular places quick select */}
              <details className="mt-4">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  📍 Lugares populares (aeropuertos, estaciones...)
                </summary>
                <div className="mt-3 space-y-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Aeropuertos:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {POPULAR_PLACES.airports.map((airport) => (
                        <Button
                          key={airport.id}
                          variant="outline"
                          size="sm"
                          onClick={() => setNewDestination(airport.name)}
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
                      {POPULAR_PLACES.trainStations.slice(0, 6).map((station) => (
                        <Button
                          key={station.id}
                          variant="outline"
                          size="sm"
                          onClick={() => setNewDestination(station.name)}
                          className="text-xs h-7"
                        >
                          🚂 {station.nameDE}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </details>

              <Button
                onClick={handleAddRoute}
                disabled={!newOrigin || !newDestination}
                className="w-full bg-yellow-400 text-black hover:bg-yellow-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Añadir ruta
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
