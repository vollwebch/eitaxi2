import { NextResponse } from 'next/server'
import { CLIENT_SESSION_COOKIE_NAME } from '@/lib/client-auth'

export async function POST() {
  const response = NextResponse.json({ success: true })

  // Delete the client session cookie by setting it with maxAge=0
  response.cookies.set(CLIENT_SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  })

  return response
}
