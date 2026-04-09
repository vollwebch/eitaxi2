/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    DRIVER FORM CONTEXT - FUENTE ÚNICA                      ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║ Context centralizado para el formulario de conductor.                     ║
 * ║ Usado tanto en Registro como en Dashboard.                                ║
 * ║                                                                           ║
 * ║ Este contexto es consumido por:                                           ║
 * ║  - useDriverForm (hook principal)                                         ║
 * ║  - useServiceZones (hook de zonas)                                        ║
 * ║  - useSchedule (hook de horarios)                                         ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';

// ============================================
// TIPOS
// ============================================

export type FormMode = 'create' | 'edit';

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
}

export interface DaySchedule {
  dayOfWeek: number;
  mode: 'closed' | 'all_day' | 'specific';
  slots: TimeSlot[];
}

export interface NormalizedServiceZone {
  id?: string;
  zoneName: string;
  zoneType: string;
  zoneMode: 'pickup' | 'service';
  exclusions: string[];
  boundingBox?: {
    south: number;
    north: number;
    west: number;
    east: number;
  };
  centerLat?: number;
  centerLon?: number;
  osmId?: number;
}

export interface DriverFormData {
  // Datos básicos
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  password?: string;
  address: string;
  experience: number;
  description: string;
  imageUrl: string | null;
  
  // Ubicación
  baseCanton: string;
  baseCity: string;
  
  // Vehículo
  vehicleType: string;
  vehicleTypes: string[];
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number | null;
  vehicleColor: string;
  passengerCapacity: number | null;
  
  // Servicios
  services: string[];
  languages: string[];
  
  // Zonas (usando ServiceZone del ZoneSelector)
  serviceZones: NormalizedServiceZone[];
  
  // Horarios
  isAvailable24h: boolean;
  schedules: DaySchedule[];
  
  // Rutas populares (driverRoutes en API)
  routes: Array<{
    origin: string;
    destination: string;
    price?: number;
  }>;
  
  // Precios
  basePrice: number | null;
  pricePerKm: number | null;
  hourlyRate: number | null;
  
  // Redes sociales
  website: string;
  instagram: string;
  facebook: string;
}

interface DriverFormState {
  mode: FormMode;
  driverId: string | null;
  data: DriverFormData;
  loading: boolean;
  saving: boolean;
  error: string | null;
  success: string | null;
  validationErrors: Record<string, string>;
  errorSteps: Set<number>;
  imagePreview: string | null;
  imageFile: File | null;
  
  // Términos (solo registro)
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
}

type DriverFormAction =
  | { type: 'SET_MODE'; payload: FormMode }
  | { type: 'SET_DRIVER_ID'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'SET_DATA'; payload: Partial<DriverFormData> }
  | { type: 'UPDATE_FIELD'; payload: { field: keyof DriverFormData; value: any } }
  | { type: 'ADD_ZONE'; payload: NormalizedServiceZone }
  | { type: 'REMOVE_ZONE'; payload: number }
  | { type: 'UPDATE_ZONE'; payload: { index: number; zone: Partial<NormalizedServiceZone> } }
  | { type: 'UPDATE_SCHEDULE'; payload: { dayOfWeek: number; schedule: DaySchedule } }
  | { type: 'SET_IMAGE'; payload: { file: File | null; preview: string | null } }
  | { type: 'SET_ACCEPTED_TERMS'; payload: boolean }
  | { type: 'SET_ACCEPTED_PRIVACY'; payload: boolean }
  | { type: 'SET_VALIDATION_ERRORS'; payload: Record<string, string> }
  | { type: 'SET_ERROR_STEPS'; payload: Set<number> }
  | { type: 'ADD_ROUTE'; payload: DriverFormData['routes'][0] }
  | { type: 'REMOVE_ROUTE'; payload: number }
  | { type: 'UPDATE_ROUTE'; payload: { index: number; route: Partial<DriverFormData['routes'][0]> } }
  | { type: 'CLEAR_VALIDATION' }
  | { type: 'RESET' };

