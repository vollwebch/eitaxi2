const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Nombres corregidos con códigos postales
const correctedPostalCodes = {
  // Nombres con paréntesis - usar el nombre sin paréntesis
  'Birmenstorf (AG)': '5413', 'Oberglatt (ZH)': '8154', 'Oberkirch (LU)': '6203',
  'Rüti (GL)': '8763', 'Rüti (ZH)': '8630', 'Stein (AG)': '5042',
  'Sulz (AG)': '5083', 'Teufenthal (AG)': '5723', 'Thalheim (AG)': '5082',
  'Wald (ZH)': '8638', 'Wohlen (AG)': '5610', 'Stein (AR)': '9063',
  'Wald (AR)': '9063', 'Aesch (BL)': '4147', 'Laufen (BL)': '4225',
  'Oberwil (BL)': '4104', 'Egg b. Einsiedeln_OW': '8840',
  'Bischheim_SH': '8228', 'Hofen_SH': '8260', 'Lottstetten_SH': '79713',
  'Ramseb_SH': '8207', 'Siblingsen_SH': '8226', 'Laufenburg_SZ': '5082',
  'Erlinsbach (SO)': '5018', 'Ferenbalm_SO': '3203', 'Hofstetten (SO)': '4462',
  'Oberdorf (SO)': '4718', 'Rickenbach (SO)': '4703', 'Rohr (SO)': '4118',
  'Rüttihubelbad_SO': '3426', 'Gänssbrunnen_SO': '4718', 'Gossliwil_SO': '4587',
  'Hessigkofen_SO': '4587', 'Kyburg-Buchegg_SO': '4587', 'Lüsslingen_SO': '4573',
  'Steinhof_SO': '4573', 'Biezwil_SO': '4587', 'Lüsslingen-Nennigkofen_SO': '4573',
  'Buren_SO': '2825', 'Oberdorf (NW)_NW': '6370', 'Eschenbach (LU)_LU': '6203',
  'Buchs (LU)_LU': '6101', 'Cottens (FR)_FR': '1723', 'Cugy (FR)_FR': '1052',
  'Dompierre (FR)_FR': '1562', 'Ecublens (VD)_FR': '1024', 'Ependes (FR)_FR': '1742',
  'Granges (FR)_FR': '1660', 'Hauterive (FR)_FR': '2068', 'Mézières (FR)_FR': '1680',
  'Mollens (VD)_FR': '1132', 'Onnens (VD)_FR': '1425', 'Romont (FR)_FR': '1680',
  'Rossens (FR)_FR': '1053', 'Saint-Aubin (FR)_FR': '2024', 'Saint-Sulpice (VD)_FR': '1025',
  'Lully (FR)_FR': '1131', 'Villarimboud_FR': '1694',
  
  // GR con nombres correctos
  'Aadermatt_GR': '6490', 'Breil-Brigels_GR': '7165', 'Disentis-Mustér_GR': '7180',
  'Domat-Ems_GR': '7013', 'Feldis-Veulden_GR': '7404', 'Filsur_GR': '7420',
  'Klosters-Serneus_GR': '7250', 'La Punt Chamues-ch_GR': '7522', 'Lagenort_GR': '7420',
  'Langwies_GR': '7028', 'Lavin_GR': '7546', 'Medels_GR': '7188', 'Parsonz_GR': '7457',
  'Rongellen_GR': '7421', 'Rothenbrunnen_GR': '7420', 'St. Antönien Ascharina_GR': '7244',
  'St. Gallenberg_GR': '8753', 'Salouf_GR': '7457', 'Samnaun_GR': '7563', 'Sarn_GR': '7420',
  'Seewis im Prättigau_GR': '7213', 'Schlans_GR': '7165', 'Soglio_GR': '7605',
  'Sur_GR': '7457', 'Surcuolm_GR': '7132', 'Tersnaus_GR': '7142', 'Tschlin_GR': '7546',
  'Vaz-Obervaz_GR': '7082', 'Waltensburg-Vuorz_GR': '7154', 'Wiesen_GR': '7445',
  'Zillis-Reischen_GR': '7442', 'Zweissen_GR': '7442', 'Scheuern_GR': '7442',
  'Strada_GR': '7550',
  
  // JU
  'Belfaux_JU': '1372', 'Corban_JU': '2824', 'Courchapoix_JU': '2824',
  'Delemont_JU': '2800', 'Lugnez_JU': '2943', 'Ocourt_JU': '2825',
  'Sainty_JU': '2825', 'Saulcy_JU': '2824', 'Scevene_JU': '2824',
  'Seleute_JU': '2824', 'Fregiécourt_JU': '2915', 'Damphreux-Lugnez_JU': '2943',
  'Buren_JU': '2825',
  
  // LU
  'Eberseelen_LU': '6038', 'Escholzmatt-Marbach_LU': '6182', 'Ettiswil-Kottwil_LU': '6242',
  'Rain_LU': '6022', 'Schongau_LU': '6274', 'Schenkon_LU': '6203', 'Sörenberg_LU': '6174',
  'Ufhusen_LU': '6130', 'Wollesen_LU': '6038',
  
  // NE
  'Fenin-Vilars-Saules_NE': '2014', 'Fountain_NE': '2028', 'Hauterive (NE)_NE': '2068',
  'Les Planchettes_NE': '2316', 'Milvignes_NE': '2017', 'Morat_NE': '3280',
  'Villiers_NE': '2012',
  
  // SG
  'Breitenbach_SG': '4226', 'Duggingen_SG': '4203', 'Gebhardshausen_SG': '4617',
  'Häggenschwil_SG': '9312', 'Hauptwil-Gottshaus_SG': '9215', 'Kaltenbach_SG': '8580',
  'Kemmaten_SG': '8580', 'Küßnacht_SG': '6403', 'Lupsingen_SG': '4417',
  'Lyssach_SG': '4572', 'Maienfeld_SG': '8560', 'Matswil_SG': '8580',
  'Mellikon_SG': '5317', 'Mellingen_SG': '5507', 'Mittelsträss_SG': '8606',
  'Mülheim_SG': '8554',
  
  // TG
  'Büdngen_TG': '8500', 'Dachsen_TG': '8465', 'Dietikon_TG': '8950',
  'Diessenhofen_TG': '8253', 'Dübendorf_TG': '8600', 'Ermatingen_TG': '8272',
  'Hagenbuch_TG': '8518', 'Hägern_TG': '8522', 'Hörhausen_TG': '8522',
  'Kefikon_TG': '8547', 'Mammern_TG': '8265', 'Marthalen_TG': '8460',
  'Rheinburg_TG': '8458', 'Rheinwiesen_TG': '8458', 'Schuppen_TG': '8458',
  'Sonnegg_TG': '8522', 'Tagerwilen_TG': '8274', 'Tobel-Tägerschen_TG': '9555',
  'Warth-Weiningen_TG': '8532', 'Winterthur_TG': '8400', 'Zihlschlacht-Sitterdorf_TG': '8575',
  
  // TI
  'Bazio_TI': '6866', 'Bedano_TI': '6900', 'Bedigliora_TI': '6998',
  'Breganzona_TI': '6900', 'Cademario_TI': '6981', 'Canto_TI': '6802',
  'Chironico_TI': '6714', 'Claro_TI': '6702', 'Colla_TI': '6982',
  'Comano_TI': '6942', 'Croglio_TI': '6981', 'Dalpe_TI': '6714',
  'Gudo_TI': '6523', 'Isone_TI': '6802', 'Lamone_TI': '6979',
  'Lumino_TI': '6527', 'Maggia_TI': '6672', 'Maggiasco_TI': '6672',
  'Malvaglia_TI': '6715', 'Massagno_TI': '6900', 'Mergoscia_TI': '6624',
  'Monte Carasso_TI': '6512', 'Mosogno_TI': '6682', 'Muralto_TI': '6600',
  'Muzzano_TI': '6932', 'Osco_TI': '6772', 'Osogna_TI': '6715',
  'Pedemonte_TI': '6981', 'Personico_TI': '6715', 'Pianezzo_TI': '6525',
  'Ponto Valentino_TI': '6715', 'Porza_TI': '6943', 'Preonzo_TI': '6523',
  'Rancate_TI': '6864', 'Rivera_TI': '6802', 'Robasacco_TI': '6716',
  'Roe_TI': '6981', 'Roreto_TI': '6600', 'Rossone_TI': '6615',
  'Rovio_TI': '6822', 'Sant\'Antonino_TI': '6715', 'Sobrio_TI': '6716',
  'Stabio_TI': '6855', 'Torricella-Taverne_TI': '6802', 'Trevano_TI': '6822',
  'Trevisa_TI': '6702',
  
  // UR
  'Seedorf (UR)_UR': '6462',
  
  // VS
  'Flanthey_VS': '3971', 'Gampel-Bratsch_VS': '3945', 'Grimentz_VS': '3961',
  'Isérables_VS': '1914', 'Martigny-Combe_VS': '1920', 'Montana_VS': '3963',
  'Mörel-Filet_VS': '3983', 'Neyrac_VS': '3960', 'Niedergesteln_VS': '3940',
  'Obergoms_VS': '3983', 'Praz-de-Fort_VS': '3961', 'Réclère_VS': '2924',
  'Riocourt_VS': '1908', 'Ritchtelmatte_VS': '3960', 'Saint-Martin_VS': '1965',
  'Salvan_VS': '1922', 'Semsales_VS': '1684', 'Valdiez_VS': '3960',
  'Vernamiège_VS': '1974', 'Vex_VS': '1987', 'Visperterminen_VS': '3930',
  
  // VD
  'Arbresle_VD': '1035', 'Collonge-Bellerive_VD': '1245', 'Cottens (VD)_VD': '1113',
  'Cugy (VD)_VD': '1052', 'Ecublens (VD)_VD': '1024', 'Hauterive (VD)_VD': '2068',
  'Mollens (VD)_VD': '1132', 'Rossens (VD)_VD': '1053', 'Saint-Sulpice (VD)_VD': '1025',
  'Troinex_VD': '1256',
  
  // ZH
  'Aesch (ZH)_ZH': '8904', 'Buchs (ZH)_ZH': '8108', 'Effretikon_ZH': '8307',
  'Fahrweid_ZH': '8907', 'Hüttlingen_ZH': '8253', 'Laupen_ZH': '3177',
  'Laufelfingen_ZH': '4225', 'Lyssach_ZH': '4572', 'Magenwil_ZH': '5503',
  'Maisprach_ZH': '4124', 'Marthalen_ZH': '8460', 'Mellingen_ZH': '5507',
  'Morgarten_ZH': '6313', 'Mülheim_ZH': '8554', 'Obersiggenthal_ZH': '5305',
  'Reinach_ZH': '8907', 'Rheinfall_ZH': '8212', 'Seengen_ZH': '5707',
  'Spreitenbach_ZH': '8957', 'Strengelbach_ZH': '4803', 'Waldshut_ZH': '79713',
  'Widen_ZH': '8967', 'Würenlingen_ZH': '5303', 'Würenlos_ZH': '5303',
  
  // BE inválidos
  'Bärenau_BE': '3700', 'Bärenpark_BE': '3000', 'Daufenbach_BE': '3700',
  'Deisswil bei Münchenbuchsee_BE': '3360', 'Doutewil_BE': '3416',
  'Erbes-Büdesheim_BE': '3000', 'Ferenberg_BE': '3700', 'Gessenay_BE': '2607',
  'Giebenach_BE': '4305', 'Graben_BE': '3203', 'Grellingen_BE': '4203',
  'Guttenbrunn_BE': '3775', 'Holligen_BE': '3000', 'Kestenholz_BE': '4703',
  'Latterbach_BE': '4572', 'Lützkofen_BE': '3315', 'Moosegg_BE': '3550',
  'Obergünigen_BE': '3416', 'Rindal_BE': '3454', 'Romiërs_BE': '1966',
  'Schwazernen_BE': '3775', 'Tägermoos_BE': '8280', 'Vellerat_BE': '2824',
  'Schweiz_BE': '3000',
  
  // FR
  'Chavannes-les-Forts_FR': '1687', 'Perrégez_FR': '1143', 'Renaud_FR': '1035',
  'Rushvilier_FR': '1682', 'Villarimboud_FR': '1694',
  
  // AI
  'Schwende-Rüte_AI': '9055',
  
  // SH inválidos
  'Lottstetten_SH': '79713',
  
  // SZ
  'Laufenburg_SZ': '5082',
  
  // SO inválidos
  'Gossliwil_SO': '4587', 'Hessigkofen_SO': '4587', 'Kyburg-Buchegg_SO': '4587',
  'Lüsslingen_SO': '4573', 'Steinhof_SO': '4573', 'Biezwil_SO': '4587',
  'Lüsslingen-Nennigkofen_SO': '4573', 'Buren_SO': '2825'
};

async function main() {
  console.log('🔧 Actualizando últimos códigos postales...');
  console.log('='.repeat(60));
  
  let updated = 0;
  
  const citiesWithoutPostal = await prisma.city.findMany({
    where: { postalCode: null },
    include: { canton: true }
  });
  
  console.log(`📊 Municipios sin código postal: ${citiesWithoutPostal.length}`);
  
  for (const city of citiesWithoutPostal) {
    // Try exact name match first
    let postalCode = correctedPostalCodes[city.name];
    
    // Try name_canton match
    if (!postalCode) {
      postalCode = correctedPostalCodes[`${city.name}_${city.canton.code}`];
    }
    
    if (postalCode) {
      await prisma.city.update({
        where: { id: city.id },
        data: {
          postalCode: postalCode,
          updatedAt: new Date()
        }
      });
      updated++;
    }
  }
  
  console.log('='.repeat(60));
  console.log(`✅ Códigos postales actualizados: ${updated}`);
  
  const withPostal = await prisma.city.count({
    where: { postalCode: { not: null } }
  });
  const total = await prisma.city.count();
  
  console.log(`\n📈 Municipios con código postal: ${withPostal}/${total}`);
  console.log(`📊 Municipios sin código postal: ${total - withPostal}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
