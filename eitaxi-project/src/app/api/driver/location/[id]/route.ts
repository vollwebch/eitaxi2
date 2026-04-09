import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ============================================
// API para obtener ubicación del conductor
// El usuario consulta cada 5 segundos
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
        speed: lastLocation.speed,
        heading: lastLocation.heading,
        accuracy: lastLocation.accuracy,
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