// ============================================
// ESTADO INICIAL
// ============================================

const initialData: DriverFormData = {
  name: '',
  phone: '',
  whatsapp: '',
  email: '',
  password: '',
  address: '',
  experience: 1,
  description: '',
  imageUrl: null,
  baseCanton: '',
  baseCity: '',
  vehicleType: 'taxi',
  vehicleTypes: [],
  vehicleBrand: '',
  vehicleModel: '',
  vehicleYear: null,
  vehicleColor: '',
  passengerCapacity: null,
  services: [],
  languages: [],
  serviceZones: [],
  isAvailable24h: true,
  schedules: [],
  routes: [],
  basePrice: null,
  pricePerKm: null,
  hourlyRate: null,
  website: '',
  instagram: '',
  facebook: '',
};

const initialState: DriverFormState = {
  mode: 'create',
  driverId: null,
  data: initialData,
  loading: false,
  saving: false,
  error: null,
  success: null,
  validationErrors: {},
  errorSteps: new Set(),
  imagePreview: null,
  imageFile: null,
  acceptedTerms: false,
  acceptedPrivacy: false,
};

// ============================================
// REDUCER
// ============================================

function driverFormReducer(state: DriverFormState, action: DriverFormAction): DriverFormState {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    
    case 'SET_DRIVER_ID':
      return { ...state, driverId: action.payload };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_SAVING':
      return { ...state, saving: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_SUCCESS':
      return { ...state, success: action.payload };
    
    case 'SET_DATA':
      return { ...state, data: { ...state.data, ...action.payload } };
    
    case 'UPDATE_FIELD':
      return {
        ...state,
        data: { ...state.data, [action.payload.field]: action.payload.value },
      };
    
    case 'ADD_ZONE':
      return {
        ...state,
        data: {
          ...state.data,
          serviceZones: [...state.data.serviceZones, action.payload],
        },
      };
    
    case 'REMOVE_ZONE':
      return {
        ...state,
        data: {
          ...state.data,
          serviceZones: state.data.serviceZones.filter((_, i) => i !== action.payload),
        },
      };
    
    case 'UPDATE_ZONE':
      return {
        ...state,
        data: {
          ...state.data,
          serviceZones: state.data.serviceZones.map((zone, i) =>
            i === action.payload.index
              ? { ...zone, ...action.payload.zone }
              : zone
          ),
        },
      };
    
    case 'UPDATE_SCHEDULE': {
      const { dayOfWeek, schedule } = action.payload;
      const existingIndex = state.data.schedules.findIndex(s => s.dayOfWeek === dayOfWeek);
      
      let newSchedules: DaySchedule[];
      if (existingIndex >= 0) {
        newSchedules = state.data.schedules.map((s, i) =>
          i === existingIndex ? schedule : s
        );
      } else {
        newSchedules = [...state.data.schedules, schedule];
      }
      
      return {
        ...state,
        data: { ...state.data, schedules: newSchedules },
      };
    }
    
    case 'SET_IMAGE':
      return {
        ...state,
        imageFile: action.payload.file,
        imagePreview: action.payload.preview,
      };
    
    case 'SET_ACCEPTED_TERMS':
      return { ...state, acceptedTerms: action.payload };
    
    case 'SET_ACCEPTED_PRIVACY':
      return { ...state, acceptedPrivacy: action.payload };
    
    case 'SET_VALIDATION_ERRORS':
      return { ...state, validationErrors: action.payload };
    
    case 'SET_ERROR_STEPS':
      return { ...state, errorSteps: action.payload };
    
    case 'ADD_ROUTE':
      return {
        ...state,
        data: {
          ...state.data,
          routes: [...state.data.routes, action.payload],
        },
      };
    
    case 'REMOVE_ROUTE':
      return {
        ...state,
        data: {
          ...state.data,
          routes: state.data.routes.filter((_, i) => i !== action.payload),
        },
      };
    
    case 'UPDATE_ROUTE':
      return {
        ...state,
        data: {
          ...state.data,
          routes: state.data.routes.map((route, i) =>
            i === action.payload.index
              ? { ...route, ...action.payload.route }
              : route
          ),
        },
      };
    
    case 'CLEAR_VALIDATION':
      return {
        ...state,
        validationErrors: {},
        errorSteps: new Set(),
        error: null,
      };
    
    case 'RESET':
      return {
        ...initialState,
        mode: state.mode,
        driverId: state.driverId,
      };
    
    default:
      return state;
  }
}

