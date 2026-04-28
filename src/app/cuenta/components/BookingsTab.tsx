"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Car,
  Calendar,
  MapPin,
  Clock,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  XCircle,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import BookingDetail, { STATUS_CONFIG, type BookingItem } from "./BookingDetail";
import BookingChat from "./BookingChat";

interface BookingsTabProps {
  bookings: BookingItem[];
  loading: boolean;
  onRefresh: () => void;
  onCancelBooking: (id: string) => Promise<boolean>;
  onDeleteBooking?: (id: string) => Promise<boolean>;
  autoExpandBookingId?: string | null;
  autoOpenChat?: boolean;
}

export default function BookingsTab({
  bookings,
  loading,
  onRefresh,
  onCancelBooking,
  onDeleteBooking,
  autoExpandBookingId,
  autoOpenChat,
}: BookingsTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const t = useTranslations('client');
  const td = useTranslations('client.bookingDetail');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatBooking, setChatBooking] = useState<BookingItem | null>(null);

  const statusLabels: Record<string, string> = {
    pending: td('statuses.pending'),
    confirmed: td('statuses.confirmed'),
    in_progress: td('statuses.in_progress'),
    completed: td('statuses.completed'),
    cancelled: td('statuses.cancelled'),
  };

  // Auto-expand booking when coming from notification link
  useEffect(() => {
    if (autoExpandBookingId) {
      setExpandedId(autoExpandBookingId);
    }
  }, [autoExpandBookingId]);

  // Scroll to expanded booking after bookings have loaded and rendered
  useEffect(() => {
    if (expandedId && bookings.length > 0 && !loading) {
      // Wait for the card to expand and render, then scroll
      const timer = setTimeout(() => {
        const el = document.getElementById(`booking-${expandedId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add highlight effect
          el.classList.add('ring-2', 'ring-yellow-400/70');
          setTimeout(() => {
            el.classList.remove('ring-2', 'ring-yellow-400/70');
          }, 2500);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [expandedId, bookings.length, loading]);

  // Auto-open chat dialog when coming from chat notification
  useEffect(() => {
    if (autoOpenChat && autoExpandBookingId && bookings.length > 0 && !chatOpen) {
      const booking = bookings.find(b => b.id === autoExpandBookingId);
      if (booking) {
        setChatBooking(booking);
        setChatOpen(true);
      }
    }
  }, [autoOpenChat, autoExpandBookingId, bookings]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const openCancelDialog = (id: string) => {
    setCancellingId(id);
    setCancelDialogOpen(true);
  };

  const handleCancel = async () => {
    if (!cancellingId) return;
    const success = await onCancelBooking(cancellingId);
    if (success) {
      setCancelDialogOpen(false);
      setCancellingId(null);
    }
  };

  const openChat = (booking: BookingItem) => {
    setChatBooking(booking);
    setChatOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <Calendar className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <p className="text-muted-foreground mb-1 font-medium">
          {t('noBookings')}
        </p>
        <p className="text-sm text-muted-foreground/60 mb-6">
          {t('noBookingsHint')}
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
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {bookings.length} {t('bookings')}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {t('refresh')}
        </Button>
      </div>

      <div className="space-y-3">
        {bookings.map((booking) => {
          const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
          const isExpanded = expandedId === booking.id;

          return (
            <Card
              key={booking.id}
              id={`booking-${booking.id}`}
              className="border-border bg-card overflow-hidden transition-all"
            >
              <CardContent className="p-0">
                {/* Clickable header area */}
                <div
                  className="cursor-pointer"
                  onClick={() => toggleExpand(booking.id)}
                >
                  {/* Top: Status + Reference */}
                  <div className="flex items-center justify-between p-4 pb-2">
                    <span className="text-xs text-muted-foreground font-mono">
                      {booking.reference.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${statusConfig.dot} flex-shrink-0`} />
                        <span className={`text-xs font-semibold ${statusConfig.text}`}>
                          {statusLabels[booking.status] || statusLabels.pending}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Driver info */}
                  <div className="px-4 pb-2 flex items-center gap-3">
                    {booking.driver.imageUrl ? (
                      <img
                        src={booking.driver.imageUrl}
                        alt={booking.driver.name}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center flex-shrink-0">
                        <Car className="h-5 w-5 text-yellow-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate text-white">
                        {booking.driver.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[
                          booking.driver.vehicleBrand,
                          booking.driver.vehicleModel,
                        ]
                          .filter(Boolean)
                          .join(" ") || "Taxi"}
                      </p>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="px-4 pb-2 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground truncate">
                        {booking.pickupAddress}
                      </p>
                    </div>
                    {booking.dropoffAddress && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground truncate">
                          {booking.dropoffAddress}
                        </p>
                      </div>
                    )}
                    {booking.stops && booking.stops.length > 0 && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-blue-400 truncate">
                          +{booking.stops.length} {td('intermediateStops')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Date/Time/Price */}
                  <div className="px-4 pb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {(booking.scheduledDate || booking.scheduledTime) && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {booking.scheduledDate && booking.scheduledTime
                          ? `${booking.scheduledDate} ${booking.scheduledTime}`
                          : booking.scheduledDate || booking.scheduledTime}
                      </span>
                    )}
                    {booking.estimatedPrice && (
                      <span className="flex items-center gap-1 font-semibold text-yellow-400 ml-auto">
                        ~{booking.estimatedPrice} CHF
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="px-4 pb-3 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openChat(booking);
                      }}
                      className="w-full gap-1.5 text-xs border-border hover:bg-yellow-400/10 hover:text-yellow-400 hover:border-yellow-400/30"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      {t('chat')}
                    </Button>
                    {(booking as any).unreadMessages > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                        {(booking as any).unreadMessages > 9 ? '9+' : (booking as any).unreadMessages}
                      </span>
                    )}
                  </div>
                  {booking.status === "cancelled" && onDeleteBooking && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(t('moveToTrash'))) {
                          onDeleteBooking(booking.id);
                        }
                      }}
                      className="flex-1 gap-1.5 text-xs border-muted-foreground/30 text-muted-foreground hover:bg-muted/50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t('delete')}
                    </Button>
                  )}
                  {booking.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCancelDialog(booking.id);
                      }}
                      className="flex-1 gap-1.5 text-xs border-red-400/30 text-red-400 hover:bg-red-400/10 hover:text-red-300"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      {t('cancel')}
                    </Button>
                  )}
                </div>

                {/* Expanded detail */}
                {isExpanded && <BookingDetail booking={booking} />}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cancel confirmation dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {t('cancelBooking')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {t('cancelConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-muted-foreground hover:bg-muted hover:text-white">
              {t('noKeep')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-red-500 text-white hover:bg-red-600 border-0"
            >
              {t('yesCancel')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Chat dialog */}
      <BookingChat
        bookingId={chatBooking?.id || null}
        bookingRef={chatBooking?.reference}
        driverName={chatBooking?.driver?.name}
        open={chatOpen}
        onOpenChange={setChatOpen}
      />
    </>
  );
}
