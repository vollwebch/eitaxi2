import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// ============================================
// DELETE /api/driver/delete-account
// Eliminar cuenta y todos los datos personales
// Cumple nDSG Art. 27 (Derecho de supresión)
// ============================================

export async function DELETE(request: NextRequest) {
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

    // Verificar que el conductor existe
    const driver = await db.taxiDriver.findUnique({
      where: { id: driverId },
      select: { id: true, name: true, email: true },
    })

    if (!driver) {
      return NextResponse.json(
        { success: false, error: 'Conductor no encontrado' },
        { status: 404 }
      )
    }

    // Eliminar todos los datos asociados en orden (por dependencias)
    // 1. Ubicaciones GPS
    await db.driverLocation.deleteMany({
      where: { driverId },
    }).catch(() => {})

    // 2. Reseñas recibidas
    await db.review.deleteMany({
      where: { driverId },
    }).catch(() => {})

    // 3. Rutas del conductor
    await db.driverRoute.deleteMany({
      where: { driverId },
    }).catch(() => {})

    // 4. Horarios
    await db.driverSchedule.deleteMany({
      where: { driverId },
    }).catch(() => {})

    // 5. Zonas de servicio
    await db.driverServiceZone.deleteMany({
      where: { driverId },
    }).catch(() => {})

    // 6. Vehículos
    await db.vehicle.deleteMany({
      where: { driverId },
    }).catch(() => {})

    // 7. El conductor (perfil principal)
    await db.taxiDriver.delete({
      where: { id: driverId },
    })

    return NextResponse.json({
      success: true,
      message: 'Cuenta y todos los datos personales eliminados correctamente',
      deletedAt: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar la cuenta' },
      { status: 500 }
    )
  }
}
