"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, Calendar, FilterX } from "lucide-react";
import { getSubjects } from "@/lib/actions/subjects"; // Fetch data directly for export

export default function DashboardControls() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [startDate, setStartDate] = useState(searchParams.get("start") || "");
  const [endDate, setEndDate] = useState(searchParams.get("end") || "");
  const [isExporting, setIsExporting] = useState(false);

  const handleFilter = () => {
    const params = new URLSearchParams(searchParams);
    if (startDate) params.set("start", startDate);
    else params.delete("start");
    
    if (endDate) params.set("end", endDate);
    else params.delete("end");

    router.push(`/?${params.toString()}`);
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    router.push("/");
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Get all raw subjects that match the filter
      const subjects = await getSubjects(undefined, startDate, endDate);
      
      // Build CSV
      const headers = ["STT", "Họ và tên", "Ngày sinh", "Giới tính", "CCCD", "Nghề nghiệp", "Tổ dân phố", "Địa chỉ hiện tại", "Tình trạng", "Loại ma túy", "Thời điểm lập hồ sơ"];
      const rows = subjects.map((s, idx) => [
        idx + 1,
        `"${s.full_name || ""}"`,
        `"${s.dob || ""}"`,
        `"${s.gender || ""}"`,
        `"${s.id_card || ""}"`,
        `"${s.job || ""}"`,
        `"${s.tdp || ""}"`,
        `"${s.address_current || ""}"`,
        `"${s.status || ""}"`,
        `"${s.drug_types_used?.join(", ") || ""}"`,
        `"${new Date(s.created_at).toLocaleDateString("vi-VN")}"`
      ]);

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `BaoCao_QuanLyMaTuy_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(error);
      alert("Lỗi khi kết xuất báo cáo!");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm mb-6">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-semibold text-slate-700">Lọc thống kê:</span>
      </div>
      
      <div className="flex items-center gap-2">
        <input 
          type="date" 
          value={startDate} 
          onChange={e => setStartDate(e.target.value)}
          className="text-sm border border-slate-300 rounded px-2 py-1.5 focus:border-blue-500 outline-none"
        />
        <span className="text-slate-400">-</span>
        <input 
          type="date" 
          value={endDate} 
          onChange={e => setEndDate(e.target.value)}
          className="text-sm border border-slate-300 rounded px-2 py-1.5 focus:border-blue-500 outline-none"
        />
      </div>

      <button onClick={handleFilter} className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-1.5 rounded text-sm font-medium transition-colors">
        Lọc
      </button>

      {(startDate || endDate) && (
        <button onClick={handleClear} className="text-slate-500 hover:text-red-500 px-2 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1">
          <FilterX className="w-4 h-4" /> Bỏ lọc
        </button>
      )}

      <div className="flex-1"></div>

      <button 
        onClick={handleExport} 
        disabled={isExporting}
        className="bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-1.5 rounded text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        {isExporting ? "Đang xuất..." : "Xuất Báo Cáo (CSV)"}
      </button>
    </div>
  );
}
