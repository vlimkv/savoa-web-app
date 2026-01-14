// src/app/layout.tsx
import "./globals.css";
import AuthGate from "@/components/AuthGate";
import Navigation from "@/components/Navigation";

export const metadata = {
  title: "SAVOA Web",
  description: "SAVOA Web App",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-black text-white antialiased">
        <AuthGate>
          {/* App Shell: один общий Navigation для всех страниц */}
          <div className="flex min-h-screen bg-black">
            <Navigation />

            {/* Main content */}
            <div className="flex-1 relative w-full min-w-0">
              {/* 
                pb-[80px] — чтобы на мобиле контент не прятался под bottom tabbar.
                На десктопе padding убираем.
              */}
              <main className="min-h-screen pb-[80px] md:pb-0">{children}</main>
            </div>
          </div>
        </AuthGate>
      </body>
    </html>
  );
}
