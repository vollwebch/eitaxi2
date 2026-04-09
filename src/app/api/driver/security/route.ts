import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    let session
    try {
      session = await requireAuth(request)
    } catch {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { driverId, currentPassword, newEmail, newPassword } = body

    if (body.driverId && body.driverId !== session.driverId) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado' },
        { status: 403 }
      )
    }

    console.log('🔐 Security change request:', {
      driverId,
      hasCurrentPassword: !!currentPassword,
      newEmail: newEmail || 'no change',
      hasNewPassword: !!newPassword
    })

    // Validation
    if (!driverId) {
      return NextResponse.json(
        { success: false, error: 'ID de conductor requerido' },
        { status: 400 }
      )
    }

    if (!currentPassword) {
      return NextResponse.json(
        { success: false, error: 'La contraseña actual es obligatoria' },
        { status: 400 }
      )
    }

    if (!newEmail && !newPassword) {
      return NextResponse.json(
        { success: false, error: 'No hay cambios que realizar' },
        { status: 400 }
      )
    }

    // Find driver
    const driver = await db.taxiDriver.findUnique({
      where: { id: driverId }
    })

    if (!driver) {
      return NextResponse.json(
        { success: false, error: 'Conductor no encontrado' },
        { status: 404 }
      )
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, driver.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'La contraseña actual es incorrecta' },
        { status: 401 }
      )
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {}

    // Handle email change
    if (newEmail && newEmail.toLowerCase() !== driver.email?.toLowerCase()) {
      // Check if email is already in use
      const existingDriver = await db.taxiDriver.findFirst({
        where: {
          email: newEmail.toLowerCase(),
          NOT: { id: driverId }
        }
      })

      if (existingDriver) {
        return NextResponse.json(
          { success: false, error: 'Este email ya está en uso por otro conductor' },
          { status: 400 }
        )
      }

      updateData.email = newEmail.toLowerCase().trim()
      console.log('✅ Email will be updated to:', updateData.email)
    }

    // Handle password change
    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres' },
          { status: 400 }
        )
      }
      updateData.password = await bcrypt.hash(newPassword, 10)
      console.log('✅ Password will be updated')
    }

    // If no actual changes to make
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay cambios que realizar' },
        { status: 400 }
      )
    }

    // Update driver
    const updatedDriver = await db.taxiDriver.update({
      where: { id: driverId },
      data: updateData
    })

    console.log('✅ Security changes saved for driver:', driverId)

    // Build response message
    const changes: string[] = []
    if (updateData.email) changes.push('email')
    if (updateData.password) changes.push('contraseña')

    return NextResponse.json({
      success: true,
      message: `Cambios guardados: ${changes.join(' y ')} actualizado${changes.length > 1 ? 's' : ''}`,
      newEmail: updateData.email || null,
    })

  } catch (error: any) {
    console.error('❌ Error in security change:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Error al guardar los cambios',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}
