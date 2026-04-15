import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireClientAuth } from '@/lib/client-auth'
import { requireAuth } from '@/lib/auth'

// GET /api/chat?bookingId=xxx OR /api/chat?senderId=xxx&receiverId=xxx
export async function GET(request: NextRequest) {
  try {
    // Try client auth first, then driver auth
    let userId: string
    try {
      const clientSession = await requireClientAuth(request)
      userId = clientSession.clientId
    } catch {
      try {
        const driverSession = await requireAuth(request)
        userId = driverSession.driverId
      } catch {
        return NextResponse.json(
          { success: false, error: 'No autenticado' },
          { status: 401 }
        )
      }
    }

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')
    const senderId = searchParams.get('senderId')
    const receiverId = searchParams.get('receiverId')

    let where: Record<string, unknown> = {}

    if (bookingId) {
      where.bookingId = bookingId
    } else if (senderId && receiverId) {
      where.OR = [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ]
    } else {
      return NextResponse.json(
        { success: false, error: 'Se requiere bookingId o senderId y receiverId' },
        { status: 400 }
      )
    }

    const messages = await db.message.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    })

    // Mark received messages as read (messages where current user is the receiver)
    const unreadIds = messages.filter(
      (m) => m.receiverId === userId && !m.isRead
    ).map((m) => m.id)

    if (unreadIds.length > 0) {
      await db.message.updateMany({
        where: { id: { in: unreadIds } },
        data: { isRead: true },
      })
    }

    return NextResponse.json({ success: true, data: messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener mensajes' },
      { status: 500 }
    )
  }
}

// POST /api/chat - Send a message
export async function POST(request: NextRequest) {
  try {
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
    const { bookingId, receiverId, receiverType, content, senderType } = body

    // Validate required fields
    if (!receiverId) {
      return NextResponse.json(
        { success: false, error: 'El destinatario es obligatorio' },
        { status: 400 }
      )
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'El contenido del mensaje es obligatorio' },
        { status: 400 }
      )
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'El mensaje no puede exceder 2000 caracteres' },
        { status: 400 }
      )
    }

    const senderId =
      session.type === 'client' ? session.clientId : session.driverId
    const finalSenderType = senderType || session.type

    // Create message
    const message = await db.message.create({
      data: {
        bookingId: bookingId || null,
        senderId,
        receiverId,
        senderType: finalSenderType,
        receiverType: receiverType || (finalSenderType === 'client' ? 'driver' : 'client'),
        content: content.trim(),
        isRead: false,
      },
    })

    return NextResponse.json({ success: true, data: message })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { success: false, error: 'Error al enviar el mensaje' },
      { status: 500 }
    )
  }
}
