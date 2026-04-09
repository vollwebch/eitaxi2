"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation, X, Check, Smartphone } from "lucide-react";
import { useGPS } from "@/contexts/GPSContext";

export default function GPSReminder() {
  const { gpsActive, trackingEnabled, toggleGPS, enableTracking } = useGPS();
  const [showReminder, setShowReminder] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Verificar si el usuario ya marcó "no mostrar de nuevo"
    const hideReminder = localStorage.getItem("hide-gps-reminder");
    if (hideReminder === "true") {
      setDontShowAgain(true);
      return;
    }

    // Mostrar recordatorio después de 3 segundos si:
    // - El GPS no está activo
    // - El tracking está habilitado (o puede habilitarse)
    const timer = setTimeout(() => {
      if (!gpsActive) {
        setShowReminder(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [gpsActive]);

  const handleActivate = async () => {
    if (!trackingEnabled) {
      await enableTracking();
    }
    await toggleGPS();
    setShowReminder(false);
  };

  const handleDontShowAgain = () => {
    localStorage.setItem("hide-gps-reminder", "true");
    setShowReminder(false);
  };

  // También ocultar si el GPS se activa
  useEffect(() => {
    if (gpsActive) {
      setShowReminder(false);
    }
  }, [gpsActive]);

  return (
    <AnimatePresence>
      {showReminder && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowReminder(false)}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="w-full max-w-sm bg-card border border-border rounded-2xl overflow-hidden shadow-2xl mb-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative p-6 bg-gradient-to-br from-yellow-400/20 to-yellow-400/5">
              <button
                onClick={() => setShowReminder(false)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-yellow-400 flex items-center justify-center">
                  <Navigation className="h-8 w-8 text-black" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">¿Activar GPS?</h3>
                  <p className="text-sm text-muted-foreground">
                    Los clientes podrán verte
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-muted-foreground">
                Activa tu ubicación para que los clientes te encuentren en el mapa y puedan verte en tiempo real.
              </p>

              {/* Acceso directo */}
              <a
                href="/gps-quick"
                className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors"
              >
                <Smartphone className="h-5 w-5" />
                <div className="flex-1">
                  <div className="font-medium text-sm">Página GPS rápida</div>
                  <div className="text-xs text-blue-400/60">
                    Ideal para añadir a pantalla de inicio
                  </div>
                </div>
                <span className="text-xl">→</span>
              </a>

              {/* Botones */}
              <div className="flex gap-3">
                <button
                  onClick={handleDontShowAgain}
                  className="flex-1 py-3 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors text-sm"
                >
                  No recordar
                </button>
                <button
                  onClick={handleActivate}
                  className="flex-1 py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Activar GPS
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
