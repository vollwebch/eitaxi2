import { setRequestLocale } from 'next-intl/server';
import { locales, Locale } from '@/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const currentLocale = locales.includes(locale as Locale) ? locale as Locale : 'en';
  
  setRequestLocale(currentLocale);
  
  return <>{children}</>;
}
