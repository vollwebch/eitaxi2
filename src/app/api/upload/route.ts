import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024
// Allowed MIME types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se ha proporcionado ningún archivo' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Formato no permitido. Usa JPG, PNG, WebP o GIF' },
        { status: 400 }
      )
    }

    // Validate file size (5MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'La imagen no puede superar los 5MB' },
        { status: 400 }
      )
    }

    // Validate file size (min 1KB to prevent empty files)
    if (file.size < 1024) {
      return NextResponse.json(
        { success: false, error: 'El archivo es demasiado pequeño' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate filename: driver-{timestamp}-{random6chars}.{ext}
    const timestamp = Date.now()
    const randomChars = crypto.randomBytes(3).toString('hex')
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const filename = `driver-${timestamp}-${randomChars}.${ext}`

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'drivers')
    await mkdir(uploadDir, { recursive: true })

    // Write file
    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)

    const url = `/uploads/drivers/${filename}`

    return NextResponse.json({ success: true, url })
  } catch (error: any) {
    console.error('Error uploading file:', error.message)
    return NextResponse.json(
      { success: false, error: 'Error al subir la imagen' },
      { status: 500 }
    )
  }
}
