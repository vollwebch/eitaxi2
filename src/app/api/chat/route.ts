import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// Rate limiting simple (en memoria)
const rateLimit = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 30 // mensajes por minuto
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minuto

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = rateLimit.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimit.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false
  }
  entry.count++
  return true
}

// POST - Enviar mensaje
export async function POST(request: NextRequest) {
  try {
    // Autenticación del conductor via JWT
    let driverId: string | undefined
    let sender: 'driver' | 'customer' = 'customer'

    try {
      const session = await requireAuth(request)
      driverId = session.driverId
      sender = 'driver'
    } catch {
      // No autenticado — verificar que viene con bookingId + customerPhone
    }

    const body = await request.json()
    const { bookingId, content, customerPhone } = body

    if (!bookingId || !content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'bookingId y contenido son requeridos' },
        { status: 400 }
      )
    }

    if (content.trim().length > 1000) {
      return NextResponse.json(
        { success: false, error: 'El mensaje no puede superar los 1000 caracteres' },
        { status: 400 }
      )
    }

    // Rate limiting
    const rateKey = sender === 'driver' ? `driver:${driverId}` : `customer:${bookingId}:${request.ip || 'unknown'}`
    if (!checkRateLimit(rateKey)) {
      return NextResponse.json(
        { success: false, error: 'Demasiados mensajes. Espera un momento.' },
        { status: 429 }
      )
    }

    // Verificar que la reserva existe
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, driverId: true, clientId: true, customerPhone: true, status: true, driver: { select: { name: true } } }
    })

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada' },
        { status: 404 }
      )
    }

    // Para clientes: verificar con teléfono
    if (sender === 'customer') {
      if (!customerPhone || customerPhone !== booking.customerPhone) {
        return NextResponse.json(
          { success: false, error: 'No autorizado' },
          { status: 401 }
        )
      }
    }

    // Para conductores: verificar que la reserva es suya
    if (sender === 'driver' && driverId && booking.driverId !== driverId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Crear mensaje
    const message = await db.message.create({
      data: {
        bookingId,
        sender,
        content: content.trim(),
      }
    })

    // Notificar al cliente si el mensaje es del conductor
    if (sender === 'driver' && booking.clientId) {
      const driverName = booking.driver?.name || 'Tu conductor'
      const preview = content.trim().length > 60 ? content.trim().substring(0, 60) + '...' : content.trim()
      await db.clientNotification.create({
        data: {
          clientId: booking.clientId,
          type: 'new_message',
          title: `Nuevo mensaje de ${driverName}`,
          message: preview,
          link: `/cuenta/chat/${bookingId}`,
          bookingId,
        },
      })
    }

    // Notificar al conductor si el mensaje es del cliente
    if (sender === 'customer' && booking.driverId) {
      const customerName = booking.customerName || 'Un cliente'
      const preview = content.trim().length > 60 ? content.trim().substring(0, 60) + '...' : content.trim()
      await db.driverNotification.create({
        data: {
          driverId: booking.driverId,
          type: 'new_message',
          title: `Nuevo mensaje de ${customerName}`,
          message: preview,
          link: `/dashboard/${booking.driverId}?tab=chat&booking=${bookingId}`,
          bookingId,
        },
      })
    }

    return NextResponse.json({ success: true, data: message })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al enviar mensaje' },
      { status: 500 }
    )
  }
}

// GET - Obtener mensajes de una reserva
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'bookingId es requerido' },
        { status: 400 }
      )
    }

    // Autenticación: conductor via JWT o cliente via teléfono
    let isDriver = false
    try {
      const session = await requireAuth(request)
      // Verificar que la reserva es del conductor
      const booking = await db.booking.findUnique({
        where: { id: bookingId },
        select: { driverId: true }
      })
      if (booking && booking.driverId === session.driverId) {
        isDriver = true
      }
    } catch {
      // No autenticado — se permite lectura con solo bookingId
      // (el cliente necesita poder leer sus mensajes)
    }

    const messages = await db.message.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'asc' },
    })

    // Marcar mensajes del otro como leídos
    if (isDriver) {
      await db.message.updateMany({
        where: {
          bookingId,
          sender: 'customer',
          isRead: false,
        },
        data: { isRead: true }
      })
    } else {
      await db.message.updateMany({
        where: {
          bookingId,
          sender: 'driver',
          isRead: false,
        },
        data: { isRead: true }
      })
    }

    return NextResponse.json({ success: true, data: messages })
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener mensajes' },
      { status: 500 }
    )
  }
}
