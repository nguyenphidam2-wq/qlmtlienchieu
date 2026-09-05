"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Building2, MapPin, Plus, RefreshCw, ShieldCheck } from "lucide-react";
import { approveConditionalBusiness, createConditionalBusiness, getConditionalBusinesses } from "@/lib/actions/conditional-businesses";

const MapPicker = dynamic(() => import("@/components/map/MapPicker"), { ssr: false });
const TYPES = ["hotel", "karaoke", "massage", "pawn_shop", "bar_pub", "game_internet", "loan_service", "other_sensitive_service"] as const;

type BusinessForm = {
  business_name: string;
  business_type: (typeof TYPES)[number];
  address: string;
  tdp: string;
  owner_name: string;
  security_license_no: string;
  employees_count: string;
  lat: string;
  lng: string;
};

const initialForm: BusinessForm = {
  business_name: "",
  business_type: "hotel",
  address: "",
  tdp: "",
  owner_name: "",
  security_license_no: "",
  employees_count: "",
  lat: "",
  lng: "",
};

const fields: Array<[keyof BusinessForm, string]> = [
  ["address", "Địa chỉ"],
  ["tdp", "Tổ dân phố"],
  ["owner_name", "Chủ cơ sở"],
  ["security_license_no", "Số giấy phép ANTT"],
  ["employees_count", "Số nhân viên"],
];

export function ConditionalBusinessList() {
  const [rows, setRows] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [form, setForm] = useState<BusinessForm>(initialForm);

  const load = async () => setRows(await getConditionalBusinesses());

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await createConditionalBusiness({
      ...form,
      employees_count: Number(form.employees_count) || 0,
      lat: form.lat ? Number(form.lat) : undefined,
      lng: form.lng ? Number(form.lng) : undefined,
    });
    setForm(initialForm);
    setShowForm(false);
    await load();
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-rose-600">Kinh tế / ANTT</p>
          <h1 className="text-2xl font-bold text-slate-900">Cơ sở kinh doanh có điều kiện</h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý cơ sở nhạy cảm, giấy phép ANTT và lịch sử kiểm tra.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => load()} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"><RefreshCw className="h-4 w-4" /> Làm mới</button>
          <button type="button" onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Thêm cơ sở</button>
        </div>
      </header>

      {showForm && (
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 rounded-xl border border-rose-200 bg-rose-50/40 p-5 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Tên cơ sở
            <input required value={form.business_name} onChange={(event) => setForm({ ...form, business_name: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Loại hình
            <select value={form.business_type} onChange={(event) => setForm({ ...form, business_type: event.target.value as BusinessForm["business_type"] })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
              {TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          {fields.map(([key, label]) => (
            <label key={key} className="text-sm font-medium text-slate-700">
              {label}
              <input type={key === "employees_count" ? "number" : "text"} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
            </label>
          ))}

          <div className="md:col-span-2 rounded-lg border border-dashed border-rose-300 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">Vị trí trên bản đồ</p>
                <p className="mt-1 text-xs text-slate-500">
                  {form.lat && form.lng ? `Đã chọn: ${Number(form.lat).toFixed(6)}, ${Number(form.lng).toFixed(6)}` : "Chưa chọn vị trí"}
                </p>
              </div>
              <button type="button" onClick={() => setShowMapPicker(true)} className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
                <MapPin className="h-4 w-4" /> Chọn vị trí trên bản đồ
              </button>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end"><button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Lưu cơ sở</button></div>
        </form>
      )}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500">Chưa có dữ liệu cơ sở kinh doanh.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Cơ sở</th><th className="p-4">Địa chỉ</th><th className="p-4">Giấy phép ANTT</th><th className="p-4">Trạng thái</th><th className="p-4" /></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row._id}>
                  <td className="p-4"><div className="flex items-center gap-2 font-semibold"><Building2 className="h-4 w-4 text-rose-600" />{row.business_name}</div><div className="text-xs text-slate-500">{row.business_type}</div></td>
                  <td className="p-4 text-slate-600"><MapPin className="mr-1 inline h-3.5 w-3.5" />{row.address || "Chưa cập nhật"}<div className="text-xs">{row.tdp || "Chưa có TDP"}</div></td>
                  <td className="p-4">{row.security_license_no || "Chưa cập nhật"}</td>
                  <td className="p-4"><span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">{row.approval_status || "Pending"}</span></td>
                  <td className="p-4">{row.approval_status === "Pending" && <button type="button" onClick={async () => { await approveConditionalBusiness(row._id, "Approved"); await load(); }} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><ShieldCheck className="h-4 w-4" /> Duyệt</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showMapPicker && (
        <MapPicker
          initialLat={form.lat ? Number(form.lat) : undefined}
          initialLng={form.lng ? Number(form.lng) : undefined}
          onSelect={(lat, lng) => {
            setForm({ ...form, lat: String(lat), lng: String(lng) });
            setShowMapPicker(false);
          }}
          onClose={() => setShowMapPicker(false)}
        />
      )}
    </div>
  );
}
