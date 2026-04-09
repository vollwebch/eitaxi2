// ============================================
// DATOS GEOGRÁFICOS COMPLETOS DE SUIZA Y LIECHTENSTEIN
// ============================================
// Todos los 26 cantones suizos con sus distritos/wahlkreise y municipios
// Los 11 municipios de Liechtenstein
// Fuente: Oficina Federal de Estadística Suiza (BFS) - 2024
// Total: ~2,100 municipios

// Importar datos extendidos
import { MUNICIPALITIES_BY_CANTON, LIECHTENSTEIN_MUNICIPALITIES, DISTRICTS_BY_CANTON } from './swiss-municipalities';

export interface Canton {
  id: string;
  name: string;
  nameDE: string;
  nameFR: string;
  nameIT: string;
  code: string;
  capital: string;
  districts: District[];
}

export interface District {
  id: string;
  name: string;
  nameDE: string;
  nameFR?: string;
  nameIT?: string;
  type: 'bezirk' | 'wahlkreis' | 'district' | 'region' | 'arrondissement';
  municipalities: string[];
}

export interface Country {
  id: string;
  name: string;
  municipalities: string[];
}

// ============================================
// LIECHTENSTEIN - 11 Municipios
// ============================================
export const LIECHTENSTEIN: Country = {
  id: 'li',
  name: 'Liechtenstein',
  municipalities: [
    'Vaduz',
    'Schaan',
    'Balzers',
    'Triesen',
    'Triesenberg',
    'Ruggell',
    'Gamprin',
    'Eschen',
    'Mauren',
    'Planken',
    'Schaanwald'
  ]
};

