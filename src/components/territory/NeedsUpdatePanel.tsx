"use client";

import React, { useState, useMemo } from "react";
import { ISubject, IRental, IConditionalBusiness } from "@/lib/models";
import {
  AlertCircle,
  MapPin,
  Home,
  Clock,
  ExternalLink,
  Search,
  Filter,
  Check,
  X,
  Sparkles,
  ChevronRight,
  Shield,
  Store,
  Users,
} from "lucide-react";
import Link from "next/link";

export type IssueCategory =
  | "all"
  | "no_coords"
  | "no_house_image"
  | "missing_address"
  | "pending"
  | "rejected"
  | "outdated";

export interface NeedsUpdatePanelProps {
  subjects: ISubject[];
  rentals?: IRental[];
  businesses?: IConditionalBusiness[];
  userRole?: string;
  currentUserId?: string;
  isDrawer?: boolean;
  onPickCoordinates?: (entity: {
    type: "subject" | "rental" | "business";
    id: string;
    name: string;
    initialLat?: number;
    initialLng?: number;
  }) => void;
  onClose?: () => void;
  className?: string;
}

function isRecordOutdated(dateStr?: string | Date): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
  return diffDays > 60;
}

export function NeedsUpdatePanel({
  subjects,
  rentals = [],
  businesses = [],
  userRole = "officer",
  currentUserId,
  isDrawer = false,
  onPickCoordinates,
  onClose,
  className = "",
}: NeedsUpdatePanelProps) {
  const [activeTab, setActiveTab] = useState<IssueCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const isAdminOrLeader = userRole === "admin" || userRole === "leader";

  // Scope subjects according to user role
  const scopedSubjects = useMemo(() => {
    if (isAdminOrLeader) return subjects;
    if (currentUserId) {
      return subjects.filter((s) => s.assigned_officer_id === currentUserId || s.created_by === currentUserId);
    }
    return subjects;
  }, [subjects, isAdminOrLeader, currentUserId]);

  // Compute issue items
  const items = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      type: "subject" | "rental" | "business";
      tdp?: string;
      address?: string;
      lat?: number;
      lng?: number;
      issues: IssueCategory[];
      statusText?: string;
    }> = [];

    // Process subjects
    scopedSubjects.forEach((s) => {
      const issues: IssueCategory[] = [];
      const hasCoords = s.lat && s.lng && s.lat !== 0 && s.lng !== 0;
      const hasHouseImg = !!s.house_image_url;
      const hasAddress = !!(s.address_permanent || s.address_current);
      const hasTDP = !!s.tdp;
      const isPending = s.approval_status === "Pending";
      const isRejected = s.approval_status === "Rejected" || s.approval_status === "NeedsUpdate";
      const outdated = isRecordOutdated(s.updated_at);

      if (!hasCoords) issues.push("no_coords");
      if (hasCoords && !hasHouseImg) issues.push("no_house_image");
      if (!hasAddress || !hasTDP) issues.push("missing_address");
      if (isPending) issues.push("pending");
      if (isRejected) issues.push("rejected");
      if (outdated) issues.push("outdated");

      if (issues.length > 0) {
        list.push({
          id: s._id?.toString() || "",
          name: s.full_name,
          type: "subject",
          tdp: s.tdp,
          address: s.address_current || s.address_permanent,
          lat: s.lat,
          lng: s.lng,
          issues,
          statusText: s.status,
        });
      }
    });

    // Process rentals
    rentals.forEach((r) => {
      const issues: IssueCategory[] = [];
      const hasCoords = r.lat && r.lng && r.lat !== 0 && r.lng !== 0;
      const hasAddress = !!r.address;
      const hasTDP = !!r.tdp;
      const isPending = r.approval_status === "Pending";
      const outdated = isRecordOutdated(r.updated_at);

      if (!hasCoords) issues.push("no_coords");
      if (!hasAddress || !hasTDP) issues.push("missing_address");
      if (isPending) issues.push("pending");
      if (outdated) issues.push("outdated");

      if (issues.length > 0) {
        list.push({
          id: r._id?.toString() || "",
          name: r.name,
          type: "rental",
          tdp: r.tdp,
          address: r.address,
          lat: r.lat,
          lng: r.lng,
          issues,
          statusText: "Nhà trọ",
        });
      }
    });

    // Process businesses
    businesses.forEach((b) => {
      const issues: IssueCategory[] = [];
      const hasCoords = b.lat && b.lng && b.lat !== 0 && b.lng !== 0;
      const hasAddress = !!b.address;
      const hasTDP = !!b.tdp;
      const isPending = b.approval_status === "Pending";
      const outdated = isRecordOutdated(b.updated_at);

      if (!hasCoords) issues.push("no_coords");
      if (!hasAddress || !hasTDP) issues.push("missing_address");
      if (isPending) issues.push("pending");
      if (outdated) issues.push("outdated");

      if (issues.length > 0) {
        list.push({
          id: b._id?.toString() || "",
          name: b.business_name,
          type: "business",
          tdp: b.tdp,
          address: b.address,
          lat: b.lat,
          lng: b.lng,
          issues,
          statusText: b.business_type,
        });
      }
    });

    return list;
  }, [scopedSubjects, rentals, businesses]);

  // Filter items by active tab and search query
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeTab !== "all" && !item.issues.includes(activeTab)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.name?.toLowerCase().includes(q) ||
          item.address?.toLowerCase().includes(q) ||
          item.tdp?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, activeTab, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: items.length,
      no_coords: items.filter((i) => i.issues.includes("no_coords")).length,
      no_house_image: items.filter((i) => i.issues.includes("no_house_image")).length,
      missing_address: items.filter((i) => i.issues.includes("missing_address")).length,
      pending: items.filter((i) => i.issues.includes("pending")).length,
      rejected: items.filter((i) => i.issues.includes("rejected")).length,
      outdated: items.filter((i) => i.issues.includes("outdated")).length,
    };
  }, [items]);

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden flex flex-col ${
        isDrawer ? "h-full max-h-[85vh] w-full max-w-md" : "w-full"
      } ${className}`}
    >
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/90">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
            <AlertCircle className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Dữ liệu cần cập nhật</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isAdminOrLeader ? "Toàn địa bàn" : "Hồ sơ được phân công"} • {counts.all} bản ghi cần xử lý
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50 grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-[10px]">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`p-1.5 rounded-lg font-bold border transition ${
            activeTab === "all"
              ? "bg-rose-600 border-rose-400 text-white shadow-sm"
              : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400"
          }`}
        >
          Tất cả ({counts.all})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("no_coords")}
          className={`p-1.5 rounded-lg font-bold border transition ${
            activeTab === "no_coords"
              ? "bg-rose-600 border-rose-400 text-white shadow-sm"
              : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400"
          }`}
        >
          Thiếu tọa độ ({counts.no_coords})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("no_house_image")}
          className={`p-1.5 rounded-lg font-bold border transition ${
            activeTab === "no_house_image"
              ? "bg-amber-600 border-amber-400 text-white shadow-sm"
              : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400"
          }`}
        >
          Thiếu ảnh ({counts.no_house_image})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("missing_address")}
          className={`p-1.5 rounded-lg font-bold border transition ${
            activeTab === "missing_address"
              ? "bg-amber-600 border-amber-400 text-white shadow-sm"
              : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400"
          }`}
        >
          Thiếu ĐC ({counts.missing_address})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={`p-1.5 rounded-lg font-bold border transition ${
            activeTab === "pending"
              ? "bg-blue-600 border-blue-400 text-white shadow-sm"
              : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400"
          }`}
        >
          Chờ duyệt ({counts.pending})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("outdated")}
          className={`p-1.5 rounded-lg font-bold border transition ${
            activeTab === "outdated"
              ? "bg-purple-600 border-purple-400 text-white shadow-sm"
              : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400"
          }`}
        >
          &gt;60 ngày ({counts.outdated})
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-800">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, địa chỉ, TDP..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* List items with CSS Alpha Masking */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 mask-vertical-fade">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs italic">
            ✓ Không có bản ghi nào trong nhóm này cần cập nhật.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-cyan-500/40 hover:shadow-md transition text-xs space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 mt-0.5">
                    {item.type === "subject" ? <Users className="w-3.5 h-3.5 text-red-500" /> : item.type === "rental" ? <Home className="w-3.5 h-3.5 text-cyan-500" /> : <Store className="w-3.5 h-3.5 text-rose-500" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white leading-snug">{item.name}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {item.tdp || "Chưa có TDP"} • {item.address || "Chưa có địa chỉ"}
                    </p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                  {item.statusText || item.type}
                </span>
              </div>

              {/* Issue tags */}
              <div className="flex flex-wrap gap-1">
                {item.issues.includes("no_coords") && (
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-bold flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" /> Chưa có tọa độ
                  </span>
                )}
                {item.issues.includes("no_house_image") && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold flex items-center gap-1">
                    <Home className="w-2.5 h-2.5" /> Thiếu ảnh nhà
                  </span>
                )}
                {item.issues.includes("missing_address") && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                    Thiếu ĐC/TDP
                  </span>
                )}
                {item.issues.includes("pending") && (
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-bold">
                    Chờ duyệt
                  </span>
                )}
                {item.issues.includes("outdated") && (
                  <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[10px] font-bold flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> &gt;60 ngày chưa cập nhật
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                {onPickCoordinates && (
                  <button
                    type="button"
                    onClick={() =>
                      onPickCoordinates({
                        type: item.type,
                        id: item.id,
                        name: item.name,
                        initialLat: item.lat,
                        initialLng: item.lng,
                      })
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm transition"
                  >
                    <MapPin className="w-3 h-3" /> Gắn tọa độ
                  </button>
                )}

                {item.type === "subject" && (
                  <Link
                    href={`/subjects?search=${encodeURIComponent(item.name)}`}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition"
                  >
                    <ExternalLink className="w-3 h-3" /> Mở hồ sơ
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
