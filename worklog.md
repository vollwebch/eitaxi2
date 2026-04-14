# TaxiZone - Plataforma de Taxis en Suiza

## Resumen del Proyecto

Se ha desarrollado una plataforma web completa tipo marketplace para taxistas en Suiza, con las siguientes características:

---

## 🎯 Funcionalidades Implementadas

### 1. Base de Datos (Prisma + SQLite)
- **Cantones**: 12 cantones suizos principales (Zürich, Bern, Geneva, Vaud, Basel, etc.)
- **Ciudades**: +50 ciudades distribuidas por cantones
- **Taxistas**: 6 taxistas de ejemplo con perfiles completos
- **Rutas**: 10 rutas populares predefinidas

### 2. APIs REST
- `GET /api/taxis` - Listado de taxistas con filtros (cantón, ciudad, servicio)
- `GET /api/cantons` - Listado de cantones con ciudades y conteo de taxistas
- `GET /api/search` - Búsqueda por ruta (origen/destino) y búsqueda general

### 3. Interfaz de Usuario

#### Header
- Logo TaxiZone con branding
- Navegación por cantones (dropdown)
- Botón "Ser taxista" (CTA)
- Menú móvil responsive

#### Hero Section
- Buscador inteligente de rutas (origen → destino)
- Autocompletado de ciudades
- Rutas populares como sugerencias
- Estadísticas (500+ taxistas, 24/7, Verificados)

#### Listado de Taxistas
- Cards con información completa
- Badges: Verificado, Top Rated, 24/7, Premium
- Servicios con iconos (Aeropuerto, Ciudad, Larga distancia, Corporativo)
- Botones CTA: Llamar y WhatsApp

#### Filtros
- Por cantón
- Por ciudad (dinámico según cantón)
- Por tipo de servicio

#### Modal de Detalle
- Perfil completo del taxista
- Experiencia, servicios, rutas
- Descripción personal
- CTAs sticky (Llamar, WhatsApp)

#### Footer
- Información de la plataforma
- Enlaces de navegación
- Contacto

### 4. Diseño
- Tema oscuro con acentos en amarillo taxi
- Diseño mobile-first
- Animaciones suaves con Framer Motion
- Componentes shadcn/ui

---

## 📁 Estructura de Archivos

```
/home/z/my-project/
├── prisma/
│   ├── schema.prisma      # Esquema de base de datos
│   └── seed.ts            # Datos semilla
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── taxis/route.ts
│   │   │   ├── cantons/route.ts
│   │   │   └── search/route.ts
│   │   ├── globals.css    # Estilos globales (tema taxi)
│   │   ├── layout.tsx     # Layout principal
│   │   └── page.tsx       # Página principal completa
│   └── lib/
│       └── db.ts          # Cliente Prisma
└── db/
    └── custom.db          # Base de datos SQLite
```

---

## 🚀 Cómo Funciona

1. **El usuario entra** → Ve el hero con buscador y taxistas destacados
2. **Busca por ruta** → Introduce origen y destino, obtiene taxistas que cubren esa ruta
3. **Filtra por ubicación** → Selecciona cantón/ciudad para ver taxistas locales
4. **Ve un taxista** → Click en la card, se abre modal con toda la info
5. **Contacta** → Botones de llamar o WhatsApp directamente

---

## 💰 Monetización (preparado para)

- **Básico (15 CHF/mes)**: Perfil en el listado
- **Featured**: Posición destacada en búsquedas
- **Premium**: Badge "Premium", prioridad máxima

---

## 🌐 Próximos Pasos (recomendados)

1. Comprar dominio (taxizone.ch recomendado)
2. Implementar autenticación para taxistas
3. Sistema de registro con pago (Stripe)
4. Generación automática de páginas SEO
5. Panel de administración
6. App móvil (PWA)

---

## 🔧 Tecnologías

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- Prisma ORM
- SQLite
- Framer Motion

---

## Task ID: 1 - Fullstack Implementation - Driver Dashboard & Enhanced Registration

### Work Task
Implement comprehensive improvements to the TaxiZone platform:
1. Panel de Control del Conductor (Dashboard)
2. Mejorar el Formulario de Registro
3. Arreglar la API de IA
4. Actualizar Base de datos

