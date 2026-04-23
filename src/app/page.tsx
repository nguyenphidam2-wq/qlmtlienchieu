import { getStats } from "@/lib/actions/subjects";
import { Users, Store, RefreshCw } from "lucide-react";
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Báo cáo Thống kê
          </h1>
          <p className="text-slate-500 mt-1">
            Phân tích số liệu quản lý trên toàn địa bàn
          </p>
        </div>
        <Link
          href="/subjects"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </Link>
      </div>
      
      <DashboardControls />

      {/* KPI Grid */}
      <div className="kpi-grid">
        {kpiCards.map((card) => (
          <div key={card.label} className={`kpi-card ${card.color}`}>
            <div className="kpi-label">{card.label}</div>
            <div className="kpi-val">{card.value}</div>
            <card.icon className="kpi-icon" />
          </div>
        ))}
      </div>

      {/* Status Breakdown */}
      <div className="section-title">
        <span>📊</span> Phân loại theo tình trạng
      </div>
      <div className="status-breakdown">
        <div className="sb-item">
          <div className="sb-val" style={{ color: "var(--danger)" }}>
            {stats.status_counts["Nghiện"] || 0}
          </div>
          <div className="sb-label">🔴 Nghiện</div>
        </div>
        <div className="sb-item">
          <div className="sb-val" style={{ color: "var(--warning)" }}>
            {stats.status_counts["Sử dụng"] || 0}
          </div>
          <div className="sb-label">🟡 Sử dụng</div>
        </div>
        <div className="sb-item">
          <div className="sb-val" style={{ color: "var(--success)" }}>
            {stats.status_counts["Sau cai"] || 0}
          </div>
          <div className="sb-label">🟢 Sau cai</div>
        </div>
        <div className="sb-item">
          <div className="sb-val" style={{ color: "var(--purple)" }}>
            {stats.status_counts["Khởi tố"] || 0}
          </div>
          <div className="sb-label">🟣 Khởi tố</div>
        </div>
      </div>

      {/* TDP Stats */}
      <div className="section-title">
        <span>📍</span> Thống kê Đối tượng Ma túy theo TDP
      </div>
      <div className="card w-full overflow-x-auto">
        {sortedTdp.length === 0 ? (
           <div className="empty-state py-10">Không có dữ liệu đối tượng ma túy theo TDP</div>
        ) : (
          <div className="flex items-end gap-3 min-w-max h-72 pt-8 px-4 border-b border-slate-200">
            {sortedTdp.map(([tdp, count]) => {
              const maxCount = Math.max(...sortedTdp.map(s => s[1]));
              const heightPercent = Math.max((count / (maxCount || 1)) * 100, 10);
              
              let riskColor = "bg-green-500 hover:bg-green-600 shadow-[0_0_10px_rgba(34,197,94,0.3)]";
              if (count >= 5) riskColor = "bg-red-500 hover:bg-red-600 shadow-[0_0_10px_rgba(239,68,68,0.4)]";
              else if (count >= 2) riskColor = "bg-yellow-500 hover:bg-yellow-600 shadow-[0_0_10px_rgba(234,179,8,0.3)]";

              return (
                <div key={tdp} className="flex flex-col items-center justify-end w-16 group relative h-full">
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-12 bg-slate-900 text-white text-xs py-1.5 px-3 rounded-lg whitespace-nowrap transition-opacity pointer-events-none z-10 shadow-xl border border-slate-700">
                     <span className="font-bold text-yellow-400">Tổ {tdp}</span><br />
                     {count} đối tượng
                  </div>
                  
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">{count}</span>
                  
                  <div 
                    className={`w-12 rounded-t-xl transition-all duration-500 cursor-pointer ${riskColor}`} 
                    style={{ height: `${heightPercent}%` }}
                  ></div>
                  
                  <span className="text-[11px] font-bold text-slate-500 mt-3 whitespace-nowrap truncate w-full text-center tracking-wider">Tổ {tdp}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="section-title">
        <span>⚡</span> Thao tác nhanh
      </div>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <Link
          href="/subjects"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Users className="w-4 h-4" />
          Thêm đối tượng mới
        </Link>
        <Link
          href="/businesses"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
        >
          <Store className="w-4 h-4" />
          Thêm cơ sở kinh doanh
        </Link>
        <Link
          href="/gis"
          className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
        >
          <span role="img" aria-label="map">🗺️</span>
          Xem Bản đồ GIS
        </Link>
      </div>
    </div>
  );
}