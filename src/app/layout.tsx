// src/app/layout.tsx
import "./globals.css";
import type { Metadata, Viewport } from "next";
import AuthGate from "@/components/AuthGate";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "SAVOA Web",
  description: "SAVOA Web App",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SAVOA",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-black text-white antialiased">
        <AuthGate>
          <div className="flex min-h-screen bg-black">
            <Navigation />

            <div className="flex-1 relative w-full min-w-0">
              <main className="min-h-screen pb-[80px] md:pb-0">{children}</main>
            </div>
          </div>
        </AuthGate>
      </body>
    </html>
  );
}