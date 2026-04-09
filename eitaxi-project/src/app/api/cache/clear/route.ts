import { NextResponse } from 'next/server'
import { clearCache } from '@/lib/cache'

// Caché de conductores en memoria (desde search/route.ts)
// Lo limpiamos reseteando el servidor

export async function POST() {
  try {
    await clearCache()
    
    return NextResponse.json({
      success: true,
      message: 'Caché limpiado correctamente. Reinicia el servidor para limpiar el caché de conductores.'
    })
  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al limpiar el caché'
    }, { status: 500 })
  }
}

export async function GET() {
  return POST()
}
