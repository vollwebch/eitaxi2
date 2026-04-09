/**
 * Script para actualizar las zonas de los conductores con bounding boxes de OSM
 * Ejecutar: npx ts-node prisma/update-zone-boundaries.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Bounding boxes aproximados de zonas conocidas
// Formato: [south, north, west, east]
const ZONE_BOUNDING_BOXES: Record<string, { bbox: [number, number, number, number]; osmId?: number }> = {
  // Liechtenstein (país entero)
  'liechtenstein': {
    bbox: [47.048, 47.271, 9.471, 9.636],
    osmId: 1155959
  },
  
  // Cantón de St. Gallen
  'st. gallen': {
    bbox: [46.88, 47.6, 8.8, 9.7],
    osmId: 1689358
  },
  'sankt gallen': {
    bbox: [46.88, 47.6, 8.8, 9.7],
    osmId: 1689358
  },
  'cantón de st. gallen': {
    bbox: [46.88, 47.6, 8.8, 9.7],
    osmId: 1689358
  },
  
  // Werdenberg (distrito)
  'werdenberg': {
    bbox: [47.05, 47.22, 9.35, 9.55],
    osmId: 1681018
  },
  'wahlkreis werdenberg': {
    bbox: [47.05, 47.22, 9.35, 9.55],
    osmId: 1681018
  },
  
  // Zürich (cantón)
  'zürich': {
    bbox: [47.15, 47.7, 8.35, 8.98],
    osmId: 1682216
  },
  'zurich': {
    bbox: [47.15, 47.7, 8.35, 8.98],
    osmId: 1682216
  },
  'cantón de zúrich': {
    bbox: [47.15, 47.7, 8.35, 8.98],
    osmId: 1682216
  },
  
  // Bern (cantón)
  'bern': {
    bbox: [46.3, 47.3, 6.9, 8.3],
    osmId: 1682223
  },
  'cantón de bern': {
    bbox: [46.3, 47.3, 6.9, 8.3],
    osmId: 1682223
  },
  
  // Ginebra (cantón)
  'genève': {
    bbox: [46.1, 46.35, 5.95, 6.35],
    osmId: 1702412
  },
  'geneva': {
    bbox: [46.1, 46.35, 5.95, 6.35],
    osmId: 1702412
  },
  'ginebra': {
    bbox: [46.1, 46.35, 5.95, 6.35],
    osmId: 1702412
  },
};

function normalizeZoneName(name: string): string {
  return name.toLowerCase().trim();
}

async function main() {
  console.log('Actualizando zonas de conductores con bounding boxes...\n');
  
  // Obtener todas las zonas
  const zones = await prisma.driverServiceZone.findMany();
  
  console.log(`Encontradas ${zones.length} zonas.\n`);
  
  let updated = 0;
  
  for (const zone of zones) {
    const normalizedName = normalizeZoneName(zone.zoneName);
    const bboxInfo = ZONE_BOUNDING_BOXES[normalizedName];
    
    if (bboxInfo) {
      const [south, north, west, east] = bboxInfo.bbox;
      const boundingBoxJson = JSON.stringify({ south, north, west, east });
      
      await prisma.driverServiceZone.update({
        where: { id: zone.id },
        data: {
          boundingBox: boundingBoxJson,
          osmId: bboxInfo.osmId,
          centerLat: (south + north) / 2,
          centerLon: (west + east) / 2
        }
      });
      
      console.log(`✅ Actualizado: ${zone.zoneName} → bbox: [${south}, ${north}, ${west}, ${east}]`);
      updated++;
    } else {
      console.log(`⚠️ Sin bounding box: ${zone.zoneName}`);
    }
  }
  
  console.log(`\n${updated} zonas actualizadas.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
