"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Search, Eye, Edit2, Trash2, CheckCircle, CheckSquare, Square } from "lucide-react";
import { Button, Modal, StatusBadge } from "@/components/ui";
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getCurrentUserInfo,
  approveSubject,
  bulkApproveSubjects,
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

// Các vai trò được phép tạo/sửa đối tượng
const ALLOWED_ROLES_FOR_CREATE_UPDATE = ["admin", "leader", "officer"];

// Chỉ admin được phép xóa
const ALLOWED_ROLES_FOR_DELETE = ["admin"];

// Chỉ admin và leader được phép duyệt đối tượng
const ALLOWED_ROLES_FOR_APPROVE = ["admin", "leader"];

export function SubjectList() {
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isPending, startTransition] = useTransition();
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; role: string } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<ISubject | null>(null);
  const [viewingSubject, setViewingSubject] = useState<ISubject | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Lấy thông tin user hiện tại khi component mount
  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUserInfo();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  const loadSubjects = () => {
    startTransition(async () => {
      // Admin và leader có thể xem tất cả (bao gồm Pending)
      const includePending = currentUser?.role === "admin" || currentUser?.role === "leader";
      const data = await getSubjects(statusFilter || undefined, undefined, undefined, includePending);
      setSubjects(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadSubjects();
  }, [statusFilter, currentUser]);

  const filteredSubjects = subjects.filter((s) => {
    const q = searchQuery.toLowerCase();
    
    // Lọc theo tình trạng phê duyệt nếu chọn "Chờ duyệt"
    if (statusFilter === "Pending" && s.approval_status !== "Pending") return false;
    
    // Lọc theo tình trạng đối tượng (nếu không phải đang lọc Chờ duyệt)
    if (statusFilter && statusFilter !== "Pending" && s.status !== statusFilter) return false;

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
    const result = await deleteSubject(id.toString());
    if (!result.success) {
      alert(result.error || "Không thể xóa đối tượng");
      return;
    }
    loadSubjects();
  };

  const handleApprove = async (id: string) => {
    if (!confirm("Bạn có chắc muốn duyệt đối tượng này?")) return;
    const result = await approveSubject(id.toString());
    if (!result.success) {
      alert(result.error || "Không thể duyệt đối tượng");
      return;
    }
    loadSubjects();
  };

  // Bulk approve handlers
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Bạn có chắc muốn duyệt ${selectedIds.length} đối tượng này không?`)) return;
    const result = await bulkApproveSubjects(selectedIds);
    if (!result.success) {
      alert(result.error || "Không thể duyệt các đối tượng");
      return;
    }
    setSelectedIds([]);
    loadSubjects();
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredSubjects.filter(s => s.approval_status === "Pending").length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSubjects.filter(s => s.approval_status === "Pending").map(s => s._id!.toString()));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (data: Partial<ISubject>) => {
    if (editingSubject?._id) {
      const result = await updateSubject(editingSubject._id.toString(), data);
      if (!result.success) {
        alert(result.error || "Không thể cập nhật đối tượng");
        return;
      }
    } else {
      const result = await createSubject(data);
      if (!result.success) {
        alert(result.error || "Không thể tạo đối tượng mới");
        return;
      }
    }
    setIsModalOpen(false);
    loadSubjects();
  };

  // Kiểm tra quyền
  const canCreate = currentUser && ALLOWED_ROLES_FOR_CREATE_UPDATE.includes(currentUser.role);
  const canEdit = currentUser && ALLOWED_ROLES_FOR_CREATE_UPDATE.includes(currentUser.role);
  const canDelete = currentUser && ALLOWED_ROLES_FOR_DELETE.includes(currentUser.role);
  const canApprove = currentUser && ALLOWED_ROLES_FOR_APPROVE.includes(currentUser.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Quản lý Đối tượng
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Danh sách chi tiết các đối tượng trên địa bàn
          </p>
        </div>
        {canCreate && (
          <Button
            icon={Plus}
            onClick={handleCreate}
            className="w-full md:w-auto justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200"
          >
            Thêm đối tượng
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="search-box !flex-1 !min-w-0 !w-full">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo họ tên, CMND, địa chỉ..."
              className="bg-transparent border-none focus:ring-0 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {canApprove && selectedIds.length > 0 && (
            <button
              onClick={handleBulkApprove}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors whitespace-nowrap"
            >
              <CheckCircle className="w-4 h-4" />
              Duyệt {selectedIds.length} mục đã chọn
            </button>
          )}
        </div>
        <div className="flex overflow-x-auto pb-1 gap-2 custom-scrollbar">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                statusFilter === opt.value
                ? "bg-slate-900 text-white border-slate-900 shadow-md"
                : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
              }`}
              onClick={() => setStatusFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
          {canApprove && (
            <button
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
                statusFilter === "Pending"
                ? "bg-yellow-500 text-white border-yellow-500 shadow-md"
                : "bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100"
              }`}
              onClick={() => setStatusFilter("Pending")}
            >
              <div className={`w-2 h-2 rounded-full ${statusFilter === "Pending" ? "bg-white" : "bg-yellow-500"} animate-pulse`}></div>
              Chờ duyệt ({subjects.filter(s => s.approval_status === "Pending").length})
            </button>
          )}
          {canApprove && statusFilter === "Pending" && filteredSubjects.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="whitespace-nowrap px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors flex items-center gap-2"
            >
              {selectedIds.length === filteredSubjects.filter(s => s.approval_status === "Pending").length ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              Chọn tất cả
            </button>
          )}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block table-wrap">
        <table className="w-full">
          <thead>
            <tr>
              <th className="w-12">
                {canApprove && (
                  <button
                    onClick={toggleSelectAll}
                    className="p-1 hover:bg-slate-100 rounded transition-colors"
                    title="Chọn tất cả"
                  >
                    {selectedIds.length === filteredSubjects.filter(s => s.approval_status === "Pending").length && filteredSubjects.some(s => s.approval_status === "Pending") ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                )}
              </th>
              <th className="w-12">#</th>
              <th>Họ và tên</th>
              <th>Năm sinh</th>
              <th>Giới tính</th>
              <th>CMND/CCCD</th>
              <th>Loại ĐT</th>
              <th>Tổ dân phố</th>
              <th>Tình trạng</th>
              <th className="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading || isPending ? (
              <tr>
                <td colSpan={10} className="text-center py-20 text-slate-400">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    Đang tải dữ liệu...
                  </div>
                </td>
              </tr>
            ) : filteredSubjects.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-20 text-slate-400 italic">
                  Không tìm thấy đối tượng nào.
                </td>
              </tr>
            ) : (
              filteredSubjects.map((s, i) => (
                <tr key={s._id?.toString()} className="hover:bg-slate-50 transition-colors">
                  <td>
                    {canApprove && (
                      <button
                        onClick={() => toggleSelectOne(s._id!.toString())}
                        className="p-1 hover:bg-slate-100 rounded transition-colors"
                        disabled={s.approval_status !== "Pending"}
                      >
                        {s.approval_status === "Pending" ? (
                          selectedIds.includes(s._id!.toString()) ? (
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
                  <td className="text-slate-400 font-mono text-xs">{i + 1}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-slate-100 flex-shrink-0">
                        {s.face_image_url ? (
                          <img src={s.face_image_url} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">👤</div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white leading-tight">{s.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{s.alias || "Không có bí danh"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-sm">{s.dob || s.yob || "—"}</td>
                  <td className="text-sm">{s.gender || "—"}</td>
                  <td className="font-mono text-xs text-slate-500">{s.id_card || "—"}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {s.is_criminal === 1 && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded">HS</span>}
                      {s.is_drug === 1 && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded">MT</span>}
                      {s.is_economic === 1 && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded">KT</span>}
                    </div>
                  </td>
                  <td>
                    <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">
                      Tổ {s.tdp || "—"}
                    </span>
                  </td>
                  <td>
                    {s.status && <StatusBadge status={s.status} />}
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleView(s)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-blue-600 transition-all"><Eye className="w-4 h-4" /></button>
                      {canEdit && <button onClick={() => handleEdit(s)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-amber-50 text-amber-600 transition-all"><Edit2 className="w-4 h-4" /></button>}
                      {canApprove && s.approval_status === "Pending" && (
                        <button onClick={() => handleApprove(s._id!.toString())} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-green-50 text-green-600 transition-all" title="Duyệt đối tượng"><CheckCircle className="w-4 h-4" /></button>
                      )}
                      {canDelete && <button onClick={() => handleDelete(s._id!.toString())} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-600 transition-all"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {loading || isPending ? (
          <div className="text-center py-10 text-slate-400">Đang tải dữ liệu...</div>
        ) : filteredSubjects.length === 0 ? (
          <div className="text-center py-10 text-slate-400 italic">Không tìm thấy đối tượng nào.</div>
        ) : (
          filteredSubjects.map((s) => (
            <div key={s._id?.toString()} className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden group active:scale-[0.98] transition-transform">
               {/* Left accent */}
               <div className={`absolute top-0 left-0 w-1.5 h-full ${
                 s.status === 'Nghiện' ? 'bg-red-500' : 
                 s.status === 'Sử dụng' ? 'bg-amber-500' : 
                 s.status === 'Sau cai' ? 'bg-emerald-500' : 'bg-slate-400'
               }`}></div>

               {/* Mobile Selection Checkbox */}
               {canApprove && (
                 <div className="absolute top-4 right-4 z-10">
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       toggleSelectOne(s._id!.toString());
                     }}
                     className="p-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
                     disabled={s.approval_status !== "Pending"}
                   >
                     {s.approval_status === "Pending" ? (
                       selectedIds.includes(s._id!.toString()) ? (
                         <CheckSquare className="w-5 h-5 text-blue-600" />
                       ) : (
                         <Square className="w-5 h-5 text-slate-400" />
                       )
                     ) : (
                       <CheckSquare className="w-5 h-5 text-slate-200 cursor-not-allowed" />
                     )}
                   </button>
                 </div>
               )}

               <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl border-4 border-white dark:border-slate-700 shadow-md overflow-hidden bg-slate-100 flex-shrink-0">
                    {s.face_image_url ? (
                      <img src={s.face_image_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 text-2xl">👤</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                       <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">Tổ {s.tdp || "—"}</span>
                       <StatusBadge status={s.status || ""} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white truncate leading-tight">{s.full_name}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-2 italic">"{s.alias || "Không bí danh"}"</p>
                    
                    <div className="grid grid-cols-2 gap-y-2 mt-3 border-t border-slate-50 pt-3">
                       <div className="flex flex-col">
                         <span className="text-[10px] text-slate-400 uppercase font-bold">Năm sinh</span>
                         <span className="text-sm font-bold text-slate-700">{s.dob || s.yob || "—"}</span>
                       </div>
                       <div className="flex flex-col">
                         <span className="text-[10px] text-slate-400 uppercase font-bold">CCCD</span>
                         <span className="text-sm font-mono text-slate-700">{s.id_card || "—"}</span>
                       </div>
                    </div>
                  </div>
               </div>

               <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/50">
                  <div className="flex gap-1">
                    {s.is_criminal === 1 && <span className="px-2 py-1 bg-red-600 text-white text-[9px] font-black rounded-lg shadow-sm">HÌNH SỰ</span>}
                    {s.is_drug === 1 && <span className="px-2 py-1 bg-amber-500 text-white text-[9px] font-black rounded-lg shadow-sm">MA TÚY</span>}
                    {s.approval_status === "Pending" && <span className="px-2 py-1 bg-yellow-500 text-white text-[9px] font-black rounded-lg shadow-sm">CHỜ DUYỆT</span>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleView(s)} className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-colors"><Eye className="w-5 h-5" /></button>
                    {canEdit && <button onClick={() => handleEdit(s)} className="w-10 h-10 flex items-center justify-center bg-amber-50 text-amber-600 rounded-2xl hover:bg-amber-100 transition-colors"><Edit2 className="w-5 h-5" /></button>}
                    {canApprove && s.approval_status === "Pending" && (
                      <button onClick={() => handleApprove(s._id!.toString())} className="w-10 h-10 flex items-center justify-center bg-green-50 text-green-600 rounded-2xl hover:bg-green-100 transition-colors" title="Duyệt đối tượng"><CheckCircle className="w-5 h-5" /></button>
                    )}
                    {canDelete && <button onClick={() => handleDelete(s._id!.toString())} className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors"><Trash2 className="w-5 h-5" /></button>}
                  </div>
               </div>
            </div>
          ))
        )}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
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