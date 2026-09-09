"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Popup,
  Marker,
  useMap,
  GeoJSON,
  Tooltip,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import { getSubjects, getCurrentUserInfo, updateSubject } from "@/lib/actions/subjects";
import { getCustomZones } from "@/lib/actions/zones";
import { getTDPs } from "@/lib/actions/tdp";
import { getRentals, updateRental } from "@/lib/actions/rentals";
import { getConditionalBusinesses, updateConditionalBusiness } from "@/lib/actions/conditional-businesses";
import { ISubject, ICustomZone, ITDP, IRental, IConditionalBusiness } from "@/lib/models";
import MarkerClusterGroup from "react-leaflet-cluster";
import * as turf from "@turf/turf";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  MapPin,
  Layers,
  Circle as CircleIcon,
  Ruler,
  Square,
  Users,
  Building2,
  Store,
  Shield,
  AlertTriangle,
  Clock,
  Filter,
  RefreshCw,
  RotateCcw,
  Search,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Edit3,
  Crosshair,
  AlertCircle,
  Eye,
  Home,
  Check,
  Maximize2,
  Minimize2,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

const MapPicker = dynamic(() => import("@/components/map/MapPicker"), { ssr: false });

// Semantic Status Colors (WCAG AA Compliant)
const statusColors: Record<string, string> = {
  "Nghiện": "#dc2626",    // Red-600
  "Sử dụng": "#d97706",   // Amber-600
  "Sau cai": "#16a34a",   // Emerald-600
  "Khởi tố": "#9333ea",   // Purple-600
  "Thanh loại": "#64748b" // Slate-500
};

const LIEN_CHIEU_CENTER: [number, number] = [16.0664, 108.1408];
const DEFAULT_ZOOM = 14;

const BASE_MAPS = {
  voyager: {
    name: "Bản đồ Chuẩn",
    url: "https://mt1.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps",
    subdomains: ["a"],
  },
  osm: {
    name: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: ["a", "b", "c"],
  },
  light: {
    name: "Tối giản Xám",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri",
    subdomains: [],
  },
};

// Check if a record is outdated (> 60 days)
function isRecordOutdated(dateStr?: string | Date): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
  return diffDays > 60;
}

