import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyClientSessionToken, CLIENT_SESSION_COOKIE_NAME as CLIENT_COOKIE_NAME } from '@/lib/client-auth';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación del cliente
    const token = request.cookies.get(CLIENT_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }
    const session = await verifyClientSessionToken(token);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Sesión inválida' }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys || !keys.auth || !keys.p256dh) {
      return NextResponse.json({ success: false, error: 'Datos de suscripción incompletos' }, { status: 400 });
    }

    // Upsert
    await db.clientPushSubscription.upsert({
      where: { endpoint },
      create: {
        clientId: session.clientId,
        endpoint,
        keysAuth: keys.auth,
        keysP256dh: keys.p256dh,
      },
      update: {
        clientId: session.clientId,
        keysAuth: keys.auth,
        keysP256dh: keys.p256dh,
      },
    });

    return NextResponse.json({ success: true, message: 'Suscripción registrada' });
  } catch (error: any) {
    console.error('Error en push-subscribe:', error.message);
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get(CLIENT_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }
    const session = await verifyClientSessionToken(token);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Sesión inválida' }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = body;

    if (endpoint) {
      await db.clientPushSubscription.deleteMany({
        where: { clientId: session.clientId, endpoint },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error eliminando suscripción:', error.message);
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}
