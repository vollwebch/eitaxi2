import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getClientFromRequest } from '@/lib/client-auth'
import { checkDriverAvailability, type DaySchedule } from '@/lib/schedule-check'

function generateReference(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = 'eitaxi-'
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// POST - Crear reserva
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerName, customerPhone, pickupAddress, driverId, dropoffAddress, scheduledDate, scheduledTime, notes, passengerCount, estimatedPrice, stops } = body

    // Validar campos requeridos
    if (!customerName || !customerName.trim()) {
      return NextResponse.json({ success: false, error: 'El nombre es requerido' }, { status: 400 })
    }
    if (!customerPhone || !customerPhone.trim()) {
      return NextResponse.json({ success: false, error: 'El telefono es requerido' }, { status: 400 })
    }
    if (!pickupAddress || !pickupAddress.trim()) {
      return NextResponse.json({ success: false, error: 'La direccion de recogida es requerida' }, { status: 400 })
    }
    if (!driverId || !driverId.trim()) {
      return NextResponse.json({ success: false, error: 'El conductor es requerido' }, { status: 400 })
    }

    // Verificar que el conductor existe
    const driver = await db.taxiDriver.findUnique({
      where: { id: driverId },
      select: {
        id: true,
        isAvailable24h: true,
        workingHours: true,
      },
    })

    if (!driver) {
      return NextResponse.json({ success: false, error: 'Conductor no encontrado' }, { status: 404 })
    }

    // Validar disponibilidad del conductor por horario
    const workingHours: DaySchedule[] = driver.workingHours
      ? (typeof driver.workingHours === 'string'
          ? JSON.parse(driver.workingHours)
          : driver.workingHours)
      : []

    const scheduleCheck = checkDriverAvailability(
      workingHours,
      driver.isAvailable24h,
      scheduledDate || null,
      scheduledTime || null,
      'es'
    )

    if (!scheduleCheck.isAvailable) {
      let errorMsg = 'El conductor no esta disponible en el horario seleccionado.'
      if (scheduleCheck.schedule) {
        errorMsg += ` Horario del conductor: ${scheduleCheck.schedule}`
      }
      return NextResponse.json({ success: false, error: errorMsg, unavailable: true }, { status: 400 })
    }

    // Generar referencia unica
    let reference = generateReference()
    const maxAttempts = 10
    for (let i = 0; i < maxAttempts; i++) {
      const existing = await db.booking.findUnique({ where: { reference } })
      if (!existing) break
      reference = generateReference()
    }

    // Auto-associate logged-in client (using Request object for reliability)
    let clientId: string | null = null
    try {
      const clientSession = await getClientFromRequest(request)
      if (clientSession) {
        clientId = clientSession.clientId
      }
    } catch {
      // No client session - anonymous booking
    }

    // Crear reserva
    const booking = await db.booking.create({
      data: {
        reference,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        pickupAddress: pickupAddress.trim(),
        dropoffAddress: dropoffAddress?.trim() || null,
        driverId,
        scheduledDate: scheduledDate || null,
        scheduledTime: scheduledTime || null,
        notes: notes?.trim() || null,
        passengerCount: passengerCount || 1,
        estimatedPrice: estimatedPrice || null,
        status: 'pending',
        clientId,
        stops: stops && Array.isArray(stops) && stops.length > 0 ? {
          create: stops.map((stop: any, index: number) => ({
            stopOrder: index + 1,
            address: typeof stop === 'string' ? stop : (stop.address || stop.text || ''),
            latitude: stop.latitude || stop.lat || null,
            longitude: stop.longitude || stop.lon || null,
          })),
        } : undefined,
      }
    })

    // Notificar al cliente si está logueado
    if (clientId) {
      const driverInfo = await db.taxiDriver.findUnique({
        where: { id: driverId },
        select: { name: true },
      });
      const driverName = driverInfo?.name || 'Tu conductor';
      await db.clientNotification.create({
        data: {
          clientId,
          type: 'booking_status',
          title: 'Reserva creada',
          message: `Tu reserva ${reference} con ${driverName} ha sido creada. Esperando confirmación.`,
          link: `/cuenta?tab=reservas&booking=${booking.id}`,
          bookingId: booking.id,
        },
      });
    }

    // Notificar al conductor de la nueva reserva
    const pickupShort = pickupAddress.trim().length > 40 ? pickupAddress.trim().substring(0, 40) + '...' : pickupAddress.trim();
    const scheduledInfo = (scheduledDate || scheduledTime) ? ` (${scheduledDate} ${scheduledTime || ''})`.trim() : '';
    await db.driverNotification.create({
      data: {
        driverId,
        type: 'new_booking',
        title: 'Nueva reserva',
        message: `${customerName.trim()} ha reservado un taxi desde ${pickupShort}${scheduledInfo}.`,
        link: `/dashboard/${driverId}?tab=bookings&booking=${booking.id}`,
        bookingId: booking.id,
      },
    });

    return NextResponse.json({ success: true, data: booking })
  } catch (error) {
    console.error('Create booking error:', error)
    return NextResponse.json({ success: false, error: 'Error al crear la reserva' }, { status: 500 })
  }
}

// GET - Listar reservas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get('driverId')
    const reference = searchParams.get('reference')

    if (reference) {
      // Buscar reserva especifica por referencia
      const normalizedRef = reference.trim()
      const booking = await db.booking.findFirst({
        where: { reference: normalizedRef },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              whatsapp: true,
              imageUrl: true,
            }
          },
          stops: {
            orderBy: { stopOrder: 'asc' },
          }
        }
      })

      if (!booking) {
        return NextResponse.json({ success: false, error: 'Reserva no encontrada' }, { status: 404 })
      }

      return NextResponse.json({ success: true, data: booking })
    }

    if (driverId) {
      // Listar reservas de un conductor (excluir papelera)
      const bookings = await db.booking.findMany({
        where: { driverId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
            }
          },
          stops: {
            orderBy: { stopOrder: 'asc' },
          }
        }
      })

      return NextResponse.json({ success: true, data: bookings })
    }

    // Sin parametros: devolver error
    return NextResponse.json(
      { success: false, error: 'Se requiere driverId o reference' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Get bookings error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener reservas' }, { status: 500 })
  }
}
