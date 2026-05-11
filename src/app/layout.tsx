import type { Metadata } from "next";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip"
import { LanguageProvider } from "@/i18n/LanguageProvider"
import { QueryProvider } from "@/providers/QueryProvider"

export const metadata: Metadata = {
  title: "Dos Tazas Management",
  description: "POS and Order Management for Dos Tazas",
  manifest: "/manifest.json",
  themeColor: "#FCF9F2",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dos Tazas",
  },
  icons: {
    icon: "/assets/LOGO-05.svg",
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full bg-white-pergamino text-expresso">
        <QueryProvider>
          <LanguageProvider>
            <TooltipProvider>
              {children}
            </TooltipProvider>
          </LanguageProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

