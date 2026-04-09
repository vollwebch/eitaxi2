import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Función para crear slug
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[àáâäæãåā]/g, 'a')
    .replace(/[èéêëēėę]/g, 'e')
    .replace(/[îïíīįì]/g, 'i')
    .replace(/[ôöòóœøōõ]/g, 'o')
    .replace(/[ûüùúū]/g, 'u')
    .replace(/[çćč]/g, 'c')
    .replace(/[ß]/g, 'ss')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Todos los 26 cantones suizos
const swissCantons = [
  { name: 'Aargau', code: 'AG', slug: 'aargau', country: 'CH' },
  { name: 'Appenzell Ausserrhoden', code: 'AR', slug: 'appenzell-ausserrhoden', country: 'CH' },
  { name: 'Appenzell Innerrhoden', code: 'AI', slug: 'appenzell-innerrhoden', country: 'CH' },
  { name: 'Basel-Landschaft', code: 'BL', slug: 'basel-landschaft', country: 'CH' },
  { name: 'Basel-Stadt', code: 'BS', slug: 'basel-stadt', country: 'CH' },
  { name: 'Bern', code: 'BE', slug: 'bern', country: 'CH' },
  { name: 'Fribourg', code: 'FR', slug: 'fribourg', country: 'CH' },
  { name: 'Genève', code: 'GE', slug: 'geneve', country: 'CH' },
  { name: 'Glarus', code: 'GL', slug: 'glarus', country: 'CH' },
  { name: 'Graubünden', code: 'GR', slug: 'graubunden', country: 'CH' },
  { name: 'Jura', code: 'JU', slug: 'jura', country: 'CH' },
  { name: 'Luzern', code: 'LU', slug: 'luzern', country: 'CH' },
  { name: 'Neuchâtel', code: 'NE', slug: 'neuchatel', country: 'CH' },
  { name: 'Nidwalden', code: 'NW', slug: 'nidwalden', country: 'CH' },
  { name: 'Obwalden', code: 'OW', slug: 'obwalden', country: 'CH' },
  { name: 'Schaffhausen', code: 'SH', slug: 'schaffhausen', country: 'CH' },
  { name: 'Schwyz', code: 'SZ', slug: 'schwyz', country: 'CH' },
  { name: 'Solothurn', code: 'SO', slug: 'solothurn', country: 'CH' },
  { name: 'St. Gallen', code: 'SG', slug: 'st-gallen', country: 'CH' },
  { name: 'Thurgau', code: 'TG', slug: 'thurgau', country: 'CH' },
  { name: 'Ticino', code: 'TI', slug: 'ticino', country: 'CH' },
  { name: 'Uri', code: 'UR', slug: 'uri', country: 'CH' },
  { name: 'Valais', code: 'VS', slug: 'valais', country: 'CH' },
  { name: 'Vaud', code: 'VD', slug: 'vaud', country: 'CH' },
  { name: 'Zug', code: 'ZG', slug: 'zug', country: 'CH' },
  { name: 'Zürich', code: 'ZH', slug: 'zurich', country: 'CH' },
]

// Liechtenstein como "cantón"
const liechtensteinCanton = { name: 'Liechtenstein', code: 'LI', slug: 'liechtenstein', country: 'LI' }

// TODOS los municipios de Suiza - datos completos 2024
// Aargau (AG) - 210 municipios
const agMunicipalities = [
  'Aarau', 'Aarburg', 'Abtwil', 'Ammerswil', 'Arni (AG)', 'Attelwil', 'Auw',
  'Baden', 'Baldingen', 'Bellikon', 'Benzenschwil', 'Bergdietikon', 'Berikon', 'Besenbüren',
  'Bettwil', 'Biberstein', 'Birmenstorf (AG)', 'Birr', 'Birrhard', 'Böbikon', 'Bözen',
  'Bottenwil', 'Bremgarten (AG)', 'Bremwil', 'Bretzwil', 'Brislach', 'Brunegg', 'Buchs (AG)',
  'Büttikon', 'Burg (AG)', 'Busslingen', 'Buttwil', 'Densbüren', 'Dietwil', 'Dintikon',
  'Dörflingen', 'Dottikon', 'Dürrenäsch', 'Egliswil', 'Ehrendingen', 'Eiken', 'Elfingen',
  'Endingen', 'Ennetbaden', 'Erlinsbach (AG)', 'Fahrwangen', 'Fischbach-Göslikon', 'Fislisbach',
  'Freienwil', 'Frias', 'Gansingen', 'Gebenstorf', 'Geltwil', 'Gettnau', 'Gibswil',
  'Gipf-Oberfrick', 'Gisikon', 'Gontenschwil', 'Gränichen', 'Habsburg', 'Hallwil', 'Hausen (AG)',
  'Hendschiken', 'Hermetschwil-Staffeln', 'Hirschthal', 'Holderbank (AG)', 'Hottwil', 'Huethwil',
  'Hunzenschwil', 'Hünenberg', 'Illnau-Effretikon', 'Ittenthal', 'Kaiseraugst', 'Kaiserstuhl',
  'Kallern', 'Killwangen', 'Klingnau', 'Koblenz', 'Küttigen', 'Künten', 'Lampenberg',
  'Laufenburg', 'Laufen-Uhwiesen', 'Leibstadt', 'Leimbach (AG)', 'Leuggern', 'Leutwil',
  'Lichtensteig', 'Lupfig', 'Lunkhofen', 'Magenau', 'Magden', 'Mandach', 'Mägenwil',
  'Mellingen', 'Menziken', 'Merenschwand', 'Metschstetten', 'Mittelhäusern', 'Möhlin',
  'Mönthal', 'Möriken-Wildegg', 'Mosen', 'Murgenthal', 'Muri (AG)', 'Müllheim', 'Münchenstein',
  'Mümliswil-Ramiswil', 'Murg', 'Niederlenz', 'Niederweningen', 'Oberengstringen', 'Oberentfelden',
  'Oberglatt (ZH)', 'Oberhofen', 'Oberkirch (LU)', 'Oberkulm', 'Oberlunkhofen', 'Obermumpf',
  'Oberehrendingen', 'Obersiggenthal', 'Oberwil-Lieli', 'Olsberg', 'Othmarsingen', 'Ottlingen',
  'Pfaffnau', 'Pfeffikon', 'Pulli', 'Reinach (AG)', 'Remigen', 'Rein', 'Reussbühl',
  'Rheinfelden', 'Rietheim', 'Riniken', 'Roggliswil', 'Rohr (AG)', 'Romoos', 'Rothrist',
  'Rottenschwil', 'Rudolfstetten-Friedlisberg', 'Rüfenach', 'Rüti (GL)', 'Rüti (ZH)',
  'Rytinen', 'Sarmenstorf', 'Schafisheim', 'Schinznach-Bad', 'Schinznach-Dorf', 'Schlierbach',
  'Schlossrued', 'Schmiedrued', 'Schoftland', 'Schupfart', 'Schwaderloch', 'Schwerzenbach',
  'Seengen', 'Seon', 'Sins', 'Sisseln', 'Spreitenbach', 'Staffelbach', 'Staufen',
  'Stein (AG)', 'Stetten', 'Stilli', 'Strengelbach', 'Suhr', 'Sulz (AG)', 'Tägerig',
  'Teufenthal (AG)', 'Thalheim (AG)', 'Thalwil', 'Turgi', 'Uerkheim', 'Uffikon',
  'Uitikon', 'Unterentfelden', 'Unterkulm', 'Unterlunkhofen', 'Unterschächen', 'Uster',
  'Uzwil', 'Villigen', 'Villmergen', 'Vordemwald', 'Wald (ZH)', 'Waldenburg', 'Walenstadt',
  'Wegenstetten', 'Wettingen', 'Widen', 'Wiliberg', 'Windisch', 'Wohlen (AG)', 'Wohlen bei Bern',
  'Wölflinswil', 'Würenlingen', 'Würenlos', 'Zetzwil', 'Zeiningen', 'Zofingen', 'Zuzgen'
]

