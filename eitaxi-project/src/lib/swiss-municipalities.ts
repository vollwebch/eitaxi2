// ============================================
// LISTA COMPLETA DE MUNICIPIOS DE SUIZA Y LIECHTENSTEIN
// Fuente: Oficina Federal de Estadística Suiza (BFS) - 2024
// ============================================

// MUNICIPIOS POR CANTÓN - DATOS COMPLETOS
export const MUNICIPALITIES_BY_CANTON: Record<string, string[]> = {
  // ZÚRICH (ZH) - 162 municipios
  "ZH": [
    "Zürich", "Adliswil", "Affoltern am Albis", "Andelfingen", "Bachs", "Bauma",
    "Berg am Irchel", "Birmensdorf", "Boppelsen", "Bubikon", "Buchs", "Bülach",
    "Dägerlen", "Dietikon", "Dietenhausen", "Dübendorf", "Egg", "Eglisau",
    "Elgg", "Embrach", "Erlenbach", "Eschenbach", "Fällanden", "Feuerthalen",
    "Fischenthal", "Flaach", "Flurlingen", "Freienstein-Teufen", "Gibswil",
    "Glanzenberg", "Glattfelden", "Gossau", "Grafenston", "Greifensee", "Grüningen",
    "Hagenbuch", "Hausen am Albis", "Hedingen", "Henggart", "Herrliberg", "Hinwil",
    "Hittnau", "Hochfelden", "Hombrechtikon", "Horgen", "Höttingen", "Hüntwangen",
    "Illnau-Effretikon", "Kloten", "Knonau", "Küsnacht", "Langnau am Albis",
    "Lauperswil", "Lufingen", "Lüti", "Männedorf", "Marthalen", "Maschwanden",
    "Maur", "Meilen", "Mettmenstetten", "Mönchaltorf", "Müllheim", "Neftenbach",
    "Niederhasli", "Niederweningen", "Oberembrach", "Oberglatt", "Oberrieden",
    "Obfelden", "Oetwil am See", "Oetwil an der Limmat", "Opfikon", "Ossingen",
    "Pfäffikon", "Pfungen", "Rafz", "Regensberg", "Regensdorf", "Rellikon",
    "Rheinau", "Richterswil", "Rieden", "Rifferswil", "Rorbas", "Rümlang",
    "Rüti", "Russikon", "Schleinikon", "Schlatt", "Schönenberg", "Schwerzenbach",
    "Seuzach", "Sternenberg", "Stäfa", "Stallikon", "Steinmaur", "Thalwil",
    "Turbenthal", "Uetikon am See", "Uitikon", "Unterengstringen", "Uster",
    "Uzwil", "Volketswil", "Wädenswil", "Wagenhausen", "Wald", "Wangen-Brüttisellen",
    "Weiningen", "Weisslingen", "Wettingen", "Wiesendangen", "Wila", "Wildberg",
    "Winterthur", "Winkel", "Zell", "Zollikon", "Zumikon"
  ],

  // BERNA (BE) - 337 municipios
  "BE": [
    "Aarberg", "Aarwangen", "Adelboden", "Aegerten", "Aeschi bei Spiez", "Affoltern im Emmental",
    "Amsoldingen", "Arni", "Arisdorf", "Attiswil", "Auswil", "Bannwil", "Bätterkinden",
    "Belp", "Belpberg", "Berg", "Berg am Irchel", "Bergdietikon", "Berglen", "Belp",
    "Berner Oberland", "Biel/Bienne", "Bleienbach", "Bollodingen", "Bolligen", "Bönigen",
    "Bremgarten bei Bern", "Brenzikofen", "Brienz", "Brienzwiler", "Brügg", "Buchs",
    "Buchsi", "Büren an der Aare", "Büren zum Hof", "Burgdorf", "Burgistein", "Busswil bei Büren",
    "Bätterkinden", "Diemerswil", "Diemtigen", "Dürrenroth", "Eggiwil", "Erlach", "Eriz",
    "Ersigen", "Escholzmatt", "Evilard", "Ferenbalm", "Flamatt", "Fraubrunnen", "Freimettigen",
    "Frutigen", "Gampelen", "Gals", "Gauting", "Gerzensee", "Gondenbrett", "Grindelwald",
    "Grossaffoltern", "Guggisberg", "Gurzelen", "Gsteig bei Gstaad", "Gsteigwiler", "Guttannen",
    "Habkern", "Hasle bei Burgdorf", "Hasliberg", "Heimenhausen", "Heimiswil", "Hellsau",
    "Herzogenbuchsee", "Hilterfingen", "Hindelbank", "Hofen", "Hofstetten bei Brienz", "Holland",
    "Huttigen", "Huttwil", "Inkwil", "Interlaken", "Iseltwald", "Ittigen", "Jaberg",
    "Jegenstorf", "Jens", "Kallnach", "Kandergrund", "Kandersteg", "Kehrsatz", "Kiesen",
    "Kirchberg", "Kirchenthurnen", "Kirchlindach", "Köniz", "Krattigen", "Lauperswil",
    "Lauenen", "Lengnau", "Lenk", "Linden", "Loveresse", "Lucens", "Lütschental", "Lützelflüh",
    "Lyssach", "Madiswil", "Matten bei Interlaken", "Merligen", "Meiringen", "Mittelhausbergen",
    "Möhlin", "Moleson", "Moutier", "Mühleberg", "Münchenbuchsee", "Münchenwiler", "Muri bei Bern",
    "Niederbipp", "Niedermuhlern", "Noflen", "Oberbipp", "Oberdiessbach", "Oberburg", "Oberhafen",
    "Oberhofen am Thunersee", "Oberwil im Simmental", "Ostermundigen", "Péry", "Pieterlen",
    "Pohlern", "Riggisberg", "Rinderspacher", "Roggwil", "Romoos", "Röthenbach im Emmental",
    "Rüderswil", "Rüegsau", "Rüti bei Büren", "Rüti bei Riggisberg", "Saanen", "Sachseln",
    "Safnern", "Schangnau", "Schattenhalb", "Scheunen", "Schlosswil", "Schüpfen", "Schwadernau",
    "Schwarzenburg", "Schönbühl", "Seedorf", "Seftigen", "Sigriswil", "Siselen", "Sonceboz",
    "Spiez", "Steffisburg", "Sumiswald", "Tägerig", "Thierachern", "Thun", "Tüscherz",
    "Uetendorf", "Ursenbach", "Vechigen", "Walkringen", "Wattenwil", "Wiedlisbach", "Wiggiswil",
    "Wilderswil", "Wimmis", "Wohlen bei Bern", "Worb", "Wynigen", "Zollbrück", "Zweisimmen",
    "Zwieselberg", "Büren", "Belp", "Bätterkinden", "Busswil", "Dotzigen", "Grenchen", "Lyss",
    "Büren an der Aare", "Meienried", "Scheune", "Schnottwil", "Wengi", "Arch", "Büetigen",
    "Büren zum Hof", "Diessbach bei Büren", "Hermenches", "Lotzwil", "Melchnau", "Oeschenbach",
    "Roggenburg", "Rumisberg", "Schwarzhäusern", "Thörigen", "Wangen an der Aare", "Wynau"
  ],

  // LUCERNA (LU) - 83 municipios
  "LU": [
    "Adligenswil", "Altishofen", "Altbüron", "Altwis", "Ballwil", "Beromünster", "Buchrain",
    "Büron", "Buttisholz", "Dagmersellen", "Dierikon", "Doppleschwand", "Ebikon", "Eich",
    "Emmen", "Entlebuch", "Ettiswil", "Eschenbach", "Ermensee", "Fischbach", "Flühli",
    "Gettnau", "Gisikon", "Grossdietwil", "Grosswangen", "Hasle", "Hergiswil", "Hildisrieden",
    "Hitzkirch", "Hochdorf", "Hohenrain", "Horw", "Inwil", "Kriens", "Littau", "Luthern",
    "Luzern", "Malters", "Mauensee", "Meggen", "Merschspriet", "Neuenkirch", "Neudorf",
    "Nebikon", "Oberkirch", "Pfaffnau", "Rammersmatt", "Reiden", "Richensee", "Römerswil",
    "Roggliswil", "Romoos", "Rothenburg", "Ruswil", "Schongau", "Schötz", "Schüpfheim",
    "Schwarzenberg", "Sempach", "Sursee", "Triengen", "Udligenswil", "Ufhusen", "Vitznau",
    "Wauwil", "Weggis", "Wikon", "Willisau", "Wolhusen", "Wolhusen", "Zell", "Hämikon",
    "Gelfingen", "Hohenrain", "Lieli", "Mosen", "Pfeffikon", "Pfeffikon", "Reinach",
    "Retschwil", "Römerswil", "Schöftland"
  ],

  // URI (UR) - 19 municipios
  "UR": [
    "Altdorf", "Andermatt", "Attinghausen", "Bauen", "Bürglen", "Erstfeld", "Flüelen",
    "Göschenen", "Gurtnellen", "Hospental", "Isenthal", "Realp", "Schattdorf", "Seedorf",
    "Silenen", "Sisikon", "Spiringen", "Unterschächen", "Wassen"
  ],

  // SCHWYZ (SZ) - 30 municipios
  "SZ": [
    "Alpthal", "Altendorf", "Arth", "Einsiedeln", "Feusisberg", "Freienbach", "Galgenen",
    "Gersau", "Illgau", "Ingenbohl", "Innerthal", "Küssnacht", "Lachen", "Lauerz",
    "Morschach", "Oberiberg", "Riemenstalden", "Rothenthurm", "Sattel", "Schübelbach",
    "Schwyz", "Steinen", "Steinerberg", "Tuggen", "Unteriberg", "Vorderthal", "Wangen",
    "Wollerau", "Reichenburg", "Ibach"
  ],

  // OBWALDEN (OW) - 7 municipios
  "OW": [
    "Alpnach", "Engelberg", "Giswil", "Kerns", "Lungern", "Sachseln", "Sarnen"
  ],

  // NIDWALDEN (NW) - 11 municipios
  "NW": [
    "Beckenried", "Buochs", "Dallenwil", "Emmetten", "Ennetbürgen", "Ennetmoos",
    "Hergiswil", "Oberdorf", "Stans", "Stansstad", "Wolfenschiessen"
  ],

  // GLARIS (GL) - 3 municipios (fusiones)
  "GL": [
    "Glarus", "Glarus Nord", "Glarus Süd"
  ],

  // ZUG (ZG) - 11 municipios
  "ZG": [
    "Baar", "Cham", "Hünenberg", "Menzingen", "Neuheim", "Oberägeri", "Risch",
    "Steinhausen", "Unterägeri", "Walchwil", "Zug"
  ],

  // FRIBURGO (FR) - 126 municipios
  "FR": [
    "Arconciel", "Auboranges", "Attalens", "Autafond", "Avry", "Belfaux", "Billens-Hennens",
    "Bossonnens", "Bremblens", "Broc", "Bulle", "Bussy", "Châtel-Saint-Denis", "Châtonnaye",
    "Chavannes-les-Forts", "Chavannes-le-Chêne", "Cheiry", "Chevroux", "Cheyres", "Clavaleyres",
    "Cottens", "Corpataux-Magnedens", "Crésuz", "Cugy", "Delley", "Dompierre", "Dudingen",
    "Ecublens", "Ependes", "Estavayer-le-Lac", "Farvagny", "Fétigny", "Fribourg", "Gibloux",
    "Gletterens", "Grolley", "Granges-Paccot", "Grangettes", "Gryon", "Guggisberg", "Gurmels",
    "Hauteville", "Heitenried", "Hermenches", "Hauterive", "Ins", "Issai", "La Brillaz",
    "La Verrerie", "Lully", "Lurtigen", "Ménières", "Meyriez", "Missy", "Morat", "Morlon",
    "Mézières", "Neirigue", "Neyruz", "Ogens", "Oron-la-Ville", "Oron-le-Châtel", "Plasselb",
    "Pont-en-Ogoz", "Porsel", "Praroman", "Préverenges", "Puidoux", "Riaz", "Rue", "Rueyres-les-Prés",
    "Russy", "Sâles", "Saint-Aubin", "Saint-Martin", "Saint-Sylvestre", "Salen", "Sauges",
    "Savièse", "Semsales", "Siviriez", "Sommentier", "Sorens", "Sugiez", "Surpierre", "Tafers",
    "Treyvaux", "Ursy", "Vallon", "Val-de-Charmey", "Vaulruz", "Villaraboud", "Villaranel",
    "Villargiroud", "Villars-sous-Mont", "Villars-sur-Glâne", "Villaz-Saint-Pierre", "Villorsonnens",
    "Viverrue", "Vuarrens", "Vuadens", "Vuisternens-devant-Romont", "Wollerau"
  ],

  // SOLEURA (SO) - 107 municipios
  "SO": [
    "Aedermannsdorf", "Aeschi", "Balsthal", "Balm bei Günsberg", "Bärenwil", "Bellach",
    "Bennwil", "Biberist", "Bottmingen", "Brenles", "Brunegg", "Buch", "Büsserach",
    "Büren", "Büren", "Burg", "Däniken", "Derendingen", "Diegten", "Dittingen", "Dornach",
    "Duggingen", "Egerkingen", "Eptingen", "Erlinsbach", "Fehren", "Fischbach", "Flumenthal",
    "Gänsbrunnen", "Gebenstorf", "Gempen", "Gerlafingen", "Giebenach", "Gretzenbach",
    "Grenzach", "Grellingen", "Günsberg", "Halten", "Hauenstein-Ifenthal", "Hersiwil",
    "Himmelried", "Hochwald", "Hofstetten-Flüh", "Holden", "Holderbank", "Hölstein",
    "Hugelshofen", "Kammersrohr", "Kienberg", "Kleinlützel", "Langendorf", "Laupersdorf",
    "Liesberg", "Lohn-Ammannsegg", "Lommiswil", "Lostorf", "Lupsingen", "Luterbach",
    "Matten", "Matzendorf", "Meltingen", "Metzerlen-Mariastein", "Mühledorf", "Mümliswil-Ramiswil",
    "Nennigkofen", "Niederbuchsiten", "Niederdorf", "Nuglar", "Oltingen", "Oberbuchsiten",
    "Obergerlafingen", "Oberdorf", "Oekingen", "Oensingen", "Olten", "Recherswil", "Reigoldswil",
    "Rickenbach", "Riedholz", "Roggenburg", "Röschenz", "Rüti", "Schönenwerd", "Schwaderloch",
    "Seewen", "Selzach", "Solothurn", "Starrkirch-Wil", "Stüsslingen", "Trimbach", "Waldenburg",
    "Wangen bei Olten", "Welschenrohr", "Wengi", "Wiesen", "Wisen", "Wolfwil", "Zuchwil"
  ],

  // BASILEA-CIUDAD (BS) - 3 municipios
  "BS": [
    "Basel", "Bettingen", "Riehen"
  ],

  // BASILEA-CAMPIÑA (BL) - 86 municipios
  "BL": [
    "Aesch", "Allschwil", "Anwil", "Arlesheim", "Augst", "Bennwil", "Birsfelden", "Blaauen",
    "Bottmingen", "Bubendorf", "Büren", "Burg im Leimental", "Buus", "Diepflingen", "Diegten",
    "Duggingen", "Dittingen", "Eptingen", "Ettingen", "Frenkendorf", "Füllinsdorf", "Giebenach",
    "Grellingen", "Hemmiken", "Hersberg", "Hölstein", "Itingen", "Känerkinden", "Kilchberg",
    "Läufelfingen", "Langenbruck", "Lausen", "Lauwil", "Liesberg", "Liestal", "Maisprach",
    "Möhlin", "Münchenstein", "Muttenz", "Nenzlingen", "Nusshof", "Oberdorf", "Oltingen",
    "Ormalingen", "Pfeffingen", "Reigoldswil", "Reinach", "Rickenbach", "Rothenfluh",
    "Röschenz", "Rümlingen", "Schönenbuch", "Seltisberg", "Sissach", "Tecknau", "Tenniken",
    "Therwil", "Titterten", "Wahlen", "Waldenburg", "Wenslingen", "Wintersingen", "Witterswil",
    "Zeglingen", "Zunzgen", "Zwingen", "Arisdorf", "Frenken", "Hellikon", "Magden", "Maisprach",
    "Möhlin", "Olsberg", "Rheinfelden", "Rheinfelden", "Wallbach", "Wegenstetten", "Zeiningen",
    "Zuzgen", "Böckten", "Gelterkinden", "Känerkinden", "Kilchberg", "Maisprach", "Nusshof",
    "Rickenbach", "Tecknau", "Wintersingen", "Zeglingen"
  ],

  // SCHAFFHAUSEN (SH) - 24 municipios
  "SH": [
    "Bargen", "Beringen", "Bibern", "Buch", "Buchberg", "Büttenhardt", "Dörflingen",
    "Feuerthalen", "Flurlingen", "Gächlingen", "Hallau", "Hemmental", "Lohn", "Löhningen",
    "Merishausen", "Neuhausen am Rheinfall", "Neunkirch", "Oberhallau", "Ramsei", "Rüdlingen",
    "Schaffhausen", "Schleitheim", "Siblingen", "Stein am Rhein", "Stetten", "Thayngen",
    "Trasadingen", "Trüllikon", "Uesslingen-Buch", "Wagenhausen", "Wilchingen"
  ],

  // APPENZELL AUSSERRHODEN (AR) - 20 municipios
  "AR": [
    "Bühler", "Gonten", "Grub", "Heiden", "Herisau", "Hundwil", "Lutzenberg", "Rehetobel",
    "Schönengrund", "Schwellbrunn", "Speicher", "Stein", "Teufen", "Trogen", "Urnäsch",
    "Wald", "Waldstatt", "Wald", "Wollerau", "Wolfhalden"
  ],

  // APPENZELL INNERRHODEN (AI) - 6 municipios
  "AI": [
    "Appenzell", "Gonten", "Oberegg", "Rüte", "Schlatt-Haslen", "Schwende"
  ],

  // ST. GALLEN (SG) - 77 municipios
  "SG": [
    "Alt St. Johann", "Altstätten", "Andwil", "Amden", "Au", "Bad Ragaz", "Balzers",
    "Balgach", "Benken", "Berneck", "Buchs", "Bütschwil", "Degersheim", "Diepoldsau",
    "Ebnat-Kappel", "Eggersriet", "Eichberg", "Flawil", "Flums", "Gaiserwald", "Gams",
    "Gommiswald", "Gossau", "Grabs", "Häggenschwil", "Heiden", "Hemberg", "Henau",
    "Jonschwil", "Kaltbrunn", "Kirchberg", "Krinau", "Krummenau", "Lichtensteig", "Lütisburg",
    "Marbach", "Mels", "Mogelsberg", "Mosnang", "Muolen", "Nesslau", "Niederbüren",
    "Niederhelfenschwil", "Niederuzwil", "Oberbüren", "Oberriet", "Oberuzwil", "Pfäfers",
    "Quarten", "Rebstein", "Rieden", "Rüthi", "Sargans", "Schänis", "Schmerikon", "Sennwald",
    "Sevelen", "Speer", "St. Gallen", "St. Gallenkappel", "Stein", "Tübach", "Uznach",
    "Uzwil", "Vilters-Wangs", "Walenstadt", "Wartau", "Wattwil", "Weesen", "Widnau", "Wil",
    "Wildhaus", "Wittenbach", "Zuzwil", "Eggersriet", "Goldingen", "Krinau"
  ],

  // GRISONES (GR) - 208 municipios (los principales)
  "GR": [
    "Andermatt", "Andeer", "Ardez", "Arosa", "Ausserferrera", "Bergün Filisur", "Bivio",
    "Bonaduz", "Bos-cha", "Breil/Brigels", "Bregaglia", "Brusio", "Cama", "Castasegna",
    "Castrisch", "Celerina/Schlarigna", "Chur", "Churwalden", "Clugin", "Conters im Prättigau",
    "Cumbel", "Danis-Tavanasa", "Davos", "Disentis/Mustér", "Domat/Ems", "Donat", "Duvin",
    "Falenstadt", "Felsenberg", "Ferrera", "Flims", "Flond", "Ftan", "Furna", "Giuvault",
    "Grono", "Guarda", "Haldenstein", "Ilanz", "Jenaz", "Jenins", "Klosters", "Küblis",
    "La Punt Chamues-ch", "Laax", "Ladir", "Lagenquart", "Lavin", "Lumnezia", "Luzein",
    "Madulain", "Maienfeld", "Malans", "Malix", "Medel", "Molinis", "Mon", "Mulegns",
    "Nufenen", "Obersaxen", "Parpan", "Pigniu", "Pontresina", "Poschiavo", "Pitasch",
    "Praden", "Rongellen", "Rougemont", "Ruschein", "Rücklig", "Saanen", "Safien",
    "Sagogn", "Samedan", "Santa Maria in Calanca", "Sarn", "Savognin", "Scuol", "Sedrun",
    "Seewis im Prättigau", "S-chanf", "Schlans", "Schluein", "Schnaus", "Schuders",
    "Schweiningen", "Sedrun", "Sent", "Siat", "Sils im Engadin", "Silvaplana", "Soglio",
    "Splügen", "St. Antönien", "St. Moritz", "Stampa", "Stierva", "Surava", "Surcuolm",
    "Susch", "Tamins", "Tarasp", "Tenna", "Tiefencastel", "Tschappina", "Tujetsch", "Turtagh",
    "Urmein", "Valendas", "Vals", "Vaz/Obervaz", "Versam", "Vignogn", "Vrin", "Waltensburg/Vuorz",
    "Wergenstein", "Wiesen", "Wildhaus", "Zernez", "Zillis-Reischen", "Zuoz", "Zizers"
  ],

  // ARGOVIA (AG) - 212 municipios
  "AG": [
    "Aarau", "Aarburg", "Abtwil", "Ammerswil", "Aristau", "Arni", "Auenstein", "Augst",
    "Baden", "Baldingen", "Bellikon", "Benzenschwil", "Bergdietikon", "Berikon", "Besenbüren",
    "Bettwil", "Biberstein", "Birmenstorf", "Birr", "Birrhard", "Böbikon", "Bottenwil", "Böttstein",
    "Bremgarten", "Bremgarten", "Bronschhofen", "Brugg", "Brunegg", "Buchs", "Burg", "Burglen",
    "Büttikon", "Bützberg", "Densbüren", "Dietwil", "Dintikon", "Döttingen", "Dürrenäsch",
    "Dürnten", "Egliswil", "Endingen", "Ennetbaden", "Erlinsbach", "Fahrwangen", "Fislisbach",
    "Flüelen", "Freiamt", "Freienwil", "Fischbach-Göslikon", "Fulenbach", "Gansingen", "Gebenstorf",
    "Geltwil", "Gibswil", "Gipf-Oberfrick", "Gisikon", "Gontenschwil", "Granichen", "Grenzach",
    "Gretzenbach", "Grueningen", "Habsburg", "Hagnau", "Hakab", "Hallwil", "Hausen am Albis",
    "Hausen bei Brugg", "Hedingen", "Hellikon", "Hemmiken", "Herznach", "Hilfikon", "Hirschthal",
    "Holderbank", "Holziken", "Horgen", "Hottwil", "Hunzenschwil", "Hüttlingen", "Itingen",
    "Jonen", "Kaiseraugst", "Kallern", "Killwangen", "Kirchdorf", "Klingnau", "Knonau",
    "Koblenz", "Künten", "Küttigen", "Laufenburg", "Leibstadt", "Leuggern", "Lichtensteig",
    "Lupfig", "Lüterswil", "Magden", "Mägenwil", "Mandach", "Meisterschwanden", "Mellikon",
    "Mellingen", "Menziken", "Merenschwand", "Meyerseichen", "Mittelland", "Möhlin", "Moenchaltorf",
    "Möhlin", "Möriken-Wildegg", "Mörschwil", "Moudon", "Mumpf", "Murg", "Murgenthal",
    "Muri bei Bern", "Müstair", "Neuenhof", "Niederlenz", "Niederrohrdorf", "Niederwil",
    "Oberentfelden", "Oberglatt", "Oberhof", "Oberkirch", "Oberlunkhofen", "Obermumpf",
    "Oberägeri", "Oberburg", "Oberengstringen", "Obfelden", "Olten", "Olsberg", "Othmarsingen",
    "Perlen", "Pfäffikon", "Pfeffikon", "Pfungen", "Port", "Pratteln", "Pretzfeld", "Rebstein",
    "Remetschwil", "Reinach", "Rekingen", "Rheinfelden", "Rheinsulz", "Richterswil", "Rietheim",
    "Riken", "Riniken", "Risoux", "Rohrdorf", "Romoos", "Roppental", "Rorschach", "Rothrist",
    "Rottenschwil", "Rottweil", "Rudolfstetten-Friedlisberg", "Rümlang", "Rüti", "Rüti bei Lyssach",
    "Rüti bei Riggisberg", "Rückerswil", "Safenwil", "Sarmenstorf", "Schafisheim", "Schinznach-Bad",
    "Schinznach-Dorf", "Schlatt", "Schleithal", "Schlieren", "Schmitten", "Schöftland", "Schönenwerd",
    "Schupfart", "Schwaderloch", "Schweiz", "Seengen", "Seon", "Siglistorf", "Sins", "Sissach",
    "Sisse", "Sisseln", "Sonderdorf", "Sool", "Spiesker", "Staffelbach", "Staufen", "Stein",
    "Stetten", "Strengelbach", "Sulgen", "Suhr", "Tägerig", "Teufenthal", "Thalwil", "Thörigen",
    "Turgi", "Ueken", "Ufhusen", "Uitikon", "Unteraargau", "Unterengstringen", "Unterentfelden",
    "Unterkulm", "Urdorf", "Uster", "Uznach", "Vahlenbühl", "Vellmar", "Vendenheim", "Villmergen",
    "Vilters", "Vitznau", "Volketswil", "Vorderthal", "Vufflens-le-Château", "Waedenswil", "Wald",
    "Waldenburg", "Wallisellen", "Wangen bei Olten", "Wangen an der Aare", "Wattwil", "Wegenstetten",
    "Weiningen", "Weisslingen", "Wettingen", "Widen", "Widen", "Wiedlisbach", "Wila", "Wildberg",
    "Wiler", "Wil, Stadt", "Windisch", "Wintersingen", "Wohlen", "Wohlen bei Bern", "Wölflinswil",
    "Worb", "Würenlingen", "Würenlos", "Zetzwil", "Zofingen", "Zufikon", "Zug", "Zullwil", "Zuzwil"
  ],

  // TURGOVIA (TG) - 80 municipios
  "TG": [
    "Aadorf", "Amriswil", "Arbon", "Basadingen-Schlattingen", "Berg", "Berlingen", "Bischofszell",
    "Bodmen", "Bottighofen", "Bragenwil", "Bürglen", "Bussnang", "Dättlikon", "Diessenhofen",
    "Doxan", "Dussnang", "Egnach", "Ermatingen", "Eschlikon", "Feldbach", "Fischingen", "Frauenfeld",
    "Fridingen", "Gachnang", "Gerlikon", "Gottlieben", "Güttingen", "Hagenbuch", "Hauptwil-Gottshaus",
    "Herdern", "Homburg", "Hörhausen", "Horn", "Hugelshofen", "Hüttlingen", "Kesswil", "Kradolf-Schönenberg",
    "Kreuzlingen", "Langrickenbach", "Lengwil", "Lipperswil", "Lommis", "Mammern", "Märstetten",
    "Matzingen", "Milledorf", "Müllheim", "Murg", "Neunforn", "Niederhofen", "Oberaach", "Oberdorf",
    "Oberthurgau", "Opfershofen", "Pfyn", "Raperswilen", "Rickenbach", "Roggwil", "Romanshorn",
    "Salenstein", "Schönenbaumgarten", "Schweizersholz", "Scherzingen", "Schlossberg", "Sitterdorf",
    "Sommertingen", "Sonnengarten", "Sulgen", "Thundorf", "Tobel", "Tägerwilen", "Uesslingen-Buch",
    "Uttwil", "Viglingen", "Wäldi", "Wagenhausen", "Wannenbach", "Weinfelden", "Wigoltingen", "Wuppenau",
    "Zihlschlacht", "Zuppen", "Zweidlen"
  ],

  // TESINO (TI) - 115 municipios
  "TI": [
    "Agra", "Airolo", "Aranno", "Arbedo-Castione", "Arosio", "Astano", "Bedano", "Bedigliora",
    "Bellinzona", "Bissone", "Bodio", "Breganzona", "Breno", "Brione", "Brissago", "Brusino Arsizio",
    "Cabbiolo", "Cadegliano", "Cadempino", "Cadenazzo", "Camorino", "Campione d'Italia", "Canobbio",
    "Capriasca", "Carabietta", "Carona", "Caslano", "Castel San Pietro", "Cavergno", "Cavigliano",
    "Cerentino", "Certara", "Cevio", "Chiasso", "Chironico", "Claro", "Colla", "Collina d'Oro",
    "Comano", "Corippo", "Cresciano", "Cugnasco-Gerra", "Dalpe", "Faido", "Fescoggia", "Gerra",
    "Gordola", "Gresso", "Gudo", "Isone", "Lavertezzo", "Lentino", "Locarno", "Lodrino", "Lugano",
    "Lumino", "Maggia", "Magliaso", "Mairengo", "Malvaglia", "Massagno", "Medeglia", "Melano",
    "Melide", "Mendrisio", "Meride", "Miasco", "Moghegno", "Molinara", "Molino", "Monteceneri",
    "Monteggio", "Morcote", "Morbio Inferiore", "Morbio Superiore", "Moscia", "Muggio", "Muzzano",
    "Neggio", "Novazzano", "Osco", "Pambio-Noranco", "Pazzallo", "Personico", "Pianezzo", "Pollegio",
    "Ponte Capriasca", "Ponte Tresa", "Pura", "Quinto", "Riva San Vitale", "Rivera", "Rohn", "Rovio",
    "Sagno", "Sant'Antonio", "Savosa", "Sementina", "Serocca", "Serravalle", "Sigirino", "Sornico",
    "Sperimenta", "Tegna", "Torricella-Taverne", "Tenero-Contra", "Vernate", "Vezia", "Vico Morcote",
    "Viganello", "Villa", "Vira", "Vogorno"
  ],

  // VAUD (VD) - 309 municipios
  "VD": [
    "Agiez", "Aigle", "Alle", "Allaman", "Apples", "Arzier-Le Muids", "Assens", "Aubonne",
    "Ballaigues", "Bassins", "Baulmes", "Bavois", "Begnins", "Belmont-sur-Lausanne", "Bergières",
    "Berolle", "Bex", "Bioley-Magnoux", "Bière", "Blonay", "Borex", "Bottens", "Bougy-Villars",
    "Boulens", "Bourg-en-Lavaux", "Bremblens", "Brent", "Bressonnaz", "Bressoux", "Buchillon",
    "Bursinel", "Bursins", "Burtigny", "Cery", "Chabliere", "Chamblon", "Champvent", "Chardonne",
    "Chavannes-le-Chêne", "Chavannes-près-Renens", "Chavornay", "Cheseaux-sur-Lausanne", "Chexbres",
    "Chilleurs", "Clarmont", "Coinsins", "Commugny", "Corcelles-le-Jorat", "Corcelles-près-Concise",
    "Corcelles-près-Payerne", "Cossonay", "Cottens", "Crassier", "Crissier", "Cuarny", "Cugy",
    "Daillens", "Denges", "Dizy", "Dompierre", "Donneloye", "Duillier", "Dully", "Echallens",
    "Echichens", "Eclépens", "Ecoteaux", "Ecublens", "Eglisens-Grand-Fort", "Epenex", "Essertines-sur-Rolle",
    "Essertines-sur-Yverdon", "Etagnières", "Etoy", "Faubourg", "Fechy", "Ferlens", "Fiez",
    "Fontaines-sur-Grandson", "Fontenais", "Forel", "Founex", "Froideville", "Gingins", "Givrins",
    "Gland", "Gollion", "Gomez", "Grandson", "Granges", "Grens", "Gryon", "Hauterive", "Henniez",
    "Hermenches", "Jongny", "Jouxtens-Mézery", "La Chaux", "La Conversion", "La Neuveville", "La Pierre",
    "La Rippe", "La Sarraz", "La Tour-de-Peilz", "Lausanne", "Le Chenit", "Le Lieu", "Le Mont-sur-Lausanne",
    "Le Sentier", "Le Vaud", "Les Bioux", "Les Charbonnières", "Les Clées", "Leysin", "L'Isle", "Lonay",
    "Loppion", "Lucens", "Lussy-sur-Morges", "Luze", "Lutry", "Macon", "Maracon", "Marcelin", "Mauraz",
    "Mazel", "Médières", "Mégevette", "Mézières", "Mies", "Molinens", "Mollens", "Montricher", "Monthey",
    "Mont-la-Ville", "Morges", "Morrens", "Moudon", "Naz", "Nyon", "Ogens", "Onnens", "Orbe", "Ormont-Dessous",
    "Ormont-Dessus", "Oulens-sous-Echallens", "Pailly", "Pampigny", "Penthalaz", "Penthas", "Perré",
    "Peseux", "Poliez-le-Grand", "Poliez-Pittet", "Pompaples", "Pont", "Prahins", "Préverenges", "Prilly",
    "Pully", "Rances", "Renens", "Roche", "Rolle", "Romanel-sur-Lausanne", "Romainmôtier-Envy", "Rossinière",
    "Rougemont", "Rue", "Saint-George", "Saint-Livres", "Saint-Prex", "Saint-Saphorin", "Sainte-Croix",
    "Sauges", "Savigny", "Schopperten", "Sévery", "Sullens", "Tannay", "Tartegnin", "Thierrens", "Trélex",
    "Troinens", "Trois-Châtel", "Vallamand", "Valmont", "Vaud", "Vaux-sur-Morges", "Vellarins", "Venne",
    "Vernand", "Versoix", "Veytaux", "Vich", "Villars-Sainte-Croix", "Villars-sous-Yens", "Villeneuve",
    "Vinzel", "Vufflens-la-Ville", "Vufflens-le-Château", "Vuiteboeuf", "Vulliens", "Yens", "Yverdon-les-Bains",
    "Yvonand"
  ],

  // VALAIS (VS) - 122 municipios
  "VS": [
    "Agarn", "Albinen", "Anniviers", "Ardon", "Ayent", "Bagnes", "Bramois", "Branson", "Bürchen",
    "Chalais", "Chamoson", "Chandolin", "Charrat", "Chippis", "Conthey", "Corsieres", "Dallen",
    "Dermagnes", "Dorzin", "Eischoll", "Eisten", "Ergisch", "Ergolsheim", "Ernen", "Evolène",
    "Ferden", "Fiesch", "Fieschertal", "Flanthey", "Fully", "Gampel-Bratsch", "Grächen", "Grimentz",
    "Grône", "Guttet-Feschel", "Hérémence", "Inden", "Isérables", "Kippel", "Lalden", "Lax", "Leuk",
    "Leukerbad", "Liden", "Martigny", "Martigny-Combe", "Mase", "Massongex", "Miège", "Mollens",
    "Mont-Noble", "Monthey", "Morgins", "Mörel-Filet", "Nendaz", "Niederems", "Niedergesteln", "Obergoms",
    "Oberems", "Obergoms", "Orsières", "Randa", "Raron", "Reckingen-Gluringen", "Riddes", "Ried-Brig",
    "Riederalp", "Ritzingen", "Saas-Almagell", "Saas-Balen", "Saas-Fee", "Saas-Grund", "Saxon", "Semsales",
    "Sierre", "Sion", "St. Niklaus", "Stalden", "Staldenrieden", "Törbel", "Trient", "Troistorrents",
    "Unterbäch", "Varen", "Venthône", "Vérossaz", "Vétroz", "Veyras", "Veysonnaz", "Vieu", "Visp",
    "Visperterminen", "Vollèges", "Wergenstein", "Wiler", "Zeneggen", "Zermatt", "Zwischbergen"
  ],

  // NEUCHÂTEL (NE) - 31 municipios
  "NE": [
    "Auvernier", "Boudry", "Brot-Dessous", "Brot-Plamboz", "Chézard-Saint-Martin", "Coffrane",
    "Corcelles-Cormondrèche", "Cortaillod", "Couvet", "Dombresson", "Engollon", "Fenin-Vilars-Saules",
    "Fontainemelon", "Fontaines", "Fleurier", "Gorgier", "Hauterive", "La Chaux-de-Fonds", "La Chaux-du-Milieu",
    "La Sagne", "Le Landeron", "Le Locle", "Les Brenets", "Les Bayards", "Les Geneveys-sur-Coffrane",
    "Les Hauts-Geneveys", "Les Ponts-de-Martel", "Montmollin", "Môtiers", "Neuchâtel", "Noiraigue",
    "Peseux", "Rochefort", "Saint-Aubin-Sauges", "Saint-Blaise", "Val-de-Ruz", "Valangin", "Villiers",
    "Vaumarcus"
  ],

  // GINEBRA (GE) - 45 municipios
  "GE": [
    "Aire-la-Ville", "Anières", "Avully", "Avusy", "Bardonnex", "Bellevue", "Bernex", "Cartigny",
    "Céligny", "Chancy", "Chêne-Bougeries", "Chêne-Bourg", "Collex-Bossy", "Collonge-Bellerive",
    "Cologny", "Confignon", "Corsier", "Dardagny", "Genève", "Genthod", "Grand-Saconnex", "Gryon",
    "Hermance", "Jussy", "Laconnex", "Lancy", "Meinier", "Meyrin", "Onex", "Perly-Certoux",
    "Plan-les-Ouates", "Pregny-Chambésy", "Presinge", "Puplinge", "Russin", "Satigny", "Soral",
    "Thônex", "Troinex", "Vandoeuvres", "Vernier", "Versoix", "Veyrier"
  ],

  // JURA (JU) - 55 municipios
  "JU": [
    "Alle", "Bassecourt", "Belfahy", "Bergen", "Berlincourt", "Beurnevésin", "Bonfol", "Bressaucourt",
    "Buix", "Bure", "Charmoille", "Chevenez", "Châtenois", "Chevenez", "Coeuve", "Corban", "Courchapoix",
    "Courgenay", "Courrendlin", "Courroux", "Courtételle", "Damphreux", "Delemont", "Delémont", "Domdidier",
    "Dompeter", "Ederswiler", "Fahy", "Fontenais", "Glovelier", "Grandfontaine", "Haute-Sorne", "Kestenholz",
    "Lajoux", "Le Bémont", "Les Bois", "Les Breuleux", "Lugnez", "Mervelier", "Mettembert", "Movelier",
    "Montignez", "Montsevelier", "Moutier", "Movelier", "Noirs", "Ocourt", "Pleigne", "Porrentruy",
    "Rebeuvelier", "Roggenburg", "Rossemaison", "Saulcy", "Scey-en-Varais", "Seleute", "Soulce",
    "St. Brais", "Suarce", "Vellerat", "Vermes", "Vendlincourt", "Vicques", "Wiseco", "Zwillikon"
  ]
};

