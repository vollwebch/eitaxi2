/**
 * =========================================================================
 * MOTOR DE BÚSQUEDA DE TAXIS - REFACTORIZADO
 * =========================================================================
 * 
 * Sistema completo de matching de taxis siguiendo 10 reglas estrictas:
 * 
 * 1. Validación de RECOGIDA (zonas pickup + GPS fallback)
 * 2. Validación de DESTINO (zonas service)
 * 3. Lógica Cantón vs Distrito
 * 4. Excepción por Rutas Populares (BYPASS)
 * 5. Radio de Recogida Dinámico (15km, 50km larga distancia)
 * 6. Lógica de Retorno (GPS Match)
 * 7. Prioridades de Resultados
 * 8. Filtros de Vehículo
 * 9. ETA y Distancia con OSRM
 * 10. Reservas (Pre-booking)
 * 
 * =========================================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  geocodeAddress,
  reverseGeocode,
  calculateRoute,
  calculateStraightLineDistance,
  isLocationCoveredByZones,
  isLocationInExclusions,
  type DriverZone,
  type RouteInfo
} from '@/lib/geo-osm'
import { MUNICIPALITIES_BY_CANTON, LIECHTENSTEIN_MUNICIPALITIES, DISTRICTS_BY_CANTON } from '@/lib/swiss-municipalities'

// =========================================================================
// CONFIGURACIÓN
// =========================================================================

const CONFIG = {
  // Radio máximo para ir a buscar al cliente (km)
  MAX_PICKUP_RADIUS_KM: 15,
  
  // Viaje considerado larga distancia para ignorar límite de radio (km)
  LONG_DISTANCE_THRESHOLD_KM: 50,
  
  // Máxima ETA para ir a buscar (minutos)
  MAX_PICKUP_ETA_MINUTES: 30,
  
  // Ratio máximo tiempo llegada / tiempo viaje (regla de oro)
  MAX_ETA_TO_TRIP_RATIO: 3,
  
  // Tiempo máximo de actualización de GPS (hora)
  GPS_MAX_AGE_HOURS: 1,
  
  // Cache TTL en ms
  CACHE_TTL_MS: 30000,
}

// =========================================================================
// TIPOS
// =========================================================================

interface SearchLocation {
  lat: number;
  lon: number;
  city: string;
  postalCode: string;
  canton: string;
  cantonCode: string;
  country: string;
  countryCode: string;
  displayName: string;
  boundingBox?: {
    south: number;
    north: number;
    west: number;
    east: number;
  };
}

interface DriverForSearch {
  id: string;
  name: string;
  slug?: string;
  phone?: string;
  whatsapp?: string | null;
  city: { name: string; slug: string };
  canton: { code: string; country: string; slug: string };
  latitude?: number | null;
  longitude?: number | null;
  operationRadius?: number | null;
  coverageType?: string | null;
  isActive: boolean;
  trackingEnabled?: boolean;
  lastLocationAt?: Date | string | null;
  currentLocation?: { lat: number; lon: number } | null;
  driverServiceZones: DriverZone[];
  driverRoutes?: Array<{
    origin: string;
    destination: string;
    isActive: boolean;
  }>;
  basePrice?: number | null;
  pricePerKm?: number | null;
  hourlyRate?: number | null;
  vehicleType?: string;
  vehicleTypes?: string[];
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  passengerCapacity?: number | null;
  services?: string[];
  languages?: string[];
  description?: string | null;
  imageUrl?: string | null;
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  isTopRated?: boolean;
  isAvailable24h?: boolean;
  subscription?: string;
}

interface MatchPriority {
  level: number;
  label: string;
  description: string;
}

const PRIORITIES = {
  ROUTE_BYPASS: { level: 5, label: 'Ruta Popular', description: 'Coincide con ruta guardada' },
  TOTAL_MATCH: { level: 4, label: 'Match Total', description: 'Origen en pickup + Destino en service' },
  RETURN_MATCH: { level: 3, label: 'En Ruta de Vuelta', description: 'GPS activo + destino en zona de trabajo' },
  PARTIAL_MATCH: { level: 2, label: 'Match Parcial', description: 'Solo origen coincide (GPS cerca)' },
  GPS_OPPORTUNITY: { level: 1, label: 'Disponible Cerca', description: 'GPS activo cerca del origen' },
}

interface SearchResult {
  driver: DriverForSearch;
  priority: MatchPriority;
  eta: number;
  distanceToOrigin: number;
  tripDistance: number;
  tripDuration: number;
  estimatedPrice: { min: number; max: number };
  matchReason: string;
  zones: { pickup: string; service: string };
  isReturnTrip?: boolean;
  routeBypass?: boolean;
}

interface SearchMeta {
  origin: string;
  destination: string;
  totalMatches: number;
  filteredByCapacity: number;
  filteredByDistance: number;
  filteredByVehicleType: number;
  filteredByServices: number;
  filteredByZones: number;
}

// =========================================================================
// CACHE
// =========================================================================

let driversCache: {
  timestamp: number;
  drivers: DriverForSearch[];
} | null = null;

// =========================================================================
// FUNCIONES HELPER
// =========================================================================

/**
 * Equivalencias de nombres de cantones en diferentes idiomas
 */
const CANTON_EQUIVALENCES: Record<string, string[]> = {
  'ge': ['genève', 'geneve', 'geneva', 'ginebra', 'genf'],
  'zh': ['zürich', 'zurich', 'zurigo'],
  'be': ['bern', 'berne', 'berna'],
  'vd': ['vaud', 'waadt'],
  'vs': ['valais', 'wallis', 'vallese'],
  'ti': ['ticino', 'tessin'],
  'sg': ['st gallen', 'stgallen', 'sankt gallen', 'san gallo'],
  'lu': ['luzern', 'lucerne', 'lucerna'],
  'ag': ['aargau', 'argovie', 'argovia'],
  'tg': ['thurgau', 'thurgovie', 'turgovia'],
  'gr': ['graubünden', 'graubunden', 'grigioni', 'grisons', 'grischun'],
  'bl': ['basel landschaft', 'baselland', 'bâle campagne', 'bale campagne'],
  'bs': ['basel stadt', 'baselstadt', 'bâle ville', 'bale ville', 'basilea'],
  'fr': ['fribourg', 'freiburg', 'friburgo'],
  'so': ['solothurn', 'soleure', 'soletta'],
  'ne': ['neuchâtel', 'neuchatel', 'neuenburg', 'neocastello'],
  'zg': ['zug', 'zugo'],
  'sh': ['schaffhausen', 'schaffhouse', 'sciaffusa'],
  'ar': ['appenzell ausserrhoden', 'appenzell esterni'],
  'ai': ['appenzell innerrhoden', 'appenzell interni'],
  'gl': ['glarus', 'glarona'],
  'nw': ['nidwalden', 'nidvaldo'],
  'ow': ['obwalden', 'obvaldo'],
  'sz': ['schwyz', 'svitto'],
  'ur': ['uri'],
  'ju': ['jura', 'giura'],
  'li': ['liechtenstein'],
};

