import { NextResponse } from 'next/server';
import { CLIENT_SESSION_COOKIE } from '@/lib/client-auth';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: CLIENT_SESSION_COOKIE,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('Client logout error:', error);
    return NextResponse.json({ success: false, error: 'Error al cerrar sesion' }, { status: 500 });
  }
}
