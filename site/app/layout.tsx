import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BugBaas Web",
  description: "Speel BugBaas op pc, iPhone en iPad.",
  icons: {
    icon: "/bugbaas-icon.png",
    shortcut: "/bugbaas-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
