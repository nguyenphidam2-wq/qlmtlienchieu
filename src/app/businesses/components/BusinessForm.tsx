"use client";

import { useState } from "react";
import { IBusiness } from "@/lib/models";
import { Button, Input, Textarea, Select } from "@/components/ui";

const BUSINESS_TYPE_OPTIONS = [
  { value: "Karaoke", label: "Karaoke" },
  { value: "Nhà nghỉ", label: "Nhà nghỉ / Khách sạn" },
  { value: "Pub/Bar", label: "Pub / Bar" },
  { value: "Tiệm cầm đồ", label: "Tiệm cầm đồ" },
  { value: "Quán bia/nhậu", label: "Quán bia / Nhậu" },
  { value: "Vũ trường", label: "Vũ trường" },
  { value: "Khác", label: "Khác" },
];

const RISK_LEVEL_OPTIONS = [
  { value: "Thấp", label: "Thấp" },
  { value: "Trung bình", label: "Trung bình" },
  { value: "Cao", label: "Cao" },
  { value: "Rất cao", label: "Rất cao" },
];

interface BusinessFormProps {
  business: IBusiness | null;
  onSubmit: (data: Partial<IBusiness>) => Promise<void>;
  onCancel: () => void;
}

export function BusinessForm({ business, onSubmit, onCancel }: BusinessFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: business?.name || "",
    business_type: business?.business_type || "Karaoke",
    address: business?.address || "",
    address_detail: business?.address_detail || "",
    owner_name: business?.owner_name || "",
    owner_phone: business?.owner_phone || "",
    owner_id_card: business?.owner_id_card || "",
    license_number: business?.license_number || "",
    operation_hours: business?.operation_hours || "",
    num_staff: business?.num_staff || 0,
    risk_level: business?.risk_level || "Trung bình",
    inspection_count: business?.inspection_count || 0,
    last_inspection: business?.last_inspection || "",
    violations: business?.violations || "",
    notes: business?.notes || "",
    lat: business?.lat || 0,
    lng: business?.lng || 0,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        num_staff: Number(formData.num_staff) || 0,
        inspection_count: Number(formData.inspection_count) || 0,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Basic Info */}
      <div className="form-section-title">Thông tin cơ bản</div>
      <div className="form-grid">
        <div className="form-col-full">
          <Input
            label="Tên cơ sở *"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <Select
          label="Loại hình *"
          name="business_type"
          value={formData.business_type}
          onChange={handleChange}
          options={BUSINESS_TYPE_OPTIONS}
          required
        />
        <Select
          label="Mức độ nguy cơ"
          name="risk_level"
          value={formData.risk_level}
          onChange={handleChange}
          options={RISK_LEVEL_OPTIONS}
        />
        <div className="form-col-full">
          <Input
            label="Địa chỉ *"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
        </div>
        <Input
          label="Vĩ độ (Latitude)"
          name="lat"
          type="number"
          step="any"
          value={formData.lat || ""}
          onChange={handleChange}
          placeholder="VD: 16.0745"
        />
        <Input
          label="Kinh độ (Longitude)"
          name="lng"
          type="number"
          step="any"
          value={formData.lng || ""}
          onChange={handleChange}
          placeholder="VD: 108.1385"
        />
        <div className="form-col-full">
          <Input
            label="Địa chỉ chi tiết"
            name="address_detail"
            value={formData.address_detail}
            onChange={handleChange}
            placeholder="Số phòng, tầng, ghi chú địa chỉ..."
          />
        </div>
      </div>

      {/* Owner Info */}
      <div className="form-section-title">Thông tin chủ cơ sở</div>
      <div className="form-grid">
        <Input
          label="Họ tên chủ / Người đứng đầu"
          name="owner_name"
          value={formData.owner_name}
          onChange={handleChange}
        />
        <Input
          label="Số điện thoại chủ"
          name="owner_phone"
          value={formData.owner_phone}
          onChange={handleChange}
          placeholder="VD: 0901234567"
        />
        <Input
          label="CMND/CCCD chủ"
          name="owner_id_card"
          value={formData.owner_id_card}
          onChange={handleChange}
        />
        <Input
          label="Giấy phép kinh doanh số"
          name="license_number"
          value={formData.license_number}
          onChange={handleChange}
        />
      </div>

      {/* Operations */}
      <div className="form-section-title">Thông tin hoạt động</div>
      <div className="form-grid">
        <Input
          label="Giờ hoạt động"
          name="operation_hours"
          value={formData.operation_hours}
          onChange={handleChange}
          placeholder="VD: 18:00 - 02:00"
        />
        <Input
          label="Số nhân viên"
          name="num_staff"
          type="number"
          min="0"
          value={formData.num_staff || ""}
          onChange={handleChange}
        />
        <Input
          label="Số lần kiểm tra"
          name="inspection_count"
          type="number"
          min="0"
          value={formData.inspection_count || ""}
          onChange={handleChange}
        />
        <Input
          label="Lần kt gần nhất"
          name="last_inspection"
          value={formData.last_inspection}
          onChange={handleChange}
          placeholder="VD: 15/03/2025"
        />
        <div className="form-col-full">
          <Textarea
            label="Vi phạm ghi nhận"
            name="violations"
            value={formData.violations}
            onChange={handleChange}
            rows={3}
          />
        </div>
        <div className="form-col-full">
          <Textarea
            label="Ghi chú"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={2}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Lưu dữ liệu
        </Button>
      </div>
    </form>
  );
}