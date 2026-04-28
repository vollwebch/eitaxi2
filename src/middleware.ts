import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { verifyClientSessionToken, CLIENT_SESSION_COOKIE } from '@/lib/client-auth';
import { locales, defaultLocale, localeMap, Locale } from '@/i18n/config';

// Rutas que requieren autenticación
const DRIVER_PROTECTED_ROUTES = [
  '/dashboard/',
  '/gps/',
  '/gps-quick',
];

const CLIENT_PROTECTED_ROUTES = [
  '/cuenta',
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
    pathname.startsWith('/downloads/') ||
    pathname.includes('.') // archivos estáticos
  ) {
    return NextResponse.next();
  }

  // === LOCALE DETECTION ===
  // Leer locale de cookie
  const existingLocale = request.cookies.get('NEXT_LOCALE')?.value;
  
  if (!existingLocale || !locales.includes(existingLocale as Locale)) {
    // Detectar del Accept-Language header
    const acceptLanguage = request.headers.get('accept-language') || '';
    const preferredLang = acceptLanguage.split(',')[0]?.split('-')[0]?.trim() || '';
    const detectedLocale = localeMap[preferredLang] || defaultLocale;
    
    // Crear respuesta y setear cookie
    const response = NextResponse.next();
    response.cookies.set('NEXT_LOCALE', detectedLocale, {
      path: '/',
      maxAge: 365 * 24 * 60 * 60, // 1 año
      sameSite: 'lax'
    });
    
    // Continuar con auth checks usando esta response
    return applyAuthChecks(request, response, pathname);
  }

  // Cookie ya existe, continuar normalmente
  return applyAuthChecks(request, NextResponse.next(), pathname);
}

function applyAuthChecks(request: NextRequest, response: NextResponse, pathname: string): NextResponse {
  // Check driver protected routes
  const isDriverRoute = DRIVER_PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route)
  );

  if (isDriverRoute) {
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // Check client protected routes
  const isClientRoute = CLIENT_PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route)
  );

  if (isClientRoute) {
    const clientToken = request.cookies.get(CLIENT_SESSION_COOKIE)?.value;
    if (!clientToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|uploads/|manifest.json|sw.js|robots.txt|eitaxi-backup|eitaxi-full-backup).*)',
  ],
};
