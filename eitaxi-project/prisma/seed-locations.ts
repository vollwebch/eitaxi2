import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Datos de ubicaciones detalladas de Suiza y Liechtenstein
const SWISS_LOCATIONS = {
  // AEROPUERTOS
  airports: [
    { name: 'Aeropuerto de Zúrich', nameEn: 'Zurich Airport', iata: 'ZRH', lat: 47.4647, lng: 8.5492, city: 'Zürich', poiType: 'airport', postalCode: '8302' },
    { name: 'Aeropuerto de Ginebra', nameEn: 'Geneva Airport', iata: 'GVA', lat: 46.2380, lng: 6.1089, city: 'Genève', poiType: 'airport', postalCode: '1215' },
    { name: 'Aeropuerto de Basilea', nameEn: 'EuroAirport Basel', iata: 'BSL', lat: 47.5896, lng: 7.5299, city: 'Basel', poiType: 'airport', postalCode: '4030' },
    { name: 'Aeropuerto de Berna', nameEn: 'Bern Airport', iata: 'BRN', lat: 46.9138, lng: 7.4969, city: 'Belp', poiType: 'airport', postalCode: '3123' },
    { name: 'Aeropuerto de Lugano', nameEn: 'Lugano Airport', iata: 'LUG', lat: 46.0043, lng: 8.9094, city: 'Lugano', poiType: 'airport', postalCode: '6984' },
    { name: 'Aeropuerto de Sion', nameEn: 'Sion Airport', iata: 'SIR', lat: 46.2189, lng: 7.3328, city: 'Sion', poiType: 'airport', postalCode: '1950' },
    { name: 'Aeropuerto de San Galo-Altenrhein', nameEn: 'St. Gallen-Altenrhein Airport', iata: 'ACH', lat: 47.4833, lng: 9.5667, city: 'Altenrhein', poiType: 'airport', postalCode: '9423' },
  ],

  // ESTACIONES DE TREN PRINCIPALES
  trainStations: [
    // Zúrich
    { name: 'Estación Central de Zúrich', nameEn: 'Zurich HB', lat: 47.3782, lng: 8.5402, city: 'Zürich', postalCode: '8001', poiType: 'train_station' },
    { name: 'Zúrich Oerlikon', lat: 47.4131, lng: 8.5448, city: 'Zürich', postalCode: '8050', poiType: 'train_station' },
    { name: 'Zúrich Stadelhofen', lat: 47.3665, lng: 8.5506, city: 'Zürich', postalCode: '8001', poiType: 'train_station' },
    { name: 'Zúrich Enge', lat: 47.3564, lng: 8.5269, city: 'Zürich', postalCode: '8002', poiType: 'train_station' },
    { name: 'Zúrich Hardbrücke', lat: 47.3861, lng: 8.5178, city: 'Zürich', postalCode: '8005', poiType: 'train_station' },
    
    // Ginebra
    { name: 'Estación Central de Ginebra', nameEn: 'Geneva Cornavin', lat: 46.2106, lng: 6.1423, city: 'Genève', postalCode: '1201', poiType: 'train_station' },
    { name: 'Ginebra-Aeropuerto', lat: 46.2342, lng: 6.1089, city: 'Genève', postalCode: '1215', poiType: 'train_station' },
    { name: 'Ginebra Eaux-Vives', lat: 46.2017, lng: 6.1608, city: 'Genève', postalCode: '1207', poiType: 'train_station' },
    
    // Berna
    { name: 'Estación Central de Berna', lat: 46.9484, lng: 7.4394, city: 'Bern', postalCode: '3011', poiType: 'train_station' },
    
    // Basilea
    { name: 'Estación Central de Basilea', nameEn: 'Basel SBB', lat: 47.5474, lng: 7.5896, city: 'Basel', postalCode: '4051', poiType: 'train_station' },
    { name: 'Basilea Badischer Bahnhof', lat: 47.5586, lng: 7.5947, city: 'Basel', postalCode: '4057', poiType: 'train_station' },
    
    // Lausana
    { name: 'Estación Central de Lausana', lat: 46.5165, lng: 6.6294, city: 'Lausanne', postalCode: '1001', poiType: 'train_station' },
    
    // Lucerna
    { name: 'Estación Central de Lucerna', lat: 47.0499, lng: 8.3104, city: 'Luzern', postalCode: '6003', poiType: 'train_station' },
    
    // San Galo
    { name: 'Estación Central de San Galo', lat: 47.4235, lng: 9.3700, city: 'St. Gallen', postalCode: '9000', poiType: 'train_station' },
    
    // Lugano
    { name: 'Estación Central de Lugano', lat: 46.0026, lng: 8.9514, city: 'Lugano', postalCode: '6900', poiType: 'train_station' },
    
    // Winterthur
    { name: 'Estación Central de Winterthur', lat: 47.4988, lng: 8.7236, city: 'Winterthur', postalCode: '8400', poiType: 'train_station' },
    
    // Coira
    { name: 'Estación de Coira', lat: 46.8536, lng: 9.5297, city: 'Chur', postalCode: '7000', poiType: 'train_station' },
    
    // Interlaken
    { name: 'Interlaken Ost', lat: 46.6864, lng: 7.8739, city: 'Interlaken', postalCode: '3800', poiType: 'train_station' },
    { name: 'Interlaken West', lat: 46.6825, lng: 7.8561, city: 'Interlaken', postalCode: '3800', poiType: 'train_station' },
  ],

  // CÓDIGOS POSTALES Y BARRIOS DE ZÚRICH
  zurichPostalCodes: [
    { code: '8001', name: 'Centro de Zúrich', neighborhood: 'Altstadt', lat: 47.3744, lng: 8.5428 },
    { code: '8002', name: 'Enge', neighborhood: 'Enge', lat: 47.3564, lng: 8.5269 },
    { code: '8003', name: 'Wiedikon', neighborhood: 'Wiedikon', lat: 47.3614, lng: 8.5156 },
    { code: '8004', name: 'Aussersihl', neighborhood: 'Aussersihl', lat: 47.3792, lng: 8.5128 },
    { code: '8005', name: 'Industriequartier', neighborhood: 'Industriequartier', lat: 47.3861, lng: 8.5178 },
    { code: '8006', name: 'Unterstrass', neighborhood: 'Unterstrass', lat: 47.3856, lng: 8.5339 },
    { code: '8008', name: 'Seefeld', neighborhood: 'Seefeld', lat: 47.3614, lng: 8.5564 },
    { code: '8032', name: 'Hottingen', neighborhood: 'Hottingen', lat: 47.3642, lng: 8.5639 },
    { code: '8037', name: 'Witikon', neighborhood: 'Witikon', lat: 47.3678, lng: 8.5867 },
    { code: '8041', name: 'Kreis 7', neighborhood: 'Fluntern', lat: 47.3719, lng: 8.5650 },
    { code: '8045', name: 'Altstetten', neighborhood: 'Altstetten', lat: 47.3928, lng: 8.4892 },
    { code: '8046', name: 'Höngg', neighborhood: 'Höngg', lat: 47.3972, lng: 8.4978 },
    { code: '8047', name: 'Herdern', neighborhood: 'Herdern', lat: 47.3928, lng: 8.5183 },
    { code: '8048', name: 'Oerlikon', neighborhood: 'Oerlikon', lat: 47.4131, lng: 8.5448 },
    { code: '8049', name: 'Seebach', neighborhood: 'Seebach', lat: 47.4253, lng: 8.5483 },
    { code: '8050', name: 'Oerlikon Sur', neighborhood: 'Oerlikon', lat: 47.4083, lng: 8.5422 },
    { code: '8051', name: 'Schwamendingen', neighborhood: 'Schwamendingen', lat: 47.4017, lng: 8.5731 },
    { code: '8052', name: 'Seebach Nord', neighborhood: 'Seebach', lat: 47.4328, lng: 8.5500 },
    { code: '8053', name: 'Schwamendingen Mitte', neighborhood: 'Schwamendingen', lat: 47.4050, lng: 8.5817 },
    { code: '8055', name: 'Wollishofen', neighborhood: 'Wollishofen', lat: 47.3408, lng: 8.5328 },
    { code: '8057', name: 'Unterstrass Nord', neighborhood: 'Unterstrass', lat: 47.3911, lng: 8.5311 },
    { code: '8058', name: 'Höngg Nord', neighborhood: 'Höngg', lat: 47.4028, lng: 8.4917 },
  ],

  // CÓDIGOS POSTALES DE GINEBRA
  genevaPostalCodes: [
    { code: '1201', name: 'Centro de Ginebra', neighborhood: 'Cité-centre', lat: 46.2106, lng: 6.1423 },
    { code: '1202', name: 'Saint-Gervais', neighborhood: 'Saint-Gervais', lat: 46.2169, lng: 6.1381 },
    { code: '1203', name: 'Grottes', neighborhood: 'Grottes', lat: 46.2189, lng: 6.1319 },
    { code: '1204', name: 'Vieille-Ville', neighborhood: 'Vieille-Ville', lat: 46.2017, lng: 6.1458 },
    { code: '1205', name: 'Plainpalais', neighborhood: 'Plainpalais', lat: 46.1989, lng: 6.1397 },
    { code: '1206', name: 'Eaux-Vives', neighborhood: 'Eaux-Vives', lat: 46.2017, lng: 6.1608 },
    { code: '1207', name: 'Champel', neighborhood: 'Champel', lat: 46.1919, lng: 6.1542 },
    { code: '1208', name: 'Jonction', neighborhood: 'Jonction', lat: 46.2131, lng: 6.1269 },
    { code: '1211', name: 'Nations', neighborhood: 'Nations', lat: 46.2261, lng: 6.1386 },
    { code: '1213', name: 'Onex', neighborhood: 'Onex', lat: 46.1853, lng: 6.0978 },
    { code: '1214', name: 'Vernier', neighborhood: 'Vernier', lat: 46.2185, lng: 6.0845 },
    { code: '1215', name: 'Aeropuerto', neighborhood: 'Aéroport', lat: 46.2380, lng: 6.1089 },
    { code: '1219', name: 'Lancy', neighborhood: 'Lancy', lat: 46.1831, lng: 6.1257 },
  ],

  // CÓDIGOS POSTALES DE BERNIA
  bernPostalCodes: [
    { code: '3001', name: 'Centro de Berna', neighborhood: 'Innere Stadt', lat: 46.9480, lng: 7.4474 },
    { code: '3004', name: 'Länggasse', neighborhood: 'Länggasse', lat: 46.9517, lng: 7.4336 },
    { code: '3005', name: 'Breitenrain', neighborhood: 'Breitenrain', lat: 46.9572, lng: 7.4572 },
    { code: '3006', name: 'Lorraine', neighborhood: 'Lorraine', lat: 46.9628, lng: 7.4367 },
    { code: '3007', name: 'Mattenhof', neighborhood: 'Mattenhof', lat: 46.9442, lng: 7.4278 },
    { code: '3008', name: 'Bümpliz', neighborhood: 'Bümpliz', lat: 46.9317, lng: 7.3939 },
    { code: '3010', name: 'Muri', neighborhood: 'Muri', lat: 46.9250, lng: 7.4583 },
    { code: '3011', name: 'Centro Estación', neighborhood: 'Bahnhof', lat: 46.9484, lng: 7.4394 },
    { code: '3012', name: 'Altenberg', neighborhood: 'Altenberg', lat: 46.9536, lng: 7.4417 },
    { code: '3013', name: 'Länggasse Nord', neighborhood: 'Länggasse', lat: 46.9544, lng: 7.4286 },
    { code: '3014', name: 'Viererfeld', neighborhood: 'Viererfeld', lat: 46.9611, lng: 7.4486 },
    { code: '3015', name: 'Wyler', neighborhood: 'Wyler', lat: 46.9661, lng: 7.4533 },
  ],

  // CÓDIGOS POSTALES DE BASEL
  baselPostalCodes: [
    { code: '4001', name: 'Centro de Basilea', neighborhood: 'Altstadt', lat: 47.5596, lng: 7.5886 },
    { code: '4002', name: 'St. Johann', neighborhood: 'St. Johann', lat: 47.5667, lng: 7.5717 },
    { code: '4003', name: 'Gundeldingen', neighborhood: 'Gundeldingen', lat: 47.5472, lng: 7.5978 },
    { code: '4004', name: 'Altstadt Grossbasel', neighborhood: 'Altstadt', lat: 47.5564, lng: 7.5903 },
    { code: '4005', name: 'Altstadt Kleinbasel', neighborhood: 'Kleinbasel', lat: 47.5633, lng: 7.5964 },
    { code: '4051', name: 'Basel SBB', neighborhood: 'Bahnhof SBB', lat: 47.5474, lng: 7.5896 },
    { code: '4052', name: 'St. Jakob', neighborhood: 'St. Jakob', lat: 47.5333, lng: 7.6194 },
    { code: '4053', name: 'Breite', neighborhood: 'Breite', lat: 47.5517, lng: 7.6075 },
    { code: '4054', name: 'Iselin', neighborhood: 'Iselin', lat: 47.5567, lng: 7.5692 },
    { code: '4055', name: 'Bachletten', neighborhood: 'Bachletten', lat: 47.5469, lng: 7.5767 },
    { code: '4056', name: 'Vorstädte', neighborhood: 'Vorstädte', lat: 47.5544, lng: 7.5806 },
    { code: '4057', name: 'Badischer Bahnhof', neighborhood: 'Badischer Bahnhof', lat: 47.5586, lng: 7.5947 },
    { code: '4058', name: 'Rosental', neighborhood: 'Rosental', lat: 47.5642, lng: 7.6017 },
    { code: '4059', name: 'Clara', neighborhood: 'Clara', lat: 47.5689, lng: 7.6083 },
  ],

  // CÓDIGOS POSTALES DE LAUSANNE
  lausannePostalCodes: [
    { code: '1001', name: 'Centro de Lausana', neighborhood: 'Centre', lat: 46.5165, lng: 6.6294 },
    { code: '1002', name: 'Centre', neighborhood: 'Centre', lat: 46.5186, lng: 6.6319 },
    { code: '1003', name: 'Ouchy', neighborhood: 'Ouchy', lat: 46.5061, lng: 6.6264 },
    { code: '1004', name: 'La Bourdonnette', neighborhood: 'La Bourdonnette', lat: 46.5117, lng: 6.6153 },
    { code: '1005', name: 'La Cité', neighborhood: 'La Cité', lat: 46.5219, lng: 6.6342 },
    { code: '1006', name: 'Flore', neighborhood: 'Flore', lat: 46.5289, lng: 6.6300 },
    { code: '1007', name: 'Bellevaux', neighborhood: 'Bellevaux', lat: 46.5308, lng: 6.6433 },
    { code: '1008', name: 'Prilly', neighborhood: 'Prilly', lat: 46.5365, lng: 6.5803 },
    { code: '1009', name: 'Pully', neighborhood: 'Pully', lat: 46.5106, lng: 6.6586 },
    { code: '1010', name: 'Renens', neighborhood: 'Renens', lat: 46.5365, lng: 6.5803 },
    { code: '1011', name: 'Chavannes', neighborhood: 'Chavannes-près-Renens', lat: 46.5328, lng: 6.5667 },
    { code: '1012', name: 'Crissier', neighborhood: 'Crissier', lat: 46.5450, lng: 6.5767 },
    { code: '1015', name: 'Dorigny', neighborhood: 'Dorigny', lat: 46.5181, lng: 6.5781 },
  ],

  // CÓDIGOS POSTALES DE LUCERNA
  lucernePostalCodes: [
    { code: '6001', name: 'Centro de Lucerna', neighborhood: 'Altstadt', lat: 47.0502, lng: 8.3093 },
    { code: '6002', name: 'Bahnhof', neighborhood: 'Bahnhof', lat: 47.0499, lng: 8.3104 },
    { code: '6003', name: 'Neustadt', neighborhood: 'Neustadt', lat: 47.0472, lng: 8.3047 },
    { code: '6004', name: 'Altstadt', neighborhood: 'Altstadt', lat: 47.0511, lng: 8.3053 },
    { code: '6005', name: 'Luzern West', neighborhood: 'Luzern West', lat: 47.0433, lng: 8.2853 },
    { code: '6006', name: 'Luzern Nord', neighborhood: 'Luzern Nord', lat: 47.0628, lng: 8.3125 },
  ],

  // CÓDIGOS POSTALES DE ST. GALLEN
  stGallenPostalCodes: [
    { code: '9000', name: 'Centro de San Galo', neighborhood: 'Altstadt', lat: 47.4245, lng: 9.3767 },
    { code: '9001', name: 'Bahnhof', neighborhood: 'Bahnhof', lat: 47.4235, lng: 9.3700 },
    { code: '9004', name: 'St. Georgen', neighborhood: 'St. Georgen', lat: 47.4303, lng: 9.3878 },
    { code: '9007', name: 'St. Fiden', neighborhood: 'St. Fiden', lat: 47.4175, lng: 9.3953 },
    { code: '9008', name: 'Winkeln', neighborhood: 'Winkeln', lat: 47.4281, lng: 9.4106 },
  ],

  // HOTELES IMPORTANTES
  hotels: [
    // Zúrich
    { name: 'Baur au Lac', lat: 47.3681, lng: 8.5433, city: 'Zürich', postalCode: '8001', poiType: 'hotel' },
    { name: 'Dolder Grand', lat: 47.3728, lng: 8.5714, city: 'Zürich', postalCode: '8032', poiType: 'hotel' },
    { name: 'Park Hyatt Zürich', lat: 47.3667, lng: 8.5286, city: 'Zürich', postalCode: '8001', poiType: 'hotel' },
    { name: 'Widder Hotel', lat: 47.3708, lng: 8.5356, city: 'Zürich', postalCode: '8001', poiType: 'hotel' },
    { name: 'Savoy Hotel Baur en Ville', lat: 47.3697, lng: 8.5394, city: 'Zürich', postalCode: '8001', poiType: 'hotel' },
    { name: 'Hotel Atlantis by Giardino', lat: 47.3594, lng: 8.5219, city: 'Zürich', postalCode: '8003', poiType: 'hotel' },
    { name: 'The Dolder Grand Spa', lat: 47.3728, lng: 8.5714, city: 'Zürich', postalCode: '8032', poiType: 'hotel' },
    { name: 'Hotel Helmhaus', lat: 47.3731, lng: 8.5431, city: 'Zürich', postalCode: '8001', poiType: 'hotel' },
    
    // Ginebra
    { name: 'Hotel Beau-Rivage', lat: 46.2072, lng: 6.1511, city: 'Genève', postalCode: '1204', poiType: 'hotel' },
    { name: 'Four Seasons Hotel des Bergues', lat: 46.2086, lng: 6.1486, city: 'Genève', postalCode: '1201', poiType: 'hotel' },
    { name: 'Hotel d\'Angleterre', lat: 46.2069, lng: 6.1522, city: 'Genève', postalCode: '1204', poiType: 'hotel' },
    { name: 'The Ritz-Carlton Geneva', lat: 46.2067, lng: 6.1478, city: 'Genève', postalCode: '1201', poiType: 'hotel' },
    { name: 'Mandarin Oriental Geneva', lat: 46.2042, lng: 6.1514, city: 'Genève', postalCode: '1201', poiType: 'hotel' },
    { name: 'Hotel President Wilson', lat: 46.2214, lng: 6.1556, city: 'Genève', postalCode: '1201', poiType: 'hotel' },
    { name: 'InterContinental Geneva', lat: 46.2250, lng: 6.1475, city: 'Genève', postalCode: '1211', poiType: 'hotel' },
    
    // Berna
    { name: 'Hotel Bellevue Palace', lat: 46.9461, lng: 7.4444, city: 'Bern', postalCode: '3011', poiType: 'hotel' },
    { name: 'Hotel Schweizerhof Bern', lat: 46.9481, lng: 7.4406, city: 'Bern', postalCode: '3011', poiType: 'hotel' },
    { name: 'Kursaal Bern', lat: 46.9508, lng: 7.4539, city: 'Bern', postalCode: '3011', poiType: 'hotel' },
    
    // Basilea
    { name: 'Grand Hotel Les Trois Rois', lat: 47.5578, lng: 7.5903, city: 'Basel', postalCode: '4001', poiType: 'hotel' },
    { name: 'Hotel Victoria', lat: 47.5481, lng: 7.5903, city: 'Basel', postalCode: '4051', poiType: 'hotel' },
    { name: 'Hotel Spalentor', lat: 47.5564, lng: 7.5822, city: 'Basel', postalCode: '4051', poiType: 'hotel' },
    
    // Lausana
    { name: 'Beau-Rivage Palace Lausanne', lat: 46.5064, lng: 6.6264, city: 'Lausanne', postalCode: '1003', poiType: 'hotel' },
    { name: 'Lausanne Palace', lat: 46.5181, lng: 6.6306, city: 'Lausanne', postalCode: '1001', poiType: 'hotel' },
    { name: 'Hotel Royal Savoy', lat: 46.5178, lng: 6.6322, city: 'Lausanne', postalCode: '1001', poiType: 'hotel' },
    
    // Interlaken
    { name: 'Victoria Jungfrau Grand Hotel', lat: 46.6828, lng: 7.8581, city: 'Interlaken', postalCode: '3800', poiType: 'hotel' },
    { name: 'Hotel Interlaken', lat: 46.6844, lng: 7.8667, city: 'Interlaken', postalCode: '3800', poiType: 'hotel' },
  ],

  // CENTROS COMERCIALES
  malls: [
    { name: 'Bahnhofstrasse', lat: 47.3739, lng: 8.5378, city: 'Zürich', postalCode: '8001', poiType: 'mall' },
    { name: 'Sihl City', lat: 47.3592, lng: 8.5192, city: 'Zürich', postalCode: '8002', poiType: 'mall' },
    { name: 'Glattzentrum', lat: 47.4244, lng: 8.5567, city: 'Wallisellen', postalCode: '8304', poiType: 'mall' },
    { name: 'Westside Basel', lat: 47.5417, lng: 7.6056, city: 'Basel', postalCode: '4055', poiType: 'mall' },
    { name: 'St. Jakob-Park Center', lat: 47.5336, lng: 7.6211, city: 'Basel', postalCode: '4052', poiType: 'mall' },
    { name: 'Balexert', lat: 46.2278, lng: 6.0764, city: 'Vernier', postalCode: '1219', poiType: 'mall' },
    { name: 'Centre Commercial La Praille', lat: 46.1917, lng: 6.1219, city: 'Lancy', postalCode: '1219', poiType: 'mall' },
    { name: 'Mall of Switzerland', lat: 47.1247, lng: 8.3714, city: 'Ebikon', postalCode: '6048', poiType: 'mall' },
    { name: 'Epa Center Bern', lat: 46.9475, lng: 7.4411, city: 'Bern', postalCode: '3011', poiType: 'mall' },
    { name: 'Shopping Arena St. Gallen', lat: 47.4186, lng: 9.3550, city: 'St. Gallen', postalCode: '9000', poiType: 'mall' },
  ],

  // HOSPITALES IMPORTANTES
  hospitals: [
    { name: 'Universitätsspital Zürich', lat: 47.3744, lng: 8.5608, city: 'Zürich', postalCode: '8091', poiType: 'hospital' },
    { name: 'Hôpitaux Universitaires de Genève', lat: 46.2058, lng: 6.1453, city: 'Genève', postalCode: '1205', poiType: 'hospital' },
    { name: 'Inselspital Bern', lat: 46.9531, lng: 7.4531, city: 'Bern', postalCode: '3010', poiType: 'hospital' },
    { name: 'Universitätsspital Basel', lat: 47.5572, lng: 7.5831, city: 'Basel', postalCode: '4031', poiType: 'hospital' },
    { name: 'CHUV Lausanne', lat: 46.5233, lng: 6.6422, city: 'Lausanne', postalCode: '1011', poiType: 'hospital' },
    { name: 'Kantonsspital St. Gallen', lat: 47.4289, lng: 9.3917, city: 'St. Gallen', postalCode: '9007', poiType: 'hospital' },
    { name: 'Kantonsspital Luzern', lat: 47.0653, lng: 8.2856, city: 'Luzern', postalCode: '6000', poiType: 'hospital' },
    { name: 'Kantonsspital Winterthur', lat: 47.5047, lng: 8.7314, city: 'Winterthur', postalCode: '8401', poiType: 'hospital' },
    { name: 'Ospedale Regionale di Lugano', lat: 46.0039, lng: 8.9411, city: 'Lugano', postalCode: '6900', poiType: 'hospital' },
    { name: 'Kantonsspital Graubünden', lat: 46.8522, lng: 9.5308, city: 'Chur', postalCode: '7000', poiType: 'hospital' },
  ],

  // UNIVERSIDADES
  universities: [
    { name: 'ETH Zürich', lat: 47.3764, lng: 8.5472, city: 'Zürich', postalCode: '8092', poiType: 'university' },
    { name: 'Universität Zürich', lat: 47.3742, lng: 8.5506, city: 'Zürich', postalCode: '8006', poiType: 'university' },
    { name: 'Université de Genève', lat: 46.1983, lng: 6.1425, city: 'Genève', postalCode: '1205', poiType: 'university' },
    { name: 'EPFL Lausanne', lat: 46.5181, lng: 6.5781, city: 'Lausanne', postalCode: '1015', poiType: 'university' },
    { name: 'Universität Bern', lat: 46.9506, lng: 7.4417, city: 'Bern', postalCode: '3012', poiType: 'university' },
    { name: 'Universität Basel', lat: 47.5581, lng: 7.5878, city: 'Basel', postalCode: '4001', poiType: 'university' },
    { name: 'Universität St. Gallen', lat: 47.4331, lng: 9.3761, city: 'St. Gallen', postalCode: '9000', poiType: 'university' },
    { name: 'Universität Luzern', lat: 47.0478, lng: 8.3072, city: 'Luzern', postalCode: '6002', poiType: 'university' },
    { name: 'Università della Svizzera italiana', lat: 46.0025, lng: 8.9503, city: 'Lugano', postalCode: '6900', poiType: 'university' },
  ],

  // CALLES PRINCIPALES DE ZÚRICH
  zurichStreets: [
    { name: 'Bahnhofstrasse', lat: 47.3739, lng: 8.5378, postalCode: '8001', type: 'street' },
    { name: 'Niederdorfstrasse', lat: 47.3747, lng: 8.5464, postalCode: '8001', type: 'street' },
    { name: 'Limmatquai', lat: 47.3744, lng: 8.5433, postalCode: '8001', type: 'street' },
    { name: 'Sechselmeienplatz', lat: 47.3672, lng: 8.5481, postalCode: '8001', type: 'street' },
    { name: 'Paradeplatz', lat: 47.3697, lng: 8.5386, postalCode: '8001', type: 'street' },
    { name: 'Rennweg', lat: 47.3697, lng: 8.5364, postalCode: '8001', type: 'street' },
    { name: 'Bannhofplatz', lat: 47.3782, lng: 8.5402, postalCode: '8001', type: 'street' },
    { name: 'Bürkliplatz', lat: 47.3664, lng: 8.5419, postalCode: '8001', type: 'street' },
    { name: 'Bellevueplatz', lat: 47.3661, lng: 8.5497, postalCode: '8001', type: 'street' },
    { name: 'Langstrasse', lat: 47.3814, lng: 8.5200, postalCode: '8004', type: 'street' },
    { name: 'Badenerstrasse', lat: 47.3761, lng: 8.5122, postalCode: '8004', type: 'street' },
    { name: 'Josefstrasse', lat: 47.3833, lng: 8.5164, postalCode: '8005', type: 'street' },
    { name: 'Hardstrasse', lat: 47.3858, lng: 8.5139, postalCode: '8005', type: 'street' },
    { name: 'Schaffhauserstrasse', lat: 47.4000, lng: 8.5333, postalCode: '8057', type: 'street' },
    { name: 'Winterthurerstrasse', lat: 47.4033, lng: 8.5517, postalCode: '8050', type: 'street' },
    { name: 'Seestrasse', lat: 47.3500, lng: 8.5367, postalCode: '8002', type: 'street' },
    { name: 'Utoquai', lat: 47.3628, lng: 8.5492, postalCode: '8008', type: 'street' },
    { name: 'General-Guisan-Quai', lat: 47.3589, lng: 8.5519, postalCode: '8002', type: 'street' },
  ],

  // CALLES PRINCIPALES DE GINEBRA
  genevaStreets: [
    { name: 'Rue du Rhône', lat: 46.2056, lng: 6.1472, postalCode: '1204', type: 'street' },
    { name: 'Rue du Marché', lat: 46.2064, lng: 6.1425, postalCode: '1204', type: 'street' },
    { name: 'Rue de Lausanne', lat: 46.2131, lng: 6.1408, postalCode: '1201', type: 'street' },
    { name: 'Rue de Ferney', lat: 46.2236, lng: 6.1425, postalCode: '1202', type: 'street' },
    { name: 'Rue de Carouge', lat: 46.1972, lng: 6.1358, postalCode: '1205', type: 'street' },
    { name: 'Grand-Rue', lat: 46.2017, lng: 6.1447, postalCode: '1204', type: 'street' },
    { name: 'Rue de Rive', lat: 46.2042, lng: 6.1511, postalCode: '1204', type: 'street' },
    { name: 'Place du Molard', lat: 46.2050, lng: 6.1447, postalCode: '1204', type: 'street' },
    { name: 'Place Bel-Air', lat: 46.2092, lng: 6.1417, postalCode: '1204', type: 'street' },
    { name: 'Pont du Mont-Blanc', lat: 46.2097, lng: 6.1464, postalCode: '1201', type: 'street' },
    { name: 'Quai du Mont-Blanc', lat: 46.2125, lng: 6.1494, postalCode: '1201', type: 'street' },
    { name: 'Quai Gustave-Ador', lat: 46.2061, lng: 6.1608, postalCode: '1207', type: 'street' },
  ],

  // LIECHTENSTEIN
  liechtensteinLocations: [
    // Ciudades/Municipios
    { name: 'Vaduz', type: 'city', lat: 47.1410, lng: 9.5215, postalCode: '9490' },
    { name: 'Schaan', type: 'city', lat: 47.1652, lng: 9.5087, postalCode: '9494' },
    { name: 'Balzers', type: 'city', lat: 47.0678, lng: 9.5039, postalCode: '9496' },
    { name: 'Triesen', type: 'city', lat: 47.1150, lng: 9.5294, postalCode: '9495' },
    { name: 'Eschen', type: 'city', lat: 47.2122, lng: 9.5202, postalCode: '9492' },
    { name: 'Mauren', type: 'city', lat: 47.2183, lng: 9.5439, postalCode: '9493' },
    { name: 'Triesenberg', type: 'city', lat: 47.1175, lng: 9.5417, postalCode: '9497' },
    { name: 'Ruggell', type: 'city', lat: 47.2447, lng: 9.5331, postalCode: '9491' },
    { name: 'Gamprin', type: 'city', lat: 47.2200, lng: 9.5083, postalCode: '9492' },
    { name: 'Schellenberg', type: 'city', lat: 47.2417, lng: 9.5472, postalCode: '9498' },
    { name: 'Planken', type: 'city', lat: 47.1850, lng: 9.5350, postalCode: '9498' },
    
    // Calles de Vaduz
    { name: 'Städtle', type: 'street', lat: 47.1397, lng: 9.5217, postalCode: '9490', city: 'Vaduz' },
    { name: 'Aeulestrasse', type: 'street', lat: 47.1381, lng: 9.5194, postalCode: '9490', city: 'Vaduz' },
    { name: 'Landstrasse', type: 'street', lat: 47.1417, lng: 9.5233, postalCode: '9490', city: 'Vaduz' },
    
    // Puntos de interés Liechtenstein
    { name: 'Castillo de Vaduz', type: 'poi', lat: 47.1397, lng: 9.5211, postalCode: '9490', poiType: 'landmark', city: 'Vaduz' },
    { name: 'Museo de Arte de Liechtenstein', type: 'poi', lat: 47.1392, lng: 9.5228, postalCode: '9490', poiType: 'museum', city: 'Vaduz' },
    { name: 'Museo Nacional de Liechtenstein', type: 'poi', lat: 47.1394, lng: 9.5222, postalCode: '9490', poiType: 'museum', city: 'Vaduz' },
  ],

  // ESTACIONES DE AUTOBÚS IMPORTANTES
  busStations: [
    { name: 'Zurich Bus Station (Sihlquai)', lat: 47.3842, lng: 8.5219, city: 'Zürich', postalCode: '8005', poiType: 'bus_station' },
    { name: 'Geneva Bus Station', lat: 46.2089, lng: 6.1408, city: 'Genève', postalCode: '1201', poiType: 'bus_station' },
    { name: 'Bern Bus Station', lat: 46.9492, lng: 7.4386, city: 'Bern', postalCode: '3011', poiType: 'bus_station' },
    { name: 'Basel Bus Station', lat: 47.5467, lng: 7.5894, city: 'Basel', postalCode: '4051', poiType: 'bus_station' },
  ],
}

