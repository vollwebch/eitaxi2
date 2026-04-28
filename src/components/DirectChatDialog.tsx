"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, User, Car, LogIn, Languages } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAppLocale } from "@/hooks/useLocale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface DirectChatDialogProps {
  driverId: string;
  driverName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DirectMessage {
  id: string;
  conversationId: string;
  sender: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

function formatChatTime(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DirectChatDialog({
  driverId,
  driverName,
  open,
  onOpenChange,
}: DirectChatDialogProps) {
  const t = useTranslations("client.directChat");
  const { locale } = useAppLocale();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const initialLoadDone = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const tChat = useTranslations('dashboard.chat');

  const translateMessage = async (msgId: string, text: string) => {
    if (translations[msgId]) {
      const updated = { ...translations };
      delete updated[msgId];
      setTranslations(updated);
      return;
    }
    setTranslatingId(msgId);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLang: locale }),
      });
      const data = await res.json();
      if (data.success && data.data?.translation) {
        setTranslations((prev) => ({ ...prev, [msgId]: data.data.translation }));
      }
    } catch (err) {
      console.error("Translation error:", err);
    } finally {
      setTranslatingId(null);
    }
  };

  // Check auth and create conversation when opened
  useEffect(() => {
    if (open && driverId) {
      checkAuthAndStart();
    } else {
      // Cleanup on close
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setConversationId(null);
      setMessages([]);
      setIsAuthenticated(null);
      setTranslations({});
    }
  }, [open, driverId]);

  const checkAuthAndStart = async () => {
    try {
      const res = await fetch("/api/auth/client/session");
      const data = await res.json();
      if (data.authenticated && data.data) {
        setIsAuthenticated(true);
        createOrGetConversation();
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  };

  const createOrGetConversation = async () => {
    try {
      const res = await fetch("/api/direct-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setConversationId(data.data.id);
      }
    } catch (err) {
      console.error("Error creating conversation:", err);
    }
  };

  const fetchMessages = useCallback(async (isPolling = false) => {
    if (!conversationId) return;
    if (!isPolling) setLoading(true);
    try {
      const res = await fetch(`/api/direct-chat/${conversationId}/messages`);
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
  }, [conversationId]);

  // Poll messages when conversation is ready
  useEffect(() => {
    if (conversationId) {
      initialLoadDone.current = false;
      setLoading(true);
      fetchMessages(false);
      setNewMessage("");
      pollIntervalRef.current = setInterval(() => fetchMessages(true), 15000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [conversationId, fetchMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (loading) return;
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, loading]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId) return;
    const content = newMessage.trim();
    setSending(true);
    try {
      const res = await fetch(`/api/direct-chat/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.success) {
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 pb-3 border-b border-border flex-shrink-0">
          <SheetTitle className="flex items-center gap-2 text-white text-base">
            <span className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Car className="h-4 w-4 text-blue-400" />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{driverName}</span>
              <span className="text-xs text-muted-foreground font-normal">
                {t("title")}
              </span>
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* Login prompt */}
        {isAuthenticated === false && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-yellow-400/10 flex items-center justify-center mx-auto">
                <LogIn className="h-8 w-8 text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                {t("loginRequired")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("loginToChat")}
              </p>
              <Button
                onClick={() => router.push("/login")}
                className="bg-yellow-400 text-black hover:bg-yellow-500"
              >
                {t("loginRequired")}
              </Button>
            </div>
          </div>
        )}

        {/* Loading conversation */}
        {isAuthenticated === true && !conversationId && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
          </div>
        )}

        {/* Messages */}
        {isAuthenticated === true && conversationId && (
          <>
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    {t("typeMessage")}
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isClient = msg.sender === "client";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isClient ? "justify-end" : "justify-start"}`}
                    >
                      {!isClient && (
                        <div className="flex flex-col items-end mr-2 flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                            <Car className="h-4 w-4 text-blue-400" />
                          </div>
                        </div>
                      )}
                      <div className="flex flex-col max-w-[260px]">
                        <span
                          className={`text-[11px] font-semibold mb-1 px-1 ${
                            isClient
                              ? "text-yellow-400 text-right"
                              : "text-blue-400"
                          }`}
                        >
                          {isClient ? t('you') : driverName}
                        </span>
                        <div
                          className={`px-3.5 py-2.5 shadow-sm ${
                            isClient
                              ? "bg-gradient-to-br from-yellow-400 to-yellow-500 text-black rounded-2xl rounded-tr-sm"
                              : "bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-white border border-blue-500/25 rounded-2xl rounded-tl-sm"
                          }`}
                        >
                          <p className="text-sm leading-relaxed">
                            {msg.content}
                          </p>
                          <button
                            onClick={() => translateMessage(msg.id, msg.content)}
                            disabled={translatingId === msg.id}
                            className={`mt-1.5 flex items-center gap-1 text-[10px] transition-colors ${
                              isClient
                                ? "text-black/40 hover:text-black/60"
                                : "text-white/40 hover:text-white/60"
                            } ${translations[msg.id] ? "font-semibold" : ""}`}
                            title={
                              translations[msg.id]
                                ? tChat('hideTranslation')
                                : tChat('translate')
                            }
                          >
                            {translatingId === msg.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Languages className="h-3 w-3" />
                            )}
                            {translations[msg.id] ? tChat('hide') : tChat('translate')}
                          </button>
                          {translations[msg.id] && (
                            <div className="mt-1.5 pt-1.5 border-t border-white/10">
                              <p
                                className={`text-xs italic ${
                                  isClient
                                    ? "text-black/70"
                                    : "text-white/70"
                                }`}
                              >
                                {translations[msg.id]}
                              </p>
                            </div>
                          )}
                        </div>
                        <p
                          className={`text-[10px] mt-1 px-1 ${
                            isClient
                              ? "text-muted-foreground/50 text-right"
                              : "text-muted-foreground/50"
                          }`}
                        >
                          {formatChatTime(msg.createdAt, locale)}
                        </p>
                      </div>
                      {isClient && (
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
                  placeholder={t("typeMessage")}
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
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
