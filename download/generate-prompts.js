const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, NumberFormat, AlignmentType, HeadingLevel,
  WidthType, BorderStyle, ShadingType, PageBreak, LevelFormat, TableOfContents,
} = require("docx");
const fs = require("fs");

// Palette: DM-1 Deep Cyan (Tech)
const P = {
  primary: "162235",
  body: "000000",
  secondary: "5A6080",
  accent: "37DCF2",
  surface: "F0F8FF",
};
const c = (hex) => hex.replace("#", "");

const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

// ========== HELPERS ==========
function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    heading: level,
    spacing: { before: level === HeadingLevel.HEADING_1 ? 360 : 240, after: 120 },
    children: [new TextRun({ text, bold: true, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
  });
}

function body(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, after: 80 },
    children: [new TextRun({ text, size: 22, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, color: c(P.body) })],
  });
}

function bodyBold(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, after: 80 },
    children: [new TextRun({ text, size: 22, bold: true, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, color: c(P.primary) })],
  });
}

function codeBlock(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 276, before: 60, after: 60 },
    indent: { left: 360 },
    shading: { type: ShadingType.CLEAR, fill: "F5F7FA" },
    children: [new TextRun({ text, size: 19, font: { ascii: "Consolas", eastAsia: "Microsoft YaHei" }, color: "2D3748" })],
  });
}

function emptyLine() {
  return new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: " ", size: 2 })] });
}

function divider() {
  return new Paragraph({
    spacing: { before: 300, after: 300 },
    children: [new TextRun({ text: "_______________________________________________", size: 16, color: "E2E8F0" })],
  });
}

function promptBox(title, promptText) {
  const lines = promptText.split("\n");
  const result = [
    new Paragraph({
      spacing: { before: 160, after: 80 },
      children: [
        new TextRun({ text: `PROMPT: ${title}`, size: 22, bold: true, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, color: "2E86C1" }),
      ],
    }),
  ];
  for (const line of lines) {
    result.push(
      new Paragraph({
        spacing: { line: 276, after: 40 },
        children: [
          new TextRun({ text: line, size: 20, font: { ascii: "Consolas", eastAsia: "Microsoft YaHei" }, color: "1C2833" }),
        ],
      })
    );
  }
  return result;
}

function noteBox(text) {
  return new Paragraph({
    spacing: { before: 100, after: 100 },
    children: [
      new TextRun({ text: `NOTA: ${text}`, size: 20, bold: true, italics: true, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, color: "F39C12" }),
    ],
  });
}

