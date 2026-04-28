import { NextResponse } from 'next/server'
import { getCacheStats } from '@/lib/cache'
import { requireAuth } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    await requireAuth(request)
  } catch {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
  }

  try {
    const stats = await getCacheStats()
    const hasPersistentCache = stats.type === 'redis'

    return NextResponse.json({
      success: true,
      cache: {
        type: stats.type,
        size: stats.size,
        persistent: hasPersistentCache,
        mode: stats.type === 'memory' ? 'Memoria (se pierde al reiniciar)' : 'Persistente'
      }
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error' }, { status: 500 })
  }
}
