import ZAI from 'z-ai-web-dev-sdk';

async function testAPI() {
  console.log('=== DIAGNÓSTICO DE LA API ===');
  
  try {
    console.log('1. Creando instancia de ZAI...');
    const zai = await ZAI.create();
    console.log('   ✅ Instancia creada correctamente');
    
    // Verificar qué métodos están disponibles
    console.log('\n2. Métodos disponibles en zai.functions:');
    console.log('   - invoke:', typeof zai.functions.invoke);
    
    // Intentar una búsqueda simple
    console.log('\n3. Intentando búsqueda web...');
    const result = await zai.functions.invoke('web_search', {
      query: 'test',
      num: 1
    });
    
    console.log('   ✅ Búsqueda exitosa!');
    console.log('   Resultado:', JSON.stringify(result, null, 2).substring(0, 200));
    
  } catch (error: any) {
    console.log('   ❌ ERROR:');
    console.log('   Mensaje:', error.message);
    console.log('   Stack:', error.stack?.substring(0, 300));
    
    // Intentar ver más detalles
    console.log('\n4. Información adicional del error:');
    console.log('   Nombre:', error.name);
    console.log('   Código:', error.code);
  }
}

testAPI();
