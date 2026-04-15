import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#facc15",
};

export const metadata: Metadata = {
  title: "eitaxi - Encuentra tu taxi en Suiza",
  description: "La plataforma líder de taxis en Suiza. Encuentra taxistas verificados, reserva traslados al aeropuerto, viajes de larga distancia y más. Conecta directamente con conductores profesionales.",
  keywords: ["taxi", "Suiza", "Zürich", "Ginebra", "Bern", "traslado", "aeropuerto", "taxista"],
  authors: [{ name: "eitaxi" }],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚕</text></svg>",
    apple: "/icons/icon-192x192.png",
  },
  openGraph: {
    title: "eitaxi - Tu taxi en Suiza",
    description: "Encuentra tu taxi ideal en Suiza. Taxistas verificados, servicio 24/7.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="dark">
      <head>
        {/* PWA meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="eitaxi" />
        <link rel="apple-touch-icon" href="/icons/icon-512x512.svg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <PWAInstallPrompt />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Dynamic manifest based on URL
              (function() {
                var path = window.location.pathname;
                var manifestUrl = '/manifest-client.json';
                if (path.startsWith('/widget') || path.startsWith('/gps-quick')) {
                  manifestUrl = '/manifest.json';
                }
                var link = document.createElement('link');
                link.rel = 'manifest';
                link.href = manifestUrl;
                document.head.appendChild(link);
              })();

              // Register Service Worker
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('SW registered: ', registration);
                    },
                    function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
