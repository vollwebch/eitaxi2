import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireClientAuth } from '@/lib/client-auth';

// PUT - Update GPS location of an active SOS alert
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireClientAuth(request);
    const { id } = await params;
    const body = await request.json();
    const { latitude, longitude } = body;

    // Validate coordinates
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Coordenadas inválidas' },
        { status: 400 }
      );
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { success: false, error: 'Rango de coordenadas inválido' },
        { status: 400 }
      );
    }

    // Verify the SOS alert belongs to this client and is active
    const alert = await db.sOSAlert.findUnique({
      where: { id },
    });

    if (!alert) {
      return NextResponse.json(
        { success: false, error: 'Alerta no encontrada' },
        { status: 404 }
      );
    }

    if (alert.clientId !== session.clientId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    if (alert.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Alerta ya está resuelta' },
        { status: 400 }
      );
    }

    // Check expiration
    if (alert.expiresAt && new Date() > alert.expiresAt) {
      await db.sOSAlert.update({
        where: { id },
        data: { status: 'resolved', trackingToken: null, updatedAt: new Date() },
      });
      return NextResponse.json(
        { success: false, error: 'Alerta expirada' },
        { status: 400 }
      );
    }

    // Update location
    const updated = await db.sOSAlert.update({
      where: { id },
      data: {
        latitude,
        longitude,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }
    console.error('Update SOS location error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar ubicación' },
      { status: 500 }
    );
  }
}
