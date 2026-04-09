import { db } from '../src/lib/db'

async function main() {
  const cantons = await db.canton.findMany({
    include: {
      _count: {
        select: { locations: true }
      }
    },
    orderBy: { name: 'asc' }
  })
  
  console.log('Municipios por cantón:')
  console.log('=====================')
  
  let total = 0
  for (const canton of cantons) {
    console.log(`${canton.name} (${canton.code}): ${canton._count.locations} ubicaciones`)
    total += canton._count.locations
  }
  
  console.log('=====================')
  console.log(`TOTAL: ${total} ubicaciones`)
  
  await db.$disconnect()
}

main()
