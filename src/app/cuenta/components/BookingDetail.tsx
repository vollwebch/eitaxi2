"use client";

import {
  MapPin,
  Clock,
  User,
  Phone,
  Calendar,
  Hash,
  FileText,
  Car,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface BookingItem {
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
  stops?: Array<{
    id: string;
    stopOrder: number;
    address: string;
    latitude?: number | null;
    longitude?: number | null;
  }>;
  driver: {
    id: string;
    name: string;
    phone: string;
    imageUrl?: string | null;
    vehicleBrand?: string | null;
    vehicleModel?: string | null;
    vehicleType?: string;
    vehicleColor?: string | null;
    vehiclePlate?: string | null;
  };
}

const STATUS_CONFIG: Record<string, { dot: string; text: string }> = {
  pending: { dot: "bg-yellow-400", text: "text-yellow-400" },
  confirmed: { dot: "bg-blue-400", text: "text-blue-400" },
  in_progress: { dot: "bg-blue-400", text: "text-blue-400" },
  completed: { dot: "bg-green-400", text: "text-green-400" },
  cancelled: { dot: "bg-red-400", text: "text-red-400" },
};

interface BookingDetailProps {
  booking: BookingItem;
}

function BookingStopItem({ stop, t }: { stop: { stopOrder: number; address: string }; t: (key: string, vars?: Record<string, string>) => string }) {
  return (
    <div className="flex items-start gap-2">
      <MapPin className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{t("stop", { number: stop.stopOrder })}</p>
        <p className="text-sm font-medium">{stop.address}</p>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BookingDetail({ booking }: BookingDetailProps) {
  const t = useTranslations("client.bookingDetail");
  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
  const statusLabels: Record<string, string> = {
    pending: t("statuses.pending"),
    confirmed: t("statuses.confirmed"),
    in_progress: t("statuses.in_progress"),
    completed: t("statuses.completed"),
    cancelled: t("statuses.cancelled"),
  };
  const statusLabel = statusLabels[booking.status] || statusLabels.pending;

  return (
    <div className="px-4 pb-4 pt-3 space-y-4 border-t border-border">
      {/* Status banner */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border">
        <div className={`w-2.5 h-2.5 rounded-full ${statusConfig.dot} flex-shrink-0`} />
        <span className={`text-sm font-semibold ${statusConfig.text}`}>
          {statusLabel}
        </span>
      </div>

      {/* Reference */}
      <div className="flex items-center gap-2">
        <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm">
          <span className="text-muted-foreground">{t("reference")}:</span>{" "}
          <span className="text-yellow-400 font-mono font-semibold">
            {booking.reference.toUpperCase()}
          </span>
        </span>
      </div>

      {/* Route details */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("fullRoute")}
        </p>
        <div className="bg-background/50 rounded-lg p-3 space-y-3">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{t("pickup")}</p>
              <p className="text-sm font-medium">{booking.pickupAddress}</p>
            </div>
          </div>
          <div className="border-l-2 border-dashed border-border ml-2 h-3" />
          {booking.stops && booking.stops.length > 0 && booking.stops.map((stop) => (
            <BookingStopItem key={stop.id} stop={stop} t={t} />
          ))}
          {booking.stops && booking.stops.length > 0 && (
            <div className="border-l-2 border-dashed border-border ml-2 h-3" />
          )}
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{t("destination")}</p>
              <p className="text-sm font-medium">
                {booking.dropoffAddress || t("notSpecified")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-2 gap-3">
        {(booking.scheduledDate || booking.scheduledTime) && (
          <div className="flex items-center gap-2 bg-background/50 rounded-lg p-3">
            <Calendar className="h-4 w-4 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{t("date")}</p>
              <p className="text-sm font-medium">
                {booking.scheduledDate || "—"}
              </p>
            </div>
          </div>
        )}
        {booking.scheduledTime && (
          <div className="flex items-center gap-2 bg-background/50 rounded-lg p-3">
            <Clock className="h-4 w-4 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{t("time")}</p>
              <p className="text-sm font-medium">{booking.scheduledTime}</p>
            </div>
          </div>
        )}
      </div>

      {/* Passenger Info */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("passengerInfo")}
        </p>
        <div className="bg-background/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm">{booking.customerName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm">{booking.customerPhone || t("notProvided")}</span>
          </div>
          {booking.passengerCount && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm">{t("passengers", { count: booking.passengerCount })}</span>
            </div>
          )}
          {booking.luggageCount && (
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm">{t("luggage", { count: booking.luggageCount })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Driver Info */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("driver")}
        </p>
        <div className="flex items-center gap-3 bg-background/50 rounded-lg p-3">
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
            <p className="text-xs text-muted-foreground">
              {[
                booking.driver.vehicleBrand,
                booking.driver.vehicleModel,
                booking.driver.vehicleColor,
              ]
                .filter(Boolean)
                .join(" ") || "Taxi"}
            </p>
            {booking.driver.vehiclePlate && (
              <p className="text-xs text-muted-foreground font-mono">
                {booking.driver.vehiclePlate}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Price */}
      {booking.estimatedPrice && (
        <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">{t("estimatedPrice")}</p>
          <p className="text-2xl font-bold text-yellow-400">
            {booking.estimatedPrice} <span className="text-base">CHF</span>
          </p>
        </div>
      )}

      {/* Notes */}
      {booking.notes && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t("notes")}
          </p>
          <div className="flex items-start gap-2 bg-background/50 rounded-lg p-3">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">{booking.notes}</p>
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="space-y-1.5 pt-2">
        <p className="text-xs text-muted-foreground">
          <span className="text-muted-foreground/70">{t("created")}:</span>{" "}
          {formatDate(booking.createdAt)}
        </p>
        {booking.updatedAt && (
          <p className="text-xs text-muted-foreground">
            <span className="text-muted-foreground/70">{t("updated")}:</span>{" "}
            {formatDate(booking.updatedAt)}
          </p>
        )}
      </div>
    </div>
  );
}

export { STATUS_CONFIG };
export type { BookingItem };
