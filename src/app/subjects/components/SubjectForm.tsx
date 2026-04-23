"use client";

import { useState, useRef, useCallback } from "react";
import { Button, Input, Textarea, Select } from "@/components/ui";
import { uploadFile } from "@/lib/actions/upload";
import dynamic from "next/dynamic";
import { Plus, Trash2, MapPin } from "lucide-react";

const MapPicker = dynamic(() => import("@/components/map/MapPicker"), { ssr: false });

const TDP_OPTIONS = [
  ...Array.from({ length: 83 }, (_, i) => ({ value: String(i + 1), label: `Tổ ${i + 1}` })),
  ...["Quan Nam 1", "Quan Nam 2", "Quan Nam 3", "Quan Nam 4", "Quan Nam 5", "Quan Nam 6"].map((t) => ({ value: t, label: t })),
  { value: "Hiền Phước", label: "Tổ Hiền Phước" },
  { value: "Hưởng Phước", label: "Tổ Hưởng Phước" },
  { value: "Trung Sơn", label: "Tổ Trung Sơn" },
  { value: "Tân Ninh", label: "Tổ Tân Ninh" },
  { value: "Vân Dương 1", label: "Tổ Vân Dương 1" },
  { value: "Vân Dương 2", label: "Tổ Vân Dương 2" },
];

const DRUG_OPTIONS = [
  { value: "OPI", label: "OPI (Opiate): Thuốc phiện, Heroin, Morphine" },
  { value: "MET", label: "MET (Methamphetamine): Ma túy đá" },
  { value: "MDMA", label: "MDMA: Thuốc lắc" },
  { value: "THC", label: "THC: Cần sa" },
  { value: "AMP", label: "AMP (Amphetamine): Hồng phiến" },
  { value: "KET", label: "KET (Ketamine): Ke" },
];

const RELATION_OPTIONS = [
  { value: "Cha", label: "Cha" },
  { value: "Mẹ", label: "Mẹ" },
  { value: "Vợ/Chồng", label: "Vợ/Chồng" },
  { value: "Con", label: "Con" },
  { value: "Anh", label: "Anh" },
  { value: "Chị", label: "Chị" },
  { value: "Em", label: "Em" },
];

const VIOLATION_ACTIONS = [
  { value: "Sử dụng", label: "Sử dụng" },
  { value: "Nghiện", label: "Nghiện" },
  { value: "Sau cai", label: "Sau cai" },
  { value: "Khác", label: "Khác (Nhập tự do)" }
];

interface ImagePreview { url: string; file?: File; isNew?: boolean; }

