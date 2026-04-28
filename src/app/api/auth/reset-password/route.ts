import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { sendResetPasswordEmail } from '@/lib/email'

// POST - Solicitar reset de contraseña (envía email con token)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email es requerido' },
        { status: 400 }
      )
    }

    // Find driver by email
    const driver = await db.taxiDriver.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Por seguridad, siempre devolvemos success aunque no exista
    // para evitar que se sepa si un email está registrado
    if (!driver) {
      return NextResponse.json({
        success: true,
        message: 'Si el email existe, recibirás un enlace de recuperación',
      })
    }

    // Generar token único
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    // Guardar token en la base de datos
    await db.taxiDriver.update({
      where: { id: driver.id },
      data: {
        resetToken,
        resetTokenExpires,
      },
    })

    // En producción, aquí enviaríamos un email
    // Por ahora, devolvemos el token para que se pueda usar directamente
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://eitaxi.ch'}/restablecer-password/${resetToken}`

    if (process.env.NODE_ENV === 'development') {
      console.log('📧 PASSWORD RESET para:', driver.email)
      console.log('🔗 URL:', resetUrl)
    }

    // Enviar email real con el enlace de restablecimiento
    await sendResetPasswordEmail({
      to: driver.email,
      name: driver.name,
      resetUrl,
    });

    return NextResponse.json({
      success: true,
      message: 'Si el email existe, recibirás un enlace de recuperación',
      // Solo en desarrollo, mostrar el token
      ...(process.env.NODE_ENV === 'development' && {
        _dev_token: resetToken,
        _dev_url: resetUrl,
      }),
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}

// GET - Verificar si el token es válido
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token es requerido' },
        { status: 400 }
      )
    }

    // Buscar conductor con este token que no haya expirado
    const driver = await db.taxiDriver.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: {
          gt: new Date(),
        },
      },
    })

    if (!driver) {
      return NextResponse.json(
        { success: false, error: 'Token inválido o expirado' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      email: driver.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Ocultar email
    })
  } catch (error) {
    console.error('Verify token error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al verificar el token' },
      { status: 500 }
    )
  }
}

// PUT - Restablecer contraseña con token
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword } = body

    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Token y nueva contraseña son requeridos' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Buscar conductor con este token que no haya expirado
    const driver = await db.taxiDriver.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: {
          gt: new Date(),
        },
      },
    })

    if (!driver) {
      return NextResponse.json(
        { success: false, error: 'Token inválido o expirado' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password and clear token
    await db.taxiDriver.update({
      where: { id: driver.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada correctamente',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al restablecer la contraseña' },
      { status: 500 }
    )
  }
}
