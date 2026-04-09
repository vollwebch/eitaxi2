const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  // Obtener todos los conductores con sus zonas
  const drivers = await prisma.taxiDriver.findMany({
    include: {
      city: true,
      canton: true,
      driverServiceZones: true
    }
  });
  
  console.log('=== CONDUCTORES Y SUS ZONAS ===\n');
  
  for (const driver of drivers) {
    console.log(`\n🚕 ${driver.name}`);
    console.log(`   Ciudad: ${driver.city.name}`);
    console.log(`   Cantón: ${driver.canton.name} (${driver.canton.code})`);
    console.log(`   Zonas configuradas:`);
    
    if (driver.driverServiceZones.length === 0) {
      console.log(`   ❌ Sin zonas configuradas`);
    } else {
      for (const zone of driver.driverServiceZones) {
        const exclusions = JSON.parse(zone.exclusions || '[]');
        console.log(`   ✅ ${zone.zoneName} (${zone.zoneType})`);
        if (exclusions.length > 0) {
          console.log(`      ❌ Exclusiones: ${exclusions.join(', ')}`);
        }
      }
    }
  }
  
  await prisma.$disconnect();
}

test().catch(console.error);
