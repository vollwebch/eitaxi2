import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { determineCoverageType, getCityCoordinates, CITY_COORDINATES } from '@/lib/geo-osm'

// Función para generar slug único
async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30)
  
  let slug = baseSlug
  let counter = 1
  
  while (await db.taxiDriver.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`
    counter++
  }
  
  return slug
}

// Validación detallada de campos obligatorios
function validateRequiredFields(body: any): { valid: boolean; missing: string[]; errors: string[]; fieldErrors: Record<string, string> } {
  const missing: string[] = []
  const errors: string[] = []
  const fieldErrors: Record<string, string> = {}
  
  // Paso 1: Datos básicos
  if (!body.name || body.name.trim().length < 2) {
    missing.push('nombre')
    errors.push('Paso 1: El nombre es obligatorio (mínimo 2 caracteres)')
    fieldErrors['name'] = 'El nombre es obligatorio'
  }
  
  if (!body.phone || body.phone.trim().length < 6) {
    missing.push('teléfono')
    errors.push('Paso 1: El teléfono es obligatorio')
    fieldErrors['phone'] = 'El teléfono es obligatorio'
  }
  
  if (!body.email || !body.email.includes('@')) {
    missing.push('email')
    errors.push('Paso 1: El email es obligatorio y debe ser válido')
    fieldErrors['email'] = 'El email es obligatorio'
  }
  
  if (!body.password || body.password.length < 6) {
    missing.push('contraseña')
    errors.push('Paso 1: La contraseña es obligatoria (mínimo 6 caracteres)')
    fieldErrors['password'] = 'La contraseña es obligatoria (mínimo 6 caracteres)'
  }
  
  // Paso 2: Ubicación - aceptar tanto cityId/cantonId como baseCity/baseCanton
  const cantonId = body.cantonId || body.baseCanton;
  const cityId = body.cityId || body.baseCity;
  
  if (!cantonId) {
    missing.push('cantón')
    errors.push('Paso 2: Debes seleccionar un cantón')
    fieldErrors['cantonId'] = 'Debes seleccionar un cantón'
  }
  
  if (!cityId) {
    missing.push('ciudad')
    errors.push('Paso 2: Debes seleccionar una ciudad')
    fieldErrors['cityId'] = 'Debes seleccionar una ciudad'
  }
  
  // Paso 3: Vehículo - validar que hay vehículos (nueva lógica)
  const hasVehicles = body.vehicles && body.vehicles.length > 0;
  const hasVehicleTypes = body.vehicleTypes && body.vehicleTypes.length > 0;
  if (!hasVehicles && !hasVehicleTypes && !body.vehicleType) {
    missing.push('tipo de vehículo')
    errors.push('Paso 3: Debes añadir al menos un vehículo')
    fieldErrors['vehicleTypes'] = 'Debes añadir al menos un vehículo'
  }
  
  // Paso 4: Servicios
  if (!body.services || body.services.length === 0) {
    missing.push('servicios')
    errors.push('Paso 4: Debes seleccionar al menos un servicio')
    fieldErrors['services'] = 'Debes seleccionar al menos un servicio'
  }
  
  // Paso 5: Zonas de recogida
  if (body.serviceZonesWithExclusions && Array.isArray(body.serviceZonesWithExclusions)) {
    const hasPickupZones = body.serviceZonesWithExclusions.some((z: { zoneMode?: string }) => z.zoneMode === 'pickup')
    if (!hasPickupZones) {
      missing.push('zonas de recogida')
      errors.push('Paso 5: Debes añadir al menos una zona de RECOGIDA (pickup)')
      fieldErrors['pickupZones'] = 'Debes añadir al menos una zona de recogida'
    }
  } else if (!body.serviceZonesWithExclusions || body.serviceZonesWithExclusions.length === 0) {
    missing.push('zonas de recogida')
    errors.push('Paso 5: Debes añadir al menos una zona de RECOGIDA (pickup)')
    fieldErrors['pickupZones'] = 'Debes añadir al menos una zona de recogida'
  }
  
  return {
    valid: missing.length === 0,
    missing,
    errors,
    fieldErrors
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 🔍 Log del body recibido para debugging
    console.log('📦 [API] Body recibido:', JSON.stringify(body, null, 2));
    
    // Validación detallada
    const validation = validateRequiredFields(body)
    if (!validation.valid) {
      console.error('❌ [API] Errores de validación:', validation.errors);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Faltan campos obligatorios',
          missingFields: validation.missing,
          detailedErrors: validation.errors,
          fieldErrors: validation.fieldErrors,
        },
        { status: 400 }
      )
    }
    
    const {
      name,
      phone,
      whatsapp,
      email,
      password, // 🔴 IMPORTANTE: Añadido a la desestructuración
      cityId: bodyCityId,
      cantonId: bodyCantonId,
      baseCity,
      baseCanton,
      address,
      experience,
      description,
      originalDescription,
      services,
      languages,
      serviceZones,
      serviceZonesWithExclusions, // 🔴 Añadido para zonas con exclusiones
      isAvailable24h,
      vehicleType,
      vehicleTypes,
      vehicleBrand,
      vehicleModel,
      vehicleYear,
      vehicleColor,
      passengerCapacity,
      imageUrl,
      basePrice,
      pricePerKm,
      hourlyRate,
      website,
      instagram,
      facebook,
      routes,
      schedules,
      subscription = 'free',
      // Nuevos campos de operación
      operationRadius,
      coverageType,
      // Vehículos múltiples
      vehicles,
    } = body

    // 🔍 Verificar password
    if (!password) {
      console.error('❌ ERROR: Password no recibido en el body');
      return NextResponse.json(
        { 
          success: false, 
          error: 'La contraseña es obligatoria',
          field: 'password',
        },
        { status: 400 }
      )
    }
    console.log('✅ Password recibido, longitud:', password?.length || 0);

    // Usar cityId/cantonId o baseCity/baseCanton (para compatibilidad con ambos formatos)
    const cityId = bodyCityId || baseCity;
    const cantonId = bodyCantonId || baseCanton;

    // Verificar email duplicado
    const existingDriver = await db.taxiDriver.findUnique({
      where: { email: email.toLowerCase() }
    })
    if (existingDriver) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Este email ya está registrado',
          field: 'email',
          suggestion: 'Intenta con otro email o inicia sesión si ya tienes cuenta'
        },
        { status: 400 }
      )
    }

    // Verificar ciudad y cantón - Buscar por ID o por nombre
    // Los CUIDs empiezan con 'cl' y tienen ~25 caracteres, los UUIDs tienen formato específico
    const isCuidOrUuid = cityId && (cityId.startsWith('cl') || cityId.includes('-') && cityId.length > 20);
    
    let city;
    if (isCuidOrUuid) {
      // Buscar por ID si parece un CUID o UUID
      city = await db.city.findUnique({ 
        where: { id: cityId },
        include: { canton: true }
      });
    } else {
      // Buscar por nombre y cantón (para cuando el frontend envía el nombre del municipio)
      // Normalizar el nombre del cantón
      let normalizedCantonId = cantonId;
      if (cantonId === 'liechtenstein' || cantonId === 'li') {
        normalizedCantonId = 'li';
      }
      
      city = await db.city.findFirst({
        where: {
          name: cityId,
          cantonId: normalizedCantonId
        },
        include: { canton: true }
      });
      
      // Si no se encuentra con el cantón normalizado, intentar buscar solo por nombre
      if (!city) {
        city = await db.city.findFirst({
          where: { name: cityId },
          include: { canton: true }
        });
      }
    }
    
    // Si aún no se encuentra, crear la ciudad automáticamente
    if (!city) {
      // Normalizar cantón para la base de datos
      let dbCantonId = cantonId;
      if (cantonId === 'liechtenstein') {
        dbCantonId = 'li';
      }
      
      // Nombres de cantones conocidos
      const cantonNames: Record<string, { name: string; country: string }> = {
        'li': { name: 'Liechtenstein', country: 'LI' },
        'zh': { name: 'Zürich', country: 'CH' },
        'be': { name: 'Bern', country: 'CH' },
        'lu': { name: 'Luzern', country: 'CH' },
        'sg': { name: 'St. Gallen', country: 'CH' },
        'ag': { name: 'Aargau', country: 'CH' },
        'zg': { name: 'Zug', country: 'CH' },
        'sz': { name: 'Schwyz', country: 'CH' },
      };
      
      const cantonInfo = cantonNames[dbCantonId] || { name: dbCantonId.toUpperCase(), country: 'CH' };
      
      // Buscar o crear el cantón usando upsert para evitar conflictos
      let canton = await db.canton.findFirst({
        where: {
          OR: [
            { id: dbCantonId },
            { name: cantonInfo.name, country: cantonInfo.country }
          ]
        }
      });
      
      if (!canton) {
        // Crear cantón solo si no existe
        canton = await db.canton.create({
          data: {
            id: dbCantonId,
            name: cantonInfo.name,
            code: dbCantonId.toUpperCase(),
            slug: dbCantonId.toLowerCase(),
            country: cantonInfo.country
          }
        });
      }
      
      // Actualizar dbCantonId con el ID real del cantón encontrado/creado
      dbCantonId = canton.id;
      
      // Crear la ciudad
      const citySlug = cityId.toLowerCase().replace(/[^a-z0-9]/g, '-');
      city = await db.city.create({
        data: {
          name: cityId,
          slug: citySlug,
          cantonId: dbCantonId
        },
        include: { canton: true }
      });
      
      console.log(`✅ Ciudad creada automáticamente: ${cityId} en cantón ${dbCantonId}`);
    }

    // Actualizar cantonId con el valor real de la ciudad encontrada/creada
    const finalCantonId = city.cantonId;

    const canton = city.canton

    // 🧠 LÓGICA INTELIGENTE: Determinar cobertura automáticamente
    const autoCoverage = determineCoverageType(canton.code, canton.country)
    
    // Usar valores proporcionados o los automáticos
    const finalCoverageType = coverageType || autoCoverage.coverageType
    const finalOperationRadius = operationRadius || autoCoverage.operationRadius
    
    // 📍 Obtener coordenadas automáticamente
    const cityCoords = getCityCoordinates(city.name, canton.code)
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Generar slug único
    const slug = await generateUniqueSlug(name)

    // Servicios por defecto
    const finalServices = services && services.length > 0 ? services : ['city']

    // Tipo de vehículo principal
    const primaryVehicleType = vehicleTypes && vehicleTypes.length > 0 
      ? vehicleTypes[0] 
      : vehicleType || 'taxi'

    // 🔍 LOG DETALLADO ANTES DE CREAR
    console.log('🔍 PRE-CREATE CHECK:');
    console.log('  - name:', name?.substring(0, 20) || 'MISSING');
    console.log('  - slug:', slug);
    console.log('  - phone:', phone?.substring(0, 15) || 'MISSING');
    console.log('  - email:', email?.toLowerCase() || 'MISSING');
    console.log('  - cityId:', city.id);
    console.log('  - cantonId:', finalCantonId);
    console.log('  - vehicleType:', primaryVehicleType);
    console.log('  - vehicleTypes:', JSON.stringify(vehicleTypes || [primaryVehicleType]));
    console.log('  - services:', JSON.stringify(finalServices));
    console.log('  - isAvailable24h:', isAvailable24h ?? true);
    console.log('  - schedules:', schedules ? `${schedules.length} días` : 'null');
    console.log('  - routes:', routes ? `${routes.length} rutas` : '0');
    console.log('  - serviceZonesWithExclusions:', serviceZonesWithExclusions ? `${serviceZonesWithExclusions.length} zonas` : '0');

    // Crear el conductor con todos los campos
    const driver = await db.taxiDriver.create({
      data: {
        name,
        slug,
        phone,
        whatsapp: whatsapp || null,
        email: email.toLowerCase(),
        password: hashedPassword,
        cityId: city.id,
        cantonId: finalCantonId,
        address: address || null,
        // Coordenadas automáticas
        latitude: cityCoords?.lat || null,
        longitude: cityCoords?.lng || null,
        // Cobertura automática
        operationRadius: finalOperationRadius,
        coverageType: finalCoverageType,
        experience: experience || 1,
        description: description || null,
        originalDescription: originalDescription || null,
        imageUrl: imageUrl || null,
        vehicleType: primaryVehicleType,
        vehicleTypes: JSON.stringify(vehicleTypes || [primaryVehicleType]),
        vehicleBrand: vehicleBrand || null,
        vehicleModel: vehicleModel || null,
        vehicleYear: vehicleYear || null,
        vehicleColor: vehicleColor || null,
        passengerCapacity: passengerCapacity || null,
        isAvailable24h: isAvailable24h ?? true,
        services: JSON.stringify(finalServices),
        languages: JSON.stringify(languages || []),
        serviceZones: JSON.stringify(serviceZones || []),
        routes: JSON.stringify(routes || []),
        workingHours: isAvailable24h ? null : JSON.stringify(schedules || []),
        basePrice: basePrice || null,
        pricePerKm: pricePerKm || null,
        hourlyRate: hourlyRate || null,
        website: website || null,
        instagram: instagram || null,
        facebook: facebook || null,
        subscription,
        isVerified: false,
        isTopRated: false,
      },
      include: {
        city: true,
        canton: true,
      },
    })

    // Crear rutas específicas
    if (routes && routes.length > 0) {
      for (const route of routes) {
        await db.driverRoute.create({
          data: {
            driverId: driver.id,
            origin: route.origin,
            destination: route.destination,
            price: route.price || null,
          },
        }).catch(() => {}) // Ignorar duplicados
      }
    }

    // Crear zonas de servicio con exclusiones
    if (body.serviceZonesWithExclusions && body.serviceZonesWithExclusions.length > 0) {
      for (const zone of body.serviceZonesWithExclusions) {
        await db.driverServiceZone.create({
          data: {
            driverId: driver.id,
            zoneName: zone.zoneName,
            zoneType: zone.zoneType || 'region',
            zoneMode: zone.zoneMode || 'service',  // 'pickup' o 'service'
            exclusions: JSON.stringify(zone.exclusions || []),
            isActive: true,
          },
        })
      }
    }

    // Crear vehículos - Si vienen en el nuevo formato
    if (vehicles && vehicles.length > 0) {
      // Determinar cuál es el vehículo principal
      const primaryIndex = vehicles.findIndex(v => v.isPrimary);
      const primaryVehicleIndex = primaryIndex >= 0 ? primaryIndex : 0;
      
      for (let i = 0; i < vehicles.length; i++) {
        const v = vehicles[i];
        await db.vehicle.create({
          data: {
            driverId: driver.id,
            vehicleType: v.vehicleType || 'taxi',
            brand: v.brand || null,
            model: v.model || null,
            year: v.year || null,
            color: v.color || null,
            passengerCapacity: v.passengerCapacity || null,
            licensePlate: v.licensePlate || null,
            isPrimary: i === primaryVehicleIndex,
            isActive: true,
          },
        });
      }
      console.log(`✅ ${vehicles.length} vehículo(s) creado(s) para conductor ${driver.id}`);
    }

    // Crear horarios - Soporta formato nuevo (DaySchedule con múltiples franjas) y formato antiguo
    // NOTA: Debido a la restricción @@unique([driverId, dayOfWeek]), solo guardamos en workingHours como JSON
    // cuando hay múltiples slots por día. Si hay un solo slot, también creamos el registro en DriverSchedule.
    if (!isAvailable24h && schedules && schedules.length > 0) {
      for (const schedule of schedules) {
        // Formato nuevo: { dayOfWeek, mode, slots: [{ startTime, endTime }] }
        if ('slots' in schedule && Array.isArray(schedule.slots)) {
          // Solo crear registro en DriverSchedule si hay exactamente un slot (para compatibilidad)
          if (schedule.mode === 'specific' && schedule.slots.length === 1) {
            const slot = schedule.slots[0];
            await db.driverSchedule.create({
              data: {
                driverId: driver.id,
                dayOfWeek: schedule.dayOfWeek,
                startTime: slot.startTime,
                endTime: slot.endTime,
                isActive: true,
              },
            }).catch((err) => {
              // Ignorar errores de duplicados
              console.log('Schedule ya existe o error:', err?.message);
            });
          }
          // Si hay múltiples slots, NO crear registros individuales - workingHours tiene toda la info
        } 
        // Formato antiguo: { dayOfWeek, startTime, endTime, isActive }
        else if ('startTime' in schedule && 'endTime' in schedule) {
          await db.driverSchedule.create({
            data: {
              driverId: driver.id,
              dayOfWeek: schedule.dayOfWeek,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              isActive: schedule.isActive ?? true,
            },
          }).catch(() => {}) // Ignorar duplicados
        }
      }
    }

    // Obtener conductor completo
    const driverWithRoutes = await db.taxiDriver.findUnique({
      where: { id: driver.id },
      include: {
        city: true,
        canton: true,
        driverRoutes: true,
        schedules: true,
        vehicles: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: driver.id,
        name: driver.name,
        slug: driver.slug,
        city: driver.city,
        canton: driver.canton,
        services: JSON.parse(driver.services as string),
        languages: JSON.parse(driver.languages as string),
        serviceZones: JSON.parse(driver.serviceZones as string),
        routes: JSON.parse(driver.routes as string),
        vehicleType: driver.vehicleType,
        vehicleTypes: vehicleTypes || [primaryVehicleType],
        basePrice: driver.basePrice,
        pricePerKm: driver.pricePerKm,
        hourlyRate: driver.hourlyRate,
        website: driver.website,
        instagram: driver.instagram,
        facebook: driver.facebook,
        driverRoutes: driverWithRoutes?.driverRoutes || [],
        schedules: driverWithRoutes?.schedules || [],
        // Nuevos campos
        operationRadius: driver.operationRadius,
        coverageType: driver.coverageType,
        latitude: driver.latitude,
        longitude: driver.longitude,
      },
      profileUrl: `/${canton.slug}/${city.slug}/${slug}`,
      coverageInfo: {
        type: finalCoverageType,
        radius: finalOperationRadius,
        autoAssigned: !coverageType && !operationRadius,
        reason: autoCoverage.reason,
      }
    })
  } catch (error: any) {
    // 🔍 LOG DETALLADO DEL ERROR
    console.error('❌ ERROR COMPLETO AL CREAR CONDUCTOR:');
    console.error('  - Mensaje:', error?.message);
    console.error('  - Código:', error?.code);
    console.error('  - Meta:', error?.meta);
    console.error('  - Stack:', error?.stack);
    
    // Error específico de Prisma
    if (error?.code) {
      const prismaError: Record<string, string> = {
        'P2002': 'Ya existe un registro con ese valor único',
        'P2003': 'Error de referencia - el registro relacionado no existe',
        'P2011': 'Campo obligatorio nulo',
        'P2012': 'Falta un valor requerido',
        'P2013': 'Falta el argumento requerido',
        'P2025': 'Registro no encontrado',
      };
      
      const errorMessage = prismaError[error.code] || `Error de base de datos (${error.code})`;
      
      // Devolver detalles completos del error
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          details: {
            code: error.code,
            message: error.message,
            meta: error.meta,
            field: error.meta?.target || null,
          }
        },
        { status: 400 }
      );
    }
    
    // Error genérico
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Error al crear el perfil. Por favor intenta de nuevo.',
        details: {
          message: error?.message,
          stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const cantonSlug = searchParams.get('canton')
    const citySlug = searchParams.get('city')
    const id = searchParams.get('id')

    // Get single driver by ID (for dashboard)
    if (id && !slug) {
      const driver = await db.taxiDriver.findUnique({
        where: { id },
        include: {
          city: true,
          canton: true,
          driverRoutes: true,
          schedules: true,
          vehicles: true,
          driverServiceZones: true,  // Incluir zonas con modo
        },
      })

      if (!driver) {
        return NextResponse.json(
          { success: false, error: 'Conductor no encontrado' },
          { status: 404 }
        )
      }

      // Schedules: usar los de la tabla, o workingHours, o generar defaults
      let schedulesData = driver.schedules && driver.schedules.length > 0 
        ? driver.schedules 
        : (driver.workingHours ? JSON.parse(driver.workingHours as string) : null);
      
      // Flag para indicar si hay horarios guardados de verdad (no defaults)
      const hasRealSchedules = !!(driver.schedules && driver.schedules.length > 0) || 
                               !!(driver.workingHours);
      
      // Si aún no hay schedules, generar defaults
      if (!schedulesData || schedulesData.length === 0) {
        schedulesData = [
          { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isActive: true },
          { dayOfWeek: 2, startTime: "09:00", endTime: "18:00", isActive: true },
          { dayOfWeek: 3, startTime: "09:00", endTime: "18:00", isActive: true },
          { dayOfWeek: 4, startTime: "09:00", endTime: "18:00", isActive: true },
          { dayOfWeek: 5, startTime: "09:00", endTime: "18:00", isActive: true },
          { dayOfWeek: 6, startTime: "10:00", endTime: "14:00", isActive: false },
          { dayOfWeek: 0, startTime: "10:00", endTime: "14:00", isActive: false },
        ];
      }

      return NextResponse.json({
        success: true,
        data: {
          ...driver,
          services: JSON.parse(driver.services as string),
          routes: JSON.parse(driver.routes as string),
          languages: JSON.parse(driver.languages as string),
          serviceZones: JSON.parse(driver.serviceZones as string),
          workingHours: driver.workingHours ? JSON.parse(driver.workingHours as string) : null,
          schedules: schedulesData,
          hasRealSchedules, // Nuevo flag para indicar si hay horarios guardados
          vehicleTypes: driver.vehicleTypes ? JSON.parse(driver.vehicleTypes as string) : [driver.vehicleType],
          vehicles: driver.vehicles || [],
          // Zonas con modo (pickup/service)
          driverServiceZones: driver.driverServiceZones?.map(z => ({
            ...z,
            exclusions: JSON.parse(z.exclusions as string || '[]')
          })) || [],
        },
      })
    }

    // Get single driver by slug
    if (slug) {
      const where: Record<string, unknown> = { 
        slug, 
        isActive: true 
      }

      if (cantonSlug) {
        where.canton = { slug: cantonSlug }
      }
      if (citySlug) {
        where.city = { slug: citySlug }
      }

      const driver = await db.taxiDriver.findFirst({
        where,
        include: {
          city: true,
          canton: true,
          driverRoutes: true,
          schedules: true,
          vehicles: true,
        },
      })

      if (!driver) {
        return NextResponse.json(
          { success: false, error: 'Conductor no encontrado' },
          { status: 404 }
        )
      }

      // Incrementar vistas
      await db.taxiDriver.update({
        where: { id: driver.id },
        data: { views: { increment: 1 } },
      })

      // Schedules: usar los de la tabla, o workingHours, o generar defaults
      let schedulesData = driver.schedules && driver.schedules.length > 0 
        ? driver.schedules 
        : (driver.workingHours ? JSON.parse(driver.workingHours as string) : null);
      
      // Si aún no hay schedules, generar defaults
      if (!schedulesData || schedulesData.length === 0) {
        schedulesData = [
          { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isActive: true },
          { dayOfWeek: 2, startTime: "09:00", endTime: "18:00", isActive: true },
          { dayOfWeek: 3, startTime: "09:00", endTime: "18:00", isActive: true },
          { dayOfWeek: 4, startTime: "09:00", endTime: "18:00", isActive: true },
          { dayOfWeek: 5, startTime: "09:00", endTime: "18:00", isActive: true },
          { dayOfWeek: 6, startTime: "10:00", endTime: "14:00", isActive: false },
          { dayOfWeek: 0, startTime: "10:00", endTime: "14:00", isActive: false },
        ];
      }

      return NextResponse.json({
        success: true,
        data: {
          ...driver,
          services: JSON.parse(driver.services as string),
          routes: JSON.parse(driver.routes as string),
          languages: JSON.parse(driver.languages as string),
          serviceZones: JSON.parse(driver.serviceZones as string),
          workingHours: driver.workingHours ? JSON.parse(driver.workingHours as string) : null,
          schedules: schedulesData,
          vehicleTypes: driver.vehicleTypes ? JSON.parse(driver.vehicleTypes as string) : [driver.vehicleType],
          vehicles: driver.vehicles || [],
        },
      })
    }

    // Listar todos con filtros
    const canton = searchParams.get('canton')
    const city = searchParams.get('city')
    const service = searchParams.get('service')
    const vehicleType = searchParams.get('vehicleType')
    const available24h = searchParams.get('available24h')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = { isActive: true }

    if (canton) {
      where.canton = { slug: canton }
    }
    if (city) {
      where.city = { slug: city }
    }
    if (vehicleType) {
      where.vehicleType = vehicleType
    }
    if (available24h === 'true') {
      where.isAvailable24h = true
    }

    let drivers = await db.taxiDriver.findMany({
      where,
      include: { 
        city: true, 
        canton: true,
        driverRoutes: true,
        vehicles: true,
      },
      orderBy: [
        { isTopRated: 'desc' },
        { subscription: 'desc' },
        { views: 'desc' },
      ],
      take: limit,
    })

    // Parsear JSON fields
    const parsedDrivers = drivers.map(d => ({
      ...d,
      services: JSON.parse(d.services as string),
      routes: JSON.parse(d.routes as string),
      languages: JSON.parse(d.languages as string),
      serviceZones: JSON.parse(d.serviceZones as string),
      vehicleTypes: d.vehicleTypes ? JSON.parse(d.vehicleTypes as string) : [d.vehicleType],
      vehicles: d.vehicles || [],
    }))

    // Filtrar por servicio en memoria
    let filteredDrivers = parsedDrivers
    if (service) {
      filteredDrivers = parsedDrivers.filter(d => (d.services as string[]).includes(service))
    }

    return NextResponse.json({
      success: true,
      data: filteredDrivers,
      total: filteredDrivers.length,
    })
  } catch (error) {
    console.error('Error fetching drivers:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener conductores' },
      { status: 500 }
    )
  }
}

// PUT - Update driver (for dashboard)
export async function PUT(request: NextRequest) {
  try {
    let session
    try {
      session = await requireAuth(request)
    } catch {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (id && id !== session.driverId) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado' },
        { status: 403 }
      )
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID del conductor es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el conductor existe
    const existingDriver = await db.taxiDriver.findUnique({
      where: { id },
    })

    if (!existingDriver) {
      return NextResponse.json(
        { success: false, error: 'Conductor no encontrado' },
        { status: 404 }
      )
    }

    // Preparar datos para actualizar
    const dataToUpdate: Record<string, unknown> = {}

    // Campos básicos
    const simpleFields = [
      'name', 'phone', 'whatsapp', 'email', 'address', 
      'experience', 'description', 'vehicleBrand', 'vehicleModel',
      'vehicleYear', 'vehicleColor', 'passengerCapacity', 'imageUrl',
      'basePrice', 'pricePerKm', 'hourlyRate', 'website', 'instagram',
      'facebook', 'isAvailable24h'
    ]

    simpleFields.forEach(field => {
      if (updateData[field] !== undefined) {
        dataToUpdate[field] = updateData[field]
      }
    })

    // Campos JSON
    if (updateData.services) {
      dataToUpdate.services = JSON.stringify(updateData.services)
    }
    if (updateData.languages) {
      dataToUpdate.languages = JSON.stringify(updateData.languages)
    }
    if (updateData.serviceZones) {
      dataToUpdate.serviceZones = JSON.stringify(updateData.serviceZones)
    }
    if (updateData.vehicleType) {
      dataToUpdate.vehicleType = updateData.vehicleType
    }
    if (updateData.vehicleTypes) {
      dataToUpdate.vehicleTypes = JSON.stringify(updateData.vehicleTypes)
      // También actualizar el principal
      if (updateData.vehicleTypes.length > 0) {
        dataToUpdate.vehicleType = updateData.vehicleTypes[0]
      }
    }

    // ⚠️ IMPORTANTE: Procesar horarios ANTES de actualizar el conductor
    // Actualizar horarios si se proporcionan (nuevo formato con mode y slots)
    if (updateData.schedules !== undefined) {
      // Guardar en workingHours como JSON (soporta múltiples slots por día)
      dataToUpdate.workingHours = updateData.schedules ? JSON.stringify(updateData.schedules) : null
    }

    // ⚠️ IMPORTANTE: Procesar zonas ANTES de actualizar el conductor
    // Actualizar zonas de servicio con exclusiones
    if (updateData.serviceZonesWithExclusions && Array.isArray(updateData.serviceZonesWithExclusions)) {
      // También actualizar el campo JSON simple
      const zoneNames = updateData.serviceZonesWithExclusions.map((z: { zoneName: string }) => z.zoneName)
      dataToUpdate.serviceZones = JSON.stringify(zoneNames)
    }

    console.log('📦 [PUT] Datos a actualizar:', Object.keys(dataToUpdate))

    // Actualizar el conductor
    const updatedDriver = await db.taxiDriver.update({
      where: { id },
      data: dataToUpdate,
      include: {
        city: true,
        canton: true,
        driverRoutes: true,
        schedules: true,
        vehicles: true,
        driverServiceZones: true,
      },
    })

    // Actualizar rutas si se proporcionan
    if (updateData.routes && Array.isArray(updateData.routes)) {
      // Eliminar rutas existentes
      await db.driverRoute.deleteMany({
        where: { driverId: id },
      })
      
      // Crear nuevas rutas
      if (updateData.routes.length > 0) {
        await db.driverRoute.createMany({
          data: updateData.routes.map((route: { origin: string; destination: string; price?: number }) => ({
            driverId: id,
            origin: route.origin,
            destination: route.destination,
            price: route.price || null,
          })),
        })
      }
    }

    // Actualizar horarios en la tabla DriverSchedule (para compatibilidad)
    if (updateData.schedules !== undefined) {
      // Eliminar horarios existentes en la tabla
      await db.driverSchedule.deleteMany({
        where: { driverId: id },
      })
      
      // Crear horarios en la tabla solo para compatibilidad
      // (un registro por cada franja de cada día)
      if (updateData.schedules && Array.isArray(updateData.schedules)) {
        const scheduleRecords: Array<{ driverId: string; dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }> = []
        
        for (const schedule of updateData.schedules) {
          // Nuevo formato: { dayOfWeek, mode, slots: [{ startTime, endTime }] }
          if ('slots' in schedule && Array.isArray(schedule.slots)) {
            for (const slot of schedule.slots) {
              scheduleRecords.push({
                driverId: id,
                dayOfWeek: schedule.dayOfWeek,
                startTime: slot.startTime,
                endTime: slot.endTime,
                isActive: schedule.mode !== 'closed',
              })
            }
          }
          // Formato antiguo: { dayOfWeek, startTime, endTime, isActive }
          else if ('startTime' in schedule && 'endTime' in schedule) {
            scheduleRecords.push({
              driverId: id,
              dayOfWeek: schedule.dayOfWeek,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              isActive: schedule.isActive ?? true,
            })
          }
        }
        
        if (scheduleRecords.length > 0) {
          // Crear uno por uno para manejar duplicados (SQLite no soporta skipDuplicates)
          for (const record of scheduleRecords) {
            await db.driverSchedule.create({ data: record }).catch(() => {})
          }
        }
      }
    }

    // Actualizar zonas de servicio en la tabla DriverServiceZone
    if (updateData.serviceZonesWithExclusions && Array.isArray(updateData.serviceZonesWithExclusions)) {
      // Eliminar zonas existentes
      await db.driverServiceZone.deleteMany({
        where: { driverId: id },
      })
      
      // Crear nuevas zonas
      if (updateData.serviceZonesWithExclusions.length > 0) {
        for (const zone of updateData.serviceZonesWithExclusions) {
          await db.driverServiceZone.create({
            data: {
              driverId: id,
              zoneName: zone.zoneName,
              zoneType: zone.zoneType || 'region',
              zoneMode: zone.zoneMode || 'service',
              exclusions: JSON.stringify(zone.exclusions || []),
              isActive: true,
            },
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updatedDriver,
        services: JSON.parse(updatedDriver.services as string),
        languages: JSON.parse(updatedDriver.languages as string),
        serviceZones: JSON.parse(updatedDriver.serviceZones as string),
        routes: JSON.parse(updatedDriver.routes as string),
        vehicleTypes: updatedDriver.vehicleTypes ? JSON.parse(updatedDriver.vehicleTypes as string) : [updatedDriver.vehicleType],
        vehicles: updatedDriver.vehicles || [],
        workingHours: updatedDriver.workingHours ? JSON.parse(updatedDriver.workingHours as string) : null,
        schedules: updatedDriver.schedules || [],
        driverServiceZones: updatedDriver.driverServiceZones?.map(z => ({
          ...z,
          exclusions: JSON.parse(z.exclusions as string || '[]')
        })) || [],
      },
    })
  } catch (error: any) {
    console.error('❌ [PUT] Error updating driver:', error)
    console.error('❌ [PUT] Error message:', error?.message)
    console.error('❌ [PUT] Error stack:', error?.stack)
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Error al actualizar el perfil',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}
