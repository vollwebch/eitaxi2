import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Postal codes for major cities and municipalities
const postalCodes: Record<string, { canton: string; postalCode: string }> = {}

// Major cities
postalCodes['Geneva'] = { canton: 'GE', postalCode: '1200' }
postalCodes['Lucerne'] = { canton: 'LU', postalCode: '6000' }
postalCodes['St. Gallen'] = { canton: 'SG', postalCode: '9000' }
postalCodes['Rapperswil-Jona'] = { canton: 'SG', postalCode: '8640' }
postalCodes['Gossau (SG)'] = { canton: 'SG', postalCode: '9200' }
postalCodes['Wil (SG)'] = { canton: 'SG', postalCode: '9500' }
postalCodes['La Chaux-de-Fonds'] = { canton: 'NE', postalCode: '2300' }
postalCodes['Biel/Bienne'] = { canton: 'BE', postalCode: '2500' }
postalCodes['Freiburg'] = { canton: 'FR', postalCode: '1700' }
postalCodes['Fribourg'] = { canton: 'FR', postalCode: '1700' }

// AG municipalities
postalCodes['Arni (AG)'] = { canton: 'AG', postalCode: '8907' }
postalCodes['Birmenstorf'] = { canton: 'AG', postalCode: '5413' }
postalCodes['Bremgarten (AG)'] = { canton: 'AG', postalCode: '5620' }
postalCodes['Bremwil'] = { canton: 'AG', postalCode: '5704' }
postalCodes['Buchs (AG)'] = { canton: 'AG', postalCode: '5033' }
postalCodes['Burg (AG)'] = { canton: 'AG', postalCode: '5608' }
postalCodes['Erlinsbach (AG)'] = { canton: 'AG', postalCode: '5018' }
postalCodes['Hausen (AG)'] = { canton: 'AG', postalCode: '5212' }
postalCodes['Holderbank (AG)'] = { canton: 'AG', postalCode: '5026' }
postalCodes['Leimbach (AG)'] = { canton: 'AG', postalCode: '5627' }
postalCodes['Muri (AG)'] = { canton: 'AG', postalCode: '5630' }
postalCodes['Reinach (AG)'] = { canton: 'AG', postalCode: '5734' }
postalCodes['Rohr (AG)'] = { canton: 'AG', postalCode: '4118' }

// Major Swiss cities
postalCodes['Zurich'] = { canton: 'ZH', postalCode: '8000' }
postalCodes['Zürich'] = { canton: 'ZH', postalCode: '8000' }
postalCodes['Bern'] = { canton: 'BE', postalCode: '3000' }
postalCodes['Lausanne'] = { canton: 'VD', postalCode: '1000' }
postalCodes['Winterthur'] = { canton: 'ZH', postalCode: '8400' }
postalCodes['Lugano'] = { canton: 'TI', postalCode: '6900' }
postalCodes['Biel'] = { canton: 'BE', postalCode: '2500' }
postalCodes['Bienne'] = { canton: 'BE', postalCode: '2500' }

