import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Secure Data Room",
  description: "Enterprise-grade secure document sharing",
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
      <Providers>{children}</Providers>
      </body>
      </html>
  );
}