import { NextRequest, NextResponse } from 'next/server'
import { expandSearchWithTranslations, airportAliases } from '@/lib/searchTranslations'
import { getCached, setCache } from '@/lib/cache'

// ============================================
// BUSCADOR DE DIRECCIONES PARA TAXIS
// Usa Photon para autocompletado + Nominatim para direcciones exactas
// Solo resultados de Suiza (CH) y Liechtenstein (LI)
// Con traducción automática de términos genéricos
// Caché persistente con Redis (Upstash) + fallback a memoria
// ============================================

interface AddressResult {
  id: string
  name: string  // Nombre principal (POI o calle/lugar)
  street: string | null
  housenumber: string | null
  postcode: string | null
  city: string | null
  state: string | null
  country: string
  fullAddress: string
  shortAddress: string
  poiName: string | null  // Nombre del POI (Migros, Coop, etc.)
  lat: number
  lon: number
  type: string
  typeName: string
  icon: string
  needsHouseNumber: boolean
  source: string
}

// Filtrar resultados solo de Suiza y Liechtenstein
function isSwissOrLiechtensteinPostcode(postcode: string | undefined): boolean {
  if (!postcode) return false
  return /^\d{4}$/.test(postcode)
}

// Determinar tipo de ubicación e icono - MEJORADO con más POIs
function getLocationType(osmKey: string, osmValue: string, name: string): { type: string; typeName: string; icon: string } {
  const nameLower = name.toLowerCase()
  
  // ==================== TRANSPORTE ====================
  // Aeropuerto
  if (osmValue === 'aerodrome' || osmKey === 'aeroway' || nameLower.includes('flughafen') || nameLower.includes('airport') || nameLower.includes('aeropuerto')) {
    return { type: 'airport', typeName: 'Aeropuerto', icon: '✈️' }
  }
  // Estación de tren (pero no calles con "bahnhof" en el nombre)
  if (osmKey === 'railway' && (osmValue === 'station' || osmValue === 'halt')) {
    return { type: 'train_station', typeName: 'Estación de tren', icon: '🚂' }
  }
  // Solo detectar bahnhof si NO es una calle
  if ((nameLower.includes('bahnhof') || nameLower.includes('station') || nameLower.includes('estación')) && 
      !nameLower.includes('strasse') && !nameLower.includes('straße') && !nameLower.includes('gasse') && !nameLower.includes('weg')) {
    return { type: 'train_station', typeName: 'Estación de tren', icon: '🚂' }
  }
  // Estación de bus
  if (osmValue === 'bus_station' || osmValue === 'bus_stop' || osmKey === 'bus') {
    return { type: 'bus_station', typeName: 'Estación de bus', icon: '🚌' }
  }
  // Puerto/Muelle (pero no "sport"!)
  if (osmValue === 'ferry_terminal' || nameLower.includes('hafen') || 
      (nameLower.includes('port') && !nameLower.includes('sport'))) {
    return { type: 'port', typeName: 'Puerto', icon: '⚓' }
  }
  
  // ==================== COMIDA Y BEBIDA ====================
  // Pizzería (antes que comida rápida)
  if (nameLower.includes('pizzeria') || nameLower.includes('pizzería') || nameLower.includes('pizza')) {
    return { type: 'restaurant', typeName: 'Pizzería', icon: '🍕' }
  }
  // Café (detectar por nombre PRIMERO, antes que bar)
  if (nameLower.includes('café') || nameLower.includes('cafe') || nameLower.startsWith('café') || nameLower.startsWith('cafe')) {
    return { type: 'cafe', typeName: 'Café', icon: '☕' }
  }
  // GASOLINERAS - ANTES de bares (porque "Tankstelle" puede contener "elle")
  if (osmValue === 'fuel' || osmKey === 'fuel' || nameLower.includes('tankstelle') || nameLower.includes('gasolinera') || nameLower.includes('gas station')) {
    return { type: 'gas_station', typeName: 'Gasolinera', icon: '⛽' }
  }
  if (nameLower.includes('shell') || nameLower.includes('bp ') || nameLower.includes('esso') || nameLower.includes('agip') || nameLower.includes('avia') || nameLower.includes('amo') || nameLower.includes('tamoil')) {
    return { type: 'gas_station', typeName: 'Gasolinera', icon: '⛽' }
  }
  // Restaurante
  if (osmValue === 'restaurant' || osmKey === 'restaurant') {
    return { type: 'restaurant', typeName: 'Restaurante', icon: '🍽️' }
  }
  if (nameLower.includes('restaurant') || nameLower.includes('gasthaus') || nameLower.includes('gasthof') || nameLower.includes('trattoria') || nameLower.includes('ristorante')) {
    return { type: 'restaurant', typeName: 'Restaurante', icon: '🍽️' }
  }
  // Bar/Pub
  if (osmValue === 'bar' || osmValue === 'pub') {
    return { type: 'bar', typeName: 'Bar/Pub', icon: '🍺' }
  }
  if (nameLower.includes(' bar') || nameLower.includes('pub ') || nameLower.includes('bierstube') || nameLower.includes('beiz')) {
    return { type: 'bar', typeName: 'Bar/Pub', icon: '🍺' }
  }
  // Café por OSM
  if (osmValue === 'cafe' || osmKey === 'cafe') {
    return { type: 'cafe', typeName: 'Café', icon: '☕' }
  }
  // Comida rápida
  if (osmValue === 'fast_food') {
    return { type: 'fast_food', typeName: 'Comida rápida', icon: '🍔' }
  }
  if (nameLower.includes('mcdonalds') || nameLower.includes('burger king') || nameLower.includes('kfc') || nameLower.includes('subway')) {
    return { type: 'fast_food', typeName: 'Comida rápida', icon: '🍔' }
  }
  
  // ==================== COMPRAS ====================
  // Supermercado
  if (osmValue === 'supermarket' || osmKey === 'supermarket') {
    return { type: 'supermarket', typeName: 'Supermercado', icon: '🛒' }
  }
  if (nameLower.includes('migros') || nameLower.includes('coop') || nameLower.includes('denner') || nameLower.includes('aldi') || nameLower.includes('lidl') || nameLower.includes('spar') || nameLower.includes('volg')) {
    return { type: 'supermarket', typeName: 'Supermercado', icon: '🛒' }
  }
  
  // ==================== SALUD ====================
  // Hospital
  if (osmValue === 'hospital' || osmKey === 'hospital') {
    return { type: 'hospital', typeName: 'Hospital', icon: '🏥' }
  }
  if (nameLower.includes('spital') || nameLower.includes('hospital') || nameLower.includes('krankenhaus') || nameLower.includes('hôpital')) {
    return { type: 'hospital', typeName: 'Hospital', icon: '🏥' }
  }
  // Farmacia
  if (osmValue === 'pharmacy' || osmKey === 'pharmacy' || nameLower.includes('apotheke') || nameLower.includes('pharmacie') || nameLower.includes('farmacia')) {
    return { type: 'pharmacy', typeName: 'Farmacia', icon: '💊' }
  }
  
  // ==================== CENTRO COMERCIAL ====================
  if (osmValue === 'mall' || nameLower.includes('shopping') || nameLower.includes('zentrum') || 
      nameLower.includes('mall') || nameLower.includes('arcade')) {
    return { type: 'mall', typeName: 'Centro comercial', icon: '🛍️' }
  }
  
  // ==================== UBICACIONES GEOGRÁFICAS ====================
  if (osmValue === 'city') {
    return { type: 'city', typeName: 'Ciudad', icon: '🏙️' }
  }
  if (osmValue === 'town') {
    return { type: 'town', typeName: 'Pueblo', icon: '🏘️' }
  }
  if (osmValue === 'village') {
    return { type: 'village', typeName: 'Aldea', icon: '🏘️' }
  }
  if (osmValue === 'suburb' || osmValue === 'neighbourhood') {
    return { type: 'neighborhood', typeName: 'Barrio', icon: '🏘️' }
  }
  
  // Default: dirección normal
  return { type: 'address', typeName: 'Dirección', icon: '📍' }
}

