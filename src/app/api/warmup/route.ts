import { NextResponse } from 'next/server'
import { setCache } from '@/lib/cache'

// Aeropuertos estáticos
const STATIC_AIRPORTS = [
  { id: 'airport-zurich', name: 'Aeropuerto de Zúrich', postcode: '8302', city: 'Kloten', state: 'Zürich', lat: 47.4647, lon: 8.5492, icon: '✈️' },
  { id: 'airport-geneva', name: 'Aeropuerto de Ginebra', postcode: '1215', city: 'Genève', state: 'Genève', lat: 46.2380, lon: 6.1089, icon: '✈️' },
  { id: 'airport-basel', name: 'EuroAirport Basel', postcode: '4030', city: 'Basel', state: 'Basel-Stadt', lat: 47.5896, lon: 7.5299, icon: '✈️' }
]

const FREQUENT_SEARCHES = ['migros', 'coop', 'bahnhof', 'zurich', 'basel', 'bern', 'luzern']

export async function GET() {
  const results: { query: string; status: string }[] = []
  let successCount = 0

  // Pre-calentar aeropuertos
  for (const term of ['aeropuerto', 'airport', 'flughafen']) {
    await setCache(`photon:${term}:0:0`, STATIC_AIRPORTS, 60 * 60 * 1000)
    results.push({ query: term, status: '✅ aeropuertos' })
    successCount++
  }

  // Pre-calentar búsquedas frecuentes
  for (const query of FREQUENT_SEARCHES) {
    try {
      const res = await fetch(`http://localhost:3000/api/locations?q=${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(10000) })
      const data = await res.json()
      results.push({ query, status: data.success ? `✅ ${data.count || 0} resultados` : '⚠️ error' })
      if (data.success) successCount++
    } catch {
      results.push({ query, status: '❌ timeout' })
    }
    await new Promise(r => setTimeout(r, 100))
  }

  return NextResponse.json({
    success: true,
    message: `🔥 Pre-calentamiento: ${successCount} búsquedas cargadas`,
    results
  })
}
