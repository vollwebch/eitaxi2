import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCached, setCache } from '@/lib/cache'
import { driverCoversLocation } from '@/lib/geo'

/** Safely parse JSON strings – returns fallback on malformed input */
function safeJsonParse<T>(value: unknown, fallback: T): T {
  try {
    return JSON.parse(value as string) as T
  } catch {
    return fallback
  }
}

// Cache for 2 minutes
const CACHE_TTL = 2 * 60 * 1000

interface ServiceZone {
  zoneName: string;
  zoneType: string;
  zoneMode?: string;  // 'pickup' o 'service'
  exclusions: string[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cantonSlug = searchParams.get('canton')
    const citySlug = searchParams.get('city')
    const service = searchParams.get('service')
    const vehicleType = searchParams.get('vehicleType')

    // ── Cache: cachear la query base (sin filtros de ubicación) ──
    const cacheKey = `taxis:${vehicleType || 'all'}:${service || 'all'}`
    const cached = await getCached<any[]>(cacheKey)
    let baseDrivers: any[] = cached ? cached.data : null

    if (!baseDrivers) {
      const where: Record<string, unknown> = { isActive: true }
      if (vehicleType) {
        where.vehicleType = vehicleType
      }

      const drivers = await db.taxiDriver.findMany({
        where,
        include: {
          city: true,
          canton: true,
          driverServiceZones: true,
          _count: {
            select: { clientFavorites: true }
          }
        },
        orderBy: [
          { isTopRated: 'desc' },
          { subscription: 'desc' },
          { views: 'desc' },
        ],
      })

      baseDrivers = drivers.map(({ password: _pw, resetToken: _rt, resetTokenExpires: _rte, _count, ...driver }) => ({
        ...driver,
        _favoriteCount: _count.clientFavorites,
        services: safeJsonParse(driver.services, []) as string[],
        routes: safeJsonParse(driver.routes, []) as string[],
        languages: safeJsonParse(driver.languages, []) as string[],
        serviceZones: safeJsonParse(driver.serviceZones, []) as string[],
        driverServiceZones: driver.driverServiceZones.map(z => ({
          zoneName: z.zoneName,
          zoneType: z.zoneType,
          zoneMode: z.zoneMode || 'service',
          exclusions: safeJsonParse(z.exclusions || '[]', [])
        }))
      }))

      await setCache(cacheKey, baseDrivers, CACHE_TTL)
    }

    let parsedDrivers = baseDrivers

    // =========================================================================
    // NOTA: Sin parámetros de ubicación, mostrar TODOS los taxis
    // El filtro por zonas se aplica en /api/taxis/search cuando hay búsqueda
    // =========================================================================

    // Filter by service if specified
    if (service) {
      parsedDrivers = parsedDrivers.filter(d => d.services.includes(service))
    }

    // =========================================================================
    // FILTRAR POR ZONAS DE SERVICIO Y EXCLUSIONES
    // =========================================================================
    
    // Si se especifica un cantón por slug
    if (cantonSlug) {
      const canton = await db.canton.findUnique({ where: { slug: cantonSlug } })
      if (canton) {
        parsedDrivers = parsedDrivers.filter(driver => {
          const coverage = driverCoversLocation(
            { 
              city: driver.city, 
              canton: driver.canton, 
              operationRadius: driver.operationRadius, 
              coverageType: driver.coverageType, 
              latitude: driver.latitude, 
              longitude: driver.longitude 
            },
            '', // No hay ciudad específica
            canton.code,
            canton.country,
            driver.driverServiceZones as ServiceZone[],
            'pickup'  // Mostrar taxis que pueden recoger en este cantón
          )
          return coverage.covers
        })
      }
    }

    // Si se especifica una ciudad por slug
    if (citySlug) {
      const city = await db.city.findFirst({ 
        where: { slug: citySlug }, 
        include: { canton: true } 
      })
      if (city) {
        parsedDrivers = parsedDrivers.filter(driver => {
          const coverage = driverCoversLocation(
            { 
              city: driver.city, 
              canton: driver.canton, 
              operationRadius: driver.operationRadius, 
              coverageType: driver.coverageType, 
              latitude: driver.latitude, 
              longitude: driver.longitude 
            },
            city.name,
            city.canton.code,
            city.canton.country,
            driver.driverServiceZones as ServiceZone[],
            'pickup'  // Mostrar taxis que pueden recoger en esta ciudad
          )
          return coverage.covers
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: parsedDrivers,
      total: parsedDrivers.length,
    })
  } catch (error) {
    console.error('Error fetching taxi drivers:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener taxistas' },
      { status: 500 }
    )
  }
}
