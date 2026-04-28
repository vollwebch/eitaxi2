import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const allowed = ['eitaxi-db-20260423.db', 'eitaxi-env-20260423.env', 'BACKUP_INFO.txt'];
  
  if (!allowed.includes(file)) {
    return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
  }
  
  const filePath = path.join('/home/z/my-project/download', file);
  
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
  }
  
  const buffer = fs.readFileSync(filePath);
  const ext = file.split('.').pop();
  const mimeTypes: Record<string, string> = {
    'db': 'application/x-sqlite3',
    'env': 'text/plain',
    'txt': 'text/plain'
  };
  
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${file}"`,
      'Content-Length': buffer.length.toString(),
    },
  });
}
