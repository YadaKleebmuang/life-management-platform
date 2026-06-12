"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, Receipt, PieChart, Settings, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "แดชบอร์ด", href: "/", icon: LayoutDashboard },
  { name: "รายรับ", href: "/finance/income", icon: Wallet },
  { name: "รายจ่าย", href: "/finance/expenses", icon: Receipt },
  { name: "สรุปรายเดือน", href: "/finance/summary", icon: PieChart },
  { name: "ตั้งค่า", href: "/finance/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <Activity className="h-6 w-6 text-blue-500 mr-2" />
        <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Life Platform
        </span>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">
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
                  ? "bg-blue-600/10 text-blue-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <Icon className={cn("h-5 w-5 mr-3", isActive ? "text-blue-400" : "text-slate-500")} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
        &copy; 2026 Life Management
      </div>
    </aside>
  );
}
