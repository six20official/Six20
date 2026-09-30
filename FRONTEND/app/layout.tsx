import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIX20",
  description: "Entertainment. Live. Games. Social. Rewards.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
