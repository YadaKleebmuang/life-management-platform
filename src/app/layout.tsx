import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { ClientAppWrapper } from "@/components/layout/ClientAppWrapper";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-sans-thai",
});

export const metadata: Metadata = {
  title: "Life Management Platform",
  description: "A comprehensive platform to manage your life, finances, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${notoSansThai.variable}`}>
      <body className="font-sans antialiased">
        <ClientAppWrapper>{children}</ClientAppWrapper>
      </body>
    </html>
  );
}
