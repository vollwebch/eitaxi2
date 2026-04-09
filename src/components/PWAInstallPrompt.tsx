"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share, Plus, Smartphone, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    if (standalone) return;

    // Detect device type
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) {
      setDeviceType('ios');
    } else if (/Android/.test(ua)) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }

    // Listen for beforeinstallprompt event (Android/Chrome Desktop)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Show prompt after a delay
    const timer = setTimeout(() => {
      // Check if dismissed before
      const wasDismissed = sessionStorage.getItem('pwa-install-dismissed');
      if (!wasDismissed) {
        setShowPrompt(true);
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else {
      // No native prompt, show manual instructions
      setShowManual(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowManual(false);
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed
  if (isStandalone) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 z-[100]"
        >
          <div className="bg-card border-2 border-yellow-400/50 rounded-2xl p-4 shadow-2xl max-w-md mx-auto">
            {!showManual ? (
              <>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center">
                    <Smartphone className="h-7 w-7 text-black" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-foreground">Instalar eitaxi</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Acceso rápido al GPS desde tu pantalla de inicio
                    </p>
                    
                    <div className="flex gap-2 mt-3">
                      {deferredPrompt ? (
                        <Button
                          className="flex-1 bg-yellow-400 text-black hover:bg-yellow-500 font-bold"
                          onClick={handleInstall}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Instalar
                        </Button>
                      ) : (
                        <Button
                          className="flex-1 bg-yellow-400 text-black hover:bg-yellow-500 font-bold"
                          onClick={() => setShowManual(true)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Cómo instalar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDismiss}
                        className="text-muted-foreground"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Manual Instructions */}
                <div className="relative">
                  <button
                    onClick={() => setShowManual(false)}
                    className="absolute -top-1 -right-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    {deviceType === 'ios' && <Smartphone className="h-5 w-5 text-yellow-400" />}
                    {deviceType === 'android' && <Smartphone className="h-5 w-5 text-yellow-400" />}
                    {deviceType === 'desktop' && <Monitor className="h-5 w-5 text-yellow-400" />}
                    Instalar en {deviceType === 'ios' ? 'iPhone/iPad' : deviceType === 'android' ? 'Android' : 'PC'}
                  </h3>

                  {deviceType === 'ios' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                          <Share className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">1. Toca el botón Compartir</p>
                          <p className="text-xs text-muted-foreground">Está abajo a la izquierda (cuadrado con flecha ↑)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                          <Plus className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">2. Desliza y toca "Añadir a pantalla de inicio"</p>
                          <p className="text-xs text-muted-foreground">O "Add to Home Screen"</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center text-black font-bold">
                          ✓
                        </div>
                        <div>
                          <p className="font-medium">3. Toca "Añadir" arriba a la derecha</p>
                          <p className="text-xs text-muted-foreground">¡Listo! El icono aparecerá en tu pantalla</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {deviceType === 'android' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-8 h-8 rounded-lg bg-gray-500 flex items-center justify-center text-white font-bold text-sm">
                          ⋮
                        </div>
                        <div>
                          <p className="font-medium">1. Toca el menú (tres puntos)</p>
                          <p className="text-xs text-muted-foreground">Arriba a la derecha del navegador</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                          <Plus className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">2. Toca "Añadir a pantalla de inicio"</p>
                          <p className="text-xs text-muted-foreground">O "Add to Home screen"</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center text-black font-bold">
                          ✓
                        </div>
                        <div>
                          <p className="font-medium">3. Confirma tocando "Añadir"</p>
                          <p className="text-xs text-muted-foreground">¡El icono aparecerá en tu pantalla!</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {deviceType === 'desktop' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center">
                          <Download className="h-4 w-4 text-black" />
                        </div>
                        <div>
                          <p className="font-medium">1. Mira la barra de direcciones</p>
                          <p className="text-xs text-muted-foreground">A la derecha, busca el icono de instalar</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center text-black font-bold">
                          ✓
                        </div>
                        <div>
                          <p className="font-medium">2. O usa el menú: ⋮ → Instalar app</p>
                          <p className="text-xs text-muted-foreground">En Chrome: Más herramientas → Crear acceso directo</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={handleDismiss}
                  >
                    Entendido
                  </Button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
