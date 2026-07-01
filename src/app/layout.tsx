import type { Metadata } from "next";
import "./globals.css";
import { ClientAppWrapper } from "@/components/layout/ClientAppWrapper";

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
    <html lang="th">
      <body className="font-sans antialiased">
        <ClientAppWrapper>{children}</ClientAppWrapper>
      </body>
    </html>
  );
}
