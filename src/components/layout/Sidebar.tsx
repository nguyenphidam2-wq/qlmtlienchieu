"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Map,
  Shield,
  ChevronDown,
  Layers,
  MapPin,
  Flame,
  CheckCircle2,
  X,
  Users,
  Store,
  Calendar,
} from "lucide-react";
import { getCustomZones } from "@/lib/actions/zones";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
  user: { id: string; username: string; role: string } | null;
}

const navItems = [
  {
    href: "/gis",
    label: "Bản đồ số GIS",
    icon: Map,
    section: "BẢN ĐỒ & PHÂN TÍCH",
    roles: ["admin", "leader", "officer", "guest"],
  },
  {
    href: "/",
    label: "Báo cáo tổng quát",
    icon: BarChart3,
    section: "TỔNG QUAN",
    roles: ["admin", "leader", "officer", "guest"],
  },
  {
    href: "/quan-ly-ma-tuy",
    label: "Quản lý Ma túy & Cơ sở",
    icon: Shield,
    section: "QUẢN LÝ NGHIỆP VỤ",
    roles: ["admin", "leader", "officer", "guest"],
    isParent: true,
    children: [
      { href: "/subjects", label: "Đối tượng ma túy", icon: Users },
      { href: "/businesses", label: "Cơ sở nghi vấn / kinh doanh", icon: Store },
      { href: "/schedules", label: "Lịch kiểm danh & Thử test", icon: Calendar },
    ],
  },
  {
    href: "/pccc",
    label: "An toàn PCCC",
    icon: Flame,
    section: "QUẢN LÝ NGHIỆP VỤ",
    roles: ["admin", "leader", "officer"],
  },
  {
    href: "/tdp",
    label: "Quản lý Tổ dân phố",
    icon: MapPin,
    section: "QUẢN LÝ NGHIỆP VỤ",
    roles: ["admin", "leader", "officer"],
  },
  {
    href: "/accounts",
    label: "Quản lý Phân quyền",
    icon: Shield,
    section: "HỆ THỐNG",
    roles: ["admin"],
  },
];

