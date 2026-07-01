import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorker from "@/components/ServiceWorker";

export const metadata: Metadata = {
  title: "NextP",
  description: "O teu ajudador financeiro pessoal — regista os pequenos gastos e vê para onde foi o dinheiro.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "NextP",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#F7FBFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
