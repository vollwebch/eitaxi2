import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// ============================================
// API para gestionar rutas habituales del conductor
// ============================================

// GET - Obtener rutas del conductor
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

    const routes = await db.driverRoute.findMany({
      where: { driverId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      routes: routes.map(r => ({
        id: r.id,
        origin: r.origin,
        destination: r.destination,
        originType: r.originType,
        destType: r.destType,
        price: r.price,
        isActive: r.isActive
      }))
    })

  } catch (error) {
    console.error('Error fetching routes:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener rutas'
    }, { status: 500 })
  }
}

// POST - Crear nueva ruta
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
    const { driverId, origin, destination, originType, destType, price } = body

    if (body.driverId && body.driverId !== session.driverId) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado' },
        { status: 403 }
      )
    }

    if (!driverId || !origin || !destination) {
      return NextResponse.json({
        success: false,
        error: 'Faltan datos requeridos'
      }, { status: 400 })
    }

    const existing = await db.driverRoute.findFirst({
      where: { driverId, origin, destination }
    })

    if (existing) {
      return NextResponse.json({
        success: false,
        error: 'Esta ruta ya existe'
      }, { status: 400 })
    }

    const route = await db.driverRoute.create({
      data: {
        driverId,
        origin,
        destination,
        originType: originType || 'city',
        destType: destType || 'city',
        price: price || null,
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      route: {
        id: route.id,
        origin: route.origin,
        destination: route.destination,
        originType: route.originType,
        destType: route.destType,
        price: route.price,
        isActive: route.isActive
      }
    })

  } catch (error) {
    console.error('Error creating route:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al crear ruta'
    }, { status: 500 })
  }
}

// PUT - Actualizar ruta
export async function PUT(request: NextRequest) {
  try {
    try {
      await requireAuth(request)
    } catch {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { routeId, isActive } = body

    if (!routeId) {
      return NextResponse.json({
        success: false,
        error: 'routeId requerido'
      }, { status: 400 })
    }

    const route = await db.driverRoute.update({
      where: { id: routeId },
      data: { isActive: isActive ?? true }
    })

    return NextResponse.json({
      success: true,
      route: {
        id: route.id,
        origin: route.origin,
        destination: route.destination,
        originType: route.originType,
        destType: route.destType,
        price: route.price,
        isActive: route.isActive
      }
    })

  } catch (error) {
    console.error('Error updating route:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al actualizar ruta'
    }, { status: 500 })
  }
}

// DELETE - Eliminar ruta
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
    const routeId = searchParams.get('routeId')

    if (!routeId) {
      return NextResponse.json({
        success: false,
        error: 'routeId requerido'
      }, { status: 400 })
    }

    await db.driverRoute.delete({
      where: { id: routeId }
    })

    return NextResponse.json({
      success: true,
      message: 'Ruta eliminada'
    })

  } catch (error) {
    console.error('Error deleting route:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al eliminar ruta'
    }, { status: 500 })
  }
}
