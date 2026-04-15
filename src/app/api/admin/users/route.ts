import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Fetch all clients (exclude password)
    const clients = await db.client.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch all drivers with relevant info
    const drivers = await db.taxiDriver.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsapp: true,
        city: {
          select: { name: true, slug: true },
        },
        canton: {
          select: { name: true, code: true, slug: true },
        },
        vehicleType: true,
        vehicleTypes: true,
        subscription: true,
        isVerified: true,
        isActive: true,
        rating: true,
        experience: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        clients,
        drivers,
        totalClients: clients.length,
        totalDrivers: drivers.length,
      },
    });
  } catch (error) {
    console.error('Admin users fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener los usuarios' },
      { status: 500 }
    );
  }
}
