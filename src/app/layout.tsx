import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthWrapper from "@/components/layout/AuthWrapper";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SpelPlaut - Reserva Canchas en Loma Plata",
  description:
    "SpelPlaut - La app móvil para reservar canchas deportivas en Loma Plata. Spel (jugar) en tu ciudad favorita.",
  manifest: "/manifest.json",
  keywords: [
    "reserva",
    "canchas",
    "deportes",
    "fútbol",
    "Loma Plata",
    "Paraguay",
    "SpelPlaut",
    "Plautdietsch",
  ],
  authors: [{ name: "SpelPlaut Team" }],
  creator: "SpelPlaut",
  publisher: "SpelPlaut",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SpelPlaut - Reserva Canchas en Loma Plata",
    description:
      "SpelPlaut - La app móvil para reservar canchas deportivas en Loma Plata. Spel (jugar) en tu ciudad favorita.",
    url: "http://localhost:3000",
    siteName: "SpelPlaut",
    locale: "es_PY",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SpelPlaut - Reserva Canchas en Loma Plata",
    description:
      "SpelPlaut - La app móvil para reservar canchas deportivas en Loma Plata. Spel (jugar) en tu ciudad favorita.",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192x192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SpelPlaut",
  },
  applicationName: "SpelPlaut",
  category: "sports",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <meta name="theme-color" content="#10b981" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SpelPlaut" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <AuthWrapper>{children}</AuthWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
