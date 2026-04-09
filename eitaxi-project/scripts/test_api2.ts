import ZAI from 'z-ai-web-dev-sdk';

async function testOtherFunctions() {
  console.log('=== PROBANDO OTRAS FUNCIONES DEL SDK ===');
  
  try {
    const zai = await ZAI.create();
    console.log('✅ Instancia creada');
    
    // Probar chat completions (que sí debería funcionar)
    console.log('\n1. Probando chat.completions.create...');
    const chat = await zai.chat.completions.create({
      messages: [
        { role: 'user', content: 'Di "Hola" en una palabra' }
      ]
    });
    console.log('   ✅ Chat funciona:', chat.choices[0]?.message?.content?.substring(0, 50));
    
    // Probar image generation
    console.log('\n2. Probando images.generations.create...');
    try {
      const img = await zai.images.generations.create({
        prompt: 'a red circle on white background',
        size: '1024x1024'
      });
      console.log('   ✅ Imagen generada, tamaño base64:', img.data[0]?.base64?.substring(0, 50));
    } catch (e: any) {
      console.log('   ❌ Error imagen:', e.message?.substring(0, 100));
    }
    
    // Ver funciones disponibles
    console.log('\n3. Estructura de zai.functions:');
    console.log('   zai.functions:', Object.keys(zai.functions));
    
  } catch (error: any) {
    console.log('❌ Error:', error.message);
  }
}

testOtherFunctions();