export function Sidebar({ sidebarOpen, setSidebarOpen, user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const trigger = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);

  const [customZones, setCustomZones] = useState<any[]>([]);
  const [gisOpen, setGisOpen] = useState(pathname.startsWith("/gis"));
  const [maTuyOpen, setMaTuyOpen] = useState(
    pathname === "/subjects" ||
      pathname.startsWith("/subjects/") ||
      pathname === "/businesses" ||
      pathname.startsWith("/businesses/") ||
      pathname === "/schedules" ||
      pathname.startsWith("/schedules/") ||
      pathname === "/quan-ly-ma-tuy"
  );

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const zones = await getCustomZones();
        setCustomZones(zones || []);
      } catch (err) {
        console.error("Failed to load zones in sidebar", err);
      }
    };
    fetchZones();
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/gis")) setGisOpen(true);
    if (
      pathname === "/subjects" ||
      pathname.startsWith("/subjects/") ||
      pathname === "/businesses" ||
      pathname.startsWith("/businesses/") ||
      pathname === "/schedules" ||
      pathname.startsWith("/schedules/")
    ) {
      setMaTuyOpen(true);
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
    pccc: searchParams.get("pccc") === "true",
  };

  const selectedZone = searchParams.get("zoneId");

  const visibleNavItems = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : item.roles.includes("guest")
  );

  // Group items by section
  const sections = Array.from(new Set(visibleNavItems.map((item) => item.section)));

  return (
    <aside
      ref={sidebar}
      className={`fixed left-0 top-0 z-50 flex h-screen flex-col overflow-y-hidden bg-[#1C2434] text-white duration-300 ease-in-out lg:static transition-all ${
        sidebarOpen
          ? "w-72.5 translate-x-0"
          : "-translate-x-full lg:w-0 lg:translate-x-0 lg:overflow-hidden lg:p-0 lg:border-none"
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6 border-b border-slate-800/80 bg-[#141A28]">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-12 h-12 relative flex-shrink-0 bg-white rounded-full p-1 shadow-[0_0_12px_rgba(234,179,8,0.3)] border-2 border-yellow-500/80 overflow-hidden">
            <img src="/logo.png?v=2" alt="Logo CA" className="w-full h-full object-contain p-0.5" />
          </div>
          <div className="flex flex-col text-left">
            <h1 className="text-yellow-400 font-bold text-xs leading-tight tracking-wider uppercase">
              CÔNG AN PHƯỜNG<br />LIÊN CHIỂU
            </h1>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
              Hệ thống nghiệp vụ
            </span>
          </div>
        </Link>

        {/* Mobile close button */}
        <button
          ref={trigger}
          onClick={() => setSidebarOpen(false)}
          aria-controls="sidebar"
          aria-label="Đóng thanh điều hướng"
          className="block lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear custom-scrollbar flex-1 py-4 px-4 lg:px-6">
        <nav className="space-y-6">
          {sections.map((sectionName) => {
            const sectionItems = visibleNavItems.filter((i) => i.section === sectionName);
            return (
              <div key={sectionName}>
                <h3 className="mb-3 text-xs font-semibold text-slate-400 tracking-wider uppercase px-3">
                  {sectionName}
                </h3>
                <ul className="space-y-1.5">
                  {sectionItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/" && pathname.startsWith(item.href + "/"));

                    // GIS Map with embedded layers toggle
                    if (item.href === "/gis") {
                      return (
                        <li key={item.href} className="flex flex-col">
                          <button
                            onClick={() => {
                              if (pathname !== "/gis") router.push("/gis");
                              setGisOpen(!gisOpen);
                            }}
                            className={`group relative flex items-center gap-2.5 rounded-xl px-4 py-2.5 font-medium text-sm duration-200 ease-in-out cursor-pointer ${
                              isActive
                                ? "bg-blue-600 text-white shadow-md font-bold"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                            }`}
                          >
                            <item.icon className="w-5 h-5" />
                            <span className="flex-1 text-left">{item.label}</span>
                            <ChevronDown
                              className={`w-4 h-4 transition-transform duration-200 ${
                                gisOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {/* GIS Sub-controls */}
                          {gisOpen && (
                            <div className="mt-2 space-y-3 pl-4 pr-1 py-3 bg-[#141A28]/80 rounded-xl border border-slate-800/60 animate-in fade-in duration-200">
                              <div>
                                <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                                  <span>Lớp bản đồ</span>
                                </div>
                                <div className="space-y-1">
                                  <button
                                    onClick={() =>
                                      updateParam(
                                        "subjects",
                                        layers.subjects ? "false" : "true"
                                      )
                                    }
                                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                      layers.subjects
                                        ? "bg-rose-500/20 text-rose-300 font-semibold"
                                        : "text-slate-400 hover:bg-slate-800"
                                    }`}
                                  >
                                    <span className="flex items-center gap-2">
                                      <span
                                        className={`w-2 h-2 rounded-full ${
                                          layers.subjects ? "bg-rose-500" : "bg-slate-600"
                                        }`}
                                      ></span>
                                      Đối tượng MT
                                    </span>
                                    {layers.subjects && <CheckCircle2 className="w-3.5 h-3.5" />}
                                  </button>

                                  <button
                                    onClick={() =>
                                      updateParam(
                                        "businesses",
                                        layers.businesses ? "false" : "true"
                                      )
                                    }
                                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                      layers.businesses
                                        ? "bg-emerald-500/20 text-emerald-300 font-semibold"
                                        : "text-slate-400 hover:bg-slate-800"
                                    }`}
                                  >
                                    <span className="flex items-center gap-2">
                                      <span
                                        className={`w-2 h-2 rounded-full ${
                                          layers.businesses
                                            ? "bg-emerald-500"
                                            : "bg-slate-600"
                                        }`}
                                      ></span>
                                      Cơ sở kinh doanh
                                    </span>
                                    {layers.businesses && (
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    )}
                                  </button>

                                  <button
                                    onClick={() =>
                                      updateParam("zones", layers.zones ? "false" : "true")
                                    }
                                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                      layers.zones
                                        ? "bg-blue-500/20 text-blue-300 font-semibold"
                                        : "text-slate-400 hover:bg-slate-800"
                                    }`}
                                  >
                                    <span className="flex items-center gap-2">
                                      <span
                                        className={`w-2 h-2 rounded-full ${
                                          layers.zones ? "bg-blue-500" : "bg-slate-600"
                                        }`}
                                      ></span>
                                      Ranh giới TDP
                                    </span>
                                    {layers.zones && <CheckCircle2 className="w-3.5 h-3.5" />}
                                  </button>

                                  <button
                                    onClick={() =>
                                      updateParam("pccc", layers.pccc ? "false" : "true")
                                    }
                                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                      layers.pccc
                                        ? "bg-orange-500/20 text-orange-300 font-semibold"
                                        : "text-slate-400 hover:bg-slate-800"
                                    }`}
                                  >
                                    <span className="flex items-center gap-2">
                                      <span
                                        className={`w-2 h-2 rounded-full ${
                                          layers.pccc ? "bg-orange-500" : "bg-slate-600"
                                        }`}
                                      ></span>
                                      An toàn PCCC
                                    </span>
                                    {layers.pccc && <CheckCircle2 className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>

                              {/* Zone selection */}
                              {customZones.length > 0 && (
                                <div className="pt-2 border-t border-slate-800">
                                  <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Chọn nhanh TDP</span>
                                  </div>
                                  <div className="max-h-36 overflow-y-auto space-y-0.5 custom-scrollbar pr-1">
                                    {customZones.map((z) => (
                                      <button
                                        key={z._id}
                                        onClick={() =>
                                          updateParam(
                                            "zoneId",
                                            selectedZone === z._id ? null : z._id
                                          )
                                        }
                                        className={`w-full text-left px-2 py-1 rounded text-[11px] truncate transition-colors ${
                                          selectedZone === z._id
                                            ? "bg-blue-600 text-white font-bold"
                                            : "text-slate-400 hover:bg-slate-800"
                                        }`}
                                      >
                                        {z.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    }

                    // Parent Item with Children (Quản lý ma túy)
                    if (item.isParent && item.children) {
                      return (
                        <li key={item.href} className="flex flex-col">
                          <button
                            onClick={() => setMaTuyOpen(!maTuyOpen)}
                            className={`group relative flex items-center gap-2.5 rounded-xl px-4 py-2.5 font-medium text-sm duration-200 ease-in-out cursor-pointer ${
                              isActive
                                ? "bg-slate-800/80 text-white font-semibold"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                            }`}
                          >
                            <item.icon className="w-5 h-5 text-slate-400 group-hover:text-blue-400" />
                            <span className="flex-1 text-left">{item.label}</span>
                            <ChevronDown
                              className={`w-4 h-4 transition-transform duration-200 ${
                                maTuyOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {maTuyOpen && (
                            <ul className="mt-1 space-y-1 pl-4">
                              {item.children.map((child) => {
                                const isChildActive =
                                  pathname === child.href ||
                                  pathname.startsWith(child.href + "/");
                                return (
                                  <li key={child.href}>
                                    <Link
                                      href={child.href}
                                      className={`group relative flex items-center gap-2.5 rounded-lg px-4 py-2 text-xs font-medium duration-200 ease-in-out ${
                                        isChildActive
                                          ? "bg-blue-600 text-white font-bold shadow-sm"
                                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                      }`}
                                    >
                                      <child.icon className="w-4 h-4" />
                                      <span>{child.label}</span>
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </li>
                      );
                    }

                    // Standard link
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`group relative flex items-center gap-2.5 rounded-xl px-4 py-2.5 font-medium text-sm duration-200 ease-in-out ${
                            isActive
                              ? "bg-blue-600 text-white shadow-md font-bold"
                              : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          <item.icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer / Badge */}
      <div className="p-4 border-t border-slate-800/80 bg-[#141A28] text-center">
        <span className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 font-bold text-xs rounded-full shadow-sm tracking-wider select-none">
          🎨 Design by <span className="text-amber-400 font-extrabold">NPĐ</span>
        </span>
      </div>
    </aside>
  );
}