/**
 * Normalizar nombre de cantón con equivalencias
 */
function normalizeCantonName(cantonName: string, cantonCode: string): string[] {
  const normalized = normalizeText(cantonName);
  const code = cantonCode.toLowerCase();
  
  // Obtener equivalencias para este código de cantón
  const equivalents = CANTON_EQUIVALENCES[code] || [];
  
  return [normalized, ...equivalents];
}

/**
 * Verificar si dos nombres de cantón son equivalentes
 */
function areCantonNamesEquivalent(name1: string, code1: string, name2: string, code2: string): boolean {
  const n1 = normalizeText(name1);
  const n2 = normalizeText(name2);
  const c1 = (code1 || '').toLowerCase();
  const c2 = (code2 || '').toLowerCase();
  
  // Si ambos tienen código y coinciden
  if (c1 && c2 && c1 === c2) {
    return true;
  }
  
  // Buscar en qué grupo de equivalencias está cada nombre
  let group1: string | null = null;
  let group2: string | null = null;
  
  for (const [code, equivalents] of Object.entries(CANTON_EQUIVALENCES)) {
    // Verificar si n1 está en este grupo (por nombre o código)
    if (equivalents.includes(n1) || c1 === code) {
      group1 = code;
    }
    // Verificar si n2 está en este grupo (por nombre o código)
    if (equivalents.includes(n2) || c2 === code) {
      group2 = code;
    }
  }
  
  // Si ambos están en el mismo grupo, son equivalentes
  if (group1 && group2 && group1 === group2) {
    return true;
  }
  
  // Si uno tiene código y el otro no, verificar si el nombre está en las equivalencias del código
  if (c1 && !c2 && CANTON_EQUIVALENCES[c1]?.includes(n2)) {
    return true;
  }
  if (c2 && !c1 && CANTON_EQUIVALENCES[c2]?.includes(n1)) {
    return true;
  }
  
  return false;
}

/**
 * Normalizar texto para comparación
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

/**
 * Obtener municipios de un cantón
 */
function getCantonMunicipalities(cantonCode: string): string[] {
  if (cantonCode === 'LI') {
    return LIECHTENSTEIN_MUNICIPALITIES;
  }
  return MUNICIPALITIES_BY_CANTON[cantonCode.toUpperCase()] || [];
}

/**
 * Verificar si una ciudad pertenece a un cantón
 */
function isCityInCanton(cityName: string, cantonCode: string): boolean {
  const municipalities = getCantonMunicipalities(cantonCode);
  const normalizedCity = normalizeText(cityName);
  return municipalities.some(m => normalizeText(m) === normalizedCity);
}

/**
 * Verificar si una ciudad pertenece a un distrito específico
 */
function isCityInDistrict(cityName: string, cantonCode: string, districtName: string): boolean {
  const districts = DISTRICTS_BY_CANTON[cantonCode.toUpperCase()];
  if (!districts) return false;
  
  const district = districts.find(d => 
    normalizeText(d.name) === normalizeText(districtName) ||
    normalizeText(d.nameDE) === normalizeText(districtName)
  );
  
  if (!district) return false;
  
  const normalizedCity = normalizeText(cityName);
  return district.municipalities.some(m => normalizeText(m) === normalizedCity);
}

/**
 * Verificar cobertura de zona con lógica Cantón/Distrito
 */
function checkZoneCoverage(
  location: SearchLocation,
  zone: DriverZone
): { covered: boolean; reason: string } {
  const zoneNameNorm = normalizeText(zone.zoneName);
  const cityNorm = normalizeText(location.city);
  const cantonNorm = normalizeText(location.canton);
  const cantonCodeNorm = location.cantonCode.toUpperCase();
  
  // Verificar exclusiones primero
  if (zone.exclusions && zone.exclusions.length > 0) {
    const exclusionCheck = isLocationInExclusions(
      {
        city: location.city,
        canton: location.canton,
        cantonCode: location.cantonCode,
        postalCode: location.postalCode,
        displayName: location.displayName
      },
      zone.exclusions
    );
    if (exclusionCheck.vetoed) {
      return { covered: false, reason: exclusionCheck.reason };
    }
  }
  
  // Si hay bounding box, verificar si el punto está dentro
  if (zone.boundingBox) {
    const { south, north, west, east } = zone.boundingBox;
    if (location.lat >= south && location.lat <= north && 
        location.lon >= west && location.lon <= east) {
      return { covered: true, reason: `Dentro de zona: ${zone.zoneName}` };
    }
  }
  
  switch (zone.zoneType) {
    case 'country':
      // Cobertura de país entero
      if (zoneNameNorm.includes('liechtenstein') && location.countryCode === 'LI') {
        return { covered: true, reason: 'País: Liechtenstein' };
      }
      if (zoneNameNorm.includes('suiza') && location.countryCode === 'CH') {
        return { covered: true, reason: 'País: Suiza' };
      }
      break;
      
    case 'canton':
      // Si es tipo cantón, verificar si la ciudad está en ese cantón
      // Extraer código de cantón del nombre de zona (ej: "St. Gallen SG" → "SG")
      const cantonMatch = zone.zoneName.match(/\b([A-Z]{2})\b/);
      const zoneCantonCode = cantonMatch ? cantonMatch[1] : null;
      
      // Verificar por código de cantón
      if (zoneCantonCode && cantonCodeNorm === zoneCantonCode.toLowerCase()) {
        return { covered: true, reason: `Cantón: ${zone.zoneName}` };
      }
      
      // Verificar por equivalencias de nombres (Genf = Genève = Geneva)
      if (areCantonNamesEquivalent(location.canton, location.cantonCode, zone.zoneName, zoneCantonCode || '')) {
        return { covered: true, reason: `Cantón: ${zone.zoneName}` };
      }
      
      // Verificar por nombre directo
      if (cantonNorm.includes(zoneNameNorm) || zoneNameNorm.includes(cantonNorm)) {
        return { covered: true, reason: `Cantón: ${zone.zoneName}` };
      }
      
      // Verificar si la ciudad pertenece al cantón de la zona
      if (zoneCantonCode && isCityInCanton(location.city, zoneCantonCode)) {
        return { covered: true, reason: `Cantón: ${zone.zoneName}` };
      }
      break;
      
    case 'district':
      // Si es tipo distrito, solo aceptar ciudades de ese distrito específico
      // Extraer cantón y distrito del nombre (ej: "Rheintal SG")
      const districtCantonMatch = zone.zoneName.match(/\b([A-Z]{2})\b/);
      const districtCantonCode = districtCantonMatch ? districtCantonMatch[1] : null;
      const districtName = zone.zoneName.replace(/\s*[A-Z]{2}\s*$/, '').trim();
      
      if (districtCantonCode && isCityInDistrict(location.city, districtCantonCode, districtName)) {
        return { covered: true, reason: `Distrito: ${zone.zoneName}` };
      }
      break;
      
    case 'municipality':
    case 'city':
      // Solo esa ciudad específica
      if (cityNorm === zoneNameNorm || cityNorm.includes(zoneNameNorm) || zoneNameNorm.includes(cityNorm)) {
        return { covered: true, reason: `${zone.zoneType}: ${zone.zoneName}` };
      }
      break;
  }
  
  return { covered: false, reason: '' };
}

