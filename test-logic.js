// Simular la función de cobertura
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

// TEST 1: Juan - Taxista de Zúrich con Winterthur excluido
const juan = {
  city: { name: 'Zürich' },
  canton: { code: 'ZH', country: 'CH' }
}

const juanZones = [
  { zoneName: 'Cantón de Zúrich', zoneType: 'canton', exclusions: ['Winterthur'] }
]

console.log('=== TEST JUAN (Zúrich, excluye Winterthur) ===\n')

// Test: Zúrich → Winterthur
console.log('TEST 1: Buscar Zúrich → Winterthur')
let r1 = driverCoversLocation(juan, 'Zürich', 'ZH', 'CH', juanZones)
console.log(`  Origen (Zürich): ${r1.covers ? '✅ CUBRE' : '❌ NO CUBRE'} - ${r1.reason}`)
let r2 = driverCoversLocation(juan, 'Winterthur', 'ZH', 'CH', juanZones)
console.log(`  Destino (Winterthur): ${r2.covers ? '✅ CUBRE' : '❌ NO CUBRE'} - ${r2.reason}`)
console.log(`  RESULTADO: ${r1.covers && r2.covers ? '❌ JUAN APARECE (MAL!)' : '✅ JUAN NO APARECE (BIEN!)'}`)

console.log('')

// Test: Zúrich → Aeropuerto Zúrich
console.log('TEST 2: Buscar Zúrich → Aeropuerto Zúrich')
let r3 = driverCoversLocation(juan, 'Zürich', 'ZH', 'CH', juanZones)
console.log(`  Origen (Zürich): ${r3.covers ? '✅ CUBRE' : '❌ NO CUBRE'} - ${r3.reason}`)
let r4 = driverCoversLocation(juan, 'Zürich Airport', 'ZH', 'CH', juanZones)
console.log(`  Destino (Zürich Airport): ${r4.covers ? '✅ CUBRE' : '❌ NO CUBRE'} - ${r4.reason}`)
console.log(`  RESULTADO: ${r3.covers && r4.covers ? '✅ JUAN APARECE (BIEN!)' : '❌ JUAN NO APARECE (MAL!)'}`)

console.log('')

// Test: Winterthur → Zúrich
console.log('TEST 3: Buscar Winterthur → Zúrich')
let r5 = driverCoversLocation(juan, 'Winterthur', 'ZH', 'CH', juanZones)
console.log(`  Origen (Winterthur): ${r5.covers ? '✅ CUBRE' : '❌ NO CUBRE'} - ${r5.reason}`)
let r6 = driverCoversLocation(juan, 'Zürich', 'ZH', 'CH', juanZones)
console.log(`  Destino (Zürich): ${r6.covers ? '✅ CUBRE' : '❌ NO CUBRE'} - ${r6.reason}`)
console.log(`  RESULTADO: ${r5.covers && r6.covers ? '❌ JUAN APARECE (MAL!)' : '✅ JUAN NO APARECE (BIEN!)'}`)
