import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import TopRibbon from "./components/TopRibbon";
import CoreToolCopilot from "./components/CoreToolCopilot";
import { headers } from "next/headers";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "QMOS — Quality Management Operating System",
  description: "AI-Powered Digital Quality Operating System — IATF 16949 | ISO 9001 | AIAG | VDA",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "QMOS",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192" }],
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || headersList.get("x-invoke-path") || "";
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/access-denied");

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#15803d" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      </head>
      <body className={isAuthPage ? "min-h-screen" : "flex h-screen overflow-hidden bg-white"}>
        {isAuthPage ? (
          <>{children}</>
        ) : (
          <>
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <TopRibbon />
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
            <CoreToolCopilot />
          </>
        )}
      </body>
    </html>
  );
}
