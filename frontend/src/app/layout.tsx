import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";

import { Toaster } from "sonner";

import "./globals.css";

const displayFont = Sora({
  subsets: ["latin"],
  variable: "--font-display"
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "S3 Uploader Auth",
  description: "Authentication UI for the S3 uploader project"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>): JSX.Element {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable} text-ink`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
