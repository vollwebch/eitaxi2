"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Clock,
  Plus,
  X,
  Copy,
  AlertCircle,
  Check,
  Sun,
  Moon,
  Ban,
  Calendar,
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from 'next-intl';

// Tipos
export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
}

export interface DaySchedule {
  dayOfWeek: number;
  mode: "closed" | "specific" | "all_day";
  slots: TimeSlot[];
}

interface ScheduleSelectorProps {
  // Estado inicial (para edición)
  initialSchedules?: DaySchedule[];
  // Callback cuando cambian los horarios
  onSchedulesChange?: (schedules: DaySchedule[]) => void;
  // Modo 24/7 global
  is24h?: boolean;
  on24hChange?: (value: boolean) => void;
  // Mostrar error de validación
  validationError?: boolean;
}

// Días de la semana
const DAYS_OF_WEEK = [
  { value: 1, label: "Lunes", shortLabel: "Lun" },
  { value: 2, label: "Martes", shortLabel: "Mar" },
  { value: 3, label: "Miércoles", shortLabel: "Mié" },
  { value: 4, label: "Jueves", shortLabel: "Jue" },
  { value: 5, label: "Viernes", shortLabel: "Vie" },
  { value: 6, label: "Sábado", shortLabel: "Sáb" },
  { value: 0, label: "Domingo", shortLabel: "Dom" },
];

// Generar ID único
const generateId = () => Math.random().toString(36).substring(2, 9);

// Crear horario por defecto para un día
const createDefaultDaySchedule = (dayOfWeek: number): DaySchedule => ({
  dayOfWeek,
  mode: dayOfWeek >= 1 && dayOfWeek <= 5 ? "specific" : "closed",
  slots: [{ id: generateId(), startTime: "09:00", endTime: "18:00" }],
});

// Horario por defecto para todos los días
const createDefaultSchedules = (): DaySchedule[] =>
  DAYS_OF_WEEK.map((day) => createDefaultDaySchedule(day.value));

// Validar solapamiento de franjas
const validateNoOverlap = (slots: TimeSlot[]): { valid: boolean; error?: string } => {
  if (slots.length <= 1) return { valid: true };

  // Ordenar por hora de inicio
  const sorted = [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime));

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    // Si la franja actual termina después de que empieza la siguiente
    if (current.endTime > next.startTime) {
      return {
        valid: false,
        error: `Las franjas ${current.startTime}-${current.endTime} y ${next.startTime}-${next.endTime} se solapan`,
      };
    }
  }

  return { valid: true };
};

// Validar que la hora de inicio sea menor que la de fin
const validateTimeSlot = (slot: TimeSlot): { valid: boolean; error?: string } => {
  if (slot.startTime >= slot.endTime) {
    return {
      valid: false,
      error: "La hora de inicio debe ser menor que la hora de fin",
    };
  }
  return { valid: true };
};

