import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

// Rutas que requieren autenticación
const PROTECTED_ROUTES = [
  '/dashboard/',
  '/gps/',
  '/gps-quick',
  '/registrarse',
];

// Rutas públicas (no necesitan auth)
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/api/',
  '/_next/',
  '/terminos',
  '/privacidad',
  '/recuperar-password',
  '/restablecer-password',
  '/widget',
  '/track/',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rutas de assets y APIs públicas
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/terminos') ||
    pathname.startsWith('/privacidad') ||
    pathname.startsWith('/recuperar-password') ||
    pathname.startsWith('/restablecer-password') ||
    pathname.startsWith('/widget') ||
    pathname.startsWith('/track/') ||
    pathname.includes('.') // archivos estáticos
  ) {
    return NextResponse.next();
  }

  // Verificar si es una ruta protegida
  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verificar que el token sea válido (JWT firmado)
    const session = await verifySessionToken(sessionToken);
    if (!session) {
      // Token inválido o expirado - limpiar cookie y redirigir
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }

    // Para /dashboard/[driverId], verificar que el driverId coincide
    if (pathname.startsWith('/dashboard/')) {
      const parts = pathname.split('/');
      const driverIdFromUrl = parts[2]; // /dashboard/[driverId]
      if (driverIdFromUrl && driverIdFromUrl !== session.driverId) {
        // Intentar acceder a dashboard de otro conductor - redirigir al propio
        return NextResponse.redirect(new URL(`/dashboard/${session.driverId}`, request.url));
      }
    }

    // Para /gps/[driverId], verificar que el driverId coincide
    if (pathname.startsWith('/gps/') && pathname.split('/').length >= 3) {
      const parts = pathname.split('/');
      const driverIdFromUrl = parts[2];
      if (driverIdFromUrl && driverIdFromUrl !== session.driverId) {
        return NextResponse.redirect(new URL(`/gps/${session.driverId}`, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|uploads/|manifest.json|sw.js|robots.txt).*)',
  ],
};