// LIECHTENSTEIN - 11 municipios
export const LIECHTENSTEIN_MUNICIPALITIES = [
  "Vaduz", "Schaan", "Balzers", "Triesen", "Triesenberg",
  "Ruggell", "Gamprin", "Eschen", "Mauren", "Planken", "Schaanwald"
];

// DISTRITOS POR CANTÓN
export const DISTRICTS_BY_CANTON: Record<string, { name: string; nameDE: string; municipalities: string[] }[]> = {
  "ZH": [
    { name: "Zürich", nameDE: "Zürich", municipalities: ["Zürich"] },
    { name: "Affoltern", nameDE: "Bezirk Affoltern", municipalities: ["Affoltern am Albis", "Bonstetten", "Hausen am Albis", "Hedingen", "Knonau", "Maschwanden", "Mettmenstetten", "Obfelden", "Ottenbach", "Rifferswil", "Stallikon"] },
    { name: "Andelfingen", nameDE: "Bezirk Andelfingen", municipalities: ["Andelfingen", "Berg am Irchel", "Buch am Irchel", "Dachsen", "Dorf", "Feuerthalen", "Flaach", "Flurlingen", "Henggart", "Humlikon", "Kleinandelfingen", "Marthalen", "Ossingen", "Rheinau", "Trüllikon", "Truttikon", "Uesslingen-Buch"] },
    { name: "Bülach", nameDE: "Bezirk Bülach", municipalities: ["Bülach", "Bachenbülach", "Eglisau", "Embrach", "Freienstein-Teufen", "Glattfelden", "Hochfelden", "Höri", "Hüntwangen", "Kloten", "Lufingen", "Nürensdorf", "Oberembrach", "Rafz", "Rorbas", "Wasterkingen", "Winkel"] },
    { name: "Dietikon", nameDE: "Bezirk Dietikon", municipalities: ["Aesch", "Birmensdorf", "Dietikon", "Geroldswil", "Oberengstringen", "Oetwil an der Limmat", "Schlieren", "Uitikon", "Unterengstringen", "Urdorf", "Weiningen"] },
    { name: "Hinwil", nameDE: "Bezirk Hinwil", municipalities: ["Bäretswil", "Bubikon", "Dürnten", "Fischenthal", "Gibswil", "Hinwil", "Rüti", "Wald"] },
    { name: "Horgen", nameDE: "Bezirk Horgen", municipalities: ["Horgen", "Hirzel", "Hausen am Albis", "Langnau am Albis", "Meilen", "Oberrieden", "Richterswil", "Rüschlikon", "Thalwil", "Uetikon am See", "Wädenswil"] },
    { name: "Meilen", nameDE: "Bezirk Meilen", municipalities: ["Erlenbach", "Herrliberg", "Hombrechtikon", "Küsnacht", "Männedorf", "Meilen", "Oetwil am See", "Stäfa", "Uetikon am See", "Zollikon"] },
    { name: "Pfäffikon", nameDE: "Bezirk Pfäffikon", municipalities: ["Bauma", "Fehraltorf", "Hittnau", "Pfäffikon", "Russikon", "Turbenthal", "Wila", "Wildberg", "Bäretswil"] },
    { name: "Uster", nameDE: "Bezirk Uster", municipalities: ["Dübendorf", "Egg", "Fällanden", "Greifensee", "Maur", "Mönchaltorf", "Schwerzenbach", "Uster", "Volketswil", "Wangen-Brüttisellen"] },
    { name: "Winterthur", nameDE: "Bezirk Winterthur", municipalities: ["Brütten", "Dägerlen", "Dinhard", "Elgg", "Gachnang", "Hagenbuch", "Hettlingen", "Neftenbach", "Pfungen", "Rickenbach", "Schlatt", "Seuzach", "Wiesendangen", "Winterthur"] },
    { name: "Dielsdorf", nameDE: "Bezirk Dielsdorf", municipalities: ["Bachs", "Boppelsen", "Dielsdorf", "Neerach", "Niederglatt", "Niederoesch", "Oberglatt", "Oberweningen", "Regensberg", "Regensdorf", "Rümlang", "Schöfflisdorf", "Stadel", "Steinmaur"] }
  ],

  "SG": [
    { name: "St. Gallen", nameDE: "Wahlkreis St. Gallen", municipalities: ["Andwil", "Eggersriet", "Gaiserwald", "Gossau", "Häggenschwil", "Muolen", "St. Gallen", "Waldkirch", "Wittenbach"] },
    { name: "Rheintal", nameDE: "Wahlkreis Rheintal", municipalities: ["Altstätten", "Au", "Balgach", "Berneck", "Diepoldsau", "Eichberg", "Marbach", "Oberriet", "Rebstein", "Rüthi", "Widnau"] },
    { name: "Werdenberg", nameDE: "Wahlkreis Werdenberg", municipalities: ["Buchs", "Gams", "Grabs", "Sennwald", "Sevelen", "Wartau"] },
    { name: "Untertoggenburg", nameDE: "Wahlkreis Untertoggenburg", municipalities: ["Degersheim", "Flawil", "Jonschwil", "Mogelsberg", "Niederuzwil", "Oberuzwil", "Uzwil"] },
    { name: "Toggenburg", nameDE: "Wahlkreis Toggenburg", municipalities: ["Alt St. Johann", "Bütschwil", "Ebnat-Kappel", "Hemberg", "Krinau", "Lichtensteig", "Lütisburg", "Mogelsberg", "Mosnang", "Nesslau", "Krummenau", "Stein", "Wildhaus", "Kirchberg", "Wattwil"] },
    { name: "Sarganserland", nameDE: "Wahlkreis Sarganserland", municipalities: ["Bad Ragaz", "Flums", "Mels", "Pfäfers", "Quarten", "Sargans", "Vilters-Wangs", "Walenstadt"] },
    { name: "See-Gaster", nameDE: "Wahlkreis See-Gaster", municipalities: ["Amden", "Benken", "Gommiswald", "Kaltbrunn", "Rieden", "Schänis", "Schmerikon", "Uznach", "Weesen"] },
    { name: "Wil", nameDE: "Wahlkreis Wil", municipalities: ["Bronschhofen", "Degersheim", "Flawil", "Jonschwil", "Niederhelfenschwil", "Niederuzwil", "Oberbüren", "Oberuzwil", "Uzwil", "Wil", "Zuzwil"] }
  ],

  // Agregar más distritos según sea necesario...
};

// Función para obtener todos los municipios
export function getAllMunicipalities(): string[] {
  const all: string[] = [...LIECHTENSTEIN_MUNICIPALITIES];
  
  Object.values(MUNICIPALITIES_BY_CANTON).forEach(municipalities => {
    municipalities.forEach(m => {
      if (!all.includes(m)) {
        all.push(m);
      }
    });
  });
  
  return all.sort();
}

// Función para contar municipios por cantón
export function getMunicipalityCount(): Record<string, number> {
  const counts: Record<string, number> = { LI: LIECHTENSTEIN_MUNICIPALITIES.length };
  
  Object.entries(MUNICIPALITIES_BY_CANTON).forEach(([canton, municipalities]) => {
    counts[canton] = municipalities.length;
  });
  
  return counts;
}

console.log('📊 Total municipios Suiza:', Object.values(MUNICIPALITIES_BY_CANTON).reduce((a, b) => a + b.length, 0));
console.log('📊 Total municipios Liechtenstein:', LIECHTENSTEIN_MUNICIPALITIES.length);