// Marker Icons Generator
function createSubjectMarkerIcon(subject: ISubject): L.DivIcon {
  const status = subject.status || "Sử dụng";
  const color = statusColors[status] || "#d97706";
  const outdated = isRecordOutdated(subject.updated_at);

  return L.divIcon({
    className: "custom-subject-marker",
    html: `
      <div style="position: relative; width: 30px; height: 30px; transition: transform 0.2s;" class="hover:scale-125 cursor-pointer">
        <div style="
          width: 30px; 
          height: 30px; 
          border-radius: 50%; 
          background: ${color}; 
          border: 2.5px solid #ffffff; 
          box-shadow: 0 4px 14px rgba(0,0,0,0.45); 
          display: flex; 
          align-items: center; 
          justify-content: center;
          color: white;
        ">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
        ${outdated ? `
          <span style="
            position: absolute; 
            top: -2px; 
            right: -2px; 
            width: 10px; 
            height: 10px; 
            background: #f59e0b; 
            border: 2px solid white; 
            border-radius: 50%; 
            box-shadow: 0 0 6px #d97706;
          " title="Lâu chưa cập nhật (> 60 ngày)"></span>
        ` : ''}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
}

function createRentalMarkerIcon(rental: IRental): L.DivIcon {
  const isSafe = rental.security_assessment === "safe";
  const isComplex = rental.security_assessment === "complex";
  const color = isSafe ? "#0284c7" : isComplex ? "#e11d48" : "#0ea5e9";
  const outdated = isRecordOutdated(rental.updated_at);

  return L.divIcon({
    className: "custom-rental-marker",
    html: `
      <div style="position: relative; width: 30px; height: 30px; transition: transform 0.2s;" class="hover:scale-125 cursor-pointer">
        <div style="
          width: 30px; 
          height: 30px; 
          border-radius: 8px; 
          background: ${color}; 
          border: 2.5px solid #ffffff; 
          box-shadow: 0 4px 14px rgba(0,0,0,0.45); 
          display: flex; 
          align-items: center; 
          justify-content: center;
          color: white;
        ">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        ${outdated ? `
          <span style="
            position: absolute; 
            top: -2px; 
            right: -2px; 
            width: 10px; 
            height: 10px; 
            background: #f59e0b; 
            border: 2px solid white; 
            border-radius: 50%; 
          " title="Lâu chưa cập nhật (> 60 ngày)"></span>
        ` : ''}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
}

function createBusinessMarkerIcon(biz: IConditionalBusiness): L.DivIcon {
  const color = biz.risk_level === "red" ? "#dc2626" : biz.risk_level === "yellow" ? "#d97706" : "#f43f5e";
  const outdated = isRecordOutdated(biz.updated_at);

  return L.divIcon({
    className: "custom-business-marker",
    html: `
      <div style="position: relative; width: 30px; height: 30px; transition: transform 0.2s;" class="hover:scale-125 cursor-pointer">
        <div style="
          width: 30px; 
          height: 30px; 
          border-radius: 8px; 
          background: ${color}; 
          border: 2.5px solid #ffffff; 
          box-shadow: 0 4px 14px rgba(0,0,0,0.45); 
          display: flex; 
          align-items: center; 
          justify-content: center;
          color: white;
        ">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        ${outdated ? `
          <span style="
            position: absolute; 
            top: -2px; 
            right: -2px; 
            width: 10px; 
            height: 10px; 
            background: #f59e0b; 
            border: 2px solid white; 
            border-radius: 50%; 
          " title="Lâu chưa cập nhật (> 60 ngày)"></span>
        ` : ''}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
}

function MapController({ onMapReady }: { onMapReady?: (map: L.Map) => void }) {
  const map = useMap();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      if (onMapReady) onMapReady(map);
    }
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map, onMapReady]);

  return null;
}

export function GISMap() {
  // Main Data States
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [tdps, setTdps] = useState<ITDP[]>([]);
  const [customZones, setCustomZones] = useState<ICustomZone[]>([]);
  const [rentals, setRentals] = useState<IRental[]>([]);
  const [businesses, setBusinesses] = useState<IConditionalBusiness[]>([]);
  const [giaothongData, setGiaothongData] = useState<any>(null);

  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Active Map Layers
  const [visibleLayers, setVisibleLayers] = useState({
    subjects: true,
    tdps: true,
    rentals: true,
    businesses: true,
    zones: true,
    giaothong: false,
  });

  // Base map & Measuring tools
  const [activeBaseMap, setActiveBaseMap] = useState<"voyager" | "osm" | "light">("voyager");
  const [activeSpatialTool, setActiveSpatialTool] = useState<"none" | "circle" | "distance" | "polygon">("none");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Modals & Panels
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isNeedsUpdateOpen, setIsNeedsUpdateOpen] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [needsUpdateTab, setNeedsUpdateTab] = useState<
    "all" | "no_coords" | "no_house_image" | "missing_address" | "pending" | "rejected" | "outdated"
  >("all");

  // Coordinate Picker Entity
  const [pickingEntity, setPickingEntity] = useState<{
    type: "subject" | "rental" | "business";
    id: string;
    name: string;
    initialLat?: number;
    initialLng?: number;
  } | null>(null);

  // Filter States
  const [tdpFilter, setTdpFilter] = useState("");
  const [cskvFilter, setCskvFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [recencyFilter, setRecencyFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Role Checks
  const isGuest = currentUser?.role === "guest" || !currentUser;
  const isOfficer = currentUser?.role === "officer";
  const isAdminOrLeader = currentUser?.role === "admin" || currentUser?.role === "leader";

  // Fetch Current User
  useEffect(() => {
    getCurrentUserInfo()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null));
  }, []);

  // Initial Load Core Data
  const loadCoreData = useCallback(async () => {
    setLoading(true);
    try {
      const [subjectsData, tdpsData, zonesData] = await Promise.all([
        getSubjects(undefined, undefined, undefined, true),
        getTDPs(),
        getCustomZones(),
      ]);
      setSubjects(subjectsData);
      setTdps(tdpsData);
      setCustomZones(zonesData);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu GIS:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoreData();
  }, [loadCoreData]);

  // Lazy Load Rentals
  useEffect(() => {
    if (visibleLayers.rentals && rentals.length === 0) {
      getRentals()
        .then((data) => setRentals(data))
        .catch((err) => console.error("Lỗi khi tải dữ liệu nhà trọ:", err));
    }
  }, [visibleLayers.rentals, rentals.length]);

  // Lazy Load Businesses
  useEffect(() => {
    if (visibleLayers.businesses && businesses.length === 0) {
      getConditionalBusinesses()
        .then((data) => setBusinesses(data))
        .catch((err) => console.error("Lỗi khi tải dữ liệu cơ sở kinh doanh:", err));
    }
  }, [visibleLayers.businesses, businesses.length]);

  // Lazy Load Giaothong GeoJSON
  useEffect(() => {
    if (visibleLayers.giaothong && !giaothongData) {
      fetch("/data/Giaothong.geojson")
        .then((res) => res.json())
        .then((data) => setGiaothongData(data))
        .catch((err) => console.error("Lỗi khi tải bản đồ giao thông:", err));
    }
  }, [visibleLayers.giaothong, giaothongData]);

  // Distinct CSKV list
  const cskvList = useMemo(() => {
    const set = new Set<string>();
    tdps.forEach((t) => {
      if (t.police_name?.trim()) set.add(t.police_name.trim());
    });
    return Array.from(set).sort();
  }, [tdps]);

  // Filtered Subjects for Map
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      if (tdpFilter && s.tdp !== tdpFilter) return false;
      if (statusFilter && s.status !== statusFilter) return false;
      if (approvalFilter && s.approval_status !== approvalFilter) return false;
      if (riskFilter && s.risk_level !== riskFilter) return false;

      if (cskvFilter) {
        const matchedTDP = tdps.find((t) => t.name === s.tdp);
        if (!matchedTDP || matchedTDP.police_name !== cskvFilter) return false;
      }

      if (recencyFilter) {
        if (!s.updated_at) return false;
        const now = new Date().getTime();
        const diffDays = (now - new Date(s.updated_at).getTime()) / (1000 * 3600 * 24);
        if (recencyFilter === "7d" && diffDays > 7) return false;
        if (recencyFilter === "30d" && diffDays > 30) return false;
        if (recencyFilter === "90d" && diffDays > 90) return false;
        if (recencyFilter === "outdated" && diffDays <= 60) return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = s.full_name?.toLowerCase().includes(q);
        const matchAddress = s.address_permanent?.toLowerCase().includes(q) || s.address_current?.toLowerCase().includes(q);
        const matchTDP = s.tdp?.toLowerCase().includes(q);
        if (!matchName && !matchAddress && !matchTDP) return false;
      }

      return true;
    });
  }, [subjects, tdpFilter, statusFilter, approvalFilter, riskFilter, cskvFilter, recencyFilter, searchQuery, tdps]);

  // Filtered Rentals
  const filteredRentals = useMemo(() => {
    return rentals.filter((r) => {
      if (tdpFilter && r.tdp !== tdpFilter) return false;
      if (approvalFilter && r.approval_status !== approvalFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return r.name?.toLowerCase().includes(q) || r.address?.toLowerCase().includes(q) || r.tdp?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [rentals, tdpFilter, approvalFilter, searchQuery]);

  // Filtered Businesses
  const filteredBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      if (tdpFilter && b.tdp !== tdpFilter) return false;
      if (approvalFilter && b.approval_status !== approvalFilter) return false;
      if (riskFilter && b.risk_level !== riskFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return b.business_name?.toLowerCase().includes(q) || b.address?.toLowerCase().includes(q) || b.tdp?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [businesses, tdpFilter, approvalFilter, riskFilter, searchQuery]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (tdpFilter) count++;
    if (cskvFilter) count++;
    if (statusFilter) count++;
    if (approvalFilter) count++;
    if (riskFilter) count++;
    if (recencyFilter) count++;
    if (searchQuery) count++;
    return count;
  }, [tdpFilter, cskvFilter, statusFilter, approvalFilter, riskFilter, recencyFilter, searchQuery]);

  const clearAllFilters = () => {
    setTdpFilter("");
    setCskvFilter("");
    setStatusFilter("");
    setApprovalFilter("");
    setRiskFilter("");
    setRecencyFilter("");
    setSearchQuery("");
  };

  // "Needs Update" Calculations (Scoped by Role)
  const scopedSubjects = useMemo(() => {
    if (isAdminOrLeader) return subjects;
    if (isOfficer && currentUser) {
      return subjects.filter((s) => s.assigned_officer_id === currentUser.id || s.created_by === currentUser.id);
    }
    return [];
  }, [subjects, isAdminOrLeader, isOfficer, currentUser]);

  const needsUpdateList = useMemo(() => {
    return scopedSubjects.map((s) => {
      const issues: string[] = [];
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

      return {
        subject: s,
        issues,
      };
    }).filter((item) => item.issues.length > 0);
  }, [scopedSubjects]);

  const filteredNeedsUpdateList = useMemo(() => {
    if (needsUpdateTab === "all") return needsUpdateList;
    return needsUpdateList.filter((item) => item.issues.includes(needsUpdateTab));
  }, [needsUpdateList, needsUpdateTab]);

  const needsUpdateCounts = useMemo(() => {
    return {
      all: needsUpdateList.length,
      no_coords: needsUpdateList.filter((i) => i.issues.includes("no_coords")).length,
      no_house_image: needsUpdateList.filter((i) => i.issues.includes("no_house_image")).length,
      missing_address: needsUpdateList.filter((i) => i.issues.includes("missing_address")).length,
      pending: needsUpdateList.filter((i) => i.issues.includes("pending")).length,
      rejected: needsUpdateList.filter((i) => i.issues.includes("rejected")).length,
      outdated: needsUpdateList.filter((i) => i.issues.includes("outdated")).length,
    };
  }, [needsUpdateList]);

  // Overall Data Cleanliness KPI
  const dataQualityScore = useMemo(() => {
    if (scopedSubjects.length === 0) return 100;
    const withCoordsAndImg = scopedSubjects.filter(
      (s) => s.lat && s.lng && s.lat !== 0 && s.lng !== 0 && s.house_image_url
    ).length;
    return Math.round((withCoordsAndImg / scopedSubjects.length) * 100);
  }, [scopedSubjects]);

  // Handle Coordinate Save from MapPicker
  const handleCoordinatePicked = async (lat: number, lng: number) => {
    if (!pickingEntity) return;

    try {
      if (pickingEntity.type === "subject") {
        await updateSubject(pickingEntity.id, { lat, lng });
        setSubjects((prev) =>
          prev.map((s) => (s._id?.toString() === pickingEntity.id ? ({ ...s, lat, lng } as any) : s))
        );
      } else if (pickingEntity.type === "rental") {
        await updateRental(pickingEntity.id, { lat, lng });
        setRentals((prev) =>
          prev.map((r) => (r._id?.toString() === pickingEntity.id ? ({ ...r, lat, lng } as any) : r))
        );
      } else if (pickingEntity.type === "business") {
        await updateConditionalBusiness(pickingEntity.id, { lat, lng });
        setBusinesses((prev) =>
          prev.map((b) => (b._id?.toString() === pickingEntity.id ? ({ ...b, lat, lng } as any) : b))
        );
      }

      setPickingEntity(null);

      // Re-center map to updated coordinate
      if (mapRef.current) {
        mapRef.current.flyTo([lat, lng], 17, { duration: 1.2 });
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật tọa độ:", error);
      alert("Không thể lưu tọa độ. Vui lòng thử lại!");
    }
  };

  // Reset to Lien Chieu center
  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.flyTo(LIEN_CHIEU_CENTER, DEFAULT_ZOOM, { duration: 1 });
    }
  };

  return (
    <div className={`relative w-full ${isFullscreen ? 'fixed inset-0 z-[99999] h-screen' : 'h-[calc(100vh-4rem)]'} overflow-hidden bg-slate-950 font-sans`}>
      {/* Top Floating Controls */}
      <header className="absolute top-3.5 left-3.5 right-3.5 z-[1000] flex items-center justify-end gap-2 pointer-events-none">
        {/* Quick Action Controls */}
        <div className="flex items-center gap-2 pointer-events-auto flex-wrap justify-end">
          {/* Reset to Ward Center */}
          <button
            type="button"
            onClick={handleResetView}
            className="glass-pill px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800/80 active:scale-95 flex items-center gap-1.5 transition"
            title="Đưa bản đồ về trung tâm phường Liên Chiểu"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Về trung tâm</span>
          </button>

          {/* Layer Control Button */}
          <button
            type="button"
            onClick={() => setIsLegendOpen(!isLegendOpen)}
            className={`glass-pill px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 active:scale-95 transition ${
              isLegendOpen ? "bg-cyan-950/90 text-cyan-300 border-cyan-400/60 shadow-lg shadow-cyan-950/50" : "text-slate-200 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Lớp dữ liệu</span>
            <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-1.5 py-0.2 rounded-md">
              {Object.values(visibleLayers).filter(Boolean).length}/6
            </span>
          </button>

          {/* Filter Trigger Button */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`glass-pill px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 active:scale-95 transition ${
              activeFiltersCount > 0
                ? "bg-amber-950/90 border-amber-500/60 text-amber-300 shadow-lg shadow-amber-950/50"
                : "text-slate-200 hover:text-white"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Bộ lọc</span>
            {activeFiltersCount > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Needs Update Panel Trigger */}
          {!isGuest && (
            <button
              type="button"
              onClick={() => setIsNeedsUpdateOpen(!isNeedsUpdateOpen)}
              className={`glass-pill px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 active:scale-95 transition ${
                needsUpdateCounts.all > 0
                  ? "bg-rose-950/90 border-rose-500/60 text-rose-300 hover:bg-rose-900/80 shadow-lg shadow-rose-950/50"
                  : "text-slate-200 hover:text-white"
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span className="hidden sm:inline">Cần cập nhật</span>
              <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {needsUpdateCounts.all}
              </span>
            </button>
          )}

          {/* Base Map Switcher */}
          <div className="glass-pill rounded-xl p-1 flex items-center gap-1 border border-slate-700/80">
            <button
              type="button"
              onClick={() => setActiveBaseMap("voyager")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                activeBaseMap === "voyager" ? "bg-cyan-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Chuẩn
            </button>
            <button
              type="button"
              onClick={() => setActiveBaseMap("light")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                activeBaseMap === "light" ? "bg-cyan-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Tối giản
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="glass-pill p-2 rounded-xl text-slate-300 hover:text-white active:scale-95 transition hidden sm:flex"
            title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Bottom Floating Operations HUD / KPI Bar */}
      <footer className="absolute bottom-3 left-3 right-3 z-[1000] pointer-events-none flex items-center justify-between gap-3">
        {/* Left: Quick Counts HUD */}
        <div className="glass-panel px-3.5 py-2 rounded-2xl flex items-center gap-3 sm:gap-4 pointer-events-auto border border-cyan-500/20 text-xs text-slate-200 overflow-x-auto shadow-2xl">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-red-400" />
            <span className="text-slate-400">Đối tượng:</span>
            <b className="font-mono text-white text-xs">{filteredSubjects.length}</b>
          </div>
          <div className="w-[1px] h-3.5 bg-slate-700"></div>
          <div className="flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Nhà trọ:</span>
            <b className="font-mono text-white text-xs">{filteredRentals.length}</b>
          </div>
          <div className="w-[1px] h-3.5 bg-slate-700 hidden sm:block"></div>
          <div className="items-center gap-1.5 hidden sm:flex">
            <Store className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-slate-400">CSKD:</span>
            <b className="font-mono text-white text-xs">{filteredBusinesses.length}</b>
          </div>
          <div className="w-[1px] h-3.5 bg-slate-700"></div>
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">TDP:</span>
            <b className="font-mono text-white text-xs">{tdps.length}</b>
          </div>
        </div>

        {/* Right: Data Quality Score Progress */}
        {!isGuest && (
          <div className="glass-panel px-3.5 py-2 rounded-2xl hidden md:flex items-center gap-3 pointer-events-auto border border-cyan-500/20 text-xs shadow-2xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400 text-[11px]">Độ sạch dữ liệu:</span>
              <b className="font-mono text-emerald-400 font-bold">{dataQualityScore}%</b>
            </div>
            <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${dataQualityScore}%` }}
              ></div>
            </div>
          </div>
        )}
      </footer>

      {/* Layer Controls Dropdown/Panel */}
      {isLegendOpen && (
        <div className="absolute top-16 right-3 z-[1001] glass-panel p-4 rounded-2xl w-80 max-w-[92vw] text-slate-100 border border-cyan-500/30 animate-in fade-in slide-in-from-top-2 duration-200 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-white">Lớp bản đồ</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsLegendOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {/* 1. 27 TDP */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/30 cursor-pointer transition">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={visibleLayers.tdps}
                  onChange={(e) => setVisibleLayers((p) => ({ ...p, tdps: e.target.checked }))}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <div className="w-3 h-3 rounded bg-blue-500 border border-white"></div>
                <span className="font-medium text-slate-200">Ranh giới 27 TDP</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md font-mono">
                {tdps.length} tổ
              </span>
            </label>

            {/* 2. Subjects */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/30 cursor-pointer transition">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={visibleLayers.subjects}
                  onChange={(e) => setVisibleLayers((p) => ({ ...p, subjects: e.target.checked }))}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <div className="w-3 h-3 rounded-full bg-red-500 border border-white"></div>
                <span className="font-medium text-slate-200">Đối tượng ma túy</span>
              </div>
              <span className="text-[10px] font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded-md border border-red-900/40 font-mono">
                {filteredSubjects.length}
              </span>
            </label>

            {/* 3. Rentals */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/30 cursor-pointer transition">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={visibleLayers.rentals}
                  onChange={(e) => setVisibleLayers((p) => ({ ...p, rentals: e.target.checked }))}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <div className="w-3 h-3 rounded bg-cyan-500 border border-white"></div>
                <span className="font-medium text-slate-200">Nhà trọ / Lưu trú</span>
              </div>
              <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-900/40 font-mono">
                {filteredRentals.length}
              </span>
            </label>

            {/* 4. Businesses */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/30 cursor-pointer transition">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={visibleLayers.businesses}
                  onChange={(e) => setVisibleLayers((p) => ({ ...p, businesses: e.target.checked }))}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <div className="w-3 h-3 rounded bg-rose-500 border border-white"></div>
                <span className="font-medium text-slate-200">CSKD có điều kiện</span>
              </div>
              <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-900/40 font-mono">
                {filteredBusinesses.length}
              </span>
            </label>

            {/* 5. Custom Zones & Patrols */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/30 cursor-pointer transition">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={visibleLayers.zones}
                  onChange={(e) => setVisibleLayers((p) => ({ ...p, zones: e.target.checked }))}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <div className="w-3 h-3 rounded bg-purple-500 border border-white"></div>
                <span className="font-medium text-slate-200">Vùng ANTT / Tuần tra</span>
              </div>
              <span className="text-[10px] font-bold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-900/40 font-mono">
                {customZones.length}
              </span>
            </label>

            {/* 6. Giaothong */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/30 cursor-pointer transition">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={visibleLayers.giaothong}
                  onChange={(e) => setVisibleLayers((p) => ({ ...p, giaothong: e.target.checked }))}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <div className="w-3 h-3 rounded bg-amber-500 border border-white"></div>
                <span className="font-medium text-slate-200">Lớp Giao thông</span>
              </div>
              <span className="text-[10px] text-slate-400">GeoJSON</span>
            </label>
          </div>

          {/* Legend Summary */}
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <p className="font-bold text-slate-300">Màu sắc đối tượng:</p>
            <div className="grid grid-cols-2 gap-1.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600"></span> Nghiện
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-600"></span> Sử dụng
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Sau cai
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-600"></span> Khởi tố
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bottom Sheet / Side Panel */}
      {isFilterOpen && (
        <div className="absolute top-16 left-3 z-[1001] glass-panel p-5 rounded-2xl w-96 max-w-[94vw] text-slate-100 border border-cyan-500/30 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-white">Bộ lọc nghiệp vụ</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsFilterOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Search Input */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Tìm kiếm nhanh</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tên, địa chỉ, số nhà, TDP..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 outline-none"
                />
              </div>
            </div>

            {/* TDP Filter */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Tổ dân phố (27 tổ mới)</label>
              <select
                value={tdpFilter}
                onChange={(e) => setTdpFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-400 outline-none"
              >
                <option value="">-- Tất cả 27 Tổ dân phố --</option>
                {tdps.map((t) => (
                  <option key={t._id?.toString()} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* CSKV Filter */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Cảnh sát khu vực</label>
              <select
                value={cskvFilter}
                onChange={(e) => setCskvFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-400 outline-none"
              >
                <option value="">-- Tất cả CSKV --</option>
                {cskvList.map((officer) => (
                  <option key={officer} value={officer}>
                    {officer}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Status Filter */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Tình trạng đối tượng</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:border-cyan-400 outline-none"
                >
                  <option value="">Tất cả</option>
                  <option value="Nghiện">Nghiện</option>
                  <option value="Sử dụng">Sử dụng</option>
                  <option value="Sau cai">Sau cai</option>
                  <option value="Khởi tố">Khởi tố</option>
                  <option value="Thanh loại">Thanh loại</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Trạng thái duyệt</label>
                <select
                  value={approvalFilter}
                  onChange={(e) => setApprovalFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:border-cyan-400 outline-none"
                >
                  <option value="">Tất cả</option>
                  <option value="Approved">Đã duyệt</option>
                  <option value="Pending">Chờ duyệt</option>
                  <option value="NeedsUpdate">Cần cập nhật lại</option>
                </select>
              </div>
            </div>

            {/* Risk & Recency Filter */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Mức nguy cơ</label>
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:border-cyan-400 outline-none"
                >
                  <option value="">Tất cả mức</option>
                  <option value="Thấp">Thấp</option>
                  <option value="Trung bình">Trung bình</option>
                  <option value="Cao">Cao</option>
                  <option value="Rất cao">Rất cao</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Thời gian cập nhật</label>
                <select
                  value={recencyFilter}
                  onChange={(e) => setRecencyFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:border-cyan-400 outline-none"
                >
                  <option value="">Tất cả</option>
                  <option value="7d">Trong 7 ngày</option>
                  <option value="30d">Trong 30 ngày</option>
                  <option value="90d">Trong 90 ngày</option>
                  <option value="outdated">Lâu chưa cập nhật (&gt;60 ngày)</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Xóa bộ lọc
              </button>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 shadow"
              >
                Áp dụng ({filteredSubjects.length} kết quả)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "Dữ liệu cần cập nhật" Panel / Drawer (with css-alpha-masking) */}
      {isNeedsUpdateOpen && !isGuest && (
        <aside className="absolute top-16 right-3 bottom-14 z-[1002] glass-panel p-4 sm:p-5 rounded-2xl w-96 max-w-[94vw] flex flex-col text-slate-100 border border-rose-500/30 shadow-2xl animate-in fade-in slide-in-from-right-4 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400 animate-pulse" />
              <div>
                <h3 className="font-bold text-sm text-white">Dữ liệu cần cập nhật</h3>
                <p className="text-[11px] text-slate-400">
                  {isAdminOrLeader ? "Toàn phường" : `CSKV phụ trách (${currentUser?.username})`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsNeedsUpdateOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Group Count Chips / Tabs */}
          <div className="grid grid-cols-3 gap-1.5 mb-3 text-[10px]">
            <button
              type="button"
              onClick={() => setNeedsUpdateTab("all")}
              className={`p-1.5 rounded-lg font-bold border transition ${
                needsUpdateTab === "all"
                  ? "bg-rose-600 border-rose-400 text-white"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              Tất cả ({needsUpdateCounts.all})
            </button>
            <button
              type="button"
              onClick={() => setNeedsUpdateTab("no_coords")}
              className={`p-1.5 rounded-lg font-bold border transition ${
                needsUpdateTab === "no_coords"
                  ? "bg-rose-600 border-rose-400 text-white"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              Thiếu tọa độ ({needsUpdateCounts.no_coords})
            </button>
            <button
              type="button"
              onClick={() => setNeedsUpdateTab("no_house_image")}
              className={`p-1.5 rounded-lg font-bold border transition ${
                needsUpdateTab === "no_house_image"
                  ? "bg-rose-600 border-rose-400 text-white"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              Thiếu ảnh nhà ({needsUpdateCounts.no_house_image})
            </button>
            <button
              type="button"
              onClick={() => setNeedsUpdateTab("missing_address")}
              className={`p-1.5 rounded-lg font-bold border transition ${
                needsUpdateTab === "missing_address"
                  ? "bg-rose-600 border-rose-400 text-white"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              Thiếu ĐC/TDP ({needsUpdateCounts.missing_address})
            </button>
            <button
              type="button"
              onClick={() => setNeedsUpdateTab("pending")}
              className={`p-1.5 rounded-lg font-bold border transition ${
                needsUpdateTab === "pending"
                  ? "bg-amber-600 border-amber-400 text-white"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              Chờ duyệt ({needsUpdateCounts.pending})
            </button>
            <button
              type="button"
              onClick={() => setNeedsUpdateTab("outdated")}
              className={`p-1.5 rounded-lg font-bold border transition ${
                needsUpdateTab === "outdated"
                  ? "bg-amber-600 border-amber-400 text-white"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              Lâu chưa cập nhật ({needsUpdateCounts.outdated})
            </button>
          </div>

          {/* Scrollable List with CSS Alpha Masking */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 mask-vertical-fade">
            {filteredNeedsUpdateList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic">
                ✓ Không có hồ sơ nào trong nhóm này cần cập nhật.
              </div>
            ) : (
              filteredNeedsUpdateList.map(({ subject, issues }) => (
                <div
                  key={subject._id?.toString()}
                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <b className="text-white text-sm block">{subject.full_name}</b>
                      <span className="text-[11px] text-slate-400">
                        {subject.tdp || "Chưa có TDP"} • {subject.status || "Chưa rõ"}
                      </span>
                    </div>
                    {subject.risk_level && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        (subject.risk_level as string) === 'Cao' || (subject.risk_level as string) === 'red' ? 'bg-red-950 text-red-400 border border-red-800' :
                        (subject.risk_level as string) === 'Trung bình' || (subject.risk_level as string) === 'yellow' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                        'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}>
                        {subject.risk_level === 'red' ? 'Nguy cơ cao' : subject.risk_level === 'yellow' ? 'Trung bình' : subject.risk_level === 'green' ? 'Bình thường' : subject.risk_level}
                      </span>
                    )}
                  </div>

                  {/* Issues badges */}
                  <div className="flex flex-wrap gap-1">
                    {issues.includes("no_coords") && (
                      <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 text-[10px] font-semibold flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" /> Chưa có tọa độ
                      </span>
                    )}
                    {issues.includes("no_house_image") && (
                      <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 text-[10px] font-semibold flex items-center gap-1">
                        <Home className="w-2.5 h-2.5" /> Chưa có ảnh nhà
                      </span>
                    )}
                    {issues.includes("missing_address") && (
                      <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 text-[10px] font-semibold">
                        Thiếu địa chỉ/TDP
                      </span>
                    )}
                    {issues.includes("pending") && (
                      <span className="px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800 text-[10px] font-semibold">
                        Chờ phê duyệt
                      </span>
                    )}
                    {issues.includes("outdated") && (
                      <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800 text-[10px] font-semibold flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> &gt;60 ngày chưa cập nhật
                      </span>
                    )}
                  </div>

                  {/* Actions for this item */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPickingEntity({
                          type: "subject",
                          id: subject._id!.toString(),
                          name: subject.full_name,
                          initialLat: subject.lat,
                          initialLng: subject.lng,
                        })
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-600/90 hover:bg-cyan-500 active:scale-95 text-white text-[11px] font-bold flex items-center gap-1 shadow"
                    >
                      <MapPin className="w-3 h-3" /> Chọn vị trí trên bản đồ
                    </button>

                    <Link
                      href={`/subjects?search=${encodeURIComponent(subject.full_name)}`}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Mở hồ sơ
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      )}

      {/* Main Leaflet Map Container */}
      <div className="w-full h-full">
        <MapContainer
          center={LIEN_CHIEU_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution={BASE_MAPS[activeBaseMap].attribution}
            url={BASE_MAPS[activeBaseMap].url}
            subdomains={BASE_MAPS[activeBaseMap].subdomains}
            maxZoom={19}
          />
          <MapController onMapReady={(m) => { mapRef.current = m; setMapInstance(m); }} />

          {/* 1. TDP Layer (Polygons & Boundaries) */}
          {visibleLayers.tdps &&
            tdps.filter((t) => t.geojson).map((tdp: any) => (
              <GeoJSON
                key={tdp._id?.toString() + "-tdp"}
                data={tdp.geojson}
                interactive={true}
                style={{
                  color: tdp.color || (tdp.risk_status === 'red' ? '#dc2626' : tdp.risk_status === 'yellow' ? '#d97706' : '#16a34a'),
                  weight: 2,
                  fillOpacity: 0.16,
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[220px] text-xs text-slate-900 font-sans">
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5 mb-2">
                      <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: tdp.color || '#0284c7' }}></div>
                      <b className="text-sm text-slate-900 font-bold">{tdp.name}</b>
                    </div>
                    <div className="space-y-1 text-slate-700">
                      <p><b>Số hộ:</b> {tdp.households ? tdp.households.toLocaleString() : "—"}</p>
                      <p><b>Nhân khẩu:</b> {tdp.population ? tdp.population.toLocaleString() : "—"}</p>
                      <p><b>Diện tích:</b> {tdp.area_sqm ? (tdp.area_sqm / 10000).toFixed(2) + " ha" : "—"}</p>
                      {tdp.secretary_name && (
                        <p><b>Bí thư Chi bộ:</b> {tdp.secretary_name} {!isGuest && tdp.secretary_phone ? `(${tdp.secretary_phone})` : ""}</p>
                      )}
                      {tdp.leader_name && (
                        <p><b>Tổ trưởng:</b> {tdp.leader_name} {!isGuest && tdp.leader_phone ? `(${tdp.leader_phone})` : ""}</p>
                      )}
                      {tdp.police_name && (
                        <p><b>CSKV phụ trách:</b> {tdp.police_name} {!isGuest && tdp.police_phone ? `(${tdp.police_phone})` : ""}</p>
                      )}
                      <p><b>Phân loại ANTT:</b> 
                        <span className={`ml-1.5 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          tdp.risk_status === 'red' ? 'bg-red-100 text-red-700' :
                          tdp.risk_status === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {tdp.risk_status === 'red' ? 'Vùng Đỏ' : tdp.risk_status === 'yellow' ? 'Vùng Vàng' : 'Vùng Xanh'}
                        </span>
                      </p>
                    </div>
                  </div>
                </Popup>
              </GeoJSON>
            ))}

          {/* 2. Custom Zones (ANTT points, patrol lines, polygons) */}
          {visibleLayers.zones &&
            customZones.map((zone: any) => (
              <GeoJSON
                key={zone._id?.toString() + "-zone"}
                data={zone.geojson}
                interactive={true}
                style={{
                  color: zone.color || "#8b5cf6",
                  weight: 2.5,
                  fillOpacity: 0.25,
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[200px] text-xs font-sans">
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-1 mb-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: zone.color || '#8b5cf6' }}></div>
                      <b className="text-slate-900">{zone.name}</b>
                    </div>
                    <p className="text-slate-600">Loại vùng: <b>{zone.type || "Khu vực ANTT"}</b></p>
                  </div>
                </Popup>
              </GeoJSON>
            ))}

          {/* 3. Subjects Layer with Clustering */}
          {visibleLayers.subjects && (
            <MarkerClusterGroup chunkedLoading maxClusterRadius={45}>
              {filteredSubjects
                .filter((s) => s.lat && s.lng && s.lat !== 0 && s.lng !== 0)
                .map((s) => (
                  <Marker
                    key={s._id?.toString() + "-sub"}
                    position={[s.lat!, s.lng!]}
                    icon={createSubjectMarkerIcon(s)}
                  >
                    <Popup>
                      <div className="p-1 min-w-[240px] max-w-[280px] text-xs font-sans text-slate-800">
                        {/* House Image Preview if available */}
                        {s.house_image_url && (
                          <div className="mb-2 rounded-lg overflow-hidden border border-slate-200 h-28 bg-slate-100 relative">
                            <img
                              src={s.house_image_url}
                              alt="Ảnh thực tế nhà ở"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur">
                              Ảnh nhà ở
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                          <b className="text-sm font-bold text-slate-900">{s.full_name}</b>
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: statusColors[s.status || ""] || "#64748b" }}
                          >
                            {s.status}
                          </span>
                        </div>

                        <div className="space-y-1 text-slate-600">
                          {s.alias && <p><b>Tên gọi khác:</b> {s.alias}</p>}
                          <p><b>TDP cư trú:</b> {s.tdp || "Chưa cập nhật"}</p>
                          <p>
                            <b>Địa chỉ:</b> {s.address_current || s.address_permanent || "Chưa có địa chỉ"}
                          </p>
                          <p>
                            <b>Tọa độ:</b>{" "}
                            <span className="font-mono text-[10px] text-slate-900 bg-slate-100 px-1 py-0.5 rounded">
                              {s.lat!.toFixed(6)}, {s.lng!.toFixed(6)}
                            </span>
                          </p>
                          {!isGuest && (
                            <>
                              {s.id_card && <p><b>CCCD:</b> {s.id_card}</p>}
                              {s.risk_level && <p><b>Mức nguy cơ:</b> {s.risk_level}</p>}
                            </>
                          )}
                        </div>

                        {/* Popup Action Buttons */}
                        {!isGuest && (
                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setPickingEntity({
                                  type: "subject",
                                  id: s._id!.toString(),
                                  name: s.full_name,
                                  initialLat: s.lat,
                                  initialLng: s.lng,
                                })
                              }
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-[10px] font-bold flex items-center gap-1 transition"
                            >
                              <Edit3 className="w-3 h-3 text-cyan-600" /> Chọn lại vị trí
                            </button>

                            <Link
                              href={`/subjects?search=${encodeURIComponent(s.full_name)}`}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-[10px] font-bold flex items-center gap-1 transition shadow-sm"
                            >
                              <ExternalLink className="w-3 h-3" /> Mở hồ sơ
                            </Link>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
            </MarkerClusterGroup>
          )}

          {/* 4. Rentals Layer with Clustering */}
          {visibleLayers.rentals && (
            <MarkerClusterGroup chunkedLoading maxClusterRadius={45}>
              {filteredRentals
                .filter((r) => r.lat && r.lng && r.lat !== 0 && r.lng !== 0)
                .map((r) => (
                  <Marker
                    key={r._id?.toString() + "-rental"}
                    position={[r.lat!, r.lng!]}
                    icon={createRentalMarkerIcon(r)}
                  >
                    <Popup>
                      <div className="p-1 min-w-[220px] text-xs font-sans text-slate-800">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                          <b className="text-sm font-bold text-slate-900">{r.name}</b>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800">
                            Nhà trọ
                          </span>
                        </div>

                        <div className="space-y-1 text-slate-600">
                          <p><b>Chủ nhà trọ:</b> {!isGuest ? (r.owner_name || "—") : "***"}</p>
                          {!isGuest && r.owner_phone && <p><b>SĐT:</b> {r.owner_phone}</p>}
                          <p><b>Địa chỉ:</b> {r.address || "Chưa rõ"} ({r.tdp || "Chưa có TDP"})</p>
                          <p><b>Tổng số phòng:</b> {r.total_rooms || 0} phòng</p>
                          <p><b>Số người đang ở:</b> {r.current_tenants || 0} người</p>
                          <p><b>Đánh giá ANTT:</b> {r.security_assessment === "safe" ? "An toàn" : r.security_assessment === "complex" ? "Phức tạp" : "Chưa đánh giá"}</p>
                        </div>

                        {!isGuest && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() =>
                                setPickingEntity({
                                  type: "rental",
                                  id: r._id!.toString(),
                                  name: r.name,
                                  initialLat: r.lat,
                                  initialLng: r.lng,
                                })
                              }
                              className="w-full py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-[10px] font-bold flex items-center justify-center gap-1 transition"
                            >
                              <Edit3 className="w-3 h-3 text-cyan-600" /> Chọn lại vị trí trên bản đồ
                            </button>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
            </MarkerClusterGroup>
          )}

          {/* 5. Conditional Businesses Layer with Clustering */}
          {visibleLayers.businesses && (
            <MarkerClusterGroup chunkedLoading maxClusterRadius={45}>
              {filteredBusinesses
                .filter((b) => b.lat && b.lng && b.lat !== 0 && b.lng !== 0)
                .map((b) => (
                  <Marker
                    key={b._id?.toString() + "-biz"}
                    position={[b.lat!, b.lng!]}
                    icon={createBusinessMarkerIcon(b)}
                  >
                    <Popup>
                      <div className="p-1 min-w-[220px] text-xs font-sans text-slate-800">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                          <b className="text-sm font-bold text-slate-900">{b.business_name}</b>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            {b.business_type}
                          </span>
                        </div>

                        <div className="space-y-1 text-slate-600">
                          <p><b>Chủ cơ sở:</b> {!isGuest ? (b.owner_name || "—") : "***"}</p>
                          <p><b>Địa chỉ:</b> {b.address || "Chưa rõ"} ({b.tdp || "Chưa có TDP"})</p>
                          {b.security_license_no && <p><b>Giấy phép ANTT:</b> {b.security_license_no}</p>}
                          <p><b>Số nhân viên:</b> {b.employees_count || 0}</p>
                          <p><b>Trạng thái duyệt:</b> {b.approval_status || "Pending"}</p>
                        </div>

                        {!isGuest && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() =>
                                setPickingEntity({
                                  type: "business",
                                  id: b._id!.toString(),
                                  name: b.business_name,
                                  initialLat: b.lat,
                                  initialLng: b.lng,
                                })
                              }
                              className="w-full py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-[10px] font-bold flex items-center justify-center gap-1 transition"
                            >
                              <Edit3 className="w-3 h-3 text-rose-600" /> Chọn lại vị trí trên bản đồ
                            </button>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
            </MarkerClusterGroup>
          )}

          {/* 6. Giaothong Layer */}
          {visibleLayers.giaothong && giaothongData && (
            <GeoJSON
              key="giaothong-layer-geojson"
              data={giaothongData}
              interactive={false}
              style={{
                color: "#f59e0b",
                weight: 3,
                opacity: 0.75,
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* MapPicker Modal when selecting/updating coordinates */}
      {pickingEntity && (
        <MapPicker
          initialLat={pickingEntity.initialLat}
          initialLng={pickingEntity.initialLng}
          title={`Chọn vị trí: ${pickingEntity.name}`}
          subtitle="Click vào bản đồ hoặc kéo marker để định vị chính xác"
          onSelect={handleCoordinatePicked}
          onClose={() => setPickingEntity(null)}
        />
      )}
    </div>
  );
}