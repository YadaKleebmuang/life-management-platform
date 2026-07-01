"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PieChart, Settings, Building2, Tags, Scale, Target, Repeat, X, ClipboardList, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "แดชบอร์ด", href: "/", icon: LayoutDashboard },
  { name: "บัญชีของฉัน", href: "/finance/accounts", icon: Building2 },
  { name: "ติดตามงาน", href: "/work-sheet", icon: ClipboardList },
  { name: "ธุรกรรมการเงิน", href: "/finance/transactions", icon: ArrowRightLeft },
  { name: "เป้าหมายการออม", href: "/finance/goals", icon: Target },
  { name: "หนี้สิน", href: "/finance/debts", icon: Scale },
  { name: "รายการประจำ", href: "/finance/recurring-transactions", icon: Repeat },
  { name: "หมวดหมู่", href: "/finance/categories", icon: Tags },
  { name: "สรุปรายเดือน", href: "/finance/summary", icon: PieChart },
  { name: "ตั้งค่า", href: "/finance/settings", icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-[#FAFAFA] border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center">
            <Image src="/favicon.ico" alt="Life Platform Logo" width={24} height={24} className="w-6 h-6 mr-2 rounded-sm" />
            <span className="text-xl font-bold text-gray-900">
              Life Platform
            </span>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-2 -mr-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
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
                onClick={() => {
                  if (window.innerWidth < 768 && onClose) {
                    onClose();
                  }
                }}
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

        <div className="p-4 border-t border-gray-200 text-xs text-gray-500 text-center flex-shrink-0">
          &copy; 2026 Life Management
        </div>
      </aside>
    </>
  );
}
