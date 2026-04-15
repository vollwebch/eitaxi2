import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

// Rutas que requieren autenticación de CONDUCTOR
const PROTECTED_ROUTES = [
  '/dashboard/',
  '/gps/',
];

// Rutas que requieren autenticación de CLIENTE
const CLIENT_PROTECTED_ROUTES = [
  '/cuenta',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rutas de assets, APIs públicas y archivos estáticos
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/terminos') ||
    pathname.startsWith('/privacidad') ||
    pathname.startsWith('/recuperar-password') ||
    pathname.startsWith('/restablecer-password') ||
    pathname.startsWith('/widget') ||
    pathname.startsWith('/track/') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/registrarse') ||
    pathname.startsWith('/registro') ||
    pathname.startsWith('/gps-quick') ||
    pathname.includes('.') // archivos estáticos (img, css, js, etc.)
  ) {
    return NextResponse.next();
  }

  // Verificar si es una ruta protegida de CONDUCTOR
  const isDriverProtected = PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route)
  );

  if (isDriverProtected) {
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

  // Verificar si es una ruta protegida de CLIENTE
  const isClientProtected = CLIENT_PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route)
  );

  if (isClientProtected) {
    // La página /cuenta maneja su propia autenticación internamente
    // (muestra login/registro si no está autenticado, dashboard si lo está)
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|uploads/|manifest.json|manifest-client.json|sw.js|robots.txt).*)',
  ],
};
