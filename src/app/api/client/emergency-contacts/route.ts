import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireClientAuth } from '@/lib/client-auth';

const MAX_CONTACTS = 5;

// GET - List client's emergency contacts
export async function GET(request: NextRequest) {
  try {
    const session = await requireClientAuth(request);

    const contacts = await db.emergencyContact.findMany({
      where: { clientId: session.clientId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, data: contacts });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }
    console.error('Get emergency contacts error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener contactos de emergencia' },
      { status: 500 }
    );
  }
}

// POST - Create a new emergency contact (max 5 per client)
export async function POST(request: NextRequest) {
  try {
    const session = await requireClientAuth(request);
    const body = await request.json();
    const { name, phone, relation } = body;

    // Validate required fields
    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: 'Nombre y teléfono son requeridos' },
        { status: 400 }
      );
    }

    // Check total contact count
    const total = await db.emergencyContact.count({
      where: { clientId: session.clientId },
    });
    if (total >= MAX_CONTACTS) {
      return NextResponse.json(
        { success: false, error: `Máximo ${MAX_CONTACTS} contactos de emergencia permitidos` },
        { status: 400 }
      );
    }

    // Create contact
    const contact = await db.emergencyContact.create({
      data: {
        clientId: session.clientId,
        name,
        phone,
        relation: relation || null,
      },
    });

    return NextResponse.json({ success: true, data: contact }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }
    console.error('Create emergency contact error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear contacto de emergencia' },
      { status: 500 }
    );
  }
}

// DELETE - Remove an emergency contact by id
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireClientAuth(request);
    // Support both query param (?id=xxx) and JSON body ({ id: xxx })
    const { searchParams } = new URL(request.url);
    const queryId = searchParams.get('id');
    let bodyId: string | undefined;
    try {
      const body = await request.json();
      bodyId = body.id;
    } catch {}
    const id = queryId || bodyId;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'El ID del contacto es requerido' },
        { status: 400 }
      );
    }

    // Verify the contact belongs to this client
    const existing = await db.emergencyContact.findUnique({
      where: { id },
    });

    if (!existing || existing.clientId !== session.clientId) {
      return NextResponse.json(
        { success: false, error: 'Contacto no encontrado' },
        { status: 404 }
      );
    }

    await db.emergencyContact.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }
    console.error('Delete emergency contact error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar contacto de emergencia' },
      { status: 500 }
    );
  }
}
