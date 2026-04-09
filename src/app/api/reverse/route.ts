import { NextRequest, NextResponse } from 'next/server'
import { getCached, setCache } from '@/lib/cache'

// ============================================
// REVERSE GEOCODING
// Convierte coordenadas (lat, lon) en dirección
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')

    if (!lat || !lon) {
      return NextResponse.json({
        success: false,
        error: 'Se requieren lat y lon'
      }, { status: 400 })
    }

    const latNum = parseFloat(lat)
    const lonNum = parseFloat(lon)

    // Validar que esté en Suiza o Liechtenstein (aproximadamente)
    // Suiza: lat 45.8-48.0, lon 5.9-10.5
    // Liechtenstein: lat 47.0-47.3, lon 9.5-9.6
    const isInSwitzerland = latNum >= 45.8 && latNum <= 48.0 && lonNum >= 5.9 && lonNum <= 10.5

    if (!isInSwitzerland) {
      return NextResponse.json({
        success: false,
        error: `Tu ubicación parece estar fuera de Suiza o Liechtenstein. eitaxi solo opera en estos países. (Coordenadas: ${latNum.toFixed(4)}, ${lonNum.toFixed(4)})`,
        coordinates: { lat: latNum, lon: lonNum }
      })
    }

    // Verificar caché
    const cacheKey = `reverse:${latNum.toFixed(4)}:${lonNum.toFixed(4)}`
    const cached = await getCached<any>(cacheKey)
    if (cached) {
      return NextResponse.json({ success: true, ...cached.data, fromCache: true })
    }

    // Llamar a Nominatim Reverse
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latNum}&lon=${lonNum}&format=json&addressdetails=1&accept-language=es`

    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': 'TaxiSwissBot/1.0',
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Nominatim error')
    }

    const data = await response.json()
    const address = data.address || {}

    // Construir shortAddress primero
    const street = address.road || address.street || null
    const housenumber = address.house_number || null
    const postcode = address.postcode || null
    const city = address.city || address.town || address.village || address.municipality || null
    
    let shortAddress = ''
    if (street) {
      shortAddress = housenumber ? `${street} ${housenumber}` : street
    }
    if (postcode && city) {
      shortAddress += `, ${postcode} ${city}`
    } else if (city) {
      shortAddress += `, ${city}`
    }

    const result = {
      lat: latNum,
      lon: lonNum,
      name: data.name || address.road || 'Ubicación actual',
      street,
      housenumber,
      postcode,
      city,
      state: address.state || null,
      canton: address.state || null,
      cantonCode: extractCantonCode(address.state || '', address.country_code || ''),
      country: address.country_code?.toUpperCase() === 'LI' ? 'LI' : 'CH',
      countryCode: address.country_code?.toUpperCase() || 'CH',
      fullAddress: data.display_name?.split(',').slice(0, 4).join(',') || '',
      shortAddress: shortAddress || data.name || address.road || 'Ubicación actual',
      type: 'address',
      typeName: 'Tu ubicación',
      icon: '📍'
    }

    // Guardar en caché
    await setCache(cacheKey, result, 30 * 60 * 1000)

    return NextResponse.json({
      success: true,
      ...result,
      fromCache: false
    })

  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return NextResponse.json({
      success: false,
      error: 'No se pudo obtener la dirección'
    }, { status: 500 })
  }
}

/**
 * Extraer código de cantón del nombre del estado
 */
function extractCantonCode(stateName: string, countryCode: string): string {
  // Liechtenstein
  if (countryCode.toLowerCase() === 'li') {
    return 'LI';
  }

  // Mapeo de nombres de cantones suizos a códigos
  const cantonMap: Record<string, string> = {
    'zürich': 'ZH',
    'zurich': 'ZH',
    'bern': 'BE',
    'berne': 'BE',
    'luzern': 'LU',
    'lucerne': 'LU',
    'uri': 'UR',
    'schwyz': 'SZ',
    'obwalden': 'OW',
    'nidwalden': 'NW',
    'glarus': 'GL',
    'zug': 'ZG',
    'fribourg': 'FR',
    'freiburg': 'FR',
    'solothurn': 'SO',
    'basel-stadt': 'BS',
    'basel landschaft': 'BL',
    'basel-landschaft': 'BL',
    'schaffhausen': 'SH',
    'appenzell ausserrhoden': 'AR',
    'appenzell innerrhoden': 'AI',
    'st. gallen': 'SG',
    'st.gallen': 'SG',
    'sankt gallen': 'SG',
    'graubünden': 'GR',
    'graubunden': 'GR',
    'grigioni': 'GR',
    'grisons': 'GR',
    'aargau': 'AG',
    'argovia': 'AG',
    'thurgau': 'TG',
    'turgovia': 'TG',
    'ticino': 'TI',
    'tessin': 'TI',
    'vaud': 'VD',
    'waadt': 'VD',
    'valais': 'VS',
    'wallis': 'VS',
    'vallese': 'VS',
    'neuchâtel': 'NE',
    'neuchatel': 'NE',
    'neuenburg': 'NE',
    'genf': 'GE',
    'genève': 'GE',
    'geneva': 'GE',
    'ginebra': 'GE',
    'ginevra': 'GE',
    'jura': 'JU'
  };

  const normalized = stateName.toLowerCase().trim();
  return cantonMap[normalized] || '';
}
