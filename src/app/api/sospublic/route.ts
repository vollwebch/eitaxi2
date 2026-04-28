import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Public endpoint to get SOS alert location (no auth required)
// Usage: /api/sos-tracking?token=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token requerido' },
        { status: 400 }
      );
    }

    const alert = await db.sOSAlert.findUnique({
      where: { trackingToken: token },
      include: {
        client: {
          select: { name: true },
        },
      },
    });

    if (!alert) {
      return NextResponse.json(
        { success: false, error: 'Alerta no encontrada o expirada', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (alert.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Esta alerta ha sido desactivada', code: 'INACTIVE' },
        { status: 410 }
      );
    }

    // Check expiration
    if (alert.expiresAt && new Date() > alert.expiresAt) {
      await db.sOSAlert.update({
        where: { id: alert.id },
        data: { status: 'resolved', trackingToken: null, updatedAt: new Date() },
      });
      return NextResponse.json(
        { success: false, error: 'Esta alerta ha expirado', code: 'EXPIRED' },
        { status: 410 }
      );
    }

    // Calculate how old the location is
    const now = Date.now();
    const updatedAt = new Date(alert.updatedAt).getTime();
    const ageSeconds = Math.floor((now - updatedAt) / 1000);

    return NextResponse.json({
      success: true,
      data: {
        latitude: alert.latitude,
        longitude: alert.longitude,
        hasLocation: alert.latitude !== null && alert.longitude !== null,
        ageSeconds,
        updatedAt: alert.updatedAt,
        expiresAt: alert.expiresAt,
        clientName: alert.client?.name || 'Persona',
      },
    });
  } catch (error) {
    console.error('Get SOS tracking error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener ubicación' },
      { status: 500 }
    );
  }
}