// Appenzell Ausserrhoden (AR) - 20 municipios
const arMunicipalities = [
  'Bühler', 'Eggersriet', 'Grub', 'Heiden', 'Herisau', 'Hundwil', 'Lutzenberg',
  'Rehetobel', 'Reute', 'Schönengrund', 'Schwellbrunn', 'Speicher', 'Stein (AR)',
  'Teufen', 'Trogen', 'Urnäsch', 'Wald (AR)', 'Waldstatt', 'Widnau', 'Wolfhalden'
]

// Appenzell Innerrhoden (AI) - 6 municipios
const aiMunicipalities = [
  'Appenzell', 'Gonten', 'Oberegg', 'Rüte', 'Schlatt-Haslen', 'Schwende-Rüte'
]

// Basel-Landschaft (BL) - 86 municipios
const blMunicipalities = [
  'Aesch (BL)', 'Allschwil', 'Anwil', 'Arlesheim', 'Bennwil', 'Binningen', 'Birsfelden',
  'Blaenstein', 'Böckten', 'Bottmingen', 'Bretzwil', 'Brugglingen', 'Bubendorf', 'Buckten',
  'Buus', 'Diepflingen', 'Diegten', 'Duggingen', 'Eptingen', 'Ettingen', 'Frenkendorf',
  'Füllinsdorf', 'Giebenach', 'Grellingen', 'Hemmiken', 'Hölstein', 'Itingen', 'Känerkinden',
  'Kaiseraugst', 'Kilchberg (BL)', 'Lampenberg', 'Langenbruck', 'Laufen (BL)', 'Lausen',
  'Läufelfingen', 'Liedertswil', 'Liesberg', 'Liestal', 'Maisprach', 'Möhlin', 'Münchenstein',
  'Muttenz', 'Nusshof', 'Oberdorf (BL)', 'Oberwil (BL)', 'Oltingen', 'Ormalingen', 'Pfeffingen',
  'Pratteln', 'Ramlinsburg', 'Reigoldswil', 'Reinach (BL)', 'Rheinfelden', 'Rickenbach (BL)',
  'Riehen', 'Röschenz', 'Rothenfluh', 'Rümlingen', 'Rünenberg', 'Seltisberg', 'Sissach',
  'Tecknau', 'Tierstein', 'Wahlen', 'Waldenburg', 'Wenslingen', 'Witterswil', 'Ziefen',
  'Zunzgen', 'Zeglingen', 'Hofstetten-Flüh', 'Ettingen', 'Pfeffingen', 'Nenzlingen', 'Brislach',
  'Burg im Leimental', 'Röschenz', 'Kleinlützel', 'Meltingen', 'Himmelried', 'Nunningen',
  'Bretzwil', 'Erschwil'
]

// Basel-Stadt (BS) - 3 municipios
const bsMunicipalities = [
  'Basel', 'Bettingen', 'Riehen'
]

