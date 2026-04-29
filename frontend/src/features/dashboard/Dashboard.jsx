import React from "react";
import { Activity, CalendarIcon, LayoutGrid, RefreshCw, Settings, Clock, Edit3, AlertTriangle, Bell, MapPin, Menu, PanelLeftClose, StickyNote, ChevronDown, ChevronUp, Timer, LogOut, Moon, Sun, Key, User, Layers, Search, ArchiveRestore } from "lucide-react";
import { useStickyState, useUserAwareState, formatLocalYMD, isRoutineActiveOnDate } from "../../lib/lifeosUtils";
import { FocusModeModal } from "./components/FocusModeModal";

const Planner = React.lazy(() =>
  import("../planner/Planner").then((module) => ({ default: module.Planner })),
);
const NotesManager = React.lazy(() =>
  import("../notes/NotesManager").then((module) => ({
    default: module.NotesManager,
  })),
);
const ProductivityManager = React.lazy(() =>
  import("../productivity/ProductivityManager").then((module) => ({
    default: module.ProductivityManager,
  })),
);
const FileControlManager = React.lazy(() =>
  import("../fileControl/FileControlManager").then((module) => ({
    default: module.FileControlManager,
  })),
);
const SettingsManager = React.lazy(() =>
  import("../settings/SettingsManager").then((module) => ({
    default: module.SettingsManager,
  })),
);
const GlobalSearchModal = React.lazy(() =>
  import("../settings/SettingsManager").then((module) => ({
    default: module.GlobalSearchModal,
  })),
);
const FloatingChatbot = React.lazy(() =>
  import("../settings/SettingsManager").then((module) => ({
    default: module.FloatingChatbot,
  })),
);

const FeatureLoading = ({ isDarkMode }) => (
  <div
    className={`min-h-[240px] rounded-3xl border flex items-center justify-center text-sm font-bold ${isDarkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-white border-slate-100 text-slate-500"}`}
  >
    Memuat modul...
  </div>
);

