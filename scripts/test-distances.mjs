// Coordenadas
const GENEVA = { lat: 46.2044, lng: 6.1432 }
const BERNEX = { lat: 46.1956, lng: 6.0749 } // Bernex, GE
const BERN = { lat: 46.9480, lng: 7.4474 }
const ZURICH = { lat: 47.3769, lng: 8.5417 }

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

console.log('=== DISTANCIAS ===')
console.log(`Geneva a Bernex: ${calculateDistance(GENEVA.lat, GENEVA.lng, BERNEX.lat, BERNEX.lng).toFixed(1)} km`)
console.log(`Geneva a Bern: ${calculateDistance(GENEVA.lat, GENEVA.lng, BERN.lat, BERN.lng).toFixed(1)} km`)
console.log(`Zurich a Bern: ${calculateDistance(ZURICH.lat, ZURICH.lng, BERN.lat, BERN.lng).toFixed(1)} km`)
console.log(`Bern a Bern: 0 km`)

console.log('\n=== ANÁLISIS ===')
console.log('Taxi Maria (Geneva, radio 15km):')
console.log(`  - ¿Cubre Bernex (GE)? ${calculateDistance(GENEVA.lat, GENEVA.lng, BERNEX.lat, BERNEX.lng) <= 15 ? 'SÍ' : 'NO'} (distancia: ${calculateDistance(GENEVA.lat, GENEVA.lng, BERNEX.lat, BERNEX.lng).toFixed(1)} km)`)
console.log(`  - ¿Cubre Bern (BE)? ${calculateDistance(GENEVA.lat, GENEVA.lng, BERN.lat, BERN.lng) <= 15 ? 'SÍ' : 'NO'} (distancia: ${calculateDistance(GENEVA.lat, GENEVA.lng, BERN.lat, BERN.lng).toFixed(1)} km)`)