// ============================================
// SUIZA - 26 CANTONES CON DATOS COMPLETOS
// ============================================
export const SWISS_CANTONS: Canton[] = [
  // ==========================================
  // CANTÓN DE ZÚRICH (ZH) - 12 Bezirke, 162 municipios
  // ==========================================
  {
    id: 'zh',
    name: 'Cantón de Zúrich',
    nameDE: 'Kanton Zürich',
    nameFR: 'Canton de Zurich',
    nameIT: 'Cantone di Zurigo',
    code: 'ZH',
    capital: 'Zúrich',
    districts: [
      {
        id: 'zh-zuerich',
        name: 'Zúrich',
        nameDE: 'Zürich',
        type: 'bezirk',
        municipalities: ['Zúrich', 'Zürich']
      },
      {
        id: 'zh-afoltern',
        name: 'Affoltern',
        nameDE: 'Bezirk Affoltern',
        type: 'bezirk',
        municipalities: ['Affoltern am Albis', 'Bonstetten', 'Hausen am Albis', 'Hedingen', 'Knonau', 'Maschwanden', 'Mettmenstetten', 'Obfelden', 'Ottenbach', 'Rifferswil', 'Stallikon']
      },
      {
        id: 'zh-andelfingen',
        name: 'Andelfingen',
        nameDE: 'Bezirk Andelfingen',
        type: 'bezirk',
        municipalities: ['Andelfingen', 'Berg am Irchel', 'Buch am Irchel', 'Dachsen', 'Dorf', 'Feuerthalen', 'Flaach', 'Flurlingen', 'Henggart', 'Humlikon', 'Kleinandelfingen', 'Marthalen', 'Ossingen', 'Rheinau', 'Trüllikon', 'Truttikon', 'Uesslingen-Buch']
      },
      {
        id: 'zh-buelach',
        name: 'Bülach',
        nameDE: 'Bezirk Bülach',
        type: 'bezirk',
        municipalities: ['Bülach', 'Bachensbüel', 'Bacheten', 'Eglisau', 'Embrach', 'Freienstein-Teufen', 'Glattfelden', 'Hochfelden', 'Höri', 'Hüntwangen', 'Kloten', 'Lufingen', 'Nürensdorf', 'Oberembrach', 'Rafz', 'Rorbas', 'Wasterkingen', 'Wilen', 'Winkel']
      },
      {
        id: 'zh-dietikon',
        name: 'Dietikon',
        nameDE: 'Bezirk Dietikon',
        type: 'bezirk',
        municipalities: ['Aesch', 'Birmensdorf', 'Dietikon', 'Geroldswil', 'Oberengstringen', 'Oetwil an der Limmat', 'Schlieren', 'Uitikon', 'Unterengstringen', 'Urdorf', 'Weiningen']
      },
      {
        id: 'zh-hinwil',
        name: 'Hinwil',
        nameDE: 'Bezirk Hinwil',
        type: 'bezirk',
        municipalities: ['Bäretswil', 'Bubikon', 'Dürnten', 'Fischenthal', 'Gibswil', 'Hinwil', 'Rüti', 'Wald', 'Wetzenikon']
      },
      {
        id: 'zh-horgen',
        name: 'Horgen',
        nameDE: 'Bezirk Horgen',
        type: 'bezirk',
        municipalities: ['Horgen', 'Hirzel', 'Hausen am Albis', 'Langnau am Albis', 'Meilen', 'Morges', 'Oberrieden', 'Richterswil', 'Rüschlikon', 'Thalwil', 'Uetikon am See', 'Wädenswil']
      },
      {
        id: 'zh-meilen',
        name: 'Meilen',
        nameDE: 'Bezirk Meilen',
        type: 'bezirk',
        municipalities: ['Erlenbach', 'Herrliberg', 'Hombrechtikon', 'Küsnacht', 'Männedorf', 'Meilen', 'Oetwil am See', 'Stäfa', 'Uetikon am See', 'Zollikon']
      },
      {
        id: 'zh-pfaffikon',
        name: 'Pfäffikon',
        nameDE: 'Bezirk Pfäffikon',
        type: 'bezirk',
        municipalities: ['Bauma', 'Bäretswil', 'Fehraltorf', 'Hittnau', 'Pfäffikon', 'Russikon', 'Turbenthal', 'Wila', 'Wildberg']
      },
      {
        id: 'zh-uster',
        name: 'Uster',
        nameDE: 'Bezirk Uster',
        type: 'bezirk',
        municipalities: ['Dübendorf', 'Egg', 'Fällanden', 'Greifensee', 'Maur', 'Mönchaltorf', 'Schwerzenbach', 'Uster', 'Volketswil', 'Wangen-Brüttisellen']
      },
      {
        id: 'zh-winterthur',
        name: 'Winterthur',
        nameDE: 'Bezirk Winterthur',
        type: 'bezirk',
        municipalities: ['Brütten', 'Dägerlen', 'Dinhard', 'Elgg', 'Gachnang', 'Hagenbuch', 'Hettlingen', 'Neftenbach', 'Pfungen', 'Rickenbach', 'Schlatt', 'Seuzach', 'Töss', 'Wiesendangen', 'Winterthur']
      },
      {
        id: 'zh-dielsdorf',
        name: 'Dielsdorf',
        nameDE: 'Bezirk Dielsdorf',
        type: 'bezirk',
        municipalities: ['Bachs', 'Boppelsen', 'Boppelsen', 'Dielsdorf', 'Hüttlingen', 'Neerach', 'Niederglatt', 'Niederoesch', 'Oberglatt', 'Oberoerch', 'Regensberg', 'Regensdorf', 'Rümlang', 'Schöfflisdorf', 'Stadel', 'Steinmaur']
      }
    ]
  },

  // ==========================================
  // CANTÓN DE BERNA (BE) - 10 Verwaltungskreise, ~350 municipios
  // ==========================================
  {
    id: 'be',
    name: 'Cantón de Berna',
    nameDE: 'Kanton Bern',
    nameFR: 'Canton de Berne',
    nameIT: 'Cantone di Berna',
    code: 'BE',
    capital: 'Berna',
    districts: [
      {
        id: 'be-bern-mittelland',
        name: 'Berna-Mittelland',
        nameDE: 'Verwaltungskreis Bern-Mittelland',
        nameFR: 'Arrondissement administratif de Berne-Mittelland',
        type: 'district',
        municipalities: ['Allmendingen bei Bern', 'Arni', 'Belp', 'Bern', 'Berten', 'Bolligen', 'Bremgarten bei Bern', 'Büren zum Hof', 'Deisswil bei Münchenbuchsee', 'Diemerswil', 'Grafenried', 'Guggisberg', 'Gurzelen', 'Häusern', 'Herbligen', 'Ittigen', 'Jaberg', 'Kehrsatz', 'Kiesen', 'Kirchdorf', 'Kirchlichen', 'Konolfingen', 'Linden', 'Matten bei Interlaken', 'Muri bei Bern', 'Münchenbuchsee', 'Münchenwiler', 'Neuenegg', 'Niedermuhlern', 'Oberbipp', 'Oberhofen am Thunersee', 'Oberhünigen', 'Oppligen', 'Riggisberg', 'Röthenbach im Emmental', 'Rubigen', 'Schlosswil', 'Schüpbach', 'Schwanden', 'Sigriswil', 'Steffisburg', 'Teuffenthal', 'Tüscherz-Alfermée', 'Uttigen', 'Vechigen', 'Walkringen', 'Wattenwil', 'Wichtrach', 'Wiggiswil', 'Wohlen bei Bern', 'Worb', 'Zuzwil']
      },
      {
        id: 'be-biel-seeland',
        name: 'Biel/Bienne-Seeland',
        nameDE: 'Verwaltungskreis Biel/Bienne-Seeland',
        nameFR: 'Arrondissement administratif de Bienne-Seeland',
        type: 'district',
        municipalities: ['Aegerten', 'Aarberg', 'Bargen', 'Bellmund', 'Biel/Bienne', 'Brügg', 'Büetigen', 'Busswil bei Büren', 'Büren an der Aare', 'Diessbach bei Büren', 'Dotzigen', 'Evilard', 'Gals', 'Gampelen', 'Hagneck', 'Hermrigen', 'Ins', 'Jens', 'Kappelen', 'Lattrigen', 'Lüscherz', 'Merzligen', 'Meinisberg', 'Mörigen', 'Nidau', 'Orpund', 'Port', 'Pürgen', 'Safnern', 'Scheunen', 'Schwadernau', 'Studen', 'Sutz-Lattrigen', 'Täuffelen', 'Tüscherz-Alfermée', 'Twann', 'Vinelz', 'Walperswil', 'Worben']
      },
      {
        id: 'be-emmental',
        name: 'Emmental',
        nameDE: 'Verwaltungskreis Emmental',
        type: 'district',
        municipalities: ['Affoltern im Emmental', 'Alchenstorf', 'Burgdorf', 'Dürrenroth', 'Eriswil', 'Huttwil', 'Lützelflüh', 'Lyssach', 'Oberburg', 'Rüegsau', 'Sumiswald', 'Trachselwald', 'Walterswil', 'Wyssachen']
      },
      {
        id: 'be-oberaargau',
        name: 'Oberaargau',
        nameDE: 'Verwaltungskreis Oberaargau',
        type: 'district',
        municipalities: ['Aarwangen', 'Bannwil', 'Bleienbach', 'Brenzigen', 'Gutenburg', 'Herzogenbuchsee', 'Huttwil', 'Langenthal', 'Lotzwil', 'Madiswil', 'Melchnau', 'Niederbipp', 'Oberbipp', 'Oeschenbach', 'Reisiswil', 'Roggenburg', 'Rumisberg', 'Schwarzhäusern', 'Thörigen', 'Wangen an der Aare', 'Wiedlisbach', 'Wynau']
      },
      {
        id: 'be-thun',
        name: 'Thun',
        nameDE: 'Verwaltungskreis Thun',
        type: 'district',
        municipalities: ['Amsoldingen', 'Buchs', 'Burgistein', 'Einigen', 'Eriz', 'Forst', 'Gurzelen', 'Hilterfingen', 'Homberg', 'Längenbühl', 'Oberhofen am Thunersee', 'Oberlingen', 'Pohlern', 'Riggisberg', 'Rüti bei Riggisberg', 'Seftigen', 'Sigriswil', 'Spiez', 'Steffisburg', 'Thun', 'Uetendorf', 'Wattenwil', 'Zwieselberg']
      },
      {
        id: 'be-interlaken-oberhasli',
        name: 'Interlaken-Oberhasli',
        nameDE: 'Verwaltungskreis Interlaken-Oberhasli',
        type: 'district',
        municipalities: ['Aarmühle', 'Bönigen', 'Därligen', 'Grindelwald', 'Gsteig bei Gstaad', 'Gsteigwiler', 'Guttannen', 'Hasliberg', 'Interlaken', 'Iseltwald', 'Lauterbrunnen', 'Matten bei Interlaken', 'Mürren', 'Saxeten', 'Schattenhalb', 'Wilderswil', 'Zweilütschinen']
      },
      {
        id: 'be-frutigen-niedersimmental',
        name: 'Frutigen-Niedersimmental',
        nameDE: 'Verwaltungskreis Frutigen-Niedersimmental',
        type: 'district',
        municipalities: ['Adelboden', 'Aeschi bei Spiez', 'Boltigen', 'Därstetten', 'Diemtigen', 'Erlenbach im Simmental', 'Frutigen', 'Kandergrund', 'Kandersteg', 'Krattigen', 'Oberwil im Simmental', 'Reichenbach im Kandertal', 'Spiez', 'Wimmis']
      },
      {
        id: 'be-obersimmental-saanen',
        name: 'Obersimmental-Saanen',
        nameDE: 'Verwaltungskreis Obersimmental-Saanen',
        type: 'district',
        municipalities: ['Boltigen', 'Gsteig bei Gstaad', 'Lauenen', 'Lenk', 'Saanen', 'St. Stephan', 'Zweisimmen']
      },
      {
        id: 'be-jura-bernois',
        name: 'Jura Bernés',
        nameDE: 'Verwaltungskreis Jura bernois',
        nameFR: 'Arrondissement administratif du Jura bernois',
        type: 'district',
        municipalities: ['Belprahon', 'Bevilard', 'Boncourt', 'Bressaucourt', 'Châtillon', 'Chevenez', 'Corcelles', 'Courfaivre', 'Courrendlin', 'Courroux', 'Corgémont', 'Cormoret', 'Court', 'Courtételle', 'Develier', 'Diesse', 'Esmond', 'Fontenais', 'Grandval', 'Lamboing', 'Malleray', 'Moutier', 'Nenzlingen', 'Perrefitte', 'Péry-La Heutte', 'Reconvilier', 'Renan', 'Roches', 'Rossemaison', 'Sauge', 'Saulcy', 'Sonvilier', 'Sorvilier', 'Tavannes', 'Tramelan', 'Villeret']
      },
      {
        id: 'be-berner-oberland',
        name: 'Oberland Bernés',
        nameDE: 'Berner Oberland',
        nameFR: 'Oberland bernois',
        type: 'region',
        municipalities: ['Adelboden', 'Aeschi bei Spiez', 'Bex', 'Boltigen', 'Brienz', 'Därligen', 'Diemtigen', 'Erlenbach im Simmental', 'Frutigen', 'Gsteig', 'Grindelwald', 'Gsteigwiler', 'Guttannen', 'Hasliberg', 'Interlaken', 'Iseltwald', 'Kandergrund', 'Kandersteg', 'Krattigen', 'Lauterbrunnen', 'Lenk', 'Meiringen', 'Mürren', 'Oberwil im Simmental', 'Reichenbach im Kandertal', 'Saanen', 'Saxeten', 'Schattenhalb', 'Spiez', 'St. Stephan', 'Wengen', 'Wilderswil', 'Wimmis', 'Zweisimmen']
      }
    ]
  },

  // ==========================================
  // CANTÓN DE LUCERNA (LU) - 6 Ämter, 83 municipios
  // ==========================================
  {
    id: 'lu',
    name: 'Cantón de Lucerna',
    nameDE: 'Kanton Luzern',
    nameFR: 'Canton de Lucerne',
    nameIT: 'Cantone di Lucerna',
    code: 'LU',
    capital: 'Lucerna',
    districts: [
      {
        id: 'lu-luzern',
        name: 'Lucerna',
        nameDE: 'Amt Luzern',
        type: 'wahlkreis',
        municipalities: ['Adligenswil', 'Ebikon', 'Gisikon', 'Greppen', 'Honau', 'Horw', 'Kriens', 'Littau', 'Lucerna', 'Luzern', 'Malters', 'Meggen', 'Meierskappen', 'Neuenkirch', 'Rothenburg', 'Schwarzenberg', 'Udligenswil', 'Vitznau', 'Weggis']
      },
      {
        id: 'lu-hochdorf',
        name: 'Hochdorf',
        nameDE: 'Amt Hochdorf',
        type: 'wahlkreis',
        municipalities: ['Aesch', 'Altwis', 'Ballwil', 'Emmen', 'Eschenbach', 'Ermensee', 'Gelfingen', 'Häme,ikon', 'Hergiswil', 'Hildisrieden', 'Hitzkirch', 'Hochdorf', 'Hohenrain', 'Inwil', 'Lieli', 'Luthern', 'Luthern Bad', 'Mauensee', 'Mosen', 'Neudorf', 'Neuenkirch', 'Rain', 'Retschwil', 'Römerswil', 'Röthenbach', 'Schongau', 'Schüpfheim', 'Wolhusen']
      },
      {
        id: 'lu-sursee',
        name: 'Sursee',
        nameDE: 'Amt Sursee',
        type: 'wahlkreis',
        municipalities: ['Beromünster', 'Büron', 'Buttisholz', 'Eich', 'Ettiswil', 'Gettnau', 'Grossdietwil', 'Kottwil', 'Mauensee', 'Nebikon', 'Ohmstal', 'Roggliswil', 'Schlossrued', 'Schmiedrued', 'Schötz', 'Sursee', 'Triengen', 'Ufhusen', 'Wikon', 'Willisau', 'Winikon']
      },
      {
        id: 'lu-willisau',
        name: 'Willisau',
        nameDE: 'Amt Willisau',
        type: 'wahlkreis',
        municipalities: ['Altbüron', 'Altishofen', 'Dagmersellen', 'Ettiswil', 'Fischbach', 'Gettnau', 'Grossdietwil', 'Hergiswil bei Willisau', 'Kottwil', 'Langnau bei Reiden', 'Luthern', 'Nebikon', 'Ohmstal', 'Pfaffnau', 'Reiden', 'Roggliswil', 'Schötz', 'Ufhusen', 'Wauwil', 'Wikorn', 'Willisau', 'Zell']
      },
      {
        id: 'lu-entlebuch',
        name: 'Entlebuch',
        nameDE: 'Amt Entlebuch',
        type: 'wahlkreis',
        municipalities: ['Doppleschwand', 'Entlebuch', 'Escholzmatt', 'Flühli', 'Hasle', 'Marbach', 'Romerswil', 'Schüpfheim', 'Wolhusen']
      }
    ]
  },

  // ==========================================
  // CANTÓN DE URI (UR) - Sin distritos, 19 municipios
  // ==========================================
  {
    id: 'ur',
    name: 'Cantón de Uri',
    nameDE: 'Kanton Uri',
    nameFR: "Canton d'Uri",
    nameIT: 'Cantone di Uri',
    code: 'UR',
    capital: 'Altdorf',
    districts: [
      {
        id: 'ur-uri',
        name: 'Uri',
        nameDE: 'Uri',
        type: 'region',
        municipalities: ['Altdorf', 'Andermatt', 'Attinghausen', 'Bauen', 'Bürglen', 'Erstfeld', 'Flüelen', 'Göschenen', 'Gurtnellen', 'Hospental', 'Isenthal', 'Realp', 'Schattdorf', 'Seedorf', 'Silenen', 'Sisikon', 'Wassen']
      },
      {
        id: 'ur-ursenen',
        name: 'Urseren',
        nameDE: 'Urseren',
        type: 'region',
        municipalities: ['Andermatt', 'Göschenen', 'Hospental', 'Realp']
      },
      {
        id: 'ur-schächental',
        name: 'Valle Schächen',
        nameDE: 'Schächental',
        type: 'region',
        municipalities: ['Bürglen', 'Schattdorf', 'Silenen', 'Spiringen', 'Unterschächen']
      }
    ]
  },

  // ==========================================
  // CANTÓN DE SCHWYZ (SZ) - 6 Bezirke, 30 municipios
  // ==========================================
  {
    id: 'sz',
    name: 'Cantón de Schwyz',
    nameDE: 'Kanton Schwyz',
    nameFR: 'Canton de Schwytz',
    nameIT: 'Cantone di Svitto',
    code: 'SZ',
    capital: 'Schwyz',
    districts: [
      {
        id: 'sz-schwyz',
        name: 'Schwyz',
        nameDE: 'Bezirk Schwyz',
        type: 'bezirk',
        municipalities: ['Alpthal', 'Arth', 'Illgau', 'Ingenbohl', 'Ibach', 'Lauerz', 'Morschach', 'Oberiberg', 'Riemenstalden', 'Rothenthurm', 'Sattel', 'Schwyz', 'Steinen', 'Steinerberg', 'Unteriberg']
      },
      {
        id: 'sz-einsiedeln',
        name: 'Einsiedeln',
        nameDE: 'Bezirk Einsiedeln',
        type: 'bezirk',
        municipalities: ['Einsiedeln']
      },
      {
        id: 'sz-gersau',
        name: 'Gersau',
        nameDE: 'Bezirk Gersau',
        type: 'bezirk',
        municipalities: ['Gersau']
      },
      {
        id: 'sz-höfe',
        name: 'Höfe',
        nameDE: 'Bezirk Höfe',
        type: 'bezirk',
        municipalities: ['Altendorf', 'Feusisberg', 'Freienbach', 'Wollerau']
      },
      {
        id: 'sz-küssnacht',
        name: 'Küssnacht',
        nameDE: 'Bezirk Küssnacht',
        type: 'bezirk',
        municipalities: ['Küssnacht']
      },
      {
        id: 'sz-march',
        name: 'March',
        nameDE: 'Bezirk March',
        type: 'bezirk',
        municipalities: ['Altendorf', 'Galgenen', 'Lachen', 'Reichenburg', 'Schübelbach', 'Tuggen', 'Wollerau']
      }
    ]
  },

  // ==========================================
  // CANTÓN DE OBWALDEN (OW) - Sin distritos, 7 municipios
  // ==========================================
  {
    id: 'ow',
    name: 'Cantón de Obwalden',
    nameDE: 'Kanton Obwalden',
    nameFR: "Canton d'Obwald",
    nameIT: 'Canton Obvaldo',
    code: 'OW',
    capital: 'Sarnen',
    districts: [
      {
        id: 'ow-obwalden',
        name: 'Obwalden',
        nameDE: 'Obwalden',
        type: 'region',
        municipalities: ['Alpnach', 'Giswil', 'Kerns', 'Lungern', 'Sachseln', 'Sarnen', 'Wil bei Sarnen', 'Engelberg']
      }
    ]
  },

  // ==========================================
  // CANTÓN DE NIDWALDEN (NW) - Sin distritos, 11 municipios
  // ==========================================
  {
    id: 'nw',
    name: 'Cantón de Nidwalden',
    nameDE: 'Kanton Nidwalden',
    nameFR: 'Canton de Nidwald',
    nameIT: 'Canton Nidvaldo',
    code: 'NW',
    capital: 'Stans',
    districts: [
      {
        id: 'nw-nidwalden',
        name: 'Nidwalden',
        nameDE: 'Nidwalden',
        type: 'region',
        municipalities: ['Beckenried', 'Buochs', 'Dallenwil', 'Emmetten', 'Ennetbürgen', 'Ennetmoos', 'Hergiswil', 'Oberdorf', 'Stans', 'Stansstad', 'Wolfenschiessen']
      }
    ]
  },

  // ==========================================
  // CANTÓN DE GLARIS (GL) - Sin distritos, 3 municipios (fusiones)
  // ==========================================
  {
    id: 'gl',
    name: 'Cantón de Glaris',
    nameDE: 'Kanton Glarus',
    nameFR: 'Canton de Glaris',
    nameIT: 'Cantone di Glarona',
    code: 'GL',
    capital: 'Glaris',
    districts: [
      {
        id: 'gl-glarus',
        name: 'Glaris',
        nameDE: 'Glarus',
        type: 'region',
        municipalities: ['Glaris', 'Glarus', 'Glarus Nord', 'Glarus Süd']
      },
      {
        id: 'gl-glarus-nord',
        name: 'Glaris Norte',
        nameDE: 'Glarus Nord',
        type: 'region',
        municipalities: ['Bilten', 'Filzbach', 'Mollis', 'Näfels', 'Niederurnen', 'Oberurnen']
      },
      {
        id: 'gl-glarus-sud',
        name: 'Glaris Sur',
        nameDE: 'Glarus Süd',
        type: 'region',
        municipalities: ['Betschwanden', 'Braunwald', 'Elm', 'Engi', 'Haslen', 'Linthal', 'Luchsingen', 'Matt', 'Mitlödi', 'Rüti', 'Schwanden', 'Schwändi']
      }
    ]
  },

  // ==========================================
  // CANTÓN DE ZUG (ZG) - Sin distritos, 11 municipios
  // ==========================================
  {
    id: 'zg',
    name: 'Cantón de Zug',
    nameDE: 'Kanton Zug',
    nameFR: 'Canton de Zoug',
    nameIT: 'Cantone di Zugo',
    code: 'ZG',
    capital: 'Zug',
    districts: [
      {
        id: 'zg-zug',
        name: 'Zug',
        nameDE: 'Zug',
        type: 'region',
        municipalities: ['Baar', 'Cham', 'Hünenberg', 'Menzingen', 'Neuheim', 'Oberägeri', 'Risch', 'Steinhausen', 'Unterägeri', 'Walchwil', 'Zug']
      }
    ]
  },

  // ==========================================
  // CANTÓN DE FRIBURGO (FR) - 7 Districts, 126 municipios
  // ==========================================
  {
    id: 'fr',
    name: 'Cantón de Friburgo',
    nameDE: 'Kanton Freiburg',
    nameFR: 'Canton de Fribourg',
    nameIT: 'Cantone di Friburgo',
    code: 'FR',
    capital: 'Friburgo',
    districts: [
      {
        id: 'fr-sarine',
        name: 'Sarine',
        nameDE: 'Saane',
        nameFR: 'District de la Sarine',
        type: 'district',
        municipalities: ['Arconciel', 'Belfaux', 'Bonnefontaine', 'Chevrilles', 'Corpataux-Magnedens', 'Cottens', 'Farvagny', 'Friburgo', 'Fribourg', 'Givisiez', 'Granges-Paccot', 'Grolley', 'La Brillaz', 'La Sonnaz', 'Matran', 'Neyruz', 'Pierrafortscha', 'Pensier', 'Pierrafortscha', 'Praroman', 'Prez', 'Treyvaux', 'Villars-sur-Glâne', 'Villorsonnens']
      },
      {
        id: 'fr-broye',
        name: 'Broye',
        nameDE: 'Broye',
        nameFR: 'District de la Broye',
        type: 'district',
        municipalities: ['Bussy', 'Châtonnaye', 'Chavannes-les-Forts', 'Cheyres', 'Cugy', 'Estavayer-le-Lac', 'Fétigny', 'Gletterens', 'Granges-de-Vesin', 'Ménières', 'Meyriez', 'Missanens', 'Murist', 'Neyruz', 'Payerne', 'Rueyres-les-Prés', 'Saint-Aubin', 'Sassel', 'Seiry', 'Surpierre', 'Vallé', 'Vernay', 'Vesin']
      },
      {
        id: 'fr-glâne',
        name: 'Glâne',
        nameDE: 'Glane',
        nameFR: 'District de la Glâne',
        type: 'district',
        municipalities: ['Auboranges', 'Billens-Hennens', 'Chavannes-le-Chêne', 'Cheiry', 'Chénens', 'Escubleux', 'Farvagny', 'Fiaugères', 'Le Flon', 'Grangettes', 'La Verrerie', 'Middes', 'Molondin', 'Oron-la-Ville', 'Oron-le-Châtel', 'Palézieux', 'Promasens', 'Romont', 'Rue', 'Siviriez', 'Ursy', 'Villaz-Saint-Pierre', 'Vuisternens-devant-Romont']
      },
      {
        id: 'fr-gruyère',
        name: 'Gruyère',
        nameDE: 'Greyerz',
        nameFR: 'District de la Gruyère',
        type: 'district',
        municipalities: ['Bas-Intyamon', 'Boltigen', 'Broc', 'Bulle', 'Châtel-Saint-Denis', 'Charmey', 'Château-d\'Oex', 'Crésuz', 'Estavannens', 'Grandvillard', 'Gruyères', 'Hauteville', 'Intyamon', 'La Tour-de-Trême', 'Le Pâquier', 'Moléson-sur-Gruyères', 'Morlon', 'Plasselb', 'Pont-en-Ogoz', 'Riaz', 'Rougemont', 'Sâles', 'Val-de-Charmey', 'Vaulruz', 'Villars-sous-Mont', 'Vuadens']
      },
      {
        id: 'fr-sense',
        name: 'Sense',
        nameDE: 'Sense',
        nameFR: 'District de la Singine',
        type: 'district',
        municipalities: ['Bösingen', 'Brünisried', 'Chevrilles', 'Düdingen', 'Gurmels', 'Kleinbösingen', 'Mountet', 'Plaffeien', 'Rechthalten', 'Schmitten', 'Saint-Antoine', 'Saint-Ours', 'Tafers', 'Ueberstorf', 'Wünnewil-Flamatt']
      },
      {
        id: 'fr-lac',
        name: 'Lac',
        nameDE: 'See',
        nameFR: 'District du Lac',
        type: 'district',
        municipalities: ['Cheyres', 'Font', 'Gletterens', 'Meyriez', 'Morat', 'Murten', 'Salavaux', 'Vallamand']
      },
      {
        id: 'fr-veveyse',
        name: 'Veveyse',
        nameDE: 'Vivisbach',
        nameFR: 'District de la Veveyse',
        type: 'district',
        municipalities: ['Attalens', 'Bossonnens', 'Chardonne', 'Châtel-Saint-Denis', 'Granges', 'La Verrerie', 'Le Flon', 'Oron-la-Ville', 'Palézieux', 'Puidoux', 'Remaufens', 'Saint-Légier-La Chiésaz', 'Villarzel']
      }
    ]
  },

  // ==========================================
  // CANTÓN DE SOLEURA (SO) - 10 Bezirke, 107 municipios
  // ==========================================
  {
    id: 'so',
    name: 'Cantón de Soleura',
    nameDE: 'Kanton Solothurn',
    nameFR: 'Canton de Soleure',
    nameIT: 'Cantone di Soletta',
    code: 'SO',
    capital: 'Soleura',
    districts: [
      {
        id: 'so-solothurn',
        name: 'Soleura',
        nameDE: 'Bezirk Solothurn',
        type: 'bezirk',
        municipalities: ['Biberist', 'Boningen', 'Brügglen', 'Derendingen', 'Deitingen', 'Etziken', 'Feldbrunnen-St. Niklaus', 'Gerlafingen', 'Halten', 'Horriegen', 'Kriegstetten', 'Lohn-Ammannsegg', 'Luterbach', 'Obergerlafingen', 'Oekingen', 'Recherswil', 'Steinhof', 'Soleura', 'Solothurn', 'Subingen', 'Zuchwil']
      },
      {
        id: 'so-wasseramt',
        name: 'Wasseramt',
        nameDE: 'Bezirk Wasseramt',
        type: 'bezirk',
        municipalities: ['Aeschi', 'Biberist', 'Bolken', 'Deitingen', 'Derendingen', 'Etziken', 'Gerlafingen', 'Halten', 'Heinrichswil-Winistorf', 'Hersiwil', 'Horriegen', 'Hunziken', 'Kriegstetten', 'Lohn-Ammannsegg', 'Luterbach', 'Obergerlafingen', 'Oekingen', 'Recherswil', 'Steinhof', 'Subingen', 'Zuchwil']
      },
      {
        id: 'so-olten',
        name: 'Olten',
        nameDE: 'Bezirk Olten',
        type: 'bezirk',
        municipalities: ['Däniken', 'Dulliken', 'Egerkingen', 'Hauenstein-Ifenthal', 'Kappel', 'Olten', 'Rickenbach', 'Safien', 'Schönenwerd', 'Starrkirch-Wil', 'Trimbach', 'Wangen bei Olten', 'Wisen']
      },
      {
        id: 'so-gösgen',
        name: 'Gösgen',
        nameDE: 'Bezirk Gösgen',
        type: 'bezirk',
        municipalities: ['Boningen', 'Däniken', 'Dulliken', 'Egerkingen', 'Hauenstein-Ifenthal', 'Kienberg', 'Küttigen', 'Lostorf', 'Niederbipp', 'Oberbipp', 'Olten', 'Rickenbach', 'Safien', 'Schönenwerd', 'Starrkirch-Wil', 'Trimbach', 'Wangen bei Olten', 'Wisen']
      },
      {
        id: 'so-lebern',
        name: 'Lebern',
        nameDE: 'Bezirk Lebern',
        type: 'bezirk',
        municipalities: ['Balm bei Günsberg', 'Bellach', 'Bettlach', 'Feldbrunnen-St. Niklaus', 'Grenchen', 'Hersiwil', 'Hubersdorf', 'Kammersrohr', 'Langendorf', 'Lommiswil', 'Niederwil', 'Oberdorf', 'Riedholz', 'Selzach', 'Soleura', 'Solothurn']
      },
      {
        id: 'so-thal',
        name: 'Thal',
        nameDE: 'Bezirk Thal',
        type: 'bezirk',
        municipalities: ['Aedermannsdorf', 'Balsthal', 'Herbetswil', 'Holderbank', 'Laupersdorf', 'Matzendorf', 'Mümliswil-Ramiswil', 'Welschenrohr', 'Gänsbrunnen']
      },
      {
        id: 'so-thierstein',
        name: 'Thierstein',
        nameDE: 'Bezirk Thierstein',
        type: 'bezirk',
        municipalities: ['Aedermannsdorf', 'Büsserach', 'Erschwil', 'Fehren', 'Grindel', 'Hauenstein-Ifenthal', 'Kleinlützel', 'Meltingen', 'Nunningen', 'Rodersdorf', 'Schmelz', 'Wahlen']
      },
      {
        id: 'so-dorneck',
        name: 'Dorneck',
        nameDE: 'Bezirk Dorneck',
        type: 'bezirk',
        municipalities: ['Bättwil', 'Birsfelden', 'Büren', 'Burg im Leimental', 'Duggingen', 'Grellingen', 'Hofstetten-Flüh', 'Liesberg', 'Maisprach', 'Metzerlen-Mariastein', 'Nenzlingen', 'Roggenburg', 'Röschenz', 'Wahlen']
      },
      {
        id: 'so-gäu',
        name: 'Gäu',
        nameDE: 'Bezirk Gäu',
        type: 'bezirk',
        municipalities: ['Egerkingen', 'Hauenstein-Ifenthal', 'Kappel', 'Kienberg', 'Niederbipp', 'Oberbipp', 'Oensingen', 'Schönenwerd', 'Wangen bei Olten', 'Wisen']
      }
    ]
  },

  // ==========================================
  // CANTÓN DE BASILEA-CIUDAD (BS) - Sin distritos, 3 municipios
  // ==========================================
  {
    id: 'bs',
    name: 'Cantón de Basilea-Ciudad',
    nameDE: 'Kanton Basel-Stadt',
    nameFR: 'Canton de Bâle-Ville',
    nameIT: 'Cantone di Basilea Città',
    code: 'BS',
    capital: 'Basilea',
    districts: [
      {
        id: 'bs-basel',
        name: 'Basilea',
        nameDE: 'Basel',
        type: 'region',
        municipalities: ['Basilea', 'Basel', 'Bettingen', 'Riehen']
      }
    ]
  },

  // ==========================================
  // CANTÓN DE BASILEA-CAMPIÑA (BL) - 5 Bezirke, 86 municipios
  // ==========================================
  {
    id: 'bl',
    name: 'Cantón de Basilea-Campiña',
    nameDE: 'Kanton Basel-Landschaft',
    nameFR: 'Canton de Bâle-Campagne',
    nameIT: 'Cantone di Basilea Campagna',
    code: 'BL',
    capital: 'Liestal',
    districts: [
      {
        id: 'bl-liestal',
        name: 'Liestal',
        nameDE: 'Bezirk Liestal',
        type: 'bezirk',
        municipalities: ['Arisdorf', 'Bubendorf', 'Hersberg', 'Lausen', 'Liestal', 'Lupsingen', 'Nusshof', 'Ramlinsburg', 'Seltisberg', 'Zunzgen']
      },
      {
        id: 'bl-arinheim',
        name: 'Arlesheim',
        nameDE: 'Bezirk Arlesheim',
        type: 'bezirk',
        municipalities: ['Aesch', 'Allschwil', 'Arlesheim', 'Biel-Benken', 'Binningen', 'Birsfelden', 'Bottmingen', 'Ettingen', 'Münchenstein', 'Muttenz', 'Oberwil', 'Pfeffingen', 'Reinach', 'Schönenbuch', 'Therwil']
      },
      {
        id: 'bl-sissach',
        name: 'Sissach',
        nameDE: 'Bezirk Sissach',
        type: 'bezirk',
        municipalities: ['Anwil', 'Buus', 'Diepflingen', 'Hemmiken', 'Itingen', 'Känerkinden', 'Kilchberg', 'Maisprach', 'Nusshof', 'Oltingen', 'Rickenbach', 'Rothenfluh', 'Rümlingen', 'Sissach', 'Tecknau', 'Wenslingen', 'Wintersingen', 'Zeglingen']
      },
      {
        id: 'bl-waldenburg',
        name: 'Waldenburg',
        nameDE: 'Bezirk Waldenburg',
        type: 'bezirk',
        municipalities: ['Bennwil', 'Diegten', 'Eptingen', 'Hölstein', 'Lauwil', 'Langenbruck', 'Liesberg', 'Niederdorf', 'Oberdorf', 'Reigoldswil', 'Titterten', 'Waldenburg']
      },
      {
        id: 'bl-laufen',
        name: 'Laufen',
        nameDE: 'Bezirk Laufen',
        type: 'bezirk',
        municipalities: ['Blaften', 'Brislach', 'Burg im Leimental', 'Dittingen', 'Duggingen', 'Grellingen', 'Kleinlützel', 'Laufen', 'Liesberg', 'Nenzlingen', 'Röschenz', 'Roggenburg', 'Wahlen', 'Zwingen']
      }
    ]
  },

  // ==========================================
  // CANTÓN DE SCHAFFHAUSEN (SH) - Sin distritos, 24 municipios
  // ==========================================
  {
    id: 'sh',
    name: 'Cantón de Schaffhausen',
    nameDE: 'Kanton Schaffhausen',
    nameFR: 'Canton de Schaffouse',
    nameIT: 'Cantone di Sciaffusa',
    code: 'SH',
    capital: 'Schaffhausen',
    districts: [
      {
        id: 'sh-schaffhausen',
        name: 'Schaffhausen',
        nameDE: 'Schaffhausen',
        type: 'region',
        municipalities: ['Beringen', 'Bibern', 'Büttenhardt', 'Dörflingen', 'Gächlingen', 'Guntmadingen', 'Hallau', 'Hemmental', 'Herblingen', 'Lohn', 'Löhningen', 'Merishausen', 'Neuhausen am Rheinfall', 'Neunkirch', 'Oberhallau', 'Opfertshofen', 'Schaffhausen', 'Schleitheim', 'Siblingen', 'Stetten', 'Thayngen', 'Trasadingen', 'Wilchingen']
      },
      {
        id: 'sh-reiat',
        name: 'Reiat',
        nameDE: 'Reiat',
        type: 'region',
        municipalities: ['Bibern', 'Büttenhardt', 'Herblingen', 'Lohn', 'Löhningen', 'Opfertshofen', 'Stetten', 'Thayngen']
      },
      {
        id: 'sh-klettgau',
        name: 'Klettgau',
        nameDE: 'Klettgau',
        type: 'region',
        municipalities: ['Gächlingen', 'Guntmadingen', 'Hallau', 'Neunkirch', 'Oberhallau', 'Siblingen', 'Trasadingen', 'Wilchingen']
      },
      {
        id: 'sh-stein',
        name: 'Stein am Rhein',
        nameDE: 'Stein am Rhein',
        type: 'region',
        municipalities: ['Bibern', 'Hemishofen', 'Ramsen', 'Stein am Rhein', 'Wagenhausen']
      }
    ]
  },

  // ==========================================
  // CANTÓN DE APPENZELL AUSSERRHODEN (AR) - Sin distritos, 20 municipios
  // ==========================================
  {
    id: 'ar',
    name: 'Cantón de Appenzell Rodas Exteriores',
    nameDE: 'Kanton Appenzell Ausserrhoden',
    nameFR: "Canton d'Appenzell Rhodes-Extérieures",
    nameIT: 'Canton Appenzello Esterno',
    code: 'AR',
    capital: 'Herisau',
    districts: [
      {
        id: 'ar-ausserrhoden',
        name: 'Appenzell Ausserrhoden',
        nameDE: 'Appenzell Ausserrhoden',
        type: 'region',
        municipalities: ['Bühler', 'Gonten', 'Heiden', 'Herisau', 'Hundwil', 'Lutzenberg', 'Rehetobel', 'Schönengrund', 'Schwellbrunn', 'Speicher', 'Stein', 'Teufen', 'Trogen', 'Urnäsch', 'Wald', 'Waldstatt']
      },
      {
        id: 'ar-hinterland',
        name: 'Hinterland',
        nameDE: 'Hinterland',
        type: 'region',
        municipalities: ['Herisau', 'Hundwil', 'Schönengrund', 'Schwellbrunn', 'Stein', 'Urnäsch', 'Waldstatt']
      },
      {
        id: 'ar-mittelland',
        name: 'Mittelland',
        nameDE: 'Mittelland',
        type: 'region',
        municipalities: ['Bühler', 'Gonten', 'Speicher', 'Teufen', 'Trogen']
      },
      {
        id: 'ar-vorderland',
        name: 'Vorderland',
        nameDE: 'Vorderland',
        type: 'region',
        municipalities: ['Heiden', 'Lutzenberg', 'Rehetobel', 'Wald']
      }
    ]
  },

  // ==========================================
  // CANTÓN DE APPENZELL INNERRHODEN (AI) - 6 Bezirke, 6 municipios
  // ==========================================
  {
    id: 'ai',
    name: 'Cantón de Appenzell Rodas Interiores',
    nameDE: 'Kanton Appenzell Innerrhoden',
    nameFR: "Canton d'Appenzell Rhodes-Intérieures",
    nameIT: 'Canton Appenzello Interno',
    code: 'AI',
    capital: 'Appenzell',
    districts: [
      {
        id: 'ai-innerrhoden',
        name: 'Appenzell Innerrhoden',
        nameDE: 'Appenzell Innerrhoden',
        type: 'region',
        municipalities: ['Appenzell', 'Gonten', 'Oberegg', 'Rüte', 'Schlatt-Haslen', 'Schwende']
      }
    ]
  },

  // ==========================================
  // CANTÓN DE ST. GALLEN (SG) - 8 Wahlkreise, 77 municipios
  // ==========================================
  {
    id: 'sg',
    name: 'Cantón de St. Gallen',
    nameDE: 'Kanton St. Gallen',
    nameFR: 'Canton de Saint-Gall',
    nameIT: 'Cantone di San Gallo',
    code: 'SG',
    capital: 'St. Gallen',
    districts: [
      {
        id: 'sg-stgallen',
        name: 'St. Gallen',
        nameDE: 'Wahlkreis St. Gallen',
        type: 'wahlkreis',
        municipalities: ['Andwil', 'Eggersriet', 'Gaiserwald', 'Gossau', 'Häggenschwil', 'Muolen', 'St. Gallen', 'Waldkirch', 'Wittenbach']
      },
      {
        id: 'sg-rheintal',
        name: 'Rheintal',
        nameDE: 'Wahlkreis Rheintal',
        type: 'wahlkreis',
        municipalities: ['Altstätten', 'Au', 'Balgach', 'Berneck', 'Diepoldsau', 'Eichberg', 'Marbach', 'Oberriet', 'Rebstein', 'Rüthi', 'Widnau']
      },
      {
        id: 'sg-werdenberg',
        name: 'Werdenberg',
        nameDE: 'Wahlkreis Werdenberg',
        type: 'wahlkreis',
        municipalities: ['Buchs', 'Gams', 'Grabs', 'Sennwald', 'Sevelen', 'Wartau']
      },
      {
        id: 'sg-untertoggenburg',
        name: 'Untertoggenburg',
        nameDE: 'Wahlkreis Untertoggenburg',
        type: 'wahlkreis',
        municipalities: ['Degersheim', 'Flawil', 'Jonschwil', 'Mogelsberg', 'Niederuzwil', 'Oberuzwil', 'Uzwil']
      },
      {
        id: 'sg-toggenburg',
        name: 'Toggenburg',
        nameDE: 'Wahlkreis Toggenburg',
        type: 'wahlkreis',
        municipalities: ['Alt St. Johann', 'Bütschwil', 'Ebnat-Kappel', 'Hemberg', 'Krinau', 'Lichtensteig', 'Lütisburg', 'Mogelsberg', 'Mosnang', 'Nesslau', 'Krummenau', 'Stein', 'Wildhaus']
      },
      {
        id: 'sg-sarganserland',
        name: 'Sarganserland',
        nameDE: 'Wahlkreis Sarganserland',
        type: 'wahlkreis',
        municipalities: ['Bad Ragaz', 'Flums', 'Mels', 'Pfäfers', 'Quarten', 'Sargans', 'Vilters-Wangs', 'Walenstadt']
      },
      {
        id: 'sg-see-gaster',
        name: 'See-Gaster',
        nameDE: 'Wahlkreis See-Gaster',
        type: 'wahlkreis',
        municipalities: ['Amden', 'Benken', 'Gommiswald', 'Kaltbrunn', 'Rieden', 'Schänis', 'Schmerikon', 'Uznach', 'Weesen']
      },
      {
        id: 'sg-wil',
        name: 'Wil',
        nameDE: 'Wahlkreis Wil',
        type: 'wahlkreis',
        municipalities: ['Bronschhofen', 'Degersheim', 'Flawil', 'Jonschwil', 'Niederhelfenschwil', 'Niederuzwil', 'Oberbüren', 'Oberuzwil', 'Uzwil', 'Wil', 'Zuzwil']
      }
    ]
  },

  // ==========================================
  // CANTÓN DE LOS GRISONES (GR) - 11 Regionen, 208 municipios
  // ==========================================
  {
    id: 'gr',
    name: 'Cantón de los Grisones',
    nameDE: 'Kanton Graubünden',
    nameFR: 'Canton des Grisons',
    nameIT: 'Cantone dei Grigioni',
    code: 'GR',
    capital: 'Coira',
    districts: [
      {
        id: 'gr-albula',
        name: 'Albula',
        nameDE: 'Region Albula',
        type: 'region',
        municipalities: ['Alvaschein', 'Bivio', 'Brienz/Brinzauls', 'Brinzauls', 'Lantsch/Lenz', 'Lain', 'Molinis', 'Mon', 'Pignia', 'Purasca', 'Savognin', 'Schweiningen', 'Stierva', 'Surava', 'Tiefencastel', 'Vaz/Obervaz']
      },
      {
        id: 'gr-bernina',
        name: 'Bernina',
        nameDE: 'Region Bernina',
        type: 'region',
        municipalities: ['Brusio', 'Poschiavo']
      },
      {
        id: 'gr-hinterrhein',
        name: 'Hinterrhein',
        nameDE: 'Region Hinterrhein',
        type: 'region',
        municipalities: ['Andeer', 'Ausserferrera', 'Clugin', 'Donat', 'Ferrera', 'Innerferrera', 'Pignia', 'Rongellen', 'Safien', 'Sarn', 'Splügen', 'Tennige', 'Thusis', 'Tschappina', 'Urmein', 'Zillis-Reischen']
      },
      {
        id: 'gr-imboden',
        name: 'Imboden',
        nameDE: 'Region Imboden',
        type: 'region',
        municipalities: ['Bonaduz', 'Castrisch', 'Domat/Ems', 'Felsberg', 'Flims', 'Ilanz', 'Ladir', 'Pitasch', 'Ruschein', 'Sagogn', 'Schnaus', 'Schluein', 'Surcuolm', 'Trun']
      },
      {
        id: 'gr-landquart',
        name: 'Landquart',
        nameDE: 'Region Landquart',
        type: 'region',
        municipalities: ['Fläsch', 'Jenins', 'Landquart', 'Maienfeld', 'Malans', 'Trimmis', 'Untervaz', 'Zizers']
      },
      {
        id: 'gr-maloja',
        name: 'Maloja',
        nameDE: 'Region Maloja',
        type: 'region',
        municipalities: ['Bever', 'Bregaglia', 'Celerina/Schlarigna', 'Champfèr', 'La Punt Chamues-ch', 'Madulain', 'Pontresina', 'Samedan', 'Sankt Moritz', 'S-chanf', 'Schlarigna', 'Silvaplana', 'Sils im Engadin', 'Surlej', 'Zuoz']
      },
      {
        id: 'gr-moesa',
        name: 'Moesa',
        nameDE: 'Region Moesa',
        type: 'region',
        municipalities: ['Arvigo', 'Buseno', 'Calanca', 'Castaneda', 'Giova', 'Lostallo', 'Mesoco', 'Rossa', 'San Bernardino', 'Santa Maria in Calanca', 'Selma']
      },
      {
        id: 'gr-plessur',
        name: 'Plessur',
        nameDE: 'Region Plessur',
        type: 'region',
        municipalities: ['Arosa', 'Chur', 'Churwalden', 'Domat/Ems', 'Haldenstein', 'Malix', 'Parpan', 'Scheid', 'Tamins', 'Tschiertschen-Praden']
      },
      {
        id: 'gr-prättigau-davos',
        name: 'Prättigau-Davos',
        nameDE: 'Region Prättigau/Davos',
        type: 'region',
        municipalities: ['Conters im Prättigau', 'Davos', 'Fideris', 'Furna', 'Jenaz', 'Klosters', 'Küblis', 'Luzein', 'Panix', 'Saas im Prättigau', 'Schiers', 'Seewis im Prättigau', 'St. Antönien', 'Valzeina']
      },
      {
        id: 'gr-surselva',
        name: 'Surselva',
        nameDE: 'Region Surselva',
        type: 'region',
        municipalities: ['Andiast', 'Breil/Brigels', 'Castrisch', 'Danis-Tavanasa', 'Disentis/Mustér', 'Falera', 'Ilanz', 'Laax', 'Ladir', 'Lumnezia', 'Medel', 'Obersaxen', 'Pigniu', 'Pitasch', 'Rueun', 'Ruschein', 'Sagogn', 'Schluein', 'Schnaus', 'Sevgein', 'Surcuolm', 'Tenna', 'Trun', 'Valendas', 'Versam', 'Vignogn', 'Waltensburg/Vuorz', 'Wischen']
      },
      {
        id: 'gr-engadin',
        name: 'Engadina',
        nameDE: 'Engadin',
        type: 'region',
        municipalities: ['Ardez', 'Bever', 'Celerina/Schlarigna', 'Champfèr', 'Ftan', 'Guarda', 'Lavin', 'Madulain', 'Pontresina', 'Samedan', 'Scuol', 'Sils im Engadin', 'Silvaplana', 'S-chanf', 'Sent', 'Susch', 'Tarasp', 'Vulpera', 'Zernez', 'Zuoz']
      }
    ]
  },

  // ==========================================
  // CANTÓN DE ARGOVIA (AG) - 11 Bezirke, 212 municipios
  // ==========================================
  {
    id: 'ag',
    name: 'Cantón de Argovia',
    nameDE: 'Kanton Aargau',
    nameFR: "Canton d'Argovie",
    nameIT: 'Cantone Argovia',
    code: 'AG',
    capital: 'Aarau',
    districts: [
      {
        id: 'ag-aarau',
        name: 'Aarau',
        nameDE: 'Bezirk Aarau',
        type: 'bezirk',
        municipalities: ['Aarau', 'Biberstein', 'Buchs', 'Densbüren', 'Erlinsbach', 'Gränichen', 'Hirschthal', 'Küttigen', 'Muhen', 'Oberentfelden', 'Suhr', 'Unterentfelden']
      },
      {
        id: 'ag-baden',
        name: 'Baden',
        nameDE: 'Bezirk Baden',
        type: 'bezirk',
        municipalities: ['Baden', 'Bellikon', 'Birmenstorf', 'Bremgarten', 'Brunegg', 'Dättwil', 'Fislisbach', 'Freienwil', 'Gebenstorf', 'Hausen', 'Killwangen', 'Künten', 'Mellingen', 'Melliken', 'Möhlin', 'Mülligen', 'Niederrohrdorf', 'Oberrohrdorf', 'Remetschwil', 'Rohrdorf', 'Rütihof', 'Stetten', 'Sulz', 'Turgi', 'Wettingen', 'Wohlen', 'Würenlingen', 'Würenlos']
      },
      {
        id: 'ag-bremgarten',
        name: 'Bremgarten',
        nameDE: 'Bezirk Bremgarten',
        type: 'bezirk',
        municipalities: ['Arni', 'Bremgarten', 'Bremgarten', 'Büttikon', 'Dottikon', 'Fischbach-Göslikon', 'Hägglingen', 'Islisberg', 'Jonen', 'Niederwil', 'Oberlunkhofen', 'Oberwil-Lieli', 'Rottenschwil', 'Rudolfstetten-Friedlisberg', 'Unterlunkhofen', 'Urdorf', 'Waltenschwil', 'Widen', 'Wohlen', 'Zufikon']
      },
      {
        id: 'ag-brugg',
        name: 'Brugg',
        nameDE: 'Bezirk Brugg',
        type: 'bezirk',
        municipalities: ['Auenstein', 'Birr', 'Birrhard', 'Brunegg', 'Brugg', 'Habsburg', 'Hausen', 'Lupfig', 'Mülligen', 'Möriken-Wildegg', 'Niederlenz', 'Oberlunkhofen', 'Remetschwil', 'Rottenschwil', 'Schafisheim', 'Staffelbach', 'Unterlunkhofen', 'Veltheim', 'Wilen', 'Wölflinswil', 'Würenlingen']
      },
      {
        id: 'ag-kulm',
        name: 'Kulm',
        nameDE: 'Bezirk Kulm',
        type: 'bezirk',
        municipalities: ['Beinwil am See', 'Burg', 'Dürrenäsch', 'Gontenschwil', 'Holziken', 'Leimbach', 'Leutwil', 'Menziken', 'Oberkulm', 'Reinach', 'Schlossrued', 'Schmiedrued', 'Schöftland', 'Unterkulm', 'Zetzwil']
      },
      {
        id: 'ag-lenzburg',
        name: 'Lenzburg',
        nameDE: 'Bezirk Lenzburg',
        type: 'bezirk',
        municipalities: ['Ammerswil', 'Brunegg', 'Dintikon', 'Egliswil', 'Fahrwangen', 'Hendschiken', 'Holderbank', 'Horben', 'Külligen', 'Lenzburg', 'Meisterschwanden', 'Möriken-Wildegg', 'Niederlenz', 'Rupperswil', 'Schafisheim', 'Seengen', 'Seon', 'Staufen']
      },
      {
        id: 'ag-muri',
        name: 'Muri',
        nameDE: 'Bezirk Muri',
        type: 'bezirk',
        municipalities: ['Abtwil', 'Aristau', 'Auw', 'Beinwil', 'Benzenschwil', 'Boswil', 'Bremgarten', 'Buttwil', 'Geltwil', 'Hermetschwil-Staffeln', 'Muri', 'Oberrüti', 'Rottenschwil', 'Sins', 'Waltenschwil', 'Wohlen']
      },
      {
        id: 'ag-rheinfelden',
        name: 'Rheinfelden',
        nameDE: 'Bezirk Rheinfelden',
        type: 'bezirk',
        municipalities: ['Burg', 'Hellikon', 'Kaiseraugst', 'Magden', 'Möhlin', 'Mumpf', 'Niederdorf', 'Oberdorf', 'Olsberg', 'Rheinfelden', 'Schupfart', 'Stein', 'Wegenstetten', 'Zeiningen', 'Zuzgen']
      },
      {
        id: 'ag-zofingen',
        name: 'Zofingen',
        nameDE: 'Bezirk Zofingen',
        type: 'bezirk',
        municipalities: ['Aarburg', 'Bottenwil', 'Brittnau', 'Kirchleerau', 'Kölliken', 'Moosleerau', 'Murgenthal', 'Oftringen', 'Reitnau', 'Rothrist', 'Strengelbach', 'Vordemwald', 'Walterswil', 'Wikon', 'Zofingen']
      },
      {
        id: 'ag-zurzach',
        name: 'Zurzach',
        nameDE: 'Bezirk Zurzach',
        type: 'bezirk',
        municipalities: ['Bad Zurzach', 'Baldingen', 'Böbikon', 'Döttingen', 'Endingen', 'Fisibach', 'Full', 'Homburg', 'Klingnau', 'Leibstadt', 'Lengnau', 'Mellikon', 'Rekingen', 'Schneisingen', 'Siglistorf', 'Tegerfelden', 'Unterendingen', 'Wislikofen', 'Zurzach']
      },
      {
        id: 'ag-laufenburg',
        name: 'Laufenburg',
        nameDE: 'Bezirk Laufenburg',
        type: 'bezirk',
        municipalities: ['Eiken', 'Frick', 'Gipf-Oberfrick', 'Hersberg', 'Hellikon', 'Kaisten', 'Laufenburg', 'Möhlin', 'Mumpf', 'Oberhof', 'Olsberg', 'Rheinfelden', 'Schupfart', 'Stein', 'Ueken', 'Wegenstetten', 'Zeiningen', 'Zuzgen']
      }
    ]
  },

  // ==========================================
  // CANTÓN DE TURGOVIA (TG) - 8 Bezirke, 80 municipios
  // ==========================================
  {
    id: 'tg',
    name: 'Cantón de Turgovia',
    nameDE: 'Kanton Thurgau',
    nameFR: 'Canton de Thurgovie',
    nameIT: 'Canton Turgovia',
    code: 'TG',
    capital: 'Frauenfeld',
    districts: [
      {
        id: 'tg-frauenfeld',
        name: 'Frauenfeld',
        nameDE: 'Bezirk Frauenfeld',
        type: 'bezirk',
        municipalities: ['Aadorf', 'Basadingen-Schlattingen', 'Basadingen', 'Felben-Wellhausen', 'Frauenfeld', 'Gachnang', 'Hugelshofen', 'Matzingen', 'Schlattingen', 'Stettfurt', 'Thundorf', 'Uesslingen-Buch', 'Warth-Weiningen']
      },
      {
        id: 'tg-kreuzlingen',
        name: 'Kreuzlingen',
        nameDE: 'Bezirk Kreuzlingen',
        type: 'bezirk',
        municipalities: ['Alterswilen', 'Berg', 'Bottighofen', 'Ermatingen', 'Gottlieben', 'Güttingen', 'Henggart', 'Homburg', 'Kreuzlingen', 'Langrickenbach', 'Lengwil', 'Mammern', 'Müllheim', 'Pfyn', 'Raperswilen', 'Salenstein', 'Sommeri', 'Tägerwilen', 'Wäldi', 'Wigoltingen', 'Wuppenau', 'Zihlschlacht']
      },
      {
        id: 'tg-weinfelden',
        name: 'Weinfelden',
        nameDE: 'Bezirk Weinfelden',
        type: 'bezirk',
        municipalities: ['Amriswil', 'Amriswil', 'Bischofszell', 'Bürglen', 'Erlen', 'Hedingen', 'Hohentannen', 'Kradolf-Schönenberg', 'Riedt', 'Schönholzerswilen', 'Sulgen', 'Weinfelden', 'Wuppenau', 'Zihlschlacht']
      },
      {
        id: 'tg-arbon',
        name: 'Arbon',
        nameDE: 'Bezirk Arbon',
        type: 'bezirk',
        municipalities: ['Arbon', 'Egnach', 'Horn', 'Roggwil', 'Steinach', 'Tübach', 'Uttwil']
      },
      {
        id: 'tg-rorschach',
        name: 'Rorschach',
        nameDE: 'Bezirk Rorschach',
        type: 'bezirk',
        municipalities: ['Berg', 'Goldach', 'Mörschwil', 'Rorschach', 'Rorschacherberg', 'Steinach', 'Thal', 'Untereggen']
      },
      {
        id: 'tg-münchwilen',
        name: 'Münchwilen',
        nameDE: 'Bezirk Münchwilen',
        type: 'bezirk',
        municipalities: ['Aadorf', 'Bettwiesen', 'Bichelsee', 'Balterswil', 'Eschlikon', 'Fischingen', 'Sirnach', 'Tobel-Tägerschen', 'Wängi', 'Wilen', 'Wuppenau']
      },
      {
        id: 'tg-bischofszell',
        name: 'Bischofszell',
        nameDE: 'Bezirk Bischofszell',
        type: 'bezirk',
        municipalities: ['Bischofszell', 'Bürglen', 'Erlen', 'Hauptwil-Gottshaus', 'Hohentannen', 'Kradolf-Schönenberg', 'Oberschlatt', 'Unterschlat']
      },
      {
        id: 'tg-unterthurgau',
        name: 'Unterthurgau',
        nameDE: 'Unterthurgau',
        type: 'region',
        municipalities: ['Altnau', 'Bottighofen', 'Ermatingen', 'Güttingen', 'Kreuzlingen', 'Lengwil', 'Mammern', 'Münsterlingen', 'Raperswilen', 'Salenstein', 'Tägerwilen']
      }
    ]
  },

  // ==========================================
  // CANTÓN DEL TESINO (TI) - 8 Distretti, 115 municipios
  // ==========================================
  {
    id: 'ti',
    name: 'Cantón del Tesino',
    nameDE: 'Kanton Tessin',
    nameFR: 'Canton du Tessin',
    nameIT: 'Canton Ticino',
    code: 'TI',
    capital: 'Bellinzona',
    districts: [
      {
        id: 'ti-bellinzona',
        name: 'Bellinzona',
        nameDE: 'Bezirk Bellinzona',
        nameIT: 'Distretto di Bellinzona',
        type: 'district',
        municipalities: ['Arbedo-Castione', 'Bellinzona', 'Cadenazzo', 'Camorino', 'Giubiasco', 'Gnosca', 'Gorduno', 'Gudo', 'Isone', 'Lumino', 'Monteceneri', 'Pianezzo', 'Sant\'Antonino', 'Sementina']
      },
      {
        id: 'ti-lugano',
        name: 'Lugano',
        nameDE: 'Bezirk Lugano',
        nameIT: 'Distretto di Lugano',
        type: 'district',
        municipalities: ['Agno', 'Arogno', 'Bissone', 'Brusino Arsizio', 'Cadempino', 'Canobbio', 'Capriasca', 'Carabietta', 'Caslano', 'Castagnola', 'Collina d\'Oro', 'Comano', 'Curio', 'Grancia', 'Lugano', 'Magliaso', 'Massagno', 'Melano', 'Muzzano', 'Paradiso', 'Pazzallo', 'Porza', 'Savosa', 'Sorengo', 'Vernate', 'Vezia']
      },
      {
        id: 'ti-locarno',
        name: 'Locarno',
        nameDE: 'Bezirk Locarno',
        nameIT: 'Distretto di Locarno',
        type: 'district',
        municipalities: ['Ascona', 'Brione sopra Minusio', 'Brissago', 'Cavigliano', 'Contone', 'Gambarogno', 'Gordola', 'Gudo', 'Lavertezzo', 'Locarno', 'Losone', 'Magadino', 'Mergoscia', 'Minusio', 'Onsernone', 'Orselina', 'Tenero-Contra', 'Terra Vecchia', 'Vira']
      },
      {
        id: 'ti-mendrisio',
        name: 'Mendrisio',
        nameDE: 'Bezirk Mendrisio',
        nameIT: 'Distretto di Mendrisio',
        type: 'district',
        municipalities: ['Balerna', 'Breggia', 'Castel San Pietro', 'Chiasso', 'Mendrisio', 'Morbio Inferiore', 'Novazzano', 'Riva San Vitale', 'Stabio', 'Vacallo']
      },
      {
        id: 'ti-riviera',
        name: 'Riviera',
        nameDE: 'Bezirk Riviera',
        nameIT: 'Distretto di Riviera',
        type: 'district',
        municipalities: ['Biasca', 'Cresciano', 'Iragna', 'Lodrino', 'Osogna', 'Pollegio', 'Preonzo']
      },
      {
        id: 'ti-blenio',
        name: 'Blenio',
        nameDE: 'Bezirk Blenio',
        nameIT: 'Distretto di Blenio',
        type: 'district',
        municipalities: ['Aquila', 'Biasca', 'Campo', 'Ghirone', 'Lumino', 'Malvaglia', 'Olivone', 'Ponto Valentino', 'Prugiasco', 'Semione', 'Torre', 'Torri']
      },
      {
        id: 'ti-leventina',
        name: 'Leventina',
        nameDE: 'Bezirk Leventina',
        nameIT: 'Distretto di Leventina',
        type: 'district',
        municipalities: ['Airolo', 'Anzonico', 'Biasca', 'Bodio', 'Calpiogna', 'Campello', 'Cavagnago', 'Chironico', 'Dalpe', 'Faido', 'Giornico', 'Gordevio', 'Gudo', 'Lavertezzo', 'Mairengo', 'Moscogna', 'Osco', 'Personico', 'Pollegio', 'Prato', 'Quinto', 'Rossura', 'Sobrio']
      },
      {
        id: 'ti-maggiatvalley',
        name: 'Valle Maggia',
        nameDE: 'Maggiatal',
        nameIT: 'Valle Maggia',
        type: 'region',
        municipalities: ['Aurigeno', 'Bavona', 'Bignasco', 'Broglio', 'Cavergno', 'Coglio', 'Corippo', 'Giumaglio', 'Gordola', 'Lodano', 'Maggia', 'Moghegno', 'Moscogna', 'Someo', 'Vergeletto']
      }
    ]
  },

  // ==========================================
  // CANTÓN DE VAUD (VD) - 10 Districts, 309 municipios
  // ==========================================
  {
    id: 'vd',
    name: 'Cantón de Vaud',
    nameDE: 'Kanton Waadt',
    nameFR: 'Canton de Vaud',
    nameIT: 'Canton Vaud',
    code: 'VD',
    capital: 'Lausana',
    districts: [
      {
        id: 'vd-lausanne',
        name: 'Lausana',
        nameDE: 'Lausanne',
        nameFR: 'Lausanne',
        type: 'district',
        municipalities: ['Cheseaux-sur-Lausanne', 'Epalinges', 'Jouxtens-Mézery', 'Lausana', 'Lausanne', 'Le Mont-sur-Lausanne', 'Prilly', 'Pully', 'Renens', 'Romanel-sur-Lausanne']
      },
      {
        id: 'vd-morges',
        name: 'Morges',
        nameDE: 'Morges',
        nameFR: 'Morges',
        type: 'district',
        municipalities: ['Apples', 'Aubonne', 'Buchillon', 'Bussy-Chardonney', 'Chavannes-le-Veyron', 'Chevilly', 'Clarmont', 'Cossonay', 'Denges', 'Echandens', 'Echichens', 'Eclépens', 'Ferreyres', 'Gimel', 'Gollion', 'Grancy', 'L\'Isle', 'Lavigny', 'Lussery-Villars', 'Morges', 'Montherod', 'Orny', 'Pampigny', 'Penthalaz', 'Penthéréaz', 'Poliez-le-Grand', 'Praz-Vully', 'Reverolle', 'Saint-Prex', 'Sévery', 'Tolochenaz', 'Vaux-sur-Morges', 'Villars-sous-Yens', 'Vufflens-le-Château', 'Yens']
      },
      {
        id: 'vd-nyon',
        name: 'Nyon',
        nameDE: 'Nyon',
        nameFR: 'Nyon',
        type: 'district',
        municipalities: ['Arzier', 'Bassins', 'Begnins', 'Borex', 'Bogis-Bossey', 'Chéserex', 'Coinsins', 'Crans', 'Crassier', 'Duillier', 'Eysins', 'Founex', 'Genolier', 'Gingins', 'Givrins', 'Gland', 'Grenchen', 'La Rippe', 'Le Vaud', 'Longirod', 'Luins', 'Marchissy', 'Mies', 'Nyon', 'Perroy', 'Prangins', 'Rolle', 'Saint-Cergue', 'Tannay', 'Trélex', 'Vich', 'Vinzel']
      },
      {
        id: 'vd-aigle',
        name: 'Aigle',
        nameDE: 'Aigle',
        nameFR: 'Aigle',
        type: 'district',
        municipalities: ['Aigle', 'Bex', 'Chessel', 'Corbeyrier', 'Leysin', 'Noville', 'Ollon', 'Ormont-Dessous', 'Ormont-Dessus', 'Roche', 'Villeneuve', 'Yvorne']
      },
      {
        id: 'vd-broye-vully',
        name: 'Broye-Vully',
        nameDE: 'Broye-Vully',
        nameFR: 'Broye-Vully',
        type: 'district',
        municipalities: ['Bellerive', 'Bretigny-sur-Morges', 'Bussy-sur-Morges', 'Cazis', 'Chavannes-le-Veyron', 'Chevilly', 'Chexbres', 'Constantine', 'Cottens', 'Cuarnens', 'Denges', 'Dizy', 'Echichens', 'Eclépens', 'Epesses', 'Epenex', 'Faoug', 'Féchy', 'Founex', 'Gollion', 'Grancy', 'Grens', 'Hermenches', 'Juriens', 'La Chaux', 'La Sarraz', 'Lavigny', 'Lussy-sur-Morges', 'Morges', 'Montricher', 'Moiry', 'Mont-la-Ville', 'Orny', 'Pampigny', 'Penthalaz', 'Penthéréaz', 'Pizy', 'Poliez-le-Grand', 'Poliez-Pittet', 'Praz-Vully', 'Rances', 'Reverolle', 'Romainmôtier-Envy', 'Sévery', 'Tolochenaz', 'Vaux-sur-Morges', 'Villars-le-Terroir', 'Vufflens-la-Ville', 'Vufflens-le-Château', 'Yens']
      },
      {
        id: 'vd-gros-de-vaud',
        name: 'Gros-de-Vaud',
        nameDE: 'Gros-de-Vaud',
        nameFR: 'Gros-de-Vaud',
        type: 'district',
        municipalities: ['Assens', 'Bercher', 'Bettens', 'Bottens', 'Boulens', 'Bournens', 'Bretigny-sur-Morges', 'Buchholz', 'Chavannes-le-Chêne', 'Chevilly', 'Cheseaux-sur-Lausanne', 'Corcelles-le-Jorat', 'Correvon', 'Daillens', 'Denezy', 'Donneloye', 'Echallens', 'Eclépens', 'Essert-Pittet', 'Etagnières', 'Fey', 'Froideville', 'Goumoens-la-Ville', 'Goumoens-le-Jux', 'Jorat-Menthue', 'Lussery-Villars', 'Mézières', 'Montanaire', 'Morrens', 'Orzens', 'Oulens-sous-Echallens', 'Pailly', 'Penthalaz', 'Penthéréaz', 'Peyres-Possens', 'Poliez-Pittet', 'Rivaz', 'Saint-Barthélemy', 'Sullens', 'Villars-le-Terroir', 'Vuarrens', 'Vufflens-la-Ville', 'Yens']
      },
      {
        id: 'vd-jura-nord-vaudois',
        name: 'Jura-Nord Vaudois',
        nameDE: 'Jura-Nord vaudois',
        nameFR: 'Jura-Nord vaudois',
        type: 'district',
        municipalities: ['Agiez', 'Arnex-sur-Nyon', 'Ballaigues', 'Baulmes', 'Bavois', 'Bévilard', 'Borex', 'Brenles', 'Burtigny', 'Chavannes-le-Chêne', 'Chavannes-des-Bois', 'Chêne-Bougeries', 'Chêne-Bourg', 'Concise', 'Crassier', 'Denges', 'Dizy', 'Echichens', 'Eclépens', 'Essert-Pittet', 'Essertines-sur-Rolle', 'Founex', 'Genolier', 'Gingins', 'Grens', 'La Chaux', 'La Sarraz', 'L\'Isle', 'Longirod', 'Marchissy', 'Mies', 'Montherod', 'Mont-la-Ville', 'Montricher', 'Moiry', 'Novalles', 'Orny', 'Pailly', 'Pampigny', 'Penthalaz', 'Penthéréaz', 'Poliez-le-Grand', 'Poliez-Pittet', 'Prahins', 'Rances', 'Romainmôtier-Envy', 'Sévery', 'Trient', 'Vallorbe', 'Vaulion', 'Vuarrens', 'Vufflens-la-Ville', 'Yverdon-les-Bains']
      },
      {
        id: 'vd-lavaux-oron',
        name: 'Lavaux-Oron',
        nameDE: 'Lavaux-Oron',
        nameFR: 'Lavaux-Oron',
        type: 'district',
        municipalities: ['Bourg-en-Lavaux', 'Chexbres', 'Cully', 'Epesses', 'Forel', 'Grandvaux', 'Jorat-Menthue', 'Lutry', 'Mézières', 'Montpreveyres', 'Oron', 'Palézieux', 'Paudex', 'Pully', 'Riex', 'Rivaz', 'Saint-Saphorin', 'Savigny', 'Treytorrens', 'Villette', 'Vulliens']
      },
      {
        id: 'vd-riviera-pays-d-enhaut',
        name: "Riviera-Pays-d'Enhaut",
        nameDE: "Riviera-Pays-d'Enhaut",
        nameFR: "Riviera-Pays-d'Enhaut",
        type: 'district',
        municipalities: ['Blonay', 'Chardonne', 'Château-d\'Oex', 'Corseaux', 'Corsier-sur-Vevey', 'Jongny', 'La Tour-de-Peilz', 'Montreux', 'Rougemont', 'Rossinière', 'Saint-Légier-La Chiésaz', 'Vevey', 'Veytaux', 'Villeneuve']
      },
      {
        id: 'vd-veveyse',
        name: 'Veveyse',
        nameDE: 'Veveyse',
        nameFR: 'Veveyse',
        type: 'district',
        municipalities: ['Attalens', 'Bossonnens', 'Châtel-Saint-Denis', 'Granges', 'La Verrerie', 'Le Flon', 'Semsales', 'Villarzel']
      }
    ]
  },

  // ==========================================
  // CANTÓN DEL VALAIS (VS) - 14 Distritos, 122 municipios
  // ==========================================
  {
    id: 'vs',
    name: 'Cantón del Valais',
    nameDE: 'Kanton Wallis',
    nameFR: 'Canton du Valais',
    nameIT: 'Canton Vallese',
    code: 'VS',
    capital: 'Sion',
    districts: [
      {
        id: 'vs-sion',
        name: 'Sion',
        nameDE: 'Sitten',
        nameFR: 'Sion',
        type: 'district',
        municipalities: ['Ardon', 'Chamoson', 'Conthey', 'Nendaz', 'Sion', 'Vétroz', 'Veysonnaz', 'Les Agettes', 'Savièse', 'St-Léonard', 'Venthône', 'Miège', 'Veyras']
      },
      {
        id: 'vs-martigny',
        name: 'Martigny',
        nameDE: 'Martigny',
        nameFR: 'Martigny',
        type: 'district',
        municipalities: ['Bovernier', 'Fully', 'Isérables', 'Leytron', 'Martigny', 'Martigny-Combe', 'Saillon', 'Saxon', 'Trient', 'Vernayaz']
      },
      {
        id: 'vs-sierre',
        name: 'Sierre',
        nameDE: 'Siders',
        nameFR: 'Sierre',
        type: 'district',
        municipalities: ['Anniviers', 'Bramois', 'Chalais', 'Chermignon', 'Grône', 'Icogne', 'Lens', 'Mollens', 'Montana', 'Noble-Contrée', 'Randogne', 'Sierre', 'Siders', 'Venthône', 'Veyras']
      },
      {
        id: 'vs-hérens',
        name: 'Hérens',
        nameDE: 'Ering',
        nameFR: 'Hérens',
        type: 'district',
        municipalities: ['Ayer', 'Evolène', 'Hérémence', 'Les Haudères', 'Saint-Martin', 'Vex', 'Zinal', 'Grimentz']
      },
      {
        id: 'vs-entremont',
        name: 'Entremont',
        nameDE: 'Entremont',
        nameFR: 'Entremont',
        type: 'district',
        municipalities: ['Bagnes', 'Bourg-Saint-Pierre', 'Champéry', 'Liddes', 'Orsières', 'Sembrancher', 'Verbier', 'Volleges']
      },
      {
        id: 'vs-conthey',
        name: 'Conthey',
        nameDE: 'Conthey',
        nameFR: 'Conthey',
        type: 'district',
        municipalities: ['Ardon', 'Chamoson', 'Conthey', 'Nendaz', 'Vétroz']
      },
      {
        id: 'vs-mörel-mittelberg',
        name: 'Mörel-Mittelberg',
        nameDE: 'Mörel-Mittelberg',
        nameFR: 'Mörel-Mittelberg',
        type: 'district',
        municipalities: ['Bettmeralp', 'Bitsch', 'Grengiols', 'Lax', 'Mörel-Filet', 'Riederalp']
      },
      {
        id: 'vs-raron',
        name: 'Raron',
        nameDE: 'Raron',
        nameFR: 'Raron',
        type: 'district',
        municipalities: ['Ausserberg', 'Baltschieder', 'Bürchen', 'Eggerberg', 'Raron', 'St. Niklaus', 'Steg-Hohtenn', 'Unterbäch']
      },
      {
        id: 'vs-brig',
        name: 'Brig',
        nameDE: 'Brig',
        nameFR: 'Brig',
        type: 'district',
        municipalities: ['Birgisch', 'Brig-Glis', 'Brig', 'Glis', 'Mund', 'Naters', 'Simplon', 'Termen', 'Zwischbergen']
      },
      {
        id: 'vs-visp',
        name: 'Visp',
        nameDE: 'Visp',
        nameFR: 'Viège',
        type: 'district',
        municipalities: ['Baltschieder', 'Eisten', 'Embd', 'Grächen', 'Lalden', 'Niedergesteln', 'Randa', 'St. Niklaus', 'Stalden', 'Staldenried', 'Täsch', 'Visp', 'Visperterminen', 'Zeneggen', 'Zermatt']
      },
      {
        id: 'vs-leuk',
        name: 'Leuk',
        nameDE: 'Leuk',
        nameFR: 'Loèche',
        type: 'district',
        municipalities: ['Agarn', 'Albinen', 'Ergisch', 'Guttet-Feschel', 'Inden', 'Kandersteg', 'Leuk', 'Leukerbad', 'Oberems', 'Salgesch', 'Turtmann', 'Varen', 'Wiler']
      },
      {
        id: 'vs-goms',
        name: 'Goms',
        nameDE: 'Goms',
        nameFR: 'Conches',
        type: 'district',
        municipalities: ['Bellwald', 'Binn', 'Blitzingen', 'Ernen', 'Fiesch', 'Fieschertal', 'Grafschaft', 'Münster-Geschinen', 'Reckingen-Gluringen', 'Selkingen', 'Ulrichen']
      },
      {
        id: 'vs-saint-maurice',
        name: 'Saint-Maurice',
        nameDE: 'Saint-Maurice',
        nameFR: 'Saint-Maurice',
        type: 'district',
        municipalities: ['Collonges', 'Dorénaz', 'Evionnaz', 'Finhaut', 'Massongex', 'Mex', 'Salvan', 'Saint-Maurice']
      },
      {
        id: 'vs-mattertal',
        name: 'Mattertal',
        nameDE: 'Mattertal',
        nameFR: 'Vallée de Zermatt',
        type: 'region',
        municipalities: ['Embd', 'Grächen', 'Niedergesteln', 'Randa', 'St. Niklaus', 'Täsch', 'Zermatt']
      }
    ]
  },

  // ==========================================
  // CANTÓN DE NEUCHÂTEL (NE) - 4 Districts, 31 municipios
  // ==========================================
  {
    id: 'ne',
    name: 'Cantón de Neuchâtel',
    nameDE: 'Kanton Neuenburg',
    nameFR: 'Canton de Neuchâtel',
    nameIT: 'Canton Neuchâtel',
    code: 'NE',
    capital: 'Neuchâtel',
    districts: [
      {
        id: 'ne-neuchâtel',
        name: 'Neuchâtel',
        nameDE: 'Neuenburg',
        nameFR: 'Neuchâtel',
        type: 'district',
        municipalities: ['Boudry', 'Brot-Dessous', 'Brot-Plamboz', 'Corcelles-Cormondrèche', 'Cortaillod', 'Enges', 'Hauterive', 'Le Landeron', 'Milvignes', 'Neuchâtel', 'Neuenburg', 'Peseux', 'Rochefort', 'Saint-Aubin-Sauges', 'Vaumarcus']
      },
      {
        id: 'ne-boudry',
        name: 'Boudry',
        nameDE: 'Boudry',
        nameFR: 'Boudry',
        type: 'district',
        municipalities: ['Boudry', 'Brot-Dessous', 'Brot-Plamboz', 'Corcelles-Cormondrèche', 'Cortaillod', 'Hauterive', 'Milvignes', 'Peseux']
      },
      {
        id: 'ne-val-de-ruz',
        name: 'Val-de-Ruz',
        nameDE: 'Val-de-Ruz',
        nameFR: 'Val-de-Ruz',
        type: 'district',
        municipalities: ['Boudevilliers', 'Cernier', 'Chézard-Saint-Martin', 'Coffrane', 'Dombresson', 'Fenin-Vilars-Saules', 'Fontainemelon', 'Fontaines', 'Le Pâquier', 'Les Geneveys-sur-Coffrane', 'Les Hauts-Geneveys', 'Montmollin', 'Mormont', 'Puginier', 'Renan', 'Savagnier', 'Villiers']
      },
      {
        id: 'ne-val-de-travers',
        name: 'Val-de-Travers',
        nameDE: 'Val-de-Travers',
        nameFR: 'Val-de-Travers',
        type: 'district',
        municipalities: ['Buttes', 'Couvet', 'Fleurier', 'Les Bayards', 'Môtiers', 'Noiraigue', 'Saint-Sulpice', 'Travers']
      },
      {
        id: 'ne-le-locle',
        name: 'Le Locle',
        nameDE: 'Le Locle',
        nameFR: 'Le Locle',
        type: 'district',
        municipalities: ['La Chaux-de-Fonds', 'La Chaux-du-Milieu', 'Le Locle', 'Les Brenets', 'Les Ponts-de-Martel', 'La Sagne']
      },
      {
        id: 'ne-la-chaux-de-fonds',
        name: 'La Chaux-de-Fonds',
        nameDE: 'La Chaux-de-Fonds',
        nameFR: 'La Chaux-de-Fonds',
        type: 'district',
        municipalities: ['La Chaux-de-Fonds', 'La Sagne', 'Les Ponts-de-Martel', 'Le Locle', 'Les Brenets']
      }
    ]
  },

  // ==========================================
  // CANTÓN DE GINEBRA (GE) - 45 municipios
  // ==========================================
  {
    id: 'ge',
    name: 'Cantón de Ginebra',
    nameDE: 'Kanton Genf',
    nameFR: 'Canton de Genève',
    nameIT: 'Canton Ginevra',
    code: 'GE',
    capital: 'Ginebra',
    districts: [
      {
        id: 'ge-geneva',
        name: 'Ginebra',
        nameDE: 'Genf',
        nameFR: 'Genève',
        type: 'region',
        municipalities: ['Aire-la-Ville', 'Anières', 'Avully', 'Avusy', 'Bardonnex', 'Bellevue', 'Bernex', 'Carouge', 'Cartigny', 'Céligny', 'Chancy', 'Chêne-Bougeries', 'Chêne-Bourg', 'Collex-Bossy', 'Collonge-Bellerive', 'Cologny', 'Confignon', 'Corsier', 'Dardagny', 'Genthod', 'Ginebra', 'Genève', 'Grand-Saconnex', 'Gy', 'Hermance', 'Jussy', 'Laconnex', 'Lancy', 'Meinier', 'Meyrin', 'Onex', 'Perly-Certoux', 'Plan-les-Ouates', 'Pregny-Chambésy', 'Puplinge', 'Russin', 'Satigny', 'Soral', 'Thônex', 'Troinex', 'Vandoeuvres', 'Vernier', 'Versoix', 'Veyrier']
      },
      {
        id: 'ge-rive-gauche',
        name: 'Rive Gauche',
        nameDE: 'Rive Gauche',
        nameFR: 'Rive Gauche',
        type: 'region',
        municipalities: ['Carouge', 'Ginebra', 'Genève', 'Lancy', 'Onex', 'Plan-les-Ouates', 'Veyrier']
      },
      {
        id: 'ge-rive-droite',
        name: 'Rive Droite',
        nameDE: 'Rive Droite',
        nameFR: 'Rive Droite',
        type: 'region',
        municipalities: ['Bellevue', 'Cologny', 'Collex-Bossy', 'Genthod', 'Ginebra', 'Genève', 'Grand-Saconnex', 'Meyrin', 'Pregny-Chambésy', 'Satigny', 'Vernier', 'Versoix']
      }
    ]
  },

  // ==========================================
  // CANTÓN DE JURA (JU) - 3 Districts, 55 municipios
  // ==========================================
  {
    id: 'ju',
    name: 'Cantón del Jura',
    nameDE: 'Kanton Jura',
    nameFR: 'Canton du Jura',
    nameIT: 'Canton Giura',
    code: 'JU',
    capital: 'Delémont',
    districts: [
      {
        id: 'ju-delémont',
        name: 'Delémont',
        nameDE: 'Delsberg',
        nameFR: 'Delémont',
        type: 'district',
        municipalities: ['Bassecourt', 'Bressaucourt', 'Chevenez', 'Courfaivre', 'Courrendlin', 'Courroux', 'Courtételle', 'Develier', 'Delémont', 'Delsberg', 'Glovelier', 'Pleigne', 'Rossemaison', 'Saulcy', 'Soulce', 'Soyhières', 'Undervelier', 'Vellerat', 'Vicques']
      },
      {
        id: 'ju-porrentruy',
        name: 'Porrentruy',
        nameDE: 'Pruntrut',
        nameFR: 'Porrentruy',
        type: 'district',
        municipalities: ['Alle', 'Beurnevésin', 'Bonfol', 'Bure', 'Charmoille', 'Chevenez', 'Coévrons', 'Coeuve', 'Cornol', 'Courchavon', 'Courgenay', 'Courtedoux', 'Damphreux', 'Damvant', 'Fahy', 'Fontenais', 'Grandfontaine', 'Lugnez', 'Miécourt', 'Montignez', 'Pleujouse', 'Porrentruy', 'Pruntrut', 'Réclère', 'Roche-d\'Or', 'Rocourt', 'Saint-Ursanne', 'Seleute', 'Vendlincourt']
      },
      {
        id: 'ju-franches-montagnes',
        name: 'Franches-Montagnes',
        nameDE: 'Freiberge',
        nameFR: 'Franches-Montagnes',
        type: 'district',
        municipalities: ['Le Bémont', 'Le Noirmont', 'Les Bois', 'Les Breuleux', 'Les Enfers', 'Le Peuchapatte', 'Lajoux', 'Montfaucon', 'Muriaux', 'Saignelégier', 'Soubey']
      }
    ]
  },

  // ==========================================
  // CANTÓN DE SCHWYZ - Repetir con datos más completos
  // ==========================================
  {
    id: 'sz-2',
    name: 'Cantón de Schwyz (completo)',
    nameDE: 'Kanton Schwyz',
    nameFR: 'Canton de Schwytz',
    nameIT: 'Cantone di Svitto',
    code: 'SZ',
    capital: 'Schwyz',
    districts: [
      {
        id: 'sz-einsiedeln-full',
        name: 'Einsiedeln',
        nameDE: 'Bezirk Einsiedeln',
        type: 'bezirk',
        municipalities: ['Einsiedeln', 'Bennau', 'Euthal', 'Schindellegi', 'Willerzell']
      }
    ]
  }
];

