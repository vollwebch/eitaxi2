"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Car,
  CheckCircle,
  XCircle,
  DollarSign,
  Star,
  Calendar,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Statistics {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  pendingBookings: number;
  totalSpent: number;
  favoriteDriver: {
    name: string;
    imageUrl?: string | null;
  } | null;
  lastBooking: string | null;
}

export default function StatisticsTab() {
  const t = useTranslations('client.statistics');
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/client/statistics");
      const data = await res.json();
      if (data.success && data.data) {
        setStats(data.data);
      } else {
        setError(t('loadError'));
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError(t('connectionError'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 px-4">
        <p className="text-muted-foreground mb-4">{error}</p>
        <button
          onClick={fetchStats}
          className="text-sm text-yellow-400 hover:text-yellow-300 underline"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: t('totalTrips'),
      value: stats.totalBookings,
      icon: TrendingUp,
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/10",
      borderColor: "border-yellow-400/20",
    },
    {
      label: t('completed'),
      value: stats.completedBookings,
      icon: CheckCircle,
      color: "text-green-400",
      bgColor: "bg-green-400/10",
      borderColor: "border-green-400/20",
    },
    {
      label: t('cancelled'),
      value: stats.cancelledBookings,
      icon: XCircle,
      color: "text-red-400",
      bgColor: "bg-red-400/10",
      borderColor: "border-red-400/20",
    },
    {
      label: t('pending'),
      value: stats.pendingBookings,
      icon: Car,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
      borderColor: "border-blue-400/20",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Main stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            className={`border ${stat.borderColor} bg-card overflow-hidden`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Total spent - full width */}
      <Card className="border-yellow-400/20 bg-gradient-to-r from-yellow-400/5 to-yellow-400/10 border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-yellow-400/20">
              <DollarSign className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('totalSpent')}</p>
              <p className="text-2xl font-bold text-yellow-400">
                {stats.totalSpent.toFixed(2)}{" "}
                <span className="text-base font-medium">CHF</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Favorite driver & last booking */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Favorite driver */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              <p className="text-xs text-muted-foreground font-medium">
                {t('favoriteDriver')}
              </p>
            </div>
            {stats.favoriteDriver ? (
              <div className="flex items-center gap-3">
                {stats.favoriteDriver.imageUrl ? (
                  <img
                    src={stats.favoriteDriver.imageUrl}
                    alt={stats.favoriteDriver.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center">
                    <Car className="h-5 w-5 text-yellow-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-white truncate">
                    {stats.favoriteDriver.name}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('noFavorite')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Last booking */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-yellow-400" />
              <p className="text-xs text-muted-foreground font-medium">
                {t('lastBooking')}
              </p>
            </div>
            {stats.lastBooking ? (
              <div>
                <p className="font-semibold text-sm text-white">
                  {new Date(stats.lastBooking).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(stats.lastBooking).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('noBookings')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