export default function ScheduleSelector({
  initialSchedules,
  onSchedulesChange,
  is24h = false,
  on24hChange,
  validationError = false,
}: ScheduleSelectorProps) {
  // Estado local de horarios
  const [schedules, setSchedules] = useState<DaySchedule[]>(
    initialSchedules && initialSchedules.length > 0
      ? initialSchedules
      : createDefaultSchedules()
  );

  // Estado para modal de copiar a todos
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [dayToCopy, setDayToCopy] = useState<number | null>(null);

  // Errores de validación por día
  const [errors, setErrors] = useState<Record<number, string[]>>({});
  const t = useTranslations('profile');

  // Notificar cambios al padre
  const updateSchedules = (newSchedules: DaySchedule[]) => {
    setSchedules(newSchedules);
    if (onSchedulesChange) onSchedulesChange(newSchedules);
  };

  // Efecto para sincronizar con props
  useEffect(() => {
    if (initialSchedules && initialSchedules.length > 0) {
      setSchedules(initialSchedules);
    }
  }, [initialSchedules]);

  // Obtener horario de un día
  const getDaySchedule = (dayOfWeek: number): DaySchedule => {
    return schedules.find((s) => s.dayOfWeek === dayOfWeek) || createDefaultDaySchedule(dayOfWeek);
  };

  // Cambiar modo de un día
  const changeDayMode = (dayOfWeek: number, mode: "closed" | "specific" | "all_day") => {
    const newSchedules = schedules.map((s) => {
      if (s.dayOfWeek === dayOfWeek) {
        // Si cambia a all_day, resetear slots a una franja completa
        if (mode === "all_day") {
          return {
            ...s,
            mode,
            slots: [{ id: generateId(), startTime: "00:00", endTime: "23:59" }],
          };
        }
        // Si cambia a específico, crear una franja por defecto
        if (mode === "specific" && s.slots.length === 0) {
          return {
            ...s,
            mode,
            slots: [{ id: generateId(), startTime: "09:00", endTime: "18:00" }],
          };
        }
        return { ...s, mode };
      }
      return s;
    });
    updateSchedules(newSchedules);
    clearErrors(dayOfWeek);
  };

  // Añadir franja a un día
  const addTimeSlot = (dayOfWeek: number) => {
    const daySchedule = getDaySchedule(dayOfWeek);
    if (daySchedule.slots.length >= 3) return; // Máximo 3 franjas

    const lastSlot = daySchedule.slots[daySchedule.slots.length - 1];
    const newSlot: TimeSlot = {
      id: generateId(),
      startTime: lastSlot ? lastSlot.endTime : "09:00",
      endTime: lastSlot ? "23:59" : "18:00",
    };

    const newSchedules = schedules.map((s) => {
      if (s.dayOfWeek === dayOfWeek) {
        return { ...s, slots: [...s.slots, newSlot] };
      }
      return s;
    });
    updateSchedules(newSchedules);
  };

  // Eliminar franja de un día
  const removeTimeSlot = (dayOfWeek: number, slotId: string) => {
    const newSchedules = schedules.map((s) => {
      if (s.dayOfWeek === dayOfWeek) {
        return { ...s, slots: s.slots.filter((slot) => slot.id !== slotId) };
      }
      return s;
    });
    updateSchedules(newSchedules);
    clearErrors(dayOfWeek);
  };

  // Actualizar franja
  const updateTimeSlot = (
    dayOfWeek: number,
    slotId: string,
    field: "startTime" | "endTime",
    value: string
  ) => {
    const newSchedules = schedules.map((s) => {
      if (s.dayOfWeek === dayOfWeek) {
        return {
          ...s,
          slots: s.slots.map((slot) =>
            slot.id === slotId ? { ...slot, [field]: value } : slot
          ),
        };
      }
      return s;
    });
    updateSchedules(newSchedules);

    // Validar después de actualizar
    validateDay(dayOfWeek, newSchedules);
  };

  // Validar un día
  const validateDay = (dayOfWeek: number, currentSchedules: DaySchedule[]) => {
    const daySchedule = currentSchedules.find((s) => s.dayOfWeek === dayOfWeek);
    if (!daySchedule || daySchedule.mode !== "specific") {
      clearErrors(dayOfWeek);
      return;
    }

    const dayErrors: string[] = [];

    // Validar cada franja individual
    daySchedule.slots.forEach((slot) => {
      const validation = validateTimeSlot(slot);
      if (!validation.valid && validation.error) {
        dayErrors.push(validation.error);
      }
    });

    // Validar solapamiento
    const overlapValidation = validateNoOverlap(daySchedule.slots);
    if (!overlapValidation.valid && overlapValidation.error) {
      dayErrors.push(overlapValidation.error);
    }

    if (dayErrors.length > 0) {
      setErrors((prev) => ({ ...prev, [dayOfWeek]: dayErrors }));
    } else {
      clearErrors(dayOfWeek);
    }
  };

  // Limpiar errores de un día
  const clearErrors = (dayOfWeek: number) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[dayOfWeek];
      return newErrors;
    });
  };

  // Copiar configuración de un día a todos los demás
  const copyToAllDays = (sourceDayOfWeek: number) => {
    const sourceSchedule = getDaySchedule(sourceDayOfWeek);
    const newSchedules = schedules.map((s) => ({
      ...sourceSchedule,
      dayOfWeek: s.dayOfWeek,
      slots: sourceSchedule.slots.map((slot) => ({ ...slot, id: generateId() })),
    }));
    updateSchedules(newSchedules);
    setShowCopyDialog(false);
    setDayToCopy(null);
  };

  // Aplicar 24/7 global
  const apply24hGlobal = () => {
    const newSchedules = schedules.map((s) => ({
      ...s,
      mode: "all_day" as const,
      slots: [{ id: generateId(), startTime: "00:00", endTime: "23:59" }],
    }));
    updateSchedules(newSchedules);
    if (on24hChange) on24hChange(true);
  };

  // Desactivar 24/7 global
  const disable24hGlobal = () => {
    if (on24hChange) on24hChange(false);
  };

  // Resumen de horarios
  const scheduleSummary = useMemo(() => {
    const active = schedules.filter((s) => s.mode !== "closed");
    const closed = schedules.filter((s) => s.mode === "closed");
    const hours24 = schedules.filter((s) => s.mode === "all_day");
    const specific = schedules.filter((s) => s.mode === "specific");

    return { active, closed, hours24, specific };
  }, [schedules]);

  // Verificar si hay errores
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="space-y-4">
      {/* Error de validación global */}
      {validationError && scheduleSummary.active.length === 0 && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-sm text-red-400 font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Debes configurar al menos un día de disponibilidad
          </p>
        </div>
      )}

      {/* Errores de validación de franjas */}
      {hasErrors && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-sm text-red-400 font-medium flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4" />
            Hay errores en los horarios configurados
          </p>
          <ul className="text-xs text-red-400/80 space-y-1 ml-6 list-disc">
            {Object.entries(errors).map(([day, dayErrors]) => {
              const dayLabel = DAYS_OF_WEEK.find((d) => d.value === parseInt(day))?.label;
              return dayErrors.map((error, i) => (
                <li key={`${day}-${i}`}>
                  {dayLabel}: {error}
                </li>
              ));
            })}
          </ul>
        </div>
      )}

      {/* Opción 24/7 Global */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <Sun className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <p className="font-semibold text-green-400">{t('available247')}</p>
            <p className="text-xs text-muted-foreground">
              Activa disponibilidad todos los días, todo el día
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant={is24h ? "default" : "outline"}
          size="sm"
          onClick={is24h ? disable24hGlobal : apply24hGlobal}
          className={is24h ? "bg-green-500 hover:bg-green-600 text-white" : "border-green-500/50 text-green-400"}
        >
          {is24h ? "Activo" : "Activar"}
        </Button>
      </div>

      {/* Aviso cuando 24/7 está activo */}
      <AnimatePresence>
        {is24h && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 rounded-lg bg-green-500/10 border border-green-500/30"
          >
            <p className="text-sm text-green-400 flex items-center gap-2">
              <Check className="h-4 w-4" />
              Modo 24/7 activado. Todos los días están configurados como disponibles las 24 horas.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Configuración por días - solo mostrar si no está 24/7 activo */}
      <AnimatePresence>
        {!is24h && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Configuración por día</Label>
              <p className="text-xs text-muted-foreground">
                {scheduleSummary.active.length} días activos
              </p>
            </div>

            {/* Grid de días */}
            <div className="space-y-2">
              {DAYS_OF_WEEK.map((day) => {
                const daySchedule = getDaySchedule(day.value);
                const dayErrors = errors[day.value] || [];

                return (
                  <motion.div
                    key={day.value}
                    layout
                    className={`p-3 rounded-xl border transition-all ${
                      daySchedule.mode === "closed"
                        ? "bg-muted/20 border-border opacity-60"
                        : daySchedule.mode === "all_day"
                        ? "bg-green-500/5 border-green-500/30"
                        : "bg-yellow-500/5 border-yellow-500/30"
                    }`}
                  >
                    {/* Fila principal: Día + Selector de modo */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Nombre del día */}
                      <div className="w-24 flex items-center gap-2">
                        <span className="font-medium text-sm">{day.label}</span>
                      </div>

                      {/* Selector de modo */}
                      <Select
                        value={daySchedule.mode}
                        onValueChange={(v) =>
                          changeDayMode(day.value, v as "closed" | "specific" | "all_day")
                        }
                      >
                        <SelectTrigger className="w-40 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="closed">
                            <div className="flex items-center gap-2">
                              <Ban className="h-3 w-3 text-gray-400" />
                              <span>Cerrado</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="specific">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-yellow-500" />
                              <span>Horario específico</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="all_day">
                            <div className="flex items-center gap-2">
                              <Sun className="h-3 w-3 text-green-500" />
                              <span>24 Horas</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Franjas horarias (solo si es modo específico) */}
                      {daySchedule.mode === "specific" && (
                        <div className="flex-1 flex flex-wrap items-center gap-2">
                          {daySchedule.slots.map((slot, index) => (
                            <div
                              key={slot.id}
                              className="flex items-center gap-1 bg-background/50 rounded-lg p-1"
                            >
                              {index > 0 && (
                                <Badge
                                  variant="outline"
                                  className="text-xs h-6 bg-blue-500/10 border-blue-500/30 text-blue-400"
                                >
                                  Pausa
                                </Badge>
                              )}
                              <Input
                                type="time"
                                value={slot.startTime}
                                onChange={(e) =>
                                  updateTimeSlot(day.value, slot.id, "startTime", e.target.value)
                                }
                                className="w-24 h-8 text-sm"
                              />
                              <span className="text-muted-foreground text-xs">a</span>
                              <Input
                                type="time"
                                value={slot.endTime}
                                onChange={(e) =>
                                  updateTimeSlot(day.value, slot.id, "endTime", e.target.value)
                                }
                                className="w-24 h-8 text-sm"
                              />
                              {daySchedule.slots.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeTimeSlot(day.value, slot.id)}
                                  className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/10"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ))}

                          {/* Botón añadir franja */}
                          {daySchedule.slots.length < 3 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addTimeSlot(day.value)}
                              className="h-8 text-xs border-dashed border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Añadir franja
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Badge 24h */}
                      {daySchedule.mode === "all_day" && (
                        <Badge className="bg-green-500/20 border border-green-500/40 text-green-400">
                          <Sun className="h-3 w-3 mr-1" />
                          00:00 - 23:59
                        </Badge>
                      )}

                      {/* Botón copiar */}
                      {daySchedule.mode !== "closed" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDayToCopy(day.value);
                            setShowCopyDialog(true);
                          }}
                          className="h-8 w-8 p-0 text-blue-400 hover:bg-blue-500/10"
                          title="Aplicar a todos los días"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    {/* Errores del día */}
                    {dayErrors.length > 0 && (
                      <div className="mt-2 pl-28">
                        {dayErrors.map((error, i) => (
                          <p key={i} className="text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {error}
                          </p>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Resumen visual */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground mb-2">Resumen semanal:</p>
              <div className="flex flex-wrap gap-1">
                {DAYS_OF_WEEK.map((day) => {
                  const daySchedule = getDaySchedule(day.value);
                  return (
                    <div
                      key={day.value}
                      className={`px-2 py-1 rounded text-xs ${
                        daySchedule.mode === "closed"
                          ? "bg-gray-500/20 text-gray-400"
                          : daySchedule.mode === "all_day"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-600"
                      }`}
                    >
                      {day.shortLabel}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de confirmación para copiar */}
      <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5 text-blue-400" />
              Copiar horario a todos los días
            </DialogTitle>
            <DialogDescription>
              ¿Seguro que quieres aplicar la configuración del{" "}
              <strong>{DAYS_OF_WEEK.find((d) => d.value === dayToCopy)?.label}</strong> a todos los
              días de la semana?
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-sm">
            <p className="text-blue-400">
              Esto sobrescribirá la configuración actual de todos los demás días.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCopyDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => dayToCopy !== null && copyToAllDays(dayToCopy)}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Aplicar a todos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
