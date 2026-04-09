import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const drivers = await prisma.taxiDriver.findMany({
    include: { city: true, canton: true },
    take: 10
  })
  
  for (const d of drivers) {
    console.log(`${d.name}:`)
    console.log(`  coverageType: ${d.coverageType}`)
    console.log(`  operationRadius: ${d.operationRadius}`)
    console.log(`  lat/lng: ${d.latitude}, ${d.longitude}`)
    console.log(`  canton.country: ${d.canton.country}`)
    console.log()
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
