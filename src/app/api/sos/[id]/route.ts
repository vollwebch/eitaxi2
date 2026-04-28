import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireClientAuth } from '@/lib/client-auth';

// PATCH - Resolve/deactivate an SOS alert
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireClientAuth(request);
    const { id } = await params;

    // Verify the SOS alert belongs to this client
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
        { success: false, error: 'La alerta ya está desactivada' },
        { status: 400 }
      );
    }

    // Deactivate: resolve + remove tracking token
    const updated = await db.sOSAlert.update({
      where: { id },
      data: {
        status: 'resolved',
        trackingToken: null,
        expiresAt: null,
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
    console.error('Deactivate SOS error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al desactivar alerta' },
      { status: 500 }
    );
  }
}