/**
 * Verificar si el conductor tiene una ruta popular que coincide
 */
function checkPopularRouteBypass(
  driver: DriverForSearch,
  originText: string,
  destText: string
): { bypass: boolean; route?: string } {
  if (!driver.driverRoutes || driver.driverRoutes.length === 0) {
    return { bypass: false };
  }
  
  const originNorm = normalizeText(originText);
  const destNorm = normalizeText(destText);
  
  for (const route of driver.driverRoutes) {
    if (!route.isActive) continue;
    
    const routeOriginNorm = normalizeText(route.origin);
    const routeDestNorm = normalizeText(route.destination);
    
    // Coincidencia exacta o contenido
    const originMatch = routeOriginNorm === originNorm || 
                        routeOriginNorm.includes(originNorm) ||
                        originNorm.includes(routeOriginNorm);
    const destMatch = routeDestNorm === destNorm ||
                      routeDestNorm.includes(destNorm) ||
                      destNorm.includes(routeDestNorm);
    
    if (originMatch && destMatch) {
      return { 
        bypass: true, 
        route: `${route.origin} → ${route.destination}` 
      };
    }
  }
  
  return { bypass: false };
}

/**
 * Verificar si la ubicación GPS es reciente
 */
function isGPSLocationFresh(driver: DriverForSearch): boolean {
  if (!driver.trackingEnabled || !driver.currentLocation) {
    return false;
  }
  
  if (driver.lastLocationAt) {
    const lastUpdate = new Date(driver.lastLocationAt);
    const maxAge = new Date(Date.now() - CONFIG.GPS_MAX_AGE_HOURS * 60 * 60 * 1000);
    if (lastUpdate < maxAge) {
      return false;
    }
  }
  
  return true;
}

/**
 * Calcular precio estimado
 */
function estimatePrice(
  distanceKm: number,
  basePrice: number = 5,
  pricePerKm: number = 2.5
): { min: number; max: number } {
  const calculated = basePrice + (distanceKm * pricePerKm);
  return {
    min: Math.round(calculated),
    max: Math.round(calculated * 1.15)
  };
}

// =========================================================================
// VALIDACIONES PRINCIPALES
// =========================================================================

/**
 * REGLA 1: Validación de RECOGIDA (Origen)
 * El Punto A debe coincidir con zonas pickup, si no, GPS activo cerca
 */
async function validatePickup(
  origin: SearchLocation,
  driver: DriverForSearch
): Promise<{ valid: boolean; reason: string; distance?: number; eta?: number }> {
  const pickupZones = driver.driverServiceZones.filter(z => z.zoneMode === 'pickup');
  const serviceZones = driver.driverServiceZones.filter(z => z.zoneMode === 'service');
  
  // Verificar si el origen está en zonas de pickup
  for (const zone of pickupZones) {
    const result = checkZoneCoverage(origin, zone);
    if (result.covered) {
      return { valid: true, reason: result.reason };
    }
  }
  
  // También verificar zonas de servicio (para compatibilidad)
  for (const zone of serviceZones) {
    const result = checkZoneCoverage(origin, zone);
    if (result.covered) {
      return { valid: true, reason: `En zona de servicio: ${zone.zoneName}` };
    }
  }
  
  // Si no está en zonas de pickup, verificar GPS activo cerca
  if (isGPSLocationFresh(driver) && driver.currentLocation) {
    const route = await calculateRoute(
      driver.currentLocation.lat,
      driver.currentLocation.lon,
      origin.lat,
      origin.lon
    );
    
    if (route) {
      return {
        valid: true,
        reason: `GPS activo a ${route.durationMin} min del origen`,
        distance: route.distanceKm,
        eta: route.durationMin
      };
    }
    
    // Fallback a línea recta
    const straightDist = calculateStraightLineDistance(
      driver.currentLocation.lat,
      driver.currentLocation.lon,
      origin.lat,
      origin.lon
    );
    
    if (straightDist <= CONFIG.MAX_PICKUP_RADIUS_KM) {
      return {
        valid: true,
        reason: `GPS activo a ${straightDist.toFixed(1)} km (línea recta)`,
        distance: straightDist,
        eta: Math.round(straightDist * 2) // Estimación: 2 min/km
      };
    }
  }
  
  return { valid: false, reason: 'Origen no está en zonas de recogida y GPS no disponible' };
}

/**
 * REGLA 2: Validación de DESTINO
 * El Punto B debe coincidir con zonas service
 */
function validateDestination(
  destination: SearchLocation,
  driver: DriverForSearch
): { valid: boolean; reason: string } {
  const serviceZones = driver.driverServiceZones.filter(z => z.zoneMode === 'service');
  
  // Verificar si el destino está en zonas de servicio
  for (const zone of serviceZones) {
    const result = checkZoneCoverage(destination, zone);
    if (result.covered) {
      return { valid: true, reason: result.reason };
    }
  }
  
  // También verificar zonas de pickup (algunos conductores las usan como ambas)
  const pickupZones = driver.driverServiceZones.filter(z => z.zoneMode === 'pickup');
  for (const zone of pickupZones) {
    const result = checkZoneCoverage(destination, zone);
    if (result.covered) {
      return { valid: true, reason: `En zona de pickup: ${zone.zoneName}` };
    }
  }
  
  return { valid: false, reason: 'Destino no está en zonas de servicio' };
}

