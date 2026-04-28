import { SignJWT, jwtVerify } from 'jose';

const CLIENT_SESSION_COOKIE = 'eitaxi_client_session';
const CLIENT_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no configurado.');
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

/**
 * Read a cookie value from a Request object's Cookie header
 */
function getCookieFromRequest(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Get client session from a Request object (safe for all contexts)
 */
export async function getClientFromRequest(request: Request): Promise<ClientSessionPayload | null> {
  try {
    const token = getCookieFromRequest(request, CLIENT_SESSION_COOKIE);
    if (!token) return null;
    return await verifyClientSessionToken(token);
  } catch {
    return null;
  }
}

export async function getClientServerSession(): Promise<ClientSessionPayload | null> {
  // NOTE: This function uses cookies() from next/headers which may crash in standalone.
  // Prefer getClientFromRequest(request) in API routes.
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get(CLIENT_SESSION_COOKIE)?.value;
    if (!token) return null;
    return await verifyClientSessionToken(token);
  } catch {
    return null;
  }
}

export async function requireClientAuth(request?: Request): Promise<ClientSessionPayload> {
  // 1. Try from Request object first (most reliable in all contexts)
  if (request) {
    const session = await getClientFromRequest(request);
    if (session) return session;
  }

  // 2. Last resort: try cookies() API (may crash in standalone)
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get(CLIENT_SESSION_COOKIE)?.value;
    if (token) {
      const session = await verifyClientSessionToken(token);
      if (session) return session;
    }
  } catch {
    // cookies() can fail outside request context
  }

  // 3. Try Bearer token
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

export const clientSessionCookieOptions = {
  name: CLIENT_SESSION_COOKIE,
  httpOnly: true,
  secure: false,
  sameSite: 'lax' as const,
  maxAge: CLIENT_SESSION_MAX_AGE,
  path: '/',
};

export { CLIENT_SESSION_COOKIE };
