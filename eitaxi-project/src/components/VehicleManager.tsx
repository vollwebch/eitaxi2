/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    VEHICLE MANAGER - COMPONENTE COMPARTIDO                 ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║ Gestiona múltiples vehículos para conductores.                             ║
 * ║ Usado tanto en Registro como en Dashboard.                                 ║
 * ║                                                                           ║
 * ║ Modos de operación:                                                       ║
 * ║  - mode="create": Los vehículos se guardan en estado local hasta guardar  ║
 * ║  - mode="edit": Los cambios se guardan directamente en la API             ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  Plus,
  Trash2,
  Star,
  Check,
  X,
  Edit3,
  Loader2,
  Image as ImageIcon,
  Users,
  Calendar,
  Palette,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VEHICLE_TYPES } from "@/lib/constants";

// ============================================
// TIPOS
// ============================================

export interface Vehicle {
  id?: string;
  driverId?: string;
  vehicleType: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  passengerCapacity: number | null;
  licensePlate: string | null;
  imageUrl: string | null;
  isPrimary: boolean;
  isActive: boolean;
}

interface VehicleManagerProps {
  /** Modo de operación */
  mode: "create" | "edit";
  /** ID del conductor (requerido en modo edit) */
  driverId?: string;
  /** Vehículos iniciales */
  initialVehicles?: Vehicle[];
  /** Callback cuando cambian los vehículos (modo create) */
  onVehiclesChange?: (vehicles: Vehicle[]) => void;
  /** Callback cuando hay un error */
  onError?: (error: string) => void;
  /** Callback cuando hay un éxito */
  onSuccess?: (message: string) => void;
  /** Mostrar título */
  showTitle?: boolean;
  /** Clases adicionales */
  className?: string;
}

// ============================================
// COMPONENTE
// ============================================

