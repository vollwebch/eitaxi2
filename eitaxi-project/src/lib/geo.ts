/**
 * Utilidades de geolocalización para EiTaxi
 * 
 * Este archivo mantiene compatibilidad con código existente
 * y re-exporta las funciones del nuevo sistema OSM.
 * 
 * Para nuevas funcionalidades, usar directamente:
 * import { geocodeAddress, calculateRoute } from '@/lib/geo-osm'
 */

// Re-exportar todo del nuevo módulo OSM
export {
  // Geocodificación
  geocodeAddress,
  reverseGeocode,
  
  // Rutas
  calculateRoute,
  calculateDistanceMatrix,
  
  // Zonas
  getBoundary,
  isPointInZone,
  isPointInPolygon,
  isLocationCoveredByZones,
  
  // Tipos
  type NominatimAddress,
  type NominatimResult,
  type GeocodedLocation,
  type OSRMRoute,
  type RouteInfo,
  type OSMBoundary,
  type DriverZone,
  
  // Utilidades
  calculateStraightLineDistance
} from './geo-osm';

// =========================================================================
// FUNCIONES LEGACY (compatibilidad con código existente)
// =========================================================================

import { calculateStraightLineDistance } from './geo-osm';

/**
 * @deprecated Usar calculateRoute de geo-osm para distancias reales por carretera
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  return calculateStraightLineDistance(lat1, lng1, lat2, lng2);
}

/**
 * Coordenadas aproximadas de ciudades principales
 * @deprecated Usar geocodeAddress para obtener coordenadas precisas
 */
export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Suiza
  'Zürich': { lat: 47.3769, lng: 8.5417 },
  'Bern': { lat: 46.9480, lng: 7.4474 },
  'Genève': { lat: 46.2044, lng: 6.1432 },
  'Geneva': { lat: 46.2044, lng: 6.1432 },
  'Basel': { lat: 47.5596, lng: 7.5886 },
  'Lausanne': { lat: 46.5197, lng: 6.6323 },
  'Luzern': { lat: 47.0502, lng: 8.3093 },
  'St. Gallen': { lat: 47.4245, lng: 9.3767 },
  'Lugano': { lat: 46.0037, lng: 8.9511 },
  'Winterthur': { lat: 47.4995, lng: 8.7266 },
  
  // Liechtenstein
  'Vaduz': { lat: 47.1410, lng: 9.5215 },
  'Schaan': { lat: 47.1652, lng: 9.5087 },
  'Balzers': { lat: 47.0678, lng: 9.5039 },
  'Triesen': { lat: 47.1150, lng: 9.5294 },
  
  // St. Gallen / Werdenberg
  'Buchs': { lat: 47.4667, lng: 9.4833 },
};

/**
 * Centro aproximado de cantones
 * @deprecated Usar getBoundary para obtener límites precisos
 */
export const CANTON_CENTERS: Record<string, { lat: number; lng: number; avgRadius: number }> = {
  'ZH': { lat: 47.3769, lng: 8.5417, avgRadius: 30 },
  'BE': { lat: 46.9480, lng: 7.4474, avgRadius: 60 },
  'LU': { lat: 47.0502, lng: 8.3093, avgRadius: 25 },
  'SG': { lat: 47.4245, lng: 9.3767, avgRadius: 30 },
  'LI': { lat: 47.1500, lng: 9.5200, avgRadius: 8 },
};

/**
 * Mapeo ciudad → cantón
 * @deprecated Usar geocodeAddress para obtener cantón preciso
 */
export const CITY_TO_CANTON: Record<string, string> = {
  'Zürich': 'ZH', 'Winterthur': 'ZH',
  'Bern': 'BE',
  'Genève': 'GE', 'Geneva': 'GE',
  'Basel': 'BS',
  'Lausanne': 'VD',
  'Luzern': 'LU',
  'St. Gallen': 'SG',
  'Lugano': 'TI',
  'Vaduz': 'LI', 'Schaan': 'LI', 'Balzers': 'LI', 'Triesen': 'LI',
  'Buchs': 'SG',
};

/**
 * @deprecated Usar geocodeAddress
 */
export function getCityCoordinates(cityName: string, cantonCode?: string): { lat: number; lng: number } | null {
  return CITY_COORDINATES[cityName] || null;
}

/**
 * @deprecated Usar geocodeAddress
 */
export function findNearestCity(lat: number, lng: number): { city: string; cantonCode: string } | null {
  let nearest: string | null = null;
  let minDist = Infinity;
  
  for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
    const dist = calculateStraightLineDistance(lat, lng, coords.lat, coords.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = city;
    }
  }
  
  if (nearest && minDist < 100) {
    return { city: nearest, cantonCode: CITY_TO_CANTON[nearest] || '' };
  }
  return null;
}

