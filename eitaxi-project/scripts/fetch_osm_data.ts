// Obtener datos de Suiza y Liechtenstein desde OpenStreetMap / Nominatim

interface OSMPlace {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
  };
  type: string;
  importance: number;
}

async function fetchSwissMunicipalities() {
  console.log('🌍 Obteniendo datos de OpenStreetMap...\n');
  
  const cantons = [
    { name: 'Zürich', code: 'ZH' },
    { name: 'Bern', code: 'BE' },
    { name: 'Luzern', code: 'LU' },
    { name: 'Uri', code: 'UR' },
    { name: 'Schwyz', code: 'SZ' },
    { name: 'Obwalden', code: 'OW' },
    { name: 'Nidwalden', code: 'NW' },
    { name: 'Glarus', code: 'GL' },
    { name: 'Zug', code: 'ZG' },
    { name: 'Fribourg', code: 'FR' },
    { name: 'Solothurn', code: 'SO' },
    { name: 'Basel-Stadt', code: 'BS' },
    { name: 'Basel-Landschaft', code: 'BL' },
    { name: 'Schaffhausen', code: 'SH' },
    { name: 'Appenzell Ausserrhoden', code: 'AR' },
    { name: 'Appenzell Innerrhoden', code: 'AI' },
    { name: 'St. Gallen', code: 'SG' },
    { name: 'Graubünden', code: 'GR' },
    { name: 'Aargau', code: 'AG' },
    { name: 'Thurgau', code: 'TG' },
    { name: 'Ticino', code: 'TI' },
    { name: 'Vaud', code: 'VD' },
    { name: 'Valais', code: 'VS' },
    { name: 'Neuchâtel', code: 'NE' },
    { name: 'Genève', code: 'GE' },
    { name: 'Jura', code: 'JU' }
  ];

  const allMunicipalities: { canton: string; municipalities: Set<string> }[] = [];

  for (const canton of cantons) {
    console.log(`📍 Buscando municipios de ${canton.name} (${canton.code})...`);
    
    try {
      // Nominatim search para municipios del cantón
      const url = `https://nominatim.openstreetmap.org/search?state=${encodeURIComponent(canton.name)}&country=Switzerland&featuretype=settlement&format=json&limit=100&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'EITaxi-App/1.0'
        }
      });
      
      if (!response.ok) {
        console.log(`   ⚠️ Error HTTP ${response.status}`);
        await sleep(1000);
        continue;
      }
      
      const data: OSMPlace[] = await response.json();
      
      const municipalities = new Set<string>();
      data.forEach(place => {
        const name = place.address?.city || place.address?.town || 
                     place.address?.village || place.address?.municipality;
        if (name) {
          municipalities.add(name);
        }
      });
      
      allMunicipalities.push({
        canton: canton.code,
        municipalities
      });
      
      console.log(`   ✅ ${municipalities.size} municipios encontrados`);
      
      // Rate limiting - Nominatim requiere 1 req/segundo
      await sleep(1100);
      
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
      await sleep(1000);
    }
  }

  // Total
  const total = allMunicipalities.reduce((sum, c) => sum + c.municipalities.size, 0);
  console.log(`\n📊 Total: ${total} municipios únicos`);
  
  return allMunicipalities;
}

async function fetchLiechtensteinMunicipalities() {
  console.log('\n📍 Buscando municipios de Liechtenstein...');
  
  const municipalities = [
    'Vaduz', 'Schaan', 'Balzers', 'Triesen', 'Triesenberg',
    'Ruggell', 'Gamprin', 'Eschen', 'Mauren', 'Planken', 'Schaanwald'
  ];
  
  console.log(`   ✅ ${municipalities.length} municipios`);
  return municipalities;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Ejecutar
fetchSwissMunicipalities()
  .then(data => {
    console.log('\n=== RESULTADO ===');
    data.forEach(d => {
      console.log(`${d.canton}: ${d.municipalities.size} municipios`);
    });
  })
  .catch(console.error);
