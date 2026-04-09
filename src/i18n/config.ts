import { Pathnames, LocalePrefix } from 'next-intl/routing';

export const locales = ['es', 'de', 'en', 'fr', 'it', 'pt'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

// Mapeo de idiomas por código de país o preferencia regional
export const localeMap: Record<string, Locale> = {
  // Español
  'es': 'es',
  'es-ES': 'es',
  'es-MX': 'es',
  'es-AR': 'es',
  'es-CO': 'es',
  'es-CL': 'es',
  'es-PE': 'es',
  
  // Alemán
  'de': 'de',
  'de-DE': 'de',
  'de-AT': 'de',
  'de-CH': 'de',
  
  // Inglés
  'en': 'en',
  'en-US': 'en',
  'en-GB': 'en',
  'en-AU': 'en',
  'en-CA': 'en',
  
  // Francés
  'fr': 'fr',
  'fr-FR': 'fr',
  'fr-CH': 'fr',
  'fr-BE': 'fr',
  'fr-CA': 'fr',
  
  // Italiano
  'it': 'it',
  'it-IT': 'it',
  'it-CH': 'it',
  
  // Portugués
  'pt': 'pt',
  'pt-PT': 'pt',
  'pt-BR': 'pt',
};

// Nombres de idiomas en su propio idioma
export const localeNames: Record<Locale, string> = {
  es: 'Español',
  de: 'Deutsch',
  en: 'English',
  fr: 'Français',
  it: 'Italiano',
  pt: 'Português',
};

// Bandera emoji para cada idioma
export const localeFlags: Record<Locale, string> = {
  es: '🇪🇸',
  de: '🇩🇪',
  en: '🇬🇧',
  fr: '🇫🇷',
  it: '🇮🇹',
  pt: '🇵🇹',
};

export const pathnames: Pathnames<typeof locales> = {
  '/': '/',
};

export const localePrefix: LocalePrefix<typeof locales> = 'as-needed' as LocalePrefix<typeof locales>;
