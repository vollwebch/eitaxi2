import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getClientFromRequest } from '@/lib/client-auth';
import { getSessionFromRequest } from '@/lib/auth';

// GET - List messages for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;

    // Try client auth first, then driver auth
    let userId: string | null = null;
    let userType: 'client' | 'driver' | null = null;

    const clientSession = await getClientFromRequest(request);
    if (clientSession) {
      userId = clientSession.clientId;
      userType = 'client';
    } else {
      const driverSession = await getSessionFromRequest(request);
      if (driverSession) {
        userId = driverSession.driverId;
        userType = 'driver';
      }
    }

    if (!userId || !userType) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    // Verify conversation exists and user belongs to it
    const conversation = await db.directConversation.findUnique({
      where: { id: conversationId },
      select: { clientId: true, driverId: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversación no encontrada' },
        { status: 404 }
      );
    }

    if (conversation.clientId !== userId && conversation.driverId !== userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Get messages ordered by createdAt asc
    const messages = await db.directMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    // Mark other person's messages as read
    const otherSender = userType === 'client' ? 'driver' : 'client';
    await db.directMessage.updateMany({
      where: {
        conversationId,
        sender: otherSender,
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    console.error('Get direct messages error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener mensajes' },
      { status: 500 }
    );
  }
}

// POST - Create a message in a conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;

    // Try client auth first, then driver auth
    let userId: string | null = null;
    let senderType: 'client' | 'driver' | null = null;

    const clientSession = await getClientFromRequest(request);
    if (clientSession) {
      userId = clientSession.clientId;
      senderType = 'client';
    } else {
      const driverSession = await getSessionFromRequest(request);
      if (driverSession) {
        userId = driverSession.driverId;
        senderType = 'driver';
      }
    }

    if (!userId || !senderType) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'El contenido del mensaje es requerido' },
        { status: 400 }
      );
    }

    // Verify conversation exists and user belongs to it
    const conversation = await db.directConversation.findUnique({
      where: { id: conversationId },
      select: { clientId: true, driverId: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversación no encontrada' },
        { status: 404 }
      );
    }

    if (conversation.clientId !== userId && conversation.driverId !== userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Create the message
    const message = await db.directMessage.create({
      data: {
        conversationId,
        sender: senderType,
        content: content.trim(),
      },
    });

    // Update conversation's lastMessage and lastMessageAt
    await db.directConversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: content.trim(),
        lastMessageAt: new Date(),
      },
    });

    // Notify driver when client sends a direct message
    if (senderType === 'client' && conversation.driverId) {
      await db.driverNotification.create({
        data: {
          driverId: conversation.driverId,
          type: 'new_direct_message',
          title: 'Nuevo mensaje directo',
          message: content.trim().substring(0, 100),
          link: `/dashboard/${conversation.driverId}?tab=chat&direct=${conversationId}`,
        },
      });
    }

    // Notify client when driver sends a direct message
    if (senderType === 'driver' && conversation.clientId) {
      await db.clientNotification.create({
        data: {
          clientId: conversation.clientId,
          type: 'new_direct_message',
          title: 'Nuevo mensaje directo',
          message: content.trim().substring(0, 100),
          link: `/cuenta?tab=chat&direct=${conversationId}`,
        },
      });
    }

    return NextResponse.json({ success: true, data: message });
  } catch (error) {
    console.error('Create direct message error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al enviar mensaje' },
      { status: 500 }
    );
  }
}
