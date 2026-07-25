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
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 mb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>HỆ THỐNG GIÁM SÁT SỐ GEOSPATIAL</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>PHƯỜNG LIÊN CHIỂU</span>
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

      {/* Stat-Led Asymmetric Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Primary Hero Stat Card (Spans 5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-7 flex flex-col justify-between border border-slate-800 shadow-sm relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-blue-400 tracking-wider uppercase font-semibold">
                Tổng số đối tượng quản lý
              </span>
              <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Users className="w-5 h-5" />
              </span>
            </div>
            <div className="flex items-baseline gap-3 my-2">
              <span className="text-5xl font-mono font-bold tracking-tight">
                {totalSubjects}
              </span>
              <span className="text-xs text-slate-400 font-sans">hồ sơ giám sát</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Dữ liệu đối tượng nghiện, sử dụng trái phép, sau cai và đối tượng nghiệp vụ cập nhật trên toàn địa bàn.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Dữ liệu kiểm duyệt
            </span>
            <Link 
              href="/subjects" 
              className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1 group"
            >
              Chi tiết danh sách <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>

        {/* Secondary Stat Grid (Spans 7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card: Đang nghiện */}
          <Link
            href="/subjects?status=Nghi%E1%BB%87n"
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between hover:border-red-500 hover:shadow-lg transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-red-500 transition-colors">Đang nghiện</span>
              </div>
              <AlertCircle className="w-4 h-4 text-red-500/70 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-mono font-bold text-slate-900 dark:text-white flex items-baseline justify-between">
                <span>{statusCounts["Nghiện"] || 0}</span>
                <span className="text-xs text-red-500 font-sans font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                  Xem danh sách <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Diện quản lý trọng điểm</span>
            </div>
          </Link>

          {/* Card: Sử dụng */}
          <Link
            href="/subjects?status=S%E1%BB%AD%20d%E1%BB%A5ng"
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between hover:border-amber-500 hover:shadow-lg transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-amber-500 transition-colors">Sử dụng trái phép</span>
              </div>
              <Clock className="w-4 h-4 text-amber-500/70 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-mono font-bold text-slate-900 dark:text-white flex items-baseline justify-between">
                <span>{statusCounts["Sử dụng"] || 0}</span>
                <span className="text-xs text-amber-500 font-sans font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                  Xem danh sách <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Theo dõi hành vi định kỳ</span>
            </div>
          </Link>

          {/* Card: Sau cai */}
          <Link
            href="/subjects?status=Sau%20cai"
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between hover:border-emerald-500 hover:shadow-lg transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-emerald-500 transition-colors">Quản lý sau cai</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500/70 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-mono font-bold text-slate-900 dark:text-white flex items-baseline justify-between">
                <span>{statusCounts["Sau cai"] || 0}</span>
                <span className="text-xs text-emerald-500 font-sans font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                  Xem danh sách <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Hỗ trợ hòa nhập cộng đồng</span>
            </div>
          </Link>

          {/* Card: Cơ sở kinh doanh */}
          <Link
            href="/businesses"
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between hover:border-blue-500 hover:shadow-lg transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-blue-500 transition-colors">Cơ sở kinh doanh chú ý</span>
              </div>
              <Store className="w-4 h-4 text-blue-500/70 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-mono font-bold text-slate-900 dark:text-white flex items-baseline justify-between">
                <span>{totalBusinesses}</span>
                <span className="text-xs text-blue-500 font-sans font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                  Xem danh sách <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Địa điểm có điều kiện an ninh</span>
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