import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "RequestHandoff | Every Call Covered",
  description:
    "Austin-local call coverage for home-service businesses. Flat rate, no escalation fees, and clean lead handoff into the tools you already use.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