### Work Summary

#### 1. Database Schema Updates (prisma/schema.prisma)
- Added `DriverRoute` model for specific routes with origin, destination, and price
- Added `DriverSchedule` model for custom availability schedules per day
- Added relations to `TaxiDriver` model for `driverRoutes` and `schedules`
- Ran `npm run db:push` successfully to sync database

#### 2. Enhanced Registration Form (src/app/registrarse/page.tsx)
- Expanded from 6 to 8 steps for more comprehensive data collection
- **New fields added:**
  - **Routes specific**: Origin, destination, and fixed price per route
  - **Prices**: Base price, price per km, hourly rate (for limousines)
  - **Social media**: Website, Instagram, Facebook
  - **Schedule**: Custom availability with day-by-day time settings
  - **Multiple vehicle types**: Now allows selecting multiple vehicle types
- Popular route suggestions for quick addition
- Visual preview in final step showing all entered data
- Success screen now shows both public profile URL and dashboard URL

#### 3. Driver Dashboard (src/app/dashboard/[driverId]/page.tsx)
- Complete dashboard with tabbed interface:
  - **Stats Cards**: Views, contacts, rating, experience
  - **Profile completion progress bar**
  - **Public URL display** with copy button
  - **Basic Info Tab**: Photo, name, phone, email, description, social media
  - **Vehicle Tab**: Vehicle type selection, brand, model, year, color, capacity
  - **Services Tab**: Service selection, languages, service zones
  - **Prices Tab**: Base price, per km rate, hourly rate, custom routes with fixed prices
  - **Schedule Tab**: 24/7 toggle or custom day-by-day schedule
- Save functionality with real-time feedback
- Responsive design with mobile bottom save button

#### 4. API Updates (src/app/api/drivers/route.ts)
- **POST**: Now handles all new fields (routes, schedules, prices, social media)
- **GET**: Supports fetching by ID for dashboard, includes driver routes and schedules
- **PUT**: New endpoint for updating driver data from dashboard
- Proper JSON parsing for array fields (services, languages, routes, schedules)

#### 5. AI Description API Improvements (src/app/api/ai/generate-description/route.ts)
- Added support for `vehicleTypes` array parameter
- Better error handling with specific error messages
- Improved validation for required fields
- More robust response handling

---
## Task ID: 2 - Comprehensive Geographic Data System

### Work Task
Implement a complete geographic data system for Switzerland and Liechtenstein with hierarchical zone selection and exclusions.

### Work Summary

#### 1. Geographic Data File (src/lib/geo-data.ts)
Created comprehensive geographic data file containing:
- **All 26 Swiss cantons** with complete information:
  - Names in Spanish, German, French, and Italian
  - Official codes (ZH, BE, LU, etc.)
  - Capital cities
  - Districts/Wahlkreise for each canton
  - Municipalities within each district

- **Liechtenstein** complete data:
  - All 11 municipalities (Vaduz, Schaan, Balzers, Triesen, etc.)
  - Country-level selection support

- **Popular places** organized by category:
  - 7 airports (Zurich, Geneva, Basel, Bern, Lugano, St. Gallen, Sion)
  - 14 major train stations
  - 12 ski resorts (Zermatt, Verbier, St. Moritz, etc.)
  - 8 tourist spots (Matterhorn, Jungfraujoch, etc.)

- **Utility functions**:
  - `getMunicipalitiesByCanton()` - Get all municipalities in a canton
  - `getMunicipalitiesByDistrict()` - Get municipalities in a specific district
  - `findCantonByName()` - Search cantons by name
  - `searchZones()` - Search across all zones
  - `getExclusionOptions()` - Get places available for exclusion

#### 2. Enhanced RoutesZonesManager Component (src/components/RoutesZonesManager.tsx)
Completely redesigned component with:

- **Hierarchical zone selection**:
  - Canton selector (all 26 cantons + Liechtenstein)
  - District/Region selector (dynamic based on canton)
  - Municipality selector (dynamic based on district)
  - Custom zone input option

