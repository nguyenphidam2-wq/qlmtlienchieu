"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import React from "react";
import { Menu, X } from "lucide-react";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLogin = pathname === "/login";

  if (isLogin) {
    return <main className="flex-1 min-h-screen bg-slate-900">{children}</main>;
  }

  return (
    <div className="flex min-h-screen w-full relative">
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-slate-800 text-white z-50 flex items-center justify-between px-4 shadow-md">
        <div className="flex items-center gap-2">
           <img src="/logo.png?v=2" alt="Logo" className="w-8 h-8 rounded-full bg-white p-0.5" />
           <span className="font-bold text-sm text-yellow-500">CA P.LIÊN CHIỂU</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1 rounded bg-slate-700 hover:bg-slate-600">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
      </div>

      <main className="flex-1 p-4 md:p-6 mt-14 md:mt-0 relative h-screen overflow-y-auto w-full">
        {children}
      </main>
    </div>
  );
}
