import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { createClientSessionToken, clientSessionCookieOptions } from '@/lib/client-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email y contrasena son requeridos' }, { status: 400 });
    }

    const client = await db.client.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!client) {
      return NextResponse.json({ success: false, error: 'Credenciales incorrectas' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, client.password);
    if (!valid) {
      return NextResponse.json({ success: false, error: 'Credenciales incorrectas' }, { status: 401 });
    }

    const token = await createClientSessionToken({
      id: client.id,
      email: client.email,
      name: client.name,
    });

    const response = NextResponse.json({
      success: true,
      data: { id: client.id, name: client.name, email: client.email, phone: client.phone },
    });

    response.cookies.set({
      name: clientSessionCookieOptions.name,
      value: token,
      httpOnly: clientSessionCookieOptions.httpOnly,
      secure: clientSessionCookieOptions.secure,
      sameSite: clientSessionCookieOptions.sameSite,
      maxAge: clientSessionCookieOptions.maxAge,
      path: clientSessionCookieOptions.path,
    });

    return response;
  } catch (error) {
    console.error('Client login error:', error);
    return NextResponse.json({ success: false, error: 'Error al iniciar sesion' }, { status: 500 });
  }
}
