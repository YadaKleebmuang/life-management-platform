import { Bell, Search, User } from "lucide-react";

export function Header() {
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
        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold border-2 border-slate-800">
          U
        </div>
      </div>
    </header>
  );
}