// ========== COVER ==========
function buildCover() {
  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      height: { value: 16838, rule: "exact" },
      borders: allNoBorders,
      rows: [
        new TableRow({
          height: { value: 16838, rule: "exact" },
          verticalAlign: "top",
          children: [
            new TableCell({
              width: { size: 100, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill: "0B1C2C" },
              borders: allNoBorders,
              children: [
                new Paragraph({ spacing: { before: 3600 }, children: [new TextRun({ text: " ", size: 2 })] }),
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  indent: { left: 800 },
                  spacing: { after: 120 },
                  children: [
                    new TextRun({ text: "EITAXI", size: 72, bold: true, font: { ascii: "Calibri" }, color: "F59E0B" }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  indent: { left: 800 },
                  spacing: { after: 300 },
                  children: [
                    new TextRun({ text: "Lista de Prompts para Replicar", size: 40, font: { ascii: "Calibri" }, color: "FFFFFF" }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  indent: { left: 800 },
                  spacing: { after: 100 },
                  children: [
                    new TextRun({ text: "Sistema Completo del Cliente", size: 32, font: { ascii: "Calibri" }, color: "B0B8C0" }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  indent: { left: 800 },
                  spacing: { after: 80 },
                  children: [
                    new TextRun({ text: "Autenticacion, Reservas, Chat, Notificaciones Push, Cuenta de Cliente", size: 22, font: { ascii: "Calibri" }, color: "90989F" }),
                  ],
                }),
                new Paragraph({ spacing: { before: 2000 }, children: [new TextRun({ text: " ", size: 2 })] }),
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  indent: { left: 800 },
                  children: [
                    new TextRun({ text: "Documento generado para replicar en otra sesion de IA", size: 20, font: { ascii: "Calibri" }, color: "687078" }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  indent: { left: 800 },
                  children: [
                    new TextRun({ text: "Abril 2026", size: 20, font: { ascii: "Calibri" }, color: "687078" }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ];
}

// ========== CONTENT ==========
const content = [];

// --- INTRO ---
content.push(heading("Instrucciones de Uso"));
content.push(body("Este documento contiene una lista completa de prompts bien definidos y ordenados por modulo. Cada prompt esta disenado para que una IA pueda replicar exactamente la funcionalidad descrita sin errores. Los prompts deben enviarse en orden secuencial, ya que algunos dependen de otros."));
content.push(body("El proyecto Eitaxi es una plataforma de taxis en Suiza construida con Next.js 15 (App Router), Prisma con SQLite, Tailwind CSS, shadcn/ui y TypeScript. La base de datos esta en /home/z/my-project/db/custom.db. El servidor de desarrollo usa Turbopack en el puerto 3000."));
content.push(noteBox("REGLA CRITICA: Nunca borres la logica existente del proyecto. Cada prompt agrega funcionalidad nueva sin alterar lo que ya funciona."));
content.push(divider());

// --- PROMPT 1: SCHEMA ---
content.push(heading("PROMPT 1: Schema de Prisma - Modelos de Cliente"));
content.push(body("Este prompt agrega 6 nuevos modelos al schema de Prisma existente. El schema ya tiene modelos como TaxiDriver, Canton, City, Location, Route, DriverRoute, DriverServiceZone, DriverSchedule, Review, Vehicle. NO borres ninguno de esos modelos existentes."));
content.push(promptBox("Agregar modelos de cliente, reservas, mensajes y notificaciones al schema de Prisma",
`Tengo un proyecto Next.js 15 con Prisma y SQLite. El archivo de schema esta en prisma/schema.prisma.

NECESITO que agregues los siguientes 6 modelos NUEVOS al schema existente (NO borres ningun modelo existente como TaxiDriver, Canton, City, Location, Route, DriverRoute, DriverServiceZone, DriverSchedule, Review, Vehicle):

1. Client:
   - id: String @id @default(cuid())
   - name: String
   - email: String @unique
   - phone: String?
   - password: String
   - createdAt: DateTime @default(now())
   - updatedAt: DateTime @updatedAt
   - Relaciones: bookings Booking[], messages Message[], notifications Notification[], pushSubscriptions ClientPushSubscription[]

2. Booking:
   - id: String @id @default(cuid())
   - reference: String @unique (codigo como "EIT-ABC123")
   - clientId: String
   - driverId: String?
   - passengerName: String?
   - passengerPhone: String?
   - passengerEmail: String?
   - origin: String
   - destination: String
   - originLat: Float?
   - originLng: Float?
   - destLat: Float?
   - destLng: Float?
   - tripDate: DateTime?
   - passengers: Int @default(1)
   - price: Float?
   - notes: String?
   - status: String @default("pending") (valores: pending, confirmed, rejected, cancelled, completed)
   - driverNotes: String?
   - createdAt: DateTime @default(now())
   - updatedAt: DateTime @updatedAt
   - deletedAt: DateTime?
   - Relaciones: client Client, driver TaxiDriver?, messages Message[]

3. Message:
   - id: String @id @default(cuid())
   - bookingId: String
   - senderType: String (valores: "driver" o "passenger")
   - content: String
   - createdAt: DateTime @default(now())
   - Relacion: booking Booking

4. Notification:
   - id: String @id @default(cuid())
   - clientId: String
   - bookingId: String?
   - type: String (valores: booking_confirmed, booking_rejected, booking_cancelled, booking_completed, new_message, booking_created)
   - title: String
   - message: String
   - read: Boolean @default(false)
   - createdAt: DateTime @default(now())
   - Relacion: client Client

5. ClientPushSubscription:
   - id: String @id @default(cuid())
   - clientId: String @unique
   - endpoint: String @unique
   - keysAuth: String
   - keysP256dh: String
   - createdAt: DateTime @default(now())
   - Relacion: client Client

6. PushSubscription (para conductores):
   - id: String @id @default(cuid())
   - driverId: String @unique
   - endpoint: String @unique
   - keysAuth: String
   - keysP256dh: String
   - createdAt: DateTime @default(now())

IMPORTANTE:
- La base de datos es SQLite (provider = "sqlite")
- URL de la base de datos: env("DATABASE_URL")
- Despues de editar el schema, ejecuta: npx prisma generate && npx prisma db push
- ANTES de ejecutar prisma, si existe un archivo .config en la raiz del proyecto, muevelo temporalmente (es un archivo de sistema JuiceFS que interfiere con prisma). Despues de prisma, restablecelo.

NOTA CRITICA: NO borres ningun modelo existente del schema. Solo AGREGA estos 6 modelos nuevos.`
));
content.push(divider());

// --- PROMPT 2: CLIENT AUTH ---
content.push(heading("PROMPT 2: Sistema de Autenticacion de Cliente"));
content.push(body("Este prompt crea la libreria de autenticacion JWT para clientes, separada de la autenticacion de conductores que ya existe en src/lib/auth.ts."));
content.push(promptBox("Crear libreria de autenticacion de clientes con JWT",
`Crea el archivo src/lib/client-auth.ts con la siguiente funcionalidad completa:

Es una libreria de autenticacion JWT para clientes (pasajeros), separada de la de conductores.

Cookie name: "eitaxi_client_token"
Max age: 30 dias (60 * 60 * 24 * 30)
Algoritmo: HS256
Secreto: process.env.JWT_SECRET o process.env.NEXTAUTH_SECRET

Funciones exportadas:

1. createClientSessionToken(client: { id, email, name }): Promise<string>
   - Crea un JWT con payload: { clientId, email, name, role: "client" }
   - Usa la libreria "jose" (SignJWT)

2. verifyClientSessionToken(token: string): Promise<ClientSessionPayload | null>
   - Verifica y decodifica el JWT
   - Retorna { clientId, email, name, role } o null

3. getClientServerSession(): Promise<ClientSessionPayload | null>
   - Obtiene la sesion del cliente desde las cookies del servidor
   - Usa "cookies()" de "next/headers"

4. requireClientAuth(request?: Request): Promise<ClientSessionPayload>
   - Intenta obtener sesion de cookies, si falla intenta del header Authorization Bearer
   - Si no hay sesion, lanza Error("No autenticado")

5. Interface ClientSessionPayload: { clientId: string, email: string, name: string, role: "client", iat?, exp? }

6. clientCookieOptions: objeto con { name, httpOnly: true, secure: production only, sameSite: "strict", maxAge: 30 dias, path: "/" }

7. CLIENT_COOKIE_NAME: exportacion del nombre de la cookie

Dependencias: "jose" (ya instalada en el proyecto para la auth de conductores)`
));
content.push(divider());

// --- PROMPT 3: CLIENT LOGIN API ---
content.push(heading("PROMPT 3: API de Login de Cliente"));
content.push(promptBox("Crear endpoint de login para clientes",
`Crea el archivo src/app/api/auth/client/login/route.ts con un POST handler:

POST /api/auth/client/login
Body: { email: string, password: string }
Respuesta: { success: true, data: { id, name, email, phone, createdAt, updatedAt } } + cookie set

Logica:
1. Validar que email y password esten presentes (400 si no)
2. Buscar cliente en DB con db.client.findUnique({ where: { email: email.toLowerCase() } })
3. Si no existe, retornar 401 con "Email o contrasena incorrectos"
4. Verificar password con bcrypt.compare(password, client.password)
5. Si incorrecta, retornar 401 con "Email o contrasena incorrectos"
6. Crear token con createClientSessionToken({ id: client.id, email, name: client.name })
7. Excluir password del response con destructuring: { password: _, ...clientWithoutPassword }
8. Setear cookie con response.cookies.set(clientCookieOptions.name, sessionToken, clientCookieOptions)
9. Retornar { success: true, data: clientWithoutPassword }

Dependencias: bcryptjs, @/lib/db, @/lib/client-auth`
));
content.push(divider());

// --- PROMPT 4: CLIENT REGISTER API ---
content.push(heading("PROMPT 4: API de Registro de Cliente"));
content.push(promptBox("Crear endpoint de registro para clientes",
`Crea el archivo src/app/api/auth/client/register/route.ts con un POST handler:

POST /api/auth/client/register
Body: { name: string, email: string, phone?: string, password: string }
Respuesta: { success: true, data: cliente sin password } + cookie set

Logica:
1. Validar name, email, password requeridos (400 si falta algo)
2. Validar password.length >= 6 (400 si no)
3. Buscar cliente existente: db.client.findUnique({ where: { email: email.toLowerCase() } })
4. Si existe, retornar 409 "Ya existe una cuenta con este email"
5. Hashear password con bcrypt.hash(password, 12)
6. Crear cliente: db.client.create({ data: { name: name.trim(), email: email.toLowerCase().trim(), phone: phone?.trim() || null, password: hashedPassword } })
7. Crear token de sesion y setear cookie (igual que login)
8. Retornar cliente sin password

Dependencias: bcryptjs, @/lib/db, @/lib/client-auth`
));
content.push(divider());

// --- PROMPT 5: CLIENT LOGOUT API ---
content.push(heading("PROMPT 5: API de Logout de Cliente"));
content.push(promptBox("Crear endpoint de logout para clientes",
`Crea el archivo src/app/api/auth/client/logout/route.ts con un POST handler:

POST /api/auth/client/logout
Respuesta: { success: true, message: "Sesion cerrada" }

Logica:
1. Crear response NextResponse.json({ success: true, message: "Sesion cerrada" })
2. Borrar cookie: response.cookies.set(CLIENT_COOKIE_NAME, "", { httpOnly: true, secure: production, sameSite: "strict", maxAge: 0, path: "/" })
3. Retornar response

Dependencias: @/lib/client-auth`
));
content.push(divider());

// --- PROMPT 6: CLIENT SESSION & WHOAMI ---
content.push(heading("PROMPT 6: APIs de Sesion y Whoami del Cliente"));
content.push(promptBox("Crear endpoints de sesion y whoami para clientes",
`Crea DOS archivos:

1. src/app/api/auth/client/session/route.ts - GET handler:
   - Usa getClientServerSession() para obtener sesion
   - Si no hay sesion: 401 { success: false, authenticated: false }
   - Si hay sesion: 200 { success: true, authenticated: true, data: { clientId, email, name, role } }

2. src/app/api/auth/client/whoami/route.ts - GET handler:
   - Verifica si hay sesion de cliente Y/O sesion de conductor
   - Usa getClientServerSession() y getServerSession() (de @/lib/auth para conductores)
   - Retorna: { success: true, data: { role: "client"|"driver"|"both"|"none", client?: { clientId, name, email }, driver?: { driverId, name, email } } }

Dependencias: @/lib/client-auth, @/lib/auth, @/lib/db`
));
content.push(divider());

// --- PROMPT 7: BOOKINGS API ---
content.push(heading("PROMPT 7: API de Reservas (Bookings) - CRUD Completo"));
content.push(body("Este es el endpoint mas complejo. Maneja creacion, lectura, actualizacion y eliminacion de reservas para clientes y conductores."));
content.push(promptBox("Crear API CRUD completa de reservas",
`Crea el archivo src/app/api/bookings/route.ts con handlers GET, POST, PATCH, DELETE:

FUNCION AUXILIAR - generateReference():
Genera codigo unico como "EIT-" + 6 caracteres aleatorios (A-Z, 0-9).

POST /api/bookings - Crear reserva (cliente o anonimo):
Body: { driverId, origin, destination, originLat?, originLng?, destLat?, destLng?, tripDate, tripTime, passengers, price?, notes?, clientName?, clientEmail?, clientPhone? }
Logica:
1. Validar driverId, origin, destination requeridos
2. Verificar que el conductor existe con db.taxiDriver.findUnique
3. Intentar obtener sesion del cliente con requireClientAuth (en try/catch, si falla es anonimo)
4. Si el cliente esta autenticado y proporciono datos, actualizar su perfil (name, phone)
5. Generar referencia unica con generateReference()
6. Calcular precio estimado si no se proporciona (opcional, basado en distancia)
7. Crear reserva en DB con todos los campos
8. Crear notificacion al conductor sobre nueva reserva
9. Si hay session de cliente, enviar push notification al cliente (booking_created)
10. Retornar { success: true, data: booking con datos del conductor incluidos }

GET /api/bookings - Obtener reservas:
Query params: bookingId?, clientId?, driverId?, status?, page?, limit?
Logica:
1. Si se pasa bookingId, buscar esa reserva especifica con include: { client, driver }
2. Si se pasa clientId, buscar reservas de ese cliente
3. Si se pasa driverId, buscar reservas de ese conductor
4. Si se pasa status, filtrar por estado
5. Soportar paginacion con page/limit (default limit 20)
6. Ordenar por createdAt desc
7. Retornar array de reservas con datos relacionados

PATCH /api/bookings - Actualizar reserva:
Body: { bookingId, status?, driverNotes?, price? }
Logica:
1. Buscar reserva por ID
2. Si cambia status a "confirmed": crear notificacion al cliente (booking_confirmed), enviar push
3. Si cambia status a "rejected": crear notificacion al cliente (booking_rejected), enviar push
4. Si cambia status a "completed": crear notificacion al cliente (booking_completed), enviar push
5. Si cambia status a "cancelled": crear notificacion (booking_cancelled), enviar push
6. Actualizar campos en DB
7. Retornar booking actualizada

DELETE /api/bookings - Eliminar reserva (soft delete):
Body: { bookingId }
Logica:
1. Verificar que la reserva existe
2. Hacer soft delete: actualizar deletedAt = new Date()
3. Retornar { success: true }

IMPORTANTE: Las notificaciones push al cliente usan sendBookingStatusPushToClient() de @/lib/notifications. Las notificaciones push al conductor usan sendNewBookingPushToDriver() de @/lib/push.

Dependencias: @/lib/db, @/lib/auth, @/lib/client-auth, @/lib/notifications, @/lib/push`
));
content.push(divider());

// --- PROMPT 8: CLIENT BOOKINGS ---
content.push(heading("PROMPT 8: API de Reservas del Cliente"));
content.push(promptBox("Crear endpoint para obtener las reservas del cliente autenticado",
`Crea el archivo src/app/api/client/bookings/route.ts con un GET handler:

GET /api/client/bookings
Requiere: Sesion de cliente (cookie eitaxi_client_token)
Respuesta: { success: true, data: Booking[] }

Logica:
1. Obtener sesion con getClientServerSession()
2. Si no hay sesion, retornar 401
3. Buscar reservas: db.booking.findMany({
     where: { clientId: session.clientId },
     include: { driver: { select: { id, name, phone, vehicleType, vehicleBrand, vehicleModel, imageUrl, rating } } },
     orderBy: { createdAt: "desc" },
     take: 50
   })
4. Retornar array de reservas con datos del conductor

Dependencias: @/lib/db, @/lib/client-auth`
));
content.push(divider());

// --- PROMPT 9: CHAT API ---
content.push(heading("PROMPT 9: API de Chat entre Cliente y Conductor"));
content.push(promptBox("Crear API de chat en tiempo real entre cliente y conductor",
`Crea el archivo src/app/api/chat/route.ts con handlers POST y GET:

POST /api/chat - Enviar mensaje:
Body: { bookingId: string, content: string, senderType: "driver"|"passenger" }
Respuesta: { success: true, data: Message }

Logica:
1. Validar bookingId, content, senderType (debe ser "driver" o "passenger")
2. Obtener reserva con db.booking.findUnique({ where: { id: bookingId }, include: { client: true, driver: true } })
3. Si no existe, 404
4. Verificar autorizacion:
   - Si senderType === "driver": verificar con requireAuth() que booking.driverId === session.driverId
   - Si senderType === "passenger": verificar con requireClientAuth() que booking.clientId === session.clientId
5. Crear mensaje: db.message.create({ data: { bookingId, senderType, content: content.trim() } })
6. Actualizar updatedAt de la reserva
7. Si senderType === "driver" y booking.clientId existe:
   - Crear notificacion: createNotification({ clientId, bookingId, type: "new_message", title, message })
   - Enviar push: sendNewMessagePushToClient(clientId, bookingId, driver.name)
8. Retornar mensaje creado

GET /api/chat?bookingId=xxx - Obtener mensajes:
Logica:
1. Validar bookingId presente
2. Obtener reserva (solo clientId y driverId) para verificar acceso
3. Verificar autorizacion (intentar como conductor, luego como cliente)
4. Si no autorizado, 403
5. Obtener mensajes: db.message.findMany({ where: { bookingId }, orderBy: { createdAt: "asc" } })
6. Retornar array de mensajes

Dependencias: @/lib/db, @/lib/auth, @/lib/client-auth, @/lib/notifications`
));
content.push(divider());

// --- PROMPT 10: RECENT CHAT API ---
content.push(heading("PROMPT 10: API de Mensajes Recientes para Conductor"));
content.push(promptBox("Crear endpoint para mensajes recientes del pasajero (vista conductor)",
`Crea el archivo src/app/api/chat/recent/route.ts con un GET handler:

GET /api/chat/recent
Requiere: Sesion de conductor (requireAuth)
Respuesta: { success: true, data: RecentMessage[] }

Logica:
1. Obtener sesion del conductor con requireAuth()
2. Buscar reservas activas del conductor: db.booking.findMany({
     where: { driverId, deletedAt: null, status: { in: ["pending", "confirmed"] } },
     select: { id, reference, passengerName, passengerPhone, origin, destination, status }
   })
3. Si no hay reservas, retornar array vacio
4. Obtener mensajes del pasajero de las ultimas 24h: db.message.findMany({
     where: { bookingId: { in: bookingIds }, senderType: "passenger", createdAt: { gte: new Date(Date.now() - 24*60*60*1000) } },
     orderBy: { createdAt: "desc" },
     take: 50,
     select: { id, bookingId, content, createdAt }
   })
5. Combinar con info de la reserva
6. Retornar array con { id, bookingId, bookingReference, passengerName, origin, destination, content, createdAt }

Dependencias: @/lib/db, @/lib/auth`
));
content.push(divider());

// --- PROMPT 11: NOTIFICATIONS API ---
content.push(heading("PROMPT 11: API de Notificaciones del Cliente"));
content.push(promptBox("Crear API de notificaciones del cliente con marcado de lectura",
`Crea el archivo src/app/api/client/notifications/route.ts con handlers GET y PATCH:

GET /api/client/notifications
Requiere: Sesion de cliente
Respuesta: { success: true, data: { notifications: Notification[], unreadCount: number, pendingBookings: number, totalBookings: number } }

Logica:
1. Obtener sesion con getClientServerSession()
2. Obtener notificaciones de las ultimas 72h: db.notification.findMany({
     where: { clientId, createdAt: { gte: new Date(Date.now() - 72*60*60*1000) } },
     orderBy: { createdAt: "desc" },
     take: 30
   })
3. Contar no leidas: notifications.filter(n => !n.read).length
4. Contar reservas pendientes y totales del cliente
5. Retornar objeto con todo

PATCH /api/client/notifications
Requiere: Sesion de cliente
Body: { markAllRead?: boolean, notificationId?: string, bookingId?: string }

Logica:
1. Si markAllRead: db.notification.updateMany({ where: { clientId, read: false }, data: { read: true } })
2. Si bookingId: marcar todas las notificaciones de esa reserva como leidas
3. Si notificationId: marcar esa notificacion como leida
4. Retornar { success: true, message: "..." }

Dependencias: @/lib/db, @/lib/client-auth`
));
content.push(divider());

// --- PROMPT 12: PUSH NOTIFICATION LIBRARY ---
content.push(heading("PROMPT 12: Libreria de Notificaciones Push para Clientes"));
content.push(promptBox("Crear libreria de notificaciones y push para clientes",
`Crea el archivo src/lib/notifications.ts con la siguiente funcionalidad:

Configuracion VAPID:
webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:eitaxi@eitaxi.ch", process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY)

Funciones exportadas:

1. createNotification(params: { clientId, bookingId?, type, title, message }): Promise<void>
   - Crea registro en tabla Notification
   - Verifica que el cliente existe antes de crear

2. sendPushToClient(clientId, payload: { title, body, icon?, url?, tag? }): Promise<number>
   - Obtiene suscripciones push del cliente (tabla ClientPushSubscription)
   - Envia push a cada suscripcion usando web-push
   - Si suscripcion expiro (404/410), la elimina de DB
   - Retorna cantidad de push enviados exitosamente

3. sendBookingStatusPushToClient(clientId, bookingId, status, driverName): Promise<void>
   - Mensajes por status:
     confirmed: "Reserva confirmada" + "{driverName} ha confirmado tu reserva..."
     rejected: "Reserva rechazada" + "{driverName} ha rechazado tu reserva..."
     cancelled: "Reserva cancelada" + "{driverName} ha cancelado tu reserva..."
     completed: "Viaje completado" + "{driverName} ha marcado tu viaje como completado..."

4. sendNewMessagePushToClient(clientId, bookingId, senderName): Promise<void>
   - Title: "Nuevo mensaje", Body: "{senderName} te ha enviado un mensaje."

5. notificationMessages: objeto con mensajes por tipo (booking_confirmed, booking_rejected, etc.)

Dependencias: web-push (ya instalado), @/lib/db`
));
content.push(divider());

// --- PROMPT 13: PUSH LIBRARY (DRIVERS) ---
content.push(heading("PROMPT 13: Libreria de Push para Conductores"));
content.push(promptBox("Crear libreria de notificaciones push para conductores",
`Crea el archivo src/lib/push.ts con la siguiente funcionalidad:

Configuracion VAPID:
webpush.setVapidDetails("mailto:noreply@eitaxi.ch", process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY)

Funciones exportadas:

1. sendPushToDriver(driverId, payload: { title, body, url?, tag?, actions? }): Promise<void>
   - Obtiene suscripcion push del conductor (tabla PushSubscription)
   - Si no hay suscripcion, loguea y retorna
   - Envia push con acciones: "Ver reserva" y "Mas tarde"
   - Si suscripcion expiro (404/410), la elimina

2. sendPushToClient(clientId, payload: { title, body, url?, tag?, actions? }): Promise<void>
   - Similar a sendPushToDriver pero para clientes (tabla ClientPushSubscription)

3. sendNewBookingPushToDriver(params: { driverId, reference, passengerName, origin, destination, tripDate, estimatedPrice? }): Promise<void>
   - Title: "Nueva reserva {reference}"
   - Body: "{passengerName}: {origin} -> {destination} - CHF {price} - {date}"
   - URL: /dashboard/{driverId}?tab=reservas

4. sendBookingStatusPushToClient(clientId, params: { bookingReference, bookingId, status, driverName }): Promise<void>
   - Mensajes por status con emojis: confirmada, cancelada, completada

5. sendNewMessagePushToClient(clientId, params: { bookingId, driverName, messageContent }): Promise<void>
   - Title: "{driverName} te escribio"
   - Preview del mensaje (max 60 chars + "...")

Dependencias: web-push, @/lib/db`
));
content.push(divider());

// --- PROMPT 14: CLIENT PUSH SUBSCRIBE ---
content.push(heading("PROMPT 14: APIs de Suscripcion Push del Cliente"));
content.push(promptBox("Crear endpoints de suscripcion push para clientes",
`Crea el archivo src/app/api/client/push-subscribe/route.ts con handlers POST y DELETE:

POST /api/client/push-subscribe
Requiere: Cookie eitaxi_client_token
Body: { endpoint: string, keys: { auth: string, p256dh: string } }
Respuesta: { success: true, message: "Suscripcion registrada" }

Logica:
1. Verificar token de cliente desde cookie con verifyClientSessionToken()
2. Validar que endpoint, keys.auth, keys.p256dh estan presentes
3. Upsert en DB: db.clientPushSubscription.upsert({
     where: { endpoint },
     create: { clientId, endpoint, keysAuth: keys.auth, keysP256dh: keys.p256dh },
     update: { clientId, keysAuth: keys.auth, keysP256dh: keys.p256dh }
   })

DELETE /api/client/push-subscribe
Body: { endpoint?: string }
Logica: Eliminar suscripciones del cliente. Si se pasa endpoint, eliminar solo esa.

Dependencias: @/lib/db, @/lib/client-auth`
));
content.push(divider());

// --- PROMPT 15: DRIVER PUSH SUBSCRIBE ---
content.push(heading("PROMPT 15: API de Suscripcion Push del Conductor"));
content.push(promptBox("Crear endpoint de suscripcion push para conductores",
`Crea el archivo src/app/api/push/subscribe/route.ts con handlers POST y DELETE:

POST /api/push/subscribe
Requiere: Header Authorization Bearer <token_conductor>
Body: { endpoint: string, keys: { auth: string, p256dh: string } }
Respuesta: { success: true, message: "Suscripcion push registrada correctamente" }

Logica:
1. Verificar sesion del conductor leyendo JWT del header Authorization Bearer
2. Decodificar JWT con jwtVerify de "jose" usando el secreto
3. Validar campos requeridos
4. Upsert en DB: db.pushSubscription.upsert({
     where: { driverId },
     create: { driverId, endpoint, keysAuth: keys.auth, keysP256dh: keys.p256dh },
     update: { endpoint, keysAuth: keys.auth, keysP256dh: keys.p256dh }
   })

DELETE /api/push/subscribe
Logica: Eliminar suscripciones del conductor.

Dependencias: @/lib/db, jose, fs (para leer JWT secret de archivo)`
));
content.push(divider());

// --- PROMPT 16: BOOKING MODAL ---
content.push(heading("PROMPT 16: Componente BookingModal"));
content.push(body("Este componente es un modal que se abre cuando el cliente quiere hacer una reserva desde la pagina de un conductor."));
content.push(promptBox("Crear componente BookingModal para formulario de reserva",
`Crea el archivo src/components/BookingModal.tsx - Componente "use client"

Props:
- open: boolean
- onClose: () => void
- driver: { id, name, phone, whatsapp?, vehicleType?, vehicleBrand?, vehicleModel?, rating?, imageUrl? }
- origin: string
- destination: string
- tripInfo?: { distance, duration, from, to }

Estados del formulario (step): "form" | "loading" | "success" | "error"

Campos del formulario:
- passengerName (requerido, min 2 chars)
- passengerPhone (requerido, min 7 digitos despues de limpiar)
- passengerEmail (opcional, validar formato)
- tripDate (requerido, min = hoy, max = 3 meses)
- tripTime (requerido, minTime = hora actual si es hoy)
- passengers (number, default 1)
- notes (opcional)

Al enviar (handleSubmit):
1. Validar todos los campos
2. Cambiar step a "loading"
3. POST a /api/bookings con: { driverId: driver.id, origin, destination, passengerName, passengerPhone, passengerEmail, tripDate: tripDateTime, passengers, notes, price: tripInfo ? estimado : null, originLat/destLat de tripInfo }
4. Si exito: step = "success", mostrar referencia de reserva
5. Si error: step = "error", mostrar mensaje de error

Estilos: Fondo oscuro (zinc-900), inputs con borde zinc-700, botones amarillos (yellow-400/bg-yellow-500), usa shadcn/ui Button e Input.

Boton "X" para cerrar en la esquina superior derecha. Cuando step = "success", mostrar CheckCircle verde con la referencia. Cuando step = "loading", mostrar Loader2 girando.

Funcion resetAndClose() que resetea todo el formulario y llama onClose().`
));
content.push(divider());

// --- PROMPT 17: CUENTA PAGE ---
content.push(heading("PROMPT 17: Pagina de Cuenta del Cliente (MAS GRANDE)"));
content.push(body("Este es el archivo mas grande del sistema (926 lineas). Es la pagina principal del cliente donde puede registrarse, iniciar sesion, ver reservas, chatear con conductores y ver notificaciones."));
content.push(promptBox("Crear pagina completa de cuenta del cliente con login, registro, reservas, chat y notificaciones",
`Crea el archivo src/app/cuenta/page.tsx - Componente "use client" (~900 lineas)

Esta es la pagina principal del cliente de Eitaxi. Contiene TODO el sistema del cliente en una sola pagina.

TIPOS (interfaces TypeScript):
- ClientData: { id, name, email, phone? }
- BookingData: { id, reference, origin, destination, tripDate?, tripTime?, passengers, price?, notes?, status, driverNotes?, createdAt, driver: { id, name, phone?, imageUrl? } }
- NotificationData: { id, bookingId?, type, title, message, read, createdAt }
- MessageData: { id, bookingId, senderType, content, createdAt }

ESTADOS PRINCIPALES:
- view: "login" | "register" | "dashboard" (que seccion mostrar)
- client: ClientData | null (datos del cliente logueado)
- bookings: BookingData[] (lista de reservas)
- notifications: NotificationData[] (lista de notificaciones)
- selectedBooking: BookingData | null (reserva seleccionada para chat)
- messages: MessageData[] (mensajes del chat)
- isLoading: boolean

CONSTANTES DE MAPEO:
- notifIcons: mapa de tipo de notificacion a icono Lucide (CheckCircle, XCircle, MessageCircle, CalendarPlus)
- notifColors: mapa de tipo a color de texto (text-green-400, text-red-400, etc.)
- statusLabels: { pending: "Pendiente", confirmed: "Confirmada", rejected: "Rechazada", cancelled: "Cancelada", completed: "Completada" }
- statusColors: mapa de status a clases CSS de badge

SECCION 1 - LOGIN:
- Email input + Password input + Boton "Iniciar Sesion"
- Link a "Crear cuenta" (cambia view a "register")
- Al enviar: POST /api/auth/client/login, si exito guardar client y cambiar a "dashboard"
- Mostrar errores en rojo

SECCION 2 - REGISTRO:
- Nombre + Email + Telefono + Password + Confirmar Password
- Boton "Crear Cuenta"
- Link a "Ya tengo cuenta" (cambia view a "login")
- Validaciones: campos requeridos, password >= 6 chars, passwords coinciden
- Al enviar: POST /api/auth/client/register

SECCION 3 - DASHBOARD (layout con tabs):
Header con: nombre del cliente + icono campana de notificaciones (con badge de no leidas)

TAB 1 - MIS RESERVAS:
- Lista de reservas del cliente (obtenidas de /api/client/bookings)
- Cada reserva muestra: referencia, origen -> destino, fecha, estado (badge de color), precio
- Boton "Ver Detalles" en cada reserva que abre panel de chat
- Si no hay reservas, mostrar mensaje "No tienes reservas todavia"
- Indicador de carga mientras se obtienen datos

TAB 2 - CHAT (se abre al seleccionar una reserva):
- Header con datos de la reserva y nombre del conductor
- Lista de mensajes con burbujas (derecha para pasajero, izquierda para conductor)
- Cada mensaje muestra: contenido + hora + avatar
- Input de texto + boton de enviar en la parte inferior
- Al enviar: POST /api/chat con { bookingId, content, senderType: "passenger" }
- Auto-scroll al ultimo mensaje
- Sonido de notificacion cuando llega un mensaje nuevo (usar Web Audio API con dos tonos agudos estilo WhatsApp)
- Polling cada 5 segundos para obtener nuevos mensajes (GET /api/chat?bookingId=xxx)

TAB 3 - NOTIFICACIONES:
- Lista de notificaciones (GET /api/client/notifications)
- Cada notificacion: icono + titulo + mensaje + tiempo (usar timeAgo)
- No leidas tienen fondo ligeramente diferente
- Al hacer click en una notificacion: marcar como leida (PATCH), navegar a la reserva relacionada
- Boton "Marcar todas como leidas"
- Mostrar conteo de no leidas en el tab

BOTON LOGOUT:
- En el header del dashboard
- POST /api/auth/client/logout
- Limpiar estado y volver a "login"

FUNCION AUXILIAR - timeAgo(dateStr):
Convierte fecha a texto relativo: "hace X minutos", "hace X horas", "hace X dias"

ESTILOS GENERALES:
- Fondo oscuro (zinc-950/zinc-900)
- Texto blanco con acentos amarillos (yellow-400)
- Usar Lucide icons: Bell, BellRing, LogOut, Users, Briefcase, CheckCircle, XCircle, MessageCircle, CalendarPlus, Clock, MapPin, ChevronRight, Send, X, Loader2, Phone, Star, Car
- shadcn/ui: Button, Input
- Framer Motion: AnimatePresence para transiciones suaves entre secciones
- Responsive: funciona en movil y desktop

IMPORTANTE: Esta es la pagina MAS IMPORTANTE de todo el sistema de cliente. Debe funcionar perfectamente.`
));
content.push(divider());

// --- PROMPT 18: REGISTRO PAGE ---
content.push(heading("PROMPT 18: Pagina de Registro (Landing)"));
content.push(promptBox("Crear pagina de registro con opciones para cliente y conductor",
`Crea el archivo src/app/registro/page.tsx - Componente "use client"

Es una pagina de registro tipo landing con dos tarjetas: Cliente y Conductor.

Layout:
- Header: logo "eitaxi" en amarillo + "/ Registro" + link a Inicio
- Hero: titulo "Crear una cuenta en eitaxi" + descripcion
- Dos tarjetas en grid (1 col en movil, 2 en desktop)

TARJETA CLIENTE:
- Icono Users grande en fondo amarillo semitransparente
- Titulo "Cliente"
- Descripcion: "Busca taxis, reserva viajes, recibe notificaciones en tiempo real y chatea con tu conductor."
- Lista de features con CheckCircle: reservas en 1 click, chat en tiempo real, notificaciones push, historial de viajes
- Link a /cuenta (la pagina de cuenta del cliente)

TARJETA CONDUCTOR:
- Icono Car grande en fondo azul semitransparente
- Titulo "Conductor"
- Descripcion similar sobre gestion de reservas y perfiles
- Lista de features con CheckCircle
- Link al formulario de registro de conductor

Estilos: fondo zinc-950, tarjetas zinc-900 con borde zinc-800, hover con borde yellow-400/50 o blue-400/50. Transiciones suaves.

Dependencias: Lucide (Users, Car, ArrowRight, Shield, CheckCircle, Star, MapPin), shadcn/ui (Card, CardContent)`
));
content.push(divider());

// --- PROMPT 19: COOKIE BANNER ---
content.push(heading("PROMPT 19: Componente CookieBanner"));
content.push(promptBox("Crear banner de cookies GDPR-compatible",
`Crea el archivo src/components/CookieBanner.tsx - Componente "use client"

Banner de consentimiento de cookies que aparece en la parte inferior de la pagina.

Logica:
1. Al montar, verificar localStorage.getItem("eitaxi_cookie_consent")
2. Si no hay consentimiento, mostrar el banner
3. Tres botones: "Aceptar todas", "Solo esenciales", "Rechazar"
4. Al hacer click, guardar en localStorage con JSON: { accepted, date, version: "1.0", analytics, marketing }
5. "Aceptar todas": analytics=true, marketing=true
6. "Solo esenciales": analytics=false, marketing=false, accepted=true
7. "Rechazar": accepted=false

Estilos: fondo zinc-900 con borde superior amarillo, posicion fixed abajo, z-50, padding generoso, texto zinc-300, botones con variantes outline/ghost.

Dependencias: Lucide (Cookie, X), React useState/useEffect`
));
content.push(divider());

// --- PROMPT 20: CHAT NOTIFICATION TOAST ---
content.push(heading("PROMPT 20: Componente ChatNotificationToast"));
content.push(promptBox("Crear componente toast de notificacion de chat",
`Crea el archivo src/components/ChatNotificationToast.tsx - Componente "use client"

Toast de notificacion que aparece cuando llega un mensaje nuevo de un pasajero (para la vista del conductor).

Props:
- notification: { id, bookingId, bookingReference, passengerName, content, createdAt } | null
- onClose: () => void
- onClick: (bookingId: string) => void

Logica:
1. Si notification es null, no renderizar nada
2. Mostrar toast con animacion Framer Motion (entrar desde la derecha)
3. Auto-cerrar despues de 8 segundos
4. Al hacer click: llamar onClick(bookingId) y cerrar
5. Boton X para cerrar manualmente
6. Reproducir sonido de notificacion al aparecer (sonido estilo WhatsApp con Web Audio API: dos tonos agudos, 1800Hz->2200Hz y 2200Hz->2600Hz)

Sonido de notificacion (funcion playNotificationSound):
- Usar AudioContext
- Primer tono: 1800Hz ramp to 2200Hz, gain 0.25, duracion 0.3s
- Segundo tono: 2200Hz ramp to 2600Hz, delay 0.12s, gain 0.2, duracion 0.5s

Estilos: fondo zinc-800 con borde izq amarillo, sombra, posicion fixed bottom-right, z-50.

Dependencias: framer-motion (motion, AnimatePresence), Lucide (MessageCircle, X)`
));
content.push(divider());

// --- PROMPT 21: AUTH CHECK API ---
content.push(heading("PROMPT 21: API de Verificacion de Auth Global"));
content.push(promptBox("Crear endpoint que verifica que tipo de usuario esta autenticado",
`Crea el archivo src/app/api/auth/check/route.ts con un GET handler:

GET /api/auth/check
Respuesta: { success: true, userType: "driver"|"client"|"none", data: {...} }

Logica:
1. Primero intentar obtener sesion de conductor con getServerSession() (de @/lib/auth)
2. Si hay sesion de conductor, buscar datos del conductor en DB y retornar:
   { userType: "driver", data: { driverId, name, email, slug, dashboardUrl: "/{canton.slug}/{city.slug}/{driver.slug}/dashboard" } }
3. Si no es conductor, intentar obtener sesion de cliente con getClientServerSession()
4. Si hay sesion de cliente, retornar:
   { userType: "client", data: { clientId, name, email } }
5. Si no hay ninguna sesion: { userType: "none", data: null }

Dependencias: @/lib/auth, @/lib/client-auth, @/lib/db`
));
content.push(divider());

// --- PROMPT 22: WHOAMI API ---
content.push(heading("PROMPT 22: API Whoami Global"));
content.push(promptBox("Crear endpoint whoami que retorna toda la informacion del usuario autenticado",
`Crea el archivo src/app/api/auth/whoami/route.ts con un GET handler:

GET /api/auth/whoami
Respuesta: { success: true, authenticated, role, roles, driver?, client? }

Logica:
1. Obtener ambas sesiones en paralelo: getServerSession() y getClientServerSession()
2. Si hay sesion de conductor:
   - Buscar datos completos del conductor en DB (con ciudad y contadores)
   - Agregar pendingBookings y totalBookings como conteo
3. Si hay sesion de cliente:
   - Buscar datos del cliente con totalBookings
4. Determinar roles: ["driver"], ["client"], o ["driver", "client"]
5. role = roles.length === 1 ? roles[0] : "both"
6. Si no hay sesion: authenticated: false, role: null, roles: []

Dependencias: @/lib/auth, @/lib/client-auth, @/lib/db`
));
content.push(divider());

// --- PROMPT 23: ADMIN USERS API ---
content.push(heading("PROMPT 23: API de Admin - Lista de Usuarios"));
content.push(promptBox("Crear endpoint de administracion para ver todos los usuarios",
`Crea el archivo src/app/api/admin/users/route.ts con un GET handler:

GET /api/admin/users
Respuesta: { success: true, data: { clients, drivers, totalClients, totalDrivers } }

Logica:
1. Obtener todos los clientes (sin password): db.client.findMany({
     select: { id, name, email, phone, createdAt, updatedAt },
     orderBy: { createdAt: "desc" }
   })
2. Obtener todos los conductores: db.taxiDriver.findMany({
     select: { id, name, email, phone, whatsapp, city: { select: { name, slug } }, canton: { select: { name, code, slug } }, vehicleType, subscription, isVerified, isActive, rating, experience, createdAt, updatedAt },
     orderBy: { createdAt: "desc" }
   })
3. Retornar conteos y arrays

Dependencias: @/lib/db`
));
content.push(divider());

// --- PROMPT 24: UPLOAD API ---
content.push(heading("PROMPT 24: API de Subida de Imagenes"));
content.push(promptBox("Crear endpoint de subida de imagenes con validacion",
`Crea el archivo src/app/api/upload/route.ts con un POST handler:

POST /api/upload
Body: FormData con campo "file" (File)
Respuesta: { success: true, data: { url: string, filename: string } }

Logica:
1. Obtener archivo de formData
2. Validar tipo: solo image/jpeg, image/png, image/webp, image/gif
3. Validar tamano: maximo 5MB
4. Generar nombre unico: crypto.randomBytes(16).toString("hex") + extension
5. Guardar en /home/z/my-project/upload/ (crear directorio si no existe)
6. Retornar URL relativa: /upload/{filename}

Dependencias: fs/promises, path, crypto`
));
content.push(divider());

// --- PROMPT 25: EMAIL LIBRARY ---
content.push(heading("PROMPT 25: Libreria de Envio de Emails"));
content.push(promptBox("Crear libreria de envio de emails con Resend y templates HTML",
`Crea el archivo src/lib/email.ts (~800 lineas) con la siguiente funcionalidad:

Configuracion:
- FROM_EMAIL: process.env.EMAIL_FROM || "eitaxi <noreply@eitaxi.ch>"
- BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "https://eitaxi.ch"
- Lazy init de Resend client (solo si hay RESEND_API_KEY)

Funciones principales:

1. sendEmail({ to, subject, html }): Promise<{ success, messageId?, error? }>
   - Si no hay API key: loguear en dev mode y retornar success
   - Si hay API key: enviar via Resend

2. sendPasswordResetEmail(to, token):
   - Generar URL de reset: BASE_URL + "/restablecer-password/" + token
   - Template HTML con diseno oscuro (zinc-900/zinc-800), logo eitaxi amarillo
   - Boton "Restablecer contrasena" con link

3. sendBookingConfirmationEmail(params: { to, clientName, reference, origin, destination, date, driverName, driverPhone? }):
   - Template con detalles de la reserva confirmada
   - Incluir datos del conductor

4. sendBookingStatusEmail(params: { to, clientName, reference, status, driverName, reason? }):
   - Templates para cada status: confirmada, rechazada, cancelada

5. sendDailyReportEmail(params: { to, driverName, date, stats: { total, confirmed, pending, cancelled, completed, revenue } }):
   - Reporte diario con tabla de estadisticas
   - Color coded por estado

6. sendAdminDailyReportEmail(params: { to, date, totalBookings, totalRevenue, newClients, topDrivers }):
   - Reporte global para administrador

Cada template HTML debe:
- Usar tabla centrada max-width 480px
- Fondo oscuro (zinc-900/zinc-800)
- Logo eitaxi con color amarillo
- Botones con background amber/yellow y texto negro
- Mobile responsive (max-width 100%)
- Texto en espanol

Dependencias: resend (ya instalado)`
));
content.push(divider());

// --- PROMPT 26: FAST FETCH UTILITY ---
content.push(heading("PROMPT 26: Utilidad fastFetch"));
content.push(promptBox("Crear utilidad fastFetch como alternativa a fetch nativo",
`Crea el archivo src/lib/fastFetch.ts:

fastFetch(url: string, options?: RequestInit): Promise<Response>

Es un wrapper de http/https nativo de Node.js que evita problemas de latencia de undici/fetch en algunos entornos Node.js.

Logica:
1. Crear URL object
2. Determinar si es https o http
3. Crear request con opciones: hostname, port, path, method, headers (Accept: application/json + custom headers), timeout: 8000ms
4. Manejar response: acumular chunks en Buffer, convertir a string
5. Retornar un objeto Response nativo con body y headers
6. Manejar timeout: destruir request y rechazar
7. Manejar AbortSignal si se pasa en options
8. Exportar como default o named export

Dependencias: https, http (modulos nativos de Node.js)`
));
content.push(divider());

// --- PROMPT 27: LAYOUT FIX ---
content.push(heading("PROMPT 27: Fix del layout.tsx para Next.js 16"));
content.push(promptBox("Actualizar layout.tsx para compatibilidad con Next.js 16",
`En el archivo src/app/layout.tsx, hacer el siguiente cambio para compatibilidad con Next.js 16:

ANTES (puede causar warning):
export const metadata = {
  title: "Eitaxi",
  description: "...",
  themeColor: "#F59E0B",
};

DESPUES (compatible con Next.js 16):
export const viewport = {
  themeColor: "#F59E0B",
};

export const metadata = {
  title: "Eitaxi",
  description: "...",
};

El cambio es mover themeColor de la exportacion metadata a una nueva exportacion viewport. Esto es porque Next.js 16 requiere que themeColor vaya en viewport, no en metadata. NO cambies nada mas del layout.`
));
content.push(divider());

// --- PROMPT 28: ENV VARIABLES ---
content.push(heading("PROMPT 28: Variables de Entorno Necesarias"));
content.push(promptBox("Configurar todas las variables de entorno necesarias",
`Las siguientes variables de entorno deben estar configuradas en el archivo .env del proyecto (en la raiz, NO en .env.local):

# Base de datos
DATABASE_URL="file:./db/custom.db"

# Autenticacion JWT
JWT_SECRET="<generar-un-secreto-aleatorio-de-32-caracteres>"
NEXTAUTH_SECRET="<mismo-que-JWT_SECRET-o-otro-secreto>"

# Push Notifications (Web Push / VAPID)
VAPID_PUBLIC_KEY="<clave-publica-vapid>"
VAPID_PRIVATE_KEY="<clave-privada-vapid>"
VAPID_SUBJECT="mailto:eitaxi@eitaxi.ch"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="<misma-clave-publica-vapid>"

# Email (Resend)
RESEND_API_KEY="<api-key-de-resend>"
EMAIL_FROM="eitaxi <noreply@eitaxi.ch>"

# Reportes
REPORT_SECRET="eitaxi-report-2024"
CRON_SECRET="<secreto-para-cron-jobs>"

# Base URL
NEXT_PUBLIC_BASE_URL="https://eitaxi.ch"

Para generar claves VAPID, ejecutar:
npx web-push generate-vapid-keys

Para generar JWT_SECRET, ejecutar:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
));
content.push(divider());

// --- PROMPT 29: SERVICE WORKER ---
content.push(heading("PROMPT 29: Service Worker para PWA"));
content.push(body("El proyecto ya tiene un service worker basico. Este prompt lo mejora para soportar notificaciones push."));
content.push(promptBox("Actualizar service worker para soportar notificaciones push",
`Actualiza el archivo public/sw.js para que soporte notificaciones push ademas del cacheo basico:

Funcionalidades:
1. Evento "install": cachear assets esenciales (/, /cuenta, /registro, manifest.json, iconos)
2. Evento "activate": limpiar caches viejas
3. Evento "fetch": estrategia cache-first para assets estaticos, network-first para API calls
4. Evento "push": mostrar notificacion con los datos recibidos:
   - title, body, icon, url, tag, actions del payload
   - Icono por defecto: /icon-192x192.png
   - Al hacer click en la notificacion, abrir la URL
5. Evento "notificationclick": manejar clicks en las actions (Ver reserva, Mas tarde) y en el body de la notificacion

Ejemplo de push event handler:
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || "eitaxi", {
      body: data.body || "",
      icon: data.icon || "/icon-192x192.png",
      badge: "/icon-72x72.png",
      tag: data.tag || "eitaxi",
      data: { url: data.url || "/" },
      actions: data.actions || [],
    })
  );
});

Ejemplo de notificationclick:
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});`
));
content.push(divider());

// --- RESUMEN FINAL ---
content.push(heading("Resumen y Orden de Ejecucion"));
content.push(body("Los prompts deben ejecutarse en el siguiente orden para asegurar que todas las dependencias esten disponibles antes de cada paso:"));

const orderItems = [
  ["1", "Variables de entorno", "PROMPT 28", "Configurar .env primero"],
  ["2", "Schema Prisma", "PROMPT 1", "Base de datos antes que APIs"],
  ["3", "Libreria client-auth", "PROMPT 2", "Auth antes que APIs que la usan"],
  ["4", "Libreria notifications", "PROMPT 12", "Push antes que APIs que la usan"],
  ["5", "Libreria push", "PROMPT 13", "Push de conductores"],
  ["6", "Libreria email", "PROMPT 25", "Email antes que APIs"],
  ["7", "fastFetch utility", "PROMPT 26", "Utilidad general"],
  ["8", "Layout fix", "PROMPT 27", "Compatibilidad Next.js 16"],
  ["9", "APIs auth cliente", "PROMPT 3-6", "Login, registro, logout, session"],
  ["10", "API bookings", "PROMPT 7", "CRUD completo de reservas"],
  ["11", "API client bookings", "PROMPT 8", "Reservas del cliente"],
  ["12", "API chat", "PROMPT 9-10", "Chat y mensajes recientes"],
  ["13", "API notificaciones", "PROMPT 11", "Notificaciones del cliente"],
  ["14", "APIs push subscribe", "PROMPT 14-15", "Suscripcion push"],
  ["15", "API auth check/whoami", "PROMPT 21-22", "Verificacion global"],
  ["16", "API admin/upload", "PROMPT 23-24", "Admin y upload"],
  ["17", "BookingModal", "PROMPT 16", "Componente de reserva"],
  ["18", "CookieBanner", "PROMPT 19", "Banner GDPR"],
  ["19", "ChatNotificationToast", "PROMPT 20", "Toast de chat"],
  ["20", "Pagina registro", "PROMPT 18", "Landing de registro"],
  ["21", "Pagina cuenta", "PROMPT 17", "Pagina PRINCIPAL del cliente"],
  ["22", "Service Worker", "PROMPT 29", "PWA y push"],
];

const orderTable = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  borders: {
    top: { style: BorderStyle.SINGLE, size: 2, color: "529286" },
    bottom: { style: BorderStyle.SINGLE, size: 2, color: "529286" },
    left: { style: BorderStyle.NONE },
    right: { style: BorderStyle.NONE },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "D0D0D0" },
    insideVertical: { style: BorderStyle.NONE },
  },
  rows: [
    new TableRow({
      tableHeader: true,
      cantSplit: true,
      children: ["Orden", "Modulo", "Prompt", "Notas"].map(text =>
        new TableCell({
          width: { size: text === "Orden" ? 10 : text === "Prompt" ? 15 : text === "Notas" ? 35 : 40, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, color: "FFFFFF" })] })],
          shading: { type: ShadingType.CLEAR, fill: "529286" },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
        })
      ),
    }),
    ...orderItems.map(([order, module, prompt, notes], idx) =>
      new TableRow({
        cantSplit: true,
        children: [order, module, prompt, notes].map((text, i) =>
          new TableCell({
            width: { size: i === 0 ? 10 : i === 2 ? 15 : i === 3 ? 35 : 40, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: String(text), size: 19, color: c(P.body) })] })],
            shading: idx % 2 === 0 ? { type: ShadingType.CLEAR, fill: "F0F8FF" } : { type: ShadingType.CLEAR, fill: "FFFFFF" },
            margins: { top: 50, bottom: 50, left: 120, right: 120 },
          })
        ),
      })
    ),
  ],
});
content.push(orderTable);
content.push(emptyLine());

content.push(noteBox("REGLA ORO: En cada prompt, dile a la IA que NO borre la logica existente. Solo debe AGREGAR los archivos nuevos descritos. El proyecto ya tiene una pagina principal (page.tsx con 1837 lineas), un dashboard de conductor, sistema de auth de conductor, y muchos mas archivos que NO deben modificarse."));

content.push(emptyLine());
content.push(body("Total de archivos a crear: 31 archivos nuevos."));
content.push(body("Total de lineas de codigo aproximado: 5,062 lineas."));
content.push(body("Los archivos originales estan respaldados en la rama Git: backup-client-system"));

// ========== BUILD DOCUMENT ==========
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, size: 24, color: c(P.body) },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 32, bold: true, color: c(P.primary) },
        paragraph: { spacing: { before: 360, after: 160 } },
      },
      heading2: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 28, bold: true, color: c(P.primary) },
        paragraph: { spacing: { before: 240, after: 120 } },
      },
      heading3: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 24, bold: true, color: c(P.primary) },
        paragraph: { spacing: { before: 200, after: 100 } },
      },
    },
  },
  sections: [
    // Cover
    {
      properties: {
        page: { margin: { top: 0, bottom: 0, left: 0, right: 0 } },
      },
      children: buildCover(),
    },
    // TOC
    {
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 } },
      },
      children: [
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "Tabla de Contenidos", size: 32, bold: true, color: c(P.primary) })],
        }),
        new TableOfContents("Tabla de Contenidos", {
          hyperlink: true,
          headingStyleRange: "1-3",
        }),
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({
          spacing: { before: 200, after: 100 },
          children: [new TextRun({ text: "Consejo: En Word, haz clic derecho sobre la tabla de contenidos y selecciona 'Actualizar campo' para que se muestren los numeros de pagina correctos.", size: 20, italics: true, color: "888888" })],
        }),
      ],
    },
    // Body
    {
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: "Eitaxi - Prompts de Replicacion", size: 18, color: "999999" })],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ children: [PageNumber.CURRENT], size: 18 })],
            }),
          ],
        }),
      },
      children: content,
    },
  ],
});

const AdmZip = require("adm-zip");

Packer.toBuffer(doc).then((buf) => {
  // Fix invalid <0/> tags inside the ZIP
  const zip = new AdmZip(buf);
  const docEntry = zip.getEntry("word/document.xml");
  if (docEntry) {
    let xml = docEntry.getData().toString("utf8");
    xml = xml.replace(/<0\/>/g, "");
    zip.updateFile(docEntry, Buffer.from(xml, "utf8"));
  }
  const fixedBuf = zip.toBuffer();
  fs.writeFileSync("/home/z/my-project/download/Eitaxi-Prompts-Replicacion.docx", fixedBuf);
  console.log("Documento generado exitosamente!");
});