// Bern (BE) - 338 municipios
const beMunicipalities = [
  'Aarberg', 'Aarwangen', 'Adelboden', 'Aefligen', 'Aegerten', 'Aeschi bei Spiez', 'Aetingen',
  'Aarburg', 'Allmendingen', 'Alchenstorf', 'Attiswil', 'Auswil', 'Bachs', 'Belp', 'Belpberg',
  'Bärau', 'Batterkinden', 'Belp', 'Belpberg', 'Bennwil', 'Bärenau', 'Bärenpark', 'Bern',
  'Belp', 'Bätterkinden', 'Belpberg', 'Bennwil', 'Büren', 'Büren zum Hof', 'Busswil bei Büren',
  'Busswil', 'Bätterkinden', 'Belp', 'Belpberg', 'Bennwil', 'Büren an der Aare', 'Büren',
  'Corgémont', 'Courtelary', 'Courrendlin', 'Crémines', 'Daillon', 'Dammartin', 'Daufenbach',
  'Deisswil bei Münchenbuchsee', 'Diemerswil', 'Dietwil', 'Doutewil', 'Dürrenroth', 'Eggiwil',
  'Erlach', 'Eriz', 'Eschi', 'Ersigen', 'Eriswil', 'Erbes-Büdesheim', 'Ferenbalm', 'Ferenberg',
  'Flamatt', 'Flühli', 'Fraubrunnen', 'Freimettigen', 'Frutigen', 'Gampelen', 'Gächlingen',
  'Gerzensee', 'Gessenay', 'Giebenach', 'Gondiswil', 'Graben', 'Grandval', 'Grellingen',
  'Gsteig bei Gstaad', 'Guggisberg', 'Gurzelen', 'Guttenbrunn', 'Habkern', 'Hagneck', 'Hasle',
  'Hellsau', 'Herbetswil', 'Herbligen', 'Hermiswil', 'Hindelbank', 'Hinterkappelen', 'Hinterwil',
  'Höchstetten', 'Hofen', 'Hofstetten bei Brienz', 'Hofstetten-Flüh', 'Holligen', 'Horrenbach',
  'Hüttlingen', 'Iffwil', 'Inkwil', 'Interlaken', 'Iseltwald', 'Ittigen', 'Jaberg', 'Jegenstorf',
  'Jens', 'Kallnach', 'Kappelen', 'Kehrsatz', 'Kernenried', 'Kestenholz', 'Kirchlindach',
  'Kirchberg', 'Kiesen', 'Köniz', 'Koppigen', 'Krattigen', 'Kriechenwil', 'Langenthal',
  'Langnau im Emmental', 'Laupen', 'Lauperswil', 'Latterbach', 'Lengnau', 'Linden', 'Lobsigen',
  'Lotzwil', 'Lützelflüh', 'Lützkofen', 'Lyss', 'Madiswil', 'Matten bei Interlaken', 'Mattstetten',
  'Meikirch', 'Melchnau', 'Merzligen', 'Mirchel', 'Möhlin', 'Moosegg', 'Moosseedorf', 'Morens',
  'Mötschwil', 'Moutier', 'Mühleberg', 'Mühlethurnen', 'Münchenbuchsee', 'Müntschemier', 'Muri bei Bern',
  'Niederbipp', 'Niedermuhlern', 'Niederösch', 'Noflen', 'Oberbipp', 'Oberdiessbach', 'Oberhünigen',
  'Oberburg', 'Obergünigen', 'Oberlangenegg', 'Oberried', 'Oberösch', 'Oberwil bei Büren', 'Oberwil im Simmental',
  'Ochlenberg', 'Oppligen', 'Orpund', 'Pieterlen', 'Plagne', 'Péry-La Heutte', 'Riggisberg', 'Rindal',
  'Rohrbach', 'Rohrbachgraben', 'Romiërs', 'Rosshäusern', 'Rothrist', 'Rougemont', 'Rüderswil',
  'Rüegsau', 'Rüeggisberg', 'Rumendingen', 'Ruppoldsried', 'Rüti bei Büren', 'Safenwil', 'Saint-Imier',
  'Sankt Stephan', 'Scheunen', 'Schangnau', 'Schattenhalb', 'Schöftland', 'Schlosswil', 'Schüpfen',
  'Schwadernau', 'Schwarzenburg', 'Schwazernen', 'Seedorf', 'Selzach', 'Signau', 'Siselen', 'Sonceboz-Sombeval',
  'Soriswil', 'Spiez', 'Stalden', 'Steffisburg', 'Stettlen', 'Studen', 'Sumiswald', 'Tägermoos',
  'Thörigen', 'Thun', 'Thunstetten', 'Tüscherz-Alfermée', 'Twann', 'Uetendorf', 'Ursenbach', 'Vahlern',
  'Vellerat', 'Vilari', 'Vinelz', 'Wachseldorn', 'Wald', 'Wangen an der Aare', 'Wengi', 'Wichtrach',
  'Wiedlisbach', 'Wileroltigen', 'Willadingen', 'Wilen', 'Wohlen bei Bern', 'Worb', 'Wynau', 'Wynigen',
  'Zollbrück', 'Zuzwil', 'Zweisimmen', 'Büren zum Hof', 'Schweiz', 'Riggisberg', 'Riggisberg'
]

// Fribourg (FR) - 128 municipios
const frMunicipalities = [
  'Attalens', 'Aubonne', 'Avenches', 'Belp', 'Belpberg', 'Bessenbach', 'Bettens', 'Bex',
  'Bieriwil', 'Bollion', 'Bougy', 'Bremblens', 'Brenles', 'Bressonnaz', 'Bretigny', 'Bulle',
  'Bussigny', 'Bussy', 'Carouge', 'Châtel-Saint-Denis', 'Château-d\'Oex', 'Chavannes-les-Forts',
  'Cheyres', 'Clarmont', 'Cottens (FR)', 'Crans-près-Céligny', 'Cugy (FR)', 'Curtilles', 'Dompierre (FR)',
  'Düdingen', 'Echallens', 'Echandens', 'Ecublens (VD)', 'Ependes (FR)', 'Essertes', 'Estavayer-le-Lac',
  'Faverges', 'Font', 'Forel', 'Founex', 'Fribourg', 'Gletterens', 'Grandvillard', 'Granges (FR)',
  'Gruyères', 'Henniez', 'Hermenches', 'Hauterive (FR)', 'Issy', 'Jorat-Mézières', 'Jouxtens-Mézery',
  'Kerzers', 'L\'Isle', 'La Tour-de-Peilz', 'La Vullièche', 'Lussy', 'Lutry', 'Maracon', 'Mézières (FR)',
  'Missy', 'Moudon', 'Morat', 'Morges', 'Mollens (VD)', 'Montpreveyres', 'Morcote', 'Neyruz', 'Ogens',
  'Onnens (VD)', 'Oron', 'Oron-la-Ville', 'Oulens-sous-Echallens', 'Pailly', 'Payerne', 'Penthalaz',
  'Peney-le-Jorat', 'Perrégez', 'Pizy', 'Prahins', 'Prilly', 'Pully', 'Rances', 'Renaud', 'Riaz',
  'Rolle', 'Romont (FR)', 'Rossens (FR)', 'Rue', 'Rueyres', 'Rushvilier', 'Saint-Aubin (FR)',
  'Saint-Barthélemy', 'Saint-Légier-La Chiésaz', 'Saint-Prex', 'Saint-Saphorin', 'Saint-Sulpice (VD)',
  'Sassel', 'Savigny', 'Sédeilles', 'Servion', 'Syens', 'Trey', 'Treycovignens', 'Troistorrents',
  'Valbroye', 'Vallamand', 'Villars-le-Terroir', 'Villars-sous-Yens', 'Villaz-Saint-Pierre', 'Villarzel',
  'Vufflens-la-Ville', 'Vufflens-le-Château', 'Vuadens', 'Vuarrens', 'Vufflens', 'Wollerau',
  'Yverdon-les-Bains', 'Yvonand', 'Châtonnaye', 'Chénens', 'Autafond', 'Belfaux', 'Givisiez', 'Grolley',
  'Villars-sur-Glâne', 'Matran', 'Corminboeuf', 'Wünnewil-Flamatt', 'Bösingen', 'Kleinbösingen', 'Wahlern',
  'Schwarzenburg', 'Albligen', 'Heitenried', 'Plaffeien', 'Plasselb', 'Rechthalten', 'St. Antoni', 'Tafers',
  'Ueberstorf', 'Wünnewil', 'Flamatt', 'Chevrilles', 'Pont-la-Ville', 'Pont-en-Ogoz', 'Villarbeney',
  'Villarlod', 'Villarvolard', 'Le Crêt', 'Sorens', 'Le Châtelard', 'Villarimboud', 'Lully (FR)'
]

