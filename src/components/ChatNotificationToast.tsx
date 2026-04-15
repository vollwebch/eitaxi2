"use client";

import { useState, useEffect } from 'react';
import { X, MessageCircle } from 'lucide-react';

interface ChatNotificationToastProps {
  senderName: string;
  message: string;
  onOpen: () => void;
  onClose: () => void;
}

export default function ChatNotificationToast({
  senderName,
  message,
  onOpen,
  onClose,
}: ChatNotificationToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-card border border-yellow-400/30 rounded-lg shadow-lg p-4 max-w-sm animate-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center flex-shrink-0">
          <MessageCircle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-yellow-400">{senderName}</p>
          <p className="text-sm text-muted-foreground truncate">{message}</p>
        </div>
        <button
          onClick={() => {
            setVisible(false);
            onClose();
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <button
        onClick={() => {
          onOpen();
          setVisible(false);
          onClose();
        }}
        className="w-full mt-2 text-sm text-yellow-400 hover:text-yellow-300 font-medium"
      >
        Abrir chat
      </button>
    </div>
  );
}
