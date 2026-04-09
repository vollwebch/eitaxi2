import ZAI from 'z-ai-web-dev-sdk';
import * as fs from 'fs';

async function fetchGeographicData() {
  try {
    console.log('🚀 Initializing Z-AI SDK...');
    const zai = await ZAI.create();

    console.log('🔍 Searching for Swiss municipalities data...');
    
    // Search for Swiss municipalities
    const results1 = await zai.functions.invoke('web_search', {
      query: 'Switzerland municipalities list 2024 all cantons official',
      num: 15
    });
    
    console.log('Found', results1.length, 'results for Swiss municipalities');
    
    // Search for Liechtenstein municipalities
    console.log('🔍 Searching for Liechtenstein municipalities...');
    const results2 = await zai.functions.invoke('web_search', {
      query: 'Liechtenstein municipalities gemeinden list 2024',
      num: 10
    });
    
    console.log('Found', results2.length, 'results for Liechtenstein');
    
    // Search for Swiss districts
    console.log('🔍 Searching for Swiss districts...');
    const results3 = await zai.functions.invoke('web_search', {
      query: 'Swiss districts bezirke wahlkreise list by canton',
      num: 15
    });
    
    console.log('Found', results3.length, 'results for Swiss districts');
    
    // Search for official Swiss data
    console.log('🔍 Searching for official Swiss geographic data...');
    const results4 = await zai.functions.invoke('web_search', {
      query: 'admin.ch communes switzerland official list BFS',
      num: 10
    });
    
    console.log('Found', results4.length, 'results for official data');
    
    // Combine all results
    const allResults = {
      swissMunicipalities: results1,
      liechtensteinMunicipalities: results2,
      swissDistricts: results3,
      officialData: results4,
      timestamp: new Date().toISOString()
    };
    
    // Save to file
    fs.writeFileSync(
      '/home/z/my-project/geo_search_results.json',
      JSON.stringify(allResults, null, 2)
    );
    
    console.log('✅ Results saved to /home/z/my-project/geo_search_results.json');
    
    // Print summary
    console.log('\n=== SEARCH RESULTS SUMMARY ===');
    console.log('\nSwiss Municipalities Sources:');
    results1.slice(0, 5).forEach((r: any) => {
      console.log(`- ${r.name}`);
      console.log(`  URL: ${r.url}`);
    });
    
    console.log('\nLiechtenstein Sources:');
    results2.slice(0, 3).forEach((r: any) => {
      console.log(`- ${r.name}`);
      console.log(`  URL: ${r.url}`);
    });
    
    console.log('\nOfficial Data Sources:');
    results4.slice(0, 3).forEach((r: any) => {
      console.log(`- ${r.name}`);
      console.log(`  URL: ${r.url}`);
    });
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

fetchGeographicData();
