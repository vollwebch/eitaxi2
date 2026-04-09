import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const total = await prisma.location.count()
  const cantons = await prisma.canton.count()
  
  console.log(`✅ Total ubicaciones: ${total}`)
  console.log(`✅ Total cantones: ${cantons}`)
  
  // Verificar municipios clave
  const keyMunicipalities = [
    'Grabs SG', 'Diesse BE', 'Buchs SG', 'Sevelen SG',
    'Zürich ZH', 'Bern BE', 'Genève GE', 'Vaduz LI',
    'Aarau AG', 'Lugano TI', 'Arosa GR', 'Zermatt VS'
  ]
  
  console.log('\n📍 Municipios clave:')
  for (const name of keyMunicipalities) {
    const loc = await prisma.location.findFirst({
      where: { name },
      select: { name: true, postalCode: true }
    })
    if (loc) {
      console.log(`   ✅ ${loc.name}: ${loc.postalCode}`)
    } else {
      console.log(`   ❌ ${name}: NO ENCONTRADO`)
    }
  }
  
  // Contar por cantón
  console.log('\n📊 Ubicaciones por cantón:')
  const cantonList = await prisma.canton.findMany({
    orderBy: { code: 'asc' }
  })
  
  for (const canton of cantonList) {
    const count = await prisma.location.count({
      where: { cantonId: canton.id }
    })
    console.log(`   ${canton.code}: ${count} municipios`)
  }
}

main().finally(() => prisma.$disconnect())
