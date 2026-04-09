import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u')
    .replace(/ë/g, 'e').replace(/ï/g, 'i')
}

async function main() {
  const query = 'Bern'
  const normalized = normalizeText(query)
  
  console.log(`Buscando: "${query}" (normalizado: "${normalized}")`)
  
  const cities = await prisma.city.findMany({
    where: {
      OR: [
        { name: { contains: normalized } },
        { slug: { contains: normalized } }
      ]
    },
    include: { canton: true },
    take: 10
  })
  
  console.log(`\nCiudades encontradas: ${cities.length}`)
  for (const city of cities) {
    console.log(`  - ${city.name} (${city.canton.code})`)
  }
  
  // Verificar la función getCityCoordinates
  console.log('\n=== Verificar coordenadas ===')
  const CITY_COORDINATES = {
    'Zürich': { lat: 47.3769, lng: 8.5417 },
    'Winterthur': { lat: 47.4995, lng: 8.7266 },
    'Bern': { lat: 46.9480, lng: 7.4474 },
    'Geneva': { lat: 46.2044, lng: 6.1432 },
    'Basel': { lat: 47.5596, lng: 7.5886 },
  }
  
  for (const city of cities) {
    const coords = CITY_COORDINATES[city.name]
    console.log(`${city.name}: ${coords ? `${coords.lat}, ${coords.lng}` : 'SIN COORDENADAS'}`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
