"use client";

import { useEffect, useState } from "react";
import { getTDPs, createTDP, updateTDP, deleteTDP, importTDPData } from "@/lib/actions/tdp";
import { ITDP } from "@/lib/models/TDP";
import { Search, MapPin, CheckCircle2, AlertCircle, Plus, Edit, X, Trash2, PenTool, Download, Upload, Info } from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";

export default function TDPPage() {
  const [tdps, setTdps] = useState<ITDP[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    households: 0,
    population: 0,
    risk_status: "green" as "green" | "yellow" | "red",
    color: "#00e676" // Default green
  });

  useEffect(() => {
    fetchTDPs();
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

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: "", households: 0, population: 0, risk_status: "green", color: "#00e676" });
    setIsModalOpen(true);
  };

  const openEditModal = (tdp: ITDP) => {
    setEditingId(tdp._id as string);
    setFormData({
      name: tdp.name,
      households: tdp.households || 0,
      population: tdp.population || 0,
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
        await updateTDP(editingId, formData);
      } else {
        await createTDP(formData);
      }
      await fetchTDPs(); // Reload list
      setIsModalOpen(false); // Close modal
    } catch (error) {
      console.error(error);
      alert("Lỗi khi lưu Tổ dân phố");
    } finally {
      setSaving(false);
    }
  };



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
        const data = XLSX.utils.sheet_to_json(ws);

        // Import logic via Server Action
        const result = await importTDPData(data);
        
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

  const handleColorChange = (status: "green" | "yellow" | "red") => {
    const colors = { green: "#00e676", yellow: "#ffb300", red: "#ff5252" };
    setFormData({ ...formData, risk_status: status, color: colors[status] });
  };

  const filteredTDPs = tdps.filter(t => 
    t.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <MapPin className="w-8 h-8 text-blue-600" />
              Quản lý Tổ dân phố
            </h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">
              Quản lý thông tin hành chính, nhân khẩu và ranh giới không gian các TDP
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a 
              href="/Mau_Nhap_Lieu_TDP.xlsx"
              download="Mau_Nhap_Lieu_TDP.xlsx"
              className="bg-white hover:bg-slate-50 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-bold border border-slate-200 transition-all active:scale-95 flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Tải mẫu Excel
            </a>
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" /> Nhập nhanh (Excel)
            </button>
            <button 
              onClick={openAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Thêm TDP
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Tìm kiếm theo tên tổ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
        <button 
          onClick={() => setIsInfoModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold border border-blue-100 hover:bg-blue-100 transition-all"
        >
          <Info className="w-4 h-4" /> Hướng dẫn Tọa độ không gian
        </button>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-6 py-4">Tên Tổ</th>
                <th className="px-6 py-4 text-center">Số hộ</th>
                <th className="px-6 py-4 text-center">Nhân khẩu</th>
                <th className="px-6 py-4 text-center">Phân loại vùng</th>
                <th className="px-6 py-4 text-center">Màu sắc</th>
                <th className="px-6 py-4 text-center">Tọa độ không gian</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : filteredTDPs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Không tìm thấy Tổ dân phố nào
                  </td>
                </tr>
              ) : (
                filteredTDPs.map((tdp) => {
                  const hasGeojson = tdp.geojson && tdp.geojson.features && tdp.geojson.features.length > 0;
                  
                  return (
                    <tr key={tdp._id as string} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4 font-bold text-slate-700">
                        {tdp.name}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600 font-medium">
                        {tdp.households.toLocaleString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 text-center text-blue-600 font-bold">
                        {tdp.population.toLocaleString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          tdp.risk_status === 'red' ? 'bg-red-100 text-red-600' :
                          tdp.risk_status === 'yellow' ? 'bg-amber-100 text-amber-600' :
                          'bg-emerald-100 text-emerald-600'
                        }`}>
                          {tdp.risk_status === 'red' ? 'Vùng Đỏ' :
                           tdp.risk_status === 'yellow' ? 'Vùng Vàng' : 'Vùng Xanh'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div 
                            className="w-5 h-5 rounded shadow-sm border border-slate-200"
                            style={{ backgroundColor: tdp.color || '#3388ff' }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {hasGeojson ? (
                          <div className="flex items-center justify-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg w-fit mx-auto border border-emerald-100">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase">Đã định vị</span>
                          </div>
                        ) : (
                          <Link href={`/gis?drawTdpId=${tdp._id}`} className="flex items-center justify-center gap-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 px-2.5 py-1 rounded-lg w-fit mx-auto border border-blue-200 transition-colors">
                            <PenTool className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase">Vẽ ranh giới</span>
                          </Link>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {hasGeojson && (
                            <Link href={`/gis?zoneId=${tdp._id}`} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Xem trên bản đồ">
                              <MapPin className="w-4 h-4" />
                            </Link>
                          )}
                          <button onClick={() => openEditModal(tdp)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Chỉnh sửa">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(tdp._id as string)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm/Sửa TDP */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" /> {editingId ? "Sửa Tổ dân phố" : "Thêm Tổ dân phố"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tên Tổ dân phố <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  placeholder="VD: Tổ 16, Khu vực 81..."
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Số hộ</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.households}
                    onChange={(e) => setFormData({...formData, households: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Nhân khẩu</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.population}
                    onChange={(e) => setFormData({...formData, population: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Phân loại Vùng rủi ro</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    type="button"
                    onClick={() => handleColorChange("green")}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                      formData.risk_status === 'green' ? 'bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-500/20' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Vùng Xanh
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleColorChange("yellow")}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                      formData.risk_status === 'yellow' ? 'bg-amber-500 text-white border-amber-600 shadow-lg shadow-amber-500/20' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Vùng Vàng
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleColorChange("red")}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                      formData.risk_status === 'red' ? 'bg-red-500 text-white border-red-600 shadow-lg shadow-red-500/20' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Vùng Đỏ
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Màu sắc hiển thị trên Map</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    className="w-12 h-10 p-1 bg-white border border-slate-200 rounded-lg cursor-pointer"
                  />
                  <span className="text-sm text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex-1">
                    Mã màu: {formData.color}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors text-sm"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Đang lưu...</>
                  ) : (
                    editingId ? "Cập nhật" : "Lưu Tổ dân phố"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nhập Excel */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
              <h2 className="font-black text-emerald-800 text-lg flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" /> Nhập dữ liệu từ Excel
              </h2>
              <button 
                onClick={() => setIsImportModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Chọn file Excel mẫu</h3>
              <p className="text-slate-500 text-sm mb-8">
                Đảm bảo dữ liệu trong file Excel tuân thủ đúng định dạng cột của mẫu tải về.
              </p>
              
              <label className="block">
                <span className="sr-only">Chọn file</span>
                <input 
                  type="file" 
                  accept=".xlsx, .xls"
                  onChange={handleImportExcel}
                  disabled={importing}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer disabled:opacity-50"
                />
              </label>

              {importing && (
                <div className="mt-6 flex items-center justify-center gap-3 text-emerald-600 font-bold animate-pulse">
                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  Đang xử lý dữ liệu...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Hướng dẫn Tọa độ */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-blue-50">
              <h2 className="font-black text-blue-800 text-lg flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" /> Hướng dẫn nhập Tọa độ không gian
              </h2>
              <button 
                onClick={() => setIsInfoModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <div className="space-y-6">
                <section>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-[10px]">01</span>
                    Định dạng GeoJSON là gì?
                  </h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Hệ thống sử dụng chuẩn <strong>GeoJSON (RFC 7946)</strong> để lưu trữ ranh giới. Đây là một định dạng JSON mô tả các đối tượng địa lý.
                  </p>
                </section>

                <section>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-[10px]">02</span>
                    Cấu trúc dữ liệu trong cột <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-600">geojson</code>
                  </h4>
                  <div className="bg-slate-900 rounded-xl p-4 text-xs text-blue-300 font-mono overflow-x-auto">
                    <pre>
{`{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[ [108.14, 16.06], [108.15, 16.06], ... ]]
      },
      "properties": {}
    }
  ]
}`}
                    </pre>
                  </div>
                </section>

                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                  <div className="text-xs text-amber-800 leading-relaxed">
                    <strong className="block mb-1">LƯU Ý QUAN TRỌNG:</strong>
                    <ul className="list-disc ml-4 space-y-1">
                      <li>Tọa độ phải theo định dạng <strong>[Kinh độ, Vĩ độ]</strong> (Longitude, Latitude).</li>
                      <li>Vùng ranh giới (Polygon) phải có điểm đầu và điểm cuối trùng nhau để khép kín vùng.</li>
                      <li>Bạn có thể copy chuỗi JSON này từ các công cụ như <a href="https://geojson.io" target="_blank" className="underline font-bold">geojson.io</a>.</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl">
                  <p className="text-xs text-blue-800 leading-relaxed">
                    <strong className="block mb-1 italic">Mẹo nhỏ:</strong> Nếu bạn không có sẵn chuỗi GeoJSON, hãy cứ nhập các thông tin khác qua Excel trước, sau đó vào mục quản lý và bấm nút <strong>"Vẽ ranh giới"</strong> để vẽ trực tiếp trên bản đồ.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setIsInfoModalOpen(false)}
                className="w-full mt-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98]"
              >
                Tôi đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
