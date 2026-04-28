/**
 * =========================================================================
 * SERVICIOS DE GEOLOCALIZACIÓN - OSM/Nominatim/OSRM
 * =========================================================================
 * 
 * Sistema profesional de geolocalización usando APIs oficiales:
 * - Nominatim (OSM): Geocodificación de direcciones
 * - OSRM: Cálculo de rutas y distancias reales por carretera
 * - Overpass API: Límites geográficos (polígonos) de cantones/municipios
 * 
 * Sin parches manuales, sin regex para ubicaciones.
 * Universal para toda Europa.
 * =========================================================================
 */

// =========================================================================
// TIPOS
// =========================================================================

export interface NominatimAddress {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
}

export interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: NominatimAddress;
  boundingbox?: [string, string, string, string]; // [south, north, west, east]
  type?: string;
  class?: string;
  importance?: number;
}

export interface GeocodedLocation {
  lat: number;
  lon: number;
  display_name: string;
  city: string;
  postalCode: string;
  canton: string;        // state/county
  cantonCode: string;    // código corto (ZH, SG, LI, etc.)
  country: string;
  countryCode: string;
  boundingBox?: {
    south: number;
    north: number;
    west: number;
    east: number;
  };
  type: 'city' | 'town' | 'village' | 'address' | 'postcode' | 'state' | 'other';
  osmId?: number;
  osmType?: string;
}

export interface OSRMRoute {
  distance: number;      // metros
  duration: number;      // segundos
  geometry: string;      // polyline encoded
  legs: Array<{
    distance: number;
    duration: number;
    steps: any[];
  }>;
}

export interface RouteInfo {
  distanceKm: number;
  durationMin: number;
  durationFormatted: string;
  geometry?: string;
}

export interface OSMBoundary {
  osm_id: number;
  name: string;
  admin_level: number;   // 4=cantón, 6=districto, 8=municipio
  boundary_type: string;
  geometry: {
    type: string;
    coordinates: any;
  };
  bbox?: [number, number, number, number]; // [west, south, east, north]
}

// =========================================================================
// CONFIGURACIÓN
// =========================================================================

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const OSRM_BASE_URL = 'https://router.project-osrm.org';
const OVERPASS_BASE_URL = 'https://overpass-api.de/api/interpreter';

// Cache para reducir llamadas a API
const geocodeCache = new Map<string, { data: GeocodedLocation | null; timestamp: number }>();
const routeCache = new Map<string, { data: RouteInfo | null; timestamp: number }>();
const boundaryCache = new Map<string, { data: OSMBoundary | null; timestamp: number }>();

const CACHE_TTL = 1000 * 60 * 60; // 1 hora
const REQUEST_TIMEOUT = 10000; // 10 segundos

// User-Agent requerido por Nominatim
const HEADERS = {
  'User-Agent': 'EiTaxi/1.0 (contact@eitaxi.ch)',
  'Accept': 'application/json',
  'Accept-Language': 'de,en'
};

// =========================================================================
// FUNCIONES AUXILIARES
// =========================================================================

/**
 * Normalizar texto para comparación (mantener acentos originales para API)
 */
function normalizeForAPI(text: string): string {
  return text.trim();
}

/**
 * Generar clave de cache
 */
function cacheKey(...parts: string[]): string {
  return parts.join('|').toLowerCase();
}

/**
 * Fetch con timeout y retry
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// =========================================================================
// GEOCODIFICACIÓN - NOMINATIM
// =========================================================================

/**
 * Geocodificar una dirección usando Nominatim
 * Convierte texto de dirección en coordenadas y datos estructurados
 */
