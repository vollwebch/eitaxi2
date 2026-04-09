import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Actualizar Liechtenstein con country = 'LI'
  const result = await prisma.canton.updateMany({
    where: { code: 'LI' },
    data: { country: 'LI' }
  })
  
  console.log(`✅ Actualizado ${result.count} registro(s) de Liechtenstein`)
  
  // Verificar
  const li = await prisma.canton.findUnique({ where: { code: 'LI' } })
  console.log(`   País de Liechtenstein: ${li?.country}`)
  
  // Contar ciudades de Liechtenstein
  const cities = await prisma.city.count({
    where: { canton: { code: 'LI' } }
  })
  console.log(`   Municipios de Liechtenstein: ${cities}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
