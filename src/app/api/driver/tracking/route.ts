import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// ============================================
// API para configurar tracking del conductor
// Activar/desactivar GPS y configurar horarios
// ============================================

// GET - Obtener configuración actual (requiere autenticación del propio conductor)
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

    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get('driverId') || session.driverId

    if (!driverId) {
      return NextResponse.json({
        success: false,
        error: 'driverId requerido'
      }, { status: 400 })
    }

    // Solo el propio conductor puede ver su config de tracking
    if (driverId !== session.driverId) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado' },
        { status: 403 }
      )
    }

    const driver = await db.taxiDriver.findUnique({
      where: { id: driverId },
      select: {
        id: true,
        name: true,
        trackingEnabled: true,
        trackingMode: true,
        trackingSchedule: true,
        lastLocationAt: true,
      }
    })

    if (!driver) {
      return NextResponse.json({
        success: false,
        error: 'Conductor no encontrado'
      }, { status: 404 })
    }

    // Parsear schedule
    let schedule = []
    try {
      schedule = JSON.parse(driver.trackingSchedule)
    } catch {
      schedule = []
    }

    return NextResponse.json({
      success: true,
      tracking: {
        enabled: driver.trackingEnabled,
        mode: driver.trackingMode,
        schedule: schedule,
        lastLocationAt: driver.lastLocationAt?.toISOString() || null
      }
    })

  } catch (error) {
    console.error('Error getting tracking config:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener configuración'
    }, { status: 500 })
  }
}

// PUT - Actualizar configuración
export async function PUT(request: NextRequest) {
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
    const { driverId, enabled, mode, schedule } = body

    if (body.driverId && body.driverId !== session.driverId) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado' },
        { status: 403 }
      )
    }

    if (!driverId) {
      return NextResponse.json({
        success: false,
        error: 'driverId requerido'
      }, { status: 400 })
    }

    // Validar mode
    if (mode && !['always', 'schedule'].includes(mode)) {
      return NextResponse.json({
        success: false,
        error: 'mode debe ser "always" o "schedule"'
      }, { status: 400 })
    }

    // Validar schedule si viene
    if (schedule) {
      if (!Array.isArray(schedule)) {
        return NextResponse.json({
          success: false,
          error: 'schedule debe ser un array'
        }, { status: 400 })
      }
      
      // Validar cada elemento
      for (const item of schedule) {
        if (typeof item.day !== 'number' || item.day < 0 || item.day > 6) {
          return NextResponse.json({
            success: false,
            error: 'Cada item debe tener day (0-6)'
          }, { status: 400 })
        }
        if (!item.start || !item.end) {
          return NextResponse.json({
            success: false,
            error: 'Cada item debe tener start y end (HH:MM)'
          }, { status: 400 })
        }
      }
    }

    // Construir objeto de actualización
    const updateData: {
      trackingEnabled?: boolean;
      trackingMode?: string;
      trackingSchedule?: string;
    } = {}
    
    if (typeof enabled === 'boolean') updateData.trackingEnabled = enabled
    if (mode) updateData.trackingMode = mode
    if (schedule) updateData.trackingSchedule = JSON.stringify(schedule)

    // Actualizar
    const driver = await db.taxiDriver.update({
      where: { id: driverId },
      data: updateData,
      select: {
        id: true,
        trackingEnabled: true,
        trackingMode: true,
        trackingSchedule: true,
      }
    })

    return NextResponse.json({
      success: true,
      tracking: {
        enabled: driver.trackingEnabled,
        mode: driver.trackingMode,
        schedule: JSON.parse(driver.trackingSchedule)
      }
    })

  } catch (error) {
    console.error('Error updating tracking config:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al actualizar configuración'
    }, { status: 500 })
  }
}
