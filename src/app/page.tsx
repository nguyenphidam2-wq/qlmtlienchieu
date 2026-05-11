import { getStats } from "@/lib/actions/subjects";
import { Users, Store, RefreshCw, Map } from "lucide-react";
import Link from "next/link";
import DashboardControls from "@/components/DashboardControls";
import DashboardCharts from "@/components/DashboardCharts";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: { start?: string, end?: string } }) {
  const stats = await getStats();

  const kpiCards = [
    {
      label: "Tổng đối tượng",
      value: stats.total_subjects,
      icon: Users,
      color: "c-accent",
    },
    {
      label: "Đang nghiện",
      value: stats.status_counts["Nghiện"] || 0,
      icon: Users,
      color: "c-danger",
    },
    {
      label: "Sử dụng",
      value: stats.status_counts["Sử dụng"] || 0,
      icon: Users,
      color: "c-warning",
    },
    {
      label: "Sau cai",
      value: stats.status_counts["Sau cai"] || 0,
      icon: Users,
      color: "c-success",
    },
    {
      label: "Đã khởi tố",
      value: stats.status_counts["Khởi tố"] || 0,
      icon: Users,
      color: "c-purple",
    },
    {
      label: "Cơ sở kinh doanh",
      value: stats.total_businesses,
      icon: Store,
      color: "c-accent",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Báo cáo tổng quát
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Hệ thống quản lý nghiệp vụ - Công an phường Liên Chiểu
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DashboardControls />
          <Link
            href="/subjects"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới dữ liệu
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((card, idx) => (
          <div 
            key={idx} 
            className={`relative group overflow-hidden bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1`}
          >
            <div className={`absolute top-0 left-0 w-1 h-full ${
              card.color === 'c-accent' ? 'bg-blue-500' : 
              card.color === 'c-danger' ? 'bg-red-500' : 
              card.color === 'c-warning' ? 'bg-amber-500' : 
              card.color === 'c-success' ? 'bg-emerald-500' : 
              card.color === 'c-purple' ? 'bg-purple-500' : 'bg-slate-500'
            }`}></div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-slate-500 transition-colors">
                {card.label}
              </span>
              <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                {card.value}
              </span>
            </div>
            <card.icon className="absolute right-3 bottom-3 w-8 h-8 text-slate-100 dark:text-slate-700 group-hover:text-slate-200 dark:group-hover:text-slate-600 transition-colors" />
          </div>
        ))}
      </div>

      <DashboardCharts stats={stats} />

      {/* Quick Actions */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="p-2 bg-white/10 rounded-lg">⚡</span> Thao tác nghiệp vụ nhanh
          </h3>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/subjects"
              className="flex items-center gap-3 px-6 py-4 bg-white text-slate-900 rounded-2xl font-bold hover:bg-blue-50 transition-all shadow-lg active:scale-95"
            >
              <Users className="w-5 h-5 text-blue-600" />
              Quản lý Đối tượng
            </Link>
            <Link
              href="/businesses"
              className="flex items-center gap-3 px-6 py-4 bg-slate-800 text-white rounded-2xl font-bold border border-slate-700 hover:bg-slate-700 transition-all shadow-lg active:scale-95"
            >
              <Store className="w-5 h-5 text-emerald-400" />
              Cơ sở kinh doanh
            </Link>
            <Link
              href="/gis"
              className="flex items-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20 active:scale-95"
            >
              <Map className="w-5 h-5" />
              Bản đồ nghiệp vụ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}