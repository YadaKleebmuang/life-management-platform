"use client";

import { useState } from "react";
import { Bell, Search, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/features/auth/contexts/AuthContext";
import { logoutUser } from "@/features/auth/services/authService";
import { useRouter } from "next/navigation";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.push("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const initial = userProfile?.displayName
    ? userProfile.displayName.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden md:flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 w-64 focus-within:ring-2 focus-within:ring-gray-900 focus-within:border-transparent transition-all">
          <Search className="h-4 w-4 text-gray-500 mr-2" />
          <input 
            type="text" 
            placeholder="ค้นหา..." 
            className="bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400 w-full"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Mobile Search Button (replaces full search bar on small screens) */}
        <button className="md:hidden p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-colors">
          <Search className="h-5 w-5" />
        </button>

        <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-colors relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-gray-900 border-2 border-white"></span>
        </button>
        
        <div className="relative pl-1">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-900 text-sm font-semibold border border-gray-200 hover:bg-gray-200 transition-all focus:outline-none"
          >
            {initial}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userProfile?.displayName || "ผู้ใช้งาน"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                ออกจากระบบ
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
