const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  // Buscar ubicaciones en Winterthur
  const locations = await prisma.location.findMany({
    where: {
      OR: [
        { name: { contains: 'Winterthur' } },
        { name: { contains: 'winterthur' } }
      ]
    },
    include: {
      city: { include: { canton: true } },
      canton: true
    },
    take: 10
  });
  
  console.log('=== UBICACIONES EN WINTERTHUR ===\n');
  
  for (const loc of locations) {
    console.log(`📍 ${loc.name}`);
    console.log(`   Ciudad: ${loc.city?.name || 'N/A'}`);
    console.log(`   Cantón: ${loc.canton?.code || loc.city?.canton?.code || 'N/A'}`);
    console.log('');
  }
  
  // También buscar ciudades
  const cities = await prisma.city.findMany({
    where: {
      name: { contains: 'Winterthur' }
    },
    include: { canton: true }
  });
  
  console.log('=== CIUDADES WINTERTHUR ===\n');
  for (const city of cities) {
    console.log(`🏙️ ${city.name}`);
    console.log(`   Cantón: ${city.canton.name} (${city.canton.code})`);
  }
  
  await prisma.$disconnect();
}

test().catch(console.error);
