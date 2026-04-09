import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Cantones principales de Suiza con sus ciudades
const swissData = [
  {
    name: "Zürich",
    code: "ZH",
    slug: "zurich",
    cities: [
      { name: "Zürich", slug: "zurich" },
      { name: "Winterthur", slug: "winterthur" },
      { name: "Uster", slug: "uster" },
      { name: "Dübendorf", slug: "dubendorf" },
      { name: "Dietikon", slug: "dietikon" },
      { name: "Wetzikon", slug: "wetzikon" },
      { name: "Horgen", slug: "horgen" },
      { name: "Kloten", slug: "kloten" },
    ]
  },
  {
    name: "Bern",
    code: "BE",
    slug: "bern",
    cities: [
      { name: "Bern", slug: "bern" },
      { name: "Biel/Bienne", slug: "biel" },
      { name: "Thun", slug: "thun" },
      { name: "Burgdorf", slug: "burgdorf" },
      { name: "Langenthal", slug: "langenthal" },
      { name: "Steffisburg", slug: "steffisburg" },
    ]
  },
  {
    name: "Geneva",
    code: "GE",
    slug: "geneva",
    cities: [
      { name: "Geneva", slug: "geneva" },
      { name: "Vernier", slug: "vernier" },
      { name: "Lancy", slug: "lancy" },
      { name: "Meyrin", slug: "meyrin" },
      { name: "Carouge", slug: "carouge" },
    ]
  },
  {
    name: "Vaud",
    code: "VD",
    slug: "vaud",
    cities: [
      { name: "Lausanne", slug: "lausanne" },
      { name: "Montreux", slug: "montreux" },
      { name: "Yverdon-les-Bains", slug: "yverdon" },
      { name: "Vevey", slug: "vevey" },
      { name: "Nyon", slug: "nyon" },
      { name: "Renens", slug: "renens" },
    ]
  },
  {
    name: "Basel-Stadt",
    code: "BS",
    slug: "basel-stadt",
    cities: [
      { name: "Basel", slug: "basel" },
    ]
  },
  {
    name: "Basel-Landschaft",
    code: "BL",
    slug: "basel-land",
    cities: [
      { name: "Liestal", slug: "liestal" },
      { name: "Reinach", slug: "reinach" },
      { name: "Allschwil", slug: "allschwil" },
      { name: "Muttenz", slug: "muttenz" },
    ]
  },
  {
    name: "Aargau",
    code: "AG",
    slug: "aargau",
    cities: [
      { name: "Aarau", slug: "aarau" },
      { name: "Baden", slug: "baden" },
      { name: "Wettingen", slug: "wettingen" },
      { name: "Wohlen", slug: "wohlen" },
      { name: "Rheinfelden", slug: "rheinfelden" },
    ]
  },
  {
    name: "Lucerne",
    code: "LU",
    slug: "lucerne",
    cities: [
      { name: "Lucerne", slug: "lucerne" },
      { name: "Emmen", slug: "emmen" },
      { name: "Kriens", slug: "kriens" },
      { name: "Horw", slug: "horw" },
    ]
  },
  {
    name: "St. Gallen",
    code: "SG",
    slug: "st-gallen",
    cities: [
      { name: "St. Gallen", slug: "st-gallen" },
      { name: "Rapperswil-Jona", slug: "rapperswil" },
      { name: "Gossau", slug: "gossau" },
      { name: "Wil", slug: "wil" },
      { name: "Uzwil", slug: "uzwil" },
    ]
  },
  {
    name: "Ticino",
    code: "TI",
    slug: "ticino",
    cities: [
      { name: "Lugano", slug: "lugano" },
      { name: "Bellinzona", slug: "bellinzona" },
      { name: "Locarno", slug: "locarno" },
      { name: "Chiasso", slug: "chiasso" },
      { name: "Mendrisio", slug: "mendrisio" },
    ]
  },
  {
    name: "Valais",
    code: "VS",
    slug: "valais",
    cities: [
      { name: "Sion", slug: "sion" },
      { name: "Martigny", slug: "martigny" },
      { name: "Monthey", slug: "monthey" },
      { name: "Brig-Glis", slug: "brig" },
      { name: "Nendaz", slug: "nendaz" },
    ]
  },
  {
    name: "Graubünden",
    code: "GR",
    slug: "graubunden",
    cities: [
      { name: "Chur", slug: "chur" },
      { name: "Davos", slug: "davos" },
      { name: "St. Moritz", slug: "st-moritz" },
    ]
  },
]

