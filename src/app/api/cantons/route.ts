import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCached, setCache } from '@/lib/cache'

// Cache cantons for 5 minutes
const CACHE_KEY = 'cantons:list'
const CACHE_TTL = 5 * 60 * 1000

export async function GET() {
  try {
    // Check cache first
    const cached = await getCached<any>(CACHE_KEY)
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        fromCache: true
      })
    }

    // Consulta ligera: solo cantones con conteo de conductores
    // NO incluir cities (2482 municipios) para evitar timeout en Supabase
    const cantons = await db.canton.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        slug: true,
        country: true,
        _count: {
          select: { drivers: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Save to cache
    await setCache(CACHE_KEY, cantons, CACHE_TTL)

    return NextResponse.json({
      success: true,
      data: cantons,
    })
  } catch (error) {
    console.error('Error fetching cantons:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener cantones' },
      { status: 500 }
    )
  }
}
