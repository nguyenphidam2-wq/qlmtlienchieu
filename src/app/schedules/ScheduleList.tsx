"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  UserCheck,
  Shield,
  ChevronRight,
  Sparkles,
  Flame,
  Printer,
  CheckSquare,
  Square,
  AlertCircle,
  BarChart2,
} from "lucide-react";
import { getTestSchedules, getTestSchedule, createTestSchedule, updateParticipantResult } from "@/lib/actions/schedules";
import { getSubjects, getCurrentUserInfo } from "@/lib/actions/subjects";
import { getCustomZones } from "@/lib/actions/zones";

export function ScheduleList() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeSchedule, setActiveSchedule] = useState<any>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  // Form Create State
  const [createTitle, setCreateTitle] = useState("");
  const [createType, setCreateType] = useState<"Periodic" | "Adhoc" | "CallIn">("Periodic");
  const [createTestType, setCreateTestType] = useState<"UrinaryTest" | "RollCall" | "Interview">("UrinaryTest");
  const [createLocation, setCreateLocation] = useState("Trụ sở Công an phường Liên Chiểu");
  const [createDate, setCreateDate] = useState("");
  const [createOfficers, setCreateOfficers] = useState("CSKV Tổ 1-10, Cán bộ y tế CAP");
  const [createNotes, setCreateNotes] = useState("");

  // Subjects picker state
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [pickerTdpFilter, setPickerTdpFilter] = useState("");
  const [pickerStatusFilter, setPickerStatusFilter] = useState("");

  // Result entry state inside modal
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [resultVal, setResultVal] = useState<any>("Negative");
  const [selectedSubstances, setSelectedSubstances] = useState<string[]>([]);
  const [resultNotes, setResultNotes] = useState("");

  const [isPending, startTransition] = useTransition();

  const loadData = async () => {
    setLoading(true);
    const [scheds, subs, user] = await Promise.all([
      getTestSchedules(statusFilter),
      getSubjects(),
      getCurrentUserInfo(),
    ]);
    setSchedules(scheds);
    setAllSubjects(subs);
    setCurrentUser(user);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleOpenCreateModal = () => {
    const todayStr = new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16);
    setCreateTitle(`Kiểm tra test ma túy định kỳ Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`);
    setCreateDate(todayStr);
    setSelectedSubjectIds([]);
    setIsCreateModalOpen(true);
  };

  const handleToggleSelectSubject = (id: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredPickerSubjects.map((s) => s._id);
    const allSelected = filteredIds.every((id) => selectedSubjectIds.includes(id));

    if (allSelected) {
      setSelectedSubjectIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedSubjectIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSubjectIds.length === 0) {
      alert("Vui lòng chọn ít nhất 01 đối tượng vào danh sách kiểm tra!");
      return;
    }

    startTransition(async () => {
      const res = await createTestSchedule({
        title: createTitle,
        type: createType,
        test_type: createTestType,
        test_location: createLocation,
        scheduled_date: createDate,
        assigned_officers: createOfficers.split(",").map((s) => s.trim()),
        subject_ids: selectedSubjectIds,
        notes: createNotes,
      });

      if (res.success) {
        setIsCreateModalOpen(false);
        loadData();
      } else {
        alert("❌ Error: " + res.error);
      }
    });
  };

  const handleOpenResultModal = async (schedId: string) => {
    const full = await getTestSchedule(schedId);
    if (full) {
      setActiveSchedule(full);
      setIsResultModalOpen(true);
    }
  };

  const handleSaveParticipantResult = (participant: any) => {
    setSelectedParticipant(participant);
    setResultVal(participant.result === "Pending" ? "Negative" : participant.result);
    setSelectedSubstances(participant.substances_detected || []);
    setResultNotes(participant.notes || "");
  };

  const handleSubmitResultSave = () => {
    if (!activeSchedule || !selectedParticipant) return;

    startTransition(async () => {
      const res = await updateParticipantResult({
        schedule_id: activeSchedule._id,
        subject_id: selectedParticipant.subject_id,
        result: resultVal,
        substances_detected: resultVal === "Positive" ? selectedSubstances : [],
        notes: resultNotes,
        tested_by: currentUser?.username || "CSKV CAP",
      });

      if (res.success) {
        const updated = await getTestSchedule(activeSchedule._id);
        setActiveSchedule(updated);
        setSelectedParticipant(null);
        loadData();
      } else {
        alert("❌ Error: " + res.error);
      }
    });
  };

  const toggleSubstance = (sub: string) => {
    setSelectedSubstances((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  // Filtered picker subjects inside modal
  const filteredPickerSubjects = allSubjects.filter((s) => {
    if (pickerTdpFilter && s.tdp !== pickerTdpFilter) return false;
    if (pickerStatusFilter && s.status !== pickerStatusFilter) return false;
    return true;
  });

  // Filtered schedule list
  const filteredSchedules = schedules.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title?.toLowerCase().includes(q) ||
      s.test_location?.toLowerCase().includes(q)
    );
  });

  // Stats calculation
  const totalCount = schedules.length;
  const upcomingCount = schedules.filter((s) => s.status === "Upcoming").length;
  const inProgressCount = schedules.filter((s) => s.status === "In_Progress").length;
  const completedCount = schedules.filter((s) => s.status === "Completed").length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-300 text-sm font-semibold tracking-wide uppercase mb-1">
              <Shield className="w-4 h-4 text-blue-400" />
              Công an phường Liên Chiểu — Nghiệp vụ Ma túy
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Quản lý Lịch Kiểm danh, Kiểm diện & Thử test Ma túy
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Lập lịch triệu tập, giao việc cho CSKV kiểm tra định kỳ/đột xuất và tự động cập nhật kết quả xét nghiệm ma túy vào hồ sơ đối tượng.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-blue-900/50 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Lập Đợt Kiểm Tra Mới
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-700/60">
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10">
            <div className="text-slate-400 text-xs font-semibold">TỔNG SỐ ĐỢT</div>
            <div className="text-2xl font-black text-white mt-1">{totalCount}</div>
          </div>
          <div className="bg-amber-500/10 backdrop-blur-md rounded-xl p-3 border border-amber-500/20">
            <div className="text-amber-300 text-xs font-semibold">SẮP TỚI (SẮP DIỄN RA)</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{upcomingCount}</div>
          </div>
          <div className="bg-blue-500/10 backdrop-blur-md rounded-xl p-3 border border-blue-500/20">
            <div className="text-blue-300 text-xs font-semibold">ĐANG TIẾN HÀNH</div>
            <div className="text-2xl font-black text-blue-400 mt-1">{inProgressCount}</div>
          </div>
          <div className="bg-emerald-500/10 backdrop-blur-md rounded-xl p-3 border border-emerald-500/20">
            <div className="text-emerald-300 text-xs font-semibold">ĐÃ HOÀN THÀNH</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{completedCount}</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "All", label: "Tất cả đợt" },
            { id: "Upcoming", label: "Sắp tới" },
            { id: "In_Progress", label: "Đang tiến hành" },
            { id: "Completed", label: "Đã hoàn thành" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm đợt theo tên, địa điểm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Schedule List Cards */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 animate-pulse">
          Đang nạp danh sách lịch kiểm tra...
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="text-slate-600 dark:text-slate-300 font-bold text-base">
            Chưa có đợt kiểm tra ma túy nào được lập.
          </div>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            Nhấn nút "Lập Đợt Kiểm Tra Mới" để lên danh sách triệu tập thử test định kỳ hoặc đột xuất cho các đối tượng trên địa bàn.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSchedules.map((sched) => {
            const total = sched.participants?.length || 0;
            const testedCount = sched.participants?.filter((p: any) => p.result !== "Pending").length || 0;
            const positiveCount = sched.participants?.filter((p: any) => p.result === "Positive").length || 0;
            const absentCount = sched.participants?.filter((p: any) => p.result === "Absent_Unexcused").length || 0;
            const percent = total > 0 ? Math.round((testedCount / total) * 100) : 0;

            const schedDate = new Date(sched.scheduled_date);
            const dateStr = schedDate.toLocaleDateString("vi-VN", {
              weekday: "long",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={sched._id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="inline-block bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full mb-1">
                        {sched.type === "Periodic" ? "Định kỳ hàng tháng" : sched.type === "Adhoc" ? "Đột xuất nghi vấn" : "Triệu tập tập trung"}
                      </span>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                        {sched.title}
                      </h3>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${
                        sched.status === "Completed"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : sched.status === "In_Progress"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 animate-pulse"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}
                    >
                      {sched.status === "Completed"
                        ? "Đã hoàn thành"
                        : sched.status === "In_Progress"
                        ? "Đang tiến hành"
                        : "Sắp tới"}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span className="font-medium text-slate-800 dark:text-slate-200">{dateStr}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      <span className="truncate">{sched.test_location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                      <span className="truncate">Cán bộ phụ trách: {sched.assigned_officers?.join(", ") || "CSKV Phường"}</span>
                    </div>
                  </div>

                  {/* Progress bar & Test Metrics */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Tiến độ thử test ({testedCount}/{total} đối tượng)
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{percent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      {positiveCount > 0 && (
                        <span className="bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> {positiveCount} Dương tính
                        </span>
                      )}
                      {absentCount > 0 && (
                        <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {absentCount} Vắng không phép
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {total} đối tượng trong danh sách
                  </div>
                  <button
                    onClick={() => handleOpenResultModal(sched._id)}
                    className="flex items-center gap-1.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    Ghi Nhận Kết Quả
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE SCHEDULE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Lập Đợt Kiểm Tra & Triệu Tập Thử Test Mới
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Lên danh sách triệu tập đối tượng và phân công CSKV phụ trách kiểm tra.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tên Đợt Kiểm Tra *
                  </label>
                  <input
                    type="text"
                    required
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hình thức kiểm tra *
                  </label>
                  <select
                    value={createType}
                    onChange={(e: any) => setCreateType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                  >
                    <option value="Periodic">Định kỳ hàng tháng / quý</option>
                    <option value="Adhoc">Đột xuất nghi vấn tái nghiện</option>
                    <option value="CallIn">Triệu tập tập trung</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Thời gian thực hiện *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={createDate}
                    onChange={(e) => setCreateDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Địa điểm tập trung / kiểm tra *
                  </label>
                  <input
                    type="text"
                    required
                    value={createLocation}
                    onChange={(e) => setCreateLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cán bộ / CSKV phụ trách đợt
                  </label>
                  <input
                    type="text"
                    value={createOfficers}
                    onChange={(e) => setCreateOfficers(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              {/* SUBJECTS SELECTION TABLE */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      Chọn đối tượng vào danh sách ({selectedSubjectIds.length} đã chọn)
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <select
                      value={pickerTdpFilter}
                      onChange={(e) => setPickerTdpFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700"
                    >
                      <option value="">Tất cả TDP</option>
                      {Array.from(new Set(allSubjects.map((s) => s.tdp).filter(Boolean))).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>

                    <select
                      value={pickerStatusFilter}
                      onChange={(e) => setPickerStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700"
                    >
                      <option value="">Tất cả tình trạng</option>
                      <option value="Sử dụng">Sử dụng</option>
                      <option value="Nghiện">Nghiện</option>
                      <option value="Sau cai">Sau cai</option>
                      <option value="Khởi tố">Khởi tố</option>
                      <option value="Thanh loại">Thanh loại</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="px-3 py-1.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold cursor-pointer hover:bg-blue-200"
                    >
                      Chọn tất cả ({filteredPickerSubjects.length})
                    </button>
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-2 space-y-1">
                  {filteredPickerSubjects.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      Không tìm thấy đối tượng nào theo bộ lọc.
                    </div>
                  ) : (
                    filteredPickerSubjects.map((s) => {
                      const isChecked = selectedSubjectIds.includes(s._id);
                      return (
                        <div
                          key={s._id}
                          onClick={() => handleToggleSelectSubject(s._id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                            isChecked
                              ? "bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 shadow-sm"
                              : "bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 hover:bg-slate-100/60"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white text-xs">
                                {s.full_name} ({s.dob || s.yob})
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {s.tdp || "Chưa xếp TDP"} • CCCD: {s.id_card || "—"}
                              </div>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                            {s.status}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  {isPending ? "Đang tạo đợt..." : "Xác nhận tạo đợt kiểm tra"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK RESULT ENTRY MODAL */}
      {isResultModalOpen && activeSchedule && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="inline-block bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full mb-1">
                  Checklist & Ghi nhận kết quả test
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {activeSchedule.title}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  📍 {activeSchedule.test_location} • 📅 {new Date(activeSchedule.scheduled_date).toLocaleString("vi-VN")}
                </p>
              </div>
              <button
                onClick={() => setIsResultModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Participants list with action buttons */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Danh sách đối tượng triệu tập ({activeSchedule.participants?.length || 0})
              </h3>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {activeSchedule.participants?.map((p: any) => {
                  const isCurrentSelected = selectedParticipant?.subject_id === p.subject_id;
                  return (
                    <div
                      key={p.subject_id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-3 ${
                        isCurrentSelected
                          ? "bg-blue-50/80 dark:bg-blue-950/50 border-blue-400 shadow-md"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                          {p.face_image_url ? (
                            <img src={p.face_image_url} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-bold">
                              👤
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {p.full_name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {p.tdp || "TDP"} • Trạng thái: <span className="font-semibold">{p.status_at_test}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            p.result === "Negative"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : p.result === "Positive"
                              ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 animate-pulse"
                              : p.result === "Absent_Unexcused"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {p.result === "Negative"
                            ? "🟢 Âm tính"
                            : p.result === "Positive"
                            ? `🔴 DƯƠNG TÍNH (${p.substances_detected?.join(", ") || "MET"})`
                            : p.result === "Absent_Excused"
                            ? "🟡 Vắng có lý do"
                            : p.result === "Absent_Unexcused"
                            ? "⚠️ Vắng KHÔNG lý do"
                            : p.result === "Refused"
                            ? "🛑 Từ chối test"
                            : "⏳ Chưa thử test"}
                        </span>

                        <button
                          onClick={() => handleSaveParticipantResult(p)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                        >
                          Cập nhật kết quả
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FORM UPDATE RESULT FOR SELECTED PARTICIPANT */}
            {selectedParticipant && (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 border-2 border-blue-400 dark:border-blue-600 space-y-4 shadow-lg animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-center border-b border-blue-200 dark:border-slate-700 pb-2">
                  <h4 className="font-extrabold text-blue-950 dark:text-blue-200 text-sm">
                    Ghi nhận kết quả cho: {selectedParticipant.full_name}
                  </h4>
                  <button
                    onClick={() => setSelectedParticipant(null)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Đóng form
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Kết quả kiểm tra / thử test:
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      { id: "Negative", label: "🟢 Âm tính (Chấp hành tốt)", cls: "bg-emerald-500 text-white" },
                      { id: "Positive", label: "🔴 DƯƠNG TÍNH (Tái nghiện)", cls: "bg-red-600 text-white" },
                      { id: "Absent_Excused", label: "🟡 Vắng có đơn xin phép", cls: "bg-amber-500 text-white" },
                      { id: "Absent_Unexcused", label: "⚠️ Vắng KHÔNG lý do", cls: "bg-orange-600 text-white" },
                      { id: "Refused", label: "🛑 Từ chối test / Chống đối", cls: "bg-purple-600 text-white" },
                    ].map((opt) => (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setResultVal(opt.id)}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-left ${
                          resultVal === opt.id
                            ? `${opt.cls} border-transparent shadow-md scale-[1.02]`
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* SUBSTANCE CHECKBOXES FOR POSITIVE */}
                  {resultVal === "Positive" && (
                    <div className="p-3 rounded-xl bg-red-100/70 dark:bg-red-950/60 border border-red-300 dark:border-red-800 space-y-2">
                      <label className="block text-xs font-extrabold text-red-900 dark:text-red-200">
                        Chọn loại ma túy phát hiện qua que thử:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {["MET (Ma túy đá)", "OPI (Heroin)", "THC (Cần sa)", "KET (Ketamine)", "MDMA (Thuốc lắc)"].map(
                          (sub) => {
                            const isSel = selectedSubstances.includes(sub);
                            return (
                              <button
                                type="button"
                                key={sub}
                                onClick={() => toggleSubstance(sub)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                                  isSel
                                    ? "bg-red-600 text-white shadow-sm"
                                    : "bg-white dark:bg-slate-900 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                                }`}
                              >
                                {sub}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Ghi chú / Nhận xét của Cảnh sát khu vực:
                    </label>
                    <input
                      type="text"
                      placeholder="Nhập nhận xét (e.g. Thái độ hợp tác tốt, thử que 4 chân âm tính...)"
                      value={resultNotes}
                      onChange={(e) => setResultNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSubmitResultSave}
                    disabled={isPending}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 cursor-pointer"
                  >
                    {isPending ? "Đang lưu..." : "💾 Lưu & Đẩy vào Hồ Sơ Đối Tượng"}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsResultModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
