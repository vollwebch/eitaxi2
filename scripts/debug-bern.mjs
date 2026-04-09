import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

function normalizeText(text) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u')
}

async function main() {
  const query = 'Bern'
  const normalized = normalizeText(query)
  
  // Ciudades encontradas
  const cities = await prisma.city.findMany({
    where: { OR: [{ name: { contains: normalized } }, { slug: { contains: normalized } }] },
    include: { canton: true },
    take: 10
  })
  
  console.log('=== CIUDADES ENCONTRADAS PARA "Bern" ===')
  for (const city of cities) {
    console.log(`- ${city.name} (${city.canton.code})`)
  }
  
  // Conductores
  const drivers = await prisma.taxiDriver.findMany({
    where: { isActive: true },
    include: { city: true, canton: true, driverServiceZones: true }
  })
  
  console.log('\n=== QUÉ CIUDADES CUBRE CADA CONDUCTOR ===')
  for (const driver of drivers) {
    console.log(`\n${driver.name} (${driver.city.name}, ${driver.canton.code}, radio ${driver.operationRadius || 15}km):`)
    for (const city of cities.slice(0, 5)) {
      // Simular cobertura
      const driverCity = driver.city.name
      const targetCity = city.name
      const targetCanton = city.canton.code
      const driverCanton = driver.canton.code
      const radius = driver.operationRadius || 15
      
      // Coordenadas aproximadas
      const coords = {
        'Bern': { lat: 46.9480, lng: 7.4474 },
        'Geneva': { lat: 46.2044, lng: 6.1432 },
        'Zürich': { lat: 47.3769, lng: 8.5417 },
        'Lugano': { lat: 46.0037, lng: 8.9511 },
        'Basel': { lat: 47.5596, lng: 7.5886 },
        'Vaduz': { lat: 47.1410, lng: 9.5215 },
        'Bernex': { lat: 46.1956, lng: 6.0749 },
      }
      
      const driverCoords = coords[driverCity] || { lat: 0, lng: 0 }
      const targetCoords = coords[targetCity]
      
      if (targetCoords) {
        const R = 6371
        const dLat = (targetCoords.lat - driverCoords.lat) * Math.PI / 180
        const dLng = (targetCoords.lng - driverCoords.lng) * Math.PI / 180
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(driverCoords.lat * Math.PI / 180) * Math.cos(targetCoords.lat * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2)
        const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        
        const covers = distance <= radius || driverCanton === targetCanton
        console.log(`  ${targetCity} (${targetCanton}): ${covers ? 'SÍ' : 'NO'} (${distance.toFixed(1)} km)`)
      } else {
        console.log(`  ${targetCity} (${targetCanton}): SIN COORDENADAS`)
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
