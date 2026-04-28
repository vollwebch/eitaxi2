"use client";

import { useState, useEffect } from "react";
import { Shield, Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl';

const COOKIE_CONSENT_KEY = "cookie-consent";

type ConsentType = "all" | "essential" | "rejected" | null;

export default function CookieBanner() {
  const t = useTranslations('cookies');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (type: ConsentType) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, type || "essential");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] p-4">
      <div className="max-w-4xl mx-auto bg-card border border-border rounded-2xl shadow-2xl p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Texto */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Cookie className="h-5 w-5 text-yellow-400" />
              <h3 className="font-semibold text-lg">
                🍪 {t('title')}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('description')}
            </p>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-2 md:items-start flex-shrink-0">
            <Button
              className="bg-yellow-400 text-black hover:bg-yellow-500 text-sm font-semibold"
              onClick={() => saveConsent("all")}
            >
              <Shield className="mr-1.5 h-4 w-4" />
              {t('acceptAll')}
            </Button>
            <Button
              variant="outline"
              className="border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10 text-sm"
              onClick={() => saveConsent("essential")}
            >
              {t('essentialOnly')}
            </Button>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground text-sm"
              onClick={() => saveConsent("rejected")}
            >
              {t('reject')}
            </Button>
          </div>
        </div>

        {/* Botón cerrar */}
        <button
          onClick={() => saveConsent("essential")}
          className="absolute top-3 right-3 p-1 hover:bg-muted rounded-full transition-colors md:hidden"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
