import { NextRequest, NextResponse } from 'next/server'
import https from 'https'

// ============================================
// ROUTE API - CON FETCH IPV4
// ============================================

interface RouteResult {
  distance: number
  duration: number
  durationFormatted: string
  geometry: string
  fromCache: boolean
}

// Cache en memoria (30 minutos)
const routeCache = new Map<string, { data: RouteResult; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000;

// Limpiar cache cada 10 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of routeCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) routeCache.delete(key);
  }
}, 10 * 60 * 1000);

// Fetch con IPv4 forzado
function fetchIPv4(url: string, timeoutMs: number = 5000): Promise<any> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      family: 4 as const, // Forzar IPv4
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'eitaxi/1.0'
      }
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error('Invalid JSON'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.end();
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fromLat = searchParams.get('fromLat')
    const fromLon = searchParams.get('fromLon')
    const toLat = searchParams.get('toLat')
    const toLon = searchParams.get('toLon')

    if (!fromLat || !fromLon || !toLat || !toLon) {
      return NextResponse.json({ success: false, error: 'Faltan coordenadas' }, { status: 400 })
    }

    const fromLatNum = parseFloat(fromLat)
    const fromLonNum = parseFloat(fromLon)
    const toLatNum = parseFloat(toLat)
    const toLonNum = parseFloat(toLon)

    // Verificar cache primero
    const cacheKey = `${fromLatNum.toFixed(4)},${fromLonNum.toFixed(4)}→${toLatNum.toFixed(4)},${toLonNum.toFixed(4)}`
    const cached = routeCache.get(cacheKey)
    if (cached && cached.data.geometry) {
      return NextResponse.json({ success: true, data: { ...cached.data, fromCache: true }, fromCache: true })
    }

    // URLs de servidores
    const servers = [
      `https://router.project-osrm.org/route/v1/driving/${fromLonNum},${fromLatNum};${toLonNum},${toLatNum}?overview=full&geometries=polyline`,
      `https://routing.openstreetmap.de/routed-car/route/v1/driving/${fromLonNum},${fromLatNum};${toLonNum},${toLatNum}?overview=full&geometries=polyline`
    ];

    // Intentar servidores uno por uno
    for (const serverUrl of servers) {
      try {
        const data = await fetchIPv4(serverUrl, 5000);
        
        if (data.code === 'Ok' && data.routes?.[0]?.geometry) {
          const route = data.routes[0];
          const result: RouteResult = {
            distance: Math.round((route.distance / 1000) * 10) / 10,
            duration: Math.round(route.duration / 60),
            durationFormatted: formatDuration(Math.round(route.duration / 60)),
            geometry: route.geometry,
            fromCache: false
          };
          
          routeCache.set(cacheKey, { data: result, timestamp: Date.now() });
          return NextResponse.json({ success: true, data: result, fromCache: false });
        }
      } catch (e) {
        // Continuar con el siguiente servidor
        continue;
      }
    }

    return NextResponse.json({ 
      success: false, 
      error: 'No se pudo calcular la ruta. Intenta de nuevo.' 
    }, { status: 503 });

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}
