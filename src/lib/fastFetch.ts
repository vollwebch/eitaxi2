import https from 'https'
import http from 'http'

/**
 * Fast fetch using Node.js native http/https instead of global fetch (undici).
 * Works around undici/fetch latency issues in some Node.js environments.
 */
export function fastFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const isHttps = urlObj.protocol === 'https:'
    const mod = isHttps ? https : http

    const customHeaders = (options.headers as Record<string, string>) || {}
    
    // Determine timeout from AbortSignal or default
    let timeoutMs = 8000
    if (options.signal instanceof AbortSignal) {
      // AbortSignal.timeout() doesn't expose the ms value, just use default
      timeoutMs = 5000
    }

    const reqOptions: https.RequestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        ...customHeaders
      },
      timeout: timeoutMs,
      lookup: undefined // use default DNS
    }

    const req = mod.request(reqOptions, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf-8')
        const headers: Record<string, string> = {}
        for (const [key, value] of Object.entries(res.headers)) {
          if (typeof value === 'string') headers[key] = value
        }
        resolve(new Response(body, {
          status: res.statusCode || 200,
          headers
        }))
      })
    })

    req.on('error', (err) => reject(err))
    req.on('timeout', () => {
      req.destroy()
      reject(new Error(`Request timeout after ${timeoutMs}ms`))
    })

    // Handle abort signal
    if (options.signal instanceof AbortSignal) {
      if (options.signal.aborted) {
        req.destroy()
        reject(new Error('Request aborted'))
        return
      }
      const onAbort = () => {
        req.destroy()
        reject(new Error('Request aborted'))
      }
      options.signal.addEventListener('abort', onAbort, { once: true })
    }

    req.end()
  })
}
