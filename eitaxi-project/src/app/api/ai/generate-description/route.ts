import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

// Style configurations for different description types
const DESCRIPTION_STYLES = {
  profesional: {
    name: "Profesional",
    description: "Formal y destacando experiencia",
    icon: "💼",
    tone: "profesional y confiable",
    focus: "experiencia, seguridad y puntualidad"
  },
  cercano: {
    name: "Cercano",
    description: "Amigable y personal",
    icon: "😊",
    tone: "amigable y cercano",
    focus: "atención personalizada y comodidad"
  },
  ejecutivo: {
    name: "Ejecutivo",
    description: "Premium para clientes VIP",
    icon: "✨",
    tone: "exclusivo y sofisticado",
    focus: "lujo, discreción y servicio de alta gama"
  }
};

// Fallback function to generate descriptions without AI
function generateFallbackDescriptions(
  name: string,
  services: string[],
  experience: number,
  vehicleDesc: string,
  vehicleBrand: string,
  vehicleModel: string,
  passengerCapacity: number | undefined,
  city: string,
  canton: string,
  languageList: string
): { profesional: string; cercano: string; ejecutivo: string } {
  const serviceDescriptions: Record<string, string> = {
    airport: "traslados al aeropuerto",
    city: "viajes dentro de la ciudad",
    long_distance: "recorridos de larga distancia",
    limousine: "servicio de limusina de lujo",
    corporate: "transporte corporativo para empresas",
    events: "servicio para eventos y celebraciones",
    delivery: "entregas y mensajería",
    night: "servicio nocturno seguro",
  };

  const mainServices = services.slice(0, 3).map(s => serviceDescriptions[s] || s);
  const location = city && canton ? `en ${city}, ${canton}` : city ? `en ${city}` : canton ? `en el cantón de ${canton}` : "en Suiza";
  const vehicleInfo = vehicleBrand && vehicleModel ? `${vehicleBrand} ${vehicleModel}` : vehicleDesc;
  const capacityText = passengerCapacity ? `hasta ${passengerCapacity} pasajeros` : "";

  return {
    profesional: `Conductor profesional con más de ${experience} años de experiencia ${location}. Especializado en ${mainServices.join(", ")}. Mi compromiso es ofrecer un servicio seguro, puntual y confortable. ${vehicleInfo ? `Vehículo: ${vehicleInfo}` : ''} ${capacityText}. Disponible para viajes locales y de larga distancia. Hablo ${languageList}.`,
    
    cercano: `¡Hola! Soy conductor de taxi ${location} con ${experience} años de experiencia. Me encanta mi trabajo y me esfuerzo cada día para que mis pasajeros se sientan cómodos y seguros. Ofrezco ${mainServices.join(", ")}. ${vehicleInfo ? `Te llevaré en mi ${vehicleInfo}` : ''}. ¡Espero poder ayudarte en tu próximo viaje!`,
    
    ejecutivo: `Servicio de transporte ejecutivo premium ${location}. Con ${experience} años de experiencia en el sector, ofrezco un servicio de alta calidad especializado en ${mainServices.join(", ")}. ${vehicleInfo ? `Vehículo ${vehicleInfo}` : 'Vehículo premium'} ${capacityText}. Máxima discreción, puntualidad y profesionalidad. Ideal para ejecutivos, eventos corporativos y clientes que buscan un servicio exclusivo.`
  };
}