export async function geocodeAddress(
  searchText: string,
  options: {
    countrycodes?: string;  // Ej: 'ch,li' para Suiza y Liechtenstein
    limit?: number;
    addressdetails?: number;
  } = {}
): Promise<GeocodedLocation[]> {
  const {
    countrycodes = 'ch,li,de,at,fr,it',
    limit = 5,
    addressdetails = 1
  } = options;

  // Verificar cache
  const key = cacheKey('geocode', searchText, countrycodes);
  const cached = geocodeCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data ? [cached.data] : [];
  }

  try {
    const params = new URLSearchParams({
      q: normalizeForAPI(searchText),
      format: 'json',
      addressdetails: addressdetails.toString(),
      limit: limit.toString(),
      countrycodes,
      'accept-language': 'en'
    });

    const url = `${NOMINATIM_BASE_URL}/search?${params}`;
    const response = await fetchWithTimeout(url, { headers: HEADERS });

    if (!response.ok) {
      console.error(`Nominatim error: ${response.status}`);
      return [];
    }

    const results: NominatimResult[] = await response.json();
    
    const geocoded: GeocodedLocation[] = results.map(result => {
      const addr = result.address || {};
      
      // Determinar tipo de ubicación
      let type: GeocodedLocation['type'] = 'other';
      if (result.type === 'city' || result.type === 'town') type = 'city';
      else if (result.type === 'village' || result.type === 'hamlet') type = 'village';
      else if (result.type === 'house' || result.type === 'building') type = 'address';
      else if (result.class === 'place' && result.type === 'postcode') type = 'postcode';
      else if (result.type === 'administrative' && result.class === 'boundary') type = 'state';

      // Extraer ciudad (puede venir como city, town, village o municipality)
      const city = addr.city || addr.town || addr.village || addr.municipality || '';
      
      // Extraer código de cantón del estado
      const canton = addr.state || addr.county || '';
      let cantonCode = '';
      if (canton) {
        cantonCode = extractCantonCode(canton, addr.country_code || '');
      }
      
      // Fallback: derivar cantón del código postal si no se pudo determinar
      const postcode = addr.postcode || '';
      if (!cantonCode && postcode && addr.country_code?.toUpperCase() === 'CH') {
        cantonCode = cantonFromPostalCode(postcode);
      }

      // Bounding box
      let boundingBox: GeocodedLocation['boundingBox'] | undefined;
      if (result.boundingbox && result.boundingbox.length === 4) {
        boundingBox = {
          south: parseFloat(result.boundingbox[0]),
          north: parseFloat(result.boundingbox[1]),
          west: parseFloat(result.boundingbox[2]),
          east: parseFloat(result.boundingbox[3])
        };
      }

      return {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        display_name: result.display_name,
        city,
        postalCode: postcode,
        canton,
        cantonCode,
        country: addr.country || '',
        countryCode: addr.country_code?.toUpperCase() || '',
        boundingBox,
        type,
        osmId: result.osm_id,
        osmType: result.osm_type
      };
    });

    // Guardar en cache (solo el primer resultado)
    if (geocoded.length > 0) {
      geocodeCache.set(key, { data: geocoded[0], timestamp: Date.now() });
    } else {
      geocodeCache.set(key, { data: null, timestamp: Date.now() });
    }

    return geocoded;
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
}

/**
 * Geocodificación inversa: coordenadas → dirección
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<GeocodedLocation | null> {
  // Verificar cache
  const key = cacheKey('reverse', lat.toString(), lon.toString());
  const cached = geocodeCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      format: 'json',
      addressdetails: '1',
      'accept-language': 'en'
    });

    const url = `${NOMINATIM_BASE_URL}/reverse?${params}`;
    const response = await fetchWithTimeout(url, { headers: HEADERS });

    if (!response.ok) {
      return null;
    }

    const result: NominatimResult = await response.json();
    
    if (!result) {
      return null;
    }

    const addr = result.address || {};
    
    const stateName = addr.state || addr.county || '';
    const postcode = addr.postcode || '';
    let cantonCode = extractCantonCode(stateName, addr.country_code || '');
    
    // Fallback: derivar cantón del código postal si no se pudo determinar por nombre
    if (!cantonCode && postcode && addr.country_code?.toUpperCase() === 'CH') {
      cantonCode = cantonFromPostalCode(postcode);
    }
    
    const location: GeocodedLocation = {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      display_name: result.display_name,
      city: addr.city || addr.town || addr.village || addr.municipality || '',
      postalCode: postcode,
      canton: stateName,
      cantonCode,
      country: addr.country || '',
      countryCode: addr.country_code?.toUpperCase() || '',
      type: 'address'
    };

    // Guardar en cache
    geocodeCache.set(key, { data: location, timestamp: Date.now() });

    return location;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Extraer código de cantón del nombre del estado
 */
