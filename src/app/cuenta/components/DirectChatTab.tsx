"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Loader2, User, Car, MessageCircle, Languages, ChevronRight, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAppLocale } from "@/hooks/useLocale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface DirectConversation {
  id: string;
  otherPerson: {
    id: string;
    name: string;
    imageUrl?: string | null;
  };
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
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

function formatRelativeTime(dateStr: string | null, tTime: (key: string, params?: Record<string, unknown>) => string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return tTime('now');
  if (diffMins < 60) return tTime('minutes', { count: diffMins });
  if (diffHours < 24) return tTime('hours', { count: diffHours });
  if (diffDays < 7) return tTime('days', { count: diffDays });
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
}

interface DirectChatTabProps {
  autoOpenConvId?: string | null;
}

export default function DirectChatTab({ autoOpenConvId }: DirectChatTabProps) {
  const t = useTranslations("client.directChat");
  const tChat = useTranslations('dashboard.chat');
  const tTime = useTranslations('client.timeAgo');
  const { locale } = useAppLocale();
  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<DirectConversation | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const initialLoadDone = useRef(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);

  const fetchConversations = useCallback(async (isPolling = false) => {
    try {
      const res = await fetch("/api/direct-chat");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        if (isPolling) {
          setConversations((prev) => {
            const newData = data.data;
            // Only update if conversation list actually changed
            if (prev.length === newData.length &&
                prev.every((c, i) => c.id === newData[i].id && c.unreadCount === newData[i].unreadCount && c.lastMessage === newData[i].lastMessage)) {
              return prev;
            }
            return newData;
          });
        } else {
          setConversations(data.data);
        }
        const total = data.data.reduce((sum: number, c: DirectConversation) => sum + c.unreadCount, 0);
        setTotalUnread(total);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      if (!isPolling) setLoadingConversations(false);
    }
  }, []);

  // Mark notifications for a conversation as read
  const markConvNotificationsRead = useCallback(async (convId: string) => {
    try {
      await fetch("/api/client/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId }),
      });
    } catch {
      // silent - non-critical
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId: string, isPolling = false) => {
    if (!isPolling) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/direct-chat/${conversationId}/messages`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        if (isPolling) {
          // Only update if new messages arrived (avoid unnecessary re-renders)
          setMessages((prev) => {
            const newData = data.data;
            const hasNew = newData.length !== prev.length || prev[prev.length - 1]?.id !== newData[newData.length - 1]?.id;
            if (!hasNew) return prev;
            return newData;
          });
        } else {
          setMessages(data.data);
        }
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      if (!isPolling) setLoadingMessages(false);
    }
  }, []);

  // Auto-open conversation from notification link (runs once)
  const autoOpenDone = useRef(false);
  useEffect(() => {
    if (autoOpenDone.current || !autoOpenConvId) return;
    if (conversations.length === 0) return;
    const found = conversations.find(c => c.id === autoOpenConvId);
    if (found) {
      autoOpenDone.current = true;
      setSelectedConversation(found);
      setShowChat(true);
    }
  }, [autoOpenConvId, conversations.length]);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations(false);
    const interval = setInterval(() => fetchConversations(true), 15000);
    return () => clearInterval(interval);
  }, []);

  // When a conversation is selected, fetch its messages and poll
  const selectedConvIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedConversation) {
      selectedConvIdRef.current = selectedConversation.id;
      initialLoadDone.current = false;
      fetchMessages(selectedConversation.id, false);
      markConvNotificationsRead(selectedConversation.id);
      setNewMessage("");
      setTranslations({});
      pollIntervalRef.current = setInterval(
        () => fetchMessages(selectedConversation.id, true),
        5000
      );
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [selectedConversation, fetchMessages]);

  // When messages count increases (new message arrived), dismiss notifications silently
  const prevMsgCountRef = useRef(0);
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current && prevMsgCountRef.current > 0 && selectedConvIdRef.current) {
      // New message detected during polling - mark notifications as read in background
      markConvNotificationsRead(selectedConvIdRef.current);
    }
    prevMsgCountRef.current = messages.length;
  }, [messages.length]);

  // Auto-scroll to bottom only on initial load or new messages at bottom
  useEffect(() => {
    if (loadingMessages) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages.length, loadingMessages]);

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

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    const content = newMessage.trim();
    setSending(true);
    try {
      const res = await fetch(
        `/api/direct-chat/${selectedConversation.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );
      const data = await res.json();
      if (data.success) {
        fetchMessages(selectedConversation.id);
        fetchConversations();
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

  const handleSelectConversation = (conv: DirectConversation) => {
    setSelectedConversation(conv);
  };

  // Mobile: show list or chat, not both
  const [showChat, setShowChat] = useState(false);

  const handleSelectMobile = (conv: DirectConversation) => {
    handleSelectConversation(conv);
    setShowChat(true);
  };

  const handleBackToList = () => {
    setShowChat(false);
  };

  const goBack = () => {
    setShowChat(false);
    setSelectedConversation(null);
    setMessages([]);
    setTranslations({});
  };

  // Soft-delete a conversation
  const [deletingConv, setDeletingConv] = useState<string | null>(null);

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    if (!confirm(t('deleteConfirm'))) return;
    setDeletingConv(convId);
    try {
      const res = await fetch("/api/client/trash", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId, action: "soft_delete" }),
      });
      const data = await res.json();
      if (data.success) {
        setConversations(prev => prev.filter(c => c.id !== convId));
        if (selectedConversation?.id === convId) {
          goBack();
        }
        fetchConversations();
      }
    } catch {
      // silencio
    } finally {
      setDeletingConv(null);
    }
  };

  // --- Chat View (selected) ---
  if (selectedConversation && showChat) {
    const driverName = selectedConversation.otherPerson.name;
    return (
      <div className="flex flex-col h-[65vh] max-h-[65vh] border border-border rounded-lg bg-card">
        {/* Chat header */}
        <div className="flex items-center gap-3 p-3 border-b border-border flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={goBack}>
            <ChevronRight className="h-4 w-4 rotate-180" />
          </Button>
          <div className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center overflow-hidden flex-shrink-0">
            {selectedConversation.otherPerson.imageUrl ? (
              <img
                src={selectedConversation.otherPerson.imageUrl}
                alt={driverName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Car className="h-4 w-4 text-blue-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-sm">{driverName}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(t('deleteConfirm'))) {
                handleDeleteConversation(e as unknown as React.MouseEvent, selectedConversation.id);
              }
            }}
            className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground/50 hover:text-red-400 transition-colors flex-shrink-0"
            title={t('deleteChat')}
          >
            {deletingConv === selectedConversation.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loadingMessages ? (
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
                  <div className="flex flex-col max-w-[260px]">
                    <span
                      className={`text-[11px] font-semibold mb-1 px-1 ${
                        isClient ? "text-yellow-400 text-right" : "text-blue-400"
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
                      <p className="text-sm leading-relaxed">{msg.content}</p>
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
                              isClient ? "text-black/70" : "text-white/70"
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
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border flex gap-2 flex-shrink-0">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("typeMessage")}
            disabled={sending}
            className="flex-1 bg-background border-border"
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
    );
  }

  // --- Conversation List View ---
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-yellow-400" />
          {t("title")}
          {totalUnread > 0 && (
            <Badge className="bg-red-500 text-white hover:bg-red-600 ml-1">
              {totalUnread} {tChat('unread')}
            </Badge>
          )}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchConversations}
          disabled={loadingConversations}
        >
          <Loader2
            className={`h-3.5 w-3.5 mr-1 ${loadingConversations ? "animate-spin" : ""}`}
          />
          {tChat('refresh')}
        </Button>
      </div>

      {loadingConversations ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {t("noConversations")}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {t("noConversationsHint")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleSelectMobile(conv)}
              className="w-full text-left"
            >
              <div className="border border-border rounded-lg bg-card hover:bg-muted/10 transition-colors overflow-hidden p-3">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center overflow-hidden">
                      {conv.otherPerson.imageUrl ? (
                        <img
                          src={conv.otherPerson.imageUrl}
                          alt={conv.otherPerson.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Car className="h-5 w-5 text-blue-400" />
                      )}
                    </div>
                    {conv.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {conv.unreadCount}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm truncate">
                        {conv.otherPerson.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {formatRelativeTime(conv.lastMessageAt, tTime)}
                      </span>
                    </div>
                    {conv.lastMessage && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conv.lastMessage}
                      </p>
                    )}
                  </div>

                  {/* Arrow + Delete */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => handleDeleteConversation(e, conv.id)}
                      className="p-1 rounded-md hover:bg-red-500/10 text-muted-foreground/40 hover:text-red-400 transition-colors"
                      title={t('deleteChat')}
                    >
                      {deletingConv === conv.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
