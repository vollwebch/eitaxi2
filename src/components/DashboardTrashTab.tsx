"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  CalendarDays,
  Phone,
  MapPin,
  Clock,
  Users,
  Loader2,
  User,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from 'next-intl';

interface TrashBooking {
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
  deletedAt: string;
  _count: { messages: number };
}

interface TrashChat {
  id: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  driverDeletedAt: string;
  createdAt: string;
  client: {
    id: string;
    name: string;
  };
  _count: { messages: number };
}

interface DashboardTrashTabProps {
  driverId: string;
}

function formatRelativeDate(dateStr: string, tTime: (key: string, params?: Record<string, unknown>) => string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return tTime('now');
  if (diffMin < 60) return tTime('minutes', { count: diffMin });
  if (diffH < 24) return tTime('hours', { count: diffH });
  if (diffD < 7) return tTime('days', { count: diffD });
  return date.toLocaleDateString("es-CH", { day: "numeric", month: "short" });
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("es-CH", { day: "numeric", month: "short", year: "numeric" });
}

function DaysRemaining({ deletedAt, tTrash }: { deletedAt: string; tTrash: (key: string, params?: Record<string, unknown>) => string }) {
  const deleted = new Date(deletedAt);
  const expiry = new Date(deleted.getTime() + 15 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

  if (daysLeft <= 3) {
    return (
      <span className="text-xs font-medium text-red-400 flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        {tTrash('deletesIn', { days: daysLeft, daysLabel: daysLeft === 1 ? tTrash('day') : tTrash('days') })}
      </span>
    );
  }

  return (
    <span className="text-xs text-muted-foreground">
      {tTrash('deletesIn', { days: daysLeft, daysLabel: tTrash('days') })}
    </span>
  );
}

export default function DashboardTrashTab({ driverId }: DashboardTrashTabProps) {
  const tTrash = useTranslations('client.trash');
  const tCommon = useTranslations('common');
  const tTime = useTranslations('client.timeAgo');
  const [bookings, setBookings] = useState<TrashBooking[]>([]);
  const [chats, setChats] = useState<TrashChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [emptying, setEmptying] = useState(false);
  const [showConfirmEmpty, setShowConfirmEmpty] = useState(false);
  const [activeSection, setActiveSection] = useState<'all' | 'bookings' | 'chats'>('all');

  const fetchTrash = useCallback(async () => {
    try {
      const res = await fetch(`/api/trash?driverId=${driverId}&type=${activeSection}`);
      const data = await res.json();
      if (data.success) {
        setBookings(data.data?.bookings || []);
        setChats(data.data?.chats || []);
      }
    } catch {
      // silencio
    } finally {
      setLoading(false);
    }
  }, [driverId, activeSection]);

  useEffect(() => {
    setLoading(true);
    fetchTrash();
  }, [fetchTrash]);

  const totalItems = bookings.length + chats.length;

  const handleRestore = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      const res = await fetch("/api/trash", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, action: "restore" }),
      });
      const data = await res.json();
      if (data.success) {
        setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      }
    } catch {
      // silencio
    } finally {
      setActionLoading(null);
    }
  };

  const handlePermanentDelete = async (bookingId: string) => {
    if (!confirm(tTrash('deleteConfirm'))) return;
    setActionLoading(bookingId);
    try {
      const res = await fetch("/api/trash", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, action: "permanent_delete" }),
      });
      const data = await res.json();
      if (data.success) {
        setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      }
    } catch {
      // silencio
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestoreChat = async (chatId: string) => {
    setActionLoading(chatId);
    try {
      const res = await fetch("/api/trash", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: chatId, action: "restore" }),
      });
      const data = await res.json();
      if (data.success) {
        setChats((prev) => prev.filter((c) => c.id !== chatId));
      }
    } catch {
      // silencio
    } finally {
      setActionLoading(null);
    }
  };

  const handlePermanentDeleteChat = async (chatId: string) => {
    if (!confirm(tTrash('deleteConfirm'))) return;
    setActionLoading(chatId);
    try {
      const res = await fetch("/api/trash", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: chatId, action: "permanent_delete" }),
      });
      const data = await res.json();
      if (data.success) {
        setChats((prev) => prev.filter((c) => c.id !== chatId));
      }
    } catch {
      // silencio
    } finally {
      setActionLoading(null);
    }
  };

  const handleEmptyTrash = async () => {
    setEmptying(true);
    try {
      // Empty bookings
      await fetch("/api/trash", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "empty_all" }),
      });
      // Empty chats
      await fetch("/api/trash", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "empty_all_chats" }),
      });
      setBookings([]);
      setChats([]);
      setShowConfirmEmpty(false);
    } catch {
      // silencio
    } finally {
      setEmptying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
        <span className="ml-2 text-muted-foreground">{tTrash('loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-yellow-400" />
          {tTrash('title')}
          {totalItems > 0 && (
            <span className="text-sm text-muted-foreground font-normal">
              ({totalItems})
            </span>
          )}
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchTrash} disabled={loading}>
            <Loader2 className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
            {tTrash('refresh')}
          </Button>
          {totalItems > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="border-red-400/30 text-red-400 hover:bg-red-400/10"
              onClick={() => setShowConfirmEmpty(true)}
              disabled={emptying}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              {tTrash('emptyTrash')}
            </Button>
          )}
        </div>
      </div>

      {/* Section filter */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={activeSection === 'all' ? 'default' : 'outline'}
          className={activeSection === 'all' ? 'bg-yellow-400 text-black hover:bg-yellow-500' : ''}
          onClick={() => setActiveSection('all')}
        >
          {tTrash('all')}
        </Button>
        <Button
          size="sm"
          variant={activeSection === 'bookings' ? 'default' : 'outline'}
          className={activeSection === 'bookings' ? 'bg-yellow-400 text-black hover:bg-yellow-500' : ''}
          onClick={() => setActiveSection('bookings')}
        >
          <CalendarDays className="h-3.5 w-3.5 mr-1" />
          {tTrash('booking')} ({bookings.length})
        </Button>
        <Button
          size="sm"
          variant={activeSection === 'chats' ? 'default' : 'outline'}
          className={activeSection === 'chats' ? 'bg-yellow-400 text-black hover:bg-yellow-500' : ''}
          onClick={() => setActiveSection('chats')}
        >
          <MessageSquare className="h-3.5 w-3.5 mr-1" />
          {tTrash('chat')} ({chats.length})
        </Button>
      </div>

      {/* 15-day warning */}
      <div className="flex items-center gap-2 p-3 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
        <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0" />
        <p className="text-sm text-yellow-400">
          {tTrash('warning15')}
        </p>
      </div>

      {/* Confirm empty trash */}
      {showConfirmEmpty && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-400 font-medium">
              {tTrash('deleteAllWarning', { count: totalItems })}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{tTrash('noUndo')}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowConfirmEmpty(false)}>
              {tCommon('cancel')}
            </Button>
            <Button
              size="sm"
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleEmptyTrash}
              disabled={emptying}
            >
              {emptying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : tTrash('deleteAll')}
            </Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalItems === 0 && (
        <div className="text-center py-12">
          <Trash2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">{tTrash('empty')}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {tTrash('emptyHint')}
          </p>
        </div>
      )}

      {/* Bookings list */}
      {bookings.length > 0 && (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Card
              key={booking.id}
              className="border-border bg-card overflow-hidden"
            >
              {/* Header row */}
              <div
                className="p-4 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0" />
                        <span className="text-xs font-semibold text-red-400">
                          {tTrash('cancelled')}
                        </span>
                      </div>
                      <DaysRemaining deletedAt={booking.deletedAt} tTrash={tTrash} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-sm truncate">
                          {booking.customerName}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {booking.reference} · {tTrash('deleted')} {formatRelativeDate(booking.deletedAt, tTime)}
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

              {/* Expanded details + actions */}
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
                        <p className="text-[10px] text-muted-foreground">{tTrash('pickup')}</p>
                        <p className="text-sm font-medium">{booking.pickupAddress}</p>
                      </div>
                      {booking.dropoffAddress && (
                        <div>
                          <p className="text-[10px] text-muted-foreground">{tTrash('destination')}</p>
                          <p className="text-sm font-medium">{booking.dropoffAddress}</p>
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
                        <span>{formatDate(booking.scheduledDate)}</span>
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
                      <span>{booking.passengerCount} {tTrash('passengers')}</span>
                    </div>
                  </div>

                  {booking.notes && (
                    <p className="text-sm text-muted-foreground bg-muted/10 rounded p-2">
                      {booking.notes}
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 text-white hover:bg-green-700"
                      onClick={() => handleRestore(booking.id)}
                      disabled={actionLoading === booking.id}
                    >
                      {actionLoading === booking.id ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      )}
                      {tTrash('restore')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-400/30 text-red-400 hover:bg-red-400/10"
                      onClick={() => handlePermanentDelete(booking.id)}
                      disabled={actionLoading === booking.id}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      {tTrash('permanentDelete')}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Chats list */}
      {chats.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-xs font-medium text-muted-foreground">
              {tTrash('chatSection')}
            </span>
            <Badge variant="outline" className="h-4 px-1.5 text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/30">
              {chats.length}
            </Badge>
          </div>
          {chats.map((chat) => (
            <Card
              key={chat.id}
              className="border-blue-500/20 bg-blue-500/[0.03] overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {chat.client.name}
                        </span>
                        <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/30 flex-shrink-0">
                          {tTrash('chat')}
                        </Badge>
                      </div>
                      {chat.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {chat.lastMessage}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground/50">
                          {tTrash('deleted')} {formatRelativeDate(chat.driverDeletedAt, tTime)}
                        </span>
                        <span className="text-[10px] text-muted-foreground/50">
                          · {chat._count.messages} {tTrash('messages')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button
                    size="sm"
                    className="bg-green-600 text-white hover:bg-green-700"
                    onClick={() => handleRestoreChat(chat.id)}
                    disabled={actionLoading === chat.id}
                  >
                    {actionLoading === chat.id ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    )}
                    {tTrash('restore')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-400/30 text-red-400 hover:bg-red-400/10"
                    onClick={() => handlePermanentDeleteChat(chat.id)}
                    disabled={actionLoading === chat.id}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    {tTrash('permanentDelete')}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
