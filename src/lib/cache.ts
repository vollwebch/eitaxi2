// ============================================
// CACHÉ PERSISTENTE CON REDIS (UPSTASH)
// Sobrevive a reinicios del servidor
// Si no hay Redis configurado, usa memoria
// ============================================

// Tipo para Redis (solo se usa si está disponible)
type RedisClient = {
  get: (key: string) => Promise<any>
  setex: (key: string, ttl: number, value: any) => Promise<void>
  keys: (pattern: string) => Promise<string[]>
}

// Cliente Redis - lazy loaded
let redis: RedisClient | null = null
let redisChecked = false

async function getRedis(): Promise<RedisClient | null> {
  if (redisChecked) return redis
  redisChecked = true
  
  // Verificar si hay variables de entorno configuradas
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  
  if (!url || !token) {
    // Redis no configurado - usando caché en memoria
    return null
  }
  
  try {
    // Importación dinámica - solo si está instalado
    const { Redis } = await import('@upstash/redis')
    redis = new Redis({ url, token }) as unknown as RedisClient
    // Redis conectado (Upstash)
    return redis
  } catch (error) {
    // @upstash/redis no instalado - usando caché en memoria
    return null
  }
}

// ============================================
// CACHÉ EN MEMORIA (fallback cuando no hay Redis)
// ============================================
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

const memoryCache = new Map<string, CacheEntry<any>>()

// Limpiar caché antiguo cada 10 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        memoryCache.delete(key)
      }
    }
  }, 10 * 60 * 1000)
}

// ============================================
// FUNCIONES DE CACHÉ UNIFICADAS
// ============================================

export interface CacheResult<T> {
  data: T
  fromCache: boolean
}

export async function getCached<T>(key: string): Promise<CacheResult<T> | null> {
  // Intentar Redis primero
  const client = await getRedis()
  
  if (client) {
    try {
      const cached = await client.get(`cache:${key}`)
      if (cached && cached.data !== undefined) {
        return { data: cached.data as T, fromCache: true }
      }
      return null
    } catch (error) {
      console.error('Redis get error:', error)
    }
  }
  
  // Fallback a memoria
  const entry = memoryCache.get(key)
  if (!entry) return null
  
  if (Date.now() - entry.timestamp > entry.ttl) {
    memoryCache.delete(key)
    return null
  }
  
  return { data: entry.data as T, fromCache: true }
}

export async function setCache<T>(key: string, data: T, ttlMs: number = 30 * 60 * 1000): Promise<void> {
  // Intentar Redis primero
  const client = await getRedis()
  
  if (client) {
    try {
      // TTL en segundos para Redis
      await client.setex(`cache:${key}`, Math.floor(ttlMs / 1000), { data, timestamp: Date.now() })
      return
    } catch (error) {
      console.error('Redis set error:', error)
    }
  }
  
  // Fallback a memoria
  // Limitar tamaño del caché (máximo 500 entradas)
  if (memoryCache.size > 500) {
    const entries = Array.from(memoryCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
    entries.slice(0, 100).forEach(([k]) => memoryCache.delete(k))
  }
  
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs
  })
}

// ============================================
// PRE-CALENTAMIENTO DE CACHÉ
// ============================================

const FREQUENT_SEARCHES = [
  'aeropuerto', 'flughafen', 'airport',
  'migros', 'coop', 'denner', 'aldi', 'lidl',
  'bahnhof', 'hbf', 'hauptbahnhof',
  'zurich', 'basel', 'bern', 'luzern', 'geneva',
]

export async function warmupCache(warmupFn: (query: string) => Promise<any[]>): Promise<void> {
  // Pre-calentando caché con búsquedas frecuentes...
  
  let count = 0
  for (const query of FREQUENT_SEARCHES) {
    const cached = await getCached(`warmup:${query}`)
    if (cached) continue
    
    try {
      await warmupFn(query)
      await setCache(`warmup:${query}`, true, 60 * 60 * 1000)
      count++
    } catch (error) {
      // Ignorar errores en pre-calentamiento
    }
  }
  
  // Caché pre-calentado
}

// ============================================
// ESTADÍSTICAS DE CACHÉ
// ============================================

export async function getCacheStats(): Promise<{
  type: 'redis' | 'memory'
  size?: number
  keys?: string[]
}> {
  const client = await getRedis()
  
  if (client) {
    try {
      const keys = await client.keys('cache:*')
      return { type: 'redis', size: keys.length, keys: keys.slice(0, 20) }
    } catch (error) {
      return { type: 'redis', size: 0 }
    }
  }
  
  return { type: 'memory', size: memoryCache.size }
}

// ============================================
// LIMPIAR CACHÉ
// ============================================

export async function clearCache(): Promise<void> {
  const client = await getRedis()
  
  if (client) {
    try {
      const keys = await client.keys('cache:*')
      // En Redis, eliminaríamos las claves
      // Por ahora solo limpiamos la memoria
    } catch (error) {
      console.error('Redis clear error:', error)
    }
  }
  
  // Limpiar caché en memoria
  memoryCache.clear()
}
