import { PrismaClient } from '@prisma/client'
import { determineCoverageType, getCityCoordinates } from '../src/lib/geo'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Actualizando taxis existentes con lógica geográfica...\n')
  
  const drivers = await prisma.taxiDriver.findMany({
    include: { city: true, canton: true }
  })
  
  console.log(`📊 Encontrados ${drivers.length} conductores\n`)
  
  for (const driver of drivers) {
    // Determinar cobertura automáticamente
    const coverage = determineCoverageType(driver.canton.code, driver.canton.country || 'CH')
    
    // Obtener coordenadas
    const coords = getCityCoordinates(driver.city.name, driver.canton.code)
    
    // Actualizar
    await prisma.taxiDriver.update({
      where: { id: driver.id },
      data: {
        operationRadius: coverage.operationRadius,
        coverageType: coverage.coverageType,
        latitude: coords?.lat || null,
        longitude: coords?.lng || null,
      }
    })
    
    console.log(`✅ ${driver.name}`)
    console.log(`   Ciudad: ${driver.city.name}, ${driver.canton.name}`)
    console.log(`   Cobertura: ${coverage.coverageType} (${coverage.operationRadius}km)`)
    console.log(`   Coordenadas: ${coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'N/A'}`)
    console.log(`   Razón: ${coverage.reason}\n`)
  }
  
  console.log('✨ ¡Actualización completada!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
