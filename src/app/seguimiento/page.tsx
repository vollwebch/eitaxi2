"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  MapPin,
  Clock,
  Calendar,
  Users,
  Luggage,
  FileText,
  Phone,
  MessageCircle,
  Car,
  User,
  ArrowLeft,
  BadgeCheck,
  Hash,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  pending: { color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30" },
  confirmed: { color: "text-green-400", bg: "bg-green-400/10 border-green-400/30" },
  in_progress: { color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30" },
  completed: { color: "text-green-400", bg: "bg-green-400/10 border-green-400/30" },
  cancelled: { color: "text-red-400", bg: "bg-red-400/10 border-red-400/30" },
};

interface BookingData {
  id: string;
  reference: string;
  status: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  dropoffAddress?: string | null;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  estimatedPrice?: number | null;
  notes?: string | null;
  passengerCount?: number | null;
  luggageCount?: number | null;
  createdAt: string;
  updatedAt?: string | null;
  driver: {
    id: string;
    name: string;
    phone: string;
    whatsapp?: string | null;
    imageUrl?: string | null;
  };
}

export default function SeguimientoPage() {
  const t = useTranslations("tracking");
  const tHeader = useTranslations("header");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [error, setError] = useState("");

  // Check if we have a reference in URL params
  const urlRef = searchParams.get("ref");

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const ref = (reference || urlRef || "").trim();
    if (!ref) return;

    setLoading(true);
    setError("");
    setBooking(null);

    try {
      const res = await fetch(`/api/bookings?reference=${encodeURIComponent(ref)}`);
      if (!res.ok) {
        setError(t("notFound"));
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (!data.success || !data.data) {
        setError(t("notFound"));
      } else {
        setBooking(data.data);
      }
    } catch {
      setError(t("notFound"));
    }
    setLoading(false);
  };

  // Auto-search if ref in URL
  useState(() => {
    if (urlRef) {
      setReference(urlRef);
      // Trigger search
      setTimeout(() => {
        const ref = urlRef.trim();
        setLoading(true);
        fetch(`/api/bookings?reference=${encodeURIComponent(ref)}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.data) setBooking(data.data);
            else setError(t("notFound"));
          })
          .catch(() => setError(t("notFound")))
          .finally(() => setLoading(false));
      }, 100);
    }
  });

  const statusConfig = booking ? (STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending) : null;
  const statusLabel = booking ? t(`statuses.${booking.status}` as any) : "";

  return (
    <div className="min-h-screen flex flex-col bg-background">
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

            <div className="flex items-center gap-1 sm:gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-sm gap-1">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{tHeader("loginButton")}</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center py-12 px-4">
        <div className="w-full max-w-lg">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-400/10 mb-4">
              <Search className="h-8 w-8 text-yellow-400" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>

          {/* Search form */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={t("placeholder")}
                  className="w-full h-12 pl-11 pr-4 rounded-lg bg-card border border-border text-sm focus:border-yellow-400 focus:ring-yellow-400/20 outline-none transition-all"
                  disabled={loading}
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !reference.trim()}
                className="h-12 px-6 bg-yellow-400 text-black hover:bg-yellow-500 font-medium"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    {t("searching")}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    {t("searchButton")}
                  </span>
                )}
              </Button>
            </div>
          </form>

          {/* Error */}
          {error && (
            <Card className="border-red-400/30 bg-red-400/5">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-400/10 mb-3">
                  <Search className="h-6 w-6 text-red-400" />
                </div>
                <p className="font-medium text-red-400 mb-1">{error}</p>
                <p className="text-sm text-muted-foreground">{t("notFoundHint")}</p>
              </CardContent>
            </Card>
          )}

          {/* Booking result */}
          {booking && (
            <Card className="overflow-hidden">
              {/* Status banner */}
              {statusConfig && (
                <div className={`flex items-center gap-2 px-6 py-3 ${statusConfig.bg} border-b border-border`}>
                  <BadgeCheck className={`h-5 w-5 ${statusConfig.color}`} />
                  <span className={`font-semibold ${statusConfig.color}`}>{statusLabel}</span>
                </div>
              )}

              <CardContent className="p-6 space-y-5">
                {/* Reference */}
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                  <span className="text-sm">
                    <span className="text-muted-foreground">{t("reference")}:</span>{" "}
                    <span className="text-yellow-400 font-mono font-bold text-base">
                      {booking.reference.toUpperCase()}
                    </span>
                  </span>
                </div>

                {/* Driver info */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border">
                  {booking.driver.imageUrl ? (
                    <img
                      src={booking.driver.imageUrl}
                      alt={booking.driver.name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-yellow-400/20 flex items-center justify-center flex-shrink-0">
                      <Car className="h-6 w-6 text-yellow-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{booking.driver.name}</p>
                    <p className="text-xs text-muted-foreground">{t("driver")}</p>
                  </div>
                  <div className="flex gap-2">
                    <a href={`tel:${booking.driver.phone}`}>
                      <Button variant="ghost" size="icon" className="h-9 w-9">
                        <Phone className="h-4 w-4 text-green-400" />
                      </Button>
                    </a>
                    {booking.driver.whatsapp && (
                      <a
                        href={`https://wa.me/${booking.driver.whatsapp.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                          <MessageCircle className="h-4 w-4 text-green-500" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>

                {/* Route */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Ruta
                  </p>
                  <div className="bg-background/50 rounded-lg p-3 space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t("pickup")}</p>
                        <p className="text-sm font-medium">{booking.pickupAddress}</p>
                      </div>
                    </div>
                    {booking.dropoffAddress && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">{t("dropoff")}</p>
                          <p className="text-sm font-medium">{booking.dropoffAddress}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3">
                  {booking.scheduledDate && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border border-border">
                      <Calendar className="h-4 w-4 text-blue-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t("date")}</p>
                        <p className="text-sm font-medium">{booking.scheduledDate}</p>
                      </div>
                    </div>
                  )}
                  {booking.scheduledTime && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border border-border">
                      <Clock className="h-4 w-4 text-purple-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t("time")}</p>
                        <p className="text-sm font-medium">{booking.scheduledTime}</p>
                      </div>
                    </div>
                  )}
                  {booking.estimatedPrice && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border border-border">
                      <span className="text-lg flex-shrink-0">CHF</span>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("price")}</p>
                        <p className="text-sm font-bold">{booking.estimatedPrice}</p>
                      </div>
                    </div>
                  )}
                  {booking.passengerCount && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border border-border">
                      <Users className="h-4 w-4 text-orange-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t("passengers")}</p>
                        <p className="text-sm font-medium">{booking.passengerCount}</p>
                      </div>
                    </div>
                  )}
                  {booking.luggageCount && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border border-border">
                      <Luggage className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t("luggage")}</p>
                        <p className="text-sm font-medium">{booking.luggageCount}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {booking.notes && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t("notes")}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">{booking.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Back link */}
          <div className="text-center mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("backToHome")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