/**
 * @deprecated Usar geocodeAddress
 */
export function getCantonFromCoords(lat: number, lng: number): string {
  const nearest = findNearestCity(lat, lng);
  return nearest?.cantonCode || '';
}

/**
 * @deprecated Usar getBoundary
 */
export function extractCantonCode(zoneName: string): string | null {
  const cantonCodes = ['ZH', 'BE', 'LU', 'UR', 'SZ', 'OW', 'NW', 'GL', 'ZG', 'FR', 'SO', 'BS', 'BL', 'SH', 'AR', 'AI', 'SG', 'GR', 'AG', 'TG', 'TI', 'VD', 'VS', 'NE', 'GE', 'JU', 'LI'];
  
  for (const code of cantonCodes) {
    if (zoneName.toUpperCase().includes(code)) {
      return code;
    }
  }
  return null;
}

/**
 * @deprecated Usar calculateRoute de geo-osm
 */
export function estimateTripPrice(
  distanceKm: number,
  basePrice: number = 5.0,
  pricePerKm: number = 2.50
): { minPrice: number; maxPrice: number; breakdown: string } {
  const calculated = basePrice + (distanceKm * pricePerKm);
  return {
    minPrice: Math.round(calculated),
    maxPrice: Math.round(calculated * 1.15),
    breakdown: `Base: CHF ${basePrice.toFixed(2)} + ${distanceKm.toFixed(1)} km × CHF ${pricePerKm.toFixed(2)}/km`
  };
}

/**
 * @deprecated Usar isLocationCoveredByZones
 */
export function driverCoversLocation(
  driver: {
    city: { name: string };
    canton: { code: string; country: string };
    operationRadius?: number | null;
    coverageType?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  },
  targetCity: string,
  targetCantonCode: string,
  targetCountry: string,
  serviceZones?: any[],
  mode?: 'pickup' | 'service'
): { covers: boolean; distance?: number; reason: string } {
  // Fallback simplificado
  if (serviceZones && serviceZones.length > 0) {
    for (const zone of serviceZones) {
      if (zone.zoneName?.toLowerCase().includes(targetCity.toLowerCase())) {
        return { covers: true, reason: `Zona: ${zone.zoneName}` };
      }
      if (zone.zoneName?.toUpperCase().includes(targetCantonCode)) {
        return { covers: true, reason: `Cantón: ${zone.zoneName}` };
      }
    }
    return { covers: false, reason: 'Fuera de zona de servicio' };
  }
  
  // Sin zonas, verificar por distancia
  if (driver.latitude && driver.longitude) {
    const targetCoords = CITY_COORDINATES[targetCity];
    if (targetCoords) {
      const dist = calculateStraightLineDistance(
        driver.latitude, driver.longitude,
        targetCoords.lat, targetCoords.lng
      );
      const radius = driver.operationRadius || 15;
      if (dist <= radius) {
        return { covers: true, distance: dist, reason: `A ${dist.toFixed(1)} km` };
      }
    }
  }
  
  return { covers: false, reason: 'Fuera de área' };
}

// =========================================================================
// EXPORTS ADICIONALES PARA COMPATIBILIDAD
// =========================================================================

// Tipos legacy
export interface HybridMatchResult {
  matches: boolean;
  block?: 'A' | 'B' | 'BOTH';
  reason: string;
  priority: number;
  distanceToOrigin?: number;
  marker?: string;
}

export interface DriverForMatching {
  id: string;
  name: string;
  city: { name: string };
  canton: { code: string; country: string };
  latitude?: number | null;
  longitude?: number | null;
  operationRadius?: number | null;
  coverageType?: string | null;
  isActive: boolean;
  trackingEnabled?: boolean;
  lastLocationAt?: Date | string | null;
  currentLocation?: { lat: number; lon: number } | null;
  driverServiceZones: any[];
  driverRoutes?: any[];
}

export interface SearchLocation {
  name: string;
  cantonCode?: string;
  country?: string;
  postalCode?: string;
  lat?: number;
  lon?: number;
}

/**
 * @deprecated Usar la nueva API de búsqueda que implementa la lógica híbrida
 */
export function hybridDriverMatch(
  origin: SearchLocation,
  destination: SearchLocation,
  driver: DriverForMatching,
  gpsRadiusKm: number = 5
): HybridMatchResult {
  // Esta función ya no se usa, mantener solo para compatibilidad
  return { matches: false, reason: 'Usar nueva API de búsqueda', priority: 0 };
}
