import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDistance } from 'geolib'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { from, to } = body

    if (!from || !to) {
      return NextResponse.json(
        { success: false, error: 'Origen y destino son requeridos' },
        { status: 400 }
      )
    }

    // Buscar coordenadas si se proporcionan IDs
    let originCoords = from
    let destCoords = to

    if (from.cityId) {
      const city = await db.city.findUnique({ where: { id: from.cityId } })
      if (city) {
        originCoords = { lat: city.latitude, lng: city.longitude }
      }
    } else if (from.placeId) {
      const place = await db.location.findUnique({ where: { id: from.placeId } })
      if (place) {
        originCoords = { lat: place.latitude, lng: place.longitude }
      }
    }

    if (to.cityId) {
      const city = await db.city.findUnique({ where: { id: to.cityId } })
      if (city) {
        destCoords = { lat: city.latitude, lng: city.longitude }
      }
    } else if (to.placeId) {
      const place = await db.location.findUnique({ where: { id: to.placeId } })
      if (place) {
        destCoords = { lat: place.latitude, lng: place.longitude }
      }
    }

    // Calcular distancia
    const distanceMeters = getDistance(
      { latitude: originCoords.lat, longitude: originCoords.lng },
      { latitude: destCoords.lat, longitude: destCoords.lng }
    )
    
    const distanceKm = distanceMeters / 1000

    // Estimar tiempo (promedio 50 km/h en ciudad, 80 km/h en autopista)
    const avgSpeed = distanceKm > 50 ? 80 : 50
    const estimatedMinutes = (distanceKm / avgSpeed) * 60

    // Precio estimado (tarifa suiza promedio)
    const basePrice = 6.00 // Tarifa base CHF
    const pricePerKm = 3.50 // CHF por km
    const estimatedPrice = basePrice + (distanceKm * pricePerKm)

    return NextResponse.json({
      success: true,
      data: {
        distance: Math.round(distanceKm * 10) / 10,
        distanceMeters,
        estimatedPrice: Math.round(estimatedPrice * 100) / 100,
        estimatedMinutes: Math.round(estimatedMinutes),
        origin: originCoords,
        destination: destCoords,
      }
    })
  } catch (error) {
    console.error('Error calculating route:', error)
    return NextResponse.json(
      { success: false, error: 'Error al calcular la ruta' },
      { status: 500 }
    )
  }
}
