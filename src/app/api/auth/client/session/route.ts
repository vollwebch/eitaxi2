import { NextResponse } from 'next/server'
import { getClientSession } from '@/lib/client-auth'

export async function GET() {
  try {
    const session = await getClientSession()

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        clientId: session.clientId,
        email: session.email,
        name: session.name,
      },
    })
  } catch (error) {
    console.error('Client session check error:', error)
    return NextResponse.json(
      { success: false, error: 'No autenticado' },
      { status: 401 }
    )
  }
}
