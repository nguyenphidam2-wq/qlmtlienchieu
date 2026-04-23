"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Search, Eye, Edit2, Trash2 } from "lucide-react";
import { Button, Input, Modal, StatusBadge, SubjectTypeBadge, Drawer } from "@/components/ui";
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "@/lib/actions/subjects";
import { ISubject } from "@/lib/models";
import { SubjectForm } from "./components/SubjectForm";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "Nghiện", label: "Nghiện", color: "var(--danger)" },
  { value: "Sử dụng", label: "Sử dụng", color: "var(--warning)" },
  { value: "Sau cai", label: "Sau cai", color: "var(--success)" },
  { value: "Khởi tố", label: "Khởi tố", color: "var(--purple)" },
];

export function SubjectList() {
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isPending, startTransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<ISubject | null>(null);
  const [viewingSubject, setViewingSubject] = useState<ISubject | null>(null);

  const loadSubjects = () => {
    startTransition(async () => {
      const data = await getSubjects(statusFilter || undefined);
      setSubjects(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadSubjects();
  }, [statusFilter]);

  const filteredSubjects = subjects.filter((s) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      s.full_name?.toLowerCase().includes(q) ||
      s.alias?.toLowerCase().includes(q) ||
      s.id_card?.includes(q) ||
      s.tdp?.includes(q) ||
      s.address_permanent?.toLowerCase().includes(q)
    );
  });

  const handleCreate = () => {
    setEditingSubject(null);
    setIsModalOpen(true);
  };

  const handleEdit = (subject: ISubject) => {
    setEditingSubject(subject);
    setIsModalOpen(true);
  };

  const handleView = (subject: ISubject) => {
    setViewingSubject(subject);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa đối tượng này?")) return;
    await deleteSubject(id.toString());
    loadSubjects();
  };

  const handleSubmit = async (data: Partial<ISubject>) => {
    if (editingSubject?._id) {
      await updateSubject(editingSubject._id.toString(), data);
    } else {
      await createSubject(data);
    }
    setIsModalOpen(false);
    loadSubjects();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Quản lý Đối tượng Ma túy
          </h1>
          <p className="text-slate-500 mt-1">
            Danh sách và thông tin đầy đủ về các đối tượng
          </p>
        </div>
        <Button icon={Plus} onClick={handleCreate}>
          Thêm đối tượng
        </Button>
      </div>

      {/* Toolbar */}
      <div className="table-toolbar">
        <div className="search-box">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, CMND, địa chỉ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-btns">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`filter-btn ${statusFilter === opt.value ? "active" : ""}`}
              onClick={() => setStatusFilter(opt.value)}
              style={
                opt.value && statusFilter === opt.value
                  ? { color: opt.color }
                  : {}
              }
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
              <th>Họ và tên</th>
              <th>Năm sinh</th>
              <th>Giới tính</th>
              <th>CMND/CCCD</th>
              <th>Loại MT</th>
              <th>Địa chỉ cư trú</th>
              <th>Tình trạng</th>
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
            ) : filteredSubjects.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state">
                    <div>Chưa có dữ liệu. Nhấn <strong>Thêm đối tượng</strong> để bắt đầu.</div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredSubjects.map((s, i) => (
                <tr key={s._id?.toString()}>
                  <td style={{ color: "var(--text-2)" }}>{i + 1}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {s.face_image_url ? (
                        <img
                          src={s.face_image_url}
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "1px solid var(--border)",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: "#f1f5f9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          👤
                        </div>
                      )}
                      <div>
                        <strong>{s.full_name}</strong>
                        {s.alias && (
                          <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                            {s.alias}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{s.dob || s.yob || "—"}</td>
                  <td>{s.gender || "—"}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                    {s.id_card || "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      {s.is_criminal === 1 && (
                        <SubjectTypeBadge type="is_criminal" value={1} />
                      )}
                      {s.is_drug === 1 && (
                        <SubjectTypeBadge type="is_drug" value={1} />
                      )}
                      {s.is_economic === 1 && (
                        <SubjectTypeBadge type="is_economic" value={1} />
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: "0.85rem" }}>
                    {s.tdp ? `Tổ ${s.tdp}` : "—"}
                  </td>
                  <td>
                    {s.status && <StatusBadge status={s.status} />}
                  </td>
                  <td>
                    <div className="action-btns">
                      <div className="btn-icon" onClick={() => handleView(s)} title="Xem chi tiết">
                        <Eye className="w-4 h-4" />
                      </div>
                      <div className="btn-icon" onClick={() => handleEdit(s)} title="Chỉnh sửa">
                        <Edit2 className="w-4 h-4" />
                      </div>
                      <div className="btn-icon del" onClick={() => handleDelete(s._id!.toString())} title="Xoá">
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
        title={editingSubject ? "Chỉnh sửa Đối tượng" : "Thêm Đối tượng Mới"}
        size="xl"
      >
        <SubjectForm
          subject={editingSubject}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Chi tiết Đối tượng"
        size="xl"
      >
        {viewingSubject && (
          <SubjectDetail subject={viewingSubject} />
        )}
      </Modal>
    </div>
  );
}

function SubjectDetail({ subject }: { subject: ISubject }) {
  return (
    <div className="text-sm">
      {/* Images */}
      {(subject.face_image_url || subject.house_image_url || (subject.subject_images?.length ?? 0) > 0) && (
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {subject.face_image_url && (
            <div className="text-center">
              <img
                src={subject.face_image_url}
                className="h-36 w-auto rounded-xl border-2 border-blue-500 object-cover"
                alt="Face"
              />
              <div className="text-xs text-blue-600 mt-1 font-semibold">ẢNH CHÂN DUNG</div>
            </div>
          )}
          {subject.subject_images?.map((img, i) => (
            <img
              key={i}
              src={img}
              className="h-36 w-auto rounded-lg border border-slate-300 object-cover"
              alt={`Subject ${i + 1}`}
            />
          ))}
          {subject.house_image_url && (
            <img
              src={subject.house_image_url}
              className="h-36 w-auto rounded-lg border border-slate-300 object-cover"
              alt="House"
            />
          )}
        </div>
      )}

      {/* Personal Info Section */}
      <div className="mb-6">
        <h4 className="text-base font-bold text-slate-800 dark:text-white mb-3 pb-2 border-b-2 border-slate-200 dark:border-slate-700 uppercase tracking-wide">
          Thông tin cá nhân
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex justify-between py-2 border-b border-dashed border-slate-200 dark:border-slate-700">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Họ và tên</span>
            <span className="font-bold text-slate-900 dark:text-white text-right">{subject.full_name}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-dashed border-slate-200 dark:border-slate-700">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Năm sinh</span>
            <span className="font-medium text-slate-900 dark:text-white">{subject.yob}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-dashed border-slate-200 dark:border-slate-700">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Giới tính</span>
            <span className="font-medium text-slate-900 dark:text-white">{subject.gender || "—"}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-dashed border-slate-200 dark:border-slate-700">
            <span className="font-semibold text-slate-600 dark:text-slate-400">CMND/CCCD</span>
            <span className="font-medium text-slate-900 dark:text-white font-mono">{subject.id_card || "—"}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-dashed border-slate-200 dark:border-slate-700">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Dân tộc</span>
            <span className="font-medium text-slate-900 dark:text-white">{subject.ethnicity || "—"}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-dashed border-slate-200 dark:border-slate-700">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Điện thoại</span>
            <span className="font-medium text-slate-900 dark:text-white">{subject.phone || "—"}</span>
          </div>
        </div>
      </div>

      {/* Family Info */}
      {(subject.father_name || subject.mother_name || subject.spouse_name) && (
        <div className="mb-6">
          <h4 className="text-base font-bold text-slate-800 dark:text-white mb-3 pb-2 border-b-2 border-slate-200 dark:border-slate-700 uppercase tracking-wide">
            Thông tin gia đình
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {subject.father_name && (
              <div className="flex justify-between py-2 border-b border-dashed border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Họ tên cha</span>
                <span className="font-medium text-slate-900 dark:text-white">{subject.father_name} ({subject.phone_father || "—"})</span>
              </div>
            )}
            {subject.mother_name && (
              <div className="flex justify-between py-2 border-b border-dashed border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Họ tên mẹ</span>
                <span className="font-medium text-slate-900 dark:text-white">{subject.mother_name} ({subject.phone_mother || "—"})</span>
              </div>
            )}
            {subject.spouse_name && (
              <div className="flex justify-between py-2 border-b border-dashed border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Vợ/Chồng</span>
                <span className="font-medium text-slate-900 dark:text-white">{subject.spouse_name} ({subject.phone_spouse || "—"})</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Location Info */}
      <div className="mb-6">
        <h4 className="text-base font-bold text-slate-800 dark:text-white mb-3 pb-2 border-b-2 border-slate-200 dark:border-slate-700 uppercase tracking-wide">
          Địa chỉ & TDP
        </h4>
        <div className="grid grid-cols-1 gap-2">
          <div className="flex justify-between py-2 border-b border-dashed border-slate-200 dark:border-slate-700">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Tổ dân phố</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{subject.tdp || "—"}</span>
          </div>
          <div className="py-2 border-b border-dashed border-slate-200 dark:border-slate-700">
            <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Thường trú</span>
            <span className="font-medium text-slate-900 dark:text-white text-sm">{subject.address_permanent || "—"}</span>
          </div>
          <div className="py-2 border-b border-dashed border-slate-200 dark:border-slate-700">
            <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Nơi ở hiện tại</span>
            <span className="font-medium text-slate-900 dark:text-white text-sm">{subject.address_current || "—"}</span>
          </div>
        </div>
      </div>

      {/* Classification */}
      <div className="mb-6">
        <h4 className="text-base font-bold text-slate-800 dark:text-white mb-3 pb-2 border-b-2 border-slate-200 dark:border-slate-700 uppercase tracking-wide">
          Phân loại đối tượng
        </h4>
        <div className="flex gap-2 flex-wrap mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${subject.is_criminal ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" : "bg-slate-100 text-slate-500"}`}>
            Hình sự
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${subject.is_drug ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" : "bg-slate-100 text-slate-500"}`}>
            Ma túy
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${subject.is_economic ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-slate-100 text-slate-500"}`}>
            Kinh tế
          </span>
        </div>

        {subject.is_drug === 1 && (
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="flex justify-between py-2 border-b border-dashed border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Tình trạng</span>
              <StatusBadge status={subject.status || ""} />
            </div>
            <div className="flex justify-between py-2 border-b border-dashed border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Loại ma túy</span>
              <span className="font-medium text-slate-900 dark:text-white">{subject.drug_type || "—"}</span>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      {(subject.processing_history || subject.criminal_record) && (
        <div className="mb-6">
          <h4 className="text-base font-bold text-slate-800 dark:text-white mb-3 pb-2 border-b-2 border-slate-200 dark:border-slate-700 uppercase tracking-wide">
            Lịch sử & Tiền án
          </h4>
          <div className="space-y-3">
            {subject.processing_history && (
              <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase">Lịch sử xử lý</span>
                <p className="text-slate-800 dark:text-slate-200 mt-1 text-sm leading-relaxed">{subject.processing_history}</p>
              </div>
            )}
            {subject.criminal_record && (
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <span className="font-semibold text-red-700 dark:text-red-300 text-xs uppercase">Tiền án</span>
                <p className="text-red-800 dark:text-red-200 mt-1 text-sm leading-relaxed">{subject.criminal_record}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Other Info */}
      <div className="mb-4">
        <h4 className="text-base font-bold text-slate-800 dark:text-white mb-3 pb-2 border-b-2 border-slate-200 dark:border-slate-700 uppercase tracking-wide">
          Thông tin khác
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {subject.relationships && (
            <div className="flex justify-between py-2 border-b border-dashed border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Mối quan hệ</span>
              <span className="font-medium text-slate-900 dark:text-white text-right text-sm">{subject.relationships}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-b border-dashed border-slate-200 dark:border-slate-700">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Tọa độ GPS</span>
            <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
              {subject.lat ? `${subject.lat.toFixed(6)}, ${subject.lng?.toFixed(6)}` : "Chưa có"}
            </span>
          </div>
          {subject.notes && (
            <div className="py-2 border-b border-dashed border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Ghi chú</span>
              <span className="text-slate-700 dark:text-slate-300 text-sm">{subject.notes}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}