import React from "react";
import { Activity, CalendarIcon, CheckCircle, Plus, Trash2, ChevronLeft, ChevronRight, RefreshCw, CheckSquare, Settings, Clock, Edit3, X, AlertTriangle, ClipboardList, MapPin, Briefcase, GraduationCap, Users, Video, LinkIcon, Tag, Archive, CalendarRange, Snowflake, History, FolderOpen, List } from "lucide-react";
import { generateId, formatLocalYMD, parseLocalYMD, generateCalendarDays, isRoutineActiveOnDate, isScheduleOnDate, updateGlobalResources, uploadFileToBackend } from "../../lib/lifeosUtils";
import { ConfirmationModal } from "../../components/shared";
import { EditReferenceModal, AddTodoModal, ActivityLogModal, FreezeRoutineModal, FreezeHistoryModal } from "./components/PlannerModals";
import { ResourceAIModal, ResourceInputSection, ResourceListTable } from "../resources/ResourceComponents";

export const EnhancedCalendar = ({
  currentDate,
  setCurrentDate,
  schedules,
  todos,
  routines,
  projectTasks,
  isDarkMode,
}) => {
  const [viewDate, setViewDate] = React.useState(new Date(currentDate));
  const days = generateCalendarDays(
    viewDate.getFullYear(),
    viewDate.getMonth(),
  );
  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const changeMonth = (offset) =>
    setViewDate(
      new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1),
    );

  const getDayIndicators = (day) => {
    if (!day)
      return {
        hasSchedule: false,
        hasTodo: false,
        hasRoutine: false,
        hasProdTask: false,
      };

    const currentCheckDate = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth(),
      day,
    );
    const dateStr = formatLocalYMD(currentCheckDate);

    const hasSchedule = schedules.some((s) => {
      const start = s.startDate || s.date;
      const end = s.endDate || s.date;
      return dateStr >= start && dateStr <= end;
    });

    const hasTodo = todos.some((t) => {
      const tDate = new Date(t.date);
      return formatLocalYMD(tDate) === dateStr && !t.completed;
    });

    const hasRoutine = routines.some((r) =>
      isRoutineActiveOnDate(r, currentCheckDate),
    );

    const hasProdTask =
      projectTasks &&
      projectTasks.some((t) => t.dueDate === dateStr && !t.completed);

    return { hasSchedule, hasTodo, hasRoutine, hasProdTask };
  };

  return (
    <div
      className={`p-6 rounded-[2.5rem] shadow-sm border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3
          className={`text-lg font-extrabold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}
        >
          {monthNames[viewDate.getMonth()]}{" "}
          <span className="text-indigo-600">{viewDate.getFullYear()}</span>
        </h3>
        <div
          className={`flex gap-1 p-1 rounded-xl ${isDarkMode ? "bg-slate-700" : "bg-slate-50"}`}
        >
          <button
            onClick={() => changeMonth(-1)}
            className={`p-2 rounded-lg transition-all ${isDarkMode ? "hover:bg-slate-600 text-slate-300" : "hover:bg-white hover:shadow-sm text-slate-600"}`}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => changeMonth(1)}
            className={`p-2 rounded-lg transition-all ${isDarkMode ? "hover:bg-slate-600 text-slate-300" : "hover:bg-white hover:shadow-sm text-slate-600"}`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["M", "S", "S", "R", "K", "J", "S"].map((d, i) => (
          <div
            key={i}
            className={`text-center text-[10px] font-bold uppercase py-2 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day, i) => {
          const isSelected =
            day &&
            currentDate.getDate() === day &&
            currentDate.getMonth() === viewDate.getMonth() &&
            currentDate.getFullYear() === viewDate.getFullYear();
          const isToday =
            day &&
            new Date().getDate() === day &&
            new Date().getMonth() === viewDate.getMonth() &&
            new Date().getFullYear() === viewDate.getFullYear();

          const { hasSchedule, hasTodo, hasRoutine, hasProdTask } =
            getDayIndicators(day);

          return (
            <div key={i} className="aspect-square relative">
              {day && (
                <button
                  onClick={() =>
                    setCurrentDate(
                      new Date(
                        viewDate.getFullYear(),
                        viewDate.getMonth(),
                        day,
                      ),
                    )
                  }
                  className={`w-full h-full rounded-2xl flex flex-col items-center justify-center transition-all border ${isSelected ? "bg-indigo-600 text-white shadow-lg border-indigo-600 scale-105 z-10" : isToday ? (isDarkMode ? "bg-slate-700 border-indigo-400 text-indigo-400 font-bold" : "bg-white border-indigo-200 text-indigo-600 font-bold") : isDarkMode ? "bg-slate-800 border-transparent hover:bg-slate-700 text-slate-300" : "bg-white border-transparent hover:bg-slate-50 text-slate-600"}`}
                >
                  <span
                    className={`text-sm ${isSelected ? "font-bold" : "font-medium"}`}
                  >
                    {day}
                  </span>
                  <div className="flex gap-0.5 mt-1 h-1.5 justify-center">
                    {hasRoutine && (
                      <div
                        className="w-1.5 h-1.5 rounded-full bg-purple-500"
                        title="Rutinitas"
                      ></div>
                    )}
                    {hasSchedule && (
                      <div
                        className="w-1.5 h-1.5 rounded-full bg-blue-500"
                        title="Agenda"
                      ></div>
                    )}
                    {hasTodo && (
                      <div
                        className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                        title="Todo"
                      ></div>
                    )}
                    {hasProdTask && (
                      <div
                        className="w-1.5 h-1.5 rounded-full bg-orange-500"
                        title="Task/Action"
                      ></div>
                    )}
                  </div>
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div
        className={`mt-6 p-4 rounded-2xl flex flex-wrap justify-center gap-4 text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? "bg-slate-700 text-slate-300" : "bg-slate-50 text-slate-500"} border border-slate-100/10`}
      >
        <span className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
          Rutinitas
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>Agenda
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>Todo
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
          Task/Action
        </span>
      </div>
    </div>
  );
};

// 5.2. Komponen: Manajer Jadwal (Agenda)
// Menangani pembuatan, pengeditan, dan penghapusan event/jadwal
export const ScheduleManager = ({
  schedules,
  setSchedules,
  role,
  agendaTypes,
  isDarkMode,
  editTarget,
  setEditTarget,
}) => {
  const [newSchedule, setNewSchedule] = React.useState({
    title: "",
    startDate: formatLocalYMD(new Date()),
    endDate: formatLocalYMD(new Date()),
    startTime: "",
    endTime: "",
    isAllDay: false,
    type: agendaTypes[0] || "Meeting",
    location: "",
    media: "",
  });
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState(null);
  const [deleteModal, setDeleteModal] = React.useState({ show: false, item: null });
  const canEdit = role !== "viewer";

  React.useEffect(() => {
    if (editTarget) {
      setNewSchedule({
        ...editTarget,
        startDate: editTarget.startDate || editTarget.date,
        endDate: editTarget.endDate || editTarget.date,
        startTime: editTarget.startTime || editTarget.time,
        endTime: editTarget.endTime || "",
        isAllDay: editTarget.isAllDay || false,
      });
      setEditingId(editTarget.id);
      setIsFormOpen(true);
      setEditTarget(null);
    }
  }, [editTarget, setEditTarget]);

  const handleSaveSchedule = (e) => {
    e.preventDefault();
    if (!newSchedule.title || !newSchedule.startDate)
      return alert("Judul dan Tanggal Mulai wajib diisi.");

    let finalEndDate = newSchedule.endDate;
    if (!finalEndDate || finalEndDate < newSchedule.startDate)
      finalEndDate = newSchedule.startDate;

    if (editingId) {
      setSchedules((prev) =>
        prev.map((s) =>
          s.id === editingId
            ? { ...newSchedule, endDate: finalEndDate, id: editingId }
            : s,
        ),
      );
      setEditingId(null);
    } else {
      setSchedules((prev) => [
        ...prev,
        { id: `sch-${Date.now()}`, ...newSchedule, endDate: finalEndDate },
      ]);
    }

    setNewSchedule({
      title: "",
      startDate: formatLocalYMD(new Date()),
      endDate: formatLocalYMD(new Date()),
      startTime: "",
      endTime: "",
      isAllDay: false,
      type: agendaTypes[0] || "Meeting",
      location: "",
      media: "",
    });
    setIsFormOpen(false);
  };

  const startEdit = (schedule) => {
    setNewSchedule({
      ...schedule,
      startDate: schedule.startDate || schedule.date,
      endDate: schedule.endDate || schedule.date,
      startTime: schedule.startTime || schedule.time,
      endTime: schedule.endTime || "",
      isAllDay: schedule.isAllDay || false,
    });
    setEditingId(schedule.id);
    setIsFormOpen(true);
  };

  const confirmDelete = () => {
    setSchedules(schedules.filter((s) => s.id !== deleteModal.item.id));
    setDeleteModal({ show: false, item: null });
  };

  const sortedSchedules = [...schedules].sort(
    (a, b) => new Date(a.startDate || a.date) - new Date(b.startDate || b.date),
  );

  return (
    <div
      className={`p-8 rounded-[2.5rem] shadow-sm border h-full ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
    >
      <ConfirmationModal
        isOpen={deleteModal.show}
        onClose={() => setDeleteModal({ show: false, item: null })}
        onConfirm={confirmDelete}
        title="Hapus Jadwal?"
        message="Anda yakin ingin menghapus jadwal ini?"
        itemName={deleteModal.item?.title}
      />

      <div className="flex justify-between items-center mb-8">
        <div>
          <h3
            className={`text-2xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            Agenda
          </h3>
          <p
            className={`text-sm mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
          >
            Atur janji temu dan kegiatan berwaktu.
          </p>
        </div>
        {canEdit && !isFormOpen && (
          <button
            onClick={() => {
              setIsFormOpen(true);
              setEditingId(null);
              setNewSchedule({
                title: "",
                startDate: formatLocalYMD(new Date()),
                endDate: formatLocalYMD(new Date()),
                startTime: "",
                endTime: "",
                isAllDay: false,
                type: agendaTypes[0] || "Meeting",
                location: "",
                media: "",
              });
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg transition-all"
          >
            <Plus size={18} /> Tambah
          </button>
        )}
      </div>

      {canEdit && isFormOpen && (
        <form
          onSubmit={handleSaveSchedule}
          className={`p-6 rounded-3xl mb-8 border shadow-inner animate-in slide-in-from-top-2 ${isDarkMode ? "bg-slate-700 border-slate-600" : "bg-slate-50 border-slate-100"}`}
        >
          <div className="flex justify-between mb-4">
            <h4
              className={`font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
            >
              {editingId ? "Ubah Agenda" : "Tambah Agenda"}
            </h4>
            <button type="button" onClick={() => setIsFormOpen(false)}>
              <X
                size={20}
                className={isDarkMode ? "text-white" : "text-slate-900"}
              />
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase pl-1">
                  Nama Kegiatan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Meeting Klien"
                  className={`w-full px-4 py-3 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? "bg-slate-600 text-white placeholder-slate-400" : "bg-white text-slate-900"}`}
                  value={newSchedule.title}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase pl-1">
                  Tipe
                </label>
                <select
                  className={`w-full px-4 py-3 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? "bg-slate-600 text-white" : "bg-white text-slate-900"}`}
                  value={newSchedule.type}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, type: e.target.value })
                  }
                >
                  {agendaTypes.map((type, idx) => (
                    <option key={idx} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase pl-1 flex items-center gap-2">
                  <CalendarIcon size={12} /> Tanggal Mulai
                </label>
                <input
                  type="date"
                  className={`w-full px-4 py-3 rounded-2xl border-none shadow-sm text-sm ${isDarkMode ? "bg-slate-600 text-white" : "bg-white text-slate-900"}`}
                  value={newSchedule.startDate}
                  onChange={(e) =>
                    setNewSchedule({
                      ...newSchedule,
                      startDate: e.target.value,
                      endDate:
                        e.target.value > newSchedule.endDate
                          ? e.target.value
                          : newSchedule.endDate,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase pl-1 flex items-center gap-2">
                  <CalendarIcon size={12} /> Tanggal Selesai (Opsional)
                </label>
                <input
                  type="date"
                  min={newSchedule.startDate}
                  className={`w-full px-4 py-3 rounded-2xl border-none shadow-sm text-sm ${isDarkMode ? "bg-slate-600 text-white" : "bg-white text-slate-900"}`}
                  value={newSchedule.endDate}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, endDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  id="allDay"
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                  checked={newSchedule.isAllDay}
                  onChange={(e) =>
                    setNewSchedule({
                      ...newSchedule,
                      isAllDay: e.target.checked,
                    })
                  }
                />
                <label
                  htmlFor="allDay"
                  className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-slate-700"}`}
                >
                  Sepanjang Hari (All Day)
                </label>
              </div>
              {!newSchedule.isAllDay && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase pl-1 flex items-center gap-2">
                      <Clock size={12} /> Jam Mulai
                    </label>
                    <input
                      type="time"
                      className={`w-full px-4 py-3 rounded-2xl border-none shadow-sm text-sm ${isDarkMode ? "bg-slate-600 text-white" : "bg-white text-slate-900"}`}
                      value={newSchedule.startTime}
                      onChange={(e) =>
                        setNewSchedule({
                          ...newSchedule,
                          startTime: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase pl-1 flex items-center gap-2">
                      <Clock size={12} /> Jam Selesai (Opsional)
                    </label>
                    <input
                      type="time"
                      className={`w-full px-4 py-3 rounded-2xl border-none shadow-sm text-sm ${isDarkMode ? "bg-slate-600 text-white" : "bg-white text-slate-900"}`}
                      value={newSchedule.endTime}
                      onChange={(e) =>
                        setNewSchedule({
                          ...newSchedule,
                          endTime: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-6 space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase pl-1">
                  Lokasi
                </label>
                <div className="relative">
                  <MapPin
                    size={16}
                    className="absolute left-4 top-4 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Kantor / Jakarta"
                    className={`w-full pl-10 pr-4 py-3 rounded-2xl border-none shadow-sm text-sm ${isDarkMode ? "bg-slate-600 text-white placeholder-slate-400" : "bg-white text-slate-900"}`}
                    value={newSchedule.location}
                    onChange={(e) =>
                      setNewSchedule({
                        ...newSchedule,
                        location: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="md:col-span-6 space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase pl-1">
                  Media / Link (Opsional)
                </label>
                <div className="relative">
                  <Video
                    size={16}
                    className="absolute left-4 top-4 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Link Media"
                    className={`w-full pl-10 pr-4 py-3 rounded-2xl border-none shadow-sm text-sm ${isDarkMode ? "bg-slate-600 text-white placeholder-slate-400" : "bg-white text-slate-900"}`}
                    value={newSchedule.media}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, media: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-slate-900 text-white h-[46px] rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {editingId ? (
                <>
                  <Edit3 size={18} /> Update
                </>
              ) : (
                <>
                  <Plus size={18} /> Tambah
                </>
              )}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {sortedSchedules.map((sch) => {
          const start = sch.startDate || sch.date;
          const end = sch.endDate || sch.date;
          const isMultiDay = start !== end;
          const timeDisplay = sch.isAllDay
            ? "All Day"
            : `${sch.startTime || sch.time} ${sch.endTime ? "- " + sch.endTime : ""}`;

          return (
            <div
              key={sch.id}
              className={`group flex flex-col md:flex-row items-start md:items-center justify-between p-5 border rounded-3xl transition-all duration-300 gap-4 ${isDarkMode ? "bg-slate-700 border-slate-600 hover:shadow-slate-900/50" : "bg-white border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 hover:border-indigo-100"}`}
            >
              <div className="flex items-center gap-5">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg rotate-3 group-hover:rotate-0 transition-transform flex-shrink-0 ${sch.type === "Meeting" ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-200" : sch.type === "Kuliah" ? "bg-gradient-to-br from-orange-400 to-orange-500 shadow-orange-200" : "bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-200"}`}
                >
                  {sch.type === "Meeting" && <Briefcase size={24} />}
                  {sch.type === "Kuliah" && <GraduationCap size={24} />}
                  {sch.type === "Janji Temu" && <Users size={24} />}
                  {sch.type !== "Meeting" &&
                    sch.type !== "Kuliah" &&
                    sch.type !== "Janji Temu" && <Clock size={24} />}
                </div>
                <div>
                  <h4
                    className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-slate-900"}`}
                  >
                    {sch.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mt-1">
                    <span className="flex items-center gap-1.5">
                      <CalendarIcon size={14} className="text-indigo-500" />{" "}
                      {new Date(start).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                      {isMultiDay &&
                        ` - ${new Date(end).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} className="text-indigo-500" />{" "}
                      {timeDisplay}
                    </span>
                    {sch.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-indigo-500" />{" "}
                        {sch.location}
                      </span>
                    )}
                  </div>
                  {sch.media && (
                    <a
                      href={sch.media}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md mt-2 hover:underline"
                    >
                      <LinkIcon size={10} /> {sch.media}
                    </a>
                  )}
                </div>
              </div>
              {canEdit && (
                <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => startEdit(sch)}
                    className="p-3 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-2xl"
                  >
                    <Edit3 size={20} />
                  </button>
                  <button
                    onClick={() => setDeleteModal({ show: true, item: sch })}
                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 5.3. Komponen: Master Routine Manager
// Mengelola rutinitas berulang, freeze, arsip, dan riwayat
export const MasterRoutineManager = ({ routines, setRoutines, role, isDarkMode }) => {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState(null);

  const [formData, setFormData] = React.useState({
    title: "",
    frequency: "daily",
    days: [],
    interval: 1,
    intervalType: "days",
    monthDates: [],
    startDate: formatLocalYMD(new Date()),
  });
  const [deleteModal, setDeleteModal] = React.useState({ show: false, item: null });
  const [archiveModal, setArchiveModal] = React.useState({
    show: false,
    item: null,
    isRestore: false,
  });
  const [freezeModal, setFreezeModal] = React.useState({
    show: false,
    routine: null,
  });
  const [historyModal, setHistoryModal] = React.useState({
    show: false,
    routine: null,
  });
  const [unfreezeModal, setUnfreezeModal] = React.useState({
    show: false,
    routine: null,
  });
  const [showArchived, setShowArchived] = React.useState(false);
  const canEdit = role !== "viewer";

  const handleToggleDay = (dayId) => {
    const currentDays = formData.days || [];
    setFormData({
      ...formData,
      days: currentDays.includes(dayId)
        ? currentDays.filter((d) => d !== dayId)
        : [...currentDays, dayId],
    });
  };

  const handleToggleMonthDate = (dateStr) => {
    const currentDates = formData.monthDates || [];
    setFormData({
      ...formData,
      monthDates: currentDates.includes(dateStr)
        ? currentDates.filter((d) => d !== dateStr)
        : [...currentDates, dateStr],
    });
  };

  const saveRoutine = () => {
    if (!formData.title.trim()) return;
    if (formData.frequency === "weekly" && formData.days.length === 0) {
      alert("Pilih minimal satu hari.");
      return;
    }
    if (formData.frequency === "monthly" && formData.monthDates.length === 0) {
      alert("Pilih minimal satu tanggal.");
      return;
    }

    const finalStartDate = formData.startDate || formatLocalYMD(new Date());
    if (editingId) {
      setRoutines(
        routines.map((r) =>
          r.id === editingId
            ? { ...r, ...formData, startDate: finalStartDate }
            : r,
        ),
      );
      setEditingId(null);
    } else {
      setRoutines([
        ...routines,
        {
          id: `routine-${Date.now()}`,
          ...formData,
          startDate: finalStartDate,
          active: true,
          archived: false,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
    setFormData({
      title: "",
      frequency: "daily",
      days: [],
      interval: 1,
      intervalType: "days",
      monthDates: [],
      startDate: formatLocalYMD(new Date()),
    });
    setIsFormOpen(false);
  };

  const startEdit = (routine) => {
    const initialDate =
      routine.startDate ||
      (routine.createdAt
        ? new Date(routine.createdAt).toISOString().split("T")[0]
        : formatLocalYMD(new Date()));
    setFormData({
      title: routine.title,
      frequency: routine.frequency,
      days: routine.days || [],
      interval: routine.interval || 1,
      intervalType: routine.intervalType || "days",
      monthDates: routine.monthDates || [],
      startDate: initialDate,
    });
    setEditingId(routine.id);
    setIsFormOpen(true);
  };

  const confirmDelete = () => {
    setRoutines(routines.filter((r) => r.id !== deleteModal.item.id));
    setDeleteModal({ show: false, item: null });
  };

  const confirmArchive = () => {
    const targetId = archiveModal.item.id;
    const isRestore = archiveModal.isRestore;
    setRoutines(
      routines.map((r) =>
        r.id === targetId ? { ...r, archived: !isRestore } : r,
      ),
    );
    setArchiveModal({ show: false, item: null, isRestore: false });
  };

  const handleSaveFreeze = (freezeData) => {
    setRoutines(
      routines.map((r) =>
        r.id === freezeModal.routine.id
          ? { ...r, freezePeriods: [...(r.freezePeriods || []), freezeData] }
          : r,
      ),
    );
    setFreezeModal({ show: false, routine: null });
  };

  const handleUnfreezeClick = (e, routine) => {
    e.stopPropagation();
    setUnfreezeModal({ show: true, routine });
  };

  const confirmUnfreeze = () => {
    const routineId = unfreezeModal.routine?.id;
    if (!routineId) return;
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const y = yesterday.getFullYear();
    const m = String(yesterday.getMonth() + 1).padStart(2, "0");
    const d = String(yesterday.getDate()).padStart(2, "0");
    const yesterdayStr = `${y}-${m}-${d}`;
    const unfreezeDateStr = now.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });

    setRoutines((prevRoutines) =>
      prevRoutines.map((r) => {
        if (r.id === routineId && r.freezePeriods) {
          const updatedPeriods = r.freezePeriods.map((p) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const start = parseLocalYMD(p.startDate);
            const end = parseLocalYMD(p.endDate);
            end.setHours(23, 59, 59, 999);
            if (today >= start && today <= end) {
              return {
                ...p,
                endDate: yesterdayStr,
                reason: `${p.reason} (Unfrozen pada ${unfreezeDateStr})`,
              };
            }
            return p;
          });
          return { ...r, freezePeriods: updatedPeriods };
        }
        return r;
      }),
    );
    setUnfreezeModal({ show: false, routine: null });
  };

  const handleEditFreeze = (routineId, freezeIndex, updatedFreeze) => {
    setRoutines(
      routines.map((r) => {
        if (r.id === routineId && r.freezePeriods) {
          const newPeriods = [...r.freezePeriods];
          newPeriods[freezeIndex] = updatedFreeze;
          return { ...r, freezePeriods: newPeriods };
        }
        return r;
      }),
    );
  };

  const handleDeleteFreeze = (routineId, freezeIndex) => {
    setRoutines(
      routines.map((r) => {
        if (r.id === routineId && r.freezePeriods) {
          const newPeriods = r.freezePeriods.filter(
            (_, idx) => idx !== freezeIndex,
          );
          return { ...r, freezePeriods: newPeriods };
        }
        return r;
      }),
    );
  };

  const displayedRoutines = routines.filter((r) =>
    showArchived ? r.archived : !r.archived,
  );

  // PERBAIKAN: Mengambil referensi LIVE (terbaru) dari array routines
  const activeHistoryRoutine = routines.find(
    (r) => r.id === historyModal.routine?.id,
  );

  return (
    <div
      className={`p-8 rounded-[2.5rem] shadow-sm border h-full ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
    >
      <ConfirmationModal
        isOpen={deleteModal.show}
        onClose={() => setDeleteModal({ show: false, item: null })}
        onConfirm={confirmDelete}
        title="Hapus Rutinitas?"
        message="Data historis mungkin terpengaruh."
        itemName={deleteModal.item?.title}
      />
      <ConfirmationModal
        isOpen={archiveModal.show}
        onClose={() => setArchiveModal({ show: false, item: null })}
        onConfirm={confirmArchive}
        title={
          archiveModal.isRestore ? "Aktifkan Rutinitas?" : "Arsipkan Rutinitas?"
        }
        message={
          archiveModal.isRestore
            ? "Rutinitas akan kembali muncul di daftar harian."
            : "Rutinitas akan disembunyikan permanen dari daftar harian, namun tidak dihapus."
        }
        itemName={archiveModal.item?.title}
      />
      <ConfirmationModal
        isOpen={unfreezeModal.show}
        onClose={() => setUnfreezeModal({ show: false, routine: null })}
        onConfirm={confirmUnfreeze}
        title="Cairkan Rutinitas?"
        message="Rutinitas akan aktif kembali mulai hari ini. Status freeze akan diakhiri per kemarin."
        itemName={unfreezeModal.routine?.title}
      />

      <FreezeRoutineModal
        isOpen={freezeModal.show}
        onClose={() => setFreezeModal({ show: false, routine: null })}
        onSave={handleSaveFreeze}
        routineTitle={freezeModal.routine?.title}
      />

      {/* Menggunakan activeHistoryRoutine agar UI langsung merespon saat data diubah/dihapus */}
      <FreezeHistoryModal
        isOpen={historyModal.show}
        onClose={() => setHistoryModal({ show: false, routine: null })}
        routine={activeHistoryRoutine}
        onEditFreeze={handleEditFreeze}
        onDeleteFreeze={handleDeleteFreeze}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h3
            className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            Rutinitas
          </h3>
          <p
            className={`text-sm mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
          >
            Bangun kebiasaan baik setiap hari.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`text-xs font-bold px-3 py-2 rounded-xl transition-all ${showArchived ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500"}`}
          >
            {showArchived ? "Sembunyikan Arsip" : "Lihat Arsip"}
          </button>
          {canEdit && !isFormOpen && (
            <button
              onClick={() => {
                setIsFormOpen(true);
                setEditingId(null);
                setFormData({
                  title: "",
                  frequency: "daily",
                  days: [],
                  interval: 1,
                  intervalType: "days",
                  monthDates: [],
                  startDate: formatLocalYMD(new Date()),
                });
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-xl"
            >
              <Plus size={18} /> Buat Baru
            </button>
          )}
        </div>
      </div>

      {isFormOpen && (
        <div
          className={`p-6 rounded-3xl mb-8 border animate-in slide-in-from-top-4 fade-in ${isDarkMode ? "bg-slate-700 border-slate-600" : "bg-slate-50 border-slate-100"}`}
        >
          <div className="flex justify-between mb-4">
            <h4
              className={`font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
            >
              {editingId ? "Ubah Rutinitas" : "Tambah Rutinitas"}
            </h4>
            <button onClick={() => setIsFormOpen(false)}>
              <X
                size={20}
                className={isDarkMode ? "text-white" : "text-slate-900"}
              />
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveRoutine();
            }}
            className="space-y-4"
          >
            <input
              type="text"
              placeholder="Nama"
              className={`w-full px-5 py-3 rounded-2xl border-none shadow-sm ${isDarkMode ? "bg-slate-600 text-white" : "bg-white text-slate-900"}`}
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  className={`w-full px-5 py-3 rounded-2xl border-none shadow-sm ${isDarkMode ? "bg-slate-600 text-white" : "bg-white text-slate-900"}`}
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">
                  Frekuensi
                </label>
                <select
                  className={`w-full px-5 py-3 rounded-2xl border-none shadow-sm ${isDarkMode ? "bg-slate-600 text-white" : "bg-white text-slate-900"}`}
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData({ ...formData, frequency: e.target.value })
                  }
                >
                  <option value="daily">Setiap Hari</option>
                  <option value="weekly">Mingguan</option>
                  <option value="monthly">Bulanan</option>
                  <option value="interval">Interval</option>
                </select>
              </div>
            </div>

            {formData.frequency === "interval" && (
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
                >
                  Setiap
                </span>
                <input
                  type="number"
                  min="1"
                  className={`w-20 px-4 py-3 rounded-2xl border-none shadow-sm text-center ${isDarkMode ? "bg-slate-600 text-white" : "bg-white text-slate-900"}`}
                  value={formData.interval}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      interval: parseInt(e.target.value) || 1,
                    })
                  }
                />
                <select
                  className={`px-4 py-3 rounded-2xl border-none shadow-sm ${isDarkMode ? "bg-slate-600 text-white" : "bg-white text-slate-900"}`}
                  value={formData.intervalType}
                  onChange={(e) =>
                    setFormData({ ...formData, intervalType: e.target.value })
                  }
                >
                  <option value="days">Hari</option>
                  <option value="weeks">Minggu</option>
                  <option value="months">Bulan</option>
                  <option value="years">Tahun</option>
                </select>
                <span
                  className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
                >
                  sekali
                </span>
              </div>
            )}
            {formData.frequency === "weekly" && (
              <div className="flex gap-2 flex-wrap mt-2">
                {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleToggleDay(d)}
                    className={`w-10 h-10 rounded-xl font-bold ${formData.days.includes(d) ? "bg-indigo-600 text-white" : isDarkMode ? "bg-slate-600 text-white" : "bg-white text-slate-900 shadow-sm hover:bg-slate-50"}`}
                  >
                    {d === 0
                      ? "Min"
                      : d === 1
                        ? "Sen"
                        : d === 2
                          ? "Sel"
                          : d === 3
                            ? "Rab"
                            : d === 4
                              ? "Kam"
                              : d === 5
                                ? "Jum"
                                : "Sab"}
                  </button>
                ))}
              </div>
            )}
            {formData.frequency === "monthly" && (
              <div className="mt-2">
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">
                  Pilih Tanggal
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 31 }, (_, i) => (i + 1).toString()).map(
                    (d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleToggleMonthDate(d)}
                        className={`py-2 rounded-xl text-xs font-bold transition-colors ${formData.monthDates.includes(d) ? "bg-indigo-600 text-white" : isDarkMode ? "bg-slate-600 text-white" : "bg-white text-slate-900 shadow-sm hover:bg-slate-50"}`}
                      >
                        {d}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-bold shadow-lg mt-4"
            >
              {editingId ? "Simpan Perubahan" : "Simpan"}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {displayedRoutines.length === 0 && (
          <p className="text-center py-8 text-slate-400 italic">
            Tidak ada rutinitas {showArchived ? "diarsipkan" : "aktif"}.
          </p>
        )}
        {displayedRoutines.map((r) => {
          const isFrozen =
            r.freezePeriods &&
            r.freezePeriods.some((p) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const start = parseLocalYMD(p.startDate);
              const end = parseLocalYMD(p.endDate);
              end.setHours(23, 59, 59, 999);
              return today >= start && today <= end;
            });

          return (
            <div
              key={r.id}
              className={`flex justify-between items-center p-5 border rounded-3xl ${r.archived ? "bg-slate-100 border-slate-200 opacity-75" : isFrozen ? "bg-blue-50 border-blue-200" : isDarkMode ? "bg-slate-700 border-slate-600" : "bg-white border-slate-100"}`}
            >
              <div className="flex items-center gap-5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${r.archived ? "bg-slate-200 text-slate-500" : isFrozen ? "bg-blue-200 text-blue-700" : "bg-indigo-50 text-indigo-600"}`}
                >
                  {r.archived ? (
                    <Archive size={20} />
                  ) : isFrozen ? (
                    <Snowflake size={20} />
                  ) : (
                    <RefreshCw size={20} />
                  )}
                </div>
                <div>
                  <h4
                    className={`font-bold text-lg flex items-center gap-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}
                  >
                    {r.title}
                    {isFrozen && (
                      <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Snowflake size={10} /> Sedang Freeze
                      </span>
                    )}
                    {r.archived && (
                      <span className="text-[10px] bg-slate-600 text-white px-2 py-0.5 rounded-full">
                        Diarsipkan
                      </span>
                    )}
                  </h4>
                  <div className="text-xs text-slate-500 mt-1 font-medium flex flex-wrap gap-2 items-center">
                    <span className="capitalize">
                      {r.frequency}{" "}
                      {r.frequency === "interval" &&
                        `(${r.interval} ${r.intervalType === "weeks" ? "Minggu" : r.intervalType === "months" ? "Bulan" : r.intervalType === "years" ? "Tahun" : "Hari"})`}
                    </span>
                    {r.startDate && (
                      <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-bold dark:bg-slate-800">
                        Mulai:{" "}
                        {new Date(r.startDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {canEdit && (
                <div className="flex gap-1">
                  {!r.archived && (
                    <>
                      <button
                        onClick={() =>
                          setHistoryModal({ show: true, routine: r })
                        }
                        className="p-3 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl"
                        title="Riwayat"
                      >
                        <History size={18} />
                      </button>
                      {isFrozen ? (
                        <button
                          onClick={(e) => handleUnfreezeClick(e, r)}
                          className="p-3 text-white bg-blue-500 hover:bg-blue-600 rounded-xl shadow-md font-bold text-xs"
                          title="Batalkan Freeze"
                        >
                          Unfreeze
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            setFreezeModal({ show: true, routine: r })
                          }
                          className="p-3 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl"
                          title="Freeze"
                        >
                          <Snowflake size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(r)}
                        className="p-3 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl"
                      >
                        <Edit3 size={18} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() =>
                      setArchiveModal({
                        show: true,
                        item: r,
                        isRestore: r.archived,
                      })
                    }
                    className={`p-3 rounded-xl transition-colors ${r.archived ? "text-green-500 hover:bg-green-50" : "text-slate-300 hover:text-orange-500 hover:bg-orange-50"}`}
                    title={r.archived ? "Aktifkan Kembali" : "Arsipkan"}
                  >
                    {r.archived ? (
                      <RefreshCw size={18} />
                    ) : (
                      <Archive size={18} />
                    )}
                  </button>
                  <button
                    onClick={() => setDeleteModal({ show: true, item: r })}
                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 5.4. Komponen: Quick Modal Task Produktivitas
// Modal cepat untuk update task/action project dan menambahkan resource
export const ProdTaskQuickModal = ({
  isOpen,
  onClose,
  task,
  onSave,
  isDarkMode,
  freeNotes,
  aiNotes,
  lists,
  resources,
  setResources,
  geminiApiKey,
}) => {
  const [formData, setFormData] = React.useState({});
  const [tempResource, setTempResource] = React.useState({
    type: "link",
    number: "",
    name: "",
    description: "",
    date: "",
    url: "",
    file: null,
    existingId: "",
    noteId: "",
    addToGlobal: false,
  });
  const [isAddingResource, setIsAddingResource] = React.useState(false);
  const [aiModalRes, setAiModalRes] = React.useState(null);

  React.useEffect(() => {
    if (isOpen && task)
      setFormData({ ...task, resources: task.resources || [] });
  }, [isOpen, task]);

  if (!isOpen || !task) return null;

  const handleAddResourceToTask = () => {
    if (!tempResource.name) return alert("Nama resource wajib diisi.");
    const resourceDate =
      tempResource.date ||
      formData.dueDate ||
      new Date().toISOString().split("T")[0];
    const resourceData = {
      id: generateId("tr"),
      ...tempResource,
      date: resourceDate,
    };

    setFormData((prev) => ({
      ...prev,
      resources: [...(prev.resources || []), resourceData],
    }));
    setTempResource({
      type: "link",
      number: "",
      name: "",
      description: "",
      date: "",
      url: "",
      file: null,
      existingId: "",
      noteId: "",
      addToGlobal: false,
    });
    setIsAddingResource(false);
  };

  const removeResourceFromTask = (resId) => {
    setFormData((prev) => ({
      ...prev,
      resources: (prev.resources || []).filter((r) => r.id !== resId),
    }));
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const fakeUrl = URL.createObjectURL(file);
      setTempResource((prev) => ({
        ...prev,
        file: file,
        url: fakeUrl,
        name: prev.name ? prev.name : file.name,
      }));
      try {
        const uploaded = await uploadFileToBackend(file);
        setTempResource((prev) => ({
          ...prev,
          ...uploaded,
          name: prev.name || uploaded.name,
        }));
      } catch (error) {
        console.warn("Upload file ke backend gagal, memakai URL lokal.", error);
      }
    }
  };

  const openResource = (res) => {
    if (res.url) window.open(res.url, "_blank");
    else alert("Tidak ada link/file yang bisa dibuka.");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const processedResources = [];
    const tagToAdd =
      formData.prodType === "action" ? "Project Action" : "Area Task";

    if (setResources && formData.resources) {
      setResources((prev) =>
        updateGlobalResources(prev, formData.resources, tagToAdd),
      );
    }
    (formData.resources || []).forEach((res) => {
      processedResources.push({ ...res });
    });
    onSave({ ...formData, resources: processedResources });
  };

  const isAction =
    formData.prodType === "action" || formData.type === "project-action";
  const labelText = isAction ? "Action" : "Task";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <ResourceAIModal
        isOpen={!!aiModalRes}
        onClose={() => setAiModalRes(null)}
        resource={aiModalRes}
        onSave={(id, summary) => {
          setFormData((prev) => ({
            ...prev,
            resources: prev.resources.map((r) =>
              r.id === id ? { ...r, aiSummary: summary } : r,
            ),
          }));
        }}
        apiKey={geminiApiKey}
        isDarkMode={isDarkMode}
      />

      <div
        className={`rounded-[2rem] shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
      >
        <div
          className={`p-6 flex justify-between items-center border-b ${isDarkMode ? "border-slate-700" : "border-slate-100"}`}
        >
          <h3
            className={`text-xl font-bold flex items-center gap-3 ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
              <CheckSquare size={20} />
            </div>
            Update {labelText}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
          <form
            id="quick-task-form"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Nama {labelText}
              </label>
              <input
                type="text"
                value={formData.title || ""}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className={`w-full px-4 py-3 rounded-xl border ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Deskripsi
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className={`w-full px-4 py-3 rounded-xl border ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                rows="2"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Prioritas
                </label>
                <select
                  value={formData.priority || "medium"}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                  className={`w-full px-4 py-3 rounded-xl border ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              {isAction && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Bobot (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.weight || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        weight: parseFloat(e.target.value) || 0,
                      })
                    }
                    className={`w-full px-4 py-3 rounded-xl border ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="taskCompleted"
                checked={formData.completed || false}
                onChange={(e) =>
                  setFormData({ ...formData, completed: e.target.checked })
                }
                className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-100 border-slate-300"
              />
              <label
                htmlFor="taskCompleted"
                className={`font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}
              >
                Tandai Selesai
              </label>
            </div>
          </form>
          <div
            className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}
          >
            <div className="flex justify-between items-center mb-4">
              <h4
                className={`font-bold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-slate-800"}`}
              >
                <FolderOpen size={18} /> Resources / Lampiran
              </h4>
              <button
                onClick={() => {
                  setIsAddingResource(!isAddingResource);
                  setTempResource({
                    ...tempResource,
                    date: formData.dueDate || "",
                  });
                }}
                className="text-xs bg-white border shadow-sm px-3 py-1.5 rounded-lg font-bold text-indigo-600 hover:bg-indigo-50"
              >
                + Tambah Resource
              </button>
            </div>
            {isAddingResource && (
              <ResourceInputSection
                isDarkMode={isDarkMode}
                tempResource={tempResource}
                setTempResource={setTempResource}
                handleAddResource={handleAddResourceToTask}
                handleFileSelect={handleFileSelect}
                freeNotes={freeNotes}
                aiNotes={aiNotes}
                lists={lists}
                resources={resources}
                onCancel={() => setIsAddingResource(false)}
              />
            )}
            <ResourceListTable
              resources={formData.resources}
              isDarkMode={isDarkMode}
              openResource={openResource}
              removeResource={removeResourceFromTask}
              openAIView={setAiModalRes}
            />
          </div>
        </div>
        <div
          className={`p-6 border-t flex justify-end gap-3 ${isDarkMode ? "border-slate-700" : "border-slate-100"}`}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm"
          >
            Batal
          </button>
          <button
            type="submit"
            form="quick-task-form"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-colors text-sm"
          >
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
};

// 5.5. Komponen: Daily Agenda Manager (Dashboard Harian)
// Menampilkan jadwal, rutinitas, dan todo untuk hari yang dipilih
export const DailyAgendaManager = ({
  routines,
  schedules,
  todos,
  setTodos,
  completions,
  setCompletions,
  currentDate,
  role,
  isDarkMode,
  projects,
  activities,
  projectTasks,
  setProjectTasks,
  freeNotes,
  aiNotes,
  lists,
  resources,
  setResources,
  geminiApiKey,
}) => {
  const [logModal, setLogModal] = React.useState({ show: false, routine: null });
  const [deleteModal, setDeleteModal] = React.useState({ show: false, item: null });
  const [isAddTodoModalOpen, setIsAddTodoModalOpen] = React.useState(false);
  const [editingTodo, setEditingTodo] = React.useState(null);
  const [editingProdTask, setEditingProdTask] = React.useState(null);
  const canEdit = role !== "viewer";

  const todaysSchedules = schedules
    .filter((s) => {
      const dateStr = formatLocalYMD(currentDate);
      return isScheduleOnDate(s, dateStr);
    })
    .sort((a, b) => {
      const timeA = a.isAllDay ? "00:00" : a.startTime || "00:00";
      const timeB = b.isAllDay ? "00:00" : b.startTime || "00:00";
      return timeA.localeCompare(timeB);
    });

  const todaysRoutines = routines.filter((r) =>
    isRoutineActiveOnDate(r, currentDate),
  );
  const todaysTodos = todos.filter(
    (t) => t.date === currentDate.toDateString(),
  );
  const todaysProdTasks = projectTasks
    ? projectTasks.filter((t) => t.dueDate === formatLocalYMD(currentDate))
    : [];

  const combinedTodos = [
    ...todaysTodos.map((t) => ({ ...t, isProd: false })),
    ...todaysProdTasks.map((t) => {
      let parentName = "";
      let prodType = "task";
      const p = projects?.find((proj) => proj.id === t.projectId);
      if (p) {
        parentName = p.title;
        prodType = "action";
      } else {
        const a = activities?.find((act) => act.id === t.projectId);
        if (a) {
          parentName = a.title;
          prodType = "task";
        }
      }
      return { ...t, isProd: true, parentName, prodType };
    }),
  ].sort((a, b) => {
    const map = { high: 3, medium: 2, low: 1 };
    return (map[b.priority] || 0) - (map[a.priority] || 0);
  });

  const handleAddTodo = (title, priority) => {
    if (editingTodo) {
      setTodos(
        todos.map((t) =>
          t.id === editingTodo.id ? { ...t, title, priority } : t,
        ),
      );
      setEditingTodo(null);
    } else {
      setTodos([
        ...todos,
        {
          id: `todo-${Date.now()}`,
          title,
          completed: false,
          date: currentDate.toDateString(),
          priority,
        },
      ]);
    }
  };

  const startEditTodo = (task) => {
    setEditingTodo(task);
    setIsAddTodoModalOpen(true);
  };

  const toggleTask = (task) => {
    if (!canEdit) return;
    if (task.isProd) {
      setEditingProdTask({ ...task, completed: !task.completed });
    } else {
      setTodos(
        todos.map((t) =>
          t.id === task.id ? { ...t, completed: !t.completed } : t,
        ),
      );
    }
  };

  const confirmDelete = () => {
    if (deleteModal.item.isProd) {
      setProjectTasks(projectTasks.filter((t) => t.id !== deleteModal.item.id));
    } else {
      setTodos(todos.filter((t) => t.id !== deleteModal.item.id));
    }
    setDeleteModal({ show: false, item: null });
  };

  const handleSaveProdTask = (updatedTask) => {
    setProjectTasks(
      projectTasks.map((t) =>
        t.id === updatedTask.id ? { ...t, ...updatedTask } : t,
      ),
    );
    setEditingProdTask(null);
  };

  const toggleRoutineCompletion = (routineId) => {
    if (!canEdit) return;
    const dateKey = currentDate.toDateString();
    const isCompleted = completions.some(
      (c) => c.routineId === routineId && c.date === dateKey,
    );

    if (isCompleted) {
      setCompletions(
        completions.filter(
          (c) => !(c.routineId === routineId && c.date === dateKey),
        ),
      );
    } else {
      setCompletions([
        ...completions,
        {
          routineId,
          date: dateKey,
          actualDate: dateKey,
          note: "",
          completedAt: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleSaveLog = (actualDate, note) => {
    const routineId = logModal.routine.id;
    const dateKey = currentDate.toDateString();
    const otherCompletions = completions.filter(
      (c) => !(c.routineId === routineId && c.date === dateKey),
    );
    setCompletions([
      ...otherCompletions,
      {
        routineId,
        date: dateKey,
        actualDate: new Date(actualDate).toDateString(),
        note: note,
        completedAt: new Date().toISOString(),
      },
    ]);
    setLogModal({ show: false, routine: null });
  };

  return (
    <div className="space-y-8">
      <ActivityLogModal
        isOpen={logModal.show}
        onClose={() => setLogModal({ show: false, routine: null })}
        onSave={handleSaveLog}
        routineTitle={logModal.routine?.title}
        scheduledDate={currentDate}
      />
      <AddTodoModal
        isOpen={isAddTodoModalOpen}
        onClose={() => {
          setIsAddTodoModalOpen(false);
          setEditingTodo(null);
        }}
        onSave={handleAddTodo}
        editingItem={editingTodo}
      />
      <ProdTaskQuickModal
        isOpen={!!editingProdTask}
        onClose={() => setEditingProdTask(null)}
        task={editingProdTask}
        onSave={handleSaveProdTask}
        isDarkMode={isDarkMode}
        freeNotes={freeNotes}
        aiNotes={aiNotes}
        lists={lists}
        resources={resources}
        setResources={setResources}
        geminiApiKey={geminiApiKey}
      />
      <ConfirmationModal
        isOpen={deleteModal.show}
        onClose={() => setDeleteModal({ show: false, item: null })}
        onConfirm={confirmDelete}
        title="Hapus Tugas?"
        message="Tugas ini akan dihapus permanen."
        itemName={deleteModal.item?.title}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div
          className={`p-8 rounded-[2.5rem] shadow-sm border flex flex-col h-full ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <RefreshCw size={24} />
              </div>
              <div>
                <h3
                  className={`font-bold text-xl ${isDarkMode ? "text-white" : "text-slate-900"}`}
                >
                  Rutinitas & Agenda
                </h3>
                <p
                  className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-400"}`}
                >
                  Jadwal Hari Ini
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4 flex-1">
            {todaysSchedules.map((sch) => (
              <div
                key={sch.id}
                className={`flex justify-between items-center p-4 rounded-2xl border-l-4 border-blue-500 bg-blue-50/50 hover:bg-blue-50 transition-all`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-xs font-bold text-blue-600 min-w-[50px]">
                    {sch.isAllDay ? "All Day" : sch.startTime || "??:??"}
                  </div>
                  <div>
                    <span className="block font-bold text-slate-700">
                      {sch.title}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <MapPin size={10} /> {sch.location || "Online"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {todaysRoutines.map((routine) => {
              const completion = completions.find(
                (c) =>
                  c.routineId === routine.id &&
                  c.date === currentDate.toDateString(),
              );
              const isDone = !!completion;
              const isLate =
                isDone && completion.actualDate !== completion.date;
              return (
                <div
                  key={routine.id}
                  className={`group flex justify-between items-center p-4 rounded-2xl border-l-4 border-purple-500 transition-all duration-300 ${isDone ? "bg-purple-50/50" : isDarkMode ? "bg-slate-700" : "bg-white border border-slate-100"} hover:shadow-md`}
                >
                  <div
                    className={`flex items-center gap-4 flex-1 min-w-0 ${canEdit ? "cursor-pointer" : ""}`}
                    onClick={() => toggleRoutineCompletion(routine.id)}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${isDone ? "bg-purple-500 border-purple-500 text-white" : isDarkMode ? "border-slate-500 bg-slate-600" : "border-slate-300 bg-white"}`}
                    >
                      {isDone && <CheckCircle size={14} strokeWidth={4} />}
                    </div>
                    <div>
                      <span
                        className={`block font-bold truncate ${isDone ? "text-purple-900/50 line-through" : isDarkMode ? "text-white" : "text-slate-700"}`}
                      >
                        {routine.title}
                      </span>
                      {isLate && (
                        <span className="text-[10px] text-orange-500 font-bold flex gap-1 items-center bg-orange-50 px-2 py-0.5 rounded-md w-fit mt-1">
                          <AlertTriangle size={10} />{" "}
                          {new Date(completion.actualDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() =>
                        setLogModal({ show: true, routine: routine })
                      }
                      className="text-slate-300 hover:text-indigo-600 p-2 hover:bg-white rounded-xl transition-colors flex-shrink-0"
                    >
                      <ClipboardList size={20} />
                    </button>
                  )}
                </div>
              );
            })}
            {todaysRoutines.length === 0 && todaysSchedules.length === 0 && (
              <div
                className={`flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-3xl ${isDarkMode ? "border-slate-600" : "border-slate-100"}`}
              >
                <p className="text-slate-400 font-medium">Kosong hari ini.</p>
              </div>
            )}
          </div>
        </div>
        <div
          className={`p-8 rounded-[2.5rem] shadow-sm border flex flex-col h-full ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <CheckSquare size={24} />
              </div>
              <div>
                <h3
                  className={`font-bold text-xl ${isDarkMode ? "text-white" : "text-slate-900"}`}
                >
                  To-Do List
                </h3>
                <p
                  className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-400"}`}
                >
                  Tugas Terpadu
                </p>
              </div>
            </div>
            {canEdit && (
              <button
                onClick={() => {
                  setEditingTodo(null);
                  setIsAddTodoModalOpen(true);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg hover:shadow-slate-900/20 flex-shrink-0 active:scale-95"
              >
                <Plus size={20} />
              </button>
            )}
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
            {combinedTodos.map((task) => (
              <div
                key={task.id}
                className={`group flex justify-between items-center p-3 px-4 rounded-2xl border-l-4 ${task.isProd ? (task.prodType === "action" ? "border-orange-500" : "border-indigo-500") : "border-emerald-500"} transition-all ${task.completed ? (task.isProd ? (task.prodType === "action" ? "bg-orange-50/50" : "bg-indigo-50/50") : "bg-emerald-50/50") : isDarkMode ? "bg-slate-700 border-t border-r border-b border-slate-600" : "bg-white border-t border-r border-b border-slate-100"} hover:shadow-sm`}
              >
                <div
                  className={`flex items-center gap-4 flex-1 min-w-0 ${canEdit ? "cursor-pointer" : ""}`}
                  onClick={() => toggleTask(task)}
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${task.completed ? (task.isProd ? (task.prodType === "action" ? "bg-orange-500 border-orange-500 text-white" : "bg-indigo-500 border-indigo-500 text-white") : "bg-emerald-500 border-emerald-500 text-white") : isDarkMode ? "border-slate-500 bg-slate-600" : "border-slate-300 bg-white"}`}
                  >
                    {task.completed && (
                      <CheckCircle size={12} strokeWidth={4} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <span
                      className={`text-sm font-bold block truncate ${task.completed ? `line-through ${task.isProd ? (task.prodType === "action" ? "text-orange-900/40" : "text-indigo-900/40") : "text-emerald-900/40"}` : isDarkMode ? "text-white" : "text-slate-700"}`}
                    >
                      {task.title}
                    </span>
                    <div className="flex gap-2 items-center mt-1 flex-wrap">
                      {!task.completed && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase inline-block ${task.priority === "high" ? "bg-red-50 text-red-600" : task.priority === "medium" ? "bg-amber-50 text-amber-600" : isDarkMode ? "bg-slate-600 text-slate-300" : "bg-slate-100 text-slate-500"}`}
                        >
                          {task.priority}
                        </span>
                      )}
                      {task.isProd && task.parentName && (
                        <span
                          className={`text-[10px] ${isDarkMode ? "text-slate-400" : "text-slate-500"} font-bold truncate max-w-[120px] block`}
                        >
                          {task.parentName}
                        </span>
                      )}
                      {task.isProd && (
                        <span
                          className={`text-[10px] ${task.prodType === "action" ? "bg-orange-100 text-orange-700" : "bg-indigo-100 text-indigo-700"} px-1.5 py-0.5 rounded uppercase font-bold`}
                        >
                          {task.prodType === "action" ? "Action" : "Task"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        task.isProd
                          ? setEditingProdTask({ ...task })
                          : startEditTodo(task);
                      }}
                      className="p-2 text-slate-300 hover:text-indigo-500 rounded-lg"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteModal({ show: true, item: task });
                      }}
                      className="p-2 text-slate-300 hover:text-red-500 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {combinedTodos.length === 0 && (
              <div
                className={`text-center py-8 rounded-3xl border border-dashed ${isDarkMode ? "bg-slate-700 border-slate-600" : "bg-slate-50 border-slate-200"}`}
              >
                <p className="text-slate-400 text-sm font-medium">
                  Belum ada tugas.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 5.6. Komponen: Planner Wrapper (Main Container)
// Mengatur tab navigasi antara Harian, Jadwal, Rutinitas, dan Referensi
export const Planner = ({
  routines,
  setRoutines,
  schedules,
  setSchedules,
  todos,
  setTodos,
  completions,
  setCompletions,
  currentDate,
  setCurrentDate,
  role,
  agendaTypes,
  setAgendaTypes,
  isDarkMode,
  activeTab,
  setActiveTab,
  editTarget,
  setEditTarget,
  projects,
  activities,
  projectTasks,
  setProjectTasks,
  freeNotes,
  aiNotes,
  lists,
  resources,
  setResources,
  geminiApiKey,
}) => {
  const [localTab, setLocalTab] = React.useState("daily");
  const currentTab = activeTab || localTab;
  const setTab = setActiveTab || setLocalTab;

  const [newType, setNewType] = React.useState("");
  const [deleteTypeModal, setDeleteTypeModal] = React.useState({
    show: false,
    type: null,
  });
  const [editModal, setEditModal] = React.useState({
    show: false,
    type: "",
    original: "",
  });

  const handleAddType = (e) => {
    e.preventDefault();
    if (!newType.trim()) return;
    if (agendaTypes.includes(newType.trim())) return alert("Tipe sudah ada");
    setAgendaTypes([...agendaTypes, newType.trim()]);
    setNewType("");
  };

  const confirmDeleteType = () => {
    setAgendaTypes(agendaTypes.filter((t) => t !== deleteTypeModal.type));
    setDeleteTypeModal({ show: false, type: null });
  };

  const handleUpdateReference = (newValue) => {
    if (!newValue.trim()) return;
    setAgendaTypes(
      agendaTypes.map((t) => (t === editModal.original ? newValue : t)),
    );
    setEditModal({ show: false, type: "", original: "" });
  };

  return (
    <div className="flex flex-col gap-8 h-full max-w-7xl mx-auto">
      <ConfirmationModal
        isOpen={deleteTypeModal.show}
        onClose={() => setDeleteTypeModal({ show: false, type: null })}
        onConfirm={confirmDeleteType}
        title="Hapus Tipe?"
        message="Tipe agenda ini akan dihapus dari pilihan."
        itemName={deleteTypeModal.type}
      />
      <EditReferenceModal
        isOpen={editModal.show}
        onClose={() => setEditModal({ show: false, type: "", original: "" })}
        initialValue={editModal.original}
        onSave={handleUpdateReference}
        title="Ubah Tipe Agenda"
      />

      <div
        className={`flex p-2 rounded-[2rem] shadow-lg shadow-slate-200/40 border w-fit ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
      >
        {[
          { id: "daily", label: "Harian", icon: Activity },
          { id: "schedule", label: "Jadwal", icon: CalendarRange },
          { id: "routines", label: "Rutinitas", icon: Settings },
          { id: "references", label: "Referensi", icon: Tag },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`px-8 py-3.5 rounded-3xl text-sm font-bold flex items-center gap-2 transition-all duration-300 ${currentTab === tab.id ? "bg-slate-900 text-white shadow-lg" : isDarkMode ? "text-slate-400 hover:bg-slate-700 hover:text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
          >
            <tab.icon
              size={16}
              className={currentTab === tab.id ? "text-indigo-300" : ""}
            />
            {tab.label}
          </button>
        ))}
      </div>

      {currentTab === "daily" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-8 px-2">
            <h2
              className={`text-3xl font-extrabold ${isDarkMode ? "text-white" : "text-slate-900"}`}
            >
              {currentDate.toLocaleDateString("id-ID", { dateStyle: "full" })}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setCurrentDate(
                    new Date(currentDate.setDate(currentDate.getDate() - 1)),
                  )
                }
                className={`p-3 border rounded-2xl ${isDarkMode ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700" : "bg-white border-slate-200 hover:bg-slate-50"}`}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className={`px-6 font-bold rounded-2xl transition-colors ${isDarkMode ? "bg-indigo-900/50 text-indigo-300 border border-indigo-800 hover:bg-indigo-900" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"}`}
              >
                Hari Ini
              </button>
              <button
                onClick={() =>
                  setCurrentDate(
                    new Date(currentDate.setDate(currentDate.getDate() + 1)),
                  )
                }
                className={`p-3 border rounded-2xl ${isDarkMode ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700" : "bg-white border-slate-200 hover:bg-slate-50"}`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <DailyAgendaManager
            routines={routines}
            schedules={schedules}
            todos={todos}
            setTodos={setTodos}
            completions={completions}
            setCompletions={setCompletions}
            currentDate={currentDate}
            role={role}
            isDarkMode={isDarkMode}
            projects={projects}
            activities={activities}
            projectTasks={projectTasks}
            setProjectTasks={setProjectTasks}
            freeNotes={freeNotes}
            aiNotes={aiNotes}
            lists={lists}
            resources={resources}
            setResources={setResources}
            geminiApiKey={geminiApiKey}
          />
          <div className="mt-8">
            <EnhancedCalendar
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              schedules={schedules}
              todos={todos}
              routines={routines}
              projectTasks={projectTasks}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      )}

      {currentTab === "schedule" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ScheduleManager
            schedules={schedules}
            setSchedules={setSchedules}
            role={role}
            agendaTypes={agendaTypes}
            isDarkMode={isDarkMode}
            editTarget={editTarget}
            setEditTarget={setEditTarget}
          />
        </div>
      )}

      {currentTab === "routines" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <MasterRoutineManager
            routines={routines}
            setRoutines={setRoutines}
            role={role}
            isDarkMode={isDarkMode}
          />
        </div>
      )}

      {currentTab === "references" && (
        <div
          className={`animate-in fade-in slide-in-from-bottom-4 duration-500 p-8 rounded-[2.5rem] shadow-sm border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3
                className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
              >
                Referensi Planner
              </h3>
              <p
                className={`text-sm mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
              >
                Kelola kategori dan tipe untuk jadwal Anda.
              </p>
            </div>
          </div>
          <div
            className={`p-6 rounded-3xl mb-8 border ${isDarkMode ? "bg-slate-700 border-slate-600" : "bg-slate-50 border-slate-100"}`}
          >
            <h4
              className={`font-bold mb-2 ${isDarkMode ? "text-white" : "text-slate-800"}`}
            >
              Tambah Tipe Agenda
            </h4>
            <form onSubmit={handleAddType} className="flex gap-2">
              <input
                type="text"
                placeholder="Contoh: Webinar..."
                className={`flex-1 px-4 py-3 rounded-xl border-none shadow-sm ${isDarkMode ? "bg-slate-600 text-white placeholder-slate-400" : "bg-white"}`}
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
              />
              <button
                className={`px-6 rounded-xl font-bold transition-all ${isDarkMode ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-slate-900 text-white hover:bg-slate-800"}`}
              >
                Tambah
              </button>
            </form>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {agendaTypes.map((type, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 border rounded-xl hover:shadow-md transition-all group ${isDarkMode ? "bg-slate-700 border-slate-600" : "bg-white border-slate-100"}`}
              >
                <span
                  className={`font-bold text-sm ${isDarkMode ? "text-white" : "text-slate-700"}`}
                >
                  {type}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() =>
                      setEditModal({
                        show: true,
                        type: "agenda",
                        original: type,
                      })
                    }
                    className={`p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${isDarkMode ? "text-slate-400 hover:text-indigo-400 hover:bg-slate-600" : "text-slate-300 hover:text-indigo-600 hover:bg-indigo-50"}`}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() =>
                      setDeleteTypeModal({ show: true, type: type })
                    }
                    className={`p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${isDarkMode ? "text-slate-400 hover:text-red-400 hover:bg-slate-600" : "text-slate-300 hover:text-red-500 hover:bg-red-50"}`}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ==================================================================================
// 6. PRODUCTIVITY COMPONENTS (PARA METHOD & TOOLS)
// ==================================================================================

// 6.1. PARA INFO HELPER
// Komponen UI sederhana untuk menampilkan kartu informasi metode PARA (Projects, Areas, Resources, Archives)
