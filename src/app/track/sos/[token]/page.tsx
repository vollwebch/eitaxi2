"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ShieldAlert,
  MapPin,
  Loader2,
  Clock,
  AlertTriangle,
  Navigation,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mapa dinámico (solo cliente)
const SOSTrackingMap = dynamic(() => import("./SOStrackingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted">
      <Loader2 className="h-8 w-8 animate-spin text-red-400" />
    </div>
  ),
});

interface LocationData {
  latitude: number | null;
  longitude: number | null;
  hasLocation: boolean;
  ageSeconds: number;
  updatedAt: string;
  expiresAt: string | null;
  clientName: string;
}

export default function SOSTrackingPage() {
  const params = useParams();
  const token = (params.token as string) || new URLSearchParams(useSearchParams().toString()).get('token') || '';

  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchLocation = async () => {
      try {
        const res = await fetch(`/api/sospublic?token=${token}`);
        const data = await res.json();

        if (data.success && data.data) {
          setLocation(data.data);
          setError(null);
          setErrorCode(null);
        } else {
          setError(data.error || "Alerta no encontrada");
          setErrorCode(data.code || null);
          // Stop polling if alert is gone
          if (data.code === "NOT_FOUND" || data.code === "INACTIVE" || data.code === "EXPIRED") {
            return false; // Signal to stop polling
          }
        }
      } catch (err) {
        setError("Error de conexión");
      } finally {
        setLoading(false);
      }
      return true; // Continue polling
    };

    fetchLocation();

    // Poll every 5 seconds for real-time updates
    const interval = setInterval(async () => {
      const shouldContinue = await fetchLocation();
      if (shouldContinue === false) {
        clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [token]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getAgeText = (seconds: number) => {
    if (seconds < 5) return "ahora mismo";
    if (seconds < 60) return `hace ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `hace ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    return `hace ${hours}h ${minutes % 60}min`;
  };

  // Loading
  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-400 mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando ubicación...</p>
        </div>
      </div>
    );
  }

  // Error states (inactive, expired, not found)
  if (error && errorCode) {
    return (
      <div className="h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center border-border">
          {errorCode === "EXPIRED" || errorCode === "INACTIVE" ? (
            <EyeOff className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          ) : (
            <AlertTriangle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          )}
          <h1 className="text-2xl font-bold mb-2 text-white">
            {errorCode === "EXPIRED"
              ? "Alerta expirada"
              : errorCode === "INACTIVE"
              ? "Alerta desactivada"
              : "No encontrada"}
          </h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <p className="text-sm text-muted-foreground/60">
            Esta alerta de emergencia ya no está activa.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 z-50 w-full border-b border-red-500/30 bg-red-950/80 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600">
                <ShieldAlert className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">
                  EiTaxi SOS
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {location ? (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse mr-1.5" />
                  En vivo
                </Badge>
              ) : (
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  Esperando...
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Map */}
      <div className="flex-1 relative min-h-0">
        {location && location.hasLocation ? (
          <SOSTrackingMap
            latitude={location.latitude!}
            longitude={location.longitude!}
            clientName={location.clientName}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center p-8">
              <Navigation className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {error || "Esperando señal GPS..."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom panel */}
      <div className="flex-shrink-0 bg-background/95 backdrop-blur-xl border-t border-border">
        <div className="container mx-auto px-4 py-4">
          {/* Client info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <ShieldAlert className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <div className="font-medium text-white">
                  {location?.clientName || "Persona"}
                </div>
                <p className="text-sm text-red-400 font-medium">
                  Alerta de emergencia activa
                </p>
              </div>
            </div>
          </div>

          {/* Last update */}
          {location && (
            <div className="flex items-center gap-4 mb-4">
              {location.hasLocation ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg flex-1">
                    <MapPin className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-muted-foreground">
                      {getAgeText(location.ageSeconds)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg flex-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {formatTime(location.updatedAt)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex-1">
                  <MapPin className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-yellow-400">
                    Esperando señal GPS...
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              asChild
              className="w-full bg-green-600 hover:bg-green-500 text-white"
            >
              <a href="tel:112">
                Llamar emergencias
              </a>
            </Button>
            {location && location.hasLocation ? (
              <Button
                variant="outline"
                asChild
                className="w-full border-border text-muted-foreground"
              >
                <a
                  href={`https://maps.google.com/?q=${location.latitude},${location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <Navigation className="h-4 w-4" />
                  Abrir en maps
                </a>
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full border-border text-muted-foreground opacity-50"
                disabled
              >
                <Navigation className="h-4 w-4 mr-2" />
                Sin GPS
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
