import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

// Force dynamic rendering - never prerender/cache this route
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'public', 'downloads', 'eiTaxi-proyecto.zip')
    const fileBuffer = await readFile(filePath)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="eiTaxi-proyecto.zip"',
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Archivo no encontrado' },
      { status: 404 }
    )
  }
}