// Additional major cities
postalCodes['Adliswil'] = { canton: 'ZH', postalCode: '8134' }
postalCodes['Affoltern am Albis'] = { canton: 'ZH', postalCode: '8910' }
postalCodes['Aesch'] = { canton: 'BL', postalCode: '4147' }
postalCodes['Aeschi'] = { canton: 'BE', postalCode: '3704' }
postalCodes['Aigle'] = { canton: 'VD', postalCode: '1860' }
postalCodes['Allschwil'] = { canton: 'BL', postalCode: '4123' }
postalCodes['Altdorf'] = { canton: 'UR', postalCode: '6460' }
postalCodes['Altstätten'] = { canton: 'SG', postalCode: '9450' }
postalCodes['Amriswil'] = { canton: 'TG', postalCode: '8580' }
postalCodes['Andelfingen'] = { canton: 'ZH', postalCode: '8450' }
postalCodes['Appenzell'] = { canton: 'AI', postalCode: '9050' }
postalCodes['Arbon'] = { canton: 'TG', postalCode: '9320' }
postalCodes['Arth'] = { canton: 'SZ', postalCode: '6414' }
postalCodes['Arosa'] = { canton: 'GR', postalCode: '7050' }
postalCodes['Baar'] = { canton: 'ZG', postalCode: '6340' }
postalCodes['Baden'] = { canton: 'AG', postalCode: '5400' }
postalCodes['Bassersdorf'] = { canton: 'ZH', postalCode: '8303' }
postalCodes['Bellinzona'] = { canton: 'TI', postalCode: '6500' }
postalCodes['Belp'] = { canton: 'BE', postalCode: '3123' }
postalCodes['Berg (TG)'] = { canton: 'TG', postalCode: '8562' }
postalCodes['Berneck'] = { canton: 'SG', postalCode: '9442' }
postalCodes['Binningen'] = { canton: 'BL', postalCode: '4102' }
postalCodes['Birsfelden'] = { canton: 'BL', postalCode: '4127' }
postalCodes['Bischofszell'] = { canton: 'TG', postalCode: '9220' }
postalCodes['Boudry'] = { canton: 'NE', postalCode: '2017' }
postalCodes['Brugg'] = { canton: 'AG', postalCode: '5000' }
postalCodes['Buchs'] = { canton: 'SG', postalCode: '9470' }
postalCodes['Bulle'] = { canton: 'FR', postalCode: '1630' }
postalCodes['Burgdorf'] = { canton: 'BE', postalCode: '3400' }
postalCodes['Bussnang'] = { canton: 'TG', postalCode: '8220' }
postalCodes['Carouge'] = { canton: 'GE', postalCode: '1227' }
postalCodes['Cham'] = { canton: 'ZG', postalCode: '6331' }
postalCodes['Chur'] = { canton: 'GR', postalCode: '7000' }
postalCodes['Davos'] = { canton: 'GR', postalCode: '7270' }
postalCodes['Dietikon'] = { canton: 'ZH', postalCode: '8950' }
postalCodes['Dübendorf'] = { canton: 'ZH', postalCode: '8600' }
postalCodes['Einsiedeln'] = { canton: 'SZ', postalCode: '8840' }
postalCodes['Emmen'] = { canton: 'LU', postalCode: '6032' }
postalCodes['Frauenfeld'] = { canton: 'TG', postalCode: '8500' }
postalCodes['Freienbach'] = { canton: 'SZ', postalCode: '8807' }
postalCodes['Grenchen'] = { canton: 'SO', postalCode: '2540' }
postalCodes['Herisau'] = { canton: 'AR', postalCode: '9100' }
postalCodes['Horgen'] = { canton: 'ZH', postalCode: '8810' }
postalCodes['Hünenberg'] = { canton: 'ZG', postalCode: '6331' }
postalCodes['Interlaken'] = { canton: 'BE', postalCode: '3800' }
postalCodes['Kloten'] = { canton: 'ZH', postalCode: '8302' }
postalCodes['Kreuzlingen'] = { canton: 'TG', postalCode: '8280' }
postalCodes['Kriens'] = { canton: 'LU', postalCode: '6010' }
postalCodes['Küsnacht'] = { canton: 'ZH', postalCode: '8700' }
postalCodes['Küssnacht'] = { canton: 'SZ', postalCode: '6403' }
postalCodes['Lancy'] = { canton: 'GE', postalCode: '1212' }
postalCodes['Langenthal'] = { canton: 'BE', postalCode: '4900' }
postalCodes['Liestal'] = { canton: 'BL', postalCode: '4410' }
postalCodes['Locarno'] = { canton: 'TI', postalCode: '6600' }
postalCodes['Lyss'] = { canton: 'BE', postalCode: '3250' }
postalCodes['Martigny'] = { canton: 'VS', postalCode: '1920' }
postalCodes['Meilen'] = { canton: 'ZH', postalCode: '8706' }
postalCodes['Mendrisio'] = { canton: 'TI', postalCode: '6850' }
postalCodes['Meyrin'] = { canton: 'GE', postalCode: '1217' }
postalCodes['Monthey'] = { canton: 'VS', postalCode: '1870' }
postalCodes['Montreux'] = { canton: 'VD', postalCode: '1820' }
postalCodes['Morges'] = { canton: 'VD', postalCode: '1110' }
postalCodes['Muttenz'] = { canton: 'BL', postalCode: '4132' }
postalCodes['Nyon'] = { canton: 'VD', postalCode: '1260' }
postalCodes['Olten'] = { canton: 'SO', postalCode: '4600' }
postalCodes['Onex'] = { canton: 'GE', postalCode: '1213' }
postalCodes['Opfikon'] = { canton: 'ZH', postalCode: '8152' }
postalCodes['Ostermundigen'] = { canton: 'BE', postalCode: '3072' }
postalCodes['Pratteln'] = { canton: 'BL', postalCode: '4133' }
postalCodes['Pully'] = { canton: 'VD', postalCode: '1009' }
postalCodes['Rapperswil'] = { canton: 'SG', postalCode: '8640' }
postalCodes['Reinach (BL)'] = { canton: 'BL', postalCode: '4153' }
postalCodes['Renens'] = { canton: 'VD', postalCode: '1020' }
postalCodes['Rheinfelden'] = { canton: 'AG', postalCode: '4310' }
postalCodes['Richterswil'] = { canton: 'ZH', postalCode: '8805' }
postalCodes['Riehen'] = { canton: 'BS', postalCode: '4125' }
postalCodes['Risch'] = { canton: 'ZG', postalCode: '6343' }
postalCodes['Romanshorn'] = { canton: 'TG', postalCode: '8590' }
postalCodes['Rorschach'] = { canton: 'SG', postalCode: '9400' }
postalCodes['Schaffhausen'] = { canton: 'SH', postalCode: '8200' }
postalCodes['Schlieren'] = { canton: 'ZH', postalCode: '8952' }
postalCodes['Schwyz'] = { canton: 'SZ', postalCode: '6430' }
postalCodes['Sitten'] = { canton: 'VS', postalCode: '1950' }
postalCodes['Sion'] = { canton: 'VS', postalCode: '1950' }
postalCodes['Solothurn'] = { canton: 'SO', postalCode: '4500' }
postalCodes['Spiez'] = { canton: 'BE', postalCode: '3700' }
postalCodes['St. Moritz'] = { canton: 'GR', postalCode: '7500' }
postalCodes['Steffisburg'] = { canton: 'BE', postalCode: '3612' }
postalCodes['Stein am Rhein'] = { canton: 'SH', postalCode: '8260' }
postalCodes['Thun'] = { canton: 'BE', postalCode: '3600' }
postalCodes['Uster'] = { canton: 'ZH', postalCode: '8610' }
postalCodes['Uzwil'] = { canton: 'SG', postalCode: '9240' }
postalCodes['Vernier'] = { canton: 'GE', postalCode: '1214' }
postalCodes['Versoix'] = { canton: 'GE', postalCode: '1290' }
postalCodes['Vevey'] = { canton: 'VD', postalCode: '1800' }
postalCodes['Volketswil'] = { canton: 'ZH', postalCode: '8604' }
postalCodes['Wädenswil'] = { canton: 'ZH', postalCode: '8820' }
postalCodes['Wallisellen'] = { canton: 'ZH', postalCode: '8304' }
postalCodes['Wettingen'] = { canton: 'AG', postalCode: '5430' }
postalCodes['Wetzikon'] = { canton: 'ZH', postalCode: '8620' }
postalCodes['Widnau'] = { canton: 'SG', postalCode: '9443' }
postalCodes['Wohlen'] = { canton: 'AG', postalCode: '5610' }
postalCodes['Wollerau'] = { canton: 'SZ', postalCode: '8832' }
postalCodes['Worb'] = { canton: 'BE', postalCode: '3076' }
postalCodes['Yverdon-les-Bains'] = { canton: 'VD', postalCode: '1400' }
postalCodes['Zermatt'] = { canton: 'VS', postalCode: '3920' }
postalCodes['Zug'] = { canton: 'ZG', postalCode: '6300' }

