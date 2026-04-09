import { db } from '../src/lib/db'

async function main() {
  const total = await db.location.count()
  console.log('Total locations:', total)
  
  const withPostal = await db.location.count({
    where: { postalCode: { not: null } }
  })
  console.log('With postal code:', withPostal)
  
  const sample = await db.location.findMany({
    take: 5,
    select: { name: true, postalCode: true, type: true }
  })
  console.log('Sample:', JSON.stringify(sample, null, 2))
  
  await db.$disconnect()
}

main().catch(console.error)
