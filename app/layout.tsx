import type { Metadata } from "next";
import "./globals.css";
import "./mobile.css";
import "./goal-tools.css";
import "./product.css";
import "./time-log.css";
import "./phone.css";
import "./coach.css";
import "./brief.css";
import "./health-theme.css";
import "./reading-list.css";
import "./week.css";
import "./hero.css";
import {themeBootstrap} from "../lib/theme";

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
    <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:themeBootstrap}}/></head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