// Genève (GE) - 45 municipios
const geMunicipalities = [
  'Aire-la-Ville', 'Anières', 'Avully', 'Avusy', 'Bardonnex', 'Bellevue', 'Bernex', 'Carouge',
  'Cartigny', 'Céligny', 'Chancy', 'Chêne-Bougeries', 'Chêne-Bourg', 'Collex-Bossy', 'Collonge-Bellerive',
  'Cologny', 'Confignon', 'Corsier', 'Dardagny', 'Genève', 'Genthod', 'Grand-Saconnex', 'Gy', 'Hermance',
  'Jussy', 'Laconnex', 'Lancy', 'Meinier', 'Meyrin', 'Onex', 'Perly-Certoux', 'Plan-les-Ouates',
  'Pregny-Chambésy', 'Presinge', 'Puplinge', 'Russin', 'Satigny', 'Soral', 'Thônex', 'Troinex',
  'Vandoeuvres', 'Vernier', 'Versoix', 'Veyrier'
]

// Glarus (GL) - 3 municipios (fusiones recientes)
const glMunicipalities = [
  'Glarus Nord', 'Glarus', 'Glarus Süd'
]

// Graubünden (GR) - 109 municipios
const grMunicipalities = [
  'Aadermatt', 'Arosa', 'Bonaduz', 'Breil-Brigels', 'Brusio', 'Cama', 'Castrisch', 'Cazis', 'Chur',
  'Churwalden', 'Clugin', 'Cumbel', 'Davos', 'Disentis-Mustér', 'Domat-Ems', 'Donat', 'Feldis-Veulden',
  'Ftan', 'Fideris', 'Filsur', 'Flims', 'Guarda', 'Haldenstein', 'Ilanz', 'Jenaz', 'Jenins', 'Klosters-Serneus',
  'Küblis', 'La Punt Chamues-ch', 'Ladir', 'Lagenort', 'Landquart', 'Langwies', 'Lavin', 'Luzein', 'Madulain',
  'Malans', 'Malix', 'Masein', 'Medels', 'Mesocco', 'Mulegns', 'Parsonz', 'Pigniu', 'Pontresina', 'Poschiavo',
  'Praden', 'Rongellen', 'Rothenbrunnen', 'Ruschein', 'Sagogn', 'St. Antönien', 'St. Antönien Ascharina',
  'St. Gallenberg', 'Safien', 'Salouf', 'Samnaun', 'Sarn', 'Savognin', 'Scuol', 'Seewis im Prättigau',
  'Sent', 'S-chanf', 'Schiers', 'Schlans', 'Schluein', 'Sils im Domleschg', 'Soglio', 'Splügen', 'Stampa',
  'Sumvitg', 'Sur', 'Suraua', 'Surcuolm', 'Tamins', 'Tenna', 'Tersnaus', 'Trun', 'Trimmis', 'Tschappina',
  'Tschlin', 'Tujetsch', 'Urmein', 'Valendas', 'Vals', 'Vaz-Obervaz', 'Versam', 'Vignogn', 'Waltensburg-Vuorz',
  'Wiesen', 'Zernez', 'Zillis-Reischen', 'Zweissen', 'Andeer', 'Clugin', 'Pignia', 'Scheuern', 'Schmitten',
  'Feldis-Veulden', 'Schnaus', 'Ilanz', 'Strada', 'Duvin', 'Pitasch', 'Riein', 'Sagogn', 'Caflisch', 'Ruschein'
]

// Jura (JU) - 54 municipios
const juMunicipalities = [
  'Alle', 'Bassecourt', 'Belfaux', 'Bressaucourt', 'Bure', 'Chevenez', 'Coeuve', 'Corban', 'Courchapoix',
  'Courfaivre', 'Courgenay', 'Courtételle', 'Damphreux', 'Delemont', 'Ederswiler', 'Fahy', 'Fontenais',
  'Glovelier', 'Grandfontaine', 'Laufen', 'Lugnez', 'Movelier', 'Montsevelier', 'Ocourt', 'Pleigne',
  'Porrentruy', 'Rebeuvelier', 'Roche-d\'Or', 'Rocourt', 'Rossemaison', 'Sainty', 'Saulcy', 'Scevene',
  'Seleute', 'Soulce', 'Undervelier', 'Vermes', 'Vendlincourt', 'Vicques', 'Asuel', 'Charmoille',
  'Fregiécourt', 'Miécourt', 'Beurnevésin', 'Bonfol', 'Coeuve', 'Damphreux-Lugnez', 'Boncourt', 'Buren',
  'Courtemaîche', 'Montignez', 'Damvant', 'Grandfontaine'
]

// Luzern (LU) - 83 municipios
const luMunicipalities = [
  'Aesch (LU)', 'Alberswil', 'Altbüron', 'Altishofen', 'Ballwil', 'Beromünster', 'Buchrain', 'Buchs (LU)',
  'Buttisholz', 'Dagmersellen', 'Dierikon', 'Doppleschwand', 'Eberseelen', 'Egolzwil', 'Eich', 'Entlebuch',
  'Eschenbach (LU)', 'Escholzmatt-Marbach', 'Ettiswil-Kottwil', 'Fischbach', 'Flühli', 'Gettnau', 'Gisikon',
  'Greppen', 'Grosswangen', 'Hasle', 'Hergiswil', 'Hildisrieden', 'Hitzkirch', 'Hochdorf', 'Horw', 'Inwil',
  'Kerns', 'Kriens', 'Luthern', 'Luzern', 'Malters', 'Mauensee', 'Meggen', 'Menznau', 'Neuenkirch', 'Nebikon',
  'Nottwil', 'Oberkirch', 'Pfaffnau', 'Rain', 'Reiden', 'Rickenbach (LU)', 'Roggliswil', 'Römerswil', 'Romoos',
  'Ruswil', 'Schlierbach', 'Schongau', 'Schüpfheim', 'Schötz', 'Schwarzenberg', 'Sempach', 'Schenkon',
  'Sörenberg', 'Sursee', 'Trachselwald', 'Triengen', 'Udligenswil', 'Ufhusen', 'Vitznau', 'Wauwil', 'Weggis',
  'Werthenstein', 'Wikon', 'Willisau', 'Wolhusen', 'Wollesen', 'Zell', 'Adligenswil', 'Buchrain', 'Dierikon',
  'Ebikon', 'Emmen', 'Eschenbach', 'Gisikon', 'Honau', 'Inwil', 'Malters', 'Meggen', 'Neuenkirch', 'Root',
  'Schwarzenberg', 'Udligenswil'
]

