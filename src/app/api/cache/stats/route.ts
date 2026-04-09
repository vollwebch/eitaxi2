import { NextResponse } from 'next/server'
import { getCacheStats } from '@/lib/cache'

export async function GET() {
  try {
    const stats = await getCacheStats()
    const redisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

    return NextResponse.json({
      success: true,
      cache: {
        type: stats.type,
        size: stats.size,
        redisConfigured,
        mode: stats.type === 'memory' ? 'Memoria (se pierde al reiniciar)' : 'Redis (persistente)'
      }
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error' }, { status: 500 })
  }
}
