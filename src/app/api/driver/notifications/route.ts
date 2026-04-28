import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET - List driver notifications (ordered by createdAt desc, limit 50)
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);

    const notifications = await db.driverNotification.findMany({
      where: { driverId: session.driverId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, data: notifications });
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }
    console.error('Get driver notifications error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener notificaciones' },
      { status: 500 }
    );
  }
}

// PATCH - Mark notification as read (single) or mark all as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const { id, isRead, all } = body;

    // Mark ALL notifications as read
    if (all) {
      const result = await db.driverNotification.updateMany({
        where: { driverId: session.driverId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, updatedCount: result.count });
    }

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

    // Verify ownership
    const notification = await db.driverNotification.findUnique({
      where: { id },
      select: { driverId: true },
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notificacion no encontrada' },
        { status: 404 }
      );
    }

    if (notification.driverId !== session.driverId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado para modificar esta notificacion' },
        { status: 403 }
      );
    }

    const updated = await db.driverNotification.update({
      where: { id },
      data: { isRead },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }
    console.error('Update driver notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar notificacion' },
      { status: 500 }
    );
  }
}

// DELETE - Delete one or all notifications
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const { id, all } = body;

    if (all) {
      // Delete all notifications for this driver
      const result = await db.driverNotification.deleteMany({
        where: { driverId: session.driverId },
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
    const notification = await db.driverNotification.findUnique({
      where: { id },
      select: { driverId: true },
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notificacion no encontrada' },
        { status: 404 }
      );
    }

    if (notification.driverId !== session.driverId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado para eliminar esta notificacion' },
        { status: 403 }
      );
    }

    await db.driverNotification.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }
    console.error('Delete driver notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar notificacion' },
      { status: 500 }
    );
  }
}

// POST - Create notification
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const { type, title, message, link, data, bookingId } = body;

    // Force ownership: always use session.driverId, ignore body.driverId
    const driverId = session.driverId;

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

    // Validate driver exists
    const driver = await db.taxiDriver.findUnique({
      where: { id: driverId },
      select: { id: true },
    });

    if (!driver) {
      return NextResponse.json(
        { success: false, error: 'Conductor no encontrado' },
        { status: 404 }
      );
    }

    const notification = await db.driverNotification.create({
      data: {
        driverId,
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
    console.error('Create driver notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear notificacion' },
      { status: 500 }
    );
  }
}
