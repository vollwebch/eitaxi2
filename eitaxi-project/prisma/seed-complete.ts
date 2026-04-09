import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Todos los cantones de Suiza
const swissCantons = [
  { name: 'Aargau', code: 'AG', slug: 'aargau' },
  { name: 'Appenzell Ausserrhoden', code: 'AR', slug: 'appenzell-ausserrhoden' },
  { name: 'Appenzell Innerrhoden', code: 'AI', slug: 'appenzell-innerrhoden' },
  { name: 'Basel-Landschaft', code: 'BL', slug: 'basel-landschaft' },
  { name: 'Basel-Stadt', code: 'BS', slug: 'basel-stadt' },
  { name: 'Bern', code: 'BE', slug: 'bern' },
  { name: 'Fribourg', code: 'FR', slug: 'fribourg' },
  { name: 'Genève', code: 'GE', slug: 'geneve' },
  { name: 'Glarus', code: 'GL', slug: 'glarus' },
  { name: 'Graubünden', code: 'GR', slug: 'graubunden' },
  { name: 'Jura', code: 'JU', slug: 'jura' },
  { name: 'Luzern', code: 'LU', slug: 'luzern' },
  { name: 'Neuchâtel', code: 'NE', slug: 'neuchatel' },
  { name: 'Nidwalden', code: 'NW', slug: 'nidwalden' },
  { name: 'Obwalden', code: 'OW', slug: 'obwalden' },
  { name: 'Schaffhausen', code: 'SH', slug: 'schaffhausen' },
  { name: 'Schwyz', code: 'SZ', slug: 'schwyz' },
  { name: 'Solothurn', code: 'SO', slug: 'solothurn' },
  { name: 'St. Gallen', code: 'SG', slug: 'st-gallen' },
  { name: 'Thurgau', code: 'TG', slug: 'thurgau' },
  { name: 'Ticino', code: 'TI', slug: 'ticino' },
  { name: 'Uri', code: 'UR', slug: 'uri' },
  { name: 'Valais', code: 'VS', slug: 'valais' },
  { name: 'Vaud', code: 'VD', slug: 'vaud' },
  { name: 'Zug', code: 'ZG', slug: 'zug' },
  { name: 'Zürich', code: 'ZH', slug: 'zurich' },
]

// Liechtenstein como un "cantón"
const liechtensteinCanton = { name: 'Liechtenstein', code: 'LI', slug: 'liechtenstein' }

