"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Search, Eye, Edit2, Trash2 } from "lucide-react";
import { Button, Modal, RiskBadge, Drawer } from "@/components/ui";
import {
  getBusinesses,
  createBusiness,
  updateBusiness,
  deleteBusiness,
} from "@/lib/actions/businesses";
import { IBusiness } from "@/lib/models";
import { BusinessForm } from "./components/BusinessForm";

const BUSINESS_TYPE_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "Karaoke", label: "Karaoke" },
  { value: "Nhà nghỉ", label: "Nhà nghỉ" },
  { value: "Pub/Bar", label: "Pub/Bar" },
  { value: "Tiệm cầm đồ", label: "Tiệm cầm đồ" },
];

export function BusinessList() {
  const [businesses, setBusinesses] = useState<IBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [isPending, startTransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<IBusiness | null>(null);
  const [viewingBusiness, setViewingBusiness] = useState<IBusiness | null>(null);

  const loadBusinesses = () => {
    startTransition(async () => {
      const data = await getBusinesses();
      setBusinesses(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadBusinesses();
  }, []);

  const filteredBusinesses = businesses.filter((b) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      b.name?.toLowerCase().includes(q) ||
      b.address?.toLowerCase().includes(q) ||
      b.owner_name?.toLowerCase().includes(q);
    const matchesType = !typeFilter || b.business_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleCreate = () => {
    setEditingBusiness(null);
    setIsModalOpen(true);
  };

  const handleEdit = (business: IBusiness) => {
    setEditingBusiness(business);
    setIsModalOpen(true);
  };

  const handleView = (business: IBusiness) => {
    setViewingBusiness(business);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa cơ sở này?")) return;
    await deleteBusiness(id.toString());
    loadBusinesses();
  };

  const handleSubmit = async (data: Partial<IBusiness>) => {
    if (editingBusiness?._id) {
      await updateBusiness(editingBusiness._id.toString(), data);
    } else {
      await createBusiness(data);
    }
    setIsModalOpen(false);
    loadBusinesses();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Cơ sở Kinh doanh Nguy cơ Cao
          </h1>
          <p className="text-slate-500 mt-1">
            Karaoke, Nhà nghỉ, Pub, Cầm đồ và các cơ sở tiềm ẩn nguy cơ
          </p>
        </div>
        <Button icon={Plus} onClick={handleCreate}>
          Thêm CSKD
        </Button>
      </div>

      {/* Toolbar */}
      <div className="table-toolbar">
        <div className="search-box">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, địa chỉ, chủ cơ sở..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-btns">
          {BUSINESS_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`filter-btn ${typeFilter === opt.value ? "active" : ""}`}
              onClick={() => setTypeFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Tên cơ sở</th>
              <th>Loại hình</th>
              <th>Chủ cơ sở</th>
              <th>SĐT</th>
              <th>Địa chỉ</th>
              <th>Mức độ nguy cơ</th>
              <th>Số kt</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading || isPending ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "40px" }}>
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : filteredBusinesses.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state">
                    <div>Chưa có dữ liệu. Nhấn <strong>Thêm CSKD</strong> để bắt đầu.</div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredBusinesses.map((b, i) => (
                <tr key={b._id?.toString()}>
                  <td style={{ color: "var(--text-2)" }}>{i + 1}</td>
                  <td><strong>{b.name}</strong></td>
                  <td><span style={{ fontSize: "0.78rem" }}>{b.business_type}</span></td>
                  <td>{b.owner_name || "—"}</td>
                  <td style={{ fontSize: "0.8rem" }}>{b.owner_phone || "—"}</td>
                  <td
                    style={{
                      maxWidth: "180px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={b.address}
                  >
                    {b.address}
                  </td>
                  <td>
                    <RiskBadge risk={b.risk_level || "Thấp"} />
                  </td>
                  <td style={{ textAlign: "center" }}>{b.inspection_count || 0}</td>
                  <td>
                    <div className="action-btns">
                      <div className="btn-icon" onClick={() => handleView(b)} title="Xem chi tiết">
                        <Eye className="w-4 h-4" />
                      </div>
                      <div className="btn-icon" onClick={() => handleEdit(b)} title="Chỉnh sửa">
                        <Edit2 className="w-4 h-4" />
                      </div>
                      <div className="btn-icon del" onClick={() => handleDelete(b._id!.toString())} title="Xoá">
                        <Trash2 className="w-4 h-4" />
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBusiness ? "Chỉnh sửa CSKD" : "Thêm Cơ sở Kinh doanh"}
        size="xl"
      >
        <BusinessForm
          business={editingBusiness}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Chi tiết Cơ sở Kinh doanh"
      >
        {viewingBusiness && <BusinessDetail business={viewingBusiness} />}
      </Drawer>
    </div>
  );
}

function BusinessDetail({ business }: { business: IBusiness }) {
  return (
    <div>
      <div className="detail-row">
        <span className="detail-label">Tên cơ sở</span>
        <span className="detail-val">{business.name}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Loại hình</span>
        <span className="detail-val">{business.business_type}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Địa chỉ</span>
        <span className="detail-val">{business.address}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Địa chỉ chi tiết</span>
        <span className="detail-val">{business.address_detail || "—"}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Mức độ nguy cơ</span>
        <span className="detail-val">
          <RiskBadge risk={business.risk_level || "Thấp"} />
        </span>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "10px 0" }} />

      <div className="detail-row">
        <span className="detail-label">Chủ cơ sở</span>
        <span className="detail-val">{business.owner_name || "—"}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">SĐT chủ</span>
        <span className="detail-val">{business.owner_phone || "—"}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">CMND/CCCD chủ</span>
        <span className="detail-val">{business.owner_id_card || "—"}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Giấy phép KD</span>
        <span className="detail-val">{business.license_number || "—"}</span>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "10px 0" }} />

      <div className="detail-row">
        <span className="detail-label">Giờ hoạt động</span>
        <span className="detail-val">{business.operation_hours || "—"}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Số nhân viên</span>
        <span className="detail-val">{business.num_staff ?? "—"}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Số lần kiểm tra</span>
        <span className="detail-val">{business.inspection_count ?? 0}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Kiểm tra gần nhất</span>
        <span className="detail-val">{business.last_inspection || "—"}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Vi phạm ghi nhận</span>
        <span className="detail-val">{business.violations || "—"}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Tọa độ GPS</span>
        <span className="detail-val">
          {business.lat ? `${business.lat.toFixed(6)}, ${business.lng?.toFixed(6)}` : "Chưa có"}
        </span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Ghi chú</span>
        <span className="detail-val">{business.notes || "—"}</span>
      </div>
    </div>
  );
}