import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireClientAuth } from '@/lib/client-auth';
import { invalidateCacheByPrefix } from '@/lib/cache';

// DELETE - Remove a driver from favorites
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    const session = await requireClientAuth(request);
    const { driverId } = await params;

    if (!driverId || typeof driverId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'El ID del conductor es requerido' },
        { status: 400 }
      );
    }

    // Find and delete the favorite
    const favorite = await db.clientFavorite.findUnique({
      where: {
        clientId_driverId: {
          clientId: session.clientId,
          driverId,
        },
      },
    });

    if (!favorite) {
      return NextResponse.json(
        { success: false, error: 'Favorito no encontrado' },
        { status: 404 }
      );
    }

    await db.clientFavorite.delete({
      where: {
        clientId_driverId: {
          clientId: session.clientId,
          driverId,
        },
      },
    });

    // Invalidate taxi cache so favoriteCount updates
    try { await invalidateCacheByPrefix('taxis:'); } catch {}

    return NextResponse.json({ success: true, data: { removed: true } });
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }
    console.error('Remove favorite error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar favorito' },
      { status: 500 }
    );
  }
}