/**
 * REGLA 5: Radio de Recogida Dinámico
 * Si distancia > 15km, NO mostrar (salvo larga distancia)
 * Regla de oro: tiempo llegada > 3x tiempo viaje → no mostrar
 */
async function validatePickupRadius(
  driver: DriverForSearch,
  origin: SearchLocation,
  tripDistance: number
): Promise<{ valid: boolean; reason: string; distance?: number; eta?: number }> {
  // Si no hay GPS, no podemos validar
  if (!isGPSLocationFresh(driver) || !driver.currentLocation) {
    return { valid: true, reason: 'Sin GPS, asumiendo posición base' };
  }
  
  // Calcular ruta desde posición del conductor hasta origen
  const route = await calculateRoute(
    driver.currentLocation.lat,
    driver.currentLocation.lon,
    origin.lat,
    origin.lon
  );
  
  if (!route) {
    // Fallback a línea recta
    const straightDist = calculateStraightLineDistance(
      driver.currentLocation.lat,
      driver.currentLocation.lon,
      origin.lat,
      origin.lon
    );
    
    // Si es larga distancia, ignorar límite
    if (tripDistance >= CONFIG.LONG_DISTANCE_THRESHOLD_KM) {
      return { valid: true, reason: 'Larga distancia, límite de radio ignorado', distance: straightDist };
    }
    
    if (straightDist > CONFIG.MAX_PICKUP_RADIUS_KM) {
      return { valid: false, reason: `A ${straightDist.toFixed(1)} km - excede límite de ${CONFIG.MAX_PICKUP_RADIUS_KM} km` };
    }
    
    return { valid: true, reason: 'Dentro del radio permitido', distance: straightDist };
  }
  
  // Si es larga distancia, ignorar límite de ETA
  if (tripDistance >= CONFIG.LONG_DISTANCE_THRESHOLD_KM) {
    return { 
      valid: true, 
      reason: 'Larga distancia, límite de ETA ignorado', 
      distance: route.distanceKm, 
      eta: route.durationMin 
    };
  }
  
  // Verificar ETA máxima
  if (route.durationMin > CONFIG.MAX_PICKUP_ETA_MINUTES) {
    return { 
      valid: false, 
      reason: `ETA de ${route.durationMin} min excede máximo de ${CONFIG.MAX_PICKUP_ETA_MINUTES} min`,
      distance: route.distanceKm,
      eta: route.durationMin
    };
  }
  
  // Regla de oro: tiempo llegada no debe ser > 3x tiempo viaje
  const tripDurationEstimate = tripDistance * 1.2; // ~1.2 min/km estimado
  if (route.durationMin > tripDurationEstimate * CONFIG.MAX_ETA_TO_TRIP_RATIO) {
    return {
      valid: false,
      reason: `Llegada ${route.durationMin} min para viaje de ~${Math.round(tripDurationEstimate)} min (regla de oro)`,
      distance: route.distanceKm,
      eta: route.durationMin
    };
  }
  
  return { 
    valid: true, 
    reason: 'Dentro del radio y ETA permitidos', 
    distance: route.distanceKm, 
    eta: route.durationMin 
  };
}

/**
 * REGLA 6: Lógica de Retorno (GPS Match)
 * Si GPS activo en zona que NO es base → destino cerca de BASE = Prioridad
 */
function checkReturnTrip(
  driver: DriverForSearch,
  destination: SearchLocation
): { isReturn: boolean; reason: string } {
  if (!isGPSLocationFresh(driver) || !driver.currentLocation) {
    return { isReturn: false, reason: '' };
  }
  
  // Obtener zona base del conductor (su ciudad/cantón registrado)
  const baseCity = driver.city?.name || '';
  const baseCanton = driver.canton?.code || '';
  
  // Verificar si el destino está cerca de su base
  const serviceZones = driver.driverServiceZones.filter(z => z.zoneMode === 'service');
  
  for (const zone of serviceZones) {
    const result = checkZoneCoverage(destination, zone);
    if (result.covered) {
      // Verificar si el conductor está fuera de su zona base (potencial viaje de vuelta)
      const isInBaseZone = driver.driverServiceZones.some(z => {
        const zoneNorm = normalizeText(z.zoneName);
        return zoneNorm.includes(normalizeText(baseCity)) || 
               zoneNorm.includes(normalizeText(baseCanton));
      });
      
      if (!isInBaseZone) {
        return { 
          isReturn: true, 
          reason: 'En ruta de vuelta hacia su zona base' 
        };
      }
    }
  }
  
  return { isReturn: false, reason: '' };
}

/**
 * REGLA 8: Filtros de Vehículo
 */
function validateVehicleFilters(
  driver: DriverForSearch,
  passengers: number,
  vehicleType?: string,
  services?: string[]
): { valid: boolean; reason: string } {
  // Verificar capacidad de pasajeros
  if (driver.passengerCapacity && passengers > driver.passengerCapacity) {
    return { valid: false, reason: `Capacidad insuficiente (${driver.passengerCapacity} plazas)` };
  }
  
  // Verificar tipo de vehículo
  if (vehicleType && driver.vehicleTypes && driver.vehicleTypes.length > 0) {
    const hasType = driver.vehicleTypes.some(vt => 
      normalizeText(vt) === normalizeText(vehicleType)
    );
    if (!hasType) {
      return { valid: false, reason: `No tiene vehículo tipo "${vehicleType}"` };
    }
  }
  
  // Verificar servicios especiales
  if (services && services.length > 0 && driver.services && driver.services.length > 0) {
    const hasAllServices = services.every(s => 
      driver.services!.some(ds => normalizeText(ds) === normalizeText(s))
    );
    if (!hasAllServices) {
      return { valid: false, reason: `No ofrece todos los servicios requeridos` };
    }
  }
  
  return { valid: true, reason: 'Cumple filtros de vehículo' };
}

// =========================================================================
// OBTENER CONDUCTORES
// =========================================================================

