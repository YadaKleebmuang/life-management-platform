"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { useAutoLogout } from "../hooks/useAutoLogout";

const PUBLIC_ROUTES = ["/login", "/register"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // ตั้งเวลาให้ออกจากระบบอัตโนมัติหากไม่มีการใช้งาน 15 นาที
  useAutoLogout(5 * 60 * 1000);

  useEffect(() => {
    if (!loading) {
      const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
      if (!user && !isPublicRoute) {
        // Redirect unauthenticated users to login
        router.push("/login");
      } else if (user && isPublicRoute) {
        // ป้องกันไม่ให้ redirect ไปหน้าแรกทันทีระหว่างที่ระบบกำลังสร้างบัญชี
        const isRegistering = typeof window !== 'undefined' ? sessionStorage.getItem('isRegistering') : null;
        if (isRegistering === "true") {
          return;
        }
        // Redirect authenticated users away from public routes
        router.push("/");
      }
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Prevent flashing protected content before redirect
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  if (!user && !isPublicRoute) return null;
  if (user && isPublicRoute) return null;

  return <>{children}</>;
}
