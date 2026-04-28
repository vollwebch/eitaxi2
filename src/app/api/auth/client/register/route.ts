import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createClientSessionToken, clientSessionCookieOptions } from '@/lib/client-auth';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, password } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'El nombre es requerido' }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ success: false, error: 'El email es requerido' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, error: 'La contrasena debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const existing = await db.client.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Ya existe una cuenta con este email' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const client = await db.client.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        password: hashedPassword,
      },
    });

    const token = await createClientSessionToken({
      id: client.id,
      email: client.email,
      name: client.name,
    });

    const response = NextResponse.json({
      success: true,
      data: { id: client.id, name: client.name, email: client.email },
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
    console.error('Client register error:', error);
    return NextResponse.json({ success: false, error: 'Error al registrar' }, { status: 500 });
  }
}
