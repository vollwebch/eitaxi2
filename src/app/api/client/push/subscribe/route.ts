import { NextResponse } from 'next/server';
import { requireClientAuth } from '@/lib/client-auth';
import { subscribePush } from '@/lib/push';

export async function POST(request: Request) {
  try {
    const session = await requireClientAuth(request);

    const body = await request.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.auth || !keys?.p256dh) {
      return NextResponse.json(
        { success: false, error: 'Se requieren endpoint y keys (auth, p256dh)' },
        { status: 400 }
      );
    }

    const subscription = await subscribePush({
      clientId: session.clientId,
      endpoint,
      keysAuth: keys.auth,
      keysP256dh: keys.p256dh,
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
    });
  } catch (error) {
    console.error('Push subscribe error:', error);
    return NextResponse.json(
      { success: false, error: 'No autenticado' },
      { status: 401 }
    );
  }
}
