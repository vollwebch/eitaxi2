"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MapPin,
  Navigation,
  Clock,
  Power,
  Settings,
  Loader2,
  Check,
  AlertCircle,
  Radio,
  Wifi,
  WifiOff,
  Bell,
  BellOff,
  Smartphone,
  Shield,
  Eye,
  EyeOff,
  BellRing,
  Zap,
  Timer,
  AlertTriangle,
  Sun,
  Edit3,
  RefreshCw,
  Monitor,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import {
  subscribeToGPS, 
  broadcastGPSState, 
  readFromStorage,
  type GPSState 
} from "@/lib/gpsSync";
interface TrackingConfig {
  enabled: boolean;
  mode: "always" | "schedule";
  schedule: Array<{
    day: number;
    start: string;
    end: string;
  }>;
  lastLocationAt: string | null;
}

const daysOfWeek = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

// Import DaySchedule type from ScheduleSelector
import type { DaySchedule } from '@/components/ScheduleSelector';

interface GPSTrackingProps {
  driverId: string;
  onTrackingChange?: (enabled: boolean) => void;
  // Horarios desde el tab Horarios
  schedules?: DaySchedule[];
  is24h?: boolean;
  // Callback para sincronizar el cambio de modo 24h con el tab Horarios
  onIs24hChange?: (value: boolean) => void;
  // Función para navegar al tab Horarios
  onNavigateToSchedules?: () => void;
}

