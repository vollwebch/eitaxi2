"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation, Power, X, Bell, Loader2, MapPin, Shield, Eye, EyeOff } from "lucide-react";
import { 
  subscribeToGPS, 
  broadcastGPSState, 
  readFromStorage,
  type GPSState 
} from "@/lib/gpsSync";

export default function WidgetPage() {
  const [gpsActive, setGpsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  
  // GPS Consent
  const [showGpsConsent, setShowGpsConsent] = useState(false);
  const [hasGpsConsent, setHasGpsConsent] = useState(false);
  
  const watchIdRef = useRef<number | null>(null);
  const sendIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isLocalChangeRef = useRef(false);

  // Check for driver ID in URL, session, or localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    let id = urlParams.get('driverId');
    
    if (!id) {
      try {
        const sessionData = localStorage.getItem('eitaxi_session');
        if (sessionData) {
          const session = JSON.parse(sessionData);
          id = session.driverId;
        }
      } catch {
        // Ignore parse errors
      }
    }
    
    if (!id) {
      id = localStorage.getItem('widget-driverId');
    }
    
    if (id) {
      setDriverId(id);
      localStorage.setItem('widget-driverId', id);
    }
    
    setLoading(false);
    
    // Check GPS consent
    const savedGpsConsent = localStorage.getItem('gps-tracking-consent');
    if (savedGpsConsent === 'true') {
      setHasGpsConsent(true);
    }
  }, []);

  // Iniciar tracking (interno, sin broadcast inicial - para cuando recibimos cambios de otros tabs)
  const startTrackingInternal = useCallback(async () => {
    if (!driverId) {
      return;
    }
    
    if (!navigator.geolocation) {
      setError('GPS no disponible en este dispositivo');
      return;
    }
    
    setError(null);
    setGpsActive(true);

    // Auto-habilitar tracking en la base de datos
    try {
      await fetch('/api/driver/tracking', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId, enabled: true }),
      });
    } catch (err) {
      console.error('Error enabling tracking:', err);
    }

    // Watch position
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const pos = { lat: latitude, lng: longitude };
        setCurrentPosition(pos);
        
        // Send to server
        try {
          await fetch('/api/driver/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              driverId,
              latitude,
              longitude,
            }),
          });
          const now = new Date();
          setLastUpdate(now);
          
          // Broadcast para otros tabs
          broadcastGPSState({
            active: true,
            position: pos,
            lastUpdate: now.toISOString(),
            driverId,
          });
        } catch (err) {
          console.error('Error sending location:', err);
        }
      },
      (err) => {
        setError('Error GPS: ' + err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
    
    if ('setAppBadge' in navigator) {
      (navigator as any).setAppBadge(1);
    }
  }, [driverId]);

  // Iniciar tracking (con broadcast - para cuando el usuario hace click)
  const startTracking = useCallback(async () => {
    if (!driverId) {
      setError('No hay conductor configurado');
      return;
    }
    
    if (!navigator.geolocation) {
      setError('GPS no disponible en este dispositivo');
      return;
    }
    
    isLocalChangeRef.current = true;
    
    await startTrackingInternal();
    
    // Broadcast estado activo
    broadcastGPSState({
      active: true,
      position: null,
      lastUpdate: null,
      driverId,
    });
  }, [driverId, startTrackingInternal]);

  // Detener tracking (interno, sin broadcast)
  const stopTrackingInternal = useCallback(() => {
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
    
    if ('setAppBadge' in navigator) {
      (navigator as any).setAppBadge(0);
    }
  }, []);

  // Detener tracking (con broadcast)
  const stopTracking = useCallback(() => {
    isLocalChangeRef.current = true;
    
    stopTrackingInternal();
    
    // Broadcast
    broadcastGPSState({
      active: false,
      position: null,
      lastUpdate: null,
      driverId,
    });
  }, [driverId, stopTrackingInternal]);

  // Toggle GPS
  const toggleGPS = useCallback(async () => {
    if (gpsActive) {
      stopTracking();
    } else {
      // Si no hay consentimiento, mostrar diálogo
      if (!hasGpsConsent) {
        setShowGpsConsent(true);
      } else {
        await startTracking();
      }
    }
  }, [gpsActive, startTracking, stopTracking, hasGpsConsent]);
  
  // Aceptar consentimiento GPS
  const acceptGpsConsent = useCallback(async () => {
    localStorage.setItem('gps-tracking-consent', 'true');
    setHasGpsConsent(true);
    setShowGpsConsent(false);
    await startTracking();
  }, [startTracking]);

  // Subscribe to GPS state changes from dashboard
  useEffect(() => {
    const unsubscribe = subscribeToGPS((state: GPSState) => {
      if (isLocalChangeRef.current) {
        isLocalChangeRef.current = false;
        return;
      }
      
      if (state.driverId && driverId && state.driverId !== driverId) return;
      
      // Actualizar estado
      setGpsActive(state.active);
      
      if (state.position) {
        setCurrentPosition(state.position);
      }
      if (state.lastUpdate) {
        setLastUpdate(new Date(state.lastUpdate));
      }
      
      // Si el dashboard cambió el GPS, iniciar/detener tracking
      if (state.active && watchIdRef.current === null) {
        // Dashboard activó GPS - iniciar tracking
        startTrackingInternal();
      } else if (!state.active && watchIdRef.current !== null) {
        // Dashboard desactivó GPS - detener tracking
        stopTrackingInternal();
      }
      
      if ('setAppBadge' in navigator) {
        (navigator as any).setAppBadge(state.active ? 1 : 0);
      }
    });

    // Cargar estado inicial
    const storedState = readFromStorage();
    if (storedState) {
      if (!storedState.driverId || storedState.driverId === driverId) {
        setGpsActive(storedState.active);
        if (storedState.position) {
          setCurrentPosition(storedState.position);
        }
        if (storedState.lastUpdate) {
          setLastUpdate(new Date(storedState.lastUpdate));
        }
      }
    }

    return unsubscribe;
  }, [driverId, startTrackingInternal, stopTrackingInternal]);

  // Cleanup
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

  // Setup driver ID
  const setupDriver = () => {
    const id = prompt('Introduce tu ID de conductor:');
    if (id) {
      setDriverId(id);
      localStorage.setItem('widget-driverId', id);
    }
  };

  // Request notification permission
  const requestNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          if (registration) {
            await registration.showNotification('🚕 eitaxi', {
              body: '¡Notificaciones activadas!',
              icon: '/icons/icon-192x192.png',
            });
          }
        }
        localStorage.setItem('widget-notifications', 'true');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (!driverId) {
    return (
      <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center">
            <Navigation className="h-10 w-10 text-black" />
          </div>
          <h1 className="text-2xl font-bold mb-2">eitaxi GPS</h1>
          <p className="text-muted-foreground mb-6">
            Introduce tu ID de conductor
          </p>
          <button
            onClick={setupDriver}
            className="w-full py-4 bg-yellow-400 text-black font-bold rounded-2xl text-lg"
          >
            Configurar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* GPS Consent Dialog */}
      {showGpsConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 mx-4 max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full bg-yellow-400/20 flex items-center justify-center">
                <Navigation className="h-7 w-7 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-xl">Activar GPS</h3>
                <p className="text-sm text-muted-foreground">Permiso de ubicación</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <p className="text-sm text-muted-foreground">
                Para recibir clientes, necesitas activar el seguimiento GPS.
              </p>
              
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <Eye className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Los clientes te verán en el mapa</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span>Ubicación actualizada en tiempo real</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <EyeOff className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>Desactívalo cuando quieras</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Tu ubicación solo se muestra a clientes potenciales. 
                    No compartimos tus datos.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 border border-border rounded-xl font-medium"
                onClick={() => setShowGpsConsent(false)}
              >
                Cancelar
              </button>
              <button
                className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold"
                onClick={acceptGpsConsent}
              >
                Activar GPS
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main GPS Button */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.button
          onClick={toggleGPS}
          className={`relative w-56 h-56 rounded-full flex flex-col items-center justify-center transition-all shadow-2xl ${
            gpsActive
              ? 'bg-gradient-to-br from-green-400 to-green-600'
              : 'bg-gradient-to-br from-red-400 to-red-600'
          }`}
          whileTap={{ scale: 0.95 }}
        >
          {gpsActive && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full bg-green-400"
                animate={{ scale: [1, 1.3], opacity: [0.4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-green-400"
                animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              />
            </>
          )}
          
          <div className="relative z-10 text-center text-white">
            {gpsActive ? (
              <>
                <Navigation className="h-16 w-16 mx-auto mb-2 animate-pulse" />
                <span className="text-2xl font-bold block">GPS ON</span>
              </>
            ) : (
              <>
                <Power className="h-16 w-16 mx-auto mb-2" />
                <span className="text-2xl font-bold block">GPS OFF</span>
              </>
            )}
          </div>
        </motion.button>

        {/* Status */}
        <div className="mt-8 text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            gpsActive 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${gpsActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            {gpsActive ? 'Transmitiendo ubicación' : 'Sin transmitir'}
          </div>
          
          {currentPosition && (
            <div className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 text-yellow-400" />
              {currentPosition.lat.toFixed(4)}, {currentPosition.lng.toFixed(4)}
            </div>
          )}
          
          {lastUpdate && (
            <p className="text-xs text-muted-foreground mt-1">
              {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-3 bg-red-500/20 text-red-400 rounded-lg text-sm text-center max-w-xs"
            >
              {error}
              <button onClick={() => setError(null)} className="ml-2 opacity-70 hover:opacity-100">
                <X className="h-4 w-4 inline" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom actions */}
      <div className="p-4 space-y-3">
        {!gpsActive && typeof window !== 'undefined' && localStorage.getItem('widget-notifications') !== 'true' && (
          <button
            onClick={requestNotifications}
            className="w-full py-3 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center gap-2 text-sm"
          >
            <Bell className="h-4 w-4" />
            Activar alertas
          </button>
        )}
        
        <div className="flex gap-2 text-sm">
          <button
            onClick={setupDriver}
            className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg text-center"
          >
            Cambiar ID
          </button>
          <a
            href={`/dashboard/${driverId}`}
            className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg text-center"
          >
            Panel completo
          </a>
        </div>
      </div>
    </div>
  );
}
