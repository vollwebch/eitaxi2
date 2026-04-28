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
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { SessionGuard } from "@/components/SessionGuard";
import { useTranslations } from 'next-intl';

type Tab = "cliente" | "conductor";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations('login');
  const tCommon = useTranslations('common');

  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>("cliente");

  // Driver login state
  const [driverEmail, setDriverEmail] = useState("");
  const [driverPassword, setDriverPassword] = useState("");
  const [driverLoading, setDriverLoading] = useState(false);
  const [driverError, setDriverError] = useState<string | null>(null);
  const [emailCharError, setEmailCharError] = useState<string | null>(null);

  // Client auth state
  const [isClientRegister, setIsClientRegister] = useState(false);
  const [clientLoading, setClientLoading] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Client login form
  const [clientLoginEmail, setClientLoginEmail] = useState("");
  const [clientLoginPassword, setClientLoginPassword] = useState("");

  // Client register form
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // ======== DRIVER LOGIN ========
  const handleDriverLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setDriverError(null);

    if (!driverEmail || !driverPassword) {
      setDriverError(t('errorEmpty'));
      return;
    }

    setDriverLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: driverEmail, password: driverPassword }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('eitaxi_session', JSON.stringify({
          driverId: data.data.id,
          email: data.data.email,
          name: data.data.name,
          loginTime: new Date().toISOString(),
        }));

        router.push(`/dashboard/${data.data.id}`);
      } else {
        setDriverError(data.error || t('errorLogin'));
      }
    } catch (err) {
      setDriverError(tCommon('connectionError'));
    } finally {
      setDriverLoading(false);
    }
  };

  // ======== CLIENT LOGIN ========
  const handleClientLogin = async () => {
    setClientError(null);
    setClientLoading(true);

    if (!clientLoginEmail.trim() || !clientLoginPassword) {
      setClientError(t('emailPasswordRequired'));
      setClientLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/client/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: clientLoginEmail.trim(),
          password: clientLoginPassword,
        }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('eitaxi_client_session', JSON.stringify({
          clientId: data.data.id,
          email: data.data.email,
          name: data.data.name,
          loginTime: new Date().toISOString(),
        }));
        router.push("/cuenta");
      } else {
        setClientError(data.error || t('loginError'));
      }
    } catch {
      setClientError(tCommon('connectionError'));
    } finally {
      setClientLoading(false);
    }
  };

  // ======== CLIENT REGISTER ========
  const handleClientRegister = async () => {
    setClientError(null);
    setClientLoading(true);

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setClientError(t('allFieldsRequired'));
      setClientLoading(false);
      return;
    }

    if (regPassword.length < 6) {
      setClientError(t('passwordMinPlaceholder'));
      setClientLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/client/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim() || null,
          password: regPassword,
        }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('eitaxi_client_session', JSON.stringify({
          clientId: data.data.id,
          email: data.data.email,
          name: data.data.name,
          loginTime: new Date().toISOString(),
        }));
        router.push("/cuenta");
      } else {
        setClientError(data.error || t('registerError'));
      }
    } catch {
      setClientError(tCommon('connectionError'));
    } finally {
      setClientLoading(false);
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
          <div className="text-center mb-6">
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
              {/* Tab Selector */}
              <div className="flex rounded-lg border border-border overflow-hidden mb-6">
                <button
                  onClick={() => { setActiveTab("cliente"); setClientError(null); }}
                  className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    activeTab === "cliente"
                      ? "bg-yellow-400 text-black"
                      : "bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <User className="h-4 w-4" />
                  {t('clientTab')}
                </button>
                <button
                  onClick={() => { setActiveTab("conductor"); setDriverError(null); }}
                  className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    activeTab === "conductor"
                      ? "bg-yellow-400 text-black"
                      : "bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Car className="h-4 w-4" />
                  {t('driverTab')}
                </button>
              </div>

              {/* ==================== CLIENTE TAB ==================== */}
              {activeTab === "cliente" && (
                <motion.div
                  key="cliente"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-center mb-5">
                    <h1 className="text-xl font-bold">
                      {isClientRegister ? t('createAccountTitle') : t('accessAccountTitle')}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                      {isClientRegister
                        ? t('registerClientSubtitle')
                        : t('loginClientSubtitle')}
                    </p>
                  </div>

                  {/* Toggle Login / Register within cliente tab */}
                  <div className="flex rounded-lg border border-border overflow-hidden mb-5">
                    <button
                      onClick={() => { setIsClientRegister(false); setClientError(null); }}
                      className={`flex-1 py-2 text-xs font-medium transition-colors ${
                        !isClientRegister
                          ? "bg-muted text-foreground"
                          : "bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t('loginTabLabel')}
                    </button>
                    <button
                      onClick={() => { setIsClientRegister(true); setClientError(null); }}
                      className={`flex-1 py-2 text-xs font-medium transition-colors ${
                        isClientRegister
                          ? "bg-muted text-foreground"
                          : "bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t('registerTabLabel')}
                    </button>
                  </div>

                  {clientError && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-sm text-red-400 flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        {clientError}
                      </p>
                    </div>
                  )}

                  {/* Client Login Form */}
                  {!isClientRegister && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm mb-1.5 flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-yellow-400" />
                          Email
                        </Label>
                        <div className="relative mt-1.5">
                          <Input
                            type="email"
                            placeholder="tu@email.com"
                            value={clientLoginEmail}
                            onChange={(e) => setClientLoginEmail(e.target.value)}
                            className="bg-card border-border h-12 pl-10"
                            onKeyDown={(e) => e.key === "Enter" && handleClientLogin()}
                            disabled={clientLoading}
                            autoComplete="email"
                          />
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm mb-1.5 flex items-center gap-1.5">
                          <Lock className="h-3.5 w-3.5 text-yellow-400" />
                          {t('password')}
                        </Label>
                        <div className="relative mt-1.5">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder={t('passwordPlaceholderText')}
                            value={clientLoginPassword}
                            onChange={(e) => setClientLoginPassword(e.target.value)}
                            className="bg-card border-border h-12 pl-10 pr-12"
                            onKeyDown={(e) => e.key === "Enter" && handleClientLogin()}
                            disabled={clientLoading}
                            autoComplete="current-password"
                          />
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <Button
                        className="w-full h-12 bg-yellow-400 text-black hover:bg-yellow-500 text-base font-semibold"
                        onClick={handleClientLogin}
                        disabled={clientLoading}
                      >
                        {clientLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowRight className="mr-2 h-4 w-4" />
                        )}
                        {t('accessButton')}
                      </Button>
                    </div>
                  )}

                  {/* Client Register Form */}
                  {isClientRegister && (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm mb-1.5 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-yellow-400" />
                          {t('fullName')} *
                        </Label>
                        <Input
                          placeholder={t('fullNamePlaceholder')}
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="bg-card border-border h-12"
                          disabled={clientLoading}
                        />
                      </div>
                      <div>
                        <Label className="text-sm mb-1.5 flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-yellow-400" />
                          Email *
                        </Label>
                        <Input
                          type="email"
                          placeholder="tu@email.com"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="bg-card border-border h-12"
                          disabled={clientLoading}
                        />
                      </div>
                      <div>
                        <Label className="text-sm mb-1.5 flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-yellow-400" />
                          {t('phoneLabel')}
                        </Label>
                        <Input
                          type="tel"
                          placeholder="+41 76 123 45 67"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          className="bg-card border-border h-12"
                          disabled={clientLoading}
                        />
                      </div>
                      <div>
                        <Label className="text-sm mb-1.5 flex items-center gap-1.5">
                          <Lock className="h-3.5 w-3.5 text-yellow-400" />
                          {t('passwordLabel')} *
                        </Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder={t('passwordMinPlaceholder')}
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            className="bg-card border-border h-12 pr-12"
                            onKeyDown={(e) => e.key === "Enter" && handleClientRegister()}
                            disabled={clientLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <Button
                        className="w-full h-12 bg-yellow-400 text-black hover:bg-yellow-500 text-base font-semibold"
                        onClick={handleClientRegister}
                        disabled={clientLoading}
                      >
                        {clientLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        {t('createButton')}
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ==================== CONDUCTOR TAB ==================== */}
              {activeTab === "conductor" && (
                <motion.div
                  key="conductor"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-center mb-5">
                    <h1 className="text-xl font-bold">
                      {t('title')}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                      {t('subtitle')}
                    </p>
                  </div>

                  {driverError && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-sm text-red-400 flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        {driverError}
                      </p>
                    </div>
                  )}

                  <form onSubmit={handleDriverLogin} className="space-y-4">
                    <div>
                      <Label className="text-sm mb-1.5 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-yellow-400" />
                        {t('email')}
                      </Label>
                      <div className="relative mt-1.5">
                        <Input
                          type="email"
                          placeholder={t('emailPlaceholder')}
                          value={driverEmail}
                          onChange={(e) => {
                            const value = e.target.value;
                            setDriverEmail(value);

                            const specialChars = /[ñçáéíóúàèìòùâêîôûäëïöü]/i;
                            if (specialChars.test(value)) {
                              setEmailCharError(t('emailCharError'));
                            } else {
                              setEmailCharError(null);
                            }
                          }}
                          className={`bg-card border-border h-12 pl-10 ${emailCharError ? 'border-red-500 focus-visible:ring-red-500 ring-2 ring-red-500/20' : ''}`}
                          disabled={driverLoading}
                          autoComplete="email"
                        />
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                      {emailCharError && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {emailCharError}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm mb-1.5 flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-yellow-400" />
                        {t('password')}
                      </Label>
                      <div className="relative mt-1.5">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder={t('passwordPlaceholder')}
                          value={driverPassword}
                          onChange={(e) => setDriverPassword(e.target.value)}
                          className="bg-card border-border h-12 pl-10 pr-12"
                          disabled={driverLoading}
                          autoComplete="current-password"
                        />
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 bg-yellow-400 text-black hover:bg-yellow-500 text-base font-semibold"
                      disabled={driverLoading}
                    >
                      {driverLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="mr-2 h-4 w-4" />
                      )}
                      {t('loginButton')}
                    </Button>
                  </form>

                  <div className="mt-5 pt-5 border-t border-border text-center">
                    <p className="text-muted-foreground text-sm mb-3">
                      {t('noAccount')}
                    </p>
                    <Link href="/registrarse">
                      <Button variant="outline" className="w-full">
                        {t('createAccount')}
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Back to home */}
          <div className="mt-5 text-center">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backToHome')}
            </Link>
          </div>

          {/* Demo credentials hint - only show in development */}
          {process.env.NODE_ENV === 'development' && activeTab === "conductor" && (
            <div className="mt-5 p-4 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
              <p className="text-sm text-center text-yellow-400">
                <strong>{t('demoCredentials')}</strong><br />
                Email: paco@taxizone.ch<br />
                {t('demoPassword')} demo123456
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </SessionGuard>
  );
}
