import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireClientAuth } from '@/lib/client-auth'
import { requireAuth } from '@/lib/auth'

// GET /api/bookings?clientId=xxx OR /api/bookings?driverId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const driverId = searchParams.get('driverId')

    if (clientId) {
      // Client listing their own bookings
      const session = await requireClientAuth(request)
      if (session.clientId !== clientId) {
        return NextResponse.json(
          { success: false, error: 'Acceso no autorizado' },
          { status: 403 }
        )
      }

      const bookings = await db.booking.findMany({
        where: { clientId },
        include: {
          client: { select: { id: true, name: true } },
          driver: { select: { id: true, name: true, imageUrl: true, vehicleType: true } },
          _count: { select: { messages: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({ success: true, data: bookings })
    }

    if (driverId) {
      // Driver listing their own bookings
      const session = await requireAuth(request)
      if (session.driverId !== driverId) {
        return NextResponse.json(
          { success: false, error: 'Acceso no autorizado' },
          { status: 403 }
        )
      }

      const bookings = await db.booking.findMany({
        where: { driverId },
        include: {
          client: { select: { id: true, name: true, avatarUrl: true } },
          driver: { select: { id: true, name: true, imageUrl: true, vehicleType: true } },
          _count: { select: { messages: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({ success: true, data: bookings })
    }

    return NextResponse.json(
      { success: false, error: 'Se requiere clientId o driverId' },
      { status: 400 }
    )
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener reservas' },
      { status: 500 }
    )
  }
}

// POST /api/bookings - Create a new booking
export async function POST(request: NextRequest) {
  try {
    const session = await requireClientAuth(request)

    const body = await request.json()
    const {
      driverId,
      pickupAddress,
      pickupLat,
      pickupLon,
      destAddress,
      destLat,
      destLon,
      scheduledFor,
      passengerCount,
      price,
      notes,
    } = body

    // Validate required fields
    if (!driverId) {
      return NextResponse.json(
        { success: false, error: 'El conductor es obligatorio' },
        { status: 400 }
      )
    }

    if (!pickupAddress || pickupAddress.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'La dirección de recogida es obligatoria' },
        { status: 400 }
      )
    }

    // Check driver exists
    const driver = await db.taxiDriver.findUnique({
      where: { id: driverId },
      select: { id: true, name: true },
    })

    if (!driver) {
      return NextResponse.json(
        { success: false, error: 'Conductor no encontrado' },
        { status: 404 }
      )
    }

    // Create booking
    const booking = await db.booking.create({
      data: {
        clientId: session.clientId,
        driverId,
        status: 'pending',
        pickupAddress: pickupAddress.trim(),
        pickupLat: pickupLat ?? null,
        pickupLon: pickupLon ?? null,
        destAddress: destAddress?.trim() || null,
        destLat: destLat ?? null,
        destLon: destLon ?? null,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        passengerCount: passengerCount ?? 1,
        price: price ?? null,
        notes: notes?.trim() || null,
      },
      include: {
        client: { select: { id: true, name: true } },
        driver: { select: { id: true, name: true, imageUrl: true, vehicleType: true } },
      },
    })

    // Create notification for the client
    await db.notification.create({
      data: {
        clientId: session.clientId,
        title: 'Reserva creada',
        body: `Tu reserva con ${driver.name} ha sido creada exitosamente. Estado: Pendiente.`,
        type: 'booking_created',
        link: `/bookings/${booking.id}`,
        metadata: JSON.stringify({ bookingId: booking.id, driverId, driverName: driver.name }),
      },
    })

    return NextResponse.json({ success: true, data: booking })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear la reserva' },
      { status: 500 }
    )
  }
}
