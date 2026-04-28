import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getClientFromRequest } from '@/lib/client-auth';
import { getSessionFromRequest } from '@/lib/auth';

// GET - List conversations for authenticated user
export async function GET(request: NextRequest) {
  try {
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

    const conversations = await db.directConversation.findMany({
      where: {
        ...(userType === 'client' ? { clientId: userId } : { driverId: userId }),
        // Filter out soft-deleted conversations for this user
        ...(userType === 'client' ? { clientDeletedAt: null } : { driverDeletedAt: null }),
      },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        client: {
          select: { id: true, name: true },
        },
        driver: {
          select: { id: true, name: true, imageUrl: true },
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                ...(userType === 'client' ? { sender: 'driver' } : { sender: 'client' }),
              },
            },
          },
        },
      },
    });

    // Map conversations to include other person's info and unread count
    const mappedConversations = conversations.map((conv) => {
      const otherPerson = userType === 'client' ? conv.driver : conv.client;
      const unreadCount = userType === 'client'
        ? conv._count.messages // unread from driver
        : conv._count.messages; // unread from client

      return {
        id: conv.id,
        otherPerson,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        unreadCount,
      };
    });

    return NextResponse.json({ success: true, data: mappedConversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener conversaciones' },
      { status: 500 }
    );
  }
}

// POST - Create or find conversation (client only)
export async function POST(request: NextRequest) {
  try {
    const session = await getClientFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { driverId } = body;

    if (!driverId || typeof driverId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'driverId es requerido' },
        { status: 400 }
      );
    }

    // Find or create conversation
    const conversation = await db.directConversation.upsert({
      where: {
        clientId_driverId: {
          clientId: session.clientId,
          driverId,
        },
      },
      create: {
        clientId: session.clientId,
        driverId,
      },
      update: {},
      include: {
        client: {
          select: { id: true, name: true },
        },
        driver: {
          select: { id: true, name: true, imageUrl: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: conversation });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear conversación' },
      { status: 500 }
    );
  }
}
