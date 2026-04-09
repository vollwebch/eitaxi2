import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // TODOS los conductores con TODAS sus zonas y exclusiones
  const drivers = await prisma.taxiDriver.findMany({
    where: { isActive: true },
    include: {
      city: true,
      canton: true,
      driverServiceZones: true
    }
  })
  
  console.log('========== TODOS LOS CONDUCTORES Y SUS EXCLUSIONES ==========\n')
  
  for (const driver of drivers) {
    console.log(`CONDUCTOR: ${driver.name}`)
    console.log(`  Ciudad base: ${driver.city.name}`)
    console.log(`  Cantón: ${driver.canton.name} (${driver.canton.code})`)
    console.log(`  CoverageType: ${driver.coverageType || 'N/A'}`)
    console.log(`  Radio: ${driver.operationRadius || 15} km`)
    
    if (driver.driverServiceZones.length > 0) {
      console.log(`  ZONAS CONFIGURADAS:`)
      for (const zone of driver.driverServiceZones) {
        const exclusions = JSON.parse(zone.exclusions || '[]')
        console.log(`    - Zona: "${zone.zoneName}" (tipo: ${zone.zoneType})`)
        if (exclusions.length > 0) {
          console.log(`      ⛔ EXCLUSIONES: ${exclusions.map(e => `"${e}"`).join(', ')}`)
        } else {
          console.log(`      (sin exclusiones)`)
        }
      }
    } else {
      console.log(`  SIN ZONAS CONFIGURADAS (usa radio por defecto)`)
    }
    console.log('')
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
