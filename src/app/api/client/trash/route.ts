import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireClientAuth } from '@/lib/client-auth';

// GET /api/client/trash?type=all|bookings|chats — Listar papelera del cliente
export async function GET(request: NextRequest) {
  try {
    const session = await requireClientAuth(request);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    const showBookings = type === 'all' || type === 'bookings';
    const showChats = type === 'all' || type === 'chats';

    const result: Record<string, unknown[]> = {};

    if (showBookings) {
      const trashBookings = await db.booking.findMany({
        where: {
          clientId: session.clientId,
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
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              imageUrl: true,
            },
          },
          _count: { select: { messages: true } },
        },
      });
      result.bookings = trashBookings;
    }

    if (showChats) {
      const trashChats = await db.directConversation.findMany({
        where: {
          clientId: session.clientId,
          clientDeletedAt: { not: null },
        },
        orderBy: { clientDeletedAt: 'desc' },
        select: {
          id: true,
          lastMessage: true,
          lastMessageAt: true,
          clientDeletedAt: true,
          createdAt: true,
          driver: {
            select: { id: true, name: true, imageUrl: true },
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
    console.error('Client trash GET error:', error);
    return NextResponse.json({ success: false, error: 'Error al cargar papelera' }, { status: 500 });
  }
}

// PATCH /api/client/trash — Operaciones de papelera del cliente
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireClientAuth(request);
    const body = await request.json();
    const { bookingId, conversationId, action } = body;

    // --- Conversations ---
    if (conversationId && action) {
      const conversation = await db.directConversation.findUnique({ where: { id: conversationId } });
      if (!conversation) {
        return NextResponse.json({ success: false, error: 'Conversacion no encontrada' }, { status: 404 });
      }
      if (!conversation.clientId || conversation.clientId !== session.clientId) {
        return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
      }

      if (action === 'soft_delete') {
        const updated = await db.directConversation.update({
          where: { id: conversationId },
          data: { clientDeletedAt: new Date(), updatedAt: new Date() },
        });
        return NextResponse.json({ success: true, data: updated });
      }

      if (action === 'restore') {
        const updated = await db.directConversation.update({
          where: { id: conversationId },
          data: { clientDeletedAt: null, updatedAt: new Date() },
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
            clientId: session.clientId,
            clientDeletedAt: { not: null },
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
      if (!booking.clientId || booking.clientId !== session.clientId) {
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
            clientId: session.clientId,
            deletedAt: { not: null },
          },
        });
        return NextResponse.json({ success: true, deleted: count });
      }
    }

    return NextResponse.json({ success: false, error: 'Parametros requeridos' }, { status: 400 });
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }
    console.error('Client trash PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Error en papelera' }, { status: 500 });
  }
}
