import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale, Locale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  // Obtener el locale del request o usar el default
  let locale = await requestLocale;
  
  // Si no hay locale válido, usar el default
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }
  
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
