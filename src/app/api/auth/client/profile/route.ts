import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireClientAuth } from '@/lib/client-auth';

// PUT - Edit client profile
export async function PUT(request: NextRequest) {
  try {
    const session = await requireClientAuth(request);
    const body = await request.json();
    const { name, phone } = body;

    // Build update data with only provided fields
    const updateData: { name?: string; phone?: string } = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return NextResponse.json(
          { success: false, error: 'El nombre no puede estar vacio' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }
    if (phone !== undefined) {
      if (phone !== null && phone !== '' && typeof phone !== 'string') {
        return NextResponse.json(
          { success: false, error: 'El telefono debe ser una cadena de texto' },
          { status: 400 }
        );
      }
      updateData.phone = phone ? phone.trim() : null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionaron campos para actualizar' },
        { status: 400 }
      );
    }

    const updatedClient = await db.client.update({
      where: { id: session.clientId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: updatedClient });
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }
    console.error('Update client profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar el perfil' },
      { status: 500 }
    );
  }
}