- **Exclusion system**:
  - Dynamic exclusion options based on selected zone
  - Multi-select exclusions with visual feedback
  - Red highlighting for excluded places
  - Shows count of exclusions

- **Quick add buttons**:
  - One-click to add entire canton
  - One-click to add Liechtenstein
  - Collapsible full list of all cantons and districts

- **Improved route creation**:
  - Popular places sections (airports, train stations, ski resorts)
  - Route type selectors (city, region, canton, place)
  - Common routes suggestions

- **Visual improvements**:
  - Color-coded badges by zone type
  - Expandable sections with collapsible panels
  - Search functionality for finding zones
  - Zone preview before adding

#### 3. Updated Taxis Live API (src/app/api/taxis/live/route.ts)
Enhanced matching logic using geographic data:

- **Zone type-aware matching**:
  - `country` type: Checks if place is in Liechtenstein
  - `canton` type: Uses full canton municipality lists
  - `district` type: Uses district-specific municipalities
  - `municipality` type: Direct comparison

- **New helper functions**:
  - `isPlaceInCanton()` - Check if place belongs to a canton
  - `isPlaceInDistrict()` - Check if place belongs to a district
  - `isPlaceInLiechtenstein()` - Check if place is in Liechtenstein

- **Improved route matching**:
  - Routes with canton/region origins now match destinations within that area
  - Better handling of route origin/destination zones

### Files Modified
1. `/src/lib/geo-data.ts` - NEW: Complete geographic data for Switzerland and Liechtenstein
2. `/src/components/RoutesZonesManager.tsx` - Enhanced with hierarchical selection
3. `/src/app/api/taxis/live/route.ts` - Updated matching logic with geo-data

### Technical Details
- TypeScript interfaces for `Canton`, `District`, `Country`
- 26 canton entries with multiple districts each
- ~500+ municipalities covered across all districts
- All data structured for easy multilingual support
- Pre-built exclusion lists for each zone type

---
## Task ID: 3 - Integration of Geographic Zones in Registration

### Work Task
Integrate the complete geographic zone system into the registration form and ensure zones are saved when creating a new driver.

### Work Summary

#### 1. Registration Form Updates (src/app/registrarse/page.tsx)
- **Added imports** for geographic data:
  - `SWISS_CANTONS`, `LIECHTENSTEIN`, `POPULAR_PLACES`
  - `getMunicipalitiesByCanton`, `getMunicipalitiesByDistrict`

- **New state** for service zones with exclusions:
  ```typescript
  const [serviceZonesWithExclusions, setServiceZonesWithExclusions] = useState<Array<{
    zoneName: string;
    zoneType: string;
    exclusions: string[];
  }>>([]);
  ```

- **Enhanced Step 5** (Routes and Prices → Zonas de servicio, rutas y precios):
  - Quick add buttons for all cantons and Liechtenstein
  - Zone list with exclusion management
  - Expandable exclusion selector per zone
  - Popular places quick-select (airports, train stations)
  - Custom zone input option

- **Form submission** now includes `serviceZonesWithExclusions`

#### 2. API Updates (src/app/api/drivers/route.ts)
- Added logic to create `DriverServiceZone` records after driver creation:
  ```typescript
  if (body.serviceZonesWithExclusions && body.serviceZonesWithExclusions.length > 0) {
    for (const zone of body.serviceZonesWithExclusions) {
      await db.driverServiceZone.create({
        data: {
          driverId: driver.id,
          zoneName: zone.zoneName,
          zoneType: zone.zoneType || 'region',
          exclusions: JSON.stringify(zone.exclusions || []),
          isActive: true,
        },
      })
    }
  }
  ```

### Complete Flow
1. **Registration**: Driver selects zones (cantons, regions, municipalities)
2. **Exclusions**: Driver can exclude specific places from each zone
3. **Routes**: Driver can add specific routes with prices
4. **Dashboard**: Driver can modify all zones and routes later
5. **Matching**: The `/api/taxis/live` API uses this data to match drivers with clients

### Geographic Data Statistics
- **26 Cantones suizos** completos con todos sus distritos
- **~2,200+ municipios** suizos cubiertos
- **11 municipios** de Liechtenstein
- Tipos de zonas: canton, district, bezirk, wahlkreis, region, arrondissement
- 7 aeropuertos, 20 estaciones de tren, 20 estaciones de esquí, 12 puntos turísticos, 20 ciudades principales

