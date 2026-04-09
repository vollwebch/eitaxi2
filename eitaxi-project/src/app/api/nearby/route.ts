import { NextRequest, NextResponse } from 'next/server'
import { getCached, setCache } from '@/lib/cache'

// ============================================
// POIs CERCANOS (Nearby)
// ============================================

interface POIResult {
  id: string
  name: string
  type: string
  typeName: string
  icon: string
  lat: number
  lon: number
  distance: number
  street: string | null
  housenumber: string | null
  postcode: string | null
  city: string | null
  fullAddress: string
}

const POI_TYPES: Record<string, { query: string; typeName: string; icon: string }> = {
  gas: { query: 'tankstelle fuel', typeName: 'Gasolinera', icon: '⛽' },
  pharmacy: { query: 'apotheke pharmacy', typeName: 'Farmacia', icon: '💊' },
  hospital: { query: 'hospital spital', typeName: 'Hospital', icon: '🏥' },
  supermarket: { query: 'supermarket migros coop', typeName: 'Supermercado', icon: '🛒' },
  train: { query: 'bahnhof station', typeName: 'Estación de tren', icon: '🚂' }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')
    const type = searchParams.get('type') || 'all'

    if (!lat || !lon) {
      return NextResponse.json({ success: false, error: 'Se requieren lat y lon' }, { status: 400 })
    }

    const latNum = parseFloat(lat)
    const lonNum = parseFloat(lon)

    if (latNum < 45.8 || latNum > 47.9 || lonNum < 5.9 || lonNum > 10.5) {
      return NextResponse.json({ success: false, error: 'Ubicación fuera de Suiza o Liechtenstein' })
    }

    const cacheKey = `nearby:${latNum.toFixed(4)}:${lonNum.toFixed(4)}:${type}`
    const cached = await getCached<Record<string, POIResult[]>>(cacheKey)
    if (cached) {
      return NextResponse.json({ success: true, results: cached.data, fromCache: true })
    }

    const typesToSearch = type === 'all' ? Object.keys(POI_TYPES) : type.split(',').filter(t => POI_TYPES[t])
    const results: Record<string, POIResult[]> = {}
    const bbox = '5.9,45.8,10.5,47.9'

    for (const poiType of typesToSearch) {
      const poiConfig = POI_TYPES[poiType]
      try {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(poiConfig.query)}&lat=${latNum}&lon=${lonNum}&location_bias_scale=0.5&limit=5&bbox=${bbox}`
        const response = await fetch(url, { signal: AbortSignal.timeout(6000), headers: { 'Accept': 'application/json' } })

        if (!response.ok) { results[poiType] = []; continue }

        const data = await response.json()
        const pois: POIResult[] = []

        for (const feature of data.features || []) {
          const [poiLon, poiLat] = feature.geometry.coordinates
          const props = feature.properties

          if (poiLat < 45.8 || poiLat > 47.9 || poiLon < 5.9 || poiLon > 10.5) continue

          const distance = calculateDistance(latNum, lonNum, poiLat, poiLon)
          if (distance > 10) continue

          const street = props.street || null
          const housenumber = props.housenumber || null
          const postcode = props.postcode || null
          const city = props.city || null

          let fullAddress = props.name || ''
          if (street) fullAddress += `, ${street}${housenumber ? ` ${housenumber}` : ''}`
          if (postcode && city) fullAddress += `, ${postcode} ${city}`

          pois.push({
            id: `poi-${poiLat.toFixed(6)}-${poiLon.toFixed(6)}`,
            name: props.name || poiConfig.typeName,
            type: poiType,
            typeName: poiConfig.typeName,
            icon: poiConfig.icon,
            lat: poiLat,
            lon: poiLon,
            distance: Math.round(distance * 10) / 10,
            street, housenumber, postcode, city,
            fullAddress
          })
        }

        pois.sort((a, b) => a.distance - b.distance)
        results[poiType] = pois.slice(0, 5)
      } catch {
        results[poiType] = []
      }
    }

    await setCache(cacheKey, results, 10 * 60 * 1000)
    return NextResponse.json({ success: true, results, fromCache: false })

  } catch (error) {
    console.error('Nearby error:', error)
    return NextResponse.json({ success: false, error: 'Error al buscar POIs' }, { status: 500 })
  }
}
