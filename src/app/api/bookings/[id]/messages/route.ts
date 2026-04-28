import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireClientAuth } from '@/lib/client-auth';

// GET - List messages for a booking (ordered by createdAt asc)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireClientAuth(request);
    const { id: bookingId } = await params;

    // Verify booking exists and belongs to this client
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: { clientId: true },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    if (!booking.clientId || booking.clientId !== session.clientId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado para ver estos mensajes' },
        { status: 403 }
      );
    }

    const messages = await db.message.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'asc' },
    });

    // Marcar mensajes del conductor como leídos
    await db.message.updateMany({
      where: {
        bookingId,
        sender: 'driver',
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, data: messages });
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }
    console.error('Get messages error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener mensajes' },
      { status: 500 }
    );
  }
}

// POST - Create a message for a booking
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireClientAuth(request);
    const { id: bookingId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'El contenido del mensaje es requerido' },
        { status: 400 }
      );
    }

    // Verify booking exists and belongs to this client
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: { clientId: true, driverId: true, customerName: true },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    if (!booking.clientId || booking.clientId !== session.clientId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado para enviar mensajes en esta reserva' },
        { status: 403 }
      );
    }

    const message = await db.message.create({
      data: {
        bookingId,
        sender: 'customer',
        content: content.trim(),
      },
    });

    // Notify the driver about the new message
    if (booking.driverId) {
      const customerName = booking.customerName || 'Un cliente';
      const preview = content.trim().length > 60 ? content.trim().substring(0, 60) + '...' : content.trim();
      await db.driverNotification.create({
        data: {
          driverId: booking.driverId,
          type: 'new_message',
          title: `Nuevo mensaje de ${customerName}`,
          message: preview,
          link: `/dashboard/${booking.driverId}?tab=chat&booking=${bookingId}`,
          bookingId,
        },
      });
    }

    return NextResponse.json({ success: true, data: message });
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }
    console.error('Create message error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al enviar mensaje' },
      { status: 500 }
    );
  }
}