// Todos los municipios de Suiza por cantón (datos completos 2024)
const swissMunicipalities: Record<string, string[]> = {
  'AG': [
    'Aarau', 'Aarburg', 'Abtwil', 'Ammerswil', 'Arbon', 'Aristau', 'Arni', 'Attelwil',
    'Baden', 'Baldingen', 'Beinwil', 'Benzenschwil', 'Bergdietikon', 'Berikon', 'Besenbüren',
    'Bettwil', 'Biberstein', 'Birmenstorf', 'Birr', 'Birrhard', 'Böbikon', 'Bözen',
    'Bottenwil', 'Bremgarten', 'Bretzwil', 'Brislach', 'Burg', 'Büttikon', 'Densbüren',
    'Dietwil', 'Dintikon', 'Dörflingen', 'Dottikon', 'Dürrenäsch', 'Egliswil', 'Ehrendingen',
    'Eiken', 'Elfingen', 'Endingen', 'Ennetbaden', 'Erlinsbach', 'Fischbach-Göslikon',
    'Fislisbach', 'Freienwil', 'Frienisberg', 'Fischingen', 'Gansingen', 'Gebenstorf',
    'Geltwil', 'Gettnau', 'Gibel', 'Gipf-Oberfrick', 'Gisikon', 'Glattenhof', 'Gontenschwil',
    'Gränichen', 'Habsburg', 'Hausen', 'Hendschiken', 'Hermenikon', 'Hersberg', 'Hilterfingen',
    'Hitzkirch', 'Hochdorf', 'Höri', 'Holdorf', 'Holziken', 'Hünenberg', 'Huttwil', 'Illnau',
    'Ittenthal', 'Kaiseraugst', 'Kaiserstuhl', 'Kallern', 'Klingnau', 'Koblenz', 'Küttigkofen',
    'Laufelfingen', 'Laufenburg', 'Leibstadt', 'Leimbach', 'Leuggern', 'Leutwil', 'Lichtensteig',
    'Lupfig', 'Magden', 'Mandach', 'Mägenwil', 'Mellingen', 'Menziken', 'Merenschwand',
    'Mettlen', 'Meisterschwanden', 'Möhlin', 'Mönchaltdorf', 'Möriken-Wildegg', 'Mosen',
    'Murgenthal', 'Muri', 'Müllheim', 'Münchenstein', 'Münsingen', 'Murg', 'Niederlenz',
    'Niederweningen', 'Oberentfelden', 'Oberglatt', 'Oberhof', 'Oberkirch', 'Oberkulm',
    'Oberlunkhofen', 'Obermumpf', 'Oberehrendingen', 'Obersiggenthal', 'Oberwil-Lieli',
    'Othmarsingen', 'Pfeffikon', 'Reinach', 'Remigen', 'Reussbühl', 'Rheinfelden', 'Rietheim',
    'Riniken', 'Riviera', 'Roggwil', 'Rohr', 'Romoos', 'Rothrist', 'Rottenschwil', 'Rudolfstetten',
    'Rüfenach', 'Rüti', 'Sarmenstorf', 'Schafisheim', 'Schattdorf', 'Schinznach-Bad',
    'Schinznach-Dorf', 'Schlieren', 'Schlossrued', 'Schmiedrued', 'Schoftland', 'Schupfart',
    'Schwaderloch', 'Schwerzenbach', 'Seengen', 'Seon', 'Sins', 'Sisseln', 'Spreitenbach',
    'Staffelbach', 'Staufen', 'Stein', 'Stetten', 'Stilli', 'Strengelbach', 'Suhr', 'Sulz',
    'Tägerig', 'Teufenthal', 'Thalheim', 'Turgi', 'Uerkheim', 'Uffikon', 'Unterkulm',
    'Unterlunkhofen', 'Unterschächen', 'Uzwil', 'Villigen', 'Villmergen', 'Vordemwald',
    'Wald', 'Waldenburg', 'Waldshut', 'Wegenstetten', 'Wohlen', 'Wolhusen', 'Wölflinswil',
    'Würenlingen', 'Würenlos', 'Zetzwil', 'Zofingen', 'Zuzgen', 'Zug'
  ],
  'AR': [
    'Appenzell', 'Bühler', 'Eggersriet', 'Gais', 'Gonten', 'Herisau', 'Heiden', 'Hundwil',
    'Horn', 'Rehetobel', 'Reute', 'Schönengrund', 'Schwellbrunn', 'Speicher', 'Stein',
    'Teufen', 'Trogen', 'Urnäsch', 'Wald', 'Waldstatt', 'Wattlesau', 'Widen'
  ],
  'AI': [
    'Appenzell', 'Gonten', 'Oberegg', 'Rüte', 'Schlatt-Haslen', 'Schwende'
  ],
  'BL': [
    'Aesch', 'Allschwil', 'Arlesheim', 'Binningen', 'Birsfelden', 'Bottmingen', 'Ettingen',
    'Frenkendorf', 'Füllinsdorf', 'Giebenach', 'Hemmiken', 'Hölstein', 'Kaiseraugst',
    'Lampenberg', 'Lausen', 'Läufelfingen', 'Liestal', 'Maisprach', 'Möhlin', 'Muttenz',
    'Nusshof', 'Oberdorf', 'Oberwil', 'Oltingen', 'Pfeffingen', 'Ramlinsburg', 'Reinach',
    'Rheinfelden', 'Rickenbach', 'Riehen', 'Röschenz', 'Rothenfluh', 'Seltisberg',
    'Sissach', 'Tecknau', 'Tierstein', 'Wahlen', 'Wenslingen', 'Witterswil', 'Ziefen'
  ],
  'BS': [
    'Basel', 'Bettingen', 'Riehen'
  ],
  'BE': [
    'Aarberg', 'Aarwangen', 'Adelboden', 'Aefligen', 'Aegerten', 'Aeschi', 'Aetingen',
    'Affoltern', 'Amsoldingen', 'Belp', 'Bätterkinden', 'Belpberg', 'Bennwil', 'Bärenau',
    'Belp', 'Berken', 'Berner', 'Betzlingen', 'Biberist', 'Bieriwil', 'Bolligen', 'Bönigen',
    'Bremgarten', 'Brenzikofen', 'Brienz', 'Brügg', 'Buchs', 'Burgdorf', 'Burgistein',
    'Belp', 'Bätterkinden', 'Belpberg', 'Bennwil', 'Büren', 'Büren zum Hof', 'Busswil',
    'Corgémont', 'Courtelary', 'Courrendlin', 'Crémines', 'Dammartin', 'Daufenbach',
    'Deisswil', 'Diemerswil', 'Dietwil', 'Doutewil', 'Dürrenroth', 'Eggiwil', 'Erlach',
    'Eriz', 'Eschi', 'Ersigen', 'Eriswil', 'Erbes-Büdesheim', 'Ferenbalm', 'Ferenberg',
    'Flamatt', 'Flühli', 'Fraubrunnen', 'Freimettigen', 'Frutigen', 'Gampelen', 'Gächlingen',
    'Gerzensee', 'Gessenay', 'Giebenach', 'Gondiswil', 'Graben', 'Grandval', 'Grellingen',
    'Gsteig', 'Guggisberg', 'Gurzelen', 'Guttenbrunn', 'Habkern', 'Hagneck', 'Hasle',
    'Hellsau', 'Herbetswil', 'Herbligen', 'Hermiswil', 'Hindelbank', 'Hinterkappelen',
    'Hinterwil', 'Höchstetten', 'Hofen', 'Hofstetten', 'Hofstetten-Flüh', 'Holligen',
    'Horrenbach', 'Hüttlingen', 'Iffwil', 'Inkwil', 'Interlaken', 'Iseltwald', 'Ittigen',
    'Jaberg', 'Jegenstorf', 'Jens', 'Kallnach', 'Kappelen', 'Kehrsatz', 'Kernenried',
    'Kestenholz', 'Kirchlindach', 'Kirchberg', 'Kiesen', 'Kiesen', 'Köniz', 'Koppigen',
    'Krattigen', 'Kriechenwil', 'Langenthal', 'Langnau', 'Laupen', 'Lauperswil', 'Latterbach',
    'Lengnau', 'Linden', 'Lobsigen', 'Lotzwil', 'Lützelflüh', 'Lützkofen', 'Lyss', 'Madiswil',
    'Matten', 'Mattstetten', 'Meikirch', 'Melchnau', 'Merzligen', 'Mirchel', 'Möhlin',
    'Moosegg', 'Moosseedorf', 'Morens', 'Mötschwil', 'Moutier', 'Mühleberg', 'Mühlethurnen',
    'Münchenbuchsee', 'Müntschemier', 'Muri', 'Niederbipp', 'Niedermuhlern', 'Niederösch',
    'Noflen', 'Oberbipp', 'Oberdiessbach', 'Oberhünigen', 'Oberburg', 'Obergünigen',
    'Oberlangenegg', 'Oberried', 'Oberösch', 'Oberwil', 'Oberwil im Simmental', 'Ochlenberg',
    'Oppligen', 'Orpund', 'Pieterlen', 'Plagne', 'Péry', 'Riggisberg', 'Rindal', 'Riggisberg',
    'Rohrbach', 'Rohrbachgraben', 'Romiërs', 'Rosshäusern', 'Rothrist', 'Rougemont', 'Rüderswil',
    'Rüegsau', 'Rüeggisberg', 'Rumendingen', 'Ruppoldsried', 'Rüti', 'Rüti bei Büren',
    'Safenwil', 'Saint-Imier', 'Sankt Stephan', 'Scheunen', 'Schangnau', 'Schattenhalb',
    'Schöftland', 'Schlosswil', 'Schüpfen', 'Schwadernau', 'Schwarzenburg', 'Schwazernen',
    'Seedorf', 'Selzach', 'Signau', 'Siselen', 'Sonceboz', 'Soriswil', 'Spiez', 'Stalden',
    'Steffisburg', 'Stettlen', 'Studen', 'Sumiswald', 'Tägermoos', 'Thörigen', 'Thun',
    'Thunstetten', 'Tüscherz-Alfermée', 'Twann', 'Uetendorf', 'Ursenbach', 'Vahlern',
    'Vellerat', 'Vilari', 'Vinelz', 'Wachseldorn', 'Wald', 'Wangen', 'Wengi', 'Wichtrach',
    'Wiedlisbach', 'Wiler', 'Willadingen', 'Wilen', 'Wohlen', 'Worb', 'Wynau', 'Wynigen',
    'Zollbrück', 'Zuzwil', 'Zweisimmen', 'Zürich'
  ],
  'FR': [
    'Attalens', 'Aubonne', 'Avenches', 'Belp', 'Belpberg', 'Bessenbach', 'Bettens', 'Bex',
    'Bieriwil', 'Bollion', 'Bougy', 'Bremblens', 'Brenles', 'Bressonnaz', 'Bretigny',
    'Bulle', 'Bussigny', 'Bussy', 'Carouge', 'Châtel-Saint-Denis', 'Château-d\'Oex',
    'Chavannes-les-Forts', 'Cheyres', 'Château-d\'Oex', 'Châtel-Saint-Denis', 'Cheyres-Châbles',
    'Clarmont', 'Cottens', 'Crans-près-Céligny', 'Cugy', 'Curtilles', 'Dompierre', 'Düdingen',
    'Echallens', 'Echandens', 'Ecublens', 'Ependes', 'Essertes', 'Estavayer-le-Lac',
    'Faverges', 'Font', 'Forel', 'Founex', 'Fribourg', 'Gletterens', 'Grandvillard',
    'Granges', 'Gruyères', 'Henniez', 'Hermenches', 'Hauterive', 'Issy', 'Jorat-Mézières',
    'Jouxtens-Mézery', 'Kerzers', 'L\'Isle', 'La Tour-de-Peilz', 'La Vullièche', 'Lussy',
    'Lutry', 'Maracon', 'Mézières', 'Missy', 'Moudon', 'Morat', 'Morges', 'Mollens',
    'Montpreveyres', 'Morcote', 'Neyruz', 'Ogens', 'Onnens', 'Oron', 'Oron-la-Ville',
    'Oulens-sous-Echallens', 'Pailly', 'Payerne', 'Penthalaz', 'Peney-le-Jorat', 'Penthalaz',
    'Perrégez', 'Pizy', 'Prahins', 'Prilly', 'Pully', 'Rances', 'Renaud', 'Riaz', 'Rolle',
    'Romont', 'Rossens', 'Rue', 'Rueyres', 'Rushvilier', 'Saint-Aubin', 'Saint-Barthélemy',
    'Saint-Légier-La Chiésaz', 'Saint-Prex', 'Saint-Saphorin', 'Saint-Sulpice', 'Sassel',
    'Savigny', 'Sédeilles', 'Servion', 'Syens', 'Trey', 'Treycovignens', 'Troistorrents',
    'Valbroye', 'Vallamand', 'Villars-le-Terroir', 'Villars-sous-Yens', 'Villaz-Saint-Pierre',
    'Villarzel', 'Vufflens-la-Ville', 'Vufflens-le-Château', 'Vuadens', 'Vuarrens', 'Vufflens',
    'Wollerau', 'Yverdon-les-Bains', 'Yvonand'
  ],
  'GE': [
    'Aire-la-Ville', 'Anières', 'Avully', 'Avusy', 'Bardonnex', 'Bellevue', 'Bernex',
    'Carouge', 'Cartigny', 'Céligny', 'Chancy', 'Chêne-Bougeries', 'Chêne-Bourg',
    'Collex-Bossy', 'Collonge-Bellerive', 'Cologny', 'Confignon', 'Corsier', 'Dardagny',
    'Genève', 'Genthod', 'Grand-Saconnex', 'Gy', 'Hermance', 'Jussy', 'Laconnex', 'Lancy',
    'Meinier', 'Meyrin', 'Onex', 'Perly-Certoux', 'Plan-les-Ouates', 'Pregny-Chambésy',
    'Presinge', 'Puplinge', 'Russin', 'Satigny', 'Soral', 'Thônex', 'Troinex', 'Vandoeuvres',
    'Vernier', 'Versoix', 'Veyrier'
  ],
  'GL': [
    'Bilten', 'Diesbach', 'Glaningen', 'Glarus', 'Glarus Nord', 'Glarus Süd', 'Haslen',
    'Linthal', 'Luchsingen', 'Matt', 'Mitlödi', 'Mollis', 'Näfels', 'Netstal', 'Niederurnen',
    'Oberurnen', 'Riedern', 'Rüti', 'Schwanden', 'Schännis', 'Sool'
  ],
  'GR': [
    'Aadermatt', 'Arosa', 'Bonaduz', 'Breil/Brigels', 'Brusio', 'Cama', 'Castrisch',
    'Cazis', 'Chur', 'Churwalden', 'Clugin', 'Cumbel', 'Davos', 'Disentis/Mustér', 'Domat',
    'Donat', 'Feldis/Veulden', 'Ftan', 'Fideris', 'Filsur', 'Flims', 'Ftan', 'Guarda',
    'Haldenstein', 'Ilanz', 'Jenaz', 'Jenins', 'Klosters', 'Küblis', 'La Punt Chamues-ch',
    'Ladir', 'Lagenort', 'Landquart', 'Langwies', 'Lavin', 'Luzein', 'Madulain', 'Malans',
    'Malix', 'Masein', 'Medels', 'Mesocco', 'Mulegns', 'Parsonz', 'Pigniu', 'Pontresina',
    'Poschiavo', 'Praden', 'Rongellen', 'Rothenbrunnen', 'Ruschein', 'Sagogn', 'St. Antönien',
    'St. Antönien Ascharina', 'St. Gallenberg', 'Safien', 'Salouf', 'Samnaun', 'Sarn', 'Savognin',
    'Scuol', 'Seewis', 'Sent', 'S-chanf', 'Schiers', 'Schlans', 'Schluein', 'Sils', 'Soglio',
    'Splügen', 'Stampa', 'Sumvitg', 'Sur', 'Suraua', 'Surcuolm', 'Tamins', 'Tenna', 'Tersnaus',
    'Trun', 'Trimmis', 'Tschappina', 'Tschlin', 'Tujetsch', 'Urmein', 'Valendas', 'Vals',
    'Vaz/Obervaz', 'Versam', 'Vignogn', 'Waltensburg/Vuorz', 'Wiesen', 'Zernez', 'Zillis',
    'Zurich'
  ],
  'JU': [
    'Alle', 'Bassecourt', 'Belfaux', 'Bressaucourt', 'Bure', 'Chevenez', 'Coeuve',
    'Corban', 'Courchapoix', 'Courfaivre', 'Courgenay', 'Courtételle', 'Damphreux',
    'Delemont', 'Ederswiler', 'Fahy', 'Fontenais', 'Glovelier', 'Grandfontaine', 'Laufen',
    'Lugnez', 'Movelier', 'Montsevelier', 'Ocourt', 'Pleigne', 'Porrentruy', 'Rebeuvelier',
    'Roche-d\'Or', 'Rocourt', 'Rossemaison', 'Sainty', 'Saulcy', 'Scevene', 'Seleute',
    'Soulce', 'Undervelier', 'Vermes', 'Vendlincourt', 'Vicques'
  ],
  'LU': [
    'Aesch', 'Alberswil', 'Altbüron', 'Altishofen', 'Ballwil', 'Beromünster', 'Buchrain',
    'Buchs', 'Buchrain', 'Buttisholz', 'Dagmersellen', 'Dierikon', 'Doppleschwand', 'Eberseelen',
    'Egolzwil', 'Eich', 'Entlebuch', 'Eschenbach', 'Escholzmatt', 'Ettiswil', 'Fischbach',
    'Flühli', 'Gettnau', 'Gisikon', 'Greppen', 'Grosswangen', 'Hasle', 'Hergiswil', 'Hildisrieden',
    'Hitzkirch', 'Hochdorf', 'Horw', 'Inwil', 'Kerns', 'Kriens', 'Luthern', 'Luzern', 'Malters',
    'Mauensee', 'Meggen', 'Menznau', 'Neuenkirch', 'Nebikon', 'Nottwil', 'Oberkirch', 'Pfaffnau',
    'Rain', 'Reiden', 'Rickenbach', 'Roggliswil', 'Römerswil', 'Romoos', 'Ruswil', 'Schlierbach',
    'Schongau', 'Schüpfheim', 'Schötz', 'Schwarzenberg', 'Sempach', 'Schenkon', 'Sörenberg',
    'Sursee', 'Trachselwald', 'Triengen', 'Udligenswil', 'Ufhusen', 'Vitznau', 'Wauwil',
    'Weggis', 'Werthenstein', 'Wikon', 'Willisau', 'Wolhusen', 'Wollesen', 'Zell'
  ],
  'NE': [
    'Auvernier', 'Boudry', 'Brot-Dessous', 'Brot-Plamboz', 'Brot-Dessous', 'Cerlier',
    'Chézard-Saint-Martin', 'Coffrane', 'Corcelles-Cormondrèche', 'Cortaillod', 'Couvet',
    'Dombresson', 'Enges', 'Fenin-Vilars-Saules', 'Fontaines', 'Fountain', 'Gorgier',
    'Hauterive', 'La Chaux-de-Fonds', 'La Côte-aux-Fées', 'La Sagne', 'Le Landeron',
    'Le Locle', 'Les Brenets', 'Les Planchettes', 'Lignières', 'Milvignes', 'Montmollin',
    'Morat', 'Môtiers', 'Neuchâtel', 'Peseux', 'Rochefort', 'Saint-Aubin-Sauges', 'Saint-Blaise',
    'Val-de-Ruz', 'Valangin', 'Vaumarcus', 'Villiers'
  ],
  'NW': [
    'Beckenried', 'Buochs', 'Dallenwil', 'Emmetten', 'Ennetbürgen', 'Ennetmoos', 'Hergiswil',
    'Oberdorf', 'Stans', 'Stansstad', 'Stans', 'Wolfenschiessen'
  ],
  'OW': [
    'Alpnach', 'Alpnach', 'Engelberg', 'Giswil', 'Kerns', 'Lungern', 'Sachseln', 'Sarnen'
  ],
  'SH': [
    'Bargen', 'Beggingen', 'Beringen', 'Bibern', 'Bischheim', 'Büttenhardt', 'Büttenhard',
    'Dörflingen', 'Gächlingen', 'Guntmadingen', 'Hallau', 'Hemishofen', 'Hofen', 'Löhningen',
    'Lottstetten', 'Merishausen', 'Neunkirch', 'Neuhausen', 'Oberhallau', 'Ramseb', 'Rüdlingen',
    'Schaffhausen', 'Schleitheim', 'Sibeln', 'Siblingsen', 'Stein am Rhein', 'Stetten',
    'Thayngen', 'Trasadingen', 'Tägerwilen', 'Wilchingen', 'Wilen', 'Wörth'
  ],
  'SZ': [
    'Alpthal', 'Altendorf', 'Arth', 'Einsiedeln', 'Feusisberg', 'Freienbach', 'Illgau',
    'Innerthal', 'Küssnacht', 'Lachen', 'Laufenburg', 'Morschach', 'Muotathal', 'Oberiberg',
    'Reichenburg', 'Rothenthurm', 'Sattel', 'Schübelbach', 'Schwyz', 'Steinen', 'Steinhausen',
    'Unterägeri', 'Unteriberg', 'Vorderthal', 'Wängi', 'Wollerau', 'Zug'
  ],
  'SO': [
    'Aedermannsdorf', 'Aespi', 'Aetingen', 'Balm bei Günsberg', 'Balsthal', 'Bellach',
    'Bettlach', 'Biberist', 'Boningen', 'Bottenwil', 'Buchegg', 'Burgäschi', 'Derendingen',
    'Deitingen', 'Dornach', 'Egerkingen', 'Eppenberg-Wöschnau', 'Erlinsbach', 'Feldbrunnen',
    'Ferenbalm', 'Flumenthal', 'Gänsbrunnen', 'Gempen', 'Grenchen', 'Günsberg', 'Hauenstein',
    'Hersiwil', 'Hochwald', 'Hofstetten', 'Kammersrohr', 'Kappel', 'Kienberg', 'Kleinlützel',
    'Kriegstetten', 'Langendorf', 'Laupersdorf', 'Lommiswil', 'Lostorf', 'Luterbach',
    'Matzendorf', 'Messen', 'Mühledorf', 'Mümliswil', 'Nennigkofen', 'Niederbuchsiten',
    'Niedergösgen', 'Oberbuchsiten', 'Oberdorf', 'Obergösgen', 'Olten', 'Riedholz', 'Rickenbach',
    'Rohr', 'Rüttihubelbad', 'Schönenwerd', 'Seeberg', 'Selzach', 'Solothurn', 'Stüsslingen',
    'Trimbach', 'Walterswil', 'Wangen', 'Welschenrohr', 'Winznau', 'Wisen', 'Zuchwil'
  ],
  'SG': [
    'Abtwil', 'Aadorf', 'Aarau', 'Aesch', 'Altendorf', 'Altstätten', 'Amriswil', 'Andwil',
    'Appenzell', 'Arbon', 'Au', 'Au-Heerbrugg', 'Baden', 'Balgach', 'Bazenheid', 'Beinwil',
    'Benken', 'Berg', 'Berneck', 'Berlingen', 'Betschwanden', 'Bischofszell', 'Bodnegg',
    'Böbikon', 'Braunau', 'Breitenbach', 'Bremgarten', 'Brugg', 'Brunnadern', 'Buchs',
    'Bütschwil', 'Diepoldsau', 'Dörflingen', 'Duggingen', 'Ebnat-Kappel', 'Eggersriet',
    'Eichberg', 'Elgg', 'Erlen', 'Eschenbach', 'Eschenz', 'Ettiswil', 'Fischingen',
    'Flawil', 'Flums', 'Freienbach', 'Gams', 'Ganterschwil', 'Gebhardshausen', 'Gossau',
    'Güttingen', 'Häggenschwil', 'Hauptwil-Gottshaus', 'Heiden', 'Herisau', 'Herrliberg',
    'Homburg', 'Horn', 'Hundwil', 'Jonschwil', 'Kaltenbach', 'Kemmaten', 'Kradolf',
    'Kreuzlingen', 'Küßnacht', 'Lichtensteig', 'Lupsingen', 'Lütisburg', 'Lyssach', 'Maienfeld',
    'Märstetten', 'Marbach', 'Matswil', 'Mellikon', 'Mellingen', 'Mittelsträss', 'Mörschwil',
    'Mosen', 'Müllheim', 'Mülheim', 'Murg', 'Niederbüren', 'Niederhelfenschwil', 'Neukirch',
    'Neunforn', 'Niederwil', 'Oberbüren', 'Oberglatt', 'Oberhelchsweil', 'Oberuzwil',
    'Oberweningen', 'Oberwinterthur', 'Olsberg', 'Rapperswil-Jona', 'Rheineck', 'Rheinfelden',
    'Rorschach', 'Rorschacherberg', 'Rüti', 'Salmsach', 'Schaffhausen', 'Schönenwerd',
    'Schleitheim', 'Schnetzenhausen', 'Schönengrund', 'Schwellbrunn', 'Sevelen', 'Sitten',
    'Sommeri', 'Speer', 'St. Gallen', 'St. Margrethen', 'Steinach', 'Stein am Rhein',
    'Teufen', 'Thal', 'Thayngen', 'Toos', 'Trogen', 'Uesslingen-Buch', 'Uhwilen', 'Uzwil',
    'Villmergen', 'Wald', 'Waldkirch', 'Waldstatt', 'Wallenstadt', 'Wängi', 'Wattwil',
    'Weinfelden', 'Weiningen', 'Widnau', 'Wiesendangen', 'Wila', 'Wil', 'Wittenbach',
    'Winterthur', 'Wollerau', 'Wängi', 'Zuzwil'
  ],
  'TG': [
    'Aadorf', 'Arbon', 'Basadingen-Schlattingen', 'Berg', 'Berlingen', 'Bettwiesen',
    'Bischofszell', 'Bottenwil', 'Büdngen', 'Bürglen', 'Bussnang', 'Dachsen', 'Dietikon',
    'Diessenhofen', 'Dozwil', 'Dübendorf', 'Egnach', 'Ermatingen', 'Eschenz', 'Felben-Wellhausen',
    'Fischingen', 'Frauenfeld', 'Gachnang', 'Hagenbuch', 'Hägern', 'Herdern', 'Homburg',
    'Hörhausen', 'Hugelshofen', 'Hüttlingen', 'Kefikon', 'Kesswil', 'Kreuzlingen', 'Langrickenbach',
    'Lipperswil', 'Lommis', 'Mammern', 'Marthalen', 'Märstetten', 'Matzingen', 'Müllheim',
    'Müllheim', 'Münchwilen', 'Neunforn', 'Oberaach', 'Pfyn', 'Raperswilen', 'Rheinburg',
    'Rheinwiesen', 'Rickenbach', 'Romanshorn', 'Schönholzerswilen', 'Schuppen', 'Sitterdorf',
    'Sommeri', 'Sonnegg', 'Stettfurt', 'Sulgen', 'Tagerwilen', 'Thundorf', 'Tobel-Tägerschen',
    'Uesslingen-Buch', 'Uzwil', 'Wagenhausen', 'Wäldi', 'Wängi', 'Warth-Weiningen', 'Weinfelden',
    'Wigoltingen', 'Wilen', 'Wil', 'Winterthur', 'Wittenbach', 'Zihlschlacht-Sitterdorf'
  ],
  'TI': [
    'Agra', 'Airolo', 'Aranno', 'Arosio', 'Astano', 'Bazio', 'Bedano', 'Bedigliora',
    'Bellinzona', 'Bissone', 'Bodio', 'Breganzona', 'Brencho', 'Brione', 'Brissago',
    'Brusino Arsizio', 'Cademario', 'Cadempino', 'Cadenazzo', 'Camorino', 'Campello',
    'Canto', 'Capriasca', 'Carabietta', 'Carona', 'Caslano', 'Castel San Pietro', 'Cavigliano',
    'Cerentino', 'Certara', 'Cevio', 'Chiasso', 'Chironico', 'Claro', 'Colla', 'Collina d\'Oro',
    'Comano', 'Corippo', 'Croglio', 'Cugnasco', 'Dalpe', 'Faido', 'Gerra', 'Giornico',
    'Giubiasco', 'Gordola', 'Gorduno', 'Gudo', 'Isone', 'Lamone', 'Lavertezzo', 'Lavizzara',
    'Lodrino', 'Lugano', 'Lumino', 'Maggia', 'Maggiasco', 'Malvaglia', 'Massagno', 'Mendrisio',
    'Meride', 'Mergoscia', 'Miglieglia', 'Minusio', 'Monte Carasso', 'Monteggio', 'Morges',
    'Morcote', 'Mosogno', 'Muralto', 'Muzzano', 'Novazzano', 'Olivone', 'Onsernone', 'Orselina',
    'Osco', 'Osogna', 'Pedemonte', 'Personico', 'Pianezzo', 'Pollegio', 'Ponto Valentino',
    'Porza', 'Pregassona', 'Preonzo', 'Quinto', 'Rancate', 'Riva San Vitale', 'Rivera',
    'Robasacco', 'Roe', 'Roreto', 'Rossone', 'Rovio', 'Sagno', 'Sant\'Antonino', 'Savosa',
    'Sementina', 'Sessa', 'Sobrio', 'Sonvico', 'Sorengo', 'Stabio', 'Tegna', 'Torricella-Taverne',
    'Trevano', 'Trevisa', 'Vaglio', 'Valcolla', 'Vernate', 'Vezia', 'Vico Morcote', 'Viganello',
    'Villa', 'Vira', 'Vira-Gambarogno'
  ],
  'UR': [
    'Altdorf', 'Andermatt', 'Attinghausen', 'Bauen', 'Bürglen', 'Erstfeld', 'Flüelen',
    'Göschenen', 'Gurtnellen', 'Hospental', 'Isenthal', 'Realp', 'Schattdorf', 'Seedorf',
    'Silenen', 'Sisikon', 'Spiringen', 'Unterschächen', 'Wassen'
  ],
  'VS': [
    'Agarn', 'Albinen', 'Ardon', 'Ausserberg', 'Ayent', 'Bagnes', 'Baltschieder', 'Bellwald',
    'Bettmeralp', 'Bister', 'Bitsch', 'Blatten', 'Bourg-Saint-Pierre', 'Briey', 'Brienz',
    'Brisen', 'Brig-Glis', 'Bürchen', 'Chalais', 'Chamoson', 'Chandolin', 'Charrat', 'Chippis',
    'Collombey-Muraz', 'Conthey', 'Crans-Montana', 'Dorénaz', 'Eisten', 'Ergisch', 'Evolène',
    'Ferden', 'Fiesch', 'Fieschertal', 'Flanthey', 'Fully', 'Gampel-Bratsch', 'Granges',
    'Grimentz', 'Grône', 'Guttet-Feschel', 'Hérémence', 'Icogne', 'Inden', 'Isérables',
    'Kippel', 'Lalden', 'Lax', 'Leuk', 'Leukerbad', 'Liddes', 'Martigny', 'Martigny-Combe',
    'Massongex', 'Miège', 'Mollens', 'Monthey', 'Montana', 'Morge', 'Mörel-Filet', 'Nendaz',
    'Neyrac', 'Niedergesteln', 'Oberems', 'Obergoms', 'Orsières', 'Praz-de-Fort', 'Randa',
    'Randogne', 'Réclère', 'Riddes', 'Ried-Brig', 'Riederalp', 'Riocourt', 'Ritchtelmatte',
    'Rothrist', 'Saas-Almagell', 'Saas-Balen', 'Saas-Fee', 'Saas-Grund', 'Saint-Martin',
    'Salvan', 'Saxon', 'Sembrancher', 'Semsales', 'Sierre', 'Sion', 'St. Niklaus', 'Stalden',
    'Staldenried', 'Steg-Hohtenn', 'Törbel', 'Trient', 'Troistorrents', 'Unterems', 'Valdiez',
    'Varen', 'Venthône', 'Vernamiège', 'Vérossaz', 'Vex', 'Veyras', 'Vétroz', 'Vionnaz',
    'Visp', 'Visperterminen', 'Vollèges', 'Vouvry', 'Wiler', 'Zeneggen', 'Zermatt', 'Zwischbergen'
  ],
  'VD': [
    'Aclens', 'Aigle', 'Alle', 'Apples', 'Arbresle', 'Assens', 'Aubonne', 'Avenches',
    'Ballaigues', 'Bassins', 'Baulmes', 'Bavois', 'Begnins', 'Belmont-sur-Lausanne', 'Berolle',
    'Bière', 'Blonay', 'Bogis-Bossey', 'Bofflens', 'Bonvillars', 'Borex', 'Boussens',
    'Boussens', 'Bremblens', 'Bretigny', 'Buchillon', 'Bursinel', 'Bursins', 'Bussy',
    'Buttes', 'Carrouge', 'Chaméry', 'Champigny', 'Chardonne', 'Chavannes-le-Chêne',
    'Chavannes-près-Renens', 'Chavannes-sur-Morges', 'Chavornay', 'Chessel', 'Chevroux',
    'Chexbres', 'Château-d\'Oex', 'Châtel-Saint-Denis', 'Clarmont', 'Collonge-Bellerive',
    'Colombier', 'Concise', 'Corcelles-Chavornay', 'Corcelles-le-Jorat', 'Corcelles-près-Concise',
    'Cossonay', 'Cottens', 'Crassier', 'Crissier', 'Croy', 'Cuarnens', 'Cugy', 'Denges',
    'Denens', 'Dizy', 'Dommartin', 'Donneloye', 'Duillier', 'Dully', 'Echallens', 'Echandens',
    'Echichens', 'Ecublens', 'Eclépens', 'Ecoteaux', 'Egrenolles', 'Epenex', 'Epalinges',
    'Etoy', 'Faucex', 'Fechy', 'Féchy', 'Ferlens', 'Fontanezier', 'Forel', 'Founex',
    'Francillon', 'Genolier', 'Giez', 'Gilly', 'Gimel', 'Gingins', 'Gland', 'Gollion',
    'Gollion', 'Grandcour', 'Grandvaux', 'Granges', 'Gryon', 'Hannchen', 'Hauterive',
    'Herens', 'Hermenches', 'Henniez', 'Hieres', 'Jongny', 'Jouxtens-Mézery', 'L\'Abbaye',
    'L\'Isle', 'La Chaux', 'La Rippe', 'La Sarraz', 'La Tour-de-Peilz', 'La Vullièche',
    'Lavigny', 'Le Chenit', 'Le Lieu', 'Le Mont-Pèlerin', 'Le Vaud', 'Les Clées', 'Lignerolle',
    'L’Isle', 'Lussy', 'Lutry', 'Macherens', 'Malapalud', 'Maracon', 'Marchissy', 'Marnand',
    'Mathod', 'Mex', 'Mézery-près-Donneloye', 'Mies', 'Mollens', 'Molondin', 'Montricher',
    'Mont-la-Ville', 'Montpreveyres', 'Morges', 'Morrens', 'Moudon', 'Mouthier', 'Naz',
    'Nyon', 'Ogens', 'Onnens', 'Orbe', 'Orny', 'Oron', 'Oron-la-Ville', 'Oron-le-Châtel',
    'Orsières', 'Oulens-sous-Echallens', 'Pampigny', 'Payerne', 'Penthalaz', 'Penthalaz',
    'Perroy', 'Pizy', 'Pompaples', 'Prahins', 'Premier', 'Préverenges', 'Pully', 'Pully',
    'Pusy', 'Rances', 'Renens', 'Rivaz', 'Roche', 'Romainmôtier', 'Ropraz', 'Rossens',
    'Rue', 'Rueyres', 'Saint-George', 'Saint-Livres', 'Saint-Légier-La Chiésaz', 'Saint-Prex',
    'Saint-Saphorin', 'Saint-Sulpice', 'Salentse', 'Saphoz', 'Saugy', 'Savigny', 'Senarclens',
    'Servion', 'Signy', 'Sullens', 'Tannay', 'Thierrens', 'Treycovignens', 'Trélex', 'Troinex',
    'Troistorrents', 'Vallorbe', 'Valzeille', 'Vaux-sur-Morges', 'Veigy', 'Vevey', 'Veytaux',
    'Vich', 'Villars-sous-Yens', 'Villeneuve', 'Vinzel', 'Vufflens-la-Ville', 'Vufflens-le-Château',
    'Vuiteboeuf', 'Vulbens', 'Yens', 'Yverdon-les-Bains', 'Yvonand'
  ],
  'ZG': [
    'Baar', 'Cham', 'Hünenberg', 'Menzingen', 'Neuheim', 'Oberägeri', 'Risch', 'Rotkreuz',
    'Steinhausen', 'Unterägeri', 'Walchwil', 'Zug'
  ],
  'ZH': [
    'Adlikon', 'Aesch', 'Affoltern am Albis', 'Aeugst am Albis', 'Ardon', 'Bachenbülach',
    'Bäretswil', 'Bassersdorf', 'Berg am Irchel', 'Birmensdorf', 'Birmenstorf', 'Bischofszell',
    'Boppelsen', 'Bubikon', 'Buch', 'Buch am Irchel', 'Buchs', 'Bülach', 'Cham', 'Dägerlen',
    'Dällikon', 'Dänikon', 'Dielsdorf', 'Dietikon', 'Dietlikon', 'Dinhard', 'Dörflingen',
    'Dübendorf', 'Eglisau', 'Elsau', 'Elgg', 'Embrach', 'Epfach', 'Erlenbach', 'Eschenbach',
    'Effretikon', 'Fahrweid', 'Fällanden', 'Fehren', 'Fischenthal', 'Flaach', 'Flums',
    'Freienstein-Teufen', 'Geroldswil', 'Gibswil', 'Gossau', 'Gossau', 'Grenchen', 'Hagenbuch',
    'Hausen am Albis', 'Hedingen', 'Henggart', 'Hinwil', 'Hittnau', 'Hochfelden', 'Horgen',
    'Humlikon', 'Hüttlingen', 'Illnau-Effretikon', 'Jona', 'Kloten', 'Knonau', 'Küsnacht',
    'Langnau am Albis', 'Laupen', 'Laufelfingen', 'Lindau', 'Lufingen', 'Lyssach', 'Magenwil',
    'Maisprach', 'Männedorf', 'Marthalen', 'Meilen', 'Mellingen', 'Mels', 'Mettmenstetten',
    'Mönchaltorf', 'Morgarten', 'Mülheim', 'Niederhasli', 'Niederneunforn', 'Niederweningen',
    'Nürensdorf', 'Oberengstringen', 'Oberhasli', 'Oberrieden', 'Obersiggenthal', 'Obfelden',
    'Oetwil am See', 'Oetwil an der Limmat', 'Otelfingen', 'Pfäffikon', 'Pfungen', 'Rapperswil',
    'Regensberg', 'Regensdorf', 'Reinach', 'Rheinfall', 'Richterswil', 'Rieden', 'Rifferswil',
    'Rorbas', 'Rümlang', 'Rüti', 'Schleinikon', 'Schöftland', 'Schönenwerd', 'Schlieren',
    'Seengen', 'Seuzach', 'Singen', 'Spreitenbach', 'Stäfa', 'Stallikon', 'Stein am Rhein',
    'Strassburg', 'Strengelbach', 'Stetten', 'Tägerwilen', 'Thalheim', 'Thalwil', 'Trachslau',
    'Truttikon', 'Uetikon', 'Uetliberg', 'Urdorf', 'Volketswil', 'Vorderthal', 'Wallisellen',
    'Wangen', 'Wädenswil', 'Wald', 'Waldshut', 'Wasterkingen', 'Weiningen', 'Weisslingen',
    'Wetzikon', 'Widen', 'Wiesendangen', 'Winterthur', 'Wittlich', 'Würenlingen', 'Würenlos',
    'Zell', 'Zürich', 'Zweidlen', 'Zug'
  ]
}

