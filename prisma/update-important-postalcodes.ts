import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Códigos postales importantes de Suiza con nomenclatura correcta
const IMPORTANT_POSTAL_CODES = [
  // Buchs - todos los cantones
  { name: 'Buchs AG', postalCode: '5033', cantonCode: 'AG' },
  { name: 'Buchs SG', postalCode: '9470', cantonCode: 'SG' },
  { name: 'Buchs ZH', postalCode: '8107', cantonCode: 'ZH' },
  { name: 'Buchs LU', postalCode: '6124', cantonCode: 'LU' },
  
  // Ciudades principales con sus códigos postales
  // Zúrich
  { name: 'Zürich', postalCode: '8000', cantonCode: 'ZH' },
  { name: 'Winterthur', postalCode: '8400', cantonCode: 'ZH' },
  { name: 'Uster', postalCode: '8610', cantonCode: 'ZH' },
  { name: 'Dübendorf', postalCode: '8600', cantonCode: 'ZH' },
  { name: 'Wetzikon', postalCode: '8620', cantonCode: 'ZH' },
  { name: 'Dietikon', postalCode: '8953', cantonCode: 'ZH' },
  { name: 'Wädenswil', postalCode: '8820', cantonCode: 'ZH' },
  { name: 'Horgen', postalCode: '8810', cantonCode: 'ZH' },
  { name: 'Thalwil', postalCode: '8800', cantonCode: 'ZH' },
  { name: 'Adliswil', postalCode: '8134', cantonCode: 'ZH' },
  { name: 'Kloten', postalCode: '8302', cantonCode: 'ZH' },
  { name: 'Wallisellen', postalCode: '8304', cantonCode: 'ZH' },
  { name: 'Opfikon', postalCode: '8152', cantonCode: 'ZH' },
  { name: 'Bülach', postalCode: '8180', cantonCode: 'ZH' },
  { name: 'Schlieren', postalCode: '8952', cantonCode: 'ZH' },
  { name: 'Küssnacht', postalCode: '6403', cantonCode: 'SZ' },
  
  // Ginebra
  { name: 'Genève', postalCode: '1200', cantonCode: 'GE' },
  { name: 'Vernier', postalCode: '1214', cantonCode: 'GE' },
  { name: 'Lancy', postalCode: '1219', cantonCode: 'GE' },
  { name: 'Meyrin', postalCode: '1217', cantonCode: 'GE' },
  { name: 'Carouge', postalCode: '1227', cantonCode: 'GE' },
  { name: 'Onex', postalCode: '1213', cantonCode: 'GE' },
  { name: 'Thônex', postalCode: '1226', cantonCode: 'GE' },
  { name: 'Versoix', postalCode: '1290', cantonCode: 'GE' },
  
  // Berna
  { name: 'Bern', postalCode: '3000', cantonCode: 'BE' },
  { name: 'Biel/Bienne', postalCode: '2500', cantonCode: 'BE' },
  { name: 'Thun', postalCode: '3600', cantonCode: 'BE' },
  { name: 'Burgdorf', postalCode: '3400', cantonCode: 'BE' },
  { name: 'Langenthal', postalCode: '4900', cantonCode: 'BE' },
  { name: 'Steffisburg', postalCode: '3612', cantonCode: 'BE' },
  { name: 'Köniz', postalCode: '3098', cantonCode: 'BE' },
  { name: 'Muri bei Bern', postalCode: '3074', cantonCode: 'BE' },
  { name: 'Spiez', postalCode: '3700', cantonCode: 'BE' },
  { name: 'Interlaken', postalCode: '3800', cantonCode: 'BE' },
  { name: 'Aarberg', postalCode: '3270', cantonCode: 'BE' },
  { name: 'Lyss', postalCode: '3250', cantonCode: 'BE' },
  { name: 'Münsingen', postalCode: '3117', cantonCode: 'BE' },
  { name: 'Worb', postalCode: '3076', cantonCode: 'BE' },
  { name: 'Ittigen', postalCode: '3063', cantonCode: 'BE' },
  { name: 'Belp', postalCode: '3123', cantonCode: 'BE' },
  
  // Basilea
  { name: 'Basel', postalCode: '4000', cantonCode: 'BS' },
  { name: 'Riehen', postalCode: '4125', cantonCode: 'BS' },
  { name: 'Bettingen', postalCode: '4126', cantonCode: 'BS' },
  { name: 'Muttenz', postalCode: '4132', cantonCode: 'BL' },
  { name: 'Pratteln', postalCode: '4133', cantonCode: 'BL' },
  { name: 'Münchenstein', postalCode: '4142', cantonCode: 'BL' },
  { name: 'Reinach', postalCode: '4153', cantonCode: 'BL' },
  { name: 'Allschwil', postalCode: '4123', cantonCode: 'BL' },
  { name: 'Oberwil', postalCode: '4104', cantonCode: 'BL' },
  { name: 'Binningen', postalCode: '4102', cantonCode: 'BL' },
  { name: 'Bottmingen', postalCode: '4103', cantonCode: 'BL' },
  
  // Lausana y Vaud
  { name: 'Lausanne', postalCode: '1000', cantonCode: 'VD' },
  { name: 'Renens', postalCode: '1020', cantonCode: 'VD' },
  { name: 'Pully', postalCode: '1009', cantonCode: 'VD' },
  { name: 'Morges', postalCode: '1110', cantonCode: 'VD' },
  { name: 'Nyon', postalCode: '1260', cantonCode: 'VD' },
  { name: 'Vevey', postalCode: '1800', cantonCode: 'VD' },
  { name: 'Montreux', postalCode: '1820', cantonCode: 'VD' },
  { name: 'Yverdon-les-Bains', postalCode: '1400', cantonCode: 'VD' },
  { name: 'Ecublens', postalCode: '1024', cantonCode: 'VD' },
  { name: 'Crissier', postalCode: '1023', cantonCode: 'VD' },
  
  // Lucerna
  { name: 'Luzern', postalCode: '6000', cantonCode: 'LU' },
  { name: 'Emmen', postalCode: '6032', cantonCode: 'LU' },
  { name: 'Kriens', postalCode: '6010', cantonCode: 'LU' },
  { name: 'Littau', postalCode: '6023', cantonCode: 'LU' },
  { name: 'Horw', postalCode: '6048', cantonCode: 'LU' },
  { name: 'Ebikon', postalCode: '6047', cantonCode: 'LU' },
  { name: 'Sursee', postalCode: '6210', cantonCode: 'LU' },
  { name: 'Willisau', postalCode: '6130', cantonCode: 'LU' },
  
  // St. Gallen
  { name: 'St. Gallen', postalCode: '9000', cantonCode: 'SG' },
  { name: 'Rapperswil-Jona', postalCode: '8640', cantonCode: 'SG' },
  { name: 'Gossau', postalCode: '9200', cantonCode: 'SG' },
  { name: 'Wil', postalCode: '9500', cantonCode: 'SG' },
  { name: 'Uzwil', postalCode: '9240', cantonCode: 'SG' },
  { name: 'Altstätten', postalCode: '9450', cantonCode: 'SG' },
  { name: 'Buchs SG', postalCode: '9470', cantonCode: 'SG' },
  { name: 'Heerbrugg', postalCode: '9435', cantonCode: 'SG' },
  { name: 'Wattwil', postalCode: '9630', cantonCode: 'SG' },
  { name: 'Rheineck', postalCode: '9424', cantonCode: 'SG' },
  
  // Aargau
  { name: 'Aarau', postalCode: '5000', cantonCode: 'AG' },
  { name: 'Baden', postalCode: '5400', cantonCode: 'AG' },
  { name: 'Wettingen', postalCode: '5430', cantonCode: 'AG' },
  { name: 'Wohlen', postalCode: '5610', cantonCode: 'AG' },
  { name: 'Menziken', postalCode: '5737', cantonCode: 'AG' },
  { name: 'Reinach', postalCode: '5734', cantonCode: 'AG' },
  { name: 'Rheinfelden', postalCode: '4310', cantonCode: 'AG' },
  { name: 'Zofingen', postalCode: '4800', cantonCode: 'AG' },
  { name: 'Olten', postalCode: '4600', cantonCode: 'SO' }, // SO
  { name: 'Brugg', postalCode: '5200', cantonCode: 'AG' },
  { name: 'Turgi', postalCode: '5300', cantonCode: 'AG' },
  
  // Zug
  { name: 'Zug', postalCode: '6300', cantonCode: 'ZG' },
  { name: 'Baar', postalCode: '6340', cantonCode: 'ZG' },
  { name: 'Cham', postalCode: '6330', cantonCode: 'ZG' },
  { name: 'Steinhausen', postalCode: '6312', cantonCode: 'ZG' },
  
  // Fribourg
  { name: 'Fribourg', postalCode: '1700', cantonCode: 'FR' },
  { name: 'Bulle', postalCode: '1630', cantonCode: 'FR' },
  { name: 'Villars-sur-Glâne', postalCode: '1752', cantonCode: 'FR' },
  
  // Solothurn
  { name: 'Solothurn', postalCode: '4500', cantonCode: 'SO' },
  { name: 'Grenchen', postalCode: '2540', cantonCode: 'SO' },
  { name: 'Olten', postalCode: '4600', cantonCode: 'SO' },
  
  // Ticino
  { name: 'Lugano', postalCode: '6900', cantonCode: 'TI' },
  { name: 'Bellinzona', postalCode: '6500', cantonCode: 'TI' },
  { name: 'Locarno', postalCode: '6600', cantonCode: 'TI' },
  { name: 'Chiasso', postalCode: '6830', cantonCode: 'TI' },
  { name: 'Mendrisio', postalCode: '6850', cantonCode: 'TI' },
  
  // Valais
  { name: 'Sion', postalCode: '1950', cantonCode: 'VS' },
  { name: 'Monthey', postalCode: '1870', cantonCode: 'VS' },
  { name: 'Sierre', postalCode: '3960', cantonCode: 'VS' },
  { name: 'Martigny', postalCode: '1920', cantonCode: 'VS' },
  { name: 'Brig-Glis', postalCode: '3900', cantonCode: 'VS' },
  { name: 'Visp', postalCode: '3930', cantonCode: 'VS' },
  { name: 'Zermatt', postalCode: '3920', cantonCode: 'VS' },
  
  // Neuchâtel
  { name: 'Neuchâtel', postalCode: '2000', cantonCode: 'NE' },
  { name: 'La Chaux-de-Fonds', postalCode: '2300', cantonCode: 'NE' },
  { name: 'Le Locle', postalCode: '2400', cantonCode: 'NE' },
  
  // Jura
  { name: 'Delémont', postalCode: '2800', cantonCode: 'JU' },
  { name: 'Porrentruy', postalCode: '2900', cantonCode: 'JU' },
  
  // Schaffhausen
  { name: 'Schaffhausen', postalCode: '8200', cantonCode: 'SH' },
  
  // Graubünden
  { name: 'Chur', postalCode: '7000', cantonCode: 'GR' },
  { name: 'Davos', postalCode: '7270', cantonCode: 'GR' },
  { name: 'St. Moritz', postalCode: '7500', cantonCode: 'GR' },
  
  // Thurgau
  { name: 'Frauenfeld', postalCode: '8500', cantonCode: 'TG' },
  { name: 'Kreuzlingen', postalCode: '8280', cantonCode: 'TG' },
  { name: 'Amriswil', postalCode: '8580', cantonCode: 'TG' },
  { name: 'Weinfelden', postalCode: '8570', cantonCode: 'TG' },
  { name: 'Romanshorn', postalCode: '8590', cantonCode: 'TG' },
  { name: 'Arbon', postalCode: '9320', cantonCode: 'TG' },
  
  // Obwalden
  { name: 'Sarnen', postalCode: '6060', cantonCode: 'OW' },
  
  // Nidwalden
  { name: 'Stans', postalCode: '6370', cantonCode: 'NW' },
  
  // Schwyz
  { name: 'Schwyz', postalCode: '6430', cantonCode: 'SZ' },
  { name: 'Einsiedeln', postalCode: '8840', cantonCode: 'SZ' },
  
  // Glarus
  { name: 'Glarus', postalCode: '8750', cantonCode: 'GL' },
  
  // Appenzell Ausserrhoden
  { name: 'Herisau', postalCode: '9100', cantonCode: 'AR' },
  { name: 'Uzwil', postalCode: '9240', cantonCode: 'AR' },
  
  // Appenzell Innerrhoden
  { name: 'Appenzell', postalCode: '9050', cantonCode: 'AI' },
  
  // Uri
  { name: 'Altdorf', postalCode: '6460', cantonCode: 'UR' },
]

