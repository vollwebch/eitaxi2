import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendDailyReportEmail as sendEmail } from '@/lib/email'

/**
 * GET /api/reports/daily?driverId=xxx&date=2024-01-01&secret=xxx&send=true
 * Genera y envia un reporte diario de reservas por email al taxista
 * 
 * Seguridad: requiere parametro secreto para ejecutar
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get('driverId')
    const dateStr = searchParams.get('date')
    const sendMode = searchParams.get('send') === 'true'
    const secret = searchParams.get('secret')

    // Seguridad: verificar que es una peticion autorizada (cron o admin)
    const reportSecret = process.env.REPORT_SECRET || 'eitaxi-report-2024'
    if (!secret || secret !== reportSecret) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Fecha: hoy por defecto
    const reportDate = dateStr ? new Date(dateStr) : new Date()
    const startOfDay = new Date(reportDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(reportDate)
    endOfDay.setHours(23, 59, 59, 999)

    const dateFormatted = reportDate.toLocaleDateString('es-CH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    if (driverId) {
      return await generateDriverReport(driverId, startOfDay, endOfDay, dateFormatted, sendMode)
    } else {
      return await generateGlobalReport(startOfDay, endOfDay, dateFormatted, sendMode)
    }
  } catch (error: any) {
    console.error('Error generando reporte diario:', error.message)
    return NextResponse.json(
      { success: false, error: 'Error al generar el reporte' },
      { status: 500 }
    )
  }
}

async function generateDriverReport(
  driverId: string,
  startOfDay: Date,
  endOfDay: Date,
  dateFormatted: string,
  sendMode: boolean
) {
  const driver = await db.taxiDriver.findUnique({
    where: { id: driverId },
    select: { id: true, name: true, email: true },
  })

  if (!driver) {
    return NextResponse.json(
      { success: false, error: 'Conductor no encontrado' },
      { status: 404 }
    )
  }

  const bookings = await db.booking.findMany({
    where: {
      driverId,
      createdAt: { gte: startOfDay, lte: endOfDay },
    },
    orderBy: { createdAt: 'desc' },
  })

  const stats = calculateStats(bookings)
  const html = generateDriverReportHTML(driver.name, dateFormatted, bookings, stats)

  if (sendMode && driver.email) {
    await sendEmail({
      to: driver.email,
      subject: `Reporte diario - ${dateFormatted} - eitaxi`,
      html,
    })

    return NextResponse.json({
      success: true,
      sent: true,
      driverName: driver.name,
      email: driver.email,
      stats,
    })
  }

  return NextResponse.json({
    success: true,
    sent: false,
    stats,
    bookingsCount: bookings.length,
  })
}

async function generateGlobalReport(
  startOfDay: Date,
  endOfDay: Date,
  dateFormatted: string,
  sendMode: boolean
) {
  const bookings = await db.booking.findMany({
    where: {
      createdAt: { gte: startOfDay, lte: endOfDay },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      driver: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  const stats = calculateStats(bookings)

  const driverMap = new Map<string, { driver: typeof bookings[0]['driver']; bookings: typeof bookings }>()
  for (const booking of bookings) {
    const existing = driverMap.get(booking.driverId)
    if (existing) {
      existing.bookings.push(booking)
    } else {
      driverMap.set(booking.driverId, { driver: booking.driver, bookings: [booking] })
    }
  }

  if (sendMode) {
    const sentEmails: string[] = []
    for (const [_, data] of driverMap) {
      if (data.driver.email) {
        const driverStats = calculateStats(data.bookings)
        const driverHtml = generateDriverReportHTML(data.driver.name, dateFormatted, data.bookings, driverStats)
        await sendEmail({
          to: data.driver.email,
          subject: `Reporte diario - ${dateFormatted} - eitaxi`,
          html: driverHtml,
        })
        sentEmails.push(data.driver.email)
      }
    }

    return NextResponse.json({
      success: true,
      sent: true,
      sentTo: sentEmails,
      globalStats: stats,
      driversReported: driverMap.size,
    })
  }

  return NextResponse.json({
    success: true,
    sent: false,
    stats,
    totalBookings: bookings.length,
    driversWithBookings: driverMap.size,
  })
}

function calculateStats(bookings: any[]) {
  const total = bookings.length
  const pending = bookings.filter(b => b.status === 'pending').length
  const confirmed = bookings.filter(b => b.status === 'confirmed').length
  const completed = bookings.filter(b => b.status === 'completed').length
  const cancelled = bookings.filter(b => b.status === 'cancelled').length
  const totalRevenue = bookings
    .filter(b => b.status === 'completed' && b.estimatedPrice)
    .reduce((sum, b) => sum + (b.estimatedPrice || 0), 0)
  const pendingRevenue = bookings
    .filter(b => (b.status === 'pending' || b.status === 'confirmed') && b.estimatedPrice)
    .reduce((sum, b) => sum + (b.estimatedPrice || 0), 0)
  const avgPrice = total > 0 ? bookings.filter(b => b.estimatedPrice).reduce((sum, b) => sum + (b.estimatedPrice || 0), 0) / Math.max(bookings.filter(b => b.estimatedPrice).length, 1) : 0
  const totalDistance = bookings.reduce((sum, b) => sum + (b.tripDistance || 0), 0)

  return { total, pending, confirmed, completed, cancelled, totalRevenue, pendingRevenue, avgPrice, totalDistance }
}

function generateDriverReportHTML(driverName: string, dateFormatted: string, bookings: any[], stats: ReturnType<typeof calculateStats>) {
  const statusColor: Record<string, string> = {
    pending: '#facc15',
    confirmed: '#3b82f6',
    completed: '#22c55e',
    cancelled: '#ef4444',
  }
  const statusLabel: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    completed: 'Completada',
    cancelled: 'Cancelada',
  }

  const bookingsRows = bookings.length > 0
    ? bookings.map(b => {
        const time = new Date(b.createdAt).toLocaleTimeString('es-CH', { hour: '2-digit', minute: '2-digit' })
        const price = b.estimatedPrice ? `CHF ${b.estimatedPrice.toFixed(2)}` : '-'
        return `
          <tr>
            <td style="padding: 8px 10px; border-bottom: 1px solid #3f3f46; font-size: 13px; color: #a1a1aa;">${time}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #3f3f46; font-size: 13px; color: #fff;">${b.passengerName}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #3f3f46; font-size: 13px; color: #d4d4d8;">${b.origin} → ${b.destination}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #3f3f46; font-size: 13px; color: #fff; text-align: right;">${price}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #3f3f46; font-size: 12px; text-align: center;">
              <span style="color: ${statusColor[b.status] || '#a1a1aa'}; font-weight: 600;">${statusLabel[b.status] || b.status}</span>
            </td>
          </tr>`
      }).join('')
    : `<tr><td colspan="5" style="padding: 20px; text-align: center; color: #71717a; font-size: 14px;">No hubo reservas este dia</td></tr>`

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #18181b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
              <tr>
                <td style="text-align: center; padding-bottom: 24px;">
                  <span style="font-size: 36px;">&#x1F695;</span>
                  <h1 style="color: #facc15; font-size: 22px; margin: 6px 0 0 0;">eitaxi</h1>
                </td>
              </tr>
              <tr>
                <td style="background-color: #27272a; border-radius: 16px; padding: 28px; border: 1px solid #3f3f46;">
                  <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 4px 0;">Reporte diario</h2>
                  <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 24px 0;">${dateFormatted} | ${driverName}</p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                    <tr>
                      <td style="width: 25%; text-align: center; padding: 12px 8px; background-color: #18181b; border-radius: 8px; border: 1px solid #3f3f46;">
                        <p style="color: #71717a; font-size: 11px; margin: 0 0 4px 0;">TOTAL</p>
                        <p style="color: #fff; font-size: 22px; font-weight: 700; margin: 0;">${stats.total}</p>
                      </td>
                      <td style="width: 4%;"></td>
                      <td style="width: 25%; text-align: center; padding: 12px 8px; background-color: #18181b; border-radius: 8px; border: 1px solid #3f3f46;">
                        <p style="color: #71717a; font-size: 11px; margin: 0 0 4px 0;">COMPLETADAS</p>
                        <p style="color: #22c55e; font-size: 22px; font-weight: 700; margin: 0;">${stats.completed}</p>
                      </td>
                      <td style="width: 4%;"></td>
                      <td style="width: 25%; text-align: center; padding: 12px 8px; background-color: #18181b; border-radius: 8px; border: 1px solid #3f3f46;">
                        <p style="color: #71717a; font-size: 11px; margin: 0 0 4px 0;">INGRESOS</p>
                        <p style="color: #facc15; font-size: 22px; font-weight: 700; margin: 0;">CHF ${stats.totalRevenue.toFixed(0)}</p>
                      </td>
                    </tr>
                  </table>
                  ${stats.total > 0 ? `
                  <div style="background-color: #18181b; border-radius: 8px; padding: 4px 0; border: 1px solid #3f3f46; overflow: hidden;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr style="background-color: #27272a;">
                        <th style="padding: 8px 10px; text-align: left; font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px;">Hora</th>
                        <th style="padding: 8px 10px; text-align: left; font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px;">Pasajero</th>
                        <th style="padding: 8px 10px; text-align: left; font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px;">Ruta</th>
                        <th style="padding: 8px 10px; text-align: right; font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px;">Precio</th>
                        <th style="padding: 8px 10px; text-align: center; font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px;">Estado</th>
                      </tr>
                      ${bookingsRows}
                    </table>
                  </div>` : ''}
                  ${stats.totalDistance > 0 ? `<p style="color: #71717a; font-size: 13px; margin: 16px 0 0 0;">Distancia total recorrida: ${stats.totalDistance.toFixed(1)} km</p>` : ''}
                </td>
              </tr>
              <tr>
                <td style="text-align: center; padding-top: 20px;">
                  <p style="color: #52525b; font-size: 12px; margin: 0;">eitaxi - Tu taxi en Suiza</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}