// ============================================
// CONTEXT
// ============================================

interface DriverFormContextValue {
  state: DriverFormState;
  dispatch: React.Dispatch<DriverFormAction>;
  
  // Acciones de datos
  updateField: <K extends keyof DriverFormData>(field: K, value: DriverFormData[K]) => void;
  setData: (data: Partial<DriverFormData>) => void;
  
  // Acciones de zonas
  addZone: (zone: NormalizedServiceZone) => void;
  removeZone: (index: number) => void;
  updateZone: (index: number, zone: Partial<NormalizedServiceZone>) => void;
  
  // Acciones de horarios
  updateSchedule: (dayOfWeek: number, schedule: DaySchedule) => void;
  
  // Acciones de imagen
  setImage: (file: File | null, preview: string | null) => void;
  
  // Acciones de estado
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
  clearValidationErrors: () => void;
  
  // Toggles
  toggleService: (serviceId: string) => void;
  toggleLanguage: (langId: string) => void;
  toggleVehicleType: (typeId: string) => void;
  
  // Rutas
  addRoute: (route: DriverFormData['routes'][0]) => void;
  removeRoute: (index: number) => void;
  updateRoute: (index: number, route: Partial<DriverFormData['routes'][0]>) => void;
  
  // Horarios (funciones de conveniencia)
  setDayMode: (dayOfWeek: number, mode: 'closed' | 'all_day' | 'specific') => void;
  addSlot: (dayOfWeek: number) => void;
  removeSlot: (dayOfWeek: number, slotId: string) => void;
  updateSlot: (dayOfWeek: number, slotId: string, data: { startTime?: string; endTime?: string }) => void;
  
  // Carga y guardado
  loadDriverData: (driverId: string) => Promise<void>;
  save: () => Promise<boolean>;
  reset: () => void;
  
  // Utilidades
  hasChanges: () => boolean;
}

const DriverFormContext = createContext<DriverFormContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

export interface DriverFormProviderProps {
  children: React.ReactNode;
  mode?: FormMode;
  driverId?: string;
  initialData?: Partial<DriverFormData>;
}

