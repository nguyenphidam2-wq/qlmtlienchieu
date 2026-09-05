"use client";

import { useEffect, useState } from "react";
import { getTDPs, createTDP, updateTDP, deleteTDP, importTDPData } from "@/lib/actions/tdp";
import { getCurrentUserInfo } from "@/lib/actions/subjects";
import { ITDP } from "@/lib/models/TDP";
import { 
  Search, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Edit, 
  X, 
  Trash2, 
  PenTool, 
  Download, 
  Upload, 
  Info, 
  Phone, 
  Shield, 
  UserCheck, 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  Eye, 
  Users, 
  Hash, 
  Maximize2, 
  Minimize2,
  ExternalLink,
  Layers
} from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";

export default function TDPPage() {
  const [tdps, setTdps] = useState<ITDP[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<"all" | "green" | "yellow" | "red">("all");
  const [geoFilter, setGeoFilter] = useState<"all" | "geocoded" | "not_geocoded">("all");
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; role: string } | null>(null);
  const canClassify = currentUser?.role === "admin" || currentUser?.role === "leader";
  
  // Collapsible state: Set of expanded TDP IDs
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form data state
  const [formData, setFormData] = useState({
    name: "",
    households: 0,
    population: 0,
    secretary_name: "",
    secretary_phone: "",
    deputy_secretary_name: "",
    deputy_secretary_phone: "",
    party_members_count: 0,
    regulation_213_count: 0,
    front_head_name: "",
    front_head_phone: "",
    deputy_tdp_leader_name: "",
    deputy_tdp_leader_phone: "",
    security_leader_name: "",
    security_leader_phone: "",
    leader_name: "",
    leader_phone: "",
    police_name: "",
    police_phone: "",
    boundary_info: "",
    risk_status: "green" as "green" | "yellow" | "red", // Locked
    color: "#00e676" // Locked
  });

  useEffect(() => {
    fetchTDPs();
    getCurrentUserInfo().then(setCurrentUser).catch(() => setCurrentUser(null));
  }, []);

  const fetchTDPs = async () => {
    try {
      const data = await getTDPs();
      setTdps(data as any);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(tdps.map(t => String(t._id))));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      name: "",
      households: 0,
      population: 0,
      secretary_name: "",
      secretary_phone: "",
      deputy_secretary_name: "",
      deputy_secretary_phone: "",
      party_members_count: 0,
      regulation_213_count: 0,
      front_head_name: "",
      front_head_phone: "",
      deputy_tdp_leader_name: "",
      deputy_tdp_leader_phone: "",
      security_leader_name: "",
      security_leader_phone: "",
      leader_name: "",
      leader_phone: "",
      police_name: "",
      police_phone: "",
      boundary_info: "",
      risk_status: "green",
      color: "#00e676"
    });
    setIsModalOpen(true);
  };

  const openEditModal = (tdp: ITDP) => {
    setEditingId(String(tdp._id));
    setFormData({
      name: tdp.name || "",
      households: tdp.households || 0,
      population: tdp.population || 0,
      secretary_name: tdp.secretary_name || "",
      secretary_phone: tdp.secretary_phone || "",
      deputy_secretary_name: tdp.party_cell?.deputy_secretary?.full_name || "",
      deputy_secretary_phone: tdp.party_cell?.deputy_secretary?.phone || "",
      party_members_count: tdp.party_cell?.party_members_count || 0,
      regulation_213_count: tdp.party_cell?.regulation_213_count || 0,
      front_head_name: tdp.front_and_organizations?.front_head?.full_name || "",
      front_head_phone: tdp.front_and_organizations?.front_head?.phone || "",
      deputy_tdp_leader_name: tdp.front_and_organizations?.deputy_tdp_leader?.full_name || "",
      deputy_tdp_leader_phone: tdp.front_and_organizations?.deputy_tdp_leader?.phone || "",
      security_leader_name: tdp.local_security_force?.leader?.full_name || "",
      security_leader_phone: tdp.local_security_force?.leader?.phone || "",
      leader_name: tdp.leader_name || "",
      leader_phone: tdp.leader_phone || "",
      police_name: tdp.police_name || "",
      police_phone: tdp.police_phone || "",
      boundary_info: tdp.boundary_info || "",
      risk_status: tdp.risk_status || "green",
      color: tdp.color || "#00e676"
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa Tổ dân phố này?")) return;
    try {
      await deleteTDP(id);
      await fetchTDPs();
    } catch (error) {
      console.error(error);
      alert("Lỗi khi xóa Tổ dân phố");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert("Vui lòng nhập tên Tổ dân phố");
    
    setSaving(true);
    try {
      if (editingId) {
        await updateTDP(editingId, buildTDPPayload());
      } else {
        await createTDP(buildTDPPayload());
      }
      await fetchTDPs();
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("Lỗi khi lưu Tổ dân phố");
    } finally {
      setSaving(false);
    }
  };

  const buildTDPPayload = () => ({
    ...formData,
    party_cell: {
      secretary: { full_name: formData.secretary_name, phone: formData.secretary_phone, position: "Bí thư Chi bộ" },
      deputy_secretary: { full_name: formData.deputy_secretary_name, phone: formData.deputy_secretary_phone, position: "Phó Bí thư Chi bộ" },
      party_members_count: formData.party_members_count,
      regulation_213_count: formData.regulation_213_count,
    },
    front_and_organizations: {
      front_head: { full_name: formData.front_head_name, phone: formData.front_head_phone, position: "Trưởng ban Công tác Mặt trận" },
      deputy_tdp_leader: { full_name: formData.deputy_tdp_leader_name, phone: formData.deputy_tdp_leader_phone, position: "Phó Tổ trưởng TDP" },
    },
    local_security_force: {
      leader: { full_name: formData.security_leader_name, phone: formData.security_leader_phone, position: "Tổ trưởng bảo vệ ANTT" },
    },
  });

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws);

        const normalizedData = rawData.map(row => ({
          name: row.name || row["Tên Tổ"] || row["Tổ dân phố"] || row["TDP"] || "",
          households: Number(row.households || row["Số hộ"] || 0),
          population: Number(row.population || row["Nhân khẩu"] || row["Số nhân khẩu"] || 0),
          secretary_name: row.secretary_name || row["Bí thư"] || row["Tên bí thư"] || row["Bí thư chi bộ"] || "",
          secretary_phone: row.secretary_phone || row["SĐT Bí thư"] || row["Điện thoại bí thư"] || row["Số điện thoại bí thư"] || "",
          leader_name: row.leader_name || row["Tổ trưởng"] || row["Tên tổ trưởng"] || "",
          leader_phone: row.leader_phone || row["SĐT Tổ trưởng"] || row["Số điện thoại tổ trưởng"] || "",
          police_name: row.police_name || row["CSKV"] || row["Cảnh sát khu vực"] || "",
          police_phone: row.police_phone || row["SĐT CSKV"] || row["Số điện thoại CSKV"] || "",
          boundary_info: row.boundary_info || row["Ghi chú"] || row["Mô tả"] || "",
          risk_status: ["green", "yellow", "red"].includes(row.risk_status) ? row.risk_status : "green",
          color: row.color || (row.risk_status === "red" ? "#ff5252" : row.risk_status === "yellow" ? "#ffb300" : "#00e676"),
          geojson: row.geojson ? (typeof row.geojson === "string" ? JSON.parse(row.geojson) : row.geojson) : { type: "FeatureCollection", features: [] }
        })).filter(r => Boolean(r.name));

        const result = await importTDPData(normalizedData);
        
        alert(result.message);
        if (result.success) {
          await fetchTDPs();
          setIsImportModalOpen(false);
        }
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error(error);
      alert("Lỗi khi xử lý file Excel");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  // Filtered TDP list
  const filteredTDPs = tdps.filter(t => {
    const matchesSearch = 
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.secretary_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.leader_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.police_name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesRisk = riskFilter === "all" || t.risk_status === riskFilter;
    
    const hasGeo = t.geojson && t.geojson.features && t.geojson.features.length > 0;
    const matchesGeo = 
      geoFilter === "all" ||
      (geoFilter === "geocoded" && hasGeo) ||
      (geoFilter === "not_geocoded" && !hasGeo);

    return matchesSearch && matchesRisk && matchesGeo;
  });

  // Calculate quick metrics
  const totalHouseholds = tdps.reduce((sum, t) => sum + (t.households || 0), 0);
  const totalPopulation = tdps.reduce((sum, t) => sum + (t.population || 0), 0);
  const geocodedCount = tdps.filter(t => t.geojson?.features?.length > 0).length;

  return (
    <main className="framed-grid">
      {/* 1. Header Frame */}
      <section className="frame frame-brackets span-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--fg-line)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2 h-2 bg-blue-600 rounded-none"></span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">
                HỆ THỐNG GIÁM SÁT ĐỊA CHÍNH • PHƯỜNG LIÊN CHIỂU
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5 uppercase font-mono">
              <MapPin className="w-6 h-6 text-blue-600 shrink-0" />
              <span>Danh sách tổ dân phố</span>
            </h1>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <a 
              href="/Mau_Nhap_Lieu_TDP.xlsx"
              download="Mau_Nhap_Lieu_TDP.xlsx"
              className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs font-mono font-bold border border-[var(--fg-line)] transition-all flex items-center gap-1.5 shadow-sm"
              title="Tải mẫu Excel chuẩn"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" /> TẢI MẪU EXCEL
            </a>
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" /> NHẬP EXCEL
            </button>
            <button 
              onClick={openAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> THÊM TỔ MỚI
            </button>
          </div>
        </div>

        {/* Technical Metric Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="border border-[var(--fg-line)] p-3 bg-white/50 dark:bg-slate-800/40">
            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">TỔ DÂN PHỐ CHUẨN HÓA</div>
            <div className="text-xl font-mono font-black text-slate-900 dark:text-white">
              {tdps.length} <span className="text-xs font-normal text-slate-500">Đơn vị</span>
            </div>
          </div>
          <div className="border border-[var(--fg-line)] p-3 bg-white/50 dark:bg-slate-800/40">
            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">TỔNG SỐ HỘ DÂN</div>
            <div className="text-xl font-mono font-black text-slate-900 dark:text-white">
              {totalHouseholds.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">Hộ</span>
            </div>
          </div>
          <div className="border border-[var(--fg-line)] p-3 bg-white/50 dark:bg-slate-800/40">
            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">TỔNG SỐ NHÂN KHẨU</div>
            <div className="text-xl font-mono font-black text-blue-600 dark:text-blue-400">
              {totalPopulation.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">Người</span>
            </div>
          </div>
          <div className="border border-[var(--fg-line)] p-3 bg-white/50 dark:bg-slate-800/40">
            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">ĐỊNH VỊ RANH GIỚI GIS</div>
            <div className="text-xl font-mono font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              <span>{geocodedCount} / {tdps.length}</span>
              <span className="text-[11px] font-bold px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
                {tdps.length > 0 ? `${Math.round((geocodedCount / tdps.length) * 100)}%` : "0%"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Filter & Toolbar Frame */}
      <section className="frame frame-brackets span-12">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Tìm theo tên tổ, bí thư, tổ trưởng, CSKV..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-[var(--fg-line)] text-xs font-mono focus:outline-none focus:border-blue-600 transition-colors"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Risk filter */}
            <div className="flex items-center border border-[var(--fg-line)] text-xs font-mono">
              <button
                onClick={() => setRiskFilter("all")}
                className={`px-2.5 py-1.5 ${riskFilter === "all" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              >
                TẤT CẢ VÙNG
              </button>
              <button
                onClick={() => setRiskFilter("green")}
                className={`px-2 py-1.5 border-l border-[var(--fg-line)] ${riskFilter === "green" ? "bg-emerald-600 text-white font-bold" : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800"}`}
                title="Vùng Xanh"
              >
                XANH
              </button>
              <button
                onClick={() => setRiskFilter("yellow")}
                className={`px-2 py-1.5 border-l border-[var(--fg-line)] ${riskFilter === "yellow" ? "bg-amber-500 text-white font-bold" : "text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800"}`}
                title="Vùng Vàng"
              >
                VÀNG
              </button>
              <button
                onClick={() => setRiskFilter("red")}
                className={`px-2 py-1.5 border-l border-[var(--fg-line)] ${riskFilter === "red" ? "bg-red-600 text-white font-bold" : "text-red-600 hover:bg-red-50 dark:hover:bg-slate-800"}`}
                title="Vùng Đỏ"
              >
                ĐỎ
              </button>
            </div>

            {/* Expand / Collapse all controls */}
            <div className="flex items-center gap-1 border border-[var(--fg-line)] p-0.5 bg-white dark:bg-slate-800">
              <button 
                onClick={expandAll}
                className="px-2 py-1 text-[11px] font-mono text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1"
                title="Mở rộng tất cả chi tiết"
              >
                <Maximize2 className="w-3 h-3" /> MỞ TẤT CẢ
              </button>
              <div className="w-px h-3 bg-[var(--fg-line)]"></div>
              <button 
                onClick={collapseAll}
                className="px-2 py-1 text-[11px] font-mono text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1"
                title="Thu gọn danh sách"
              >
                <Minimize2 className="w-3 h-3" /> THU GỌN
              </button>
            </div>

            <button 
              onClick={() => setIsInfoModalOpen(true)}
              className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-mono font-bold border border-blue-200 dark:border-blue-900 hover:bg-blue-100 transition-all flex items-center gap-1.5"
            >
              <Info className="w-3.5 h-3.5" /> HƯỚNG DẪN GIS
            </button>
          </div>
        </div>
      </section>

      {/* 3. Main Framed Table Section */}
      <section className="frame frame-brackets span-12 !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap font-sans">
            <thead className="bg-slate-100/90 dark:bg-slate-800/90 border-b border-[var(--fg-line)] text-slate-700 dark:text-slate-300 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 w-12 text-center">#</th>
                <th className="px-4 py-3">TÊN TỔ DÂN PHỐ</th>
                <th className="px-4 py-3 text-center">PHÂN LOẠI VÙNG (CỐ ĐỊNH 🔒)</th>
                <th className="px-4 py-3 text-center">SỐ HỘ / NHÂN KHẨU</th>
                <th className="px-4 py-3 text-center">ĐỊNH VỊ GIS</th>
                <th className="px-4 py-3 text-right">THAO TÁC NGHIỆP VỤ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--fg-line)]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent animate-spin"></div>
                      <span className="font-mono text-xs">Đang tải cơ sở dữ liệu Tổ dân phố...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTDPs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-mono text-xs">
                    Không tìm thấy Tổ dân phố nào phù hợp điều kiện lọc.
                  </td>
                </tr>
              ) : (
                filteredTDPs.map((tdp, idx) => {
                  const tdpId = String(tdp._id);
                  const isExpanded = expandedIds.has(tdpId);
                  const hasGeojson = tdp.geojson && tdp.geojson.features && tdp.geojson.features.length > 0;

                  return (
                    <tr 
                      key={tdpId} 
                      className={`transition-colors group ${isExpanded ? "bg-blue-50/20 dark:bg-blue-950/10" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"}`}
                    >
                      <td colSpan={6} className="p-0">
                        {/* Summary Collapsed Row */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--fg-line)]/50">
                          {/* Col 1: Index + Name */}
                          <div className="flex items-center gap-3 min-w-[240px]">
                            <span className="text-[11px] font-mono text-slate-400 w-6 text-center">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <div 
                              className="w-3.5 h-3.5 shrink-0 border border-slate-300 dark:border-slate-600 shadow-sm"
                              style={{ backgroundColor: tdp.color || '#3388ff' }}
                              title={`Mã màu GIS: ${tdp.color || '#3388ff'}`}
                            ></div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <span>{tdp.name}</span>
                              </div>
                              <div className="text-[10px] font-mono text-slate-400">
                                ID: {tdpId.slice(-6).toUpperCase()}
                              </div>
                            </div>
                          </div>

                          {/* Col 2: Locked Risk Badge */}
                          <div className="text-center px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-black uppercase tracking-wider border ${
                              tdp.risk_status === 'red' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900' :
                              tdp.risk_status === 'yellow' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900' :
                              'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900'
                            }`}>
                              <Lock className="w-2.5 h-2.5 opacity-70" />
                              {tdp.risk_status === 'red' ? 'VÙNG ĐỎ' :
                               tdp.risk_status === 'yellow' ? 'VÙNG VÀNG' : 'VÙNG XANH'}
                            </span>
                          </div>

                          {/* Col 3: Population */}
                          <div className="text-center px-4 font-mono text-xs">
                            <span className="text-slate-800 dark:text-slate-200 font-bold">{tdp.households || 0}</span>
                            <span className="text-slate-400 text-[10px]"> hộ • </span>
                            <span className="text-blue-600 dark:text-blue-400 font-bold">{tdp.population || 0}</span>
                            <span className="text-slate-400 text-[10px]"> khẩu</span>
                          </div>

                          {/* Col 4: GIS Status */}
                          <div className="text-center px-4">
                            {hasGeojson ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
                                <CheckCircle2 className="w-3 h-3" /> ĐÃ ĐỊNH VỊ
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 border border-[var(--fg-line)]">
                                CHƯA ĐỊNH VỊ
                              </span>
                            )}
                          </div>

                          {/* Col 5: Actions: Chi tiết, Sửa, GIS, Xóa */}
                          <div className="flex items-center gap-2">
                            {/* Nút Chi tiết */}
                            <button
                              type="button"
                              onClick={() => toggleExpand(tdpId)}
                              className={`px-3 py-1.5 text-xs font-mono font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                isExpanded 
                                  ? "bg-blue-600 text-white border-blue-700 shadow-sm" 
                                  : "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-slate-700"
                              }`}
                              title={isExpanded ? "Thu gọn thông tin" : "Mở xem chi tiết tổ dân phố"}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{isExpanded ? "THU GỌN" : "CHI TIẾT"}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>

                            {/* Nút Sửa */}
                            <button
                              type="button"
                              onClick={() => openEditModal(tdp)}
                              className="px-2.5 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-[var(--fg-line)] hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                              title="Chỉnh sửa thông tin các trường dữ liệu"
                            >
                              <Edit className="w-3.5 h-3.5 text-slate-500" />
                              <span>SỬA</span>
                            </button>

                            {/* Nút Xem Bản đồ */}
                            {hasGeojson ? (
                              <Link
                                href={`/gis?zoneId=${tdp._id}`}
                                className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 border border-[var(--fg-line)] hover:bg-blue-50 dark:hover:bg-slate-700 transition-all"
                                title="Xem trực tiếp trên Bản đồ số GIS"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            ) : (
                              <Link
                                href={`/gis?drawTdpId=${tdp._id}`}
                                className="p-1.5 text-amber-600 hover:text-amber-700 border border-amber-200 dark:border-amber-900 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all"
                                title="Vẽ ranh giới không gian trên GIS"
                              >
                                <PenTool className="w-3.5 h-3.5" />
                              </Link>
                            )}

                            {/* Nút Xóa */}
                            <button
                              type="button"
                              onClick={() => handleDelete(tdpId)}
                              className="p-1.5 text-slate-400 hover:text-red-600 border border-[var(--fg-line)] hover:bg-red-50 dark:hover:bg-red-950/40 transition-all cursor-pointer"
                              title="Xóa tổ dân phố"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* EXPANDED TECHNICAL DETAIL BOX (Framed Grid Layout) */}
                        {isExpanded && (
                          <div className="p-4 bg-slate-50/70 dark:bg-slate-900/60 border-b border-[var(--fg-line)] animate-in fade-in duration-200">
                            <div className="frame frame-brackets p-4 !bg-white dark:!bg-slate-800 border border-[var(--fg-line)]">
                              {/* Header of Detail Box */}
                              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--fg-line)]">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 bg-blue-600"></span>
                                  <span className="font-mono text-xs font-black uppercase text-slate-800 dark:text-slate-100">
                                    HỒ SƠ KỸ THUẬT: {tdp.name}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    [NGHỊ QUYẾT 20/NQ-HĐND]
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => openEditModal(tdp)}
                                    className="px-2.5 py-1 text-[11px] font-mono font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 hover:bg-blue-100 flex items-center gap-1 transition-all"
                                  >
                                    <Edit className="w-3 h-3" /> SỬA DỮ LIỆU
                                  </button>
                                  <button
                                    onClick={() => toggleExpand(tdpId)}
                                    className="px-2 py-1 text-[11px] font-mono text-slate-500 hover:text-slate-800 dark:hover:text-white border border-[var(--fg-line)]"
                                  >
                                    THU GỌN
                                  </button>
                                </div>
                              </div>

                              {/* 6 Grid Sections */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* Khối 1: Bí thư Chi bộ */}
                                <div className="p-3 border border-[var(--fg-line)] bg-slate-50/50 dark:bg-slate-900/40 relative">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1">
                                      <UserCheck className="w-3 h-3" /> BÍ THƯ CHI BỘ
                                    </span>
                                  </div>
                                  <div className="space-y-1 font-mono text-xs">
                                    <div className="text-slate-900 dark:text-white font-bold text-sm">
                                      {tdp.secretary_name || <span className="text-slate-400 font-normal italic">Chưa có thông tin</span>}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                      <Phone className="w-3 h-3 text-slate-400" />
                                      {tdp.secretary_phone ? (
                                        <a href={`tel:${tdp.secretary_phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                                          {tdp.secretary_phone}
                                        </a>
                                      ) : (
                                        <span className="text-slate-400 italic">Chưa có số</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Khối 2: Tổ trưởng Dân phố */}
                                <div className="p-3 border border-[var(--fg-line)] bg-slate-50/50 dark:bg-slate-900/40 relative">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                                      <Users className="w-3 h-3" /> TỔ TRƯỞNG DÂN PHỐ
                                    </span>
                                  </div>
                                  <div className="space-y-1 font-mono text-xs">
                                    <div className="text-slate-900 dark:text-white font-bold text-sm">
                                      {tdp.leader_name || <span className="text-slate-400 font-normal italic">Chưa có thông tin</span>}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                      <Phone className="w-3 h-3 text-slate-400" />
                                      {tdp.leader_phone ? (
                                        <a href={`tel:${tdp.leader_phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                                          {tdp.leader_phone}
                                        </a>
                                      ) : (
                                        <span className="text-slate-400 italic">Chưa có số</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Khối 3: Cảnh sát khu vực */}
                                <div className="p-3 border border-[var(--fg-line)] bg-slate-50/50 dark:bg-slate-900/40 relative">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                                      <Shield className="w-3 h-3" /> CẢNH SÁT KHU VỰC
                                    </span>
                                  </div>
                                  <div className="space-y-1 font-mono text-xs">
                                    <div className="text-slate-900 dark:text-white font-bold text-sm">
                                      {tdp.police_name || <span className="text-slate-400 font-normal italic">Chưa có thông tin</span>}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                      <Phone className="w-3 h-3 text-slate-400" />
                                      {tdp.police_phone ? (
                                        <a href={`tel:${tdp.police_phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                                          {tdp.police_phone}
                                        </a>
                                      ) : (
                                        <span className="text-slate-400 italic">Chưa có số</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Khối 4: Quy mô Dân cư */}
                                <div className="p-3 border border-[var(--fg-line)] bg-slate-50/50 dark:bg-slate-900/40">
                                  <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    QUY MÔ DÂN CƯ & DIỆN TÍCH
                                  </div>
                                  <div className="space-y-1 text-xs font-mono">
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Số hộ gia đình:</span>
                                      <span className="font-bold text-slate-900 dark:text-white">{tdp.households || 0} hộ</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Tổng nhân khẩu:</span>
                                      <span className="font-bold text-blue-600 dark:text-blue-400">{tdp.population || 0} người</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Diện tích ước tính:</span>
                                      <span className="font-bold text-slate-700 dark:text-slate-300">
                                        {tdp.area_sqm ? `${tdp.area_sqm.toLocaleString()} m²` : "Chưa đo đạc"}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Khối 5: Phân loại Vùng (KHÓA LẠI LUÔN 🔒) */}
                                <div className="p-3 border border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                                      <Lock className="w-3 h-3" /> THÔNG TIN VÙNG (ĐÃ KHÓA 🔒)
                                    </span>
                                  </div>
                                  <div className="space-y-1.5 text-xs font-mono">
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-500">Trạng thái an ninh:</span>
                                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase border ${
                                        tdp.risk_status === 'red' ? 'bg-red-100 text-red-700 border-red-300' :
                                        tdp.risk_status === 'yellow' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                                        'bg-emerald-100 text-emerald-700 border-emerald-300'
                                      }`}>
                                        {tdp.risk_status === 'red' ? 'Vùng Đỏ' :
                                         tdp.risk_status === 'yellow' ? 'Vùng Vàng' : 'Vùng Xanh'}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-500">Màu sắc GIS:</span>
                                      <span className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 border border-slate-300 inline-block" style={{ backgroundColor: tdp.color }}></span>
                                        <span className="text-[11px] text-slate-600 dark:text-slate-300">{tdp.color || "#3388ff"}</span>
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-amber-700 dark:text-amber-300 pt-1 border-t border-amber-200/50">
                                      🔒 Dữ liệu phân vùng chuẩn hóa cố định theo địa bàn, không cho phép chỉnh sửa.
                                    </div>
                                  </div>
                                </div>

                                {/* Khối 6: Tọa độ không gian & Thao tác bản đồ */}
                                <div className="p-3 border border-[var(--fg-line)] bg-slate-50/50 dark:bg-slate-900/40">
                                  <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                                    <span>RANH GIỚI KHÔNG GIAN</span>
                                    {hasGeojson && <span className="text-emerald-600 text-[10px] font-bold">● ĐÃ KHÉP GÓC</span>}
                                  </div>
                                  <div className="space-y-2 text-xs font-mono">
                                    <div className="text-slate-600 dark:text-slate-400 text-[11px]">
                                      {tdp.boundary_info ? (
                                        <span>Ghi chú: {tdp.boundary_info}</span>
                                      ) : (
                                        <span>Theo ranh giới địa chính 27 tổ dân phố mới.</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 pt-1">
                                      {hasGeojson ? (
                                        <Link 
                                          href={`/gis?zoneId=${tdp._id}`}
                                          className="flex-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold text-center flex items-center justify-center gap-1"
                                        >
                                          <MapPin className="w-3 h-3" /> XEM TRÊN BẢN ĐỒ GIS
                                        </Link>
                                      ) : (
                                        <Link 
                                          href={`/gis?drawTdpId=${tdp._id}`}
                                          className="flex-1 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold text-center flex items-center justify-center gap-1"
                                        >
                                          <PenTool className="w-3 h-3" /> VẼ RANH GIỚI TRÊN GIS
                                        </Link>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Modal Sửa / Thêm TDP (Với trường Vùng bị khóa lại luôn 🔒) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="frame frame-brackets w-full max-w-2xl !bg-white dark:!bg-slate-900 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col !p-0">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--fg-line)] flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-blue-600"></span>
                <h2 className="font-mono font-black text-slate-900 dark:text-white text-sm sm:text-base uppercase tracking-wider">
                  {editingId ? "CẬP NHẬT THÔNG TIN TỔ DÂN PHỐ" : "THÊM TỔ DÂN PHỐ MỚI"}
                </h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent hover:border-[var(--fg-line)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              {/* Khối 1: Thông tin cơ bản */}
              <div className="space-y-3">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5 pb-1 border-b border-[var(--fg-line)]">
                  <MapPin className="w-3.5 h-3.5" /> 1. THÔNG TIN CHUNG TỔ DÂN PHỐ
                </div>
                
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Tên Tổ dân phố <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="VD: Tổ 1, Quang Thành 1..."
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[var(--fg-line)] text-xs font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Số hộ gia đình
                    </label>
                    <div className="relative">
                      <input 
                        type="number" 
                        min="0"
                        value={formData.households}
                        onChange={(e) => setFormData({...formData, households: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[var(--fg-line)] text-xs font-mono focus:outline-none focus:border-blue-600"
                      />
                      {formData.households > 0 && (
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, households: 0})}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 text-[10px]"
                          title="Xóa về 0"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Số nhân khẩu
                    </label>
                    <div className="relative">
                      <input 
                        type="number" 
                        min="0"
                        value={formData.population}
                        onChange={(e) => setFormData({...formData, population: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[var(--fg-line)] text-xs font-mono focus:outline-none focus:border-blue-600"
                      />
                      {formData.population > 0 && (
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, population: 0})}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 text-[10px]"
                          title="Xóa về 0"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Ghi chú mô tả ranh giới địa bàn
                  </label>
                  <input 
                    type="text" 
                    placeholder="VD: Giáp đường Mê Linh phía Bắc, đường số 5 phía Nam..."
                    value={formData.boundary_info}
                    onChange={(e) => setFormData({...formData, boundary_info: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[var(--fg-line)] text-xs font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Khối 2: Bí thư Chi bộ (Thêm / Sửa / Bớt) */}
              <div className="p-3.5 border border-red-200 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-black uppercase text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" /> 2. BÍ THƯ CHI BỘ
                  </span>
                  {(formData.secretary_name || formData.secretary_phone) && (
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, secretary_name: "", secretary_phone: ""})}
                      className="text-[10px] font-mono text-red-600 hover:underline cursor-pointer"
                      title="Bớt thông tin Bí thư Chi bộ"
                    >
                      ✕ Xóa trắng thông tin này
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Họ và tên Bí thư
                    </label>
                    <input 
                      type="text" 
                      placeholder="VD: Nguyễn Văn A"
                      value={formData.secretary_name}
                      onChange={(e) => setFormData({...formData, secretary_name: e.target.value})}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[var(--fg-line)] text-xs font-mono focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Số điện thoại Bí thư
                    </label>
                    <input 
                      type="tel" 
                      placeholder="VD: 0905123456"
                      value={formData.secretary_phone}
                      onChange={(e) => setFormData({...formData, secretary_phone: e.target.value})}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[var(--fg-line)] text-xs font-mono focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Khối 3: Tổ trưởng & CSKV (Thêm / Sửa / Bớt) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Tổ trưởng */}
                <div className="p-3.5 border border-blue-200 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-black uppercase text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> 3. TỔ TRƯỞNG DÂN PHỐ
                    </span>
                    {(formData.leader_name || formData.leader_phone) && (
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, leader_name: "", leader_phone: ""})}
                        className="text-[10px] font-mono text-blue-600 hover:underline cursor-pointer"
                        title="Bớt thông tin Tổ trưởng"
                      >
                        ✕ Xóa trắng
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Họ tên Tổ trưởng
                    </label>
                    <input 
                      type="text" 
                      placeholder="VD: Trần Văn B"
                      value={formData.leader_name}
                      onChange={(e) => setFormData({...formData, leader_name: e.target.value})}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[var(--fg-line)] text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Số điện thoại Tổ trưởng
                    </label>
                    <input 
                      type="tel" 
                      placeholder="VD: 0914123456"
                      value={formData.leader_phone}
                      onChange={(e) => setFormData({...formData, leader_phone: e.target.value})}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[var(--fg-line)] text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* CSKV */}
                <div className="p-3.5 border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-black uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" /> 4. CẢNH SÁT KHU VỰC
                    </span>
                    {(formData.police_name || formData.police_phone) && (
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, police_name: "", police_phone: ""})}
                        className="text-[10px] font-mono text-emerald-600 hover:underline cursor-pointer"
                        title="Bớt thông tin CSKV"
                      >
                        ✕ Xóa trắng
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Họ tên CSKV
                    </label>
                    <input 
                      type="text" 
                      placeholder="VD: Lê Văn C"
                      value={formData.police_name}
                      onChange={(e) => setFormData({...formData, police_name: e.target.value})}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[var(--fg-line)] text-xs font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Số điện thoại CSKV
                    </label>
                    <input 
                      type="tel" 
                      placeholder="VD: 0988123456"
                      value={formData.police_phone}
                      onChange={(e) => setFormData({...formData, police_phone: e.target.value})}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[var(--fg-line)] text-xs font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Khối 4: THÔNG TIN VÙNG TỔ DÂN PHỐ (KHÓA LẠI LUÔN 🔒) */}
              <div className="p-4 border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-amber-500 text-white shrink-0 mt-0.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-black uppercase text-amber-800 dark:text-amber-300 block">
                      5. THÔNG TIN VÙNG TỔ DÂN PHỐ (ĐÃ KHÓA BẢO VỆ 🔒)
                    </span>
                    <p className="text-[11px] font-mono text-amber-700 dark:text-amber-400 mt-0.5">
                      Thông tin phân loại vùng và màu sắc nhận diện bản đồ của 27 Tổ dân phố được khóa cố định theo Quyết định chuẩn hóa địa bàn, không cho phép chỉnh sửa thủ công.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">
                      Phân loại Vùng (Khóa cố định)
                    </label>
                    <div className={`flex gap-1.5 ${canClassify ? "" : "opacity-60 pointer-events-none select-none"}`}>
                      <button 
                        type="button"
                        disabled={!canClassify}
                        onClick={() => setFormData({ ...formData, risk_status: "green", color: "#00e676" })}
                        className={`flex-1 py-1.5 text-xs font-mono font-bold border ${
                          formData.risk_status === 'green' ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                      >
                        Vùng Xanh
                      </button>
                      <button 
                        type="button"
                        disabled={!canClassify}
                        onClick={() => setFormData({ ...formData, risk_status: "yellow", color: "#ffb300" })}
                        className={`flex-1 py-1.5 text-xs font-mono font-bold border ${
                          formData.risk_status === 'yellow' ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                      >
                        Vùng Vàng
                      </button>
                      <button 
                        type="button"
                        disabled={!canClassify}
                        onClick={() => setFormData({ ...formData, risk_status: "red", color: "#ff5252" })}
                        className={`flex-1 py-1.5 text-xs font-mono font-bold border ${
                          formData.risk_status === 'red' ? 'bg-red-600 text-white border-red-700' : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                      >
                        Vùng Đỏ
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">
                      Mã màu hiển thị bản đồ (Khóa cố định)
                    </label>
                    <div className={`flex items-center gap-2 ${canClassify ? "" : "opacity-60 pointer-events-none select-none"}`}>
                      <div 
                        className="w-9 h-8 border border-slate-300"
                        style={{ backgroundColor: formData.color }}
                      ></div>
                      <input 
                        type="text" 
                        disabled={!canClassify}
                        value={formData.color}
                        className="flex-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-[var(--fg-line)] text-xs font-mono cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 border border-red-200 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/10 space-y-2.5">
                  <span className="text-[11px] font-mono font-black uppercase text-red-600 dark:text-red-400">Chi bo</span>
                  <input type="text" placeholder="Pho Bi thu Chi bo" value={formData.deputy_secretary_name} onChange={(e) => setFormData({...formData, deputy_secretary_name: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[var(--fg-line)] text-xs font-mono" />
                  <input type="tel" placeholder="So dien thoai" value={formData.deputy_secretary_phone} onChange={(e) => setFormData({...formData, deputy_secretary_phone: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[var(--fg-line)] text-xs font-mono" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" min="0" placeholder="So dang vien" value={formData.party_members_count || ""} onChange={(e) => setFormData({...formData, party_members_count: Number(e.target.value) || 0})} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[var(--fg-line)] text-xs font-mono" />
                    <input type="number" min="0" placeholder="Quy dinh 213" value={formData.regulation_213_count || ""} onChange={(e) => setFormData({...formData, regulation_213_count: Number(e.target.value) || 0})} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[var(--fg-line)] text-xs font-mono" />
                  </div>
                </div>
                <div className="p-3.5 border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/20 dark:bg-indigo-950/10 space-y-2.5">
                  <span className="text-[11px] font-mono font-black uppercase text-indigo-600 dark:text-indigo-400">Mat tran & ANTT co so</span>
                  <input type="text" placeholder="Truong ban Cong tac Mat tran" value={formData.front_head_name} onChange={(e) => setFormData({...formData, front_head_name: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[var(--fg-line)] text-xs font-mono" />
                  <input type="text" placeholder="Pho To truong TDP" value={formData.deputy_tdp_leader_name} onChange={(e) => setFormData({...formData, deputy_tdp_leader_name: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[var(--fg-line)] text-xs font-mono" />
                  <input type="text" placeholder="To truong bao ve ANTT" value={formData.security_leader_name} onChange={(e) => setFormData({...formData, security_leader_name: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[var(--fg-line)] text-xs font-mono" />
                  <input type="tel" placeholder="So dien thoai To truong ANTT" value={formData.security_leader_phone} onChange={(e) => setFormData({...formData, security_leader_phone: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[var(--fg-line)] text-xs font-mono" />
                </div>
              </div>

              {/* Form Footer */}
              <div className="pt-4 border-t border-[var(--fg-line)] flex items-center justify-end gap-2.5 shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold border border-[var(--fg-line)] transition-colors cursor-pointer"
                >
                  HỦY BỎ
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-mono text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin"></div> ĐANG LƯU...</>
                  ) : (
                    editingId ? "LƯU CẬP NHẬT" : "TẠO TỔ DÂN PHỐ"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal Nhập Excel */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="frame frame-brackets w-full max-w-md !bg-white dark:!bg-slate-900 shadow-2xl animate-in zoom-in-95 duration-150 !p-0">
            <div className="px-6 py-4 border-b border-[var(--fg-line)] flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-600"></span>
                <h2 className="font-mono font-black text-slate-900 dark:text-white text-sm uppercase">
                  NHẬP DỮ LIỆU TỪ FILE EXCEL
                </h2>
              </div>
              <button 
                onClick={() => setIsImportModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-mono font-bold text-sm text-slate-800 dark:text-slate-100">CHỌN FILE EXCEL DỮ LIỆU</h3>
                <p className="text-slate-500 text-xs mt-1 font-mono">
                  Hệ thống tự động nhận dạng các cột: Tên tổ, Số hộ, Nhân khẩu, Bí thư, SĐT Bí thư, Tổ trưởng, SĐT Tổ trưởng, CSKV, SĐT CSKV.
                </p>
              </div>
              
              <label className="block cursor-pointer">
                <span className="sr-only">Chọn file</span>
                <input 
                  type="file" 
                  accept=".xlsx, .xls"
                  onChange={handleImportExcel}
                  disabled={importing}
                  className="block w-full text-xs font-mono text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:border-0 file:text-xs file:font-mono file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer disabled:opacity-50"
                />
              </label>

              {importing && (
                <div className="flex items-center justify-center gap-2 text-emerald-600 font-mono text-xs font-bold animate-pulse">
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent animate-spin"></div>
                  Đang đồng bộ cơ sở dữ liệu...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal Hướng dẫn Tọa độ không gian */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="frame frame-brackets w-full max-w-2xl !bg-white dark:!bg-slate-900 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col !p-0">
            <div className="px-6 py-4 border-b border-[var(--fg-line)] flex items-center justify-between bg-blue-50 dark:bg-blue-950/30 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-blue-600"></span>
                <h2 className="font-mono font-black text-slate-900 dark:text-white text-sm uppercase">
                  HƯỚNG DẪN ĐỊNH VỊ RANH GIỚI TỔ DÂN PHỐ
                </h2>
              </div>
              <button 
                onClick={() => setIsInfoModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto font-mono text-xs text-slate-700 dark:text-slate-300">
              <section className="p-3 border border-[var(--fg-line)] bg-slate-50/50 dark:bg-slate-800/40">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase mb-1">1. ĐỊNH DẠNG GEOJSON (RFC 7946)</h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Ranh giới địa bàn được lưu trữ dưới dạng Polygon khép kín với các cặp tọa độ [Kinh độ, Vĩ độ] (Longitude, Latitude).
                </p>
              </section>

              <section className="p-3 border border-[var(--fg-line)] bg-slate-50/50 dark:bg-slate-800/40">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase mb-1">2. VẼ TRỰC TIẾP TRÊN BẢN ĐỒ SỐ GIS</h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Người dùng có thể vào trực tiếp bản đồ GIS bằng cách bấm nút <strong>"Vẽ ranh giới"</strong>, nhấp chuột qua từng góc phố/ngã rẽ và nhấp đúp để hoàn tất khép vùng. Hệ thống tự động lưu vào cơ sở dữ liệu.
                </p>
              </section>

              <div className="p-3 border border-amber-300 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300">
                <strong>LƯU Ý BẢO VỆ DỮ LIỆU:</strong> Phân loại vùng an ninh (Xanh / Vàng / Đỏ) được khóa cố định theo hồ sơ nghiệp vụ địa bàn.
              </div>

              <div className="pt-2 text-right">
                <button 
                  onClick={() => setIsInfoModalOpen(false)}
                  className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold"
                >
                  ĐÃ HIỂU
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
