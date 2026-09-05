"use client";

import React, { useState } from "react";
import { ISubject } from "@/lib/models";
import {
  MapPin,
  Calendar,
  Phone,
  Shield,
  Clock,
  User,
  AlertTriangle,
  Home,
  ExternalLink,
  Edit3,
  CheckCircle2,
  Copy,
  Check,
  Eye,
  FileText,
} from "lucide-react";
import Link from "next/link";

export type CardSize = "compact" | "standard" | "full";

export interface SubjectDetailCardProps {
  subject: ISubject;
  size?: CardSize;
  userRole?: string;
  onPickCoordinates?: (subject: ISubject) => void;
  onEdit?: (subject: ISubject) => void;
  onViewDetails?: (subject: ISubject) => void;
  className?: string;
}

const statusBadgeClasses: Record<string, string> = {
  "Nghiện": "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
  "Sử dụng": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  "Sau cai": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  "Khởi tố": "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  "Thanh loại": "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30",
};

const riskBadgeClasses: Record<string, string> = {
  "Cao": "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
  "red": "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
  "Trung bình": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  "yellow": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  "Thấp": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  "green": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
};

export function SubjectDetailCard({
  subject,
  size = "standard",
  userRole = "officer",
  onPickCoordinates,
  onEdit,
  onViewDetails,
  className = "",
}: SubjectDetailCardProps) {
  const [copiedCoords, setCopiedCoords] = useState(false);
  const isGuest = userRole === "guest";
  const hasCoords = subject.lat && subject.lng && subject.lat !== 0 && subject.lng !== 0;

  const handleCopyCoordinates = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasCoords) {
      navigator.clipboard.writeText(`${subject.lat}, ${subject.lng}`);
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2000);
    }
  };

  const statusClass = statusBadgeClasses[subject.status || ""] || "bg-slate-500/10 text-slate-600 border-slate-500/30";
  const riskClass = riskBadgeClasses[subject.risk_level || ""] || "bg-slate-500/10 text-slate-600 border-slate-500/30";

  // 1. COMPACT SIZE (For dense list view, search dropdown, mobile bottom HUD)
  if (size === "compact") {
    return (
      <div
        className={`group p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-cyan-500/40 hover:shadow-md transition-all flex items-center justify-between gap-3 text-xs ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold shrink-0">
            {subject.full_name?.charAt(0) || "U"}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-900 dark:text-white truncate">
              {subject.full_name}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {subject.tdp || "Chưa có TDP"} • {subject.status || "Chưa rõ"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusClass}`}>
            {subject.status || "Chưa rõ"}
          </span>
          {onPickCoordinates && !hasCoords && (
            <button
              type="button"
              onClick={() => onPickCoordinates(subject)}
              className="p-1.5 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 transition"
              title="Gắn tọa độ ngay"
            >
              <MapPin className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. STANDARD SIZE (Standard card for grid view or popup details)
  if (size === "standard") {
    return (
      <div
        className={`group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-lg dark:hover:border-cyan-500/30 transition-all overflow-hidden flex flex-col ${className}`}
      >
        {/* House image header preview if available */}
        {subject.house_image_url ? (
          <div className="relative h-36 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <img
              src={subject.house_image_url}
              alt={`Nhà ở của ${subject.full_name}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
            <span className="absolute bottom-2 left-3 text-[10px] font-bold text-white bg-black/60 backdrop-blur px-2 py-0.5 rounded-md flex items-center gap-1">
              <Home className="w-3 h-3 text-cyan-400" /> Ảnh thực tế nhà ở
            </span>
          </div>
        ) : (
          <div className="h-10 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-850 dark:to-slate-800 border-b border-slate-100 dark:border-slate-800"></div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
          <div>
            {/* Header: Name + Badges */}
            <div className="flex items-start justify-between gap-2 mb-2.5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  {subject.full_name}
                </h3>
                {subject.alias && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    Tên gọi khác: {subject.alias}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusClass}`}>
                  {subject.status || "Chưa rõ"}
                </span>
                {subject.risk_level && (
                  <span className={`px-2 py-0.2 rounded-md text-[10px] font-semibold border ${riskClass}`}>
                    {subject.risk_level === "red" ? "Nguy cơ cao" : subject.risk_level === "yellow" ? "Trung bình" : "Bình thường"}
                  </span>
                )}
              </div>
            </div>

            {/* Info Items List */}
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Năm sinh: <b>{subject.yob || subject.dob || "—"}</b> ({subject.gender || "Nam"})</span>
              </div>
              <div className="flex items-center gap-2">
                <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">TDP: <b>{subject.tdp || "Chưa cập nhật"}</b></span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">
                  {subject.address_current || subject.address_permanent || "Chưa có thông tin địa chỉ"}
                </span>
              </div>
              {!isGuest && subject.id_card && (
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>CCCD: <b className="font-mono">{subject.id_card}</b></span>
                </div>
              )}
            </div>
          </div>

          {/* Coordinates Bar & Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            {hasCoords ? (
              <button
                type="button"
                onClick={handleCopyCoordinates}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                title="Sao chép tọa độ GPS"
              >
                {copiedCoords ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
                <span>{subject.lat!.toFixed(5)}, {subject.lng!.toFixed(5)}</span>
              </button>
            ) : (
              <span className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Chưa gắn tọa độ
              </span>
            )}

            <div className="flex items-center gap-1.5">
              {onPickCoordinates && (
                <button
                  type="button"
                  onClick={() => onPickCoordinates(subject)}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/60 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 border border-slate-200 dark:border-slate-700 transition"
                  title="Chọn vị trí trên bản đồ"
                >
                  <MapPin className="w-3.5 h-3.5" />
                </button>
              )}

              {onEdit && !isGuest && (
                <button
                  type="button"
                  onClick={() => onEdit(subject)}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition"
                  title="Chỉnh sửa hồ sơ"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}

              <Link
                href={`/subjects?search=${encodeURIComponent(subject.full_name)}`}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition"
              >
                <Eye className="w-3 h-3" /> Chi tiết
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. FULL SIZE (For detailed drawer, modal view, or full profile view)
  return (
    <div
      className={`rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden ${className}`}
    >
      {/* Top Banner with House Photo & Quick Header */}
      <div className="relative p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            {subject.face_image_url ? (
              <img
                src={subject.face_image_url}
                alt={subject.full_name}
                className="w-16 h-20 sm:w-20 sm:h-24 rounded-2xl object-cover border-2 border-cyan-400/40 shadow-lg shrink-0"
              />
            ) : (
              <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-2xl bg-slate-800 border-2 border-cyan-500/30 flex flex-col items-center justify-center text-slate-400 shrink-0">
                <User className="w-8 h-8 text-cyan-400 mb-1" />
                <span className="text-[10px]">Chưa có ảnh</span>
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                  {subject.full_name}
                </h2>
                <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${statusClass}`}>
                  {subject.status || "Chưa rõ"}
                </span>
                {subject.risk_level && (
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${riskClass}`}>
                    {subject.risk_level === "red" ? "Nguy cơ cao" : subject.risk_level === "yellow" ? "Trung bình" : "Bình thường"}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-300">
                {subject.tdp || "Chưa cập nhật TDP"} • Sinh năm: {subject.yob || subject.dob || "—"} ({subject.gender || "Nam"})
              </p>
              {!isGuest && subject.id_card && (
                <p className="text-xs text-cyan-400 font-mono mt-1">CCCD: {subject.id_card}</p>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {onPickCoordinates && (
              <button
                type="button"
                onClick={() => onPickCoordinates(subject)}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-950/40 transition"
              >
                <MapPin className="w-4 h-4" /> {hasCoords ? "Chọn lại vị trí" : "Gắn tọa độ"}
              </button>
            )}
            {onEdit && !isGuest && (
              <button
                type="button"
                onClick={() => onEdit(subject)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
              >
                <Edit3 className="w-4 h-4" /> Chỉnh sửa
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid Content Sections */}
      <div className="p-6 sm:p-8 space-y-6 text-xs sm:text-sm">
        {/* Section 1: House image & Address 3-parameter standard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-5 flex flex-col justify-between">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
              <Home className="w-4 h-4 text-cyan-500" /> Tiêu chuẩn 3 thông số nhà ở (1470/C06)
            </h4>
            <div className="space-y-2.5 text-slate-600 dark:text-slate-300">
              <p><b>1. Địa chỉ chi tiết:</b> {subject.address_current || subject.address_permanent || "Chưa có"}</p>
              <p><b>2. Tổ dân phố cư trú:</b> {subject.tdp || "Chưa có"}</p>
              <p className="flex items-center gap-2">
                <b>3. Tọa độ số GIS:</b>
                {hasCoords ? (
                  <span className="font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-800 px-2 py-0.5 rounded font-bold">
                    {subject.lat!.toFixed(6)}, {subject.lng!.toFixed(6)}
                  </span>
                ) : (
                  <span className="text-rose-500 italic">Chưa gắn tọa độ</span>
                )}
              </p>
            </div>
          </div>

          {/* House Image Frame */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-800 h-44 relative">
            {subject.house_image_url ? (
              <img
                src={subject.house_image_url}
                alt="Ảnh thực tế ngôi nhà"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                <Home className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-xs font-semibold">Chưa có ảnh chụp thực tế nhà ở</span>
              </div>
            )}
            <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur">
              Ảnh thực tế nhà ở
            </span>
          </div>
        </div>

        {/* Section 2: Drugs & Health */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-900/30">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs mb-3">
              💊 Ma túy & Bệnh lý
            </h4>
            <div className="space-y-2 text-slate-600 dark:text-slate-300">
              <p><b>Loại ma túy sử dụng:</b> {(subject.drug_types_used && subject.drug_types_used.length > 0) ? subject.drug_types_used.join(", ") : "Chưa rõ"}</p>
              <p><b>Nghề nghiệp:</b> {subject.job || "Tự do / Không có"}</p>
              <p><b>Học vấn:</b> {subject.education || "—"}</p>
              {subject.pathology && <p><b>Bệnh lý:</b> {subject.pathology}</p>}
            </div>
          </div>

          {/* Family members */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-900/30">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs mb-3">
              👨‍👩‍👧 Thân nhân trong gia đình
            </h4>
            {subject.family_members && subject.family_members.length > 0 ? (
              <div className="space-y-1.5">
                {subject.family_members.map((m, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{m.full_name} ({m.relation})</span>
                    <span className="text-slate-500">{!isGuest ? m.phone || "—" : "***"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Chưa có thông tin thân nhân.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