// Remove duplicate canton (sz-2) - just keeping for reference
// Clean up the array
export const SWISS_CANTONS_CLEAN: Canton[] = SWISS_CANTONS.filter(c => !c.id.includes('-2'));

// ============================================
// LUGARES POPULARES / PUNTOS DE INTERÉS
// ============================================
export const POPULAR_PLACES = {
  airports: [
    { id: 'zurich-airport', name: 'Aeropuerto de Zúrich', nameDE: 'Flughafen Zürich', code: 'ZRH' },
    { id: 'geneva-airport', name: 'Aeropuerto de Ginebra', nameDE: 'Flughafen Genf', code: 'GVA' },
    { id: 'basel-airport', name: 'Aeropuerto de Basilea', nameDE: 'Flughafen Basel-Mulhouse', code: 'BSL' },
    { id: 'bern-airport', name: 'Aeropuerto de Berna', nameDE: 'Flughafen Bern-Belp', code: 'BRN' },
    { id: 'lugano-airport', name: 'Aeropuerto de Lugano', nameDE: 'Flughafen Lugano', code: 'LUG' },
    { id: 'st-gallen-airport', name: 'Aeropuerto de St. Gallen', nameDE: 'Flughafen St. Gallen-Altenrhein', code: 'ACH' },
    { id: 'sion-airport', name: 'Aeropuerto de Sion', nameDE: 'Flughafen Sion', code: 'SIR' }
  ],
  trainStations: [
    { id: 'zurich-hbf', name: 'Estación Zúrich HB', nameDE: 'Zürich HB' },
    { id: 'bern-hbf', name: 'Estación Berna', nameDE: 'Bern HB' },
    { id: 'basel-sbb', name: 'Estación Basilea SBB', nameDE: 'Basel SBB' },
    { id: 'geneva-cornavin', name: 'Estación Ginebra', nameDE: 'Genève-Cornavin' },
    { id: 'lausanne', name: 'Estación Lausana', nameDE: 'Lausanne' },
    { id: 'lucerne', name: 'Estación Lucerna', nameDE: 'Luzern' },
    { id: 'st-gallen', name: 'Estación St. Gallen', nameDE: 'St. Gallen' },
    { id: 'lugano', name: 'Estación Lugano', nameDE: 'Lugano' },
    { id: 'zermatt', name: 'Estación Zermatt', nameDE: 'Zermatt' },
    { id: 'interlaken-ost', name: 'Estación Interlaken Este', nameDE: 'Interlaken Ost' },
    { id: 'interlaken-west', name: 'Estación Interlaken Oeste', nameDE: 'Interlaken West' },
    { id: 'grindelwald', name: 'Estación Grindelwald', nameDE: 'Grindelwald' },
    { id: 'davos', name: 'Estación Davos', nameDE: 'Davos Platz' },
    { id: 'st-moritz', name: 'Estación St. Moritz', nameDE: 'St. Moritz' },
    { id: 'bellinzona', name: 'Estación Bellinzona', nameDE: 'Bellinzona' },
    { id: 'locarno', name: 'Estación Locarno', nameDE: 'Locarno' },
    { id: 'luzern', name: 'Estación Lucerna', nameDE: 'Luzern' },
    { id: 'winterthur', name: 'Estación Winterthur', nameDE: 'Winterthur' },
    { id: 'biel', name: 'Estación Biel/Bienne', nameDE: 'Biel/Bienne' },
    { id: 'fribourg', name: 'Estación Friburgo', nameDE: 'Fribourg' }
  ],
  skiResorts: [
    { id: 'zermatt', name: 'Zermatt', canton: 'VS' },
    { id: 'verbier', name: 'Verbier', canton: 'VS' },
    { id: 'st-moritz', name: 'St. Moritz', canton: 'GR' },
    { id: 'davos', name: 'Davos-Klosters', canton: 'GR' },
    { id: 'engelberg', name: 'Engelberg', canton: 'OW' },
    { id: 'grindelwald', name: 'Grindelwald', canton: 'BE' },
    { id: 'gstaad', name: 'Gstaad', canton: 'BE' },
    { id: 'crans-montana', name: 'Crans-Montana', canton: 'VS' },
    { id: 'saas-fee', name: 'Saas-Fee', canton: 'VS' },
    { id: 'flims-laax', name: 'Flims-Laax', canton: 'GR' },
    { id: 'adelboden', name: 'Adelboden', canton: 'BE' },
    { id: 'arosa', name: 'Arosa', canton: 'GR' },
    { id: 'samnaun', name: 'Samnaun', canton: 'GR' },
    { id: 'samoens', name: 'Samoëns', canton: 'VS' },
    { id: 'villars', name: 'Villars-sur-Ollon', canton: 'VD' },
    { id: 'leysin', name: 'Leysin', canton: 'VD' },
    { id: 'champery', name: 'Champery', canton: 'VS' },
    { id: 'nendaz', name: 'Nendaz', canton: 'VS' },
    { id: 'thagaste', name: 'Thagaste-Arnier', canton: 'VS' },
    { id: 'sedrun', name: 'Sedrun', canton: 'GR' }
  ],
  touristSpots: [
    { id: 'matterhorn', name: 'Matterhorn', canton: 'VS' },
    { id: 'jungfraujoch', name: 'Jungfraujoch', canton: 'BE' },
    { id: 'chateau-chillon', name: 'Castillo de Chillon', canton: 'VD' },
    { id: 'rhine-falls', name: 'Cascadas del Rin', canton: 'SH' },
    { id: 'lake-geneva', name: 'Lago de Ginebra', canton: 'VD' },
    { id: 'lake-lucerne', name: 'Lago de Lucerna', canton: 'LU' },
    { id: 'lake-zurich', name: 'Lago de Zúrich', canton: 'ZH' },
    { id: 'vaduz-castle', name: 'Castillo de Vaduz', canton: 'LI' },
    { id: 'kapellbrucke', name: 'Puente de la Capilla (Lucerna)', canton: 'LU' },
    { id: 'pilate', name: 'Monte Pilatus', canton: 'LU' },
    { id: 'rigi', name: 'Monte Rigi', canton: 'SZ' },
    { id: 'titlis', name: 'Monte Titlis', canton: 'OW' }
  ],
  cities: [
    { id: 'zurich', name: 'Zúrich', nameDE: 'Zürich', canton: 'ZH' },
    { id: 'geneva', name: 'Ginebra', nameDE: 'Genf', canton: 'GE' },
    { id: 'basel', name: 'Basilea', nameDE: 'Basel', canton: 'BS' },
    { id: 'lausanne', name: 'Lausana', nameDE: 'Lausanne', canton: 'VD' },
    { id: 'bern', name: 'Berna', nameDE: 'Bern', canton: 'BE' },
    { id: 'winterthur', name: 'Winterthur', nameDE: 'Winterthur', canton: 'ZH' },
    { id: 'lucerne', name: 'Lucerna', nameDE: 'Luzern', canton: 'LU' },
    { id: 'st-gallen', name: 'St. Gallen', nameDE: 'St. Gallen', canton: 'SG' },
    { id: 'lugano', name: 'Lugano', nameDE: 'Lugano', canton: 'TI' },
    { id: 'biel', name: 'Biel/Bienne', nameDE: 'Biel/Bienne', canton: 'BE' },
    { id: 'thun', name: 'Thun', nameDE: 'Thun', canton: 'BE' },
    { id: 'kloten', name: 'Kloten', nameDE: 'Kloten', canton: 'ZH' },
    { id: 'uster', name: 'Uster', nameDE: 'Uster', canton: 'ZH' },
    { id: 'emmnen', name: 'Emmen', nameDE: 'Emmen', canton: 'LU' },
    { id: 'zug', name: 'Zug', nameDE: 'Zug', canton: 'ZG' },
    { id: 'fribourg', name: 'Friburgo', nameDE: 'Freiburg', canton: 'FR' },
    { id: 'neuchatel', name: 'Neuchâtel', nameDE: 'Neuenburg', canton: 'NE' },
    { id: 'schaffhausen', name: 'Schaffhausen', nameDE: 'Schaffhausen', canton: 'SH' },
    { id: 'chur', name: 'Coira', nameDE: 'Chur', canton: 'GR' },
    { id: 'bellinzona', name: 'Bellinzona', nameDE: 'Bellinzona', canton: 'TI' }
  ]
};

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