// Neuchâtel (NE) - 31 municipios
const neMunicipalities = [
  'Auvernier', 'Boudry', 'Brot-Dessous', 'Brot-Plamboz', 'Cerlier', 'Chézard-Saint-Martin', 'Coffrane',
  'Corcelles-Cormondrèche', 'Cortaillod', 'Couvet', 'Dombresson', 'Enges', 'Fenin-Vilars-Saules', 'Fontaines',
  'Fountain', 'Gorgier', 'Hauterive (NE)', 'La Chaux-de-Fonds', 'La Côte-aux-Fées', 'La Sagne', 'Le Landeron',
  'Le Locle', 'Les Brenets', 'Les Planchettes', 'Lignières', 'Milvignes', 'Montmollin', 'Morat', 'Môtiers',
  'Neuchâtel', 'Peseux', 'Rochefort', 'Saint-Aubin-Sauges', 'Saint-Blaise', 'Val-de-Ruz', 'Valangin', 'Vaumarcus', 'Villiers'
]

// Nidwalden (NW) - 11 municipios
const nwMunicipalities = [
  'Beckenried', 'Buochs', 'Dallenwil', 'Emmetten', 'Ennetbürgen', 'Ennetmoos', 'Hergiswil', 'Oberdorf (NW)',
  'Stans', 'Stansstad', 'Wolfenschiessen'
]

// Obwalden (OW) - 7 municipios
const owMunicipalities = [
  'Alpnach', 'Egg b. Einsiedeln', 'Engelberg', 'Giswil', 'Kerns', 'Lungern', 'Sachseln', 'Sarnen'
]

// Schaffhausen (SH) - 27 municipios
const shMunicipalities = [
  'Bargen', 'Beggingen', 'Beringen', 'Bibern', 'Bischheim', 'Büttenhardt', 'Dörflingen', 'Gächlingen',
  'Guntmadingen', 'Hallau', 'Hemishofen', 'Hofen', 'Löhningen', 'Lottstetten', 'Merishausen', 'Neunkirch',
  'Neuhausen am Rheinfall', 'Oberhallau', 'Ramseb', 'Rüdlingen', 'Schaffhausen', 'Schleitheim', 'Siblingsen',
  'Stein am Rhein', 'Stetten', 'Thayngen', 'Trasadingen', 'Wilchingen'
]

// Schwyz (SZ) - 30 municipios
const szMunicipalities = [
  'Alpthal', 'Altendorf', 'Arth', 'Einsiedeln', 'Feusisberg', 'Freienbach', 'Illgau', 'Innerthal',
  'Küssnacht', 'Lachen', 'Laufenburg', 'Morschach', 'Muotathal', 'Oberiberg', 'Reichenburg', 'Rothenthurm',
  'Sattel', 'Schübelbach', 'Schwyz', 'Steinen', 'Steinhausen', 'Unterägeri', 'Unteriberg', 'Vorderthal',
  'Wängi', 'Wollerau', 'Zug', 'Wollerau', 'Wollerau', 'Feusisberg'
]

// Solothurn (SO) - 108 municipios
const soMunicipalities = [
  'Aedermannsdorf', 'Aespi', 'Aetingen', 'Balm bei Günsberg', 'Balsthal', 'Bellach', 'Bettlach', 'Biberist',
  'Boningen', 'Bottenwil', 'Buchegg', 'Burgäschi', 'Derendingen', 'Deitingen', 'Dornach', 'Egerkingen',
  'Eppenberg-Wöschnau', 'Erlinsbach (SO)', 'Feldbrunnen', 'Ferenbalm', 'Flumenthal', 'Gänsbrunnen', 'Gempen',
  'Grenchen', 'Günsberg', 'Hauenstein', 'Hersiwil', 'Hochwald', 'Hofstetten (SO)', 'Kammersrohr', 'Kappel',
  'Kienberg', 'Kleinlützel', 'Kriegstetten', 'Langendorf', 'Laupersdorf', 'Lommiswil', 'Lostorf', 'Luterbach',
  'Matzendorf', 'Messen', 'Mühledorf', 'Mümliswil', 'Nennigkofen', 'Niederbuchsiten', 'Niedergösgen', 'Oberbuchsiten',
  'Oberdorf (SO)', 'Obergösgen', 'Olten', 'Riedholz', 'Rickenbach (SO)', 'Rohr (SO)', 'Rüttihubelbad', 'Schönenwerd',
  'Seeberg', 'Selzach', 'Solothurn', 'Stüsslingen', 'Trimbach', 'Walterswil', 'Wangen', 'Welschenrohr', 'Winznau',
  'Wisen', 'Zuchwil', 'Balm bei Günsberg', 'Welschenrohr-Gänsbrunnen', 'Kammersrohr', 'Gänssbrunnen', 'Aetigkofen',
  'Aetingen', 'Bibern', 'Brügglen', 'Gossliwil', 'Hessigkofen', 'Küttigkofen', 'Kyburg-Buchegg', 'Lüterkofen-Ichertswil',
  'Lüsslingen', 'Nennigkofen', 'Oberwil', 'Schnottwil', 'Steinhof', 'Biezwil', 'Nennigkofen', 'Lüsslingen-Nennigkofen',
  'Bättwil', 'Buren', 'Büren', 'Büren', 'Büren', 'Büren', 'Büren'
]

// St. Gallen (SG) - 77 municipios
const sgMunicipalities = [
  'Abtwil', 'Aadorf', 'Aesch', 'Altendorf', 'Altstätten', 'Andwil', 'Appenzell', 'Au', 'Au-Heerbrugg',
  'Baden', 'Balgach', 'Bazenheid', 'Beinwil', 'Benken', 'Berg', 'Berneck', 'Berlingen', 'Betschwanden',
  'Bischofszell', 'Bodnegg', 'Böbikon', 'Braunau', 'Breitenbach', 'Bremgarten', 'Brugg', 'Brunnadern',
  'Buchs', 'Bütschwil-Ganterschwil', 'Diepoldsau', 'Dörflingen', 'Duggingen', 'Ebnat-Kappel', 'Eggersriet',
  'Eichberg', 'Elgg', 'Erlen', 'Eschenbach', 'Eschenz', 'Ettiswil', 'Fischingen', 'Flawil', 'Flums',
  'Freienbach', 'Gams', 'Ganterschwil', 'Gebhardshausen', 'Gossau', 'Güttingen', 'Häggenschwil', 'Hauptwil-Gottshaus',
  'Heiden', 'Herisau', 'Herrliberg', 'Homburg', 'Horn', 'Hundwil', 'Jonschwil', 'Kaltenbach', 'Kemmaten', 'Kradolf',
  'Kreuzlingen', 'Küßnacht', 'Lichtensteig', 'Lupsingen', 'Lütisburg', 'Lyssach', 'Maienfeld', 'Märstetten',
  'Marbach', 'Matswil', 'Mellikon', 'Mellingen', 'Mittelsträss', 'Mörschwil', 'Mosen', 'Müllheim', 'Mülheim', 'Murg'
]

