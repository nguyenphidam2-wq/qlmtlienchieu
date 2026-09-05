"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Building2, MapPin, Plus, RefreshCw, ShieldCheck } from "lucide-react";
import { approveRental, createRental, getRentals } from "@/lib/actions/rentals";

const MapPicker = dynamic(() => import("@/components/map/MapPicker"), { ssr: false });

type RentalForm = {
  name: string;
  owner_name: string;
  owner_phone: string;
  address: string;
  tdp: string;
  total_rooms: string;
  current_tenants: string;
  lat: string;
  lng: string;
};

const initialForm: RentalForm = {
  name: "",
  owner_name: "",
  owner_phone: "",
  address: "",
  tdp: "",
  total_rooms: "",
  current_tenants: "",
  lat: "",
  lng: "",
};

const fields: Array<[keyof RentalForm, string]> = [
  ["name", "Tên nhà trọ / cơ sở"],
  ["owner_name", "Chủ nhà trọ"],
  ["owner_phone", "Số điện thoại"],
  ["address", "Địa chỉ"],
  ["tdp", "Tổ dân phố"],
  ["total_rooms", "Tổng số phòng"],
  ["current_tenants", "Số người đang ở"],
];

export function RentalList() {
  const [rows, setRows] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [form, setForm] = useState<RentalForm>(initialForm);

  const load = async () => setRows(await getRentals());

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await createRental({
      ...form,
      total_rooms: Number(form.total_rooms) || 0,
      current_tenants: Number(form.current_tenants) || 0,
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
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Địa bàn / lưu trú</p>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý nhà trọ</h1>
          <p className="mt-1 text-sm text-slate-500">Theo dõi chủ trọ, phòng, tạm trú và kiểm tra ANTT.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => load()} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <RefreshCw className="h-4 w-4" /> Làm mới
          </button>
          <button type="button" onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" /> Thêm nhà trọ
          </button>
        </div>
      </header>

      {showForm && (
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 rounded-xl border border-blue-200 bg-blue-50/50 p-5 md:grid-cols-2">
          {fields.map(([key, label]) => (
            <label key={key} className="text-sm font-medium text-slate-700">
              {label}
              <input
                required={key === "name"}
                type={(["total_rooms", "current_tenants"] as string[]).includes(key) ? "number" : "text"}
                value={form[key]}
                onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              />
            </label>
          ))}

          <div className="md:col-span-2 rounded-lg border border-dashed border-blue-300 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">Vị trí trên bản đồ</p>
                <p className="mt-1 text-xs text-slate-500">
                  {form.lat && form.lng ? `Đã chọn: ${Number(form.lat).toFixed(6)}, ${Number(form.lng).toFixed(6)}` : "Chưa chọn vị trí"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMapPicker(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <MapPin className="h-4 w-4" /> Chọn vị trí trên bản đồ
              </button>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Lưu nhà trọ</button>
          </div>
        </form>
      )}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500">Chưa có dữ liệu nhà trọ.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr><th className="p-4">Cơ sở</th><th className="p-4">Địa chỉ</th><th className="p-4">Quy mô</th><th className="p-4">Trạng thái</th><th className="p-4" /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row._id}>
                  <td className="p-4"><div className="flex items-center gap-2 font-semibold"><Building2 className="h-4 w-4 text-blue-600" />{row.name}</div><div className="text-xs text-slate-500">{row.owner_name || "Chưa cập nhật chủ trọ"}</div></td>
                  <td className="p-4 text-slate-600"><MapPin className="mr-1 inline h-3.5 w-3.5" />{row.address || "Chưa cập nhật"}<div className="text-xs">{row.tdp || "Chưa có TDP"}</div></td>
                  <td className="p-4">{row.total_rooms || 0} phòng / {row.current_tenants || 0} người</td>
                  <td className="p-4"><span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">{row.approval_status || "Pending"}</span></td>
                  <td className="p-4">{row.approval_status === "Pending" && <button type="button" onClick={async () => { await approveRental(row._id, "Approved"); await load(); }} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><ShieldCheck className="h-4 w-4" /> Duyệt</button>}</td>
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
