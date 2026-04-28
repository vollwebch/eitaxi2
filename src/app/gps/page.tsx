"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Navigation, 
  Power, 
  MapPin, 
  Loader2, 
  Sun,
  Clock,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  Wifi,
  WifiOff,
  Home,
  Settings,
} from "lucide-react";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  subscribeToGPS,
  broadcastGPSState,
  readFromStorage,
  type GPSState
} from "@/lib/gpsSync";

export default function DedicatedGPSPage() {
  const tGps = useTranslations('gps');
  const tCommon = useTranslations('common');

  const [gpsActive, setGpsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [transmitting, setTransmitting] = useState(false);
  
  // GPS Consent
  const [showGpsConsent, setShowGpsConsent] = useState(false);
  const [hasGpsConsent, setHasGpsConsent] = useState(false);
  
  const watchIdRef = useRef<number | null>(null);
  const sendIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isLocalChangeRef = useRef(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Get driver ID from URL or localStorage
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
      } catch {}
    }
    
    if (!id) {
      id = localStorage.getItem('widget-driverId');
    }
    
    if (id) {
      setDriverId(id);
      localStorage.setItem('widget-driverId', id);
    }
    
    // Check GPS consent
    const savedGpsConsent = localStorage.getItem('gps-tracking-consent');
    if (savedGpsConsent === 'true') {
      setHasGpsConsent(true);
    }
    
    setLoading(false);
  }, []);

  // Wake Lock functions
  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        console.log('Wake Lock activado');
      } catch (err) {
        console.log('Wake Lock no disponible:', err);
      }
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      } catch (err) {
        console.log('Error liberando Wake Lock:', err);
      }
    }
  }, []);

  // Re-acquire wake lock when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && gpsActive) {
        await requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [gpsActive, requestWakeLock]);

  // Start tracking (declared before checkAndStartGPSTracking to avoid reference-before-init)
  const startTrackingInternal = useCallback(async (id: string) => {
    if (!navigator.geolocation) {
      setError(tGps('permission.unsupported'));
      return;
    }
    
    setError(null);
    setGpsActive(true);
    
    // Request wake lock
    await requestWakeLock();

    // Watch position
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const pos = { lat: latitude, lng: longitude };
        setCurrentPosition(pos);
        setTransmitting(true);
        
        // Send to server
        try {
          await fetch('/api/driver/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              driverId: id,
              latitude,
              longitude,
            }),
          });
          const now = new Date();
          setLastUpdate(now);
          
          broadcastGPSState({
            active: true,
            position: pos,
            lastUpdate: now.toISOString(),
            driverId: id,
          });
        } catch (err) {
          console.error('Error sending location:', err);
          setTransmitting(false);
        }
      },
      (err) => {
        setError(tGps('error') + ': ' + err.message);
        setTransmitting(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
    
    // Set app badge if supported
    if ('setAppBadge' in navigator) {
      (navigator as any).setAppBadge(1);
    }
  }, [requestWakeLock, tGps]);

  // Auto-check and start GPS
  const checkAndStartGPSTracking = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/driver/tracking?driverId=${id}`);
      const data = await res.json();
      
      if (data.success && data.tracking?.enabled) {
        console.log('GPS está activado en BD, iniciando automáticamente...');
        
        // Auto-guardar consentimiento si no existe
        const savedConsent = localStorage.getItem('gps-tracking-consent');
        if (savedConsent !== 'true') {
          localStorage.setItem('gps-tracking-consent', 'true');
        }
        setHasGpsConsent(true);
        
        // Iniciar directamente
        startTrackingInternal(id);
      }
    } catch (err) {
      console.error('Error checking GPS status:', err);
    }
  }, [startTrackingInternal]);

  // Stop tracking
  const stopTrackingInternal = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (sendIntervalRef.current) {
      clearInterval(sendIntervalRef.current);
      sendIntervalRef.current = null;
    }
    
    await releaseWakeLock();
    
    setGpsActive(false);
    setCurrentPosition(null);
    setTransmitting(false);
    
    // Disable tracking in DB
    if (driverId) {
      try {
        await fetch('/api/driver/tracking', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ driverId, enabled: false }),
        });
        
        await fetch(`/api/driver/location?driverId=${driverId}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error('Error disabling tracking:', err);
      }
    }
    
    if ('setAppBadge' in navigator) {
      (navigator as any).setAppBadge(0);
    }
  }, [driverId, releaseWakeLock]);

  // Start tracking wrapper
  const startTracking = useCallback(async () => {
    if (!driverId) {
      setError(tGps('noDriverConfigured'));
      return;
    }
    isLocalChangeRef.current = true;
    await startTrackingInternal(driverId);
    
    broadcastGPSState({
      active: true,
      position: null,
      lastUpdate: null,
      driverId,
    });
  }, [driverId, startTrackingInternal, tGps]);

  // Toggle GPS
  const toggleGPS = useCallback(async () => {
    if (gpsActive) {
      await stopTrackingInternal();
      broadcastGPSState({
        active: false,
        position: null,
        lastUpdate: null,
        driverId,
      });
    } else {
      if (!hasGpsConsent) {
        setShowGpsConsent(true);
      } else {
        await startTracking();
      }
    }
  }, [gpsActive, stopTrackingInternal, startTracking, hasGpsConsent, driverId]);

  // Accept consent
  const acceptGpsConsent = useCallback(async () => {
    localStorage.setItem('gps-tracking-consent', 'true');
    setHasGpsConsent(true);
    setShowGpsConsent(false);
    await startTracking();
  }, [startTracking]);

  // Subscribe to GPS state changes
  useEffect(() => {
    const unsubscribe = subscribeToGPS((state: GPSState) => {
      if (isLocalChangeRef.current) {
        isLocalChangeRef.current = false;
        return;
      }
      
      if (state.driverId && driverId && state.driverId !== driverId) return;
      
      setGpsActive(state.active);
      
      if (state.position) {
        setCurrentPosition(state.position);
      }
      if (state.lastUpdate) {
        setLastUpdate(new Date(state.lastUpdate));
      }
      
      if (state.active && watchIdRef.current === null && driverId) {
        startTrackingInternal(driverId);
      } else if (!state.active && watchIdRef.current !== null) {
        stopTrackingInternal();
      }
      
      if ('setAppBadge' in navigator) {
        (navigator as any).setAppBadge(state.active ? 1 : 0);
      }
    });

    // Load initial state
    const storedState = readFromStorage();
    if (storedState && (!storedState.driverId || storedState.driverId === driverId)) {
      setGpsActive(storedState.active);
      if (storedState.position) {
        setCurrentPosition(storedState.position);
      }
      if (storedState.lastUpdate) {
        setLastUpdate(new Date(storedState.lastUpdate));
      }
    }

    return unsubscribe;
  }, [driverId, startTrackingInternal, stopTrackingInternal]);

  // Auto-start when driverId is set - check DB status
  useEffect(() => {
    if (driverId) {
      checkAndStartGPSTracking(driverId);
    }
  }, [driverId, checkAndStartGPSTracking]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (sendIntervalRef.current) {
        clearInterval(sendIntervalRef.current);
      }
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

  // Setup driver ID
  const setupDriver = () => {
    const id = prompt(tGps('setupDriverPrompt'));
    if (id) {
      setDriverId(id);
      localStorage.setItem('widget-driverId', id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (!driverId) {
    return (
      <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center">
            <Navigation className="h-12 w-12 text-black" />
          </div>
          <Link href="/" className="text-3xl font-bold mb-2 inline-block">eitaxi {tGps('title')}</Link>
          <p className="text-muted-foreground mb-8">
            {tGps('setupDriverDescription')}
          </p>
          <button
            onClick={setupDriver}
            className="w-full py-4 bg-yellow-400 text-black font-bold rounded-2xl text-lg"
          >
            {tGps('setup')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-40">
        <LanguageSwitcher />
      </div>

      {/* GPS Consent Dialog */}
      <AnimatePresence>
        {showGpsConsent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-yellow-400/20 flex items-center justify-center">
                  <Navigation className="h-8 w-8 text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">{tGps('consent.title')}</h3>
                  <p className="text-sm text-muted-foreground">{tGps('consent.permissionLabel')}</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                  <ul className="text-sm space-y-3">
                    <li className="flex items-start gap-3">
                      <Eye className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>{tGps('consent.clientTracking')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Sun className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span>{tGps('consent.screenWake')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <EyeOff className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>{tGps('consent.deactivate')}</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      {tGps('consent.privacy')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  className="flex-1 py-3 border border-border rounded-xl font-medium"
                  onClick={() => setShowGpsConsent(false)}
                >
                  {tCommon('cancel')}
                </button>
                <button
                  className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold"
                  onClick={acceptGpsConsent}
                >
                  {tGps('activate')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Main GPS Button */}
        <motion.button
          onClick={toggleGPS}
          className={`relative w-72 h-72 rounded-full flex flex-col items-center justify-center transition-all shadow-2xl ${
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
              <motion.div
                className="absolute inset-0 rounded-full bg-green-400"
                animate={{ scale: [1, 1.7], opacity: [0.2, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
              />
            </>
          )}
          
          <div className="relative z-10 text-center text-white">
            {gpsActive ? (
              <>
                <Navigation className="h-20 w-20 mx-auto mb-3 animate-pulse" />
                <span className="text-3xl font-bold block">{tGps('on')}</span>
                {transmitting && (
                  <span className="text-sm opacity-80 mt-1 block">{tGps('transmitting')}</span>
                )}
              </>
            ) : (
              <>
                <Power className="h-20 w-20 mx-auto mb-3" />
                <span className="text-3xl font-bold block">{tGps('off')}</span>
              </>
            )}
          </div>
        </motion.button>

        {/* Status */}
        <div className="mt-8 text-center">
          <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium ${
            gpsActive 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            <div className={`w-2.5 h-2.5 rounded-full ${gpsActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            {gpsActive ? tGps('transmittingLocation') : tGps('notTransmitting')}
          </div>
          
          {currentPosition && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-yellow-400" />
              <span className="font-mono">
                {currentPosition.lat.toFixed(4)}, {currentPosition.lng.toFixed(4)}
              </span>
            </div>
          )}
          
          {lastUpdate && (
            <p className="text-sm text-muted-foreground mt-2">
              <Clock className="h-4 w-4 inline mr-1" />
              {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Wake Lock Status */}
        {gpsActive && (
          <div className="mt-6 flex items-center gap-2 text-yellow-400">
            <Sun className="h-5 w-5" />
            <span className="text-sm font-medium">{tGps('screenOn')}</span>
          </div>
        )}

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 p-4 bg-red-500/20 text-red-400 rounded-xl text-sm text-center max-w-xs"
            >
              <AlertCircle className="h-5 w-5 inline mr-2" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom info */}
      <div className="p-6 text-center">
        <p className="text-xs text-muted-foreground mb-4">
          {tGps('autoStart')}
        </p>
        <div className="flex gap-3 text-sm justify-center">
          <a
            href={`/dashboard/${driverId}`}
            className="px-4 py-2 bg-muted text-muted-foreground rounded-lg flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </a>
          <button
            onClick={setupDriver}
            className="px-4 py-2 bg-muted text-muted-foreground rounded-lg flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            {tGps('changeId')}
          </button>
        </div>
      </div>
    </div>
  );
}
