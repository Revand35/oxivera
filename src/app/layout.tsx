import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { SettingsApplier } from "./SettingsApplier";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

export const metadata: Metadata = {
  title: "Oxivera — Sistem Monitoring Filter Udara IoT",
  description:
    "Monitoring kualitas udara real-time sebelum dan sesudah filter untuk membuktikan efektivitas alat.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Oxivera",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#ff94c0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${plusJakarta.variable} ${fraunces.variable} h-full antialiased scroll-smooth`}
    >
      <head></head>
      <body className="min-h-full flex flex-col">
        <SettingsApplier>
          <AuthProvider>{children}</AuthProvider>
        </SettingsApplier>
      </body>
    </html>
  );
}
