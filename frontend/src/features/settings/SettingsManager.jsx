import React from "react";
import { Activity, CalendarIcon, CheckCircle, Plus, Trash2, LayoutGrid, RefreshCw, CheckSquare, Settings, Edit3, X, Users, StickyNote, Sparkles, Bot, Upload, ChevronDown, ChevronUp, Loader2, ArrowRight, Phone, Home, Lock, Key, User, Layers, BookOpen, Search, Info, Save, List } from "lucide-react";
import { simpleHash, callGeminiAI } from "../../lib/lifeosUtils";
import { ConfirmationModal, AlertModal, MarkdownRenderer } from "../../components/shared";

export const SettingsManager = ({
  users,
  setUsers,
  activeTab,
  setActiveTab,
  currentUser,
  setCurrentUser,
  isDarkMode,
  appSettings,
  setAppSettings,
}) => {
  // 8.1 Inisialisasi State Manajemen Pengguna dan Aplikasi
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    phone: "",
    address: "",
  });
  const [deleteUserModal, setDeleteUserModal] = React.useState({
    show: false,
    user: null,
  });
  const [editingUserId, setEditingUserId] = React.useState(null);
  const [profileForm, setProfileForm] = React.useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    address: currentUser?.address || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [apiKeyInput, setApiKeyInput] = React.useState(currentUser?.apiKey || "");
  const [appForm, setAppForm] = React.useState(appSettings || {});

  // 8.2 Inisialisasi State Notifikasi (Modal & Alert)
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState(
    "Perubahan berhasil disimpan.",
  );
  const [alertData, setAlertData] = React.useState({
    show: false,
    title: "",
    message: "",
  });

  // 8.3 Sinkronisasi Data Form Berdasarkan Tab Aktif
  React.useEffect(() => {
    if (activeTab === "profile" && currentUser) {
      setProfileForm((prev) => ({
        ...prev,
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone || "",
        address: currentUser.address || "",
      }));
    }
    if (activeTab === "api" && currentUser) {
      setApiKeyInput(currentUser.apiKey || "");
    }
    if (activeTab === "app" && appSettings) {
      setAppForm(appSettings);
    }
  }, [activeTab, currentUser, appSettings]);

  // 8.4 Fungsi Manajemen Pengguna (CRUD)
  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setAlertData({
        show: true,
        title: "Validasi Gagal",
        message: "Nama dan Email wajib diisi.",
      });
      return;
    }
    if (!editingUserId && !formData.password) {
      setAlertData({
        show: true,
        title: "Validasi Gagal",
        message: "Password wajib diisi untuk pengguna baru.",
      });
      return;
    }

    if (editingUserId) {
      setUsers(
        users.map((u) =>
          u.id === editingUserId
            ? {
                ...u,
                name: formData.name,
                email: formData.email,
                role: formData.role,
                phone: formData.phone,
                address: formData.address,
              }
            : u,
        ),
      );
      setEditingUserId(null);
      setSuccessMessage("Data pengguna berhasil diperbarui.");
    } else {
      if (users.some((u) => u.email === formData.email)) {
        setAlertData({
          show: true,
          title: "Peringatan",
          message: "Email sudah terdaftar di sistem!",
        });
        return;
      }
      setUsers([
        ...users,
        {
          id: `u-${Date.now()}`,
          ...formData,
          password: simpleHash(formData.password),
        },
      ]);
      setSuccessMessage("Pengguna baru berhasil ditambahkan.");
    }
    setShowSuccessModal(true);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "user",
      phone: "",
      address: "",
    });
  };

  const startEditUser = (user) => {
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      phone: user.phone || "",
      address: user.address || "",
    });
    setEditingUserId(user.id);
  };

  const cancelEditUser = () => {
    setEditingUserId(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "user",
      phone: "",
      address: "",
    });
  };

  const confirmDeleteUser = () => {
    setUsers(users.filter((u) => u.id !== deleteUserModal.user.id));
    setDeleteUserModal({ show: false, user: null });
  };

  const canDeleteUser = (targetUser) => {
    if (currentUser.role === "super_admin") return true;
    if (currentUser.role === "admin" && targetUser.role !== "super_admin")
      return true;
    return false;
  };

  // 8.5 Fungsi Pembaruan Profil Pengguna
  const handleUpdateProfile = (e) => {
    e.preventDefault();
    if (!profileForm.email.trim()) {
      setAlertData({
        show: true,
        title: "Validasi Gagal",
        message: "Email wajib diisi.",
      });
      return;
    }

    const updatedData = {
      name: profileForm.name,
      email: profileForm.email,
      phone: profileForm.phone,
      address: profileForm.address,
    };

    if (
      profileForm.newPassword ||
      profileForm.currentPassword ||
      profileForm.confirmPassword
    ) {
      if (!profileForm.currentPassword) {
        setAlertData({
          show: true,
          title: "Validasi Password",
          message: "Password saat ini belum diisi.",
        });
        return;
      }
      if (simpleHash(profileForm.currentPassword) !== currentUser.password) {
        setAlertData({
          show: true,
          title: "Validasi Password",
          message: "Password saat ini salah.",
        });
        return;
      }
      if (!profileForm.newPassword) {
        setAlertData({
          show: true,
          title: "Validasi Password",
          message: "Password baru belum diisi.",
        });
        return;
      }
      if (profileForm.newPassword !== profileForm.confirmPassword) {
        setAlertData({
          show: true,
          title: "Validasi Password",
          message: "Konfirmasi password baru tidak cocok.",
        });
        return;
      }
      updatedData.password = simpleHash(profileForm.newPassword);
    }

    const updatedUsers = users.map((u) =>
      u.id === currentUser.id ? { ...u, ...updatedData } : u,
    );
    setUsers(updatedUsers);
    setCurrentUser({ ...currentUser, ...updatedData });
    setProfileForm((prev) => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
    setSuccessMessage("Profil Anda berhasil diperbarui.");
    setShowSuccessModal(true);
  };

  // 8.6 Fungsi Simpan Konfigurasi AI & Aplikasi
  const handleSaveApiKey = () => {
    const updatedUsers = users.map((u) =>
      u.id === currentUser.id ? { ...u, apiKey: apiKeyInput } : u,
    );
    setUsers(updatedUsers);
    setCurrentUser({ ...currentUser, apiKey: apiKeyInput });
    setSuccessMessage("API Key AI berhasil disimpan untuk akun Anda.");
    setShowSuccessModal(true);
  };

  const handleSaveAppConfig = (e) => {
    e.preventDefault();
    setAppSettings(appForm);
    setSuccessMessage("Pengaturan Aplikasi berhasil diperbarui.");
    setShowSuccessModal(true);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1000000)
        return alert("Ukuran file terlalu besar! Maksimal 1MB.");
      const reader = new FileReader();
      reader.onloadend = () =>
        setAppForm({ ...appForm, appLogo: reader.result });
      reader.readAsDataURL(file);
    }
  };

  // 8.7 Render UI Settings Manager
  return (
    <div
      className={`p-8 rounded-[2.5rem] shadow-sm border h-full overflow-y-auto custom-scrollbar ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
    >
      {/* 8.7.1 Render Modals Settings */}
      <ConfirmationModal
        isOpen={deleteUserModal.show}
        onClose={() => setDeleteUserModal({ show: false, user: null })}
        onConfirm={confirmDeleteUser}
        title="Hapus User?"
        message="Akses pengguna akan dicabut permanen."
        itemName={deleteUserModal.user?.name}
      />
      <ConfirmationModal
        isOpen={showSuccessModal}
        onConfirm={() => setShowSuccessModal(false)}
        onClose={null}
        title="Berhasil"
        message={successMessage}
      />
      <AlertModal
        isOpen={alertData.show}
        onClose={() => setAlertData({ ...alertData, show: false })}
        title={alertData.title}
        message={alertData.message}
      />

      {/* 8.7.2 Header Settings */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3
            className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            Setting
          </h3>
          <p
            className={`text-sm mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
          >
            Pusat kontrol aplikasi.
          </p>
        </div>
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
          <Settings size={24} />
        </div>
      </div>

      {/* 8.7.3 Navigasi Tabs Settings */}
      <div
        className={`flex flex-wrap p-1 rounded-2xl mb-8 w-fit border ${isDarkMode ? "bg-slate-700 border-slate-600" : "bg-slate-50 border-slate-100"}`}
      >
        {["super_admin", "admin"].includes(currentUser?.role) && (
          <button
            onClick={() => setActiveTab("app")}
            className={`px-4 md:px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === "app" ? (isDarkMode ? "bg-slate-600 text-white shadow-sm" : "bg-white text-indigo-600 shadow-sm") : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-700"}`}
          >
            <LayoutGrid size={16} /> Aplikasi
          </button>
        )}
        {["super_admin", "admin"].includes(currentUser?.role) && (
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 md:px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === "users" ? (isDarkMode ? "bg-slate-600 text-white shadow-sm" : "bg-white text-indigo-600 shadow-sm") : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Users size={16} /> User
          </button>
        )}
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 md:px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === "profile" ? (isDarkMode ? "bg-slate-600 text-white shadow-sm" : "bg-white text-indigo-600 shadow-sm") : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-700"}`}
        >
          <User size={16} /> Profil Saya
        </button>
        <button
          onClick={() => setActiveTab("api")}
          className={`px-4 md:px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === "api" ? (isDarkMode ? "bg-slate-600 text-white shadow-sm" : "bg-white text-indigo-600 shadow-sm") : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-700"}`}
        >
          <Key size={16} /> API Key AI
        </button>
      </div>

      {/* 8.7.4 Konten Tab: Konfigurasi Aplikasi */}
      {activeTab === "app" && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <div
            className={`p-8 rounded-3xl border shadow-sm ${isDarkMode ? "bg-slate-700 border-slate-600" : "bg-white border-slate-100"}`}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <LayoutGrid size={24} />
              </div>
              <div>
                <h4
                  className={`font-bold text-xl ${isDarkMode ? "text-white" : "text-slate-900"}`}
                >
                  Konfigurasi Aplikasi
                </h4>
                <p
                  className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                >
                  Atur branding dan identitas aplikasi Anda.
                </p>
              </div>
            </div>
            <form onSubmit={handleSaveAppConfig} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* INPUT UPLOAD LOGO */}
                <div className="space-y-1 md:col-span-2 mb-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                    Logo Aplikasi
                  </label>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                      {appForm.appLogo ? (
                        <img
                          src={appForm.appLogo}
                          alt="Logo"
                          className="w-8 h-8 object-contain"
                        />
                      ) : (
                        <Activity className="text-white w-8 h-8" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label
                        className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all ${isDarkMode ? "bg-slate-600 hover:bg-slate-500 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                      >
                        Upload Gambar
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                        />
                      </label>
                      {appForm.appLogo && (
                        <button
                          type="button"
                          onClick={() =>
                            setAppForm({ ...appForm, appLogo: "" })
                          }
                          className="text-xs text-red-500 font-bold hover:underline text-left"
                        >
                          Hapus Logo
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 ml-1 mt-1">
                    Disarankan format PNG transparan rasio 1:1 (Maks 1MB)
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                    Nama Aplikasi
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? "bg-slate-600 text-white" : "bg-slate-50 text-slate-800"}`}
                    value={appForm.name ?? ""}
                    onChange={(e) =>
                      setAppForm({ ...appForm, name: e.target.value })
                    }
                    placeholder="LifeOS"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                    Sub Nama (Navbar)
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? "bg-slate-600 text-white" : "bg-slate-50 text-slate-800"}`}
                    value={appForm.navSub ?? ""}
                    onChange={(e) =>
                      setAppForm({ ...appForm, navSub: e.target.value })
                    }
                    placeholder="Boleh dikosongkan..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                    Sub Nama (Halaman Login)
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? "bg-slate-600 text-white" : "bg-slate-50 text-slate-800"}`}
                    value={appForm.loginSub ?? ""}
                    onChange={(e) =>
                      setAppForm({ ...appForm, loginSub: e.target.value })
                    }
                    placeholder="Ultimate."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                    Motto Aplikasi (Login)
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? "bg-slate-600 text-white" : "bg-slate-50 text-slate-800"}`}
                    value={appForm.motto ?? ""}
                    onChange={(e) =>
                      setAppForm({ ...appForm, motto: e.target.value })
                    }
                    placeholder='"Design Your Life..."'
                  />
                </div>
              </div>

              <div
                className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-800 border-slate-600" : "bg-slate-50 border-slate-200"}`}
              >
                <h5
                  className={`font-bold mb-3 text-sm flex items-center gap-2 ${isDarkMode ? "text-white" : "text-slate-700"}`}
                >
                  Teks Sambutan (Halaman Login)
                </h5>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                      Judul Sambutan
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? "bg-slate-700 text-white" : "bg-white text-slate-800"}`}
                      value={appForm.welcomeTitle ?? ""}
                      onChange={(e) =>
                        setAppForm({ ...appForm, welcomeTitle: e.target.value })
                      }
                      placeholder="Selamat Datang Kembali"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                      Sub-judul Sambutan
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? "bg-slate-700 text-white" : "bg-white text-slate-800"}`}
                      value={appForm.welcomeSub ?? ""}
                      onChange={(e) =>
                        setAppForm({ ...appForm, welcomeSub: e.target.value })
                      }
                      placeholder="Silakan masuk untuk..."
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                  Teks Footer / Ulasan (Bawah Login)
                </label>
                <textarea
                  rows="3"
                  className={`w-full px-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? "bg-slate-600 text-white placeholder-slate-400" : "bg-slate-50 text-slate-800 placeholder-slate-400"}`}
                  value={appForm.footerText ?? ""}
                  onChange={(e) =>
                    setAppForm({ ...appForm, footerText: e.target.value })
                  }
                  placeholder="Tambahkan informasi kontak, versi aplikasi, atau kutipan di sini..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2"
                >
                  <Save size={18} /> Simpan Pengaturan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8.7.5 Konten Tab: Manajemen User */}
      {activeTab === "users" && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <form
            onSubmit={handleSaveUser}
            className={`p-6 rounded-3xl mb-8 border transition-all ${editingUserId ? "bg-indigo-50/50 border-indigo-200" : isDarkMode ? "bg-slate-700 border-slate-600" : "bg-slate-50 border-slate-100"}`}
          >
            <div className="flex justify-between items-center mb-4">
              <h4
                className={`font-bold ${editingUserId ? "text-indigo-600" : isDarkMode ? "text-white" : "text-slate-800"}`}
              >
                {editingUserId ? "Edit Data User" : "Tambah User Baru"}
              </h4>
              {editingUserId && (
                <button
                  type="button"
                  onClick={cancelEditUser}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <X size={14} /> Batal Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  className={`w-full px-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? "bg-slate-600 text-white" : "bg-white"}`}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                  Email
                </label>
                <input
                  type="email"
                  className={`w-full px-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? "bg-slate-600 text-white" : "bg-white"}`}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              {!editingUserId && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? "bg-slate-600 text-white placeholder-slate-400" : "bg-white placeholder-slate-300"}`}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                  Role
                </label>
                <select
                  className={`w-full px-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? "bg-slate-600 text-white" : "bg-white"}`}
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                >
                  <option value="user">User</option>
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                  {currentUser.role === "super_admin" && (
                    <option value="super_admin">Super Admin</option>
                  )}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                  No. HP
                </label>
                <input
                  type="text"
                  className={`w-full px-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? "bg-slate-600 text-white" : "bg-white"}`}
                  placeholder="08..."
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                  Alamat
                </label>
                <input
                  type="text"
                  className={`w-full px-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? "bg-slate-600 text-white" : "bg-white"}`}
                  placeholder="Jalan..."
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
            </div>

            <button
              className={`w-full md:w-auto px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${editingUserId ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-slate-900 text-white hover:bg-slate-800"}`}
            >
              {editingUserId ? (
                <>
                  <CheckCircle size={16} /> Simpan Perubahan
                </>
              ) : (
                <>
                  <Plus size={16} /> Tambah User
                </>
              )}
            </button>
          </form>

          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className={`flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-2xl transition-all ${editingUserId === u.id ? "border-indigo-500 ring-1 ring-indigo-500" : isDarkMode ? "bg-slate-700 border-slate-600" : "bg-white border-slate-100"}`}
              >
                <div className="flex items-start gap-4 mb-3 md:mb-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${isDarkMode ? "bg-slate-600 text-white" : "bg-slate-100 text-slate-600"}`}
                  >
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <h4
                      className={`font-bold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-slate-800"}`}
                    >
                      {u.name}
                      {u.role === "super_admin" && (
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                          Super Admin
                        </span>
                      )}
                      {u.role === "admin" && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          Admin
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-500 mb-1">
                      {u.email} • <span className="capitalize">{u.role}</span>
                    </p>
                    {(u.phone || u.address) && (
                      <div className="flex flex-wrap gap-3 text-[10px] text-slate-400">
                        {u.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={10} /> {u.phone}
                          </span>
                        )}
                        {u.address && (
                          <span className="flex items-center gap-1">
                            <Home size={10} /> {u.address}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => startEditUser(u)}
                    className="px-3 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors flex items-center gap-1"
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                  {canDeleteUser(u) && (
                    <button
                      onClick={() =>
                        setDeleteUserModal({ show: true, user: u })
                      }
                      className="px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center gap-1"
                    >
                      <Trash2 size={14} /> Hapus
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8.7.6 Konten Tab: Edit Profil */}
      {activeTab === "profile" && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <div
            className={`p-8 rounded-3xl border ${isDarkMode ? "bg-slate-700 border-slate-600" : "bg-white border-slate-100 shadow-sm"}`}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <User size={24} />
              </div>
              <div>
                <h4
                  className={`font-bold text-xl ${isDarkMode ? "text-white" : "text-slate-900"}`}
                >
                  Edit Profil
                </h4>
                <p
                  className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                >
                  Perbarui informasi pribadi dan password Anda.
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? "bg-slate-600 text-white" : "bg-slate-50 text-slate-800"}`}
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className={`w-full px-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? "bg-slate-600 text-white" : "bg-slate-50 text-slate-800"}`}
                    value={profileForm.email}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                    No. HP
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? "bg-slate-600 text-white" : "bg-slate-50 text-slate-800"}`}
                    value={profileForm.phone}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                    Alamat
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? "bg-slate-600 text-white" : "bg-slate-50 text-slate-800"}`}
                    value={profileForm.address}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        address: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div
                className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-800 border-slate-600" : "bg-slate-50 border-slate-200"}`}
              >
                <h5
                  className={`font-bold mb-3 text-sm flex items-center gap-2 ${isDarkMode ? "text-white" : "text-slate-700"}`}
                >
                  <Lock size={14} /> Ganti Password
                </h5>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                      Password Saat Ini
                    </label>
                    <input
                      type="password"
                      placeholder="Kosongkan jika tidak mengubah"
                      className={`w-full px-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? "bg-slate-700 text-white placeholder-slate-500" : "bg-white text-slate-800"}`}
                      value={profileForm.currentPassword}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          currentPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                        Password Baru
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className={`w-full px-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? "bg-slate-700 text-white placeholder-slate-500" : "bg-white text-slate-800 placeholder-slate-300"}`}
                        value={profileForm.newPassword}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            newPassword: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                        Konfirmasi Password
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className={`w-full px-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? "bg-slate-700 text-white placeholder-slate-500" : "bg-white text-slate-800 placeholder-slate-300"}`}
                        value={profileForm.confirmPassword}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            confirmPassword: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2">
                  <CheckCircle size={18} /> Simpan Profil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8.7.7 Konten Tab: Konfigurasi API AI Khusus */}
      {activeTab === "api" && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <div
            className={`p-8 rounded-3xl border ${isDarkMode ? "bg-slate-700 border-slate-600" : "bg-white border-slate-100 shadow-sm"}`}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Key size={24} />
              </div>
              <div>
                <h4
                  className={`font-bold text-xl ${isDarkMode ? "text-white" : "text-slate-900"}`}
                >
                  Konfigurasi API AI Khusus Anda
                </h4>
                <p
                  className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                >
                  Masukkan API Key dari Google AI Studio. Key ini hanya akan
                  berlaku untuk akun Anda.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  className={`w-full px-5 py-4 rounded-2xl border-none shadow-sm font-mono text-sm ${isDarkMode ? "bg-slate-600 text-white placeholder-slate-400" : "bg-slate-50 text-slate-800"}`}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSaveApiKey}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2"
                >
                  <CheckCircle size={18} /> Simpan Konfigurasi
                </button>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 text-blue-700 rounded-2xl text-xs flex items-start gap-3">
              <div className="p-1 bg-blue-200 rounded-full mt-0.5">
                <Bot size={12} />
              </div>
              <p>
                API Key ini disimpan secara aman dan diikat secara spesifik pada
                profil Anda. Pengguna lain di aplikasi ini memiliki API Key
                mereka sendiri dan tidak akan menggunakan kuota Anda.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================================================================================
