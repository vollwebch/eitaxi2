import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireClientAuth } from '@/lib/client-auth';
import { invalidateCacheByPrefix } from '@/lib/cache';

// GET - List client's favorite drivers
export async function GET(request: NextRequest) {
  try {
    const session = await requireClientAuth(request);

    const favorites = await db.clientFavorite.findMany({
      where: { clientId: session.clientId },
      orderBy: { createdAt: 'desc' },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            vehicleBrand: true,
            vehicleModel: true,
            city: {
              select: { name: true },
            },
            rating: true,
            phone: true,
          },
        },
      },
    });

    // Flatten driver info into the response
    const data = favorites.map((fav) => ({
      id: fav.id,
      driverId: fav.driver.id,
      name: fav.driver.name,
      imageUrl: fav.driver.imageUrl,
      vehicleBrand: fav.driver.vehicleBrand,
      vehicleModel: fav.driver.vehicleModel,
      city: fav.driver.city?.name || null,
      rating: fav.driver.rating,
      phone: fav.driver.phone,
      addedAt: fav.createdAt,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }
    console.error('Get favorites error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener favoritos' },
      { status: 500 }
    );
  }
}

// POST - Add a driver to favorites
export async function POST(request: NextRequest) {
  try {
    const session = await requireClientAuth(request);
    const body = await request.json();
    const { driverId } = body;

    if (!driverId || typeof driverId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'El ID del conductor es requerido' },
        { status: 400 }
      );
    }

    // Verify driver exists
    const driver = await db.taxiDriver.findUnique({
      where: { id: driverId },
      select: { id: true, name: true },
    });

    if (!driver) {
      return NextResponse.json(
        { success: false, error: 'Conductor no encontrado' },
        { status: 404 }
      );
    }

    // Try to find existing favorite (unique constraint on [clientId, driverId])
    const existing = await db.clientFavorite.findUnique({
      where: {
        clientId_driverId: {
          clientId: session.clientId,
          driverId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ success: true, data: existing });
    }

    // Create new favorite
    const favorite = await db.clientFavorite.create({
      data: {
        clientId: session.clientId,
        driverId,
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            vehicleBrand: true,
            vehicleModel: true,
            city: {
              select: { name: true },
            },
            rating: true,
            phone: true,
          },
        },
      },
    });

    // Invalidate taxi cache so favoriteCount updates
    await invalidateTaxiCache();

    const data = {
      id: favorite.id,
      driverId: favorite.driver.id,
      name: favorite.driver.name,
      imageUrl: favorite.driver.imageUrl,
      vehicleBrand: favorite.driver.vehicleBrand,
      vehicleModel: favorite.driver.vehicleModel,
      city: favorite.driver.city?.name || null,
      rating: favorite.driver.rating,
      phone: favorite.driver.phone,
      addedAt: favorite.createdAt,
    };

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }
    console.error('Add favorite error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al agregar favorito' },
      { status: 500 }
    );
  }
}

// Helper: invalidate taxi cache when favorites change
async function invalidateTaxiCache() {
  try {
    await invalidateCacheByPrefix('taxis:');
  } catch {}
}
