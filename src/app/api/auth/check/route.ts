import { NextResponse } from 'next/server'
import { getClientServerSession } from '@/lib/client-auth'
import { getServerSession } from '@/lib/auth'

export async function GET() {
  try {
    // Check client auth
    const clientSession = await getClientServerSession()
    const client = clientSession
      ? {
          clientId: clientSession.clientId,
          email: clientSession.email,
          name: clientSession.name,
        }
      : null

    // Check driver auth
    const driverSession = await getServerSession()
    const driver = driverSession
      ? {
          driverId: driverSession.driverId,
          email: driverSession.email,
          name: driverSession.name,
        }
      : null

    return NextResponse.json({
      success: true,
      data: { client, driver },
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({
      success: true,
      data: { client: null, driver: null },
    })
  }
}
