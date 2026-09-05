"use client";

import React, { useState } from "react";
import { ITDP } from "@/lib/models/TDP";
import {
  Building2,
  Users,
  Shield,
  MapPin,
  Phone,
  UserCheck,
  ChevronRight,
  Maximize2,
  Lock,
  Edit3,
  Award,
  Flag,
  Home,
} from "lucide-react";

export type TDPSize = "compact" | "standard" | "full";

export interface TDPOverviewCardProps {
  tdp: ITDP;
  size?: TDPSize;
  userRole?: string;
  onFocusOnMap?: (tdp: ITDP) => void;
  onEdit?: (tdp: ITDP) => void;
  onClassifyRisk?: (tdp: ITDP, risk: "green" | "yellow" | "red") => void;
  className?: string;
}

export function TDPOverviewCard({
  tdp,
  size = "standard",
  userRole = "officer",
  onFocusOnMap,
  onEdit,
  onClassifyRisk,
  className = "",
}: TDPOverviewCardProps) {
  const isGuest = userRole === "guest";
  const canClassify = userRole === "admin" || userRole === "leader";

  const riskStatusBadge = {
    red: { label: "Vùng Đỏ (Trọng điểm)", class: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30" },
    yellow: { label: "Vùng Vàng (Phức tạp)", class: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" },
    green: { label: "Vùng Xanh (An toàn)", class: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
  }[tdp.risk_status || "green"] || { label: "Vùng Xanh", class: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" };

  // 1. COMPACT SIZE (For sidebar list, selector, quick dashboard list)
  if (size === "compact") {
    return (
      <div
        className={`group p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500/40 hover:shadow-md transition-all flex items-center justify-between gap-3 text-xs ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-white shadow-sm"
            style={{ backgroundColor: tdp.color || "#0284c7" }}
          >
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-900 dark:text-white truncate">{tdp.name}</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {tdp.households || 0} hộ • {tdp.population || 0} nhân khẩu
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${riskStatusBadge.class}`}>
            {tdp.risk_status === "red" ? "Đỏ" : tdp.risk_status === "yellow" ? "Vàng" : "Xanh"}
          </span>
          {onFocusOnMap && (
            <button
              type="button"
              onClick={() => onFocusOnMap(tdp)}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-600 dark:text-slate-300 transition"
              title="Xem trên bản đồ"
            >
              <MapPin className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. STANDARD SIZE (Standard card in TDP directory or modal)
  if (size === "standard") {
    return (
      <div
        className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-lg dark:hover:border-cyan-500/30 transition-all p-5 flex flex-col justify-between gap-4 ${className}`}
      >
        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3.5">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                style={{ backgroundColor: tdp.color || "#0284c7" }}
              >
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{tdp.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Diện tích: {tdp.area_sqm ? `${(tdp.area_sqm / 10000).toFixed(2)} ha` : "—"}
                </p>
              </div>
            </div>

            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border shrink-0 ${riskStatusBadge.class}`}>
              {riskStatusBadge.label}
            </span>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2 mb-3.5">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Số hộ dân</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                {tdp.households ? tdp.households.toLocaleString() : "0"}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Nhân khẩu</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                {tdp.population ? tdp.population.toLocaleString() : "0"}
              </span>
            </div>
          </div>

          {/* Core Leadership Info */}
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            {tdp.secretary_name && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Flag className="w-3.5 h-3.5 text-red-500" /> Bí thư Chi bộ:
                </span>
                <span className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                  {tdp.secretary_name} {!isGuest && tdp.secretary_phone ? `(${tdp.secretary_phone})` : ""}
                </span>
              </div>
            )}
            {tdp.leader_name && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <UserCheck className="w-3.5 h-3.5 text-blue-500" /> Tổ trưởng:
                </span>
                <span className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                  {tdp.leader_name} {!isGuest && tdp.leader_phone ? `(${tdp.leader_phone})` : ""}
                </span>
              </div>
            )}
            {tdp.police_name && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" /> CSKV phụ trách:
                </span>
                <span className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                  {tdp.police_name} {!isGuest && tdp.police_phone ? `(${tdp.police_phone})` : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          {onFocusOnMap && (
            <button
              type="button"
              onClick={() => onFocusOnMap(tdp)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/60 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <MapPin className="w-3.5 h-3.5" /> Xem bản đồ
            </button>
          )}

          {onEdit && canClassify && (
            <button
              type="button"
              onClick={() => onEdit(tdp)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Edit3 className="w-3.5 h-3.5" /> Sửa thông tin
            </button>
          )}
        </div>
      </div>
    );
  }

  // 3. FULL SIZE (Comprehensive detailed profile for 27 TDPs)
  return (
    <div
      className={`rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden ${className}`}
    >
      {/* Header Banner */}
      <div
        className="p-6 sm:p-8 text-white relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, #0f172a 0%, #1e293b 50%, ${tdp.color || "#0284c7"}22 100%)`,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0"
              style={{ backgroundColor: tdp.color || "#0284c7" }}
            >
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1">
                <h2 className="text-xl sm:text-2xl font-bold tracking-wide">{tdp.name}</h2>
                <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${riskStatusBadge.class}`}>
                  {riskStatusBadge.label}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Thuộc địa bàn Phường Liên Chiểu • TP Đà Nẵng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onFocusOnMap && (
              <button
                type="button"
                onClick={() => onFocusOnMap(tdp)}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-950/50 transition"
              >
                <MapPin className="w-4 h-4" /> Vị trí trên GIS
              </button>
            )}
            {onEdit && canClassify && (
              <button
                type="button"
                onClick={() => onEdit(tdp)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
              >
                <Edit3 className="w-4 h-4" /> Cập nhật
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Full 4 Pillars Grid (1470 Standard) */}
      <div className="p-6 sm:p-8 space-y-6 text-xs sm:text-sm">
        {/* Pillar 1: Chi bộ Đảng */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50/60 dark:bg-slate-900/40">
          <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
            <Flag className="w-4 h-4 text-red-500" /> 1. Chi bộ Đảng cơ sở
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-slate-600 dark:text-slate-300">
            <div>
              <span className="text-slate-400 block text-[11px]">Bí thư Chi bộ</span>
              <b className="text-slate-900 dark:text-white font-medium">{tdp.secretary_name || "Chưa cập nhật"}</b>
              {!isGuest && tdp.secretary_phone && <p className="text-slate-500 text-xs">{tdp.secretary_phone}</p>}
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Số lượng Đảng viên</span>
              <b className="font-mono text-slate-900 dark:text-white">Tổng số: {(tdp as any).party_members_count || 0} ĐV</b>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Đảng viên Quy định 213</span>
              <b className="font-mono text-slate-900 dark:text-white">{(tdp as any).regulation_213_count || 0} ĐV sinh hoạt nơi cư trú</b>
            </div>
          </div>
        </div>

        {/* Pillar 2 & 3: Ban cán sự TDP + Lực lượng ANTT cơ sở */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50/60 dark:bg-slate-900/40">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-500" /> 2. Ban cán sự TDP & Mặt trận
            </h4>
            <div className="space-y-2 text-slate-600 dark:text-slate-300">
              <p><b>Tổ trưởng dân phố:</b> {tdp.leader_name || "—"} {!isGuest && tdp.leader_phone ? `(${tdp.leader_phone})` : ""}</p>
              <p><b>Trưởng ban Công tác Mặt trận:</b> {(tdp as any).front_head_name || "—"}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50/60 dark:bg-slate-900/40">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" /> 3. Lực lượng An ninh trật tự cơ sở
            </h4>
            <div className="space-y-2 text-slate-600 dark:text-slate-300">
              <p><b>Cảnh sát khu vực:</b> {tdp.police_name || "—"} {!isGuest && tdp.police_phone ? `(${tdp.police_phone})` : ""}</p>
              <p><b>Tổ trưởng Tổ Bảo vệ ANTT:</b> {(tdp as any).security_leader_name || "—"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
