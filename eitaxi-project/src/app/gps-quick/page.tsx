"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Navigation,
  Power,
  Radio,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ============================================
// PÁGINA SIMPLE PARA TAXISTAS
// Solo un BOTÓN GIGANTE de GPS
// Ideal para acceso directo en el móvil
// ============================================

export default function GPSQuickPage() {
  const [loading, setLoading] = useState(true);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [gpsActive, setGpsActive] = useState(false);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [lastSent, setLastSent] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cargar driverId desde localStorage
  useEffect(() => {
    const savedDriverId = localStorage.getItem("driverId");
    if (savedDriverId) {
      setDriverId(savedDriverId);
      loadTrackingStatus(savedDriverId);
    } else {
      setLoading(false);
    }
  }, []);

  // Cargar estado de tracking
  const loadTrackingStatus = async (id: string) => {
    try {
      const res = await fetch(`/api/driver/tracking?driverId=${id}`);
      const data = await res.json();
      if (data.success) {
        setTrackingEnabled(data.tracking.enabled);

        // Verificar si el GPS estaba activo
        const savedGpsActive = localStorage.getItem(`gps-active-${id}`);
        if (savedGpsActive === "true" && data.tracking.enabled) {
          startGPS(id);
        }
      }
    } catch (err) {
      console.error("Error loading tracking:", err);
    } finally {
      setLoading(false);
    }
  };

  // Iniciar GPS
  const startGPS = (id: string) => {
    if (!navigator.geolocation) {
      setError("GPS no soportado en este dispositivo");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setError(null);

        // Enviar ubicación
        sendLocation(id, position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        setError(err.code === err.PERMISSION_DENIED
          ? "Activa los permisos de ubicación"
          : "Error al obtener ubicación");
        setGpsActive(false);
        localStorage.removeItem(`gps-active-${id}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    // Guardar watchId
    (window as any).gpsWatchId = watchId;
    setGpsActive(true);
    localStorage.setItem(`gps-active-${id}`, "true");

    // Notificación
    showNotification("✅ GPS Activado", "Tu ubicación se está compartiendo");
  };

  // Detener GPS
  const stopGPS = () => {
    if ((window as any).gpsWatchId !== undefined) {
      navigator.geolocation.clearWatch((window as any).gpsWatchId);
    }
    setGpsActive(false);
    setCurrentPosition(null);
    if (driverId) {
      localStorage.removeItem(`gps-active-${driverId}`);
    }
    showNotification("🛑 GPS Desactivado", "Tu ubicación ya no se comparte");
  };

  // Enviar ubicación al servidor
  const sendLocation = async (id: string, lat: number, lng: number) => {
    try {
      await fetch("/api/driver/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId: id,
          latitude: lat,
          longitude: lng,
        }),
      });
      setLastSent(new Date());
    } catch (err) {
      console.error("Error sending location:", err);
    }
  };

  // Mostrar notificación
  const showNotification = (title: string, body: string) => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, { body, icon: "/icon.svg" });
      } catch (e) {}
    }
  };

  // Toggle GPS
  const toggleGPS = async () => {
    // Pedir permiso de notificación
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }

    if (gpsActive) {
      stopGPS();
    } else {
      if (!driverId) return;

      // Habilitar tracking si no está activo
      if (!trackingEnabled) {
        try {
          await fetch("/api/driver/tracking", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ driverId, enabled: true }),
          });
          setTrackingEnabled(true);
        } catch (err) {
          setError("Error al activar seguimiento");
          return;
        }
      }

      startGPS(driverId);
    }
  };

  // Guardar driver ID
  const saveDriverId = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = formData.get("driverId") as string;
    if (id) {
      localStorage.setItem("driverId", id);
      setDriverId(id);
      loadTrackingStatus(id);
    }
  };

  // Pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-yellow-400" />
      </div>
    );
  }

  // Pedir driver ID
  if (!driverId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-yellow-400 mb-4">
              <Navigation className="h-10 w-10 text-black" />
            </div>
            <h1 className="text-3xl font-bold text-white">TaxiZone</h1>
            <p className="text-gray-400 mt-2">GPS para taxistas</p>
          </div>

          <form onSubmit={saveDriverId} className="space-y-4">
            <input
              type="text"
              name="driverId"
              placeholder="Tu ID de conductor"
              className="w-full px-4 py-4 rounded-xl bg-gray-700 text-white text-center text-lg border-2 border-gray-600 focus:border-yellow-400 focus:outline-none"
              required
            />
            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-yellow-400 text-black font-bold text-lg"
            >
              Continuar
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Encuentra tu ID en tu perfil de TaxiZone
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-6">
      {/* Estado */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
          gpsActive ? "bg-green-500/20 text-green-400" : "bg-gray-700 text-gray-400"
        }`}>
          <div className={`w-3 h-3 rounded-full ${
            gpsActive ? "bg-green-500 animate-pulse" : "bg-gray-500"
          }`} />
          <span className="font-medium">
            {gpsActive ? "GPS Activo" : "GPS Inactivo"}
          </span>
        </div>

        {lastSent && (
          <p className="text-gray-500 text-sm mt-2">
            Actualizado: {lastSent.toLocaleTimeString()}
          </p>
        )}
      </motion.div>

      {/* BOTÓN GIGANTE */}
      <motion.button
        onClick={toggleGPS}
        className={`w-56 h-56 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all ${
          gpsActive
            ? "bg-red-500 shadow-red-500/30"
            : "bg-green-500 shadow-green-500/30"
        }`}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: gpsActive
            ? "0 0 60px rgba(239, 68, 68, 0.5)"
            : "0 0 30px rgba(34, 197, 94, 0.3)"
        }}
      >
        <Power className="h-20 w-20 text-white mb-2" />
        <span className="text-white text-2xl font-bold">
          {gpsActive ? "DETENER" : "INICIAR"}
        </span>
        <span className="text-white/80 text-lg">GPS</span>
      </motion.button>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-center max-w-xs"
          >
            <AlertCircle className="h-6 w-6 mx-auto mb-2" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ubicación actual */}
      {currentPosition && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 text-gray-500 text-sm"
        >
          📍 {currentPosition.lat.toFixed(4)}, {currentPosition.lng.toFixed(4)}
        </motion.div>
      )}

      {/* Info */}
      <div className="fixed bottom-6 left-0 right-0 text-center">
        <p className="text-gray-600 text-xs">
          Mantén presionado para más opciones
        </p>
      </div>
    </div>
  );
}
