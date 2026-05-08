"use client";
import { useState, Suspense } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import React from "react";
import { Menu, X } from "lucide-react";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLogin = pathname === "/login";

  const isGis = pathname.startsWith("/gis");

  if (isLogin) {
    return <main className="flex-1 min-h-screen bg-slate-900">{children}</main>;
  }

  return (
    <div className="flex min-h-screen w-full relative">
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-md text-white z-[10002] flex items-center justify-between px-4 shadow-xl border-b border-slate-800">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-white p-1 shadow-inner border border-yellow-500/50">
             <img src="/logo.png?v=2" alt="Logo" className="w-full h-full object-contain" />
           </div>
           <div className="flex flex-col">
             <span className="font-black text-xs text-yellow-500 leading-none">CA P.LIÊN CHIỂU</span>
             <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Hệ thống nghiệp vụ</span>
           </div>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 active:scale-90 transition-transform"
        >
          {mobileMenuOpen ? <X className="w-6 h-6 text-red-400" /> : <Menu className="w-6 h-6 text-blue-400" />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[10001] md:hidden animate-in fade-in duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-[10002] transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <Suspense fallback={<div className="m-4 w-72 bg-slate-900/40 backdrop-blur-md rounded-3xl h-[calc(100vh-2rem)]"></div>}>
          <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
        </Suspense>
      </div>

      <main className={`
        flex-1 mt-14 md:mt-0 relative h-screen w-full
        ${isGis ? 'overflow-hidden' : 'p-4 md:p-6 md:pl-[340px] overflow-y-auto'}
      `}>
        {children}
      </main>
    </div>
  );
}
