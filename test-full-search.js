const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Simular la función de cobertura (copia exacta del código)
const normalize = (text) => 
  text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u')

function driverCoversLocation(driver, targetCity, targetCantonCode, targetCountry, serviceZones) {
  const targetCityNorm = normalize(targetCity || '')
  const driverCityNorm = normalize(driver.city.name)
  const driverCantonCode = driver.canton.code
  
  // PASO 1: VERIFICAR EXCLUSIONES
  if (serviceZones && serviceZones.length > 0) {
    for (const zone of serviceZones) {
      if (zone.exclusions && zone.exclusions.length > 0) {
        for (const exclusion of zone.exclusions) {
          const exclusionNorm = normalize(exclusion)
          if (targetCityNorm === exclusionNorm || 
              targetCityNorm.includes(exclusionNorm) ||
              exclusionNorm.includes(targetCityNorm)) {
            return { covers: false, reason: `No va a: ${exclusion}`, excluded: true }
          }
        }
      }
    }
  }
  
  // PASO 2: Si no tiene zonas
  if (!serviceZones || serviceZones.length === 0) {
    if (driverCityNorm === targetCityNorm) {
      return { covers: true, reason: 'Misma ciudad' }
    }
    return { covers: false, reason: 'Fuera de zona' }
  }
  
  // PASO 3: Tiene zonas
  if (driverCityNorm === targetCityNorm) {
    return { covers: true, reason: 'Misma ciudad base' }
  }
  
  // Si está en el mismo cantón
  if (targetCantonCode === driverCantonCode) {
    return { covers: true, reason: 'Mismo cantón' }
  }
  
  return { covers: false, reason: 'No trabaja en esta zona' }
}

async function test() {
  // Crear un conductor de prueba con exclusión de Winterthur
  // Primero verificar si existe "Taxi Paco"
  let driver = await prisma.taxiDriver.findFirst({
    where: { name: 'Taxi Paco' },
    include: { city: true, canton: true, driverServiceZones: true }
  });
  
  if (driver) {
    // Añadir zona con exclusión
    const existingZone = await prisma.driverServiceZone.findFirst({
      where: { driverId: driver.id, zoneName: 'Cantón de Zúrich' }
    });
    
    if (!existingZone) {
      await prisma.driverServiceZone.create({
        data: {
          driverId: driver.id,
          zoneName: 'Cantón de Zúrich',
          zoneType: 'canton',
          exclusions: JSON.stringify(['Winterthur'])
        }
      });
      console.log('✅ Zona creada para Taxi Paco con exclusión de Winterthur');
    } else {
      // Actualizar exclusiones
      await prisma.driverServiceZone.update({
        where: { id: existingZone.id },
        data: { exclusions: JSON.stringify(['Winterthur']) }
      });
      console.log('✅ Exclusión actualizada para Taxi Paco');
    }
    
    // Recargar conductor
    driver = await prisma.taxiDriver.findFirst({
      where: { name: 'Taxi Paco' },
      include: { city: true, canton: true, driverServiceZones: true }
    });
  }
  
  console.log('\n=== DATOS DEL CONDUCTOR ===');
  console.log(`Nombre: ${driver.name}`);
  console.log(`Ciudad: ${driver.city.name}`);
  console.log(`Cantón: ${driver.canton.name} (${driver.canton.code})`);
  console.log(`Zonas:`);
  
  const zones = driver.driverServiceZones.map(z => ({
    zoneName: z.zoneName,
    zoneType: z.zoneType,
    exclusions: JSON.parse(z.exclusions || '[]')
  }));
  
  for (const z of zones) {
    console.log(`  - ${z.zoneName} (${z.zoneType})`);
    if (z.exclusions.length > 0) {
      console.log(`    Exclusiones: ${z.exclusions.join(', ')}`);
    }
  }
  
  // Ahora probar la búsqueda
  console.log('\n=== PRUEBA DE BÚSQUEDA ===\n');
  
  const driverInfo = {
    city: driver.city,
    canton: driver.canton
  };
  
  // Test 1: Zúrich → Winterthur
  console.log('TEST 1: Zúrich → Winterthur');
  let r1 = driverCoversLocation(driverInfo, 'Zürich', 'ZH', 'CH', zones);
  console.log(`  Origen (Zürich): ${r1.covers ? '✅' : '❌'} ${r1.reason}`);
  let r2 = driverCoversLocation(driverInfo, 'Winterthur', 'ZH', 'CH', zones);
  console.log(`  Destino (Winterthur): ${r2.covers ? '✅' : '❌'} ${r2.reason}`);
  console.log(`  RESULTADO FINAL: ${r1.covers && r2.covers ? '❌ APARECE (MAL)' : '✅ NO APARECE (BIEN)'}`);
  
  // Test 2: Zúrich → Aeropuerto
  console.log('\nTEST 2: Zúrich → Zürich Airport');
  let r3 = driverCoversLocation(driverInfo, 'Zürich', 'ZH', 'CH', zones);
  console.log(`  Origen (Zürich): ${r3.covers ? '✅' : '❌'} ${r3.reason}`);
  let r4 = driverCoversLocation(driverInfo, 'Zürich Airport', 'ZH', 'CH', zones);
  console.log(`  Destino (Zürich Airport): ${r4.covers ? '✅' : '❌'} ${r4.reason}`);
  console.log(`  RESULTADO FINAL: ${r3.covers && r4.covers ? '✅ APARECE (BIEN)' : '❌ NO APARECE (MAL)'}`);
  
  await prisma.$disconnect();
}

test().catch(console.error);
