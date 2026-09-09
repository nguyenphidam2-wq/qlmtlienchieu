/* Hallmark · genre: modern-minimal · macrostructure: Stat-Led · theme: Cobalt */

import { getStats } from "@/lib/actions/subjects";
import { ArrowUpRight, ShieldCheck, RefreshCw } from "lucide-react";
import { SolarIcon } from "@/components/ui/SolarIcon";
import Link from "next/link";
import DashboardControls from "@/components/DashboardControls";
import DashboardCharts from "@/components/DashboardCharts";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: { start?: string, end?: string } }) {
  const stats = await getStats(searchParams.start, searchParams.end);

  const totalSubjects = stats.total_subjects || 0;
  const statusCounts = stats.status_counts || {};
  const totalTdps = stats.total_tdps;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Section with Modern Display Typography */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold tracking-wider">HỆ THỐNG GIÁM SÁT SỐ GEOSPATIAL</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>PHƯỜNG LIÊN CHIỂU</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-cyan-500 dark:text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
              TRỰC TUYẾN
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
            Báo cáo tổng quát địa bàn
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <DashboardControls />
          <Link
            href="/subjects"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-sm active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới dữ liệu</span>
          </Link>
        </div>
      </header>

      {/* Stat-Led Hero Section with Multi-Size Responsive Support */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Primary Hero Stat Card (Spans 5 cols on lg) */}
        <Link
          href="/subjects"
          className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-7 flex flex-col justify-between border border-slate-800/90 shadow-2xl relative overflow-hidden group hover:border-cyan-500/50 hover:-translate-y-1 hover:shadow-cyan-500/10 transition-all duration-300 cursor-pointer"
        >
          {/* Subtle Radial Glow Backdrop */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all duration-500 pointer-events-none"></div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-mono tabular-nums text-cyan-400 tracking-widest uppercase font-bold px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                Tổng số đối tượng quản lý
              </span>
              <span className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-400/25 group-hover:scale-110 group-hover:bg-cyan-500/25 transition-all">
                <SolarIcon name="users" size="md" />
              </span>
            </div>
            <div className="flex items-baseline gap-3 my-3">
              <span className="text-5xl sm:text-6xl font-mono tabular-nums font-black tracking-tight text-white group-hover:text-cyan-100 transition-colors">
                {totalSubjects}
              </span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">hồ sơ thực tế</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Dữ liệu đối tượng nghiện, sử dụng trái phép và sau cai được đồng bộ chính xác trên 27 Tổ dân phố mới.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-medium text-slate-300">Dữ liệu kiểm duyệt</span>
            </span>
            <span className="text-cyan-400 font-semibold inline-flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
              Xem danh sách đầy đủ <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </Link>

        {/* Secondary Stat Grid (Spans 7 cols on lg, 2 cols on sm) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card: Đang nghiện */}
          <Link
            href="/subjects?status=Nghi%E1%BB%87n"
            className="bg-white dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 flex flex-col justify-between hover:border-red-500/60 hover:shadow-xl hover:shadow-red-500/5 hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span className="text-xs font-display font-bold text-slate-700 dark:text-slate-300 group-hover:text-red-500 transition-colors uppercase tracking-wider">
                  Đang nghiện
                </span>
              </div>
              <span className="p-2 rounded-2xl bg-red-500/10 text-red-500 group-hover:scale-110 transition-transform">
                <SolarIcon name="danger-circle" size="sm" />
              </span>
            </div>
            <div className="mt-5">
              <div className="text-3xl sm:text-4xl font-mono tabular-nums font-black text-slate-900 dark:text-white flex items-baseline justify-between">
                <span>{statusCounts["Nghiện"] || 0}</span>
                <span className="text-xs text-red-500 font-sans font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Xem chi tiết <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <span className="text-xs text-slate-400 mt-1.5 block font-medium">Diện quản lý trọng điểm</span>
            </div>
          </Link>

          {/* Card: Sử dụng */}
          <Link
            href="/subjects?status=S%E1%BB%AD%20d%E1%BB%A5ng"
            className="bg-white dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 flex flex-col justify-between hover:border-amber-500/60 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-xs font-display font-bold text-slate-700 dark:text-slate-300 group-hover:text-amber-500 transition-colors uppercase tracking-wider">
                  Sử dụng trái phép
                </span>
              </div>
              <span className="p-2 rounded-2xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                <SolarIcon name="clock" size="sm" />
              </span>
            </div>
            <div className="mt-5">
              <div className="text-3xl sm:text-4xl font-mono tabular-nums font-black text-slate-900 dark:text-white flex items-baseline justify-between">
                <span>{statusCounts["Sử dụng"] || 0}</span>
                <span className="text-xs text-amber-500 font-sans font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Xem chi tiết <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <span className="text-xs text-slate-400 mt-1.5 block font-medium">Theo dõi hành vi định kỳ</span>
            </div>
          </Link>

          {/* Card: Sau cai */}
          <Link
            href="/subjects?status=Sau%20cai"
            className="bg-white dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 flex flex-col justify-between hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-display font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 transition-colors uppercase tracking-wider">
                  Quản lý sau cai
                </span>
              </div>
              <span className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                <SolarIcon name="check-circle" size="sm" />
              </span>
            </div>
            <div className="mt-5">
              <div className="text-3xl sm:text-4xl font-mono tabular-nums font-black text-slate-900 dark:text-white flex items-baseline justify-between">
                <span>{statusCounts["Sau cai"] || 0}</span>
                <span className="text-xs text-emerald-500 font-sans font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Xem chi tiết <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <span className="text-xs text-slate-400 mt-1.5 block font-medium">Hỗ trợ hòa nhập cộng đồng</span>
            </div>
          </Link>

          {/* Card: Tổ dân phố (27 TDP) */}
          <Link
            href="/tdp"
            className="bg-white dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 flex flex-col justify-between hover:border-blue-500/60 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span className="text-xs font-display font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-500 transition-colors uppercase tracking-wider">
                  Tổ dân phố mới
                </span>
              </div>
              <span className="p-2 rounded-2xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                <SolarIcon name="map-point" size="sm" />
              </span>
            </div>
            <div className="mt-5">
              <div className="text-3xl sm:text-4xl font-mono tabular-nums font-black text-slate-900 dark:text-white flex items-baseline justify-between">
                <span>{totalTdps}</span>
                <span className="text-xs text-blue-500 font-sans font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Xem bản đồ <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <span className="text-xs text-slate-400 mt-1.5 block font-medium">Địa bàn phân cấp sau sáp nhập</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Dashboard Charts Section */}
      <DashboardCharts stats={stats} />

      {/* Quick Actions / Feature List with Solar Duotone Bold Icons */}
      <div className="bg-white dark:bg-slate-900/90 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800/90 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm">
        <div>
          <h3 className="text-base sm:text-lg font-display font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
            Lối tắt thao tác nghiệp vụ
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Truy cập nhanh danh mục dữ liệu và phân hệ bản đồ số GIS không gian.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/subjects"
            className="inline-flex items-center gap-2.5 px-4 py-3 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-2xl text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition-all hover:scale-[1.02] active:scale-95"
          >
            <SolarIcon name="users" size="sm" className="text-blue-500 dark:text-blue-400 shrink-0" />
            <span className="truncate">Quản lý Đối tượng</span>
          </Link>
          <Link
            href="/tdp"
            className="inline-flex items-center gap-2.5 px-4 py-3 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-2xl text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition-all hover:scale-[1.02] active:scale-95"
          >
            <SolarIcon name="map-point" size="sm" className="text-emerald-500 dark:text-emerald-400 shrink-0" />
            <span className="truncate">27 Tổ dân phố</span>
          </Link>
          <Link
            href="/schedules"
            className="inline-flex items-center gap-2.5 px-4 py-3 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-2xl text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition-all hover:scale-[1.02] active:scale-95"
          >
            <SolarIcon name="calendar" size="sm" className="text-amber-500 dark:text-amber-400 shrink-0" />
            <span className="truncate">Lịch kiểm danh & Test</span>
          </Link>
          <Link
            href="/gis"
            className="inline-flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-2xl text-xs font-semibold transition-all shadow-md shadow-cyan-600/20 hover:scale-[1.02] active:scale-95"
          >
            <SolarIcon name="map" size="sm" className="shrink-0" />
            <span className="truncate">Bản đồ GIS</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
