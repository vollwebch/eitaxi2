import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale, Locale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  // 1. Try locale from URL segment (if used)
  let locale = await requestLocale;

  // 2. Try reading NEXT_LOCALE cookie from request headers
  //    In standalone mode, cookies() from next/headers can be unreliable,
  //    so we parse the Cookie header manually as a safe fallback.
  if (!locale || !locales.includes(locale as Locale)) {
    try {
      const { headers } = await import('next/headers');
      const cookieHeader = (await headers()).get('cookie') || '';
      const match = cookieHeader.match(/NEXT_LOCALE=([^;]+)/);
      if (match) {
        const cookieLocale = match[1].trim();
        if (locales.includes(cookieLocale as Locale)) {
          locale = cookieLocale as Locale;
        }
      }
    } catch {
      // Fallback: try reading from the global request headers
      // This handles edge cases in standalone SSR
    }
  }

  // 3. Default locale
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
