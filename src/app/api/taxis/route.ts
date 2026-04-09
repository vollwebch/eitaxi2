import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCached, setCache } from '@/lib/cache'
import { driverCoversLocation } from '@/lib/geo'

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

    // Cargar conductores con sus zonas
    const where: Record<string, unknown> = { isActive: true }

    if (vehicleType) {
      where.vehicleType = vehicleType
    }

    let drivers = await db.taxiDriver.findMany({
      where,
      include: {
        city: true,
        canton: true,
        driverServiceZones: true
      },
      orderBy: [
        { isTopRated: 'desc' },
        { subscription: 'desc' },
        { views: 'desc' },
      ],
    })

    // Parse JSON fields y convertir zonas
    let parsedDrivers = drivers.map(driver => ({
      ...driver,
      services: JSON.parse(driver.services as string) as string[],
      routes: JSON.parse(driver.routes as string) as string[],
      languages: JSON.parse(driver.languages as string) as string[],
      serviceZones: JSON.parse(driver.serviceZones as string) as string[],
      driverServiceZones: driver.driverServiceZones.map(z => ({
        zoneName: z.zoneName,
        zoneType: z.zoneType,
        zoneMode: z.zoneMode || 'service',  // 'pickup' o 'service'
        exclusions: JSON.parse(z.exclusions as string || '[]')
      }))
    }))

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
