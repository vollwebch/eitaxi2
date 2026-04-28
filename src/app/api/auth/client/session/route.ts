import { NextRequest, NextResponse } from 'next/server';
import { getClientFromRequest } from '@/lib/client-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getClientFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: true, authenticated: false });
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      data: { clientId: session.clientId, name: session.name, email: session.email },
    });
  } catch {
    return NextResponse.json({ success: true, authenticated: false });
  }
}
