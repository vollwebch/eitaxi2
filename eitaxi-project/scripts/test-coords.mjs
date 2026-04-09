// Probar si las coordenadas devuelven la ciudad correcta

const CITY_COORDINATES = {
  'Zürich': { lat: 47.3769, lng: 8.5417 },
  'Winterthur': { lat: 47.4995, lng: 8.7266 },
  'Uster': { lat: 47.3483, lng: 8.7179 },
  'Dübendorf': { lat: 47.3975, lng: 8.6186 },
  'Wetzikon': { lat: 47.3279, lng: 8.7976 },
  'Geneva': { lat: 46.2044, lng: 6.1432 },
  'Bern': { lat: 46.9480, lng: 7.4474 },
  'Basel': { lat: 47.5596, lng: 7.5886 },
  'Vaduz': { lat: 47.1410, lng: 9.5215 },
  'Schaan': { lat: 47.1652, lng: 9.5087 },
  'Widnau': { lat: 47.4047, lng: 9.6058 },
  'St. Gallen': { lat: 47.4245, lng: 9.3767 },
}

const CITY_TO_CANTON = {
  'Zürich': 'ZH', 'Winterthur': 'ZH', 'Uster': 'ZH', 'Dübendorf': 'ZH', 'Wetzikon': 'ZH',
  'Geneva': 'GE', 'Bern': 'BE', 'Basel': 'BS',
  'Vaduz': 'LI', 'Schaan': 'LI',
  'Widnau': 'SG', 'St. Gallen': 'SG',
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function findNearestCity(lat, lng) {
  let nearestCity = null
  let nearestDistance = Infinity
  
  for (const [cityName, coords] of Object.entries(CITY_COORDINATES)) {
    const distance = calculateDistance(lat, lng, coords.lat, coords.lng)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestCity = cityName
    }
  }
  
  if (nearestCity && nearestDistance < 50) {
    return {
      city: nearestCity,
      cantonCode: CITY_TO_CANTON[nearestCity] || ''
    }
  }
  
  return null
}

// Probar coordenadas específicas
console.log('========== PRUEBA DE COORDENADAS ==========\n')

const testCoords = [
  { name: 'Zürich centro', lat: 47.3769, lng: 8.5417 },
  { name: 'Winterthur centro', lat: 47.4995, lng: 8.7266 },
  { name: 'Cerca de Winterthur (3km)', lat: 47.525, lng: 8.72 },
  { name: 'Entre Zürich y Winterthur', lat: 47.44, lng: 8.63 },
  { name: 'Widnau', lat: 47.4047, lng: 9.6058 },
  { name: 'St. Gallen', lat: 47.4245, lng: 9.3767 },
]

for (const test of testCoords) {
  const result = findNearestCity(test.lat, test.lng)
  console.log(`${test.name} (${test.lat}, ${test.lng}):`)
  console.log(`  → Ciudad más cercana: ${result?.city || 'NINGUNA'} (${result?.cantonCode})`)
  console.log('')
}
