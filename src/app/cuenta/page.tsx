"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Car,
  Calendar,
  BarChart3,
  Heart,
  User,
  Loader2,
  LogOut,
  MessageCircle,
  Trash2,
  MapPin,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import NotificationsPanel from "./components/NotificationsPanel";
import BookingsTab from "./components/BookingsTab";
import ClientTrashTab from "./components/ClientTrashTab";
import StatisticsTab from "./components/StatisticsTab";
import FavoritesTab from "./components/FavoritesTab";
import DirectChatTab from "./components/DirectChatTab";
import ProfileTab from "./components/ProfileTab";
import AddressesTab from "./components/AddressesTab";
import EmergencyTab from "./components/EmergencyTab";
import SOSButton from "@/components/SOSButton";
import type { BookingItem } from "./components/BookingDetail";
import { useTranslations } from 'next-intl';

interface ClientUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

type TabKey = "bookings" | "trash" | "statistics" | "favorites" | "chat" | "addresses" | "emergency" | "profile";

const TAB_KEYS: TabKey[] = ["bookings", "trash", "statistics", "favorites", "chat", "addresses", "emergency", "profile"];

const CLIENT_SESSION_KEY = 'eitaxi_client_session';

export default function CuentaPage() {
  const t = useTranslations('account');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<ClientUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("bookings");
  const [autoExpandBookingId, setAutoExpandBookingId] = useState<string | null>(null);
  const [autoOpenChat, setAutoOpenChat] = useState(false);

  // Calcular total de mensajes no leídos
  const totalUnreadMessages = bookings.reduce((sum, b) => {
    return sum + ((b as any).unreadMessages || 0);
  }, 0);

  const tabLabels: Record<TabKey, string> = {
    bookings: t('tabs.bookings'),
    trash: t('tabs.trash'),
    statistics: t('tabs.statistics'),
    favorites: t('tabs.favorites'),
    chat: t('tabs.chat'),
    addresses: t('tabs.addresses'),
    emergency: t('tabs.emergency'),
    profile: t('tabs.profile'),
  };
  const tabIcons: Record<TabKey, typeof Calendar> = {
    bookings: Calendar,
    trash: Trash2,
    statistics: BarChart3,
    favorites: Heart,
    chat: MessageCircle,
    addresses: MapPin,
    emergency: ShieldAlert,
    profile: User,
  };

  // Handle URL params from notification links
  const tabParam = searchParams.get('tab');
  const bookingParam = searchParams.get('booking');
  const chatParam = searchParams.get('chat');

  useEffect(() => {
    if (tabParam === 'reservas') {
      setActiveTab('bookings');
    }
    if (bookingParam) {
      setAutoExpandBookingId(bookingParam);
    }
    if (chatParam === 'open') {
      setAutoOpenChat(true);
    }
  }, [tabParam, bookingParam, chatParam]);

  // Restore session from localStorage first (instant)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CLIENT_SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.clientId) {
          setUser({
            id: parsed.clientId,
            name: parsed.name || '',
            email: parsed.email || '',
          });
        }
      }
    } catch {
      // Ignore parse errors
    }

    // Then validate with server
    validateSession();
  }, []);

  const validateSession = async () => {
    try {
      const res = await fetch("/api/auth/client/session");
      const data = await res.json();
      if (data.authenticated && data.data) {
        const serverUser = {
          id: data.data.clientId || data.data.id,
          name: data.data.name,
          email: data.data.email,
        };
        setUser(serverUser);

        // Refresh localStorage with fresh server data
        localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify({
          clientId: serverUser.id,
          email: serverUser.email,
          name: serverUser.name,
          loginTime: new Date().toISOString(),
        }));

        fetchBookings();
      } else {
        // Server says no session - clear localStorage and redirect
        localStorage.removeItem(CLIENT_SESSION_KEY);
        setUser(null);
        router.push("/login");
      }
    } catch (err) {
      console.error("Session check error:", err);
      // On network error, if we have localStorage data, keep it (offline support)
      const stored = localStorage.getItem(CLIENT_SESSION_KEY);
      if (!stored) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const res = await fetch("/api/client/bookings");
      const data = await res.json();
      if (data.success) {
        setBookings(data.data);
      }
    } catch (err) {
      console.error("Fetch bookings error:", err);
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  const handleCancelBooking = async (bookingId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const data = await res.json();
      if (data.success) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId ? { ...b, status: "cancelled" } : b
          )
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error("Cancel booking error:", err);
      return false;
    }
  };

  const handleDeleteBooking = async (bookingId: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/client/trash", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, action: "soft_delete" }),
      });
      const data = await res.json();
      if (data.success) {
        setBookings((prev) => prev.filter((b) => b.id !== bookingId));
        return true;
      }
      return false;
    } catch (err) {
      console.error("Delete booking error:", err);
      return false;
    }
  };

  const handleUserUpdate = (updatedUser: ClientUser) => {
    setUser(updatedUser);
    // Update localStorage with new user data
    try {
      const stored = localStorage.getItem(CLIENT_SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify({
          ...parsed,
          name: updatedUser.name,
          email: updatedUser.email,
        }));
      }
    } catch {
      // Ignore
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(CLIENT_SESSION_KEY);
    setUser(null);
    setBookings([]);
    fetch('/api/auth/client/logout', { method: 'POST' }).finally(() => {
      router.push('/');
    });
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-yellow-400 mx-auto mb-4" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // If no user after loading, don't render (redirect happened)
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-400 mx-auto mb-4" />
          <p className="text-muted-foreground">{t('redirecting')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-lg shadow-yellow-400/20">
                <Car className="h-6 w-6 text-black" />
              </div>
              <span className="text-xl font-bold">
                <span className="text-yellow-400">ei</span>
                <span className="text-white">taxi</span>
              </span>
            </Link>
            <div className="flex items-center gap-1">
              <NotificationsPanel />
              <LanguageSwitcher />
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => {
                  if (confirm(t('logoutConfirm'))) {
                    handleLogout();
                  }
                }}
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('logout')}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <div className="sticky top-16 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
            {TAB_KEYS.map((key) => {
              const isActive = activeTab === key;
              const Icon = tabIcons[key];
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-yellow-400 text-black shadow-md shadow-yellow-400/20"
                      : "text-muted-foreground hover:text-white hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tabLabels[key]}
                  {key === "bookings" && totalUnreadMessages > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                      {totalUnreadMessages > 9 ? "9+" : totalUnreadMessages}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6 max-w-lg flex-1">
        {activeTab === "bookings" && (
          <BookingsTab
            bookings={bookings}
            loading={loadingBookings}
            onRefresh={fetchBookings}
            onCancelBooking={handleCancelBooking}
            onDeleteBooking={handleDeleteBooking}
            autoExpandBookingId={autoExpandBookingId}
            autoOpenChat={autoOpenChat}
          />
        )}
        {activeTab === "trash" && <ClientTrashTab />}
        {activeTab === "statistics" && <StatisticsTab />}
        {activeTab === "favorites" && <FavoritesTab />}
        {activeTab === "chat" && <DirectChatTab />}
        {activeTab === "addresses" && <AddressesTab />}
        {activeTab === "emergency" && <EmergencyTab />}
        {activeTab === "profile" && (
          <ProfileTab
            user={user}
            onUserUpdate={handleUserUpdate}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-4 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-yellow-400 transition-colors inline-flex items-center gap-1.5"
          >
            <Car className="h-3.5 w-3.5" />
            {t('backToHome')}
          </Link>
        </div>
      </footer>

      {/* SOS Floating Button */}
      <SOSButton />
    </div>
  );
}