---
## Task ID: 4 - Fix Zone Coverage and Exclusion Logic

### Problem
Users reported that when searching "Buchs SG → Widnau SG", all 7 taxi drivers appeared, when some should have been filtered out based on their zone exclusions. Specifically, driver "gumersindo" has Widnau in his exclusion list but was still appearing in search results.

### Root Cause Analysis
1. **Text-only search fallback**: When the search API received only text parameters (originText, destinationText) without coordinates or IDs, it fell through to a default case that returned ALL drivers.

2. **Missing text-based location resolution**: The API only processed searches when `originId || destinationId || directOriginLat || directDestLat` were provided, ignoring text-only searches.

### Fix Applied

#### 1. Updated Search API (src/app/api/taxis/search/route.ts)

**Changed condition** from:
```typescript
if (originId || destinationId || directOriginLat || directDestLat) {
```

**To:**
```typescript
const hasOriginSearch = originId || directOriginLat || originText
const hasDestSearch = destinationId || directDestLat || destinationText

if (hasOriginSearch || hasDestSearch) {
```

**Added text-based location resolution** for origin:
```typescript
else if (originText) {
  // Parse canton code from text (e.g., "Buchs SG" -> "SG")
  const cantonMatch = originText.match(/\b([A-Z]{2})\b/)
  const possibleCantonCode = cantonMatch ? cantonMatch[1] : undefined
  
  // Search city by name in database
  const cityMatch = await db.city.findFirst({
    where: {
      OR: [
        { name: { equals: originText.split(',')[0].replace(/\s*[A-Z]{2}\s*$/, '').trim() } },
        { name: { equals: textNorm } },
        { slug: { equals: textNorm.replace(/\s+/g, '-') } }
      ]
    },
    include: { canton: true }
  })
  // Create location info from matched city or canton
}
```

**Same logic added for destination.**

### Test Results

| Search Query | Expected | Result |
|-------------|----------|--------|
| Buchs SG → Widnau SG | 0 drivers | ✅ 0 drivers |
| Vaduz → Schaan | 1 driver (gumersindo) | ✅ 1 driver |
| Only origin: Vaduz | 1 driver | ✅ 1 driver |
| No parameters | 7 drivers | ✅ 7 drivers |

### Exclusion Logic Verification

The `driverCoversLocation()` function in `/src/lib/geo.ts` correctly handles exclusions:
1. Collects ALL exclusions from ALL zones
2. Checks if target location matches any exclusion
3. Returns `{ covers: false, excluded: true }` if excluded

### Files Modified
1. `/src/app/api/taxis/search/route.ts` - Added text-based location resolution

### Data Note
Widnau is stored in the database under canton AR (Appenzell Ausserrhoden), but geographically it's in SG (St. Gallen). This doesn't affect the exclusion logic since exclusions match by city name, not canton code.

---
## Task ID: 5 - Shared ZoneSelector Component for Dashboard and Registration

### Problem
The Dashboard and Registration form had duplicated zone selection logic. Any UI changes needed to be made in two places. Additionally, the exclusion selector was showing all municipalities from a canton instead of filtering by selected district.

### Solution

#### 1. Created Shared Component (src/components/ZoneSelector.tsx)
New reusable component with:
- **All zone selection logic** in one place
- **Two modes**: `register` for new registrations, `dashboard` for existing drivers
- **Hierarchical filtering**: Canton → District → Municipality
- **Exclusion system** with Badge buttons and white text
- **Modal for editing exclusions** on existing zones
- **API integration** for dashboard mode (load/save zones)

#### 2. Registration Form Integration (src/app/registrarse/page.tsx)
- Replaced custom zone selector with `<ZoneSelector mode="register" />`
- Uses callback `onZonesChange` to sync with form state
- Zones are saved when form is submitted

#### 3. Dashboard Integration (src/components/RoutesZonesManager.tsx)
- Replaced custom zone selector with `<ZoneSelector mode="dashboard" driverId={driverId} />`
- Removed ~800 lines of duplicated code
- Routes tab kept separate (not part of zone selection)

