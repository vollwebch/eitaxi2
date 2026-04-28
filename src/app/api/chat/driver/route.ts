import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// GET - Obtener todas las conversaciones del conductor agrupadas por reserva
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const driverId = session.driverId

    // Obtener todas las reservas del conductor que tienen mensajes
    const bookingsWithMessages = await db.booking.findMany({
      where: {
        driverId,
        messages: { some: {} },
      },
      select: {
        id: true,
        reference: true,
        customerName: true,
        customerPhone: true,
        pickupAddress: true,
        scheduledDate: true,
        scheduledTime: true,
        status: true,
        createdAt: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            sender: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            messages: {
              where: { sender: 'customer', isRead: false },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Contar total de mensajes no leídos
    const totalUnread = bookingsWithMessages.reduce(
      (sum, b) => sum + b._count.messages,
      0
    )

    return NextResponse.json({
      success: true,
      data: {
        conversations: bookingsWithMessages.map(b => ({
          id: b.id,
          reference: b.reference,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          pickupAddress: b.pickupAddress,
          scheduledDate: b.scheduledDate,
          scheduledTime: b.scheduledTime,
          status: b.status,
          createdAt: b.createdAt,
          lastMessage: b.messages[0] || null,
          unreadCount: b._count.messages,
        })),
        totalUnread,
      },
    })
  } catch (error) {
    console.error('Get driver chats error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener conversaciones' },
      { status: 500 }
    )
  }
}
