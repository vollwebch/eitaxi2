"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Navigation,
  Power,
  Wifi,
  WifiOff,
  MapPin,
  ArrowLeft,
  Settings,
  Loader2,
  AlertCircle,
  Car,
  Check,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GPSProvider, useGPS } from "@/contexts/GPSContext";

// Mapa dinámico
const LocationMap = dynamic(() => import("./LocationMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
    </div>
  ),
});

// Componente interno que usa el contexto
function GPSPageContent() {
  const params = useParams();
  const driverId = params.driverId as string;

  const {
    gpsActive,
    trackingEnabled,
    currentPosition,
    lastSent,
    error,
    toggleGPS,
    enableTracking,
  } = useGPS();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <Link href={`/dashboard/${driverId}`} className="flex items-center gap-2">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-500">
                <Car className="h-4 w-4 text-black" />
              </div>
              <span className="font-bold">
                <span className="text-yellow-400">Taxi</span>
                <span className="text-white">Zone</span>
              </span>
            </div>
            <Link href={`/dashboard/${driverId}`}>
              <Settings className="h-5 w-5 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {/* Si tracking no está habilitado */}
        {!trackingEnabled && (
          <Card className="border-yellow-400/30 bg-yellow-400/5">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Seguimiento desactivado</h2>
              <p className="text-muted-foreground mb-4">
                Activa el seguimiento para que los clientes puedan verte en el mapa
              </p>
              <Button
                onClick={enableTracking}
                className="bg-yellow-400 text-black hover:bg-yellow-500"
              >
                <Check className="mr-2 h-4 w-4" />
                Activar seguimiento
              </Button>
            </CardContent>
          </Card>
        )}

        {/* GPS Status Card */}
        {trackingEnabled && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl p-6 mb-4 ${
                gpsActive
                  ? "bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30"
                  : "bg-muted border border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-4 w-4 rounded-full ${
                      gpsActive ? "bg-green-500 animate-pulse" : "bg-gray-400"
                    }`}
                  />
                  <div>
                    <div className="text-xl font-bold">
                      {gpsActive ? "GPS Activo" : "GPS Inactivo"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {lastSent
                        ? `Última actualización: ${lastSent.toLocaleTimeString()}`
                        : "Sin actualizar"}
                    </div>
                  </div>
                </div>
                {gpsActive ? (
                  <Wifi className="h-6 w-6 text-green-500" />
                ) : (
                  <WifiOff className="h-6 w-6 text-muted-foreground" />
                )}
              </div>

              {/* Coordenadas */}
              {currentPosition && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 p-3 rounded-lg mb-4">
                  <MapPin className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                  <span className="truncate">
                    {currentPosition.lat.toFixed(6)}, {currentPosition.lng.toFixed(6)}
                  </span>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Botón principal */}
              <button
                onClick={toggleGPS}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                  gpsActive
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-green-500 text-white hover:bg-green-600"
                }`}
              >
                <Power className="h-6 w-6" />
                {gpsActive ? "DETENER GPS" : "INICIAR GPS"}
              </button>
            </motion.div>

            {/* Mapa */}
            {currentPosition && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4"
              >
                <LocationMap
                  latitude={currentPosition.lat}
                  longitude={currentPosition.lng}
                />
              </motion.div>
            )}

            {/* Info */}
            <div className="text-center text-xs text-muted-foreground mt-6">
              <p>📍 Tu ubicación se actualiza cada 5 segundos</p>
              <p className="mt-1">🔒 Solo visible cuando el GPS está activo</p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// Wrapper con GPSProvider
export default function GPSPage() {
  const params = useParams();
  const driverId = params.driverId as string;

  return (
    <GPSProvider driverId={driverId}>
      <GPSPageContent />
    </GPSProvider>
  );
}
