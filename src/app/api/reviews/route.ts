import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ============================================
// GET /api/reviews?driverId=xxx - Obtener reseñas de un conductor
// POST /api/reviews - Crear nueva reseña
// ============================================

// Obtener reseñas de un conductor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get('driverId')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!driverId) {
      return NextResponse.json({
        success: false,
        error: 'ID del conductor requerido'
      }, { status: 400 })
    }

    // Obtener reseñas aprobadas
    const reviews = await db.review.findMany({
      where: {
        driverId,
        approved: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Contar total
    const total = await db.review.count({
      where: {
        driverId,
        approved: true
      }
    })

    // Calcular promedio de rating
    const approvedReviews = await db.review.findMany({
      where: {
        driverId,
        approved: true
      },
      select: {
        rating: true
      }
    })

    const avgRating = approvedReviews.length > 0
      ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length
      : 0

    return NextResponse.json({
      success: true,
      reviews: reviews.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        name: r.name || 'Cliente anónimo',
        tripRoute: r.tripRoute,
        createdAt: r.createdAt.toISOString()
      })),
      total,
      avgRating: Math.round(avgRating * 10) / 10
    })

  } catch (error) {
    console.error('Error getting reviews:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener reseñas'
    }, { status: 500 })
  }
}

// Crear nueva reseña (protegido contra spam con rate limiting por IP)
const reviewRateLimiter = new Map<string, { count: number; resetAt: number }>();
const REVIEW_RATE_LIMIT = 3; // max reviews per hour per IP
const REVIEW_RATE_WINDOW = 60 * 60 * 1000; // 1 hour

export async function POST(request: NextRequest) {
  try {
    // Rate limiting por IP
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    
    const now = Date.now();
    const record = reviewRateLimiter.get(clientIp);
    if (record) {
      if (now > record.resetAt) {
        reviewRateLimiter.set(clientIp, { count: 1, resetAt: now + REVIEW_RATE_WINDOW });
      } else if (record.count >= REVIEW_RATE_LIMIT) {
        return NextResponse.json({
          success: false,
          error: 'Has enviado demasiadas reseñas. Intenta más tarde.'
        }, { status: 429 })
      } else {
        record.count++;
      }
    } else {
      reviewRateLimiter.set(clientIp, { count: 1, resetAt: now + REVIEW_RATE_WINDOW });
    }

    const body = await request.json()
    const { driverId, rating, comment, name, tripRoute } = body

    // Validaciones
    if (!driverId) {
      return NextResponse.json({
        success: false,
        error: 'ID del conductor requerido'
      }, { status: 400 })
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({
        success: false,
        error: 'La valoración debe ser entre 1 y 5 estrellas'
      }, { status: 400 })
    }

    // Validar longitud del comentario
    if (comment && comment.length > 500) {
      return NextResponse.json({
        success: false,
        error: 'El comentario no puede superar los 500 caracteres'
      }, { status: 400 })
    }

    // Validar que el nombre no sea excesivamente largo
    if (name && name.length > 50) {
      return NextResponse.json({
        success: false,
        error: 'El nombre no puede superar los 50 caracteres'
      }, { status: 400 })
    }

    // Verificar que el conductor existe
    const driver = await db.taxiDriver.findUnique({
      where: { id: driverId }
    })

    if (!driver) {
      return NextResponse.json({
        success: false,
        error: 'Conductor no encontrado'
      }, { status: 404 })
    }

    // Crear la reseña (pendiente de aprobación para evitar spam)
    const review = await db.review.create({
      data: {
        driverId,
        rating: parseInt(rating),
        comment: comment?.trim() || null,
        name: name?.trim() || null,
        tripRoute: tripRoute?.trim() || null,
        approved: false // Requiere moderación para cumplir nDSG
      }
    })

    // Actualizar rating promedio del conductor
    const allReviews = await db.review.findMany({
      where: {
        driverId,
        approved: true
      },
      select: {
        rating: true
      }
    })

    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0)
    const avgRating = totalRating / allReviews.length

    await db.taxiDriver.update({
      where: { id: driverId },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: allReviews.length,
        isTopRated: allReviews.length >= 5 && avgRating >= 4.5
      }
    })

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        name: review.name || 'Cliente anónimo',
        tripRoute: review.tripRoute,
        createdAt: review.createdAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al crear la reseña'
    }, { status: 500 })
  }
}
