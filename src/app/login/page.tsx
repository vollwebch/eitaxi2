"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Car,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SessionGuard } from "@/components/SessionGuard";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailCharError, setEmailCharError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Por favor ingresa tu email y contraseña");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // La cookie HTTP-only segura ya fue establecida por el servidor (JWT firmado)
        // Guardar info básica en localStorage solo para UI del cliente (NO para autenticación)
        localStorage.setItem('eitaxi_session', JSON.stringify({
          driverId: data.data.id,
          email: data.data.email,
          name: data.data.name,
          loginTime: new Date().toISOString(),
        }));
        
        // Redirect to dashboard
        router.push(`/dashboard/${data.data.id}`);
      } else {
        setError(data.error || "Error al iniciar sesión");
      }
    } catch (err) {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SessionGuard redirectToDashboard>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-500">
              <Car className="h-7 w-7 text-black" />
            </div>
            <span className="text-2xl font-bold">
              <span className="text-yellow-400">ei</span>
              <span className="text-white">taxi</span>
            </span>
          </Link>
        </div>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold text-center mb-2">
              Panel de Conductor
            </h1>
            <p className="text-muted-foreground text-center mb-6">
              Inicia sesión para gestionar tu perfil
            </p>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEmail(value);
                    }}
                    // Browser native type="email" validation is sufficient
                    // Supports ñ, ç, acentos and other Latin characters per RFC 6531
                    className="pl-10"
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
                {emailCharError && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {emailCharError}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-yellow-400 text-black hover:bg-yellow-500"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-muted-foreground mb-3">
                ¿No tienes una cuenta?
              </p>
              <Link href="/registrarse">
                <Button variant="outline" className="w-full">
                  Crear mi perfil gratis
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio
          </Link>
        </div>

        {/* Demo credentials hint - only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
            <p className="text-sm text-center text-yellow-400">
              <strong>Credenciales de prueba:</strong><br />
              Email: paco@taxizone.ch<br />
              Contraseña: demo123456
            </p>
          </div>
        )}
      </motion.div>
    </div>
    </SessionGuard>
  );
}
