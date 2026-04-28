import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// API gratuita de Zippopotam para códigos postales suizos
async function fetchPostalCode(postalCode: string) {
  try {
    const response = await fetch(`https://api.zippopotam.us/CH/${postalCode}`, {
      signal: AbortSignal.timeout(5000)
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

// Guardar lugares en la base de datos
async function savePlace(place: any, postalCode: string) {
  try {
    // Buscar o crear el cantón
    let canton = await db.canton.findFirst({
      where: { code: place['state abbreviation'] }
    })
    
    if (!canton) {
      canton = await db.canton.create({
        data: {
          name: place['state'],
          code: place['state abbreviation'],
          slug: place['state'].toLowerCase().replace(/\s+/g, '-'),
          country: 'CH'
        }
      })
    }
    
    // Verificar si ya existe
    const existing = await db.location.findFirst({
      where: {
        name: place['place name'],
        postalCode: postalCode,
        type: 'city'
      }
    })
    
    if (!existing) {
      await db.location.create({
        data: {
          name: place['place name'],
          type: 'city',
          postalCode: postalCode,
          cantonId: canton.id,
          latitude: parseFloat(place.latitude) || null,
          longitude: parseFloat(place.longitude) || null
        }
      })
      return true
    }
    return false
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth(request)
  } catch {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { startCode, endCode } = body
    
    const start = startCode || 1000
    const end = endCode || 9999
    
    let imported = 0
    let skipped = 0
    let errors = 0
    
    console.log(`🚀 Iniciando importación de códigos postales ${start} - ${end}`)
    
    // Procesar en lotes para no sobrecargar
    for (let code = start; code <= end; code++) {
      const postalCode = code.toString().padStart(4, '0')
      
      const data = await fetchPostalCode(postalCode)
      
      if (data && data.places) {
        for (const place of data.places) {
          const saved = await savePlace(place, postalCode)
          if (saved) {
            imported++
          } else {
            skipped++
          }
        }
      }
      
      // Pausa pequeña para no sobrecargar la API
      await new Promise(r => setTimeout(r, 100))
      
      // Log progreso cada 100 códigos
      if (code % 100 === 0) {
        console.log(`📊 Progreso: ${code} - Importados: ${imported}, Saltados: ${skipped}`)
      }
    }
    
    const total = await db.location.count()
    
    return NextResponse.json({
      success: true,
      message: 'Importación completada',
      stats: {
        imported,
        skipped,
        errors,
        totalInDB: total
      }
    })
    
  } catch (error) {
    console.error('Error en importación:', error)
    return NextResponse.json(
      { success: false, error: 'Error en la importación' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const postalCode = searchParams.get('code')
    
    if (!postalCode) {
      return NextResponse.json({
        success: false,
        error: 'Parámetro "code" requerido'
      }, { status: 400 })
    }
    
    const data = await fetchPostalCode(postalCode)
    
    if (!data) {
      return NextResponse.json({
        success: false,
        error: 'Código postal no encontrado'
      }, { status: 404 })
    }
    
    // Guardar en la base de datos
    let saved = 0
    if (data.places) {
      for (const place of data.places) {
        const wasSaved = await savePlace(place, postalCode)
        if (wasSaved) saved++
      }
    }
    
    return NextResponse.json({
      success: true,
      data: data,
      saved: saved
    })
    
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error en la búsqueda' },
      { status: 500 }
    )
  }
}
