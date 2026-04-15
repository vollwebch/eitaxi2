import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireClientAuth } from '@/lib/client-auth'

// GET /api/client/notifications - Get all notifications for the authenticated client
export async function GET() {
  try {
    const session = await requireClientAuth()

    const notifications = await db.notification.findMany({
      where: { clientId: session.clientId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ success: true, data: notifications })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener notificaciones' },
      { status: 500 }
    )
  }
}

// PUT /api/client/notifications - Mark notification(s) as read
export async function PUT(request: NextRequest) {
  try {
    const session = await requireClientAuth()

    const body = await request.json()
    const { id, markAll } = body

    if (markAll) {
      // Mark all notifications as read
      await db.notification.updateMany({
        where: {
          clientId: session.clientId,
          isRead: false,
        },
        data: { isRead: true },
      })

      return NextResponse.json({ success: true })
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Se requiere id o markAll' },
        { status: 400 }
      )
    }

    // Mark single notification as read
    const notification = await db.notification.findUnique({
      where: { id },
    })

    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notificación no encontrada' },
        { status: 404 }
      )
    }

    if (notification.clientId !== session.clientId) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado' },
        { status: 403 }
      )
    }

    await db.notification.update({
      where: { id },
      data: { isRead: true },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar notificación' },
      { status: 500 }
    )
  }
}
