"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  subscribeToGPS,
  broadcastGPSState,
  readFromStorage,
  type GPSState
} from "@/lib/gpsSync";

/**
 * GPSProvider - Inicia automáticamente el GPS cuando trackingEnabled=true
 *
 * Este componente se carga en el layout y monitorea:
 * 1. Si hay un driverId en sesión
 * 2. Si el conductor tiene trackingEnabled=true en la BD
 * 3. Inicia automáticamente el GPS sin interacción
 *
 * El GPS funciona mientras CUALQUIER página de la app esté abierta.
 */
export default function GPSProvider() {
  const watchIdRef = useRef<number | null>(null);
  const sendIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(false);
  const driverIdRef = useRef<string | null>(null);
  const currentPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Request Wake Lock
  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        console.log('[GPSProvider] Wake Lock activado');
      } catch (err) {
        console.log('[GPSProvider] Wake Lock no disponible:', err);
      }
    }
  }, []);

  // Release Wake Lock
  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      } catch (err) {
        console.log('[GPSProvider] Error liberando Wake Lock:', err);
      }
    }
  }, []);

  // Start GPS tracking
  const startTracking = useCallback(async (driverId: string) => {
    if (isRunningRef.current) {
      console.log('[GPSProvider] Ya está corriendo, ignorando');
      return;
    }

    if (!navigator.geolocation) {
      console.error('[GPSProvider] Geolocalización no disponible');
      return;
    }

    console.log('[GPSProvider] 🚀 Iniciando GPS automáticamente para:', driverId);
    isRunningRef.current = true;
    driverIdRef.current = driverId;

    // Request wake lock
    await requestWakeLock();

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        currentPositionRef.current = pos;

        // Send to server
        try {
          await fetch("/api/driver/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              driverId,
              latitude: pos.lat,
              longitude: pos.lng,
              speed: position.coords.speed,
              heading: position.coords.heading,
              accuracy: position.coords.accuracy,
            }),
          });

          // Broadcast state
          broadcastGPSState({
            active: true,
            position: pos,
            lastUpdate: new Date().toISOString(),
            driverId,
          });

          console.log('[GPSProvider] ✓ Ubicación enviada:', pos.lat.toFixed(4), pos.lng.toFixed(4));
        } catch (error) {
          console.error("[GPSProvider] Error enviando ubicación:", error);
        }
      },
      (error) => {
        console.error("[GPSProvider] Error GPS:", error.message);
        // Si hay error de permiso, desactivar tracking
        if (error.code === error.PERMISSION_DENIED) {
          broadcastGPSState({
            active: false,
            position: null,
            lastUpdate: null,
            driverId,
          });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    // Also send every 5 seconds as backup
    sendIntervalRef.current = setInterval(async () => {
      const pos = currentPositionRef.current;
      if (!pos) return;

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
      } catch (error) {
        console.error("[GPSProvider] Error en intervalo:", error);
      }
    }, 5000);

    // Broadcast initial state
    broadcastGPSState({
      active: true,
      position: null,
      lastUpdate: null,
      driverId,
    });
  }, [requestWakeLock]);

  // Stop GPS tracking
  const stopTracking = useCallback(async () => {
    console.log('[GPSProvider] 🛑 Deteniendo GPS');

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (sendIntervalRef.current) {
      clearInterval(sendIntervalRef.current);
      sendIntervalRef.current = null;
    }

    await releaseWakeLock();

    isRunningRef.current = false;

    // Clear badge
    if ('clearAppBadge' in navigator) {
      (navigator as any).clearAppBadge();
    }

    // Broadcast stopped state
    broadcastGPSState({
      active: false,
      position: null,
      lastUpdate: null,
      driverId: driverIdRef.current,
    });
  }, [releaseWakeLock]);

  // Check if driver should be tracking
  const checkTrackingStatus = useCallback(async () => {
    // Get driverId from session
    let driverId: string | null = null;

    try {
      const sessionData = localStorage.getItem('eitaxi_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        driverId = session.driverId;
      }
    } catch {}

    if (!driverId) {
      driverId = localStorage.getItem('widget-driverId');
    }

    if (!driverId) {
      // No driver logged in
      if (isRunningRef.current) {
        await stopTracking();
      }
      return;
    }

    // Check if tracking is enabled in DB
    try {
      const res = await fetch(`/api/driver/tracking?driverId=${driverId}`);
      const data = await res.json();

      if (data.success && data.tracking?.enabled) {
        // Check GPS consent
        const hasConsent = localStorage.getItem('gps-tracking-consent') === 'true';

        if (hasConsent && !isRunningRef.current) {
          console.log('[GPSProvider] ⚡ Tracking activado en BD, iniciando GPS...');
          await startTracking(driverId);
        } else if (!hasConsent) {
          console.log('[GPSProvider] Tracking activado pero sin consentimiento GPS');
        }
      } else {
        // Tracking disabled in DB, stop if running
        if (isRunningRef.current) {
          console.log('[GPSProvider] Tracking desactivado en BD, deteniendo GPS...');
          await stopTracking();
        }
      }
    } catch (error) {
      console.error('[GPSProvider] Error checking tracking status:', error);
    }
  }, [startTracking, stopTracking]);

  // Subscribe to GPS state changes from other tabs
  useEffect(() => {
    const unsubscribe = subscribeToGPS((state: GPSState) => {
      if (state.driverId && state.driverId !== driverIdRef.current) {
        // Different driver, ignore
        return;
      }

      if (!state.active && isRunningRef.current) {
        // GPS was disabled from another tab
        stopTracking();
      }
    });

    return unsubscribe;
  }, [stopTracking]);

  // Re-acquire wake lock when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isRunningRef.current) {
        await requestWakeLock();
        // Re-check tracking status
        await checkTrackingStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [requestWakeLock, checkTrackingStatus]);

  // Initial check and periodic verification
  useEffect(() => {
    // Initial check after a short delay (let page load)
    const initialTimeout = setTimeout(() => {
      checkTrackingStatus();
    }, 1000);

    // Check every 30 seconds
    checkIntervalRef.current = setInterval(checkTrackingStatus, 30000);

    // Cleanup
    return () => {
      clearTimeout(initialTimeout);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (sendIntervalRef.current) {
        clearInterval(sendIntervalRef.current);
      }
      releaseWakeLock();
    };
  }, [checkTrackingStatus, releaseWakeLock]);

  // This component doesn't render anything
  return null;
}