async function main() {
  console.log('🌱 Iniciando seed de ubicaciones detalladas...')

  // Obtener cantones y ciudades existentes
  const cantons = await prisma.canton.findMany()
  const cities = await prisma.city.findMany({
    include: { canton: true }
  })

  const cantonMap = new Map(cantons.map(c => [c.code, c]))
  const cityMap = new Map(cities.map(c => [c.name.toLowerCase(), c]))

  const getCity = (name: string) => {
    return cityMap.get(name.toLowerCase()) || cityMap.get(name)
  }

  // 1. Agregar aeropuertos
  console.log('✈️ Agregando aeropuertos...')
  for (const airport of SWISS_LOCATIONS.airports) {
    const city = getCity(airport.city)
    await prisma.location.upsert({
      where: {
        name_type_postalCode: {
          name: airport.name,
          type: 'poi',
          postalCode: airport.postalCode || '',
        }
      },
      update: {},
      create: {
        name: airport.name,
        type: 'poi',
        poiType: airport.poiType,
        poiCategory: 'transport',
        postalCode: airport.postalCode,
        latitude: airport.lat,
        longitude: airport.lng,
        searchTerms: `${airport.nameEn}, ${airport.iata}, airport, flughafen, aéroport`,
        cityId: city?.id,
        cantonId: city?.cantonId,
      }
    })
  }

  // 2. Agregar estaciones de tren
  console.log('🚂 Agregando estaciones de tren...')
  for (const station of SWISS_LOCATIONS.trainStations) {
    const city = getCity(station.city)
    await prisma.location.upsert({
      where: {
        name_type_postalCode: {
          name: station.name,
          type: 'poi',
          postalCode: station.postalCode || '',
        }
      },
      update: {},
      create: {
        name: station.name,
        type: 'poi',
        poiType: station.poiType || 'train_station',
        poiCategory: 'transport',
        postalCode: station.postalCode,
        latitude: station.lat,
        longitude: station.lng,
        searchTerms: `${station.nameEn || station.name}, bahnhof, gare, stazione, station`,
        cityId: city?.id,
        cantonId: city?.cantonId,
      }
    })
  }

  // 3. Agregar códigos postales de Zúrich
  console.log('📬 Agregando códigos postales de Zúrich...')
  const zurich = getCity('Zürich')
  for (const pc of SWISS_LOCATIONS.zurichPostalCodes) {
    await prisma.location.upsert({
      where: {
        name_type_postalCode: {
          name: pc.name,
          type: 'postal_code',
          postalCode: pc.code,
        }
      },
      update: {},
      create: {
        name: pc.name,
        type: 'postal_code',
        postalCode: pc.code,
        neighborhood: pc.neighborhood,
        latitude: pc.lat,
        longitude: pc.lng,
        cityId: zurich?.id,
        cantonId: zurich?.cantonId,
      }
    })
  }

  // 4. Agregar códigos postales de Ginebra
  console.log('📬 Agregando códigos postales de Ginebra...')
  const geneva = getCity('Genève')
  for (const pc of SWISS_LOCATIONS.genevaPostalCodes) {
    await prisma.location.upsert({
      where: {
        name_type_postalCode: {
          name: pc.name,
          type: 'postal_code',
          postalCode: pc.code,
        }
      },
      update: {},
      create: {
        name: pc.name,
        type: 'postal_code',
        postalCode: pc.code,
        neighborhood: pc.neighborhood,
        latitude: pc.lat,
        longitude: pc.lng,
        cityId: geneva?.id,
        cantonId: geneva?.cantonId,
      }
    })
  }

  // 5. Agregar códigos postales de Berna
  console.log('📬 Agregando códigos postales de Berna...')
  const bern = getCity('Bern')
  for (const pc of SWISS_LOCATIONS.bernPostalCodes) {
    await prisma.location.upsert({
      where: {
        name_type_postalCode: {
          name: pc.name,
          type: 'postal_code',
          postalCode: pc.code,
        }
      },
      update: {},
      create: {
        name: pc.name,
        type: 'postal_code',
        postalCode: pc.code,
        neighborhood: pc.neighborhood,
        latitude: pc.lat,
        longitude: pc.lng,
        cityId: bern?.id,
        cantonId: bern?.cantonId,
      }
    })
  }

  // 6. Agregar códigos postales de Basilea
  console.log('📬 Agregando códigos postales de Basilea...')
  const basel = getCity('Basel')
  for (const pc of SWISS_LOCATIONS.baselPostalCodes) {
    await prisma.location.upsert({
      where: {
        name_type_postalCode: {
          name: pc.name,
          type: 'postal_code',
          postalCode: pc.code,
        }
      },
      update: {},
      create: {
        name: pc.name,
        type: 'postal_code',
        postalCode: pc.code,
        neighborhood: pc.neighborhood,
        latitude: pc.lat,
        longitude: pc.lng,
        cityId: basel?.id,
        cantonId: basel?.cantonId,
      }
    })
  }

  // 7. Agregar códigos postales de Lausana
  console.log('📬 Agregando códigos postales de Lausana...')
  const lausanne = getCity('Lausanne')
  for (const pc of SWISS_LOCATIONS.lausannePostalCodes) {
    await prisma.location.upsert({
      where: {
        name_type_postalCode: {
          name: pc.name,
          type: 'postal_code',
          postalCode: pc.code,
        }
      },
      update: {},
      create: {
        name: pc.name,
        type: 'postal_code',
        postalCode: pc.code,
        neighborhood: pc.neighborhood,
        latitude: pc.lat,
        longitude: pc.lng,
        cityId: lausanne?.id,
        cantonId: lausanne?.cantonId,
      }
    })
  }

  // 8. Agregar hoteles
  console.log('🏨 Agregando hoteles...')
  for (const hotel of SWISS_LOCATIONS.hotels) {
    const city = getCity(hotel.city)
    await prisma.location.upsert({
      where: {
        name_type_postalCode: {
          name: hotel.name,
          type: 'poi',
          postalCode: hotel.postalCode || '',
        }
      },
      update: {},
      create: {
        name: hotel.name,
        type: 'poi',
        poiType: hotel.poiType,
        poiCategory: 'accommodation',
        postalCode: hotel.postalCode,
        latitude: hotel.lat,
        longitude: hotel.lng,
        searchTerms: `hotel, hôtel, hotel, ${hotel.name.toLowerCase()}`,
        cityId: city?.id,
        cantonId: city?.cantonId,
      }
    })
  }

  // 9. Agregar centros comerciales
  console.log('🛍️ Agregando centros comerciales...')
  for (const mall of SWISS_LOCATIONS.malls) {
    const city = getCity(mall.city)
    await prisma.location.upsert({
      where: {
        name_type_postalCode: {
          name: mall.name,
          type: 'poi',
          postalCode: mall.postalCode || '',
        }
      },
      update: {},
      create: {
        name: mall.name,
        type: 'poi',
        poiType: mall.poiType,
        poiCategory: 'shopping',
        postalCode: mall.postalCode,
        latitude: mall.lat,
        longitude: mall.lng,
        searchTerms: `shopping, mall, einkaufszentrum, centre commercial`,
        cityId: city?.id,
        cantonId: city?.cantonId,
      }
    })
  }

  // 10. Agregar hospitales
  console.log('🏥 Agregando hospitales...')
  for (const hospital of SWISS_LOCATIONS.hospitals) {
    const city = getCity(hospital.city)
    await prisma.location.upsert({
      where: {
        name_type_postalCode: {
          name: hospital.name,
          type: 'poi',
          postalCode: hospital.postalCode || '',
        }
      },
      update: {},
      create: {
        name: hospital.name,
        type: 'poi',
        poiType: hospital.poiType,
        poiCategory: 'health',
        postalCode: hospital.postalCode,
        latitude: hospital.lat,
        longitude: hospital.lng,
        searchTerms: `hospital, krankenhaus, hôpital, spital, ospedale`,
        cityId: city?.id,
        cantonId: city?.cantonId,
      }
    })
  }

  // 11. Agregar universidades
  console.log('🎓 Agregando universidades...')
  for (const uni of SWISS_LOCATIONS.universities) {
    const city = getCity(uni.city)
    await prisma.location.upsert({
      where: {
        name_type_postalCode: {
          name: uni.name,
          type: 'poi',
          postalCode: uni.postalCode || '',
        }
      },
      update: {},
      create: {
        name: uni.name,
        type: 'poi',
        poiType: uni.poiType,
        poiCategory: 'education',
        postalCode: uni.postalCode,
        latitude: uni.lat,
        longitude: uni.lng,
        searchTerms: `university, universität, université, università, eth, epfl`,
        cityId: city?.id,
        cantonId: city?.cantonId,
      }
    })
  }

  // 12. Agregar calles de Zúrich
  console.log('🛣️ Agregando calles de Zúrich...')
  for (const street of SWISS_LOCATIONS.zurichStreets) {
    await prisma.location.upsert({
      where: {
        name_type_postalCode: {
          name: street.name,
          type: 'street',
          postalCode: street.postalCode,
        }
      },
      update: {},
      create: {
        name: street.name,
        type: 'street',
        street: street.name,
        postalCode: street.postalCode,
        latitude: street.lat,
        longitude: street.lng,
        cityId: zurich?.id,
        cantonId: zurich?.cantonId,
      }
    })
  }

  // 13. Agregar calles de Ginebra
  console.log('🛣️ Agregando calles de Ginebra...')
  for (const street of SWISS_LOCATIONS.genevaStreets) {
    await prisma.location.upsert({
      where: {
        name_type_postalCode: {
          name: street.name,
          type: 'street',
          postalCode: street.postalCode,
        }
      },
      update: {},
      create: {
        name: street.name,
        type: 'street',
        street: street.name,
        postalCode: street.postalCode,
        latitude: street.lat,
        longitude: street.lng,
        cityId: geneva?.id,
        cantonId: geneva?.cantonId,
      }
    })
  }

  // 14. Agregar ubicaciones de Liechtenstein
  console.log('🇱🇮 Agregando ubicaciones de Liechtenstein...')
  const liCanton = cantonMap.get('LI')
  for (const loc of SWISS_LOCATIONS.liechtensteinLocations) {
    await prisma.location.upsert({
      where: {
        name_type_postalCode: {
          name: loc.name,
          type: loc.type,
          postalCode: loc.postalCode || '',
        }
      },
      update: {},
      create: {
        name: loc.name,
        type: loc.type,
        postalCode: loc.postalCode,
        latitude: loc.lat,
        longitude: loc.lng,
        poiType: loc.poiType,
        searchTerms: loc.type === 'poi' ? `liechtenstein, ${loc.name.toLowerCase()}` : undefined,
        cantonId: liCanton?.id,
      }
    })
  }

  // 15. Agregar estaciones de autobús
  console.log('🚌 Agregando estaciones de autobús...')
  for (const station of SWISS_LOCATIONS.busStations) {
    const city = getCity(station.city)
    await prisma.location.upsert({
      where: {
        name_type_postalCode: {
          name: station.name,
          type: 'poi',
          postalCode: station.postalCode || '',
        }
      },
      update: {},
      create: {
        name: station.name,
        type: 'poi',
        poiType: station.poiType,
        poiCategory: 'transport',
        postalCode: station.postalCode,
        latitude: station.lat,
        longitude: station.lng,
        searchTerms: `bus station, bushaltestelle, gare routière, autostazione`,
        cityId: city?.id,
        cantonId: city?.cantonId,
      }
    })
  }

  // Contar total
  const total = await prisma.location.count()
  console.log(`✅ Seed completado. Total de ubicaciones: ${total}`)
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