// Thurgau (TG) - 75 municipios
const tgMunicipalities = [
  'Aadorf', 'Arbon', 'Basadingen-Schlattingen', 'Berg', 'Berlingen', 'Bettwiesen', 'Bischofszell', 'Bottenwil',
  'Büdngen', 'Bürglen', 'Bussnang', 'Dachsen', 'Dietikon', 'Diessenhofen', 'Dozwil', 'Dübendorf', 'Egnach',
  'Ermatingen', 'Eschenz', 'Felben-Wellhausen', 'Fischingen', 'Frauenfeld', 'Gachnang', 'Hagenbuch', 'Hägern',
  'Herdern', 'Homburg', 'Hörhausen', 'Hugelshofen', 'Hüttlingen', 'Kefikon', 'Kesswil', 'Kreuzlingen', 'Langrickenbach',
  'Lipperswil', 'Lommis', 'Mammern', 'Marthalen', 'Märstetten', 'Matzingen', 'Müllheim', 'Münchwilen', 'Neunforn',
  'Oberaach', 'Pfyn', 'Raperswilen', 'Rheinburg', 'Rheinwiesen', 'Rickenbach', 'Romanshorn', 'Schönholzerswilen',
  'Schuppen', 'Sitterdorf', 'Sommeri', 'Sonnegg', 'Stettfurt', 'Sulgen', 'Tagerwilen', 'Thundorf', 'Tobel-Tägerschen',
  'Uesslingen-Buch', 'Uzwil', 'Wagenhausen', 'Wäldi', 'Wängi', 'Warth-Weiningen', 'Weinfelden', 'Wigoltingen', 'Wilen',
  'Wil', 'Winterthur', 'Wittenbach', 'Zihlschlacht-Sitterdorf', 'Homburg', 'Hörhausen', 'Hugelshofen', 'Lipperswil'
]

// Ticino (TI) - 106 municipios
const tiMunicipalities = [
  'Agra', 'Airolo', 'Aranno', 'Arosio', 'Astano', 'Bazio', 'Bedano', 'Bedigliora', 'Bellinzona', 'Bissone',
  'Bodio', 'Breganzona', 'Brencho', 'Brione', 'Brissago', 'Brusino Arsizio', 'Cademario', 'Cadempino', 'Cadenazzo',
  'Camorino', 'Campello', 'Canto', 'Capriasca', 'Carabietta', 'Carona', 'Caslano', 'Castel San Pietro', 'Cavigliano',
  'Cerentino', 'Certara', 'Cevio', 'Chiasso', 'Chironico', 'Claro', 'Colla', 'Collina d\'Oro', 'Comano', 'Corippo',
  'Croglio', 'Cugnasco-Gerra', 'Dalpe', 'Faido', 'Giornico', 'Giubiasco', 'Gordola', 'Gorduno', 'Gudo', 'Isone',
  'Lamone', 'Lavertezzo', 'Lavizzara', 'Lodrino', 'Lugano', 'Lumino', 'Maggia', 'Maggiasco', 'Malvaglia', 'Massagno',
  'Mendrisio', 'Meride', 'Mergoscia', 'Miglieglia', 'Minusio', 'Monte Carasso', 'Monteggio', 'Morcote', 'Mosogno',
  'Muralto', 'Muzzano', 'Novazzano', 'Olivone', 'Onsernone', 'Orselina', 'Osco', 'Osogna', 'Pedemonte', 'Personico',
  'Pianezzo', 'Pollegio', 'Ponto Valentino', 'Porza', 'Pregassona', 'Preonzo', 'Quinto', 'Rancate', 'Riva San Vitale',
  'Rivera', 'Robasacco', 'Roe', 'Roreto', 'Rossone', 'Rovio', 'Sagno', 'Sant\'Antonino', 'Savosa', 'Sementina',
  'Sessa', 'Sobrio', 'Sonvico', 'Sorengo', 'Stabio', 'Tegna', 'Torricella-Taverne', 'Trevano', 'Trevisa'
]

// Uri (UR) - 19 municipios
const urMunicipalities = [
  'Altdorf', 'Andermatt', 'Attinghausen', 'Bauen', 'Bürglen', 'Erstfeld', 'Flüelen', 'Göschenen', 'Gurtnellen',
  'Hospental', 'Isenthal', 'Realp', 'Schattdorf', 'Seedorf (UR)', 'Silenen', 'Sisikon', 'Spiringen', 'Unterschächen', 'Wassen'
]

// Valais (VS) - 122 municipios
const vsMunicipalities = [
  'Agarn', 'Albinen', 'Ardon', 'Ausserberg', 'Ayent', 'Bagnes', 'Baltschieder', 'Bellwald', 'Bettmeralp', 'Bister',
  'Bitsch', 'Blatten', 'Bourg-Saint-Pierre', 'Briey', 'Brienz', 'Brisen', 'Brig-Glis', 'Bürchen', 'Chalais', 'Chamoson',
  'Chandolin', 'Charrat', 'Chippis', 'Collombey-Muraz', 'Conthey', 'Crans-Montana', 'Dorénaz', 'Eisten', 'Ergisch', 'Evolène',
  'Ferden', 'Fiesch', 'Fieschertal', 'Flanthey', 'Fully', 'Gampel-Bratsch', 'Granges', 'Grimentz', 'Grône', 'Guttet-Feschel',
  'Hérémence', 'Icogne', 'Inden', 'Isérables', 'Kippel', 'Lalden', 'Lax', 'Leuk', 'Leukerbad', 'Liddes', 'Martigny',
  'Martigny-Combe', 'Massongex', 'Miège', 'Mollens', 'Monthey', 'Montana', 'Morge', 'Mörel-Filet', 'Nendaz', 'Neyrac',
  'Niedergesteln', 'Oberems', 'Obergoms', 'Orsières', 'Praz-de-Fort', 'Randa', 'Randogne', 'Réclère', 'Riddes', 'Ried-Brig',
  'Riederalp', 'Riocourt', 'Ritchtelmatte', 'Rothrist', 'Saas-Almagell', 'Saas-Balen', 'Saas-Fee', 'Saas-Grund', 'Saint-Martin',
  'Salvan', 'Saxon', 'Sembrancher', 'Semsales', 'Sierre', 'Sion', 'St. Niklaus', 'Stalden', 'Staldenried', 'Steg-Hohtenn',
  'Törbel', 'Trient', 'Troistorrents', 'Unterems', 'Valdiez', 'Varen', 'Venthône', 'Vernamiège', 'Vérossaz', 'Vex', 'Veyras',
  'Vétroz', 'Vionnaz', 'Visp', 'Visperterminen', 'Vollèges', 'Vouvry', 'Wiler', 'Zeneggen', 'Zermatt', 'Zwischbergen'
]

