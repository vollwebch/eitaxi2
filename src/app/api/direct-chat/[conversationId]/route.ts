import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getClientFromRequest } from '@/lib/client-auth';
import { getSessionFromRequest } from '@/lib/auth';

// GET - Get conversation details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;

    // Try client auth first, then driver auth
    let userId: string | null = null;

    const clientSession = await getClientFromRequest(request);
    if (clientSession) {
      userId = clientSession.clientId;
    } else {
      const driverSession = await getSessionFromRequest(request);
      if (driverSession) {
        userId = driverSession.driverId;
      }
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const conversation = await db.directConversation.findUnique({
      where: { id: conversationId },
      include: {
        client: {
          select: { id: true, name: true },
        },
        driver: {
          select: { id: true, name: true, imageUrl: true },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversación no encontrada' },
        { status: 404 }
      );
    }

    // Verify user belongs to this conversation
    if (conversation.clientId !== userId && conversation.driverId !== userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: conversation });
  } catch (error) {
    console.error('Get conversation error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener conversación' },
      { status: 500 }
    );
  }
}
