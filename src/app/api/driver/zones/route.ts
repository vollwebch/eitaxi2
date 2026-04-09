import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// ============================================
// API para gestionar zonas de servicio del conductor
// ============================================

// GET - Obtener zonas del conductor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get('driverId')

    if (!driverId) {
      return NextResponse.json({
        success: false,
        error: 'driverId requerido'
      }, { status: 400 })
    }

    const zones = await db.driverServiceZone.findMany({
      where: { driverId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      zones: zones.map(z => ({
        id: z.id,
        zoneName: z.zoneName,
        zoneType: z.zoneType,
        zoneMode: z.zoneMode || 'service',  // "pickup" o "service"
        exclusions: JSON.parse(z.exclusions),
        isActive: z.isActive
      }))
    })

  } catch (error) {
    console.error('Error fetching zones:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener zonas'
    }, { status: 500 })
  }
}

// POST - Crear nueva zona
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
    const { driverId, zoneName, zoneType, zoneMode, exclusions } = body

    if (body.driverId && body.driverId !== session.driverId) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado' },
        { status: 403 }
      )
    }

    if (!driverId || !zoneName) {
      return NextResponse.json({
        success: false,
        error: 'Faltan datos requeridos'
      }, { status: 400 })
    }

    // Verificar que no existe ya esta zona CON EL MISMO MODO
    const existing = await db.driverServiceZone.findFirst({
      where: {
        driverId,
        zoneName,
        zoneMode: zoneMode || 'service'  // Mismo modo
      }
    })

    if (existing) {
      return NextResponse.json({
        success: false,
        error: 'Esta zona ya existe con el mismo tipo (recogida/destino)'
      }, { status: 400 })
    }

    const zone = await db.driverServiceZone.create({
      data: {
        driverId,
        zoneName,
        zoneType: zoneType || 'region',
        zoneMode: zoneMode || 'service',  // "pickup" o "service"
        exclusions: JSON.stringify(exclusions || []),
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      zone: {
        id: zone.id,
        zoneName: zone.zoneName,
        zoneType: zone.zoneType,
        zoneMode: zone.zoneMode,
        exclusions: JSON.parse(zone.exclusions),
        isActive: zone.isActive
      }
    })

  } catch (error) {
    console.error('Error creating zone:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al crear zona'
    }, { status: 500 })
  }
}

// DELETE - Eliminar zona
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
    const zoneId = searchParams.get('zoneId')

    if (!zoneId) {
      return NextResponse.json({
        success: false,
        error: 'zoneId requerido'
      }, { status: 400 })
    }

    await db.driverServiceZone.delete({
      where: { id: zoneId }
    })

    return NextResponse.json({
      success: true,
      message: 'Zona eliminada'
    })

  } catch (error) {
    console.error('Error deleting zone:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al eliminar zona'
    }, { status: 500 })
  }
}

// PUT - Actualizar zona (añadir/quitar exclusiones, cambiar zoneMode)
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
    const { zoneId, driverId, exclusions, zoneMode } = body

    if (body.driverId && body.driverId !== session.driverId) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado' },
        { status: 403 }
      )
    }

    if (!zoneId || !driverId) {
      return NextResponse.json({
        success: false,
        error: 'zoneId y driverId requeridos'
      }, { status: 400 })
    }

    // Verificar que la zona pertenece al conductor
    const existing = await db.driverServiceZone.findFirst({
      where: { id: zoneId, driverId }
    })

    if (!existing) {
      return NextResponse.json({
        success: false,
        error: 'Zona no encontrada'
      }, { status: 404 })
    }

    // Actualizar exclusiones y/o zoneMode
    const updateData: any = {}
    if (exclusions !== undefined) {
      updateData.exclusions = JSON.stringify(exclusions)
    }
    if (zoneMode !== undefined) {
      updateData.zoneMode = zoneMode
    }

    const zone = await db.driverServiceZone.update({
      where: { id: zoneId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      zone: {
        id: zone.id,
        zoneName: zone.zoneName,
        zoneType: zone.zoneType,
        zoneMode: zone.zoneMode,
        exclusions: JSON.parse(zone.exclusions),
        isActive: zone.isActive
      }
    })

  } catch (error) {
    console.error('Error updating zone:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al actualizar zona'
    }, { status: 500 })
  }
}