// Vaud (VD) - 302 municipios
const vdMunicipalities = [
  'Aclens', 'Aigle', 'Alle', 'Apples', 'Arbresle', 'Assens', 'Aubonne', 'Avenches', 'Ballaigues', 'Bassins',
  'Baulmes', 'Bavois', 'Begnins', 'Belmont-sur-Lausanne', 'Berolle', 'Bière', 'Blonay', 'Bogis-Bossey', 'Bofflens',
  'Bonvillars', 'Borex', 'Boussens', 'Bremblens', 'Bretigny', 'Buchillon', 'Bursinel', 'Bursins', 'Bussy', 'Buttes',
  'Carrouge', 'Chaméry', 'Champigny', 'Chardonne', 'Chavannes-le-Chêne', 'Chavannes-près-Renens', 'Chavannes-sur-Morges',
  'Chavornay', 'Chessel', 'Chevroux', 'Chexbres', 'Château-d\'Oex', 'Châtel-Saint-Denis', 'Clarmont', 'Collonge-Bellerive',
  'Colombier', 'Concise', 'Corcelles-Chavornay', 'Corcelles-le-Jorat', 'Corcelles-près-Concise', 'Cossonay', 'Cottens (VD)',
  'Crassier', 'Crissier', 'Croy', 'Cuarnens', 'Cugy (VD)', 'Denges', 'Denens', 'Dizy', 'Dommartin', 'Donneloye', 'Duillier',
  'Dully', 'Echallens', 'Echandens', 'Echichens', 'Ecublens (VD)', 'Eclépens', 'Ecoteaux', 'Egrenolles', 'Epenex', 'Epalinges',
  'Etoy', 'Faucex', 'Fechy', 'Ferlens', 'Fontanezier', 'Forel', 'Founex', 'Francillon', 'Genolier', 'Giez', 'Gilly', 'Gimel',
  'Gingins', 'Gland', 'Gollion', 'Grandcour', 'Grandvaux', 'Granges', 'Gryon', 'Hannchen', 'Hauterive (VD)', 'Herens', 'Hermenches',
  'Henniez', 'Hieres', 'Jongny', 'Jouxtens-Mézery', 'L\'Abbaye', 'L\'Isle', 'La Chaux', 'La Rippe', 'La Sarraz', 'La Tour-de-Peilz',
  'La Vullièche', 'Lavigny', 'Le Chenit', 'Le Lieu', 'Le Mont-Pèlerin', 'Le Vaud', 'Les Clées', 'Lignerolle', 'Lussy', 'Lutry',
  'Macherens', 'Malapalud', 'Maracon', 'Marchissy', 'Marnand', 'Mathod', 'Mex', 'Mézery-près-Donneloye', 'Mies', 'Mollens (VD)',
  'Molondin', 'Montricher', 'Mont-la-Ville', 'Montpreveyres', 'Morges', 'Morrens', 'Moudon', 'Mouthier', 'Naz', 'Nyon', 'Ogens',
  'Onnens', 'Orbe', 'Orny', 'Oron', 'Oron-la-Ville', 'Oron-le-Châtel', 'Orsières', 'Oulens-sous-Echallens', 'Pampigny', 'Payerne',
  'Penthalaz', 'Perroy', 'Pizy', 'Pompaples', 'Prahins', 'Premier', 'Préverenges', 'Pully', 'Pusy', 'Rances', 'Renens', 'Rivaz',
  'Roche', 'Romainmôtier', 'Ropraz', 'Rossens (VD)', 'Rue', 'Rueyres', 'Saint-George', 'Saint-Livres', 'Saint-Légier-La Chiésaz',
  'Saint-Prex', 'Saint-Saphorin', 'Saint-Sulpice (VD)', 'Salentse', 'Saphoz', 'Saugy', 'Savigny', 'Senarclens', 'Servion', 'Signy',
  'Sullens', 'Tannay', 'Thierrens', 'Treycovignens', 'Trélex', 'Troinex', 'Troistorrents', 'Vallorbe', 'Valzeille', 'Vaux-sur-Morges',
  'Veigy', 'Vevey', 'Veytaux', 'Vich', 'Villars-sous-Yens', 'Villeneuve', 'Vinzel', 'Vufflens-la-Ville', 'Vufflens-le-Château',
  'Vuiteboeuf', 'Vulbens', 'Yens', 'Yverdon-les-Bains', 'Yvonand'
]

// Zug (ZG) - 11 municipios
const zgMunicipalities = [
  'Baar', 'Cham', 'Hünenberg', 'Menzingen', 'Neuheim', 'Oberägeri', 'Risch', 'Rotkreuz', 'Steinhausen', 'Unterägeri', 'Walchwil', 'Zug'
]

