import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireClientAuth } from '@/lib/client-auth'

// GET /api/chat/recent - Get recent conversations for the authenticated client
export async function GET() {
  try {
    const session = await requireClientAuth()

    // Get all bookings for this client that have messages
    const bookings = await db.booking.findMany({
      where: {
        clientId: session.clientId,
        messages: { some: {} },
      },
      include: {
        driver: { select: { id: true, name: true, imageUrl: true, vehicleType: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: {
                receiverId: session.clientId,
                isRead: false,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    // Build conversation list from the last message per booking
    const conversations = bookings.map((b) => {
      const lastMessage = b.messages[0]
      return {
        bookingId: b.id,
        driverId: b.driver.id,
        driverName: b.driver.name,
        driverImageUrl: b.driver.imageUrl,
        driverVehicleType: b.driver.vehicleType,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              senderId: lastMessage.senderId,
              senderType: lastMessage.senderType,
              createdAt: lastMessage.createdAt,
              isRead: lastMessage.isRead,
            }
          : null,
        unreadCount: b._count.messages,
        status: b.status,
        pickupAddress: b.pickupAddress,
        updatedAt: b.updatedAt,
      }
    })

    // Sort by last message time desc (use updatedAt as proxy since messages are ordered)
    conversations.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt?.getTime() || a.updatedAt.getTime()
      const timeB = b.lastMessage?.createdAt?.getTime() || b.updatedAt.getTime()
      return timeB - timeA
    })

    return NextResponse.json({ success: true, data: conversations })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }
    console.error('Error fetching recent conversations:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener conversaciones recientes' },
      { status: 500 }
    )
  }
}
