import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireClientAuth } from '@/lib/client-auth'
import { requireAuth } from '@/lib/auth'

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

// GET /api/bookings/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Try client auth first, then driver auth
    let session:
      | { type: 'client'; clientId: string }
      | { type: 'driver'; driverId: string }

    try {
      const clientSession = await requireClientAuth(request)
      session = { type: 'client', clientId: clientSession.clientId }
    } catch {
      try {
        const driverSession = await requireAuth(request)
        session = { type: 'driver', driverId: driverSession.driverId }
      } catch {
        return NextResponse.json(
          { success: false, error: 'No autenticado' },
          { status: 401 }
        )
      }
    }

    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, avatarUrl: true, phone: true } },
        driver: { select: { id: true, name: true, imageUrl: true, vehicleType: true, phone: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada' },
        { status: 404 }
      )
    }

    // Verify authorization
    if (session.type === 'client' && booking.clientId !== session.clientId) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado' },
        { status: 403 }
      )
    }

    if (session.type === 'driver' && booking.driverId !== session.driverId) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado' },
        { status: 403 }
      )
    }

    return NextResponse.json({ success: true, data: booking })
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener la reserva' },
      { status: 500 }
    )
  }
}

// PUT /api/bookings/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Try client auth first, then driver auth
    let session:
      | { type: 'client'; clientId: string }
      | { type: 'driver'; driverId: string }

    try {
      const clientSession = await requireClientAuth(request)
      session = { type: 'client', clientId: clientSession.clientId }
    } catch {
      try {
        const driverSession = await requireAuth(request)
        session = { type: 'driver', driverId: driverSession.driverId }
      } catch {
        return NextResponse.json(
          { success: false, error: 'No autenticado' },
          { status: 401 }
        )
      }
    }

    const body = await request.json()
    const { status, notes } = body

    // Get existing booking
    const existing = await db.booking.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true } },
        driver: { select: { id: true, name: true } },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada' },
        { status: 404 }
      )
    }

    // Verify authorization
    if (session.type === 'client' && existing.clientId !== session.clientId) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado' },
        { status: 403 }
      )
    }

    if (session.type === 'driver' && existing.driverId !== session.driverId) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado' },
        { status: 403 }
      )
    }

    // Validate status transition
    const updateData: Record<string, unknown> = {}
    let statusChanged = false

    if (status && status !== existing.status) {
      const allowed = VALID_TRANSITIONS[existing.status] || []
      if (!allowed.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Transición de estado no válida: ${existing.status} → ${status}`,
          },
          { status: 400 }
        )
      }
      updateData.status = status
      statusChanged = true
    }

    if (notes !== undefined) {
      updateData.notes = notes?.trim() || null
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay cambios para actualizar' },
        { status: 400 }
      )
    }

    // Update booking
    const updated = await db.booking.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, name: true } },
        driver: { select: { id: true, name: true, imageUrl: true, vehicleType: true } },
      },
    })

    // Create notification for client if status changed
    if (statusChanged) {
      const statusLabels: Record<string, string> = {
        confirmed: 'Confirmada',
        completed: 'Completada',
        cancelled: 'Cancelada',
      }

      await db.notification.create({
        data: {
          clientId: existing.clientId,
          title: 'Estado de reserva actualizado',
          body: `Tu reserva con ${existing.driver.name} ha sido actualizada a: ${statusLabels[status] || status}.`,
          type: 'booking_status_changed',
          link: `/bookings/${id}`,
          metadata: JSON.stringify({
            bookingId: id,
            driverId: existing.driverId,
            driverName: existing.driver.name,
            oldStatus: existing.status,
            newStatus: status,
          }),
        },
      })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar la reserva' },
      { status: 500 }
    )
  }
}