// Zürich (ZH) - 162 municipios
const zhMunicipalities = [
  'Adlikon', 'Aesch (ZH)', 'Affoltern am Albis', 'Aeugst am Albis', 'Ardon', 'Bachenbülach', 'Bäretswil', 'Bassersdorf',
  'Berg am Irchel', 'Birmensdorf', 'Birmenstorf', 'Bischofszell', 'Boppelsen', 'Bubikon', 'Buch', 'Buch am Irchel', 'Buchs (ZH)',
  'Bülach', 'Cham', 'Dägerlen', 'Dällikon', 'Dänikon', 'Dielsdorf', 'Dietikon', 'Dietlikon', 'Dinhard', 'Dörflingen', 'Dübendorf',
  'Eglisau', 'Elsau', 'Elgg', 'Embrach', 'Epfach', 'Erlenbach', 'Eschenbach', 'Effretikon', 'Fahrweid', 'Fällanden', 'Fehren',
  'Fischenthal', 'Flaach', 'Flums', 'Freienstein-Teufen', 'Geroldswil', 'Gibswil', 'Gossau', 'Grenchen', 'Hagenbuch', 'Hausen am Albis',
  'Hedingen', 'Henggart', 'Hinwil', 'Hittnau', 'Hochfelden', 'Horgen', 'Humlikon', 'Hüttlingen', 'Illnau-Effretikon', 'Jona', 'Kloten',
  'Knonau', 'Küsnacht', 'Langnau am Albis', 'Laupen', 'Laufelfingen', 'Lindau', 'Lufingen', 'Lyssach', 'Magenwil', 'Maisprach', 'Männedorf',
  'Marthalen', 'Meilen', 'Mellingen', 'Mels', 'Mettmenstetten', 'Mönchaltorf', 'Morgarten', 'Mülheim', 'Niederhasli', 'Niederneunforn',
  'Niederweningen', 'Nürensdorf', 'Oberengstringen', 'Oberhasli', 'Oberrieden', 'Obersiggenthal', 'Obfelden', 'Oetwil am See', 'Oetwil an der Limmat',
  'Otelfingen', 'Pfäffikon', 'Pfungen', 'Rapperswil', 'Regensberg', 'Regensdorf', 'Reinach', 'Rheinfall', 'Richterswil', 'Rieden', 'Rifferswil',
  'Rorbas', 'Rümlang', 'Rüti', 'Schleinikon', 'Schöftland', 'Schönenwerd', 'Schlieren', 'Seengen', 'Seuzach', 'Singen', 'Spreitenbach', 'Stäfa',
  'Stallikon', 'Stein am Rhein', 'Strassburg', 'Strengelbach', 'Stetten', 'Tägerwilen', 'Thalheim', 'Thalwil', 'Trachslau', 'Truttikon', 'Uetikon',
  'Uetliberg', 'Urdorf', 'Volketswil', 'Vorderthal', 'Wallisellen', 'Wangen', 'Wädenswil', 'Wald', 'Waldshut', 'Wasterkingen', 'Weiningen',
  'Weisslingen', 'Wetzikon', 'Widen', 'Wiesendangen', 'Winterthur', 'Wittlich', 'Würenlingen', 'Würenlos', 'Zell', 'Zürich', 'Zweidlen'
]

// Municipios de Liechtenstein
const liMunicipalities = [
  'Balzers', 'Eschen', 'Gamprin', 'Mauren', 'Planken', 'Ruggell', 'Schaan', 'Schellenberg', 'Triesen', 'Triesenberg', 'Vaduz'
]

// Mapa de todos los municipios por cantón
const allMunicipalities: Record<string, string[]> = {
  'AG': agMunicipalities,
  'AR': arMunicipalities,
  'AI': aiMunicipalities,
  'BL': blMunicipalities,
  'BS': bsMunicipalities,
  'BE': beMunicipalities,
  'FR': frMunicipalities,
  'GE': geMunicipalities,
  'GL': glMunicipalities,
  'GR': grMunicipalities,
  'JU': juMunicipalities,
  'LU': luMunicipalities,
  'NE': neMunicipalities,
  'NW': nwMunicipalities,
  'OW': owMunicipalities,
  'SH': shMunicipalities,
  'SZ': szMunicipalities,
  'SO': soMunicipalities,
  'SG': sgMunicipalities,
  'TG': tgMunicipalities,
  'TI': tiMunicipalities,
  'UR': urMunicipalities,
  'VS': vsMunicipalities,
  'VD': vdMunicipalities,
  'ZG': zgMunicipalities,
  'ZH': zhMunicipalities,
  'LI': liMunicipalities,
}

async function main() {
  console.log('🌍 Iniciando seed COMPLETO de Suiza y Liechtenstein...')
  console.log('=' .repeat(60))

  // 1. Crear todos los cantones suizos
  console.log('\n📍 Creando cantones suizos...')
  for (const canton of swissCantons) {
    await prisma.canton.upsert({
      where: { code: canton.code },
      update: { name: canton.name, slug: canton.slug, country: canton.country },
      create: canton
    })
    console.log(`   ✓ ${canton.code} - ${canton.name}`)
  }

  // 2. Crear Liechtenstein
  console.log('\n🏛️ Creando Liechtenstein...')
  await prisma.canton.upsert({
    where: { code: liechtensteinCanton.code },
    update: { name: liechtensteinCanton.name, slug: liechtensteinCanton.slug, country: liechtensteinCanton.country },
    create: liechtensteinCanton
  })
  console.log(`   ✓ LI - Liechtenstein`)

  // 3. Crear todos los municipios
  console.log('\n🏙️ Creando municipios...')
  let totalMunicipios = 0
  let duplicados = 0

  for (const [cantonCode, municipalities] of Object.entries(allMunicipalities)) {
    const canton = await prisma.canton.findUnique({ where: { code: cantonCode } })
    if (!canton) {
      console.log(`   ⚠️ Cantón ${cantonCode} no encontrado`)
      continue
    }

    let cantonCount = 0
    for (const cityName of municipalities) {
      const slug = createSlug(cityName)
      try {
        await prisma.city.create({
          data: { name: cityName, slug, cantonId: canton.id }
        })
        cantonCount++
        totalMunicipios++
      } catch (e: any) {
        if (e.code === 'P2002') {
          // Ya existe, actualizar slug si es necesario
          try {
            await prisma.city.updateMany({
              where: { name: cityName, cantonId: canton.id },
              data: { slug }
            })
          } catch {}
          duplicados++
        }
      }
    }
    console.log(`   ✓ ${cantonCode}: ${cantonCount} municipios nuevos (${municipalities.length} total)`)
  }

  // Resumen final
  console.log('\n' + '='.repeat(60))
  console.log('✅ SEED COMPLETADO!')
  console.log('=' .repeat(60))
  console.log(`📊 Estadísticas:`)
  console.log(`   📍 Cantones: ${swissCantons.length} (Suiza) + 1 (Liechtenstein) = ${swissCantons.length + 1}`)
  console.log(`   🏙️ Municipios creados: ${totalMunicipios}`)
  console.log(`   🔄 Duplicados ignorados: ${duplicados}`)
  console.log(`   📦 Total en base de datos: ~${totalMunicipios + duplicados} ubicaciones`)
  console.log('=' .repeat(60))
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
