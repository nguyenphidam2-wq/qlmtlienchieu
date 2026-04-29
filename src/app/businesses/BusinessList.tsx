"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Search, Eye, Edit2, Trash2, CheckCircle, CheckSquare, Square } from "lucide-react";
import { Button, Modal, RiskBadge, Drawer } from "@/components/ui";
import {
  getBusinesses,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  approveBusiness,
  bulkApproveBusinesses,
} from "@/lib/actions/businesses";
import { getCurrentUserInfo } from "@/lib/actions/subjects";
import { IBusiness } from "@/lib/models";
import { BusinessForm } from "./components/BusinessForm";

const BUSINESS_TYPE_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "Karaoke", label: "Karaoke" },
  { value: "Nhà nghỉ", label: "Nhà nghỉ" },
  { value: "Pub/Bar", label: "Pub/Bar" },
  { value: "Tiệm cầm đồ", label: "Tiệm cầm đồ" },
];

// Các vai trò được phép tạo/sửa
const ALLOWED_ROLES_FOR_CREATE_UPDATE = ["admin", "leader", "officer"];

// Chỉ admin và leader được phép duyệt
const ALLOWED_ROLES_FOR_APPROVE = ["admin", "leader"];

// Chỉ admin được phép xóa
const ALLOWED_ROLES_FOR_DELETE = ["admin"];

