import { getStats } from "@/lib/actions/subjects";
import { Users, Store, RefreshCw, Map } from "lucide-react";
import Link from "next/link";

import DashboardControls from "@/components/DashboardControls";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: { start?: string, end?: string } }) {
  const { start, end } = await searchParams; // In Next 15+ searchParams is treated as a promise/async. But technically in 14 it is sync. Let's just destructure safely.
  
  // Actually, depending on the Next.js version (15 requires await searchParams, 14 does not). Since package.json says Next 16.2.4:
  const resolvedParams = searchParams ? await searchParams : {};
  const stats = await getStats(resolvedParams.start, resolvedParams.end);

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

  const sortedTdp = Object.entries(stats.tdp_stats || {})
    .sort(([, a], [, b]) => b - a);

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Status Breakdown - Circular Style */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600">📊</span>
            Tỷ lệ theo tình trạng
          </h3>
          <div className="space-y-4">
            {[
              { label: "Nghiện", count: stats.status_counts["Nghiện"] || 0, color: "bg-red-500", light: "bg-red-50" },
              { label: "Sử dụng", count: stats.status_counts["Sử dụng"] || 0, color: "bg-amber-500", light: "bg-amber-50" },
              { label: "Sau cai", count: stats.status_counts["Sau cai"] || 0, color: "bg-emerald-500", light: "bg-emerald-50" },
              { label: "Khởi tố", count: stats.status_counts["Khởi tố"] || 0, color: "bg-purple-500", light: "bg-purple-50" }
            ].map((item, idx) => {
              const percentage = stats.total_subjects > 0 ? (item.count / stats.total_subjects) * 100 : 0;
              return (
                <div key={idx} className="group">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{item.count}</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TDP Stats Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-amber-600">📍</span>
            Phân bố theo Tổ dân phố
          </h3>
          <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
            {sortedTdp.length === 0 ? (
               <div className="h-full flex items-center justify-center text-slate-400 italic">Không có dữ liệu</div>
            ) : (
              <div className="flex items-end gap-5 h-64 pt-10 min-w-max">
                {sortedTdp.map(([tdp, count]) => {
                  const maxCount = Math.max(...sortedTdp.map(s => s[1]));
                  const heightPercent = Math.max((count / (maxCount || 1)) * 100, 8);
                  
                  let barColor = "bg-gradient-to-t from-emerald-500 to-emerald-400";
                  let shadowColor = "shadow-emerald-200";
                  if (count >= 5) {
                    barColor = "bg-gradient-to-t from-red-600 to-red-400";
                    shadowColor = "shadow-red-200";
                  } else if (count >= 2) {
                    barColor = "bg-gradient-to-t from-amber-500 to-amber-400";
                    shadowColor = "shadow-amber-200";
                  }

                  return (
                    <div key={tdp} className="flex flex-col items-center group relative w-12">
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded shadow-xl whitespace-nowrap z-20 pointer-events-none transition-all scale-75 group-hover:scale-100">
                        Tổ {tdp}: {count} ĐT
                      </div>
                      <span className="text-xs font-black text-slate-900 dark:text-white mb-2">{count}</span>
                      <div 
                        className={`w-10 rounded-t-lg transition-all duration-700 ease-out shadow-lg ${barColor} ${shadowColor} group-hover:brightness-110 group-hover:scale-x-110`} 
                        style={{ height: `${heightPercent}%` }}
                      ></div>
                      <span className="text-[10px] font-bold text-slate-500 mt-3 whitespace-nowrap">Tổ {tdp}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

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