// Taxistas de ejemplo
const sampleDrivers = [
  {
    name: "Taxi Paco",
    slug: "taxi-paco",
    phone: "+41 79 123 45 67",
    whatsapp: "+41 79 123 45 67",
    email: "paco@taxizone.ch",
    password: "demo123456", // Will be hashed
    experience: 8,
    description: "Conductor profesional con más de 8 años de experiencia en Zürich y alrededores. Especializado en traslados al aeropuerto y servicios de larga distancia. Hablo español, alemán e inglés.",
    isAvailable24h: true,
    services: ["airport", "city", "long_distance", "corporate"],
    routes: ["zurich-airport", "zurich-stgallen", "zurich-bern"],
    languages: ["de", "en", "es"],
    serviceZones: ["Centro de la ciudad", "Aeropuerto", "Zona empresarial"],
    vehicleType: "taxi",
    vehicleBrand: "Mercedes",
    vehicleModel: "E-Class",
    vehicleYear: 2022,
    vehicleColor: "Negro",
    passengerCapacity: 4,
    subscription: "premium",
    isVerified: true,
    isTopRated: true,
  },
  {
    name: "Taxi Maria",
    slug: "taxi-maria",
    phone: "+41 79 234 56 78",
    whatsapp: "+41 79 234 56 78",
    email: "maria@taxizone.ch",
    password: "demo123456", // Will be hashed
    experience: 5,
    description: "Servicio de taxi en Ginebra y la zona francesa de Suiza. Vehículo confortable y conductoras profesional. Ideal para familias y viajeros de negocios.",
    isAvailable24h: true,
    services: ["airport", "city", "corporate"],
    routes: ["geneva-airport", "geneva-lausanne"],
    languages: ["fr", "en", "es"],
    serviceZones: ["Centro de la ciudad", "Aeropuerto"],
    vehicleType: "taxi",
    vehicleBrand: "BMW",
    vehicleModel: "5 Series",
    vehicleYear: 2021,
    vehicleColor: "Blanco",
    passengerCapacity: 4,
    subscription: "featured",
    isVerified: true,
    isTopRated: false,
  },
  {
    name: "Taxi Hans",
    slug: "taxi-hans",
    phone: "+41 79 345 67 89",
    whatsapp: "+41 79 345 67 89",
    email: "hans@taxizone.ch",
    password: "demo123456", // Will be hashed
    experience: 12,
    description: "El taxi más confiable de Berna. Conozco cada rincón de la ciudad y sus alrededores. Servicio puntual y profesional garantizado.",
    isAvailable24h: true,
    services: ["airport", "city", "long_distance"],
    routes: ["bern-airport", "bern-zurich", "bern-interlaken"],
    languages: ["de", "en", "fr"],
    serviceZones: ["Centro de la ciudad", "Área metropolitana"],
    vehicleType: "van",
    vehicleBrand: "Volkswagen",
    vehicleModel: "Multivan",
    vehicleYear: 2023,
    vehicleColor: "Plata",
    passengerCapacity: 8,
    subscription: "premium",
    isVerified: true,
    isTopRated: true,
  },
  {
    name: "Taxi Marco",
    slug: "taxi-marco",
    phone: "+41 79 456 78 90",
    whatsapp: "+41 79 456 78 90",
    email: "marco@taxizone.ch",
    password: "demo123456", // Will be hashed
    experience: 6,
    description: "Tu taxi en Ticino! Servicio profesional en Lugano y toda la región italoparlante de Suiza. Traslados a Milán y aeropuertos italianos.",
    isAvailable24h: true,
    services: ["airport", "city", "long_distance"],
    routes: ["lugano-milano", "lugano-airport"],
    languages: ["it", "de", "en"],
    serviceZones: ["Centro de la ciudad", "Aeropuerto"],
    vehicleType: "taxi",
    vehicleBrand: "Audi",
    vehicleModel: "A6",
    vehicleYear: 2020,
    vehicleColor: "Azul",
    passengerCapacity: 4,
    subscription: "free",
    isVerified: false,
    isTopRated: false,
  },
  {
    name: "Taxi Ahmed",
    slug: "taxi-ahmed",
    phone: "+41 79 567 89 01",
    whatsapp: "+41 79 567 89 01",
    email: "ahmed@taxizone.ch",
    password: "demo123456", // Will be hashed
    experience: 4,
    description: "Servicio de taxi en Basilea y la región trinacional (Suiza, Francia, Alemania). Multilingüe: alemán, francés, inglés y árabe.",
    isAvailable24h: true,
    services: ["airport", "city", "corporate"],
    routes: ["basel-airport", "basel-zurich"],
    languages: ["de", "fr", "en", "ar"],
    serviceZones: ["Centro de la ciudad", "Aeropuerto", "Estación de tren"],
    vehicleType: "taxi",
    vehicleBrand: "Skoda",
    vehicleModel: "Superb",
    vehicleYear: 2022,
    vehicleColor: "Gris",
    passengerCapacity: 4,
    subscription: "featured",
    isVerified: true,
    isTopRated: false,
  },
  {
    name: "Limousine Geneva",
    slug: "limousine-geneva",
    phone: "+41 79 678 90 12",
    whatsapp: "+41 79 678 90 12",
    email: "limousine@taxizone.ch",
    password: "demo123456", // Will be hashed
    experience: 10,
    description: "Servicio de limusina premium en Ginebra. Ideal para eventos corporativos, bodas y ocasiones especiales. Vehículos de lucho con chófer profesional.",
    isAvailable24h: true,
    services: ["limousine", "corporate", "events", "airport"],
    routes: ["geneva-airport", "geneva-lausanne"],
    languages: ["fr", "en", "de"],
    serviceZones: ["Centro de la ciudad", "Aeropuerto", "Zona empresarial"],
    vehicleType: "limousine",
    vehicleBrand: "Mercedes",
    vehicleModel: "S-Class",
    vehicleYear: 2024,
    vehicleColor: "Negro",
    passengerCapacity: 3,
    subscription: "premium",
    isVerified: true,
    isTopRated: true,
  },
]

