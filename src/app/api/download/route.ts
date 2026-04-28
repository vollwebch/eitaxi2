import { NextRequest, NextResponse } from 'next/server';
import { existsSync } from 'fs';
import { statSync, createReadStream } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  const filename = request.nextUrl.searchParams.get('file');

  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  // Only allow .tar.gz files
  if (!filename.endsWith('.tar.gz')) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  const filePath = join(process.cwd(), 'public', 'backups', filename);

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  try {
    const stat = statSync(filePath);
    const stream = createReadStream(filePath);

    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': stat.size.toString(),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Error reading file' }, { status: 500 });
  }
}
