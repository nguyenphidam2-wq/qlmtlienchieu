"use client";

import React, { useState } from "react";
import { IRental, IConditionalBusiness } from "@/lib/models";
import {
  Building2,
  Store,
  MapPin,
  Phone,
  Shield,
  Clock,
  User,
  AlertTriangle,
  Home,
  ExternalLink,
  Edit3,
  CheckCircle2,
  Check,
  Eye,
  FileCheck,
  DollarSign,
  AlertCircle,
} from "lucide-react";

export type EntitySize = "compact" | "standard" | "full";

export interface RentalBusinessCardProps {
  data: (IRental | IConditionalBusiness) & Record<string, any>;
  type: "rental" | "business";
  size?: EntitySize;
  userRole?: string;
  onPickCoordinates?: (item: any) => void;
  onEdit?: (item: any) => void;
  onApprove?: (id: string) => void;
  className?: string;
}

export function RentalBusinessCard({
  data,
  type,
  size = "standard",
  userRole = "officer",
  onPickCoordinates,
  onEdit,
  onApprove,
  className = "",
}: RentalBusinessCardProps) {
  const isGuest = userRole === "guest";
  const canApprove = userRole === "admin" || userRole === "leader";
  const hasCoords = data.lat && data.lng && data.lat !== 0 && data.lng !== 0;

  const isRental = type === "rental";
  const title = isRental ? data.name : (data as IConditionalBusiness).business_name;
  const subtitle = isRental ? `Chủ trọ: ${data.owner_name || "—"}` : `Loại hình: ${(data as IConditionalBusiness).business_type}`;

  const isApproved = data.approval_status === "Approved";
  const isPending = data.approval_status === "Pending";

  // 1. COMPACT SIZE
  if (size === "compact") {
    return (
      <div
        className={`group p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-cyan-500/40 hover:shadow-md transition-all flex items-center justify-between gap-3 text-xs ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 ${isRental ? "bg-cyan-600" : "bg-rose-600"}`}>
            {isRental ? <Home className="w-4 h-4" /> : <Store className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-900 dark:text-white truncate">{title}</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {data.tdp || "Chưa có TDP"} • {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              isApproved
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                : "bg-amber-500/10 text-amber-600 border-amber-500/30"
            }`}
          >
            {isApproved ? "Đã duyệt" : "Chờ duyệt"}
          </span>

          {onPickCoordinates && !hasCoords && (
            <button
              type="button"
              onClick={() => onPickCoordinates(data)}
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

  // 2. STANDARD SIZE
  if (size === "standard") {
    return (
      <div
        className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-lg dark:hover:border-cyan-500/30 transition-all p-5 flex flex-col justify-between gap-4 ${className}`}
      >
        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 ${isRental ? "bg-cyan-600" : "bg-rose-600"}`}>
                {isRental ? <Home className="w-5 h-5" /> : <Store className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">{title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isRental ? "Nhà trọ / Lưu trú" : `Cơ sở: ${(data as IConditionalBusiness).business_type}`}
                </p>
              </div>
            </div>

            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border shrink-0 ${
                isApproved
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
              }`}
            >
              {isApproved ? "Đã duyệt" : "Chờ duyệt"}
            </span>
          </div>

          {/* Details list */}
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">
                {data.address || "Chưa rõ"} ({data.tdp || "Chưa có TDP"})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Chủ cơ sở: <b>{!isGuest ? data.owner_name || "—" : "***"}</b></span>
            </div>

            {isRental ? (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Tổng số phòng</span>
                  <b className="font-mono text-slate-800 dark:text-slate-200">{(data as IRental).total_rooms || 0} phòng</b>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Số người đang ở</span>
                  <b className="font-mono text-slate-800 dark:text-slate-200">{(data as IRental).current_tenants || 0} người</b>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Số nhân viên</span>
                  <b className="font-mono text-slate-800 dark:text-slate-200">{(data as IConditionalBusiness).employees_count || 0} người</b>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg truncate">
                  <span className="text-[10px] text-slate-400 block">Giấy phép ANTT</span>
                  <b className="font-mono text-slate-800 dark:text-slate-200 truncate">{(data as IConditionalBusiness).security_license_no || "Chưa cấp"}</b>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          {hasCoords ? (
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              {data.lat!.toFixed(5)}, {data.lng!.toFixed(5)}
            </span>
          ) : (
            <span className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Thiếu tọa độ
            </span>
          )}

          <div className="flex items-center gap-1.5">
            {onPickCoordinates && (
              <button
                type="button"
                onClick={() => onPickCoordinates(data)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/60 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition"
              >
                <MapPin className="w-3.5 h-3.5 text-cyan-600" /> Tọa độ
              </button>
            )}

            {isPending && canApprove && onApprove && (
              <button
                type="button"
                onClick={() => onApprove(data._id!.toString())}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition"
              >
                <Check className="w-3.5 h-3.5" /> Duyệt
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. FULL SIZE
  return (
    <div className={`rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6 ${className}`}>
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${isRental ? "bg-cyan-600" : "bg-rose-600"}`}>
            {isRental ? <Home className="w-6 h-6" /> : <Store className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isRental ? "Nhà trọ / Cơ sở cho thuê lưu trú" : "Ngành nghề đầu tư kinh doanh có điều kiện về ANTT"}
            </p>
          </div>
        </div>

        {onPickCoordinates && (
          <button
            type="button"
            onClick={() => onPickCoordinates(data)}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
          >
            <MapPin className="w-4 h-4" /> {hasCoords ? "Chọn lại vị trí" : "Gắn tọa độ"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
        <div className="space-y-3">
          <p><b>Địa chỉ:</b> {data.address || "Chưa có địa chỉ cụ thể"}</p>
          <p><b>Tổ dân phố:</b> {data.tdp || "Chưa có TDP"}</p>
          <p><b>Chủ cơ sở:</b> {!isGuest ? data.owner_name || "—" : "***"}</p>
          {!isGuest && data.owner_phone && <p><b>Số điện thoại:</b> {data.owner_phone}</p>}
        </div>

        <div className="space-y-3">
          <p><b>Tọa độ GIS:</b> {hasCoords ? `${data.lat!.toFixed(6)}, ${data.lng!.toFixed(6)}` : "Chưa có"}</p>
          <p><b>Trạng thái phê duyệt:</b> {data.approval_status || "Pending"}</p>
          {isRental && <p><b>Quy mô:</b> {(data as IRental).total_rooms || 0} phòng ({(data as IRental).current_tenants || 0} người lưu trú)</p>}
        </div>
      </div>
    </div>
  );
}
