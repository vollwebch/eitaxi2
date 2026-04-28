import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireClientAuth } from '@/lib/client-auth';

// GET - Client statistics
export async function GET(request: NextRequest) {
  try {
    const session = await requireClientAuth(request);

    // Run aggregation queries in parallel
    // Base filter: exclude trashed bookings
    const baseFilter = { clientId: session.clientId, deletedAt: null };

    const [
      totalBookings,
      completedBookings,
      cancelledBookings,
      pendingBookings,
      totalSpentResult,
      lastBooking,
      completedBookingsWithDriver,
    ] = await Promise.all([
      // Total bookings count
      db.booking.count({
        where: baseFilter,
      }),

      // Completed bookings count
      db.booking.count({
        where: { ...baseFilter, status: 'completed' },
      }),

      // Cancelled bookings count
      db.booking.count({
        where: { ...baseFilter, status: 'cancelled' },
      }),

      // Pending bookings count
      db.booking.count({
        where: { ...baseFilter, status: 'pending' },
      }),

      // Total spent (sum of estimatedPrice for completed bookings)
      db.booking.aggregate({
        where: { ...baseFilter, status: 'completed' },
        _sum: { estimatedPrice: true },
      }),

      // Last booking (most recent)
      db.booking.findFirst({
        where: baseFilter,
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),

      // All completed bookings with driver info (to find favorite driver)
      db.booking.findMany({
        where: { ...baseFilter, status: 'completed' },
        include: {
          driver: {
            select: { id: true, name: true, imageUrl: true, vehicleBrand: true, vehicleModel: true },
          },
        },
      }),
    ]);

    // Calculate favorite driver (driver with most completed bookings)
    const driverCounts: Record<string, { count: number; driver: typeof completedBookingsWithDriver[0]['driver'] }> = {};
    for (const booking of completedBookingsWithDriver) {
      const did = booking.driverId;
      if (!driverCounts[did]) {
        driverCounts[did] = { count: 0, driver: booking.driver };
      }
      driverCounts[did].count++;
    }

    let favoriteDriver = null;
    let maxCount = 0;
    for (const [, entry] of Object.entries(driverCounts)) {
      if (entry.count > maxCount) {
        maxCount = entry.count;
        favoriteDriver = entry.driver;
      }
    }

    const data = {
      totalBookings,
      completedBookings,
      cancelledBookings,
      pendingBookings,
      totalSpent: totalSpentResult._sum.estimatedPrice || 0,
      favoriteDriver,
      lastBooking: lastBooking?.createdAt || null,
    };

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }
    console.error('Client statistics error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener estadisticas' },
      { status: 500 }
    );
  }
}