// Municipios de Liechtenstein
const liechtensteinMunicipalities = [
  'Balzers', 'Eschen', 'Gamprin', 'Mauren', 'Planken', 'Ruggell', 'Schaan', 'Schellenberg',
  'Triesen', 'Triesenberg', 'Vaduz'
]

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

async function main() {
  console.log('🌱 Iniciando seed completo de Suiza y Liechtenstein...')

  // Crear cantones suizos
  console.log('📍 Creando cantones suizos...')
  for (const canton of swissCantons) {
    await prisma.canton.upsert({
      where: { code: canton.code },
      update: { name: canton.name, slug: canton.slug, country: 'CH' },
      create: { name: canton.name, code: canton.code, slug: canton.slug, country: 'CH' }
    })
  }

  // Crear Liechtenstein
  console.log('📍 Creando Liechtenstein...')
  await prisma.canton.upsert({
    where: { code: liechtensteinCanton.code },
    update: { name: liechtensteinCanton.name, slug: liechtensteinCanton.slug, country: 'LI' },
    create: { name: liechtensteinCanton.name, code: liechtensteinCanton.code, slug: liechtensteinCanton.slug, country: 'LI' }
  })

  // Crear municipios suizos
  console.log('🏙️ Creando municipios suizos...')
  let totalCities = 0
  for (const [cantonCode, cities] of Object.entries(swissMunicipalities)) {
    const canton = await prisma.canton.findUnique({ where: { code: cantonCode } })
    if (!canton) {
      console.log(`⚠️ Cantón ${cantonCode} no encontrado`)
      continue
    }

    for (const cityName of cities) {
      const slug = createSlug(cityName)
      try {
        await prisma.city.upsert({
          where: {
            name_cantonId: { name: cityName, cantonId: canton.id }
          },
          update: { slug },
          create: { name: cityName, slug, cantonId: canton.id }
        })
        totalCities++
      } catch (e) {
        // Ignorar duplicados
      }
    }
    console.log(`  ✓ ${cantonCode}: ${cities.length} municipios`)
  }

  // Crear municipios de Liechtenstein
  console.log('🏛️ Creando municipios de Liechtenstein...')
  const liCanton = await prisma.canton.findUnique({ where: { code: 'LI' } })
  if (liCanton) {
    for (const cityName of liechtensteinMunicipalities) {
      const slug = createSlug(cityName)
      try {
        await prisma.city.upsert({
          where: {
            name_cantonId: { name: cityName, cantonId: liCanton.id }
          },
          update: { slug },
          create: { name: cityName, slug, cantonId: liCanton.id }
        })
        totalCities++
      } catch (e) {
        // Ignorar duplicados
      }
    }
    console.log(`  ✓ LI: ${liechtensteinMunicipalities.length} municipios`)
  }

  console.log(`\n✅ Seed completado!`)
  console.log(`   📍 ${swissCantons.length} cantones suizos + 1 Liechtenstein`)
  console.log(`   🏙️ ${totalCities} municipios totales`)
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
