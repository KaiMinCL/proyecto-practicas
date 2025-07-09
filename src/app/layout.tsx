import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { InactivityProvider } from "@/contexts/InactivityContext";
import { Toaster as SonnerToaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema de Prácticas",
  description: "Sistema de Gestión de prácticas profesionales", 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <InactivityProvider>
            <main>{children}</main>
            <SonnerToaster richColors position="top-center" />
          </InactivityProvider>
        </AuthProvider>
      </body>
    </html>
  );
}