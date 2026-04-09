import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const query = 'zurich'
  
  console.log(`Buscando ciudades con: "${query}"`)
  
  const cities = await prisma.city.findMany({
    where: {
      name: { contains: query }
    },
    include: { canton: true },
    take: 5,
  })
  
  console.log(`\nEncontradas ${cities.length} ciudades:`)
  for (const c of cities) {
    console.log(`  - ${c.name} (${c.canton.name})`)
  }
  
  // También buscar con Zürich exacto
  const zurich = await prisma.city.findFirst({
    where: { name: 'Zürich' },
    include: { canton: true }
  })
  
  console.log(`\nBuscando exactamente "Zürich":`)
  console.log(`  Encontrado: ${zurich ? zurich.name : 'NO'}`)
  
  // Buscar taxis en Zürich
  const drivers = await prisma.taxiDriver.findMany({
    where: { isActive: true },
    include: { city: true, canton: true }
  })
  
  console.log(`\nTodos los taxis:`)
  for (const d of drivers) {
    console.log(`  - ${d.name} en ${d.city.name} (${d.canton.name})`)
    console.log(`    coverageType: ${d.coverageType}, operationRadius: ${d.operationRadius}km`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
