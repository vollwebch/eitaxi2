import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendDailyReportEmail, sendAdminDailyReportEmail } from '@/lib/email'

// Tipo para las estadísticas del reporte
interface DriverStats {
  driverId: string
  driverName: string
  driverEmail: string
  total: number
  confirmed: number
  pending: number
  cancelled: number
  completed: number
}

/**
 * GET /api/cron/daily-report
 * Endpoint invocado por un cron job para enviar el reporte diario de reservas.
 * Requiere header Authorization: Bearer <CRON_SECRET> para seguridad.
 * Query params:
 *   - admin=true: Enviar reporte global al admin en lugar de a cada conductor
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar el secreto del cron para seguridad
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token || token !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { success: false, error: 'No autorizado. Se requiere CRON_SECRET válido.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const isAdminMode = searchParams.get('admin') === 'true'

    // Calcular rango de fecha: día anterior (desde medianoche a medianoche)
    const now = new Date()
    const yesterdayStart = new Date(now)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)
    yesterdayStart.setHours(0, 0, 0, 0)

    const yesterdayEnd = new Date(now)
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1)
    yesterdayEnd.setHours(23, 59, 59, 999)

    // Consultar todas las reservas del día anterior
    const bookings = await db.booking.findMany({
      where: {
        createdAt: {
          gte: yesterdayStart,
          lte: yesterdayEnd,
        },
      },
      include: {
        driver: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (bookings.length === 0) {
      console.log('[CRON] No hay reservas del día anterior, no se envía reporte')
      return NextResponse.json({
        success: true,
        message: 'No hay reservas del día anterior',
        stats: [],
      })
    }

    // Agrupar por conductor
    const driverMap = new Map<string, DriverStats>()

    for (const booking of bookings) {
      const driverId = booking.driverId
      if (!driverMap.has(driverId)) {
        driverMap.set(driverId, {
          driverId,
          driverName: booking.driver.name,
          driverEmail: booking.driver.email,
          total: 0,
          confirmed: 0,
          pending: 0,
          cancelled: 0,
          completed: 0,
        })
      }

      const stats = driverMap.get(driverId)!
      stats.total++

      switch (booking.status) {
        case 'confirmed':
          stats.confirmed++
          break
        case 'pending':
          stats.pending++
          break
        case 'cancelled':
          stats.cancelled++
          break
        case 'completed':
          stats.completed++
          break
      }
    }

    const allStats = Array.from(driverMap.values())

    if (isAdminMode) {
      // Modo admin: enviar un solo email con reporte global
      const adminEmail = process.env.ADMIN_EMAIL
      if (!adminEmail) {
        console.error('[CRON] ADMIN_EMAIL no configurado')
        return NextResponse.json(
          { success: false, error: 'ADMIN_EMAIL no configurado' },
          { status: 500 }
        )
      }

      await sendAdminDailyReportEmail(adminEmail, allStats)
      console.log(`[CRON] Reporte global enviado a ${adminEmail}: ${allStats.length} conductores, ${bookings.length} reservas`)

      return NextResponse.json({
        success: true,
        message: 'Reporte global enviado al admin',
        driverCount: allStats.length,
        bookingCount: bookings.length,
        stats: allStats,
      })
    }

    // Modo normal: enviar email individual a cada conductor
    const emailPromises = allStats.map(async (stats) => {
      try {
        await sendDailyReportEmail(stats.driverEmail, stats.driverName, stats)
        console.log(`[CRON] Reporte enviado a ${stats.driverName} (${stats.driverEmail})`)
      } catch (err: any) {
        console.error(`[CRON] Error enviando reporte a ${stats.driverName}:`, err.message)
      }
    })

    await Promise.allSettled(emailPromises)

    // También enviar reporte global al admin (si está configurado)
    const adminEmail = process.env.ADMIN_EMAIL
    if (adminEmail) {
      try {
        await sendAdminDailyReportEmail(adminEmail, allStats)
        console.log(`[CRON] Reporte global también enviado a ${adminEmail}`)
      } catch (err: any) {
        console.error(`[CRON] Error enviando reporte global al admin:`, err.message)
      }
    }

    const dateStr = yesterdayStart.toLocaleDateString('es-CH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    return NextResponse.json({
      success: true,
      message: `Reporte diario enviado (${dateStr})`,
      date: yesterdayStart.toISOString(),
      driverCount: allStats.length,
      bookingCount: bookings.length,
      stats: allStats,
    })
  } catch (error: any) {
    console.error('[CRON] Error generando reporte diario:', error.message)
    return NextResponse.json(
      { success: false, error: 'Error al generar el reporte diario' },
      { status: 500 }
    )
  }
}
