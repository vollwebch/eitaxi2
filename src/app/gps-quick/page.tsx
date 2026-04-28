"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Navigation,
  Power,
  Check,
  AlertCircle,
  Loader2,
  Download,
  Smartphone,
  Monitor,
  Share2,
  Plus,
  X,
  Home,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// ============================================
// PÁGINA QUICK GPS PARA TAXISTAS
// Botón gigante + Install PWA
// Ideal para acceso directo desde pantalla de inicio
// ============================================

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function GPSQuickPage() {
  const [loading, setLoading] = useState(true);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [gpsActive, setGpsActive] = useState(false);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [lastSent, setLastSent] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // PWA Install
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [isStandalone, setIsStandalone] = useState(false);

  // Cargar driverId y PWA setup
  useEffect(() => {
    // Check PWA standalone
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Detect device
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) {
      setDeviceType('ios');
    } else if (/Android/.test(ua)) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }

    // Listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Load driver session
    const savedDriverId = localStorage.getItem("driverId");
    if (savedDriverId) {
      setDriverId(savedDriverId);
      loadTrackingStatus(savedDriverId);
    } else {
      setLoading(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const loadTrackingStatus = async (id: string) => {
    try {
      const res = await fetch(`/api/driver/tracking?driverId=${id}`);
      const data = await res.json();
      if (data.success) {
        setTrackingEnabled(data.tracking.enabled);
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

  // ===== GPS Functions =====

  const startGPS = useCallback((id: string) => {
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

    (window as any).gpsWatchId = watchId;
    setGpsActive(true);
    localStorage.setItem(`gps-active-${id}`, "true");
    showNotification("✅ GPS Activado", "Tu ubicación se está compartiendo");
  }, []);

  const stopGPS = useCallback(() => {
    if ((window as any).gpsWatchId !== undefined) {
      navigator.geolocation.clearWatch((window as any).gpsWatchId);
      (window as any).gpsWatchId = undefined;
    }
    setGpsActive(false);
    setCurrentPosition(null);
    if (driverId) {
      localStorage.removeItem(`gps-active-${driverId}`);
      // Limpiar ubicaciones del servidor
      fetch(`/api/driver/location?driverId=${driverId}`, { method: "DELETE" }).catch(() => {});
      // Deshabilitar tracking
      fetch("/api/driver/tracking", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId, enabled: false }),
      }).catch(() => {});
    }
    showNotification("🛑 GPS Desactivado", "Tu ubicación ya no se comparte");
  }, [driverId]);

  const sendLocation = async (id: string, lat: number, lng: number) => {
    try {
      await fetch("/api/driver/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: id, latitude: lat, longitude: lng }),
      });
      setLastSent(new Date());
    } catch (err) {
      console.error("Error sending location:", err);
    }
  };

  const showNotification = (title: string, body: string) => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, { body, icon: "/icon.svg" });
      } catch (e) { }
    }
  };

  const toggleGPS = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }

    if (gpsActive) {
      stopGPS();
    } else {
      if (!driverId) return;
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

  // ===== PWA Install =====

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstall(false);
      }
      setDeferredPrompt(null);
    }
  };

  // ===== Driver ID =====

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

  // ===== Render =====

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-yellow-400" />
      </div>
    );
  }

  // Login screen
  if (!driverId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex flex-col items-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-yellow-400 mb-4">
                <span className="text-4xl">🚕</span>
              </div>
              <span className="text-3xl font-bold text-white">eitaxi</span>
            </Link>
            <p className="text-gray-400 mt-2">GPS rápido para taxistas</p>
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

          {/* Install PWA section on login */}
          {!isStandalone && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <div className="p-4 rounded-2xl bg-yellow-400/10 border border-yellow-400/30">
                <div className="flex items-center gap-2 mb-3">
                  <Download className="h-5 w-5 text-yellow-400" />
                  <h3 className="font-bold text-yellow-400">Instalar en tu móvil</h3>
                </div>
                <p className="text-gray-400 text-sm mb-3">
                  Añade eitaxi a tu pantalla de inicio para acceder al GPS con un toque
                </p>
                <button
                  onClick={() => setShowInstall(true)}
                  className="w-full py-3 rounded-xl bg-yellow-400 text-black font-bold"
                >
                  <Smartphone className="h-4 w-4 inline mr-2" />
                  Cómo instalar
                </button>
              </div>

              <AnimatePresence>
                {showInstall && (
                  <InstallInstructions
                    deviceType={deviceType}
                    onClose={() => setShowInstall(false)}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}

          <p className="text-center text-gray-500 text-sm mt-6">
            Encuentra tu ID en tu dashboard de eitaxi
          </p>
        </div>
      </div>
    );
  }

  // Main GPS control screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-6 relative">
      {/* Branding */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 left-0 right-0 text-center"
      >
        <Link href="/" className="text-xl font-bold text-yellow-400 hover:text-yellow-300">🚕 eitaxi</Link>
      </motion.div>

      {/* Status */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6 mt-8"
      >
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
          gpsActive ? "bg-green-500/20 text-green-400" : "bg-gray-700 text-gray-400"
        }`}>
          <div className={`w-3 h-3 rounded-full ${
            gpsActive ? "bg-green-500 animate-pulse" : "bg-gray-500"
          }`} />
          <span className="font-medium">
            {gpsActive ? "GPS Activo — Visible en el mapa" : "GPS Inactivo — No estás visible"}
          </span>
        </div>
        {lastSent && (
          <p className="text-gray-500 text-sm mt-2">
            Actualizado: {lastSent.toLocaleTimeString()}
          </p>
        )}
      </motion.div>

      {/* BIG BUTTON */}
      <motion.button
        onClick={toggleGPS}
        className={`w-52 h-52 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all ${
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
        <Power className="h-16 w-16 text-white mb-1" />
        <span className="text-white text-2xl font-bold">
          {gpsActive ? "DETENER" : "INICIAR"}
        </span>
        <span className="text-white/80 text-base">GPS</span>
      </motion.button>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-center max-w-xs"
          >
            <AlertCircle className="h-6 w-6 mx-auto mb-2" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Position */}
      {currentPosition && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-gray-500 text-sm"
        >
          📍 {currentPosition.lat.toFixed(4)}, {currentPosition.lng.toFixed(4)}
        </motion.div>
      )}

      {/* Bottom section */}
      <div className="fixed bottom-0 left-0 right-0 p-4 space-y-3">
        {/* Install PWA Banner - only show if not already installed */}
        {!isStandalone && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={() => setShowInstall(true)}
              className="w-full py-3 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 font-medium flex items-center justify-center gap-2 active:bg-yellow-400/20"
            >
              <Download className="h-5 w-5" />
              Instalar eitaxi en tu móvil
              <ArrowRight className="h-4 w-4" />
            </button>

            <AnimatePresence>
              {showInstall && (
                <InstallInstructions
                  deviceType={deviceType}
                  deferredPrompt={deferredPrompt}
                  onInstall={handleInstall}
                  onClose={() => setShowInstall(false)}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Go to dashboard */}
        <button
          onClick={() => window.location.href = `/dashboard/${driverId}`}
          className="w-full py-3 rounded-2xl bg-gray-800 text-gray-400 text-sm flex items-center justify-center gap-2"
        >
          <Home className="h-4 w-4" />
          Ir al dashboard completo
        </button>
      </div>
    </div>
  );
}

// ============================================
// Install Instructions Component
// ============================================

function InstallInstructions({
  deviceType,
  deferredPrompt,
  onInstall,
  onClose,
}: {
  deviceType: 'ios' | 'android' | 'desktop';
  deferredPrompt?: BeforeInstallPromptEvent | null;
  onInstall?: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-gray-800 rounded-2xl p-5 border border-yellow-400/30"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <Download className="h-5 w-5 text-yellow-400" />
            Instalar eitaxi
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-gray-400 text-sm mb-4">
          Acceso rápido al GPS desde tu pantalla de inicio. Abre esta página para activar/desactivar el GPS con un toque.
        </p>

        {deviceType === 'ios' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                <Share2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-white text-sm">1. Toca el botón <strong>Compartir</strong></p>
                <p className="text-xs text-gray-500">Abajo a la izquierda (cuadrado con flecha ↑)</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
              <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                <Plus className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-white text-sm">2. Toca <strong>"Añadir a pantalla de inicio"</strong></p>
                <p className="text-xs text-gray-500">Desliza los iconos hasta encontrarlo</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
              <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center flex-shrink-0">
                <Check className="h-4 w-4 text-black" />
              </div>
              <div>
                <p className="font-medium text-white text-sm">3. Toca <strong>"Añadir"</strong></p>
                <p className="text-xs text-gray-500">¡El icono 🚕 aparecerá en tu pantalla!</p>
              </div>
            </div>
          </div>
        )}

        {deviceType === 'android' && (
          <div className="space-y-3">
            {deferredPrompt ? (
              <button
                onClick={onInstall}
                className="w-full py-4 rounded-xl bg-yellow-400 text-black font-bold text-lg flex items-center justify-center gap-2"
              >
                <Download className="h-5 w-5" />
                Instalar ahora
              </button>
            ) : (
              <>
                <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                  <div className="w-8 h-8 rounded-lg bg-gray-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                    ⋮
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">1. Toca el <strong>menú</strong> (tres puntos)</p>
                    <p className="text-xs text-gray-500">Arriba a la derecha del navegador</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                  <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                    <Plus className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">2. Toca <strong>"Añadir a pantalla de inicio"</strong></p>
                    <p className="text-xs text-gray-500">O "Add to Home screen"</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center flex-shrink-0">
                    <Check className="h-4 w-4 text-black" />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">3. Confirma tocando <strong>"Añadir"</strong></p>
                    <p className="text-xs text-gray-500">¡El icono 🚕 aparecerá en tu pantalla!</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {deviceType === 'desktop' && (
          <div className="space-y-3">
            {deferredPrompt ? (
              <button
                onClick={onInstall}
                className="w-full py-4 rounded-xl bg-yellow-400 text-black font-bold text-lg flex items-center justify-center gap-2"
              >
                <Monitor className="h-5 w-5" />
                Instalar app en PC
              </button>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center flex-shrink-0">
                  <Download className="h-4 w-4 text-black" />
                </div>
                <div>
                  <p className="font-medium text-white text-sm">Busca el icono de instalar en la <strong>barra de direcciones</strong></p>
                  <p className="text-xs text-gray-500">O menú ⋮ → "Instalar app"</p>
                </div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 py-3 rounded-xl bg-gray-700 text-gray-300 font-medium"
        >
          Entendido
        </button>
      </div>
    </motion.div>
  );
}
