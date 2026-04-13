import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SureOdds — AI-Powered Sports Betting Logic Engine",
  description:
    "Data-driven predictions and analytics for football and basketball betting markets. Powered by advanced AI confidence scoring.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
