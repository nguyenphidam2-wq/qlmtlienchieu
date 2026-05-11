"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

interface DashboardChartsProps {
  stats: {
    total_subjects: number;
    status_counts: Record<string, number>;
    tdp_stats: Record<string, number>;
    timeline_stats?: Array<{ month: string; count: number }>;
  };
}

export default function DashboardCharts({ stats }: DashboardChartsProps) {
  const statusData = [
    { name: "Nghiện", count: stats.status_counts["Nghiện"] || 0, color: "#ef4444" },
    { name: "Sử dụng", count: stats.status_counts["Sử dụng"] || 0, color: "#f59e0b" },
    { name: "Sau cai", count: stats.status_counts["Sau cai"] || 0, color: "#22c55e" },
    { name: "Khởi tố", count: stats.status_counts["Khởi tố"] || 0, color: "#a855f7" },
  ].filter(item => item.count > 0);

  const sortedTdp = Object.entries(stats.tdp_stats || {})
    .sort(([, a], [, b]) => b - a);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Status Breakdown - Donut Chart */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600">📊</span>
            Tỷ lệ theo tình trạng
          </h3>
          {statusData.length > 0 ? (
            <div className="relative">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} đối tượng`, ""]}
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "none",
                      borderRadius: "8px",
                      color: "white",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{stats.total_subjects}</span>
                <span className="block text-xs text-slate-500">Tổng</span>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                {statusData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 italic">Không có dữ liệu</div>
          )}
        </div>

        {/* TDP Stats Chart - Recharts BarChart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-amber-600">📍</span>
            Phân bố theo Tổ dân phố
          </h3>
          {sortedTdp.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={sortedTdp.map(([tdp, count]) => ({ name: `Tổ ${tdp}`, count }))}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  axisLine={{ stroke: "#334155" }}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={{ stroke: "#334155" }}
                />
                <Tooltip
                  formatter={(value) => [`${value} đối tượng`, "Số lượng"]}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                  }}
                  cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
                />
                <Bar
                  dataKey="count"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                >
                  {sortedTdp.map(([, count], index) => {
                    let fill = "#22c55e";
                    if (count >= 5) fill = "#ef4444";
                    else if (count >= 2) fill = "#f59e0b";
                    return <Cell key={`cell-${index}`} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 italic">Không có dữ liệu</div>
          )}
        </div>
      </div>

      {/* Timeline Chart - Area Chart */}
      {stats.timeline_stats && stats.timeline_stats.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600">📈</span>
            Xu hướng tạo mới theo tháng
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.timeline_stats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis
                dataKey="month"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={{ stroke: "#334155" }}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={{ stroke: "#334155" }}
                allowDecimals={false}
              />
              <Tooltip
                formatter={(value) => [`${value} đối tượng`, "Tạo mới"]}
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#a855f7"
                strokeWidth={2}
                fill="url(#colorCount)"
                dot={{ fill: "#a855f7", strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: "#a855f7" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  );
}