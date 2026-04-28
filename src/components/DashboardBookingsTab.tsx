"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  CalendarDays,
  Phone,
  MapPin,
  Clock,
  Users,
  Check,
  X,
  MessageCircle,
  Send,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  User,
  Ban,
  Trash2,
  Languages,
} from "lucide-react";
import { useAppLocale } from "@/hooks/useLocale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

interface Booking {
  id: string;
  reference: string;
  status: string;
  customerName: string;
  customerPhone: string;
  passengerCount: number;
  pickupAddress: string;
  dropoffAddress: string | null;
  scheduledDate: string | null;
  scheduledTime: string | null;
  notes: string | null;
  estimatedPrice: number | null;
  createdAt: string;
  _count?: { messages: number };
  stops?: Array<{
    id: string;
    stopOrder: number;
    address: string;
  }>;
}

interface Message {
  id: string;
  bookingId: string;
  sender: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface DashboardBookingsTabProps {
  driverId: string;
  autoExpandBookingId?: string | null;
}

function formatRelativeDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return locale === 'de' ? 'Gerade eben' : locale === 'en' ? 'Just now' : locale === 'fr' ? 'A l\'instant' : locale === 'it' ? 'Adesso' : locale === 'pt' ? 'Agora mesmo' : 'Ahora mismo';
  if (diffMin < 60) return locale === 'de' ? `Vor ${diffMin} Min` : locale === 'en' ? `${diffMin}m ago` : locale === 'fr' ? `Il y a ${diffMin} min` : locale === 'it' ? `${diffMin} min fa` : locale === 'pt' ? `${diffMin} min atr\u00e1s` : `Hace ${diffMin} min`;
  if (diffH < 24) return locale === 'de' ? `Vor ${diffH}Std` : locale === 'en' ? `${diffH}h ago` : locale === 'fr' ? `Il y a ${diffH}h` : locale === 'it' ? `${diffH}h fa` : locale === 'pt' ? `${diffH}h atr\u00e1s` : `Hace ${diffH}h`;
  if (diffD < 7) return locale === 'de' ? `Vor ${diffD}T` : locale === 'en' ? `${diffD}d ago` : locale === 'fr' ? `Il y a ${diffD}j` : locale === 'it' ? `${diffD}g fa` : locale === 'pt' ? `${diffD}d atr\u00e1s` : `Hace ${diffD}d`;
  return date.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

function formatDate(dateStr: string | null, locale: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const tb = useTranslations("dashboard");
  const colors: Record<string, { dot: string; text: string }> = {
    pending: { dot: "bg-yellow-400", text: "text-yellow-400" },
    confirmed: { dot: "bg-blue-400", text: "text-blue-400" },
    in_progress: { dot: "bg-blue-400", text: "text-blue-400" },
    completed: { dot: "bg-green-400", text: "text-green-400" },
    cancelled: { dot: "bg-red-400", text: "text-red-400" },
  };
  const labels: Record<string, string> = {
    pending: tb('bookings.statuses.pending'),
    confirmed: tb('bookings.statuses.confirmed'),
    in_progress: tb('bookings.statuses.in_progress'),
    completed: tb('bookings.statuses.completed'),
    cancelled: tb('bookings.statuses.cancelled'),
  };
  const c = colors[status] || colors.pending;
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <div className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
      <span className={`text-xs font-semibold ${c.text}`}>
        {labels[status] || status}
      </span>
    </div>
  );
}

