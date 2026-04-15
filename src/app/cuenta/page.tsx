"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Phone,
  Calendar,
  MessageCircle,
  Bell,
  LogOut,
  ChevronRight,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Loader2,
  ArrowLeft,
  Car,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// ============================================
// TYPES
// ============================================

interface ClientProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  preferredLanguage: string | null;
  createdAt: string;
}

interface Booking {
  id: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  driverName: string;
  pickupAddress: string;
  destination: string;
  date: string;
  notes?: string;
  price?: number;
  driverId?: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderType: "client" | "driver";
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  driverId: string;
  driverName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  messages?: ChatMessage[];
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ============================================
// HELPERS
// ============================================

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  pending: {
    label: "Pendiente",
    className:
      "bg-yellow-400/20 text-yellow-400 border-yellow-400/30",
  },
  confirmed: {
    label: "Confirmada",
    className:
      "bg-blue-400/20 text-blue-400 border-blue-400/30",
  },
  completed: {
    label: "Completada",
    className:
      "bg-green-400/20 text-green-400 border-green-400/30",
  },
  cancelled: {
    label: "Cancelada",
    className:
      "bg-red-400/20 text-red-400 border-red-400/30",
  },
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return formatDate(dateStr);
  } catch {
    return dateStr;
  }
}

function getNotificationIcon(type: string) {
  if (type.startsWith("booking_")) return Calendar;
  if (type === "message") return MessageCircle;
  return Info;
}

// ============================================
// LOADING SPINNER
// ============================================

function Spinner({ className = "h-6 w-6" }: { className?: string }) {
  return <Loader2 className={`${className} animate-spin text-yellow-400`} />;
}

// ============================================
// AUTH FORMS (NOT AUTHENTICATED)
// ============================================

