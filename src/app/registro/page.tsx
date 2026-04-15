"use client";

import Link from "next/link";
import { Users, Car, ArrowRight, Shield, CheckCircle, Star, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function RegistroPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/" className="text-xl font-bold text-yellow-400">eitaxi</Link>
          <span className="text-sm text-zinc-400">/</span>
          <span className="text-sm text-white font-medium">Registro</span>
          <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors ml-auto">
            Inicio
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Crear una cuenta en <span className="text-yellow-400">eitaxi</span>
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Elige cómo quieres unirte a la plataforma de taxis líder en Suiza.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cliente Card */}
          <Link href="/cuenta">
            <Card className="group bg-zinc-900 border-zinc-800 hover:border-yellow-400/50 transition-all duration-300 cursor-pointer h-full overflow-hidden">
              <CardContent className="p-0">
                <div className="h-32 bg-gradient-to-br from-yellow-400/15 to-yellow-400/5 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-yellow-400/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-8 w-8 text-yellow-400" />
                  </div>
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-2 group-hover:text-yellow-400 transition-colors">
                    Cliente
                  </h2>
                  <p className="text-sm text-zinc-400 mb-4">
                    Busca taxis, reserva viajes, recibe notificaciones en tiempo real y chatea con tu conductor.
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2 text-sm text-zinc-300">
                      <CheckCircle className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                      Reserva taxis en segundos
                    </li>
                    <li className="flex items-center gap-2 text-sm text-zinc-300">
                      <CheckCircle className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                      Chat directo con el conductor
                    </li>
                    <li className="flex items-center gap-2 text-sm text-zinc-300">
                      <CheckCircle className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                      Notificaciones de tu reserva
                    </li>
                    <li className="flex items-center gap-2 text-sm text-zinc-300">
                      <CheckCircle className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                      Historial de viajes
                    </li>
                  </ul>
                  <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium">
                    Registrarse como cliente
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Conductor Card */}
          <Link href="/registrarse">
            <Card className="group bg-zinc-900 border-zinc-800 hover:border-green-400/50 transition-all duration-300 cursor-pointer h-full overflow-hidden">
              <CardContent className="p-0">
                <div className="h-32 bg-gradient-to-br from-green-400/15 to-green-400/5 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-green-400/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Car className="h-8 w-8 text-green-400" />
                  </div>
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-2 group-hover:text-green-400 transition-colors">
                    Conductor
                  </h2>
                  <p className="text-sm text-zinc-400 mb-4">
                    Crea tu perfil profesional, define tus zonas y tarifas, y conecta con miles de pasajeros.
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2 text-sm text-zinc-300">
                      <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                      Perfil profesional personalizado
                    </li>
                    <li className="flex items-center gap-2 text-sm text-zinc-300">
                      <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                      Define tus zonas de cobertura
                    </li>
                    <li className="flex items-center gap-2 text-sm text-zinc-300">
                      <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                      Gestiona reservas desde tu panel
                    </li>
                    <li className="flex items-center gap-2 text-sm text-zinc-300">
                      <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                      Chat con pasajeros
                    </li>
                  </ul>
                  <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                    Registrarse como conductor
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
