'use client';

import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading } = useAuth();
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          {/* loading skeleton or spinner */}
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="flex-1">
          {children}
        </div>
      )}
    </div>
  );
}
