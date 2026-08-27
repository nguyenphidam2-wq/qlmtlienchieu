"use client";

import { Search, Menu, Shield } from "lucide-react";
import { DarkModeSwitcher } from "./DarkModeSwitcher";
import { DropdownUser } from "./DropdownUser";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
  user: { id: string; username: string; role: string } | null;
}

export function Header({ sidebarOpen, setSidebarOpen, user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex w-full bg-white/95 dark:bg-[#1A222C]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
      <div className="flex flex-grow items-center justify-between px-4 py-3 md:px-6 2xl:px-8">
        {/* Left Section: Hamburger button & Quick Title */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            aria-controls="sidebar"
            aria-label="Đóng mở thanh điều hướng"
            onClick={(e) => {
              e.stopPropagation();
              setSidebarOpen(!sidebarOpen);
            }}
            className="flex items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden lg:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs font-bold tracking-wide">
              <Shield className="w-3.5 h-3.5" />
              <span>HỆ THỐNG QUẢN LÝ ĐỊA BÀN PHƯỜNG LIÊN CHIỂU</span>
            </div>
          </div>
        </div>

        {/* Right Section: Theme Toggle & User Dropdown */}
        <div className="flex items-center gap-3 sm:gap-4">
          <DarkModeSwitcher />
          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
          <DropdownUser user={user} />
        </div>
      </div>
    </header>
  );
}
