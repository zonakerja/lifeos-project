import React from "react";
import { Activity, User, Lock, Loader2 } from "lucide-react";
import { useStickyState } from "./lib/lifeosUtils";
import { api, clearAuthSession, getAuthSession } from "./lib/apiClient";
import { AlertModal } from "./components/shared";
import { Dashboard } from "./features/dashboard/Dashboard";

export default function App() {
  // 12.1 Inisialisasi State Aplikasi & User (Default User)
  const [currentUser, setCurrentUser] = useStickyState(
    () => getAuthSession()?.user || null,
    "lifeos-user",
  );
  const [users, setUsers] = useStickyState(
    [
      {
        id: "u1",
        name: "Super Admin",
        email: "admin@lifeos.com",
        password: "",
        role: "super_admin",
        phone: "08123456789",
        address: "Jakarta",
      },
      {
        id: "u2",
        name: "Tamu Viewer",
        email: "viewer@lifeos.com",
        password: "",
        role: "viewer",
        phone: "",
        address: "",
      },
    ],
    "lifeos-users",
  );

  // 12.2 Inisialisasi State Pengaturan Aplikasi (Branding)
  const [appSettings, setAppSettings] = useStickyState(
    {
      name: "LifeOS",
      navSub: "Integrated Edition",
      loginSub: "Ultimate",
      motto: "Design Your Life, Manage Your Resources",
      welcomeTitle: "Selamat Datang",
      welcomeSub: "Silakan masuk menggunakan User ID dan Password Anda.",
      footerText: "© 2026 LifeOS System",
    },
    "lifeos-app-settings",
  );

  // 12.3 Inisialisasi State Form Login
  const [isLoading, setIsLoading] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loginAlertData, setLoginAlertData] = React.useState({
    show: false,
    title: "",
    message: "",
  });
  const [settingsLoadedFromApi, setSettingsLoadedFromApi] =
    React.useState(false);

  // 12.4 Fungsi Handle Submit Login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const session = await api.login(email, password);
      setCurrentUser(session.user);
      const [serverUsers, serverSettings] = await Promise.allSettled([
        api.getUsers(),
        api.getAppSettings(),
      ]);
      if (serverUsers.status === "fulfilled") setUsers(serverUsers.value);
      if (serverSettings.status === "fulfilled") {
        setAppSettings(serverSettings.value);
        setSettingsLoadedFromApi(true);
      }
    } catch (error) {
        setLoginAlertData({
          show: true,
          title: "Login Gagal",
          message: error.message || "Tidak dapat login ke backend.",
        });
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
  };

  React.useEffect(() => {
    const session = getAuthSession();
    if (!session?.accessToken) {
      setCurrentUser(null);
      return;
    }
    if (session?.user && !currentUser) {
      setCurrentUser(session.user);
    }
  }, [currentUser, setCurrentUser]);

  React.useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;

    const loadServerState = async () => {
      try {
        const [serverUsers, serverSettings] = await Promise.allSettled([
          api.getUsers(),
          api.getAppSettings(),
        ]);
        if (cancelled) return;
        if (serverUsers.status === "fulfilled") setUsers(serverUsers.value);
        if (serverSettings.status === "fulfilled") {
          setAppSettings(serverSettings.value);
          setSettingsLoadedFromApi(true);
        }
      } catch {
        // Local cache remains available when backend is offline.
      }
    };

    loadServerState();
    return () => {
      cancelled = true;
    };
  }, [currentUser, setAppSettings, setUsers]);

  React.useEffect(() => {
    if (!currentUser || !settingsLoadedFromApi) return;
    const timeout = window.setTimeout(() => {
      api
        .updateAppSettings(appSettings)
        .catch((error) =>
          console.warn("Gagal sync app settings ke API.", error),
        );
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [appSettings, currentUser, settingsLoadedFromApi]);

  // 12.5 Render Kondisional (Bypass ke Dashboard)
  if (currentUser) {
    return (
      <Dashboard
        user={currentUser}
        onLogout={async () => {
          await api.logout();
          clearAuthSession();
          setCurrentUser(null);
        }}
        users={users}
        setUsers={setUsers}
        setCurrentUser={setCurrentUser}
        appSettings={appSettings}
        setAppSettings={setAppSettings}
      />
    );
  }

  // 12.6 Render UI Login Portal
  return (
    <div className="min-h-screen flex items-center justify-center font-sans bg-slate-100 p-4 sm:p-8">
      <AlertModal
        isOpen={loginAlertData.show}
        onClose={() => setLoginAlertData({ ...loginAlertData, show: false })}
        title={loginAlertData.title}
        message={loginAlertData.message}
      />

      {/* 12.6.1 Main Card Container (Floating Split Style) */}
      <div className="w-full max-w-[900px] bg-white rounded-2xl shadow-xl flex flex-col md:flex-row overflow-hidden min-h-[500px]">
        {/* 12.6.2 Left Panel - Branding (Dark Blue dengan Grid Pattern) */}
        <div
          className="w-full md:w-[45%] bg-[#1E3A8A] text-white p-10 flex flex-col justify-between relative"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        >
          {/* Logo & Nama Aplikasi Area */}
          <div className="flex items-center gap-4 md:gap-5 relative z-10 mb-12 mt-2">
            {/* PERUBAHAN: Dimensi kotak logo diperbesar agar tingginya setara dengan blok teks di sebelahnya */}
            <div className="w-16 h-16 md:w-[76px] md:h-[76px] bg-white rounded-2xl flex items-center justify-center text-[#1E3A8A] shrink-0 shadow-sm">
              <Activity size={36} className="font-bold stroke-[3]" />
            </div>

            <div className="flex flex-col justify-center">
              {/* Nama aplikasi */}
              <span className="text-3xl md:text-4xl font-extrabold tracking-widest leading-none">
                {appSettings?.name || "LifeOS"}
              </span>
              {/* Sub login (leading-none ditambahkan agar proporsi pas dengan tinggi kotak logo) */}
              <span className="text-base md:text-lg font-bold text-cyan-300 tracking-wider mt-2 leading-none">
                {appSettings?.loginSub || "Ultimate"}
              </span>
            </div>
          </div>

          {/* Text Area (Motto) */}
          <div className="relative z-10 mb-12 flex-1 flex flex-col justify-center">
            <h2 className="text-2xl md:text-3xl font-bold leading-snug mb-4 text-white">
              {appSettings?.motto || "Design Your Life, Manage Your Resources"}
            </h2>
          </div>

          {/* Footer Area */}
          <div className="relative z-10 mt-auto">
            <p className="text-xs text-blue-300 font-medium tracking-wide">
              {appSettings?.footerText || "© 2026 LifeOS System"}
            </p>
          </div>
        </div>

        {/* 12.6.3 Right Panel - Login Form */}
        <div className="w-full md:w-[55%] bg-white p-10 lg:p-14 flex flex-col justify-center">
          {/* Header Form */}
          <div className="mb-8">
            <h2 className="text-[22px] font-bold text-slate-900 mb-2">
              {appSettings?.welcomeTitle || "Selamat Datang"}
            </h2>
            <p className="text-slate-500 text-sm">
              {appSettings?.welcomeSub ||
                "Silakan masuk menggunakan User ID dan Password Anda."}
            </p>
          </div>

          {/* Form Input */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input User ID / Email */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                User ID / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={16} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Masukkan User ID / Email..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all text-sm text-slate-700 outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={16} className="text-slate-400" />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all text-sm text-slate-700 outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#2563EB] text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-all mt-4 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Masuk Aplikasi"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
