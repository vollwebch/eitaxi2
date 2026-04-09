import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Copia exacta de las funciones del código
function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u')
    .replace(/ë/g, 'e').replace(/ï/g, 'i')
    .trim()
}

function isLocationExcluded(targetCity, targetCantonCode, serviceZones) {
  const targetCityNorm = normalizeText(targetCity)
  const targetCantonNorm = normalizeText(targetCantonCode)
  
  console.log(`    [isLocationExcluded] Verificando "${targetCity}" (${targetCantonCode})`)
  
  for (const zone of serviceZones) {
    if (!zone.exclusions || zone.exclusions.length === 0) continue
    
    console.log(`      Zona: "${zone.zoneName}", exclusiones: [${zone.exclusions.join(', ')}]`)
    
    for (const exclusion of zone.exclusions) {
      const exclusionNorm = normalizeText(exclusion)
      console.log(`        Comparando exclusión "${exclusion}" (norm: "${exclusionNorm}") con ciudad "${targetCity}" (norm: "${targetCityNorm}")`)
      
      // Caso 1: Código de cantón
      if (exclusionNorm.length === 2 && exclusionNorm === targetCantonNorm) {
        console.log(`        → EXCLUIDO por cantón`)
        return { excluded: true, exclusionName: exclusion }
      }
      
      // Caso 2: Coincidencia exacta
      if (exclusionNorm === targetCityNorm) {
        console.log(`        → EXCLUIDO por coincidencia exacta`)
        return { excluded: true, exclusionName: exclusion }
      }
      
      // Caso 3: Coincidencia flexible
      if (exclusionNorm.length >= 4 && targetCityNorm.length >= 4) {
        const excClean = exclusionNorm.replace(/[^a-z0-9]/g, '')
        const cityClean = targetCityNorm.replace(/[^a-z0-9]/g, '')
        if (excClean === cityClean) {
          console.log(`        → EXCLUIDO por coincidencia flexible`)
          return { excluded: true, exclusionName: exclusion }
        }
      }
    }
  }
  
  console.log(`    → NO excluido`)
  return { excluded: false }
}

async function main() {
  const drivers = await prisma.taxiDriver.findMany({
    where: { isActive: true },
    include: { city: true, canton: true, driverServiceZones: true }
  })
  
  // Casos de prueba
  const testCases = [
    { city: 'Winterthur', canton: 'ZH', country: 'CH' },
    { city: 'Uster', canton: 'ZH', country: 'CH' },
    { city: 'Zürich', canton: 'ZH', country: 'CH' },
    { city: 'Widnau', canton: 'SG', country: 'CH' },
    { city: 'St. Gallen', canton: 'SG', country: 'CH' },
    { city: 'Vaduz', canton: 'LI', country: 'LI' },
  ]
  
  console.log('========== PRUEBA DE EXCLUSIONES ==========\n')
  
  for (const driver of drivers) {
    const zones = driver.driverServiceZones.map(z => ({
      zoneName: z.zoneName,
      zoneType: z.zoneType,
      exclusions: JSON.parse(z.exclusions || '[]')
    }))
    
    if (zones.length === 0) continue
    
    console.log(`\n===== ${driver.name} =====`)
    console.log(`Zonas: ${zones.map(z => `"${z.zoneName}"`).join(', ')}`)
    
    for (const test of testCases) {
      console.log(`\n  Probando: ${test.city} (${test.canton})`)
      const result = isLocationExcluded(test.city, test.canton, zones)
      console.log(`  Resultado: ${result.excluded ? '⛔ EXCLUIDO' : '✓ NO excluido'}`)
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
