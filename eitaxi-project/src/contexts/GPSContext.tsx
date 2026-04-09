"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";

interface GPSContextType {
  // Estado
  gpsActive: boolean;
  trackingEnabled: boolean;
  currentPosition: { lat: number; lng: number } | null;
  lastSent: Date | null;
  error: string | null;

  // Acciones
  toggleGPS: () => Promise<void>;
  enableTracking: () => Promise<void>;
  refreshTrackingStatus: () => Promise<void>;
}

const GPSContext = createContext<GPSContextType | null>(null);

export function useGPS() {
  const context = useContext(GPSContext);
  if (!context) {
    throw new Error("useGPS must be used within a GPSProvider");
  }
  return context;
}

interface GPSProviderProps {
  driverId: string;
  children: ReactNode;
}

export function GPSProvider({ driverId, children }: GPSProviderProps) {
  const [gpsActive, setGpsActive] = useState(false);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [lastSent, setLastSent] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const sendIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cargar configuración inicial
  const refreshTrackingStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/driver/tracking?driverId=${driverId}`);
      const data = await res.json();
      if (data.success) {
        setTrackingEnabled(data.tracking.enabled);
      }
    } catch (err) {
      console.error("Error loading tracking config:", err);
    }
  }, [driverId]);

  // Cargar al iniciar
  useEffect(() => {
    refreshTrackingStatus();
  }, [refreshTrackingStatus]);

  // Verificar estado guardado en localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(`gps-active-${driverId}`);
    if (savedState === "true" && trackingEnabled) {
      // Intentar reactivar el GPS si estaba activo
      startGPSTracking();
    }
  }, [trackingEnabled]);

  // Función para iniciar el tracking
  const startGPSTracking = useCallback(() => {
    // Verificar HTTPS
    const isSecure =
      typeof window !== "undefined" &&
      (window.location.protocol === "https:" ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    if (!isSecure) {
      setError("Se requiere conexión HTTPS para usar el GPS");
      return false;
    }

    if (!navigator.geolocation) {
      setError("Tu dispositivo no soporta geolocalización");
      return false;
    }

    setError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setError(null);
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Permiso denegado. Activa la ubicación en tu navegador."
            : "Error al obtener ubicación"
        );
        setGpsActive(false);
        localStorage.removeItem(`gps-active-${driverId}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    setGpsActive(true);
    localStorage.setItem(`gps-active-${driverId}`, "true");

    // Notificación
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("✅ GPS Activado", {
          body: "Tu ubicación se está compartiendo en tiempo real",
          icon: "/icon.svg",
        });
      } catch (e) {
        // Ignorar errores
      }
    }

    return true;
  }, []);

  // Función para detener el tracking
  const stopGPSTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (sendIntervalRef.current) {
      clearInterval(sendIntervalRef.current);
      sendIntervalRef.current = null;
    }

    setGpsActive(false);
    setCurrentPosition(null);
    setError(null);
    localStorage.removeItem(`gps-active-${driverId}`);

    // Notificación
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("🛑 GPS Desactivado", {
          body: "Tu ubicación ya no se está compartiendo",
          icon: "/icon.svg",
        });
      } catch (e) {
        // Ignorar errores
      }
    }
  }, []);

  // Enviar ubicación al servidor
  useEffect(() => {
    if (gpsActive && currentPosition && trackingEnabled) {
      const sendLocation = async () => {
        try {
          await fetch("/api/driver/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              driverId,
              latitude: currentPosition.lat,
              longitude: currentPosition.lng,
            }),
          });
          setLastSent(new Date());
        } catch (err) {
          console.error("Error sending location:", err);
        }
      };

      sendLocation();
      sendIntervalRef.current = setInterval(sendLocation, 5000);

      return () => {
        if (sendIntervalRef.current) {
          clearInterval(sendIntervalRef.current);
        }
      };
    }
  }, [gpsActive, currentPosition, driverId, trackingEnabled]);

  // Limpiar al desmontar
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

  // Toggle GPS
  const toggleGPS = useCallback(async () => {
    if (gpsActive) {
      stopGPSTracking();
    } else {
      // Pedir permiso de notificación
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission();
      }
      startGPSTracking();
    }
  }, [gpsActive, startGPSTracking, stopGPSTracking]);

  // Habilitar tracking en la base de datos
  const enableTracking = useCallback(async () => {
    try {
      const res = await fetch("/api/driver/tracking", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId,
          enabled: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTrackingEnabled(true);
      }
    } catch (err) {
      console.error("Error enabling tracking:", err);
    }
  }, [driverId]);

  return (
    <GPSContext.Provider
      value={{
        gpsActive,
        trackingEnabled,
        currentPosition,
        lastSent,
        error,
        toggleGPS,
        enableTracking,
        refreshTrackingStatus,
      }}
    >
      {children}
    </GPSContext.Provider>
  );
}
