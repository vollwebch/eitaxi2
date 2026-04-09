import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// ============================================
// GET /api/driver/data-export
// Exportar todos los datos personales del conductor
// Cumple nDSG Art. 25 (Derecho de acceso) y Art. 28 (Portabilidad)
// ============================================

export async function GET(request: NextRequest) {
  try {
    let session
    try {
      session = await requireAuth(request)
    } catch {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    const driverId = session.driverId

    // Obtener todos los datos del conductor
    const driver = await db.taxiDriver.findUnique({
      where: { id: driverId },
      include: {
        city: true,
        canton: true,
        driverRoutes: true,
        schedules: true,
        vehicles: true,
        driverServiceZones: true,
        locations: {
          orderBy: { createdAt: 'desc' },
          take: 100, // Solo las últimas 100 ubicaciones
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!driver) {
      return NextResponse.json(
        { success: false, error: 'Conductor no encontrado' },
        { status: 404 }
      )
    }

    // Construir el paquete de datos exportables
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        format: 'eitaxi-data-export-v1',
        legalBasis: 'nDSG Art. 25, Art. 28',
        driverId: driver.id,
      },
      account: {
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        whatsapp: driver.whatsapp,
        address: driver.address,
        city: driver.city?.name || null,
        canton: driver.canton?.name || null,
        imageUrl: driver.imageUrl,
        experience: driver.experience,
        description: driver.description,
        createdAt: driver.createdAt.toISOString(),
        updatedAt: driver.updatedAt.toISOString(),
        lastLoginAt: driver.lastLoginAt?.toISOString() || null,
        views: driver.views,
      },
      vehicles: driver.vehicles.map(v => ({
        type: v.vehicleType,
        brand: v.brand,
        model: v.model,
        year: v.year,
        color: v.color,
        passengerCapacity: v.passengerCapacity,
        licensePlate: v.licensePlate,
        isPrimary: v.isPrimary,
      })),
      serviceInfo: {
        services: JSON.parse(driver.services as string || '[]'),
        languages: JSON.parse(driver.languages as string || '[]'),
        vehicleTypes: JSON.parse(driver.vehicleTypes as string || '[]'),
        isAvailable24h: driver.isAvailable24h,
        basePrice: driver.basePrice,
        pricePerKm: driver.pricePerKm,
        hourlyRate: driver.hourlyRate,
        website: driver.website,
        instagram: driver.instagram,
        facebook: driver.facebook,
        subscription: driver.subscription,
      },
      serviceZones: driver.driverServiceZones.map(z => ({
        zoneName: z.zoneName,
        zoneType: z.zoneType,
        zoneMode: z.zoneMode,
        exclusions: JSON.parse(z.exclusions as string || '[]'),
        isActive: z.isActive,
      })),
      routes: driver.driverRoutes.map(r => ({
        origin: r.origin,
        destination: r.destination,
        price: r.price,
        isActive: r.isActive,
      })),
      schedules: driver.schedules.map(s => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        isActive: s.isActive,
      })),
      gpsTracking: {
        trackingEnabled: driver.trackingEnabled,
        trackingMode: driver.trackingMode,
        trackingSchedule: driver.trackingSchedule,
        lastLocationAt: driver.lastLocationAt?.toISOString() || null,
        recentLocations: driver.locations.map(loc => ({
          latitude: loc.latitude,
          longitude: loc.longitude,
          speed: loc.speed,
          heading: loc.heading,
          accuracy: loc.accuracy,
          timestamp: loc.createdAt.toISOString(),
        })),
      },
      reviews: {
        received: driver.reviews.map(r => ({
          rating: r.rating,
          comment: r.comment,
          name: r.name,
          tripRoute: r.tripRoute,
          approved: r.approved,
          createdAt: r.createdAt.toISOString(),
        })),
      },
    }

    return NextResponse.json({
      success: true,
      data: exportData,
    })

  } catch (error) {
    console.error('Error exporting driver data:', error)
    return NextResponse.json(
      { success: false, error: 'Error al exportar datos' },
      { status: 500 }
    )
  }
}