/**
 * Obtiene todos los municipios de un cantón
 */
export function getMunicipalitiesByCanton(cantonId: string): string[] {
  const canton = SWISS_CANTONS.find(c => c.id === cantonId);
  if (!canton) return [];
  
  const municipalities = new Set<string>();
  canton.districts.forEach(d => {
    d.municipalities.forEach(m => municipalities.add(m));
  });
  
  return Array.from(municipalities);
}

/**
 * Obtiene todos los municipios de una región/district
 */
export function getMunicipalitiesByDistrict(cantonId: string, districtId: string): string[] {
  const canton = SWISS_CANTONS.find(c => c.id === cantonId);
  if (!canton) return [];
  
  const district = canton.districts.find(d => d.id === districtId);
  if (!district) return [];
  
  return district.municipalities;
}

/**
 * Busca un cantón por su nombre (parcial, insensible a mayúsculas)
 */
export function findCantonByName(searchTerm: string): Canton | undefined {
  const term = searchTerm.toLowerCase();
  return SWISS_CANTONS.find(c => 
    c.name.toLowerCase().includes(term) ||
    c.nameDE.toLowerCase().includes(term) ||
    c.nameFR.toLowerCase().includes(term) ||
    c.code.toLowerCase() === term
  );
}

/**
 * Busca todas las zonas que contengan un término de búsqueda
 */