function BookingChat({
  bookingId,
  bookingRef,
}: {
  bookingId: string;
  bookingRef: string;
}) {
  const { locale } = useAppLocale();
  const tc = useTranslations("dashboard");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);

  const translateMessage = async (msgId: string, text: string) => {
    if (translations[msgId]) {
      const updated = { ...translations };
      delete updated[msgId];
      setTranslations(updated);
      return;
    }
    setTranslatingId(msgId);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang: locale }),
      });
      const data = await res.json();
      if (data.success && data.data?.translation) {
        setTranslations(prev => ({ ...prev, [msgId]: data.data.translation }));
      }
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setTranslatingId(null);
    }
  };

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/chat?bookingId=${bookingId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch {
      // silencio
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchMessages();
    // Polling cada 15s para mensajes nuevos
    const interval = setInterval(fetchMessages, 15000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          content: newMessage.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewMessage("");
        fetchMessages();
      }
    } catch {
      // silencio
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border border-border rounded-lg mt-3 bg-muted/20">
      <div className="p-2 border-b border-border flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-yellow-400" />
        <span className="text-xs font-medium">
          {tc('bookings.chat')} · {bookingRef}
        </span>
        <Badge variant="secondary" className="text-[10px] ml-auto">
          {messages.length} {tc('bookings.messageCount', { count: messages.length })}
        </Badge>
      </div>

      {/* Messages area */}
      <div className="h-48 overflow-y-auto p-3 space-y-2">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center mt-8">
            {tc('bookings.noMessagesYet')}
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === "driver" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-1.5 text-sm ${
                  msg.sender === "driver"
                    ? "bg-yellow-400/20 text-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="text-[10px] text-muted-foreground mb-0.5">
                  {msg.sender === "driver" ? tc('chat.you') : tc('bookings.client')} ·{" "}
                  {new Date(msg.createdAt).toLocaleTimeString(locale, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p>{msg.content}</p>
                <button
                  onClick={() => translateMessage(msg.id, msg.content)}
                  disabled={translatingId === msg.id}
                  className={`mt-1 flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors ${
                    translations[msg.id] ? 'text-muted-foreground font-semibold' : ''
                  }`}
                  title={translations[msg.id] ? tc('chat.hideTranslation') : tc('chat.translate')}
                >
                  {translatingId === msg.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Languages className="h-3 w-3" />
                  )}
                  {translations[msg.id] ? tc('chat.hide') : tc('chat.translate')}
                </button>
                {translations[msg.id] && (
                  <div className="mt-1 pt-1 border-t border-border">
                    <p className="text-xs italic text-muted-foreground">{translations[msg.id]}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t border-border flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder={tc('chat.writeMessage')}
          className="h-8 text-sm bg-background border-border"
          disabled={sending}
        />
        <Button
          size="icon"
          className="h-8 w-8 bg-yellow-400 text-black hover:bg-yellow-500"
          onClick={sendMessage}
          disabled={sending || !newMessage.trim()}
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

export default function DashboardBookingsTab({ driverId, autoExpandBookingId }: DashboardBookingsTabProps) {
  const t = useTranslations("dashboard");
  const { locale } = useAppLocale();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [showChatFor, setShowChatFor] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch(`/api/bookings?driverId=${driverId}`);
      const data = await res.json();
      if (data.success) {
        setBookings(data.data);
        setPendingCount(data.data.filter((b: Booking) => b.status === "pending").length);
        setError(null);
      } else {
        setError(data.error || t('bookings.errorLoad'));
      }
    } catch {
      setError(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    fetchBookings();
    // Polling cada 30s para nuevas reservas
    const interval = setInterval(fetchBookings, 30000);
    return () => clearInterval(interval);
  }, [fetchBookings]);

  // Auto-expandir reserva cuando viene desde el tab de Chat
  useEffect(() => {
    if (autoExpandBookingId) {
      setExpandedBooking(autoExpandBookingId);
      setShowChatFor(null);
    }
  }, [autoExpandBookingId]);

  // Scroll to expanded booking after bookings have loaded and rendered
  useEffect(() => {
    if (expandedBooking && bookings.length > 0 && !loading) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`driver-booking-${expandedBooking}`);
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
  }, [expandedBooking, bookings.length, loading]);

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    setActionLoading(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchBookings();
      }
    } catch {
      // silencio
    } finally {
      setActionLoading(null);
    }
  };

  const moveToTrash = async (bookingId: string) => {
    if (!confirm(t('bookings.moveToTrashConfirm'))) return;
    setActionLoading(bookingId);
    try {
      const res = await fetch('/api/trash', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, action: 'soft_delete' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchBookings();
      }
    } catch {
      // silencio
    } finally {
      setActionLoading(null);
    }
  };

  const toggleExpand = (bookingId: string) => {
    setExpandedBooking(expandedBooking === bookingId ? null : bookingId);
    setShowChatFor(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
        <span className="ml-2 text-muted-foreground">{t('bookings.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-yellow-400" />
          {t('bookings.title')}
          {pendingCount > 0 && (
            <Badge className="bg-red-500 text-white hover:bg-red-600 ml-1">
              {t('bookings.pendingCount', { count: pendingCount })}
            </Badge>
          )}
        </h3>
        <Button variant="outline" size="sm" onClick={fetchBookings} disabled={loading}>
          <Loader2 className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
          {t('chat.refresh')}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <CalendarDays className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">{t('bookings.noBookings')}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {t('bookings.noBookingsHint')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Card
              key={booking.id}
              id={`driver-booking-${booking.id}`}
              className="border-border bg-card overflow-hidden"
            >
              {/* Booking header row */}
              <div
                className="p-4 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => toggleExpand(booking.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusBadge status={booking.status} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-sm truncate">
                          {booking.customerName}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {booking.reference} · {formatRelativeDate(booking.createdAt, locale)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {booking.estimatedPrice && (
                      <span className="text-sm font-bold text-yellow-400">
                        {booking.estimatedPrice.toFixed(0)} CHF
                      </span>
                    )}
                    {expandedBooking === booking.id ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {expandedBooking === booking.id && (
                <div className="px-4 pb-4 space-y-3">
                  {/* Route */}
                  <div className="flex items-start gap-2 p-3 bg-muted/20 rounded-lg">
                    <div className="flex flex-col items-center gap-0.5 mt-1">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <div className="w-0.5 h-6 bg-border" />
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground">{t('bookings.pickup')}</p>
                        <p className="text-sm font-medium">{booking.pickupAddress}</p>
                      </div>
                      {booking.dropoffAddress && (
                        <div>
                          <p className="text-[10px] text-muted-foreground">{t('bookings.destination')}</p>
                          <p className="text-sm font-medium">{booking.dropoffAddress}</p>
                        </div>
                      )}
                      {booking.stops && booking.stops.length > 0 && (
                        <div className="pt-2 border-t border-border">
                          <p className="text-[10px] text-muted-foreground font-medium">{t('bookings.intermediateStops')}</p>
                          {booking.stops.map((stop) => (
                            <p key={stop.id} className="text-sm font-medium text-blue-400">
                              {stop.stopOrder}. {stop.address}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      <a href={`tel:${booking.customerPhone}`} className="hover:text-foreground transition-colors">
                        {booking.customerPhone}
                      </a>
                    </div>
                    {booking.scheduledDate && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>{formatDate(booking.scheduledDate, locale)}</span>
                      </div>
                    )}
                    {booking.scheduledTime && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{booking.scheduledTime}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span>{t('bookings.passengers', { count: booking.passengerCount })}</span>
                    </div>
                  </div>

                  {booking.notes && (
                    <p className="text-sm text-muted-foreground bg-muted/10 rounded p-2">
                      {booking.notes}
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    {booking.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 text-white hover:bg-green-700"
                          onClick={() => updateBookingStatus(booking.id, "confirmed")}
                          disabled={actionLoading === booking.id}
                        >
                          {actionLoading === booking.id ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5 mr-1" />
                          )}
                          {t('bookings.confirm')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-400/30 text-red-400 hover:bg-red-400/10"
                          onClick={() => updateBookingStatus(booking.id, "cancelled")}
                          disabled={actionLoading === booking.id}
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          {t('bookings.reject')}
                        </Button>
                      </>
                    )}
                    {booking.status === "confirmed" && (
                      <Button
                        size="sm"
                        className="bg-green-600 text-white hover:bg-green-700"
                        onClick={() => updateBookingStatus(booking.id, "completed")}
                        disabled={actionLoading === booking.id}
                      >
                        {actionLoading === booking.id ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5 mr-1" />
                        )}
                        {t('bookings.complete')}
                      </Button>
                    )}
                    {booking.status === "cancelled" && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Ban className="h-3 w-3" />
                        {t('bookings.statuses.cancelled')}
                      </Badge>
                    )}
                    {booking.status !== "cancelled" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-400/30 text-blue-400 hover:bg-blue-400/10"
                        onClick={() =>
                          setShowChatFor(showChatFor === booking.id ? null : booking.id)
                        }
                      >
                        <MessageCircle className="h-3.5 w-3.5 mr-1" />
                        {t('bookings.chat')}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10 ml-auto"
                      onClick={() => moveToTrash(booking.id)}
                      disabled={actionLoading === booking.id}
                      title={t('bookings.moveToTrash')}
                    >
                      {actionLoading === booking.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>

                  {/* Inline Chat */}
                  {showChatFor === booking.id && (
                    <BookingChat bookingId={booking.id} bookingRef={booking.reference} />
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
