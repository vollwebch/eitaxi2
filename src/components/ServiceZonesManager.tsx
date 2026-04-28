"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  Plus,
  X,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ServiceZonesManagerProps {
  driverId: string;
  baseCity: string;
  currentZones: string[];
  onUpdate: (zones: string[]) => void;
}

export default function ServiceZonesManager({ 
  driverId, 
  baseCity, 
  currentZones,
  onUpdate 
}: ServiceZonesManagerProps) {
  const [zones, setZones] = useState<string[]>(currentZones);
  const [newZone, setNewZone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setZones(currentZones);
  }, [currentZones]);

  // Zonas sugeridas según la región
  const suggestedZones = getZonesForRegion(baseCity);

  const addZone = async (zone: string) => {
    if (!zone.trim() || zones.includes(zone.trim())) return;
    
    const newZones = [...zones, zone.trim()];
    setZones(newZones);
    setNewZone("");
    
    // Guardar en backend
    setSaving(true);
    try {
      await fetch("/api/driver/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId,
          serviceZones: newZones,
        }),
      });
      onUpdate(newZones);
    } catch (error) {
      console.error("Error saving zones:", error);
    } finally {
      setSaving(false);
    }
  };

  const removeZone = async (zone: string) => {
    const newZones = zones.filter(z => z !== zone);
    setZones(newZones);
    
    setSaving(true);
    try {
      await fetch("/api/driver/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId,
          serviceZones: newZones,
        }),
      });
      onUpdate(newZones);
    } catch (error) {
      console.error("Error saving zones:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-yellow-400" />
          Mis zonas de trabajo
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Define dónde trabajas normalmente. Cuando estés fuera de tu zona, 
          aparecerás para clientes que quieran ir a estas zonas.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Explicación */}
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 text-sm">
          <p className="text-blue-400 font-medium mb-2">💡 ¿Cómo funciona?</p>
          <ul className="text-blue-300 space-y-1 text-xs">
            <li>• <strong>Tu base:</strong> {baseCity} → Siempre apareces para clientes en tu zona</li>
            <li>• <strong>Fuera de zona:</strong> Si estás en Zúrich, solo aparecerás para clientes que quieran ir a {zones.length > 0 ? zones.slice(0,2).join(' o ') : baseCity}</li>
            <li>• <strong>Ejemplo:</strong> Un cliente en Zúrich que quiera ir a {baseCity} te verá</li>
          </ul>
        </div>

        {/* Zona base (siempre incluida) */}
        <div className="flex items-center gap-2">
          <Badge className="bg-yellow-400 text-black">
            <MapPin className="h-3 w-3 mr-1" />
            {baseCity} (base)
          </Badge>
          <span className="text-xs text-muted-foreground">Siempre incluida</span>
        </div>

        {/* Zonas añadidas */}
        {zones.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {zones.map((zone) => (
              <Badge 
                key={zone} 
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                {zone}
                <button
                  onClick={() => removeZone(zone)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <Separator />

        {/* Añadir zona */}
        <div className="flex gap-2">
          <Input
            value={newZone}
            onChange={(e) => setNewZone(e.target.value)}
            placeholder="Ej: Buchs, Sargans, Vaduz..."
            onKeyDown={(e) => e.key === "Enter" && addZone(newZone)}
            className="flex-1"
          />
          <Button
            onClick={() => addZone(newZone)}
            disabled={!newZone.trim() || saving}
            className="bg-yellow-400 text-black hover:bg-yellow-500"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>

        {/* Zonas sugeridas */}
        <details className="group">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Zonas cercanas sugeridas
            <span className="text-xs group-open:rotate-180 transition-transform">▼</span>
          </summary>
          
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestedZones.filter(z => z !== baseCity && !zones.includes(z)).map((zone) => (
              <Button
                key={zone}
                variant="outline"
                size="sm"
                onClick={() => addZone(zone)}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                {zone}
              </Button>
            ))}
          </div>
        </details>

        {/* Resumen */}
        <div className="p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
          <strong>Total:</strong> {zones.length + 1} zona{zones.length !== 0 ? 's' : ''} de trabajo
          <br />
          <span className="text-muted-foreground/70">
            {baseCity}{zones.length > 0 ? `, ${zones.join(', ')}` : ''}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// Zonas sugeridas según región
function getZonesForRegion(baseCity: string): string[] {
  // Zonas comunes para Liechtenstein/Rheintal
  const liechtensteinZones = ["Vaduz", "Schaan", "Triesen", "Balzers", "Nendeln", "Bendern"];
  
  // Zonas comunes para Rheintal Suizo
  const rheintalZones = ["Buchs", "Sargans", "Walenstadt", "Sevelen", "Trübbach", "Azmoos", "Grabs", "Gams"];
  
  // Ciudades principales
  const majorCities = ["Zúrich", "Aeropuerto Zúrich", "Basilea", "Ginebra", "Berna", "Lucerna"];
  
  // Combinar todas
  const allZones = [...new Set([...liechtensteinZones, ...rheintalZones, ...majorCities])];
  
  // Si la base está en Liechtenstein, priorizar zonas cercanas
  if (liechtensteinZones.some(z => baseCity.toLowerCase().includes(z.toLowerCase()))) {
    return [...liechtensteinZones, ...rheintalZones, ...majorCities];
  }
  
  return allZones;
}