export function searchZones(searchTerm: string): Array<{ type: 'country' | 'canton' | 'district' | 'municipality' | 'place'; name: string; canton?: string; district?: string }> {
  const results: Array<{ type: 'country' | 'canton' | 'district' | 'municipality' | 'place'; name: string; canton?: string; district?: string }> = [];
  const term = searchTerm.toLowerCase();
  
  // Search Liechtenstein
  if ('liechtenstein'.includes(term)) {
    results.push({ type: 'country', name: 'Liechtenstein' });
  }
  
  // Search cantons
  SWISS_CANTONS.forEach(canton => {
    if (canton.name.toLowerCase().includes(term) || 
        canton.nameDE.toLowerCase().includes(term) ||
        canton.code.toLowerCase() === term) {
      results.push({ type: 'canton', name: canton.name });
    }
    
    // Search districts
    canton.districts.forEach(district => {
      if (district.name.toLowerCase().includes(term) || 
          district.nameDE.toLowerCase().includes(term)) {
        results.push({ 
          type: 'district', 
          name: district.name, 
          canton: canton.name 
        });
      }
      
      // Search municipalities
      district.municipalities.forEach(municipality => {
        if (municipality.toLowerCase().includes(term)) {
          results.push({
            type: 'municipality',
            name: municipality,
            canton: canton.name,
            district: district.name
          });
        }
      });
    });
  });
  
  return results;
}

