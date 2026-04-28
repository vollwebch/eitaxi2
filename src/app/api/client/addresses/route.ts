import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireClientAuth } from '@/lib/client-auth';

const VALID_TYPES = ['home', 'work', 'custom'] as const;
const MAX_ADDRESSES = 10;
const MAX_HOME = 1;
const MAX_WORK = 1;

// Type ordering for consistent sorting
const typeOrder: Record<string, number> = {
  home: 0,
  work: 1,
  custom: 2,
};

// GET - List client's addresses ordered by type (home, work, custom)
export async function GET(request: NextRequest) {
  try {
    const session = await requireClientAuth(request);

    const addresses = await db.clientAddress.findMany({
      where: { clientId: session.clientId },
      orderBy: { createdAt: 'asc' },
    });

    // Sort in-memory by type priority: home → work → custom
    const sorted = [...addresses].sort(
      (a, b) => (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99)
    );

    return NextResponse.json({ success: true, data: sorted });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }
    console.error('Get addresses error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener direcciones' },
      { status: 500 }
    );
  }
}

// POST - Create a new address (max 10 total, max 1 home, max 1 work)
export async function POST(request: NextRequest) {
  try {
    const session = await requireClientAuth(request);
    const body = await request.json();
    const { name, address, type, latitude, longitude } = body;

    // Validate required fields
    if (!name || !address || !type || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, error: 'Todos los campos son requeridos (name, address, type, latitude, longitude)' },
        { status: 400 }
      );
    }

    // Validate type
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Tipo inválido. Debe ser uno de: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate coordinates are numbers
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Latitud y longitud deben ser numéricos' },
        { status: 400 }
      );
    }

    // Check total address count
    const total = await db.clientAddress.count({
      where: { clientId: session.clientId },
    });
    if (total >= MAX_ADDRESSES) {
      return NextResponse.json(
        { success: false, error: `Máximo ${MAX_ADDRESSES} direcciones permitidas` },
        { status: 400 }
      );
    }

    // Check type-specific limits
    if (type === 'home') {
      const homeCount = await db.clientAddress.count({
        where: { clientId: session.clientId, type: 'home' },
      });
      if (homeCount >= MAX_HOME) {
        return NextResponse.json(
          { success: false, error: 'Ya tienes una dirección de casa configurada' },
          { status: 400 }
        );
      }
    }

    if (type === 'work') {
      const workCount = await db.clientAddress.count({
        where: { clientId: session.clientId, type: 'work' },
      });
      if (workCount >= MAX_WORK) {
        return NextResponse.json(
          { success: false, error: 'Ya tienes una dirección de trabajo configurada' },
          { status: 400 }
        );
      }
    }

    // Create address
    const newAddress = await db.clientAddress.create({
      data: {
        clientId: session.clientId,
        name,
        address,
        type,
        latitude,
        longitude,
      },
    });

    return NextResponse.json({ success: true, data: newAddress }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }
    console.error('Create address error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear dirección' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing address by id
export async function PUT(request: NextRequest) {
  try {
    const session = await requireClientAuth(request);
    const body = await request.json();
    const { id, name, address, type, latitude, longitude } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'El ID de la dirección es requerido' },
        { status: 400 }
      );
    }

    // Verify the address belongs to this client
    const existing = await db.clientAddress.findUnique({
      where: { id },
    });

    if (!existing || existing.clientId !== session.clientId) {
      return NextResponse.json(
        { success: false, error: 'Dirección no encontrada' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;

    // Validate and handle type change
    if (type !== undefined) {
      if (!VALID_TYPES.includes(type)) {
        return NextResponse.json(
          { success: false, error: `Tipo inválido. Debe ser uno de: ${VALID_TYPES.join(', ')}` },
          { status: 400 }
        );
      }

      // If changing type, check limits for the new type
      if (type !== existing.type) {
        if (type === 'home') {
          const homeCount = await db.clientAddress.count({
            where: { clientId: session.clientId, type: 'home' },
          });
          if (homeCount >= MAX_HOME) {
            return NextResponse.json(
              { success: false, error: 'Ya tienes una dirección de casa configurada' },
              { status: 400 }
            );
          }
        }

        if (type === 'work') {
          const workCount = await db.clientAddress.count({
            where: { clientId: session.clientId, type: 'work' },
          });
          if (workCount >= MAX_WORK) {
            return NextResponse.json(
              { success: false, error: 'Ya tienes una dirección de trabajo configurada' },
              { status: 400 }
            );
          }
        }
      }

      updateData.type = type;
    }

    // Perform update
    const updated = await db.clientAddress.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }
    console.error('Update address error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar dirección' },
      { status: 500 }
    );
  }
}

// DELETE - Remove an address by id
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireClientAuth(request);
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'El ID de la dirección es requerido' },
        { status: 400 }
      );
    }

    // Verify the address belongs to this client
    const existing = await db.clientAddress.findUnique({
      where: { id },
    });

    if (!existing || existing.clientId !== session.clientId) {
      return NextResponse.json(
        { success: false, error: 'Dirección no encontrada' },
        { status: 404 }
      );
    }

    await db.clientAddress.delete({
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
    console.error('Delete address error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar dirección' },
      { status: 500 }
    );
  }
}
