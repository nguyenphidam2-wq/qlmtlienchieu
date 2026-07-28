/* Hallmark · genre: modern-minimal · macrostructure: Stat-Led · theme: Cobalt (modern-minimal cluster) */
/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */

import { getStats } from "@/lib/actions/subjects";
import { Users, Store, RefreshCw, Map, ArrowUpRight, ShieldCheck, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import DashboardControls from "@/components/DashboardControls";
import DashboardCharts from "@/components/DashboardCharts";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: { start?: string, end?: string } }) {
  const stats = await getStats();

  const totalSubjects = stats.total_subjects || 0;
  const statusCounts = stats.status_counts || {};
  const totalBusinesses = stats.total_businesses || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 mb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>HỆ THỐNG GIÁM SÁT SỐ GEOSPATIAL</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>PHƯỜNG LIÊN CHIỂU</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">DESIGN BY NPĐ</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Báo cáo tổng quát địa bàn
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <DashboardControls />
          <Link
            href="/subjects"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Làm mới dữ liệu
          </Link>
        </div>
      </header>

      {/* Stat-Led Asymmetric Hero Section (Hallmark Anti-AI-Slop Redesign) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Primary Hero Stat Card (Spans 5 cols) */}
        <Link
          href="/subjects"
          className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-7 flex flex-col justify-between border border-slate-800/90 shadow-xl relative overflow-hidden group hover:border-blue-500/50 hover:-translate-y-1 hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer"
        >
          {/* Subtle Radial Glow Backdrop */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-600/20 transition-all duration-500 pointer-events-none"></div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-mono text-blue-400 tracking-widest uppercase font-bold px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                Tổng số đối tượng quản lý
              </span>
              <span className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
                <Users className="w-5 h-5" />
              </span>
            </div>
            <div className="flex items-baseline gap-3 my-3">
              <span className="text-6xl font-mono font-black tracking-tight text-white group-hover:text-blue-100 transition-colors">
                {totalSubjects}
              </span>
              <span className="text-xs font-semibold text-slate-400">hồ sơ thực tế địa bàn</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Dữ liệu đối tượng nghiện, sử dụng trái phép, sau cai và đối tượng nghiệp vụ được cập nhật chính xác trên 27 Tổ dân phố mới.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-medium text-slate-300">Dữ liệu kiểm duyệt</span>
            </span>
            <span className="text-blue-400 font-semibold inline-flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
              Xem danh sách đầy đủ <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </Link>

        {/* Secondary Stat Grid (Spans 7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card: Đang nghiện */}
          <Link
            href="/subjects?status=Nghi%E1%BB%87n"
            className="bg-white dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between hover:border-red-500/60 hover:shadow-xl hover:shadow-red-500/5 hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-red-500 transition-colors uppercase tracking-wider">Đang nghiện</span>
              </div>
              <span className="p-2 rounded-xl bg-red-500/10 text-red-500 group-hover:scale-110 transition-transform">
                <AlertCircle className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-5">
              <div className="text-4xl font-mono font-black text-slate-900 dark:text-white flex items-baseline justify-between">
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
            className="bg-white dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between hover:border-amber-500/60 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-amber-500 transition-colors uppercase tracking-wider">Sử dụng trái phép</span>
              </div>
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-5">
              <div className="text-4xl font-mono font-black text-slate-900 dark:text-white flex items-baseline justify-between">
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
            className="bg-white dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 transition-colors uppercase tracking-wider">Quản lý sau cai</span>
              </div>
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-5">
              <div className="text-4xl font-mono font-black text-slate-900 dark:text-white flex items-baseline justify-between">
                <span>{statusCounts["Sau cai"] || 0}</span>
                <span className="text-xs text-emerald-500 font-sans font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Xem chi tiết <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <span className="text-xs text-slate-400 mt-1.5 block font-medium">Hỗ trợ hòa nhập cộng đồng</span>
            </div>
          </Link>

          {/* Card: Cơ sở kinh doanh */}
          <Link
            href="/businesses"
            className="bg-white dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between hover:border-blue-500/60 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-500 transition-colors uppercase tracking-wider">Cơ sở kinh doanh chú ý</span>
              </div>
              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                <Store className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-5">
              <div className="text-4xl font-mono font-black text-slate-900 dark:text-white flex items-baseline justify-between">
                <span>{totalBusinesses}</span>
                <span className="text-xs text-blue-500 font-sans font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Xem chi tiết <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <span className="text-xs text-slate-400 mt-1.5 block font-medium">Địa điểm có điều kiện an ninh</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Dashboard Charts Section */}
      <DashboardCharts stats={stats} />

      {/* Quick Actions (Clean Solid Surface - No Aurora Blobs) */}
      <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-6 text-white border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2 text-white">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Lối tắt thao tác nghiệp vụ
          </h3>
          <p className="text-xs text-slate-400 mt-1">Truy cập nhanh danh mục dữ liệu và phân hệ bản đồ GIS không gian.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/subjects"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Users className="w-4 h-4 text-blue-400" />
            Quản lý Đối tượng
          </Link>
          <Link
            href="/businesses"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Store className="w-4 h-4 text-emerald-400" />
            Cơ sở kinh doanh
          </Link>
          <Link
            href="/gis"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
          >
            <Map className="w-4 h-4" />
            Bản đồ GIS
          </Link>
        </div>
      </div>
    </div>
  );
}