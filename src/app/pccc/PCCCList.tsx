"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { createPCCCRecord } from "@/lib/actions/pccc";
import { Flame, MapPin, CheckCircle, AlertTriangle, X } from "lucide-react";

export default function PCCCList({ initialRecords }: { initialRecords: any[] }) {
  const [records, setRecords] = useState(initialRecords);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "hydrant",
    status: "active",
    address: "",
    lat: "",
    lng: "",
    tdp: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await createPCCCRecord({
        ...formData,
        lat: formData.lat ? parseFloat(formData.lat) : undefined,
        lng: formData.lng ? parseFloat(formData.lng) : undefined
      } as any);
      
      setRecords([result, ...records]);
      setIsModalOpen(false);
      setFormData({
        name: "",
        type: "hydrant",
        status: "active",
        address: "",
        lat: "",
        lng: "",
        tdp: ""
      });
    } catch (error) {
      alert("Lỗi khi thêm hồ sơ!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Flame className="w-8 h-8 text-orange-500" />
            Quản lý An toàn PCCC
          </h1>
          <p className="text-slate-500 mt-2">Hệ thống theo dõi thiết bị và hồ sơ phòng cháy chữa cháy</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-orange-200 cursor-pointer hover:bg-orange-600 transition-all active:scale-95"
        >
          + Thêm hồ sơ mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <span className="text-slate-400 text-xs font-black uppercase tracking-widest">Tổng thiết bị</span>
          <div className="text-4xl font-black text-slate-900 mt-2">{records.length}</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <span className="text-slate-400 text-xs font-black uppercase tracking-widest">Hoạt động tốt</span>
          <div className="text-4xl font-black text-green-500 mt-2">
            {records.filter(r => r.status === "active").length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <span className="text-slate-400 text-xs font-black uppercase tracking-widest">Cần bảo trì</span>
          <div className="text-4xl font-black text-orange-500 mt-2">
            {records.filter(r => r.status === "maintenance").length}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên thiết bị/Cơ sở</th>
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loại</th>
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Địa chỉ</th>
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kiểm tra cuối</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record: any) => (
              <tr key={record._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="p-5 font-bold text-slate-800">{record.name}</td>
                <td className="p-5 text-sm text-slate-500 capitalize">{record.type}</td>
                <td className="p-5 text-sm text-slate-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {record.address || "—"}
                  </div>
                </td>
                <td className="p-5">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    record.status === "active" ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                  }`}>
                    {record.status === "active" ? "Hoạt động" : "Bảo trì"}
                  </span>
                </td>
                <td className="p-5 text-sm text-slate-500">
                  {record.lastChecked ? new Date(record.lastChecked).toLocaleDateString("vi-VN") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Thêm hồ sơ PCCC mới"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400">Tên thiết bị/Cơ sở</label>
              <input 
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500"
                placeholder="VD: Trụ nước T1"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400">Loại</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as any})}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500"
              >
                <option value="hydrant">Trụ nước</option>
                <option value="building">Công trình/Tòa nhà</option>
                <option value="water_source">Nguồn nước tự nhiên</option>
                <option value="equipment">Thiết bị rời</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400">Địa chỉ</label>
            <input 
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500"
              placeholder="VD: 123 Lê Lợi"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400">Vĩ độ (Lat)</label>
              <input 
                type="number" step="any"
                value={formData.lat}
                onChange={e => setFormData({...formData, lat: e.target.value})}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500"
                placeholder="16.0..."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400">Kinh độ (Lng)</label>
              <input 
                type="number" step="any"
                value={formData.lng}
                onChange={e => setFormData({...formData, lng: e.target.value})}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500"
                placeholder="108.0..."
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400">Trạng thái</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={formData.status === "active"} onChange={() => setFormData({...formData, status: "active"})} />
                <span className="text-sm">Hoạt động tốt</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={formData.status === "maintenance"} onChange={() => setFormData({...formData, status: "maintenance"})} />
                <span className="text-sm">Cần bảo trì</span>
              </label>
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-orange-200 hover:bg-orange-600 disabled:opacity-50 transition-all"
            >
              {loading ? "Đang lưu..." : "Lưu hồ sơ"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
