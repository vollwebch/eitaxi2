import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// ============================================
// API para guardar ubicación del conductor
// El conductor envía su GPS cada 5 segundos
// ============================================

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { driverId, latitude, longitude, speed, heading, accuracy } = body

    if (body.driverId && body.driverId !== session.driverId) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado' },
        { status: 403 }
      )
    }

    if (!driverId || !latitude || !longitude) {
      return NextResponse.json({
        success: false,
        error: 'Faltan datos requeridos: driverId, latitude, longitude'
      }, { status: 400 })
    }

    // Verificar que el conductor existe y tiene tracking activado
    const driver = await db.taxiDriver.findUnique({
      where: { id: driverId },
      select: { 
        id: true, 
        trackingEnabled: true, 
        trackingMode: true,
        trackingSchedule: true 
      }
    })

    if (!driver) {
      return NextResponse.json({
        success: false,
        error: 'Conductor no encontrado'
      }, { status: 404 })
    }

    // Verificar si está dentro del horario permitido
    if (driver.trackingEnabled) {
      const isWithinSchedule = checkSchedule(driver.trackingMode, driver.trackingSchedule)
      
      if (!isWithinSchedule) {
        return NextResponse.json({
          success: true,
          message: 'Fuera del horario de tracking',
          trackingActive: false
        })
      }
    }

    if (!driver.trackingEnabled) {
      return NextResponse.json({
        success: true,
        message: 'Tracking desactivado',
        trackingActive: false
      })
    }

    // Guardar ubicación
    const location = await db.driverLocation.create({
      data: {
        driverId,
        latitude,
        longitude,
        speed: speed || null,
        heading: heading || null,
        accuracy: accuracy || null,
      }
    })

    // Actualizar lastLocationAt del conductor
    await db.taxiDriver.update({
      where: { id: driverId },
      data: { lastLocationAt: new Date() }
    })

    // Limpiar ubicaciones antiguas (más de 1 hora)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    await db.driverLocation.deleteMany({
      where: {
        driverId,
        createdAt: { lt: oneHourAgo }
      }
    })

    return NextResponse.json({
      success: true,
      location: {
        id: location.id,
        latitude: location.latitude,
        longitude: location.longitude,
        createdAt: location.createdAt
      },
      trackingActive: true
    })

  } catch (error) {
    console.error('Error saving location:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al guardar ubicación'
    }, { status: 500 })
  }
}

// DELETE - Limpiar todas las ubicaciones del conductor (cuando desactiva GPS)
export async function DELETE(request: NextRequest) {
  try {
    try {
      await requireAuth(request)
    } catch {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get('driverId')

    if (!driverId) {
      return NextResponse.json({
        success: false,
        error: 'driverId requerido'
      }, { status: 400 })
    }

    // Eliminar todas las ubicaciones del conductor
    await db.driverLocation.deleteMany({
      where: { driverId }
    })

    // Limpiar lastLocationAt
    await db.taxiDriver.update({
      where: { id: driverId },
      data: { lastLocationAt: null }
    })

    return NextResponse.json({
      success: true,
      message: 'Ubicaciones eliminadas'
    })

  } catch (error) {
    console.error('Error clearing locations:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al eliminar ubicaciones'
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
    const currentDay = now.getDay() // 0 = domingo, 1 = lunes, etc.
    const currentTime = now.toTimeString().slice(0, 5) // "HH:MM"
    
    const todaySchedule = schedule.find((s: { day: number; start: string; end: string }) => s.day === currentDay)
    
    if (!todaySchedule) return false
    
    return currentTime >= todaySchedule.start && currentTime <= todaySchedule.end
  } catch {
    return true
  }
}
