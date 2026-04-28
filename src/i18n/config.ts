import { Pathnames, LocalePrefix } from 'next-intl/routing';

export const locales = ['es', 'de', 'fr', 'it', 'en', 'pt'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'es';

// Mapeo de idiomas por código de país o preferencia regional
export const localeMap: Record<string, Locale> = {
  'es': 'es', 'es-ES': 'es', 'es-MX': 'es', 'es-AR': 'es',
  'de': 'de', 'de-DE': 'de', 'de-AT': 'de', 'de-CH': 'de',
  'fr': 'fr', 'fr-FR': 'fr', 'fr-CH': 'fr', 'fr-BE': 'fr',
  'it': 'it', 'it-IT': 'it', 'it-CH': 'it',
  'en': 'en', 'en-GB': 'en', 'en-US': 'en', 'en-CH': 'en',
  'pt': 'pt', 'pt-PT': 'pt', 'pt-BR': 'pt',
};

// Nombres de idiomas en su propio idioma
export const localeNames: Record<Locale, string> = {
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
  en: 'English',
  pt: 'Português',
};

// Bandera emoji para cada idioma
export const localeFlags: Record<Locale, string> = {
  es: '🇪🇸',
  de: '🇩🇪',
  fr: '🇫🇷',
  it: '🇮🇹',
  en: '🇬🇧',
  pt: '🇵🇹',
};

export const pathnames: Pathnames<typeof locales> = {
  '/': '/',
};

export const localePrefix: LocalePrefix<typeof locales> = 'never' as LocalePrefix<typeof locales>;
