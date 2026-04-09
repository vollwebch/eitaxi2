import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE_NAME } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Sesión cerrada' })
  
  // Limpiar la cookie de sesión segura (JWT)
  response.cookies.delete(SESSION_COOKIE_NAME)
  
  // También limpiar las cookies antiguas por compatibilidad
  response.cookies.delete('eitaxi_driver_id')
  
  return response
}
