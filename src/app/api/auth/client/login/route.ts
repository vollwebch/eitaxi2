import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { createClientSessionToken, clientSessionCookieOptions } from '@/lib/client-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Find client by email
    const client = await db.client.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, client.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

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
    console.error('Client login error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al iniciar sesión' },
      { status: 500 }
    )
  }
}
