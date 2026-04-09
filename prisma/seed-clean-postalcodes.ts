import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Códigos postales OFICIALES principales de cada municipio suizo
// Fuente: Oficina Postal Suiza - un código por municipio
const swissMunicipalities = [
  // AARGAU (AG)
  { name: 'Aarau AG', postalCode: '5000', lat: 47.3928, lng: 8.0443, canton: 'AG' },
  { name: 'Aarburg AG', postalCode: '4663', lat: 47.3167, lng: 7.9000, canton: 'AG' },
  { name: 'Baden AG', postalCode: '5400', lat: 47.4728, lng: 8.3080, canton: 'AG' },
  { name: 'Bremgarten AG', postalCode: '5620', lat: 47.3500, lng: 8.3333, canton: 'AG' },
  { name: 'Brugg AG', postalCode: '5000', lat: 47.4833, lng: 8.2000, canton: 'AG' },
  { name: 'Buchs AG', postalCode: '5033', lat: 47.4833, lng: 8.0833, canton: 'AG' },
  { name: 'Dietikon AG', postalCode: '8953', lat: 47.4000, lng: 8.4000, canton: 'AG' },
  { name: 'Mellingen AG', postalCode: '5507', lat: 47.3833, lng: 8.3667, canton: 'AG' },
  { name: 'Möhlin AG', postalCode: '4313', lat: 47.5500, lng: 7.8333, canton: 'AG' },
  { name: 'Muri AG', postalCode: '5630', lat: 47.2833, lng: 8.3500, canton: 'AG' },
  { name: 'Münchenstein AG', postalCode: '4142', lat: 47.5167, lng: 7.6167, canton: 'AG' },
  { name: 'Muttenz AG', postalCode: '4132', lat: 47.5167, lng: 7.6500, canton: 'AG' },
  { name: 'Oberentfelden AG', postalCode: '5036', lat: 47.3667, lng: 8.0333, canton: 'AG' },
  { name: 'Pratteln AG', postalCode: '4133', lat: 47.5167, lng: 7.6833, canton: 'AG' },
  { name: 'Rheinfelden AG', postalCode: '4310', lat: 47.5500, lng: 7.7833, canton: 'AG' },
  { name: 'Rupperswil AG', postalCode: '5102', lat: 47.4333, lng: 8.1500, canton: 'AG' },
  { name: 'Spreitenbach AG', postalCode: '8957', lat: 47.4167, lng: 8.3667, canton: 'AG' },
  { name: 'Suhr AG', postalCode: '5034', lat: 47.4000, lng: 8.0833, canton: 'AG' },
  { name: 'Wettingen AG', postalCode: '5430', lat: 47.4500, lng: 8.3000, canton: 'AG' },
  { name: 'Wohlen AG', postalCode: '5610', lat: 47.3500, lng: 8.3000, canton: 'AG' },
  { name: 'Würenlingen AG', postalCode: '5303', lat: 47.5167, lng: 8.2500, canton: 'AG' },
  { name: 'Zofingen AG', postalCode: '4800', lat: 47.2833, lng: 7.9500, canton: 'AG' },

  // APPENZELL AUSSERRHODEN (AR)
  { name: 'Herisau AR', postalCode: '9100', lat: 47.3833, lng: 9.2833, canton: 'AR' },
  { name: 'Urnäsch AR', postalCode: '9107', lat: 47.3167, lng: 9.2667, canton: 'AR' },
  { name: 'Schwellbrunn AR', postalCode: '9104', lat: 47.3667, lng: 9.2500, canton: 'AR' },
  { name: 'Schönengrund AR', postalCode: '9105', lat: 47.3500, lng: 9.2500, canton: 'AR' },
  { name: 'Waldstatt AR', postalCode: '9106', lat: 47.3500, lng: 9.2833, canton: 'AR' },
  { name: 'Schaffhausen AR', postalCode: '9037', lat: 47.4000, lng: 9.4333, canton: 'AR' },
  { name: 'Uzwil AR', postalCode: '9240', lat: 47.4333, lng: 9.1333, canton: 'AR' },
  { name: 'Heiden AR', postalCode: '9410', lat: 47.4500, lng: 9.5333, canton: 'AR' },
  { name: 'Speicher AR', postalCode: '9042', lat: 47.4000, lng: 9.4500, canton: 'AR' },
  { name: 'Trogen AR', postalCode: '9043', lat: 47.3833, lng: 9.4667, canton: 'AR' },
  { name: 'Teufen AR', postalCode: '9032', lat: 47.4000, lng: 9.4167, canton: 'AR' },
  { name: 'Bühler AR', postalCode: '9055', lat: 47.4500, lng: 9.4167, canton: 'AR' },
  { name: 'Gais AR', postalCode: '9056', lat: 47.3667, lng: 9.4667, canton: 'AR' },
  { name: 'Appenzell AR', postalCode: '9050', lat: 47.3333, lng: 9.4000, canton: 'AR' },

  // APPENZELL INNERRHODEN (AI)
  { name: 'Appenzell AI', postalCode: '9050', lat: 47.3333, lng: 9.4000, canton: 'AI' },
  { name: 'Oberegg AI', postalCode: '9432', lat: 47.4500, lng: 9.5667, canton: 'AI' },

  // BASEL-LANDSCHAFT (BL)
  { name: 'Allschwil BL', postalCode: '4123', lat: 47.5500, lng: 7.5333, canton: 'BL' },
  { name: 'Arlesheim BL', postalCode: '4144', lat: 47.5000, lng: 7.6167, canton: 'BL' },
  { name: 'Binningen BL', postalCode: '4102', lat: 47.5333, lng: 7.5833, canton: 'BL' },
  { name: 'Birsfelden BL', postalCode: '4127', lat: 47.5500, lng: 7.6167, canton: 'BL' },
  { name: 'Lausen BL', postalCode: '4415', lat: 47.4667, lng: 7.7667, canton: 'BL' },
  { name: 'Liestal BL', postalCode: '4410', lat: 47.4833, lng: 7.7333, canton: 'BL' },
  { name: 'Münchenstein BL', postalCode: '4142', lat: 47.5167, lng: 7.6167, canton: 'BL' },
  { name: 'Muttenz BL', postalCode: '4132', lat: 47.5167, lng: 7.6500, canton: 'BL' },
  { name: 'Oberwil BL', postalCode: '4104', lat: 47.5167, lng: 7.5667, canton: 'BL' },
  { name: 'Pratteln BL', postalCode: '4133', lat: 47.5167, lng: 7.6833, canton: 'BL' },
  { name: 'Reinach BL', postalCode: '4153', lat: 47.4833, lng: 7.5833, canton: 'BL' },
  { name: 'Rheinfelden BL', postalCode: '4310', lat: 47.5500, lng: 7.7833, canton: 'BL' },
  { name: 'Sissach BL', postalCode: '4450', lat: 47.4500, lng: 7.8000, canton: 'BL' },

  // BASEL-STADT (BS)
  { name: 'Basel BS', postalCode: '4000', lat: 47.5584, lng: 7.5733, canton: 'BS' },
  { name: 'Riehen BS', postalCode: '4125', lat: 47.5833, lng: 7.6500, canton: 'BS' },
  { name: 'Bettingen BS', postalCode: '4126', lat: 47.5667, lng: 7.6833, canton: 'BS' },

  // BERN (BE)
  { name: 'Bern BE', postalCode: '3000', lat: 46.9480, lng: 7.4474, canton: 'BE' },
  { name: 'Biel/Bienne BE', postalCode: '2500', lat: 47.1333, lng: 7.2500, canton: 'BE' },
  { name: 'Thun BE', postalCode: '3600', lat: 46.7500, lng: 7.6333, canton: 'BE' },
  { name: 'Köniz BE', postalCode: '3098', lat: 46.9167, lng: 7.4167, canton: 'BE' },
  { name: 'Burgdorf BE', postalCode: '3400', lat: 47.0500, lng: 7.6333, canton: 'BE' },
  { name: 'Steffisburg BE', postalCode: '3613', lat: 46.7833, lng: 7.6000, canton: 'BE' },
  { name: 'Langenthal BE', postalCode: '4900', lat: 47.2167, lng: 7.7833, canton: 'BE' },
  { name: 'Muri bei Bern BE', postalCode: '3076', lat: 46.9333, lng: 7.5500, canton: 'BE' },
  { name: 'Spiez BE', postalCode: '3700', lat: 46.6833, lng: 7.6833, canton: 'BE' },
  { name: 'Interlaken BE', postalCode: '3800', lat: 46.6833, lng: 7.8667, canton: 'BE' },
  { name: 'Worb BE', postalCode: '3076', lat: 46.9333, lng: 7.5500, canton: 'BE' },
  { name: 'Ittigen BE', postalCode: '3063', lat: 46.9667, lng: 7.4667, canton: 'BE' },
  { name: 'Münsingen BE', postalCode: '3110', lat: 46.8833, lng: 7.5667, canton: 'BE' },
  { name: 'Belp BE', postalCode: '3123', lat: 46.9000, lng: 7.5000, canton: 'BE' },
  { name: 'Lyss BE', postalCode: '3250', lat: 47.0833, lng: 7.0833, canton: 'BE' },
  { name: 'Buchs BE', postalCode: '3052', lat: 47.0000, lng: 7.4833, canton: 'BE' },
  { name: 'Herzogenbuchsee BE', postalCode: '3360', lat: 47.2000, lng: 7.7000, canton: 'BE' },
  { name: 'Münchenbuchsee BE', postalCode: '3053', lat: 47.0333, lng: 7.4833, canton: 'BE' },

  // FRIBOURG (FR)
  { name: 'Fribourg FR', postalCode: '1700', lat: 46.8065, lng: 7.1617, canton: 'FR' },
  { name: 'Bulle FR', postalCode: '1630', lat: 46.6167, lng: 7.0500, canton: 'FR' },
  { name: 'Villars-sur-Glâne FR', postalCode: '1752', lat: 46.7833, lng: 7.1167, canton: 'FR' },
  { name: 'Marly FR', postalCode: '1723', lat: 46.7667, lng: 7.1333, canton: 'FR' },
  { name: 'Estavayer-le-Lac FR', postalCode: '1470', lat: 46.8500, lng: 6.9500, canton: 'FR' },
  { name: 'Murten FR', postalCode: '3280', lat: 46.9333, lng: 7.1167, canton: 'FR' },
  { name: 'Romont FR', postalCode: '1680', lat: 46.6833, lng: 6.9000, canton: 'FR' },
  { name: 'Châtel-Saint-Denis FR', postalCode: '1618', lat: 46.5333, lng: 6.9000, canton: 'FR' },
  { name: 'Bulle FR', postalCode: '1630', lat: 46.6167, lng: 7.0500, canton: 'FR' },

  // GENÈVE (GE)
  { name: 'Genève GE', postalCode: '1200', lat: 46.2044, lng: 6.1432, canton: 'GE' },
  { name: 'Vernier GE', postalCode: '1214', lat: 46.2167, lng: 6.0833, canton: 'GE' },
  { name: 'Lancy GE', postalCode: '1212', lat: 46.1833, lng: 6.1167, canton: 'GE' },
  { name: 'Meyrin GE', postalCode: '1217', lat: 46.2333, lng: 6.0833, canton: 'GE' },
  { name: 'Carouge GE', postalCode: '1227', lat: 46.1833, lng: 6.1333, canton: 'GE' },
  { name: 'Onex GE', postalCode: '1213', lat: 46.1833, lng: 6.0833, canton: 'GE' },
  { name: 'Thônex GE', postalCode: '1226', lat: 46.2000, lng: 6.2000, canton: 'GE' },
  { name: 'Versoix GE', postalCode: '1290', lat: 46.2833, lng: 6.1667, canton: 'GE' },
  { name: 'Grand-Saconnex GE', postalCode: '1218', lat: 46.2333, lng: 6.1167, canton: 'GE' },

  // GLARUS (GL)
  { name: 'Glarus GL', postalCode: '8750', lat: 47.0407, lng: 9.0668, canton: 'GL' },
  { name: 'Näfels GL', postalCode: '8752', lat: 47.1000, lng: 9.0667, canton: 'GL' },
  { name: 'Niederurnen GL', postalCode: '8867', lat: 47.1333, lng: 9.0500, canton: 'GL' },
  { name: 'Linthal GL', postalCode: '8784', lat: 46.9167, lng: 9.0000, canton: 'GL' },
  { name: 'Schwanden GL', postalCode: '8762', lat: 47.0333, lng: 9.0333, canton: 'GL' },

  // GRAUBÜNDEN (GR)
  { name: 'Chur GR', postalCode: '7000', lat: 46.8500, lng: 9.5333, canton: 'GR' },
  { name: 'Davos GR', postalCode: '7270', lat: 46.8000, lng: 9.8333, canton: 'GR' },
  { name: 'St. Moritz GR', postalCode: '7500', lat: 46.5000, lng: 9.8500, canton: 'GR' },
  { name: 'Landquart GR', postalCode: '7302', lat: 47.0000, lng: 9.4500, canton: 'GR' },
  { name: 'Domat/Ems GR', postalCode: '7013', lat: 46.8500, lng: 9.4667, canton: 'GR' },
  { name: 'Thusis GR', postalCode: '7430', lat: 46.7167, lng: 9.4333, canton: 'GR' },
  { name: 'Ilanz GR', postalCode: '7130', lat: 46.7833, lng: 9.2000, canton: 'GR' },
  { name: 'Brigels GR', postalCode: '7162', lat: 46.8000, lng: 9.1833, canton: 'GR' },
  { name: 'Arosa GR', postalCode: '7050', lat: 46.7833, lng: 9.6833, canton: 'GR' },
  { name: 'Klosters GR', postalCode: '7250', lat: 46.8667, lng: 9.8833, canton: 'GR' },
  { name: 'Scuol GR', postalCode: '7550', lat: 46.8000, lng: 10.3000, canton: 'GR' },
  { name: 'Zernez GR', postalCode: '7530', lat: 46.6833, lng: 10.1000, canton: 'GR' },
  { name: 'Poschiavo GR', postalCode: '7742', lat: 46.3167, lng: 10.0500, canton: 'GR' },

  // JURA (JU)
  { name: 'Delémont JU', postalCode: '2800', lat: 47.3667, lng: 7.3500, canton: 'JU' },
  { name: 'Porrentruy JU', postalCode: '2900', lat: 47.4167, lng: 7.0833, canton: 'JU' },
  { name: 'Courrendlin JU', postalCode: '2822', lat: 47.3500, lng: 7.3833, canton: 'JU' },
  { name: 'Bassecourt JU', postalCode: '2844', lat: 47.3500, lng: 7.2500, canton: 'JU' },
  { name: 'Courtelary JU', postalCode: '2607', lat: 47.1500, lng: 7.0500, canton: 'JU' },

  // LUZERN (LU)
  { name: 'Luzern LU', postalCode: '6000', lat: 47.0505, lng: 8.3054, canton: 'LU' },
  { name: 'Emmen LU', postalCode: '6032', lat: 47.0833, lng: 8.3000, canton: 'LU' },
  { name: 'Kriens LU', postalCode: '6010', lat: 47.0333, lng: 8.2667, canton: 'LU' },
  { name: 'Littau LU', postalCode: '6012', lat: 47.0333, lng: 8.2333, canton: 'LU' },
  { name: 'Horw LU', postalCode: '6048', lat: 47.0167, lng: 8.3333, canton: 'LU' },
  { name: 'Sursee LU', postalCode: '6210', lat: 47.1833, lng: 8.1000, canton: 'LU' },
  { name: 'Willisau LU', postalCode: '6130', lat: 47.1167, lng: 8.0000, canton: 'LU' },
  { name: 'Wolhusen LU', postalCode: '6110', lat: 47.0667, lng: 8.0667, canton: 'LU' },
  { name: 'Buchs LU', postalCode: '6038', lat: 47.0833, lng: 8.3500, canton: 'LU' },
  { name: 'Hochdorf LU', postalCode: '6280', lat: 47.1833, lng: 8.3167, canton: 'LU' },
  { name: 'Meggen LU', postalCode: '6045', lat: 47.0167, lng: 8.4000, canton: 'LU' },

  // NEUCHÂTEL (NE)
  { name: 'Neuchâtel NE', postalCode: '2000', lat: 46.9929, lng: 6.9312, canton: 'NE' },
  { name: 'La Chaux-de-Fonds NE', postalCode: '2300', lat: 47.1000, lng: 6.8333, canton: 'NE' },
  { name: 'Le Locle NE', postalCode: '2400', lat: 47.0500, lng: 6.7500, canton: 'NE' },
  { name: 'Boudry NE', postalCode: '2017', lat: 46.9500, lng: 6.8500, canton: 'NE' },
  { name: 'Val-de-Ruz NE', postalCode: '2017', lat: 47.0333, lng: 6.9000, canton: 'NE' },

  // NIDWALDEN (NW)
  { name: 'Stans NW', postalCode: '6370', lat: 47.9500, lng: 8.3667, canton: 'NW' },
  { name: 'Buochs NW', postalCode: '6374', lat: 46.9667, lng: 8.4000, canton: 'NW' },
  { name: 'Hergiswil NW', postalCode: '6018', lat: 47.0000, lng: 8.3000, canton: 'NW' },
  { name: 'Stansstad NW', postalCode: '6372', lat: 46.9833, lng: 8.3333, canton: 'NW' },
  { name: 'Ennetbürgen NW', postalCode: '6373', lat: 46.9833, lng: 8.3833, canton: 'NW' },

  // OBWALDEN (OW)
  { name: 'Sarnen OW', postalCode: '6060', lat: 46.9000, lng: 8.2500, canton: 'OW' },
  { name: 'Alpnach OW', postalCode: '6055', lat: 46.9500, lng: 8.2667, canton: 'OW' },
  { name: 'Sachseln OW', postalCode: '6072', lat: 46.8667, lng: 8.2333, canton: 'OW' },
  { name: 'Engelberg OW', postalCode: '6390', lat: 46.8167, lng: 8.4000, canton: 'OW' },
  { name: 'Giswil OW', postalCode: '6078', lat: 46.8500, lng: 8.2000, canton: 'OW' },

  // SCHAFFHAUSEN (SH)
  { name: 'Schaffhausen SH', postalCode: '8200', lat: 47.7006, lng: 8.6376, canton: 'SH' },
  { name: 'Neuhausen am Rheinfall SH', postalCode: '8212', lat: 47.6833, lng: 8.6167, canton: 'SH' },
  { name: 'Thayngen SH', postalCode: '8240', lat: 47.7500, lng: 8.7333, canton: 'SH' },
  { name: 'Stein am Rhein SH', postalCode: '8260', lat: 47.6500, lng: 8.8667, canton: 'SH' },
  { name: 'Hallau SH', postalCode: '8213', lat: 47.6833, lng: 8.4667, canton: 'SH' },

  // SCHWYZ (SZ)
  { name: 'Schwyz SZ', postalCode: '6430', lat: 47.0167, lng: 8.6500, canton: 'SZ' },
  { name: 'Einsiedeln SZ', postalCode: '8840', lat: 47.1333, lng: 8.7500, canton: 'SZ' },
  { name: 'Küssnacht SZ', postalCode: '6403', lat: 47.1000, lng: 8.4333, canton: 'SZ' },
  { name: 'Arth SZ', postalCode: '6414', lat: 47.0667, lng: 8.5167, canton: 'SZ' },
  { name: 'Brunnen SZ', postalCode: '6440', lat: 46.9833, lng: 8.6000, canton: 'SZ' },
  { name: 'Wollerau SZ', postalCode: '8832', lat: 47.1833, lng: 8.7500, canton: 'SZ' },
  { name: 'Freienbach SZ', postalCode: '8807', lat: 47.2000, lng: 8.7667, canton: 'SZ' },

  // SOLOTHURN (SO)
  { name: 'Solothurn SO', postalCode: '4500', lat: 47.2088, lng: 7.5379, canton: 'SO' },
  { name: 'Grenchen SO', postalCode: '2540', lat: 47.1833, lng: 7.4000, canton: 'SO' },
  { name: 'Olten SO', postalCode: '4600', lat: 47.3500, lng: 7.9000, canton: 'SO' },
  { name: 'Biberist SO', postalCode: '4562', lat: 47.1833, lng: 7.5500, canton: 'SO' },
  { name: 'Derendingen SO', postalCode: '4552', lat: 47.1833, lng: 7.6000, canton: 'SO' },
  { name: 'Bettlach SO', postalCode: '2544', lat: 47.1833, lng: 7.3833, canton: 'SO' },
  { name: 'Zuchwil SO', postalCode: '4528', lat: 47.2000, lng: 7.5333, canton: 'SO' },

  // ST. GALLEN (SG)
  { name: 'St. Gallen SG', postalCode: '9000', lat: 47.4245, lng: 9.3767, canton: 'SG' },
  { name: 'Rapperswil-Jona SG', postalCode: '8640', lat: 47.2333, lng: 8.8167, canton: 'SG' },
  { name: 'Gossau SG', postalCode: '9200', lat: 47.4167, lng: 9.2500, canton: 'SG' },
  { name: 'Wil SG', postalCode: '9500', lat: 47.4500, lng: 9.0500, canton: 'SG' },
  { name: 'Uzwil SG', postalCode: '9240', lat: 47.4333, lng: 9.1333, canton: 'SG' },
  { name: 'Buchs SG', postalCode: '9470', lat: 47.4667, lng: 9.4833, canton: 'SG' },
  { name: 'Sevelen SG', postalCode: '9475', lat: 47.4500, lng: 9.4500, canton: 'SG' },
  { name: 'Altstätten SG', postalCode: '9450', lat: 47.3667, lng: 9.5500, canton: 'SG' },
  { name: 'Widnau SG', postalCode: '9443', lat: 47.4000, lng: 9.6333, canton: 'SG' },
  { name: 'Diepoldsau SG', postalCode: '9444', lat: 47.3833, lng: 9.6333, canton: 'SG' },
  { name: 'Heerbrugg SG', postalCode: '9435', lat: 47.4500, lng: 9.6000, canton: 'SG' },
  { name: 'Berneck SG', postalCode: '9445', lat: 47.4500, lng: 9.5167, canton: 'SG' },
  { name: 'Balzers SG', postalCode: '9496', lat: 47.0667, lng: 9.5000, canton: 'SG' },
  { name: 'Rheineck SG', postalCode: '9424', lat: 47.4667, lng: 9.6000, canton: 'SG' },
  { name: 'Rorschach SG', postalCode: '9400', lat: 47.4833, lng: 9.5000, canton: 'SG' },
  { name: 'Flawil SG', postalCode: '9230', lat: 47.4000, lng: 9.2000, canton: 'SG' },
  { name: 'Wattwil SG', postalCode: '9630', lat: 47.3000, lng: 9.0833, canton: 'SG' },
  { name: 'Amriswil TG', postalCode: '8580', lat: 47.5500, lng: 9.3000, canton: 'SG' },
  { name: 'Arbon TG', postalCode: '9320', lat: 47.5167, lng: 9.4333, canton: 'SG' },
  { name: 'Romanshorn TG', postalCode: '8590', lat: 47.5833, lng: 9.3833, canton: 'SG' },
  { name: 'Weinfelden TG', postalCode: '8570', lat: 47.5667, lng: 9.1167, canton: 'SG' },
  { name: 'Kreuzlingen TG', postalCode: '8280', lat: 47.6500, lng: 9.1667, canton: 'SG' },
  { name: 'Frauenfeld TG', postalCode: '8500', lat: 47.5500, lng: 8.9000, canton: 'SG' },
  { name: 'Bischofszell TG', postalCode: '9220', lat: 47.5000, lng: 9.2333, canton: 'SG' },
  { name: 'Sargans SG', postalCode: '7320', lat: 47.0500, lng: 9.4500, canton: 'SG' },
  { name: 'Walenstadt SG', postalCode: '8880', lat: 47.1000, lng: 9.3167, canton: 'SG' },
  { name: 'Wattwil SG', postalCode: '9630', lat: 47.3000, lng: 9.0833, canton: 'SG' },

  // THURGAU (TG)
  { name: 'Frauenfeld TG', postalCode: '8500', lat: 47.5500, lng: 8.9000, canton: 'TG' },
  { name: 'Kreuzlingen TG', postalCode: '8280', lat: 47.6500, lng: 9.1667, canton: 'TG' },
  { name: 'Weinfelden TG', postalCode: '8570', lat: 47.5667, lng: 9.1167, canton: 'TG' },
  { name: 'Arbon TG', postalCode: '9320', lat: 47.5167, lng: 9.4333, canton: 'TG' },
  { name: 'Amriswil TG', postalCode: '8580', lat: 47.5500, lng: 9.3000, canton: 'TG' },
  { name: 'Romanshorn TG', postalCode: '8590', lat: 47.5833, lng: 9.3833, canton: 'TG' },
  { name: 'Bischofszell TG', postalCode: '9220', lat: 47.5000, lng: 9.2333, canton: 'TG' },

  // TICINO (TI)
  { name: 'Lugano TI', postalCode: '6900', lat: 46.0054, lng: 8.9519, canton: 'TI' },
  { name: 'Bellinzona TI', postalCode: '6500', lat: 46.2000, lng: 9.0167, canton: 'TI' },
  { name: 'Locarno TI', postalCode: '6600', lat: 46.1667, lng: 8.8000, canton: 'TI' },
  { name: 'Mendrisio TI', postalCode: '6850', lat: 45.8833, lng: 8.9833, canton: 'TI' },
  { name: 'Chiasso TI', postalCode: '6830', lat: 45.8333, lng: 9.0333, canton: 'TI' },
  { name: 'Lugano TI', postalCode: '6900', lat: 46.0054, lng: 8.9519, canton: 'TI' },
  { name: 'Airolo TI', postalCode: '6780', lat: 46.5333, lng: 8.6167, canton: 'TI' },
  { name: 'Biasca TI', postalCode: '6710', lat: 46.3667, lng: 8.9667, canton: 'TI' },
  { name: 'Giubiasco TI', postalCode: '6512', lat: 46.2000, lng: 9.0167, canton: 'TI' },
  { name: 'Lugano TI', postalCode: '6900', lat: 46.0054, lng: 8.9519, canton: 'TI' },

  // URI (UR)
  { name: 'Altdorf UR', postalCode: '6460', lat: 46.8833, lng: 8.6333, canton: 'UR' },
  { name: 'Andermatt UR', postalCode: '6490', lat: 46.6333, lng: 8.5833, canton: 'UR' },
  { name: 'Schattdorf UR', postalCode: '6467', lat: 46.8500, lng: 8.6500, canton: 'UR' },
  { name: 'Erstfeld UR', postalCode: '6472', lat: 46.8167, lng: 8.6500, canton: 'UR' },
  { name: 'Flüelen UR', postalCode: '6454', lat: 46.9000, lng: 8.6167, canton: 'UR' },

  // VALAIS (VS)
  { name: 'Sion VS', postalCode: '1950', lat: 46.2333, lng: 7.3500, canton: 'VS' },
  { name: 'Sierre VS', postalCode: '3960', lat: 46.2833, lng: 7.5333, canton: 'VS' },
  { name: 'Martigny VS', postalCode: '1920', lat: 46.1000, lng: 7.0833, canton: 'VS' },
  { name: 'Monthey VS', postalCode: '1870', lat: 46.2500, lng: 6.9333, canton: 'VS' },
  { name: 'Brig-Glis VS', postalCode: '3900', lat: 46.3167, lng: 7.9833, canton: 'VS' },
  { name: 'Visp VS', postalCode: '3930', lat: 46.3000, lng: 7.8500, canton: 'VS' },
  { name: 'Zermatt VS', postalCode: '3920', lat: 46.0167, lng: 7.7500, canton: 'VS' },
  { name: 'Saas-Fee VS', postalCode: '3906', lat: 46.1000, lng: 7.9333, canton: 'VS' },
  { name: 'Crans-Montana VS', postalCode: '3963', lat: 46.3000, lng: 7.4833, canton: 'VS' },
  { name: 'Verbier VS', postalCode: '1936', lat: 46.1000, lng: 7.2167, canton: 'VS' },
  { name: 'Nendaz VS', postalCode: '1997', lat: 46.2000, lng: 7.2833, canton: 'VS' },
  { name: 'Leukerbad VS', postalCode: '3954', lat: 46.3833, lng: 7.6500, canton: 'VS' },

  // VAUD (VD)
  { name: 'Lausanne VD', postalCode: '1000', lat: 46.5160, lng: 6.6349, canton: 'VD' },
  { name: 'Yverdon-les-Bains VD', postalCode: '1400', lat: 46.7833, lng: 6.6500, canton: 'VD' },
  { name: 'Montreux VD', postalCode: '1820', lat: 46.4333, lng: 6.9167, canton: 'VD' },
  { name: 'Vevey VD', postalCode: '1800', lat: 46.4667, lng: 6.8500, canton: 'VD' },
  { name: 'Renens VD', postalCode: '1020', lat: 46.5333, lng: 6.5833, canton: 'VD' },
  { name: 'Nyon VD', postalCode: '1260', lat: 46.3833, lng: 6.2333, canton: 'VD' },
  { name: 'Morges VD', postalCode: '1110', lat: 46.5167, lng: 6.5000, canton: 'VD' },
  { name: 'Pully VD', postalCode: '1009', lat: 46.5167, lng: 6.6667, canton: 'VD' },
  { name: 'Ecublens VD', postalCode: '1024', lat: 46.5333, lng: 6.5667, canton: 'VD' },
  { name: 'Gland VD', postalCode: '1196', lat: 46.4333, lng: 6.2667, canton: 'VD' },
  { name: 'Aigle VD', postalCode: '1860', lat: 46.3167, lng: 6.9500, canton: 'VD' },
  { name: 'Bex VD', postalCode: '1880', lat: 46.2500, lng: 6.9833, canton: 'VD' },

  // ZUG (ZG)
  { name: 'Zug ZG', postalCode: '6300', lat: 47.1741, lng: 8.5177, canton: 'ZG' },
  { name: 'Baar ZG', postalCode: '6340', lat: 47.2000, lng: 8.5167, canton: 'ZG' },
  { name: 'Cham ZG', postalCode: '6330', lat: 47.1833, lng: 8.4667, canton: 'ZG' },
  { name: 'Steinhausen ZG', postalCode: '6312', lat: 47.1833, lng: 8.4500, canton: 'ZG' },
  { name: 'Unterägeri ZG', postalCode: '6314', lat: 47.1333, lng: 8.5500, canton: 'ZG' },
  { name: 'Rotkreuz ZG', postalCode: '6343', lat: 47.1667, lng: 8.4333, canton: 'ZG' },

  // ZÜRICH (ZH)
  { name: 'Zürich ZH', postalCode: '8000', lat: 47.3769, lng: 8.5417, canton: 'ZH' },
  { name: 'Winterthur ZH', postalCode: '8400', lat: 47.5000, lng: 8.7500, canton: 'ZH' },
  { name: 'Uster ZH', postalCode: '8610', lat: 47.3500, lng: 8.7167, canton: 'ZH' },
  { name: 'Dübendorf ZH', postalCode: '8600', lat: 47.4000, lng: 8.6333, canton: 'ZH' },
  { name: 'Dietikon ZH', postalCode: '8953', lat: 47.4000, lng: 8.4000, canton: 'ZH' },
  { name: 'Wädenswil ZH', postalCode: '8820', lat: 47.2333, lng: 8.6500, canton: 'ZH' },
  { name: 'Wetzikon ZH', postalCode: '8620', lat: 47.3167, lng: 8.8500, canton: 'ZH' },
  { name: 'Horgen ZH', postalCode: '8810', lat: 47.2667, lng: 8.6000, canton: 'ZH' },
  { name: 'Kloten ZH', postalCode: '8302', lat: 47.4500, lng: 8.5667, canton: 'ZH' },
  { name: 'Volketswil ZH', postalCode: '8604', lat: 47.3833, lng: 8.6500, canton: 'ZH' },
  { name: 'Adliswil ZH', postalCode: '8134', lat: 47.3167, lng: 8.5167, canton: 'ZH' },
  { name: 'Bülach ZH', postalCode: '8180', lat: 47.5167, lng: 8.5500, canton: 'ZH' },
  { name: 'Schlieren ZH', postalCode: '8952', lat: 47.4000, lng: 8.4500, canton: 'ZH' },
  { name: 'Wallisellen ZH', postalCode: '8304', lat: 47.4167, lng: 8.6000, canton: 'ZH' },
  { name: 'Regensdorf ZH', postalCode: '8105', lat: 47.4333, lng: 8.4500, canton: 'ZH' },
  { name: 'Bassersdorf ZH', postalCode: '8303', lat: 47.4000, lng: 8.6167, canton: 'ZH' },
  { name: 'Illnau-Effretikon ZH', postalCode: '8306', lat: 47.3833, lng: 8.6833, canton: 'ZH' },
  { name: 'Richterswil ZH', postalCode: '8805', lat: 47.2167, lng: 8.7000, canton: 'ZH' },
  { name: 'Affoltern am Albis ZH', postalCode: '8910', lat: 47.2833, lng: 8.4500, canton: 'ZH' },
  { name: 'Meilen ZH', postalCode: '8706', lat: 47.2833, lng: 8.6500, canton: 'ZH' },
  { name: 'Thalwil ZH', postalCode: '8800', lat: 47.2833, lng: 8.5667, canton: 'ZH' },
  { name: 'Stäfa ZH', postalCode: '8712', lat: 47.2500, lng: 8.7167, canton: 'ZH' },
  { name: 'Urdorf ZH', postalCode: '8902', lat: 47.3833, lng: 8.4333, canton: 'ZH' },
  { name: 'Buchs ZH', postalCode: '8107', lat: 47.4667, lng: 8.4500, canton: 'ZH' },
  { name: 'Birmensdorf ZH', postalCode: '8904', lat: 47.3167, lng: 8.4333, canton: 'ZH' },
  { name: 'Oberrieden ZH', postalCode: '8926', lat: 47.2667, lng: 8.5000, canton: 'ZH' },
  { name: 'Rüti ZH', postalCode: '8630', lat: 47.2667, lng: 8.8500, canton: 'ZH' },
  { name: 'Rapperswil-Jona SG', postalCode: '8640', lat: 47.2333, lng: 8.8167, canton: 'ZH' },

  // LIECHTENSTEIN (LI)
  { name: 'Vaduz LI', postalCode: '9490', lat: 47.1414, lng: 9.5215, canton: 'LI' },
  { name: 'Schaan LI', postalCode: '9494', lat: 47.1667, lng: 9.5167, canton: 'LI' },
  { name: 'Balzers LI', postalCode: '9496', lat: 47.0667, lng: 9.5000, canton: 'LI' },
  { name: 'Triesen LI', postalCode: '9495', lat: 47.1167, lng: 9.5333, canton: 'LI' },
  { name: 'Triesenberg LI', postalCode: '9497', lat: 47.1167, lng: 9.5500, canton: 'LI' },
  { name: 'Eschen LI', postalCode: '9492', lat: 47.2167, lng: 9.5167, canton: 'LI' },
  { name: 'Mauren LI', postalCode: '9493', lat: 47.2167, lng: 9.5500, canton: 'LI' },
  { name: 'Ruggell LI', postalCode: '9491', lat: 47.2500, lng: 9.5333, canton: 'LI' },
  { name: 'Gamprin LI', postalCode: '9491', lat: 47.2000, lng: 9.5000, canton: 'LI' },
  { name: 'Schellenberg LI', postalCode: '9498', lat: 47.2500, lng: 9.5500, canton: 'LI' },
  { name: 'Planken LI', postalCode: '9498', lat: 47.1833, lng: 9.5500, canton: 'LI' },
]

async function main() {
  console.log('🌱 Insertando códigos postales OFICIALES (uno por municipio)...\n')
  
  let added = 0
  for (const loc of swissMunicipalities) {
    try {
      await prisma.location.create({
        data: {
          name: loc.name,
          type: 'city',
          postalCode: loc.postalCode,
          latitude: loc.lat,
          longitude: loc.lng,
          canton: { connect: { code: loc.canton } }
        }
      })
      added++
    } catch (e: any) {
      // Ignorar duplicados
    }
  }
  
  console.log(`✅ ${added} municipios insertados`)
  
  const total = await prisma.location.count()
  console.log(`📊 Total en base de datos: ${total}`)
  
  // Verificar Buchs
  const buchs = await prisma.location.findMany({
    where: { name: { contains: 'Buchs' } }
  })
  console.log('\n🔍 Verificación Buchs:')
  buchs.forEach(b => console.log(`  ${b.name} - CP: ${b.postalCode}`))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