function extractCantonCode(stateName: string, countryCode: string): string {
  // Liechtenstein
  if (countryCode.toLowerCase() === 'li') {
    return 'LI';
  }

  // Mapeo de nombres de cantones suizos a códigos
  const cantonMap: Record<string, string> = {
    'zürich': 'ZH',
    'zurich': 'ZH',
    'bern': 'BE',
    'berne': 'BE',
    'luzern': 'LU',
    'lucerne': 'LU',
    'uri': 'UR',
    'schwyz': 'SZ',
    'obwalden': 'OW',
    'nidwalden': 'NW',
    'glarus': 'GL',
    'zug': 'ZG',
    'fribourg': 'FR',
    'freiburg': 'FR',
    'solothurn': 'SO',
    'basel-stadt': 'BS',
    'basel landschaft': 'BL',
    'basel-landschaft': 'BL',
    'schaffhausen': 'SH',
    'appenzell ausserrhoden': 'AR',
    'appenzell innerrhoden': 'AI',
    'st. gallen': 'SG',
    'sankt gallen': 'SG',
    'graubünden': 'GR',
    'graubunden': 'GR',
    'grigioni': 'GR',
    'grisons': 'GR',
    'aargau': 'AG',
    'argovia': 'AG',
    'thurgau': 'TG',
    'turgovia': 'TG',
    'ticino': 'TI',
    'tesin': 'TI',
    'tessin': 'TI',
    'vaud': 'VD',
    'waadt': 'VD',
    'valais': 'VS',
    'wallis': 'VS',
    'vallese': 'VS',
    'neuchâtel': 'NE',
    'neuchatel': 'NE',
    'neuenburg': 'NE',
    'genf': 'GE',
    'genève': 'GE',
    'geneva': 'GE',
    'ginebra': 'GE',
    'ginevra': 'GE',
    'jura': 'JU',
    // Nombres en español/italiano que Nominatim puede devolver
    'san galo': 'SG',
    'saint-gallen': 'SG',
    'sant gallen': 'SG',
    'argovia': 'AG',
    'soleura': 'SO',
    'bâle-ville': 'BS',
    'bâle-campagne': 'BL',
    'tifernas': 'GR',
    'bellinzona': 'TI',
    'cantón de zurich': 'ZH',
    'cantón de zúrich': 'ZH',
    'cantón de bern': 'BE',
    'cantón de ginebra': 'GE',
    'cantón de lucerna': 'LU',
    'cantón de st. gallen': 'SG',
    'cantón de san galo': 'SG',
    'cantón de aargau': 'AG',
    'canton de zurich': 'ZH',
    'canton zurich': 'ZH',
    'canton de zúrich': 'ZH',
    'canton zürich': 'ZH',
    'kanton zürich': 'ZH',
    'canton de bern': 'BE',
    'canton bern': 'BE',
    'kanton bern': 'BE',
    'canton de ginebra': 'GE',
    'canton ginebra': 'GE',
    'canton de genève': 'GE',
    'canton geneva': 'GE',
    'canton de st. gallen': 'SG',
    'canton st. gallen': 'SG',
    'canton de san galo': 'SG',
    'canton san galo': 'SG',
    'kanton st. gallen': 'SG',
    'canton ticino': 'TI',
    'canton de ticino': 'TI',
    'canton de basel': 'BS',
    'kanton basel-stadt': 'BS',
    'kanton aargau': 'AG',
    'canton de aargau': 'AG'
  };

  const normalized = stateName.toLowerCase().trim();
  const mapped = cantonMap[normalized];
  if (mapped) return mapped;
  
  // Fallback: extraer código del nombre si termina en 2 letras mayúsculas
  const codeMatch = stateName.match(/\b([A-Z]{2})\b$/);
  if (codeMatch) return codeMatch[1];
  
  return '';
}

/**
 * Derivar código de cantón suizo a partir del código postal
 * Los 2 primeros dígitos del código postal suizo identifican la región/cantón
 */
