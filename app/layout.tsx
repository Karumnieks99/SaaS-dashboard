import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// The data voice: a distinct mono for every numeral (stat values, table
// figures, axis ticks, tooltips) so data reads apart from the UI chrome.
const splineMono = Spline_Sans_Mono({
  variable: "--font-spline-mono",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s · Pulse",
    default: "Pulse",
  },
  description:
    "Revenue analytics for a fictional B2B SaaS — a portfolio dashboard with a fully simulated API.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${splineMono.variable} ${bricolage.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
