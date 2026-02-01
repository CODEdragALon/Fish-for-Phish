import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fish for Phish - Phishing Awareness Training",
  description: "Train yourself to spot phishing attacks with realistic email simulations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
