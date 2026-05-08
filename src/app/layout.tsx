import type { Metadata } from "next";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip"

export const metadata: Metadata = {
  title: "Dos Tazas Management",
  description: "POS and Order Management for Dos Tazas",
  icons: {
    icon: "/assets/LOGO-05.svg",
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
    >
      <body className="min-h-full bg-white-pergamino text-expresso">
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
