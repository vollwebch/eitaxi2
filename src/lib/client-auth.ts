import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const CLIENT_SESSION_COOKIE_NAME = 'eitaxi_client_session';
const CLIENT_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no configurado. Define la variable de entorno JWT_SECRET.');
  }
  return new TextEncoder().encode(secret);
}

export interface ClientSessionPayload {
  clientId: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

// Crear un JWT firmado para la sesión del cliente
export async function createClientSessionToken(client: {
  id: string;
  email: string;
  name: string;
}): Promise<string> {
  const secret = getSecret();
  const token = await new SignJWT({
    clientId: client.id,
    email: client.email,
    name: client.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${CLIENT_SESSION_MAX_AGE}s`)
    .sign(secret);

  return token;
}

// Verificar un JWT de cliente y devolver el payload
export async function verifyClientSessionToken(token: string): Promise<ClientSessionPayload | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);
    return {
      clientId: payload.clientId as string,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

// Obtener la sesión actual del cliente desde las cookies (server-side)
export async function getClientSession(): Promise<ClientSessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CLIENT_SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyClientSessionToken(token);
  } catch {
    return null;
  }
}

// Verificar autenticación de cliente en API routes - devuelve la sesión o lanza error
export async function requireClientAuth(request?: Request): Promise<ClientSessionPayload> {
  // Intentar desde cookies (para server components / API routes)
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CLIENT_SESSION_COOKIE_NAME)?.value;
    if (token) {
      const session = await verifyClientSessionToken(token);
      if (session) return session;
    }
  } catch {
    // cookies() puede fallar fuera de un contexto de request
  }

  // Fallback: leer desde header Authorization
  if (request) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const session = await verifyClientSessionToken(token);
      if (session) return session;
    }
  }

  throw new Error('No autenticado');
}

// Opciones para la cookie de sesión del cliente
export const clientSessionCookieOptions = {
  name: CLIENT_SESSION_COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: CLIENT_SESSION_MAX_AGE,
  path: '/',
};

export { CLIENT_SESSION_COOKIE_NAME, CLIENT_SESSION_MAX_AGE };
