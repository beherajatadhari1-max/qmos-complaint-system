import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import TopRibbon from "./components/TopRibbon";
import { headers } from "next/headers";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "QMOS — Quality Management Operating System",
  description: "AI-Powered Digital Quality Operating System — IATF 16949 | ISO 9001 | AIAG | VDA",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || headersList.get("x-invoke-path") || "";
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/access-denied");

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className={isAuthPage ? "min-h-screen" : "flex h-screen overflow-hidden bg-gray-100"}>
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
          </>
        )}
      </body>
    </html>
  );
}
