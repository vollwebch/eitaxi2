import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getClientFromRequest } from '@/lib/client-auth';

// LocationSuggestion format
interface LocationSuggestion {
  id: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
  shortAddress: string;
  fullAddress: string;
  isFavorite: boolean;
}

const EMOJI_MAP: Record<string, string> = {
  home: '🏠',
  work: '💼',
  custom: '📍',
};

// GET - Search saved client addresses (public, but enhanced if authenticated)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query || query.length < 1) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Try to get client session (optional - public endpoint)
    const session = await getClientFromRequest(request);
    if (!session) {
      // Not authenticated - return empty array
      return NextResponse.json({ success: true, data: [] });
    }

    // Search client addresses
    const addresses = await db.clientAddress.findMany({
      where: {
        clientId: session.clientId,
        OR: [
          { name: { contains: query } },
          { address: { contains: query } },
        ],
      },
      take: 10,
    });

    // Map to LocationSuggestion format
    const suggestions: LocationSuggestion[] = addresses.map((addr) => {
      const emoji = EMOJI_MAP[addr.type] || EMOJI_MAP.custom;

      return {
        id: `fav-${addr.id}`,
        name: `${emoji} ${addr.name}`,
        type: 'address',
        lat: addr.latitude,
        lon: addr.longitude,
        shortAddress: addr.address,
        fullAddress: addr.address,
        isFavorite: true,
      };
    });

    return NextResponse.json({ success: true, data: suggestions });
  } catch (error) {
    console.error('Address suggestions error:', error);
    return NextResponse.json({ success: true, data: [] });
  }
}