function AuthForms() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const router = useRouter();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!loginEmail || !loginPassword) {
      setLoginError("Por favor ingresa tu email y contraseña");
      return;
    }
    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/client/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem(
          "eitaxi_client_session",
          JSON.stringify({
            clientId: data.data.clientId,
            email: data.data.email,
            name: data.data.name,
            loginTime: new Date().toISOString(),
          })
        );
        // Force page reload to re-evaluate auth state
        window.location.href = "/cuenta";
      } else {
        setLoginError(data.error || "Error al iniciar sesión");
      }
    } catch {
      setLoginError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regName || !regEmail || !regPassword) {
      setRegError("Por favor completa todos los campos obligatorios");
      return;
    }
    if (regPassword.length < 8) {
      setRegError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError("Las contraseñas no coinciden");
      return;
    }

    setRegLoading(true);
    try {
      const res = await fetch("/api/auth/client/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          phone: regPhone || undefined,
          password: regPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem(
          "eitaxi_client_session",
          JSON.stringify({
            clientId: data.data.clientId,
            email: data.data.email,
            name: data.data.name,
            loginTime: new Date().toISOString(),
          })
        );
        window.location.href = "/cuenta";
      } else {
        setRegError(data.error || "Error al crear la cuenta");
      }
    } catch {
      setRegError("Error de conexión. Intenta de nuevo.");
    } finally {
      setRegLoading(false);
    }
  };

  return (
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
            {/* Tab toggle */}
            <div className="flex rounded-lg bg-muted p-1 mb-6">
              <button
                onClick={() => {
                  setMode("login");
                  setLoginError(null);
                  setRegError(null);
                }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  mode === "login"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => {
                  setMode("register");
                  setLoginError(null);
                  setRegError(null);
                }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  mode === "register"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Crear Cuenta
              </button>
            </div>

            {mode === "login" ? (
              <>
                <h1 className="text-2xl font-bold text-center mb-2">
                  Bienvenido de vuelta
                </h1>
                <p className="text-muted-foreground text-center mb-6">
                  Inicia sesión para gestionar tus reservas
                </p>

                {loginError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                    <span className="text-sm text-red-400">{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="tu@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10"
                        disabled={loginLoading}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="login-password">Contraseña</Label>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10"
                        disabled={loginLoading}
                        autoComplete="current-password"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-yellow-400 text-black hover:bg-yellow-500"
                    disabled={loginLoading}
                  >
                    {loginLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Iniciando sesión...
                      </>
                    ) : (
                      "Iniciar Sesión"
                    )}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-border space-y-3">
                  <p className="text-center text-sm">
                    <button
                      onClick={() => {
                        setMode("register");
                        setLoginError(null);
                      }}
                      className="text-yellow-400 hover:text-yellow-300 transition-colors"
                    >
                      ¿No tienes cuenta? Regístrate
                    </button>
                  </p>
                  <p className="text-center text-sm">
                    <Link
                      href="/recuperar-password"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </p>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-center mb-2">
                  Crear una cuenta
                </h1>
                <p className="text-muted-foreground text-center mb-6">
                  Regístrate para reservar taxis fácilmente
                </p>

                {regError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                    <span className="text-sm text-red-400">{regError}</span>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label htmlFor="reg-name">Nombre completo</Label>
                    <div className="relative mt-1.5">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reg-name"
                        type="text"
                        placeholder="Tu nombre"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="pl-10"
                        disabled={regLoading}
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reg-email">Email</Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="tu@email.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="pl-10"
                        disabled={regLoading}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reg-phone">
                      Teléfono{" "}
                      <span className="text-muted-foreground font-normal">
                        (opcional)
                      </span>
                    </Label>
                    <div className="relative mt-1.5">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reg-phone"
                        type="tel"
                        placeholder="+41 76 123 45 67"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="pl-10"
                        disabled={regLoading}
                        autoComplete="tel"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reg-password">Contraseña</Label>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reg-password"
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="pl-10"
                        disabled={regLoading}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reg-confirm-password">
                      Confirmar contraseña
                    </Label>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reg-confirm-password"
                        type="password"
                        placeholder="Repite tu contraseña"
                        value={regConfirmPassword}
                        onChange={(e) =>
                          setRegConfirmPassword(e.target.value)
                        }
                        className="pl-10"
                        disabled={regLoading}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-yellow-400 text-black hover:bg-yellow-500"
                    disabled={regLoading}
                  >
                    {regLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando cuenta...
                      </>
                    ) : (
                      "Crear Cuenta"
                    )}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-center text-sm">
                    <button
                      onClick={() => {
                        setMode("login");
                        setRegError(null);
                      }}
                      className="text-yellow-400 hover:text-yellow-300 transition-colors"
                    >
                      ¿Ya tienes cuenta? Inicia sesión
                    </button>
                  </p>
                </div>
              </>
            )}
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
      </motion.div>
    </div>
  );
}

// ============================================
// TAB: RESUMEN
// ============================================

function ResumenTab({
  profile,
  bookings,
  onLogout,
}: {
  profile: ClientProfile;
  bookings: Booking[];
  onLogout: () => void;
}) {
  const totalBookings = bookings.length;
  const activeBookings = bookings.filter(
    (b) => b.status === "pending" || b.status === "confirmed"
  ).length;
  const completedBookings = bookings.filter(
    (b) => b.status === "completed"
  ).length;

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-yellow-400/20 flex items-center justify-center flex-shrink-0">
              <User className="h-8 w-8 text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">
                ¡Hola, {profile.name}!
              </h2>
              <p className="text-muted-foreground truncate">{profile.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {totalBookings}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Reservas</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              {completedBookings}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Completadas</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {activeBookings}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Activas</div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Info */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Información del perfil</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">{profile.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Phone className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Teléfono</div>
                <div className="font-medium">
                  {profile.phone || "No especificado"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  Idioma preferido
                </div>
                <div className="font-medium">
                  {profile.preferredLanguage || "No especificado"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Miembro desde</div>
                <div className="font-medium">
                  {formatDate(profile.createdAt)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Button
        variant="outline"
        className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
        onClick={onLogout}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Cerrar sesión
      </Button>
    </div>
  );
}

// ============================================
// TAB: MIS RESERVAS
// ============================================

function ReservasTab({
  bookings,
  loading,
  onGoToChat,
}: {
  bookings: Booking[];
  loading: boolean;
  onGoToChat: (driverId: string) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No tienes reservas aún</h3>
          <p className="text-muted-foreground text-sm">
            Busca un taxi y realiza tu primera reserva
          </p>
          <Link href="/" className="inline-block mt-4">
            <Button className="bg-yellow-400 text-black hover:bg-yellow-500">
              Buscar taxis
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">
        Mis Reservas ({bookings.length})
      </h3>
      {bookings.map((booking) => {
        const isExpanded = expandedId === booking.id;
        const config = statusConfig[booking.status] || statusConfig.pending;

        return (
          <Card
            key={booking.id}
            className="bg-card border-border cursor-pointer hover:border-yellow-400/30 transition-colors"
            onClick={() =>
              setExpandedId(isExpanded ? null : booking.id)
            }
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">
                      {booking.driverName}
                    </span>
                    <Badge
                      variant="outline"
                      className={config.className}
                    >
                      {config.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{booking.pickupAddress}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{booking.destination}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(booking.date)}</span>
                  </div>
                </div>
                <ChevronRight
                  className={`h-5 w-5 text-muted-foreground flex-shrink-0 ml-2 transition-transform ${
                    isExpanded ? "rotate-90" : ""
                  }`}
                />
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 pt-4 border-t border-border"
                >
                  {booking.notes && (
                    <p className="text-sm text-muted-foreground mb-3">
                      <span className="font-medium text-foreground">
                        Notas:
                      </span>{" "}
                      {booking.notes}
                    </p>
                  )}
                  {booking.price && (
                    <p className="text-sm mb-3">
                      <span className="font-medium">Precio:</span> CHF{" "}
                      {booking.price.toFixed(2)}
                    </p>
                  )}
                  <div className="flex gap-2">
                    {booking.driverId && (
                      <Button
                        size="sm"
                        className="bg-yellow-400 text-black hover:bg-yellow-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          onGoToChat(booking.driverId!);
                        }}
                      >
                        <MessageCircle className="mr-1 h-4 w-4" />
                        Chat con conductor
                      </Button>
                    )}
                    {booking.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ============================================
// TAB: CHAT
// ============================================

function ChatTab({
  conversations,
  loading,
  onOpenConversation,
  onBack,
  activeConversation,
  messages,
  messagesLoading,
  onSendMessage,
}: {
  conversations: Conversation[];
  loading: boolean;
  onOpenConversation: (conv: Conversation) => void;
  onBack: () => void;
  activeConversation: Conversation | null;
  messages: ChatMessage[];
  messagesLoading: boolean;
  onSendMessage: (content: string) => void;
}) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Full chat view
  if (activeConversation) {
    return (
      <div className="flex flex-col h-[calc(100vh-220px)] min-h-[400px]">
        {/* Chat header */}
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">
              {activeConversation.driverName}
            </div>
            <div className="text-xs text-muted-foreground">Conductor</div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {messagesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-6 w-6" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay mensajes aún</p>
              <p className="text-xs">Envía el primer mensaje</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isClient = msg.senderType === "client";
              return (
                <div
                  key={msg.id}
                  className={`flex ${
                    isClient ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      isClient
                        ? "bg-yellow-400 text-black rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                    <p
                      className={`text-[10px] mt-1 ${
                        isClient
                          ? "text-black/50"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatRelativeTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Escribe un mensaje..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
              disabled={messagesLoading}
            />
            <Button
              size="icon"
              className="bg-yellow-400 text-black hover:bg-yellow-500 flex-shrink-0"
              onClick={handleSend}
              disabled={!input.trim() || messagesLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Conversation list
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            No tienes conversaciones aún
          </h3>
          <p className="text-muted-foreground text-sm">
            Las conversaciones aparecerán cuando reserves un taxi
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Conversaciones</h3>
      {conversations.map((conv) => (
        <Card
          key={conv.id}
          className="bg-card border-border cursor-pointer hover:border-yellow-400/30 transition-colors"
          onClick={() => onOpenConversation(conv)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-yellow-400/20 flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold truncate">
                    {conv.driverName}
                  </span>
                  <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                    {formatRelativeTime(conv.lastMessageAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-muted-foreground truncate">
                    {conv.lastMessage}
                  </p>
                  {conv.unreadCount > 0 && (
                    <Badge className="bg-yellow-400 text-black border-0 flex-shrink-0 ml-2">
                      {conv.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================
// TAB: NOTIFICACIONES
// ============================================

function NotificacionesTab({
  notifications,
  loading,
  onMarkRead,
  onMarkAllRead,
}: {
  notifications: Notification[];
  loading: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Notificaciones
          {unreadCount > 0 && (
            <Badge className="bg-yellow-400 text-black border-0 ml-2">
              {unreadCount}
            </Badge>
          )}
        </h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAllRead}
            className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
          >
            <CheckCircle className="mr-1 h-4 w-4" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              No tienes notificaciones
            </h3>
            <p className="text-muted-foreground text-sm">
              Las notificaciones aparecerán aquí
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = getNotificationIcon(notif.type);
            return (
              <Card
                key={notif.id}
                className={`bg-card border-border cursor-pointer transition-colors ${
                  !notif.read
                    ? "border-l-2 border-l-yellow-400 hover:bg-yellow-400/5"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => !notif.read && onMarkRead(notif.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        !notif.read
                          ? "bg-yellow-400/20"
                          : "bg-muted"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          !notif.read
                            ? "text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4
                          className={`font-medium text-sm ${
                            !notif.read ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {notif.title}
                        </h4>
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN PAGE (AUTHENTICATED)
// ============================================

function AuthenticatedView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatMessagesLoading, setChatMessagesLoading] = useState(false);

  // Loading states
  const [profileLoading, setProfileLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const activeTab = searchParams.get("tab") || "resumen";
  const chatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch profile and session on mount
  useEffect(() => {
    const fetchData = async () => {
      setProfileLoading(true);
      try {
        const sessionRes = await fetch("/api/auth/client/session");
        const sessionData = await sessionRes.json();
        if (!sessionData.success) {
          // Not authenticated, show login form
          localStorage.removeItem("eitaxi_client_session");
          setProfileLoading(false);
          return;
        }

        const profileRes = await fetch("/api/auth/client/whoami");
        const profileData = await profileRes.json();
        if (profileData.success) {
          setProfile(profileData.data);
        }
      } catch {
        localStorage.removeItem("eitaxi_client_session");
      } finally {
        setProfileLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch bookings when tab is reservas
  useEffect(() => {
    if (activeTab !== "resumen" && activeTab !== "reservas") return;
    setBookingsLoading(true);
    fetch("/api/client/bookings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setBookings(data.data || []);
      })
      .catch(() => {})
      .finally(() => setBookingsLoading(false));
  }, [activeTab]);

  // Fetch conversations when chat tab opens
  useEffect(() => {
    if (activeTab !== "chat") return;
    setConversationsLoading(true);
    fetch("/api/chat/recent")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setConversations(data.data || []);
      })
      .catch(() => {})
      .finally(() => setConversationsLoading(false));
  }, [activeTab]);

  // Fetch notifications when tab opens
  useEffect(() => {
    if (activeTab !== "notificaciones") return;
    setNotificationsLoading(true);
    fetch("/api/client/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setNotifications(data.data || []);
      })
      .catch(() => {})
      .finally(() => setNotificationsLoading(false));
  }, [activeTab]);

  // Fetch chat messages when a conversation is opened
  useEffect(() => {
    if (!activeConversation) return;
    setChatMessagesLoading(true);
    fetch(
      `/api/chat/messages?conversationId=${activeConversation.id}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setChatMessages(data.data || []);
      })
      .catch(() => {})
      .finally(() => setChatMessagesLoading(false));

    // Auto-refresh every 5 seconds
    chatIntervalRef.current = setInterval(() => {
      fetch(
        `/api/chat/messages?conversationId=${activeConversation.id}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setChatMessages(data.data || []);
        })
        .catch(() => {});
    }, 5000);

    return () => {
      if (chatIntervalRef.current) {
        clearInterval(chatIntervalRef.current);
        chatIntervalRef.current = null;
      }
    };
  }, [activeConversation?.id]);

  const handleLogout = () => {
    localStorage.removeItem("eitaxi_client_session");
    window.location.href = "/cuenta";
  };

  const handleGoToChat = (driverId: string) => {
    const conv = conversations.find((c) => c.driverId === driverId);
    if (conv) {
      setActiveConversation(conv);
      router.push("/cuenta?tab=chat");
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!activeConversation) return;
    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          content,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setChatMessages((prev) => [...prev, data.data]);
      }
    } catch {
      // Silently fail, messages will refresh from interval
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/client/notifications/${id}/read`, {
        method: "POST",
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      // Silently fail
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/client/notifications/read-all", {
        method: "POST",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // Silently fail
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Spinner className="h-10 w-10 mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <AuthForms />;
  }

  // If a conversation is active, always show chat
  const effectiveTab = activeConversation ? "chat" : activeTab;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-500">
                <Car className="h-6 w-6 text-black" />
              </div>
              <span className="text-xl font-bold">
                <span className="text-yellow-400">ei</span>
                <span className="text-white">taxi</span>
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {profile.name}
              </span>
              <div className="w-9 h-9 rounded-full bg-yellow-400/20 flex items-center justify-center">
                <User className="h-5 w-5 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <Tabs
          value={effectiveTab}
          onValueChange={(val) => {
            if (val === "chat") {
              setActiveConversation(null);
            }
            router.push(
              val === "resumen"
                ? "/cuenta"
                : `/cuenta?tab=${val}`
            );
          }}
        >
          <TabsList className="w-full grid grid-cols-4 mb-6 bg-muted">
            <TabsTrigger value="resumen" className="text-xs sm:text-sm">
              <User className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Resumen</span>
            </TabsTrigger>
            <TabsTrigger value="reservas" className="text-xs sm:text-sm">
              <Calendar className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Reservas</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="text-xs sm:text-sm">
              <MessageCircle className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="notificaciones" className="text-xs sm:text-sm">
              <Bell className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Alertas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resumen">
            <ResumenTab
              profile={profile}
              bookings={bookings}
              onLogout={handleLogout}
            />
          </TabsContent>

          <TabsContent value="reservas">
            <ReservasTab
              bookings={bookings}
              loading={bookingsLoading}
              onGoToChat={handleGoToChat}
            />
          </TabsContent>

          <TabsContent value="chat">
            <ChatTab
              conversations={conversations}
              loading={conversationsLoading}
              onOpenConversation={setActiveConversation}
              onBack={() => setActiveConversation(null)}
              activeConversation={activeConversation}
              messages={chatMessages}
              messagesLoading={chatMessagesLoading}
              onSendMessage={handleSendMessage}
            />
          </TabsContent>

          <TabsContent value="notificaciones">
            <NotificacionesTab
              notifications={notifications}
              loading={notificationsLoading}
              onMarkRead={handleMarkRead}
              onMarkAllRead={handleMarkAllRead}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ============================================
// PAGE ENTRY POINT
// ============================================

export default function CuentaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Spinner className="h-10 w-10" />
        </div>
      }
    >
      <AuthenticatedView />
    </Suspense>
  );
}
