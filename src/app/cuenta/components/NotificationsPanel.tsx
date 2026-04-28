"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bell, Loader2, MessageSquare, MapPin, Trash2, X, CheckCheck } from "lucide-react";
import { useAppLocale } from "@/hooks/useLocale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string | null;
  type?: string | null;
}

function timeAgo(dateStr: string, t: (key: string, params?: Record<string, unknown>) => string, locale: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return t('now');
  if (diffMin < 60) return t('minutes', { count: diffMin });
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return t('hours', { count: diffH });
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return t('days', { count: diffD });
  return date.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

export default function NotificationsPanel() {
  const router = useRouter();
  const t = useTranslations('client.notifications');
  const tTime = useTranslations('client.timeAgo');
  const { locale } = useAppLocale();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/client/notifications");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setNotifications(data.data);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll every 15 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Refetch when sheet opens
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  const markAsRead = async (id: string) => {
    setMarkingId(id);
    try {
      const res = await fetch("/api/client/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isRead: true }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error("Error marking notification:", err);
    } finally {
      setMarkingId(null);
    }
  };

  const deleteNotification = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeletingId(id);
    try {
      const res = await fetch("/api/client/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const markAllAsRead = async () => {
    setMarkingAllRead(true);
    try {
      const res = await fetch("/api/client/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true, isRead: true }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error("Error marking all as read:", err);
    } finally {
      setMarkingAllRead(false);
    }
  };

  const clearAll = async () => {
    setClearingAll(true);
    try {
      const res = await fetch("/api/client/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Error clearing notifications:", err);
    } finally {
      setClearingAll(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      try {
        await fetch("/api/client/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: notification.id, isRead: true }),
        });
      } catch (err) {
        console.error("Error marking notification:", err);
      }
    }

    // Navigate to link if available
    if (notification.link) {
      setOpen(false);
      // Use window.location instead of router.push to ensure search params update on same page
      window.location.href = notification.link;
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="relative text-muted-foreground hover:text-yellow-400"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-card border-border">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-yellow-400" />
                {t('title')}
                {unreadCount > 0 && (
                  <Badge className="bg-yellow-400 text-black text-xs ml-1">
                    {unreadCount} {t('new')}
                  </Badge>
                )}
              </div>
              {notifications.length > 0 && (
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      disabled={markingAllRead}
                      className="text-xs text-muted-foreground hover:text-green-400 hover:bg-green-400/10 h-7 px-2"
                    >
                      {markingAllRead ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      ) : (
                        <CheckCheck className="h-3.5 w-3.5 mr-1" />
                      )}
                      {t('markAllAsRead')}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    disabled={clearingAll}
                    className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 px-2"
                  >
                    {clearingAll ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                    )}
                    {t('clearAll')}
                  </Button>
                </div>
              )}
            </SheetTitle>
            <SheetDescription className="text-muted-foreground">
              {t('subtitle')}
            </SheetDescription>
          </SheetHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">
                {t('empty')}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-120px)]">
              <div className="space-y-2 pr-3 pb-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer group relative ${
                      notification.isRead
                        ? "bg-background/50 border-border/50"
                        : "bg-yellow-400/5 border-yellow-400/20 hover:bg-yellow-400/10"
                    } ${notification.link ? "hover:border-yellow-400/40" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex-shrink-0">
                        {notification.type === "new_message" ? (
                          <MessageSquare className={`h-4 w-4 ${
                            notification.isRead ? "text-muted-foreground/50" : "text-blue-400"
                          }`} />
                        ) : (
                          <MapPin className={`h-4 w-4 ${
                            notification.isRead ? "text-muted-foreground/50" : "text-yellow-400"
                          }`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-semibold truncate ${
                            notification.isRead
                              ? "text-muted-foreground"
                              : "text-white"
                          }`}
                        >
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-muted-foreground/60">
                            {timeAgo(notification.createdAt, (k, p) => tTime(k, p), locale)}
                          </p>
                          {notification.link && (
                            <span className="text-xs text-yellow-400/70 opacity-0 group-hover:opacity-100 transition-opacity">
                              {t('viewDetail')}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteNotification(notification.id, e)}
                        className="flex-shrink-0 p-1 rounded-lg text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                        title={t('deleteTitle')}
                      >
                        {deletingId === notification.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
