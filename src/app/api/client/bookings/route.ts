import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getClientSession as getClientServerSession } from '@/lib/client-auth';

// GET - Obtener reservas del cliente autenticado
export async function GET() {
  try {
    const session = await getClientServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener reservas del cliente
    const bookings = await db.booking.findMany({
      where: { clientId: session.clientId },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleType: true,
            vehicleBrand: true,
            vehicleModel: true,
            imageUrl: true,
            rating: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      data: bookings,
    });
  } catch (error: any) {
    console.error('Error obteniendo reservas del cliente:', error.message);
    return NextResponse.json(
      { success: false, error: 'Error al obtener las reservas' },
      { status: 500 }
    );
  }
}
