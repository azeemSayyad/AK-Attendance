import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PWARegister from "@/components/PWARegister";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  applicationName: "AK Attendance",
  title: "AK Attendance Tracker",
  description: "Attendance, wages and project tracking for contractors.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AK Attendance",
  },
  // Favicon + apple-touch icon are served automatically from
  // src/app/icon.png and src/app/apple-icon.png (Next file conventions).
};

export const viewport: Viewport = {
  themeColor: "#a78bda",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
