"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { useEffect, useState } from "react";
import { getCurrentUserInfo } from "@/lib/actions/subjects";
import {
  BarChart3,
  Users,
  Store,
  Map,
  Shield,
  Sun,
  Moon,
} from "lucide-react";
import Image from "next/image";

// Định nghĩa menu với các vai trò được phép truy cập
// guest: không thấy "Quản lý Phân quyền" và "Bản đồ GIS"
// officer: không thấy "Quản lý Phân quyền"
const navItems = [
  { href: "/", label: "Báo cáo", icon: BarChart3, section: "Tổng quan", roles: ["admin", "leader", "officer", "guest"] },
  { href: "/subjects", label: "Đối tượng quản lý", icon: Users, section: "Quản lý", roles: ["admin", "leader", "officer", "guest"] },
  { href: "/businesses", label: "Cơ sở kinh doanh", icon: Store, section: "Quản lý", roles: ["admin", "leader", "officer", "guest"] },
  { href: "/gis", label: "Bản đồ GIS", icon: Map, section: "Phân tích", roles: ["admin", "leader"] }, // Chỉ admin và leader
  { href: "/accounts", label: "Quản lý Phân quyền", icon: Shield, section: "Hệ thống", roles: ["admin"] }, // Chỉ admin
];

export function Sidebar({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; role: string } | null>(null);

  // Lấy thông tin user hiện tại khi component mount
  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUserInfo();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  // Lọc menu theo role của user
  const visibleNavItems = navItems.filter(item =>
    currentUser && item.roles.includes(currentUser.role)
  );

  return (
    <aside className="w-64 min-h-screen bg-slate-800 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-14 h-14 relative flex-shrink-0 bg-white rounded-full p-1 shadow-[0_0_15px_rgba(234,179,8,0.3)] border-2 border-yellow-500/80 overflow-hidden transform transition-transform hover:scale-105">
            <img src="/logo.png?v=2" alt="Logo CA" className="w-full h-full object-contain p-0.5" />
          </div>
          <div className="flex flex-col text-left justify-center">
            <h1 style={{ color: '#eab308', fontSize: '13px', lineHeight: '1.2', fontWeight: 'bold' }} className="tracking-wider m-0 p-0">
              CÔNG AN PHƯỜNG<br />LIÊN CHIỂU
            </h1>
            <span style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }} className="font-semibold mt-0.5">
              Hệ thống nghiệp vụ
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-6 py-3 text-sm transition-all duration-200
                ${isActive
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }
              `}
              onClick={() => {
                if(onCloseMobile) onCloseMobile();
              }}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 transition-all duration-200 group"
        >
          <span className="text-sm text-slate-300 group-hover:text-white">
            {theme === "dark" ? "Chế độ tối" : "Chế độ sáng"}
          </span>
          <div className={`
            w-10 h-6 rounded-full p-1 transition-all duration-300
            ${theme === "dark" ? "bg-blue-600" : "bg-slate-500"}
          `}>
            <div className={`
              w-4 h-4 rounded-full bg-white transition-all duration-300 flex items-center justify-center
              ${theme === "dark" ? "translate-x-4" : "translate-x-0"}
            `}>
              {theme === "dark" ? (
                <Moon className="w-3 h-3 text-blue-600" />
              ) : (
                <Sun className="w-3 h-3 text-yellow-500" />
              )}
            </div>
          </div>
        </button>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700 flex flex-col gap-2">
        <div className="flex items-center gap-3 px-4 py-2 text-slate-400 text-sm bg-slate-900/50 rounded-xl">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-md">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-white text-xs">{currentUser?.username || "Khách"}</span>
            <span className="text-[10px] text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              {currentUser?.role === "admin" ? "Quản trị viên" :
               currentUser?.role === "leader" ? "Lãnh đạo" :
               currentUser?.role === "officer" ? "Cán bộ" : "Khách"}
            </span>
          </div>
        </div>
        <button 
          onClick={() => {
            document.cookie = 'auth_token=; Max-Age=0; path=/';
            window.location.href = '/login';
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 w-full text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-all"
        >
          <Shield className="w-4 h-4" /> Đăng xuất
        </button>
      </div>
    </aside>
  );
}