export default function VehicleManager({
  mode,
  driverId,
  initialVehicles = [],
  onVehiclesChange,
  onError,
  onSuccess,
  showTitle = true,
  className = "",
}: VehicleManagerProps) {
  // Estado local de vehículos
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estado del formulario
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<{
    vehicleType: string;
    brand: string;
    model: string;
    year: number | "";
    color: string;
    passengerCapacity: number | "";
    licensePlate: string;
  }>({
    vehicleType: "taxi",
    brand: "",
    model: "",
    year: "",
    color: "",
    passengerCapacity: "",
    licensePlate: "",
  });

  // Cargar vehículos en modo edit
  useEffect(() => {
    if (mode === "edit" && driverId) {
      fetchVehicles();
    }
  }, [mode, driverId]);

  // Notificar cambios en modo create
  useEffect(() => {
    if (mode === "create" && onVehiclesChange) {
      onVehiclesChange(vehicles);
    }
  }, [vehicles, mode, onVehiclesChange]);

  // Sincronizar vehículos iniciales
  useEffect(() => {
    if (initialVehicles.length > 0 && mode === "create") {
      setVehicles(initialVehicles);
    }
  }, [initialVehicles, mode]);

  // Fetch vehículos desde API
  const fetchVehicles = async () => {
    if (!driverId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/vehicles?driverId=${driverId}`);
      const data = await res.json();
      if (data.success) {
        setVehicles(data.data);
      }
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      onError?.("Error al cargar vehículos");
    } finally {
      setLoading(false);
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      vehicleType: "taxi",
      brand: "",
      model: "",
      year: "",
      color: "",
      passengerCapacity: "",
      licensePlate: "",
    });
    setEditingVehicle(null);
    setShowForm(false);
  };

  // Abrir formulario para nuevo vehículo
  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
  };

  // Abrir formulario para editar
  const handleEdit = (vehicle: Vehicle) => {
    setFormData({
      vehicleType: vehicle.vehicleType,
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      year: vehicle.year || "",
      color: vehicle.color || "",
      passengerCapacity: vehicle.passengerCapacity || "",
      licensePlate: vehicle.licensePlate || "",
    });
    setEditingVehicle(vehicle);
    setShowForm(true);
  };

  // Guardar vehículo (crear o actualizar)
  const handleSave = async () => {
    // Validación básica
    if (!formData.vehicleType) {
      onError?.("Selecciona un tipo de vehículo");
      return;
    }

    const vehicleData: Vehicle = {
      vehicleType: formData.vehicleType,
      brand: formData.brand || null,
      model: formData.model || null,
      year: formData.year ? Number(formData.year) : null,
      color: formData.color || null,
      passengerCapacity: formData.passengerCapacity ? Number(formData.passengerCapacity) : null,
      licensePlate: formData.licensePlate || null,
      imageUrl: editingVehicle?.imageUrl || null,
      isPrimary: editingVehicle?.isPrimary || vehicles.length === 0,
      isActive: true,
    };

    if (mode === "create") {
      // Modo create: guardar en estado local
      if (editingVehicle?.id) {
        // Editar existente
        setVehicles(prev =>
          prev.map(v => (v.id === editingVehicle.id ? { ...vehicleData, id: v.id } : v))
        );
        onSuccess?.("Vehículo actualizado");
      } else {
        // Crear nuevo con ID temporal
        const newVehicle: Vehicle = {
          ...vehicleData,
          id: `temp-${Date.now()}`,
        };
        setVehicles(prev => [...prev, newVehicle]);
        onSuccess?.("Vehículo añadido");
      }
      resetForm();
    } else {
      // Modo edit: guardar en API
      if (!driverId) return;

      setSaving(true);
      try {
        const isEdit = editingVehicle?.id && !editingVehicle.id.startsWith("temp-");
        const url = "/api/vehicles";
        const method = isEdit ? "PUT" : "POST";
        const body = isEdit
          ? { ...vehicleData, id: editingVehicle.id, driverId }
          : { ...vehicleData, driverId };

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json();
        if (data.success) {
          if (isEdit) {
            setVehicles(prev => prev.map(v => (v.id === editingVehicle.id ? data.data : v)));
            onSuccess?.("Vehículo actualizado");
          } else {
            setVehicles(prev => [...prev, data.data]);
            onSuccess?.("Vehículo añadido");
          }
          resetForm();
        } else {
          onError?.(data.error || "Error al guardar vehículo");
        }
      } catch (err) {
        onError?.("Error de conexión");
      } finally {
        setSaving(false);
      }
    }
  };

  // Eliminar vehículo
  const handleDelete = async (vehicle: Vehicle) => {
    if (!confirm("¿Estás seguro de eliminar este vehículo?")) return;

    if (mode === "create" || vehicle.id?.startsWith("temp-")) {
      // Modo create: eliminar de estado local
      setVehicles(prev => {
        const filtered = prev.filter(v => v.id !== vehicle.id);
        // Si eliminamos el principal, asignar otro
        if (vehicle.isPrimary && filtered.length > 0) {
          filtered[0].isPrimary = true;
        }
        return filtered;
      });
      onSuccess?.("Vehículo eliminado");
    } else {
      // Modo edit: eliminar de API
      if (!driverId || !vehicle.id) return;

      try {
        const res = await fetch(`/api/vehicles?id=${vehicle.id}&driverId=${driverId}`, {
          method: "DELETE",
        });

        const data = await res.json();
        if (data.success) {
          setVehicles(prev => {
            const filtered = prev.filter(v => v.id !== vehicle.id);
            // Si eliminamos el principal, asignar otro
            if (vehicle.isPrimary && filtered.length > 0 && filtered[0]) {
              filtered[0].isPrimary = true;
            }
            return filtered;
          });
          onSuccess?.("Vehículo eliminado");
        } else {
          onError?.(data.error || "Error al eliminar vehículo");
        }
      } catch (err) {
        onError?.("Error de conexión");
      }
    }
  };

  // Establecer vehículo principal
  const handleSetPrimary = async (vehicle: Vehicle) => {
    if (vehicle.isPrimary) return;

    if (mode === "create" || vehicle.id?.startsWith("temp-")) {
      // Modo create: actualizar estado local
      setVehicles(prev =>
        prev.map(v => ({
          ...v,
          isPrimary: v.id === vehicle.id,
        }))
      );
      onSuccess?.("Vehículo principal actualizado");
    } else {
      // Modo edit: actualizar en API
      if (!driverId || !vehicle.id) return;

      try {
        const res = await fetch("/api/vehicles", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: vehicle.id,
            driverId,
            isPrimary: true,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setVehicles(prev =>
            prev.map(v => ({
              ...v,
              isPrimary: v.id === vehicle.id,
            }))
          );
          onSuccess?.("Vehículo principal actualizado");
        } else {
          onError?.(data.error || "Error al actualizar vehículo principal");
        }
      } catch (err) {
        onError?.("Error de conexión");
      }
    }
  };

  // Obtener label del tipo de vehículo
  const getVehicleTypeLabel = (typeId: string) => {
    return VEHICLE_TYPES.find(t => t.id === typeId)?.label || typeId;
  };

  // Obtener icono del tipo de vehículo
  const getVehicleTypeIcon = (typeId: string) => {
    return VEHICLE_TYPES.find(t => t.id === typeId)?.icon || "🚗";
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      {showTitle && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-yellow-400" />
            <h3 className="font-semibold">Vehículos</h3>
            {vehicles.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {vehicles.length}
              </Badge>
            )}
          </div>
          {!showForm && (
            <Button
              onClick={handleAddNew}
              size="sm"
              className="bg-yellow-400 text-black hover:bg-yellow-500"
            >
              <Plus className="h-4 w-4 mr-1" />
              Añadir vehículo
            </Button>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
        </div>
      )}

      {/* Lista de vehículos */}
      {!loading && vehicles.length > 0 && !showForm && (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {vehicles.map((vehicle, index) => (
              <motion.div
                key={vehicle.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={`relative rounded-lg border p-4 transition-all ${
                  vehicle.isPrimary
                    ? "border-yellow-400/50 bg-yellow-400/5"
                    : "border-border bg-card"
                }`}
              >
                {/* Primary badge */}
                {vehicle.isPrimary && (
                  <div className="absolute -top-2 right-3">
                    <Badge className="bg-yellow-400 text-black text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Principal
                    </Badge>
                  </div>
                )}

                <div className="flex items-start justify-between gap-4">
                  {/* Vehicle info */}
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{getVehicleTypeIcon(vehicle.vehicleType)}</div>
                    <div>
                      <div className="font-medium">
                        {vehicle.brand && vehicle.model
                          ? `${vehicle.brand} ${vehicle.model}`
                          : vehicle.brand || vehicle.model || "Vehículo"}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span>{getVehicleTypeLabel(vehicle.vehicleType)}</span>
                          {vehicle.year && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {vehicle.year}
                            </span>
                          )}
                          {vehicle.color && (
                            <span className="flex items-center gap-1">
                              <Palette className="h-3 w-3" />
                              {vehicle.color}
                            </span>
                          )}
                          {vehicle.passengerCapacity && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {vehicle.passengerCapacity} plazas
                            </span>
                          )}
                          {vehicle.licensePlate && (
                            <span className="flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              {vehicle.licensePlate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {!vehicle.isPrimary && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetPrimary(vehicle)}
                        title="Marcar como principal"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(vehicle)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(vehicle)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty state */}
      {!loading && vehicles.length === 0 && !showForm && (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Car className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">
              No tienes vehículos configurados
            </p>
            <Button
              onClick={handleAddNew}
              className="bg-yellow-400 text-black hover:bg-yellow-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Añadir tu primer vehículo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Formulario */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-yellow-400/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Car className="h-5 w-5 text-yellow-400" />
                  {editingVehicle ? "Editar vehículo" : "Nuevo vehículo"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tipo de vehículo */}
                <div className="space-y-2">
                  <Label>Tipo de vehículo *</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {VEHICLE_TYPES.map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, vehicleType: type.id }))}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          formData.vehicleType === type.id
                            ? "border-yellow-400 bg-yellow-400/10"
                            : "border-border hover:border-yellow-400/50"
                        }`}
                      >
                        <div className="text-2xl mb-1">{type.icon}</div>
                        <div className="text-sm font-medium">{type.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Marca y Modelo */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Marca</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={e => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder="Ej: Mercedes-Benz"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={e => setFormData(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="Ej: Clase E"
                    />
                  </div>
                </div>

                {/* Año y Color */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Año</Label>
                    <Input
                      id="year"
                      type="number"
                      min={1990}
                      max={new Date().getFullYear() + 1}
                      value={formData.year}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          year: e.target.value ? parseInt(e.target.value) : "",
                        }))
                      }
                      placeholder="Ej: 2022"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      value={formData.color}
                      onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="Ej: Negro"
                    />
                  </div>
                </div>

                {/* Plazas y Matrícula */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="passengerCapacity">Nº de plazas</Label>
                    <Input
                      id="passengerCapacity"
                      type="number"
                      min={1}
                      max={50}
                      value={formData.passengerCapacity}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          passengerCapacity: e.target.value ? parseInt(e.target.value) : "",
                        }))
                      }
                      placeholder="Ej: 4"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licensePlate">Matrícula</Label>
                    <Input
                      id="licensePlate"
                      value={formData.licensePlate}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, licensePlate: e.target.value }))
                      }
                      placeholder="Ej: ZH 123456"
                    />
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={resetForm}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-yellow-400 text-black hover:bg-yellow-500"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        {editingVehicle ? "Guardar cambios" : "Añadir vehículo"}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Exportar tipo para uso externo
export type { VehicleManagerProps };
