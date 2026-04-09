"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  MapPin,
  Globe,
  AlertCircle,
  Search,
  X,
  Plus,
  Edit3,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
  SWISS_CANTONS,
  LIECHTENSTEIN,
  getMunicipalitiesByCanton,
  getMunicipalitiesByDistrict,
} from "@/lib/geo-data";

// Tipos
export interface ServiceZone {
  id?: string;
  zoneName: string;
  zoneType: string;
  zoneMode: "pickup" | "service";
  exclusions: string[];
}

interface ZoneSelectorProps {
  // Estado inicial de zonas (para edición)
  initialZones?: ServiceZone[];
  // Callback cuando cambian las zonas
  onZonesChange?: (zones: ServiceZone[]) => void;
  // Mostrar error de validación
  validationError?: boolean;
  // Ciudad base para sugerencias rápidas
  baseCity?: string;
  // Modo: 'register' para registro nuevo, 'dashboard' para dashboard
  mode?: "register" | "dashboard";
  // Para dashboard: driverId para cargar zonas existentes
  driverId?: string;
}

export default function ZoneSelector({
  initialZones = [],
  onZonesChange,
  validationError = false,
  baseCity = "Vaduz",
  mode = "register",
  driverId,
}: ZoneSelectorProps) {
  // Estado local de zonas
  const [zones, setZones] = useState<ServiceZone[]>(initialZones);
  const [loading, setLoading] = useState(false);

  // Estado para añadir nueva zona
  const [selectedCanton, setSelectedCanton] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>("");
  const [newZoneMode, setNewZoneMode] = useState<"pickup" | "service">("pickup");
  const [customZoneName, setCustomZoneName] = useState("");
  const [newExclusions, setNewExclusions] = useState<string[]>([]);
  const [exclusionSearchTerm, setExclusionSearchTerm] = useState("");

  // Estado para editar exclusiones
  const [editingZone, setEditingZone] = useState<ServiceZone | null>(null);
  const [editExclusions, setEditExclusions] = useState<string[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSearchTerm, setEditSearchTerm] = useState("");

  // Estado para cantones expandidos (vista detallada)
  const [expandedCantons, setExpandedCantons] = useState<Set<string>>(new Set());

  // Ref para el selector de cantón (para hacer focus después de añadir zona)
  const cantonSelectRef = useRef<HTMLButtonElement>(null);

  // Mensaje de estado
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Cargar zonas existentes si estamos en modo dashboard
  useEffect(() => {
    if (mode === "dashboard" && driverId) {
      setLoading(true);
      fetch(`/api/driver/zones?driverId=${driverId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.zones) {
            setZones(data.zones);
            if (onZonesChange) onZonesChange(data.zones);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else if (initialZones.length > 0) {
      setZones(initialZones);
    }
  }, [driverId, mode]);

  // Notificar cambios al padre
  const updateZones = (newZones: ServiceZone[]) => {
    setZones(newZones);
    if (onZonesChange) onZonesChange(newZones);
  };

  // Distritos disponibles según cantón seleccionado
  const availableDistricts = useMemo(() => {
    if (selectedCanton === "liechtenstein") {
      return [];
    }
    if (selectedCanton) {
      const canton = SWISS_CANTONS.find((c) => c.id === selectedCanton);
      return canton?.districts || [];
    }
    return [];
  }, [selectedCanton]);

  // Municipios disponibles según distrito seleccionado (para selector de zona)
  const availableMunicipalities = useMemo(() => {
    if (selectedCanton === "liechtenstein") {
      return LIECHTENSTEIN.municipalities;
    }
    if (selectedDistrict && selectedDistrict !== "__all__") {
      return getMunicipalitiesByDistrict(selectedCanton, selectedDistrict);
    }
    return [];
  }, [selectedCanton, selectedDistrict]);

  // Municipios para exclusiones - FILTRADO EN CASCADA
  // Si se selecciona un distrito específico → solo municipios de ese distrito
  // Si se selecciona "Todo el cantón" → todos los municipios del cantón
  const municipalitiesForExclusion = useMemo(() => {
    if (selectedCanton === "liechtenstein") {
      return LIECHTENSTEIN.municipalities;
    }
    if (selectedCanton) {
      // Si hay un distrito específico seleccionado, mostrar solo esos municipios
      if (selectedDistrict && selectedDistrict !== "__all__") {
        return getMunicipalitiesByDistrict(selectedCanton, selectedDistrict);
      }
      // Si no hay distrito seleccionado o es "Todo el cantón", mostrar todos
      return getMunicipalitiesByCanton(selectedCanton);
    }
    return [];
  }, [selectedCanton, selectedDistrict]);

  // Municipios filtrados por búsqueda (para nueva zona)
  const filteredMunicipalities = useMemo(() => {
    if (!exclusionSearchTerm) return municipalitiesForExclusion;
    return municipalitiesForExclusion.filter((m: string) =>
      m.toLowerCase().includes(exclusionSearchTerm.toLowerCase())
    );
  }, [municipalitiesForExclusion, exclusionSearchTerm]);

  // Municipios filtrados por búsqueda (para editar)
  // También considera si la zona es de un cantón entero o un distrito específico
  const filteredEditMunicipalities = useMemo(() => {
    if (!editingZone) return [];

    let municipalities: string[] = [];

    // Caso 1: Liechtenstein
    if (editingZone.zoneName.toLowerCase().includes("liechtenstein")) {
      municipalities = LIECHTENSTEIN.municipalities;
    }
    // Caso 2: Es un distrito específico
    else if (editingZone.zoneType === "district") {
      // Buscar el distrito en todos los cantones
      for (const canton of SWISS_CANTONS) {
        const district = canton.districts.find(
          (d) =>
            d.name === editingZone.zoneName ||
            d.nameDE === editingZone.zoneName ||
            d.id === editingZone.zoneName
        );
        if (district) {
          municipalities = district.municipalities;
          break;
        }
      }
    }
    // Caso 3: Es un cantón entero
    else {
      const canton = SWISS_CANTONS.find(
        (c) =>
          c.name === editingZone.zoneName ||
          c.nameDE === editingZone.zoneName ||
          c.code.toLowerCase() === editingZone.zoneName.toLowerCase().replace(/[^a-z]/g, "")
      );
      if (canton) {
        municipalities = getMunicipalitiesByCanton(canton.id);
      }
    }

    if (!editSearchTerm) return municipalities;
    return municipalities.filter((m) =>
      m.toLowerCase().includes(editSearchTerm.toLowerCase())
    );
  }, [editingZone, editSearchTerm]);

  // Zonas de recogida
  const pickupZones = useMemo(
    () => zones.filter((z) => z.zoneMode === "pickup"),
    [zones]
  );

  // Zonas de destino
  const serviceZones = useMemo(
    () => zones.filter((z) => z.zoneMode === "service"),
    [zones]
  );

  // Obtener tipo de zona
  const getZoneType = (): string => {
    if (customZoneName) return "region";
    if (selectedMunicipality && selectedMunicipality !== "__all__") return "municipality";
    if (selectedDistrict && selectedDistrict !== "__all__") return "district";
    return "canton";
  };

  // Obtener nombre de zona
  const getZoneName = (): string => {
    if (customZoneName) return customZoneName;
    if (selectedMunicipality && selectedMunicipality !== "__all__") return selectedMunicipality;
    if (selectedDistrict === "__all__" || !selectedDistrict) {
      if (selectedCanton === "liechtenstein") return "Liechtenstein";
      const canton = SWISS_CANTONS.find((c) => c.id === selectedCanton);
      return canton?.name || "";
    }
    const district = availableDistricts.find((d) => d.id === selectedDistrict);
    return district?.name || "";
  };

  // Toggle expansión de cantón
  const toggleCantonExpansion = (cantonId: string) => {
    const newExpanded = new Set(expandedCantons);
    if (newExpanded.has(cantonId)) {
      newExpanded.delete(cantonId);
    } else {
      newExpanded.add(cantonId);
    }
    setExpandedCantons(newExpanded);
  };

  // Añadir zona rápida
  const quickAddZone = (
    name: string,
    type: string,
    zoneMode: "pickup" | "service"
  ) => {
    if (zones.find((z) => z.zoneName === name && z.zoneMode === zoneMode)) {
      setMessage({ type: "error", text: "Esta zona ya existe" });
      return;
    }

    const newZone: ServiceZone = {
      zoneName: name,
      zoneType: type,
      zoneMode,
      exclusions: [],
    };

    updateZones([...zones, newZone]);
    setMessage({ type: "success", text: `Zona "${name}" añadida` });
    setTimeout(() => setMessage(null), 3000);
  };

  // Añadir zona personalizada
  const handleAddZone = async () => {
    const zoneName = getZoneName();
    if (!zoneName) return;

    if (zones.find((z) => z.zoneName === zoneName && z.zoneMode === newZoneMode)) {
      setMessage({ type: "error", text: "Esta zona ya existe" });
      return;
    }

    const newZone: ServiceZone = {
      zoneName,
      zoneType: getZoneType(),
      zoneMode: newZoneMode,
      exclusions: newExclusions,
    };

    // Si estamos en modo dashboard, guardar en API
    if (mode === "dashboard" && driverId) {
      setLoading(true);
      try {
        const res = await fetch("/api/driver/zones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ driverId, ...newZone }),
        });
        const data = await res.json();
        if (data.success && data.zone) {
          updateZones([...zones, data.zone]);
          setMessage({ type: "success", text: `Zona "${zoneName}" añadida` });
        } else {
          setMessage({ type: "error", text: data.error || "Error al guardar" });
        }
      } catch {
        setMessage({ type: "error", text: "Error de conexión" });
      } finally {
        setLoading(false);
      }
    } else {
      updateZones([...zones, newZone]);
      setMessage({ type: "success", text: `Zona "${zoneName}" añadida` });
    }

    // Reset completo del formulario para permitir añadir múltiples zonas rápidamente
    setSelectedCanton("");
    setSelectedDistrict("");
    setSelectedMunicipality("");
    setNewExclusions([]);
    setCustomZoneName("");
    setExclusionSearchTerm("");
    
    // Hacer focus en el selector de cantón para la siguiente zona
    setTimeout(() => {
      cantonSelectRef.current?.focus();
    }, 100);
    
    setTimeout(() => setMessage(null), 3000);
  };

  // Eliminar zona
  const handleDeleteZone = async (zoneId: string | undefined, index: number) => {
    if (mode === "dashboard" && zoneId) {
      setLoading(true);
      try {
        const res = await fetch(`/api/driver/zones?zoneId=${zoneId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.success) {
          updateZones(zones.filter((_, i) => i !== index));
          setMessage({ type: "success", text: "Zona eliminada" });
        } else {
          setMessage({ type: "error", text: data.error || "Error al eliminar" });
        }
      } catch {
        setMessage({ type: "error", text: "Error de conexión" });
      } finally {
        setLoading(false);
      }
    } else {
      updateZones(zones.filter((_, i) => i !== index));
      setMessage({ type: "success", text: "Zona eliminada" });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  // Guardar exclusiones editadas
  const handleSaveExclusions = async () => {
    if (!editingZone) return;

    const zoneIndex = zones.findIndex(
      (z) => z.zoneName === editingZone.zoneName && z.zoneMode === editingZone.zoneMode
    );
    if (zoneIndex === -1) return;

    const updatedZones = [...zones];
    updatedZones[zoneIndex] = { ...editingZone, exclusions: editExclusions };

    if (mode === "dashboard" && editingZone.id) {
      setLoading(true);
      try {
        const res = await fetch("/api/driver/zones", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            zoneId: editingZone.id, 
            driverId,
            exclusions: editExclusions 
          }),
        });
        const data = await res.json();
        if (data.success) {
          updateZones(updatedZones);
          setMessage({ type: "success", text: "Exclusiones actualizadas" });
        } else {
          setMessage({ type: "error", text: data.error || "Error al guardar" });
        }
      } catch {
        setMessage({ type: "error", text: "Error de conexión" });
      } finally {
        setLoading(false);
      }
    } else {
      updateZones(updatedZones);
      setMessage({ type: "success", text: "Exclusiones actualizadas" });
    }

    setShowEditModal(false);
    setEditingZone(null);
    setEditExclusions([]);
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Mensaje de estado */}
      {message && (
        <div
          className={`p-3 rounded-lg border text-sm ${
            message.type === "success"
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {message.type === "success" ? "✓ " : "⚠ "}
          {message.text}
        </div>
      )}

      {/* Error de validación */}
      {validationError && pickupZones.length === 0 && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-sm text-red-400 font-medium">
            ⚠️ Debes añadir al menos una zona de RECOGIDA (pickup)
          </p>
          <p className="text-xs text-red-400/80 mt-1">
            Sin zonas de recogida, los clientes no podrán encontrarte.
          </p>
        </div>
      )}

      {/* ZONAS DE RECOGIDA */}
      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-5 w-5 text-green-400" />
          <h3 className="font-semibold text-green-400">¿Desde dónde vas a buscar clientes?</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Los clientes de estas zonas te verán cuando busquen un taxi.
        </p>

        {/* Lista de zonas de recogida */}
        {pickupZones.length > 0 && (
          <div className="space-y-2 mb-3">
            <Label className="text-xs text-green-400">Tus zonas de recogida:</Label>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {pickupZones.map((zone, index) => (
                <div
                  key={zone.id || index}
                  className="flex items-center justify-between p-2 rounded bg-green-500/10 border border-green-500/20"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-xs border-green-500 text-green-400"
                    >
                      {zone.zoneType}
                    </Badge>
                    <span className="text-sm">{zone.zoneName}</span>
                    {zone.exclusions.length > 0 && (
                      <span className="text-xs text-red-400">❌ {zone.exclusions.length}</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingZone(zone);
                        setEditExclusions([...zone.exclusions]);
                        setShowEditModal(true);
                      }}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteZone(zone.id, zones.indexOf(zone))}
                      className="text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Añadir rápido zonas de recogida */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => quickAddZone("Liechtenstein", "country", "pickup")}
            className="text-xs border-green-500/50 text-green-400 hover:bg-green-500/10"
          >
            + Liechtenstein
          </Button>
          {SWISS_CANTONS.slice(0, 6).map((canton) => (
            <Button
              key={canton.id}
              variant="outline"
              size="sm"
              onClick={() => quickAddZone(canton.name, "canton", "pickup")}
              className="text-xs border-green-500/50 text-green-400 hover:bg-green-500/10"
            >
              + {canton.code}
            </Button>
          ))}
        </div>
      </div>

      {/* ZONAS DE DESTINO */}
      <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="h-5 w-5 text-yellow-400" />
          <h3 className="font-semibold text-yellow-400">🎯 ¿A dónde llevas a tus clientes?</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Aparecerás para viajes que terminen en estas zonas.
        </p>

        {/* Lista de zonas de destino */}
        {serviceZones.length > 0 && (
          <div className="space-y-2 mb-3">
            <Label className="text-xs text-yellow-400">Tus zonas de destino:</Label>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {serviceZones.map((zone, index) => (
                <div
                  key={zone.id || index}
                  className="flex items-center justify-between p-2 rounded bg-yellow-500/10 border border-yellow-500/20"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-xs border-yellow-500 text-yellow-400"
                    >
                      {zone.zoneType}
                    </Badge>
                    <span className="text-sm">{zone.zoneName}</span>
                    {zone.exclusions.length > 0 && (
                      <span className="text-xs text-red-400">❌ {zone.exclusions.length}</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingZone(zone);
                        setEditExclusions([...zone.exclusions]);
                        setShowEditModal(true);
                      }}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteZone(zone.id, zones.indexOf(zone))}
                      className="text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Añadir rápido zonas de destino */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => quickAddZone("Liechtenstein", "country", "service")}
            className="text-xs border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
          >
            + Liechtenstein
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => quickAddZone("Aeropuerto Zúrich", "place", "service")}
            className="text-xs border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
          >
            + Aeropuerto Zúrich
          </Button>
          {SWISS_CANTONS.slice(0, 4).map((canton) => (
            <Button
              key={canton.id}
              variant="outline"
              size="sm"
              onClick={() => quickAddZone(canton.name, "canton", "service")}
              className="text-xs border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
            >
              + {canton.code}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* AÑADIR ZONA PERSONALIZADA */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Añadir zona personalizada:</Label>

        {/* Selector de modo */}
        <div className="flex gap-2">
          <Button
            variant={newZoneMode === "pickup" ? "default" : "outline"}
            size="sm"
            onClick={() => setNewZoneMode("pickup")}
            className={
              newZoneMode === "pickup"
                ? "bg-green-500 text-white"
                : "border-green-500/50 text-green-400"
            }
          >
            <MapPin className="h-3 w-3 mr-1" />
            Zona de recogida
          </Button>
          <Button
            variant={newZoneMode === "service" ? "default" : "outline"}
            size="sm"
            onClick={() => setNewZoneMode("service")}
            className={
              newZoneMode === "service"
                ? "bg-yellow-500 text-black"
                : "border-yellow-500/50 text-yellow-400"
            }
          >
            <Globe className="h-3 w-3 mr-1" />
            Zona de destino
          </Button>
        </div>

        {/* Selectores jerárquicos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Cantón */}
          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Cantón / País
            </Label>
            <Select
              value={selectedCanton}
              onValueChange={(v) => {
                setSelectedCanton(v);
                setSelectedDistrict("");
                setSelectedMunicipality("");
                setNewExclusions([]);
              }}
            >
              <SelectTrigger ref={cantonSelectRef} className="mt-1">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="liechtenstein">🇱🇮 Liechtenstein</SelectItem>
                {SWISS_CANTONS.map((canton) => (
                  <SelectItem key={canton.id} value={canton.id}>
                    {canton.name} ({canton.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Distrito */}
          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Distrito / Región
            </Label>
            <Select
              value={selectedDistrict}
              onValueChange={(v) => {
                setSelectedDistrict(v);
                setSelectedMunicipality("");
                setNewExclusions([]);
              }}
              disabled={!selectedCanton || selectedCanton === "liechtenstein"}
            >
              <SelectTrigger className="mt-1">
                <SelectValue
                  placeholder={
                    selectedCanton === "liechtenstein"
                      ? "No aplica"
                      : selectedCanton
                      ? "Todo el cantón"
                      : "Selecciona cantón"
                  }
                />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="__all__">Todo el cantón</SelectItem>
                {availableDistricts.map((district) => (
                  <SelectItem key={district.id} value={district.id}>
                    {district.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Municipio */}
          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Municipio
            </Label>
            <Select
              value={selectedMunicipality}
              onValueChange={setSelectedMunicipality}
              disabled={
                !selectedCanton ||
                selectedCanton === "liechtenstein" ||
                !selectedDistrict ||
                selectedDistrict === "__all__"
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue
                  placeholder={
                    selectedCanton === "liechtenstein"
                      ? "No aplica"
                      : selectedDistrict && selectedDistrict !== "__all__"
                      ? "Todo el distrito"
                      : "Selecciona distrito"
                  }
                />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="__all__">Todo el distrito</SelectItem>
                {availableMunicipalities.map((municipality) => (
                  <SelectItem key={municipality} value={municipality}>
                    {municipality}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Zona personalizada */}
        <div>
          <Label className="text-xs text-muted-foreground">O escribe una zona personalizada:</Label>
          <Input
            placeholder="Ej: Región del Rin, Zona fronteriza..."
            value={customZoneName}
            onChange={(e) => setCustomZoneName(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Preview */}
        {(selectedCanton || customZoneName) && (
          <div className="p-3 rounded-lg bg-muted/30 border border-dashed">
            <Label className="text-xs text-muted-foreground">Zona a añadir:</Label>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className={
                  newZoneMode === "pickup"
                    ? "border-green-500 text-green-400"
                    : "border-yellow-500 text-yellow-400"
                }
              >
                {newZoneMode === "pickup" ? "Recogida" : "Destino"}
              </Badge>
              <Badge variant="outline">{getZoneType()}</Badge>
              <span className="font-medium">{getZoneName()}</span>
            </div>
          </div>
        )}

        {/* EXCLUSIONES */}
        {(selectedCanton || customZoneName) && (
          <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Excluir lugares específicos
              </Label>
              {newExclusions.length > 0 && (
                <Badge
                  variant="outline"
                  className="bg-red-500/20 border-red-500/40 text-red-300"
                >
                  {newExclusions.length} seleccionados
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Haz clic en los municipios que NO quieres atender. Los excluidos tendrán PRIORIDAD
              ABSOLUTA.
            </p>

            {!selectedCanton && customZoneName && (
              <p className="text-xs text-amber-400 bg-amber-500/10 p-2 rounded">
                ⚠️ Selecciona un cantón del desplegable para ver los municipios disponibles para
                excluir.
              </p>
            )}

            {selectedCanton && (
              <>
                {/* Búsqueda */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar municipio..."
                    value={exclusionSearchTerm}
                    onChange={(e) => setExclusionSearchTerm(e.target.value)}
                    className="pl-10 h-9 text-sm"
                  />
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewExclusions([...municipalitiesForExclusion])}
                    className="text-xs h-7 border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    Seleccionar todos ({municipalitiesForExclusion.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewExclusions([])}
                    className="text-xs h-7 border-gray-500/30 text-gray-400 hover:bg-gray-500/10"
                  >
                    Limpiar selección
                  </Button>
                </div>

                {/* Grid de municipios */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    {selectedCanton === "liechtenstein"
                      ? `Municipios de Liechtenstein (${filteredMunicipalities.length})`
                      : `Municipios del cantón (${filteredMunicipalities.length})`}
                    :
                  </Label>
                  <div className="max-h-64 overflow-y-auto border rounded-lg p-2 bg-background">
                    {filteredMunicipalities.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No se encontraron municipios con ese nombre.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {filteredMunicipalities.map((place) => {
                          const isExcluded = newExclusions.includes(place);
                          return (
                            <button
                              key={place}
                              type="button"
                              onClick={() => {
                                if (isExcluded) {
                                  setNewExclusions(newExclusions.filter((p) => p !== place));
                                } else {
                                  setNewExclusions([...newExclusions, place]);
                                }
                              }}
                              className={`px-2 py-1 text-xs rounded-md border transition-all duration-150 cursor-pointer
                                ${
                                  isExcluded
                                    ? "bg-red-500 border-red-600 text-white shadow-sm"
                                    : "bg-background border-gray-300 text-slate-900 dark:text-slate-100 hover:border-red-400 hover:bg-red-500/10"
                                }`}
                            >
                              {isExcluded && <X className="inline h-3 w-3 mr-0.5" />}
                              {place}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Botón añadir */}
        <Button
          onClick={handleAddZone}
          disabled={loading || !getZoneName()}
          className="w-full bg-yellow-400 text-black hover:bg-yellow-500"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Añadir zona {newExclusions.length > 0 && `(${newExclusions.length} exclusiones)`}
        </Button>

        {/* Lista completa de cantones */}
        <details className="group">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
            <ChevronDown className="h-4 w-4 group-open:rotate-180 transition-transform" />
            Ver todos los cantones y distritos
          </summary>
          <div className="mt-3 max-h-96 overflow-y-auto border rounded-lg p-3 space-y-2">
            {/* Liechtenstein */}
            <Collapsible
              open={expandedCantons.has("liechtenstein")}
              onOpenChange={() => toggleCantonExpansion("liechtenstein")}
            >
              <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded hover:bg-muted/30 cursor-pointer">
                {expandedCantons.has("liechtenstein") ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <Globe className="h-4 w-4 text-orange-400" />
                <span className="font-medium">🇱🇮 Liechtenstein</span>
                <Badge variant="outline" className="text-xs ml-auto">
                  País
                </Badge>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-6 mt-2 flex flex-wrap gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => quickAddZone("Liechtenstein", "country", newZoneMode)}
                    className="text-xs text-orange-400"
                  >
                    Todo Liechtenstein
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Cantones suizos */}
            {SWISS_CANTONS.map((canton) => (
              <Collapsible
                key={canton.id}
                open={expandedCantons.has(canton.id)}
                onOpenChange={() => toggleCantonExpansion(canton.id)}
              >
                <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded hover:bg-muted/30 cursor-pointer">
                  {expandedCantons.has(canton.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <MapPin className="h-4 w-4 text-yellow-400" />
                  <span className="font-medium">{canton.name}</span>
                  <Badge variant="outline" className="text-xs ml-auto">
                    {canton.code}
                  </Badge>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-6 mt-2 space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => quickAddZone(canton.name, "canton", newZoneMode)}
                      className="text-xs text-yellow-400"
                    >
                      Todo {canton.name}
                    </Button>
                    {canton.districts.map((district) => (
                      <div key={district.id} className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => quickAddZone(district.name, "district", newZoneMode)}
                          className="text-xs text-blue-400"
                        >
                          {district.name}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </details>
      </div>

      {/* MODAL DE EDICIÓN DE EXCLUSIONES */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              Editar exclusiones: {editingZone?.zoneName}
            </DialogTitle>
          </DialogHeader>

          {editingZone && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    editingZone.zoneMode === "pickup"
                      ? "border-green-500 text-green-400"
                      : "border-yellow-500 text-yellow-400"
                  }
                >
                  {editingZone.zoneMode === "pickup" ? "📍 Pickup" : "🎯 Destino"}
                </Badge>
                <Badge variant="outline">{editingZone.zoneType}</Badge>
              </div>

              <p className="text-sm text-muted-foreground">
                Los municipios excluidos tendrán PRIORIDAD ABSOLUTA. Aunque el cliente esté en tu
                zona, si está en un lugar excluido, no recibirás la solicitud.
              </p>

              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar municipio..."
                  value={editSearchTerm}
                  onChange={(e) => setEditSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditExclusions([...filteredEditMunicipalities])}
                  className="text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  Seleccionar todos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditExclusions([])}
                  className="text-xs border-gray-500/30 text-gray-400 hover:bg-gray-500/10"
                >
                  Limpiar selección
                </Button>
              </div>

              {/* Grid de municipios */}
              <div className="border rounded-lg p-3 bg-muted/20 max-h-80 overflow-y-auto">
                <div className="flex flex-wrap gap-1.5">
                  {filteredEditMunicipalities.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4 w-full">
                      No se encontraron municipios
                    </p>
                  ) : (
                    filteredEditMunicipalities.map((place) => {
                      const isExcluded = editExclusions.includes(place);
                      return (
                        <button
                          key={place}
                          type="button"
                          onClick={() => {
                            if (isExcluded) {
                              setEditExclusions(editExclusions.filter((p) => p !== place));
                            } else {
                              setEditExclusions([...editExclusions, place]);
                            }
                          }}
                          className={`px-2 py-1 text-xs rounded-md border transition-all duration-150 cursor-pointer
                            ${
                              isExcluded
                                ? "bg-red-500 border-red-600 text-white shadow-sm"
                                : "bg-background border-gray-300 text-slate-900 dark:text-slate-100 hover:border-red-400 hover:bg-red-500/10"
                            }`}
                        >
                          {isExcluded && <X className="inline h-3 w-3 mr-0.5" />}
                          {place}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Resumen */}
              {editExclusions.length > 0 && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-sm text-red-400 font-medium">
                    ❌ {editExclusions.length} lugares excluidos
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {editExclusions.slice(0, 5).join(", ")}
                    {editExclusions.length > 5 && ` +${editExclusions.length - 5} más`}
                  </p>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveExclusions}
                  disabled={loading}
                  className="flex-1 bg-yellow-400 text-black hover:bg-yellow-500"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    `Guardar ${editExclusions.length > 0 ? `(${editExclusions.length} exclusiones)` : ""}`
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
