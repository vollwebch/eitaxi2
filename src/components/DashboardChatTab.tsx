"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageCircle,
  Send,
  Loader2,
  User,
  Phone,
  MapPin,
  Clock,
  CalendarDays,
  Languages,
  ChevronRight,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAppLocale } from "@/hooks/useLocale";
import { useTranslations } from 'next-intl';

// --- Types for booking conversations ---
interface BookingConversation {
  type: 'booking';
  id: string;
  reference: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  scheduledDate: string | null;
  scheduledTime: string | null;
  status: string;
  createdAt: string;
  lastMessage: {
    id: string;
    content: string;
    sender: string;
    createdAt: string;
  } | null;
  unreadCount: number;
}

// --- Types for direct conversations ---
interface DirectConversation {
  type: 'direct';
  id: string;
  clientName: string;
  clientId: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
}

type Conversation = BookingConversation | DirectConversation;

interface BookingMessage {
  id: string;
  bookingId: string;
  sender: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface DirectMessage {
  id: string;
  conversationId: string;
  sender: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

type Message = BookingMessage | DirectMessage;

interface DashboardChatTabProps {
  driverId: string;
  onOpenBooking?: (bookingId: string) => void;
  onUnreadCountChange?: (count: number) => void;
  autoOpenConvId?: string | null;
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

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("es-CH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function DashboardChatTab({ driverId, onOpenBooking, onUnreadCountChange, autoOpenConvId }: DashboardChatTabProps) {
  const { locale } = useAppLocale();
  const tChat = useTranslations('dashboard.chat');
  const tStatus = useTranslations('tracking.statuses');
  const tTime = useTranslations('client.timeAgo');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const initialChatLoadDone = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);

  // Fetch booking + direct conversations
  const fetchConversations = useCallback(async () => {
    try {
      // Fetch booking conversations
      const bookingRes = await fetch("/api/chat/driver");
      const bookingData = await bookingRes.json();

      // Fetch direct conversations
      const directRes = await fetch("/api/direct-chat");
      const directData = await directRes.json();

      const bookingConvs: BookingConversation[] = (bookingData?.data?.conversations || []).map((b: Record<string, unknown>) => ({
        ...b,
        type: 'booking' as const,
      }));

      const directConvs: DirectConversation[] = (directData?.data || []).map((d: Record<string, unknown>) => ({
        type: 'direct' as const,
        id: d.id,
        clientName: (d.otherPerson as Record<string, unknown>)?.name || 'Cliente',
        clientId: (d.otherPerson as Record<string, unknown>)?.id || '',
        lastMessage: d.lastMessage as string | null,
        lastMessageAt: d.lastMessageAt as string | null,
        unreadCount: d.unreadCount as number,
        createdAt: (d as Record<string, unknown>).createdAt as string || new Date().toISOString(),
      }));

      // Combine and sort by last activity
      const allConvs: Conversation[] = [
        ...bookingConvs,
        ...directConvs,
      ].sort((a, b) => {
        const timeA = a.type === 'booking'
          ? (a.lastMessage?.createdAt || a.createdAt)
          : (a.lastMessageAt || a.createdAt);
        const timeB = b.type === 'booking'
          ? (b.lastMessage?.createdAt || b.createdAt)
          : (b.lastMessageAt || b.createdAt);
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      });

      const total = allConvs.reduce((sum, c) => sum + c.unreadCount, 0);
      setConversations(allConvs);
      setTotalUnread(total);
      onUnreadCountChange?.(total);
    } catch {
      // silencio
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-open conversation from notification link
  useEffect(() => {
    if (autoOpenConvId && conversations.length > 0) {
      const found = conversations.find(c => c.id === autoOpenConvId);
      if (found) setSelectedConv(found);
    }
  }, [autoOpenConvId, conversations]);

  // Mark notifications for a conversation as read
  const markConvNotificationsRead = useCallback(async (convId: string) => {
    try {
      await fetch("/api/driver/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId }),
      });
    } catch {
      // silent - non-critical
    }
  }, []);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (conv: Conversation, isPolling = false) => {
    if (!isPolling) setLoadingChat(true);
    try {
      let res, data;
      if (conv.type === 'booking') {
        res = await fetch(`/api/chat?bookingId=${conv.id}`);
        data = await res.json();
      } else {
        res = await fetch(`/api/direct-chat/${conv.id}/messages`);
        data = await res.json();
      }
      if (data.success) {
        if (isPolling) {
          setMessages((prev) => {
            const newData = data.data;
            const hasNew = newData.length !== prev.length || prev[prev.length - 1]?.id !== newData[newData.length - 1]?.id;
            if (!hasNew) return prev;
            // New messages detected - also mark notifications as read
            markConvNotificationsRead(conv.id);
            return newData;
          });
        } else {
          setMessages(data.data);
        }
      }
    } catch {
      // silencio
    } finally {
      if (!isPolling) setLoadingChat(false);
    }
  }, []);

  // Initial load and polling
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 15000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // Poll messages when a chat is open
  useEffect(() => {
    if (!selectedConv) return;
    initialChatLoadDone.current = false;
    fetchMessages(selectedConv, false);
    markConvNotificationsRead(selectedConv.id);
    const interval = setInterval(() => fetchMessages(selectedConv, true), 8000);
    return () => clearInterval(interval);
  }, [selectedConv, fetchMessages]);

  // Scroll to bottom only on message count change (not during polling)
  useEffect(() => {
    if (loadingChat) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages.length, loadingChat]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv || sending) return;
    setSending(true);
    try {
      if (selectedConv.type === 'booking') {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: selectedConv.id,
            content: newMessage.trim(),
          }),
        });
        const data = await res.json();
        if (data.success) {
          setNewMessage("");
          fetchMessages(selectedConv);
          fetchConversations();
        }
      } else {
        const res = await fetch(`/api/direct-chat/${selectedConv.id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newMessage.trim() }),
        });
        const data = await res.json();
        if (data.success) {
          setNewMessage("");
          fetchMessages(selectedConv);
          fetchConversations();
        }
      }
    } catch {
      // silencio
    } finally {
      setSending(false);
    }
  };

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

  const openChat = (conv: Conversation) => {
    setSelectedConv(conv);
    setTranslations({});
    setMessages([]);
  };

  const goBack = () => {
    setSelectedConv(null);
    setMessages([]);
    setTranslations({});
  };

  // Soft-delete a conversation
  const [deletingConv, setDeletingConv] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'direct' | 'booking'>('all');

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    if (!confirm(tChat('deleteConfirm'))) return;
    setDeletingConv(convId);
    try {
      const res = await fetch("/api/trash", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId, action: "soft_delete" }),
      });
      const data = await res.json();
      if (data.success) {
        // Remove from list, close if it was selected
        setConversations(prev => prev.filter(c => c.id !== convId));
        if (selectedConv?.id === convId) {
          setSelectedConv(null);
          setMessages([]);
          setTranslations({});
        }
        fetchConversations();
      }
    } catch {
      // silencio
    } finally {
      setDeletingConv(null);
    }
  };

  // Get display name for a conversation
  const getConvName = (conv: Conversation) => {
    return conv.type === 'booking' ? conv.customerName : conv.clientName;
  };

  // Get sender name for a message
  const getSenderName = (conv: Conversation, msg: Message) => {
    const isOwn = conv.type === 'booking'
      ? msg.sender === 'driver'
      : msg.sender === 'driver';
    return isOwn ? tChat('you') : getConvName(conv);
  };

  // Check if message is from driver
  const isOwnMessage = (conv: Conversation, msg: Message) => {
    return conv.type === 'booking'
      ? msg.sender === 'driver'
      : msg.sender === 'driver';
  };

  // Get last message info for conversation list
  const getLastMessageInfo = (conv: Conversation) => {
    if (conv.type === 'booking') {
      if (!conv.lastMessage) return null;
      return {
        content: conv.lastMessage.content,
        time: conv.lastMessage.createdAt,
        isOwn: conv.lastMessage.sender === 'driver',
      };
    } else {
      if (!conv.lastMessage) return null;
      return {
        content: conv.lastMessage,
        time: conv.lastMessageAt || conv.createdAt,
        isOwn: false,
      };
    }
  };

  // --- Chat View ---
  if (selectedConv) {
    const convName = getConvName(selectedConv);
    const convPhone = selectedConv.type === 'booking' ? selectedConv.customerPhone : null;

    return (
      <div className="flex flex-col h-[65vh] max-h-[65vh] border border-border rounded-lg bg-card">
        {/* Chat header */}
        <div className="flex items-center gap-3 p-3 border-b border-border flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={goBack} className="mr-1">
            <ChevronRight className="h-4 w-4 rotate-180" />
          </Button>
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <button
                className="font-semibold text-sm truncate hover:text-yellow-400 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedConv.type === 'booking') onOpenBooking?.(selectedConv.id);
                }}
              >
                {convName}
              </button>
              {selectedConv.type === 'direct' && (
                <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/30">
                  <MessageSquare className="h-3 w-3 mr-0.5" />
                  {tChat('directChat')}
                </Badge>
              )}
              {selectedConv.type === 'booking' && (
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${
                    statusColors[selectedConv.status] || statusColors.pending
                  }`}
                >
                  {selectedConv.status === "pending"
                    ? tStatus('pending')
                    : selectedConv.status === "confirmed"
                    ? tStatus('confirmed')
                    : selectedConv.status === "completed"
                    ? tStatus('completed')
                    : tStatus('cancelled')}
                </span>
              )}
            </div>
            {selectedConv.type === 'booking' && (
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{selectedConv.reference}</span>
                <span>·</span>
                <span className="truncate">{selectedConv.pickupAddress}</span>
              </div>
            )}
            {selectedConv.type === 'direct' && (
              <div className="text-[11px] text-muted-foreground">
                {tChat('directChatDesc')}
              </div>
            )}
          </div>
          {convPhone && (
            <a href={`tel:${convPhone}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <Phone className="h-4 w-4" />
              </Button>
            </a>
          )}
          {selectedConv.type === 'direct' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(tChat('deleteConfirm'))) {
                  handleDeleteConversation(e as unknown as React.MouseEvent, selectedConv.id);
                }
              }}
              className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground/50 hover:text-red-400 transition-colors flex-shrink-0"
              title={tChat('deleteChat')}
            >
              {deletingConv === selectedConv.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loadingChat && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">
                {tChat('noMessages')}
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const own = isOwnMessage(selectedConv, msg);
              const senderName = getSenderName(selectedConv, msg);
              return (
                <div
                  key={msg.id}
                  className={`flex ${own ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                      own
                        ? "bg-yellow-400/20 text-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] text-muted-foreground">
                        {senderName}
                      </span>
                      <span className="text-[10px] text-muted-foreground/50">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                    <p className="leading-relaxed">{msg.content}</p>
                    <button
                      onClick={() => translateMessage(msg.id, msg.content)}
                      disabled={translatingId === msg.id}
                      className={`mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors ${
                        translations[msg.id]
                          ? "text-muted-foreground font-semibold"
                          : ""
                      }`}
                      title={
                        translations[msg.id] ? tChat('hideTranslation') : tChat('translate')
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
                      <div className="mt-1.5 pt-1.5 border-t border-border">
                        <p className="text-xs italic text-muted-foreground">
                          {translations[msg.id]}
                        </p>
                      </div>
                    )}
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
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={tChat('writeMessage')}
            className="flex-1 bg-background border-border"
            disabled={sending}
          />
          <Button
            size="icon"
            className="h-9 w-9 bg-yellow-400 text-black hover:bg-yellow-500"
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

  // --- Conversations List View ---
  // Separate booking and direct conversations for section display
  const bookingConvs = conversations.filter(c => c.type === 'booking');
  const directConvs = conversations.filter(c => c.type === 'direct');

  // Apply filter
  const filteredConversations = activeFilter === 'all'
    ? conversations
    : conversations.filter(c => c.type === activeFilter);
  const filteredDirectConvs = activeFilter === 'booking' ? [] : (activeFilter === 'all' ? directConvs : directConvs);
  const filteredBookingConvs = activeFilter === 'direct' ? [] : (activeFilter === 'all' ? bookingConvs : bookingConvs);
  const hasDirectUnread = filteredDirectConvs.some(c => c.unreadCount > 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-yellow-400" />
          {tChat('conversations')}
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
          disabled={loading}
        >
          <Loader2
            className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`}
          />
          {tChat('refresh')}
        </Button>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={activeFilter === 'all' ? 'default' : 'outline'}
          className={activeFilter === 'all' ? 'bg-yellow-400 text-black hover:bg-yellow-500' : ''}
          onClick={() => setActiveFilter('all')}
        >
          {tChat('filterAll')}
        </Button>
        <Button
          size="sm"
          variant={activeFilter === 'direct' ? 'default' : 'outline'}
          className={activeFilter === 'direct' ? 'bg-yellow-400 text-black hover:bg-yellow-500' : ''}
          onClick={() => setActiveFilter('direct')}
        >
          <MessageSquare className="h-3.5 w-3.5 mr-1" />
          {tChat('filterDirect')}
        </Button>
        <Button
          size="sm"
          variant={activeFilter === 'booking' ? 'default' : 'outline'}
          className={activeFilter === 'booking' ? 'bg-yellow-400 text-black hover:bg-yellow-500' : ''}
          onClick={() => setActiveFilter('booking')}
        >
          <CalendarDays className="h-3.5 w-3.5 mr-1" />
          {tChat('filterBookings')}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {tChat('noConversations')}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {tChat('noConversationsHint')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Direct Conversations Section */}
          {filteredDirectConvs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs font-medium text-muted-foreground">
                  {tChat('directMessages')}
                </span>
                {hasDirectUnread && (
                  <Badge variant="outline" className="h-4 px-1.5 text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/30">
                    {filteredDirectConvs.reduce((s, c) => s + c.unreadCount, 0)} {tChat('unread')}
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                {filteredDirectConvs.map((conv) => {
                  const lastInfo = getLastMessageInfo(conv);
                  return (
                    <Card
                      key={`direct-${conv.id}`}
                      className="border-blue-500/20 bg-blue-500/[0.03] cursor-pointer hover:bg-blue-500/[0.07] transition-colors overflow-hidden"
                      onClick={() => openChat(conv)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                              <MessageSquare className="h-5 w-5 text-blue-400" />
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
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-semibold text-sm truncate">
                                  {conv.clientName}
                                </span>
                                <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/30 flex-shrink-0">
                                  {tChat('directChat')}
                                </Badge>
                              </div>
                              <span className="text-[11px] text-muted-foreground flex-shrink-0">
                                {lastInfo
                                  ? formatTime(lastInfo.time)
                                  : formatRelativeDate(conv.createdAt, tTime)}
                              </span>
                            </div>

                            {lastInfo && (
                              <div className="mt-1 flex items-center gap-1">
                                <span className="text-[11px] text-muted-foreground/70 truncate">
                                  {lastInfo.content}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Arrow + Delete */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => handleDeleteConversation(e, conv.id)}
                              className="p-1 rounded-md hover:bg-red-500/10 text-muted-foreground/40 hover:text-red-400 transition-colors"
                              title={tChat('deleteChat')}
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
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Booking Conversations Section */}
          {filteredBookingConvs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <CalendarDays className="h-3.5 w-3.5 text-yellow-400" />
                <span className="text-xs font-medium text-muted-foreground">
                  {tChat('bookingMessages')}
                </span>
                <Badge variant="outline" className="h-4 px-1.5 text-[10px] bg-yellow-400/10 text-yellow-400 border-yellow-400/30">
                  {filteredBookingConvs.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {filteredBookingConvs.map((conv) => {
                  const lastInfo = getLastMessageInfo(conv);
                  return (
                    <Card
                      key={`booking-${conv.id}`}
                      className="border-border bg-card cursor-pointer hover:bg-muted/10 transition-colors overflow-hidden"
                      onClick={() => openChat(conv)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-5 w-5 text-muted-foreground" />
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
                              <div className="flex items-center gap-2 min-w-0">
                                <button
                                  className="font-semibold text-sm truncate hover:text-yellow-400 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenBooking?.(conv.id);
                                  }}
                                >
                                  {conv.customerName}
                                </button>
                                <span
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border flex-shrink-0 ${
                                    statusColors[conv.status] || statusColors.pending
                                  }`}
                                >
                                  {conv.status === "pending"
                                    ? tStatus('pending')
                                    : conv.status === "confirmed"
                                    ? tStatus('confirmed')
                                    : conv.status === "completed"
                                    ? tStatus('completed')
                                    : tStatus('cancelled')}
                                </span>
                              </div>
                              <span className="text-[11px] text-muted-foreground flex-shrink-0">
                                {lastInfo
                                  ? formatTime(lastInfo.time)
                                  : formatRelativeDate(conv.createdAt, tTime)}
                              </span>
                            </div>

                            {/* Pickup address */}
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
                              <span className="text-xs text-muted-foreground truncate">
                                {conv.pickupAddress}
                              </span>
                            </div>

                            {/* Last message preview */}
                            {lastInfo && (
                              <div className="mt-1 flex items-center gap-1">
                                <span className="text-[11px] text-muted-foreground/70 truncate">
                                  <span className="font-medium">
                                    {lastInfo.isOwn ? `${tChat('you')}: ` : ""}
                                  </span>
                                  {lastInfo.content}
                                </span>
                              </div>
                            )}

                            {/* Meta info */}
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] text-muted-foreground/50">
                                {conv.reference}
                              </span>
                              {conv.scheduledDate && (
                                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/50">
                                  <CalendarDays className="h-2.5 w-2.5" />
                                  {conv.scheduledDate}
                                </span>
                              )}
                              {conv.scheduledTime && (
                                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/50">
                                  <Clock className="h-2.5 w-2.5" />
                                  {conv.scheduledTime}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Arrow */}
                          <ChevronRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