// Additional TG
postalCodes['Aadorf'] = { canton: 'TG', postalCode: '8362' }

// Additional BL
postalCodes['Arisdorf'] = { canton: 'BL', postalCode: '4422' }
postalCodes['Arlesheim'] = { canton: 'BL', postalCode: '4144' }
postalCodes['Bennwil'] = { canton: 'BL', postalCode: '4448' }
postalCodes['Böckten'] = { canton: 'BL', postalCode: '4461' }
postalCodes['Bottmingen'] = { canton: 'BL', postalCode: '4103' }
postalCodes['Bubendorf'] = { canton: 'BL', postalCode: '4416' }
postalCodes['Buckten'] = { canton: 'BL', postalCode: '4449' }
postalCodes['Buus'] = { canton: 'BL', postalCode: '4454' }
postalCodes['Diepflingen'] = { canton: 'BL', postalCode: '4441' }
postalCodes['Diegten'] = { canton: 'BL', postalCode: '4453' }
postalCodes['Duggingen'] = { canton: 'BL', postalCode: '4203' }
postalCodes['Eptingen'] = { canton: 'BL', postalCode: '4458' }
postalCodes['Frenkendorf'] = { canton: 'BL', postalCode: '4402' }
postalCodes['Füllinsdorf'] = { canton: 'BL', postalCode: '4414' }
postalCodes['Giebenach'] = { canton: 'BL', postalCode: '4305' }
postalCodes['Grellingen'] = { canton: 'BL', postalCode: '4203' }
postalCodes['Hemmiken'] = { canton: 'BL', postalCode: '4462' }
postalCodes['Hölstein'] = { canton: 'BL', postalCode: '4447' }
postalCodes['Itingen'] = { canton: 'BL', postalCode: '4452' }
postalCodes['Känerkinden'] = { canton: 'BL', postalCode: '4461' }
postalCodes['Kilchberg (BL)'] = { canton: 'BL', postalCode: '4447' }
postalCodes['Lampenberg'] = { canton: 'BL', postalCode: '4448' }
postalCodes['Langenbruck'] = { canton: 'BL', postalCode: '4438' }
postalCodes['Laufen'] = { canton: 'BL', postalCode: '4225' }
postalCodes['Lausen'] = { canton: 'BL', postalCode: '4415' }
postalCodes['Läufelfingen'] = { canton: 'BL', postalCode: '4448' }
postalCodes['Liedertswil'] = { canton: 'BL', postalCode: '4438' }
postalCodes['Liesberg'] = { canton: 'BL', postalCode: '4226' }
postalCodes['Maisprach'] = { canton: 'BL', postalCode: '4124' }
postalCodes['Nusshof'] = { canton: 'BL', postalCode: '4445' }
postalCodes['Oberdorf (BL)'] = { canton: 'BL', postalCode: '4436' }
postalCodes['Oltingen'] = { canton: 'BL', postalCode: '4454' }
postalCodes['Ormalingen'] = { canton: 'BL', postalCode: '4464' }
postalCodes['Pfeffingen'] = { canton: 'BL', postalCode: '4109' }
postalCodes['Ramlinsburg'] = { canton: 'BL', postalCode: '4445' }
postalCodes['Reigoldswil'] = { canton: 'BL', postalCode: '4438' }
postalCodes['Rickenbach (BL)'] = { canton: 'BL', postalCode: '4457' }
postalCodes['Röschenz'] = { canton: 'BL', postalCode: '4233' }
postalCodes['Rothenfluh'] = { canton: 'BL', postalCode: '4466' }
postalCodes['Rümlingen'] = { canton: 'BL', postalCode: '4458' }
postalCodes['Rünenberg'] = { canton: 'BL', postalCode: '4467' }
postalCodes['Seltisberg'] = { canton: 'BL', postalCode: '4411' }
postalCodes['Tecknau'] = { canton: 'BL', postalCode: '4455' }
postalCodes['Tierstein'] = { canton: 'BL', postalCode: '4226' }
postalCodes['Wahlen'] = { canton: 'BL', postalCode: '4233' }
postalCodes['Waldenburg'] = { canton: 'BL', postalCode: '4437' }
postalCodes['Wenslingen'] = { canton: 'BL', postalCode: '4467' }
postalCodes['Witterswil'] = { canton: 'BL', postalCode: '4108' }
postalCodes['Zeglingen'] = { canton: 'BL', postalCode: '4455' }
postalCodes['Ziefen'] = { canton: 'BL', postalCode: '4414' }
postalCodes['Zunzgen'] = { canton: 'BL', postalCode: '4447' }
postalCodes['Hofstetten-Flüh'] = { canton: 'BL', postalCode: '4108' }
postalCodes['Nenzlingen'] = { canton: 'BL', postalCode: '4224' }
postalCodes['Burg im Leimental'] = { canton: 'BL', postalCode: '4108' }

