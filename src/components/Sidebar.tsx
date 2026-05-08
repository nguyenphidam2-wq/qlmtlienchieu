"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { useEffect, useState } from "react";
import { getCurrentUserInfo } from "@/lib/actions/subjects";
import { useRouter, useSearchParams } from "next/navigation";
import { getCustomZones } from "@/lib/actions/zones";
import {
  BarChart3,
  Users,
  Map,
  Shield,
  Sun,
  Moon,
  ShieldCheck,
  ChevronDown,
  Layers,
  MapPin,
  PenTool,
  CheckCircle2,
  Flame,
} from "lucide-react";

// Định nghĩa menu với các vai trò được phép truy cập
const navItems = [
  { href: "/gis", label: "Bản đồ số GIS", icon: Map, section: "Phân tích", roles: ["admin", "leader", "officer", "guest"] },
  { href: "/", label: "Báo cáo tổng quát", icon: BarChart3, section: "Tổng quan", roles: ["admin", "leader", "officer", "guest"] },
  { href: "/quan-ly-ma-tuy", label: "Quản lý ma túy", icon: Shield, section: "Quản lý", roles: ["admin", "leader", "officer", "guest"], isParent: true, children: [
    { href: "/subjects", label: "Đối tượng ma túy" },
    { href: "/businesses", label: "Cơ sở có dấu hiệu cần chú ý" },
  ]},
  { href: "/subjects-nghiepvu", label: "Đối tượng nghiệp vụ", icon: ShieldCheck, section: "Quản lý", roles: ["admin", "leader", "officer"] },
  { href: "/pccc", label: "An toàn PCCC", icon: Flame, section: "Quản lý", roles: ["admin", "leader", "officer"] },
  { href: "/tdp", label: "Quản lý Tổ dân phố", icon: MapPin, section: "Quản lý", roles: ["admin", "leader", "officer"] },
  { href: "/accounts", label: "Quản lý Phân quyền", icon: Shield, section: "Hệ thống", roles: ["admin"] },
];

