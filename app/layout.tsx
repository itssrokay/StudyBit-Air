import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Learning Space · A little progress, every day",
  description: "Your courses, videos, articles and ideas. One thoughtful learning plan.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
