import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireClientAuth } from '@/lib/client-auth';
import crypto from 'crypto';

// Generate a secure random token for public tracking
function generateTrackingToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

// POST - Create an SOS alert with tracking token
export async function POST(request: NextRequest) {
  try {
    const session = await requireClientAuth(request);
    const body = await request.json();
    const { latitude, longitude, message } = body;

    // Validate coordinates if provided
    if (latitude !== undefined && latitude !== null) {
      if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
        return NextResponse.json(
          { success: false, error: 'Latitud debe ser un número entre -90 y 90' },
          { status: 400 }
        );
      }
    }
    if (longitude !== undefined && longitude !== null) {
      if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
        return NextResponse.json(
          { success: false, error: 'Longitud debe ser un número entre -180 y 180' },
          { status: 400 }
        );
      }
    }

    // Resolve any previous active alerts for this client
    await db.sOSAlert.updateMany({
      where: {
        clientId: session.clientId,
        status: 'active',
      },
      data: {
        status: 'resolved',
        trackingToken: null,
        expiresAt: null,
        updatedAt: new Date(),
      },
    });

    // Generate tracking token
    const trackingToken = generateTrackingToken();

    // Expires in 2 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2);

    const sosAlert = await db.sOSAlert.create({
      data: {
        clientId: session.clientId,
        latitude,
        longitude,
        message: message || null,
        trackingToken,
        expiresAt,
      },
    });

    // Fetch emergency contacts for the WhatsApp message
    const contacts = await db.emergencyContact.findMany({
      where: { clientId: session.clientId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: sosAlert,
      contacts,
      trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/track/sos/${trackingToken}`,
    }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }
    console.error('Create SOS alert error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear alerta SOS' },
      { status: 500 }
    );
  }
}

// GET - List client's SOS alerts (last 10)
export async function GET(request: NextRequest) {
  try {
    const session = await requireClientAuth(request);

    const alerts = await db.sOSAlert.findMany({
      where: { clientId: session.clientId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({ success: true, data: alerts });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }
    console.error('Get SOS alerts error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener alertas SOS' },
      { status: 500 }
    );
  }
}
