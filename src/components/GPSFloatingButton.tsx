"use client";

import { useState, useEffect } from "react";
import { Navigation, Power, Radio, Wifi, WifiOff, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGPS } from "@/contexts/GPSContext";

export default function GPSFloatingButton() {
  const {
    gpsActive,
    trackingEnabled,
    currentPosition,
    lastSent,
    error,
    toggleGPS,
    enableTracking,
  } = useGPS();

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-20 right-0 w-72 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className={`p-4 ${gpsActive ? "bg-green-500/20" : "bg-muted"}`}>
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${gpsActive ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                <div>
                  <div className="font-semibold">
                    {gpsActive ? "GPS Activo" : "GPS Inactivo"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {lastSent ? `Actualizado: ${lastSent.toLocaleTimeString()}` : "Sin actualizar"}
                  </div>
                </div>
                {gpsActive ? (
                  <Wifi className="h-5 w-5 text-green-500 ml-auto" />
                ) : (
                  <WifiOff className="h-5 w-5 text-muted-foreground ml-auto" />
                )}
              </div>
            </div>

            {/* Contenido */}
            <div className="p-4 space-y-3">
              {!trackingEnabled && (
                <div className="text-sm text-yellow-400 bg-yellow-500/10 p-2 rounded-lg">
                  Activa el seguimiento primero
                  <button
                    onClick={enableTracking}
                    className="block mt-2 w-full bg-yellow-400 text-black py-2 rounded font-medium"
                  >
                    Activar seguimiento
                  </button>
                </div>
              )}

              {currentPosition && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded-lg">
                  <MapPin className="h-4 w-4 text-yellow-400" />
                  <span className="truncate">
                    {currentPosition.lat.toFixed(4)}, {currentPosition.lng.toFixed(4)}
                  </span>
                </div>
              )}

              {error && (
                <div className="text-sm text-red-400 bg-red-500/10 p-2 rounded-lg">
                  {error}
                </div>
              )}

              {trackingEnabled && (
                <button
                  onClick={toggleGPS}
                  className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                    gpsActive
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-green-500 text-white hover:bg-green-600"
                  }`}
                >
                  <Power className="h-5 w-5" />
                  {gpsActive ? "Detener GPS" : "Iniciar GPS"}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón principal */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`h-16 w-16 rounded-full shadow-2xl flex items-center justify-center transition-all ${
          trackingEnabled
            ? gpsActive
              ? "bg-green-500"
              : "bg-yellow-400"
            : "bg-gray-400"
        }`}
        whileTap={{ scale: 0.9 }}
      >
        {trackingEnabled ? (
          gpsActive ? (
            <Radio className="h-7 w-7 text-white animate-pulse" />
          ) : (
            <Navigation className="h-7 w-7 text-black" />
          )
        ) : (
          <Navigation className="h-7 w-7 text-white opacity-50" />
        )}
      </motion.button>

      {/* Indicador de estado */}
      {trackingEnabled && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`absolute -top-1 -right-1 h-5 w-5 rounded-full border-2 border-background ${
            gpsActive ? "bg-green-500" : "bg-gray-400"
          }`}
        >
          {gpsActive && (
            <span className="absolute inset-0 rounded-full bg-green-500 animate-ping" />
          )}
        </motion.div>
      )}
    </div>
  );
}
