'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Locale, localeNames, localeFlags, locales } from '@/i18n/config';
import { useRouter, usePathname } from '@/i18n/routing';
import { useState, useEffect } from 'react';

export function useAppLocale() {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  
  // Estado para almacenar el locale detectado del navegador
  const [browserLocale, setBrowserLocale] = useState<Locale | null>(null);
  
  useEffect(() => {
    // Detectar idioma del navegador solo en el cliente
    const browserLang = navigator.language || (navigator as any).userLanguage;
    if (browserLang) {
      const baseCode = browserLang.split('-')[0];
      if (locales.includes(baseCode as Locale)) {
        setBrowserLocale(baseCode as Locale);
      }
    }
  }, []);
  
  const changeLocale = (newLocale: Locale) => {
    // Guardar preferencia en cookie
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=${60 * 60 * 24 * 365}`;
    
    // Navegar a la misma página pero con el nuevo locale
    router.replace(pathname, { locale: newLocale });
  };
  
  return {
    locale,
    t,
    changeLocale,
    browserLocale,
    localeName: localeNames[locale],
    localeFlag: localeFlags[locale],
    allLocales: locales.map(l => ({
      code: l,
      name: localeNames[l],
      flag: localeFlags[l]
    }))
  };
}