#### 4. Cascading Filter Fix
**Problem**: When selecting a specific district (e.g., "Rheintal" in St. Gallen), the exclusion list showed ALL municipalities from the entire canton instead of only those in the selected district.

**Fix Applied**:
```typescript
// BEFORE: Always showed all canton municipalities
const municipalitiesForExclusion = useMemo(() => {
  if (selectedCanton) {
    return getMunicipalitiesByCanton(selectedCanton);  // All canton municipalities
  }
}, [selectedCanton]);

// AFTER: Cascading filter based on district selection
const municipalitiesForExclusion = useMemo(() => {
  if (selectedCanton) {
    if (selectedDistrict && selectedDistrict !== "__all__") {
      return getMunicipalitiesByDistrict(selectedCanton, selectedDistrict);  // Only district municipalities
    }
    return getMunicipalitiesByCanton(selectedCanton);  // All canton (when "Todo el cantón" selected)
  }
}, [selectedCanton, selectedDistrict]);
```

#### 5. Edit Modal Fix
Updated `filteredEditMunicipalities` to correctly identify if a saved zone is:
- A **canton** (zoneType: 'canton') → Shows all canton municipalities
- A **district** (zoneType: 'district') → Shows only that district's municipalities
- **Liechtenstein** → Shows 11 municipalities

### Test Case
1. Select canton "St. Gallen"
2. Select district "Rheintal"
3. Exclusion list now shows only 13 municipalities: Altstätten, Au, Balgach, Berneck, Diepoldsau, Eichberg, Marbach, Oberriet, Rebstein, Rheineck, Rüthi, St. Margrethen, Widnau
4. Change to district "Werdenberg" → List updates to: Buchs, Gams, Grabs, Sennwald, Sevelen, Wartau, Widen

### Files Modified
1. `/src/components/ZoneSelector.tsx` - NEW: Shared component
2. `/src/app/registrarse/page.tsx` - Uses ZoneSelector
3. `/src/components/RoutesZonesManager.tsx` - Simplified, uses ZoneSelector
4. `/src/lib/geo-data.ts` - Added import of `getMunicipalitiesByDistrict`

---
## Task ID: 6 - Clean Step 2 Registration Form

### Problem
The Step 2 of registration had obsolete "Zonas de servicio" section with generic options like "Aeropuerto", "Estación de tren", etc. This was confusing because zones are now configured in a later step with proper geographic data and exclusions.

### Solution

#### 1. Removed Obsolete Code
- **Deleted** `popularZones` constant array
- **Deleted** `toggleZone()` function
- **Deleted** API fetch for cantons (now uses local geographic data)
- **Deleted** `cantons` and `availableCities` state variables
- **Deleted** useEffects for loading/updating cantons and cities from database

#### 2. New Step 2 Design: "Tu Ubicación Base (Sede)"
Clean interface with only the essential fields:

**Required Fields:**
- **Cantón**: Dropdown with all 26 Swiss cantons + Liechtenstein (🇱🇮)
- **Ciudad/Municipio**: Dropdown filtered strictly by selected canton

**Optional Field:**
- **Dirección / Calle**: For exact address if driver wants to show it

#### 3. Strict Cascading Filter
```typescript
const availableMunicipalities = useMemo(() => {
  if (!selectedBaseCanton) return [];
  if (selectedBaseCanton === "liechtenstein") {
    return LIECHTENSTEIN.municipalities;  // 11 municipalities
  }
  const canton = SWISS_CANTONS.find(c => c.id === selectedBaseCanton);
  // Collect all municipalities from all districts in the canton
  const municipalities = new Set<string>();
  canton.districts.forEach(district => {
    district.municipalities.forEach(m => municipalities.add(m));
  });
  return Array.from(municipalities).sort();
}, [selectedBaseCanton]);
```

#### 4. New State Variables
- `baseCanton`: The canton ID where the taxi is based
- `baseCity`: The municipality name where the taxi is based
- These are shown to clients when GPS is inactive: "Taxi con base en Buchs SG"

