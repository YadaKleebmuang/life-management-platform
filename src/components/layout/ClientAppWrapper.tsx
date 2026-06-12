"use client";

import { usePathname } from "next/navigation";
import { AuthProvider } from "@/features/auth/contexts/AuthContext";
import { AuthGuard } from "@/features/auth/components/AuthGuard";
import { MainLayout } from "./MainLayout";

const PUBLIC_ROUTES = ["/login", "/register"];

export function ClientAppWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  return (
    <AuthProvider>
      <AuthGuard>
        {isPublicRoute ? children : <MainLayout>{children}</MainLayout>}
      </AuthGuard>
    </AuthProvider>
  );
}
