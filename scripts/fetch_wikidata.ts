// Usar Wikidata SPARQL API

async function fetchSwissMunicipalitiesFromWikidata() {
  console.log('🇨🇭 Obteniendo municipios de Suiza desde Wikidata...\n');
  
  // SPARQL query para obtener todos los municipios de Suiza
  const query = `
    SELECT ?municipality ?municipalityLabel ?municipalityDE ?cantonLabel WHERE {
      ?municipality wdt:P31 wd:Q70208.
      ?municipality wdt:P17 wd:Q39.
      ?municipality wdt:P131 ?canton.
      OPTIONAL { ?municipality rdfs:label ?municipalityDE FILTER(LANG(?municipalityDE) = "de") }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en,de,fr,it". }
    }
    ORDER BY ?cantonLabel ?municipalityLabel
  `;
  
  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'EITaxi-App/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    const municipalities: { name: string; nameDE: string; canton: string }[] = [];
    
    data.results.bindings.forEach((binding: any) => {
      municipalities.push({
        name: binding.municipalityLabel?.value || '',
        nameDE: binding.municipalityDE?.value || binding.municipalityLabel?.value || '',
        canton: binding.cantonLabel?.value || ''
      });
    });
    
    console.log(`✅ ${municipalities.length} municipios encontrados`);
    
    // Agrupar por cantón
    const byCanton: Record<string, string[]> = {};
    municipalities.forEach(m => {
      if (!byCanton[m.canton]) byCanton[m.canton] = [];
      if (m.name && !byCanton[m.canton].includes(m.name)) {
        byCanton[m.canton].push(m.name);
      }
    });
    
    console.log('\n📊 Municipios por cantón:');
    Object.entries(byCanton).forEach(([canton, munis]) => {
      console.log(`   ${canton}: ${munis.length} municipios`);
    });
    
    return municipalities;
    
  } catch (error: any) {
    console.log('❌ Error:', error.message);
    return [];
  }
}

fetchSwissMunicipalitiesFromWikidata().catch(console.error);
