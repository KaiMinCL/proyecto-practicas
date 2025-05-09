import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext"; 
import { Toaster as SonnerToaster } from 'sonner'; // Si no lo tienes globalmente ya

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
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          {/* Aquí podrías haber un Navbar/Header que use useAuth() */}
          {/* <Navbar /> */}
          <main>{children}</main>
          <SonnerToaster richColors position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}