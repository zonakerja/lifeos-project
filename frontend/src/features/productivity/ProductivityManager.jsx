/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps */
import React from "react";
import { CalendarIcon, CheckCircle, Plus, Trash2, LayoutGrid, ChevronLeft, ChevronRight, CheckSquare, Clock, Edit3, X, FileText, ListTodo, Tag, Bot, Upload, Paperclip, Archive, Pencil, RotateCcw, History, Loader2, User, Check, Layers, FolderOpen, BookOpen, Box, Grid, Filter, Search, Database, Globe, Info, Save, XCircle, ExternalLink, List } from "lucide-react";
import { generateId, getProjectColorClass, useUserAwareState, formatLocalYMD, getMonthRange, getYearRange, updateGlobalResources, fileToGenerativePart, callGeminiAI, uploadFileToBackend } from "../../lib/lifeosUtils";
import { ConfirmationModal, AlertModal, PaginationControl } from "../../components/shared";
import { ResourceAIModal, ResourceInputSection, ResourceListTable } from "../resources/ResourceComponents";
import { SearchableDropdown } from "../../components/forms/SearchableDropdown";

export const ParaInfo = ({ title, description, color, icon: Icon, isDarkMode }) => (
  <div
    className={`p-4 rounded-xl border mb-6 flex items-start gap-3 ${isDarkMode ? "bg-slate-800 border-slate-700" : `${color} border-indigo-100`}`}
  >
    <div
      className={`p-2 rounded-lg ${isDarkMode ? "bg-slate-700 text-indigo-400" : "bg-white text-indigo-600"}`}
    >
      <Icon size={20} />
    </div>
    <div>
      <h4
        className={`font-bold text-sm mb-1 ${isDarkMode ? "text-white" : "text-slate-800"}`}
      >
        {title}
      </h4>
      <p
        className={`text-xs leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
      >
        {description}
      </p>
    </div>
  </div>
);

// ==================================================================================
// 6.2. UI UTILITIES
// ==================================================================================

// 6.2.1. Searchable Dropdown
// Dropdown custom yang memungkinkan pencarian item (filtering) saat memilih resource atau note
export const DayDetailModal = ({
  isOpen,
  onClose,
  date,
  projects,
  tasks,
  isDarkMode,
}) => {
  if (!isOpen || !date) return null;

  const dateStr = formatLocalYMD(date);
  const activeProjects = projects.filter((p) => {
    if (!p.startDate || !p.deadline) return false;
    return dateStr >= p.startDate && dateStr <= p.deadline;
  });
  const todaysTasks = tasks.filter((t) => t.dueDate === dateStr);
  const projectActions = todaysTasks.filter((t) => t.type === "project-action");
  const areaTasks = todaysTasks.filter((t) => t.type === "area-task");

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-[2.5rem] shadow-2xl p-6 border relative max-h-[85vh] flex flex-col ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-100"}`}
      >
        <button
          onClick={onClose}
          className={`absolute top-6 right-6 z-10 p-2 rounded-full transition-colors ${isDarkMode ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-500 hover:text-slate-800"}`}
        >
          <X size={20} />
        </button>
        <div className="mb-6 mt-2">
          <div
            className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`}
          >
            Agenda Harian
          </div>
          <h3
            className={`text-2xl font-extrabold ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            {date.toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
          {/* Active Projects */}
          {activeProjects.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-400 mb-3 flex items-center gap-2">
                <Layers size={14} /> Active Projects Running
              </h4>
              <div className="space-y-2">
                {activeProjects.map((p) => (
                  <div
                    key={p.id}
                    className={`p-3 rounded-xl border flex items-center gap-3 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${getProjectColorClass(p.id)}`}
                    ></div>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}
                      >
                        {p.title}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Deadline: {new Date(p.deadline).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Project Actions Due */}
          {projectActions.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-400 mb-3 flex items-center gap-2">
                <CheckCircle size={14} /> Project Actions Due
              </h4>
              <div className="space-y-2">
                {projectActions.map((t) => (
                  <div
                    key={t.id}
                    className={`p-3 rounded-xl border border-l-4 border-l-emerald-500 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
                  >
                    <p
                      className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}
                    >
                      {t.title}
                    </p>
                    {t.projectName && (
                      <p className="text-[10px] text-emerald-600 mt-1 font-medium">
                        {t.projectName}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Area Tasks Due */}
          {areaTasks.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-400 mb-3 flex items-center gap-2">
                <ListTodo size={14} /> Area Tasks Due
              </h4>
              <div className="space-y-2">
                {areaTasks.map((t) => (
                  <div
                    key={t.id}
                    className={`p-3 rounded-xl border border-l-4 border-l-orange-500 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
                  >
                    <p
                      className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}
                    >
                      {t.title}
                    </p>
                    {t.areaName && (
                      <p className="text-[10px] text-orange-600 mt-1 font-medium">
                        {t.areaName}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeProjects.length === 0 &&
            projectActions.length === 0 &&
            areaTasks.length === 0 && (
              <div className="text-center py-10 text-slate-400 italic">
                Tidak ada agenda tercatat untuk hari ini.
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

// 6.4.2. Calendar Widget
// Widget kalender bulanan yang menampilkan span project aktif dan deadline tugas
export const CalendarWidget = ({ projects, tasks, isDarkMode, onDateClick }) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const getDaysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getActiveProjectsForDate = (date) => {
    const dateStr = formatLocalYMD(date);
    return projects.filter((p) => {
      if (!p.startDate || !p.deadline) return false;
      return dateStr >= p.startDate && dateStr <= p.deadline;
    });
  };

  const getTasksForDate = (date) => {
    const dateStr = formatLocalYMD(date);
    return tasks.filter((t) => t.dueDate === dateStr);
  };

  const renderDays = () => {
    const days = [];
    // Render sel kosong sebelum tanggal 1
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className={`h-24 border-b border-r ${isDarkMode ? "border-slate-700" : "border-slate-100"} bg-transparent`}
        ></div>,
      );
    }
    // Render tanggal
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const activeProjects = getActiveProjectsForDate(date);
      const dayTasks = getTasksForDate(date);
      const projectActions = dayTasks.filter(
        (t) => t.type === "project-action",
      );
      const areaTasks = dayTasks.filter((t) => t.type === "area-task");
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <div
          key={`day-${i}`}
          onClick={() => onDateClick(date)}
          className={`min-h-[6rem] p-1 border-b border-r relative transition-colors group hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer ${isDarkMode ? "border-slate-700" : "border-slate-100"} ${isToday ? (isDarkMode ? "bg-slate-800" : "bg-indigo-50/30") : ""}`}
        >
          <div className="flex justify-between items-start">
            <span
              className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-indigo-600 text-white" : isDarkMode ? "text-slate-400" : "text-slate-500"}`}
            >
              {i}
            </span>
          </div>
          <div className="mt-1 space-y-1 overflow-hidden">
            {/* Indikator Project */}
            {activeProjects.slice(0, 3).map((p, idx) => (
              <div
                key={p.id}
                className={`h-1.5 rounded-full w-full relative group/tooltip ${getProjectColorClass(p.id)} opacity-40`}
                title={`Project: ${p.title}`}
              ></div>
            ))}
            {activeProjects.length > 3 && (
              <div className="h-1 text-[8px] text-slate-400 leading-none">
                +{activeProjects.length - 3} more
              </div>
            )}

            {/* Dot Indikator Tasks */}
            <div className="flex flex-wrap gap-1 mt-1">
              {projectActions.map((t, idx) => (
                <div
                  key={t.id}
                  className="w-2 h-2 rounded-full bg-emerald-500"
                  title={`Action: ${t.title}`}
                ></div>
              ))}
              {areaTasks.map((t, idx) => (
                <div
                  key={t.id}
                  className="w-2 h-2 rounded-full bg-orange-500"
                  title={`Area Task: ${t.title}`}
                ></div>
              ))}
            </div>
          </div>
        </div>,
      );
    }
    return days;
  };

  return (
    <div
      className={`rounded-3xl border overflow-hidden mb-8 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
    >
      <div
        className={`p-4 flex flex-col md:flex-row justify-between items-center border-b gap-4 ${isDarkMode ? "border-slate-700" : "border-slate-100"}`}
      >
        <h3
          className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-slate-800"}`}
        >
          Calendar Overview
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex gap-2 items-center">
            <button
              onClick={prevMonth}
              className={`p-1 rounded-lg ${isDarkMode ? "hover:bg-slate-700 text-white" : "hover:bg-slate-100 text-slate-700"}`}
            >
              <ChevronLeft size={20} />
            </button>
            <span
              className={`font-bold text-sm min-w-[140px] text-center capitalize ${isDarkMode ? "text-white" : "text-slate-800"}`}
            >
              {currentDate.toLocaleDateString("id-ID", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <button
              onClick={nextMonth}
              className={`p-1 rounded-lg ${isDarkMode ? "hover:bg-slate-700 text-white" : "hover:bg-slate-100 text-slate-700"}`}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div
        className={`flex flex-wrap gap-4 px-4 py-3 text-[10px] font-bold uppercase tracking-wider border-b ${isDarkMode ? "bg-slate-900/50 text-slate-400 border-slate-700" : "bg-slate-50 text-slate-500 border-slate-100"}`}
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-indigo-500 rounded-sm opacity-50"></div>{" "}
          Active Project Span
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Project
          Action
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div> Area Task
        </div>
      </div>

      <div
        className={`grid grid-cols-7 border-b text-center py-2 text-xs font-bold ${isDarkMode ? "text-slate-400 border-slate-700" : "text-slate-400 border-slate-100"}`}
      >
        {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">{renderDays()}</div>
    </div>
  );
};

// ==================================================================================
// 6.5. TIMELINE VIEW
// ==================================================================================

// 6.5.1. Timeline Component
// Menampilkan timeline vertikal yang menggabungkan tasks dan resources berdasarkan waktu
export const TimelineView = ({ project, tasks, openResource, isDarkMode }) => {
  // Gabungkan resources dan tasks menjadi satu array events
  const allEvents = [
    ...(project.resources || []).map((r) => ({
      id: r.id,
      type: "resource",
      date: r.date || project.startDate || new Date().toISOString(),
      title: r.name,
      description: r.description || "Dasar Pelaksanaan",
      data: r,
    })),
    ...tasks
      .filter((t) => t.projectId === project.id)
      .map((t) => ({
        id: t.id,
        type: "task",
        date: t.dueDate || new Date().toISOString(),
        title: t.title,
        description: t.description,
        data: t,
        attachments: t.resources || [],
      })),
  ];
  allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

  if (allEvents.length === 0)
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Clock size={48} className="mb-4 opacity-20" />
        <p>Belum ada data untuk timeline.</p>
      </div>
    );

  return (
    <div className="relative pl-8 pr-4 py-6 space-y-8 before:absolute before:left-[21px] before:top-4 before:bottom-4 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-700">
      {allEvents.map((event, idx) => (
        <div key={`${event.type}-${event.id}-${idx}`} className="relative">
          {/* Icon Marker */}
          <div
            className={`absolute -left-[29px] top-1 w-6 h-6 rounded-full border-[3px] z-10 flex items-center justify-center ${event.type === "resource" ? "bg-indigo-100 border-indigo-500 text-indigo-600" : "bg-emerald-100 border-emerald-500 text-emerald-600"} ${isDarkMode ? "bg-slate-800" : ""}`}
          >
            {event.type === "resource" ? (
              <BookOpen size={10} strokeWidth={3} />
            ) : (
              <CheckCircle size={10} strokeWidth={3} />
            )}
          </div>

          {/* Event Card */}
          <div
            className={`p-4 rounded-2xl border transition-all hover:shadow-md ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-2">
              <div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mr-2 ${event.type === "resource" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"}`}
                >
                  {event.type === "resource" ? "Dasar" : "Action"}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {new Date(event.date).toLocaleDateString()}
                </span>
                <h4
                  className={`font-bold text-lg mt-1 ${isDarkMode ? "text-white" : "text-slate-800"}`}
                >
                  {event.title}
                </h4>
              </div>
            </div>
            {event.description && (
              <p className="text-sm text-slate-500 mb-3">{event.description}</p>
            )}

            {/* Attachments for Task */}
            {event.type === "task" &&
              event.attachments &&
              event.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-dashed border-slate-200">
                  {event.attachments.map((res, i) => (
                    <button
                      key={i}
                      onClick={() => openResource(res)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs border hover:bg-slate-100 ${isDarkMode ? "bg-slate-700 border-slate-600 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}
                    >
                      {res.type === "file" ? (
                        <FileText size={10} />
                      ) : (
                        <ExternalLink size={10} />
                      )}{" "}
                      {res.name}
                    </button>
                  ))}
                </div>
              )}

            {/* Button for Resource Type */}
            {event.type === "resource" && (
              <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-dashed border-slate-200">
                <button
                  onClick={() => openResource(event.data)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs border hover:bg-slate-100 ${isDarkMode ? "bg-slate-700 border-slate-600 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}
                >
                  {event.data.type === "file" ? (
                    <FileText size={10} />
                  ) : (
                    <ExternalLink size={10} />
                  )}{" "}
                  Buka Dokumen
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ==================================================================================
// 6.6. PROJECT TASK MANAGER (CORE LOGIC)
// ==================================================================================

// 6.6.1. Task Manager Component
// Komponen utama untuk mengelola daftar tugas dalam sebuah project atau area
export const ProjectTaskManager = ({
  project,
  tasks,
  setTasks,
  resources,
  setResources,
  freeNotes,
  aiNotes,
  lists,
  geminiApiKey,
  isDarkMode,
  type = "Project",
  setAlertModal,
}) => {
  const [viewMode, setViewMode] = React.useState("list");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [dateFilter, setDateFilter] = React.useState("all");
  const [customDate, setCustomDate] = React.useState({ start: "", end: "" });
  const taskLabel = type === "Project" ? "Action" : "Task";

  const [isTaskFormOpen, setIsTaskFormOpen] = React.useState(false);
  const [newTask, setNewTask] = React.useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    weight: 0,
    resources: [],
  });
  const [editingTask, setEditingTask] = React.useState(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState({
    show: false,
    id: null,
    itemName: "",
  });
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
  const [fileStatus, setFileStatus] = React.useState("idle");

  // Menambahkan resource sementara ke dalam task yang sedang dibuat
  const handleAddResourceToTask = () => {
    if (!tempResource.name) {
      if (setAlertModal)
        setAlertModal({
          isOpen: true,
          title: "Validasi",
          message: "Nama resource wajib diisi.",
          type: "error",
        });
      return;
    }
    const resourceDate =
      tempResource.date ||
      newTask.dueDate ||
      new Date().toISOString().split("T")[0];
    const resourceData = {
      id: generateId("tr"),
      ...tempResource,
      date: resourceDate,
    };
    setNewTask((prev) => ({
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
    setNewTask((prev) => ({
      ...prev,
      resources: (prev.resources || []).filter((r) => r.id !== resId),
    }));
  };

  // Handler upload file lokal dengan integrasi Gemini AI (untuk summary)
  const handleLocalFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
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

    if (!geminiApiKey) {
      setFileStatus("error");
      return;
    }
    setFileStatus("processing");

    try {
      let filePart;
      if (
        file.type === "application/pdf" ||
        file.type.startsWith("image/") ||
        file.type === "text/plain"
      ) {
        filePart = await fileToGenerativePart(file);
        const summary = await callGeminiAI(
          geminiApiKey,
          "Ekstrak dan buat ringkasan komprehensif dari dokumen ini untuk keperluan knowledge-base AI masa depan. Gunakan format Markdown yang rapi dan sertakan poin-poin penting. Gunakan delimiter $$ untuk blok rumus matematika.",
          [filePart],
        );

        setTempResource((prev) => ({ ...prev, aiSummary: summary }));
        setNewTask((prev) => ({
          ...prev,
          resources: (prev.resources || []).map((r) =>
            r.url === fakeUrl ? { ...r, aiSummary: summary } : r,
          ),
        }));
        setResources((prev) =>
          prev.map((r) =>
            r.url === fakeUrl ? { ...r, aiSummary: summary } : r,
          ),
        );
        setAiModalRes((prev) =>
          prev && prev.url === fakeUrl ? { ...prev, aiSummary: summary } : prev,
        );

        setFileStatus("done");
      } else {
        setFileStatus("error");
        if (setAlertModal)
          setAlertModal({
            isOpen: true,
            title: "Format Tidak Didukung",
            message: "Gunakan format PDF, Image, atau Txt untuk ekstraksi AI.",
            type: "error",
          });
      }
    } catch (error) {
      setFileStatus("error");
      const errMsg = error?.message || String(error);
      if (
        errMsg.toLowerCase().includes("quota") ||
        errMsg.includes("429") ||
        errMsg.toLowerCase().includes("exceeded")
      ) {
        if (setAlertModal)
          setAlertModal({
            isOpen: true,
            title: "Limit API Tercapai ⚠️",
            message:
              "⚠️ Limit API Gemini Anda Tercapai.\n\nFile Anda tetap berhasil dilampirkan dengan status 'No AI'. Silakan klik 'Simpan', lalu gunakan ikon Robot pada tabel untuk mengekstrak ulang nanti.",
            type: "error",
          });
      } else {
        if (setAlertModal)
          setAlertModal({
            isOpen: true,
            title: "Ekstraksi AI Gagal",
            message: errMsg,
            type: "error",
          });
      }
    }
  };

  // Filter tasks berdasarkan pencarian dan tanggal
  const filteredTasks = tasks
    .filter((t) => {
      if (t.projectId !== project.id) return false;
      if (
        searchQuery &&
        !t.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      if (!t.dueDate) return dateFilter === "all";

      const taskDate = new Date(t.dueDate);
      const now = new Date();
      if (dateFilter === "month")
        return (
          taskDate.getMonth() === now.getMonth() &&
          taskDate.getFullYear() === now.getFullYear()
        );
      if (dateFilter === "year")
        return taskDate.getFullYear() === now.getFullYear();
      if (dateFilter === "custom" && customDate.start && customDate.end)
        return (
          formatLocalYMD(taskDate) >= customDate.start &&
          formatLocalYMD(taskDate) <= customDate.end
        );

      return true;
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  // Simpan Task Baru / Edit Task
  const handleSaveAction = () => {
    if (!newTask.title.trim()) {
      if (setAlertModal)
        setAlertModal({
          isOpen: true,
          title: "Validasi",
          message: `Nama ${taskLabel} wajib diisi.`,
          type: "error",
        });
      return;
    }
    const processedResources = [];
    const tagToAdd = type === "Project" ? "Project Action" : "Area Task";
    setResources((prev) =>
      updateGlobalResources(prev, newTask.resources, tagToAdd),
    );
    newTask.resources.forEach((res) => {
      processedResources.push({ ...res });
    });
    const finalTaskData = { ...newTask, resources: processedResources };

    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id ? { ...t, ...finalTaskData } : t,
        ),
      );
      setEditingTask(null);
    } else {
      setTasks((prev) => [
        ...prev,
        {
          id: generateId("pt"),
          projectId: project.id,
          ...finalTaskData,
          completed: false,
          createdAt: new Date(),
        },
      ]);
    }
    setNewTask({
      title: "",
      description: "",
      dueDate: "",
      priority: "medium",
      weight: 0,
      resources: [],
    });
    setIsTaskFormOpen(false);
  };

  const toggleTask = (taskId) => {
    setTasks(
      tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t,
      ),
    );
  };

  const updateTaskWeight = (taskId, newWeight) => {
    const weightVal = parseFloat(newWeight) || 0;
    setTasks(
      tasks.map((t) => (t.id === taskId ? { ...t, weight: weightVal } : t)),
    );
  };

  const confirmDelete = (item) =>
    setDeleteConfirm({ show: true, id: item.id, itemName: item.title });
  const executeDelete = () => {
    setTasks(tasks.filter((t) => t.id !== deleteConfirm.id));
    setDeleteConfirm({ show: false, id: null, itemName: "" });
  };

  const openResource = (res) => {
    if (res.url) window.open(res.url, "_blank");
    else if (setAlertModal)
      setAlertModal({
        isOpen: true,
        title: "Gagal",
        message: "Tidak ada link/file yang bisa dibuka.",
        type: "error",
      });
  };

  // Kalkulasi Progress Project
  const allProjectTasks = tasks.filter((t) => t.projectId === project.id);
  const totalWeight = allProjectTasks.reduce(
    (acc, t) => acc + (parseFloat(t.weight) || 0),
    0,
  );
  const completedWeight = allProjectTasks
    .filter((t) => t.completed)
    .reduce((acc, t) => acc + (parseFloat(t.weight) || 0), 0);
  const taskProgress =
    totalWeight > 0
      ? (completedWeight / totalWeight) * 100
      : allProjectTasks.length > 0
        ? (allProjectTasks.filter((t) => t.completed).length /
            allProjectTasks.length) *
          100
        : 0;

  const calculateTimeProgress = () => {
    if (!project.startDate || !project.deadline) return 0;
    const start = new Date(project.startDate).getTime();
    const end = new Date(project.deadline).getTime();
    const now = new Date().getTime();
    if (end <= start) return 100;
    const percent = ((now - start) / (end - start)) * 100;
    return Math.min(100, Math.max(0, percent));
  };
  const timeProgress = calculateTimeProgress();

  if (!project)
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-10 text-center">
        <Layers size={64} className="mb-4 opacity-20" />
        <h3 className="text-xl font-bold mb-2">Pilih Project / Kegiatan</h3>
        <p>
          Pilih salah satu kegiatan untuk melihat dan mengelola{" "}
          {taskLabel.toLowerCase()}.
        </p>
      </div>
    );

  // RENDER: Task Form Mode
  if (isTaskFormOpen) {
    return (
      <div
        className={`flex flex-col h-full animate-in slide-in-from-bottom-4 ${isDarkMode ? "bg-slate-900" : "bg-white"}`}
      >
        <ResourceAIModal
          isOpen={!!aiModalRes}
          onClose={() => setAiModalRes(null)}
          resource={aiModalRes}
          onSave={(id, summary) => {
            setNewTask((prev) => ({
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
          className={`p-6 pr-20 border-b flex justify-between items-center ${isDarkMode ? "border-slate-700" : "border-slate-100"}`}
        >
          <h3
            className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            {editingTask ? `Edit ${taskLabel}` : `Buat ${taskLabel} Baru`}
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIsTaskFormOpen(false);
                setEditingTask(null);
              }}
              className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 text-sm"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveAction}
              className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg text-sm"
            >
              Simpan {taskLabel}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">
                Nama {taskLabel}
              </label>
              <input
                autoFocus
                type="text"
                className={`w-full px-4 py-3 rounded-xl border mt-1 ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                value={newTask.title || ""}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
                placeholder="Apa yang harus diselesaikan?"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">
                Deskripsi
              </label>
              <textarea
                rows="3"
                className={`w-full px-4 py-3 rounded-xl border mt-1 ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                value={newTask.description || ""}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
                placeholder={`Detail ${taskLabel.toLowerCase()}...`}
              />
            </div>
            <div
              className={`grid grid-cols-1 gap-4 ${type === "Project" ? "md:grid-cols-3" : "md:grid-cols-2"}`}
            >
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">
                  Tanggal
                </label>
                <input
                  type="date"
                  className={`w-full px-4 py-3 rounded-xl border mt-1 ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                  value={newTask.dueDate || ""}
                  onChange={(e) =>
                    setNewTask({ ...newTask, dueDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">
                  Prioritas
                </label>
                <select
                  className={`w-full px-4 py-3 rounded-xl border mt-1 ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                  value={newTask.priority || "medium"}
                  onChange={(e) =>
                    setNewTask({ ...newTask, priority: e.target.value })
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              {type === "Project" && (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">
                    Bobot (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className={`w-full px-4 py-3 rounded-xl border mt-1 ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                    value={newTask.weight}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        weight: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section Resources dalam Form Task */}
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
                    date: newTask.dueDate || "",
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
                fileStatus={fileStatus}
                handleFileSelect={handleLocalFileSelect}
                freeNotes={freeNotes}
                aiNotes={aiNotes}
                lists={lists}
                resources={resources}
                onCancel={() => setIsAddingResource(false)}
              />
            )}
            <ResourceListTable
              resources={newTask.resources}
              isDarkMode={isDarkMode}
              openResource={openResource}
              removeResource={removeResourceFromTask}
              openAIView={setAiModalRes}
            />
          </div>
        </div>
      </div>
    );
  }

  // RENDER: List / Timeline View Mode
  return (
    <>
      <ConfirmationModal
        isOpen={deleteConfirm.show}
        onClose={() =>
          setDeleteConfirm({ show: false, id: null, itemName: "" })
        }
        onConfirm={executeDelete}
        title={`Hapus ${taskLabel}?`}
        itemName={deleteConfirm.itemName}
        message={`Anda yakin ingin menghapus ${taskLabel.toLowerCase()} ini secara permanen?`}
      />

      {/* Project Header Info */}
      <div
        className={`p-6 md:p-10 border-b ${isDarkMode ? "border-slate-700" : "border-slate-100"}`}
      >
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${isDarkMode ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-500"}`}
          >
            {type}
          </span>
          {project.deadline && (
            <span className="text-[10px] flex items-center gap-1 text-slate-400">
              <CalendarIcon size={10} />{" "}
              {new Date(project.deadline).toLocaleDateString()}
            </span>
          )}
        </div>
        <h2
          className={`text-3xl font-extrabold mb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}
        >
          {project.title}
        </h2>
        {project.description && (
          <p className="text-slate-500 text-sm mb-6">{project.description}</p>
        )}

        {/* Progress Bars (hanya untuk Project) */}
        {type === "Project" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div
              className={`p-4 rounded-xl border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}
            >
              <div className="flex justify-between text-xs font-bold mb-2 text-slate-500">
                <span>Task Completion (Weighted)</span>
                <span>{taskProgress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${taskProgress}%` }}
                ></div>
              </div>
            </div>
            <div
              className={`p-4 rounded-xl border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}
            >
              <div className="flex justify-between text-xs font-bold mb-2 text-slate-500">
                <span>Time Elapsed</span>
                <span>{timeProgress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${timeProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Project Resources */}
        {project.resources && project.resources.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
              <BookOpen size={12} /> Dasar Pelaksanaan / Resources
            </div>
            <div className="flex flex-wrap gap-2">
              {project.resources.map((res, i) => (
                <button
                  key={i}
                  onClick={() => openResource(res)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border hover:bg-slate-100 transition-colors ${isDarkMode ? "bg-slate-800 border-slate-600 text-indigo-400" : "bg-white border-slate-200 text-indigo-600"}`}
                >
                  {res.type === "file" ? (
                    <FileText size={12} />
                  ) : (
                    <ExternalLink size={12} />
                  )}{" "}
                  <span className="font-bold">{res.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Controls: View Mode & Search */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
          <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${viewMode === "list" ? "bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-white" : "text-slate-500"}`}
            >
              <List size={14} /> List
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${viewMode === "timeline" ? "bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-white" : "text-slate-500"}`}
            >
              <Clock size={14} /> Timeline
            </button>
          </div>
          {viewMode === "list" && (
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <div
                className={`flex-1 flex items-center px-4 py-2 rounded-xl border ${isDarkMode ? "bg-slate-800 border-slate-600" : "bg-slate-50 border-slate-200"}`}
              >
                <Search size={14} className="text-slate-400 mr-2" />
                <input
                  type="text"
                  placeholder={`Cari...`}
                  className={`bg-transparent border-none focus:ring-0 focus:outline-none w-full text-xs font-bold ${isDarkMode ? "text-white placeholder-slate-500" : "text-slate-900 placeholder-slate-400"}`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto overflow-x-auto custom-scrollbar pb-1 md:pb-0">
                <select
                  className={`px-4 py-2 rounded-xl border text-xs font-bold appearance-none cursor-pointer ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-700"}`}
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">Semua Waktu</option>
                  <option value="month">Bulan Ini</option>
                  <option value="year">Tahun Ini</option>
                  <option value="custom">Custom Range</option>
                </select>
                {dateFilter === "custom" && (
                  <div className="flex items-center gap-1 animate-in slide-in-from-left-2">
                    <input
                      type="date"
                      className={`px-2 py-1.5 rounded-xl border text-xs outline-none ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-700"}`}
                      value={customDate.start}
                      onChange={(e) =>
                        setCustomDate({ ...customDate, start: e.target.value })
                      }
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="date"
                      className={`px-2 py-1.5 rounded-xl border text-xs outline-none ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-700"}`}
                      value={customDate.end}
                      onChange={(e) =>
                        setCustomDate({ ...customDate, end: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-3 custom-scrollbar">
        {viewMode === "timeline" ? (
          <TimelineView
            project={project}
            tasks={tasks}
            openResource={openResource}
            isDarkMode={isDarkMode}
          />
        ) : (
          <>
            {filteredTasks.length === 0 && (
              <div className="text-center py-20 opacity-50">
                <CheckSquare
                  size={48}
                  className="mx-auto mb-4 text-slate-300"
                />
                <p className="text-slate-500">
                  Belum ada {taskLabel.toLowerCase()} yang sesuai filter.
                </p>
              </div>
            )}

            {filteredTasks.map((task, idx) => (
              <div
                key={`${task.id || "task"}-${idx}`}
                className={`group flex flex-col p-4 rounded-2xl border transition-all hover:shadow-md ${task.completed ? (isDarkMode ? "bg-slate-800/50 border-slate-700 opacity-60" : "bg-slate-50 border-slate-100 opacity-60") : isDarkMode ? "bg-slate-800 border-slate-600" : "bg-white border-slate-200"}`}
              >
                <div className="flex items-start w-full">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center mr-4 transition-colors flex-shrink-0 mt-1 ${task.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 hover:border-emerald-400"}`}
                  >
                    {task.completed && <Check size={14} strokeWidth={4} />}
                  </button>

                  {/* Task Detail */}
                  <div className="flex-1">
                    <h4
                      className={`font-bold text-sm ${task.completed ? "line-through text-slate-500" : isDarkMode ? "text-white" : "text-slate-800"}`}
                    >
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex gap-3 text-xs text-slate-400 mt-2">
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <CalendarIcon size={10} />{" "}
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      <span
                        className={`capitalize ${task.priority === "high" ? "text-red-500 font-bold" : ""}`}
                      >
                        {task.priority} Priority
                      </span>
                      {task.resources && task.resources.length > 0 && (
                        <span className="flex items-center gap-1 text-indigo-500">
                          <Paperclip size={10} /> {task.resources.length}{" "}
                          Lampiran
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bobot Input (Only Project) */}
                  {type === "Project" && (
                    <div className="flex flex-col items-end mr-4">
                      <label className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                        Bobot
                      </label>
                      <input
                        type="number"
                        className={`w-12 p-1 text-xs text-center border rounded font-bold ${isDarkMode ? "bg-slate-900 border-slate-600 text-white" : "bg-slate-100 border-slate-200"}`}
                        value={task.weight || 0}
                        onChange={(e) =>
                          updateTaskWeight(task.id, e.target.value)
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingTask(task);
                        setNewTask({
                          ...task,
                          resources: task.resources || [],
                        });
                        setIsTaskFormOpen(true);
                      }}
                      className="p-2 text-slate-300 hover:text-indigo-500"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => confirmDelete(task)}
                      className="p-2 text-slate-300 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Task Attachments Preview */}
                {task.resources && task.resources.length > 0 && (
                  <div
                    className={`mt-3 pt-3 border-t w-full ${isDarkMode ? "border-slate-700" : "border-slate-100"}`}
                  >
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">
                      Lampiran:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {task.resources.map((res, i) => (
                        <button
                          key={i}
                          onClick={() => openResource(res)}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs border hover:bg-slate-100 ${isDarkMode ? "bg-slate-700 border-slate-600 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}
                        >
                          <span className="text-[10px] font-mono mr-1 text-slate-400">
                            {res.number || `#${i + 1}`}
                          </span>
                          {res.type === "file" ? (
                            <FileText size={10} />
                          ) : (
                            <ExternalLink size={10} />
                          )}{" "}
                          {res.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Floating Action Button (untuk View List) */}
      {viewMode === "list" && (
        <div
          className={`p-6 border-t ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
        >
          <button
            onClick={() => {
              setNewTask({
                title: "",
                description: "",
                dueDate: "",
                priority: "medium",
                weight: 0,
                resources: [],
              });
              setIsTaskFormOpen(true);
            }}
            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${isDarkMode ? "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"}`}
          >
            <Plus size={20} /> Tambah {taskLabel} Baru
          </button>
        </div>
      )}
    </>
  );
};

// ==================================================================================
// 6.7. PARA CARDS UI
// ==================================================================================

// 6.7.1. Area Card
// Kartu tampilan untuk kategori Area of Responsibility
export const AreaCard = ({
  area,
  activities = [],
  projects = [],
  onClick,
  isDarkMode,
  onEdit,
  onArchive,
  onDelete,
}) => {
  const areaActivities = activities.filter((a) => a.areaId === area.id);
  const areaProjects = projects.filter((p) => p.areaId === area.id);

  return (
    <div
      onClick={() => onClick(area)}
      className={`w-full text-left p-6 rounded-[2rem] border relative overflow-hidden group transition-transform hover:scale-[1.02] ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100 hover:shadow-xl"} cursor-pointer`}
    >
      <div
        className={`absolute top-0 right-0 p-10 rounded-bl-[4rem] opacity-20 ${area.color || "bg-slate-200"}`}
      ></div>
      <div className="relative z-10 flex justify-between items-start mb-2">
        <h4
          className={`font-bold text-xl ${isDarkMode ? "text-white" : "text-slate-900"}`}
        >
          {area.title}
        </h4>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(area);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50/50 transition-colors"
          >
            <Edit3 size={16} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onArchive(area);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-orange-500 hover:bg-orange-50/50 transition-colors"
          >
            <Archive size={16} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(area);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50/50 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-500 mb-6 relative z-10 line-clamp-2">
        {area.description || "Area tanggung jawab utama."}
      </p>
      <div className="flex justify-between items-end relative z-10">
        <span className="text-2xl font-extrabold text-slate-300">
          {areaProjects.length}
        </span>
        <span className="text-[10px] font-bold uppercase text-slate-400">
          Active Projects
        </span>
      </div>
    </div>
  );
};

// 6.7.2. Project Card
// Kartu tampilan untuk Project dengan progress bar
export const ProjectCard = ({
  project,
  tasks = [],
  areas = [],
  onArchive,
  onEdit,
  onDelete,
  isDarkMode,
  onClick,
}) => {
  const area = areas.find((a) => a.id === project.areaId);
  const pTasks = tasks.filter((t) => t.projectId === project.id);
  const totalWeight = pTasks.reduce(
    (acc, t) => acc + (parseFloat(t.weight) || 0),
    0,
  );
  const completedWeight = pTasks
    .filter((t) => t.completed)
    .reduce((acc, t) => acc + (parseFloat(t.weight) || 0), 0);
  const progress =
    totalWeight > 0
      ? (completedWeight / totalWeight) * 100
      : pTasks.length > 0
        ? (pTasks.filter((t) => t.completed).length / pTasks.length) * 100
        : 0;

  const calculateTimeProgress = () => {
    if (!project.startDate || !project.deadline) return 0;
    const start = new Date(project.startDate).getTime();
    const end = new Date(project.deadline).getTime();
    const now = new Date().getTime();
    if (end <= start) return 100;
    const percent = ((now - start) / (end - start)) * 100;
    return Math.min(100, Math.max(0, percent));
  };
  const timeProgress = calculateTimeProgress();

  return (
    <div
      onClick={() => onClick(project)}
      className={`p-5 rounded-3xl border transition-all hover:shadow-lg cursor-pointer group ${isDarkMode ? "bg-slate-800 border-slate-700 hover:border-indigo-500" : "bg-white border-slate-100 hover:border-indigo-200"}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <span
            className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${area ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700"}`}
          >
            {area ? area.title : "Free Project"}
          </span>
          <h4
            className={`font-bold text-lg mt-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            {project.title}
          </h4>
        </div>
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(project);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(project);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onArchive("project", project);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-orange-500 hover:bg-orange-50"
          >
            <Archive size={16} />
          </button>
        </div>
      </div>

      {/* Task Progress */}
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-slate-400 font-bold uppercase">
          Task
        </span>
        <span className="text-[10px] font-bold text-indigo-600">
          {progress.toFixed(0)}%
        </span>
      </div>
      <div className="w-full bg-slate-200 h-1.5 rounded-full mb-3 overflow-hidden">
        <div
          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Time Progress */}
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-slate-400 font-bold uppercase">
          Waktu
        </span>
        <span className="text-[10px] font-bold text-blue-600">
          {timeProgress.toFixed(0)}%
        </span>
      </div>
      <div className="w-full bg-slate-200 h-1.5 rounded-full mb-3 overflow-hidden">
        <div
          className="bg-blue-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${timeProgress}%` }}
        ></div>
      </div>

      <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
        <span>
          Deadline:{" "}
          {project.deadline
            ? new Date(project.deadline).toLocaleDateString()
            : "-"}
        </span>
      </div>
    </div>
  );
};

// ==================================================================================
// 6.8. MODAL WRAPPERS
// ==================================================================================

// 6.8.1. Project Detail Modal
// Wrapper modal untuk ProjectTaskManager
export const ProjectDetailModal = ({
  isOpen,
  onClose,
  project,
  tasks,
  setTasks,
  resources,
  setResources,
  freeNotes,
  aiNotes,
  lists,
  geminiApiKey,
  isDarkMode,
  setAlertModal,
}) => {
  if (!isOpen || !project) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in">
      <div
        className={`w-full max-w-4xl h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border relative ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-100"}`}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-2 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <X size={20} />
        </button>
        <ProjectTaskManager
          key={`project-modal-${project.id}`}
          project={project}
          tasks={tasks}
          setTasks={setTasks}
          resources={resources}
          setResources={setResources}
          freeNotes={freeNotes}
          aiNotes={aiNotes}
          lists={lists}
          geminiApiKey={geminiApiKey}
          isDarkMode={isDarkMode}
          type="Project"
          setAlertModal={setAlertModal}
        />
      </div>
    </div>
  );
};

// 6.8.2. Area Detail Modal
// Modal untuk mengelola detail Area, termasuk daftar Kegiatan (Activities) dan Projects di dalamnya
export const AreaDetailModal = ({
  isOpen,
  onClose,
  area,
  projects,
  setProjects,
  activities,
  setActivities,
  tasks,
  setTasks,
  resources,
  setResources,
  freeNotes,
  aiNotes,
  lists,
  geminiApiKey,
  isDarkMode,
  onArchiveArea,
  onUpdateArea,
  areas,
  setAlertModal,
}) => {
  // State Management
  const [selectedId, setSelectedId] = React.useState(null);
  const [selectedType, setSelectedType] = React.useState("activity"); // 'activity' or 'project'
  const [localArea, setLocalArea] = React.useState(area);
  const [isEditingArea, setIsEditingArea] = React.useState(false);
  const [editAreaForm, setEditAreaForm] = React.useState({
    title: "",
    description: "",
  });

  // Sub-Modal States
  const [isActivityModalOpen, setIsActivityModalOpen] = React.useState(false);
  const [activityForm, setActivityForm] = React.useState({
    id: null,
    title: "",
    deadline: "",
    status: "active",
  });

  const [isProjectFormOpen, setIsProjectFormOpen] = React.useState(false);
  const [projectForm, setProjectForm] = React.useState({
    id: null,
    title: "",
    description: "",
    startDate: "",
    deadline: "",
    status: "active",
    resources: [],
  });

  // Resource & AI States
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
  const [deleteConfirm, setDeleteConfirm] = React.useState({
    show: false,
    id: null,
    type: "",
    itemName: "",
  });
  const [aiModalRes, setAiModalRes] = React.useState(null);
  const [fileStatus, setFileStatus] = React.useState("idle");

  // Effect: Sync local state when modal opens
  React.useEffect(() => {
    if (isOpen && area) {
      setSelectedId(null);
      setLocalArea(area);
      setEditAreaForm({
        title: area.title,
        description: area.description || "",
      });
    }
  }, [area?.id, isOpen]);

  // Handler: Update Area Info
  const handleEditAreaSave = () => {
    const updated = { ...localArea, ...editAreaForm };
    onUpdateArea(updated);
    setLocalArea(updated);
    setIsEditingArea(false);
  };

  if (!isOpen || !localArea) return null;

  // Filtering Data
  const areaActivities = activities.filter((a) => a.areaId === localArea.id);
  const areaProjects = projects.filter((p) => p.areaId === localArea.id);
  const currentSelection =
    selectedType === "activity"
      ? areaActivities.find((a) => a.id === selectedId)
      : areaProjects.find((p) => p.id === selectedId);

  // --- Handlers: Activities ---
  const openAddActivity = () => {
    setActivityForm({ id: null, title: "", deadline: "", status: "active" });
    setIsActivityModalOpen(true);
  };

  const openEditActivity = (act) => {
    setActivityForm({
      id: act.id,
      title: act.title || "",
      deadline: act.deadline || "",
      status: act.status || "active",
    });
    setIsActivityModalOpen(true);
    setSelectedId(act.id);
    setSelectedType("activity");
  };

  const handleSaveActivity = (e) => {
    e.preventDefault();
    if (!activityForm.title.trim()) return;

    if (activityForm.id && activities.some((a) => a.id === activityForm.id)) {
      setActivities(
        activities.map((a) =>
          a.id === activityForm.id ? { ...a, ...activityForm } : a,
        ),
      );
    } else {
      const newAct = {
        areaId: localArea.id,
        ...activityForm,
        id: generateId("act"),
        progress: 0,
        createdAt: new Date(),
      };
      setActivities([...activities, newAct]);
      setSelectedId(newAct.id);
      setSelectedType("activity");
    }
    setIsActivityModalOpen(false);
  };

  // --- Handlers: Projects ---
  const openAddProject = () => {
    setProjectForm({
      id: null,
      title: "",
      description: "",
      startDate: "",
      deadline: "",
      status: "active",
      resources: [],
    });
    setIsProjectFormOpen(true);
  };

  const openEditProject = (proj) => {
    setProjectForm({ ...proj, resources: proj.resources || [] });
    setIsProjectFormOpen(true);
    setSelectedId(proj.id);
    setSelectedType("project");
  };

  // --- Handlers: Resources inside Project Form ---
  const handleAddResourceToProject = () => {
    if (!tempResource.name) {
      if (setAlertModal)
        setAlertModal({
          isOpen: true,
          title: "Validasi",
          message: "Nama resource wajib diisi.",
          type: "error",
        });
      return;
    }
    const resourceDate =
      tempResource.date ||
      projectForm.deadline ||
      new Date().toISOString().split("T")[0];
    const resourceData = {
      id: generateId("pr"),
      ...tempResource,
      date: resourceDate,
    };

    setProjectForm((prev) => ({
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

  const removeResourceFromProject = (resId) => {
    setProjectForm((prev) => ({
      ...prev,
      resources: (prev.resources || []).filter((r) => r.id !== resId),
    }));
  };

  // Handler: File Upload & AI Summary for Project
  const handleFileSelectForProject = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

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

    if (!geminiApiKey) {
      setFileStatus("error");
      return;
    }
    setFileStatus("processing");

    try {
      let filePart;
      if (
        file.type === "application/pdf" ||
        file.type.startsWith("image/") ||
        file.type === "text/plain"
      ) {
        filePart = await fileToGenerativePart(file);
        const summary = await callGeminiAI(
          geminiApiKey,
          "Ekstrak dan buat ringkasan komprehensif dari dokumen ini untuk keperluan knowledge-base AI masa depan. Gunakan format Markdown yang rapi dan sertakan poin-poin penting. Gunakan delimiter $$ untuk blok rumus matematika.",
          [filePart],
        );

        setTempResource((prev) => ({ ...prev, aiSummary: summary }));
        setProjectForm((prev) => ({
          ...prev,
          resources: (prev.resources || []).map((r) =>
            r.url === fakeUrl ? { ...r, aiSummary: summary } : r,
          ),
        }));
        setResources((prev) =>
          prev.map((r) =>
            r.url === fakeUrl ? { ...r, aiSummary: summary } : r,
          ),
        );
        setAiModalRes((prev) =>
          prev && prev.url === fakeUrl ? { ...prev, aiSummary: summary } : prev,
        );

        setFileStatus("done");
      } else {
        setFileStatus("error");
        if (setAlertModal)
          setAlertModal({
            isOpen: true,
            title: "Format Tidak Didukung",
            message: "Gunakan format PDF, Image, atau Txt untuk ekstraksi AI.",
            type: "error",
          });
      }
    } catch (error) {
      setFileStatus("error");
      const errMsg = error?.message || String(error);
      if (
        errMsg.toLowerCase().includes("quota") ||
        errMsg.includes("429") ||
        errMsg.toLowerCase().includes("exceeded")
      ) {
        if (setAlertModal)
          setAlertModal({
            isOpen: true,
            title: "Limit API Tercapai ⚠️",
            message:
              "⚠️ Limit API Gemini Anda Tercapai.\n\nFile Anda tetap berhasil dilampirkan dengan status 'No AI'. Silakan klik 'Simpan', lalu gunakan ikon Robot pada tabel untuk mengekstrak ulang nanti.",
            type: "error",
          });
      } else {
        if (setAlertModal)
          setAlertModal({
            isOpen: true,
            title: "Ekstraksi AI Gagal",
            message: errMsg,
            type: "error",
          });
      }
    }
  };

  const openResource = (res) => {
    if (res.url) window.open(res.url, "_blank");
    else if (setAlertModal)
      setAlertModal({
        isOpen: true,
        title: "Gagal",
        message: "Tidak ada link/file yang bisa dibuka.",
        type: "error",
      });
  };

  const handleSaveProject = (e) => {
    e.preventDefault();
    if (!projectForm.title.trim()) return;

    // Update global resources if needed
    setResources((prev) =>
      updateGlobalResources(prev, projectForm.resources || [], "Project Basis"),
    );

    const processedResources = [];
    (projectForm.resources || []).forEach((res) => {
      processedResources.push({ ...res });
    });

    const finalProjectData = { ...projectForm, resources: processedResources };
    finalProjectData.areaId = localArea.id;

    if (projectForm.id && projects.some((p) => p.id === projectForm.id)) {
      setProjects(
        projects.map((p) =>
          p.id === projectForm.id ? { ...p, ...finalProjectData } : p,
        ),
      );
    } else {
      const newProj = {
        ...finalProjectData,
        id: generateId("proj"),
        progress: 0,
        createdAt: new Date(),
      };
      setProjects([...projects, newProj]);
      setSelectedId(newProj.id);
      setSelectedType("project");
    }
    setIsProjectFormOpen(false);
  };

  const confirmDelete = (item, type) => {
    setDeleteConfirm({ show: true, id: item.id, itemName: item.title, type });
  };

  const executeDelete = () => {
    if (deleteConfirm.type === "activity") {
      setActivities(activities.filter((a) => a.id !== deleteConfirm.id));
    } else {
      setProjects(projects.filter((p) => p.id !== deleteConfirm.id));
    }

    if (selectedId === deleteConfirm.id) setSelectedId(null);
    setDeleteConfirm({ show: false, id: null, itemName: "", type: "" });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in">
      {/* 1. Modal Form Kegiatan */}
      {isActivityModalOpen && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-sm p-6 rounded-3xl shadow-xl border ${isDarkMode ? "bg-slate-800 border-slate-600" : "bg-white border-slate-100"}`}
          >
            <h3
              className={`font-bold text-lg mb-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}
            >
              {activityForm.id ? "Edit Kegiatan" : "Tambah Kegiatan Baru"}
            </h3>
            <form onSubmit={handleSaveActivity} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">
                  Nama Kegiatan
                </label>
                <input
                  autoFocus
                  type="text"
                  className={`w-full px-4 py-3 rounded-xl border mt-1 ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
                  value={activityForm.title || ""}
                  onChange={(e) =>
                    setActivityForm({ ...activityForm, title: e.target.value })
                  }
                  placeholder="Contoh: Rutinitas Harian"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">
                  Tanggal (Opsional)
                </label>
                <input
                  type="date"
                  className={`w-full px-4 py-3 rounded-xl border mt-1 ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
                  value={activityForm.deadline || ""}
                  onChange={(e) =>
                    setActivityForm({
                      ...activityForm,
                      deadline: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Form Project */}
      {isProjectFormOpen && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <ResourceAIModal
            isOpen={!!aiModalRes}
            onClose={() => setAiModalRes(null)}
            resource={aiModalRes}
            onSave={(id, summary) => {
              setProjectForm((prev) => ({
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
            className={`w-full max-w-2xl p-6 rounded-[2rem] shadow-xl border flex flex-col max-h-[90vh] ${isDarkMode ? "bg-slate-800 border-slate-600" : "bg-white border-slate-100"}`}
          >
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
              <h3
                className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
              >
                {projectForm.id ? "Edit Project" : "Buat Project Baru"}
              </h3>
              <button
                onClick={() => setIsProjectFormOpen(false)}
                className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 px-2">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">
                  Nama Project
                </label>
                <input
                  autoFocus
                  type="text"
                  className={`w-full px-4 py-3 rounded-xl border mt-1 ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
                  value={projectForm.title}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, title: e.target.value })
                  }
                  placeholder="Nama Project..."
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">
                  Deskripsi
                </label>
                <textarea
                  rows="3"
                  className={`w-full px-4 py-3 rounded-xl border mt-1 ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
                  value={projectForm.description || ""}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Deskripsi detail project..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className={`w-full px-4 py-3 rounded-xl border mt-1 ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
                    value={projectForm.startDate || ""}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">
                    Deadline
                  </label>
                  <input
                    type="date"
                    className={`w-full px-4 py-3 rounded-xl border mt-1 ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
                    value={projectForm.deadline}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        deadline: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">
                  Area of Responsibility
                </label>
                <select
                  className={`w-full px-4 py-3 rounded-xl border mt-1 ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
                  value={projectForm.areaId}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, areaId: e.target.value })
                  }
                >
                  <option value="">-- No Area (Free Project) --</option>
                  {(areas || []).map((a, idx) => (
                    <option key={a.id || idx} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Resource Section inside Project Form */}
              <div
                className={`p-5 rounded-2xl border mt-4 ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h4
                    className={`font-bold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-slate-800"}`}
                  >
                    <BookOpen size={18} /> Dasar Pelaksanaan / Resources
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingResource(!isAddingResource);
                      setTempResource({
                        ...tempResource,
                        date: projectForm.deadline || "",
                      });
                    }}
                    className="text-xs bg-white border shadow-sm px-3 py-1.5 rounded-lg font-bold text-indigo-600 hover:bg-indigo-50"
                  >
                    + Tambah
                  </button>
                </div>
                {isAddingResource && (
                  <ResourceInputSection
                    isDarkMode={isDarkMode}
                    tempResource={tempResource}
                    setTempResource={setTempResource}
                    handleAddResource={handleAddResourceToProject}
                    fileStatus={fileStatus}
                    handleFileSelect={handleFileSelectForProject}
                    freeNotes={freeNotes}
                    aiNotes={aiNotes}
                    lists={lists}
                    resources={resources}
                    onCancel={() => setIsAddingResource(false)}
                  />
                )}
                <ResourceListTable
                  resources={projectForm.resources}
                  isDarkMode={isDarkMode}
                  openResource={openResource}
                  removeResource={removeResourceFromProject}
                  openAIView={setAiModalRes}
                />
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex gap-3">
              <button
                type="button"
                onClick={() => setIsProjectFormOpen(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveProject}
                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg"
              >
                Simpan Project
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteConfirm.show}
        onClose={() =>
          setDeleteConfirm({ show: false, id: null, itemName: "", type: "" })
        }
        onConfirm={executeDelete}
        title={`Hapus ${deleteConfirm.type === "activity" ? "Kegiatan" : "Project"}?`}
        itemName={deleteConfirm.itemName}
        message="Anda yakin ingin menghapus item ini beserta seluruh tugas di dalamnya secara permanen?"
      />

      {/* Main Area Modal Layout */}
      <div
        className={`w-full max-w-6xl h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-100"}`}
      >
        {/* Sidebar: Area Info & List */}
        <div
          className={`w-full md:w-80 p-6 flex flex-col border-b md:border-b-0 md:border-r ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50/80 border-slate-100"}`}
        >
          <div className="flex justify-between items-center mb-6">
            {isEditingArea ? (
              <div className="flex-1 mr-2">
                <input
                  autoFocus
                  type="text"
                  className="w-full p-2 rounded border mb-2 text-slate-900"
                  value={editAreaForm.title}
                  onChange={(e) =>
                    setEditAreaForm({ ...editAreaForm, title: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEditAreaSave();
                  }}
                  placeholder="Nama Area"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleEditAreaSave}
                    className="p-1 bg-indigo-500 text-white rounded"
                  >
                    <Save size={16} />
                  </button>
                  <button
                    onClick={() => setIsEditingArea(false)}
                    className="p-1 bg-slate-200 text-slate-600 rounded"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3
                  className={`font-bold text-xl truncate ${isDarkMode ? "text-white" : "text-slate-900"}`}
                >
                  {localArea.title}
                </h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => setIsEditingArea(true)}
                    className="p-2 rounded-full hover:bg-slate-200/50 text-slate-400 hover:text-indigo-500 transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => onArchiveArea(localArea)}
                    className="p-2 rounded-full hover:bg-slate-200/50 text-slate-400 hover:text-orange-500 transition-colors"
                  >
                    <Archive size={16} />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-slate-200/50 md:hidden"
                  >
                    <X size={20} />
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-6 mb-4 custom-scrollbar">
            {/* List Kegiatan */}
            <div>
              <div className="flex justify-between items-center mb-2 pl-2">
                <div
                  className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}
                >
                  Daftar Kegiatan
                </div>
                <button
                  onClick={openAddActivity}
                  className="p-1 rounded hover:bg-slate-200 text-slate-400"
                >
                  <Plus size={14} />
                </button>
              </div>
              {areaActivities.length === 0 && (
                <p className="text-xs text-slate-400 italic pl-2">
                  Belum ada kegiatan.
                </p>
              )}
              {areaActivities.map((act, idx) => (
                <div
                  key={`${act.id || "act"}-${idx}`}
                  className="group relative mb-1"
                >
                  <button
                    onClick={() => {
                      setSelectedId(act.id);
                      setSelectedType("activity");
                    }}
                    className={`w-full text-left p-3 pr-10 rounded-xl transition-all flex items-center justify-between ${selectedId === act.id && selectedType === "activity" ? (isDarkMode ? "bg-indigo-600 text-white shadow-lg" : "bg-white border-indigo-200 text-indigo-700 shadow-lg shadow-indigo-100 border") : isDarkMode ? "text-slate-400 hover:bg-slate-700 hover:text-white" : "text-slate-600 hover:bg-white hover:shadow-sm"}`}
                  >
                    <div className="truncate font-bold text-sm">
                      {act.title}
                    </div>
                  </button>
                  <div
                    className={`absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 ${selectedId === act.id && selectedType === "activity" ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditActivity(act);
                      }}
                      className={`p-1 rounded-lg ${selectedId === act.id ? "text-indigo-200 hover:text-white" : "text-slate-400 hover:text-indigo-500"}`}
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(act, "activity");
                      }}
                      className={`p-1 rounded-lg ${selectedId === act.id ? "text-indigo-200 hover:text-white" : "text-slate-400 hover:text-red-500"}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* List Project */}
            <div>
              <div className="flex justify-between items-center mb-2 pl-2 border-t pt-4 border-slate-200/50">
                <div
                  className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}
                >
                  Daftar Project
                </div>
                <button
                  onClick={openAddProject}
                  className="p-1 rounded hover:bg-slate-200 text-slate-400"
                >
                  <Plus size={14} />
                </button>
              </div>
              {areaProjects.length === 0 && (
                <p className="text-xs text-slate-400 italic pl-2">
                  Belum ada project.
                </p>
              )}
              {areaProjects.map((proj, idx) => (
                <div
                  key={`${proj.id || "proj"}-${idx}`}
                  className="group relative mb-1"
                >
                  <button
                    onClick={() => {
                      setSelectedId(proj.id);
                      setSelectedType("project");
                    }}
                    className={`w-full text-left p-3 pr-10 rounded-xl transition-all flex items-center justify-between ${selectedId === proj.id && selectedType === "project" ? (isDarkMode ? "bg-emerald-600 text-white shadow-lg" : "bg-white border-emerald-200 text-emerald-700 shadow-lg shadow-emerald-100 border") : isDarkMode ? "text-slate-400 hover:bg-slate-700 hover:text-white" : "text-slate-600 hover:bg-white hover:shadow-sm"}`}
                  >
                    <div className="truncate font-bold text-sm">
                      {proj.title}
                    </div>
                  </button>
                  <div
                    className={`absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 ${selectedId === proj.id && selectedType === "project" ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditProject(proj);
                      }}
                      className={`p-1 rounded-lg ${selectedId === proj.id ? "text-emerald-200 hover:text-white" : "text-slate-400 hover:text-indigo-500"}`}
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(proj, "project");
                      }}
                      className={`p-1 rounded-lg ${selectedId === proj.id ? "text-emerald-200 hover:text-white" : "text-slate-400 hover:text-red-500"}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area (Project Task Manager) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-10 p-2 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-500 transition-colors hidden md:block"
          >
            <X size={20} />
          </button>
          {currentSelection ? (
            <ProjectTaskManager
              key={`${currentSelection.id}-${selectedType}`}
              project={currentSelection}
              tasks={tasks}
              setTasks={setTasks}
              resources={resources}
              setResources={setResources}
              freeNotes={freeNotes}
              aiNotes={aiNotes}
              lists={lists}
              geminiApiKey={geminiApiKey}
              isDarkMode={isDarkMode}
              type={selectedType === "activity" ? "Kegiatan" : "Project"}
              setAlertModal={setAlertModal}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-10 text-center">
              <Layers size={64} className="mb-4 opacity-20" />
              <h3 className="text-xl font-bold mb-2">
                Pilih Kegiatan atau Project
              </h3>
              <p>
                Pilih item di sidebar kiri untuk mengelola{" "}
                {selectedType === "activity" ? "task" : "action"}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================================================================================
// 7. PRODUCTIVITY MANAGER (PARA SYSTEM CONTAINER)
// ==================================================================================

// Komponen utama yang mengelola logika PARA (Projects, Areas, Resources, Archives)
export const ProductivityManager = ({
  user,
  isDarkMode,
  freeNotes,
  aiNotes,
  lists,
  projects = [],
  setProjects,
  projectTasks = [],
  setProjectTasks,
  activities = [],
  setActivities,
  resources = [],
  setResources,
  archives = [],
  setArchives,
  geminiApiKey,
  activeTab,
  setActiveTab,
  targetProject,
  setTargetProject,
}) => {
  // 7.1. State Management
  const [localTab, setLocalTab] = React.useState("overview");
  const currentTab = activeTab || localTab;
  const setTab = setActiveTab || setLocalTab;

  // Data State with User Awareness
  const [areas, setAreas] = useUserAwareState([], "lifeos-para-areas", user);
  // const [archives, setArchives] = useUserAwareState([], 'lifeos-para-archives', user);

  // Filters State
  const [resSearch, setResSearch] = React.useState("");
  const [resDateFilter, setResDateFilter] = React.useState("all");
  const [resCustomDate, setResCustomDate] = React.useState({ start: "", end: "" });
  const [projSearch, setProjSearch] = React.useState("");
  const [projDateFilter, setProjDateFilter] = React.useState("all");
  const [projCustomDate, setProjCustomDate] = React.useState({ start: "", end: "" });
  const [archTypeFilter, setArchTypeFilter] = React.useState("all");
  const [archSearch, setArchSearch] = React.useState("");
  const [archDateMode, setArchDateMode] = React.useState("all");
  const [archCustomDate, setArchCustomDate] = React.useState({ start: "", end: "" });

  // Pagination Configuration States
  const [projPage, setProjPage] = React.useState(1);
  const [projPerPage, setProjPerPage] = React.useState(10);

  const [areaPage, setAreaPage] = React.useState(1);
  const [areaPerPage, setAreaPerPage] = React.useState(10);

  const [resPage, setResPage] = React.useState(1);
  const [resPerPage, setResPerPage] = React.useState(25);

  const [archPage, setArchPage] = React.useState(1);
  const [archPerPage, setArchPerPage] = React.useState(25);

  // Modals & UI State
  const [isResourceModalOpen, setIsResourceModalOpen] = React.useState(false);
  const [resourceForm, setResourceForm] = React.useState({
    id: null,
    title: "",
    number: "",
    type: "link",
    content: "",
    date: "",
    url: "",
    file: null,
    noteId: "",
  });
  const [deleteConfirm, setDeleteConfirm] = React.useState({
    show: false,
    id: null,
    itemName: "",
    type: "",
    data: null,
  });
  const [alertModal, setAlertModal] = React.useState({
    isOpen: false,
    title: "",
    message: "",
    type: "error",
  });
  const [selectedDate, setSelectedDate] = React.useState(null);

  const [isProjectModalOpen, setIsProjectModalOpen] = React.useState(false);
  const [isAreaModalOpen, setIsAreaModalOpen] = React.useState(false);
  const [selectedAreaForDetail, setSelectedAreaForDetail] = React.useState(null);
  const [selectedProjectForDetail, setSelectedProjectForDetail] =
    React.useState(null);

  // Form States
  const [projectForm, setProjectForm] = React.useState({
    title: "",
    areaId: "",
    deadline: "",
    status: "active",
    linkedNotes: [],
    resources: [],
  });
  const [areaForm, setAreaForm] = React.useState({
    id: null,
    title: "",
    description: "",
    color: "bg-slate-100",
  });

  // Resource Handling State
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
  const [globalFileStatus, setGlobalFileStatus] = React.useState("idle");

  // 7.2. Effects & Helpers
  React.useEffect(() => {
    if (targetProject) {
      setSelectedProjectForDetail(targetProject);
      if (setTargetProject) setTargetProject(null);
    }
  }, [targetProject, setTargetProject]);

  const isProjectActiveIn = (project, rangeStart, rangeEnd) => {
    const getSafeDate = (d) => {
      if (!d) return null;
      const dateObj = new Date(d);
      return isNaN(dateObj.getTime()) ? null : dateObj;
    };
    const pStart =
      getSafeDate(project.startDate) ||
      getSafeDate(project.createdAt) ||
      new Date();
    const pEnd = getSafeDate(project.deadline);
    pStart.setHours(0, 0, 0, 0);
    const rStart = new Date(rangeStart);
    const rEnd = new Date(rangeEnd);
    rStart.setHours(0, 0, 0, 0);
    rEnd.setHours(23, 59, 59, 999);

    if (!pEnd) return pStart <= rEnd;
    pEnd.setHours(23, 59, 59, 999);
    return pStart <= rEnd && pEnd >= rStart;
  };

  // 7.3. Handlers: Projects
  const handleAddProject = (e) => {
    e.preventDefault();
    setResources((prev) =>
      updateGlobalResources(prev, projectForm.resources || [], "Project Basis"),
    );

    const processedResources = [];
    const currentResources = projectForm.resources || [];
    currentResources.forEach((res) => {
      processedResources.push({ ...res });
    });

    const finalProjectData = { ...projectForm, resources: processedResources };

    if (projectForm.id) {
      setProjects(
        projects.map((p) =>
          p.id === projectForm.id ? { ...p, ...finalProjectData } : p,
        ),
      );
    } else {
      setProjects([
        ...projects,
        {
          id: generateId("proj"),
          ...finalProjectData,
          progress: 0,
          createdAt: new Date(),
        },
      ]);
    }
    setProjectForm({
      title: "",
      description: "",
      areaId: "",
      startDate: "",
      deadline: "",
      status: "active",
      resources: [],
    });
    setIsProjectModalOpen(false);
  };

  const handleEditProject = (proj) => {
    setProjectForm({ ...proj, resources: proj.resources || [] });
    setIsProjectModalOpen(true);
  };

  const confirmDeleteProject = (proj) => {
    setDeleteConfirm({
      show: true,
      id: proj.id,
      itemName: proj.title,
      type: "project",
    });
  };

  // 7.4. Handlers: Form Resource Management
  const handleAddResourceToForm = () => {
    if (!tempResource.name) {
      setAlertModal({
        isOpen: true,
        title: "Validasi",
        message: "Nama resource wajib diisi.",
        type: "error",
      });
      return;
    }
    const resourceDate =
      tempResource.date ||
      projectForm.deadline ||
      new Date().toISOString().split("T")[0];
    const resourceData = {
      id: generateId("pr"),
      ...tempResource,
      date: resourceDate,
    };

    setProjectForm((prev) => ({
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

  const removeResourceFromForm = (resId) => {
    setProjectForm((prev) => ({
      ...prev,
      resources: (prev.resources || []).filter((r) => r.id !== resId),
    }));
  };

  // Handler: Global File Select with Gemini (used in main forms)
  const handleFileSelectForForm = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

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

    if (!geminiApiKey) {
      setGlobalFileStatus("error");
      return;
    }
    setGlobalFileStatus("processing");

    try {
      let filePart;
      if (
        file.type === "application/pdf" ||
        file.type.startsWith("image/") ||
        file.type === "text/plain"
      ) {
        filePart = await fileToGenerativePart(file);
        const summary = await callGeminiAI(
          geminiApiKey,
          "Ekstrak dan buat ringkasan komprehensif dari dokumen ini untuk keperluan knowledge-base AI masa depan. Gunakan format Markdown yang rapi dan sertakan poin-poin penting. Gunakan delimiter $$ untuk blok rumus matematika.",
          [filePart],
        );

        setTempResource((prev) => ({ ...prev, aiSummary: summary }));
        setProjectForm((prev) => ({
          ...prev,
          resources: (prev.resources || []).map((r) =>
            r.url === fakeUrl ? { ...r, aiSummary: summary } : r,
          ),
        }));
        setResources((prev) =>
          prev.map((r) =>
            r.url === fakeUrl ? { ...r, aiSummary: summary } : r,
          ),
        );
        setAiModalRes((prev) =>
          prev && prev.url === fakeUrl ? { ...prev, aiSummary: summary } : prev,
        );
        setGlobalFileStatus("done");
      } else {
        setGlobalFileStatus("error");
        setAlertModal({
          isOpen: true,
          title: "Format Tidak Didukung",
          message: "Gunakan format PDF, Image, atau Txt untuk ekstraksi AI.",
          type: "error",
        });
      }
    } catch (error) {
      setGlobalFileStatus("error");
      const errMsg = error?.message || String(error);
      if (
        errMsg.toLowerCase().includes("quota") ||
        errMsg.includes("429") ||
        errMsg.toLowerCase().includes("exceeded")
      ) {
        setAlertModal({
          isOpen: true,
          title: "Limit API Tercapai ⚠️",
          message:
            "⚠️ Limit API Gemini Anda Tercapai.\n\nFile Anda tetap berhasil dilampirkan dengan status 'No AI'. Silakan klik 'Simpan', lalu gunakan ikon Robot pada tabel untuk mengekstrak ulang nanti.",
          type: "error",
        });
      } else {
        setAlertModal({
          isOpen: true,
          title: "Ekstraksi AI Gagal",
          message: errMsg,
          type: "error",
        });
      }
    }
  };

  // 7.5. Handlers: Areas
  const handleSaveArea = (e) => {
    e.preventDefault();
    if (areaForm.id) {
      setAreas((prev) =>
        prev.map((a) => (a.id === areaForm.id ? { ...a, ...areaForm } : a)),
      );
    } else {
      const newArea = { ...areaForm, id: generateId("area") };
      setAreas((prev) => [...prev, newArea]);
    }
    setAreaForm({
      id: null,
      title: "",
      description: "",
      color: "bg-slate-100",
    });
    setIsAreaModalOpen(false);
  };

  const openEditArea = (area) => {
    setAreaForm(area);
    setIsAreaModalOpen(true);
  };

  const confirmDeleteArea = (area) => {
    const areaProjects = projects.filter((p) => p.areaId === area.id);
    const areaActivities = activities.filter((a) => a.areaId === area.id);
    const pCount = areaProjects.length;
    const aCount = areaActivities.length;

    if (pCount > 0 || aCount > 0) {
      setAlertModal({
        isOpen: true,
        title: "Tidak Dapat Menghapus Area",
        message: `Area "${area.title}" masih memiliki ${aCount} kegiatan dan ${pCount} project aktif. Silakan hapus atau arsipkan item-item tersebut terlebih dahulu sebelum menghapus Area ini.`,
        type: "error",
      });
      return;
    }
    setDeleteConfirm({
      show: true,
      id: area.id,
      itemName: area.title,
      type: "area",
    });
  };

  // 7.6. Handlers: Resources (Global)
  const handleSaveResource = (e) => {
    e.preventDefault();
    if (!resourceForm.title.trim())
      return setAlertModal({
        isOpen: true,
        title: "Validasi",
        message: "Nama resource wajib diisi.",
        type: "error",
      });

    const { id, ...dataToSave } = resourceForm;
    const finalDate = dataToSave.date || new Date().toISOString().split("T")[0];
    const resourceData = {
      ...dataToSave,
      date: finalDate,
      tags: ["Global Resource"],
    };

    if (id) {
      setResources((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                ...resourceData,
                tags: r.tags || ["Global Resource"],
                id: id,
              }
            : r,
        ),
      );
    } else {
      setResources((prev) => [
        ...prev,
        { id: generateId("res"), ...resourceData, createdAt: new Date() },
      ]);
    }
    setIsResourceModalOpen(false);
    setResourceForm({
      id: null,
      title: "",
      number: "",
      type: "link",
      content: "",
      date: "",
      url: "",
      file: null,
      noteId: "",
    });
    setGlobalFileStatus("idle");
  };

  const handleFileSelectForGlobal = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fakeUrl = URL.createObjectURL(file);
    setResourceForm((prev) => ({
      ...prev,
      file: file,
      url: fakeUrl,
      title: prev.title ? prev.title : file.name,
    }));

    try {
      const uploaded = await uploadFileToBackend(file);
      setResourceForm((prev) => ({
        ...prev,
        ...uploaded,
        title: prev.title || uploaded.title,
      }));
    } catch (error) {
      console.warn("Upload file ke backend gagal, memakai URL lokal.", error);
    }

    if (!geminiApiKey) {
      setGlobalFileStatus("error");
      return;
    }
    setGlobalFileStatus("processing");

    try {
      let filePart;
      if (
        file.type === "application/pdf" ||
        file.type.startsWith("image/") ||
        file.type === "text/plain"
      ) {
        filePart = await fileToGenerativePart(file);
        const summary = await callGeminiAI(
          geminiApiKey,
          "Ekstrak dan buat ringkasan komprehensif dari dokumen ini untuk keperluan knowledge-base AI masa depan. Gunakan format Markdown yang rapi dan sertakan poin-poin penting. Gunakan delimiter $$ untuk blok rumus matematika.",
          [filePart],
        );

        setResourceForm((prev) => ({ ...prev, aiSummary: summary }));
        setResources((prev) =>
          prev.map((r) =>
            r.url === fakeUrl ? { ...r, aiSummary: summary } : r,
          ),
        );
        setAiModalRes((prev) =>
          prev && prev.url === fakeUrl ? { ...prev, aiSummary: summary } : prev,
        );
        setGlobalFileStatus("done");
      } else {
        setGlobalFileStatus("error");
        setAlertModal({
          isOpen: true,
          title: "Format Tidak Didukung",
          message: "Gunakan format PDF, Image, atau Txt untuk ekstraksi AI.",
          type: "error",
        });
      }
    } catch (error) {
      setGlobalFileStatus("error");
      const errMsg = error?.message || String(error);
      if (
        errMsg.toLowerCase().includes("quota") ||
        errMsg.includes("429") ||
        errMsg.toLowerCase().includes("exceeded")
      ) {
        setAlertModal({
          isOpen: true,
          title: "Limit API Tercapai ⚠️",
          message:
            "⚠️ Limit API Gemini Anda Tercapai.\n\nFile Anda tetap berhasil dilampirkan dengan status 'No AI'. Silakan klik 'Simpan', lalu gunakan ikon Robot pada tabel untuk mengekstrak ulang nanti.",
          type: "error",
        });
      } else {
        setAlertModal({
          isOpen: true,
          title: "Ekstraksi AI Gagal",
          message: errMsg,
          type: "error",
        });
      }
    }
  };

  // 7.7. Global Deletion & Archive Logic
  const executeDeleteGlobal = () => {
    if (deleteConfirm.type === "project") {
      setProjects(projects.filter((p) => p.id !== deleteConfirm.id));
      if (selectedProjectForDetail?.id === deleteConfirm.id)
        setSelectedProjectForDetail(null);
    } else if (deleteConfirm.type === "resource") {
      setResources(resources.filter((r) => r.id !== deleteConfirm.id));
    } else if (deleteConfirm.type === "area") {
      setAreas((prev) => prev.filter((a) => a.id !== deleteConfirm.id));
    }
    setDeleteConfirm({
      show: false,
      id: null,
      itemName: "",
      type: "",
      data: null,
    });
  };

  const openResource = (res) => {
    if (res.url) window.open(res.url, "_blank");
    else
      setAlertModal({
        isOpen: true,
        title: "Gagal",
        message: "Tidak ada link/file yang bisa dibuka.",
        type: "error",
      });
  };

  const openEditResource = (res) => {
    setResourceForm({ ...res, id: res.id });
    setGlobalFileStatus("idle");
    setIsResourceModalOpen(true);
  };

  const handleArchiveArea = (areaToArchive) => {
    setDeleteConfirm({
      show: true,
      id: areaToArchive.id,
      itemName: areaToArchive.title,
      type: "archive_area",
      data: areaToArchive,
    });
  };

  const executeArchiveGlobal = () => {
    if (deleteConfirm.type === "archive_area") {
      const areaToArchive = deleteConfirm.data;
      const areaArchive = {
        id: generateId("arch"),
        originalType: "area",
        data: areaToArchive,
        archivedAt: new Date(),
      };
      const relatedProjects = projects.filter(
        (p) => p.areaId === areaToArchive.id,
      );
      const projectArchives = relatedProjects.map((p) => ({
        id: generateId("arch"),
        originalType: "project",
        data: p,
        archivedAt: new Date(),
      }));

      setArchives([...archives, areaArchive, ...projectArchives]);
      setAreas(areas.filter((a) => a.id !== areaToArchive.id));
      setProjects(projects.filter((p) => p.areaId !== areaToArchive.id));
      if (selectedAreaForDetail?.id === areaToArchive.id)
        setSelectedAreaForDetail(null);
    } else if (deleteConfirm.type === "archive_project") {
      const projectToArchive = deleteConfirm.data;
      setArchives([
        ...archives,
        {
          id: generateId("arch"),
          originalType: "project",
          data: projectToArchive,
          archivedAt: new Date(),
        },
      ]);
      setProjects(projects.filter((p) => p.id !== projectToArchive.id));
    } else if (deleteConfirm.type === "archive_resource") {
      const resourceToArchive = deleteConfirm.data;
      setArchives([
        ...archives,
        {
          id: generateId("arch"),
          originalType: "resource",
          data: resourceToArchive,
          archivedAt: new Date(),
        },
      ]);
      setResources(resources.filter((r) => r.id !== resourceToArchive.id));
    }
    setDeleteConfirm({
      show: false,
      id: null,
      itemName: "",
      type: "",
      data: null,
    });
  };

  const handleUpdateArea = (updatedArea) => {
    setAreas(areas.map((a) => (a.id === updatedArea.id ? updatedArea : a)));
  };

  const archiveItem = (type, item) => {
    if (type === "project") {
      setDeleteConfirm({
        show: true,
        id: item.id,
        itemName: item.title,
        type: "archive_project",
        data: item,
      });
    } else if (type === "resource") {
      setDeleteConfirm({
        show: true,
        id: item.id,
        itemName: item.title || item.name,
        type: "archive_resource",
        data: item,
      });
    } else {
      setArchives([
        ...archives,
        {
          id: generateId("arch"),
          originalType: type,
          data: item,
          archivedAt: new Date(),
        },
      ]);
      if (type === "area") setAreas(areas.filter((a) => a.id !== item.id));
    }
  };

  const handleRestore = (archivedItem) => {
    setDeleteConfirm({
      show: true,
      id: archivedItem.id,
      itemName: archivedItem.data.title || archivedItem.data.name,
      type: "restore_item",
      data: archivedItem,
    });
  };

  const executeRestoreGlobal = () => {
    const archivedItem = deleteConfirm.data;
    if (!archivedItem) return;

    const { originalType, data } = archivedItem;
    if (originalType === "project") {
      setProjects([...projects, data]);
    } else if (originalType === "area") {
      setAreas([...areas, data]);
    } else if (originalType === "resource") {
      setResources([...resources, data]);
    }
    setArchives(archives.filter((a) => a.id !== archivedItem.id));
    setDeleteConfirm({
      show: false,
      id: null,
      itemName: "",
      type: "",
      data: null,
    });
  };

  // ==================================================================================
  // 7.8. RENDER OVERVIEW
  // ==================================================================================
  const renderOverview = () => {
    // Persiapan data untuk kalender
    const projectIds = new Set(projects.map((p) => p.id));
    const activityIds = new Set(activities.map((a) => a.id));

    // Mapping task untuk kalender
    const allCalendarTasks = projectTasks.map((t) => {
      let type = "unknown";
      let parentName = "";
      if (projectIds.has(t.projectId)) {
        type = "project-action";
        const parent = projects.find((p) => p.id === t.projectId);
        parentName = parent ? parent.title : "";
      } else if (activityIds.has(t.projectId)) {
        type = "area-task";
        const parent = activities.find((a) => a.id === t.projectId);
        parentName = parent ? parent.title : "";
      }
      return {
        ...t,
        type,
        parentName: parentName,
        projectName: type === "project-action" ? parentName : undefined,
        areaName: type === "area-task" ? parentName : undefined,
      };
    });

    // Ambil 5 project aktif yang belum selesai
    const incompleteProjects = projects
      .filter((p) => {
        const pTasks = projectTasks.filter((t) => t.projectId === p.id);
        const totalWeight = pTasks.reduce(
          (acc, t) => acc + (parseFloat(t.weight) || 0),
          0,
        );
        const completedWeight = pTasks
          .filter((t) => t.completed)
          .reduce((acc, t) => acc + (parseFloat(t.weight) || 0), 0);
        const taskProgress =
          totalWeight > 0
            ? (completedWeight / totalWeight) * 100
            : pTasks.length > 0
              ? (pTasks.filter((t) => t.completed).length / pTasks.length) * 100
              : 0;

        let timeProgress = 0;
        if (p.startDate && p.deadline) {
          const start = new Date(p.startDate).getTime();
          const end = new Date(p.deadline).getTime();
          const now = new Date().getTime();
          if (end > start) {
            const percent = ((now - start) / (end - start)) * 100;
            timeProgress = Math.min(100, Math.max(0, percent));
          } else {
            timeProgress = 100;
          }
        }
        return taskProgress < 100 || timeProgress < 100;
      })
      .slice(0, 5);

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
        {/* Top Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-6 bg-indigo-500 rounded-3xl text-white">
            <Layers size={32} className="mb-4 opacity-80" />
            <p className="text-sm font-medium opacity-80">Projects</p>
            <h3 className="text-3xl font-extrabold">{projects?.length || 0}</h3>
          </div>
          <div className="p-6 bg-emerald-500 rounded-3xl text-white">
            <Grid size={32} className="mb-4 opacity-80" />
            <p className="text-sm font-medium opacity-80">Areas</p>
            <h3 className="text-3xl font-extrabold">{areas?.length || 0}</h3>
          </div>
          <div className="p-6 bg-amber-500 rounded-3xl text-white">
            <Box size={32} className="mb-4 opacity-80" />
            <p className="text-sm font-medium opacity-80">Resources</p>
            <h3 className="text-3xl font-extrabold">
              {resources?.length || 0}
            </h3>
          </div>
          <div className="p-6 bg-slate-500 rounded-3xl text-white">
            <Archive size={32} className="mb-4 opacity-80" />
            <p className="text-sm font-medium opacity-80">Archives</p>
            <h3 className="text-3xl font-extrabold">{archives?.length || 0}</h3>
          </div>
        </div>

        {/* Widget Kalender */}
        <CalendarWidget
          projects={projects}
          tasks={allCalendarTasks}
          isDarkMode={isDarkMode}
          onDateClick={(date) => setSelectedDate(date)}
        />

        {/* Daftar Project Aktif */}
        <div>
          <h3
            className={`font-bold text-xl mb-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            Recent Active Projects
          </h3>
          <div className="space-y-4">
            {incompleteProjects.map((p, idx) => {
              const area = areas.find((a) => a.id === p.areaId);
              const pTasks = projectTasks.filter((t) => t.projectId === p.id);

              const totalWeight = pTasks.reduce(
                (acc, t) => acc + (parseFloat(t.weight) || 0),
                0,
              );
              const completedWeight = pTasks
                .filter((t) => t.completed)
                .reduce((acc, t) => acc + (parseFloat(t.weight) || 0), 0);
              const progress =
                totalWeight > 0
                  ? (completedWeight / totalWeight) * 100
                  : pTasks.length > 0
                    ? (pTasks.filter((t) => t.completed).length /
                        pTasks.length) *
                      100
                    : 0;

              let timeProgress = 0;
              if (p.startDate && p.deadline) {
                const start = new Date(p.startDate).getTime();
                const end = new Date(p.deadline).getTime();
                const now = new Date().getTime();
                if (end > start)
                  timeProgress = Math.min(
                    100,
                    Math.max(0, ((now - start) / (end - start)) * 100),
                  );
                else timeProgress = 100;
              }

              return (
                <div
                  key={p.id || idx}
                  className={`flex flex-col md:flex-row items-center p-5 rounded-2xl border transition-all hover:shadow-md cursor-pointer ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
                  onClick={() => setSelectedProjectForDetail(p)}
                >
                  <div className="flex-1 w-full md:w-auto mb-4 md:mb-0 md:mr-6">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${area ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700"}`}
                      >
                        {area ? area.title : "Free Project"}
                      </span>
                      {p.deadline && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <CalendarIcon size={10} />{" "}
                          {new Date(p.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <h4
                      className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-slate-900"}`}
                    >
                      {p.title}
                    </h4>
                  </div>

                  <div className="w-full md:w-1/3 flex flex-col gap-3">
                    <div>
                      <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 mb-1">
                        <span>Task Completion</span>
                        <span>{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 mb-1">
                        <span>Time Elapsed</span>
                        <span>{timeProgress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${timeProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {incompleteProjects.length === 0 && (
              <div className="text-center py-10 text-slate-400 italic bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                Tidak ada project aktif yang belum selesai.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ==================================================================================
  // 7.9. RENDER AREAS
  // ==================================================================================
  /**
   * Meng-render tampilan daftar Area of Responsibility (AoR).
   * Menampilkan grid kartu Area dan menangani logika pagination serta modal form Area.
   * * @returns {JSX.Element} Antarmuka tab Areas
   */
  const renderAreas = () => {
    // --- Logika Pagination ---
    const totalAreas = areas.length;
    // Memotong array areas berdasarkan halaman aktif dan limit item per halaman
    const paginatedAreas =
      areaPerPage === "all"
        ? areas
        : areas.slice((areaPage - 1) * areaPerPage, areaPage * areaPerPage);

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4">
        {/* --- Komponen Header Informasi --- */}
        <ParaInfo
          title="Areas of Responsibility"
          description="Area adalah lingkup tanggung jawab jangka panjang yang ingin Anda pertahankan dari waktu ke waktu. Berbeda dengan project, area tidak memiliki tenggat waktu (deadline). Contoh: Kesehatan, Keuangan, Pengembangan Diri, Rumah Tangga."
          color="bg-emerald-50"
          icon={Grid}
          isDarkMode={isDarkMode}
        />

        {/* --- Action Bar (Judul & Tombol Tambah) --- */}
        <div className="flex justify-between items-center mb-6">
          <h3
            className={`font-bold text-xl ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            Areas
          </h3>
          <button
            onClick={() => {
              setAreaForm({
                id: null,
                title: "",
                description: "",
                color: "bg-slate-100",
              });
              setIsAreaModalOpen(true);
            }}
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
          >
            <Plus size={18} /> New Area
          </button>
        </div>

        {/* --- Grid Layout: Daftar Area --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {paginatedAreas.map((a, idx) => (
            <AreaCard
              key={a.id || idx}
              area={a}
              activities={activities}
              projects={projects}
              onClick={setSelectedAreaForDetail}
              isDarkMode={isDarkMode}
              onEdit={openEditArea}
              onArchive={handleArchiveArea}
              onDelete={confirmDeleteArea}
            />
          ))}
          {/* Empty State */}
          {paginatedAreas.length === 0 && (
            <div className="col-span-full text-center py-10 text-slate-400 italic">
              Belum ada Area. Area adalah tanggung jawab jangka panjang (Health,
              Finance, Family).
            </div>
          )}
        </div>

        {/* --- Kontrol Navigasi Pagination --- */}
        {areas.length > 0 && (
          <div className="mt-8">
            <PaginationControl
              currentPage={areaPage}
              itemsPerPage={areaPerPage}
              totalItems={totalAreas}
              onPageChange={setAreaPage}
              onItemsPerPageChange={setAreaPerPage}
              isDarkMode={isDarkMode}
            />
          </div>
        )}

        {/* --- Modal Form: Buat/Edit Area --- */}
        {isAreaModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
            <div
              className={`rounded-[2rem] shadow-2xl max-w-md w-full p-8 border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
            >
              <h3
                className={`text-xl font-bold mb-6 ${isDarkMode ? "text-white" : "text-slate-900"}`}
              >
                {areaForm.id ? "Edit Area" : "Create New Area"}
              </h3>
              <form onSubmit={handleSaveArea} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">
                    Area Title
                  </label>
                  <input
                    autoFocus
                    type="text"
                    className={`w-full px-4 py-3 rounded-xl border mt-1 ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
                    value={areaForm.title}
                    onChange={(e) =>
                      setAreaForm({ ...areaForm, title: e.target.value })
                    }
                    placeholder="e.g. Health & Fitness"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">
                    Description
                  </label>
                  <textarea
                    className={`w-full px-4 py-3 rounded-xl border mt-1 ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
                    rows="3"
                    value={areaForm.description}
                    onChange={(e) =>
                      setAreaForm({ ...areaForm, description: e.target.value })
                    }
                    placeholder="Standard to maintain..."
                  />
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsAreaModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg"
                  >
                    Save Area
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==================================================================================
  // 7.10. RENDER PROJECTS
  // ==================================================================================
  /**
   * Meng-render tampilan daftar Active Projects.
   * Menangani filter pencarian, rentang tanggal, pagination, dan form manajemen Project.
   * * @returns {JSX.Element} Antarmuka tab Projects
   */
  const renderProjects = () => {
    // --- Logika Filter & Pencarian ---
    const filteredProjects = projects.filter((p) => {
      // Filter berdasarkan kata kunci judul
      if (
        projSearch &&
        !p.title.toLowerCase().includes(projSearch.toLowerCase())
      )
        return false;

      // Filter berdasarkan rentang waktu aktif project
      if (projDateFilter === "all") return true;

      let rangeStart = new Date(0);
      let rangeEnd = new Date(8640000000000000);

      if (projDateFilter === "month") {
        const range = getMonthRange();
        rangeStart = range.start;
        rangeEnd = range.end;
      } else if (projDateFilter === "year") {
        const range = getYearRange();
        rangeStart = range.start;
        rangeEnd = range.end;
      } else if (
        projDateFilter === "custom" &&
        projCustomDate.start &&
        projCustomDate.end
      ) {
        rangeStart = new Date(projCustomDate.start);
        rangeEnd = new Date(projCustomDate.end);
      }
      return isProjectActiveIn(p, rangeStart, rangeEnd);
    });

    // --- Logika Pagination ---
    const totalProj = filteredProjects.length;
    // Memotong array project hasil filter berdasarkan halaman aktif
    const paginatedProjects =
      projPerPage === "all"
        ? filteredProjects
        : filteredProjects.slice(
            (projPage - 1) * projPerPage,
            projPage * projPerPage,
          );

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4">
        {/* --- Komponen Header Informasi --- */}
        <ParaInfo
          title="Projects"
          description="Project adalah serangkaian tugas yang terhubung dengan tujuan tertentu dan memiliki tenggat waktu (deadline). Project harus diselesaikan, berbeda dengan Area yang harus dipertahankan. Contoh: Merenovasi Rumah, Menyelesaikan Skripsi, Meluncurkan Produk Baru."
          color="bg-indigo-50"
          icon={Layers}
          isDarkMode={isDarkMode}
        />

        {/* --- Action Bar & Kontrol Filter --- */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h3
            className={`font-bold text-xl ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            Active Projects
          </h3>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            {/* Input Pencarian */}
            <div
              className={`flex items-center px-3 py-2 rounded-xl border ${isDarkMode ? "bg-slate-800 border-slate-600" : "bg-white border-slate-200"}`}
            >
              <Search size={14} className="text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Cari Project..."
                className={`bg-transparent border-none text-xs w-full md:w-40 focus:w-56 transition-all focus:outline-none focus:ring-0 ${isDarkMode ? "text-white placeholder-slate-500" : "text-slate-900 placeholder-slate-400"}`}
                value={projSearch}
                onChange={(e) => setProjSearch(e.target.value)}
              />
            </div>

            {/* Dropdown Filter Tanggal */}
            <div className="flex gap-2">
              <select
                className={`px-3 py-2 rounded-xl border text-xs font-bold ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-700"}`}
                value={projDateFilter}
                onChange={(e) => setProjDateFilter(e.target.value)}
              >
                <option value="all">Semua Waktu</option>
                <option value="month">Aktif Bulan Ini</option>
                <option value="year">Aktif Tahun Ini</option>
                <option value="custom">Custom Range</option>
              </select>

              {/* Input Tanggal Khusus (Mendukung Custom Range) */}
              {projDateFilter === "custom" && (
                <div className="flex items-center gap-1 animate-in slide-in-from-left-2">
                  <input
                    type="date"
                    className="px-2 py-2 rounded-xl border text-xs"
                    value={projCustomDate.start}
                    onChange={(e) =>
                      setProjCustomDate({
                        ...projCustomDate,
                        start: e.target.value,
                      })
                    }
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="date"
                    className="px-2 py-2 rounded-xl border text-xs"
                    value={projCustomDate.end}
                    onChange={(e) =>
                      setProjCustomDate({
                        ...projCustomDate,
                        end: e.target.value,
                      })
                    }
                  />
                </div>
              )}
            </div>

            {/* Tombol Buat Project Baru */}
            <button
              onClick={() => {
                setProjectForm({
                  title: "",
                  description: "",
                  areaId: "",
                  startDate: "",
                  deadline: "",
                  status: "active",
                  resources: [],
                });
                setIsProjectModalOpen(true);
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 whitespace-nowrap"
            >
              <Plus size={18} /> New Project
            </button>
          </div>
        </div>

        {/* --- Grid Layout: Daftar Project --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {paginatedProjects.map((p, idx) => (
            <ProjectCard
              key={p.id || idx}
              project={p}
              tasks={projectTasks}
              areas={areas}
              onArchive={archiveItem}
              onEdit={handleEditProject}
              onDelete={confirmDeleteProject}
              isDarkMode={isDarkMode}
              onClick={setSelectedProjectForDetail}
            />
          ))}
          {/* Empty State */}
          {paginatedProjects.length === 0 && (
            <div className="col-span-full text-center py-10 text-slate-400 italic">
              Tidak ada project yang ditemukan.
            </div>
          )}
        </div>

        {/* --- Kontrol Navigasi Pagination --- */}
        {filteredProjects.length > 0 && (
          <div className="mt-8">
            <PaginationControl
              currentPage={projPage}
              itemsPerPage={projPerPage}
              totalItems={totalProj}
              onPageChange={setProjPage}
              onItemsPerPageChange={setProjPerPage}
              isDarkMode={isDarkMode}
            />
          </div>
        )}

        {/* --- Modal Form: Buat/Edit Project (Lengkap dengan Resource Inner Form) --- */}
        {isProjectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
            {/* AI Summary Inner Modal */}
            <ResourceAIModal
              isOpen={!!aiModalRes}
              onClose={() => setAiModalRes(null)}
              resource={aiModalRes}
              onSave={(id, summary) => {
                setProjectForm((prev) => ({
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
              className={`w-full max-w-2xl p-6 rounded-[2rem] shadow-xl border flex flex-col max-h-[90vh] ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
            >
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                <h3
                  className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
                >
                  {projectForm.id ? "Edit Project" : "Buat Project Baru"}
                </h3>
                <button
                  onClick={() => setIsProjectModalOpen(false)}
                  className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 px-2">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">
                    Nama Project
                  </label>
                  <input
                    autoFocus
                    type="text"
                    className={`w-full px-4 py-3 rounded-xl border mt-1 ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
                    value={projectForm.title}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, title: e.target.value })
                    }
                    placeholder="Nama Project..."
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">
                    Deskripsi
                  </label>
                  <textarea
                    rows="3"
                    className={`w-full px-4 py-3 rounded-xl border mt-1 ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
                    value={projectForm.description || ""}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Deskripsi detail project..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">
                      Start Date
                    </label>
                    <input
                      type="date"
                      className={`w-full px-4 py-3 rounded-xl border mt-1 ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
                      value={projectForm.startDate || ""}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          startDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">
                      Deadline
                    </label>
                    <input
                      type="date"
                      className={`w-full px-4 py-3 rounded-xl border mt-1 ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
                      value={projectForm.deadline}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          deadline: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">
                    Area of Responsibility
                  </label>
                  <select
                    className={`w-full px-4 py-3 rounded-xl border mt-1 ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
                    value={projectForm.areaId}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, areaId: e.target.value })
                    }
                  >
                    <option value="">-- No Area (Free Project) --</option>
                    {areas.map((a, idx) => (
                      <option key={a.id || idx} value={a.id}>
                        {a.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Manajemen Resource di dalam Project */}
                <div
                  className={`p-5 rounded-2xl border mt-4 ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4
                      className={`font-bold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-slate-800"}`}
                    >
                      <BookOpen size={18} /> Dasar Pelaksanaan / Resources
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingResource(!isAddingResource);
                        setTempResource({
                          ...tempResource,
                          date: projectForm.deadline || "",
                        });
                      }}
                      className="text-xs bg-white border shadow-sm px-3 py-1.5 rounded-lg font-bold text-indigo-600 hover:bg-indigo-50"
                    >
                      + Tambah
                    </button>
                  </div>
                  {isAddingResource && (
                    <ResourceInputSection
                      isDarkMode={isDarkMode}
                      tempResource={tempResource}
                      setTempResource={setTempResource}
                      handleAddResource={handleAddResourceToForm}
                      fileStatus={globalFileStatus}
                      handleFileSelect={handleFileSelectForForm}
                      freeNotes={freeNotes}
                      aiNotes={aiNotes}
                      lists={lists}
                      resources={resources}
                      onCancel={() => setIsAddingResource(false)}
                    />
                  )}
                  <ResourceListTable
                    resources={projectForm.resources}
                    isDarkMode={isDarkMode}
                    openResource={openResource}
                    removeResource={removeResourceFromForm}
                    openAIView={setAiModalRes}
                  />
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleAddProject}
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg"
                >
                  Simpan Project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==================================================================================
  // 7.11. RENDER RESOURCES
  // ==================================================================================
  /**
   * Meng-render tampilan daftar Global Resources dalam format tabel *responsive* (Horizontal Scrollable).
   * Termasuk manajemen file upload, linked notes, AI Extraction, serta fitur filter/search dan pagination.
   * * @returns {JSX.Element} Antarmuka tab Resources
   */
  const renderResources = () => {
    // --- Logika Filter & Pencarian ---
    const filteredResources = resources
      .filter((r) => {
        // Filter kata kunci
        if (
          resSearch &&
          !r.title.toLowerCase().includes(resSearch.toLowerCase())
        )
          return false;

        // Filter rentang tanggal
        if (!r.date) return resDateFilter === "all";
        const resDate = new Date(r.date);
        const now = new Date();

        if (resDateFilter === "month")
          return (
            resDate.getMonth() === now.getMonth() &&
            resDate.getFullYear() === now.getFullYear()
          );
        if (resDateFilter === "year")
          return resDate.getFullYear() === now.getFullYear();
        if (
          resDateFilter === "custom" &&
          resCustomDate.start &&
          resCustomDate.end
        )
          return (
            formatLocalYMD(resDate) >= resCustomDate.start &&
            formatLocalYMD(resDate) <= resCustomDate.end
          );

        return true;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    // --- Logika Pagination ---
    const totalRes = filteredResources.length;
    // Slicing data khusus untuk tabel resources
    const paginatedResources =
      resPerPage === "all"
        ? filteredResources
        : filteredResources.slice(
            (resPage - 1) * resPerPage,
            resPage * resPerPage,
          );

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4">
        {/* --- Komponen Header Informasi --- */}
        <ParaInfo
          title="Resources"
          description="Resource adalah topik atau tema minat yang berkelanjutan yang dapat dimanfaatkan untuk projects atau areas di masa depan. Termasuk aset, materi referensi, dokumen penting, atau koleksi ide. Contoh: Aset Desain, Invoice, Artikel Pemasaran, Catatan Kuliah."
          color="bg-amber-50"
          icon={BookOpen}
          isDarkMode={isDarkMode}
        />

        {/* --- Action Bar & Kontrol Filter --- */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h3
            className={`font-bold text-xl ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            Resources & Assets
          </h3>
          <div className="flex gap-3 w-full md:w-auto">
            {/* Input Pencarian */}
            <div
              className={`flex items-center px-3 py-2 rounded-xl border ${isDarkMode ? "bg-slate-800 border-slate-600" : "bg-white border-slate-200"}`}
            >
              <Search size={14} className="text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Cari..."
                className={`bg-transparent border-none text-xs w-24 focus:w-40 transition-all focus:outline-none focus:ring-0 ${isDarkMode ? "text-white placeholder-slate-500" : "text-slate-900"}`}
                value={resSearch}
                onChange={(e) => setResSearch(e.target.value)}
              />
            </div>

            {/* Dropdown Filter Tanggal */}
            <select
              className={`px-3 py-2 rounded-xl border text-xs font-bold ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-700"}`}
              value={resDateFilter}
              onChange={(e) => setResDateFilter(e.target.value)}
            >
              <option value="all">Semua Waktu</option>
              <option value="month">Bulan Ini</option>
              <option value="year">Tahun Ini</option>
              <option value="custom">Custom</option>
            </select>

            {/* Custom Date Inputs */}
            {resDateFilter === "custom" && (
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  className="px-2 py-2 rounded-xl border text-xs"
                  value={resCustomDate.start}
                  onChange={(e) =>
                    setResCustomDate({
                      ...resCustomDate,
                      start: e.target.value,
                    })
                  }
                />
                <span className="text-slate-400">-</span>
                <input
                  type="date"
                  className="px-2 py-2 rounded-xl border text-xs"
                  value={resCustomDate.end}
                  onChange={(e) =>
                    setResCustomDate({ ...resCustomDate, end: e.target.value })
                  }
                />
              </div>
            )}

            {/* Tombol Buat Resource Baru */}
            <button
              onClick={() => {
                setResourceForm({
                  id: null,
                  title: "",
                  number: "",
                  type: "link",
                  content: "",
                  date: "",
                  url: "",
                  file: null,
                  noteId: "",
                });
                setGlobalFileStatus("idle");
                setIsResourceModalOpen(true);
              }}
              className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-amber-600 shadow-lg shadow-amber-200"
            >
              <Plus size={18} /> Tambah
            </button>
          </div>
        </div>

        {/* --- Layout Tabel: Daftar Resource (Responsive / Horizontal Scroll) --- */}
        <div
          className={`rounded-3xl border overflow-hidden ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
        >
          <div className="overflow-x-auto w-full custom-scrollbar rounded-3xl">
            <table
              className={`w-full text-left whitespace-nowrap text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
            >
              <thead
                className={`font-bold uppercase text-xs ${isDarkMode ? "bg-slate-700 text-slate-400" : "bg-slate-50 text-slate-500"}`}
              >
                <tr>
                  <th className="p-4">No Resource</th>
                  <th className="p-4">Nama Resource</th>
                  <th className="p-4">Deskripsi</th>
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Tipe</th>
                  <th className="p-4">Tags</th>
                  <th className="p-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {/* Empty State Table */}
                {paginatedResources.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="p-8 text-center text-slate-400 italic"
                    >
                      Tidak ada resource ditemukan.
                    </td>
                  </tr>
                )}
                {paginatedResources.map((res, idx) => (
                  <tr
                    key={res.id || idx}
                    className={`transition-colors ${isDarkMode ? "hover:bg-slate-700/50" : "hover:bg-slate-50"}`}
                  >
                    <td className="p-4 font-mono text-xs">
                      {res.number || "-"}
                    </td>
                    <td
                      className="p-4 font-bold text-indigo-500 cursor-pointer hover:underline flex items-center gap-2"
                      onClick={() => openResource(res)}
                    >
                      {res.type === "file" ? (
                        <FileText size={14} />
                      ) : res.type === "link" ? (
                        <Globe size={14} />
                      ) : (
                        <Database size={14} />
                      )}
                      {String(res.name || res.title || "Untitled")}
                    </td>
                    <td className="p-4 max-w-xs truncate">
                      {typeof res.description === "string"
                        ? res.description
                        : typeof res.content === "string"
                          ? res.content
                          : "-"}
                    </td>
                    <td className="p-4">
                      {res.date ? new Date(res.date).toLocaleDateString() : "-"}
                    </td>
                    <td className="p-4 uppercase text-xs font-bold">
                      <span className="bg-slate-100 px-2 py-1 rounded text-slate-500">
                        {res.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(res.tags)
                          ? res.tags
                          : res.sourceTag
                            ? [res.sourceTag]
                            : ["Global"]
                        ).map((tag, i) => (
                          <span
                            key={i}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${isDarkMode ? "bg-indigo-900/30 text-indigo-300" : "bg-indigo-50 text-indigo-600"}`}
                          >
                            {typeof tag === "string" ? tag : "Unknown Tag"}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 flex gap-2">
                      <button
                        onClick={() => setAiModalRes(res)}
                        className={`p-1.5 transition-colors rounded-lg ${res.aiSummary ? "text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300" : "text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-700"}`}
                        title="AI Knowledge Summary"
                      >
                        <Bot size={14} />
                      </button>
                      <button
                        onClick={() => openEditResource(res)}
                        className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg dark:hover:bg-slate-700"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => archiveItem("resource", res)}
                        className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg dark:hover:bg-slate-700"
                      >
                        <Archive size={14} />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm({
                            show: true,
                            id: res.id,
                            itemName: res.title,
                            type: "resource",
                          })
                        }
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-slate-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- Kontrol Navigasi Pagination --- */}
        {filteredResources.length > 0 && (
          <div className="mt-8">
            <PaginationControl
              currentPage={resPage}
              itemsPerPage={resPerPage}
              totalItems={totalRes}
              onPageChange={setResPage}
              onItemsPerPageChange={setResPerPage}
              isDarkMode={isDarkMode}
            />
          </div>
        )}

        {/* --- Modal Form: Buat/Edit Global Resource --- */}
        {isResourceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
            {/* Modal Ekstraksi AI Terpisah */}
            <ResourceAIModal
              isOpen={!!aiModalRes}
              onClose={() => setAiModalRes(null)}
              resource={aiModalRes}
              onSave={(id, summary) => {
                setResources(
                  resources.map((r) =>
                    r.id === id ? { ...r, aiSummary: summary } : r,
                  ),
                );
              }}
              apiKey={geminiApiKey}
              isDarkMode={isDarkMode}
            />
            <div
              className={`rounded-[2rem] shadow-2xl max-w-md w-full p-8 border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
            >
              <h3
                className={`text-xl font-bold mb-6 ${isDarkMode ? "text-white" : "text-slate-900"}`}
              >
                {resourceForm.id ? "Edit Resource" : "Tambah Resource"}
              </h3>
              <form onSubmit={handleSaveResource} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">
                      Nomor
                    </label>
                    <input
                      autoFocus
                      type="text"
                      className={`w-full px-4 py-3 rounded-xl border mt-1 text-sm ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
                      value={resourceForm.number || ""}
                      onChange={(e) =>
                        setResourceForm({
                          ...resourceForm,
                          number: e.target.value,
                        })
                      }
                      placeholder="No."
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">
                      Tipe
                    </label>
                    <select
                      className={`w-full px-3 py-3 rounded-xl border mt-1 text-sm ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
                      value={resourceForm.type}
                      onChange={(e) =>
                        setResourceForm({
                          ...resourceForm,
                          type: e.target.value,
                        })
                      }
                    >
                      <option value="link">Web Link</option>
                      <option value="file">File</option>
                      <option value="note">Catatan / List</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">
                      Nama Resource
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-3 rounded-xl border mt-1 text-sm ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
                      value={resourceForm.title || ""}
                      onChange={(e) =>
                        setResourceForm({
                          ...resourceForm,
                          title: e.target.value,
                        })
                      }
                      placeholder="Judul Dokumen..."
                    />
                  </div>
                </div>

                {/* Input Dinamis Berdasarkan Tipe Reference */}
                <div className="mb-3">
                  {resourceForm.type === "link" && (
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase">
                        URL / Link
                      </label>
                      <input
                        type="text"
                        className={`w-full px-4 py-3 rounded-xl border mt-1 text-sm ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
                        value={resourceForm.url || ""}
                        onChange={(e) =>
                          setResourceForm({
                            ...resourceForm,
                            url: e.target.value,
                          })
                        }
                        placeholder="https://..."
                      />
                      {resourceForm.url && (
                        <p
                          className={`text-[10px] mt-1 truncate ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`}
                        >
                          Link saat ini: {resourceForm.url}
                        </p>
                      )}
                    </div>
                  )}

                  {resourceForm.type === "file" && (
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase">
                        Upload File
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="file"
                          className={`w-full p-2 rounded-xl border text-sm ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-200"}`}
                          onChange={handleFileSelectForGlobal}
                        />
                        {globalFileStatus === "processing" && (
                          <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full flex gap-1 items-center whitespace-nowrap">
                            <Loader2 size={10} className="animate-spin" /> AI
                            Extracting
                          </span>
                        )}
                        {globalFileStatus === "error" && (
                          <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded-full whitespace-nowrap">
                            No AI
                          </span>
                        )}
                        {globalFileStatus === "done" && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full flex gap-1 items-center whitespace-nowrap">
                            <CheckCircle size={10} /> AI Ready
                          </span>
                        )}
                      </div>
                      {resourceForm.title && resourceForm.url && (
                        <p
                          className={`text-[10px] mt-1 truncate ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`}
                        >
                          File saat ini: {resourceForm.title}
                        </p>
                      )}
                    </div>
                  )}

                  {resourceForm.type === "note" && (
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">
                        Pilih Catatan / List
                      </label>
                      <SearchableDropdown
                        options={[
                          {
                            label: "--- Free Notes ---",
                            value: "header-1",
                            disabled: true,
                          },
                          ...freeNotes.map((n) => ({
                            label: n.title,
                            value: `free-${n.id}`,
                          })),
                          {
                            label: "--- AI Notes ---",
                            value: "header-2",
                            disabled: true,
                          },
                          ...aiNotes.map((n) => ({
                            label: n.title,
                            value: `ai-${n.id}`,
                          })),
                          {
                            label: "--- List Bebas ---",
                            value: "header-3",
                            disabled: true,
                          },
                          ...lists.map((l) => ({
                            label: l.title,
                            value: `list-${l.id}`,
                          })),
                        ].filter((o) => !o.disabled)}
                        value={resourceForm.noteId}
                        onChange={(val) => {
                          let noteTitle = "Linked Note / List";
                          let importedSummary = "";

                          if (val.startsWith("free-"))
                            noteTitle = freeNotes.find(
                              (n) => `free-${n.id}` === val,
                            )?.title;
                          else if (val.startsWith("ai-")) {
                            const note = aiNotes.find(
                              (n) => `ai-${n.id}` === val,
                            );
                            noteTitle = note?.title;
                            importedSummary = note?.aiSummary || "";
                          } else if (val.startsWith("list-"))
                            noteTitle = lists.find(
                              (l) => `list-${l.id}` === val,
                            )?.title;

                          if (noteTitle)
                            setResourceForm({
                              ...resourceForm,
                              noteId: val,
                              title: resourceForm.title || noteTitle,
                              content: "Linked Note / List",
                              aiSummary: importedSummary,
                            });
                        }}
                        placeholder="Cari & Pilih Catatan/List..."
                        isDarkMode={isDarkMode}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">
                      Tanggal
                    </label>
                    <input
                      type="date"
                      className={`w-full px-4 py-3 rounded-xl border mt-1 text-sm ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
                      value={resourceForm.date || ""}
                      onChange={(e) =>
                        setResourceForm({
                          ...resourceForm,
                          date: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">
                    Deskripsi
                  </label>
                  <textarea
                    className={`w-full px-4 py-3 rounded-xl border mt-1 text-sm ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
                    rows="3"
                    value={resourceForm.content || ""}
                    onChange={(e) =>
                      setResourceForm({
                        ...resourceForm,
                        content: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsResourceModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 shadow-lg"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==================================================================================
  // 7.12. RENDER ARCHIVES
  // ==================================================================================
  /**
   * Meng-render tampilan repositori Arsip (Item tidak aktif/dihapus sementara).
   * Memungkinkan pengguna memulihkan (restore) Project, Area, atau Resource.
   * Termasuk sidebar filter tipe dan kontrol pencarian/tanggal dengan pagination.
   * * @returns {JSX.Element} Antarmuka tab Archives
   */
  const renderArchives = () => {
    // --- Logika Filter Arsip Utama ---
    const filteredArchives = archives
      .filter((item) => {
        // Filter berdasarkan tipe data orisinal (Project, Area, atau Resource)
        if (archTypeFilter !== "all") {
          if (item.originalType !== archTypeFilter) return false;
        }

        // Filter pencarian teks
        const itemName = item.data.title || item.data.name;
        if (archSearch && !itemName) return false;
        if (
          archSearch &&
          !itemName.toLowerCase().includes(archSearch.toLowerCase())
        )
          return false;

        // Filter berdasarkan tanggal masuk arsip
        if (archDateMode !== "all") {
          const d = new Date(item.archivedAt);
          const now = new Date();

          if (archDateMode === "month")
            return (
              d.getMonth() === now.getMonth() &&
              d.getFullYear() === now.getFullYear()
            );
          if (archDateMode === "year")
            return d.getFullYear() === now.getFullYear();
          if (
            archDateMode === "custom" &&
            archCustomDate.start &&
            archCustomDate.end
          ) {
            const dateStr = formatLocalYMD(d);
            return (
              dateStr >= archCustomDate.start && dateStr <= archCustomDate.end
            );
          }
        }
        return true;
      })
      .sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt));

    // --- Logika Pagination ---
    const totalArch = filteredArchives.length;
    // Slicing data archive
    const paginatedArchives =
      archPerPage === "all"
        ? filteredArchives
        : filteredArchives.slice(
            (archPage - 1) * archPerPage,
            archPage * archPerPage,
          );

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col md:flex-row gap-6 h-[calc(100vh-200px)]">
        {/* --- Sidebar: Panel Filter Kategori Arsip --- */}
        <div
          className={`w-full md:w-64 flex flex-col gap-2 p-4 rounded-3xl border h-fit flex-shrink-0 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
        >
          <h4
            className={`font-bold text-xs mb-2 px-2 uppercase tracking-wider flex items-center gap-2 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
          >
            <Filter size={12} /> Filter Arsip
          </h4>
          {["all", "project", "area", "resource"].map((type) => (
            <button
              key={type}
              onClick={() => setArchTypeFilter(type)}
              className={`text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex justify-between items-center ${archTypeFilter === type ? "bg-indigo-600 text-white shadow-lg" : isDarkMode ? "text-slate-400 hover:bg-slate-700" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <span>
                {type === "all"
                  ? "Semua Arsip"
                  : type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
              {archTypeFilter === type && <CheckCircle size={14} />}
            </button>
          ))}
        </div>

        {/* --- Area Konten Utama Repository Arsip --- */}
        <div className="flex-1 flex flex-col h-full">
          {/* Header Repository */}
          <div
            className={`p-4 rounded-xl border mb-6 flex items-start gap-3 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-indigo-100"}`}
          >
            <div
              className={`p-2 rounded-lg ${isDarkMode ? "bg-slate-700 text-indigo-400" : "bg-white text-indigo-600"}`}
            >
              <Archive size={20} />
            </div>
            <div>
              <h4
                className={`font-bold text-sm mb-1 ${isDarkMode ? "text-white" : "text-slate-800"}`}
              >
                Archives Repository
              </h4>
              <p
                className={`text-xs leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
              >
                Arsip berisi item tidak aktif. Anda dapat memulihkan item
                kembali ke dashboard utama kapan saja.
              </p>
            </div>
          </div>

          {/* Action Bar (Pencarian & Filter Tanggal) */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div
              className={`flex items-center px-4 py-3 rounded-xl border w-full md:w-auto flex-1 ${isDarkMode ? "bg-slate-800 border-slate-600" : "bg-white border-slate-200"}`}
            >
              <Search size={16} className="text-slate-400 mr-3" />
              <input
                type="text"
                placeholder="Cari dalam arsip..."
                className={`bg-transparent border-none text-sm w-full focus:outline-none focus:ring-0 ${isDarkMode ? "text-white placeholder-slate-500" : "text-slate-900 placeholder-slate-400"}`}
                value={archSearch}
                onChange={(e) => setArchSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <CalendarIcon size={16} className="text-slate-400" />
                <select
                  className={`px-4 py-3 rounded-xl border text-sm font-bold w-full md:w-auto cursor-pointer ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-700"}`}
                  value={archDateMode}
                  onChange={(e) => setArchDateMode(e.target.value)}
                >
                  <option value="all">Semua Waktu</option>
                  <option value="month">Bulan Ini</option>
                  <option value="year">Tahun Ini</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              {archDateMode === "custom" && (
                <div className="flex items-center gap-1 animate-in slide-in-from-left-2 w-full md:w-auto">
                  <input
                    type="date"
                    className={`px-3 py-2.5 rounded-xl border text-sm w-full ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-700"}`}
                    value={archCustomDate.start}
                    onChange={(e) =>
                      setArchCustomDate({
                        ...archCustomDate,
                        start: e.target.value,
                      })
                    }
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="date"
                    className={`px-3 py-2.5 rounded-xl border text-sm w-full ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-700"}`}
                    value={archCustomDate.end}
                    onChange={(e) =>
                      setArchCustomDate({
                        ...archCustomDate,
                        end: e.target.value,
                      })
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {/* Daftar Arsip Scrollable */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
            {/* Empty State List */}
            {paginatedArchives.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 opacity-50">
                <Archive size={48} className="mb-4 text-slate-300" />
                <p className="italic">
                  Tidak ada item arsip yang sesuai filter.
                </p>
              </div>
            )}
            {/* Loop Item Arsip */}
            {paginatedArchives.map((arch, idx) => (
              <div
                key={arch.id || idx}
                className={`p-5 rounded-2xl border flex flex-col md:flex-row justify-between md:items-center gap-4 transition-all hover:shadow-md group ${isDarkMode ? "bg-slate-800 border-slate-700 hover:border-indigo-500" : "bg-white border-slate-100 hover:border-indigo-200"}`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wider ${arch.originalType === "project" ? "bg-indigo-100 text-indigo-700" : arch.originalType === "area" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                    >
                      {arch.originalType}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <History size={10} /> Archived:{" "}
                      {new Date(arch.archivedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4
                    className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-slate-900"}`}
                  >
                    {arch.data.title || arch.data.name}
                  </h4>
                  {arch.data.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      {arch.data.description}
                    </p>
                  )}
                </div>
                {/* Tombol Restore / Pulihkan */}
                <button
                  onClick={() => handleRestore(arch)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300"
                >
                  <RotateCcw size={14} /> Pulihkan
                </button>
              </div>
            ))}

            {/* --- Kontrol Navigasi Pagination --- */}
            {filteredArchives.length > 0 && (
              <div className="pt-2">
                <PaginationControl
                  currentPage={archPage}
                  itemsPerPage={archPerPage}
                  totalItems={totalArch}
                  onPageChange={setArchPage}
                  onItemsPerPageChange={setArchPerPage}
                  isDarkMode={isDarkMode}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ==================================================================================
  // 7.13. MAIN RENDER (PRODUCTIVITY MANAGER)
  // ==================================================================================
  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto">
      {/* Global AI Summary Modal */}
      <ResourceAIModal
        isOpen={!!aiModalRes}
        onClose={() => setAiModalRes(null)}
        resource={aiModalRes}
        onSave={(id, summary) => {
          setResources(
            resources.map((r) =>
              r.id === id ? { ...r, aiSummary: summary } : r,
            ),
          );
        }}
        apiKey={geminiApiKey}
        isDarkMode={isDarkMode}
      />

      {/* Header & Tabs */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2
            className={`text-3xl font-extrabold ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            Productivity
          </h2>
          <p
            className={`text-sm mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
          >
            PARA Method Dashboard (Projects, Areas, Resources, Archives)
          </p>
        </div>
        <div
          className={`flex p-1 rounded-2xl border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
        >
          {[
            { id: "overview", l: "Overview", i: LayoutGrid },
            { id: "projects", l: "Projects", i: Layers },
            { id: "areas", l: "Areas", i: Grid },
            { id: "resources", l: "Resources", i: BookOpen },
            { id: "archives", l: "Archives", i: Archive },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${currentTab === tab.id ? (isDarkMode ? "bg-slate-700 text-white shadow" : "bg-slate-900 text-white shadow") : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
            >
              <tab.i
                size={14}
                className={currentTab === tab.id ? "text-indigo-400" : ""}
              />
              <span className="hidden md:inline">{tab.l}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {currentTab === "overview" && renderOverview()}
        {currentTab === "projects" && renderProjects()}
        {currentTab === "areas" && renderAreas()}
        {currentTab === "resources" && renderResources()}
        {currentTab === "archives" && renderArchives()}
      </div>

      {/* Global Modals for PARA Management */}
      <ConfirmationModal
        isOpen={deleteConfirm.show}
        onClose={() =>
          setDeleteConfirm({ show: false, id: null, itemName: "", type: "" })
        }
        onConfirm={
          deleteConfirm.type?.startsWith("archive_")
            ? executeArchiveGlobal
            : deleteConfirm.type === "restore_item"
              ? executeRestoreGlobal
              : executeDeleteGlobal
        }
        title={
          deleteConfirm.type === "archive_area"
            ? "Arsipkan Area?"
            : deleteConfirm.type === "archive_project"
              ? "Arsipkan Project?"
              : deleteConfirm.type === "archive_resource"
                ? "Arsipkan Resource?"
                : deleteConfirm.type === "restore_item"
                  ? "Aktifkan Kembali?"
                  : `Hapus ${deleteConfirm.type === "project" ? "Project" : deleteConfirm.type === "area" ? "Area" : "Resource"}?`
        }
        itemName={deleteConfirm.itemName}
        message={
          deleteConfirm.type === "archive_area"
            ? "Area ini dan semua project di dalamnya akan dipindahkan ke Arsip. Anda bisa memulihkannya nanti."
            : deleteConfirm.type === "archive_project" ||
                deleteConfirm.type === "archive_resource"
              ? "Item ini akan dipindahkan ke Arsip. Anda bisa memulihkannya nanti."
              : deleteConfirm.type === "restore_item"
                ? "Item ini akan dipulihkan dan kembali aktif di daftar utama."
                : `Anda yakin ingin menghapus ${deleteConfirm.type === "area" ? "Area" : "item"} ini secara permanen dari database?`
        }
        confirmText={
          deleteConfirm.type?.startsWith("archive_")
            ? "Arsipkan"
            : deleteConfirm.type === "restore_item"
              ? "Pulihkan"
              : "Konfirmasi Hapus"
        }
        confirmColor={
          deleteConfirm.type?.startsWith("archive_")
            ? "bg-orange-500 hover:bg-orange-600 shadow-orange-200"
            : deleteConfirm.type === "restore_item"
              ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
              : "bg-red-500 hover:bg-red-600 shadow-red-200"
        }
      />

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      <DayDetailModal
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        date={selectedDate}
        projects={projects}
        tasks={[
          ...projectTasks.map((t) => {
            let type = "unknown";
            let parentName = "";
            const projectIds = projects.map((p) => p.id);
            const activityIds = activities.map((a) => a.id);
            if (projectIds.includes(t.projectId)) {
              type = "project-action";
              const parent = projects.find((p) => p.id === t.projectId);
              parentName = parent ? parent.title : "";
            } else if (activityIds.includes(t.projectId)) {
              type = "area-task";
              const parent = activities.find((a) => a.id === t.projectId);
              parentName = parent ? parent.title : "";
            }
            return {
              ...t,
              type,
              parentName,
              projectName: type === "project-action" ? parentName : undefined,
              areaName: type === "area-task" ? parentName : undefined,
            };
          }),
        ]}
        isDarkMode={isDarkMode}
      />

      <ProjectDetailModal
        isOpen={!!selectedProjectForDetail}
        onClose={() => setSelectedProjectForDetail(null)}
        project={selectedProjectForDetail}
        tasks={projectTasks}
        setTasks={setProjectTasks}
        resources={resources}
        setResources={setResources}
        freeNotes={freeNotes}
        aiNotes={aiNotes}
        lists={lists}
        geminiApiKey={geminiApiKey}
        isDarkMode={isDarkMode}
        setAlertModal={setAlertModal}
      />

      <AreaDetailModal
        isOpen={!!selectedAreaForDetail}
        onClose={() => setSelectedAreaForDetail(null)}
        area={selectedAreaForDetail}
        projects={projects}
        setProjects={setProjects}
        activities={activities}
        setActivities={setActivities}
        tasks={projectTasks}
        setTasks={setProjectTasks}
        resources={resources}
        setResources={setResources}
        freeNotes={freeNotes}
        aiNotes={aiNotes}
        lists={lists}
        geminiApiKey={geminiApiKey}
        isDarkMode={isDarkMode}
        onArchiveArea={handleArchiveArea}
        onUpdateArea={handleUpdateArea}
        areas={areas}
        setAlertModal={setAlertModal}
      />
    </div>
  );
};

// ==================================================================================
// 7. FILE CONTROL COMPONENT (ARCHIVE MANAGEMENT)
// ==================================================================================

// 7.2. Komponen Modal Proses Arsip Utama