function cantonFromPostalCode(postalCode: string): string {
  const prefix = postalCode.substring(0, 2);
  
  const postalToCanton: Record<string, string> = {
    // Zürich (ZH)
    '80': 'ZH', '81': 'ZH', '82': 'ZH', '83': 'ZH', '84': 'ZH', '85': 'ZH', '86': 'ZH', '87': 'ZH', '88': 'ZH', '89': 'ZH',
    // Bern (BE)
    '30': 'BE', '31': 'BE', '32': 'BE', '33': 'BE', '34': 'BE', '35': 'BE', '36': 'BE', '37': 'BE', '38': 'BE', '39': 'BE',
    // Luzern (LU)
    '60': 'LU', '61': 'LU', '62': 'LU', '63': 'LU', '64': 'LU',
    // Uri (UR)
    '64': 'UR',
    // Schwyz (SZ)
    '63': 'SZ', '64': 'SZ', '88': 'SZ',
    // Obwalden (OW)
    '60': 'OW',
    // Nidwalden (NW)
    '63': 'NW',
    // Glarus (GL)
    '87': 'GL', '88': 'GL',
    // Zug (ZG)
    '63': 'ZG',
    // Fribourg (FR)
    '17': 'FR', '16': 'FR', '18': 'FR',
    // Solothurn (SO)
    '45': 'SO', '46': 'SO', '47': 'SO',
    // Basel-Stadt (BS)
    '40': 'BS',
    // Basel-Landschaft (BL)
    '44': 'BL', '41': 'BL', '42': 'BL', '43': 'BL',
    // Schaffhausen (SH)
    '82': 'SH',
    // Appenzell AR (AR)
    '90': 'AR', '91': 'AR',
    // Appenzell IR (AI)
    '91': 'AI', '90': 'AI',
    // St. Gallen (SG)
    '73': 'SG', '82': 'SG', '83': 'SG', '84': 'SG', '88': 'SG', '90': 'SG', '91': 'SG', '93': 'SG', '94': 'SG', '95': 'SG', '96': 'SG',
    // Graubünden (GR)
    '70': 'GR', '71': 'GR', '72': 'GR', '73': 'GR', '74': 'GR', '75': 'GR', '76': 'GR', '77': 'GR', '78': 'GR', '79': 'GR',
    // Aargau (AG)
    '50': 'AG', '51': 'AG', '52': 'AG', '53': 'AG', '54': 'AG', '55': 'AG', '56': 'AG',
    // Thurgau (TG)
    '82': 'TG', '83': 'TG', '84': 'TG', '85': 'TG', '86': 'TG', '87': 'TG',
    // Ticino (TI)
    '65': 'TI', '66': 'TI', '67': 'TI', '68': 'TI', '69': 'TI',
    // Vaud (VD)
    '10': 'VD', '11': 'VD', '12': 'VD', '13': 'VD', '14': 'VD', '15': 'VD', '16': 'VD',
    // Valais (VS)
    '19': 'VS', '39': 'VS',
    // Neuchâtel (NE)
    '20': 'NE', '21': 'NE',
    // Genève (GE)
    '12': 'GE',
    // Jura (JU)
    '28': 'JU',
  };
  
  return postalToCanton[prefix] || '';
}

// =========================================================================
// CÁLCULO DE RUTAS - OSRM
// =========================================================================

/**
 * Calcular ruta real por carretera usando OSRM
 * Retorna distancia y tiempo estimado
 */
