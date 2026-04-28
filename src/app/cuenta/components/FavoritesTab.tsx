"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Car,
  Star,
  Phone,
  MapPin,
  Heart,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface FavoriteDriver {
  driverId: string;
  name: string;
  phone?: string | null;
  imageUrl?: string | null;
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  vehicleType?: string;
  city?: string | null;
  rating?: number | null;
}

export default function FavoritesTab() {
  const t = useTranslations('client.favorites');
  const [favorites, setFavorites] = useState<FavoriteDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/client/favorites");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setFavorites(data.data);
      }
    } catch (err) {
      console.error("Error fetching favorites:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const removeFavorite = async (driverId: string) => {
    setRemovingId(driverId);
    try {
      const res = await fetch(`/api/client/favorites/${driverId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setFavorites((prev) => prev.filter((f) => f.driverId !== driverId));
      }
    } catch (err) {
      console.error("Error removing favorite:", err);
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <Heart className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <p className="text-muted-foreground mb-1 font-medium">
          {t('empty')}
        </p>
        <p className="text-sm text-muted-foreground/60 mb-6">
          {t('emptyHint')}
        </p>
        <Link href="/">
          <Button className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold">
            {t('searchTaxi')}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">
          {t('count', { count: favorites.length })}
        </p>
        <Link href="/">
          <Button
            variant="ghost"
            size="sm"
            className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 gap-1.5"
          >
            <Car className="h-3.5 w-3.5" />
            {t('searchTaxi')}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {favorites.map((fav) => (
          <Card key={fav.driverId} className="border-border bg-card overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Driver photo */}
                {fav.imageUrl ? (
                  <img
                    src={fav.imageUrl}
                    alt={fav.name}
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-yellow-400/20 flex items-center justify-center flex-shrink-0">
                    <Car className="h-7 w-7 text-yellow-400" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{fav.name}</p>

                  <div className="flex items-center gap-1.5 mt-0.5">
                    {fav.rating !== null && fav.rating !== undefined && (
                      <span className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-muted-foreground">
                          {fav.rating.toFixed(1)}
                        </span>
                      </span>
                    )}
                    {[
                      fav.vehicleBrand,
                      fav.vehicleModel,
                    ]
                      .filter(Boolean)
                      .join(" ") && (
                      <span className="text-xs text-muted-foreground">
                        ·{" "}
                        {[
                          fav.vehicleBrand,
                          fav.vehicleModel,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      </span>
                    )}
                  </div>

                  {fav.city && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 text-muted-foreground/60" />
                      <span className="text-xs text-muted-foreground">
                        {fav.city}
                      </span>
                    </div>
                  )}

                  {fav.phone && (
                    <div className="flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3 text-muted-foreground/60" />
                      <a
                        href={`tel:${fav.phone}`}
                        className="text-xs text-yellow-400 hover:text-yellow-300"
                      >
                        {fav.phone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Remove button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFavorite(fav.driverId)}
                  disabled={removingId === fav.driverId}
                  className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10 flex-shrink-0"
                >
                  {removingId === fav.driverId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
