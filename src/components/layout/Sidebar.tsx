"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, Receipt, PieChart, Settings, Activity, Building2, ArrowRightLeft, Tags } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "แดชบอร์ด", href: "/", icon: LayoutDashboard },
  { name: "บัญชีของฉัน", href: "/finance/accounts", icon: Building2 },
  { name: "โอนเงิน", href: "/finance/transfers", icon: ArrowRightLeft },
  { name: "รายรับ", href: "/finance/income", icon: Wallet },
  { name: "รายจ่าย", href: "/finance/expenses", icon: Receipt },
  { name: "หมวดหมู่", href: "/finance/categories", icon: Tags },
  { name: "สรุปรายเดือน", href: "/finance/summary", icon: PieChart },
  { name: "ตั้งค่า", href: "/finance/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 bg-[#FAFAFA] border-r border-gray-200 hidden md:flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Activity className="h-6 w-6 text-gray-900 mr-2" />
        <span className="text-xl font-bold text-gray-900">
          Life Platform
        </span>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">
          Finance Module
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className={cn("h-5 w-5 mr-3", isActive ? "text-gray-900" : "text-gray-500")} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-200 text-xs text-gray-500 text-center">
        &copy; 2026 Life Management
      </div>
    </aside>
  );
}
