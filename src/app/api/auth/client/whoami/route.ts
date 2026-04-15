import { NextResponse } from 'next/server'
import { requireClientAuth } from '@/lib/client-auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await requireClientAuth()

    const client = await db.client.findUnique({
      where: { id: session.clientId },
      include: {
        _count: {
          select: {
            bookings: true,
            notifications: {
              where: { isRead: false },
            },
          },
        },
      },
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        avatarUrl: client.avatarUrl,
        preferredLang: client.preferredLang,
        bookingCount: client._count.bookings,
        unreadNotifications: client._count.notifications,
        createdAt: client.createdAt,
      },
    })
  } catch (error) {
    console.error('Client whoami error:', error)
    return NextResponse.json(
      { success: false, error: 'No autenticado' },
      { status: 401 }
    )
  }
}
