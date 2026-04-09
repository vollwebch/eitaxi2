import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// ============================================
// API para obtener ubicación del conductor
// Protegido: el conductor solo puede ver su ubicación si está autenticado
// Para clientes: solo se muestra si el conductor tiene tracking activo
// ============================================

// Rate limiter simple por IP
const locationRateLimiter = new Map<string, { count: number; resetAt: number }>();
const LOCATION_RATE_LIMIT = 60; // 60 peticiones por minuto
const LOCATION_RATE_WINDOW = 60 * 1000; // 1 minuto

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    const record = locationRateLimiter.get(clientIp);
    if (record) {
      if (now > record.resetAt) {
        locationRateLimiter.set(clientIp, { count: 1, resetAt: now + LOCATION_RATE_WINDOW });
      } else if (record.count >= LOCATION_RATE_LIMIT) {
        return NextResponse.json({
          success: false,
          error: 'Demasiadas peticiones'
        }, { status: 429 })
      } else {
        record.count++;
      }
    } else {
      locationRateLimiter.set(clientIp, { count: 1, resetAt: now + LOCATION_RATE_WINDOW });
    }

    const { id: driverId } = await params

    if (!driverId) {
      return NextResponse.json({
        success: false,
        error: 'ID del conductor requerido'
      }, { status: 400 })
    }

    // Obtener conductor con info de tracking
    const driver = await db.taxiDriver.findUnique({
      where: { id: driverId },
      select: {
        id: true,
        name: true,
        trackingEnabled: true,
        trackingMode: true,
        trackingSchedule: true,
        lastLocationAt: true,
        vehicleColor: true,
        vehicleBrand: true,
        vehicleModel: true,
        vehicleYear: true,
      }
    })

    if (!driver) {
      return NextResponse.json({
        success: false,
        error: 'Conductor no encontrado'
      }, { status: 404 })
    }

    // Verificar si tracking está activo Y dentro de horario
    let isWithinSchedule = false
    if (driver.trackingEnabled) {
      isWithinSchedule = checkSchedule(driver.trackingMode, driver.trackingSchedule)
    }

    // Si no está activo o fuera de horario
    if (!driver.trackingEnabled || !isWithinSchedule) {
      return NextResponse.json({
        success: true,
        trackingActive: false,
        driver: {
          id: driver.id,
          name: driver.name,
          vehicle: {
            color: driver.vehicleColor,
            brand: driver.vehicleBrand,
            model: driver.vehicleModel,
            year: driver.vehicleYear
          }
        },
        location: null,
        message: driver.trackingEnabled 
          ? 'El conductor no está disponible en este horario' 
          : 'El conductor no tiene el GPS activado'
      })
    }

    // Obtener última ubicación
    const lastLocation = await db.driverLocation.findFirst({
      where: { driverId },
      orderBy: { createdAt: 'desc' }
    })

    if (!lastLocation) {
      return NextResponse.json({
        success: true,
        trackingActive: true,
        driver: {
          id: driver.id,
          name: driver.name,
          vehicle: {
            color: driver.vehicleColor,
            brand: driver.vehicleBrand,
            model: driver.vehicleModel,
            year: driver.vehicleYear
          }
        },
        location: null,
        message: 'Esperando ubicación del conductor...'
      })
    }

    // Verificar si la ubicación es reciente (menos de 30 segundos)
    const locationAge = Date.now() - lastLocation.createdAt.getTime()
    const isRecent = locationAge < 30000 // 30 segundos

    return NextResponse.json({
      success: true,
      trackingActive: true,
      driver: {
        id: driver.id,
        name: driver.name,
        vehicle: {
          color: driver.vehicleColor,
          brand: driver.vehicleBrand,
          model: driver.vehicleModel,
          year: driver.vehicleYear
        }
      },
      location: {
        latitude: lastLocation.latitude,
        longitude: lastLocation.longitude,
        timestamp: lastLocation.createdAt.toISOString(),
        age: Math.round(locationAge / 1000), // segundos
        isRecent
      }
    })

  } catch (error) {
    console.error('Error getting location:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener ubicación'
    }, { status: 500 })
  }
}

// Verificar si está dentro del horario
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
