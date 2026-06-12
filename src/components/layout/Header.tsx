"use client";

import { useState } from "react";
import { Bell, Search, LogOut } from "lucide-react";
import { useAuth } from "@/features/auth/contexts/AuthContext";
import { logoutUser } from "@/features/auth/services/authService";
import { useRouter } from "next/navigation";

export function Header() {
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
    <header className="h-16 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 sticky top-0 z-10">
      <div className="flex items-center bg-slate-800/50 rounded-full px-3 py-1.5 border border-slate-700/50 w-64">
        <Search className="h-4 w-4 text-slate-400 mr-2" />
        <input 
          type="text" 
          placeholder="ค้นหา..." 
          className="bg-transparent border-none outline-none text-sm text-slate-200 placeholder:text-slate-500 w-full"
        />
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="p-2 text-slate-400 hover:text-slate-200 transition-colors relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-slate-900"></span>
        </button>
        
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold border-2 border-slate-800 hover:ring-2 hover:ring-blue-500/50 transition-all focus:outline-none"
          >
            {initial}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-1 z-50">
              <div className="px-4 py-2 border-b border-slate-800">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {userProfile?.displayName || "ผู้ใช้งาน"}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-800 flex items-center transition-colors"
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
