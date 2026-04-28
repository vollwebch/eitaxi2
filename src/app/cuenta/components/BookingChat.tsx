"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Loader2, User, Car, Languages } from "lucide-react";
import { useTranslations } from 'next-intl';
import { useAppLocale } from "@/hooks/useLocale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatMessage {
  id: string;
  bookingId: string;
  sender: string;
  content: string;
  createdAt: string;
}

interface BookingChatProps {
  bookingId: string | null;
  bookingRef?: string;
  driverName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatChatTime(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BookingChat({
  bookingId,
  bookingRef,
  driverName,
  open,
  onOpenChange,
}: BookingChatProps) {
  const { locale } = useAppLocale();
  const tTracking = useTranslations('tracking');
  const tChat = useTranslations('dashboard');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const initialLoadDone = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);

  // Mark notifications for this booking as read
  const markBookingNotificationsRead = useCallback(async () => {
    if (!bookingId) return;
    try {
      await fetch("/api/client/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: bookingId }),
      });
    } catch {
      // silent
    }
  }, [bookingId]);

  const fetchMessages = useCallback(async (isPolling = false) => {
    if (!bookingId) return;
    if (!isPolling) setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/messages`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        if (isPolling) {
          setMessages((prev) => {
            if (prev.length === data.data.length && prev[prev.length - 1]?.id === data.data[data.data.length - 1]?.id) {
              return prev;
            }
            return data.data;
          });
        } else {
          setMessages(data.data);
        }
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [bookingId]);

  // Cargar mensajes al abrir y arrancar polling mientras el chat esté abierto
  useEffect(() => {
    if (open && bookingId) {
      initialLoadDone.current = false;
      setLoading(true);
      fetchMessages(false);
      markBookingNotificationsRead();
      setNewMessage("");

      // Polling cada 15 segundos (invisible, sin spinner)
      pollIntervalRef.current = setInterval(() => fetchMessages(true), 20000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [open, bookingId, fetchMessages]);

  useEffect(() => {
    if (loading) return;
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, loading]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !bookingId) return;
    const content = newMessage.trim();
    setSending(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        // Refrescar todos los mensajes para evitar duplicados y tener datos frescos
        fetchMessages();
        setNewMessage("");
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const translateMessage = async (msgId: string, text: string) => {
    if (translations[msgId]) {
      // Toggle: if already translated, remove translation
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md p-0 gap-0 max-h-[85vh] flex flex-col">
        <DialogHeader className="p-4 pb-3 border-b border-border flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-white text-base">
            <span className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center">
              <Car className="h-4 w-4 text-yellow-400" />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{tChat('chat.chatWith')} {driverName || tTracking('driver')}</span>
              {bookingRef && (
                <span className="text-xs text-muted-foreground font-normal">
                  {bookingRef.toUpperCase()}
                </span>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[50vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                {tChat('bookings.noMessagesYet')}
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isCustomer = msg.sender === "customer";
              return (
                <div
                  key={msg.id}
                  className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}
                >
                  {/* Avatar fuera de la burbuja */}
                  {!isCustomer && (
                    <div className="flex flex-col items-end mr-2 flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                        <Car className="h-4 w-4 text-blue-400" />
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col">
                    {/* Nombre del emisor */}
                    <span
                      className={`text-[11px] font-semibold mb-1 px-1 ${
                        isCustomer
                          ? "text-yellow-400 text-right"
                          : "text-blue-400"
                      }`}
                    >
                      {isCustomer ? tChat('chat.you') : (driverName || tTracking('driver'))}
                    </span>
                    {/* Burbuja del mensaje */}
                    <div
                      className={`max-w-[260px] px-3.5 py-2.5 shadow-sm ${
                        isCustomer
                          ? "bg-gradient-to-br from-yellow-400 to-yellow-500 text-black rounded-2xl rounded-tr-sm"
                          : "bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-white border border-blue-500/25 rounded-2xl rounded-tl-sm"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <button
                        onClick={() => translateMessage(msg.id, msg.content)}
                        disabled={translatingId === msg.id}
                        className={`mt-1.5 flex items-center gap-1 text-[10px] opacity-60 hover:opacity-100 transition-opacity ${
                          translations[msg.id] ? 'opacity-100 font-semibold' : ''
                        } ${isCustomer ? 'text-black/60' : 'text-white/60'}`}
                        title={translations[msg.id] ? tChat('chat.hideTranslation') : tChat('chat.translate')}
                      >
                        {translatingId === msg.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Languages className="h-3 w-3" />
                        )}
                        {translations[msg.id] ? tChat('chat.hide') : tChat('chat.translate')}
                      </button>
                      {translations[msg.id] && (
                        <div className={`mt-1.5 pt-1.5 border-t ${isCustomer ? 'border-black/10' : 'border-white/10'}`}>
                          <p className="text-xs italic opacity-80">{translations[msg.id]}</p>
                        </div>
                      )}
                    </div>
                    <p
                      className={`text-[10px] mt-1 px-1 ${
                        isCustomer
                          ? "text-muted-foreground/50 text-right"
                          : "text-muted-foreground/50"
                      }`}
                    >
                      {formatChatTime(msg.createdAt, locale)}
                    </p>
                  </div>
                  {/* Avatar del cliente a la derecha */}
                  {isCustomer && (
                    <div className="flex flex-col items-start ml-2 flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center">
                        <User className="h-4 w-4 text-yellow-400" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={tChat('chat.writeMessage')}
              disabled={sending}
              className="flex-1 bg-background border-border text-white placeholder:text-muted-foreground/60"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              size="icon"
              className="bg-yellow-400 text-black hover:bg-yellow-500 flex-shrink-0"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
