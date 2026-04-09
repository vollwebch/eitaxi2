"use client";

import Link from "next/link";
import {
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Car,
  Users,
  Ban,
  Scale,
  Mail,
} from "lucide-react";

export default function TermsPage() {
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
            <FileText className="h-4 w-4" />
            Términos Legales
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Términos de Servicio
          </h1>
          <p className="text-muted-foreground">
            Última actualización: {lastUpdated}
          </p>
        </div>

        {/* Aceptación */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">1. Aceptación de los Términos</h2>
          <p className="text-muted-foreground mb-4">
            Al registrarse y utilizar los servicios de eitaxi ("la Plataforma"), usted acepta 
            estar sujeto a estos Términos de Servicio. Si no está de acuerdo con alguno de estos 
            términos, no debe utilizar nuestra plataforma.
          </p>
          <p className="text-muted-foreground">
            Estos términos constituyen un acuerdo legal vinculante entre usted ("el Usuario" o "el Conductor") 
            y eitaxi respecto al uso de la plataforma y los servicios ofrecidos.
          </p>
        </div>

        {/* Descripción del servicio */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">2. Descripción del Servicio</h2>
          <p className="text-muted-foreground mb-4">
            eitaxi es una plataforma digital que facilita la conexión entre:
          </p>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-muted/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Car className="h-5 w-5 text-yellow-400" />
                <h3 className="font-medium">Conductores de taxi</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Profesionales del transporte que desean ofrecer sus servicios a potenciales clientes.
              </p>
            </div>
            <div className="p-4 bg-muted/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-400" />
                <h3 className="font-medium">Usuarios</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Personas que buscan servicios de taxi en Suiza y Liechtenstein.
              </p>
            </div>
          </div>
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-400">
              <strong>Importante:</strong> eitaxi actúa únicamente como intermediario tecnológico. 
              No es una empresa de taxis ni un servicio de transporte. Los servicios de transporte 
              son prestados directamente por los conductores inscritos, quienes son responsables 
              de cumplir con toda la normativa suiza aplicable.
            </p>
          </div>
        </div>

        {/* Requisitos de registro */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">3. Requisitos de Registro para Conductores</h2>
          <p className="text-muted-foreground mb-4">
            Para registrarse como conductor en eitaxi, usted declara y garantiza que:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
              <span>Es mayor de 18 años y tiene capacidad legal para celebrar contratos.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
              <span>Posee una licencia de conducir válida y vigente en Suiza.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
              <span>Cumple con todos los requisitos legales para prestar servicios de taxi en su cantón.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
              <span>La información proporcionada durante el registro es veraz, precisa y actualizada.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
              <span>Mantiene un seguro de responsabilidad civil válido conforme a la legislación suiza.</span>
            </li>
          </ul>
        </div>

        {/* Uso de la plataforma */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">4. Uso Aceptable de la Plataforma</h2>
          
          <h3 className="font-medium mb-3">4.1 Uso permitido</h3>
          <ul className="space-y-2 text-muted-foreground mb-6">
            <li>• Utilizar la plataforma para conectar con potenciales clientes de manera profesional.</li>
            <li>• Mostrar su ubicación en tiempo real cuando esté disponible para prestar servicios.</li>
            <li>• Gestionar su perfil, horarios y disponibilidad.</li>
            <li>• Recibir valoraciones de clientes.</li>
          </ul>

          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Ban className="h-5 w-5 text-red-400" />
            4.2 Uso prohibido
          </h3>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-red-400 mt-0.5" />
                <span>Proporcionar información falsa o engañosa en su perfil.</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-red-400 mt-0.5" />
                <span>Utilizar la plataforma para actividades ilegales o no autorizadas.</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-red-400 mt-0.5" />
                <span>Suplantar la identidad de otra persona o entidad.</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-red-400 mt-0.5" />
                <span>Intentar acceder a cuentas de otros usuarios sin autorización.</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-red-400 mt-0.5" />
                <span>Utilizar bots, scripts u otros medios automatizados para manipular la plataforma.</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-red-400 mt-0.5" />
                <span>Acosar, amenazar o discriminar a otros usuarios.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* GPS y Ubicación */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-yellow-400" />
            5. Servicio de Geolocalización
          </h2>
          <p className="text-muted-foreground mb-4">
            El servicio de seguimiento GPS es una funcionalidad central de la plataforma:
          </p>
          <div className="space-y-4">
            <div className="p-4 bg-muted/20 rounded-lg">
              <h4 className="font-medium mb-2">5.1 Consentimiento</h4>
              <p className="text-sm text-muted-foreground">
                Al activar el GPS, usted consiente explícitamente que su ubicación en tiempo real 
                sea visible para usuarios que buscan servicios de taxi. Este consentimiento puede 
                ser revocado en cualquier momento desactivando el GPS.
              </p>
            </div>
            <div className="p-4 bg-muted/20 rounded-lg">
              <h4 className="font-medium mb-2">5.2 Actualización de ubicación</h4>
              <p className="text-sm text-muted-foreground">
                Cuando el GPS está activo, su ubicación se actualiza automáticamente cada 5 segundos 
                y se transmite a nuestros servidores para ser mostrada a usuarios potenciales.
              </p>
            </div>
            <div className="p-4 bg-muted/20 rounded-lg">
              <h4 className="font-medium mb-2">5.3 Responsabilidad</h4>
              <p className="text-sm text-muted-foreground">
                Usted es responsable de activar/desactivar el GPS según su disponibilidad real. 
                No debe mantener el GPS activo cuando no esté disponible para prestar servicios.
              </p>
            </div>
          </div>
        </div>

        {/* Tarifas y pagos */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">6. Tarifas y Pagos</h2>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
              <p className="text-sm text-yellow-400">
                <strong>Servicio gratuito:</strong> eitaxi es actualmente gratuito para conductores. 
                No cobramos comisiones ni tarifas por el uso de la plataforma.
              </p>
            </div>
            <p className="text-muted-foreground">
              Los precios mostrados en su perfil son informativos y orientativos. La tarifa final 
              del servicio se acuerda directamente entre usted y el cliente, conforme a la normativa 
              suiza aplicable.
            </p>
          </div>
        </div>

        {/* Propiedad intelectual */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">7. Propiedad Intelectual</h2>
          <p className="text-muted-foreground mb-4">
            Usted conserva todos los derechos sobre las fotografías, textos y otros contenidos 
            que suba a su perfil. Al subir contenido, nos otorga una licencia no exclusiva para 
            mostrar dicho contenido en la plataforma mientras su cuenta esté activa.
          </p>
          <p className="text-muted-foreground">
            La marca eitaxi, el logotipo y el diseño de la plataforma son propiedad de eitaxi 
            y están protegidos por las leyes de propiedad intelectual suizas.
          </p>
        </div>

        {/* Responsabilidad */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">8. Limitación de Responsabilidad</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-muted/20 rounded-lg">
              <Shield className="h-10 w-10 text-yellow-400 flex-shrink-0" />
              <div>
                <h4 className="font-medium">Exención de responsabilidad</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  eitaxi no se hace responsable de: disputas entre conductores y clientes, 
                  calidad del servicio prestado, daños o perjuicios derivados del transporte, 
                  incumplimientos contractuales entre las partes.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-muted/20 rounded-lg">
              <AlertTriangle className="h-10 w-10 text-orange-400 flex-shrink-0" />
              <div>
                <h4 className="font-medium">Responsabilidad del conductor</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  El conductor es único responsable de: cumplir con la normativa de transporte 
                  de su cantón, mantener seguros vigentes, garantizar la seguridad de los pasajeros, 
                  y la exactitud de la información proporcionada.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Suspensión */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">9. Suspensión y Terminación</h2>
          <p className="text-muted-foreground mb-4">
            Nos reservamos el derecho de suspender o terminar cuentas que:
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li>• Violen estos Términos de Servicio.</li>
            <li>• Proporcionen información falsa o engañosa.</li>
            <li>• Sean reportadas por conducta inapropiada.</li>
            <li>• Permanezcan inactivas durante más de 12 meses.</li>
            <li>• Sean utilizadas para actividades ilegales.</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            Usted puede eliminar su cuenta en cualquier momento desde el panel de control 
            o contactándonos a{' '}
            <a href="mailto:soporte@eitaxi.ch" className="text-yellow-400 hover:underline">
              soporte@eitaxi.ch
            </a>
          </p>
        </div>

        {/* Modificaciones */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-400" />
            10. Modificaciones de los Términos
          </h2>
          <p className="text-muted-foreground">
            Podemos modificar estos términos en cualquier momento. Los cambios significativos 
            serán notificados a través de la plataforma con al menos 14 días de antelación. 
            El uso continuado de la plataforma después de las modificaciones constituye 
            la aceptación de los nuevos términos.
          </p>
        </div>

        {/* Ley aplicable */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Scale className="h-5 w-5 text-yellow-400" />
            11. Ley Aplicable y Jurisdicción
          </h2>
          <p className="text-muted-foreground mb-4">
            Estos términos se rigen por el derecho suizo. En caso de disputa, las partes 
            se someten a la jurisdicción de los tribunales competentes de Suiza.
          </p>
          <p className="text-muted-foreground">
            Para cualquier cuestión relacionada con protección de datos, puede consultar 
            nuestra <Link href="/privacidad" className="text-yellow-400 hover:underline">Política de Privacidad</Link> o 
            contactar con el Comisionado Federal de Protección de Datos (PFPD).
          </p>
        </div>

        {/* Contacto */}
        <div className="bg-gradient-to-br from-yellow-400/10 to-yellow-400/5 border border-yellow-400/30 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">12. Contacto</h2>
          <p className="text-muted-foreground mb-4">
            Para cualquier pregunta sobre estos términos:
          </p>
          <div className="bg-card/50 rounded-lg p-4">
            <p className="font-medium mb-2">eitaxi - Soporte Legal</p>
            <div className="flex items-center gap-2 text-yellow-400">
              <Mail className="h-4 w-4" />
              <a href="mailto:legal@eitaxi.ch" className="hover:underline">
                legal@eitaxi.ch
              </a>
            </div>
          </div>
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
