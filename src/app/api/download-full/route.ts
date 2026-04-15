import { NextResponse } from 'next/server'
import { createReadStream, statSync } from 'fs'
import { join } from 'path'
import { Readable } from 'stream'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'download', 'eiaxi-completo.tar.gz')
    const stat = statSync(filePath)
    
    const stream = createReadStream(filePath)
    const readable = Readable.from(stream)

    return new NextResponse(readable as any, {
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': 'attachment; filename="eitaxi-COMPLETO.tar.gz"',
        'Content-Length': stat.size.toString(),
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })
  }
}
