import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCached, setCache } from '@/lib/cache'
import { 
  SWISS_CANTONS, 
  LIECHTENSTEIN, 
  findCantonByName, 
  getMunicipalitiesByCanton,
  getMunicipalitiesByDistrict
} from '@/lib/geo-data'

// ============================================
// API para obtener taxis con GPS activo en tiempo real
// Lógica basada en ZONAS y RUTAS del taxista
// Usa datos geográficos completos de Suiza y Liechtenstein
// ============================================

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function checkSchedule(mode: string, scheduleJson: string): boolean {
  if (mode === 'always') return true
  try {
    const schedule = JSON.parse(scheduleJson)
    if (!Array.isArray(schedule) || schedule.length === 0) return true
    const now = new Date()
    const currentDay = now.getDay()
    const currentTime = now.toTimeString().slice(0, 5)
    const todaySchedule = schedule.find((s: { day: number; start: string; end: string }) => s.day === currentDay)
    if (!todaySchedule) return false
    return currentTime >= todaySchedule.start && currentTime <= todaySchedule.end
  } catch {
    return true
  }
}

// Normalizar nombre para comparación
function normalizeName(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

// Verificar si un lugar está dentro de un cantón
function isPlaceInCanton(placeName: string, cantonId: string): boolean {
  const municipalities = getMunicipalitiesByCanton(cantonId)
  const placeNorm = normalizeName(placeName)
  
  return municipalities.some(m => {
    const mNorm = normalizeName(m)
    return mNorm.includes(placeNorm) || placeNorm.includes(mNorm)
  })
}

// Verificar si un lugar está dentro de un distrito
function isPlaceInDistrict(placeName: string, cantonId: string, districtId: string): boolean {
  const municipalities = getMunicipalitiesByDistrict(cantonId, districtId)
  const placeNorm = normalizeName(placeName)
  
  return municipalities.some(m => {
    const mNorm = normalizeName(m)
    return mNorm.includes(placeNorm) || placeNorm.includes(mNorm)
  })
}

// Verificar si un lugar está en Liechtenstein
function isPlaceInLiechtenstein(placeName: string): boolean {
  const placeNorm = normalizeName(placeName)
  return LIECHTENSTEIN.municipalities.some(m => {
    const mNorm = normalizeName(m)
    return mNorm.includes(placeNorm) || placeNorm.includes(mNorm)
  })
}

// Verificar si un destino coincide con las zonas/rutas del taxista
function checkDriverAvailability(
  destination: string | null,
  zones: Array<{ zoneName: string; zoneType: string; exclusions: string[] }>,
  routes: Array<{ origin: string; destination: string; originType: string; destType: string }>,
  baseCity: string,
  baseCanton: string
): { available: boolean; reason: string; matchedDestinations: string[] } {
  
  const matchedDestinations: string[] = []
  const destNorm = destination ? normalizeName(destination) : null
  
  // Siempre disponible en ciudad base
  const baseCityNorm = normalizeName(baseCity)
  if (destination && destNorm) {
    if (destNorm.includes(baseCityNorm) || baseCityNorm.includes(destNorm)) {
      matchedDestinations.push(baseCity)
    }
  }
  
  // Verificar zonas de servicio
  for (const zone of zones) {
    const zoneNorm = normalizeName(zone.zoneName)
    const zoneType = zone.zoneType
    
    if (destination && destNorm) {
      let isMatch = false
      
      // Verificar según tipo de zona
      if (zoneType === 'country' && zoneNorm.includes('liechtenstein')) {
        // Zona = Liechtenstein completo
        isMatch = isPlaceInLiechtenstein(destination)
      } else if (zoneType === 'canton') {
        // Buscar el cantón por nombre
        const canton = SWISS_CANTONS.find(c => 
          normalizeName(c.name).includes(zoneNorm) || 
          zoneNorm.includes(normalizeName(c.name)) ||
          c.code.toLowerCase() === zoneNorm.replace(/[^a-z]/g, '')
        )
        
        if (canton) {
          isMatch = isPlaceInCanton(destination, canton.id)
        } else {
          // Fallback a comparación simple
          isMatch = destNorm.includes(zoneNorm) || zoneNorm.includes(destNorm)
        }
      } else if (zoneType === 'district' || zoneType === 'region' || zoneType === 'wahlkreis') {
        // Buscar el distrito
        for (const canton of SWISS_CANTONS) {
          const district = canton.districts.find(d => {
            const dNorm = normalizeName(d.name)
            return dNorm.includes(zoneNorm) || zoneNorm.includes(dNorm)
          })
          
          if (district) {
            isMatch = isPlaceInDistrict(destination, canton.id, district.id)
            if (isMatch) break
          }
        }
        
        // Fallback a comparación simple
        if (!isMatch) {
          isMatch = destNorm.includes(zoneNorm) || zoneNorm.includes(destNorm)
        }
      } else if (zoneType === 'municipality') {
        // Comparación directa de municipio
        isMatch = destNorm.includes(zoneNorm) || zoneNorm.includes(destNorm)
      } else {
        // Tipo desconocido - comparación simple
        isMatch = destNorm.includes(zoneNorm) || zoneNorm.includes(destNorm)
      }
      
      if (isMatch) {
        // Verificar exclusiones
        const isExcluded = zone.exclusions.some(ex => {
          const exNorm = normalizeName(ex)
          return destNorm.includes(exNorm) || exNorm.includes(destNorm)
        })
        
        if (!isExcluded && !matchedDestinations.includes(zone.zoneName)) {
          matchedDestinations.push(zone.zoneName)
        }
      }
    } else {
      // Sin destino específico - agregar zona como disponible
      if (!matchedDestinations.includes(zone.zoneName)) {
        matchedDestinations.push(zone.zoneName)
      }
    }
  }
  
  // Verificar rutas específicas
  for (const route of routes) {
    const routeDestNorm = normalizeName(route.destination)
    const routeOriginNorm = normalizeName(route.origin)
    
    if (destination && destNorm) {
      // Si el destino coincide con el destino de la ruta
      if (destNorm.includes(routeDestNorm) || routeDestNorm.includes(destNorm)) {
        if (!matchedDestinations.includes(route.destination)) {
          matchedDestinations.push(route.destination)
        }
      }
      
      // Si el destino coincide con el origen (puede volver)
      if (destNorm.includes(routeOriginNorm) || routeOriginNorm.includes(destNorm)) {
        if (!matchedDestinations.includes(route.origin)) {
          matchedDestinations.push(route.origin)
        }
      }
      
      // Verificar si el origen de la ruta es una zona que contiene el destino
      if (route.originType === 'canton' || route.originType === 'region') {
        const originCanton = SWISS_CANTONS.find(c => {
          const cNorm = normalizeName(c.name)
          return routeOriginNorm.includes(cNorm) || cNorm.includes(routeOriginNorm)
        })
        
        if (originCanton && isPlaceInCanton(destination, originCanton.id)) {
          if (!matchedDestinations.includes(route.destination)) {
            matchedDestinations.push(route.destination)
          }
        }
      }
      
      // Lo mismo para el destino de la ruta
      if (route.destType === 'canton' || route.destType === 'region') {
        const destCanton = SWISS_CANTONS.find(c => {
          const cNorm = normalizeName(c.name)
          return routeDestNorm.includes(cNorm) || cNorm.includes(routeDestNorm)
        })
        
        if (destCanton && isPlaceInCanton(destination, destCanton.id)) {
          if (!matchedDestinations.includes(route.origin)) {
            matchedDestinations.push(route.origin)
          }
        }
      }
    } else {
      // Sin destino específico - agregar destinos de rutas
      if (!matchedDestinations.includes(route.destination)) {
        matchedDestinations.push(route.destination)
      }
      if (!matchedDestinations.includes(route.origin)) {
        matchedDestinations.push(route.origin)
      }
    }
  }
  
  // Sin destino especificado = siempre disponible (muestra sus destinos)
  if (!destination) {
    return {
      available: true,
      reason: matchedDestinations.length > 0 
        ? `Disponible hacia: ${matchedDestinations.slice(0, 4).join(', ')}`
        : 'Disponible',
      matchedDestinations
    }
  }
  
  // Con destino especificado = verificar si coincide
  if (matchedDestinations.length > 0) {
    return {
      available: true,
      reason: `Puede llevarte a: ${matchedDestinations.join(', ')}`,
      matchedDestinations
    }
  }
  
  return {
    available: false,
    reason: '',
    matchedDestinations: []
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')
    const radius = parseFloat(searchParams.get('radius') || '25')
    const destination = searchParams.get('destination')

    if (!lat || !lon) {
      return NextResponse.json({ success: false, error: 'Se requieren lat y lon' }, { status: 400 })
    }

    const clientLat = parseFloat(lat)
    const clientLon = parseFloat(lon)

    const cacheKey = `taxis-live:${clientLat.toFixed(4)}:${clientLon.toFixed(4)}:${radius}:${destination || 'any'}`
    const cached = await getCached(cacheKey)
    if (cached) {
      return NextResponse.json({ ...cached, fromCache: true })
    }

    // Obtener conductores con tracking activo
    const drivers = await db.taxiDriver.findMany({
      where: {
        isActive: true,
        trackingEnabled: true,
      },
      include: {
        city: true,
        canton: true,
        locations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        driverRoutes: {
          where: { isActive: true }
        },
        driverServiceZones: {
          where: { isActive: true }
        }
      }
    })

    const taxisWithLocation: any[] = []

    for (const driver of drivers) {
      if (!checkSchedule(driver.trackingMode, driver.trackingSchedule)) {
        continue
      }

      const lastLocation = driver.locations[0]
      if (!lastLocation) continue

      const locationAge = Date.now() - lastLocation.createdAt.getTime()
      if (locationAge > 2 * 60 * 1000) continue

      const distanceToClient = calculateDistance(
        clientLat, clientLon,
        lastLocation.latitude, lastLocation.longitude
      )

      if (distanceToClient > radius) continue

      let distanceFromBase = 0
      let isInBaseZone = false
      
      if (driver.city?.latitude && driver.city?.longitude) {
        distanceFromBase = calculateDistance(
          lastLocation.latitude, lastLocation.longitude,
          driver.city.latitude, driver.city.longitude
        )
        isInBaseZone = distanceFromBase <= 15
      }

      // Procesar zonas de servicio
      const serviceZones = driver.driverServiceZones.map(z => ({
        zoneName: z.zoneName,
        zoneType: z.zoneType,
        exclusions: JSON.parse(z.exclusions || '[]')
      }))

      // Procesar rutas
      const driverRoutes = driver.driverRoutes.map(r => ({
        origin: r.origin,
        destination: r.destination,
        originType: r.originType,
        destType: r.destType
      }))

      // Determinar disponibilidad
      let isAvailableForClient = false
      let availabilityReason = ''
      let matchedDestinations: string[] = []

      if (isInBaseZone) {
        isAvailableForClient = true
        availabilityReason = 'En su zona de trabajo'
        
        // Todos los destinos disponibles
        matchedDestinations = [
          driver.city?.name,
          ...serviceZones.map(z => z.zoneName),
          ...driverRoutes.map(r => r.destination),
          ...driverRoutes.map(r => r.origin)
        ].filter(Boolean) as string[]
        
        matchedDestinations = [...new Set(matchedDestinations)]
      } else {
        // Fuera de zona - verificar si puede llevar al destino
        const availability = checkDriverAvailability(
          destination,
          serviceZones,
          driverRoutes,
          driver.city?.name || '',
          driver.canton?.name || ''
        )
        
        isAvailableForClient = availability.available
        availabilityReason = availability.reason
        matchedDestinations = availability.matchedDestinations
      }

      if (!isAvailableForClient) continue

      taxisWithLocation.push({
        id: driver.id,
        name: driver.name,
        slug: driver.slug,
        // 🔒 Teléfono y WhatsApp NO se exponen en API pública (nDSG)
        // Los clientes deben contactar a través del perfil del conductor
        imageUrl: driver.imageUrl,
        rating: driver.rating,
        reviewCount: driver.reviewCount,
        isTopRated: driver.isTopRated,
        isVerified: driver.isVerified,
        vehicleType: driver.vehicleType,
        vehicleBrand: driver.vehicleBrand,
        vehicleModel: driver.vehicleModel,
        vehicleColor: driver.vehicleColor,
        vehicleYear: driver.vehicleYear,
        
        location: {
          latitude: lastLocation.latitude,
          longitude: lastLocation.longitude,
          timestamp: lastLocation.createdAt.toISOString(),
          age: Math.round(locationAge / 1000),
        },
        
        baseCity: {
          name: driver.city.name,
          slug: driver.city.slug,
          canton: driver.canton.name,
        },
        
        distanceToClient: Math.round(distanceToClient * 10) / 10,
        distanceFromBase: Math.round(distanceFromBase * 10) / 10,
        isInBaseZone,
        
        // Zonas y rutas
        serviceZones: serviceZones,
        routes: driverRoutes,
        
        matchedDestinations,
        availabilityReason,
        
        services: JSON.parse(driver.services),
        languages: JSON.parse(driver.languages),
      })
    }

    // Ordenar
    taxisWithLocation.sort((a, b) => {
      if (a.isInBaseZone && !b.isInBaseZone) return -1
      if (!a.isInBaseZone && b.isInBaseZone) return 1
      return a.distanceToClient - b.distanceToClient
    })

    const response = {
      success: true,
      data: taxisWithLocation,
      total: taxisWithLocation.length,
      clientLocation: { lat: clientLat, lon: clientLon },
      radius,
      timestamp: new Date().toISOString(),
    }

    await setCache(cacheKey, response, 10 * 1000)
    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching live taxis:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener taxis' }, { status: 500 })
  }
}
