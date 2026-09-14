import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "../components/shell/AppShell";

export const metadata: Metadata = {
  title: "AEGIS: Enterprise Mission Control OS",
  description: "Futuristic human-aware cyber-physical strategy operations center for Formula-1 racing intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#050507] text-white overflow-hidden">
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