async function main() {
  console.log('🔄 Actualizando códigos postales importantes...\n')

  const cantons = await prisma.canton.findMany()
  const cantonMap = new Map(cantons.map(c => [c.code, c]))

  let updated = 0
  let notFound = 0

  for (const entry of IMPORTANT_POSTAL_CODES) {
    const canton = cantonMap.get(entry.cantonCode)
    if (!canton) {
      console.log(`⚠️ Cantón ${entry.cantonCode} no encontrado`)
      continue
    }

    // Buscar la ciudad por nombre (sin sufijo de cantón) y cantón
    const baseName = entry.name.replace(/ (AG|SG|ZH|LU|AR|AI|VD|VS|NE|JU|SH|GR|TG|OW|NW|SZ|GL|UR|TI|FR|BE|BS|BL|GE|SO|ZG)$/, '')
    
    const city = await prisma.city.findFirst({
      where: {
        OR: [
          { name: entry.name },
          { name: baseName },
          { name: { contains: baseName } }
        ],
        cantonId: canton.id
      }
    })

    if (city) {
      await prisma.city.update({
        where: { id: city.id },
        data: {
          postalCode: entry.postalCode,
          name: entry.name // Asegurar nombre correcto con sufijo
        }
      })
      updated++
      console.log(`✅ ${entry.name} (${entry.postalCode}) - ${entry.cantonCode}`)
    } else {
      notFound++
      console.log(`❌ No encontrada: ${entry.name} en ${entry.cantonCode}`)
    }
  }

  console.log(`\n📊 Resultados:`)
  console.log(`   Actualizadas: ${updated}`)
  console.log(`   No encontradas: ${notFound}`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
