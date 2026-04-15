import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { jwtVerify } from 'jose'
import fs from 'fs'

// Obtener el secreto JWT
function getJWTSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || fs.readFileSync('/home/z/.xdg-config/jwt-secret', 'utf8').trim()
  return new TextEncoder().encode(secret)
}

// Verificar sesión del conductor desde el request
async function verifyDriverAuth(request: NextRequest): Promise<{ driverId: string } | null> {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getJWTSecret())
    const driverId = (payload as any).driverId
    if (!driverId) return null
    return { driverId }
  } catch {
    return null
  }
}

/**
 * POST /api/push/subscribe
 * Guardar o actualizar la suscripción push de un conductor
 * Requiere autenticación del conductor (Bearer token)
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación del conductor
    const session = await verifyDriverAuth(request)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autorizado. Se requiere autenticación de conductor.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { endpoint, keys } = body

    // Validar campos obligatorios
    if (!endpoint || !keys?.auth || !keys?.p256dh) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios: endpoint, keys.auth, keys.p256dh' },
        { status: 400 }
      )
    }

    // Upsert: crear o actualizar la suscripción del conductor
    await db.pushSubscription.upsert({
      where: { driverId: session.driverId },
      create: {
        driverId: session.driverId,
        endpoint,
        keysAuth: keys.auth,
        keysP256dh: keys.p256dh,
      },
      update: {
        endpoint,
        keysAuth: keys.auth,
        keysP256dh: keys.p256dh,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Suscripción push registrada correctamente',
    })
  } catch (error: any) {
    console.error('Error registrando suscripción push:', error.message)
    return NextResponse.json(
      { success: false, error: 'Error al registrar la suscripción push' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/push/subscribe
 * Eliminar la suscripción push de un conductor
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await verifyDriverAuth(request)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autorizado.' },
        { status: 401 }
      )
    }

    await db.pushSubscription.deleteMany({
      where: { driverId: session.driverId },
    })

    return NextResponse.json({
      success: true,
      message: 'Suscripción push eliminada',
    })
  } catch (error: any) {
    console.error('Error eliminando suscripción push:', error.message)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar la suscripción push' },
      { status: 500 }
    )
  }
}