#### 5. Visual Improvements
- Info box explaining the purpose of this location
- Preview box showing selected location with green checkmark
- Count of available municipalities shown below selector

### Test Cases
| Selection | Result |
|-----------|--------|
| Cantón: St. Gallen | Shows ~80 municipalities from St. Gallen only |
| Cantón: Liechtenstein | Shows 11 municipalities from Liechtenstein only |
| Cantón: Zürich | Shows ~160 municipalities from Zürich only |

### Files Modified
1. `/src/app/registrarse/page.tsx` - Complete Step 2 redesign
   - Added `useMemo` import
   - Added `selectedBaseCanton` state
   - Added `availableMunicipalities` derived state
   - Removed obsolete code
   - Updated AI generation functions to use new fields
   - Updated validation to check `baseCanton` and `baseCity`

---
## Task ID: 7 - Complete Refactor of Taxi Search Engine

### Work Task
Refactor completely the taxi search engine in `/home/z/my-project/src/app/api/taxis/search/route.ts` following 10 strict rules for route validation, zone matching, priority ordering, and vehicle filtering.

### Work Summary

#### 1. Complete Rewrite of Search API
The entire search engine was rewritten from scratch with a clean, modular architecture following 10 strict rules:

#### 2. Rule Implementation

**REGLA 1: Validación de RECOGIDA (Origen)**
- Created `validatePickup()` function
- Checks if origin matches `zoneMode = 'pickup'` zones
- Falls back to GPS location if not in pickup zones
- Returns distance and ETA to origin

**REGLA 2: Validación de DESTINO**
- Created `validateDestination()` function
- Checks if destination matches `zoneMode = 'service'` zones
- No exceptions unless route bypass applies

**REGLA 3: Lógica Cantón vs Distrito**
- Created `checkZoneCoverage()` function
- `zoneType = 'canton'` → accepts ANY municipality in that canton
- `zoneType = 'district'` → only municipalities in that specific district
- Uses data from `/src/lib/swiss-municipalities.ts`

**REGLA 4: Excepción por Rutas Populares (BYPASS)**
- Created `checkPopularRouteBypass()` function
- If trip matches saved route exactly → driver appears regardless of zones
- Marked with highest priority (level 5)

**REGLA 5: Radio de Recogida Dinámico**
- Created `validatePickupRadius()` function
- Maximum 15km to go pick up client
- Exception: Long distance trips (>50km) ignore this limit
- "Golden rule": ETA > 3x trip duration → not shown

**REGLA 6: Lógica de Retorno (GPS Match)**
- Created `checkReturnTrip()` function
- If driver's GPS is active outside their base zone
- And client's destination is near driver's base → Priority 1 (returning home)

**REGLA 7: Prioridades de Resultados**
Implemented 5-level priority system:
1. **Route Bypass (Level 5)**: Matches saved route
2. **Match Total (Level 4)**: Origin in pickup + Destination in service
3. **Return Match (Level 3)**: GPS returning to base zone
4. **Partial Match (Level 2)**: Only origin matches
5. **GPS Opportunity (Level 1)**: GPS active near origin

**REGLA 8: Filtros de Vehículo**
- Created `validateVehicleFilters()` function
- Filters by `passengerCapacity` vs requested passengers
- Filters by `vehicleTypes` vs requested type
- Filters by `services` vs requested services

**REGLA 9: ETA y Distancia**
- Uses `calculateRoute()` from geo-osm.ts for real ETA
- Returns `eta`, `distanceToOrigin`, `tripDistance`, `tripDuration`
- Orders by ETA when priority ties

**REGLA 10: Reservas (Pre-booking)**
- Accepts `scheduledFor` ISO date parameter
- Structure prepared for calendar availability check
- Falls back to base location when GPS is ignored

#### 3. New Types and Constants

```typescript
interface SearchResult {
  driver: DriverForSearch;
  priority: MatchPriority;
  eta: number;
  distanceToOrigin: number;
  tripDistance: number;
  tripDuration: number;
  estimatedPrice: { min: number; max: number };
  matchReason: string;
  zones: { pickup: string; service: string };
  isReturnTrip?: boolean;
  routeBypass?: boolean;
}

interface SearchMeta {
  origin: string;
  destination: string;
  totalMatches: number;
  filteredByCapacity: number;
  filteredByDistance: number;
  filteredByVehicleType: number;
  filteredByServices: number;
  filteredByZones: number;
}
```