export function SubjectForm({ subject, onSubmit, onCancel }: any) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Core Data
  const [formData, setFormData] = useState({
    full_name: subject?.full_name || "",
    alias: subject?.alias || "",
    dob: subject?.dob || "",
    gender: subject?.gender || "Nam",
    id_card: subject?.id_card || "",
    phone: subject?.phone || "",
    ethnicity: subject?.ethnicity || "Kinh",
    job: subject?.job || "",
    education: subject?.education || "",
    pathology: subject?.pathology || "",
    health_status: subject?.health_status || "",
    
    tdp: subject?.tdp || "",
    address_permanent: subject?.address_permanent || "",
    address_current: subject?.address_current || "",
    lat: subject?.lat || 0,
    lng: subject?.lng || 0,

    notes: subject?.notes || "",
  });

  // Dynamic Arrays
  const [drugTypes, setDrugTypes] = useState<string[]>(subject?.drug_types_used || []);
  const [familyMembers, setFamilyMembers] = useState<any[]>(subject?.family_members || []);
  const [violations, setViolations] = useState<any[]>(subject?.violation_histories || []);

  // Image states
  const [faceImageUrl, setFaceImageUrl] = useState(subject?.face_image_url || "");
  const [houseImageUrl, setHouseImageUrl] = useState(subject?.house_image_url || "");
  const [subjectImages, setSubjectImages] = useState<ImagePreview[]>(
    subject?.subject_images?.map((url: string) => ({ url, isNew: false })) || []
  );

  const faceInputRef = useRef<HTMLInputElement>(null);
  const houseInputRef = useRef<HTMLInputElement>(null);
  const subjectImagesInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDrugToggle = (val: string) => {
    setDrugTypes(prev => prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val]);
  };

  // Family Handlers
  const addFamilyMember = () => {
    setFamilyMembers(prev => [...prev, { full_name: "", relation: "Cha", yob: "", address: "", phone: "" }]);
  };
  const updateFamilyMember = (index: number, field: string, value: string) => {
    const newMembers = [...familyMembers];
    newMembers[index][field] = value;
    setFamilyMembers(newMembers);
  };
  const removeFamilyMember = (index: number) => {
    setFamilyMembers(prev => prev.filter((_, i) => i !== index));
  };

  // Violation Handlers
  const addViolation = () => {
    setViolations(prev => [...prev, { action: "Sử dụng", date: "", decision_num_date: "", duration: "" }]);
  };
  const updateViolation = (index: number, field: string, value: string) => {
    const newV = [...violations];
    newV[index][field] = value;
    setViolations(newV);
  };
  const removeViolation = (index: number) => {
    setViolations(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setUploadingImages(true);
      try {
        if (type === "face") {
          const fd = new FormData(); fd.append("file", files[0]); fd.append("folder", "subjects/faces");
          const url = await uploadFile(fd, "subjects/faces");
          if (url) setFaceImageUrl(url);
        } else if (type === "house") {
          const fd = new FormData(); fd.append("file", files[0]); fd.append("folder", "subjects/houses");
          const url = await uploadFile(fd, "subjects/houses");
          if (url) setHouseImageUrl(url);
        } else if (type === "subject") {
          const newImages: ImagePreview[] = [];
          for (const file of Array.from(files)) {
            const fd = new FormData(); fd.append("file", file); fd.append("folder", "subjects/images");
            const url = await uploadFile(fd, "subjects/images");
            if (url) newImages.push({ url, file, isNew: true });
          }
          setSubjectImages((prev) => [...prev, ...newImages]);
        }
      } catch (error) {
        console.error("Upload error:", error);
        alert("Lỗi khi upload ảnh!");
      } finally {
        setUploadingImages(false);
      }
      e.target.value = "";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Auto-derive legacy specific status for Map markers based on violation history if not handled.
    // We will set status based on the latest violation's action, or just default.
    let derivedStatus = "Sử dụng";
    if (violations.length > 0) {
      const last = violations[violations.length - 1];
      if (["Nghiện", "Sử dụng", "Sau cai", "Khởi tố"].includes(last.action)) {
        derivedStatus = last.action;
      }
    }

    try {
      await onSubmit({
        ...formData,
        yob: formData.dob ? parseInt(formData.dob.split("/").pop() || "0") : 0,
        face_image_url: faceImageUrl || undefined,
        house_image_url: houseImageUrl || undefined,
        subject_images: subjectImages.map((img) => img.url),
        drug_types_used: drugTypes,
        family_members: familyMembers,
        violation_histories: violations,
        status: derivedStatus // for GIS map colors compatibility
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-10 max-w-5xl mx-auto">
      {/* 1. THONG TIN CA NHAN */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">👤 1. THÔNG TIN CÁ NHÂN</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            {/* Ảnh cá nhân thay vì upload rải rác */}
            <div className="w-full md:w-48 flex-shrink-0 flex flex-col items-center">
              <div
                onClick={() => faceInputRef.current?.click()}
                className="w-32 h-40 border-2 border-dashed border-slate-300 rounded-xl flex flex-col flex-shrink-0 items-center justify-center cursor-pointer overflow-hidden bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                {faceImageUrl ? (
                  <img src={faceImageUrl} className="w-full h-full object-cover" alt="Face" />
                ) : (
                  <>
                    <span className="text-3xl mb-1">📷</span>
                    <span className="text-[10px] text-slate-500 font-medium">Bấm tải ảnh</span>
                  </>
                )}
              </div>
              <input ref={faceInputRef} type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "face")} className="hidden" />
              {faceImageUrl && (
                <button type="button" onClick={() => setFaceImageUrl("")} className="text-xs text-red-500 mt-2 font-medium">✕ Xóa ảnh</button>
              )}
            </div>

            {/* Form Fields */}
            <div className="flex-1 form-grid grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input label="Họ và tên *" name="full_name" value={formData.full_name} onChange={handleChange} required />
              </div>
              <Input label="Tên gọi khác" name="alias" value={formData.alias} onChange={handleChange} />
              <Input label="Số định danh (CCCD)" name="id_card" value={formData.id_card} onChange={handleChange} />
              <Input label="Ngày sinh (dd/mm/yyyy)" name="dob" value={formData.dob} onChange={handleChange} placeholder="VD: 15/05/1995" />
              <Select label="Giới tính" name="gender" value={formData.gender} onChange={handleChange} options={[{ value: "Nam", label: "Nam" }, { value: "Nữ", label: "Nữ" }]} />
              <Input label="Nghề nghiệp" name="job" value={formData.job} onChange={handleChange} />
              <Input label="Học vấn" name="education" value={formData.education} onChange={handleChange} />
              <Input label="Bệnh lý" name="pathology" value={formData.pathology} onChange={handleChange} />
              <Input label="Tình trạng sức khỏe" name="health_status" value={formData.health_status} onChange={handleChange} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. MA TUY */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">💊 2. LOẠI MA TÚY SỬ DỤNG</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DRUG_OPTIONS.map((drug) => (
              <label key={drug.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${drugTypes.includes(drug.value) ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                <input 
                  type="checkbox" 
                  className="w-4 h-4 mt-0.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
                  checked={drugTypes.includes(drug.value)} 
                  onChange={() => handleDrugToggle(drug.value)} 
                />
                <span className="text-sm font-medium text-slate-700">{drug.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 3. THONG TIN CU TRU */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">🏠 3. THÔNG TIN CƯ TRÚ</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Tổ dân phố" name="tdp" value={formData.tdp} onChange={handleChange} options={[{ value: "", label: "-- Chọn Tổ dân phố --" }, ...TDP_OPTIONS]} />
            <Input label="Địa chỉ thường trú/tạm trú" name="address_permanent" value={formData.address_permanent} onChange={handleChange} placeholder="Số nhà, đường phố..." />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Nơi ở hiện tại</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="address_current"
                value={formData.address_current}
                onChange={handleChange}
                placeholder="Nhập nơi ở hiện tại..."
                className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              />
              <button 
                type="button" 
                onClick={() => setShowMapPicker(true)}
                className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-700 transition"
                title="Bản đồ"
              >
                <MapPin className="w-4 h-4" /> 📍 Gắn Tọa Độ 
              </button>
            </div>
            {formData.lat !== 0 && formData.lng !== 0 && (
              <div className="text-xs text-green-600 font-medium">✓ Đã gắn tọa độ: {formData.lat.toFixed(5)}, {formData.lng.toFixed(5)}</div>
            )}
          </div>
        </div>
      </div>

      {/* 4. GIA DINH */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">👨‍👩‍👧‍👦 4. QUAN HỆ GIA ĐÌNH</h3>
          <button type="button" onClick={addFamilyMember} className="flex items-center gap-1 text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors font-medium">
            <Plus className="w-4 h-4" /> Thêm người thân
          </button>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Họ và tên</th>
                <th className="px-4 py-3 font-semibold">Quan hệ</th>
                <th className="px-4 py-3 font-semibold">Sinh năm</th>
                <th className="px-4 py-3 font-semibold">Địa chỉ</th>
                <th className="px-4 py-3 font-semibold w-32">SĐT</th>
                <th className="px-4 py-3 font-semibold w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {familyMembers.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Chưa có dữ liệu người thân. Bấm "Thêm người thân" để bắt đầu.</td></tr>
              ) : familyMembers.map((member, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="p-2"><input className="w-full p-2 border rounded-md text-sm outline-none focus:border-blue-500" value={member.full_name} onChange={e => updateFamilyMember(idx, "full_name", e.target.value)} placeholder="Nhập tên..." /></td>
                  <td className="p-2">
                    <select className="w-full p-2 border rounded-md text-sm outline-none focus:border-blue-500 bg-white" value={member.relation} onChange={e => updateFamilyMember(idx, "relation", e.target.value)}>
                      {RELATION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </td>
                  <td className="p-2"><input className="w-24 p-2 border rounded-md text-sm outline-none focus:border-blue-500" value={member.yob} onChange={e => updateFamilyMember(idx, "yob", e.target.value)} placeholder="YYYY" /></td>
                  <td className="p-2"><input className="w-full min-w-[200px] p-2 border rounded-md text-sm outline-none focus:border-blue-500" value={member.address} onChange={e => updateFamilyMember(idx, "address", e.target.value)} placeholder="Số nhà, đường..." /></td>
                  <td className="p-2"><input className="w-full p-2 border rounded-md text-sm outline-none focus:border-blue-500" value={member.phone} onChange={e => updateFamilyMember(idx, "phone", e.target.value)} placeholder="09..." /></td>
                  <td className="p-2 text-center">
                    <button type="button" onClick={() => removeFamilyMember(idx)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. LICH SU VI PHAM */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">⚖️ 5. LỊCH SỬ VI PHẠM</h3>
          <button type="button" onClick={addViolation} className="flex items-center gap-1 text-sm bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg hover:bg-orange-200 transition-colors font-medium">
            <Plus className="w-4 h-4" /> Thêm vi phạm
          </button>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Hành vi vi phạm</th>
                <th className="px-4 py-3 font-semibold">Ngày vi phạm</th>
                <th className="px-4 py-3 font-semibold min-w-[200px]">Quyết định / Ngày (dd/mm/yyyy)</th>
                <th className="px-4 py-3 font-semibold min-w-[250px]">Thời hạn áp dụng</th>
                <th className="px-4 py-3 font-semibold w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {violations.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Chưa có dữ liệu vi phạm.</td></tr>
              ) : violations.map((v, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="p-2">
                    <div className="flex flex-col gap-1">
                      <select className="w-full p-2 border rounded-md text-sm outline-none focus:border-orange-500 bg-white" value={VIOLATION_ACTIONS.some(a => a.value === v.action) ? v.action : "Khác"} onChange={e => updateViolation(idx, "action", e.target.value === "Khác" ? "" : e.target.value)}>
                        {VIOLATION_ACTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                      {!VIOLATION_ACTIONS.some(a => a.value === v.action) && v.action !== "Sử dụng" && v.action !== "Nghiện" && v.action !== "Sau cai" && (
                        <input className="w-full p-2 border border-orange-300 rounded-md text-sm outline-none focus:border-orange-500 bg-orange-50/30" value={v.action} onChange={e => updateViolation(idx, "action", e.target.value)} placeholder="Nhập hành vi khác..." />
                      )}
                    </div>
                  </td>
                  <td className="p-2"><input className="w-32 p-2 border rounded-md text-sm outline-none focus:border-orange-500" value={v.date} onChange={e => updateViolation(idx, "date", e.target.value)} placeholder="dd/mm/yyyy" /></td>
                  <td className="p-2"><input className="w-full p-2 border rounded-md text-sm outline-none focus:border-orange-500" value={v.decision_num_date} onChange={e => updateViolation(idx, "decision_num_date", e.target.value)} placeholder="Số... ngày..." /></td>
                  <td className="p-2"><input className="w-full p-2 border rounded-md text-sm outline-none focus:border-orange-500" value={v.duration} onChange={e => updateViolation(idx, "duration", e.target.value)} placeholder="Từ ngày... đến ngày..." /></td>
                  <td className="p-2 text-center">
                    <button type="button" onClick={() => removeViolation(idx)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
        <Button type="button" variant="ghost" onClick={onCancel}>Thoát (Hủy bỏ)</Button>
        <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg shadow-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50">
          {isSubmitting ? "Đang lưu..." : "💾 LƯU HỒ SƠ ĐỐI TƯỢNG"}
        </button>
      </div>

      {showMapPicker && (
        <MapPicker 
          initialLat={formData.lat || undefined} 
          initialLng={formData.lng || undefined}
          onClose={() => setShowMapPicker(false)}
          onSelect={(lat, lng) => {
            setFormData(prev => ({ ...prev, lat, lng }));
            setShowMapPicker(false);
          }}
        />
      )}
    </form>
  );
}