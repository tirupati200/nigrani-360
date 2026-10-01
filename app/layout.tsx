import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NIGRANI 360 | Government Welfare Monitoring Command Center",
  description:
    "Smart Real-Time Monitoring & Inspection System for Government Welfare Projects (SIH26095) - Ministry of Social Justice & Empowerment",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans">
        {children}
      </body>
    </html>
  );
}