export function DriverFormProvider({
  children,
  mode = 'create',
  driverId,
  initialData: initialDataProp,
}: DriverFormProviderProps) {
  const [state, dispatch] = useReducer(driverFormReducer, {
    ...initialState,
    mode,
    driverId: driverId || null,
    data: initialDataProp ? { ...initialData, ...initialDataProp } : initialData,
  });
  
  // Track original data for hasChanges
  const originalDataRef = useRef<string>('');
  
  // Cargar datos automáticamente si hay driverId y modo edit
  useEffect(() => {
    if (mode === 'edit' && driverId) {
      loadDriverData(driverId);
    }
  }, [mode, driverId]);
  
  // Actualizar originalDataRef cuando cargan datos
  useEffect(() => {
    if (!state.loading && state.data.name) {
      originalDataRef.current = JSON.stringify(state.data);
    }
  }, [state.loading, state.data.name]);
  
  // ========================================
  // ACCIONES DE DATOS
  // ========================================
  
  const updateField = useCallback(<K extends keyof DriverFormData>(field: K, value: DriverFormData[K]) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { field, value } });
  }, []);
  
  const setData = useCallback((data: Partial<DriverFormData>) => {
    dispatch({ type: 'SET_DATA', payload: data });
  }, []);
  
  // ========================================
  // ACCIONES DE ZONAS
  // ========================================
  
  const addZone = useCallback((zone: NormalizedServiceZone) => {
    dispatch({ type: 'ADD_ZONE', payload: zone });
  }, []);
  
  const removeZone = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_ZONE', payload: index });
  }, []);
  
  const updateZone = useCallback((index: number, zone: Partial<NormalizedServiceZone>) => {
    dispatch({ type: 'UPDATE_ZONE', payload: { index, zone } });
  }, []);
  
  // ========================================
  // ACCIONES DE HORARIOS
  // ========================================
  
  const updateSchedule = useCallback((dayOfWeek: number, schedule: DaySchedule) => {
    dispatch({ type: 'UPDATE_SCHEDULE', payload: { dayOfWeek, schedule } });
  }, []);
  
  // ========================================
  // ACCIONES DE IMAGEN
  // ========================================
  
  const setImage = useCallback((file: File | null, preview: string | null) => {
    dispatch({ type: 'SET_IMAGE', payload: { file, preview } });
  }, []);
  
  // ========================================
  // ACCIONES DE ESTADO
  // ========================================
  
  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);
  
  const setSuccess = useCallback((success: string | null) => {
    dispatch({ type: 'SET_SUCCESS', payload: success });
  }, []);
  
  const clearValidationErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_VALIDATION' });
  }, []);
  
  // ========================================
  // TOGGLES
  // ========================================
  
  const toggleService = useCallback((serviceId: string) => {
    const current = state.data.services;
    const newValue = current.includes(serviceId)
      ? current.filter(s => s !== serviceId)
      : [...current, serviceId];
    updateField('services', newValue);
  }, [state.data.services, updateField]);
  
  const toggleLanguage = useCallback((langId: string) => {
    const current = state.data.languages;
    const newValue = current.includes(langId)
      ? current.filter(l => l !== langId)
      : [...current, langId];
    updateField('languages', newValue);
  }, [state.data.languages, updateField]);
  
  const toggleVehicleType = useCallback((typeId: string) => {
    const current = state.data.vehicleTypes;
    const newValue = current.includes(typeId)
      ? current.filter(t => t !== typeId)
      : [...current, typeId];
    updateField('vehicleTypes', newValue);
    if (newValue.length > 0) {
      updateField('vehicleType', newValue[0]);
    }
  }, [state.data.vehicleTypes, updateField]);
  
  // ========================================
  // RUTAS
  // ========================================
  
  const addRoute = useCallback((route: DriverFormData['routes'][0]) => {
    const newRoutes = [...state.data.routes, route];
    updateField('routes', newRoutes);
  }, [state.data.routes, updateField]);
  
  const removeRoute = useCallback((index: number) => {
    const newRoutes = state.data.routes.filter((_, i) => i !== index);
    updateField('routes', newRoutes);
  }, [state.data.routes, updateField]);
  
  const updateRoute = useCallback((index: number, routeUpdate: Partial<DriverFormData['routes'][0]>) => {
    const newRoutes = state.data.routes.map((route, i) =>
      i === index ? { ...route, ...routeUpdate } : route
    );
    updateField('routes', newRoutes);
  }, [state.data.routes, updateField]);
  
  // ========================================
  // FUNCIONES DE HORARIOS (CONVENIENCIA)
  // ========================================
  
  const setDayMode = useCallback((dayOfWeek: number, mode: 'closed' | 'all_day' | 'specific') => {
    const existingSchedule = state.data.schedules.find(s => s.dayOfWeek === dayOfWeek);
    let newSlots = existingSchedule?.slots || [];
    
    if (mode === 'closed') {
      newSlots = [];
    } else if (mode === 'all_day') {
      newSlots = [{ id: `${dayOfWeek}-allday`, startTime: '00:00', endTime: '23:59' }];
    } else if (mode === 'specific' && newSlots.length === 0) {
      newSlots = [{ id: `${dayOfWeek}-1`, startTime: '09:00', endTime: '18:00' }];
    }
    
    dispatch({ type: 'UPDATE_SCHEDULE', payload: { dayOfWeek, schedule: { dayOfWeek, mode, slots: newSlots } } });
  }, [state.data.schedules]);
  
  const addSlot = useCallback((dayOfWeek: number) => {
    const existingSchedule = state.data.schedules.find(s => s.dayOfWeek === dayOfWeek);
    const currentSlots = existingSchedule?.slots || [];
    const newSlot = { id: `${dayOfWeek}-${Date.now()}`, startTime: '09:00', endTime: '18:00' };
    
    dispatch({ type: 'UPDATE_SCHEDULE', payload: { 
      dayOfWeek, 
      schedule: { dayOfWeek, mode: 'specific', slots: [...currentSlots, newSlot] } 
    }});
  }, [state.data.schedules]);
  
  const removeSlot = useCallback((dayOfWeek: number, slotId: string) => {
    const existingSchedule = state.data.schedules.find(s => s.dayOfWeek === dayOfWeek);
    const currentSlots = existingSchedule?.slots || [];
    const newSlots = currentSlots.filter(s => s.id !== slotId);
    
    dispatch({ type: 'UPDATE_SCHEDULE', payload: { 
      dayOfWeek, 
      schedule: { 
        dayOfWeek, 
        mode: newSlots.length === 0 ? 'closed' : 'specific', 
        slots: newSlots 
      } 
    }});
  }, [state.data.schedules]);
  
  const updateSlot = useCallback((dayOfWeek: number, slotId: string, data: { startTime?: string; endTime?: string }) => {
    const existingSchedule = state.data.schedules.find(s => s.dayOfWeek === dayOfWeek);
    const currentSlots = existingSchedule?.slots || [];
    const newSlots = currentSlots.map(slot => 
      slot.id === slotId ? { ...slot, ...data } : slot
    );
    
    dispatch({ type: 'UPDATE_SCHEDULE', payload: { 
      dayOfWeek, 
      schedule: { dayOfWeek, mode: 'specific', slots: newSlots } 
    }});
  }, [state.data.schedules]);
  
  // ========================================
  // CARGA Y GUARDADO
  // ========================================
  
  const loadDriverData = useCallback(async (id: string) => {
    console.log('📥 [DriverFormContext] Cargando conductor:', id);
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      const response = await fetch(`/api/drivers?id=${id}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error al cargar conductor');
      }
      
      const driver = result.data;
      
      console.log('📊 [DriverFormContext] Datos recibidos:', {
        name: driver.name,
        zones: driver.driverServiceZones?.length || 0,
        schedules: driver.schedules?.length || 0,
        workingHours: driver.workingHours?.length || 0,
      });
      
      // Normalizar schedules: usar workingHours (nuevo formato) si existe
      let normalizedSchedules: DaySchedule[] = [];
      
      if (driver.workingHours && Array.isArray(driver.workingHours)) {
        // Ya viene en el formato correcto
        normalizedSchedules = driver.workingHours;
      } else if (driver.schedules && driver.schedules.length > 0) {
        // Convertir formato antiguo al nuevo
        normalizedSchedules = driver.schedules.map((s: any) => ({
          dayOfWeek: s.dayOfWeek,
          mode: s.isActive ? 'specific' : 'closed',
          slots: s.isActive ? [{ id: `slot-${s.dayOfWeek}`, startTime: s.startTime, endTime: s.endTime }] : []
        }));
      }
      
      // Normalizar zonas
      const normalizedZones: NormalizedServiceZone[] = (driver.driverServiceZones || []).map((z: any) => ({
        id: z.id,
        zoneName: z.zoneName,
        zoneType: z.zoneType || 'region',
        zoneMode: z.zoneMode || 'service',
        exclusions: Array.isArray(z.exclusions) ? z.exclusions : (typeof z.exclusions === 'string' ? JSON.parse(z.exclusions) : []),
        boundingBox: z.boundingBox ? (typeof z.boundingBox === 'string' ? JSON.parse(z.boundingBox) : z.boundingBox) : undefined,
        centerLat: z.centerLat,
        centerLon: z.centerLon,
        osmId: z.osmId,
      }));
      
      console.log('📊 [DriverFormContext] Schedules normalizados:', normalizedSchedules.length);
      console.log('📊 [DriverFormContext] Zonas normalizadas:', normalizedZones.length);
      
      // Actualizar estado
      dispatch({
        type: 'SET_DATA',
        payload: {
          name: driver.name || '',
          phone: driver.phone || '',
          whatsapp: driver.whatsapp || '',
          email: driver.email || '',
          address: driver.address || '',
          experience: driver.experience || 1,
          description: driver.description || '',
          imageUrl: driver.imageUrl || null,
          baseCanton: driver.cantonId || driver.canton?.id || '',
          baseCity: driver.city?.name || '',
          vehicleType: driver.vehicleType || 'taxi',
          vehicleTypes: driver.vehicleTypes || [],
          vehicleBrand: driver.vehicleBrand || '',
          vehicleModel: driver.vehicleModel || '',
          vehicleYear: driver.vehicleYear || null,
          vehicleColor: driver.vehicleColor || '',
          passengerCapacity: driver.passengerCapacity || null,
          services: driver.services || [],
          languages: driver.languages || [],
          serviceZones: normalizedZones,
          isAvailable24h: driver.isAvailable24h ?? true,
          schedules: normalizedSchedules,
          routes: driver.driverRoutes || driver.routes || [],
          basePrice: driver.basePrice || null,
          pricePerKm: driver.pricePerKm || null,
          hourlyRate: driver.hourlyRate || null,
          website: driver.website || '',
          instagram: driver.instagram || '',
          facebook: driver.facebook || '',
        },
      });
      
      dispatch({ type: 'SET_DRIVER_ID', payload: id });
      dispatch({ type: 'SET_IMAGE', payload: { file: null, preview: driver.imageUrl || null } });
      
      // Guardar original para hasChanges
      originalDataRef.current = JSON.stringify(state.data);
      
    } catch (error: any) {
      console.error('❌ [DriverFormContext] Error cargando:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Error al cargar datos' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);
  
  const save = useCallback(async (): Promise<boolean> => {
    console.log('💾 [DriverFormContext] Guardando...');
    dispatch({ type: 'SET_SAVING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      // Subir imagen si hay archivo nuevo
      let imageUrl = state.data.imageUrl;
      if (state.imageFile) {
        const formData = new FormData();
        formData.append('file', state.imageFile);
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          imageUrl = uploadData.url;
        }
      }
      
      // Extraer nombres de zonas para el campo JSON simple
      const serviceZoneNames = state.data.serviceZones.map(z => z.zoneName);

      const payload = {
        // Datos básicos
        name: state.data.name?.trim() || "",
        phone: state.data.phone?.trim() || "",
        whatsapp: state.data.whatsapp?.trim() || null,
        email: state.data.email?.trim().toLowerCase() || "",
        password: state.mode === 'create' ? state.data.password : undefined,
        address: state.data.address?.trim() || null,
        experience: state.data.experience ?? 1,
        description: state.data.description?.trim() || null,

        // Ubicación
        baseCanton: state.data.baseCanton,
        baseCity: state.data.baseCity,

        // Vehículo
        vehicleType: state.data.vehicleTypes[0] || state.data.vehicleType || "taxi",
        vehicleTypes: state.data.vehicleTypes.length > 0 ? state.data.vehicleTypes : ["taxi"],
        vehicleBrand: state.data.vehicleBrand?.trim() || null,
        vehicleModel: state.data.vehicleModel?.trim() || null,
        vehicleYear: state.data.vehicleYear || null,
        vehicleColor: state.data.vehicleColor?.trim() || null,
        passengerCapacity: state.data.passengerCapacity || null,

        // Servicios e idiomas
        services: state.data.services.length > 0 ? state.data.services : ["city"],
        languages: state.data.languages || [],

        // Zonas - FORMATO CORRECTO
        serviceZones: serviceZoneNames, // Array de strings para el campo JSON
        serviceZonesWithExclusions: state.data.serviceZones, // Objetos completos para la tabla

        // Horarios
        isAvailable24h: state.data.isAvailable24h,
        schedules: state.data.isAvailable24h ? null : state.data.schedules,

        // Rutas
        routes: state.data.routes || [],

        // Precios
        basePrice: state.data.basePrice || null,
        pricePerKm: state.data.pricePerKm || null,
        hourlyRate: state.data.hourlyRate || null,

        // Redes sociales
        website: state.data.website?.trim() || null,
        instagram: state.data.instagram?.trim() || null,
        facebook: state.data.facebook?.trim() || null,

        // Imagen
        imageUrl,
      };

      // Determinar método
      const method = state.mode === 'create' ? 'POST' : 'PUT';

      if (state.mode === 'edit' && state.driverId) {
        (payload as any).id = state.driverId;
      }

      console.log('📦 [DriverFormContext] Payload preparado:', {
        mode: state.mode,
        driverId: state.driverId,
        zones: serviceZoneNames.length,
        schedules: state.data.schedules?.length || 0,
        routes: state.data.routes?.length || 0,
      });
      
      console.log('📤 [DriverFormContext] Enviando payload');
      
      const response = await fetch('/api/drivers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ [DriverFormContext] Guardado exitoso');
        dispatch({ type: 'SET_SUCCESS', payload: 'Perfil guardado correctamente' });
        
        if (result.data?.id) {
          dispatch({ type: 'SET_DRIVER_ID', payload: result.data.id });
        }
        
        // Actualizar original para hasChanges
        originalDataRef.current = JSON.stringify(state.data);
        
        return true;
      } else {
        throw new Error(result.error || 'Error al guardar');
      }
      
    } catch (error: any) {
      console.error('❌ [DriverFormContext] Error guardando:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Error al guardar' });
      return false;
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [state.data, state.mode, state.driverId, state.imageFile]);
  
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);
  
  const hasChanges = useCallback((): boolean => {
    return JSON.stringify(state.data) !== originalDataRef.current;
  }, [state.data]);
  
  // ========================================
  // VALUE
  // ========================================
  
  const value: DriverFormContextValue = {
    state,
    dispatch,
    updateField,
    setData,
    addZone,
    removeZone,
    updateZone,
    updateSchedule,
    setImage,
    setError,
    setSuccess,
    clearValidationErrors,
    toggleService,
    toggleLanguage,
    toggleVehicleType,
    addRoute,
    removeRoute,
    updateRoute,
    setDayMode,
    addSlot,
    removeSlot,
    updateSlot,
    loadDriverData,
    save,
    reset,
    hasChanges,
  };
  
  return (
    <DriverFormContext.Provider value={value}>
      {children}
    </DriverFormContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useDriverFormContext(): DriverFormContextValue {
  const context = useContext(DriverFormContext);
  
  if (!context) {
    throw new Error('useDriverFormContext debe usarse dentro de DriverFormProvider');
  }
  
  return context;
}

// Alias para compatibilidad con componentes que usan useDriverForm
export const useDriverForm = useDriverFormContext;

// Tipos adicionales exportados
export type { 
  DriverFormState, 
  DriverFormAction,
  NormalizedServiceZone,
  DaySchedule,
  TimeSlot
};
