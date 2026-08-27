"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, Shield, LogOut, ChevronDown } from "lucide-react";

interface DropdownUserProps {
  user: { id: string; username: string; role: string } | null;
}

export function DropdownUser({ user }: DropdownUserProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const dropdown = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!dropdown.current) return;
      if (
        !dropdownOpen ||
        dropdown.current.contains(target as Node) ||
        trigger.current?.contains(target as Node)
      )
        return;
      setDropdownOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // Close on Escape
  useEffect(() => {
    const keyHandler = ({ key }: KeyboardEvent) => {
      if (!dropdownOpen || key !== "Escape") return;
      setDropdownOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  const handleLogout = () => {
    document.cookie = "auth_token=; Max-Age=0; path=/";
    window.location.href = "/login";
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "admin":
        return "Quản trị viên";
      case "leader":
        return "Lãnh đạo";
      case "officer":
        return "Cán bộ";
      default:
        return "Khách";
    }
  };

  return (
    <div className="relative">
      <button
        ref={trigger}
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-3 py-1.5 px-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-expanded={dropdownOpen}
        aria-label="Menu tài khoản người dùng"
      >
        <div className="flex flex-col text-right hidden sm:block">
          <span className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
            {user?.username || "Khách"}
          </span>
          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {getRoleBadge(user?.role)}
          </span>
        </div>

        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold shadow-md">
          <User className="w-5 h-5" />
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform duration-200 hidden sm:block ${
            dropdownOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Content */}
      {dropdownOpen && (
        <div
          ref={dropdown}
          className="absolute right-0 mt-3 w-64 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="p-3 border-b border-slate-100 dark:border-slate-700/60 mb-1">
            <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
              Tài khoản đang đăng nhập
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
              {user?.username || "Khách"}
            </p>
            <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800/60">
              Vai trò: {getRoleBadge(user?.role)}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            {user?.role === "admin" && (
              <Link
                href="/accounts"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-xl transition-colors"
              >
                <Shield className="w-4 h-4 text-blue-500" />
                Quản lý phân quyền
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer w-full text-left"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất hệ thống
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
