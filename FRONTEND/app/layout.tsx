import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIX20 — Universal Entertainment",
  description: "Discover videos, creators, LIVE entertainment, games, music and community on SIX20.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] text-white antialiased">
        {children}
      </body>
    </html>
  );
}