import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { createClientSessionToken, clientSessionCookieOptions } from '@/lib/client-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, password } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido (mínimo 2 caracteres)' },
        { status: 400 }
      )
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      )
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if email already exists
    const existingClient = await db.client.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingClient) {
      return NextResponse.json(
        { success: false, error: 'Este email ya está registrado' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create client
    const client = await db.client.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || null,
        password: hashedPassword,
      },
    })

    // Create JWT session token
    const sessionToken = await createClientSessionToken({
      id: client.id,
      email: client.email,
      name: client.name,
    })

    const response = NextResponse.json({
      success: true,
      data: {
        clientId: client.id,
        email: client.email,
        name: client.name,
      },
    })

    // Set HTTP-only cookie with JWT
    response.cookies.set(clientSessionCookieOptions.name, sessionToken, clientSessionCookieOptions)

    return response
  } catch (error) {
    console.error('Client register error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear la cuenta' },
      { status: 500 }
    )
  }
}