async function getDriversWithLocation(): Promise<DriverForSearch[]> {
  if (driversCache && Date.now() - driversCache.timestamp < CONFIG.CACHE_TTL_MS) {
    return driversCache.drivers;
  }

  const rawDrivers = await db.taxiDriver.findMany({
    where: { isActive: true },
    include: {
      city: true,
      canton: true,
      driverServiceZones: true,
      driverRoutes: true,
      locations: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  const drivers = rawDrivers.map(d => {
    const lastLocation = d.locations[0];
    
    // Parsear zonas del conductor
    const driverServiceZones: DriverZone[] = d.driverServiceZones.map(z => {
      let boundingBox: DriverZone['boundingBox'] = undefined;
      if (z.boundingBox) {
        try {
          const parsed = JSON.parse(z.boundingBox as string);
          boundingBox = parsed;
        } catch {}
      }
      
      let exclusions: string[] = [];
      try {
        exclusions = JSON.parse(z.exclusions as string || '[]');
      } catch {}

      return {
        zoneName: z.zoneName,
        zoneType: z.zoneType as DriverZone['zoneType'],
        zoneMode: (z.zoneMode || 'service') as 'pickup' | 'service',
        exclusions,
        boundingBox,
        osmId: z.osmId || undefined
      };
    });

    // Parsear campos JSON
    let services: string[] = [];
    let languages: string[] = [];
    let vehicleTypes: string[] = [];

    try { services = JSON.parse(d.services || '[]'); } catch {}
    try { languages = JSON.parse(d.languages || '[]'); } catch {}
    try { vehicleTypes = JSON.parse(d.vehicleTypes || '["taxi"]'); } catch {}

    return {
      id: d.id,
      name: d.name,
      slug: d.slug,
      phone: d.phone,
      whatsapp: d.whatsapp,
      city: d.city,
      canton: d.canton,
      latitude: d.latitude,
      longitude: d.longitude,
      operationRadius: d.operationRadius,
      coverageType: d.coverageType,
      isActive: d.isActive,
      trackingEnabled: d.trackingEnabled,
      lastLocationAt: d.lastLocationAt,
      currentLocation: lastLocation ? {
        lat: lastLocation.latitude,
        lon: lastLocation.longitude
      } : null,
      driverServiceZones,
      driverRoutes: d.driverRoutes.map(r => ({
        origin: r.origin,
        destination: r.destination,
        isActive: r.isActive
      })),
      basePrice: d.basePrice,
      pricePerKm: d.pricePerKm,
      hourlyRate: d.hourlyRate,
      vehicleType: d.vehicleType,
      vehicleTypes,
      vehicleBrand: d.vehicleBrand,
      vehicleModel: d.vehicleModel,
      passengerCapacity: d.passengerCapacity,
      services,
      languages,
      description: d.description,
      imageUrl: d.imageUrl,
      rating: d.rating,
      reviewCount: d.reviewCount,
      isVerified: d.isVerified,
      isTopRated: d.isTopRated,
      isAvailable24h: d.isAvailable24h,
      subscription: d.subscription
    };
  });

  driversCache = { timestamp: Date.now(), drivers };
  return drivers;
}

// =========================================================================
// GEOCODIFICACIÓN
// =========================================================================

async function resolveLocation(
  locationId: string | null,
  locationType: string | null,
  locationText: string | null,
  directLat: number | null,
  directLon: number | null
): Promise<SearchLocation | null> {
  
  // 1. Si hay coordenadas directas
  if (directLat && directLon) {
    const geocoded = await reverseGeocode(directLat, directLon);
    if (geocoded) {
      return {
        lat: directLat,
        lon: directLon,
        city: geocoded.city,
        postalCode: geocoded.postalCode,
        canton: geocoded.canton,
        cantonCode: geocoded.cantonCode,
        country: geocoded.country,
        countryCode: geocoded.countryCode,
        displayName: geocoded.display_name,
        boundingBox: geocoded.boundingBox
      };
    }
    return {
      lat: directLat,
      lon: directLon,
      city: '',
      postalCode: '',
      canton: '',
      cantonCode: '',
      country: 'CH',
      countryCode: 'CH',
      displayName: 'Ubicación seleccionada'
    };
  }

  // 2. Si hay ID de ciudad/cantón en BD
  if (locationId) {
    if (locationType === 'city') {
      const city = await db.city.findUnique({
        where: { id: locationId },
        include: { canton: true }
      });
      if (city) {
        return {
          lat: city.latitude || 0,
          lon: city.longitude || 0,
          city: city.name,
          postalCode: city.postalCode || '',
          canton: city.canton.name,
          cantonCode: city.canton.code,
          country: city.canton.country || 'CH',
          countryCode: city.canton.country || 'CH',
          displayName: `${city.name}, ${city.canton.name}`
        };
      }
    } else if (locationType === 'canton') {
      const canton = await db.canton.findUnique({ where: { id: locationId } });
      if (canton) {
        return {
          lat: 0,
          lon: 0,
          city: '',
          postalCode: '',
          canton: canton.name,
          cantonCode: canton.code,
          country: canton.country || 'CH',
          countryCode: canton.country || 'CH',
          displayName: canton.name
        };
      }
    } else {
      const location = await db.location.findUnique({
        where: { id: locationId },
        include: { city: { include: { canton: true } }, canton: true }
      });
      if (location && location.latitude && location.longitude) {
        return {
          lat: location.latitude,
          lon: location.longitude,
          city: location.city?.name || '',
          postalCode: location.postalCode || '',
          canton: location.canton?.name || location.city?.canton?.name || '',
          cantonCode: location.canton?.code || location.city?.canton?.code || '',
          country: location.canton?.country || 'CH',
          countryCode: location.canton?.country || 'CH',
          displayName: location.name
        };
      }
    }
  }

  // 3. Si hay texto de ubicación
  if (locationText && locationText.trim().length >= 2) {
    const results = await geocodeAddress(locationText.trim(), {
      countrycodes: 'ch,li,de,at,fr,it',
      limit: 1
    });

    if (results.length > 0) {
      const geo = results[0];
      return {
        lat: geo.lat,
        lon: geo.lon,
        city: geo.city,
        postalCode: geo.postalCode,
        canton: geo.canton,
        cantonCode: geo.cantonCode,
        country: geo.country,
        countryCode: geo.countryCode,
        displayName: geo.display_name,
        boundingBox: geo.boundingBox
      };
    }
  }

  return null;
}

// =========================================================================
// API HANDLER
// =========================================================================

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Parámetros de ubicación
    const originId = searchParams.get('originId');
    const originType = searchParams.get('originType');
    const originText = searchParams.get('originText');
    const originLat = searchParams.get('originLat') ? parseFloat(searchParams.get('originLat')!) : null;
    const originLon = searchParams.get('originLon') ? parseFloat(searchParams.get('originLon')!) : null;

    const destinationId = searchParams.get('destinationId');
    const destinationType = searchParams.get('destinationType');
    const destinationText = searchParams.get('destText') || searchParams.get('destinationText');
    const destLat = searchParams.get('destLat') ? parseFloat(searchParams.get('destLat')!) : null;
    const destLon = searchParams.get('destLon') ? parseFloat(searchParams.get('destLon')!) : null;

    // Parámetros de filtros
    const passengers = searchParams.get('passengers') ? parseInt(searchParams.get('passengers')!) : 1;
    const vehicleType = searchParams.get('vehicleType') || undefined;
    const services = searchParams.get('services') ? searchParams.get('services')!.split(',') : undefined;
    const scheduledFor = searchParams.get('scheduledFor') || undefined;

    // Parámetros legacy
    const cityId = searchParams.get('cityId');
    const cantonId = searchParams.get('cantonId');
    const query = searchParams.get('q');

    // 🔒 Log sanitizado: no se registran coordenadas del cliente
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Búsqueda de taxis - parámetros de filtros aplicados');
    }

    // =========================================================================
    // BÚSQUEDA DE RUTA (ORIGEN → DESTINO)
    // =========================================================================
    const hasOrigin = originId || originLat || originText;
    const hasDestination = destinationId || destLat || destinationText;

    if (hasOrigin || hasDestination) {
      // Resolver ubicaciones
      const origin = await resolveLocation(originId, originType, originText, originLat, originLon);
      const destination = await resolveLocation(destinationId, destinationType, destinationText, destLat, destLon);

    // 🔒 No se registran ubicaciones resueltas por privacidad

      // Obtener conductores
      const allDrivers = await getDriversWithLocation();

      // Calcular distancia del viaje si tenemos ambas ubicaciones
      let tripRoute: RouteInfo | null = null;
      if (origin && destination && origin.lat && origin.lon && destination.lat && destination.lon) {
        tripRoute = await calculateRoute(origin.lat, origin.lon, destination.lat, destination.lon);
      if (process.env.NODE_ENV === 'development') {
        console.log('🛣️ Ruta del viaje calculada:', tripRoute?.distanceKm, 'km');
      }
      }

      const tripDistance = tripRoute?.distanceKm || 0;
      const tripDuration = tripRoute?.durationMin || 0;

      // =========================================================================
      // PROCESAR CADA CONDUCTOR
      // =========================================================================
      const results: SearchResult[] = [];
      const meta: SearchMeta = {
        origin: origin?.displayName || originText || '',
        destination: destination?.displayName || destinationText || '',
        totalMatches: 0,
        filteredByCapacity: 0,
        filteredByDistance: 0,
        filteredByVehicleType: 0,
        filteredByServices: 0,
        filteredByZones: 0
      };

      for (const driver of allDrivers) {
        if (!driver.isActive) continue;

        // ================================================================
        // PASO 0: Verificar exclusión (VETO)
        // ================================================================
        let excluded = false;
        
        if (origin) {
          const originExclusion = isLocationInExclusions(
            {
              city: origin.city,
              canton: origin.canton,
              cantonCode: origin.cantonCode,
              postalCode: origin.postalCode,
              displayName: origin.displayName
            },
            driver.driverServiceZones.flatMap(z => z.exclusions || [])
          );
          if (originExclusion.vetoed) {
            console.log(`🚫 ${driver.name}: VETADO - Origen en zona excluida: ${originExclusion.reason}`);
            excluded = true;
          }
        }

        if (destination && !excluded) {
          const destExclusion = isLocationInExclusions(
            {
              city: destination.city,
              canton: destination.canton,
              cantonCode: destination.cantonCode,
              postalCode: destination.postalCode,
              displayName: destination.displayName
            },
            driver.driverServiceZones.flatMap(z => z.exclusions || [])
          );
          if (destExclusion.vetoed) {
            console.log(`🚫 ${driver.name}: VETADO - Destino en zona excluida: ${destExclusion.reason}`);
            excluded = true;
          }
        }

        if (excluded) {
          meta.filteredByZones++;
          continue;
        }

        // ================================================================
        // PASO 1: Verificar filtros de vehículo (REGLA 8)
        // ================================================================
        const vehicleValidation = validateVehicleFilters(driver, passengers, vehicleType, services);
        if (!vehicleValidation.valid) {
          console.log(`🚗 ${driver.name}: DESCARTADO - ${vehicleValidation.reason}`);
          if (vehicleValidation.reason.includes('Capacidad')) {
            meta.filteredByCapacity++;
          } else if (vehicleValidation.reason.includes('tipo')) {
            meta.filteredByVehicleType++;
          } else {
            meta.filteredByServices++;
          }
          continue;
        }

        // ================================================================
        // PASO 2: Verificar Rutas Populares BYPASS (REGLA 4)
        // ================================================================
        if (origin && destination && originText && destinationText) {
          const routeBypass = checkPopularRouteBypass(driver, originText, destinationText);
          if (routeBypass.bypass) {
            console.log(`⭐ ${driver.name}: BYPASS por ruta popular - ${routeBypass.route}`);
            
            // Calcular ETA y distancia
            let etaToOrigin = 0;
            let distanceToOrigin = 0;
            
            if (isGPSLocationFresh(driver) && driver.currentLocation) {
              const route = await calculateRoute(
                driver.currentLocation.lat,
                driver.currentLocation.lon,
                origin.lat,
                origin.lon
              );
              if (route) {
                etaToOrigin = route.durationMin;
                distanceToOrigin = route.distanceKm;
              }
            }

            results.push({
              driver,
              priority: PRIORITIES.ROUTE_BYPASS,
              eta: etaToOrigin,
              distanceToOrigin,
              tripDistance,
              tripDuration,
              estimatedPrice: estimatePrice(tripDistance, driver.basePrice || 5, driver.pricePerKm || 2.5),
              matchReason: `Ruta popular: ${routeBypass.route}`,
              zones: {
                pickup: driver.driverServiceZones.filter(z => z.zoneMode === 'pickup').map(z => z.zoneName).join(', '),
                service: driver.driverServiceZones.filter(z => z.zoneMode === 'service').map(z => z.zoneName).join(', ')
              },
              routeBypass: true
            });
            continue;
          }
        }

        // ================================================================
        // PASO 3: Validaciones de zonas
        // ================================================================
        let pickupValid = false;
        let pickupReason = '';
        let pickupDistance = 0;
        let pickupEta = 0;

        let destValid = false;
        let destReason = '';

        if (origin) {
          // REGLA 1: Validar recogida
          const pickupResult = await validatePickup(origin, driver);
          pickupValid = pickupResult.valid;
          pickupReason = pickupResult.reason;
          pickupDistance = pickupResult.distance || 0;
          pickupEta = pickupResult.eta || 0;

          // REGLA 5: Validar radio de recogida dinámico
          if (pickupValid) {
            const radiusResult = await validatePickupRadius(driver, origin, tripDistance);
            if (!radiusResult.valid) {
              console.log(`📏 ${driver.name}: DESCARTADO - ${radiusResult.reason}`);
              meta.filteredByDistance++;
              continue;
            }
            pickupDistance = radiusResult.distance || pickupDistance;
            pickupEta = radiusResult.eta || pickupEta;
          }
        }

        if (destination) {
          // REGLA 2: Validar destino
          const destResult = validateDestination(destination, driver);
          destValid = destResult.valid;
          destReason = destResult.reason;
        }

        // ================================================================
        // PASO 4: Determinar tipo de match y prioridad
        // ================================================================
        
        // Sin destino (solo origen)
        if (origin && !destination) {
          if (pickupValid) {
            results.push({
              driver,
              priority: PRIORITIES.PARTIAL_MATCH,
              eta: pickupEta,
              distanceToOrigin: pickupDistance,
              tripDistance: 0,
              tripDuration: 0,
              estimatedPrice: { min: 0, max: 0 },
              matchReason: pickupReason,
              zones: {
                pickup: driver.driverServiceZones.filter(z => z.zoneMode === 'pickup').map(z => z.zoneName).join(', '),
                service: ''
              }
            });
            console.log(`✅ ${driver.name}: MATCH PARCIAL - ${pickupReason}`);
          }
          continue;
        }

        // Con origen y destino
        if (origin && destination) {
          // REGLA 6: Verificar si es viaje de vuelta
          const returnCheck = checkReturnTrip(driver, destination);

          if (pickupValid && destValid) {
            // MATCH TOTAL (REGLA 7 - Prioridad 1)
            const priority = returnCheck.isReturn ? PRIORITIES.RETURN_MATCH : PRIORITIES.TOTAL_MATCH;
            
            results.push({
              driver,
              priority,
              eta: pickupEta,
              distanceToOrigin: pickupDistance,
              tripDistance,
              tripDuration,
              estimatedPrice: estimatePrice(tripDistance, driver.basePrice || 5, driver.pricePerKm || 2.5),
              matchReason: returnCheck.isReturn 
                ? `${pickupReason} → ${destReason} (${returnCheck.reason})`
                : `${pickupReason} → ${destReason}`,
              zones: {
                pickup: driver.driverServiceZones.filter(z => z.zoneMode === 'pickup').map(z => z.zoneName).join(', '),
                service: driver.driverServiceZones.filter(z => z.zoneMode === 'service').map(z => z.zoneName).join(', ')
              },
              isReturnTrip: returnCheck.isReturn
            });
            console.log(`✅ ${driver.name}: ${priority.label} - ${pickupReason} → ${destReason}`);
          } else if (pickupValid && !destValid) {
            // MATCH PARCIAL - solo origen coincide
            if (isGPSLocationFresh(driver)) {
              results.push({
                driver,
                priority: PRIORITIES.PARTIAL_MATCH,
                eta: pickupEta,
                distanceToOrigin: pickupDistance,
                tripDistance,
                tripDuration,
                estimatedPrice: estimatePrice(tripDistance, driver.basePrice || 5, driver.pricePerKm || 2.5),
                matchReason: `${pickupReason} (destino fuera de zona)`,
                zones: {
                  pickup: driver.driverServiceZones.filter(z => z.zoneMode === 'pickup').map(z => z.zoneName).join(', '),
                  service: driver.driverServiceZones.filter(z => z.zoneMode === 'service').map(z => z.zoneName).join(', ')
                }
              });
              console.log(`⚠️ ${driver.name}: MATCH PARCIAL - ${pickupReason} (destino no cubierto)`);
            }
          } else if (!pickupValid && destValid) {
            // REGLA 6: Posible viaje de vuelta
            if (isGPSLocationFresh(driver) && returnCheck.isReturn) {
              results.push({
                driver,
                priority: PRIORITIES.RETURN_MATCH,
                eta: pickupEta,
                distanceToOrigin: pickupDistance,
                tripDistance,
                tripDuration,
                estimatedPrice: estimatePrice(tripDistance, driver.basePrice || 5, driver.pricePerKm || 2.5),
                matchReason: `${returnCheck.reason} - ${destReason}`,
                zones: {
                  pickup: driver.driverServiceZones.filter(z => z.zoneMode === 'pickup').map(z => z.zoneName).join(', '),
                  service: driver.driverServiceZones.filter(z => z.zoneMode === 'service').map(z => z.zoneName).join(', ')
                },
                isReturnTrip: true
              });
              console.log(`🔄 ${driver.name}: RETURN MATCH - ${returnCheck.reason}`);
            }
          } else {
            console.log(`❌ ${driver.name}: SIN MATCH - Pickup: ${pickupReason}, Dest: ${destReason}`);
          }
        }
      }

      // =========================================================================
      // ORDENAR RESULTADOS (REGLA 7)
      // =========================================================================
      results.sort((a, b) => {
        // Por prioridad (mayor primero)
        if (b.priority.level !== a.priority.level) {
          return b.priority.level - a.priority.level;
        }
        // Por ETA (menor primero)
        return a.eta - b.eta;
      });

      meta.totalMatches = results.length;

      // Formatear respuesta
      const formattedResults = results.map(r => ({
        id: r.driver.id,
        name: r.driver.name,
        slug: r.driver.slug,
        // 🔒 Teléfono no expuesto en API pública (nDSG)
        city: r.driver.city,
        canton: r.driver.canton,
        priority: r.priority.level,
        priorityLabel: r.priority.label,
        eta: r.eta,
        distanceToOrigin: r.distanceToOrigin,
        tripDistance: r.tripDistance,
        tripDuration: r.tripDuration,
        estimatedPrice: r.estimatedPrice,
        matchReason: r.matchReason,
        zones: r.zones,
        isReturnTrip: r.isReturnTrip,
        routeBypass: r.routeBypass,
        vehicle: {
          type: r.driver.vehicleType,
          types: r.driver.vehicleTypes,
          brand: r.driver.vehicleBrand,
          model: r.driver.vehicleModel,
          capacity: r.driver.passengerCapacity
        },
        services: r.driver.services,
        rating: r.driver.rating,
        reviewCount: r.driver.reviewCount,
        isVerified: r.driver.isVerified,
        isTopRated: r.driver.isTopRated,
        isAvailable24h: r.driver.isAvailable24h,
        imageUrl: r.driver.imageUrl,
        description: r.driver.description
      }));

      const elapsed = Date.now() - startTime;
      console.log(`🎯 Búsqueda completada en ${elapsed}ms - ${results.length} resultados`);

      return NextResponse.json({
        success: true,
        data: formattedResults,
        searchMeta: meta,
        tripInfo: tripRoute ? {
          distance: tripRoute.distanceKm,
          duration: tripRoute.durationMin,
          durationFormatted: tripRoute.durationFormatted
        } : null
      }, {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
      });
    }

    // =========================================================================
    // BÚSQUEDA POR CIUDAD/CANTÓN (LEGACY)
    // =========================================================================
    if (cityId || cantonId) {
      let targetLocation: SearchLocation | null = null;

      if (cityId) {
        const city = await db.city.findUnique({
          where: { id: cityId },
          include: { canton: true }
        });
        if (city) {
          targetLocation = {
            lat: city.latitude || 0,
            lon: city.longitude || 0,
            city: city.name,
            postalCode: city.postalCode || '',
            canton: city.canton.name,
            cantonCode: city.canton.code,
            country: city.canton.country || 'CH',
            countryCode: city.canton.country || 'CH',
            displayName: `${city.name}, ${city.canton.name}`
          };
        }
      } else if (cantonId) {
        const canton = await db.canton.findUnique({ where: { id: cantonId } });
        if (canton) {
          targetLocation = {
            lat: 0,
            lon: 0,
            city: '',
            postalCode: '',
            canton: canton.name,
            cantonCode: canton.code,
            country: canton.country || 'CH',
            countryCode: canton.country || 'CH',
            displayName: canton.name
          };
        }
      }

      const allDrivers = await getDriversWithLocation();
      const results: SearchResult[] = [];

      if (targetLocation) {
        for (const driver of allDrivers) {
          // Verificar exclusión
          const allExclusions = driver.driverServiceZones.flatMap(z => z.exclusions || []);
          const exclusionCheck = isLocationInExclusions(
            {
              city: targetLocation.city,
              canton: targetLocation.canton,
              cantonCode: targetLocation.cantonCode,
              displayName: targetLocation.displayName
            },
            allExclusions
          );
          
          if (exclusionCheck.vetoed) {
            console.log(`🚫 ${driver.name}: VETADO - ${exclusionCheck.reason}`);
            continue;
          }

          // Verificar cobertura
          for (const zone of driver.driverServiceZones) {
            const result = checkZoneCoverage(targetLocation, zone);
            if (result.covered) {
              results.push({
                driver,
                priority: PRIORITIES.PARTIAL_MATCH,
                eta: 0,
                distanceToOrigin: 0,
                tripDistance: 0,
                tripDuration: 0,
                estimatedPrice: { min: 0, max: 0 },
                matchReason: result.reason,
                zones: {
                  pickup: driver.driverServiceZones.filter(z => z.zoneMode === 'pickup').map(z => z.zoneName).join(', '),
                  service: driver.driverServiceZones.filter(z => z.zoneMode === 'service').map(z => z.zoneName).join(', ')
                }
              });
              break;
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        data: results.map(r => {
          const { phone, whatsapp, ...driverWithoutContact } = r.driver;
          return {
            ...driverWithoutContact,
            priority: r.priority.level,
            priorityLabel: r.priority.label,
            matchReason: r.matchReason
          };
        }),
        total: results.length
      });
    }

    // =========================================================================
    // BÚSQUEDA POR TEXTO LIBRE (LEGACY)
    // =========================================================================
    if (query && query.trim().length >= 2) {
      const results = await geocodeAddress(query.trim(), { limit: 1 });
      
      if (results.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          total: 0,
          query
        });
      }

      const location: SearchLocation = {
        lat: results[0].lat,
        lon: results[0].lon,
        city: results[0].city,
        postalCode: results[0].postalCode,
        canton: results[0].canton,
        cantonCode: results[0].cantonCode,
        country: results[0].country,
        countryCode: results[0].countryCode,
        displayName: results[0].display_name,
        boundingBox: results[0].boundingBox
      };

      const allDrivers = await getDriversWithLocation();
      const matchResults: SearchResult[] = [];

      for (const driver of allDrivers) {
        // Verificar exclusión
        const allExclusions = driver.driverServiceZones.flatMap(z => z.exclusions || []);
        const exclusionCheck = isLocationInExclusions(
          {
            city: location.city,
            canton: location.canton,
            cantonCode: location.cantonCode,
            displayName: location.displayName
          },
          allExclusions
        );
        
        if (exclusionCheck.vetoed) {
          console.log(`🚫 ${driver.name}: VETADO - ${exclusionCheck.reason}`);
          continue;
        }

        // Verificar cobertura
        for (const zone of driver.driverServiceZones) {
          const result = checkZoneCoverage(location, zone);
          if (result.covered) {
            matchResults.push({
              driver,
              priority: PRIORITIES.PARTIAL_MATCH,
              eta: 0,
              distanceToOrigin: 0,
              tripDistance: 0,
              tripDuration: 0,
              estimatedPrice: { min: 0, max: 0 },
              matchReason: result.reason,
              zones: {
                pickup: driver.driverServiceZones.filter(z => z.zoneMode === 'pickup').map(z => z.zoneName).join(', '),
                service: driver.driverServiceZones.filter(z => z.zoneMode === 'service').map(z => z.zoneName).join(', ')
              }
            });
            break;
          }
        }
      }

      return NextResponse.json({
        success: true,
        data: matchResults.map(r => {
          const { phone, whatsapp, ...driverWithoutContact } = r.driver;
          return {
            ...driverWithoutContact,
            priority: r.priority.level,
            priorityLabel: r.priority.label,
            matchReason: r.matchReason
          };
        }),
        total: matchResults.length,
        query,
        resolvedLocation: location.displayName
      });
    }

    // =========================================================================
    // SIN PARÁMETROS: RETORNAR TODOS LOS CONDUCTORES
    // =========================================================================
    const allDrivers = await getDriversWithLocation();
    // 🔒 Ocultar phone y whatsapp de la respuesta (nDSG)
    const sanitizedDrivers = allDrivers.map(d => {
      const { phone, whatsapp, ...driverWithoutContact } = d;
      return driverWithoutContact;
    });
    return NextResponse.json({
      success: true,
      data: sanitizedDrivers,
      total: sanitizedDrivers.length
    });

  } catch (error) {
    console.error('❌ Error en búsqueda:', error);
    return NextResponse.json(
      { success: false, error: 'Error en la búsqueda' },
      { status: 500 }
    );
  }
}