export function Sidebar({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; role: string } | null>(null);
  const [customZones, setCustomZones] = useState<any[]>([]);
  const [gisOpen, setGisOpen] = useState(pathname.startsWith("/gis"));
  const [quanLyMatuyOpen, setQuanLyMatuyOpen] = useState(
    pathname === "/subjects" || pathname.startsWith("/subjects/") || 
    pathname === "/businesses" || pathname.startsWith("/businesses/") || 
    pathname === "/quan-ly-ma-tuy"
  );

  // Lấy thông tin user hiện tại và danh sách TDP
  useEffect(() => {
    const fetchData = async () => {
      const [user, zones] = await Promise.all([
        getCurrentUserInfo(),
        getCustomZones()
      ]);
      setCurrentUser(user);
      setCustomZones(zones);
    };
    fetchData();
  }, []);

  // Sync gisOpen with pathname
  useEffect(() => {
    if (pathname.startsWith("/gis")) setGisOpen(true);
  }, [pathname]);

  // Sync quanLyMatuyOpen with pathname
  useEffect(() => {
    const isMaTuyPath = pathname === "/subjects" || pathname.startsWith("/subjects/") || 
                       pathname === "/businesses" || pathname.startsWith("/businesses/") || 
                       pathname === "/quan-ly-ma-tuy";
    if (isMaTuyPath) {
      setQuanLyMatuyOpen(true);
    }
  }, [pathname]);

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) params.delete(key);
    else params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  };

  const layers = {
    subjects: searchParams.get("subjects") !== "false",
    businesses: searchParams.get("businesses") !== "false",
    zones: searchParams.get("zones") !== "false",
    pccc: searchParams.get("pccc") === "true", // Default off for now
  };

  const drawMode = searchParams.get("draw") === "true";
  const selectedZone = searchParams.get("zoneId");

  // Lọc menu theo role của user
  const visibleNavItems = navItems.filter(item =>
    currentUser && item.roles.includes(currentUser.role)
  );

  return (
    <aside className="m-4 w-72 h-[calc(100vh-2rem)] bg-slate-900/60 backdrop-blur-xl text-white flex flex-col border border-white/10 shadow-2xl rounded-3xl overflow-hidden">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700/50 bg-slate-900/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-14 h-14 relative flex-shrink-0 bg-white rounded-full p-1 shadow-[0_0_15px_rgba(234,179,8,0.3)] border-2 border-yellow-500/80 overflow-hidden transform transition-transform hover:scale-105">
            <img src="/logo.png?v=2" alt="Logo CA" className="w-full h-full object-contain p-0.5" />
          </div>
          <div className="flex flex-col text-left justify-center">
            <h1 style={{ color: '#eab308', fontSize: '13px', lineHeight: '1.2', fontWeight: 'bold' }} className="tracking-wider m-0 p-0">
              CÔNG AN PHƯỜNG<br />LIÊN CHIỂU
            </h1>
            <span style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }} className="font-semibold mt-0.5 leading-none">
              Hệ thống nghiệp vụ
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href + "/"));

          // Đặc biệt cho Bản đồ GIS - tích hợp controls
          if (item.href === "/gis") {
            return (
              <div key={item.href} className="flex flex-col mb-1">
                <button
                  onClick={() => {
                    if (pathname !== "/gis") router.push("/gis");
                    setGisOpen(!gisOpen);
                  }}
                  className={`
                    relative flex items-center gap-3 px-6 py-3.5 text-sm transition-all duration-300 w-full group
                    ${isActive
                      ? "bg-blue-600/90 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                    }
                  `}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-blue-400"}`} />
                  <span className="flex-1 text-left font-bold">{item.label}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${gisOpen ? "rotate-180" : ""}`} />
                </button>
                
                {/* Sub-menu tích hợp GIS Controls */}
                <div className={`overflow-hidden transition-all duration-500 bg-slate-900/40 border-l-2 border-blue-600/30 ml-4 mr-2 rounded-br-2xl ${gisOpen ? "max-h-[1000px] py-4" : "max-h-0"}`}>
                  
                  {/* Lớp dữ liệu */}
                  <div className="px-4 mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Layers className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lớp bản đồ</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => updateParam("subjects", layers.subjects ? "false" : "true")}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-xs ${layers.subjects ? "bg-red-500/10 text-red-400" : "text-slate-500 hover:bg-slate-800"}`}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full ${layers.subjects ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-slate-700"}`}></div>
                        <span className="flex-1 text-left">Đối tượng quản lý</span>
                        {layers.subjects && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                      <button 
                        onClick={() => updateParam("businesses", layers.businesses ? "false" : "true")}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-xs ${layers.businesses ? "bg-emerald-500/10 text-emerald-400" : "text-slate-500 hover:bg-slate-800"}`}
                      >
                        <div className={`w-2.5 h-2.5 rounded-sm ${layers.businesses ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-700"}`}></div>
                        <span className="flex-1 text-left">Cơ sở kinh doanh</span>
                        {layers.businesses && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                      <button 
                        onClick={() => updateParam("zones", layers.zones ? "false" : "true")}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-xs ${layers.zones ? "bg-blue-500/10 text-blue-400" : "text-slate-500 hover:bg-slate-800"}`}
                      >
                        <div className={`w-2.5 h-2.5 rounded-sm ${layers.zones ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-slate-700"}`}></div>
                        <span className="flex-1 text-left">Ranh giới TDP</span>
                        {layers.zones && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                      <button 
                        onClick={() => updateParam("pccc", layers.pccc ? "false" : "true")}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-xs ${layers.pccc ? "bg-orange-500/10 text-orange-400" : "text-slate-500 hover:bg-slate-800"}`}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full ${layers.pccc ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" : "bg-slate-700"}`}></div>
                        <span className="flex-1 text-left">An toàn PCCC</span>
                        {layers.pccc && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                      <button 
                        onClick={() => updateParam("neutral", searchParams.get("neutral") === "true" ? "false" : "true")}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-xs ${searchParams.get("neutral") === "true" ? "bg-white/10 text-white" : "text-slate-500 hover:bg-slate-800"}`}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full ${searchParams.get("neutral") === "true" ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "bg-slate-700"}`}></div>
                        <span className="flex-1 text-left">Chế độ Trung tính</span>
                        {searchParams.get("neutral") === "true" && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Chọn địa bàn */}
                  <div className="px-4 mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Chọn địa bàn</span>
                    </div>
                    <div className="flex flex-col gap-1 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {customZones.map((zone) => (
                        <button 
                          key={zone._id}
                          onClick={() => updateParam("zoneId", selectedZone === zone._id ? null : zone._id)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-[11px] group ${selectedZone === zone._id ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-800"}`}
                        >
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: zone.color }}></div>
                          <span className="flex-1 truncate text-left">{zone.name}</span>
                          {selectedZone === zone._id && <div className="w-1 h-1 rounded-full bg-white animate-pulse"></div>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Công cụ số hóa */}
                  <div className="px-4 border-t border-slate-700/50 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <PenTool className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Công cụ số hóa</span>
                    </div>
                    <button 
                      onClick={() => updateParam("draw", drawMode ? "false" : "true")}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-bold mb-2 ${drawMode ? "bg-amber-500 text-white shadow-lg shadow-amber-900/20" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
                    >
                      <i className={`fas ${drawMode ? "fa-mouse-pointer" : "fa-draw-polygon"} text-sm`}></i>
                      <span className="flex-1 text-left">{drawMode ? "Dừng vẽ ranh giới" : "Vẽ ranh giới mới"}</span>
                    </button>
                    <button 
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent("trigger-gis-import"));
                        if (onCloseMobile) onCloseMobile();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs text-slate-500 hover:bg-slate-700 transition-all font-medium"
                    >
                      <i className="fas fa-file-import text-sm w-4"></i>
                      <span>Nhập GeoJSON</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          }

          // Parent menu item with dropdown (e.g. "Quản lý ma túy")
          if (item.isParent) {
            return (
              <div key={item.href} className="flex flex-col mb-1">
                <button
                  onClick={() => setQuanLyMatuyOpen(!quanLyMatuyOpen)}
                  className={`
                    relative flex items-center gap-3 px-6 py-3.5 text-sm transition-all duration-300 w-full group
                    ${quanLyMatuyOpen
                      ? "bg-blue-600/90 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                    }
                  `}
                >
                  <item.icon className={`w-5 h-5 ${quanLyMatuyOpen ? "text-white" : "text-slate-400 group-hover:text-blue-400"}`} />
                  <span className="flex-1 text-left font-bold">{item.label}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${quanLyMatuyOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Sub-menu */}
                <div className={`overflow-hidden transition-all duration-500 bg-slate-900/40 border-l-2 border-blue-600/30 ml-4 mr-2 rounded-br-2xl ${quanLyMatuyOpen ? "max-h-[1000px] py-4" : "max-h-0"}`}>
                  {item.children?.map((child) => {
                    const isChildActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => {
                          if (onCloseMobile) onCloseMobile();
                        }}
                        className={`
                          flex items-center gap-3 px-6 py-3 text-sm transition-all duration-200 mb-1 group
                          ${isChildActive
                            ? "bg-blue-600/90 text-white shadow-lg"
                            : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                          }
                        `}
                      >
                        <span className="flex-1 text-left font-medium">{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-6 py-3.5 text-sm transition-all duration-200 mb-1 group
                ${isActive
                  ? "bg-blue-600/90 text-white shadow-lg"
                  : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }
              `}
              onClick={() => {
                if(onCloseMobile) onCloseMobile();
              }}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-blue-400"}`} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-900/10">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-700/50 hover:bg-slate-700 transition-all duration-300 group border border-slate-700"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl transition-all ${theme === "dark" ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"}`}>
              {theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
              {theme === "dark" ? "Chế độ tối" : "Chế độ sáng"}
            </span>
          </div>
          <div className={`
            w-8 h-4 rounded-full p-1 transition-all duration-300 relative
            ${theme === "dark" ? "bg-blue-600" : "bg-slate-500"}
          `}>
            <div className={`
              absolute top-1 w-2 h-2 rounded-full bg-white transition-all duration-300
              ${theme === "dark" ? "left-5" : "left-1"}
            `}></div>
          </div>
        </button>
      </div>

      {/* Footer / User Info */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-900/30 flex flex-col gap-2">
        <div className="flex items-center gap-3 px-4 py-3 text-slate-400 text-sm bg-slate-800/40 rounded-2xl border border-slate-700/30">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
            <Users className="w-5 h-5 text-white transform -rotate-3" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white text-xs tracking-wide">{currentUser?.username || "Khách"}</span>
            <span className="text-[9px] text-green-400 flex items-center gap-1 font-black uppercase tracking-tighter">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)] animate-pulse"></span>
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
          className="flex items-center justify-center gap-2 px-4 py-3 w-full text-[11px] font-black uppercase tracking-widest text-red-400/80 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all border border-transparent hover:border-red-500/20"
        >
          <Shield className="w-3.5 h-3.5" /> Đăng xuất
        </button>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(51, 65, 85, 0.8);
        }
      `}</style>
    </aside>
  );
}