"use client";

import { useState, useEffect } from "react";
import {
  Route,
  Plus,
  X,
  Loader2,
  ArrowRight,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface DriverRoute {
  id: string;
  origin: string;
  destination: string;
  isActive: boolean;
}

interface RoutesManagerProps {
  driverId: string;
  baseCity: string;
}

export default function RoutesManager({ driverId, baseCity }: RoutesManagerProps) {
  const [routes, setRoutes] = useState<DriverRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [origin, setOrigin] = useState(baseCity);
  const [destination, setDestination] = useState("");

  // Fetch routes
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await fetch(`/api/driver/routes?driverId=${driverId}`);
        const data = await res.json();
        if (data.success) {
          setRoutes(data.routes);
        }
      } catch (error) {
        console.error("Error fetching routes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, [driverId]);

  // Add route
  const handleAddRoute = async () => {
    if (!origin.trim() || !destination.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/driver/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId,
          origin: origin.trim(),
          destination: destination.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRoutes([...routes, data.route]);
        setDestination("");
        setOrigin(baseCity);
      }
    } catch (error) {
      console.error("Error adding route:", error);
    } finally {
      setSaving(false);
    }
  };

  // Delete route
  const handleDeleteRoute = async (routeId: string) => {
    try {
      const res = await fetch(`/api/driver/routes?routeId=${routeId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setRoutes(routes.filter((r) => r.id !== routeId));
      }
    } catch (error) {
      console.error("Error deleting route:", error);
    }
  };

  // Toggle route
  const handleToggleRoute = async (routeId: string, isActive: boolean) => {
    try {
      const res = await fetch("/api/driver/routes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routeId, isActive }),
      });

      if (res.ok) {
        setRoutes(routes.map(r => r.id === routeId ? { ...r, isActive } : r));
      }
    } catch (error) {
      console.error("Error updating route:", error);
    }
  };

  // Extraer todos los destinos
  const allDestinations = [...new Set([
    baseCity,
    ...routes.filter(r => r.isActive).map(r => r.destination),
    ...routes.filter(r => r.isActive).map(r => r.origin)
  ])];

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
          <Route className="h-5 w-5 text-yellow-400" />
          Mis rutas habituales
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Añade las rutas que haces frecuentemente. Cuando estés en el origen con GPS activo, 
          aparecerás para clientes que quieran ir al destino.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Explicación clara */}
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 text-sm">
          <p className="text-blue-400 font-medium mb-2">💡 Ejemplo de cómo funciona:</p>
          <ul className="text-blue-300 space-y-1 text-xs">
            <li>• Añades ruta <strong>"Schaan → Aeropuerto Zúrich"</strong></li>
            <li>• Añades ruta <strong>"Buchs → Vaduz"</strong></li>
            <li>• Añades ruta <strong>"Sargans → Widnau"</strong></li>
            <li>• Si estás en <strong>Zúrich</strong> con GPS activo → apareces para clientes que quieran ir a <strong>Schaan, Buchs, Sargans o Widnau</strong></li>
          </ul>
        </div>

        {/* Rutas actuales */}
        {routes.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm">Rutas configuradas:</Label>
            {routes.map((route) => (
              <div
                key={route.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  route.isActive
                    ? "border-yellow-400/30 bg-yellow-400/5"
                    : "border-border bg-muted/20 opacity-50"
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{route.origin}</span>
                  <ArrowRight className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                  <span className="truncate font-medium">{route.destination}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleRoute(route.id, !route.isActive)}
                    className={route.isActive ? "text-green-500" : "text-muted-foreground"}
                  >
                    {route.isActive ? "✓" : "○"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRoute(route.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {routes.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Route className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tienes rutas configuradas</p>
          </div>
        )}

        <Separator />

        {/* Añadir nueva ruta */}
        <div className="space-y-3">
          <Label className="text-sm">Añadir nueva ruta:</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="origin" className="text-xs text-muted-foreground">Origen</Label>
              <Input
                id="origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Ej: Schaan, Zúrich..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="destination" className="text-xs text-muted-foreground">Destino *</Label>
              <Input
                id="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Ej: Aeropuerto Zúrich, Vaduz..."
                className="mt-1"
                onKeyDown={(e) => e.key === "Enter" && handleAddRoute()}
              />
            </div>
          </div>
          <Button
            onClick={handleAddRoute}
            disabled={saving || !destination.trim()}
            className="w-full bg-yellow-400 text-black hover:bg-yellow-500"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Añadir ruta
          </Button>
        </div>

        {/* Resumen de destinos */}
        {allDestinations.length > 0 && (
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground mb-2">
              <strong>Tus destinos:</strong> Aparecerás para clientes que quieran ir a:
            </p>
            <div className="flex flex-wrap gap-1">
              {allDestinations.map((dest) => (
                <Badge key={dest} variant="secondary" className="text-xs">
                  {dest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Rutas sugeridas */}
        <details className="group">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
            <span className="text-xs group-open:rotate-180 transition-transform">▼</span>
            Rutas comunes (clic para añadir)
          </summary>
          
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              { o: baseCity, d: "Aeropuerto Zúrich" },
              { o: "Aeropuerto Zúrich", d: baseCity },
              { o: baseCity, d: "Vaduz" },
              { o: baseCity, d: "Buchs" },
              { o: "Buchs", d: "Sargans" },
              { o: "Sargans", d: "Widnau" },
              { o: "Widnau", d: "Oberriet" },
              { o: baseCity, d: "Zúrich Centro" },
            ].filter(r => !routes.some(existing => existing.origin === r.o && existing.destination === r.d))
             .slice(0, 6)
             .map((r, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => {
                  setOrigin(r.o);
                  setDestination(r.d);
                }}
                className="text-xs justify-start"
              >
                {r.o} → {r.d}
              </Button>
            ))}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
