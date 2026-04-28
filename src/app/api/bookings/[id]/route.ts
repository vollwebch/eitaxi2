import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireClientAuth } from '@/lib/client-auth';

const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

// PATCH - Update booking status (driver or client)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, driverId } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Estado invalido. Valores permitidos: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify booking exists
    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        driver: {
          select: { id: true, name: true },
        },
        client: {
          select: { id: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Reserva no encontrada' }, { status: 404 });
    }

    // Try client authentication first (for cancellation)
    let clientSession = null;
    try {
      clientSession = await requireClientAuth(request);
    } catch {
      // No client session - proceed with driver auth check
    }

    if (clientSession) {
      // Client-side: only allow cancelling own pending bookings
      if (status !== 'cancelled') {
        return NextResponse.json(
          { success: false, error: 'Los clientes solo pueden cancelar reservas' },
          { status: 403 }
        );
      }

      if (!booking.clientId || booking.clientId !== clientSession.clientId) {
        return NextResponse.json(
          { success: false, error: 'No autorizado para modificar esta reserva' },
          { status: 403 }
        );
      }

      if (booking.status !== 'pending') {
        return NextResponse.json(
          { success: false, error: 'Solo se pueden cancelar reservas pendientes' },
          { status: 400 }
        );
      }

      // Update booking status (cancelled stays in bookings list, NOT moved to trash)
      const updated = await db.booking.update({
        where: { id },
        data: { status: 'cancelled' },
        include: {
          driver: {
            select: { id: true, name: true, phone: true },
          },
        },
      });

      // Create a notification for the client about the cancellation
      await db.clientNotification.create({
        data: {
          clientId: clientSession.clientId,
          type: 'booking_status',
          title: 'Reserva cancelada',
          message: `Tu reserva ${booking.reference} con ${booking.driver.name} ha sido cancelada.`,
          link: `/cuenta?tab=reservas&booking=${booking.id}`,
          bookingId: booking.id,
        },
      });

      // Notify the driver about the cancellation
      await db.driverNotification.create({
        data: {
          driverId: booking.driverId,
          type: 'booking_cancelled',
          title: 'Reserva cancelada',
          message: `El cliente ha cancelado la reserva ${booking.reference}.`,
          link: `/dashboard/${booking.driverId}?tab=bookings&booking=${booking.id}`,
          bookingId: booking.id,
        },
      });

      return NextResponse.json({ success: true, data: updated });
    }

    // Driver-side: verify the driver owns the booking
    if (driverId && driverId !== booking.driverId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado para actualizar esta reserva' },
        { status: 403 }
      );
    }

    // Update status
    const updateData: any = { status };

    const updated = await db.booking.update({
      where: { id },
      data: updateData,
    });

    // Notificar al cliente del cambio de estado
    if (booking.clientId) {
      const driverName = booking.driver?.name || 'el conductor';
      const ref = booking.reference;
      const notificationMap: Record<string, { title: string; message: string }> = {
        confirmed: {
          title: 'Reserva confirmada',
          message: `${driverName} ha confirmado tu reserva ${ref}.`,
        },
        completed: {
          title: 'Viaje completado',
          message: `${driverName} ha completado tu viaje ${ref}.`,
        },
        cancelled: {
          title: 'Reserva rechazada',
          message: `${driverName} ha rechazado tu reserva ${ref}.`,
        },
      };
      const notif = notificationMap[status];
      if (notif) {
        await db.clientNotification.create({
          data: {
            clientId: booking.clientId,
            type: 'booking_status',
            title: notif.title,
            message: notif.message,
            link: `/cuenta?tab=reservas&booking=${booking.id}`,
            bookingId: booking.id,
          },
        });
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update booking error:', error);
    return NextResponse.json({ success: false, error: 'Error al actualizar la reserva' }, { status: 500 });
  }
}
