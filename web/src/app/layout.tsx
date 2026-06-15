import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ConferAI - Real-Time Conference Transcription",
  description: "Live captioning and intelligent transcription for modern conferences and meetings.",
};

import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
