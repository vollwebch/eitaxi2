// GPS Sync Utility - Compartido entre Dashboard y Widget
// Usa BroadcastChannel como primario y localStorage como fallback

const CHANNEL_NAME = 'eitaxi-gps-sync';
const STORAGE_KEY = 'eitaxi-gps-state';

export interface GPSState {
  active: boolean;
  position: { lat: number; lng: number } | null;
  lastUpdate: string | null;
  driverId: string | null;
}

type GPSListener = (state: GPSState) => void;

let channel: BroadcastChannel | null = null;
let listeners: GPSListener[] = [];
let storageListenerAttached = false;

// Inicializar el canal
function initChannel() {
  if (typeof window === 'undefined') return;
  
  if (!channel && 'BroadcastChannel' in window) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    
    channel.onmessage = (event) => {
      if (event.data.type === 'gps-status') {
        const state: GPSState = {
          active: event.data.active,
          position: event.data.position || null,
          lastUpdate: event.data.lastUpdate || null,
          driverId: event.data.driverId || null,
        };
        
        // Guardar en localStorage como backup
        saveToStorage(state);
        
        // Notificar a todos los listeners
        listeners.forEach(fn => fn(state));
      }
    };
  }
  
  // También escuchar cambios en localStorage (para sincronización entre tabs)
  if (!storageListenerAttached) {
    storageListenerAttached = true;
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const state = JSON.parse(e.newValue) as GPSState;
          listeners.forEach(fn => fn(state));
        } catch {
          // Ignore parse errors
        }
      }
    });
  }
}

// Guardar estado en localStorage
function saveToStorage(state: GPSState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

// Leer estado desde localStorage
export function readFromStorage(): GPSState | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data) as GPSState;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

// Suscribirse a cambios de GPS
export function subscribeToGPS(listener: GPSListener): () => void {
  initChannel();
  listeners.push(listener);
  
  // Enviar estado inicial desde localStorage
  const stored = readFromStorage();
  if (stored) {
    listener(stored);
  }
  
  // Retornar función de cleanup
  return () => {
    listeners = listeners.filter(fn => fn !== listener);
  };
}

// Transmitir nuevo estado de GPS
export function broadcastGPSState(state: GPSState) {
  initChannel();
  
  // Guardar en localStorage
  saveToStorage(state);
  
  // Enviar por BroadcastChannel
  if (channel) {
    channel.postMessage({
      type: 'gps-status',
      active: state.active,
      position: state.position,
      lastUpdate: state.lastUpdate,
      driverId: state.driverId,
    });
  }
}

// Limpiar el canal (solo al cerrar app completamente)
export function cleanupGPSSync() {
  if (channel) {
    channel.close();
    channel = null;
  }
  listeners = [];
}