// 9. GLOBAL AI SEARCH MODAL
// ==================================================================================
export const GlobalSearchModal = ({
  isOpen,
  onClose,
  allData,
  geminiApiKey,
  isDarkMode,
  setView,
}) => {
  // 9.1 Inisialisasi State Modal Global Search
  const [query, setQuery] = React.useState("");
  const [mode, setMode] = React.useState("standard"); // 'standard' | 'ai'
  const [aiResponse, setAiResponse] = React.useState("");
  const [isAiLoading, setIsAiLoading] = React.useState(false);

  // 9.2 Efek Samping untuk Keyboard Shortcuts (Esc)
  React.useEffect(() => {
    if (isOpen) {
      setQuery("");
      setAiResponse("");
      setMode("standard");
    }
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 9.3 Logika Pencarian Standar (Real-time filtering)
  const getStandardResults = () => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    const results = [];
    const check = (str) => str && str.toLowerCase().includes(lowerQuery);

    allData.projects.forEach((p) => {
      if (check(p.title) || check(p.description))
        results.push({
          type: "Project",
          title: p.title,
          desc: p.deadline ? `Deadline: ${p.deadline}` : "No deadline",
          icon: Layers,
          color: "text-indigo-500",
          action: () => setView("productivity"),
        });
    });

    allData.projectTasks.forEach((t) => {
      if (check(t.title) || check(t.description))
        results.push({
          type: "Task",
          title: t.title,
          desc: `Prioritas: ${t.priority}`,
          icon: CheckSquare,
          color: "text-emerald-500",
          action: () => setView("productivity"),
        });
    });

    allData.schedules.forEach((s) => {
      if (check(s.title) || check(s.location))
        results.push({
          type: "Agenda",
          title: s.title,
          desc: `Tgl: ${s.date || s.startDate}`,
          icon: CalendarIcon,
          color: "text-blue-500",
          action: () => setView("planner"),
        });
    });

    allData.todos.forEach((t) => {
      if (check(t.title))
        results.push({
          type: "To-Do",
          title: t.title,
          desc: t.completed ? "Selesai" : "Belum Selesai",
          icon: CheckCircle,
          color: "text-teal-500",
          action: () => setView("planner"),
        });
    });

    allData.routines.forEach((r) => {
      if (check(r.title))
        results.push({
          type: "Rutinitas",
          title: r.title,
          desc: `Frekuensi: ${r.frequency}`,
          icon: RefreshCw,
          color: "text-orange-500",
          action: () => setView("planner"),
        });
    });

    allData.freeNotes.forEach((n) => {
      if (check(n.title) || check(n.content))
        results.push({
          type: "Catatan",
          title: n.title,
          desc: n.content?.substring(0, 50) + "...",
          icon: StickyNote,
          color: "text-yellow-500",
          action: () => setView("notes"),
        });
    });

    allData.aiNotes.forEach((n) => {
      if (check(n.title) || check(n.aiSummary))
        results.push({
          type: "AI Note",
          title: n.title,
          desc: "Catatan Pintar",
          icon: Bot,
          color: "text-purple-500",
          action: () => setView("notes"),
        });
    });

    allData.resources.forEach((r) => {
      if (check(r.title) || check(r.name))
        results.push({
          type: "Resource",
          title: r.title || r.name,
          desc: r.type,
          icon: BookOpen,
          color: "text-amber-500",
          action: () => setView("productivity"),
        });
    });

    return results.slice(0, 15);
  };

  const standardResults = getStandardResults();

  // 9.4 Logika Pencarian AI (Semantic & Chat)
  const compileContext = () => {
    // Menyertakan Semua Data & ID ke dalam Konteks Pencarian Global
    const resContext = allData.resources
      .filter((r) => r.aiSummary || r.content)
      .map(
        (r) =>
          `- ID: app:resource:${r.id} | Judul: ${r.title} | Info: ${r.aiSummary?.substring(0, 250) || r.content?.substring(0, 100)}`,
      )
      .join("\n")
      .substring(0, 3000);
    const notesContext = allData.aiNotes
      .filter((n) => n.aiSummary || n.content)
      .map(
        (n) =>
          `- ID: app:ainote:${n.id} | Judul: ${n.title} | Info: ${n.aiSummary?.substring(0, 250) || n.content?.substring(0, 100)}`,
      )
      .join("\n")
      .substring(0, 3000);
    const freeNotesContext = allData.freeNotes
      .filter((n) => n.content)
      .map(
        (n) =>
          `- ID: app:freenote:${n.id} | Judul: ${n.title} | Info: ${n.content?.substring(0, 200)}`,
      )
      .join("\n")
      .substring(0, 2000);
    const agendaContext = allData.schedules
      .map(
        (s) =>
          `- ID: app:schedule:${s.id} | ${s.title} (Tgl: ${s.startDate || s.date})`,
      )
      .join("\n")
      .substring(0, 2000);
    const projContext = allData.projects
      .filter((p) => p.status !== "archived")
      .map(
        (p) =>
          `- ID: app:project:${p.id} | ${p.title} (Deadline: ${p.deadline})`,
      )
      .join("\n")
      .substring(0, 2000);
    const taskContext = allData.projectTasks
      .filter((t) => !t.completed)
      .map((t) => `- ID: app:task:${t.id} | ${t.title} (Tugas/Action)`)
      .join("\n")
      .substring(0, 1000);
    const todoContext = allData.todos
      .filter((t) => !t.completed)
      .map((t) => `- ID: app:todo:${t.id} | ${t.title}`)
      .join("\n")
      .substring(0, 1000);
    const routineContext = allData.routines
      .filter((r) => r.active)
      .map((r) => `- ID: app:routine:${r.id} | ${r.title}`)
      .join("\n")
      .substring(0, 1000);

    return `[DATA APLIKASI LIFEOS USER]
--- RESOURCES ---
${resContext || "Kosong"}
--- AI NOTES ---
${notesContext || "Kosong"}
--- FREE NOTES ---
${freeNotesContext || "Kosong"}
--- AGENDA ---
${agendaContext || "Kosong"}
--- PROJECTS ---
${projContext || "Kosong"}
--- PROJECT ACTIONS / TASKS ---
${taskContext || "Kosong"}
--- TO-DO HARIAN ---
${todoContext || "Kosong"}
--- RUTINITAS ---
${routineContext || "Kosong"}`;
  };

  // 9.5 Handler Request Pencarian AI ke Gemini
  const handleAiSearch = async () => {
    if (!query.trim()) return;
    if (!geminiApiKey) {
      setAiResponse(
        "⚠️ API Key Gemini belum diatur. Silakan atur di menu Setting.",
      );
      return;
    }

    setIsAiLoading(true);
    setAiResponse("");

    try {
      const contextData = compileContext();
      // PERBAIKAN: Prompt yang memerintahkan AI untuk menggunakan Link Format app:type:id
      const prompt = `Anda adalah fitur pencarian AI dari aplikasi "LifeOS".
Pengguna mencari/bertanya: "${query}".

TUGAS ANDA:
1. Jawab secara akurat dan komprehensif berdasarkan [DATA APLIKASI LIFEOS USER] di bawah ini.
2. JIKA Anda merujuk pada salah satu data, Anda WAJIB menyisipkan Link Markdown yang mengarah ke ID item tersebut agar pengguna bisa mengkliknya.
Format: [Nama Item atau Judul Dokumen](ID)
Contoh: "Anda bisa membaca [Catatan Marketing](app:ainote:123)." atau "Ingat tugas [Bayar Listrik](app:todo:456)."
3. JIKA informasi TIDAK ADA di data, silakan berikan wawasan/jawaban umum dari luar, namun beritahu bahwa itu bukan dari data aplikasi.
4. Gunakan Markdown (Tabel, List, Bold) untuk merapikan jawaban.

${contextData}

Pertanyaan/Pencarian User: ${query}
Jawaban AI:`;

      const response = await callGeminiAI(geminiApiKey, prompt);
      setAiResponse(response);
    } catch (error) {
      const errMsg = error?.message || String(error);
      setAiResponse(
        errMsg.includes("quota")
          ? `⚠️ **Limit API Gemini Habis.** Kuota gratis telah habis. Silakan coba lagi nanti.`
          : `❌ Terjadi kesalahan: ${errMsg}`,
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  // 9.6 Render UI Global Search Modal
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] ${isDarkMode ? "bg-slate-900 border border-slate-700" : "bg-white"}`}
      >
        {/* 9.6.1 Header / Input Area */}
        <div
          className={`p-4 border-b flex items-center gap-4 ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}
        >
          <Search
            size={24}
            className={isDarkMode ? "text-slate-400" : "text-slate-400"}
          />
          <input
            autoFocus
            type="text"
            placeholder={
              mode === "standard"
                ? "Cari Project, Tugas, Catatan, Agenda..."
                : "Tanya AI (Cth: Apa tugas mendesak saya minggu ini?)"
            }
            className={`flex-1 bg-transparent border-none text-lg focus:outline-none focus:ring-0 ${isDarkMode ? "text-white placeholder-slate-500" : "text-slate-900 placeholder-slate-400"}`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && mode === "ai") handleAiSearch();
            }}
          />
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setMode("standard")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === "standard" ? "bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"}`}
            >
              Cepat
            </button>
            <button
              onClick={() => setMode("ai")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${mode === "ai" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"}`}
            >
              <Sparkles size={12} /> AI
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X
              size={20}
              className={isDarkMode ? "text-slate-400" : "text-slate-600"}
            />
          </button>
        </div>

        {/* 9.6.2 Body / Results Area */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
          {/* 9.6.2.A Tampilan Pencarian Standar */}
          {mode === "standard" && (
            <div>
              {!query ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 opacity-60">
                  <Search size={48} className="mb-4" />
                  <p>Ketik sesuatu untuk mencari di seluruh aplikasi...</p>
                </div>
              ) : standardResults.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                  Tidak menemukan hasil untuk "{query}". Coba beralih ke Mode
                  AI.
                </div>
              ) : (
                <div className="space-y-2">
                  {standardResults.map((res, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        res.action();
                        onClose();
                      }}
                      className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all hover:shadow-md ${isDarkMode ? "bg-slate-800 hover:bg-slate-700 border border-slate-700" : "bg-white hover:border-indigo-200 border border-slate-100"}`}
                    >
                      <div
                        className={`p-3 rounded-xl bg-slate-100 dark:bg-slate-900 ${res.color}`}
                      >
                        <res.icon size={20} />
                      </div>
                      <div className="flex-1">
                        <h4
                          className={`font-bold text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}
                        >
                          {res.title}
                        </h4>
                        <p className="text-xs text-slate-500">{res.desc}</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                        {res.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 9.6.2.B Tampilan Pencarian AI */}
          {mode === "ai" && (
            <div className="flex flex-col h-full">
              {!aiResponse && !isAiLoading && (
                <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                  <Bot size={48} className="mb-4 opacity-50 text-indigo-500" />
                  <p className="mb-4 text-slate-500">
                    AI akan menganalisis data Agenda, Project, Tugas, dan
                    Catatan Anda.
                  </p>
                  <button
                    onClick={handleAiSearch}
                    disabled={!query.trim()}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    <Sparkles size={18} /> Tanya AI Sekarang
                  </button>
                </div>
              )}

              {isAiLoading && (
                <div className="flex items-center justify-center py-20">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl flex items-center gap-4 border border-indigo-100 dark:border-slate-700 animate-pulse">
                    <Loader2
                      className="animate-spin text-indigo-600"
                      size={32}
                    />
                    <div className="text-left">
                      <p className="font-bold text-indigo-900 dark:text-indigo-400">
                        AI Sedang Berpikir...
                      </p>
                      <p className="text-xs text-slate-500">
                        Membaca jutaan piksel data LifeOS Anda.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {aiResponse && !isAiLoading && (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                  <div
                    className={`p-6 rounded-3xl border shadow-sm ${isDarkMode ? "bg-slate-800 border-indigo-500/30" : "bg-white border-indigo-100"}`}
                  >
                    <div className="flex items-center gap-3 mb-4 border-b pb-4 border-slate-100 dark:border-slate-700">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <Bot size={20} />
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-white">
                        Jawaban AI LifeOS
                      </h4>
                    </div>

                    {/* Menggunakan MarkdownRenderer untuk menampilkan tabel dan link interaktif */}
                    <div
                      className="mt-2"
                      onClick={(e) => {
                        // Jika link diklik, tutup modal Global Search agar tidak menutupi modal data yang akan terbuka
                        if (
                          e.target.tagName === "BUTTON" &&
                          e.target.textContent.includes("🔗")
                        ) {
                          onClose();
                        }
                      }}
                    >
                      <MarkdownRenderer
                        content={aiResponse}
                        isDarkMode={isDarkMode}
                      />
                    </div>
                  </div>
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => setAiResponse("")}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-2 bg-slate-200 dark:bg-slate-800 px-4 py-2 rounded-full transition-colors"
                    >
                      <RefreshCw size={12} /> Tanya Hal Lain
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================================================================================
// 10. FLOATING CHATBOT AI ASSISTANT
// ==================================================================================

export const FloatingChatbot = ({ allData, geminiApiKey, isDarkMode }) => {
  // 10.1 Inisialisasi State Chatbot
  const [isOpen, setIsOpen] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [messages, setMessages] = React.useState([
    {
      role: "ai",
      content:
        "Halo! Saya adalah AI Assistant LifeOS Anda. Ada yang bisa saya bantu terkait jadwal, tugas, atau mencari info dari catatan Anda?",
    },
  ]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef(null);

  // 10.2 Efek Auto-scroll ke Pesan Terbaru
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isOpen]);

  // 10.3 Kompilasi Konteks Data untuk Prompt AI
  const compileContext = () => {
    // PERBAIKAN: Menyertakan Todo, Rutinitas, Task, dan Kegiatan ke dalam konteks agar AI tau cara merujuknya
    const resContext = allData.resources
      .filter((r) => r.aiSummary || r.content)
      .map(
        (r) =>
          `- ID: app:resource:${r.id} | Judul: ${r.title} | Info: ${r.aiSummary?.substring(0, 250) || r.content?.substring(0, 100)}`,
      )
      .join("\n")
      .substring(0, 3000);
    const notesContext = allData.aiNotes
      .filter((n) => n.aiSummary || n.content)
      .map((n) => `- ID: app:ainote:${n.id} | Judul: ${n.title}`)
      .join("\n")
      .substring(0, 1500);
    const agendaContext = allData.schedules
      .map(
        (s) =>
          `- ID: app:schedule:${s.id} | ${s.title} (Tgl: ${s.startDate || s.date})`,
      )
      .join("\n")
      .substring(0, 1500);
    const projContext = allData.projects
      .filter((p) => p.status !== "archived")
      .map((p) => `- ID: app:project:${p.id} | ${p.title}`)
      .join("\n")
      .substring(0, 1000);
    const taskContext = allData.projectTasks
      .filter((t) => !t.completed)
      .map((t) => `- ID: app:task:${t.id} | ${t.title} (Tugas/Action)`)
      .join("\n")
      .substring(0, 1000);
    const todoContext = allData.todos
      .filter((t) => !t.completed)
      .map((t) => `- ID: app:todo:${t.id} | ${t.title}`)
      .join("\n")
      .substring(0, 1000);
    const routineContext = allData.routines
      .filter((r) => r.active)
      .map((r) => `- ID: app:routine:${r.id} | ${r.title}`)
      .join("\n")
      .substring(0, 1000);
    const activityContext = allData.activities
      .map((a) => `- ID: app:activity:${a.id} | ${a.title}`)
      .join("\n")
      .substring(0, 1000);

    return `[DATA APLIKASI LIFEOS USER]
--- RESOURCES ---
${resContext || "Kosong"}
--- AI NOTES ---
${notesContext || "Kosong"}
--- AGENDA ---
${agendaContext || "Kosong"}
--- PROJECTS ---
${projContext || "Kosong"}
--- KEGIATAN/AREA ---
${activityContext || "Kosong"}
--- PROJECT ACTIONS / TASKS ---
${taskContext || "Kosong"}
--- TO-DO HARIAN ---
${todoContext || "Kosong"}
--- RUTINITAS ---
${routineContext || "Kosong"}`;
  };

  // 10.4 Handler Kirim Pesan AI
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);

    if (!geminiApiKey) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content:
            "⚠️ **API Key belum diatur!** Silakan atur di menu Settings.",
        },
      ]);
      return;
    }

    setIsLoading(true);

    try {
      const contextData = compileContext();
      let chatHistory = messages
        .slice(-4)
        .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
        .join("\n\n");

      const prompt = `Anda adalah "LifeOS AI", asisten pribadi pengguna.
TUGAS UTAMA:
1. Jawab pertanyaan pengguna menggunakan [DATA APLIKASI LIFEOS USER] di bawah.
2. JIKA Anda merujuk pada salah satu data (Catatan, Agenda, Project, Task, To-Do, atau Rutinitas), Anda WAJIB membuat Link Markdown yang mengarah ke ID item tersebut.
Format: [Nama Item yang Relevan](ID)
Contoh: "Jangan lupa selesaikan [Bayar Listrik](app:todo:123) hari ini."
atau "Terkait [Olahraga](app:routine:456)..."
3. Jika informasi TIDAK ADA di data, jawab dengan pengetahuan umum, tapi beritahu bahwa itu tidak ada di catatan aplikasi.
4. Gunakan Markdown (Tabel, Bold, List) jika perlu.

${contextData}

[HISTORI CHAT]
${chatHistory}

User: ${userMsg}
AI:`;

      const response = await callGeminiAI(geminiApiKey, prompt);
      setMessages((prev) => [...prev, { role: "ai", content: response }]);
    } catch (error) {
      const errMsg = error?.message || String(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: errMsg.includes("quota")
            ? `⚠️ **Limit API Gemini Habis.**`
            : `Error: ${errMsg}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 10.5 Render UI Chatbot
  return (
    <>
      {/* 10.5.1 Tombol Mengambang (Floating Button) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-[90] p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center ${isOpen ? "bg-slate-800 text-white rotate-90 scale-90" : "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-indigo-500/50"}`}
      >
        {isOpen ? <X size={24} /> : <Bot size={24} />}
      </button>

      {/* 10.5.2 Jendela Chatbot */}
      {isOpen && (
        <div
          className={`fixed z-[80] bottom-24 right-6 sm:right-10 flex flex-col shadow-2xl border transition-all duration-300 origin-bottom-right animate-in zoom-in-75 ${isExpanded ? "w-[90vw] sm:w-[80vw] md:w-[60vw] h-[85vh] rounded-3xl" : "w-[90vw] sm:w-[400px] h-[550px] max-h-[80vh] rounded-[2rem]"} ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}
        >
          {/* Header Chatbot */}
          <div
            className={`p-4 border-b flex justify-between items-center rounded-t-[2rem] sm:rounded-t-3xl ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-indigo-600 text-white"}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${isDarkMode ? "bg-slate-700 text-indigo-400" : "bg-white/20 text-white"}`}
              >
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-bold leading-tight">LifeOS AI</h3>
                <p className="text-[10px] opacity-80 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>{" "}
                  Context-Aware
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? "hover:bg-slate-700" : "hover:bg-white/20"}`}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>

          {/* 10.5.3 Area Daftar Pesan */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === "user" ? (isDarkMode ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-700") : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"}`}
                >
                  {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl p-4 shadow-sm text-sm overflow-x-auto ${msg.role === "user" ? (isDarkMode ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-indigo-600 text-white rounded-tr-sm") : isDarkMode ? "bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm" : "bg-white text-slate-700 border border-slate-100 rounded-tl-sm"}`}
                >
                  {msg.role === "user" ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <MarkdownRenderer
                      content={msg.content}
                      isDarkMode={isDarkMode}
                    />
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-sm">
                  <Bot size={16} />
                </div>
                <div
                  className={`rounded-2xl rounded-tl-sm p-4 shadow-sm flex flex-col gap-2 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
                >
                  <div className="flex gap-1.5 items-center px-2 py-1">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                    <div
                      className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Menganalisis data...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 10.5.4 Area Input Form */}
          <div
            className={`p-4 border-t ${isDarkMode ? "bg-slate-800 border-slate-700 rounded-b-[2rem]" : "bg-white border-slate-100 rounded-b-[2rem]"}`}
          >
            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
              <textarea
                rows={1}
                placeholder="Tanya sesuatu ke AI..."
                className={`flex-1 resize-none max-h-32 p-3 px-4 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm custom-scrollbar ${isDarkMode ? "bg-slate-900 border-slate-600 text-white placeholder-slate-500" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`p-3 rounded-2xl flex-shrink-0 transition-colors ${!input.trim() || isLoading ? "bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg"}`}
              >
                <ArrowRight
                  size={20}
                  className={
                    !input.trim() || isLoading
                      ? ""
                      : "translate-x-[-1px] translate-y-[1px]"
                  }
                />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// ==================================================================================
// 11. DASHBOARD (MAIN LAYOUT)
// ==================================================================================

// PERUBAHAN: Menambahkan appSettings dan setAppSettings di props
