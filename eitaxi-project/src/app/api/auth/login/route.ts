import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

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

    // Return driver data (without password)
    const { password: _, ...driverWithoutPassword } = driver

    return NextResponse.json({
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
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al iniciar sesión' },
      { status: 500 }
    )
  }
}
