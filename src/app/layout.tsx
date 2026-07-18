import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { HolographicBackground } from "@/components/holographic-background";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cohort PM | RAVEN-dubgub",
  description:
    "Hult Cohort Developer Program - Week 1 project management platform submission.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-holo-effects="on"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var v=localStorage.getItem("pm-holo-effects");document.documentElement.dataset.holoEffects=v==="off"?"off":"on";}catch(e){}})();`,
          }}
        />
      </head>
      <body className="holo-theme min-h-full flex flex-col text-slate-100">
        <HolographicBackground />
        <div className="holo-content flex min-h-full flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
