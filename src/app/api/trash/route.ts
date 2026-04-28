import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET /api/trash?driverId=xxx&type=all|bookings|chats — Listar papelera
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');
    const type = searchParams.get('type') || 'all';

    if (!driverId) {
      return NextResponse.json({ success: false, error: 'driverId requerido' }, { status: 400 });
    }

    // Solo el propio conductor puede ver su papelera
    if (session.driverId !== driverId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
    }

    const showBookings = type === 'all' || type === 'bookings';
    const showChats = type === 'all' || type === 'chats';

    const result: Record<string, unknown[]> = {};

    if (showBookings) {
      const trashBookings = await db.booking.findMany({
        where: {
          driverId,
          deletedAt: { not: null },
        },
        orderBy: { deletedAt: 'desc' },
        select: {
          id: true,
          reference: true,
          status: true,
          customerName: true,
          customerPhone: true,
          passengerCount: true,
          pickupAddress: true,
          dropoffAddress: true,
          scheduledDate: true,
          scheduledTime: true,
          notes: true,
          estimatedPrice: true,
          createdAt: true,
          deletedAt: true,
          _count: { select: { messages: true } },
        },
      });
      result.bookings = trashBookings;
    }

    if (showChats) {
      const trashChats = await db.directConversation.findMany({
        where: {
          driverId,
          driverDeletedAt: { not: null },
        },
        orderBy: { driverDeletedAt: 'desc' },
        select: {
          id: true,
          lastMessage: true,
          lastMessageAt: true,
          driverDeletedAt: true,
          createdAt: true,
          client: {
            select: { id: true, name: true },
          },
          _count: { select: { messages: true } },
        },
      });
      result.chats = trashChats;
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }
    console.error('Trash GET error:', error);
    return NextResponse.json({ success: false, error: 'Error al cargar papelera' }, { status: 500 });
  }
}

// PATCH /api/trash — Operaciones de papelera
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const { bookingId, conversationId, action } = body;

    // --- Conversations ---
    if (conversationId && action) {
      // Verify conversation belongs to this driver
      const conversation = await db.directConversation.findUnique({ where: { id: conversationId } });
      if (!conversation) {
        return NextResponse.json({ success: false, error: 'Conversacion no encontrada' }, { status: 404 });
      }
      if (session.driverId !== conversation.driverId) {
        return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
      }

      if (action === 'soft_delete') {
        const updated = await db.directConversation.update({
          where: { id: conversationId },
          data: { driverDeletedAt: new Date(), updatedAt: new Date() },
        });
        return NextResponse.json({ success: true, data: updated });
      }

      if (action === 'restore') {
        const updated = await db.directConversation.update({
          where: { id: conversationId },
          data: { driverDeletedAt: null, updatedAt: new Date() },
        });
        return NextResponse.json({ success: true, data: updated });
      }

      if (action === 'permanent_delete') {
        await db.directConversation.delete({ where: { id: conversationId } });
        return NextResponse.json({ success: true });
      }

      if (action === 'empty_all_chats') {
        const { count } = await db.directConversation.deleteMany({
          where: {
            driverId: session.driverId,
            driverDeletedAt: { not: null },
          },
        });
        return NextResponse.json({ success: true, deleted: count });
      }

      return NextResponse.json({ success: false, error: 'Accion no valida' }, { status: 400 });
    }

    // --- Bookings ---
    if (bookingId && action) {
      const booking = await db.booking.findUnique({ where: { id: bookingId } });
      if (!booking) {
        return NextResponse.json({ success: false, error: 'Reserva no encontrada' }, { status: 404 });
      }
      if (session.driverId !== booking.driverId) {
        return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
      }

      if (action === 'soft_delete') {
        const trashed = await db.booking.update({
          where: { id: bookingId },
          data: { deletedAt: new Date(), updatedAt: new Date() },
        });
        return NextResponse.json({ success: true, data: trashed });
      }

      if (action === 'restore') {
        const restored = await db.booking.update({
          where: { id: bookingId },
          data: { deletedAt: null, status: 'pending', updatedAt: new Date() },
        });
        return NextResponse.json({ success: true, data: restored });
      }

      if (action === 'permanent_delete') {
        await db.booking.delete({ where: { id: bookingId } });
        return NextResponse.json({ success: true });
      }

      if (action === 'empty_all') {
        const { count } = await db.booking.deleteMany({
          where: {
            driverId: session.driverId,
            deletedAt: { not: null },
          },
        });
        return NextResponse.json({ success: true, deleted: count });
      }
    }

    return NextResponse.json({ success: false, error: 'Parametros requeridos: bookingId o conversationId con action' }, { status: 400 });
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }
    console.error('Trash PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Error en papelera' }, { status: 500 });
  }
}