// Fallback improve text function
function fallbackImproveText(originalText: string, name: string, services: string[], experience: number): string {
  let improved = originalText
    .replace(/\s+/g, ' ')
    .replace(/\.\s*\./g, '.')
    .trim();
  
  if (improved.length > 0) {
    improved = improved.charAt(0).toUpperCase() + improved.slice(1);
  }
  
  if (improved.length > 0 && !improved.endsWith('.') && !improved.endsWith('!') && !improved.endsWith('?')) {
    improved += '.';
  }
  
  if (improved.length < 50 && name) {
    const serviceDescriptions: Record<string, string> = {
      airport: "traslados al aeropuerto",
      city: "viajes urbanos",
      long_distance: "larga distancia",
      limousine: "servicio de limusina",
      corporate: "transporte corporativo",
      events: "eventos",
      delivery: "entregas",
      night: "servicio nocturno",
    };
    const mainService = services[0] ? serviceDescriptions[services[0]] || services[0] : "transporte";
    improved = `${improved} Con ${experience} años de experiencia, ofrezco un servicio profesional de ${mainService}. ¡Contáctame para tu próximo viaje!`;
  }
  
  return improved;
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Error al procesar la solicitud" },
      { status: 400 }
    );
  }

  const { 
    name, 
    services, 
    experience, 
    vehicleType, 
    vehicleTypes,
    vehicleBrand,
    vehicleModel,
    passengerCapacity,
    city, 
    canton, 
    languages,
    style = "all",
    mode = "generate",
    existingText = ""
  } = body;

  if (!name) {
    return NextResponse.json(
      { success: false, error: "El nombre es requerido" },
      { status: 400 }
    );
  }

  if (!services || services.length === 0) {
    return NextResponse.json(
      { success: false, error: "Selecciona al menos un servicio" },
      { status: 400 }
    );
  }

  const serviceDescriptions: Record<string, string> = {
    airport: "traslados al aeropuerto",
    city: "viajes urbanos",
    long_distance: "larga distancia",
    limousine: "servicio de limusina",
    corporate: "transporte corporativo",
    events: "eventos y celebraciones",
    delivery: "entregas",
    night: "servicio nocturno",
  };

  const serviceList = services
    .map((s: string) => serviceDescriptions[s] || s)
    .join(", ");

  const primaryVehicleType = vehicleTypes?.[0] || vehicleType || "taxi";
  const vehicleDescriptions: Record<string, string> = {
    taxi: "taxi estándar",
    limousine: "limusina de lujo",
    van: "van amplia para grupos",
    premium: "vehículo premium ejecutivo",
  };

  const vehicleDesc = vehicleDescriptions[primaryVehicleType] || "vehículo";
  const vehicleInfo = vehicleBrand && vehicleModel 
    ? `${vehicleBrand} ${vehicleModel}` 
    : vehicleBrand || vehicleDesc;

  const languageNames: Record<string, string> = {
    de: "alemán", en: "inglés", fr: "francés", it: "italiano",
    es: "español", pt: "portugués", ru: "ruso", zh: "chino",
  };

  const languageList = languages && languages.length > 0
    ? languages.map((l: string) => languageNames[l] || l).join(", ")
    : "varios idiomas";

  const fallbackDescriptions = generateFallbackDescriptions(
    name, services, experience || 1, vehicleDesc, vehicleBrand || "", vehicleModel || "", 
    passengerCapacity, city || "", canton || "", languageList
  );

  try {
    const zai = await ZAI.create();

    // ============== MODE: IMPROVE EXISTING TEXT ==============
    if (mode === "improve" && existingText && existingText.trim().length > 0) {
      const improvePrompt = `Eres un experto editor de textos para perfiles profesionales de conductores de taxi en Suiza. Tu tarea es MEJORAR el siguiente texto manteniendo su esencia original.

TEXTO ORIGINAL DEL CONDUCTOR:
"${existingText}"

DATOS ADICIONALES DEL CONDUCTOR:
- Nombre: ${name}
- Experiencia: ${experience || 1} años
- Vehículo: ${vehicleInfo}
- Ubicación: ${city || "Suiza"}${canton ? `, ${canton}` : ""}
- Servicios: ${serviceList}
- Idiomas: ${languageList}

INSTRUCCIONES DE MEJORA:
1. Corrige errores ortográficos y gramaticales
2. Mejora la fluidez y legibilidad del texto
3. Haz el texto más atractivo y profesional
4. CONSERVA la personalidad y el mensaje original del conductor
5. NO inventes información que no está en el texto original
6. Si el texto es muy corto, puedes expandirlo ligeramente
7. El resultado debe ser de 200-400 caracteres aproximadamente
8. NO uses comillas, bullets, ni caracteres especiales

Devuelve SOLO el texto mejorado.`;

      try {
        const completion = await Promise.race([
          zai.chat.completions.create({
            messages: [
              { role: "system", content: "Eres un editor profesional de textos para perfiles de conductores de taxi. Mejoras textos manteniendo la personalidad del autor." },
              { role: "user", content: improvePrompt }
            ],
            temperature: 0.5,
            max_tokens: 400,
          }),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error("timeout")), 10000))
        ]);

        const improvedText = completion && typeof completion === 'object' && 'choices' in completion
          ? completion.choices[0]?.message?.content?.trim()
          : null;

        return NextResponse.json({
          success: true,
          mode: "improve",
          originalText: existingText,
          improvedText: improvedText || fallbackImproveText(existingText, name, services, experience || 1),
          generatedBy: improvedText ? "ai" : "fallback"
        });

      } catch {
        return NextResponse.json({
          success: true,
          mode: "improve",
          originalText: existingText,
          improvedText: fallbackImproveText(existingText, name, services, experience || 1),
          generatedBy: "fallback"
        });
      }
    }

    // ============== MODE: ANALYZE TEXT ==============
    if (mode === "analyze" && existingText && existingText.trim().length > 0) {
      const analyzePrompt = `Analiza este texto de perfil de conductor de taxi y da sugerencias de mejora.

TEXTO: "${existingText}"

DATOS: Nombre: ${name}, Experiencia: ${experience || 1} años, Servicios: ${serviceList}

Responde SOLO con JSON válido:
{"score": <1-10>, "strengths": ["punto1", "punto2"], "weaknesses": ["debilidad1"], "suggestions": ["sugerencia1", "sugerencia2"], "improvedVersion": "versión mejorada del texto"}`;

      try {
        const completion = await Promise.race([
          zai.chat.completions.create({
            messages: [
              { role: "system", content: "Eres un experto en marketing para servicios de transporte. Respondes SOLO con JSON válido." },
              { role: "user", content: analyzePrompt }
            ],
            temperature: 0.7,
            max_tokens: 600,
          }),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error("timeout")), 10000))
        ]);

        const responseText = completion && typeof completion === 'object' && 'choices' in completion
          ? completion.choices[0]?.message?.content?.trim()
          : null;

        if (responseText) {
          try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const analysis = JSON.parse(jsonMatch[0]);
              return NextResponse.json({
                success: true,
                mode: "analyze",
                originalText: existingText,
                analysis,
                generatedBy: "ai"
              });
            }
          } catch { /* parse error */ }
        }

        return NextResponse.json({
          success: true,
          mode: "analyze",
          originalText: existingText,
          analysis: {
            score: 5,
            strengths: ["Texto personal"],
            weaknesses: ["Podría mejorarse"],
            suggestions: ["Agrega más detalles sobre tu experiencia"],
            improvedVersion: existingText
          },
          generatedBy: "fallback"
        });

      } catch {
        return NextResponse.json({
          success: true,
          mode: "analyze",
          originalText: existingText,
          analysis: {
            score: 5,
            strengths: ["Texto personal"],
            weaknesses: ["Análisis no disponible"],
            suggestions: ["Intenta regenerar"],
            improvedVersion: existingText
          },
          generatedBy: "fallback"
        });
      }
    }

    // ============== MODE: GENERATE NEW DESCRIPTIONS ==============
    const generateDescriptionForStyle = async (styleKey: string, styleConfig: typeof DESCRIPTION_STYLES.profesional) => {
      const prompt = `Crea una descripción ${styleConfig.tone} para un conductor de taxi.

DATOS:
- Nombre: ${name}
- Experiencia: ${experience || 1} años
- Vehículo: ${vehicleInfo}
- Ubicación: ${city || "Suiza"}${canton ? `, ${canton}` : ""}
- Servicios: ${serviceList}
- Idiomas: ${languageList}

ESTILO: ${styleConfig.tone}
ENFOQUE: ${styleConfig.focus}

Reglas:
- 2-3 oraciones (250-400 caracteres)
- Tono ${styleConfig.tone}
- NO comiences con el nombre
- NO uses bullets ni comillas
- Hazlo natural y atractivo

Devuelve SOLO el texto.`;

      try {
        const completion = await Promise.race([
          zai.chat.completions.create({
            messages: [
              { role: "system", content: `Eres un copywriter experto en servicios de transporte. Creas descripciones ${styleConfig.tone}.` },
              { role: "user", content: prompt }
            ],
            temperature: 0.8,
            max_tokens: 300,
          }),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error("timeout")), 8000))
        ]);

        return completion && typeof completion === 'object' && 'choices' in completion
          ? completion.choices[0]?.message?.content?.trim() || null
          : null;
      } catch {
        return null;
      }
    };

    let descriptions: Record<string, { text: string; generatedBy: string }> = {};

    if (style === "all") {
      const [profesional, cercano, ejecutivo] = await Promise.all([
        generateDescriptionForStyle("profesional", DESCRIPTION_STYLES.profesional),
        generateDescriptionForStyle("cercano", DESCRIPTION_STYLES.cercano),
        generateDescriptionForStyle("ejecutivo", DESCRIPTION_STYLES.ejecutivo),
      ]);

      descriptions = {
        profesional: { text: profesional || fallbackDescriptions.profesional, generatedBy: profesional ? "ai" : "fallback" },
        cercano: { text: cercano || fallbackDescriptions.cercano, generatedBy: cercano ? "ai" : "fallback" },
        ejecutivo: { text: ejecutivo || fallbackDescriptions.ejecutivo, generatedBy: ejecutivo ? "ai" : "fallback" }
      };
    } else {
      const styleConfig = DESCRIPTION_STYLES[style as keyof typeof DESCRIPTION_STYLES];
      if (styleConfig) {
        const generated = await generateDescriptionForStyle(style, styleConfig);
        descriptions = {
          [style]: { text: generated || fallbackDescriptions[style as keyof typeof fallbackDescriptions], generatedBy: generated ? "ai" : "fallback" }
        };
      }
    }

    return NextResponse.json({
      success: true,
      mode: "generate",
      descriptions,
      styles: DESCRIPTION_STYLES,
      generatedBy: "ai"
    });

  } catch (error) {
    console.error("Error with AI:", error);
    return NextResponse.json({
      success: true,
      mode: mode,
      descriptions: {
        profesional: { text: fallbackDescriptions.profesional, generatedBy: "fallback" },
        cercano: { text: fallbackDescriptions.cercano, generatedBy: "fallback" },
        ejecutivo: { text: fallbackDescriptions.ejecutivo, generatedBy: "fallback" }
      },
      styles: DESCRIPTION_STYLES,
      generatedBy: "fallback"
    });
  }
}
