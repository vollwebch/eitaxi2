"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation, Power, X, Bell, Loader2, MapPin, Shield, Eye, EyeOff, Download, Smartphone, Share2, Plus, Check, LogIn, Car, ArrowRight } from "lucide-react";
import {
  subscribeToGPS,
  broadcastGPSState,
  readFromStorage,
  type GPSState
} from "@/lib/gpsSync";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export default function WidgetPage() {
  const [gpsActive, setGpsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [driverName, setDriverName] = useState<string | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // GPS Consent
  const [showGpsConsent, setShowGpsConsent] = useState(false);
  const [hasGpsConsent, setHasGpsConsent] = useState(false);

  // PWA Install
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [isStandalone, setIsStandalone] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const sendIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isLocalChangeRef = useRef(false);

  // Setup PWA install + check session
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) {
      setDeviceType('ios');
    } else if (/Android/.test(ua)) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Check session via API
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.authenticated && data.data?.driverId) {
          setDriverId(data.data.driverId);
          setDriverName(data.data.name || null);
          setIsAuthenticated(true);
          localStorage.setItem('widget-driverId', data.data.driverId);
        }
      })
      .catch(err => {
        console.error('Session check error:', err);
      })
      .finally(() => {
        setLoading(false);
      });

    const savedGpsConsent = localStorage.getItem('gps-tracking-consent');
    if (savedGpsConsent === 'true') {
      setHasGpsConsent(true);
    }

    return () => { window.removeEventListener('beforeinstallprompt', handler); };
  }, []);

  const startTrackingInternal = useCallback(async () => {
    if (!driverId) return;
    if (!navigator.geolocation) { setError('GPS no disponible'); return; }

    setError(null);
    setGpsActive(true);

    try {
      await fetch('/api/driver/tracking', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId, enabled: true }),
      });
    } catch (err) { console.error('Error enabling tracking:', err); }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const pos = { lat: latitude, lng: longitude };
        setCurrentPosition(pos);
        try {
          await fetch('/api/driver/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ driverId, latitude, longitude }),
          });
          const now = new Date();
          setLastUpdate(now);
          broadcastGPSState({ active: true, position: pos, lastUpdate: now.toISOString(), driverId });
        } catch (err) { console.error('Error sending location:', err); }
      },
      (err) => { setError('Error GPS: ' + err.message); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    if ('setAppBadge' in navigator) { (navigator as any).setAppBadge(1); }
  }, [driverId]);

  const startTracking = useCallback(async () => {
    if (!driverId) { setError('No hay conductor configurado'); return; }
    if (!navigator.geolocation) { setError('GPS no disponible'); return; }
    isLocalChangeRef.current = true;
    await startTrackingInternal();
    broadcastGPSState({ active: true, position: null, lastUpdate: null, driverId });
  }, [driverId, startTrackingInternal]);

  const stopTrackingInternal = useCallback(() => {
    if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
    if (sendIntervalRef.current) { clearInterval(sendIntervalRef.current); sendIntervalRef.current = null; }
    setGpsActive(false);
    setCurrentPosition(null);
    if ('setAppBadge' in navigator) { (navigator as any).setAppBadge(0); }
  }, []);

  const stopTracking = useCallback(() => {
    isLocalChangeRef.current = true;
    stopTrackingInternal();
    broadcastGPSState({ active: false, position: null, lastUpdate: null, driverId });
  }, [driverId, stopTrackingInternal]);

  const toggleGPS = useCallback(async () => {
    if (gpsActive) { stopTracking(); }
    else {
      if (!hasGpsConsent) { setShowGpsConsent(true); }
      else { await startTracking(); }
    }
  }, [gpsActive, startTracking, stopTracking, hasGpsConsent]);

  const acceptGpsConsent = useCallback(async () => {
    localStorage.setItem('gps-tracking-consent', 'true');
    setHasGpsConsent(true);
    setShowGpsConsent(false);
    await startTracking();
  }, [startTracking]);

  useEffect(() => {
    const unsubscribe = subscribeToGPS((state: GPSState) => {
      if (isLocalChangeRef.current) { isLocalChangeRef.current = false; return; }
      if (state.driverId && driverId && state.driverId !== driverId) return;
      setGpsActive(state.active);
      if (state.position) setCurrentPosition(state.position);
      if (state.lastUpdate) setLastUpdate(new Date(state.lastUpdate));
      if (state.active && watchIdRef.current === null) startTrackingInternal();
      else if (!state.active && watchIdRef.current !== null) stopTrackingInternal();
      if ('setAppBadge' in navigator) (navigator as any).setAppBadge(state.active ? 1 : 0);
    });

    const storedState = readFromStorage();
    if (storedState && (!storedState.driverId || storedState.driverId === driverId)) {
      setGpsActive(storedState.active);
      if (storedState.position) setCurrentPosition(storedState.position);
      if (storedState.lastUpdate) setLastUpdate(new Date(storedState.lastUpdate));
    }

    return unsubscribe;
  }, [driverId, startTrackingInternal, stopTrackingInternal]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (sendIntervalRef.current) clearInterval(sendIntervalRef.current);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShowInstall(false);
      setDeferredPrompt(null);
    }
  };

  const requestNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          if (registration) await registration.showNotification('eitaxi', { body: 'Notificaciones activadas!', icon: '/icons/icon-192x192.png' });
        }
        localStorage.setItem('widget-notifications', 'true');
      }
    }
  };

  // ===== Loading =====
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-yellow-400" />
      </div>
    );
  }

  // ===== Not authenticated → Login prompt =====
  if (!isAuthenticated || !driverId) {
    return (
      <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center">
        <div className="text-center max-w-sm w-full">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center">
            <Navigation className="h-10 w-10 text-black" />
          </div>
          <h1 className="text-2xl font-bold mb-2">eitaxi GPS</h1>
          <p className="text-muted-foreground mb-2">Control rapido de GPS para conductores</p>
          <p className="text-sm text-muted-foreground/70 mb-8">
            Inicia sesion con tu cuenta de conductor para activar el seguimiento GPS
          </p>

          <a
            href="/login?redirect=/widget"
            className="w-full py-4 bg-yellow-400 text-black font-bold rounded-2xl text-lg flex items-center justify-center gap-2"
          >
            <LogIn className="h-5 w-5" />
            Iniciar sesion
          </a>

          {!isStandalone && (
            <div className="mt-8">
              <p className="text-xs text-muted-foreground/50 mb-3">Quieres descargar esta app?</p>
              <button
                onClick={() => setShowInstall(true)}
                className="w-full py-3 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 rounded-xl flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Download className="h-4 w-4" />
                Instalar en tu movil
              </button>
            </div>
          )}

          {/* Install PWA Modal */}
          <AnimatePresence>
            {showInstall && (
              <InstallModal
                deviceType={deviceType}
                deferredPrompt={deferredPrompt}
                onInstall={handleInstall}
                onClose={() => setShowInstall(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ===== Authenticated → GPS Control =====
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
                <p className="text-sm text-muted-foreground">Permiso de ubicacion</p>
              </div>
            </div>
            <div className="space-y-4 mb-6">
              <p className="text-sm text-muted-foreground">Para recibir clientes, necesitas activar el seguimiento GPS.</p>
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2"><Eye className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" /><span>Los clientes te veran en el mapa</span></li>
                  <li className="flex items-start gap-2"><MapPin className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" /><span>Ubicacion actualizada en tiempo real</span></li>
                  <li className="flex items-start gap-2"><EyeOff className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" /><span>Desactiva cuando quieras</span></li>
                </ul>
              </div>
              <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">Tu ubicacion solo se muestra a clientes potenciales. No compartimos tus datos.</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 py-3 border border-border rounded-xl font-medium" onClick={() => setShowGpsConsent(false)}>Cancelar</button>
              <button className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold" onClick={acceptGpsConsent}>Activar GPS</button>
            </div>
          </div>
        </div>
      )}

      {/* Driver info bar */}
      <div className="p-4 text-center border-b border-border/50">
        <p className="text-sm text-muted-foreground">
          Hola, <span className="text-foreground font-medium">{driverName || 'Conductor'}</span>
        </p>
      </div>

      {/* Main GPS Button */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.button
          onClick={toggleGPS}
          className={`relative w-56 h-56 rounded-full flex flex-col items-center justify-center transition-all shadow-2xl ${gpsActive ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-red-400 to-red-600'}`}
          whileTap={{ scale: 0.95 }}
        >
          {gpsActive && (
            <>
              <motion.div className="absolute inset-0 rounded-full bg-green-400" animate={{ scale: [1, 1.3], opacity: [0.4, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
              <motion.div className="absolute inset-0 rounded-full bg-green-400" animate={{ scale: [1, 1.5], opacity: [0.3, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }} />
            </>
          )}
          <div className="relative z-10 text-center text-white">
            {gpsActive ? (
              <><Navigation className="h-16 w-16 mx-auto mb-2 animate-pulse" /><span className="text-2xl font-bold block">GPS ON</span></>
            ) : (
              <><Power className="h-16 w-16 mx-auto mb-2" /><span className="text-2xl font-bold block">GPS OFF</span></>
            )}
          </div>
        </motion.button>

        <div className="mt-8 text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${gpsActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${gpsActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            {gpsActive ? 'Transmitiendo ubicacion' : 'Sin transmitir'}
          </div>
          {currentPosition && (
            <div className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 text-yellow-400" />
              {currentPosition.lat.toFixed(4)}, {currentPosition.lng.toFixed(4)}
            </div>
          )}
          {lastUpdate && <p className="text-xs text-muted-foreground mt-1">{lastUpdate.toLocaleTimeString()}</p>}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-4 p-3 bg-red-500/20 text-red-400 rounded-lg text-sm text-center max-w-xs">
              {error}
              <button onClick={() => setError(null)} className="ml-2 opacity-70 hover:opacity-100"><X className="h-4 w-4 inline" /></button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom actions */}
      <div className="p-4 space-y-3">
        {!isStandalone && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => setShowInstall(true)}
            className="w-full py-3 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 rounded-xl flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Download className="h-4 w-4" />
            Instalar en tu movil
          </motion.button>
        )}

        {!gpsActive && typeof window !== 'undefined' && localStorage.getItem('widget-notifications') !== 'true' && (
          <button onClick={requestNotifications} className="w-full py-3 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center gap-2 text-sm">
            <Bell className="h-4 w-4" />
            Activar alertas
          </button>
        )}

        <div className="flex gap-2 text-sm">
          <button onClick={() => {
            // Logout and redirect
            localStorage.removeItem('widget-driverId');
            fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
              window.location.href = '/login?redirect=/widget';
            });
          }} className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg text-center">Cerrar sesion</button>
          <a href={`/dashboard/${driverId}`} className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg text-center">Panel completo</a>
        </div>
      </div>

      {/* Install PWA Modal */}
      <AnimatePresence>
        {showInstall && (
          <InstallModal
            deviceType={deviceType}
            deferredPrompt={deferredPrompt}
            onInstall={handleInstall}
            onClose={() => setShowInstall(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Install Modal Component
// ============================================
function InstallModal({
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="w-full max-w-sm bg-card border border-yellow-400/30 rounded-2xl p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Download className="h-5 w-5 text-yellow-400" />
            Instalar GPS Widget
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Control rapido de GPS. Abre esta pagina para activar/desactivar el GPS con un toque desde tu pantalla de inicio.</p>

        {deviceType === 'ios' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0"><Share2 className="h-4 w-4 text-white" /></div>
              <div><p className="font-medium text-sm">1. Toca <strong>Compartir</strong></p><p className="text-xs text-muted-foreground">Abajo a la izquierda (cuadrado con flecha)</p></div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0"><Plus className="h-4 w-4 text-white" /></div>
              <div><p className="font-medium text-sm">2. Toca <strong>Anadir a pantalla de inicio</strong></p><p className="text-xs text-muted-foreground">Desliza los iconos hasta encontrarlo</p></div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center flex-shrink-0"><Check className="h-4 w-4 text-black" /></div>
              <div><p className="font-medium text-sm">3. Toca <strong>Anadir</strong></p><p className="text-xs text-muted-foreground">El icono aparecera en tu pantalla</p></div>
            </div>
          </div>
        )}

        {deviceType === 'android' && (
          <div className="space-y-3">
            {deferredPrompt ? (
              <button onClick={onInstall} className="w-full py-4 rounded-xl bg-yellow-400 text-black font-bold text-lg flex items-center justify-center gap-2">
                <Smartphone className="h-5 w-5" /> Instalar ahora
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 rounded-lg bg-gray-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">...</div>
                  <div><p className="font-medium text-sm">1. Toca el <strong>menu</strong> (tres puntos)</p><p className="text-xs text-muted-foreground">Arriba a la derecha del navegador</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0"><Plus className="h-4 w-4 text-white" /></div>
                  <div><p className="font-medium text-sm">2. Toca <strong>Anadir a pantalla de inicio</strong></p><p className="text-xs text-muted-foreground">O Add to Home screen</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center flex-shrink-0"><Check className="h-4 w-4 text-black" /></div>
                  <div><p className="font-medium text-sm">3. Confirma tocando <strong>Anadir</strong></p><p className="text-xs text-muted-foreground">El icono aparecera en tu pantalla</p></div>
                </div>
              </div>
            )}
          </div>
        )}

        {deviceType === 'desktop' && (
          <div className="space-y-3">
            {deferredPrompt ? (
              <button onClick={onInstall} className="w-full py-4 rounded-xl bg-yellow-400 text-black font-bold text-lg flex items-center justify-center gap-2">
                <Smartphone className="h-5 w-5" /> Instalar app
              </button>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center flex-shrink-0"><Download className="h-4 w-4 text-black" /></div>
                <div><p className="font-medium text-sm">Busca el icono de instalar en la <strong>barra de direcciones</strong></p><p className="text-xs text-muted-foreground">O menu ... Instalar app</p></div>
              </div>
            )}
          </div>
        )}

        <button onClick={onClose} className="w-full mt-4 py-3 rounded-xl bg-muted text-muted-foreground font-medium">Entendido</button>
      </div>
    </motion.div>
  );
}