async function main() {
  console.log("🌱 Iniciando seed de la base de datos...")

  // Crear cantones y ciudades
  for (const cantonData of swissData) {
    const canton = await prisma.canton.create({
      data: {
        name: cantonData.name,
        code: cantonData.code,
        slug: cantonData.slug,
        cities: {
          create: cantonData.cities.map(city => ({
            name: city.name,
            slug: city.slug,
          }))
        }
      },
      include: { cities: true }
    })
    console.log(`✅ Creado cantón: ${canton.name} con ${canton.cities.length} ciudades`)
  }

  // Obtener todas las ciudades organizadas por cantón
  const zurichCanton = await prisma.canton.findUnique({
    where: { slug: "zurich" },
    include: { cities: true }
  })
  const genevaCanton = await prisma.canton.findUnique({
    where: { slug: "geneva" },
    include: { cities: true }
  })
  const bernCanton = await prisma.canton.findUnique({
    where: { slug: "bern" },
    include: { cities: true }
  })
  const ticinoCanton = await prisma.canton.findUnique({
    where: { slug: "ticino" },
    include: { cities: true }
  })
  const baselStadtCanton = await prisma.canton.findUnique({
    where: { slug: "basel-stadt" },
    include: { cities: true }
  })
  const vaudCanton = await prisma.canton.findUnique({
    where: { slug: "vaud" },
    include: { cities: true }
  })

  // Crear taxistas de ejemplo
  const zurichCity = zurichCanton?.cities.find(c => c.slug === "zurich")
  const genevaCity = genevaCanton?.cities.find(c => c.slug === "geneva")
  const bernCity = bernCanton?.cities.find(c => c.slug === "bern")
  const luganoCity = ticinoCanton?.cities.find(c => c.slug === "lugano")
  const baselCity = baselStadtCanton?.cities.find(c => c.slug === "basel")
  const lausanneCity = vaudCanton?.cities.find(c => c.slug === "lausanne")

  // Helper function to create driver
  const createDriver = async (driverData: typeof sampleDrivers[0], cityId: string, cantonId: string) => {
    const { services, routes, languages, serviceZones, password, ...rest } = driverData
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    await prisma.taxiDriver.create({
      data: {
        ...rest,
        password: hashedPassword,
        cityId,
        cantonId,
        services: JSON.stringify(services),
        routes: JSON.stringify(routes),
        languages: JSON.stringify(languages),
        serviceZones: JSON.stringify(serviceZones),
      }
    })
    console.log(`✅ Creado conductor: ${driverData.name} (${driverData.email})`)
  }

  if (zurichCity && zurichCanton) {
    await createDriver(sampleDrivers[0], zurichCity.id, zurichCanton.id)
  }

  if (genevaCity && genevaCanton) {
    await createDriver(sampleDrivers[1], genevaCity.id, genevaCanton.id)
    // Limousine Geneva (sampleDrivers[5]) also in Geneva
    await createDriver(sampleDrivers[5], genevaCity.id, genevaCanton.id)
  }

  if (bernCity && bernCanton) {
    await createDriver(sampleDrivers[2], bernCity.id, bernCanton.id)
  }

  if (luganoCity && ticinoCanton) {
    await createDriver(sampleDrivers[3], luganoCity.id, ticinoCanton.id)
  }

  if (baselCity && baselStadtCanton) {
    await createDriver(sampleDrivers[4], baselCity.id, baselStadtCanton.id)
  }

  // Crear rutas populares
  const routes = [
    { origin: "Zürich", destination: "Aeropuerto Zürich", slug: "zurich-airport", popularity: 1000 },
    { origin: "Zürich", destination: "St. Gallen", slug: "zurich-stgallen", popularity: 450 },
    { origin: "Zürich", destination: "Bern", slug: "zurich-bern", popularity: 380 },
    { origin: "Geneva", destination: "Aeropuerto Geneva", slug: "geneva-airport", popularity: 820 },
    { origin: "Geneva", destination: "Lausanne", slug: "geneva-lausanne", popularity: 520 },
    { origin: "Bern", destination: "Aeropuerto Bern", slug: "bern-airport", popularity: 290 },
    { origin: "Bern", destination: "Interlaken", slug: "bern-interlaken", popularity: 340 },
    { origin: "Basel", destination: "Aeropuerto Basel", slug: "basel-airport", popularity: 480 },
    { origin: "Lugano", destination: "Milano", slug: "lugano-milano", popularity: 390 },
    { origin: "Lausanne", destination: "Verbier", slug: "lausanne-verbier", popularity: 280 },
  ]

  for (const route of routes) {
    await prisma.route.create({ data: route })
  }
  console.log(`✅ Creadas ${routes.length} rutas populares`)

  console.log("🎉 Seed completado!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
