import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getClientFromRequest } from '@/lib/client-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getClientFromRequest(request);

    if (!session) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const bookings = await db.booking.findMany({
      where: { clientId: session.clientId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            whatsapp: true,
            imageUrl: true,
            vehicleBrand: true,
            vehicleModel: true,
            vehicleType: true,
          },
        },
        _count: {
          select: {
            messages: {
              where: { sender: 'driver', isRead: false },
            },
          },
        },
      },
    });

    const bookingsWithUnread = bookings.map(b => ({
      ...b,
      unreadMessages: b._count.messages,
    }));

    return NextResponse.json({ success: true, data: bookingsWithUnread });
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }
    console.error('Client bookings error:', error);
    return NextResponse.json({ success: false, error: 'Error al obtener reservas' }, { status: 500 });
  }
}