// ============================================
// PHOTON API - Autocompletado rápido
// BBOX: Suiza + Liechtenstein (coordenadas precisas)
// ============================================
interface LocationBias {
  lat: number
  lon: number
}

interface SearchResult {
  results: AddressResult[]
  fromCache: boolean
}

async function searchPhoton(query: string, locationBias?: LocationBias): Promise<SearchResult> {
  // Crear clave de caché primero
  const cacheKey = `photon:${query}:${locationBias?.lat || 0}:${locationBias?.lon || 0}`
  
  // Verificar caché primero
  const cachedResult = await getCached<AddressResult[]>(cacheKey)
  if (cachedResult) {
    // Caché HIT para Photon
    return { results: cachedResult.data, fromCache: true }
  }
  
  try {
    // Bounding box para Suiza + Liechtenstein
    const bbox = '5.9,45.8,10.5,47.9'
    
    // Construir URL con location bias si está disponible
    let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lang=de&limit=15&bbox=${bbox}`
    
    if (locationBias) {
      url += `&lat=${locationBias.lat}&lon=${locationBias.lon}&location_bias_scale=0.3`
    }
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      headers: { 'Accept': 'application/json' }
    })
    
    if (!response.ok) return { results: [], fromCache: false }
    
    const data = await response.json()
    const results: AddressResult[] = []
    
    for (const feature of data.features || []) {
      const props = feature.properties
      const [lon, lat] = feature.geometry.coordinates
      
      const postcode = props.postcode || ''
      const country = (props.country || '').toLowerCase()
      
      // Filtrar SOLO por coordenadas primero (fuente de verdad)
      const isInSwissRegion = lat >= 45.8 && lat <= 47.9 && lon >= 5.9 && lon <= 10.5
      
      if (!isInSwissRegion) {
        continue
      }
      
      // Detectar si es EuroAirport (en la frontera franco-suiza)
      const isEuroAirport = lat >= 47.5 && lat <= 47.7 && lon >= 7.4 && lon <= 7.6
      
      const street = props.street || null
      const housenumber = props.housenumber || null
      const city = props.city || null
      const state = props.state || null
      const countryCode = country.includes('liechtenstein') ? 'LI' : 
                          (isEuroAirport && (props.name || '').toLowerCase().includes('basel')) ? 'CH' : 
                          'CH'
      
      // Determinar el tipo de ubicación PRIMERO para saber si es un POI
      const { type, typeName, icon } = getLocationType(
        props.osm_key || '', 
        props.osm_value || '', 
        props.name || ''
      )
      
      // Nombre del POI (solo si es un POI, no una dirección normal)
      const isPOI = type !== 'address' && type !== 'city' && type !== 'town' && type !== 'village' && type !== 'neighborhood'
      const poiName = isPOI ? (props.name || null) : null
      
      // Construir dirección completa
      let fullAddress = ''
      if (poiName) {
        fullAddress = poiName
        if (street && street.toLowerCase() !== poiName.toLowerCase()) {
          fullAddress += `, ${street}`
          if (housenumber) fullAddress += ` ${housenumber}`
        }
        if (postcode && city) {
          fullAddress += `, ${postcode} ${city}`
        } else if (city) {
          fullAddress += `, ${city}`
        }
        if (state) fullAddress += `, ${state}`
      } else {
        if (street && housenumber) {
          fullAddress = `${street} ${housenumber}`
        } else if (street) {
          fullAddress = street
        } else if (props.name) {
          fullAddress = props.name
        }
        if (postcode && city) {
          fullAddress += `, ${postcode} ${city}`
        } else if (city) {
          fullAddress += `, ${city}`
        }
        if (state) fullAddress += `, ${state}`
      }
      
      // Dirección corta
      let shortAddress = ''
      if (poiName) {
        shortAddress = poiName
        if (postcode && city) {
          shortAddress += `, ${postcode} ${city}`
        } else if (city) {
          shortAddress += `, ${city}`
        }
      } else {
        if (street) {
          shortAddress = `${street}${housenumber ? ` ${housenumber}` : ''}`
        } else if (props.name) {
          shortAddress = props.name
        }
        if (postcode && city) {
          shortAddress += `, ${postcode} ${city}`
        } else if (city) {
          shortAddress += `, ${city}`
        }
      }
      
      const needsHouseNumber = !!street && !housenumber && type === 'address'
      
      // Nombre principal para mostrar
      let displayName = ''
      if (poiName) {
        displayName = poiName
      } else if (street) {
        displayName = housenumber ? `${street} ${housenumber}` : street
      } else if (props.name) {
        displayName = props.name
      } else if (city) {
        displayName = city
      }
      
      results.push({
        id: `photon-${lat.toFixed(6)}-${lon.toFixed(6)}`,
        name: displayName,
        street,
        housenumber,
        postcode: postcode || null,
        city,
        state,
        country: countryCode,
        fullAddress: fullAddress.trim(),
        shortAddress: shortAddress.trim(),
        poiName,
        lat: Math.round(lat * 1000000) / 1000000,
        lon: Math.round(lon * 1000000) / 1000000,
        type,
        typeName,
        icon,
        needsHouseNumber,
        source: 'photon'
      })
    }
    
    // Guardar en caché (TTL: 30 minutos)
    await setCache(cacheKey, results, 30 * 60 * 1000)
    
    return { results, fromCache: false }
  } catch (error) {
    console.error('Photon error:', error)
    return { results: [], fromCache: false }
  }
}

// ============================================
// NOMINATIM API - Direcciones exactas con número de portal
// ============================================
async function searchNominatim(query: string, locationBias?: LocationBias): Promise<SearchResult> {
  // Verificar caché primero
  const cacheKey = `nominatim:${query}`
  const cachedResult = await getCached<AddressResult[]>(cacheKey)
  if (cachedResult) {
    // Caché HIT para Nominatim
    return { results: cachedResult.data, fromCache: true }
  }
  
  try {
    // Viewbox para Suiza + Liechtenstein
    const viewbox = '5.9,45.8,10.5,47.9'
    
    // Detectar si es una dirección estructurada (calle + número)
    const addressMatch = query.match(/^(.+?)\s+(\d+)(?:\s+(.*))?$/)
    
    let url: string
    
    // Base de parámetros comunes
    const commonParams = `countrycodes=ch,li&viewbox=${viewbox}&bounded=1&format=json&limit=8&addressdetails=1&accept-language=es`
    
    if (addressMatch && addressMatch[1].length > 3) {
      // Búsqueda estructurada para direcciones con número
      const street = addressMatch[1]
      const housenumber = addressMatch[2]
      const city = addressMatch[3] || ''
      
      url = `https://nominatim.openstreetmap.org/search?` +
        `street=${encodeURIComponent(`${street} ${housenumber}`)}&` +
        (city ? `city=${encodeURIComponent(city)}&` : '') +
        commonParams
    } else {
      // Búsqueda normal
      url = `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        commonParams
    }
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'TaxiSwissBot/1.0'
      }
    })
    
    if (!response.ok) return { results: [], fromCache: false }
    
    const data = await response.json()
    const results: AddressResult[] = []
    
    for (const item of data) {
      const addr = item.address || {}
      const lat = parseFloat(item.lat)
      const lon = parseFloat(item.lon)
      
      // Filtrar por coordenadas
      const isInSwissRegion = lat >= 45.8 && lat <= 47.9 && lon >= 5.9 && lon <= 10.5
      if (!isInSwissRegion) {
        continue
      }
      
      // Detectar si es EuroAirport
      const isEuroAirport = lat >= 47.5 && lat <= 47.7 && lon >= 7.4 && lon <= 7.6
      
      const street = addr.road || addr.street || addr.pedestrian || null
      const housenumber = addr.house_number || addr.housenumber || null
      const postcode = addr.postcode || null
      const city = addr.city || addr.town || addr.village || addr.municipality || null
      const state = addr.state || addr.county || null
      const countryCode = item.country_code?.toUpperCase() === 'LI' ? 'LI' : 
                          (isEuroAirport && (item.name || '').toLowerCase().includes('basel')) ? 'CH' :
                          'CH'
      
      // Construir dirección completa
      let fullAddress = ''
      if (street && housenumber) {
        fullAddress = `${street} ${housenumber}`
      } else if (street) {
        fullAddress = street
      }
      
      if (postcode && city) {
        fullAddress += `, ${postcode} ${city}`
      } else if (city) {
        fullAddress += `, ${city}`
      }
      
      if (state) fullAddress += `, ${state}`
      
      if (!fullAddress) {
        const parts = item.display_name.split(', ')
        fullAddress = parts.slice(0, 4).join(', ')
      }
      
      // Dirección corta
      let shortAddress = ''
      if (street) {
        shortAddress = `${street}${housenumber ? ` ${housenumber}` : ''}`
      }
      if (postcode && city) {
        shortAddress += `, ${postcode} ${city}`
      } else if (city) {
        shortAddress += `, ${city}`
      }
      if (!shortAddress) {
        shortAddress = fullAddress.split(',').slice(0, 2).join(',')
      }
      
      const { type, typeName, icon } = getLocationType(
        item.type || '', 
        item.class || '', 
        item.name || ''
      )
      
      // Determinar si es un POI
      const isPOI = type !== 'address' && type !== 'city' && type !== 'town' && type !== 'village' && type !== 'neighborhood'
      const poiName = isPOI ? (item.name || null) : null
      
      // Si hay POI, reconstruir la dirección con el nombre del POI
      if (poiName) {
        fullAddress = poiName
        if (street) {
          fullAddress += `, ${street}`
          if (housenumber) fullAddress += ` ${housenumber}`
        }
        if (postcode && city) {
          fullAddress += `, ${postcode} ${city}`
        } else if (city) {
          fullAddress += `, ${city}`
        }
        if (state) fullAddress += `, ${state}`
        
        shortAddress = poiName
        if (postcode && city) {
          shortAddress += `, ${postcode} ${city}`
        } else if (city) {
          shortAddress += `, ${city}`
        }
      }
      
      const needsHouseNumber = !!street && !housenumber && type === 'address'
      
      // Nombre principal para mostrar
      let displayName = ''
      if (poiName) {
        displayName = poiName
      } else if (street) {
        displayName = housenumber ? `${street} ${housenumber}` : street
      } else if (item.name) {
        displayName = item.name
      } else if (city) {
        displayName = city
      }
      
      results.push({
        id: `nom-${lat.toFixed(6)}-${lon.toFixed(6)}`,
        name: displayName,
        street,
        housenumber,
        postcode,
        city,
        state,
        country: countryCode,
        fullAddress: fullAddress.trim(),
        shortAddress: shortAddress.trim(),
        poiName,
        lat,
        lon,
        type,
        typeName,
        icon,
        needsHouseNumber,
        source: 'nominatim'
      })
    }
    
    // Guardar en caché (TTL: 30 minutos)
    await setCache(cacheKey, results, 30 * 60 * 1000)
    
    return { results, fromCache: false }
  } catch (error) {
    console.error('Nominatim error:', error)
    return { results: [], fromCache: false }
  }
}

// ============================================
// API ROUTE PRINCIPAL
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    
    // Location bias: coordenadas del usuario para priorizar resultados cercanos
    const userLat = searchParams.get('lat')
    const userLon = searchParams.get('lon')
    const locationBias: LocationBias | undefined = 
      (userLat && userLon) ? { lat: parseFloat(userLat), lon: parseFloat(userLon) } : undefined
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        query: '',
        data: [],
        count: 0,
        message: 'Escribe al menos 2 caracteres para buscar',
        attribution: 'Datos de direcciones de © OpenStreetMap'
      })
    }
    
    const searchTerm = query.trim()
    const normalizedSearchTerm = searchTerm.toLowerCase()
    
    // Aeropuertos principales de Suiza (para búsqueda genérica "aeropuerto")
    const swissAirports: AddressResult[] = [
      {
        id: 'airport-zurich',
        name: 'Aeropuerto de Zúrich',
        street: null,
        housenumber: null,
        postcode: '8302',
        city: 'Kloten',
        state: 'Zürich',
        country: 'CH',
        fullAddress: 'Aeropuerto de Zúrich, 8302 Kloten, Zürich',
        shortAddress: 'Aeropuerto de Zúrich, 8302 Kloten',
        poiName: 'Aeropuerto de Zúrich',
        lat: 47.4647,
        lon: 8.5492,
        type: 'airport',
        typeName: 'Aeropuerto',
        icon: '✈️',
        needsHouseNumber: false,
        source: 'static'
      },
      {
        id: 'airport-geneva',
        name: 'Aeropuerto de Ginebra',
        street: null,
        housenumber: null,
        postcode: '1215',
        city: 'Genève',
        state: 'Genève',
        country: 'CH',
        fullAddress: 'Aeropuerto de Ginebra, 1215 Genève, Genève',
        shortAddress: 'Aeropuerto de Ginebra, 1215 Genève',
        poiName: 'Aeropuerto de Ginebra',
        lat: 46.2380,
        lon: 6.1089,
        type: 'airport',
        typeName: 'Aeropuerto',
        icon: '✈️',
        needsHouseNumber: false,
        source: 'static'
      },
      {
        id: 'airport-basel',
        name: 'EuroAirport Basel Mulhouse',
        street: null,
        housenumber: null,
        postcode: '4030',
        city: 'Basel',
        state: 'Basel-Stadt',
        country: 'CH',
        fullAddress: 'EuroAirport Basel Mulhouse, 4030 Basel, Basel-Stadt',
        shortAddress: 'EuroAirport Basel Mulhouse, Basel',
        poiName: 'EuroAirport Basel Mulhouse',
        lat: 47.5896,
        lon: 7.5299,
        type: 'airport',
        typeName: 'Aeropuerto',
        icon: '✈️',
        needsHouseNumber: false,
        source: 'static'
      }
    ]
    
    // Si busca "aeropuerto", "airport", "flughafen" genérico, incluir los 3 principales
    const genericAirportTerms = ['aeropuerto', 'airport', 'flughafen', 'aéroport', 'aeroporto']
    const isGenericAirportSearch = genericAirportTerms.some(term => 
      normalizedSearchTerm === term || normalizedSearchTerm.startsWith(term + ' ')
    )
    
    // Verificar si es un alias de aeropuerto
    const airportAlias = airportAliases[normalizedSearchTerm]
    let finalSearchTerms = [searchTerm]
    
    if (airportAlias) {
      finalSearchTerms = [airportAlias, searchTerm]
      // Alias de aeropuerto detectado
    }
    
    // Expandir búsqueda con traducciones SOLO para términos genéricos
    const { expandedQueries, translatedTerms } = expandSearchWithTranslations(searchTerm)
    
    // Combinar todos los términos de búsqueda
    const allSearchTerms = [...new Set([...finalSearchTerms, ...expandedQueries])]
    
    // Buscando direcciones
    // Expandir búsqueda con variantes si es necesario
    
    // Buscar en ambas APIs con todas las variantes
    const searchPromises: Promise<SearchResult>[] = []
    
    for (const searchVariant of allSearchTerms) {
      searchPromises.push(searchPhoton(searchVariant, locationBias))
      searchPromises.push(searchNominatim(searchVariant, locationBias))
    }
    
    const allSearchResults = await Promise.all(searchPromises)
    
    // Verificar si algún resultado viene del caché
    const anyFromCache = allSearchResults.some(r => r.fromCache)
    
    // Extraer solo los resultados
    const allResultsFlat = allSearchResults.flatMap(r => r.results)
    
    // Combinar y deduplicar resultados
    const seen = new Set<string>()
    const allResults: AddressResult[] = []
    
    for (const result of allResultsFlat) {
      const key = `${result.street || ''}-${result.housenumber || ''}-${result.postcode || ''}-${result.city || ''}`
      
      if (seen.has(key)) continue
      seen.add(key)
      
      allResults.push(result)
    }
    
    // Ordenar por relevancia
    const searchWords = normalizedSearchTerm.split(/\s+/).filter(w => w.length >= 2)
    
    const getRelevanceScore = (result: AddressResult): number => {
      let score = 0
      const nameLower = result.fullAddress.toLowerCase()
      const streetLower = (result.street || '').toLowerCase()
      
      // BONUS MUY ALTO para aeropuertos estáticos
      if (result.source === 'static' && result.type === 'airport') {
        score += 500
      }
      
      // BONUS ALTO para aeropuertos reales
      if (result.type === 'airport') {
        score += 100
      }
      
      for (const word of searchWords) {
        if (streetLower.includes(word) || nameLower.includes(word)) {
          score += 30
        }
      }
      
      if (result.city && normalizedSearchTerm.includes(result.city.toLowerCase())) {
        score += 50
      }
      
      if (result.postcode && normalizedSearchTerm.includes(result.postcode)) {
        score += 40
      }
      
      // Bonus para POIs
      if (result.type !== 'address' && result.type !== 'city' && result.type !== 'town' && result.type !== 'village' && result.type !== 'neighborhood') {
        score += 20
      }
      
      // Bonus por tener número de casa
      if (result.housenumber && result.type === 'address') {
        score += 25
      }
      
      return score
    }
    
    // Si la búsqueda es "aeropuerto" genérico, añadir los 3 aeropuertos principales
    if (isGenericAirportSearch) {
      // Añadiendo aeropuertos principales de Suiza
      for (const airport of swissAirports) {
        if (!allResults.some(r => r.id === airport.id)) {
          allResults.push(airport)
        }
      }
    }
    
    allResults.sort((a, b) => {
      const scoreA = getRelevanceScore(a)
      const scoreB = getRelevanceScore(b)
      
      if (scoreA !== scoreB) return scoreB - scoreA
      
      if (a.housenumber && !b.housenumber) return -1
      if (!a.housenumber && b.housenumber) return 1
      
      return 0
    })
    
    const results = allResults.slice(0, 10)
    
    // Resultados encontrados
    
    let message = ''
    if (results.length === 0) {
      message = 'No se encontraron direcciones. Verifica la dirección o intenta con otro término.'
    } else if (results.some(r => r.needsHouseNumber)) {
      message = '💡 Para una llegada exacta, indica el número de portal.'
    }
    
    return NextResponse.json({
      success: true,
      query: searchTerm,
      data: results,
      count: results.length,
      message,
      fromCache: anyFromCache ? '📦 desde caché' : false,
      translatedFrom: translatedTerms.length > 0 ? searchTerm : null,
      expandedTo: translatedTerms.length > 0 ? translatedTerms : null,
      attribution: 'Datos de direcciones de © OpenStreetMap'
    })
    
  } catch (error) {
    console.error('Error en búsqueda:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al buscar la dirección. Por favor, intenta de nuevo.',
      attribution: 'Datos de direcciones de © OpenStreetMap'
    })
  }
}