export default function GPSTracking({ 
  driverId, 
  onTrackingChange,
  schedules: externalSchedules,
  is24h = false,
  onIs24hChange,
  onNavigateToSchedules
}: GPSTrackingProps) {
  const t = useTranslations();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tracking, setTracking] = useState<TrackingConfig>({
    enabled: false,
    mode: "always",
    schedule: [],
    lastLocationAt: null,
  });

  // GPS state
  const [gpsActive, setGpsActive] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<Date | null>(null);

  // Notifications state
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  const [reminderInterval, setReminderInterval] = useState<number>(30);

  // Schedule notifications state
  const [scheduleNotificationsEnabled, setScheduleNotificationsEnabled] = useState(false);
  const [autoGpsEnabled, setAutoGpsEnabled] = useState(false);
  const [preStartMinutes, setPreStartMinutes] = useState(10); // minutos antes de empezar
  const [postEndMinutes, setPostEndMinutes] = useState(5); // minutos después de terminar

  // GPS auto-activated state - para indicar si se activó automáticamente
  const [gpsAutoActivated, setGpsAutoActivated] = useState(false);

  // GPS Consent state
  const [showGpsConsent, setShowGpsConsent] = useState(false);
  const [hasGpsConsent, setHasGpsConsent] = useState(false);

  // GPS permission denied state
  const [gpsPermissionDenied, setGpsPermissionDenied] = useState(false);
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);

  // GPS browser permission state: granted | denied | prompt | unsupported
  const [gpsPermissionState, setGpsPermissionState] = useState<'granted' | 'denied' | 'prompt' | 'unsupported' | null>(null);

  // Schedule mode state - para mostrar/ocultar horarios fijos
  const [showFixedSchedules, setShowFixedSchedules] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const sendIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reminderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLocalChangeRef = useRef(false);

  // Refs for schedule notification timeouts
  const scheduleCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const preStartNotificationRef = useRef<NodeJS.Timeout | null>(null);
  const postEndNotificationRef = useRef<NodeJS.Timeout | null>(null);

  // Refs para evitar dependencias circulares en useEffect
  const gpsActiveRef = useRef(false);
  const trackingEnabledRef = useRef(false);
  const currentPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const schedulesRef = useRef(tracking.schedule);
  const is24hRef = useRef(is24h);

  // Convertir horarios del tab "Horarios" al formato del GPS
  const convertSchedulesToGPSFormat = useCallback((schedules: DaySchedule[]) => {
    if (!schedules || schedules.length === 0) {
      return [];
    }

    const filtered = schedules.filter(s => {
      return s.mode !== 'closed' && s.slots && s.slots.length > 0;
    });
    
    const converted = filtered.flatMap(s => 
      s.slots.map(slot => ({
        day: s.dayOfWeek,
        start: slot.startTime,
        end: slot.endTime
      }))
    );
    
    return converted;
  }, []);

  // Sincronizar el modo del tracking cuando is24h cambia
  useEffect(() => {
    if (loading) return; // No sincronizar hasta que los datos estén cargados
    
    const correctMode = is24h ? 'always' : (tracking.schedule.length > 0 ? 'schedule' : 'always');
    if (tracking.mode !== correctMode) {
      setTracking(prev => ({ ...prev, mode: correctMode }));
      // También actualizar en la base de datos si el tracking está activo
      if (tracking.enabled) {
        fetch("/api/driver/tracking", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ driverId, mode: correctMode }),
        }).catch(err => console.error("Error updating mode:", err));
      }
    }
  }, [is24h, loading]);

  // Actualizar tracking cuando cambian los horarios externos (FUENTE DE VERDAD: workingHours)
  useEffect(() => {
    const gpsSchedule = convertSchedulesToGPSFormat(externalSchedules || []);
    const hasSchedules = gpsSchedule.length > 0;

    // Siempre sincronizar: los horarios del Dashboard son la fuente de verdad
    setTracking(prev => ({
      ...prev,
      mode: (is24h || !hasSchedules) ? 'always' : 'schedule',
      schedule: gpsSchedule
    }));
  }, [externalSchedules, is24h, convertSchedulesToGPSFormat]);
  
  // Actualizar refs cuando cambia el estado
  useEffect(() => {
    gpsActiveRef.current = gpsActive;
  }, [gpsActive]);
  
  useEffect(() => {
    trackingEnabledRef.current = tracking.enabled;
  }, [tracking.enabled]);

  useEffect(() => {
    currentPositionRef.current = currentPosition;
  }, [currentPosition]);

  useEffect(() => {
    schedulesRef.current = tracking.schedule;
  }, [tracking.schedule]);

  useEffect(() => {
    is24hRef.current = is24h;
  }, [is24h]);

  // Función para iniciar tracking
  const startGPSTracking = useCallback(async (shouldBroadcast: boolean = true, isAutoActivated: boolean = false) => {
    if (!navigator.geolocation) {
      setGpsError(t('geo.notSupported'));
      return;
    }

    // VERIFICACIÓN PREVIA DEL PERMISO
    // Si el permiso ya fue denegado, no intentar watchPosition (falla silenciosamente)
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        if (result.state === 'denied') {
          console.warn('GPS: Permiso de ubicación denegado previamente');
          setGpsPermissionDenied(true);
          setGpsPermissionState('denied');
          setShowPermissionHelp(true);
          setGpsActive(false);
          return;
        }
        // Escuchar cambios de permiso en tiempo real
        result.onchange = () => {
          setGpsPermissionState(result.state as 'granted' | 'denied' | 'prompt');
          if (result.state === 'granted') {
            setGpsPermissionDenied(false);
            setShowPermissionHelp(false);
            setGpsError(null);
          } else if (result.state === 'denied') {
            setGpsPermissionDenied(true);
            setShowPermissionHelp(true);
          }
        };
      } catch (err) {
        // permissions.query no soportado (ej. iOS Safari), continuar normalmente
        console.log('GPS: permissions.query no disponible, continuando...');
      }
    }

    setGpsError(null);
    setGpsPermissionDenied(false);
    setGpsPermissionState('granted');
    setShowPermissionHelp(false);
    setGpsActive(true);
    setGpsAutoActivated(isAutoActivated); // Marcar si fue auto-activado

    // Auto-habilitar tracking en la base de datos
    if (!trackingEnabledRef.current) {
      try {
        // Determinar el modo correcto: si is24h → always, si hay schedule → schedule
        const currentMode = is24h ? 'always' : (tracking.schedule.length > 0 ? 'schedule' : 'always');
        await fetch("/api/driver/tracking", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ driverId, enabled: true, mode: currentMode }),
        });
        setTracking(prev => ({ ...prev, enabled: true, mode: currentMode }));
        if (onTrackingChange) onTrackingChange(true);
      } catch (err) {
        console.error("Error enabling tracking:", err);
      }
    }

    if (watchIdRef.current === null) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentPosition(pos);
          setGpsError(null);
          setGpsPermissionDenied(false);
          setGpsPermissionState('granted');
          setShowPermissionHelp(false);
          
          // Siempre broadcast la posición actualizada
          broadcastGPSState({
            active: true,
            position: pos,
            lastUpdate: new Date().toISOString(),
            driverId,
          });
        },
        (error) => {
          const msg = getGpsErrorMessage(error);
          setGpsError(msg);
          // Si el error es por permiso denegado, mostrar panel de ayuda
          if (error.code === error.PERMISSION_DENIED) {
            setGpsPermissionDenied(true);
            setGpsPermissionState('denied');
            setShowPermissionHelp(true);
          }
          // Si hay error, desactivar GPS
          setGpsActive(false);
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        }
      );
    }
    
    // Broadcast inicial si es necesario
    if (shouldBroadcast) {
      broadcastGPSState({
        active: true,
        position: null,
        lastUpdate: null,
        driverId,
      });
    }
  }, [driverId, onTrackingChange]);

  // Función para detener tracking
  const stopGPSTracking = useCallback(async (shouldBroadcast: boolean = true) => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (sendIntervalRef.current) {
      clearInterval(sendIntervalRef.current);
      sendIntervalRef.current = null;
    }
    setGpsActive(false);
    setGpsAutoActivated(false); // Resetear el estado de auto-activación
    setCurrentPosition(null);
    setGpsError(null);
    
    // Deshabilitar tracking y limpiar ubicaciones en la base de datos
    try {
      // Deshabilitar tracking
      await fetch("/api/driver/tracking", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId, enabled: false }),
      });
      
      // Limpiar todas las ubicaciones guardadas
      await fetch(`/api/driver/location?driverId=${driverId}`, {
        method: "DELETE",
      });
      
      setTracking(prev => ({ ...prev, enabled: false }));
      if (onTrackingChange) onTrackingChange(false);
    } catch (err) {
      console.error("Error disabling tracking:", err);
    }
    
    if (shouldBroadcast) {
      broadcastGPSState({
        active: false,
        position: null,
        lastUpdate: null,
        driverId,
      });
    }
  }, [driverId, onTrackingChange]);

  // Toggle GPS - El botón principal
  const toggleGPS = useCallback(async () => {
    isLocalChangeRef.current = true;
    
    if (gpsActiveRef.current) {
      stopGPSTracking(true);
    } else {
      // Si no hay consentimiento, mostrar diálogo
      if (!hasGpsConsent) {
        setShowGpsConsent(true);
      } else {
        await startGPSTracking(true, false); // Manual activation (not auto)
      }
    }
  }, [startGPSTracking, stopGPSTracking, hasGpsConsent]);
  
  // Aceptar consentimiento GPS
  const acceptGpsConsent = useCallback(async () => {
    localStorage.setItem('gps-tracking-consent', 'true');
    setHasGpsConsent(true);
    setShowGpsConsent(false);
    await startGPSTracking(true, false); // Manual activation (not auto)
  }, [startGPSTracking]);

  // Subscribe to GPS state changes from other tabs (widget)
  useEffect(() => {
    const unsubscribe = subscribeToGPS((state: GPSState) => {
      if (isLocalChangeRef.current) {
        isLocalChangeRef.current = false;
        return;
      }
      
      if (state.driverId && state.driverId !== driverId) return;
      
      const isActive = gpsActiveRef.current;
      
      if (state.active !== isActive) {
        if (state.active) {
          startGPSTracking(false, false); // Sync from other tab (not auto)
        } else {
          stopGPSTracking(false);
        }
      }
      
      if (state.position) {
        setCurrentPosition(state.position);
      }
      if (state.lastUpdate) {
        setLastSent(new Date(state.lastUpdate));
      }
    });

    // NO activar automáticamente desde localStorage
    // El GPS debe iniciarse manualmente por el conductor
    // Solo leemos la posición si existe para mostrar info
    const storedState = readFromStorage();
    if (storedState && storedState.driverId === driverId) {
      // Solo mostrar última posición conocida si existe
      // pero NO marcar como activo
      if (storedState.position) {
        setCurrentPosition(storedState.position);
      }
      if (storedState.lastUpdate) {
        setLastSent(new Date(storedState.lastUpdate));
      }
      // Si el stored dice activo pero tracking.enabled es false, limpiar storage
      if (storedState.active && !trackingEnabledRef.current) {
        broadcastGPSState({
          active: false,
          position: null,
          lastUpdate: null,
          driverId,
        });
      }
    }

    return unsubscribe;
  }, [driverId, startGPSTracking, stopGPSTracking]);

  // Enviar ubicación al servidor cada 5 segundos
  useEffect(() => {
    if (!gpsActive) {
      // Limpiar intervalo si GPS está desactivado
      if (sendIntervalRef.current) {
        clearInterval(sendIntervalRef.current);
        sendIntervalRef.current = null;
      }
      return;
    }

    const sendLocation = async () => {
      const pos = currentPositionRef.current;
      if (!pos) return;

      // VERIFICACIÓN DE HORARIOS: Solo enviar coordenadas si estamos dentro de workingHours
      // (o si is24h está activado = disponible 24 horas)
      const currentIs24h = is24hRef.current;
      const currentSchedule = schedulesRef.current;
      if (!currentIs24h && currentSchedule.length > 0) {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const todaySlots = currentSchedule.filter(s => s.day === dayOfWeek);
        const isInSchedule = todaySlots.some(s => currentTime >= s.start && currentTime < s.end);

        if (!isInSchedule) return; // Fuera de horario: no enviar coordenadas
      }

      try {
        await fetch("/api/driver/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            driverId,
            latitude: pos.lat,
            longitude: pos.lng,
          }),
        });
        setLastSent(new Date());
      } catch (error) {
        console.error("Error sending location:", error);
      }
    };

    // Enviar inmediatamente si hay posición
    if (currentPositionRef.current) {
      sendLocation();
    }

    // Configurar intervalo
    sendIntervalRef.current = setInterval(sendLocation, 5000);

    return () => {
      if (sendIntervalRef.current) {
        clearInterval(sendIntervalRef.current);
        sendIntervalRef.current = null;
      }
    };
  }, [gpsActive, driverId]);

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
      setNotificationsEnabled(Notification.permission === 'granted');
    }

    const savedInterval = localStorage.getItem('gps-reminder-interval');
    if (savedInterval) {
      setReminderInterval(parseInt(savedInterval));
    }

    const savedNotifications = localStorage.getItem('gps-notifications-enabled');
    if (savedNotifications === 'true') {
      setNotificationsEnabled(true);
    }

    // Check GPS consent
    const savedGpsConsent = localStorage.getItem('gps-tracking-consent');
    if (savedGpsConsent === 'true') {
      setHasGpsConsent(true);
    }

    // Check GPS browser permission state on mount
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        setGpsPermissionState(result.state as 'granted' | 'denied' | 'prompt');
        if (result.state === 'denied') {
          setGpsPermissionDenied(true);
        }
        result.onchange = () => {
          setGpsPermissionState(result.state as 'granted' | 'denied' | 'prompt');
          if (result.state === 'granted') {
            setGpsPermissionDenied(false);
            setShowPermissionHelp(false);
            setGpsError(null);
          } else if (result.state === 'denied') {
            setGpsPermissionDenied(true);
          }
        };
      }).catch(() => {
        setGpsPermissionState('unsupported');
      });
    } else {
      setGpsPermissionState('unsupported');
    }

    // Load schedule notification settings
    const savedScheduleNotifications = localStorage.getItem('schedule-notifications-enabled');
    if (savedScheduleNotifications === 'true') {
      setScheduleNotificationsEnabled(true);
    }

    const savedAutoGps = localStorage.getItem('auto-gps-enabled');
    if (savedAutoGps === 'true') {
      setAutoGpsEnabled(true);
    }

    const savedPreStart = localStorage.getItem('pre-start-minutes');
    if (savedPreStart) {
      setPreStartMinutes(parseInt(savedPreStart));
    }

    const savedPostEnd = localStorage.getItem('post-end-minutes');
    if (savedPostEnd) {
      setPostEndMinutes(parseInt(savedPostEnd));
    }
  }, []);

  // Helper function to show notifications
  const showNotification = async (title: string, options: NotificationOptions = {}) => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration) {
          await registration.showNotification(title, {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            ...options,
          });
          return;
        }
      }
      
      if ('Notification' in window && Notification.permission === 'granted' && !window.isSecureContext) {
        try {
          new Notification(title, {
            icon: '/icons/icon-192x192.png',
            ...options,
          });
        } catch {
          console.log('Notifications not available');
        }
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Tu navegador no soporta notificaciones');
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      localStorage.setItem('gps-notifications-enabled', 'true');
      
      await showNotification('🚕 eitaxi', {
        body: '¡Notificaciones activadas! Te recordaremos activar el GPS.',
        tag: 'gps-test',
      });
    }
  };

  // Disable notifications
  const disableNotifications = () => {
    setNotificationsEnabled(false);
    localStorage.setItem('gps-notifications-enabled', 'false');
    if (reminderTimeoutRef.current) {
      clearTimeout(reminderTimeoutRef.current);
    }
  };

  // Schedule GPS reminder notification
  const scheduleReminder = useCallback(() => {
    if (!notificationsEnabled || gpsActive) return;
    
    if (reminderTimeoutRef.current) {
      clearTimeout(reminderTimeoutRef.current);
    }
    
    reminderTimeoutRef.current = setTimeout(async () => {
      if (!gpsActiveRef.current && Notification.permission === 'granted') {
        await showNotification('🚕 eitaxi - GPS Desactivado', {
          body: '¡No olvides activar tu GPS para recibir más clientes hoy!',
          tag: 'gps-reminder',
          requireInteraction: true,
        });
      }
    }, reminderInterval * 60 * 1000);
  }, [notificationsEnabled, gpsActive, reminderInterval]);

  // Schedule reminder when GPS is disabled
  useEffect(() => {
    if (!gpsActive && notificationsEnabled) {
      scheduleReminder();
    }

    return () => {
      if (reminderTimeoutRef.current) {
        clearTimeout(reminderTimeoutRef.current);
      }
    };
  }, [gpsActive, notificationsEnabled, scheduleReminder]);

  // Update reminder interval
  const updateReminderInterval = (minutes: number) => {
    setReminderInterval(minutes);
    localStorage.setItem('gps-reminder-interval', minutes.toString());
    scheduleReminder();
  };

  // ===== SCHEDULE NOTIFICATIONS LOGIC =====

  // Get ALL schedules for today (handles multiple slots like morning + afternoon)
  const getTodaySchedules = useCallback(() => {
    if (!tracking.schedule.length) return [];

    const now = new Date();
    const dayOfWeek = now.getDay();
    
    // Obtener TODOS los horarios de hoy, ordenados por hora de inicio
    const todaySchedules = tracking.schedule
      .filter(s => s.day === dayOfWeek)
      .sort((a, b) => a.start.localeCompare(b.start));

    return todaySchedules;
  }, [tracking.schedule]);

  // Get current slot (the one we should be in right now)
  const getCurrentSlot = useCallback(() => {
    const todaySchedules = getTodaySchedules();
    if (todaySchedules.length === 0) return null;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Encontrar el slot actual (estamos dentro de su rango)
    for (const slot of todaySchedules) {
      if (currentTime >= slot.start && currentTime < slot.end) {
        return slot;
      }
    }

    return null;
  }, [getTodaySchedules]);

  // Get next upcoming slot today
  const getNextSlotToday = useCallback(() => {
    const todaySchedules = getTodaySchedules();
    if (todaySchedules.length === 0) return null;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Encontrar el próximo slot que aún no ha empezado
    for (const slot of todaySchedules) {
      if (currentTime < slot.start) {
        return slot;
      }
    }

    return null; // No more slots today
  }, [getTodaySchedules]);

  // Legacy function for backward compatibility
  const getTodaySchedule = useCallback(() => {
    const todaySchedules = getTodaySchedules();
    return todaySchedules[0] || null;
  }, [getTodaySchedules]);

  // Calculate milliseconds until a specific time today
  const getMillisecondsUntilTime = (timeString: string, offsetMinutes: number = 0): number | null => {
    const now = new Date();
    const [hours, minutes] = timeString.split(':').map(Number);

    const targetTime = new Date();
    targetTime.setHours(hours, minutes, 0, 0);
    targetTime.setTime(targetTime.getTime() - offsetMinutes * 60 * 1000);

    const diff = targetTime.getTime() - now.getTime();
    return diff > 0 ? diff : null;
  };

  // Schedule notifications for today's schedule
  const scheduleTodayNotifications = useCallback(() => {
    // Clear existing timeouts
    if (preStartNotificationRef.current) {
      clearTimeout(preStartNotificationRef.current);
      preStartNotificationRef.current = null;
    }
    if (postEndNotificationRef.current) {
      clearTimeout(postEndNotificationRef.current);
      postEndNotificationRef.current = null;
    }

    if (!scheduleNotificationsEnabled || Notification.permission !== 'granted') return;

    const todaySchedule = getTodaySchedule();
    if (!todaySchedule) return;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Schedule pre-start notification (X minutes before start)
    if (todaySchedule.start > currentTime) {
      const msUntilPreStart = getMillisecondsUntilTime(todaySchedule.start, preStartMinutes);
      if (msUntilPreStart && msUntilPreStart > 0) {
        preStartNotificationRef.current = setTimeout(async () => {
          if (!gpsActiveRef.current && Notification.permission === 'granted') {
            const startFormatted = todaySchedule.start;
            await showNotification('🚕 ¡Empieza tu horario pronto!', {
              body: `Tu horario comienza a las ${startFormatted}. ¡Activa el GPS para recibir clientes!`,
              tag: 'schedule-pre-start',
              requireInteraction: true,
              data: { url: window.location.origin + window.location.pathname },
            });
          }
        }, msUntilPreStart);
      }
    }

    // Schedule post-end notification (X minutes after end)
    if (todaySchedule.end > currentTime) {
      const msUntilPostEnd = getMillisecondsUntilTime(todaySchedule.end, -postEndMinutes);
      if (msUntilPostEnd && msUntilPostEnd > 0) {
        postEndNotificationRef.current = setTimeout(async () => {
          if (gpsActiveRef.current && Notification.permission === 'granted') {
            await showNotification('🚕 Tu horario ha terminado', {
              body: `Tu horario terminó hace ${postEndMinutes} minutos. ¿Quieres desactivar el GPS?`,
              tag: 'schedule-post-end',
              requireInteraction: true,
              data: { url: window.location.origin + window.location.pathname },
            });
          }
        }, msUntilPostEnd);
      }
    }
  }, [scheduleNotificationsEnabled, getTodaySchedule, preStartMinutes, postEndMinutes]);

  // Auto-activate GPS when schedule starts
  useEffect(() => {
    // No ejecutar si está en modo 24/7 (sin horarios fijos) o modo 'always'
    // En estos casos, el GPS se controla manualmente sin restricciones de horario
    if (is24h || tracking.mode === 'always') return;

    // Solo ejecutar si: auto-GPS activado, hay horarios, y hay consentimiento
    if (!autoGpsEnabled || !tracking.schedule.length || !hasGpsConsent) return;

    // Helper function to add/subtract minutes from a time string (handles negatives correctly)
    const adjustTime = (timeStr: string, minutesAdjust: number): string => {
      const [hours, mins] = timeStr.split(':').map(Number);
      let totalMinutes = hours * 60 + mins + minutesAdjust;
      
      // Handle day wraparound
      if (totalMinutes < 0) totalMinutes += 24 * 60;
      if (totalMinutes >= 24 * 60) totalMinutes -= 24 * 60;
      
      const newHours = Math.floor(totalMinutes / 60);
      const newMins = totalMinutes % 60;
      return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
    };

    const checkAndAutoActivate = () => {
      const todaySchedules = getTodaySchedules();
      if (todaySchedules.length === 0) {
        // Hoy no hay horarios, desactivar GPS si está activo
        if (gpsActiveRef.current) {
          console.log('🔴 Auto-desactivando GPS - hoy no hay horarios');
          stopGPSTracking(true);
        }
        return;
      }

      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      // Verificar si estamos en algún slot activo (considerando los minutos de margen)
      let shouldBeActive = false;
      let currentSlotInfo = '';

      for (const slot of todaySchedules) {
        const adjustedStart = adjustTime(slot.start, -preStartMinutes);
        const adjustedEnd = adjustTime(slot.end, postEndMinutes);

        if (currentTime >= adjustedStart && currentTime <= adjustedEnd) {
          shouldBeActive = true;
          currentSlotInfo = `slot ${slot.start}-${slot.end} (ajustado: ${adjustedStart}-${adjustedEnd})`;
          break;
        }
      }

      console.log('🔍 Auto-GPS Check:', {
        currentTime,
        slots: todaySchedules.map(s => `${s.start}-${s.end}`),
        shouldBeActive,
        gpsActive: gpsActiveRef.current
      });

      if (shouldBeActive && !gpsActiveRef.current) {
        console.log('🟢 Auto-activando GPS - dentro de horario:', currentSlotInfo);
        startGPSTracking(true, true);
      } else if (!shouldBeActive && gpsActiveRef.current) {
        console.log('🔴 Auto-desactivando GPS - fuera de todos los horarios');
        stopGPSTracking(true);
      }
    };

    // Check every minute
    scheduleCheckIntervalRef.current = setInterval(checkAndAutoActivate, 60000);
    checkAndAutoActivate(); // Check immediately

    return () => {
      if (scheduleCheckIntervalRef.current) {
        clearInterval(scheduleCheckIntervalRef.current);
      }
    };
  }, [autoGpsEnabled, tracking.schedule, hasGpsConsent, getTodaySchedules, startGPSTracking, stopGPSTracking, preStartMinutes, postEndMinutes]);

  // Schedule notifications when settings change
  useEffect(() => {
    scheduleTodayNotifications();

    // Re-schedule at midnight for the next day
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    const midnightTimeout = setTimeout(() => {
      scheduleTodayNotifications();
    }, msUntilMidnight);

    return () => {
      clearTimeout(midnightTimeout);
      if (preStartNotificationRef.current) {
        clearTimeout(preStartNotificationRef.current);
      }
      if (postEndNotificationRef.current) {
        clearTimeout(postEndNotificationRef.current);
      }
    };
  }, [scheduleTodayNotifications, tracking.schedule, tracking.mode]);

  // Toggle schedule notifications
  const toggleScheduleNotifications = (enabled: boolean) => {
    setScheduleNotificationsEnabled(enabled);
    localStorage.setItem('schedule-notifications-enabled', enabled.toString());
    if (enabled) {
      scheduleTodayNotifications();
    }
  };

  // Toggle auto GPS
  const toggleAutoGps = (enabled: boolean) => {
    setAutoGpsEnabled(enabled);
    localStorage.setItem('auto-gps-enabled', enabled.toString());
  };

  // Update pre-start minutes
  const updatePreStartMinutes = (minutes: number) => {
    setPreStartMinutes(minutes);
    localStorage.setItem('pre-start-minutes', minutes.toString());
    scheduleTodayNotifications();
  };

  // Update post-end minutes
  const updatePostEndMinutes = (minutes: number) => {
    setPostEndMinutes(minutes);
    localStorage.setItem('post-end-minutes', minutes.toString());
    scheduleTodayNotifications();
  };

  // Cargar estado del tracking (enabled/lastLocationAt) desde la BD
  // NOTA: El schedule y mode NO se cargan desde aquí, vienen de los horarios del Dashboard (workingHours)
  useEffect(() => {
    const fetchTracking = async () => {
      try {
        const res = await fetch(`/api/driver/tracking?driverId=${driverId}`);
        const data = await res.json();
        if (data.success) {
          // Solo cargar enabled y lastLocationAt
          // El schedule se deriva de los horarios del Dashboard via externalSchedules prop
          setTracking(prev => ({
            ...prev,
            enabled: data.tracking.enabled,
            lastLocationAt: data.tracking.lastLocationAt,
          }));
        }
      } catch (error) {
        console.error("Error loading tracking config:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();
  }, [driverId]);

  // Guardar configuración de horarios
  const saveConfig = async (newConfig: Partial<TrackingConfig>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/driver/tracking", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId,
          ...newConfig,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTracking(data.tracking);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error saving tracking config:", error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Actualizar horario
  const updateSchedule = (
    day: number,
    field: "start" | "end",
    value: string
  ) => {
    const newSchedule = [...tracking.schedule];
    const existingIndex = newSchedule.findIndex((s) => s.day === day);

    if (existingIndex >= 0) {
      newSchedule[existingIndex] = {
        ...newSchedule[existingIndex],
        [field]: value,
      };
    } else {
      const newEntry = {
        day,
        start: field === "start" ? value : "09:00",
        end: field === "end" ? value : "18:00",
      };
      newSchedule.push(newEntry);
    }

    setTracking({ ...tracking, schedule: newSchedule });
  };

  // Obtener horario de un día
  const getScheduleForDay = (day: number) => {
    return tracking.schedule.find((s) => s.day === day) || {
      day,
      start: "09:00",
      end: "18:00",
    };
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (sendIntervalRef.current) {
        clearInterval(sendIntervalRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  return (
    <>
      {/* GPS Consent Dialog */}
      {showGpsConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 mx-4 max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full bg-yellow-400/20 flex items-center justify-center">
                <Navigation className="h-7 w-7 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-xl">{t('gps.consent.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('gps.consent.permissionLabel')}</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <p className="text-sm text-muted-foreground">
                Para aparecer en el mapa y recibir clientes, necesitas activar el seguimiento GPS.
              </p>
              
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-sm">¿Qué implica activar el GPS?</h4>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <Eye className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Tu ubicación será visible para clientes que busquen taxis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span>Se actualiza automáticamente cada 5 segundos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <EyeOff className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>Puedes desactivarlo cuando quieras dejar de estar visible</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Tu ubicación solo se usa para mostrar tu posición a potenciales clientes. 
                    No compartimos tus datos con terceros. Puedes revocar este consentimiento 
                    en cualquier momento desactivando el GPS.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowGpsConsent(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                onClick={acceptGpsConsent}
              >
                <Navigation className="mr-2 h-4 w-4" />
                {t('gps.activate')}
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground text-center mt-4">
              Al activar el GPS, aceptas compartir tu ubicación con los usuarios de eitaxi
            </p>
          </div>
        </div>
      )}

      <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-yellow-400" />
          Seguimiento GPS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estado actual */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
          <div className="flex items-center gap-3">
            <div
              className={`h-3 w-3 rounded-full ${
                gpsActive
                  ? "bg-green-500 animate-pulse"
                  : "bg-gray-500"
              }`}
            />
            <div>
              <div className="font-medium flex items-center gap-2">
                {gpsActive ? "GPS Activo" : "GPS Inactivo"}
                {gpsAutoActivated && (
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    Auto
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {lastSent
                  ? `Última actualización: ${lastSent.toLocaleTimeString()}`
                  : gpsActive ? t('profile.gettingLocation') : t('gps.notTransmitting')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {gpsActive ? (
              <Wifi className="h-5 w-5 text-green-400" />
            ) : (
              <WifiOff className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Error de GPS - Mensaje simple (si no es permiso denegado) */}
        {gpsError && !gpsPermissionDenied && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-sm text-red-400">{gpsError}</span>
          </div>
        )}

        {/* PANEL DE AYUDA - Permiso denegado */}
        {gpsPermissionDenied && showPermissionHelp && (
          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-400 flex-shrink-0" />
              <span className="font-semibold text-sm text-orange-400">
                Permiso de ubicación denegado
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              El navegador recordó que denegaste el acceso a tu ubicación. Para activar el GPS, sigue estos pasos según tu navegador:
            </p>

            <div className="space-y-3">
              {/* Chrome Android */}
              <details className="bg-muted/30 rounded-lg p-3">
                <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                  <Globe className="h-4 w-4 text-green-400" />
                  Chrome Android
                </summary>
                <ol className="mt-2 ml-6 text-xs text-muted-foreground space-y-1 list-decimal">
                  <li>Toca el icono de <b>candado</b> a la izquierda de la barra de dirección</li>
                  <li>Busca <b>"Ubicación"</b></li>
                  <li>Cambia a <b>"Permitir"</b></li>
                  <li>Recarga esta página</li>
                </ol>
              </details>

              {/* Safari iPhone */}
              <details className="bg-muted/30 rounded-lg p-3">
                <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                  <Smartphone className="h-4 w-4 text-blue-400" />
                  Safari iPhone
                </summary>
                <ol className="mt-2 ml-6 text-xs text-muted-foreground space-y-1 list-decimal">
                  <li>Abre <b>Ajustes</b> del iPhone</li>
                  <li>Ve a <b>Safari &gt; Configurar sitio web</b></li>
                  <li>Busca esta página y toca <b>Ubicación</b></li>
                  <li>Cambia a <b>"Permitir"</b></li>
                  <li>Vuelve a esta página</li>
                </ol>
              </details>

              {/* Chrome PC */}
              <details className="bg-muted/30 rounded-lg p-3">
                <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                  <Monitor className="h-4 w-4 text-yellow-400" />
                  Chrome PC
                </summary>
                <ol className="mt-2 ml-6 text-xs text-muted-foreground space-y-1 list-decimal">
                  <li>Haz clic en el icono de <b>candado</b> a la izquierda de la barra de dirección</li>
                  <li>Ve a <b>"Site settings"</b> (o Configuración del sitio)</li>
                  <li>Busca <b>"Location"</b> (Ubicación)</li>
                  <li>Cambia a <b>"Allow"</b> (Permitir)</li>
                  <li>Recarga esta página</li>
                </ol>
              </details>

              {/* Firefox PC */}
              <details className="bg-muted/30 rounded-lg p-3">
                <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                  <Globe className="h-4 w-4 text-orange-400" />
                  Firefox PC
                </summary>
                <ol className="mt-2 ml-6 text-xs text-muted-foreground space-y-1 list-decimal">
                  <li>Haz clic en el icono de <b>candado</b> a la izquierda de la barra de dirección</li>
                  <li>Junto a <b>"Ubicación"</b>, haz clic en <b>"Borrar permisos y recargar"</b></li>
                  <li>O usa <b>Ajustes &gt; Privacidad y seguridad</b> para buscar esta página</li>
                </ol>
              </details>
            </div>

            <Button
              variant="outline"
              className="w-full border-orange-400/50 text-orange-400 hover:bg-orange-400/10"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Recargar página
            </Button>
          </div>
        )}

        {/* ESTADO DEL PERMISO GPS - Indicador antes del botón principal */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-yellow-400" />
              <Label className="text-sm font-medium">Permiso de ubicación</Label>
            </div>
            {gpsPermissionState === 'granted' && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Check className="h-3 w-3 mr-1" />
                Concedido
              </Badge>
            )}
            {gpsPermissionState === 'denied' && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                <AlertCircle className="h-3 w-3 mr-1" />
                Denegado
              </Badge>
            )}
            {gpsPermissionState === 'prompt' && (
              <Badge variant="outline" className="text-yellow-400 border-yellow-400/50">
                <AlertCircle className="h-3 w-3 mr-1" />
                Sin pedir
              </Badge>
            )}
            {gpsPermissionState === 'unsupported' && (
              <Badge variant="outline" className="text-muted-foreground">
                No verificable
              </Badge>
            )}
            {gpsPermissionState === null && (
              <Badge variant="outline" className="text-muted-foreground">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Verificando...
              </Badge>
            )}
          </div>

          {/* Description according to state */}
          {gpsPermissionState === 'granted' && (
            <p className="text-xs text-green-400/80">
              Tu navegador permite compartir tu ubicacion. Puedes activar el GPS cuando quieras.
            </p>
          )}
          {gpsPermissionState === 'denied' && (
            <div className="space-y-3">
              <p className="text-xs text-red-400/80">
                Bloqueaste el acceso a tu ubicacion para este sitio. Necesitas desbloquearlo en la configuracion de tu navegador para usar el GPS.
              </p>
              <Button
                variant="outline"
                className="w-full border-orange-400/50 text-orange-400 hover:bg-orange-400/10"
                onClick={() => setShowPermissionHelp(!showPermissionHelp)}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                {showPermissionHelp ? 'Ocultar instrucciones' : 'Como desbloquear el permiso'}
              </Button>
            </div>
          )}
          {gpsPermissionState === 'prompt' && (
            <p className="text-xs text-yellow-400/80">
              Aun no has respondido al permiso de ubicacion. Al pulsar Iniciar GPS se te pedira.
            </p>
          )}
          {gpsPermissionState === 'unsupported' && (
            <p className="text-xs text-muted-foreground">
              Tu navegador (ej. Safari en iPhone) no permite verificar el permiso de antemano. Al pulsar Iniciar GPS se te pedira si es necesario.
            </p>
          )}

          {/* Boton para solicitar permiso (si no esta concedido) */}
          {(gpsPermissionState === 'prompt' || gpsPermissionState === 'unsupported') && !gpsActive && (
            <Button
              variant="outline"
              className="w-full border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
              onClick={async () => {
                try {
                  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                      enableHighAccuracy: true,
                      timeout: 10000,
                      maximumAge: 5000,
                    });
                  });
                  setGpsPermissionState('granted');
                  setGpsPermissionDenied(false);
                  setShowPermissionHelp(false);
                  setCurrentPosition({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                  });
                } catch (error) {
                  if (error instanceof GeolocationPositionError) {
                    if (error.code === error.PERMISSION_DENIED) {
                      setGpsPermissionState('denied');
                      setGpsPermissionDenied(true);
                      setShowPermissionHelp(true);
                    }
                  }
                }
              }}
            >
              <MapPin className="mr-2 h-4 w-4" />
              Solicitar permiso de ubicacion
            </Button>
          )}
        </div>

        {/* BOTON PRINCIPAL GPS - Siempre visible */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Radio className="h-4 w-4" />
            Control del GPS
          </Label>
          <Button
            className={`w-full h-14 text-lg ${
              gpsActive
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
            onClick={toggleGPS}
          >
            {gpsActive ? (
              <>
                <Power className="mr-2 h-5 w-5" />
                Detener GPS
              </>
            ) : (
              <>
                <Navigation className="mr-2 h-5 w-5" />
                Iniciar GPS
              </>
            )}
          </Button>

          {/* Posición actual */}
          {currentPosition && (
            <div className="p-3 rounded-lg bg-muted/30 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-yellow-400" />
                <span>
                  {currentPosition.lat.toFixed(6)},{" "}
                  {currentPosition.lng.toFixed(6)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* AUTO-ACTIVAR GPS - Posición prominente cuando hay horarios */}
        {!is24h && tracking.schedule.length > 0 && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  autoGpsEnabled ? "bg-purple-500/30" : "bg-muted"
                }`}>
                  <Zap className={`h-6 w-6 transition-colors ${autoGpsEnabled ? "text-purple-400" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="font-semibold text-base">
                    Auto-activar GPS
                  </p>
                  <p className="text-sm text-muted-foreground">
                    El GPS se activa/desactiva según tu horario
                  </p>
                </div>
              </div>
              <Switch
                checked={autoGpsEnabled}
                onCheckedChange={toggleAutoGps}
                className="data-[state=checked]:bg-purple-500"
              />
            </div>

            {/* Configuración cuando está activado */}
            {autoGpsEnabled && (
              <div className="mt-4 pt-4 border-t border-purple-500/20 space-y-3">
                <div className="flex items-center gap-2 text-sm text-purple-300">
                  <Check className="h-4 w-4" />
                  <span>Se activará <strong>{preStartMinutes} min antes</strong> de tu horario</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-purple-300">
                  <Check className="h-4 w-4" />
                  <span>Se desactivará <strong>{postEndMinutes} min después</strong> de tu horario</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-purple-300">
                  <Check className="h-4 w-4" />
                  <span>Maneja pausas entre turnos automáticamente</span>
                </div>

                {/* AVISO IMPORTANTE - App debe estar abierta */}
                <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mt-3">
                  <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="text-yellow-400 font-medium">⚠️ Importante:</p>
                    <p className="text-yellow-300/80 mt-1">
                      El auto-activado <strong>solo funciona con esta página abierta</strong>. 
                      Si cierras el navegador o la app, no se activará automáticamente.
                    </p>
                    <p className="text-yellow-300/80 mt-1">
                      💡 Recomendación: Deja esta pestaña abierta en segundo plano.
                    </p>
                  </div>
                </div>

                {/* Configuración de minutos */}
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="bg-background/50 rounded-lg p-3">
                    <Label className="text-xs text-muted-foreground">Activar antes</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updatePreStartMinutes(Math.max(0, preStartMinutes - 5))}
                        className="h-8 w-8 p-0"
                      >
                        -
                      </Button>
                      <span className="text-lg font-bold w-12 text-center">{preStartMinutes}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updatePreStartMinutes(preStartMinutes + 5)}
                        className="h-8 w-8 p-0"
                      >
                        +
                      </Button>
                      <span className="text-xs text-muted-foreground ml-1">min</span>
                    </div>
                  </div>
                  <div className="bg-background/50 rounded-lg p-3">
                    <Label className="text-xs text-muted-foreground">Mantener después</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updatePostEndMinutes(Math.max(0, postEndMinutes - 5))}
                        className="h-8 w-8 p-0"
                      >
                        -
                      </Button>
                      <span className="text-lg font-bold w-12 text-center">{postEndMinutes}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updatePostEndMinutes(postEndMinutes + 5)}
                        className="h-8 w-8 p-0"
                      >
                        +
                      </Button>
                      <span className="text-xs text-muted-foreground ml-1">min</span>
                    </div>
                  </div>
                </div>

                {!hasGpsConsent && (
                  <div className="flex items-center gap-2 p-3 bg-orange-500/10 rounded-lg mt-3">
                    <AlertCircle className="h-4 w-4 text-orange-400" />
                    <span className="text-sm text-orange-400">
                      Activa el GPS al menos una vez para que funcione el auto-activado
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Info */}
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 text-sm space-y-2">
          <p className="text-blue-400">
            💡 <strong>Cómo funciona:</strong>
          </p>
          <ul className="text-blue-300 space-y-1 text-xs ml-4">
            <li>• <strong>Iniciar GPS:</strong> Apareces en el mapa de los clientes</li>
            <li>• <strong>Detener GPS:</strong> Desapareces del mapa inmediatamente</li>
            <li>• Tu ubicación se actualiza cada 5 segundos automáticamente</li>
          </ul>
        </div>

        <Separator />

        {/* Configuración avanzada (opcional) */}
        <details className="group">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuración avanzada
            <span className="ml-auto text-xs group-open:rotate-180 transition-transform">▼</span>
          </summary>
          
          <div className="mt-4 space-y-4">
            {/* Explicación importante */}
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-xs">
              <p className="text-yellow-400 font-medium mb-1">⚠️ Importante:</p>
              <p className="text-yellow-300/80">
                El GPS <strong>NO se activa automáticamente</strong> (a menos que actives la opción abajo). 
                Debes presionar el botón "Iniciar GPS" arriba cada vez que quieras aparecer en el mapa.
              </p>
            </div>

            {/* SECCIÓN DE HORARIOS - Con opciones Sin horario fijo / Horarios fijos */}
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  Tipo de horario
                </Label>
                {onNavigateToSchedules && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onNavigateToSchedules}
                    className="text-xs border-blue-400 text-blue-400 hover:bg-blue-400/10"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Editar en Horarios
                  </Button>
                )}
              </div>

              {/* Opciones de tipo de horario */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {/* Opción: Sin horario fijo */}
                <button
                  type="button"
                  onClick={() => {
                    if (onIs24hChange) onIs24hChange(true);
                    setShowFixedSchedules(false);
                  }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    is24h
                      ? "border-green-500 bg-green-500/10"
                      : "border-border bg-background/50 hover:border-green-500/50 hover:bg-green-500/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      is24h ? "bg-green-500/20" : "bg-muted"
                    }`}>
                      <Sun className={`h-5 w-5 ${is24h ? "text-green-400" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${is24h ? "text-green-400" : "text-foreground"}`}>
                        Sin horario fijo
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Disponible cuando quiera, sin horarios definidos
                      </p>
                    </div>
                    {is24h && (
                      <Check className="h-5 w-5 text-green-400" />
                    )}
                  </div>
                </button>

                {/* Opción: Horarios fijos */}
                <button
                  type="button"
                  onClick={() => {
                    if (onIs24hChange) onIs24hChange(false);
                    setShowFixedSchedules(!showFixedSchedules);
                  }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    !is24h
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-border bg-background/50 hover:border-blue-500/50 hover:bg-blue-500/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      !is24h ? "bg-blue-500/20" : "bg-muted"
                    }`}>
                      <Clock className={`h-5 w-5 ${!is24h ? "text-blue-400" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${!is24h ? "text-blue-400" : "text-foreground"}`}>
                        Horarios fijos
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Trabajo en días y horas específicas
                      </p>
                    </div>
                    {!is24h && (
                      <Check className="h-5 w-5 text-blue-400" />
                    )}
                  </div>
                </button>
              </div>

              {/* Mostrar horarios configurados cuando está en modo "Horarios fijos" */}
              {!is24h && (
                <div className="mt-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer p-2 rounded-lg bg-background/30 hover:bg-background/50"
                    onClick={() => setShowFixedSchedules(!showFixedSchedules)}
                  >
                    <span className="text-sm font-medium">
                      {tracking.schedule.length > 0 
                        ? `${tracking.schedule.length} horario(s) configurado(s)` 
                        : "Sin horarios configurados"}
                    </span>
                    <span className={`text-xs transition-transform ${showFixedSchedules ? "rotate-180" : ""}`}>
                      ▼
                    </span>
                  </div>

                  {/* Desplegar horarios */}
                  {showFixedSchedules && (
                    <div className="mt-3 space-y-1 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                      {tracking.schedule.length > 0 ? (
                        daysOfWeek.map((day) => {
                          const daySlots = tracking.schedule.filter(s => s.day === day.value);
                          if (daySlots.length === 0) return null;
                          return (
                            <div key={day.value} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-background/30">
                              <span className="w-16 font-medium text-muted-foreground">{day.label}</span>
                              <span className="text-blue-300">
                                {daySlots.map(s => `${s.start} - ${s.end}`).join(', ')}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex items-center gap-2 p-3 bg-orange-500/10 rounded-lg">
                          <AlertCircle className="h-4 w-4 text-orange-400" />
                          <span className="text-sm text-orange-400">
                            No tienes horarios configurados
                          </span>
                        </div>
                      )}

                      {tracking.schedule.length === 0 && onNavigateToSchedules && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onNavigateToSchedules}
                          className="w-full mt-2 border-orange-400 text-orange-400 hover:bg-orange-400/10"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Configurar horarios
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Mostrar cuando está en modo Sin horario fijo */}
              {is24h && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg mt-2">
                  <Sun className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-green-400 font-medium">
                    Modo flexible activado - Sin horarios fijos
                  </span>
                </div>
              )}
            </div>
          </div>
        </details>

        <Separator />

        {/* Notificaciones de Recordatorio */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base flex items-center gap-2">
                <Bell className="h-5 w-5 text-yellow-400" />
                Notificaciones
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Recibe alertas para no perderte clientes
              </p>
            </div>
            {notificationsEnabled ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Bell className="h-3 w-3 mr-1" />
                Activas
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                <BellOff className="h-3 w-3 mr-1" />
                Inactivas
              </Badge>
            )}
          </div>

          {/* Warning banner - NO OLVIDES ACTIVAR NOTIFICACIONES */}
          {tracking.schedule.length > 0 && !notificationsEnabled && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-400 font-medium mb-1">
                    ⚠️ ¡No olvides activar las notificaciones!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sin notificaciones, no recibirás avisos antes de tu horario. Actívalas para no perderte clientes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!notificationsEnabled ? (
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <div className="flex items-start gap-3">
                  <Smartphone className="h-5 w-5 text-orange-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-orange-400 font-medium mb-1">
                      Activa las notificaciones para no perderte clientes
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Te avisaremos antes de tu horario y cuando olvides activar el GPS.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                onClick={requestNotificationPermission}
              >
                <Bell className="mr-2 h-4 w-4" />
                Activar notificaciones
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Intervalo de recordatorio general */}
              <div>
                <Label className="text-sm mb-2 block">
                  Recordarme cada (si GPS apagado):
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 60, 120].map((mins) => (
                    <Button
                      key={mins}
                      type="button"
                      variant={reminderInterval === mins ? "default" : "outline"}
                      size="sm"
                      className={reminderInterval === mins ? "bg-yellow-400 text-black" : ""}
                      onClick={() => updateReminderInterval(mins)}
                    >
                      {mins >= 60 ? `${mins / 60}h` : `${mins}min`}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Schedule Notifications */}
              {!is24h && tracking.schedule.length > 0 && (
                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm flex items-center gap-2">
                        <BellRing className="h-4 w-4 text-purple-400" />
                        Notificaciones de horario
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Te avisamos antes de empezar y después de terminar
                      </p>
                    </div>
                    <Switch
                      checked={scheduleNotificationsEnabled}
                      onCheckedChange={toggleScheduleNotifications}
                      disabled={tracking.schedule.length === 0}
                    />
                  </div>

                  {tracking.schedule.length === 0 ? (
                    <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
                      📅 Configura tus horarios arriba y guárdalos para activar esta opción
                    </div>
                  ) : scheduleNotificationsEnabled && (
                    <div className="space-y-3 pt-2 border-t border-purple-500/20">
                      {/* Pre-start notification timing */}
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">
                          Avisarme antes de empezar:
                        </Label>
                        <div className="grid grid-cols-4 gap-2">
                          {[5, 10, 15, 30].map((mins) => (
                            <Button
                              key={mins}
                              type="button"
                              variant={preStartMinutes === mins ? "default" : "outline"}
                              size="sm"
                              className={preStartMinutes === mins ? "bg-purple-500 text-white" : ""}
                              onClick={() => updatePreStartMinutes(mins)}
                            >
                              {mins} min
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Post-end notification timing */}
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">
                          Avisarme después de terminar:
                        </Label>
                        <div className="grid grid-cols-4 gap-2">
                          {[0, 5, 10, 15].map((mins) => (
                            <Button
                              key={mins}
                              type="button"
                              variant={postEndMinutes === mins ? "default" : "outline"}
                              size="sm"
                              className={postEndMinutes === mins ? "bg-purple-500 text-white" : ""}
                              onClick={() => updatePostEndMinutes(mins)}
                            >
                              {mins === 0 ? 'Al instante' : `${mins} min`}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Auto GPS Activation */}
              {!is24h && tracking.schedule.length > 0 && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm flex items-center gap-2">
                        <Zap className="h-4 w-4 text-green-400" />
                        Activación automática GPS
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        El GPS se activa/desactiva según tu horario
                      </p>
                    </div>
                    <Switch
                      checked={autoGpsEnabled}
                      onCheckedChange={toggleAutoGps}
                      disabled={tracking.schedule.length === 0}
                    />
                  </div>

                  {tracking.schedule.length === 0 ? (
                    <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
                      📅 Configura tus horarios arriba y guárdalos para activar esta opción
                    </div>
                  ) : autoGpsEnabled && (
                    <div className="p-2 rounded bg-green-500/10 text-xs text-green-300 flex items-start gap-2">
                      <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>
                        El GPS se activará automáticamente al inicio de tu horario y se desactivará al final.
                        Debes tener esta página abierta para que funcione.
                      </span>
                    </div>
                  )}
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={disableNotifications}
              >
                <BellOff className="mr-2 h-4 w-4" />
                Desactivar todas las notificaciones
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    </>
  );
}

// Mensajes de error de GPS
function getGpsErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Permiso de ubicación denegado. Actívalo en la configuración del navegador.";
    case error.POSITION_UNAVAILABLE:
      return "Ubicación no disponible. Intenta en otro lugar.";
    case error.TIMEOUT:
      return "Tiempo de espera agotado. Intenta de nuevo.";
    default:
      return "Error desconocido al obtener ubicación.";
  }
}
