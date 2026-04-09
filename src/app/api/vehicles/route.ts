import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// GET - Listar vehículos de un conductor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get('driverId')

    if (!driverId) {
      return NextResponse.json(
        { success: false, error: 'ID del conductor requerido' },
        { status: 400 }
      )
    }

    const vehicles = await db.vehicle.findMany({
      where: { driverId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }]
    })

    return NextResponse.json({
      success: true,
      data: vehicles
    })
  } catch (error) {
    console.error('Error fetching vehicles:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener vehículos' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo vehículo
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
    const {
      driverId,
      vehicleType,
      brand,
      model,
      year,
      color,
      passengerCapacity,
      licensePlate,
      imageUrl,
      isPrimary
    } = body

    if (body.driverId && body.driverId !== session.driverId) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado' },
        { status: 403 }
      )
    }

    if (!driverId || !vehicleType) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios' },
        { status: 400 }
      )
    }

    // Si es el primer vehículo, marcarlo como principal
    const existingCount = await db.vehicle.count({
      where: { driverId }
    })

    const shouldBePrimary = isPrimary || existingCount === 0

    // Si este vehículo será el principal, quitar el flag de los otros
    if (shouldBePrimary) {
      await db.vehicle.updateMany({
        where: { driverId, isPrimary: true },
        data: { isPrimary: false }
      })
    }

    const vehicle = await db.vehicle.create({
      data: {
        driverId,
        vehicleType,
        brand: brand || null,
        model: model || null,
        year: year || null,
        color: color || null,
        passengerCapacity: passengerCapacity || null,
        licensePlate: licensePlate || null,
        imageUrl: imageUrl || null,
        isPrimary: shouldBePrimary,
        isActive: true
      }
    })

    // Actualizar vehicleTypes del conductor
    await updateDriverVehicleTypes(driverId)

    return NextResponse.json({
      success: true,
      data: vehicle
    })
  } catch (error) {
    console.error('Error creating vehicle:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear vehículo' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar vehículo
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
    const { id, driverId, ...updateData } = body

    if (body.driverId && body.driverId !== session.driverId) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado' },
        { status: 403 }
      )
    }

    if (!id || !driverId) {
      return NextResponse.json(
        { success: false, error: 'ID del vehículo y conductor requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el vehículo pertenece al conductor
    const existing = await db.vehicle.findFirst({
      where: { id, driverId }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Vehículo no encontrado' },
        { status: 404 }
      )
    }

    // Si se marca como principal, quitar el flag de los otros
    if (updateData.isPrimary) {
      await db.vehicle.updateMany({
        where: { driverId, isPrimary: true },
        data: { isPrimary: false }
      })
    }

    const vehicle = await db.vehicle.update({
      where: { id },
      data: {
        vehicleType: updateData.vehicleType,
        brand: updateData.brand,
        model: updateData.model,
        year: updateData.year,
        color: updateData.color,
        passengerCapacity: updateData.passengerCapacity,
        licensePlate: updateData.licensePlate,
        imageUrl: updateData.imageUrl,
        isPrimary: updateData.isPrimary,
        isActive: updateData.isActive
      }
    })

    // Actualizar vehicleTypes del conductor
    await updateDriverVehicleTypes(driverId)

    return NextResponse.json({
      success: true,
      data: vehicle
    })
  } catch (error) {
    console.error('Error updating vehicle:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar vehículo' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar vehículo
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
    const id = searchParams.get('id')
    const driverId = searchParams.get('driverId')

    if (!id || !driverId) {
      return NextResponse.json(
        { success: false, error: 'ID del vehículo y conductor requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el vehículo pertenece al conductor
    const existing = await db.vehicle.findFirst({
      where: { id, driverId }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Vehículo no encontrado' },
        { status: 404 }
      )
    }

    await db.vehicle.delete({
      where: { id }
    })

    // Si era el principal, asignar otro como principal
    if (existing.isPrimary) {
      const nextVehicle = await db.vehicle.findFirst({
        where: { driverId },
        orderBy: { createdAt: 'asc' }
      })

      if (nextVehicle) {
        await db.vehicle.update({
          where: { id: nextVehicle.id },
          data: { isPrimary: true }
        })
      }
    }

    // Actualizar vehicleTypes del conductor
    await updateDriverVehicleTypes(driverId)

    return NextResponse.json({
      success: true,
      message: 'Vehículo eliminado correctamente'
    })
  } catch (error) {
    console.error('Error deleting vehicle:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar vehículo' },
      { status: 500 }
    )
  }
}

// Función auxiliar para actualizar los vehicleTypes del conductor
async function updateDriverVehicleTypes(driverId: string) {
  const vehicles = await db.vehicle.findMany({
    where: { driverId, isActive: true },
    select: { vehicleType: true }
  })

  const vehicleTypes = [...new Set(vehicles.map(v => v.vehicleType))]
  const primaryVehicle = await db.vehicle.findFirst({
    where: { driverId, isPrimary: true }
  })

  await db.taxiDriver.update({
    where: { id: driverId },
    data: {
      vehicleTypes: JSON.stringify(vehicleTypes.length > 0 ? vehicleTypes : ['taxi']),
      vehicleType: primaryVehicle?.vehicleType || vehicleTypes[0] || 'taxi'
    }
  })
}
