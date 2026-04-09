// ============================================
// TRADUCCIONES Y ALIAS DE BÚSQUEDA
// Para mejorar resultados con términos genéricos
// ============================================

// Aliases para aeropuertos
export const airportAliases: Record<string, string> = {
  'zurich airport': 'Flughafen Zürich',
  'zurich flughafen': 'Flughafen Zürich',
  'aeropuerto zurich': 'Flughafen Zürich',
  'aeropuerto de zurich': 'Flughafen Zürich',
  'aeropuerto zúrich': 'Flughafen Zürich',
  'aeropuerto de zúrich': 'Flughafen Zürich',
  'zürich flughafen': 'Flughafen Zürich',
  'zrh': 'Flughafen Zürich',
  
  'geneva airport': 'Aéroport de Genève',
  'geneve airport': 'Aéroport de Genève',
  'ginebra airport': 'Aéroport de Genève',
  'aeropuerto ginebra': 'Aéroport de Genève',
  'aeropuerto de ginebra': 'Aéroport de Genève',
  'genève aéroport': 'Aéroport de Genève',
  'geneve aeroport': 'Aéroport de Genève',
  'gva': 'Aéroport de Genève',
  
  'basel airport': 'EuroAirport Basel',
  'euroairport': 'EuroAirport Basel',
  'euroairport basel': 'EuroAirport Basel',
  'euroairport basel mulhouse': 'EuroAirport Basel',
  'aeropuerto basel': 'EuroAirport Basel',
  'aeropuerto de basel': 'EuroAirport Basel',
  'basel mulhouse': 'EuroAirport Basel',
  'bsl': 'EuroAirport Basel',
  'mlh': 'EuroAirport Basel',
}

// Términos genéricos y sus traducciones para búsqueda
const genericTranslations: Record<string, string[]> = {
  // Transporte
  'aeropuerto': ['flughafen', 'airport', 'aéroport', 'aeroporto'],
  'airport': ['flughafen', 'aeropuerto', 'aéroport', 'aeroporto'],
  'flughafen': ['airport', 'aeropuerto', 'aéroport', 'aeroporto'],
  
  'estacion': ['bahnhof', 'station', 'gare'],
  'estación': ['bahnhof', 'station', 'gare'],
  'station': ['bahnhof', 'estación', 'gare'],
  'bahnhof': ['station', 'estación', 'gare'],
  
  'tren': ['zug', 'train', 'train'],
  'train': ['zug', 'tren'],
  'zug': ['tren', 'train'],
  
  // Salud
  'hospital': ['spital', 'krankenhaus', 'hôpital'],
  'spital': ['hospital', 'krankenhaus', 'hôpital'],
  'krankenhaus': ['hospital', 'spital', 'hôpital'],
  
  'farmacia': ['apotheke', 'pharmacy', 'pharmacie'],
  'apotheke': ['farmacia', 'pharmacy', 'pharmacie'],
  'pharmacy': ['farmacia', 'apotheke', 'pharmacie'],
  
  // Compras
  'supermercado': ['supermarkt', 'supermarket'],
  'supermarket': ['supermercado', 'supermarkt'],
  'supermarkt': ['supermercado', 'supermarket'],
  
  'gasolinera': ['tankstelle', 'gas station', 'fuel'],
  'tankstelle': ['gasolinera', 'gas station', 'fuel'],
  'gasolina': ['tankstelle', 'fuel'],
  
  // Otros
  'centro': ['zentrum', 'center', 'centre'],
  'zentrum': ['centro', 'center', 'centre'],
}

// Expandir búsqueda con traducciones
export function expandSearchWithTranslations(query: string): {
  expandedQueries: string[]
  translatedTerms: string[]
} {
  const normalizedQuery = query.toLowerCase().trim()
  const expandedQueries: string[] = [query] // Siempre incluir el original
  const translatedTerms: string[] = []
  
  // Buscar si el query contiene algún término traducible
  for (const [term, translations] of Object.entries(genericTranslations)) {
    if (normalizedQuery.includes(term)) {
      // Añadir traducciones
      for (const translation of translations) {
        const expanded = query.replace(new RegExp(term, 'gi'), translation)
        if (expanded.toLowerCase() !== normalizedQuery) {
          expandedQueries.push(expanded)
          translatedTerms.push(translation)
        }
      }
    }
  }
  
  return {
    expandedQueries: [...new Set(expandedQueries)],
    translatedTerms: [...new Set(translatedTerms)]
  }
}
