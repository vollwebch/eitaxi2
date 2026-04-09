import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const bern = await prisma.city.findFirst({
    where: { name: { contains: 'Bern' } },
    include: { canton: true }
  })
  console.log('Ciudad Bern:', JSON.stringify(bern, null, 2))
  
  const allCities = await prisma.city.findMany({
    include: { canton: true },
    take: 20
  })
  console.log('\n=== Todas las ciudades ===')
  for (const city of allCities) {
    console.log(`${city.name} (${city.canton?.code || 'SIN CANTÓN'})`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
