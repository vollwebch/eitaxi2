import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { createSessionToken, sessionCookieOptions } from '@/lib/auth'

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

    // Find driver by email
    const driver = await db.taxiDriver.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        city: true,
        canton: true,
        driverRoutes: true,
        schedules: true,
      },
    })

    if (!driver) {
      return NextResponse.json(
        { success: false, error: 'Email o contraseña incorrectos' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, driver.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Email o contraseña incorrectos' },
        { status: 401 }
      )
    }

    // Crear token JWT firmado (server-side, seguro)
    const sessionToken = await createSessionToken({
      id: driver.id,
      email: driver.email,
      name: driver.name,
    })

    // Return driver data (without password) + cookie segura
    const { password: _, ...driverWithoutPassword } = driver

    const response = NextResponse.json({
      success: true,
      data: {
        ...driverWithoutPassword,
        services: JSON.parse(driver.services as string),
        routes: JSON.parse(driver.routes as string),
        languages: JSON.parse(driver.languages as string),
        serviceZones: JSON.parse(driver.serviceZones as string),
        workingHours: driver.workingHours ? JSON.parse(driver.workingHours as string) : null,
      },
      profileUrl: `/${driver.canton.slug}/${driver.city.slug}/${driver.slug}`,
    })

    // Establecer cookie HTTP-only con el JWT firmado
    response.cookies.set(sessionCookieOptions.name, sessionToken, sessionCookieOptions)

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al iniciar sesión' },
      { status: 500 }
    )
  }
}
