import { NextRequest, NextResponse } from 'next/server'

/**
 * API de Geocodificación con Nominatim (OpenStreetMap)
 * Busca lugares, ciudades, municipios para el sistema de exclusiones
 */

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  type: string
  class: string
  address?: {
    city?: string
    town?: string
    village?: string
    municipality?: string
    county?: string
    state?: string
    postcode?: string
    country?: string
    country_code?: string
  }
}

interface GeocodeResult {
  id: string
  name: string
  displayName: string
  type: 'city' | 'town' | 'village' | 'municipality' | 'county' | 'state' | 'other'
  lat: number
  lon: number
  canton?: string
  country: string
  countryCode: string
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const limit = parseInt(searchParams.get('limit') || '10')
  const countrycodes = searchParams.get('countrycodes') || 'ch,li,de,at'
  const canton = searchParams.get('canton') // Para filtrar por cantón

  if (!query || query.length < 2) {
    return NextResponse.json({
      success: true,
      results: []
    })
  }

  try {
    // Construir búsqueda para Nominatim
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: limit.toString(),
      countrycodes,
      'accept-language': 'de,en'
    })

    // Si hay cantón, agregarlo a la búsqueda para priorizar resultados
    const searchUrl = canton
      ? `https://nominatim.openstreetmap.org/search?${params}&state=${encodeURIComponent(canton)}`
      : `https://nominatim.openstreetmap.org/search?${params}`

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'EiTaxi/1.0 (contact@eitaxi.ch)',
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status}`)
    }

    const data: NominatimResult[] = await response.json()

    // Procesar y formatear resultados
    const results: GeocodeResult[] = data.map(result => {
      const addr = result.address || {}
      
      // Determinar el nombre principal del lugar
      let name = addr.city || addr.town || addr.village || addr.municipality || result.display_name.split(',')[0]
      
      // Determinar tipo
      let type: GeocodeResult['type'] = 'other'
      if (result.type === 'city' || result.type === 'town') type = 'city'
      else if (result.type === 'village' || result.type === 'hamlet') type = 'village'
      else if (result.type === 'municipality') type = 'municipality'
      else if (result.type === 'county' || result.class === 'boundary' && result.type === 'administrative') type = 'county'
      else if (result.type === 'state' || result.class === 'boundary' && result.type === 'administrative') type = 'state'

      // Agregar cantón al nombre si está disponible
      const cantonName = addr.state || addr.county || ''
      
      // Formatear nombre con cantón para mejor identificación
      const formattedName = cantonName && !name.includes(cantonName) 
        ? `${name} (${cantonName})` 
        : name

      return {
        id: `nominatim-${result.place_id}`,
        name: formattedName,
        displayName: result.display_name,
        type,
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        canton: cantonName,
        country: addr.country || '',
        countryCode: (addr.country_code || '').toUpperCase()
      }
    })

    // Si se especificó un cantón, priorizar resultados de ese cantón
    let filteredResults = results
    if (canton) {
      const cantonLower = canton.toLowerCase()
      filteredResults = results.sort((a, b) => {
        const aMatch = a.canton?.toLowerCase().includes(cantonLower) ? 0 : 1
        const bMatch = b.canton?.toLowerCase().includes(cantonLower) ? 0 : 1
        return aMatch - bMatch
      })
    }

    return NextResponse.json({
      success: true,
      results: filteredResults,
      total: filteredResults.length
    })

  } catch (error) {
    console.error('Geocode API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al buscar lugares',
      results: []
    }, { status: 500 })
  }
}
