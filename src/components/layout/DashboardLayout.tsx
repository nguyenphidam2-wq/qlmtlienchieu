"use client";

import { useState, useEffect, Suspense } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { getCurrentUserInfo } from "@/lib/actions/subjects";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; role: string } | null>(null);
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  const isGis = pathname.startsWith("/gis");

  useEffect(() => {
    // Initial check for mobile screen
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    // Auto close sidebar on mobile when navigating
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUserInfo();
        setCurrentUser(user);
      } catch (e) {
        console.error("Failed to load user in DashboardLayout", e);
      }
    };
    if (!isLogin) {
      fetchUser();
    }
  }, [isLogin]);

  if (isLogin) {
    return <main className="min-h-screen bg-slate-900">{children}</main>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#1A222C] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar Overlay on Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Suspense fallback={<div className="w-72.5 bg-[#1C2434] h-screen hidden lg:block" />}>
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          user={currentUser}
        />
      </Suspense>

      {/* Desktop Sidebar Toggle Button */}
      <div 
        className="hidden lg:flex fixed top-1/2 -translate-y-1/2 transition-all duration-300"
        style={{ left: sidebarOpen ? "290px" : "0px", zIndex: 9999 }}
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center justify-center w-5 h-12 bg-[#1C2434] text-slate-400 hover:text-white hover:w-6 border border-l-0 border-slate-700/80 cursor-pointer transition-all duration-200 rounded-r-lg shadow-[4px_0_12px_rgba(0,0,0,0.5)] group"
          title={sidebarOpen ? "Thu gọn menu" : "Mở rộng menu"}
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-300 ${sidebarOpen ? "rotate-0" : "rotate-180"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Content Area */}
      <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        {/* Top Header */}
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          user={currentUser}
        />

        {/* Main Body */}
        <main className={`flex-1 ${isGis ? "h-[calc(100vh-65px)] overflow-hidden" : "p-4 md:p-6 2xl:p-8"}`}>
          <div className={`${isGis ? "h-full w-full" : "mx-auto max-w-7xl"}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
