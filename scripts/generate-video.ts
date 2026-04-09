import ZAI from 'z-ai-web-dev-sdk';

async function generateVideo() {
  try {
    const zai = await ZAI.create();
    
    console.log('🎬 Creando video explicativo...');
    
    const task = await zai.video.generations.create({
      prompt: `Tutorial animation showing a taxi driver app interface. A friendly animated taxi car appears on a map of Switzerland and Liechtenstein. 
      
      Scene 1: A taxi driver icon configures PICKUP ZONES - green highlighted areas on the map (Vaduz, Schaan, Balzers) with text "Where you pick up clients". An animated arrow shows a client searching for taxi and the driver appearing.
      
      Scene 2: The driver configures DESTINATION ZONES - blue highlighted areas (Zurich Airport, St. Gallen) with text "Where you take clients". An animated trip shows a client booking a ride to the airport.
      
      Scene 3: A split screen shows both configurations working together - the driver only appears for trips that match BOTH pickup AND destination zones.
      
      Modern app UI design, clean colors (green for pickup, blue for destination, yellow for taxi branding). Smooth transitions. Educational explainer style with text labels.`,
      quality: 'quality',
      duration: 10,
      fps: 30,
      size: '1344x768'
    });
    
    console.log('✅ Task creado:', task.id);
    console.log('⏳ Esperando resultado...');
    
    // Poll for results
    let result = await zai.async.result.query(task.id);
    let pollCount = 0;
    const maxPolls = 60;
    
    while (result.task_status === 'PROCESSING' && pollCount < maxPolls) {
      pollCount++;
      console.log(`Poll ${pollCount}/${maxPolls}: ${result.task_status}`);
      await new Promise(resolve => setTimeout(resolve, 10000));
      result = await zai.async.result.query(task.id);
    }
    
    if (result.task_status === 'SUCCESS') {
      const videoUrl = (result as any).video_result?.[0]?.url ||
                      (result as any).video_url ||
                      (result as any).url ||
                      (result as any).video;
      console.log('🎥 Video URL:', videoUrl);
      return videoUrl;
    } else {
      console.log('❌ Status:', result.task_status);
      return null;
    }
  } catch (error: any) {
    console.error('Error:', error.message);
    throw error;
  }
}

generateVideo();
