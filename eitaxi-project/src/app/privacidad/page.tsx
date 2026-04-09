"use client";

import Link from "next/link";
import {
  Shield,
  MapPin,
  Database,
  Clock,
  UserX,
  Eye,
  Lock,
  Bell,
  Mail,
  FileText,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export default function PrivacyPage() {
  const lastUpdated = "31 de marzo de 2026";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-500">
              <span className="text-black font-bold text-sm">ET</span>
            </div>
            <span className="text-lg font-bold">
              <span className="text-yellow-400">ei</span>
              <span className="text-white">taxi</span>
            </span>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full text-yellow-400 text-sm mb-4">
            <Shield className="h-4 w-4" />
            nDSG Conforme
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Política de Privacidad
          </h1>
          <p className="text-muted-foreground">
            Última actualización: {lastUpdated}
          </p>
        </div>

        {/* Intro */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">1. Introducción</h2>
          <p className="text-muted-foreground mb-4">
            eitaxi ("nosotros", "nuestro" o "la plataforma") opera la plataforma digital que conecta 
            a conductores de taxi con usuarios que buscan servicios de transporte en Suiza y Liechtenstein. 
            Esta política describe cómo recopilamos, usamos, almacenamos y protegemos sus datos personales 
            de conformidad con la nueva Ley Federal de Protección de Datos (nDSG) de Suiza, en vigor 
            desde el 1 de septiembre de 2023.
          </p>
          <p className="text-muted-foreground">
            Al utilizar nuestros servicios, usted acepta las prácticas descritas en esta política. 
            Si no está de acuerdo, le recomendamos que no utilice nuestra plataforma.
          </p>
        </div>

        {/* Responsable */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">2. Responsable del Tratamiento</h2>
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="font-medium mb-2">El responsable del tratamiento de sus datos personales es:</p>
            <ul className="text-muted-foreground space-y-1">
              <li><strong>eitaxi</strong></li>
              <li>Plataforma digital de conexión taxi-usuario</li>
              <li>Suiza</li>
              <li className="flex items-center gap-2 mt-2">
                <Mail className="h-4 w-4 text-yellow-400" />
                <a href="mailto:privacidad@eitaxi.ch" className="text-yellow-400 hover:underline">
                  privacidad@eitaxi.ch
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Datos recopilados */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">3. Datos que Recopilamos</h2>
          
          <div className="space-y-6">
            {/* Conductores */}
            <div>
              <h3 className="font-medium flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-yellow-400/20 flex items-center justify-center text-sm">🚕</span>
                Datos de Conductores
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-muted/20 rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <UserX className="h-4 w-4 text-blue-400" />
                    Datos de identificación
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Nombre completo</li>
                    <li>• Dirección de correo electrónico</li>
                    <li>• Número de teléfono</li>
                    <li>• Fotografía de perfil (opcional)</li>
                  </ul>
                </div>
                <div className="bg-muted/20 rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-400" />
                    Datos de ubicación
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Ubicación en tiempo real (solo cuando GPS activo)</li>
                    <li>• Última ubicación conocida</li>
                    <li>• Zonas de servicio configuradas</li>
                  </ul>
                </div>
                <div className="bg-muted/20 rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-400" />
                    Datos profesionales
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Años de experiencia</li>
                    <li>• Tipo de vehículo</li>
                    <li>• Servicios ofrecidos</li>
                    <li>• Idiomas hablados</li>
                  </ul>
                </div>
                <div className="bg-muted/20 rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-400" />
                    Datos de actividad
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Horarios de disponibilidad</li>
                    <li>• Historial de sesiones</li>
                    <li>• Valoraciones recibidas</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Usuarios */}
            <div>
              <h3 className="font-medium flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-blue-400/20 flex items-center justify-center text-sm">👤</span>
                Datos de Usuarios (Buscadores de taxi)
              </h3>
              <div className="bg-muted/20 rounded-lg p-4">
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Ubicación temporal (solo durante la búsqueda, con consentimiento)</li>
                  <li>• Historial de búsquedas (almacenado localmente en su dispositivo)</li>
                  <li>• Favoritos y ubicaciones guardadas (almacenado localmente)</li>
                </ul>
                <div className="mt-3 p-2 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-400 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  No recopilamos datos personales de usuarios no registrados
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Finalidad */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">4. Finalidad del Tratamiento</h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-muted/20 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Eye className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <h3 className="font-medium">Mostrar ubicación a clientes potenciales</h3>
                <p className="text-sm text-muted-foreground">
                  Su ubicación en tiempo real se muestra únicamente a usuarios que buscan taxis 
                  en su zona, y solo cuando usted tiene el GPS activado.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-muted/20 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Bell className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium">Comunicaciones del servicio</h3>
                <p className="text-sm text-muted-foreground">
                  Notificaciones sobre su cuenta, recordatorios de GPS, y actualizaciones 
                  importantes del servicio.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-muted/20 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Database className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-medium">Mejora del servicio</h3>
                <p className="text-sm text-muted-foreground">
                  Análisis agregado y anónimo para mejorar la plataforma y la experiencia 
                  de todos los usuarios.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-400">No vendemos sus datos</h4>
                <p className="text-sm text-muted-foreground">
                  Nunca vendemos, alquilamos ni compartimos sus datos personales con terceros 
                  con fines comerciales. Sus datos se utilizan exclusivamente para el funcionamiento 
                  de la plataforma.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Base legal */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">5. Base Legal del Tratamiento</h2>
          <p className="text-muted-foreground mb-4">
            De conformidad con el artículo 31 de la nDSG, tratamos sus datos basándonos en:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <strong>Consentimiento explícito</strong>
                <p className="text-sm text-muted-foreground">
                  Para el tratamiento de datos de ubicación en tiempo real.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <strong>Ejecución de un contrato</strong>
                <p className="text-sm text-muted-foreground">
                  Para la prestación del servicio de conexión entre conductores y usuarios.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <strong>Interés legítimo</strong>
                <p className="text-sm text-muted-foreground">
                  Para la mejora del servicio y seguridad de la plataforma.
                </p>
              </div>
            </li>
          </ul>
        </div>

        {/* Retención */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">6. Período de Retención</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">Tipo de Dato</th>
                  <th className="text-left py-3 px-4 font-medium">Período de Retención</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border/50">
                  <td className="py-3 px-4">Datos de cuenta (conductores)</td>
                  <td className="py-3 px-4">Mientras la cuenta esté activa + 30 días</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-3 px-4">Ubicación en tiempo real</td>
                  <td className="py-3 px-4">Solo mientras GPS activo (no se almacena históricamente)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-3 px-4">Última ubicación conocida</td>
                  <td className="py-3 px-4">7 días desde última actualización</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-3 px-4">Historial de búsquedas (usuarios)</td>
                  <td className="py-3 px-4">Solo en dispositivo local (controlado por usuario)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Logs de seguridad</td>
                  <td className="py-3 px-4">6 meses</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Derechos */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">7. Sus Derechos</h2>
          <p className="text-muted-foreground mb-6">
            Conforme a la nDSG, usted tiene los siguientes derechos sobre sus datos personales:
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted/20 rounded-lg">
              <h3 className="font-medium flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-yellow-400" />
                Derecho de acceso
              </h3>
              <p className="text-sm text-muted-foreground">
                Puede solicitar información sobre qué datos personales tenemos sobre usted.
              </p>
            </div>

            <div className="p-4 bg-muted/20 rounded-lg">
              <h3 className="font-medium flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-blue-400" />
                Derecho de rectificación
              </h3>
              <p className="text-sm text-muted-foreground">
                Puede solicitar la corrección de datos inexactos o incompletos.
              </p>
            </div>

            <div className="p-4 bg-muted/20 rounded-lg">
              <h3 className="font-medium flex items-center gap-2 mb-2">
                <UserX className="h-4 w-4 text-red-400" />
                Derecho de supresión
              </h3>
              <p className="text-sm text-muted-foreground">
                Puede solicitar la eliminación de sus datos personales.
              </p>
            </div>

            <div className="p-4 bg-muted/20 rounded-lg">
              <h3 className="font-medium flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-purple-400" />
                Derecho de oposición
              </h3>
              <p className="text-sm text-muted-foreground">
                Puede oponerse al tratamiento de sus datos en determinados casos.
              </p>
            </div>

            <div className="p-4 bg-muted/20 rounded-lg">
              <h3 className="font-medium flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-orange-400" />
                Derecho de limitación
              </h3>
              <p className="text-sm text-muted-foreground">
                Puede solicitar la limitación del tratamiento de sus datos.
              </p>
            </div>

            <div className="p-4 bg-muted/20 rounded-lg">
              <h3 className="font-medium flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-green-400" />
                Derecho de portabilidad
              </h3>
              <p className="text-sm text-muted-foreground">
                Puede recibir sus datos en un formato estructurado y legible por máquina.
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
            <h4 className="font-medium text-yellow-400 mb-2">¿Cómo ejercer sus derechos?</h4>
            <p className="text-sm text-muted-foreground">
              Puede ejercer cualquiera de estos derechos desde su panel de conductor 
              (sección "Datos y Privacidad") o contactándonos directamente a{' '}
              <a href="mailto:privacidad@eitaxi.ch" className="text-yellow-400 hover:underline">
                privacidad@eitaxi.ch
              </a>
            </p>
          </div>
        </div>

        {/* Seguridad */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">8. Seguridad de los Datos</h2>
          <p className="text-muted-foreground mb-4">
            Implementamos medidas técnicas y organizativas apropiadas para proteger sus datos:
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              Cifrado HTTPS/TLS en todas las comunicaciones
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              Autenticación segura de usuarios
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              Acceso restringido a datos personales
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              Copias de seguridad regulares
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              Monitorización de seguridad
            </li>
          </ul>
        </div>

        {/* Terceros */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">9. Transferencias a Terceros</h2>
          <p className="text-muted-foreground mb-4">
            No transferimos sus datos personales fuera de Suiza/Espacio Económico Europeo. 
            Utilizamos los siguientes servicios de terceros:
          </p>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 text-yellow-400 mt-0.5" />
              <span><strong>OpenStreetMap/Nominatim:</strong> Servicios de mapas y geocodificación (sin datos personales)</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 text-yellow-400 mt-0.5" />
              <span><strong>Proveedor de hosting:</strong> Servidores ubicados en Suiza/UE con medidas de seguridad certificadas</span>
            </li>
          </ul>
        </div>

        {/* Cookies */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">10. Cookies y Almacenamiento Local</h2>
          <p className="text-muted-foreground mb-4">
            Utilizamos almacenamiento local (localStorage) y cookies para:
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li>• Mantener su sesión activa</li>
            <li>• Recordar preferencias de usuario</li>
            <li>• Guardar consentimientos</li>
            <li>• Almacenar historial y favoritos (controlado por usted)</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">
            Puede borrar estos datos en cualquier momento desde la configuración de su navegador.
          </p>
        </div>

        {/* Menores */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">11. Protección de Menores</h2>
          <p className="text-muted-foreground">
            Nuestros servicios no están dirigidos a menores de 18 años. No recopilamos 
            conscientemente datos de menores. Si tiene conocimiento de que un menor nos 
            ha proporcionado datos, contáctenos para proceder a su eliminación.
          </p>
        </div>

        {/* Cambios */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">12. Cambios en esta Política</h2>
          <p className="text-muted-foreground">
            Podemos actualizar esta política ocasionalmente. Le notificaremos cualquier 
            cambio significativo a través de la plataforma. Le recomendamos revisar esta 
            página periódicamente.
          </p>
        </div>

        {/* Contacto */}
        <div className="bg-gradient-to-br from-yellow-400/10 to-yellow-400/5 border border-yellow-400/30 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">13. Contacto</h2>
          <p className="text-muted-foreground mb-4">
            Para cualquier pregunta sobre esta política o sobre sus datos personales:
          </p>
          <div className="bg-card/50 rounded-lg p-4">
            <p className="font-medium mb-2">Delegado de Protección de Datos</p>
            <p className="text-muted-foreground mb-2">eitaxi</p>
            <div className="flex items-center gap-2 text-yellow-400">
              <Mail className="h-4 w-4" />
              <a href="mailto:privacidad@eitaxi.ch" className="hover:underline">
                privacidad@eitaxi.ch
              </a>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Si no está satisfecho con nuestra respuesta, tiene derecho a presentar una 
            reclamación ante el <strong>Comisionado Federal de Protección de Datos (PFPD)</strong> de Suiza.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-8 border-t border-border">
          <p>
            © 2026 eitaxi. Todos los derechos reservados.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Link href="/privacidad" className="hover:text-foreground">
              Política de Privacidad
            </Link>
            <Link href="/terminos" className="hover:text-foreground">
              Términos de Servicio
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
