import * as React from "react";

export function Dialog({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">{children}</div>;
}

export function DialogTrigger({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) {
  return <>{children}</>;
}

export function DialogContent({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded p-6 w-full max-w-md">{children}</div>;
}