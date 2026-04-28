import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireClientAuth } from '@/lib/client-auth';

// GET - List client notifications (ordered by createdAt desc, limit 50)
export async function GET(request: NextRequest) {
  try {
    const session = await requireClientAuth(request);

    const notifications = await db.clientNotification.findMany({
      where: { clientId: session.clientId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, data: notifications });
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener notificaciones' },
      { status: 500 }
    );
  }
}

// PATCH - Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireClientAuth(request);
    const body = await request.json();
    const { id, isRead } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'El ID de la notificacion es requerido' },
        { status: 400 }
      );
    }

    if (isRead === undefined || typeof isRead !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'El campo isRead es requerido y debe ser booleano' },
        { status: 400 }
      );
    }

    // Verify the notification belongs to this client
    const notification = await db.clientNotification.findUnique({
      where: { id },
      select: { clientId: true },
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notificacion no encontrada' },
        { status: 404 }
      );
    }

    if (notification.clientId !== session.clientId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado para modificar esta notificacion' },
        { status: 403 }
      );
    }

    const updated = await db.clientNotification.update({
      where: { id },
      data: { isRead },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }
    console.error('Update notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar notificacion' },
      { status: 500 }
    );
  }
}

// DELETE - Delete one or all notifications
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireClientAuth(request);
    const body = await request.json();
    const { id, all } = body;

    if (all) {
      // Delete all notifications for this client
      const result = await db.clientNotification.deleteMany({
        where: { clientId: session.clientId },
      });
      return NextResponse.json({ success: true, deletedCount: result.count });
    }

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'El ID de la notificacion es requerido' },
        { status: 400 }
      );
    }

    // Verify ownership
    const notification = await db.clientNotification.findUnique({
      where: { id },
      select: { clientId: true },
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notificacion no encontrada' },
        { status: 404 }
      );
    }

    if (notification.clientId !== session.clientId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado para eliminar esta notificacion' },
        { status: 403 }
      );
    }

    await db.clientNotification.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }
    console.error('Delete notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar notificacion' },
      { status: 500 }
    );
  }
}

// POST - Create notification
export async function POST(request: NextRequest) {
  try {
    const session = await requireClientAuth(request);
    const body = await request.json();
    const { type, title, message, link, data, bookingId } = body;

    // Force ownership: always use session.clientId, ignore body.clientId
    const clientId = session.clientId;

    if (!type || typeof type !== 'string') {
      return NextResponse.json(
        { success: false, error: 'El tipo de notificacion es requerido' },
        { status: 400 }
      );
    }

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { success: false, error: 'El titulo es requerido' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'El mensaje es requerido' },
        { status: 400 }
      );
    }

    // Validate clientId exists
    const client = await db.client.findUnique({
      where: { id: clientId },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    const notification = await db.clientNotification.create({
      data: {
        clientId,
        type: type.trim(),
        title: title.trim(),
        message: message.trim(),
        link: link?.trim() || null,
        data: data ? JSON.stringify(data) : null,
        bookingId: bookingId || null,
      },
    });

    return NextResponse.json({ success: true, data: notification });
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }
    console.error('Create notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear notificacion' },
      { status: 500 }
    );
  }
}