#### 4. Configuration Constants

```typescript
const CONFIG = {
  MAX_PICKUP_RADIUS_KM: 15,        // Maximum distance to pick up
  LONG_DISTANCE_THRESHOLD_KM: 50,  // Long distance exception
  MAX_PICKUP_ETA_MINUTES: 30,      // Maximum ETA to pick up
  MAX_ETA_TO_TRIP_RATIO: 3,        // Golden rule ratio
  GPS_MAX_AGE_HOURS: 1,            // GPS freshness threshold
  CACHE_TTL_MS: 30000,             // Driver cache TTL
}
```

#### 5. Response Format

```json
{
  "success": true,
  "data": [{
    "id": "...",
    "name": "Taxi Paco",
    "priority": 4,
    "priorityLabel": "Match Total",
    "eta": 8,
    "distanceToOrigin": 3.2,
    "tripDistance": 15.5,
    "tripDuration": 18,
    "estimatedPrice": { "min": 45, "max": 52 },
    "matchReason": "Dentro de zona: St. Gallen SG → Cantón: St. Gallen SG",
    "zones": { "pickup": "St. Gallen SG", "service": "St. Gallen SG" },
    "vehicle": { "type": "taxi", "capacity": 4 },
    "isReturnTrip": false,
    "routeBypass": false
  }],
  "searchMeta": {
    "origin": "Buchs SG",
    "destination": "St. Gallen",
    "totalMatches": 3,
    "filteredByCapacity": 0,
    "filteredByDistance": 1,
    "filteredByVehicleType": 0,
    "filteredByServices": 0,
    "filteredByZones": 2
  },
  "tripInfo": {
    "distance": 25.3,
    "duration": 22,
    "durationFormatted": "22 min"
  }
}
```

#### 6. Helper Functions Created

| Function | Purpose |
|----------|---------|
| `normalizeText()` | Normalize text for comparison |
| `getCantonMunicipalities()` | Get all municipalities in a canton |
| `isCityInCanton()` | Check if city belongs to canton |
| `isCityInDistrict()` | Check if city belongs to district |
| `checkZoneCoverage()` | Check location against zone with type logic |
| `checkPopularRouteBypass()` | Check if trip matches saved route |
| `isGPSLocationFresh()` | Verify GPS update freshness |
| `estimatePrice()` | Calculate estimated price range |
| `validatePickup()` | Rule 1 implementation |
| `validateDestination()` | Rule 2 implementation |
| `validatePickupRadius()` | Rule 5 implementation |
| `checkReturnTrip()` | Rule 6 implementation |
| `validateVehicleFilters()` | Rule 8 implementation |

### Files Modified
1. `/src/app/api/taxis/search/route.ts` - Complete rewrite with 10 rules

### Technical Details
- ~1,500 lines of well-structured, documented code
- Clear separation of concerns with helper functions
- Comprehensive logging for debugging
- Cache system for driver data (30s TTL)
- TypeScript strict mode compliant
- No lint errors
- No TypeScript errors

---
Task ID: 1
Agent: main
Task: Separar PWA install para clientes (home) y taxistas (widget)

Work Log:
- Creado `/public/manifest-client.json` con start_url: "/" para clientes
- Mantenido `/public/manifest.json` con start_url: "/widget" para taxistas
- Eliminado manifest estático de layout metadata
- Añadido script dinámico en layout que selecciona manifest según URL
- Modificado `PWAInstallPrompt` para no mostrar en /widget, /gps-quick, /dashboard, /login, /registrarse
- Cambiado texto de PWAInstallPrompt de "Acceso rápido al GPS" a "Ten eitaxi en tu móvil" / "Instala la app para buscar taxis rápido"
- Añadido componente `ClientInstallButton` en footer de home page con modal de instrucciones iOS/Android/Desktop
- Verificado build exitoso