export async function calculateRoute(
  originLat: number,
  originLon: number,
  destLat: number,
  destLon: number,
  profile: 'car' | 'bike' | 'foot' = 'car'
): Promise<RouteInfo | null> {
  // Verificar cache
  const key = cacheKey('route', originLat.toString(), originLon.toString(), destLat.toString(), destLon.toString());
  const cached = routeCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // OSRM formato: /route/v1/{profile}/{lon},{lat};{lon},{lat}
    const url = `${OSRM_BASE_URL}/route/v1/${profile}/${originLon},${originLat};${destLon},${destLat}?overview=full&geometries=polyline`;

    const response = await fetchWithTimeout(url, {}, 15000);

    if (!response.ok) {
      console.error(`OSRM error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return null;
    }

    const route: OSRMRoute = data.routes[0];
    
    const distanceKm = route.distance / 1000;
    const durationMin = route.duration / 60;
    
    // Formatear duración
    const hours = Math.floor(durationMin / 60);
    const minutes = Math.round(durationMin % 60);
    const durationFormatted = hours > 0 
      ? `${hours}h ${minutes}min`
      : `${minutes} min`;

    const result: RouteInfo = {
      distanceKm: Math.round(distanceKm * 10) / 10, // 1 decimal
      durationMin: Math.round(durationMin),
      durationFormatted,
      geometry: route.geometry
    };

    // Guardar en cache
    routeCache.set(key, { data: result, timestamp: Date.now() });

    return result;
  } catch (error) {
    console.error('OSRM route error:', error);
    return null;
  }
}

/**
 * Calcular tabla de distancias (matriz) para múltiples puntos
 * Útil para calcular distancia de múltiples conductores a un punto
 */
export async function calculateDistanceMatrix(
  sources: Array<{ lat: number; lon: number }>,
  destinations: Array<{ lat: number; lon: number }>,
  profile: 'car' | 'bike' | 'foot' = 'car'
): Promise<Array<Array<{ distance: number; duration: number }>> | null> {
  try {
    // Construir coordenadas
    const coords = [...sources, ...destinations].map(p => `${p.lon},${p.lat}`).join(';');
    
    // Índices de fuentes y destinos
    const sourcesIdx = sources.map((_, i) => i).join(';');
    const destinationsIdx = destinations.map((_, i) => i + sources.length).join(';');

    const url = `${OSRM_BASE_URL}/table/v1/${profile}/${coords}?sources=${sourcesIdx}&destinations=${destinationsIdx}&annotations=duration,distance`;

    const response = await fetchWithTimeout(url, {}, 20000);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.distances || !data.durations) {
      return null;
    }

    // Combinar distancias y duraciones
    const result: Array<Array<{ distance: number; duration: number }>> = [];
    for (let i = 0; i < sources.length; i++) {
      result[i] = [];
      for (let j = 0; j < destinations.length; j++) {
        result[i][j] = {
          distance: data.distances[i][j], // metros
          duration: data.durations[i][j]  // segundos
        };
      }
    }

    return result;
  } catch (error) {
    console.error('OSRM table error:', error);
    return null;
  }
}

// =========================================================================
// LÍMITES GEOGRÁFICOS - OVERPASS API
// =========================================================================

/**
 * Obtener límites geográficos (bounding box/polígono) de un cantón o municipio
 * Usa Overpass API para consultar OSM
 */
export async function getBoundary(
  name: string,
  adminLevel: number = 4, // 4=cantón, 6=districto, 8=municipio
  countryCode: string = 'CH'
): Promise<OSMBoundary | null> {
  // Verificar cache
  const key = cacheKey('boundary', name, adminLevel.toString(), countryCode);
  const cached = boundaryCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL * 24) { // 24 horas para boundaries
    return cached.data;
  }

  try {
    // Query Overpass para obtener límites administrativos
    const query = `
      [out:json][timeout:25];
      area["ISO3166-1"="${countryCode}"]->.searchArea;
      relation["admin_level"="${adminLevel}"]["name"~"${name}",i](area.searchArea);
      out body;
      >;
      out skel qt;
    `;

    const response = await fetchWithTimeout(OVERPASS_BASE_URL, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }, 20000);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data.elements || data.elements.length === 0) {
      return null;
    }

    // Encontrar la relación (boundary)
    const relation = data.elements.find((e: any) => e.type === 'relation');
    if (!relation) {
      return null;
    }

    // Extraer bounding box de los nodos
    const nodes = data.elements.filter((e: any) => e.type === 'node');
    if (nodes.length === 0) {
      return null;
    }

    const lats = nodes.map((n: any) => n.lat);
    const lons = nodes.map((n: any) => n.lon);

    const boundary: OSMBoundary = {
      osm_id: relation.id,
      name: relation.tags?.name || name,
      admin_level: adminLevel,
      boundary_type: relation.tags?.boundary || 'administrative',
      geometry: {
        type: 'Polygon',
        coordinates: [] // Se necesitaría más procesamiento para el polígono completo
      },
      bbox: [
        Math.min(...lons),
        Math.min(...lats),
        Math.max(...lons),
        Math.max(...lats)
      ]
    };

    // Guardar en cache
    boundaryCache.set(key, { data: boundary, timestamp: Date.now() });

    return boundary;
  } catch (error) {
    console.error('Overpass boundary error:', error);
    return null;
  }
}

/**
 * Verificar si un punto está dentro de una zona (por bounding box o polígono)
 */
export function isPointInZone(
  lat: number,
  lon: number,
  zone: {
    bbox?: [number, number, number, number]; // [west, south, east, north]
    boundingBox?: { south: number; north: number; west: number; east: number };
  }
): boolean {
  // Usar bounding box
  if (zone.bbox) {
    const [west, south, east, north] = zone.bbox;
    return lat >= south && lat <= north && lon >= west && lon <= east;
  }

  if (zone.boundingBox) {
    const { south, north, west, east } = zone.boundingBox;
    return lat >= south && lat <= north && lon >= west && lon <= east;
  }

  return false;
}

/**
 * Verificar si un punto está dentro de un polígono (ray casting algorithm)
 */
export function isPointInPolygon(
  lat: number,
  lon: number,
  polygon: Array<[number, number]> // Array de [lon, lat]
): boolean {
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}

// =========================================================================
// MATCHING DE ZONAS
// =========================================================================

export interface DriverZone {
  zoneName: string;
  zoneType: 'country' | 'canton' | 'district' | 'municipality' | 'city' | 'custom';
  zoneMode: 'pickup' | 'service';
  exclusions?: string[];  // Nombres de lugares excluidos
  boundingBox?: {
    south: number;
    north: number;
    west: number;
    east: number;
  };
  center?: {
    lat: number;
    lon: number;
  };
  osmId?: number;
}

/**
 * Normalizar nombre para comparación
 */
function normalizeName(name: string): string {
  return name.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Remove accents
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Verificar si una ubicación está en la lista de exclusiones
 * La exclusión tiene PRIORIDAD ABSOLUTA - si coincide, el conductor es vetado
 */
export function isLocationInExclusions(
  location: {
    city?: string;
    canton?: string;
    cantonCode?: string;
    postalCode?: string;
    displayName?: string;
  },
  exclusions: string[]
): { vetoed: boolean; reason: string } {
  if (!exclusions || exclusions.length === 0) {
    return { vetoed: false, reason: '' };
  }

  // Normalizar datos de la ubicación
  const locationParts = [
    location.city,
    location.canton,
    location.cantonCode,
    location.postalCode,
    location.displayName
  ].filter(Boolean).map(s => normalizeName(s!));

  const fullLocationText = locationParts.join(' ');

  // Extraer el nombre de ciudad de la ubicación
  const cityNorm = location.city ? normalizeName(location.city) : '';
  
  // Extraer palabras significativas de la ubicación (ignorar abreviaturas de cantones)
  const cantonAbbrs = ['sg', 'zh', 'be', 'lu', 'ur', 'sz', 'ow', 'nw', 'gl', 'zg', 'fr', 'so', 'bs', 'bl', 'sh', 'ar', 'ai', 'gr', 'ag', 'tg', 'ti', 'vd', 'vs', 'ne', 'ge', 'ju', 'li'];
  
  const locationWords = new Set(
    fullLocationText.split(/\s+/)
      .map(w => w.replace(/[()]/g, '')) // Quitar paréntesis
      .filter(w => w.length > 2 && !cantonAbbrs.includes(w)) // Ignorar abreviaturas de cantones
  );

  for (const exclusion of exclusions) {
    const exclNorm = normalizeName(exclusion);
    
    // Extraer palabras de la exclusión (ignorando abreviaturas de cantones)
    const exclWords = exclNorm.split(/\s+/)
      .map(w => w.replace(/[()]/g, ''))
      .filter(w => w.length > 2 && !cantonAbbrs.includes(w));
    
    // La palabra principal es el nombre del lugar (primera palabra que no sea abreviatura)
    const mainExclWord = exclWords[0];

    // 1. Si la exclusión tiene una palabra principal, verificar si coincide con la ciudad
    if (mainExclWord && cityNorm) {
      // Coincidencia exacta o contenida con el nombre de la ciudad
      if (cityNorm === mainExclWord || cityNorm.includes(mainExclWord)) {
        return {
          vetoed: true,
          reason: `Ubicación excluida: ${exclusion}`
        };
      }
    }

    // 2. Verificar si la palabra principal está en las palabras de la ubicación
    if (mainExclWord && locationWords.has(mainExclWord)) {
      return {
        vetoed: true,
        reason: `Ubicación excluida: ${exclusion}`
      };
    }

    // 3. Coincidencia exacta del texto completo de la exclusión
    if (fullLocationText.includes(exclNorm)) {
      return {
        vetoed: true,
        reason: `Ubicación excluida: ${exclusion}`
      };
    }
    
    // 4. Para exclusiones como "Gams SG", verificar que el nombre del lugar coincida
    // Ejemplo: "Gams" debe estar presente, no solo "SG"
    if (exclWords.length > 0) {
      const firstWord = exclWords[0];
      // Verificar si la primera palabra significativa está presente
      if (firstWord && fullLocationText.includes(firstWord)) {
        // Verificar que no sea solo una coincidencia parcial de palabra
        const cityMatch = cityNorm.includes(firstWord);
        const wordsMatch = locationWords.has(firstWord);
        
        if (cityMatch || wordsMatch) {
          return {
            vetoed: true,
            reason: `Ubicación excluida: ${exclusion}`
          };
        }
      }
    }
  }

  return { vetoed: false, reason: '' };
}

/**
 * Verificar si una ubicación está cubierta por las zonas de un conductor
 */
export async function isLocationCoveredByZones(
  location: {
    lat: number;
    lon: number;
    countryCode?: string;
    country?: string;
    cantonCode?: string;
    canton?: string;
    postalCode?: string;
    city?: string;
  },
  driverZones: DriverZone[]
): Promise<{ covered: boolean; zoneName: string; reason: string }> {
  const { lat, lon, countryCode, country, cantonCode, canton, postalCode, city } = location;
  
  // Normalizar código de país
  const normalizedCountryCode = countryCode || (country === 'Liechtenstein' ? 'LI' : 'CH') || 'CH';

  console.log(`    📍 Verificando punto (${lat.toFixed(4)}, ${lon.toFixed(4)}) contra ${driverZones.length} zonas`);

  for (const zone of driverZones) {
    console.log(`      Zona: ${zone.zoneName} (${zone.zoneType}, ${zone.zoneMode}), bbox: ${zone.boundingBox ? 'Sí' : 'No'}`);
    
    // Si la zona tiene bounding box, verificar si el punto está dentro
    if (zone.boundingBox) {
      const { south, north, west, east } = zone.boundingBox;
      const inZone = lat >= south && lat <= north && lon >= west && lon <= east;
      console.log(`      BBox: [${south}, ${north}, ${west}, ${east}] - Punto en zona: ${inZone}`);
      
      if (inZone) {
        return {
          covered: true,
          zoneName: zone.zoneName,
          reason: `Dentro de zona: ${zone.zoneName}`
        };
      }
    }

    // Verificar por tipo de zona
    const zoneNameLower = zone.zoneName.toLowerCase();
    
    switch (zone.zoneType) {
      case 'country':
        // Cobertura de país entero
        if (zoneNameLower === 'liechtenstein' && normalizedCountryCode === 'LI') {
          return { covered: true, zoneName: zone.zoneName, reason: `País: Liechtenstein` };
        }
        if (zoneNameLower === 'suiza' && normalizedCountryCode === 'CH') {
          return { covered: true, zoneName: zone.zoneName, reason: `País: Suiza` };
        }
        break;

      case 'canton':
        // Cobertura de cantón - verificar por código o nombre
        if (cantonCode && zoneNameLower.includes(cantonCode.toLowerCase())) {
          return { covered: true, zoneName: zone.zoneName, reason: `Cantón: ${zone.zoneName}` };
        }
        if (canton && zoneNameLower.includes(canton.toLowerCase())) {
          return { covered: true, zoneName: zone.zoneName, reason: `Cantón: ${zone.zoneName}` };
        }
        // Verificar por bounding box del cantón si existe
        if (zone.boundingBox) {
          const { south, north, west, east } = zone.boundingBox;
          if (lat >= south && lat <= north && lon >= west && lon <= east) {
            return { covered: true, zoneName: zone.zoneName, reason: `Cantón: ${zone.zoneName}` };
          }
        }
        break;

      case 'district':
      case 'municipality':
      case 'city':
        // Verificar por bounding box si existe
        if (zone.boundingBox) {
          const { south, north, west, east } = zone.boundingBox;
          if (lat >= south && lat <= north && lon >= west && lon <= east) {
            return { covered: true, zoneName: zone.zoneName, reason: `${zone.zoneType}: ${zone.zoneName}` };
          }
        }
        // Verificar por nombre de ciudad
        if (city && zoneNameLower.includes(city.toLowerCase())) {
          return { covered: true, zoneName: zone.zoneName, reason: `${zone.zoneType}: ${zone.zoneName}` };
        }
        break;
    }
  }

  return { covered: false, zoneName: '', reason: 'Fuera de zona de servicio' };
}

// =========================================================================
// EXPORTS LEGACY (compatibilidad)
// =========================================================================

/**
 * Calcular distancia en línea recta (Haversine)
 * Solo usar como fallback si OSRM no está disponible
 */
export function calculateStraightLineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// =========================================================================
// COORDENADAS DE CIUDADES Y CANTONES
// =========================================================================

/**
 * Coordenadas aproximadas de ciudades principales de Suiza y Liechtenstein
 * Usado como fallback cuando Nominatim no está disponible
 */
export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Suiza - Principales ciudades por cantón
  // Zúrich
  'zürich': { lat: 47.3769, lng: 8.5417 },
  'zurich': { lat: 47.3769, lng: 8.5417 },
  'winterthur': { lat: 47.4992, lng: 8.7292 },

  // Berna
  'bern': { lat: 46.9480, lng: 7.4474 },
  'berne': { lat: 46.9480, lng: 7.4474 },
  'biel': { lat: 47.1377, lng: 7.2467 },
  'bienne': { lat: 47.1377, lng: 7.2467 },
  'thun': { lat: 46.7580, lng: 7.6280 },

  // Ginebra
  'genève': { lat: 46.2044, lng: 6.1432 },
  'geneva': { lat: 46.2044, lng: 6.1432 },
  'ginebra': { lat: 46.2044, lng: 6.1432 },

  // Vaud
  'lausanne': { lat: 46.5197, lng: 6.6323 },
  'montreux': { lat: 46.4312, lng: 6.9106 },
  'vevey': { lat: 46.4628, lng: 6.8416 },
  'nyon': { lat: 46.3822, lng: 6.2395 },

  // Valais
  'sion': { lat: 46.2330, lng: 7.3600 },
  'sierre': { lat: 46.2929, lng: 7.5333 },
  'brig': { lat: 46.3171, lng: 7.9844 },
  'zermatt': { lat: 46.0207, lng: 7.7491 },
  'verbier': { lat: 46.0962, lng: 7.2276 },

  // Ticino
  'lugano': { lat: 46.0037, lng: 8.9511 },
  'bellinzona': { lat: 46.1946, lng: 9.0240 },
  'locarno': { lat: 46.1704, lng: 8.8042 },

  // St. Gallen
  'st. gallen': { lat: 47.4239, lng: 9.3748 },
  'sankt gallen': { lat: 47.4239, lng: 9.3748 },
  'st.gallen': { lat: 47.4239, lng: 9.3748 },
  'buchs': { lat: 47.4667, lng: 9.4833 },

  // Aargau
  'aarau': { lat: 47.3926, lng: 8.0444 },
  'baden': { lat: 47.4760, lng: 8.3087 },
  'wettingen': { lat: 47.3836, lng: 8.3187 },

  // Lucerna
  'luzern': { lat: 47.0502, lng: 8.3093 },
  'lucerne': { lat: 47.0502, lng: 8.3093 },

  // Basilea
  'basel': { lat: 47.5596, lng: 7.5886 },
  'basilea': { lat: 47.5596, lng: 7.5886 },

  // Otros cantones
  'schaffhausen': { lat: 47.6973, lng: 8.6349 },
  'chur': { lat: 46.8499, lng: 9.5329 },
  'solothurn': { lat: 47.2088, lng: 7.5378 },
  'fribourg': { lat: 46.8065, lng: 7.1618 },
  'freiburg': { lat: 46.8065, lng: 7.1618 },
  'neuchâtel': { lat: 46.9929, lng: 6.9319 },
  'neuchatel': { lat: 46.9929, lng: 6.9319 },
  'delemont': { lat: 47.3636, lng: 7.3502 },
  'délémont': { lat: 47.3636, lng: 7.3502 },
  'zug': { lat: 47.1743, lng: 8.5177 },

  // Liechtenstein
  'vaduz': { lat: 47.1410, lng: 9.5215 },
  'schaan': { lat: 47.1656, lng: 9.5086 },
  'balzers': { lat: 47.0678, lng: 9.5014 },
  'triesen': { lat: 47.1158, lng: 9.5272 },
  'triesenberg': { lat: 47.1180, lng: 9.5450 },
  'gamprin': { lat: 47.2083, lng: 9.5167 },
  'eschen': { lat: 47.2117, lng: 9.5128 },
  'mauren': { lat: 47.2189, lng: 9.5433 },
  'ruggell': { lat: 47.2433, lng: 9.5333 },
  'planken': { lat: 47.1867, lng: 9.5483 },
  'schenberg': { lat: 47.2406, lng: 9.5400 },
};

/**
 * Obtener coordenadas de una ciudad por nombre
 */
export function getCityCoordinates(
  cityName: string,
  cantonCode?: string
): { lat: number; lng: number } | null {
  const normalized = cityName.toLowerCase().trim();

  // Buscar directamente
  if (CITY_COORDINATES[normalized]) {
    return CITY_COORDINATES[normalized];
  }

  // Buscar sin acentos
  const normalizedNoAccents = normalized
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    const keyNoAccents = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (keyNoAccents === normalizedNoAccents || key.includes(normalized)) {
      return coords;
    }
  }

  return null;
}

/**
 * Determinar tipo de cobertura y radio de operación
 * Basado en el cantón y país
 */
export function determineCoverageType(
  cantonCode: string,
  country?: string
): {
  coverageType: 'city' | 'canton' | 'country' | 'regional';
  operationRadius: number;
  reason: string;
} {
  // Liechtenstein - país pequeño, cobertura nacional
  if (country === 'LI' || cantonCode === 'LI') {
    return {
      coverageType: 'country',
      operationRadius: 20,
      reason: 'Liechtenstein es un país pequeño - cobertura nacional'
    };
  }

  // Cantones grandes con cobertura regional
  const largeCantons = ['GR', 'VS', 'TI', 'BE'];
  if (largeCantons.includes(cantonCode)) {
    return {
      coverageType: 'regional',
      operationRadius: 50,
      reason: 'Cantón grande - cobertura regional extendida'
    };
  }

  // Cantones urbanos (Zúrich, Ginebra, Basilea)
  const urbanCantons = ['ZH', 'GE', 'BS', 'BL'];
  if (urbanCantons.includes(cantonCode)) {
    return {
      coverageType: 'canton',
      operationRadius: 25,
      reason: 'Cantón urbano - cobertura cantonal'
    };
  }

  // Por defecto - cobertura cantonal estándar
  return {
    coverageType: 'canton',
    operationRadius: 30,
    reason: 'Cobertura cantonal estándar'
  };
}
