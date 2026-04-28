import { SignJWT, jwtVerify } from 'jose';

/**
 * Read a cookie value from a Request object's Cookie header.
 * Safe for all contexts including standalone mode.
 */
function getCookieFromRequest(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

const SESSION_COOKIE_NAME = 'eitaxi_session_token';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no configurado. Define la variable de entorno JWT_SECRET.');
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  driverId: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

// Crear un JWT firmado para la sesión
export async function createSessionToken(driver: {
  id: string;
  email: string;
  name: string;
}): Promise<string> {
  const secret = getSecret();
  const token = await new SignJWT({
    driverId: driver.id,
    email: driver.email,
    name: driver.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret);

  return token;
}

// Verificar un JWT y devolver el payload
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);
    return {
      driverId: payload.driverId as string,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

// Obtener la sesión actual desde un Request object (safe for standalone)
export async function getSessionFromRequest(request: Request): Promise<SessionPayload | null> {
  try {
    const token = getCookieFromRequest(request, SESSION_COOKIE_NAME);
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

// Obtener la sesión actual desde las cookies (server-side) - legacy, may crash in standalone
export async function getServerSession(): Promise<SessionPayload | null> {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

// Verificar autenticación en API routes - devuelve la sesión o lanza error
// IMPORTANT: Always pass `request` parameter to avoid cookies() crash in standalone
export async function requireAuth(request?: Request): Promise<SessionPayload> {
  // 1. Try from Request object first (most reliable in all contexts)
  if (request) {
    // Try session cookie
    const token = getCookieFromRequest(request, SESSION_COOKIE_NAME);
    if (token) {
      const session = await verifySessionToken(token);
      if (session) return session;
    }
    // Try Bearer token
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const bearerToken = authHeader.slice(7);
      const session = await verifySessionToken(bearerToken);
      if (session) return session;
    }
  }

  // 2. Last resort: try cookies() API (may crash in standalone)
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      const session = await verifySessionToken(token);
      if (session) return session;
    }
  } catch {
    // cookies() puede fallar fuera de un contexto de request
  }

  throw new Error('No autenticado');
}

// Opciones para la cookie de sesión
export const sessionCookieOptions = {
  name: SESSION_COOKIE_NAME,
  httpOnly: true,
  secure: false,
  sameSite: 'lax' as const,
  maxAge: SESSION_MAX_AGE,
  path: '/',
};

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE };
