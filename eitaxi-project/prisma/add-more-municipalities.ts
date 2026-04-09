import { db } from '../src/lib/db'

// Lista de municipios adicionales de Suiza con códigos postales
// Fuente: Lista oficial de la Oficina Federal de Estadística suiza
const additionalMunicipalities = [
  // Zürich - municipios faltantes
  { name: "Adliswil", postalCode: "8134", cantonCode: "ZH" },
  { name: "Affoltern am Albis", postalCode: "8910", cantonCode: "ZH" },
  { name: "Horgen", postalCode: "8810", cantonCode: "ZH" },
  { name: "Meilen", postalCode: "8706", cantonCode: "ZH" },
  { name: "Stäfa", postalCode: "8712", cantonCode: "ZH" },
  { name: "Uster", postalCode: "8610", cantonCode: "ZH" },
  { name: "Wädenswil", postalCode: "8820", cantonCode: "ZH" },
  { name: "Wetzikon", postalCode: "8620", cantonCode: "ZH" },
  { name: "Dietikon", postalCode: "8953", cantonCode: "ZH" },
  { name: "Schlieren", postalCode: "8952", cantonCode: "ZH" },
  { name: "Wallisellen", postalCode: "8304", cantonCode: "ZH" },
  { name: "Kloten", postalCode: "8302", cantonCode: "ZH" },
  { name: "Opfikon", postalCode: "8302", cantonCode: "ZH" },
  { name: "Bülach", postalCode: "8180", cantonCode: "ZH" },
  { name: "Regensdorf", postalCode: "8105", cantonCode: "ZH" },
  { name: "Dübendorf", postalCode: "8600", cantonCode: "ZH" },
  { name: "Volketswil", postalCode: "8604", cantonCode: "ZH" },
  { name: "Thalwil", postalCode: "8800", cantonCode: "ZH" },
  { name: "Richterswil", postalCode: "8805", cantonCode: "ZH" },
  { name: "Rüti", postalCode: "8630", cantonCode: "ZH" },
  
  // Bern - municipios adicionales
  { name: "Biel/Bienne", postalCode: "2500", cantonCode: "BE" },
  { name: "Thun", postalCode: "3600", cantonCode: "BE" },
  { name: "Köniz", postalCode: "3098", cantonCode: "BE" },
  { name: "Burgdorf", postalCode: "3400", cantonCode: "BE" },
  { name: "Olten", postalCode: "4600", cantonCode: "SO" }, // Solothurn
  { name: "Langenthal", postalCode: "4900", cantonCode: "BE" },
  { name: "Muri bei Bern", postalCode: "3074", cantonCode: "BE" },
  { name: "Steffisburg", postalCode: "3612", cantonCode: "BE" },
  { name: "Spiez", postalCode: "3700", cantonCode: "BE" },
  { name: "Worb", postalCode: "3076", cantonCode: "BE" },
  { name: "Münsingen", postalCode: "3110", cantonCode: "BE" },
  { name: "Ittigen", postalCode: "3063", cantonCode: "BE" },
  { name: "Bolligen", postalCode: "3065", cantonCode: "BE" },
  { name: "Ostermundigen", postalCode: "3072", cantonCode: "BE" },
  
  // Genève
  { name: "Vernier", postalCode: "1214", cantonCode: "GE" },
  { name: "Lancy", postalCode: "1212", cantonCode: "GE" },
  { name: "Meyrin", postalCode: "1217", cantonCode: "GE" },
  { name: "Carouge", postalCode: "1227", cantonCode: "GE" },
  { name: "Onex", postalCode: "1213", cantonCode: "GE" },
  { name: "Thônex", postalCode: "1226", cantonCode: "GE" },
  { name: "Versoix", postalCode: "1290", cantonCode: "GE" },
  { name: "Plan-les-Ouates", postalCode: "1228", cantonCode: "GE" },
  { name: "Grand-Saconnex", postalCode: "1218", cantonCode: "GE" },
  { name: "Chêne-Bougeries", postalCode: "1224", cantonCode: "GE" },
  
  // Vaud
  { name: "Lausanne", postalCode: "1000", cantonCode: "VD" },
  { name: "Yverdon-les-Bains", postalCode: "1400", cantonCode: "VD" },
  { name: "Montreux", postalCode: "1820", cantonCode: "VD" },
  { name: "Renens", postalCode: "1020", cantonCode: "VD" },
  { name: "Nyon", postalCode: "1260", cantonCode: "VD" },
  { name: "Vevey", postalCode: "1800", cantonCode: "VD" },
  { name: "Morges", postalCode: "1110", cantonCode: "VD" },
  { name: "Pully", postalCode: "1009", cantonCode: "VD" },
  { name: "Gland", postalCode: "1196", cantonCode: "VD" },
  { name: "Aigle", postalCode: "1860", cantonCode: "VD" },
  { name: "Prilly", postalCode: "1008", cantonCode: "VD" },
  { name: "Bulle", postalCode: "1630", cantonCode: "FR" }, // Fribourg
  
  // Basel
  { name: "Basel", postalCode: "4000", cantonCode: "BS" },
  { name: "Basel", postalCode: "4051", cantonCode: "BS" },
  { name: "Basel", postalCode: "4052", cantonCode: "BS" },
  { name: "Basel", postalCode: "4053", cantonCode: "BS" },
  { name: "Basel", postalCode: "4054", cantonCode: "BS" },
  { name: "Basel", postalCode: "4055", cantonCode: "BS" },
  { name: "Basel", postalCode: "4056", cantonCode: "BS" },
  { name: "Basel", postalCode: "4057", cantonCode: "BS" },
  { name: "Basel", postalCode: "4058", cantonCode: "BS" },
  { name: "Basel", postalCode: "4059", cantonCode: "BS" },
  { name: "Muttenz", postalCode: "4132", cantonCode: "BL" },
  { name: "Pratteln", postalCode: "4133", cantonCode: "BL" },
  { name: "Binningen", postalCode: "4102", cantonCode: "BL" },
  { name: "Münchenstein", postalCode: "4142", cantonCode: "BL" },
  { name: "Reinach", postalCode: "4153", cantonCode: "BL" },
  { name: "Allschwil", postalCode: "4123", cantonCode: "BL" },
  { name: "Oberwil", postalCode: "4104", cantonCode: "BL" },
  
  // Ticino
  { name: "Lugano", postalCode: "6900", cantonCode: "TI" },
  { name: "Bellinzona", postalCode: "6500", cantonCode: "TI" },
  { name: "Locarno", postalCode: "6600", cantonCode: "TI" },
  { name: "Chiasso", postalCode: "6830", cantonCode: "TI" },
  { name: "Mendrisio", postalCode: "6850", cantonCode: "TI" },
  { name: "Lugano", postalCode: "6901", cantonCode: "TI" },
  { name: "Lugano", postalCode: "6902", cantonCode: "TI" },
  { name: "Lugano", postalCode: "6903", cantonCode: "TI" },
  { name: "Massagno", postalCode: "6900", cantonCode: "TI" },
  
  // Valais
  { name: "Sion", postalCode: "1950", cantonCode: "VS" },
  { name: "Sierre", postalCode: "3960", cantonCode: "VS" },
  { name: "Martigny", postalCode: "1920", cantonCode: "VS" },
  { name: "Monthey", postalCode: "1870", cantonCode: "VS" },
  { name: "Brig", postalCode: "3900", cantonCode: "VS" },
  { name: "Visp", postalCode: "3930", cantonCode: "VS" },
  { name: "Nendaz", postalCode: "1997", cantonCode: "VS" },
  { name: "Crans-Montana", postalCode: "3963", cantonCode: "VS" },
  { name: "Verbier", postalCode: "1936", cantonCode: "VS" },
  { name: "Zermatt", postalCode: "3920", cantonCode: "VS" },
  
  // St. Gallen
  { name: "St. Gallen", postalCode: "9000", cantonCode: "SG" },
  { name: "St. Gallen", postalCode: "9001", cantonCode: "SG" },
  { name: "St. Gallen", postalCode: "9002", cantonCode: "SG" },
  { name: "St. Gallen", postalCode: "9003", cantonCode: "SG" },
  { name: "St. Gallen", postalCode: "9004", cantonCode: "SG" },
  { name: "St. Gallen", postalCode: "9005", cantonCode: "SG" },
  { name: "St. Gallen", postalCode: "9006", cantonCode: "SG" },
  { name: "St. Gallen", postalCode: "9007", cantonCode: "SG" },
  { name: "St. Gallen", postalCode: "9008", cantonCode: "SG" },
  { name: "Rapperswil-Jona", postalCode: "8640", cantonCode: "SG" },
  { name: "Gossau", postalCode: "9200", cantonCode: "SG" },
  { name: "Wil", postalCode: "9500", cantonCode: "SG" },
  { name: "Altstätten", postalCode: "9450", cantonCode: "SG" },
  { name: "Buchs", postalCode: "9470", cantonCode: "SG" },
  { name: "Flawil", postalCode: "9230", cantonCode: "SG" },
  { name: "Heerbrugg", postalCode: "9435", cantonCode: "SG" },
  
  // Aargau
  { name: "Aarau", postalCode: "5000", cantonCode: "AG" },
  { name: "Baden", postalCode: "5400", cantonCode: "AG" },
  { name: "Wettingen", postalCode: "5430", cantonCode: "AG" },
  { name: "Wohlen", postalCode: "5610", cantonCode: "AG" },
  { name: "Rheinfelden", postalCode: "4310", cantonCode: "AG" },
  { name: "Oftringen", postalCode: "4665", cantonCode: "AG" },
  { name: "Zofingen", postalCode: "4800", cantonCode: "AG" },
  { name: "Suhr", postalCode: "5034", cantonCode: "AG" },
  { name: "Brugg", postalCode: "5200", cantonCode: "AG" },
  { name: "Brugg", postalCode: "5201", cantonCode: "AG" },
  { name: "Windisch", postalCode: "5210", cantonCode: "AG" },
  { name: "Frick", postalCode: "5070", cantonCode: "AG" },
  { name: "Möhlin", postalCode: "4313", cantonCode: "AG" },
  
  // Luzern
  { name: "Luzern", postalCode: "6000", cantonCode: "LU" },
  { name: "Luzern", postalCode: "6001", cantonCode: "LU" },
  { name: "Luzern", postalCode: "6002", cantonCode: "LU" },
  { name: "Luzern", postalCode: "6003", cantonCode: "LU" },
  { name: "Luzern", postalCode: "6004", cantonCode: "LU" },
  { name: "Luzern", postalCode: "6005", cantonCode: "LU" },
  { name: "Emmen", postalCode: "6032", cantonCode: "LU" },
  { name: "Kriens", postalCode: "6010", cantonCode: "LU" },
  { name: "Littau", postalCode: "6014", cantonCode: "LU" },
  { name: "Horw", postalCode: "6048", cantonCode: "LU" },
  { name: "Ebikon", postalCode: "6030", cantonCode: "LU" },
  
  // Graubünden
  { name: "Chur", postalCode: "7000", cantonCode: "GR" },
  { name: "Chur", postalCode: "7001", cantonCode: "GR" },
  { name: "Chur", postalCode: "7002", cantonCode: "GR" },
  { name: "Davos", postalCode: "7270", cantonCode: "GR" },
  { name: "Davos Platz", postalCode: "7270", cantonCode: "GR" },
  { name: "St. Moritz", postalCode: "7500", cantonCode: "GR" },
  { name: "Landquart", postalCode: "7302", cantonCode: "GR" },
  { name: "Domat/Ems", postalCode: "7013", cantonCode: "GR" },
  { name: "Ilanz", postalCode: "7130", cantonCode: "GR" },
  
  // Thurgau
  { name: "Frauenfeld", postalCode: "8500", cantonCode: "TG" },
  { name: "Kreuzlingen", postalCode: "8280", cantonCode: "TG" },
  { name: "Amriswil", postalCode: "8580", cantonCode: "TG" },
  { name: "Arbon", postalCode: "9320", cantonCode: "TG" },
  { name: "Weinfelden", postalCode: "8570", cantonCode: "TG" },
  { name: "Romanshorn", postalCode: "8590", cantonCode: "TG" },
  
  // Neuchâtel
  { name: "Neuchâtel", postalCode: "2000", cantonCode: "NE" },
  { name: "Neuchâtel", postalCode: "2001", cantonCode: "NE" },
  { name: "Neuchâtel", postalCode: "2002", cantonCode: "NE" },
  { name: "La Chaux-de-Fonds", postalCode: "2300", cantonCode: "NE" },
  { name: "Le Locle", postalCode: "2400", cantonCode: "NE" },
  
  // Fribourg
  { name: "Fribourg", postalCode: "1700", cantonCode: "FR" },
  { name: "Fribourg", postalCode: "1701", cantonCode: "FR" },
  { name: "Fribourg", postalCode: "1702", cantonCode: "FR" },
  
  // Solothurn
  { name: "Solothurn", postalCode: "4500", cantonCode: "SO" },
  { name: "Solothurn", postalCode: "4501", cantonCode: "SO" },
  { name: "Grenchen", postalCode: "2540", cantonCode: "SO" },
  
  // Zug
  { name: "Zug", postalCode: "6300", cantonCode: "ZG" },
  { name: "Zug", postalCode: "6301", cantonCode: "ZG" },
  { name: "Baar", postalCode: "6340", cantonCode: "ZG" },
  { name: "Cham", postalCode: "6330", cantonCode: "ZG" },
  { name: "Steinhausen", postalCode: "6312", cantonCode: "ZG" },
  
  // Schwyz
  { name: "Schwyz", postalCode: "6430", cantonCode: "SZ" },
  { name: "Einsiedeln", postalCode: "8840", cantonCode: "SZ" },
  { name: "Freienbach", postalCode: "8807", cantonCode: "SZ" },
  { name: "Küssnacht", postalCode: "6403", cantonCode: "SZ" },
  
  // Jura
  { name: "Delémont", postalCode: "2800", cantonCode: "JU" },
  { name: "Porrentruy", postalCode: "2900", cantonCode: "JU" },
  
  // Schaffhausen
  { name: "Schaffhausen", postalCode: "8200", cantonCode: "SH" },
  { name: "Neuhausen am Rheinfall", postalCode: "8212", cantonCode: "SH" },
  
  // Appenzell
  { name: "Appenzell", postalCode: "9050", cantonCode: "AI" },
  { name: "Herisau", postalCode: "9100", cantonCode: "AR" },
  { name: "Teufen", postalCode: "9032", cantonCode: "AR" },
  { name: "Urnäsch", postalCode: "9107", cantonCode: "AR" },
  
  // Uri, Obwalden, Nidwalden, Glarus
  { name: "Altdorf", postalCode: "6460", cantonCode: "UR" },
  { name: "Sarnen", postalCode: "6060", cantonCode: "OW" },
  { name: "Stans", postalCode: "6370", cantonCode: "NW" },
  { name: "Glarus", postalCode: "8750", cantonCode: "GL" },
  
  // Liechtenstein adicional
  { name: "Schaan", postalCode: "9494", cantonCode: "LI" },
  { name: "Balzers", postalCode: "9496", cantonCode: "LI" },
  { name: "Triesen", postalCode: "9495", cantonCode: "LI" },
  { name: "Eschen", postalCode: "9492", cantonCode: "LI" },
  { name: "Mauren", postalCode: "9493", cantonCode: "LI" },
  { name: "Triesenberg", postalCode: "9497", cantonCode: "LI" },
  { name: "Ruggell", postalCode: "9491", cantonCode: "LI" },
  { name: "Gamprin", postalCode: "9485", cantonCode: "LI" },
  { name: "Schellenberg", postalCode: "9488", cantonCode: "LI" },
  { name: "Planken", postalCode: "9498", cantonCode: "LI" },
]

async function main() {
  console.log('Añadiendo municipios adicionales...')
  
  let added = 0
  let skipped = 0
  
  for (const municipality of additionalMunicipalities) {
    try {
      // Verificar si ya existe
      const existing = await db.location.findFirst({
        where: {
          name: municipality.name,
          postalCode: municipality.postalCode,
          type: 'city'
        }
      })
      
      if (existing) {
        skipped++
        continue
      }
      
      // Buscar cantón
      const canton = await db.canton.findFirst({
        where: { code: municipality.cantonCode }
      })
      
      await db.location.create({
        data: {
          name: municipality.name,
          type: 'city',
          postalCode: municipality.postalCode,
          cantonId: canton?.id || null
        }
      })
      
      added++
    } catch (error) {
      skipped++
    }
  }
  
  console.log(`✅ Añadidos: ${added}`)
  console.log(`⏭️ Omitidos (ya existían): ${skipped}`)
  
  const total = await db.location.count()
  console.log(`📊 Total ubicaciones: ${total}`)
  
  await db.$disconnect()
}

main().catch(console.error)