Stage Summary:
- Clients on home page (/): see PWA install banner + "Descargar app" in footer → installs app opening at /
- Drivers on /widget: have their own install button → installs GPS widget opening at /widget
- Dynamic manifest prevents wrong start_url for each audience

---
Task ID: 2
Agent: main
Task: Widget PWA requiere sesión - sin sesión redirige a login

Work Log:
- Creada API `/api/auth/session` (GET) que verifica la cookie HTTP-only y devuelve driverId, email, name
- Actualizado `/widget` para verificar sesión via API al cargar
- Si no hay sesión → muestra pantalla "Inicia sesión" con botón que redirige a `/login?redirect=/widget`
- Si hay sesión → muestra el botón GPS con nombre del conductor
- Añadido botón "Cerrar sesión" en el widget
- Eliminado el prompt() manual para driverId, ahora usa siempre la sesión del login
- Refactorizado modal de instalación en componente separado `InstallModal`

Stage Summary:
- Widget PWA es ahora una app independiente que requiere autenticación
- Flujo: Instalar widget → Abrir app → Si no hay sesión → Login → Después del login vuelve al widget con GPS activo
- La cookie HTTP-only se usa para validar la sesión (seguro, no accesible desde JS)

---
Task ID: 3
Agent: main
Task: Auditoria legal nDSG completa - correccion de problemas de privacidad y seguridad

Work Log:
- Auditoria completa de 35 archivos del proyecto (25 API routes, 8 componentes, schema BD, config)
- Identificados 17 problemas criticos y 12 moderados bajo la ley suiza nDSG
- Eliminado fallback de clave JWT hardcodeada en src/lib/auth.ts
- Cambiado cookie sameSite de 'lax' a 'strict' en sessionCookieOptions
- Eliminado fallback a cookie legada eitaxi_driver_id en src/hooks/useSession.ts
- Aeladida autenticacion requerida al GET de /api/driver/tracking
- Aeladido rate limiting (60 req/min) al endpoint /api/driver/location/[id]
- Ocultados telefonos y WhatsApp de APIs publicas (/taxis/live, /taxis/search)
- Eliminados speed/heading/accuracy de la respuesta publica GPS
- Aeladido rate limiting (3/hora/IP) y moderacion al POST de /api/reviews
- Sanitizados todos los console.log con datos personales en drivers, security, search
- Reforzada politica de contrasenas: 8+ caracteres + complejidad (letra y numero)
- Creado endpoint /api/driver/data-export (GET) para derecho de acceso nDSG Art. 25
- Creado endpoint /api/driver/delete-account (DELETE) para derecho de supresion nDSG Art. 27
- Actualizado componente DataManagement para usar nuevos endpoints con auth JWT
- Generado informe PDF de cumplimiento legal

Stage Summary:
- 13 problemas criticos corregidos en codigo
- 2 nuevos endpoints creados (data-export, delete-account)
- Compilacion exitosa sin errores
- Informe de cumplimiento generado: /download/eitaxi-informe-cumplimiento-nDSG.pdf
- Pendientes: traduccion privacy policy a aleman, banner cookies, disclosure AI service
---
Task ID: 1
Agent: Main Agent
Task: Crear documento con lista de prompts para replicar todo el sistema de cliente de Eitaxi

Work Log:
- Exploré la rama backup-client-system para entender todos los archivos creados (31 archivos, 5065 líneas)
- Leí todos los archivos clave: schema Prisma, APIs de auth/bookings/chat/notifications/push, componentes, librerías
- Creé documento DOCX con 29 prompts bien definidos organizados por módulo
- Incluí tabla de orden de ejecución para que otra IA pueda replicar paso a paso
- Apliqué fix de XML (tags <0/> inválidos generados por docx-js)
- Pasé verificación postcheck (0 errores)

Stage Summary:
- Documento generado: /home/z/my-project/download/Eitaxi-Prompts-Replicacion.docx (15KB)
- 29 prompts cubriendo: Schema Prisma (6 modelos), Auth cliente (login/register/logout/session), CRUD de reservas, Chat, Notificaciones, Push notifications, Componentes UI, APIs auxiliares, Variables de entorno, Service Worker
- Incluye orden de ejecución y regla crítica de no borrar lógica existente
