import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando migración de vehicleTypes...')
  
  const drivers = await prisma.taxiDriver.findMany({
    select: { id: true, vehicleType: true, vehicleTypes: true }
  })
  
  console.log(`Encontrados ${drivers.length} conductores`)
  
  let updated = 0
  for (const driver of drivers) {
    // Si no tiene vehicleTypes o está vacío, crear desde vehicleType
    if (!driver.vehicleTypes || driver.vehicleTypes === '[]' || driver.vehicleTypes === '') {
      const newTypes = JSON.stringify([driver.vehicleType || 'taxi'])
      await prisma.taxiDriver.update({
        where: { id: driver.id },
        data: { vehicleTypes: newTypes }
      })
      updated++
    }
  }
  
  console.log(`✅ Migración completada. ${updated} conductores actualizados.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
