// Usar Overpass API de OpenStreetMap para obtener municipios de Suiza

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  tags?: {
    name?: string;
    'name:de'?: string;
    'name:fr'?: string;
    'name:it'?: string;
    admin_level?: string;
    boundary?: string;
    place?: string;
  };
}

async function fetchFromOverpass(query: string) {
  const url = 'https://overpass-api.de/api/interpreter';
  const response = await fetch(url, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  return response.json();
}

async function fetchSwissMunicipalities() {
  console.log('🇨🇭 Obteniendo municipios de Suiza desde Overpass API...\n');
  
  // Query para obtener todas las relaciones de municipios en Suiza (admin_level=8)
  const query = `
    [out:json][timeout:60];
    area["name"="Schweiz"]["admin_level"="2"]->.switzerland;
    rel(area.switzerland)["admin_level"="8"];
    out tags;
  `;
  
  try {
    const result = await fetchFromOverpass(query);
    const elements: OverpassElement[] = result.elements || [];
    
    const municipalities: { name: string; nameDE: string; }[] = [];
    
    elements.forEach(el => {
      if (el.tags?.name) {
        municipalities.push({
          name: el.tags.name,
          nameDE: el.tags['name:de'] || el.tags.name
        });
      }
    });
    
    console.log(`✅ ${municipalities.length} municipios encontrados`);
    
    // Mostrar muestra
    console.log('\n📋 Primeros 20 municipios:');
    municipalities.slice(0, 20).forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.name} (${m.nameDE})`);
    });
    
    return municipalities;
    
  } catch (error: any) {
    console.log('❌ Error:', error.message);
    return [];
  }
}

async function fetchSwissDistricts() {
  console.log('\n🗺️ Obteniendo distritos de Suiza...\n');
  
  // Query para obtener distritos (admin_level=6 o 7 según cantón)
  const query = `
    [out:json][timeout:60];
    area["name"="Schweiz"]["admin_level"="2"]->.switzerland;
    rel(area.switzerland)["admin_level"~"^(6|7)$"];
    out tags;
  `;
  
  try {
    const result = await fetchFromOverpass(query);
    const elements: OverpassElement[] = result.elements || [];
    
    const districts: { name: string; nameDE: string; }[] = [];
    
    elements.forEach(el => {
      if (el.tags?.name) {
        districts.push({
          name: el.tags.name,
          nameDE: el.tags['name:de'] || el.tags.name
        });
      }
    });
    
    console.log(`✅ ${districts.length} distritos encontrados`);
    
    return districts;
    
  } catch (error: any) {
    console.log('❌ Error:', error.message);
    return [];
  }
}

async function fetchSwissCantons() {
  console.log('\n🏛️ Obteniendo cantones de Suiza...\n');
  
  const query = `
    [out:json][timeout:30];
    area["name"="Schweiz"]["admin_level"="2"]->.switzerland;
    rel(area.switzerland)["admin_level"="4"];
    out tags;
  `;
  
  try {
    const result = await fetchFromOverpass(query);
    const elements: OverpassElement[] = result.elements || [];
    
    const cantons: { name: string; nameDE: string; }[] = [];
    
    elements.forEach(el => {
      if (el.tags?.name) {
        cantons.push({
          name: el.tags.name,
          nameDE: el.tags['name:de'] || el.tags.name
        });
      }
    });
    
    console.log(`✅ ${cantons.length} cantones encontrados`);
    cantons.forEach(c => console.log(`   - ${c.name}`));
    
    return cantons;
    
  } catch (error: any) {
    console.log('❌ Error:', error.message);
    return [];
  }
}

// Ejecutar todo
async function main() {
  const cantons = await fetchSwissCantons();
  await sleep(1000);
  
  const districts = await fetchSwissDistricts();
  await sleep(1000);
  
  const municipalities = await fetchSwissMunicipalities();
  
  console.log('\n📊 RESUMEN:');
  console.log(`   Cantones: ${cantons.length}`);
  console.log(`   Distritos: ${districts.length}`);
  console.log(`   Municipios: ${municipalities.length}`);
  
  return { cantons, districts, municipalities };
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(console.error);