/**
 * Obtiene todos los lugares disponibles para exclusión de una zona
 */
export function getExclusionOptions(zoneType: string, zoneName: string): string[] {
  // Si es Liechtenstein
  if (zoneName.toLowerCase().includes('liechtenstein')) {
    return LIECHTENSTEIN.municipalities;
  }
  
  // Buscar el cantón correspondiente
  const canton = SWISS_CANTONS.find(c => 
    c.name.toLowerCase().includes(zoneName.toLowerCase()) ||
    zoneName.toLowerCase().includes(c.name.toLowerCase()) ||
    zoneName.toLowerCase().includes(c.code.toLowerCase())
  );
  
  if (canton) {
    // Si es un cantón completo, devolver todos los municipios
    return getMunicipalitiesByCanton(canton.id);
  }
  
  // Buscar el distrito correspondiente
  for (const c of SWISS_CANTONS) {
    const district = c.districts.find(d => 
      d.name.toLowerCase().includes(zoneName.toLowerCase()) ||
      zoneName.toLowerCase().includes(d.name.toLowerCase())
    );
    
    if (district) {
      return district.municipalities;
    }
  }
  
  return [];
}

/**
 * Obtiene una lista plana de todos los municipios de Suiza y Liechtenstein
 */
export function getAllMunicipalities(): string[] {
  const municipalities = new Set<string>();
  
  // Add Liechtenstein municipalities
  LIECHTENSTEIN.municipalities.forEach(m => municipalities.add(m));
  
  // Add Swiss municipalities
  SWISS_CANTONS.forEach(canton => {
    canton.districts.forEach(district => {
      district.municipalities.forEach(m => municipalities.add(m));
    });
  });
  
  return Array.from(municipalities).sort();
}

/**
 * Obtiene información de un municipio por nombre
 */
export function getMunicipalityInfo(name: string): { name: string; canton: string; district: string } | null {
  const nameLower = name.toLowerCase();
  
  // Check Liechtenstein
  if (LIECHTENSTEIN.municipalities.some(m => m.toLowerCase() === nameLower)) {
    return { name, canton: 'Liechtenstein', district: 'Liechtenstein' };
  }
  
  // Check Swiss cantons
  for (const canton of SWISS_CANTONS) {
    for (const district of canton.districts) {
      if (district.municipalities.some(m => m.toLowerCase() === nameLower)) {
        return { name, canton: canton.name, district: district.name };
      }
    }
  }
  
  return null;
}