export const Dashboard = ({
  user,
  onLogout,
  users,
  setUsers,
  setCurrentUser,
  appSettings,
  setAppSettings,
}) => {
  // 11.1 Inisialisasi State Global & Tampilan
  const [view, setView] = useStickyState("overview", "lifeos-view");
  const [plannerTab, setPlannerTab] = React.useState("daily");
  const [settingsTab, setSettingsTab] = React.useState("users");
  const [productivityTab, setProductivityTab] = React.useState("overview");
  const [targetProject, setTargetProject] = React.useState(null);
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isSettingsCollapsed, setIsSettingsCollapsed] = React.useState(true);
  const [isFocusModeOpen, setIsFocusModeOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = useStickyState(false, "lifeos-theme");
  const [agendaTypes, setAgendaTypes] = useStickyState(
    ["Meeting", "Kuliah", "Janji Temu", "Lainnya"],
    "lifeos-types",
  );
  const geminiApiKey = user?.apiKey || "";
  const notifRef = React.useRef(null);
  const [editTarget, setEditTarget] = React.useState(null);

  // 11.2 Inisialisasi State Data Berbasis User (useUserAwareState)
  const [routines, setRoutines] = useUserAwareState(
    [
      {
        id: "r1",
        title: "Lari Pagi",
        frequency: "daily",
        active: true,
        archived: false,
        createdAt: "2023-01-01",
      },
    ],
    "lifeos-routines",
    user,
  );
  const [schedules, setSchedules] = useUserAwareState(
    [
      {
        id: "s1",
        title: "Presentasi Proyek",
        startDate: formatLocalYMD(new Date()),
        endDate: formatLocalYMD(new Date()),
        startTime: "14:00",
        endTime: "15:00",
        isAllDay: false,
        type: "Meeting",
        location: "Zoom",
        media: "https://zoom.us/j/123",
      },
    ],
    "lifeos-schedules",
    user,
  );
  const [todos, setTodos] = useUserAwareState(
    [
      {
        id: "t1",
        title: "Bayar Listrik",
        completed: false,
        date: new Date().toDateString(),
        priority: "high",
      },
    ],
    "lifeos-todos",
    user,
  );
  const [completions, setCompletions] = useUserAwareState(
    [],
    "lifeos-completions",
    user,
  );
  const [freeNotes, setFreeNotes] = useUserAwareState(
    [
      {
        id: 1,
        title: "Ide Startup",
        content: "Aplikasi manajemen hidup...",
        color: "bg-blue-50",
        updatedAt: new Date(),
      },
    ],
    "lifeos-freenotes",
    user,
  );
  const [aiNotes, setAiNotes] = useUserAwareState([], "lifeos-ainotes", user);
  const [lists, setLists] = useUserAwareState(
    [
      {
        id: 1,
        title: "Belanja Bulanan",
        archived: false,
        items: [
          { id: 1, text: "Beras", checked: false },
          { id: 2, text: "Susu", checked: true },
        ],
      },
    ],
    "lifeos-lists",
    user,
  );
  const [projects, setProjects] = useUserAwareState(
    [],
    "lifeos-para-projects",
    user,
  );
  const [projectTasks, setProjectTasks] = useUserAwareState(
    [],
    "lifeos-para-tasks",
    user,
  );
  const [activities, setActivities] = useUserAwareState(
    [],
    "lifeos-para-activities",
    user,
  );
  const [resources, setResources] = useUserAwareState(
    [],
    "lifeos-para-resources",
    user,
  );
  // PENAMBAHAN STATE BARU UNTUK FILE CONTROL
  const [archives, setArchives] = useUserAwareState(
    [],
    "lifeos-para-archives",
    user,
  );

  // 11.3 Efek Samping: Klik di Luar Notifikasi
  // --- FIX: CLOSE NOTIFICATION ON CLICK OUTSIDE ---
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      // Jika notif terbuka DAN klik terjadi di luar elemen notifRef
      if (
        isNotifOpen &&
        notifRef.current &&
        !notifRef.current.contains(event.target)
      ) {
        setIsNotifOpen(false);
      }
    };

    // Pasang event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Bersihkan saat unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotifOpen]); // Dependency isNotifOpen agar efisien

  // 11.4 Efek Samping: Listener Navigasi Eksternal (Markdown AI)
  // LISTENER BARU: Menangkap klik tombol dari Markdown Chatbot & Membuka Semua Jenis Data
  React.useEffect(() => {
    const handleAppNavigate = (e) => {
      const link = e.detail; // format: app:type:id
      const parts = link.split(":");

      if (parts.length >= 3) {
        const type = parts[1];
        const id = parts.slice(2).join(":");

        if (type === "project") {
          const proj = projects.find((p) => p.id === id);
          if (proj) {
            setView("productivity");
            setProductivityTab("projects");
            setTimeout(() => setTargetProject(proj), 100);
          }
        } else if (type === "task" || type === "action") {
          // Task/Action biasanya berada di dalam Project, kita buka Project induknya
          const task = projectTasks.find((t) => t.id === id);
          if (task) {
            setView("productivity");
            const proj = projects.find((p) => p.id === task.projectId);
            if (proj) {
              setProductivityTab("projects");
              setTimeout(() => setTargetProject(proj), 100);
            } else {
              setProductivityTab("areas");
            }
          }
        } else if (type === "area" || type === "activity") {
          setView("productivity");
          setProductivityTab("areas");
        } else if (type === "schedule") {
          const sch = schedules.find((s) => s.id === id);
          if (sch) {
            setView("planner");
            setPlannerTab("schedule");
            setTimeout(() => setEditTarget(sch), 100);
          }
        } else if (type === "todo") {
          const td = todos.find((t) => t.id === id);
          if (td) {
            setView("planner");
            setPlannerTab("todo");
            setTimeout(() => setEditTarget(td), 100);
          }
        } else if (type === "routine") {
          const rt = routines.find((r) => r.id === id);
          if (rt) {
            setView("planner");
            setPlannerTab("routines");
            setTimeout(() => setEditTarget(rt), 100);
          }
        } else if (type === "resource") {
          const res = resources.find((r) => r.id === id);
          if (res) {
            setView("productivity");
            setProductivityTab("resources");
            if (res.url) setTimeout(() => window.open(res.url, "_blank"), 100);
          }
        } else if (type === "ainote" || type === "freenote") {
          setView("notes");
        }
      }
    };

    window.addEventListener("app-navigate", handleAppNavigate);
    return () => window.removeEventListener("app-navigate", handleAppNavigate);
  }, [setView, projects, schedules, resources, todos, routines, projectTasks]);

  // 11.5 Komputasi Data Turunan (Derived State)
  const todayDateStr = formatLocalYMD(new Date());
  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  const threeDaysLaterStr = formatLocalYMD(threeDaysLater);

  // 11.5.1 Agenda 3 Hari Kedepan
  const upcomingSchedules = schedules
    .filter((s) => {
      const start = s.startDate || s.date;
      const end = s.endDate || s.date;
      return start <= threeDaysLaterStr && end >= todayDateStr;
    })
    .sort(
      (a, b) =>
        new Date(a.startDate || a.date) - new Date(b.startDate || b.date),
    );

  // 11.5.2 Notifikasi Proyek
  const projectNotifications = projects
    .filter((p) => p.status !== "archived" && p.deadline)
    .map((p) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadline = new Date(p.deadline);
      deadline.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

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
            ? (pTasks.filter((t) => t.completed).length / pTasks.length) * 100
            : 0;

      let isReminderDay = false;
      let reminderType = "";

      if (diffDays < 0) {
        isReminderDay = true;
        reminderType = "Overdue";
      } else if (diffDays === 0) {
        isReminderDay = true;
        reminderType = "Deadline Hari Ini";
      } else if (diffDays <= 30) {
        if (diffDays % 7 === 0 || diffDays <= 3) {
          isReminderDay = true;
          reminderType = "Pengingat Mingguan";
        }
      } else {
        if (diffDays % 30 === 0) {
          isReminderDay = true;
          reminderType = "Pengingat Bulanan";
        }
      }

      return isReminderDay
        ? {
            id: `notif-proj-${p.id}`,
            project: p,
            daysLeft: diffDays,
            progress: progress,
            reminderType,
          }
        : null;
    })
    .filter(Boolean);

  const totalNotifs = upcomingSchedules.length + projectNotifications.length;

  // 11.5.3 Status Rutinitas Hari Ini
  const activeRoutinesToday = routines.filter((r) =>
    isRoutineActiveOnDate(r, currentDate),
  );
  const completedRoutinesToday = activeRoutinesToday.filter((r) =>
    completions.some(
      (c) => c.routineId === r.id && c.date === currentDate.toDateString(),
    ),
  ).length;
  const progressRoutine =
    activeRoutinesToday.length === 0
      ? 0
      : Math.round((completedRoutinesToday / activeRoutinesToday.length) * 100);

  // 11.5.4 Tugas Prioritas Tinggi
  const allPendingTodos = todos
    .filter((t) => t.priority === "high" && !t.completed)
    .map((t) => ({
      ...t,
      isProd: false,
      sortDate: new Date(t.date || 8640000000000000),
    }));
  const allPendingProdTasks = projectTasks
    .filter((t) => t.priority === "high" && !t.completed)
    .map((t) => {
      let parentName = "";
      let prodType = "task";
      const p = projects.find((proj) => proj.id === t.projectId);

      if (p) {
        parentName = p.title;
        prodType = "action";
      } else {
        const a = activities.find((act) => act.id === t.projectId);
        if (a) {
          parentName = a.title;
          prodType = "task";
        }
      }
      return {
        ...t,
        isProd: true,
        parentName,
        prodType,
        sortDate: new Date(t.dueDate || 8640000000000000),
      };
    });

  const highPriorityTodos = [...allPendingTodos, ...allPendingProdTasks]
    .sort((a, b) => a.sortDate - b.sortDate)
    .slice(0, 3);

  // 11.5.5 Agenda Hari Ini
  const todaysAgenda = schedules
    .filter((s) => {
      const start = s.startDate || s.date;
      const end = s.endDate || s.date;
      return todayDateStr >= start && todayDateStr <= end;
    })
    .sort((a, b) => {
      const timeA = a.isAllDay ? "00:00" : a.startTime || "00:00";
      const timeB = b.isAllDay ? "00:00" : b.startTime || "00:00";
      return timeA.localeCompare(timeB);
    });

  const handleJumpToSchedule = (schedule) => {
    setView("planner");
    setPlannerTab("schedule");
    setEditTarget(schedule);
  };

  // 11.6 Render UI Layout & Dashboard Utama
  return (
    <div
      className={`min-h-screen font-sans flex flex-col md:flex-row relative transition-colors duration-300 ${isDarkMode ? "bg-slate-900 text-white" : "bg-[#FDFDFC] text-slate-800"}`}
    >
      {/* 11.6.1 Modal Utama */}
      <FocusModeModal
        isOpen={isFocusModeOpen}
        onClose={() => setIsFocusModeOpen(false)}
        isDarkMode={isDarkMode}
      />

      <React.Suspense fallback={null}>
        <GlobalSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          setView={setView}
          geminiApiKey={geminiApiKey}
          isDarkMode={isDarkMode}
          allData={{
            routines,
            schedules,
            todos,
            freeNotes,
            aiNotes,
            lists,
            projects,
            projectTasks,
            activities,
            resources,
          }}
        />

        {/* RENDER CHATBOT DI SINI */}
        <FloatingChatbot
          allData={{
            routines,
            schedules,
            todos,
            freeNotes,
            aiNotes,
            lists,
            projects,
            projectTasks,
            activities,
            resources,
          }}
          geminiApiKey={geminiApiKey}
          isDarkMode={isDarkMode}
        />
      </React.Suspense>

      {/* 11.6.2 Tombol Toggle Sidebar (Mobile) */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-6 left-6 z-50 bg-slate-900 text-white p-3 rounded-xl shadow-xl hover:scale-105 transition-transform"
        >
          <Menu size={24} />
        </button>
      )}

      {/* 11.6.3 Sidebar Kiri */}
      <aside
        className={`bg-slate-950 text-slate-300 flex flex-col z-20 shadow-2xl h-screen sticky top-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? "w-full md:w-80" : "w-0 overflow-hidden"}`}
      >
        <div className="p-8 pb-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/20 flex-shrink-0">
              {appSettings?.appLogo ? (
                <img
                  src={appSettings.appLogo}
                  alt="Logo"
                  className="w-6 h-6 object-contain"
                />
              ) : (
                <Activity className="text-white w-6 h-6" />
              )}
            </div>
            <div>
              <span className="font-bold text-2xl tracking-tight text-white block whitespace-nowrap">
                {appSettings?.name !== undefined ? appSettings.name : "LifeOS"}
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500 whitespace-nowrap">
                {appSettings?.navSub !== undefined
                  ? appSettings.navSub
                  : "Integrated Edition"}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-slate-500 hover:text-white transition-colors p-1"
          >
            <PanelLeftClose size={20} />
          </button>
        </div>

        <nav className="px-6 space-y-2 flex-1 flex flex-col overflow-y-auto no-scrollbar">
          <button
            onClick={() => setView("overview")}
            className={`group flex items-center space-x-4 px-6 py-4 rounded-3xl text-sm font-bold transition-all duration-300 ${view === "overview" ? "bg-indigo-600 text-white shadow-xl shadow-indigo-900/50" : "hover:bg-slate-900 hover:text-white"}`}
          >
            <LayoutGrid size={20} />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setView("planner")}
            className={`group flex items-center space-x-4 px-6 py-4 rounded-3xl text-sm font-bold transition-all duration-300 ${view === "planner" ? "bg-indigo-600 text-white shadow-xl shadow-indigo-900/50" : "hover:bg-slate-900 hover:text-white"}`}
          >
            <CalendarIcon size={20} />
            <span>Planner</span>
          </button>
          <button
            onClick={() => setView("notes")}
            className={`group flex items-center space-x-4 px-6 py-4 rounded-3xl text-sm font-bold transition-all duration-300 ${view === "notes" ? "bg-indigo-600 text-white shadow-xl shadow-indigo-900/50" : "hover:bg-slate-900 hover:text-white"}`}
          >
            <StickyNote size={20} />
            <span>Notes Space</span>
          </button>
          <button
            onClick={() => setView("productivity")}
            className={`group flex items-center space-x-4 px-6 py-4 rounded-3xl text-sm font-bold transition-all duration-300 ${view === "productivity" ? "bg-indigo-600 text-white shadow-xl shadow-indigo-900/50" : "hover:bg-slate-900 hover:text-white"}`}
          >
            <Layers size={20} />
            <span>Productivity</span>
          </button>
          <button
            onClick={() => setView("file_control")}
            className={`group flex items-center space-x-4 px-6 py-4 rounded-3xl text-sm font-bold transition-all duration-300 ${view === "file_control" ? "bg-indigo-600 text-white shadow-xl shadow-indigo-900/50" : "hover:bg-slate-900 hover:text-white"}`}
          >
            <ArchiveRestore size={20} />
            <span>File Control</span>
          </button>

          <div className="pt-2">
            <button
              onClick={() => setIsSettingsCollapsed(!isSettingsCollapsed)}
              className={`w-full group flex items-center justify-between px-6 py-4 rounded-3xl text-sm font-bold transition-all duration-300 ${view === "settings" ? "bg-slate-900 text-white" : "hover:bg-slate-900 hover:text-white"}`}
            >
              <div className="flex items-center gap-4">
                <Settings size={20} />
                <span className="text-left">Setting</span>
              </div>
              {isSettingsCollapsed ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronUp size={16} />
              )}
            </button>
            {!isSettingsCollapsed && (
              <div className="mt-2 ml-4 pl-4 border-l border-slate-800 space-y-1 animate-in slide-in-from-left-2">
                {["super_admin", "admin"].includes(user?.role) && (
                  <button
                    onClick={() => {
                      setView("settings");
                      setSettingsTab("app");
                    }}
                    className={`w-full text-left px-4 py-2 rounded-2xl text-xs font-bold transition-colors ${view === "settings" && settingsTab === "app" ? "text-white bg-slate-800" : "text-slate-500 hover:text-white"}`}
                  >
                    Aplikasi
                  </button>
                )}
                {["super_admin", "admin"].includes(user?.role) && (
                  <button
                    onClick={() => {
                      setView("settings");
                      setSettingsTab("users");
                    }}
                    className={`w-full text-left px-4 py-2 rounded-2xl text-xs font-bold transition-colors ${view === "settings" && settingsTab === "users" ? "text-white bg-slate-800" : "text-slate-500 hover:text-white"}`}
                  >
                    Manajemen User
                  </button>
                )}
                <button
                  onClick={() => {
                    setView("settings");
                    setSettingsTab("profile");
                  }}
                  className={`w-full text-left px-4 py-2 rounded-2xl text-xs font-bold transition-colors ${view === "settings" && settingsTab === "profile" ? "text-white bg-slate-800" : "text-slate-500 hover:text-white"}`}
                >
                  Profil Saya
                </button>
                <button
                  onClick={() => {
                    setView("settings");
                    setSettingsTab("api");
                  }}
                  className={`w-full text-left px-4 py-2 rounded-2xl text-xs font-bold transition-colors ${view === "settings" && settingsTab === "api" ? "text-white bg-slate-800" : "text-slate-500 hover:text-white"}`}
                >
                  API Key AI
                </button>
              </div>
            )}
          </div>
        </nav>

        <div className="p-6 mt-auto pt-0">
          <div className="bg-slate-900 p-5 rounded-[2rem] border border-slate-800">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold text-lg border border-slate-600">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-slate-500 truncate capitalize">
                  {user?.role?.replace("_", " ") || "User"}
                </p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full bg-red-500/10 text-red-400 py-3 rounded-xl font-bold text-xs hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 group"
            >
              <LogOut
                size={14}
                className="group-hover:translate-x-[-2px] transition-transform"
              />{" "}
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* 11.6.4 Area Konten Utama */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto h-screen relative">
        {/* Header Aksi Atas */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div
            className={`transition-all duration-300 ${!isSidebarOpen ? "pl-20" : ""}`}
          >
            <h1
              className={`text-4xl font-extrabold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}
            >
              Halo, {user.name}
            </h1>
            <p
              className={`mt-2 font-medium flex items-center gap-2 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
            >
              <Clock size={16} className="text-indigo-500" />{" "}
              {currentDate.toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <button
              onClick={() => setIsSearchOpen(true)}
              className={`p-4 rounded-2xl shadow-lg border transition-all ${isDarkMode ? "bg-slate-800 border-slate-700 text-white hover:text-indigo-400" : "bg-white border-slate-100 text-slate-600 hover:text-indigo-600"}`}
              title="Global AI Search"
            >
              <Search size={24} />
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-4 rounded-2xl shadow-lg border transition-all ${isDarkMode ? "bg-slate-800 border-slate-700 text-yellow-400" : "bg-white border-slate-100 text-slate-400"}`}
            >
              {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>
            <button
              onClick={() => setIsFocusModeOpen(true)}
              className={`p-4 rounded-2xl shadow-lg border transition-all ${isDarkMode ? "bg-slate-800 border-slate-700 text-white hover:text-indigo-400" : "bg-white border-slate-100 text-slate-600 hover:text-indigo-600"}`}
              title="Focus Mode"
            >
              <Timer size={24} />
            </button>

            {/* Popover Notifikasi */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`p-4 rounded-2xl shadow-lg border transition-all ${isNotifOpen ? "bg-indigo-600 text-white" : isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-100 text-slate-600"}`}
              >
                <Bell size={24} />
                {totalNotifs > 0 && (
                  <span className="absolute top-3 right-4 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div
                  className={`absolute right-0 top-16 w-80 rounded-3xl shadow-2xl border p-5 z-50 animate-in fade-in slide-in-from-top-2 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
                >
                  <h3
                    className={`font-bold mb-3 flex items-center justify-between ${isDarkMode ? "text-white" : "text-slate-800"}`}
                  >
                    Agenda (3 Hari){" "}
                    <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md font-bold">
                      {upcomingSchedules.length}
                    </span>
                  </h3>
                  <div className="space-y-3 max-h-40 overflow-y-auto pr-1 custom-scrollbar mb-4">
                    {upcomingSchedules.length > 0 ? (
                      upcomingSchedules.map((s) => {
                        const timeDisplay = s.isAllDay
                          ? "All Day"
                          : s.startTime || s.time;
                        return (
                          <div
                            key={s.id}
                            className={`p-3 border rounded-2xl cursor-pointer transition-colors ${isDarkMode ? "bg-slate-700 border-slate-600 hover:bg-slate-600" : "bg-slate-50 border-slate-100 hover:bg-slate-100"}`}
                            onClick={() => handleJumpToSchedule(s)}
                          >
                            <div className="flex justify-between mb-1">
                              <span className="text-xs font-bold text-indigo-600">
                                {timeDisplay}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(
                                  s.startDate || s.date,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <p
                              className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-slate-700"}`}
                            >
                              {s.title}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-center text-slate-400 text-sm py-2">
                        Tidak ada agenda terdekat.
                      </p>
                    )}
                  </div>

                  <h3
                    className={`font-bold mb-3 flex items-center justify-between border-t pt-4 ${isDarkMode ? "text-white border-slate-700" : "text-slate-800 border-slate-100"}`}
                  >
                    Project Reminder{" "}
                    <span className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-md font-bold">
                      {projectNotifications.length}
                    </span>
                  </h3>
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {projectNotifications.length > 0 ? (
                      projectNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-4 border rounded-2xl cursor-pointer transition-all hover:shadow-md ${isDarkMode ? "bg-slate-700 border-slate-600 hover:bg-slate-600" : "bg-orange-50/30 border-orange-100 hover:bg-orange-50"}`}
                          onClick={() => {
                            setView("productivity");
                            setProductivityTab("projects");
                            setTargetProject(notif.project);
                          }}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${notif.daysLeft <= 7 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}
                            >
                              {notif.daysLeft < 0
                                ? "Overdue"
                                : notif.daysLeft === 0
                                  ? "Hari Ini!"
                                  : `${notif.daysLeft} Hari Lagi`}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              {notif.reminderType}
                            </span>
                          </div>
                          <p
                            className={`text-sm font-bold mb-3 ${isDarkMode ? "text-white" : "text-slate-700"}`}
                          >
                            {notif.project.title}
                          </p>
                          <div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                              <span>Progres Penyelesaian</span>
                              <span>{notif.progress.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-600 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full transition-all"
                                style={{ width: `${notif.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-slate-400 text-sm py-2">
                        Tidak ada pengingat proyek hari ini.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 11.6.5 Routing Dynamic (Berdasarkan State `view`) */}
        {view === "overview" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-7xl mx-auto">
            {/* Widget: Performa Rutinitas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="relative overflow-hidden p-8 rounded-[3rem] shadow-xl transition-all hover:scale-[1.01] bg-gradient-to-br from-indigo-500 to-purple-600 text-white md:col-span-2">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-2xl tracking-tight">
                      Performa Rutinitas
                    </h3>
                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                      <RefreshCw size={24} />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-6xl font-extrabold tracking-tighter">
                      {progressRoutine}%
                    </span>
                    <span className="text-indigo-100 font-medium">
                      selesai hari ini
                    </span>
                  </div>
                  <div className="w-full bg-black/20 h-3 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${progressRoutine}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-indigo-100">
                    {completedRoutinesToday} dari {activeRoutinesToday.length}{" "}
                    kebiasaan telah dilakukan.
                    {progressRoutine === 100
                      ? " Luar biasa! 🎉"
                      : " Tetap semangat! 💪"}
                  </p>
                </div>
              </div>
            </div>

            {/* Widget: Tugas Mendesak */}
            <div
              className={`p-8 rounded-[3rem] border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3
                    className={`font-bold text-xl ${isDarkMode ? "text-white" : "text-slate-900"}`}
                  >
                    Tugas Mendesak
                  </h3>
                  <p
                    className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Fokus selesaikan ini.
                  </p>
                </div>
              </div>
              {highPriorityTodos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {highPriorityTodos.map((task) => (
                    <div
                      key={task.id}
                      className={`flex flex-col justify-center gap-1 p-4 rounded-2xl border ${isDarkMode ? "bg-slate-700/50 border-slate-600" : "bg-slate-50 border-slate-100"}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mt-1.5 flex-shrink-0"></span>
                        <div className="flex-1 min-w-0">
                          <span
                            className={`font-bold block truncate text-sm ${isDarkMode ? "text-white" : "text-slate-700"}`}
                          >
                            {task.title}
                          </span>
                          {task.isProd && task.parentName && (
                            <span
                              className={`text-[10px] mt-0.5 block truncate ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                            >
                              {task.parentName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 border-2 border-dashed rounded-3xl border-slate-200 dark:border-slate-700">
                  Aman! Tidak ada tugas prioritas mendesak.
                </div>
              )}
            </div>

            {/* Widget: Proyek Berjalan */}
            <div
              className={`p-8 rounded-[3rem] border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Layers size={24} />
                  </div>
                  <div>
                    <h3
                      className={`font-bold text-xl ${isDarkMode ? "text-white" : "text-slate-900"}`}
                    >
                      Proyek Berjalan
                    </h3>
                    <p
                      className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Pantau progres tugas dan sisa waktu proyek Anda.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setView("productivity");
                    setProductivityTab("projects");
                  }}
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-xl transition-colors hidden md:block"
                >
                  Lihat Semua
                </button>
              </div>
              {projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects
                    .filter((p) => p.status !== "archived")
                    .slice(0, 4)
                    .map((p) => {
                      const pTasks = projectTasks.filter(
                        (t) => t.projectId === p.id,
                      );
                      const totalWeight = pTasks.reduce(
                        (acc, t) => acc + (parseFloat(t.weight) || 0),
                        0,
                      );
                      const completedWeight = pTasks
                        .filter((t) => t.completed)
                        .reduce(
                          (acc, t) => acc + (parseFloat(t.weight) || 0),
                          0,
                        );
                      const taskProgress =
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
                          key={p.id}
                          className={`p-5 rounded-2xl border flex flex-col gap-4 transition-all hover:shadow-md cursor-pointer ${isDarkMode ? "bg-slate-900 border-slate-700 hover:border-indigo-500" : "bg-slate-50 border-slate-200 hover:bg-white hover:border-indigo-300"}`}
                          onClick={() => {
                            setView("productivity");
                            setProductivityTab("projects");
                            setTargetProject(p);
                          }}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h4
                              className={`text-lg font-bold truncate pr-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}
                            >
                              {p.title}
                            </h4>
                            {p.deadline && (
                              <span className="text-[10px] whitespace-nowrap bg-slate-200 text-slate-600 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                                <CalendarIcon size={10} />{" "}
                                {new Date(p.deadline).toLocaleDateString(
                                  "id-ID",
                                  { day: "numeric", month: "short" },
                                )}
                              </span>
                            )}
                          </div>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500 mb-1">
                                <span>Task Completion</span>
                                <span>{taskProgress.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${taskProgress}%` }}
                                ></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500 mb-1">
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
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 italic border-2 border-dashed rounded-3xl border-slate-200 dark:border-slate-700">
                  Belum ada proyek aktif. Silakan tambah di menu Productivity.
                </div>
              )}
            </div>

            {/* Widget: Agenda Hari Ini */}
            <div
              className={`p-8 rounded-[3rem] border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <CalendarIcon size={24} />
                </div>
                <div>
                  <h3
                    className={`font-bold text-xl ${isDarkMode ? "text-white" : "text-slate-900"}`}
                  >
                    Agenda Hari Ini
                  </h3>
                  <p
                    className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Jadwal penuh hari ini.
                  </p>
                </div>
              </div>
              {todaysAgenda.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {todaysAgenda.map((item) => (
                    <div
                      key={item.id}
                      className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 transition-all hover:shadow-lg ${isDarkMode ? "bg-slate-900 border-slate-700 hover:border-indigo-500" : "bg-slate-50 border-slate-200 hover:bg-white hover:border-indigo-200"}`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase">
                              {item.type}
                            </span>
                          </div>
                          <span
                            className={`text-sm font-bold flex items-center gap-1 ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`}
                          >
                            <Clock size={14} />{" "}
                            {item.isAllDay
                              ? "All Day"
                              : item.startTime || item.time}
                          </span>
                        </div>
                        <h4
                          className={`text-lg font-bold mb-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}
                        >
                          {item.title}
                        </h4>
                        {item.location && (
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPin size={12} /> {item.location}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleJumpToSchedule(item)}
                        className="w-full mt-2 py-2 text-xs font-bold rounded-xl border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit3 size={12} /> Detail / Edit
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 italic">
                  Tidak ada agenda hari ini.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 11.6.6 Pemanggilan Modul sesuai Menu */}
        <React.Suspense fallback={<FeatureLoading isDarkMode={isDarkMode} />}>
          {view === "planner" && (
            <Planner
            routines={routines}
            setRoutines={setRoutines}
            schedules={schedules}
            setSchedules={setSchedules}
            todos={todos}
            setTodos={setTodos}
            completions={completions}
            setCompletions={setCompletions}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            role={user.role}
            agendaTypes={agendaTypes}
            setAgendaTypes={setAgendaTypes}
            isDarkMode={isDarkMode}
            activeTab={plannerTab}
            setActiveTab={setPlannerTab}
            editTarget={editTarget}
            setEditTarget={setEditTarget}
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
          )}
          {view === "notes" && (
            <NotesManager
            schedules={schedules}
            isDarkMode={isDarkMode}
            geminiApiKey={geminiApiKey}
            freeNotes={freeNotes}
            setFreeNotes={setFreeNotes}
            aiNotes={aiNotes}
            setAiNotes={setAiNotes}
            lists={lists}
            setLists={setLists}
            />
          )}
          {/* PERUBAHAN: Meneruskan appSettings jika ProductivityManager memerlukannya (opsional, tapi disiapkan) */}
          {view === "productivity" && (
            <ProductivityManager
            user={user}
            isDarkMode={isDarkMode}
            freeNotes={freeNotes}
            aiNotes={aiNotes}
            lists={lists}
            projects={projects}
            setProjects={setProjects}
            projectTasks={projectTasks}
            setProjectTasks={setProjectTasks}
            activities={activities}
            setActivities={setActivities}
            resources={resources}
            setResources={setResources}
            archives={archives}
            setArchives={setArchives}
            geminiApiKey={geminiApiKey}
            activeTab={productivityTab}
            setActiveTab={setProductivityTab}
            targetProject={targetProject}
            setTargetProject={setTargetProject}
            />
          )}
          {/* PERUBAHAN: Meneruskan STATE archives ke FileControlManager */}
          {view === "file_control" && (
            <FileControlManager
            user={user}
            resources={resources}
            setResources={setResources}
            isDarkMode={isDarkMode}
            archives={archives}
            setArchives={setArchives}
            />
          )}
          {view === "settings" && (
            <SettingsManager
            users={users}
            setUsers={setUsers}
            activeTab={settingsTab}
            setActiveTab={setSettingsTab}
            currentUser={user}
            setCurrentUser={setCurrentUser}
            isDarkMode={isDarkMode}
            appSettings={appSettings}
            setAppSettings={setAppSettings}
            />
          )}
        </React.Suspense>
      </main>
    </div>
  );
};

// ==================================================================================
// 12. MAIN APP / LOGIN PORTAL
// ==================================================================================
