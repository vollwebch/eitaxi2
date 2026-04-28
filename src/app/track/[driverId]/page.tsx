"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import {
  Car,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  ArrowLeft,
  Loader2,
  Navigation,
  Wifi,
  WifiOff,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mapa dinámico (solo cliente)
const TrackingMap = dynamic(() => import("./TrackingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted">
      <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
    </div>
  ),
});

interface DriverInfo {
  id: string;
  name: string;
  vehicle: {
    color: string | null;
    brand: string | null;
    model: string | null;
    year: number | null;
  };
}

interface LocationInfo {
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  timestamp: string;
  age: number;
  isRecent: boolean;
}

interface ClientLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export default function TrackDriverPage() {
  const t = useTranslations();
  const params = useParams();
  const driverId = params.driverId as string;

  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clientLocation, setClientLocation] = useState<ClientLocation | null>(null);
  const [clientLocationError, setClientLocationError] = useState<string | null>(null);

  // Obtener ubicación cada 5 segundos
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await fetch(`/api/driver/location/${driverId}`);
        const data = await res.json();

        if (data.success) {
          setDriver(data.driver);
          setTrackingActive(data.trackingActive);
          setLocation(data.location);
          setMessage(data.message || null);
          setError(null);
        } else {
          setError(data.error || "Error al obtener ubicación");
        }
      } catch (err) {
        setError(t('common.connectionError'));
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();

    // Actualizar cada 5 segundos
    const interval = setInterval(fetchLocation, 5000);

    return () => clearInterval(interval);
  }, [driverId]);

  // Obtener ubicación del cliente (opcional)
  useEffect(() => {
    if (!navigator.geolocation) {
      // No es un error crítico - simplemente no mostraremos la ubicación del cliente
      return;
    }

    const success = (position: GeolocationPosition) => {
      setClientLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
      setClientLocationError(null);
    };

    const error = (err: GeolocationPositionError) => {
      // Solo mostrar error si no es permiso denegado (el usuario puede no querer compartir ubicación)
      if (err.code !== err.PERMISSION_DENIED) {
        console.warn('Geolocation warning:', err.message);
        setClientLocationError("No se pudo obtener tu ubicación. Activa el GPS si quieres ver la distancia al taxi.");
      }
      // Si es PERMISSION_DENIED, simplemente no mostramos la ubicación del cliente - no es un error
    };

    // Obtener ubicación inicial
    navigator.geolocation.getCurrentPosition(success, error, {
      enableHighAccuracy: true,
      timeout: 10000,
    });

    // Actualizar cada 10 segundos
    const watchId = navigator.geolocation.watchPosition(success, error, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Calcular distancia entre cliente y taxi
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const distanceToDriver = (location && clientLocation)
    ? calculateDistance(
        clientLocation.latitude,
        clientLocation.longitude,
        location.latitude,
        location.longitude
      )
    : null;

  // Formatear tiempo
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Obtener descripción del vehículo
  const getVehicleDescription = () => {
    if (!driver?.vehicle) return "Vehículo no especificado";
    
    const parts: string[] = [];
    if (driver.vehicle.color) parts.push(driver.vehicle.color);
    if (driver.vehicle.brand) parts.push(driver.vehicle.brand);
    if (driver.vehicle.model) parts.push(driver.vehicle.model);
    if (driver.vehicle.year) parts.push(`(${driver.vehicle.year})`);
    
    return parts.length > 0 ? parts.join(" ") : "Vehículo no especificado";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-yellow-400 mx-auto mb-4" />
          <p className="text-muted-foreground">Conectando con el conductor...</p>
        </div>
      </div>
    );
  }

  if (error && !driver) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center border-border">
          <AlertCircle className="h-16 w-16 mx-auto text-red-400 mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t('common.error')}</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link href="/">
            <Button className="bg-yellow-400 text-black hover:bg-yellow-500">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('login.backToHome')}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-500">
                <Car className="h-5 w-5 text-black" />
              </div>
              <span className="text-lg font-bold">
                <span className="text-yellow-400">ei</span>
                <span className="text-white">taxi</span>
              </span>
            </Link>

            <div className="flex items-center gap-2">
              {trackingActive ? (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <Wifi className="h-3 w-3 mr-1" />
                  {t('drivers.live')}
                </Badge>
              ) : (
                <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                  <WifiOff className="h-3 w-3 mr-1" />
                  {t('drivers.offline')}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mapa - flex-1 para ocupar todo el espacio disponible */}
      <div className="flex-1 relative min-h-0">
        {location ? (
          <TrackingMap
            latitude={location.latitude}
            longitude={location.longitude}
            heading={location.heading}
            driverName={driver?.name}
            clientLocation={clientLocation}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center p-8">
              <Navigation className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {message || "Esperando ubicación del conductor..."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Panel inferior - flex-shrink-0 para que no se comprima */}
      <div className="flex-shrink-0 bg-background/95 backdrop-blur-xl border-t border-border">
        <div className="container mx-auto px-4 py-4">
          {/* Distancia al taxi */}
          {distanceToDriver !== null && (
            <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-blue-400" />
                  <span className="font-medium text-blue-400">
                    {distanceToDriver < 1 
                      ? `${Math.round(distanceToDriver * 1000)} metros` 
                      : `${distanceToDriver.toFixed(1)} km`}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">distancia al taxi</span>
              </div>
            </div>
          )}

          {/* Error de ubicación del cliente */}
          {clientLocationError && !clientLocation && (
            <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex items-center gap-2 text-yellow-500">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{clientLocationError}</span>
              </div>
            </div>
          )}

          {/* Info del conductor */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-yellow-400/10 flex items-center justify-center">
                <Car className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <div className="font-medium">{driver?.name || t('tracking.driver')}</div>
                <div className="text-sm text-muted-foreground">
                  {getVehicleDescription()}
                </div>
              </div>
            </div>

            {/* Última actualización */}
            {location && (
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Actualizado</div>
                <div className="text-sm font-medium">
                  {location.age < 60 
                    ? `hace ${location.age}s` 
                    : formatTime(location.timestamp)}
                </div>
              </div>
            )}
          </div>

          {/* Velocidad (si disponible) */}
          {location?.speed && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-muted/50 rounded-lg">
              <Navigation className="h-4 w-4 text-yellow-400" />
              <span className="text-sm">
                Velocidad: {Math.round(location.speed)} km/h
              </span>
            </div>
          )}

          {/* Mensaje de estado */}
          {message && !location && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-yellow-400/10 rounded-lg">
              <Clock className="h-4 w-4 text-yellow-400" />
              <span className="text-sm text-yellow-400">{message}</span>
            </div>
          )}

          {/* Botones de contacto */}
          <div className="grid grid-cols-2 gap-3">
            <Link href={`tel:${driverId}`}>
              <Button variant="outline" className="w-full">
                <Phone className="mr-2 h-4 w-4" />
                Llamar
              </Button>
            </Link>
            <Link href={`https://wa.me/${driverId}`}>
              <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