export function BusinessList() {
  const [businesses, setBusinesses] = useState<IBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [isPending, startTransition] = useTransition();
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; role: string } | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<IBusiness | null>(null);
  const [viewingBusiness, setViewingBusiness] = useState<IBusiness | null>(null);

  // Lấy thông tin user hiện tại khi component mount
  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUserInfo();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  const loadBusinesses = () => {
    startTransition(async () => {
      // Admin và leader có thể xem tất cả (bao gồm Pending)
      const includePending = currentUser?.role === "admin" || currentUser?.role === "leader";
      const data = await getBusinesses(includePending);
      setBusinesses(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadBusinesses();
  }, [currentUser]);

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

  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredBusinesses.filter(b => b.approval_status === "Pending").length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredBusinesses.filter(b => b.approval_status === "Pending").map(b => b._id!.toString()));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Approval handlers
  const handleApprove = async (id: string) => {
    if (!confirm("Bạn có chắc muốn duyệt cơ sở này?")) return;
    const result = await approveBusiness(id.toString());
    if (!result.success) {
      alert(result.error || "Không thể duyệt cơ sở");
      return;
    }
    loadBusinesses();
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Bạn có chắc muốn duyệt ${selectedIds.length} cơ sở này không?`)) return;
    const result = await bulkApproveBusinesses(selectedIds);
    if (!result.success) {
      alert(result.error || "Không thể duyệt các cơ sở");
      return;
    }
    setSelectedIds([]);
    loadBusinesses();
  };

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
    const result = await deleteBusiness(id.toString());
    if (!result.success) {
      alert(result.error || "Không thể xóa cơ sở");
      return;
    }
    loadBusinesses();
  };

  const handleSubmit = async (data: Partial<IBusiness>) => {
    let result;
    if (editingBusiness?._id) {
      result = await updateBusiness(editingBusiness._id.toString(), data);
      if (!result.success) {
        alert(result.error || "Không thể cập nhật cơ sở");
        return;
      }
    } else {
      result = await createBusiness(data);
      if (!result.success) {
        alert(result.error || "Không thể tạo cơ sở mới");
        return;
      }
    }
    setIsModalOpen(false);
    loadBusinesses();
  };

  // Kiểm tra quyền
  const canCreate = currentUser && ALLOWED_ROLES_FOR_CREATE_UPDATE.includes(currentUser.role);
  const canEdit = currentUser && ALLOWED_ROLES_FOR_CREATE_UPDATE.includes(currentUser.role);
  const canDelete = currentUser && ALLOWED_ROLES_FOR_DELETE.includes(currentUser.role);
  const canApprove = currentUser && ALLOWED_ROLES_FOR_APPROVE.includes(currentUser.role);

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
        {canCreate && (
          <Button icon={Plus} onClick={handleCreate}>
            Thêm CSKD
          </Button>
        )}
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
        <div className="flex items-center gap-3">
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
          {canApprove && selectedIds.length > 0 && (
            <button
              onClick={handleBulkApprove}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Duyệt {selectedIds.length} mục đã chọn
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: "40px" }}>
                {canApprove && (
                  <button
                    onClick={toggleSelectAll}
                    className="p-1 hover:bg-slate-100 rounded transition-colors"
                    title="Chọn tất cả"
                  >
                    {selectedIds.length === filteredBusinesses.filter(b => b.approval_status === "Pending").length && filteredBusinesses.some(b => b.approval_status === "Pending") ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                )}
              </th>
              <th>#</th>
              <th>Tên cơ sở</th>
              <th>Loại hình</th>
              <th>Chủ cơ sở</th>
              <th>SĐT</th>
              <th>Địa chỉ</th>
              <th>Mức độ nguy cơ</th>
              <th>Số kt</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading || isPending ? (
              <tr>
                <td colSpan={11} style={{ textAlign: "center", padding: "40px" }}>
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : filteredBusinesses.length === 0 ? (
              <tr>
                <td colSpan={11}>
                  <div className="empty-state">
                    <div>Chưa có dữ liệu. Nhấn <strong>Thêm CSKD</strong> để bắt đầu.</div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredBusinesses.map((b, i) => (
                <tr key={b._id?.toString()}>
                  <td>
                    {canApprove && (
                      <button
                        onClick={() => toggleSelectOne(b._id!.toString())}
                        className="p-1 hover:bg-slate-100 rounded transition-colors"
                        disabled={b.approval_status !== "Pending"}
                      >
                        {b.approval_status === "Pending" ? (
                          selectedIds.includes(b._id!.toString()) ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )
                        ) : (
                          <CheckSquare className="w-4 h-4 text-slate-300 cursor-not-allowed" />
                        )}
                      </button>
                    )}
                  </td>
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
                    {b.approval_status === "Pending" ? (
                      <span style={{
                        fontSize: "0.7rem",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        background: "var(--warning-bg)",
                        color: "var(--warning)",
                        fontWeight: 600,
                      }}>
                        Chờ duyệt
                      </span>
                    ) : (
                      <span style={{
                        fontSize: "0.7rem",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        background: "var(--success-bg)",
                        color: "var(--success)",
                        fontWeight: 600,
                      }}>
                        Đã duyệt
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="action-btns">
                      <div className="btn-icon" onClick={() => handleView(b)} title="Xem chi tiết">
                        <Eye className="w-4 h-4" />
                      </div>
                      {canEdit && (
                        <div className="btn-icon" onClick={() => handleEdit(b)} title="Chỉnh sửa">
                          <Edit2 className="w-4 h-4" />
                        </div>
                      )}
                      {canApprove && b.approval_status === "Pending" && (
                        <div
                          className="btn-icon"
                          onClick={() => handleApprove(b._id!.toString())}
                          title="Duyệt cơ sở"
                          style={{ color: "var(--success)" }}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      )}
                      {canDelete && (
                        <div className="btn-icon del" onClick={() => handleDelete(b._id!.toString())} title="Xoá">
                          <Trash2 className="w-4 h-4" />
                        </div>
                      )}
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

      {/* Approval status in detail */}
      <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "10px 0" }} />
      <div className="detail-row">
        <span className="detail-label">Trạng thái</span>
        <span className="detail-val">
          {business.approval_status === "Pending" ? (
            <span style={{
              fontSize: "0.75rem",
              padding: "2px 8px",
              borderRadius: "10px",
              background: "var(--warning-bg)",
              color: "var(--warning)",
              fontWeight: 600,
            }}>
              Chờ duyệt
            </span>
          ) : (
            <span style={{
              fontSize: "0.75rem",
              padding: "2px 8px",
              borderRadius: "10px",
              background: "var(--success-bg)",
              color: "var(--success)",
              fontWeight: 600,
            }}>
              Đã duyệt
            </span>
          )}
        </span>
      </div>
    </div>
  );
}