// Additional LU
postalCodes['Adligenswil'] = { canton: 'LU', postalCode: '6043' }
postalCodes['Aesch (LU)'] = { canton: 'LU', postalCode: '6204' }
postalCodes['Altdorf (LU)'] = { canton: 'LU', postalCode: '6035' }
postalCodes['Altishofen'] = { canton: 'LU', postalCode: '6037' }
postalCodes['Ballwil'] = { canton: 'LU', postalCode: '6275' }
postalCodes['Beromünster'] = { canton: 'LU', postalCode: '6215' }
postalCodes['Buchrain'] = { canton: 'LU', postalCode: '6033' }
postalCodes['Buttisholz'] = { canton: 'LU', postalCode: '6018' }
postalCodes['Dagmersellen'] = { canton: 'LU', postalCode: '6252' }
postalCodes['Dierikon'] = { canton: 'LU', postalCode: '6036' }
postalCodes['Doppleschwand'] = { canton: 'LU', postalCode: '6173' }
postalCodes['Ebikon'] = { canton: 'LU', postalCode: '6030' }
postalCodes['Egolzwil'] = { canton: 'LU', postalCode: '6242' }
postalCodes['Eich'] = { canton: 'LU', postalCode: '6205' }
postalCodes['Entlebuch'] = { canton: 'LU', postalCode: '6162' }
postalCodes['Ettiswil'] = { canton: 'LU', postalCode: '6242' }
postalCodes['Fischbach (LU)'] = { canton: 'LU', postalCode: '6147' }
postalCodes['Flühli'] = { canton: 'LU', postalCode: '6174' }
postalCodes['Grossdietwil'] = { canton: 'LU', postalCode: '6143' }
postalCodes['Grosswangen'] = { canton: 'LU', postalCode: '6023' }
postalCodes['Hasle'] = { canton: 'LU', postalCode: '6166' }
postalCodes['Hergiswil (LU)'] = { canton: 'LU', postalCode: '6018' }
postalCodes['Hildisrieden'] = { canton: 'LU', postalCode: '6018' }
postalCodes['Hitzkirch'] = { canton: 'LU', postalCode: '6284' }
postalCodes['Hochdorf'] = { canton: 'LU', postalCode: '6280' }
postalCodes['Hohenrain'] = { canton: 'LU', postalCode: '6276' }
postalCodes['Horw'] = { canton: 'LU', postalCode: '6048' }
postalCodes['Inwil'] = { canton: 'LU', postalCode: '6033' }
postalCodes['Luthern'] = { canton: 'LU', postalCode: '6156' }
postalCodes['Malters'] = { canton: 'LU', postalCode: '6101' }
postalCodes['Mauensee'] = { canton: 'LU', postalCode: '6212' }
postalCodes['Meggen'] = { canton: 'LU', postalCode: '6045' }
postalCodes['Menznau'] = { canton: 'LU', postalCode: '6122' }
postalCodes['Neuenkirch'] = { canton: 'LU', postalCode: '6206' }
postalCodes['Nottwil'] = { canton: 'LU', postalCode: '6207' }
postalCodes['Pfaffnau'] = { canton: 'LU', postalCode: '6262' }
postalCodes['Reiden'] = { canton: 'LU', postalCode: '6262' }
postalCodes['Rickenbach (LU)'] = { canton: 'LU', postalCode: '6133' }
postalCodes['Roggliswil'] = { canton: 'LU', postalCode: '6262' }
postalCodes['Römerswil'] = { canton: 'LU', postalCode: '6023' }
postalCodes['Ruswil'] = { canton: 'LU', postalCode: '6017' }
postalCodes['Schüpfheim'] = { canton: 'LU', postalCode: '6162' }
postalCodes['Schwarzenberg'] = { canton: 'LU', postalCode: '6105' }
postalCodes['Sempach'] = { canton: 'LU', postalCode: '6204' }
postalCodes['Sursee'] = { canton: 'LU', postalCode: '6210' }
postalCodes['Triengen'] = { canton: 'LU', postalCode: '6234' }
postalCodes['Udligenswil'] = { canton: 'LU', postalCode: '6044' }
postalCodes['Vitznau'] = { canton: 'LU', postalCode: '6354' }
postalCodes['Wauwil'] = { canton: 'LU', postalCode: '6242' }
postalCodes['Weggis'] = { canton: 'LU', postalCode: '6353' }
postalCodes['Wikon'] = { canton: 'LU', postalCode: '6252' }
postalCodes['Willisau'] = { canton: 'LU', postalCode: '6130' }
postalCodes['Wolhusen'] = { canton: 'LU', postalCode: '6110' }
postalCodes['Zell (LU)'] = { canton: 'LU', postalCode: '6144' }

async function main() {
  console.log('🔧 Actualizando códigos postales...')
  console.log('='.repeat(60))
  
  let updated = 0
  let notFound = 0
  
  for (const [name, data] of Object.entries(postalCodes)) {
    const canton = await prisma.canton.findUnique({
      where: { code: data.canton }
    })
    
    if (!canton) {
      notFound++
      continue
    }
    
    const city = await prisma.city.findFirst({
      where: {
        name: name,
        cantonId: canton.id
      }
    })
    
    if (!city) {
      notFound++
      continue
    }
    
    if (city.postalCode !== data.postalCode) {
      await prisma.city.update({
        where: { id: city.id },
        data: {
          postalCode: data.postalCode,
          updatedAt: new Date()
        }
      })
      updated++
    }
  }
  
  console.log('='.repeat(60))
  console.log('✅ ACTUALIZACIÓN COMPLETADA!')
  console.log('='.repeat(60))
  console.log(`📊 Códigos postales actualizados: ${updated}`)
  console.log(`📊 No encontrados: ${notFound}`)
  
  const withPostal = await prisma.city.count({
    where: { postalCode: { not: null } }
  })
  const total = await prisma.city.count()
  
  console.log(`\n📈 Municipios con código postal: ${withPostal}/${total}`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
