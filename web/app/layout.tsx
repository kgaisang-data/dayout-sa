import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: "DayOut South Africa | What are we doing today?",
  description:
    "A budget-aware day-out planner that helps people discover Johannesburg places and local businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-ZA">
      <body className="bg-[#fffaf5] font-sans text-slate-900">
        {children}
      </body>
    </html>
  );
}