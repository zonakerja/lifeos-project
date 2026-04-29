/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps */
import React from "react";
import { CalendarIcon, CheckCircle, Plus, Trash2, ChevronLeft, ChevronRight, CheckSquare, Clock, Edit3, X, AlertTriangle, MapPin, Briefcase, Target, Folder, FileText, Shield, Eye, Tag, Menu, Upload, ChevronDown, RotateCcw, History, Loader2, ArrowRight, Home, User, GripVertical, Layers, FolderOpen, BookOpen, Box, Grid, Filter, Search, MoreVertical, Globe, Info, Save, ExternalLink, List, Server, Square, FileBox, HardDrive, FileX, ArchiveRestore, Printer, BoxSelect, Grid3X3, Truck, ArrowRightLeft, ArrowLeft, PlusSquare, Scissors, Copy, ArrowDownToLine, ScanLine, Camera, UploadCloud, ArrowRightCircle, Handshake, Scan, CameraIcon, Send } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { generateId, useUserAwareState, uploadFileToBackend } from "../../lib/lifeosUtils";
import { ConfirmationModal, AlertModal, PaginationControl } from "../../components/shared";
import { SearchableDropdown } from "../../components/forms/SearchableDropdown";

export const ArchiveProcessModal = ({
  isOpen,
  onClose,
  resource,
  onSave,
  isDarkMode,
  classifications = [],
  jraList = [],
  physRefs = [],
}) => {
  // 7.2.1. Inisialisasi State Form dan Error
  const [form, setForm] = React.useState({
    archivalStatus: "digital",
    classificationId: "",
    jraId: "",
    retentionActiveDate: "",
    retentionInactiveDate: "",
    status: "active",
    physLocationId: "",
    physRackId: "",
    physBoxId: "",
    physFolderId: "",
    digitalApp: "",
    digitalLink: "",
    notes: "",
    archiveRegId: "",
    isVital: false,
    isAutoDispose: false, // FITUR: Otomatisasi Eksekusi Digital
  });

  const [qrData, setQrData] = React.useState(null);
  const [errors, setErrors] = React.useState({});

  // 7.2.2. Filter Cascading Options untuk Pemilihan Lokasi Fisik
  const rackOptions = physRefs.filter(
    (r) => r.type === "rack" && r.parentId === form.physLocationId,
  );
  const parentForBox = form.physRackId || form.physLocationId;
  const boxOptions = physRefs.filter(
    (r) => r.type === "box" && r.parentId === parentForBox,
  );
  const parentForFolder =
    form.physBoxId || form.physRackId || form.physLocationId;
  const folderOptions = physRefs.filter(
    (r) => r.type === "folder" && r.parentId === parentForFolder,
  );

  // 7.2.3. Efek Samping (UseEffect): Memuat Data Saat Modal Terbuka
  React.useEffect(() => {
    if (isOpen && resource) {
      let regId = resource.archiveRegId;

      if (!regId) {
        const docYear = resource.date
          ? new Date(resource.date).getFullYear()
          : new Date().getFullYear();
        const chars =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let randomSuffix = "";
        for (let i = 0; i < 6; i++)
          randomSuffix += chars.charAt(
            Math.floor(Math.random() * chars.length),
          );
        regId = `ARC-${docYear}-${randomSuffix}`;
      }

      setForm((prev) => ({
        ...prev,
        archivalStatus: resource.archivalStatus || "digital",
        classificationId: resource.classificationId || "",
        jraId: resource.jraId || "",
        retentionActiveDate: resource.retentionActiveDate || "",
        retentionInactiveDate: resource.retentionInactiveDate || "",
        status: resource.status || "active",
        physLocationId: resource.physLocationId || "",
        physRackId: resource.physRackId || "",
        physBoxId: resource.physBoxId || "",
        physFolderId: resource.physFolderId || "",
        digitalApp: resource.digitalApp || "",
        digitalLink: resource.digitalLink || "",
        notes: resource.notes || "",
        isVital: resource.isVital || false,
        isAutoDispose: resource.isAutoDispose || false, // IMPLEMENTASI: Memuat data auto-dispose
        archiveRegId: regId,
      }));
      setErrors({});
    }
  }, [isOpen, resource]);

  // 7.2.4. Efek Samping (UseEffect): Kalkulasi Tanggal Retensi Otomatis
  React.useEffect(() => {
    if (!form.isVital && form.jraId && resource?.date) {
      const jra = jraList.find((j) => j.id === form.jraId);
      if (jra) {
        const docDate = new Date(resource.date);
        const activeExp = new Date(docDate);
        activeExp.setFullYear(
          activeExp.getFullYear() + (parseInt(jra.retensiAktif) || 0),
        );
        const inactiveExp = new Date(activeExp);
        inactiveExp.setFullYear(
          inactiveExp.getFullYear() + (parseInt(jra.retensiInaktif) || 0),
        );

        setForm((prev) => ({
          ...prev,
          retentionActiveDate: activeExp.toISOString().split("T")[0],
          retentionInactiveDate: inactiveExp.toISOString().split("T")[0],
        }));
      }
    }
  }, [form.jraId, resource?.date, jraList, form.isVital]);

  // 7.2.5. Efek Samping (UseEffect): Pembaruan Status Aktif/Inaktif
  React.useEffect(() => {
    if (form.retentionActiveDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activeDate = new Date(form.retentionActiveDate);
      const newStatus = today <= activeDate ? "active" : "inactive";
      if (newStatus !== form.status)
        setForm((prev) => ({ ...prev, status: newStatus }));
    }
  }, [form.retentionActiveDate, form.status]);

  // 7.2.6. Efek Samping (UseEffect): Update Data Preview Barcode/QR
  React.useEffect(() => {
    const cls = classifications.find((c) => c.id === form.classificationId);
    const code = cls
      ? `${cls.kodePokok}.${cls.kodeSub}.${cls.kodeItem}`
      : "---";

    setQrData({
      id: form.archiveRegId,
      title: resource?.title || resource?.name || "Tanpa Judul",
      code: code,
      isVital: form.isVital,
    });
  }, [form, classifications, resource]);

  // 7.2.7. Fungsi Handler: Proses Submit dan Validasi Form
  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!form.classificationId) newErrors.classificationId = "Wajib dipilih";
    if (form.isVital) {
      if (!form.retentionActiveDate)
        newErrors.retentionActiveDate = "Wajib diisi";
      if (!form.retentionInactiveDate)
        newErrors.retentionInactiveDate = "Wajib diisi";
    } else {
      if (!form.jraId) newErrors.jraId = "Wajib dipilih";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const finalData = form.isVital ? { ...form, jraId: "" } : form;
    onSave({ ...resource, ...finalData });
    onClose();
  };

  const handlePrint = () => {
    const printContent = document.getElementById("print-label-area").innerHTML;
    const win = window.open("", "", "height=500,width=500");
    win.document.write(
      '<html><head><title>Print Label</title></head><body style="margin:0; display:flex; justify-content:center; align-items:center; height:100vh;">',
    );
    win.document.write(printContent);
    win.document.write("</body></html>");
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  if (!isOpen || !resource) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in overflow-y-auto">
      <div
        className={`w-full max-w-5xl h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-100"}`}
      >
        {/* Kolom Kiri: Formulir Pengisian Data Arsip */}
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3
                className={`text-2xl font-extrabold ${isDarkMode ? "text-white" : "text-slate-900"}`}
              >
                Proses Arsip
              </h3>
              <p className="text-xs text-slate-500">
                ID Registrasi: {form.archiveRegId}
              </p>
            </div>
            <button onClick={onClose}>
              <X size={24} className="text-slate-400 hover:text-red-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pemilihan Tipe Pengelolaan */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: "physical", label: "Fisik (Hardcopy)", icon: FileBox },
                { id: "digital", label: "Digital (Softcopy)", icon: HardDrive },
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setForm({ ...form, archivalStatus: type.id })}
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${form.archivalStatus === type.id ? "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300" : isDarkMode ? "bg-slate-800 border-slate-600 text-slate-400" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                >
                  <type.icon size={20} />
                  <span className="text-xs font-bold">{type.label}</span>
                </button>
              ))}
            </div>

            {/* Form Klasifikasi dan Retensi Arsip */}
            <div
              className={`p-6 rounded-3xl border space-y-5 ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}
            >
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">
                  Klasifikasi Arsip <span className="text-red-500">*</span>
                </label>
                <div
                  className={`${errors.classificationId ? "ring-2 ring-red-500 rounded-lg" : ""}`}
                >
                  <SearchableDropdown
                    placeholder="Cari Kode / Nama Klasifikasi..."
                    isDarkMode={isDarkMode}
                    value={form.classificationId}
                    options={classifications.map((c) => ({
                      label: `${c.kodePokok}.${c.kodeSub}.${c.kodeItem} - ${c.namaItem}`,
                      value: c.id,
                    }))}
                    onChange={(val) => {
                      setForm({ ...form, classificationId: val });
                      setErrors({ ...errors, classificationId: null });
                    }}
                  />
                </div>
                {errors.classificationId && (
                  <p className="text-[10px] text-red-500 mt-1 italic">
                    {errors.classificationId}
                  </p>
                )}
              </div>

              <div
                className={`p-3 rounded-xl flex items-center justify-between border ${form.isVital ? "bg-red-50 border-red-200" : isDarkMode ? "bg-slate-700 border-slate-600" : "bg-white border-slate-200"}`}
              >
                <label
                  htmlFor="isVitalCheck"
                  className={`text-sm font-bold flex items-center gap-2 cursor-pointer ${form.isVital ? "text-red-700" : isDarkMode ? "text-white" : "text-slate-800"}`}
                >
                  <Shield
                    size={16}
                    className={form.isVital ? "text-red-600" : "text-slate-400"}
                  />{" "}
                  Tandai sebagai Arsip Vital
                </label>
                <input
                  id="isVitalCheck"
                  type="checkbox"
                  className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  checked={form.isVital}
                  onChange={(e) =>
                    setForm({ ...form, isVital: e.target.checked })
                  }
                />
              </div>

              {!form.isVital && (
                <div className="animate-in fade-in">
                  <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">
                    Jadwal Retensi (JRA) <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`${errors.jraId ? "ring-2 ring-red-500 rounded-lg" : ""}`}
                  >
                    <SearchableDropdown
                      placeholder="Cari Jenis Arsip di JRA..."
                      isDarkMode={isDarkMode}
                      value={form.jraId}
                      options={jraList.map((j) => ({
                        label: `${j.jenisArsip} (Aktif: ${j.retensiAktif} Thn / Inaktif: ${j.retensiInaktif} Thn)`,
                        value: j.id,
                      }))}
                      onChange={(val) => {
                        setForm({ ...form, jraId: val });
                        setErrors({ ...errors, jraId: null });
                      }}
                    />
                  </div>
                  {errors.jraId && (
                    <p className="text-[10px] text-red-500 mt-1 italic">
                      {errors.jraId}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">
                    Exp. Aktif {form.isVital ? "(Manual *)" : "(Auto)"}
                  </label>
                  <input
                    type="date"
                    disabled={!form.isVital}
                    className={`w-full px-4 py-3 rounded-xl border mt-1 text-xs font-bold ${!form.isVital && "opacity-60"} ${errors.retentionActiveDate ? "border-red-500 ring-1 ring-red-500" : isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-700"}`}
                    value={form.retentionActiveDate}
                    onChange={(e) => {
                      form.isVital &&
                        setForm({
                          ...form,
                          retentionActiveDate: e.target.value,
                        });
                      setErrors({ ...errors, retentionActiveDate: null });
                    }}
                  />
                  {errors.retentionActiveDate && (
                    <p className="text-[10px] text-red-500 mt-1 italic">
                      {errors.retentionActiveDate}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">
                    Exp. Inaktif {form.isVital ? "(Manual *)" : "(Auto)"}
                  </label>
                  <input
                    type="date"
                    disabled={!form.isVital}
                    className={`w-full px-4 py-3 rounded-xl border mt-1 text-xs font-bold ${!form.isVital && "opacity-60"} ${errors.retentionInactiveDate ? "border-red-500 ring-1 ring-red-500" : isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-700"}`}
                    value={form.retentionInactiveDate}
                    onChange={(e) => {
                      form.isVital &&
                        setForm({
                          ...form,
                          retentionInactiveDate: e.target.value,
                        });
                      setErrors({ ...errors, retentionInactiveDate: null });
                    }}
                  />
                  {errors.retentionInactiveDate && (
                    <p className="text-[10px] text-red-500 mt-1 italic">
                      {errors.retentionInactiveDate}
                    </p>
                  )}
                </div>
              </div>

              <div
                className={`p-3 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-2 ${form.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}
              >
                {form.status === "active" ? (
                  <CheckCircle size={14} />
                ) : (
                  <Clock size={14} />
                )}
                Status Saat Ini:{" "}
                {form.status === "active"
                  ? "AKTIF (Central File)"
                  : "INAKTIF (Record Center)"}
              </div>
            </div>

            {/* Form Lokasi Digital / Sistem + Fitur Auto Dispose */}
            {form.archivalStatus === "digital" && (
              <div
                className={`p-6 rounded-3xl border space-y-4 animate-in slide-in-from-bottom-2 ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200 shadow-sm"}`}
              >
                <h4 className="text-xs font-bold uppercase text-emerald-500 flex items-center gap-2">
                  <HardDrive size={14} /> Lokasi Digital / Sistem
                </h4>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">
                    Aplikasi / Sistem Pembuat
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-2.5 rounded-xl border mt-1 text-xs ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
                    value={form.digitalApp}
                    onChange={(e) =>
                      setForm({ ...form, digitalApp: e.target.value })
                    }
                    placeholder="Cth: SRIKANDI, Google Drive, SAP..."
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">
                    Link Dokumen (Opsional)
                  </label>
                  <input
                    type="url"
                    className={`w-full px-4 py-2.5 rounded-xl border mt-1 text-xs ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
                    value={form.digitalLink}
                    onChange={(e) =>
                      setForm({ ...form, digitalLink: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>

                {/* FITUR: Opsi Otomatisasi Pemusnahan / Penyerahan Arsip Digital */}
                <div
                  className={`p-4 mt-2 rounded-xl border flex items-start gap-3 transition-colors ${form.isAutoDispose ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800" : isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}
                >
                  <div className="mt-0.5">
                    <input
                      type="checkbox"
                      id="autoDisposeCheck"
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      checked={form.isAutoDispose}
                      onChange={(e) =>
                        setForm({ ...form, isAutoDispose: e.target.checked })
                      }
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="autoDisposeCheck"
                      className={`text-xs font-bold cursor-pointer block ${isDarkMode ? "text-white" : "text-slate-800"}`}
                    >
                      Eksekusi Disposisi Otomatis (Auto-Dispose)
                    </label>
                    <p
                      className={`text-[10px] mt-1 leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Jika dicentang, sistem akan mengeksekusi arsip ini secara
                      otomatis menjadi Statis atau Musnah dan membuat Berita
                      Acara seketika setelah tanggal inaktif berakhir. Sangat
                      cocok untuk arsip terintegrasi ANRI/SRIKANDI.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form Lokasi Penyimpanan Fisik */}
            {(form.archivalStatus === "physical" ||
              form.archivalStatus === "digital") && (
              <div
                className={`p-6 rounded-3xl border space-y-4 animate-in slide-in-from-bottom-2 ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200 shadow-sm"}`}
              >
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase text-indigo-500 flex items-center gap-2">
                    <MapPin size={14} /> Lokasi Simpan Fisik
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        physLocationId: "",
                        physRackId: "",
                        physBoxId: "",
                        physFolderId: "",
                      })
                    }
                    className="text-[10px] text-red-500 hover:underline"
                  >
                    Reset Lokasi
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">
                      Gedung / Ruang
                    </label>
                    <select
                      className={`w-full px-3 py-2.5 rounded-xl border mt-1 text-xs font-bold ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
                      value={form.physLocationId}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          physLocationId: e.target.value,
                          physRackId: "",
                          physBoxId: "",
                          physFolderId: "",
                        })
                      }
                    >
                      <option value="">-- Tanpa Lokasi --</option>
                      {physRefs
                        .filter((r) => r.type === "location")
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">
                      Rak / Lemari
                    </label>
                    <select
                      className={`w-full px-3 py-2.5 rounded-xl border mt-1 text-xs font-bold ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
                      value={form.physRackId}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          physRackId: e.target.value,
                          physBoxId: "",
                          physFolderId: "",
                        })
                      }
                      disabled={!form.physLocationId}
                    >
                      <option value="">-- Lepas / Tanpa Rak --</option>
                      {rackOptions.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">
                      Boks Arsip
                    </label>
                    <select
                      className={`w-full px-3 py-2.5 rounded-xl border mt-1 text-xs font-bold ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
                      value={form.physBoxId}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          physBoxId: e.target.value,
                          physFolderId: "",
                        })
                      }
                      disabled={!form.physLocationId}
                    >
                      <option value="">-- Lepas / Tanpa Box --</option>
                      {boxOptions.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">
                      Folder
                    </label>
                    <select
                      className={`w-full px-3 py-2.5 rounded-xl border mt-1 text-xs font-bold ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
                      value={form.physFolderId}
                      onChange={(e) =>
                        setForm({ ...form, physFolderId: e.target.value })
                      }
                      disabled={!form.physLocationId}
                    >
                      <option value="">-- Lepas / Tanpa Folder --</option>
                      {folderOptions.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">
                    Catatan Kondisi / Kearsipan
                  </label>
                  <textarea
                    rows="2"
                    className={`w-full px-4 py-3 rounded-xl border mt-1 text-xs ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    placeholder="Cth: Tumpukan di atas meja..."
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
            >
              <Save size={18} /> Simpan & Terapkan
            </button>
          </form>
        </div>

        {/* Kolom Kanan: Tampilan Label dan Fungsi Cetak */}
        <div
          className={`w-full md:w-80 p-8 border-l flex flex-col items-center justify-center ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-100"}`}
        >
          <h4
            className={`text-sm font-bold uppercase tracking-wider mb-6 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
          >
            Preview Label Cetak
          </h4>

          <div
            id="print-label-area"
            style={{
              backgroundColor: "white",
              padding: "10px",
              width: "100%",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                border: "3px solid black",
                padding: "10px",
                display: "flex",
                flexDirection: "row",
                gap: "15px",
                alignItems: "center",
                width: "320px",
                boxSizing: "border-box",
                backgroundColor: "white",
                color: "black",
              }}
            >
              <div style={{ flexShrink: 0 }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData?.id}`}
                  alt="QR"
                  style={{ width: "90px", height: "90px", display: "block" }}
                />
                <p
                  style={{
                    fontSize: "10px",
                    fontFamily: "monospace",
                    fontWeight: "bold",
                    marginTop: "5px",
                    textAlign: "center",
                    margin: "5px 0 0 0",
                  }}
                >
                  {qrData?.id}
                </p>
              </div>

              <div
                style={{
                  flex: 1,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    borderBottom: "2px solid black",
                    paddingBottom: "4px",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "8px",
                      textTransform: "uppercase",
                      color: "#666",
                      display: "block",
                    }}
                  >
                    Klasifikasi
                  </span>
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: "900",
                      fontFamily: "monospace",
                      display: "block",
                      lineHeight: "1",
                    }}
                  >
                    {qrData?.code}
                  </span>
                </div>
                {qrData?.isVital && (
                  <div
                    style={{
                      border: "2px solid red",
                      color: "red",
                      padding: "2px",
                      textAlign: "center",
                      marginBottom: "4px",
                      fontWeight: "900",
                      fontSize: "10px",
                      textTransform: "uppercase",
                    }}
                  >
                    ARSIP VITAL
                  </div>
                )}
                <div>
                  <span
                    style={{
                      fontSize: "8px",
                      textTransform: "uppercase",
                      color: "#666",
                      display: "block",
                    }}
                  >
                    Uraian
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "bold",
                      lineHeight: "1.2",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      maxHeight: "40px",
                    }}
                  >
                    {qrData?.title}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="mt-8 px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Printer size={16} /> Cetak Sticker
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================================================================================
// 7.3. KOMPONEN MODAL DETAIL ARSIP
// ==================================================================================
export const ArchiveDetailModal = ({
  isOpen,
  onClose,
  resource,
  classifications,
  jraList,
  physRefs,
  borrowings = [],
  isDarkMode,
  currentUser,
  onRestore,
}) => {
  if (!isOpen || !resource) return null;

  // 7.3.1. Penyiapan Data Relasional (Klasifikasi, JRA, Lokasi Fisik)
  const cls = classifications.find((c) => c.id === resource.classificationId);
  const jra = jraList.find((j) => j.id === resource.jraId);
  const loc = physRefs.find((r) => r.id === resource.physLocationId);
  const rack = physRefs.find((r) => r.id === resource.physRackId);
  const box = physRefs.find((r) => r.id === resource.physBoxId);
  const folder = physRefs.find((r) => r.id === resource.physFolderId);

  // 7.3.2. Normalisasi Status
  let currentStatus = resource.status || "active";
  if (currentStatus !== "destroyed" && currentStatus !== "static") {
    // Abaikan status default bawaan jika ada tanggal retensi, lakukan kalkulasi ulang
    if (resource.retentionActiveDate && resource.retentionInactiveDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activeDate = new Date(resource.retentionActiveDate);
      const inactiveDate = new Date(resource.retentionInactiveDate);

      if (today > inactiveDate)
        currentStatus = resource.isVital ? "inactive" : "expired";
      else if (today > activeDate) currentStatus = "inactive";
      else currentStatus = "active";
    } else {
      currentStatus = resource.dynamicStatus || "active";
    }
  }
  const isDestroyed = currentStatus === "destroyed";
  const isStatic = currentStatus === "static";
  const isSuperAdmin = currentUser?.role === "super_admin";
  // --- TAMBAHAN: Cek Status Peminjaman ---
  const activeBorrowing = (borrowings || []).find(
    (b) =>
      b.status === "active" && b.items?.some((item) => item.id === resource.id),
  );

  // 7.3.3. Helper: Format Periode & Tahun
  const docYear = resource.date ? new Date(resource.date).getFullYear() : "...";
  const activeYear = resource.retentionActiveDate
    ? new Date(resource.retentionActiveDate).getFullYear()
    : "...";
  const inactiveYear = resource.retentionInactiveDate
    ? new Date(resource.retentionInactiveDate).getFullYear()
    : "...";

  // 7.3.4. Helper: Penentuan Warna Label Status
  const getStatusColor = (s) => {
    if (s === "active")
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (s === "inactive" || s === "expired")
      return "bg-orange-100 text-orange-700 border-orange-200";
    if (s === "static") return "bg-blue-100 text-blue-700 border-blue-200";
    if (s === "destroyed") return "bg-red-100 text-red-700 border-red-200";
    return "bg-slate-100 text-slate-700";
  };

  // 7.3.5. Helper: Penentuan Teks Label Status
  const getStatusLabel = (s) => {
    if (s === "active") return "AKTIF";
    if (s === "inactive" || s === "expired") return "INAKTIF";
    if (s === "static") return "STATIS";
    if (s === "destroyed") return "MUSNAH";
    return "UNKNOWN";
  };

  // FIX Z-INDEX: Diubah dari z-[80] menjadi z-[120] agar dipanggil di atas Info Container Modal
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
      <div
        className={`w-full max-w-2xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-100"}`}
      >
        {/* 7.3.6. Header Modal Detail */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3
              className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
            >
              Detail Arsip
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              {resource.archiveRegId}
            </p>
          </div>
          <button onClick={onClose}>
            <X size={24} className="text-slate-400 hover:text-red-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
          {/* 7.3.7. Banner Indikator Status Utama */}
          <div
            className={`p-4 rounded-xl flex items-center justify-between ${isDestroyed ? "bg-red-50 text-red-700 border border-red-100" : isStatic ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"}`}
          >
            <div className="flex items-center gap-3">
              {isDestroyed ? (
                <FileX size={24} />
              ) : isStatic ? (
                <Truck size={24} />
              ) : (
                <CheckCircle size={24} />
              )}
              <div>
                <h4 className="font-bold text-sm uppercase">
                  {isDestroyed
                    ? "ARSIP TELAH DIMUSNAHKAN"
                    : isStatic
                      ? "DISERAHKAN KE ANRI (STATIS)"
                      : "ARSIP TERSIMPAN"}
                </h4>
                <p className="text-xs opacity-80">
                  {resource.dispositionData?.executedAt
                    ? `Dieksekusi pada: ${new Date(resource.dispositionData.executedAt).toLocaleDateString("id-ID", { dateStyle: "full" })}`
                    : "Arsip dikelola dengan baik."}
                </p>
              </div>
            </div>

            {/* Kumpulan Tombol Aksi Banner */}
            <div className="flex items-center gap-2">
              {/* Tombol Preview File (Hanya muncul jika ada URL/File) */}
              {resource.url && (
                <button
                  onClick={() => window.open(resource.url, "_blank")}
                  className="px-4 py-2 bg-white/50 hover:bg-white text-xs font-bold rounded-lg transition-colors border border-current shadow-sm flex items-center gap-2"
                >
                  <Eye size={14} /> Preview File
                </button>
              )}

              {/* Tombol Restore Khusus Super Admin */}
              {(isDestroyed || isStatic) && isSuperAdmin && (
                <button
                  onClick={() => {
                    onRestore(resource);
                    onClose();
                  }}
                  className="px-4 py-2 bg-white/50 hover:bg-white text-xs font-bold rounded-lg transition-colors border border-current shadow-sm flex items-center gap-2"
                >
                  <RotateCcw size={14} /> Restore Data
                </button>
              )}
            </div>
          </div>

          {/* --- TAMBAHAN: BANNER INFORMASI PEMINJAMAN --- */}
          {activeBorrowing && (
            <div
              className={`p-4 rounded-xl flex items-start gap-4 border mb-6 ${isDarkMode ? "bg-amber-900/20 border-amber-800/50 text-amber-100" : "bg-amber-50 border-amber-200 text-amber-900"}`}
            >
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400 flex items-center justify-center shrink-0">
                {/* Pastikan icon Handshake sudah di-import dari lucide-react */}
                <Handshake size={20} />
              </div>
              <div className="w-full">
                <h4 className="font-bold text-sm text-amber-700 dark:text-amber-400 mb-2">
                  Arsip Sedang Dipinjam
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                  <p>
                    <span className="font-semibold opacity-70 block mb-0.5">
                      Peminjam:
                    </span>{" "}
                    {activeBorrowing.borrowerName}
                  </p>
                  <p>
                    <span className="font-semibold opacity-70 block mb-0.5">
                      Unit/Instansi:
                    </span>{" "}
                    {activeBorrowing.unit || "-"}
                  </p>
                  <p>
                    <span className="font-semibold opacity-70 block mb-0.5">
                      Tgl Pinjam:
                    </span>{" "}
                    {new Date(activeBorrowing.date).toLocaleDateString("id-ID")}
                  </p>
                  <p>
                    <span className="font-semibold opacity-70 block mb-0.5">
                      Target Kembali:
                    </span>{" "}
                    {new Date(activeBorrowing.returnDate).toLocaleDateString(
                      "id-ID",
                    )}
                  </p>
                  <div className="col-span-1 md:col-span-2 mt-1 pt-2 border-t border-amber-200/50 dark:border-amber-800/50">
                    <p>
                      <span className="font-semibold opacity-70 block mb-0.5">
                        Keperluan:
                      </span>{" "}
                      {activeBorrowing.purpose || "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 7.3.8. Informasi Data Utama Arsip */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">
                Nomor Dokumen
              </p>
              <p
                className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-slate-800"}`}
              >
                {resource.number || "-"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">
                Tanggal Dokumen
              </p>
              <p
                className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-slate-800"}`}
              >
                {resource.date
                  ? new Date(resource.date).toLocaleDateString()
                  : "-"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-bold uppercase text-slate-400">
                Judul / Nama Berkas
              </p>
              <p
                className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}
              >
                {resource.title || resource.name}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-bold uppercase text-slate-400">
                Deskripsi
              </p>
              <p
                className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
              >
                {resource.description || resource.content || "-"}
              </p>
            </div>

            {/* 7.3.9. Kumpulan Tag / Label Kategori */}
            <div className="col-span-2">
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">
                Label & Kategori
              </p>
              <div className="flex flex-wrap gap-2">
                {/* Status Terakhir */}
                <span
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${getStatusColor(currentStatus)}`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-current"></div>{" "}
                  {getStatusLabel(currentStatus)}
                </span>

                {/* Jenis Retensi */}
                <span
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${jra?.keterangan === "Permanen" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}
                >
                  <History size={10} />{" "}
                  {jra?.keterangan === "Permanen" ? "PERMANEN" : "NON PERMANEN"}
                </span>

                {/* Jenis Arsip (Fisik/Digital) */}
                <span
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${resource.archivalStatus === "physical" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-purple-50 text-purple-700 border-purple-200"}`}
                >
                  {resource.archivalStatus === "physical" ? (
                    <FileBox size={10} />
                  ) : (
                    <HardDrive size={10} />
                  )}{" "}
                  {resource.archivalStatus === "physical" ? "FISIK" : "DIGITAL"}
                </span>

                {/* Vital Indicator (HANYA MUNCUL JIKA VITAL) */}
                {resource.isVital === true && (
                  <span className="px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 bg-red-50 text-red-700 border-red-200">
                    <Shield size={10} /> VITAL
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-700"></div>

          {/* 7.3.10. Informasi Metadata Retensi & Klasifikasi */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">
                Kode & Jenis Arsip
              </p>
              <p className={`text-sm font-mono font-bold text-indigo-500`}>
                {cls
                  ? `${cls.kodePokok}.${cls.kodeSub}.${cls.kodeItem} - ${cls.namaItem}`
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">
                Jenis Retensi Arsip
              </p>
              <p
                className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-slate-800"}`}
              >
                {jra?.jenisArsip || "-"}
              </p>
            </div>

            {/* Tampilkan Periode Awal s/d Akhir */}
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">
                Periode Aktif
              </p>
              <p
                className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-slate-800"}`}
              >
                {docYear} s/d {activeYear} (
                {resource.retentionActiveDate
                  ? new Date(resource.retentionActiveDate).toLocaleDateString()
                  : "-"}
                )
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">
                Periode Inaktif
              </p>
              <p
                className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-slate-800"}`}
              >
                {activeYear} s/d {inactiveYear} (
                {resource.retentionInactiveDate
                  ? new Date(
                      resource.retentionInactiveDate,
                    ).toLocaleDateString()
                  : "-"}
                )
              </p>
            </div>
          </div>

          {/* 7.3.11. Data Lokasi Fisik (Jika Arsip Fisik) */}
          {resource.physLocationId && (
            <div
              className={`p-4 rounded-xl border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}
            >
              <h5 className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-2">
                <MapPin size={12} />{" "}
                {isDestroyed || isStatic
                  ? "Riwayat Lokasi Simpan"
                  : "Lokasi Simpan Fisik"}
              </h5>
              <div className="space-y-1 text-sm font-medium">
                <p className={isDarkMode ? "text-white" : "text-slate-800"}>
                  🏢 {loc ? `${loc.code} - ${loc.name}` : "-"}
                </p>
                <div className="pl-4 border-l-2 border-slate-300 dark:border-slate-600 space-y-1">
                  <p
                    className={isDarkMode ? "text-slate-300" : "text-slate-600"}
                  >
                    🗄️ {rack ? `${rack.code} - ${rack.name}` : "-"}
                  </p>
                  <p
                    className={isDarkMode ? "text-slate-300" : "text-slate-600"}
                  >
                    📦 {box ? `${box.code} - ${box.name}` : "-"}
                  </p>
                  <p
                    className={isDarkMode ? "text-slate-300" : "text-slate-600"}
                  >
                    📂 {folder ? `${folder.code} - ${folder.name}` : "-"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 7.3.12. Data Lokasi Digital (Khusus Arsip Digital) */}
          {resource.archivalStatus === "digital" && (
            <div
              className={`p-4 rounded-xl border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}
            >
              <h5 className="text-xs font-bold uppercase text-slate-400 mb-3 flex items-center gap-2">
                <HardDrive size={12} /> Lokasi Arsip Digital
              </h5>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="col-span-2 md:col-span-1">
                  <p className="font-bold text-slate-500 mb-1">
                    Aplikasi / Sistem
                  </p>
                  <p
                    className={`font-medium ${isDarkMode ? "text-white" : "text-slate-800"}`}
                  >
                    {resource.digitalApp || "-"}
                  </p>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <p className="font-bold text-slate-500 mb-1">Link Dokumen</p>
                  {resource.digitalLink ? (
                    <a
                      href={resource.digitalLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-500 hover:underline flex items-center gap-1 font-bold"
                    >
                      <Globe size={12} /> Buka Tautan
                    </a>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 7.3.13. Catatan Umum Kearsipan */}
          {resource.notes && (
            <div
              className={`p-4 rounded-xl border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}
            >
              <h5 className="text-xs font-bold uppercase text-slate-400 mb-2">
                Catatan Kearsipan
              </h5>
              <p
                className={`text-sm italic ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
              >
                {resource.notes}
              </p>
            </div>
          )}

          {/* 7.3.14. Riwayat Data Penyusutan (Jika Dimusnahkan/Diserahkan) */}
          {(isDestroyed || isStatic) && resource.dispositionData && (
            <div
              className={`p-4 rounded-xl border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}
            >
              <h5 className="text-xs font-bold uppercase text-slate-400 mb-3 flex items-center gap-2">
                {isDestroyed ? <Trash2 size={12} /> : <Truck size={12} />}{" "}
                Detail {isDestroyed ? "Pemusnahan" : "Penyerahan"}
              </h5>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-bold text-slate-500">Dasar Pelaksanaan</p>
                  <p className={isDarkMode ? "text-white" : "text-slate-800"}>
                    {resource.dispositionData.legalNumber}
                  </p>
                </div>
                <div>
                  <p className="font-bold text-slate-500">Tanggal Eksekusi</p>
                  <p className={isDarkMode ? "text-white" : "text-slate-800"}>
                    {resource.dispositionData.date}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="font-bold text-slate-500">
                    Keterangan / Berita Acara
                  </p>
                  <p className={isDarkMode ? "text-white" : "text-slate-800"}>
                    {resource.dispositionData.description}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="font-bold text-slate-500">Catatan User</p>
                  <p
                    className={isDarkMode ? "text-slate-300" : "text-slate-600"}
                  >
                    "{resource.dispositionData.userNote}"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================================================================================
// 7.4. KOMPONEN MODAL FORM DISPOSISI (PEMUSNAHAN / PENYERAHAN ANRI)
// ==================================================================================
export const DispositionFormModal = ({
  isOpen,
  onClose,
  type,
  count,
  onConfirm,
  isDarkMode,
  isManualMode = false,
  resources = [],
}) => {
  // 7.4.1. Definisi state awal form
  const initialFormState = {
    legalNumber: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    userNote: "",
    file: null,
  };

  const [form, setForm] = React.useState(initialFormState);

  // --- TAMBAHAN STATE PENCARIAN & ITEM TERPILIH ---
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedItems, setSelectedItems] = React.useState([]);
  const searchRef = React.useRef(null);

  // 7.4.2. Efek Samping: Reset form otomatis setiap modal dibuka
  React.useEffect(() => {
    if (isOpen) {
      setForm(initialFormState);
      setSelectedItems([]);
      setSearchQuery("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 7.4.3. Penyesuaian UI Berdasarkan Tipe Eksekusi
  const isDestroy = type === "destroy";
  const title = isDestroy
    ? "Pemusnahan Arsip"
    : "Penyerahan Arsip Statis (ANRI)";
  const colorClass = isDestroy ? "red" : "blue";
  const Icon = isDestroy ? Trash2 : Truck;

  // 7.4.4. Handler Pengiriman Form
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isManualMode && selectedItems.length === 0) {
      alert("Pilih minimal 1 arsip untuk diproses.");
      return;
    }
    onConfirm(form, selectedItems);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
      <div
        className={`w-full max-w-md rounded-[2rem] shadow-2xl p-6 border ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-100"}`}
      >
        {/* 7.4.5. Header Form */}
        <div
          className={`flex items-center gap-3 mb-6 pb-4 border-b ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}
        >
          <div
            className={`p-3 rounded-xl bg-${colorClass}-100 text-${colorClass}-600`}
          >
            <Icon size={24} />
          </div>
          <div>
            <h3
              className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-slate-900"}`}
            >
              {title}
            </h3>
            <p className="text-xs text-slate-500">
              Memproses {isManualMode ? selectedItems.length : count} berkas
              terpilih.
            </p>
          </div>
        </div>

        {/* --- TAMBAHAN: MODUL PENCARIAN (HANYA MUNCUL DI TRANSAKSI MANUAL) --- */}
        {isManualMode && (
          <div className="mb-6 space-y-3">
            <label className="text-[10px] font-bold uppercase text-slate-400">
              Scan / Cari Arsip (Hanya status Perlu Tindak Lanjut)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Search size={16} />
              </div>
              <input
                ref={searchRef}
                type="text"
                placeholder="Scan Barcode atau ketik ID/Judul..."
                className={`w-full pl-11 p-3.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-${colorClass}-500 ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const q = e.currentTarget.value.trim().toLowerCase();
                    if (!q) return;

                    const matched = resources.find((r) => {
                      const isValid =
                        r.archivalStatus &&
                        r.archivalStatus !== "pending" &&
                        r.archivalStatus !== "none";
                      const status = (r.status || "").toLowerCase();
                      const isNotDone =
                        status !== "destroyed" && status !== "static";

                      // Validasi Wajib Retensi Inaktif Selesai
                      let isPerluTindakLanjut = false;
                      if (r.retentionInactiveDate) {
                        const inactiveDate = new Date(r.retentionInactiveDate);
                        inactiveDate.setHours(0, 0, 0, 0);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (today >= inactiveDate) isPerluTindakLanjut = true;
                      }

                      const isMatchCode =
                        (r.archiveRegId || "").toLowerCase() === q ||
                        (r.id || "").toLowerCase() === q;
                      return (
                        isValid &&
                        isNotDone &&
                        isPerluTindakLanjut &&
                        isMatchCode
                      );
                    });

                    if (matched) {
                      if (!selectedItems.find((x) => x.id === matched.id))
                        setSelectedItems([...selectedItems, matched]);
                      setSearchQuery("");
                      setTimeout(() => searchRef.current?.focus(), 100);
                    } else {
                      alert(
                        `Gagal: Arsip "${q}" tidak ditemukan atau masa retensi inaktifnya belum selesai.`,
                      );
                      setSearchQuery("");
                      setTimeout(() => searchRef.current?.focus(), 100);
                    }
                  }
                }}
              />
            </div>

            {/* Dropdown Pencarian */}
            {searchQuery && (
              <div className="max-h-40 overflow-y-auto border rounded-xl shadow-lg p-2 space-y-1 z-50 absolute w-full max-w-md bg-white dark:bg-slate-900 dark:border-slate-700">
                {resources
                  .filter((r) => {
                    const isValid =
                      r.archivalStatus &&
                      r.archivalStatus !== "pending" &&
                      r.archivalStatus !== "none";
                    const status = (r.status || "").toLowerCase();
                    const isNotDone =
                      status !== "destroyed" && status !== "static";

                    let isPerluTindakLanjut = false;
                    if (r.retentionInactiveDate) {
                      const inactiveDate = new Date(r.retentionInactiveDate);
                      inactiveDate.setHours(0, 0, 0, 0);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (today >= inactiveDate) isPerluTindakLanjut = true;
                    }

                    const isMatchSearch =
                      (r.title || "")
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      (r.archiveRegId || "")
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase());
                    const isNotSelected = !selectedItems.some(
                      (i) => i.id === r.id,
                    );

                    return (
                      isValid &&
                      isNotDone &&
                      isPerluTindakLanjut &&
                      isMatchSearch &&
                      isNotSelected
                    );
                  })
                  .map((res) => (
                    <div
                      key={res.id}
                      onClick={() => {
                        if (!selectedItems.find((x) => x.id === res.id))
                          setSelectedItems([...selectedItems, res]);
                        setSearchQuery("");
                      }}
                      className="p-3 text-sm cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <span
                        className={`px-2 py-1 rounded text-[10px] font-bold bg-${colorClass}-100 text-${colorClass}-700`}
                      >
                        {res.archiveRegId}
                      </span>
                      <span className="font-medium line-clamp-1 dark:text-white">
                        {res.title}
                      </span>
                    </div>
                  ))}
              </div>
            )}

            {/* List Arsip Terpilih */}
            <div
              className={`p-2 rounded-xl min-h-[44px] flex flex-wrap gap-2 ${isDarkMode ? "bg-slate-800/50" : "bg-slate-50 border border-slate-200"}`}
            >
              {selectedItems.length === 0 ? (
                <span className="text-xs text-slate-400 italic w-full text-center py-1">
                  Belum ada arsip yang di-scan.
                </span>
              ) : (
                selectedItems.map((it) => (
                  <div
                    key={it.id}
                    className={`text-xs text-white pl-3 pr-1 py-1.5 rounded-lg flex items-center gap-2 bg-${colorClass}-500`}
                  >
                    <span className="font-medium max-w-[150px] truncate">
                      {it.title}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedItems(
                          selectedItems.filter((x) => x.id !== it.id),
                        )
                      }
                      className="p-1 hover:bg-black/20 rounded-md"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 7.4.6. Form Input Eksekusi */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400">
              Nomor Dasar Pelaksanaan (SK/BA)
            </label>
            <input
              type="text"
              required
              className={`w-full px-4 py-2.5 rounded-xl border mt-1 text-sm ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
              placeholder="Nomor SK / Berita Acara..."
              value={form.legalNumber}
              onChange={(e) =>
                setForm({ ...form, legalNumber: e.target.value })
              }
              autoFocus
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400">
              Tanggal Eksekusi
            </label>
            <input
              type="date"
              required
              className={`w-full px-4 py-2.5 rounded-xl border mt-1 text-sm ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400">
              Keterangan / Ringkasan
            </label>
            <textarea
              required
              rows="2"
              className={`w-full px-4 py-2.5 rounded-xl border mt-1 text-sm ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
              placeholder="Keterangan pelaksanaan..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400">
              Catatan Tambahan (Pesan User)
            </label>
            <textarea
              rows="2"
              className={`w-full px-4 py-2.5 rounded-xl border mt-1 text-sm ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
              placeholder="Catatan internal..."
              value={form.userNote}
              onChange={(e) => setForm({ ...form, userNote: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400">
              Upload Berkas (SK/BA) - Opsional
            </label>
            <input
              type="file"
              className={`w-full px-4 py-2 rounded-xl border mt-1 text-xs ${isDarkMode ? "bg-slate-800 border-slate-600 text-slate-300" : "bg-slate-50 border-slate-200"}`}
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                setForm({ ...form, file });
                try {
                  const uploaded = await uploadFileToBackend(file);
                  setForm((prev) => ({
                    ...prev,
                    file: null,
                    fileUrl: uploaded.url,
                    uploadId: uploaded.uploadId,
                    fileName: uploaded.name,
                  }));
                } catch (error) {
                  console.warn(
                    "Upload berkas disposisi ke backend gagal.",
                    error,
                  );
                }
              }}
            />
          </div>

          {/* 7.4.7. Tombol Aksi Batal/Eksekusi */}
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`flex-1 py-3 text-white font-bold rounded-xl text-sm shadow-lg transition-transform hover:scale-[1.02] bg-${colorClass}-600 hover:bg-${colorClass}-700`}
            >
              Eksekusi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================================================================================
// 7.5. KOMPONEN PREVIEW DAN CETAK QR CODE ARSIP
// ==================================================================================
export const ArchiveQRModal = ({ isOpen, onClose, data, classifications }) => {
  if (!isOpen || !data) return null;

  // 7.5.1. Penyiapan Variabel Data QR
  const cls = classifications.find((c) => c.id === data.classificationId);
  const code = cls ? `${cls.kodePokok}.${cls.kodeSub}.${cls.kodeItem}` : "---";
  const title = data.title || data.name || "Tanpa Judul";
  const qrValue = data.archiveRegId || data.id;

  // 7.5.2. Fungsi Handler Mencetak (Print Area Khusus)
  const handlePrint = () => {
    const printContent =
      document.getElementById("archive-print-area").innerHTML;
    const win = window.open("", "", "height=500,width=500");
    win.document.write("<html><head><title>Cetak Label Arsip</title>");
    // Inline style tambahan saat membuka jendela print
    win.document.write(
      "<style>body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; } </style>",
    );
    win.document.write("</head><body>");
    win.document.write(printContent);
    win.document.write("</body></html>");
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-red-500"
        >
          <X size={24} />
        </button>
        <h3 className="text-lg font-bold text-slate-900 mb-6 text-center">
          Preview Label Arsip
        </h3>

        {/* 7.5.3. Area Target Cetak (Inline Style agar format tetap rapi saat diprint) */}
        <div className="flex justify-center mb-8">
          <div
            id="archive-print-area"
            style={{
              backgroundColor: "white",
              padding: "10px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                border: "3px solid black",
                padding: "10px",
                display: "flex",
                flexDirection: "row",
                gap: "15px",
                alignItems: "center",
                width: "320px",
                boxSizing: "border-box",
                backgroundColor: "white",
                color: "black",
              }}
            >
              {/* Kolom QR Code */}
              <div style={{ flexShrink: 0 }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrValue}`}
                  alt="QR"
                  style={{ width: "90px", height: "90px", display: "block" }}
                />
                <p
                  style={{
                    fontSize: "10px",
                    fontFamily: "monospace",
                    fontWeight: "bold",
                    marginTop: "5px",
                    textAlign: "center",
                    margin: "5px 0 0 0",
                  }}
                >
                  {qrValue}
                </p>
              </div>

              {/* Kolom Informasi Detail */}
              <div
                style={{
                  flex: 1,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                {/* Klasifikasi Kode */}
                <div
                  style={{
                    borderBottom: "2px solid black",
                    paddingBottom: "4px",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "8px",
                      textTransform: "uppercase",
                      color: "#666",
                      display: "block",
                    }}
                  >
                    Klasifikasi
                  </span>
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: "900",
                      fontFamily: "monospace",
                      display: "block",
                      lineHeight: "1",
                    }}
                  >
                    {code}
                  </span>
                </div>

                {/* Tag Vital (Bersyarat) */}
                {data.isVital && (
                  <div
                    style={{
                      border: "2px solid red",
                      color: "red",
                      padding: "2px",
                      textAlign: "center",
                      marginBottom: "4px",
                      fontWeight: "900",
                      fontSize: "10px",
                      textTransform: "uppercase",
                    }}
                  >
                    ARSIP VITAL
                  </div>
                )}

                {/* Uraian Berkas */}
                <div>
                  <span
                    style={{
                      fontSize: "8px",
                      textTransform: "uppercase",
                      color: "#666",
                      display: "block",
                    }}
                  >
                    Uraian
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "bold",
                      lineHeight: "1.2",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      maxHeight: "40px",
                    }}
                  >
                    {title}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 7.5.4. Tombol Print */}
        <button
          onClick={handlePrint}
          className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
        >
          <Printer size={18} /> Cetak Label
        </button>
      </div>
    </div>
  );
};

// ==================================================================================
// KODE PART 12: ARCHIVE TRANSACTION MANAGER (TRANSAKSI & SIRKULASI)
// ==================================================================================
export const ArchiveTransactionManager = ({
  user,
  isDarkMode,
  resources,
  setResources,
  physRefs,
  setPhysRefs,
  classifications,
  jraList,
  borrowings,
  setBorrowings,
  dispositionLogs,
  setDispositionLogs,
  onOpenArchiveDetail,
  onPrintQR,
  isDetailOpen,
  moveLogs = [],
  setMoveLogs,
}) => {
  const [activeSubTab, setActiveSubTab] = React.useState("search");

  // --- TAMBAHAN STATE PENYUSUTAN MANUAL (BARU) ---
  const [manualDispMenu, setManualDispMenu] = React.useState(false);
  const [manualDispModal, setManualDispModal] = React.useState({
    show: false,
    type: "",
  });

  const handleManualDispositionConfirm = (formData, selectedItems) => {
    if (!selectedItems || selectedItems.length === 0) {
      setNotifyModal({
        show: true,
        type: "error",
        message: "Pilih minimal 1 arsip untuk diproses.",
      });
      return;
    }

    const newLog = {
      id: `BAP-${manualDispModal.type === "destroy" ? "MSN" : "SRH"}-${new Date().getTime()}`,
      executedAt: formData.date || new Date().toISOString(),
      type: manualDispModal.type,
      statusLabel:
        manualDispModal.type === "destroy"
          ? "DIMUSNAHKAN"
          : "DISERAHKAN KE ANRI",
      formData: formData,
      items: selectedItems.map((item) => ({
        id: item.id,
        title: item.title,
        archiveRegId: item.archiveRegId,
      })),
      user: user?.name || "Admin",
    };

    const newStatus =
      manualDispModal.type === "destroy" ? "destroyed" : "static";

    // Update status arsip
    setResources((prev) =>
      prev.map((r) =>
        selectedItems.find((s) => s.id === r.id)
          ? {
              ...r,
              status: newStatus,
              dynamicStatus: newStatus,
              dispositionData: {
                legalNumber: formData.legalNumber,
                date: formData.date,
                description: formData.description,
                userNote: formData.userNote,
              },
            }
          : r,
      ),
    );

    // Simpan Log BA
    if (setDispositionLogs) setDispositionLogs((prev) => [newLog, ...prev]);

    setManualDispModal({ show: false, type: "" });
    setNotifyModal({
      show: true,
      type: "success",
      message: `Berhasil memproses ${selectedItems.length} arsip untuk ${manualDispModal.type === "destroy" ? "Pemusnahan" : "Penyerahan"}.`,
    });
  };

  // States for Search
  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewContainer, setViewContainer] = React.useState(null);
  const [viewLocationRack, setViewLocationRack] = React.useState(null);
  const [printContainerQR, setPrintContainerQR] = React.useState(null);

  // TAMBAHAN: State untuk Modal Preview Cetak Info Wadah A4
  const [printContainerA4, setPrintContainerA4] = React.useState(null);

  // --- Referensi untuk Auto-Focus Search Bar ---
  const searchInputRef = React.useRef(null);

  // --- States for Camera Scanner ---
  const [showCameraModal, setShowCameraModal] = React.useState(false);
  const [isCameraActive, setIsCameraActive] = React.useState(false);
  const [cameraStatus, setCameraStatus] = React.useState("idle");
  const scanLockRef = React.useRef(false);

  // --- State Pemicu Bulk Move Modal (Menunggu Implementasi Selanjutnya) ---
  const [showBulkMoveTrigger, setShowBulkMoveTrigger] = React.useState(false);

  // --- TAMBAHAN: State untuk Modal Notifikasi Berhasil ---
  const [moveAlert, setMoveAlert] = React.useState({ show: false, msg: "" });

  // States for Borrowing
  const [showBorrowForm, setShowBorrowForm] = React.useState(false);
  const [printBAP, setPrintBAP] = React.useState(null);

  // --- State Form Peminjaman & Handler (Perbaikan Multi-Item) ---
  const [borrowForm, setBorrowForm] = React.useState({
    borrowerName: "",
    unit: "",
    purpose: "",
    expectedReturnDate: "",
    borrowDate: new Date().toISOString().split("T")[0],
    items: [], // KEMBALI KE MULTI-ITEM
  });
  const [borrowSearch, setBorrowSearch] = React.useState(""); // State pencarian arsip

  const handleBorrowSubmit = (e) => {
    e.preventDefault();
    if (borrowForm.items.length === 0) {
      setNotifyModal({
        show: true,
        type: "error",
        message: "Pilih minimal 1 arsip untuk dipinjam.",
      });
      return;
    }
    if (
      !borrowForm.borrowerName ||
      !borrowForm.expectedReturnDate ||
      !borrowForm.borrowDate
    ) {
      setNotifyModal({
        show: true,
        type: "error",
        message:
          "Mohon lengkapi semua field wajib (Peminjam, Tanggal Pinjam, Target Kembali).",
      });
      return;
    }

    const newBorrow = {
      id: `BAP-PINJAM-${new Date().getTime()}`,
      date: borrowForm.borrowDate,
      returnDate: borrowForm.expectedReturnDate,
      borrowerName: borrowForm.borrowerName,
      unit: borrowForm.unit,
      purpose: borrowForm.purpose,
      items: borrowForm.items,
      status: "active",
      pic: user?.name || "Admin",
    };

    setBorrowings((prev) => [newBorrow, ...prev]);
    setBorrowForm({
      borrowerName: "",
      unit: "",
      purpose: "",
      expectedReturnDate: "",
      borrowDate: new Date().toISOString().split("T")[0],
      items: [],
    });
    setBorrowSearch("");
    setShowBorrowForm(false);
    setNotifyModal({
      show: true,
      type: "success",
      message: "Sirkulasi peminjaman berhasil dicatat!",
    });
  };

  // --- State Baru untuk Modal Notifikasi & Konfirmasi Peminjaman ---
  const [notifyModal, setNotifyModal] = React.useState({
    show: false,
    type: "",
    message: "",
  }); // type: 'success' | 'error'
  const [confirmModal, setConfirmModal] = React.useState({
    show: false,
    action: null,
    title: "",
    message: "",
    targetId: null,
  });

  // --- TAMBAHAN: State Paginasi & Ref Peminjaman ---
  const borrowSearchRef = React.useRef(null);
  const [borrowPage, setBorrowPage] = React.useState(1);
  const [borrowsPerPage, setBorrowsPerPage] = React.useState(10);

  // --- 3. STATE UNTUK PEMINDAHAN
  const [moveStaging, setMoveStaging] = React.useState([]);
  const [moveSearch, setMoveSearch] = React.useState("");
  const [targetParentId, setTargetParentId] = React.useState("");
  const [showResetConfirm, setShowResetConfirm] = React.useState(false); // Untuk peringatan reset antrean

  // --- TAMBAHAN STATE PAGINASI LOG ---
  const [logPage, setLogPage] = React.useState(1);
  const [logsPerPage, setLogsPerPage] = React.useState(10);

  // --- TAMBAHAN STATE PAGINASI PENYUSUTAN ---
  const [dispositionPage, setDispositionPage] = React.useState(1);
  const [dispositionsPerPage, setDispositionsPerPage] = React.useState(10);

  // IMPLEMENTASI PERBAIKAN: Fokus kembali menyadari status isDetailOpen dari parent
  React.useEffect(() => {
    if (
      activeSubTab === "search" &&
      !viewContainer &&
      !viewLocationRack &&
      !printContainerQR &&
      !showCameraModal &&
      !isCameraActive &&
      !isDetailOpen
    ) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [
    activeSubTab,
    viewContainer,
    viewLocationRack,
    printContainerQR,
    showCameraModal,
    isCameraActive,
    isDetailOpen,
  ]);

  // --- FITUR 1: PENCARIAN GLOBAL ---
  const globalResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();

    const files = resources
      .filter(
        (r) =>
          r.archivalStatus &&
          r.archivalStatus !== "pending" &&
          r.archivalStatus !== "none" &&
          (r.title?.toLowerCase().includes(q) ||
            r.number?.toLowerCase().includes(q) ||
            r.archiveRegId?.toLowerCase().includes(q)),
      )
      .map((r) => ({ ...r, _itemType: "file" }));

    const refs = physRefs
      .filter(
        (r) =>
          r.name?.toLowerCase().includes(q) ||
          r.code?.toLowerCase().includes(q),
      )
      .map((r) => ({ ...r, _itemType: r.type }));

    return [...refs, ...files].sort((a, b) =>
      (a.title || a.name || "").localeCompare(b.title || b.name || ""),
    );
  }, [searchQuery, resources, physRefs]);

  // Mesin Pemroses Hasil Scan (Scanner USB & Kamera)
  const processScanResult = (code, isCamera = false) => {
    const q = code.trim().toLowerCase();
    if (!q) return;

    // 1. Cek Exact Match Arsip
    const exactFile = resources.find(
      (r) =>
        r.archivalStatus &&
        r.archivalStatus !== "pending" &&
        r.archivalStatus !== "none" &&
        (r.id.toLowerCase() === q ||
          (r.archiveRegId || "").toLowerCase() === q),
    );

    if (exactFile) {
      onOpenArchiveDetail(exactFile);
      setSearchQuery("");
      return;
    }

    // 2. Cek Exact Match Wadah
    const exactRef = physRefs.find(
      (r) => r.id.toLowerCase() === q || (r.code || "").toLowerCase() === q,
    );

    if (exactRef) {
      if (exactRef.type === "location" || exactRef.type === "rack")
        setViewLocationRack(exactRef);
      else setViewContainer(exactRef);
      setSearchQuery("");
      return;
    }

    if (isCamera)
      alert(`Pencarian Gagal: ID/Barcode "${code}" tidak terdaftar di sistem.`);
  };

  const handleSmartScanForm = (e) => {
    e.preventDefault();
    const code = searchInputRef.current
      ? searchInputRef.current.value
      : searchQuery;
    processScanResult(code, false);
  };

  // --- LOGIKA KAMERA SCANNER ---
  const requestCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setCameraStatus("granted");
      setShowCameraModal(false);
      setIsCameraActive(true);
    } catch (error) {
      setCameraStatus("denied");
      setShowCameraModal(false);
      alert("Akses kamera ditolak oleh browser Anda.");
    }
  };

  React.useEffect(() => {
    let html5QrCode = null;
    let timeoutId = null;

    if (isCameraActive && cameraStatus === "granted") {
      timeoutId = setTimeout(() => {
        try {
          if (typeof Html5Qrcode === "undefined") {
            alert("Modul pemindai belum termuat.");
            setIsCameraActive(false);
            return;
          }

          html5QrCode = new Html5Qrcode("tx-qr-reader");
          const config = { fps: 10, qrbox: { width: 250, height: 250 } };

          const onScanSuccess = (decodedText) => {
            if (scanLockRef.current) return;
            scanLockRef.current = true;

            setIsCameraActive(false);
            processScanResult(decodedText, true);

            setTimeout(() => {
              scanLockRef.current = false;
            }, 1500);
          };

          Html5Qrcode.getCameras()
            .then((devices) => {
              if (devices && devices.length > 0) {
                let selectedCameraId = devices[0].id;
                const backCamera = devices.find(
                  (d) =>
                    d.label.toLowerCase().includes("back") ||
                    d.label.toLowerCase().includes("environment"),
                );
                if (backCamera) selectedCameraId = backCamera.id;

                html5QrCode
                  .start(selectedCameraId, config, onScanSuccess, () => {})
                  .catch(() => {
                    html5QrCode
                      .start(
                        { facingMode: "environment" },
                        config,
                        onScanSuccess,
                        () => {},
                      )
                      .catch((error) => console.error(error));
                  });
              } else {
                html5QrCode
                  .start(
                    { facingMode: "environment" },
                    config,
                    onScanSuccess,
                    () => {},
                  )
                  .catch((e) => console.error(e));
              }
            })
            .catch(() => {
              html5QrCode
                .start(
                  { facingMode: "environment" },
                  config,
                  onScanSuccess,
                  () => {},
                )
                .catch((error) => console.error(error));
            });
        } catch (error) {
          console.error("Html5Qrcode Error:", error);
        }
      }, 300);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (html5QrCode) {
        try {
          if (html5QrCode.isScanning)
            html5QrCode
              .stop()
              .then(() => html5QrCode.clear())
              .catch(() => {
                // Scanner cleanup can race with browser camera teardown.
              });
          else html5QrCode.clear();
        } catch {
          // Scanner cleanup is best-effort.
        }
      }
    };
     
  }, [isCameraActive, cameraStatus]);

  // --- FITUR 2: PEMINJAMAN (BORROWING) ---
  const handleSaveBorrowing = (e) => {
    e.preventDefault();
    if (borrowForm.items.length === 0)
      return alert("Pilih minimal 1 arsip untuk dipinjam.");
    const newBorrow = {
      id: `BAP-PINJAM-${new Date().getTime()}`,
      date: new Date().toISOString(),
      ...borrowForm,
      status: "active",
    };
    setBorrowings((prev) => [newBorrow, ...prev]);
    setShowBorrowForm(false);
    setPrintBAP(newBorrow);
    setBorrowForm({
      borrowerName: "",
      unit: "",
      purpose: "",
      returnDate: "",
      items: [],
    });
  };

  // --- Handler Pemicu Konfirmasi ---
  const triggerReturn = (id) => {
    setConfirmModal({
      show: true,
      action: "return",
      title: "Konfirmasi Pengembalian",
      message:
        "Apakah Anda yakin seluruh arsip dalam peminjaman ini telah dikembalikan?",
      targetId: id,
    });
  };

  const triggerCancel = (id) => {
    setConfirmModal({
      show: true,
      action: "cancel",
      title: "Batalkan Pinjaman",
      message: "Apakah Anda yakin ingin membatalkan transaksi peminjaman ini?",
      targetId: id,
    });
  };

  // --- Eksekutor Aksi Konfirmasi ---
  const executeConfirm = () => {
    if (confirmModal.action === "return") {
      setBorrowings((prev) =>
        prev.map((b) =>
          b.id === confirmModal.targetId
            ? { ...b, status: "returned", returnedAt: new Date().toISOString() }
            : b,
        ),
      );
      setNotifyModal({
        show: true,
        type: "success",
        message: "Status arsip berhasil diubah menjadi dikembalikan.",
      });
    } else if (confirmModal.action === "cancel") {
      setBorrowings((prev) =>
        prev.map((b) =>
          b.id === confirmModal.targetId
            ? {
                ...b,
                status: "cancelled",
                cancelledAt: new Date().toISOString(),
              }
            : b,
        ),
      );
      setNotifyModal({
        show: true,
        type: "success",
        message: "Transaksi peminjaman berhasil dibatalkan.",
      });
    }
    setConfirmModal({
      show: false,
      action: null,
      title: "",
      message: "",
      targetId: null,
    });
  };

  // --- FUNGSI EKSEKUSI DARI BULK MOVE MODAL ---
  const executeBulkMoveFromModal = (itemsToMove) => {
    if (itemsToMove.length === 0) return;
    const targetContainer =
      physRefs.find((r) => r.id === targetParentId) || null;
    const targetType = targetContainer ? targetContainer.type : "root";
    const targetId = targetContainer ? targetContainer.id : "";

    let movedResources = [];
    let movedRefs = [];

    itemsToMove.forEach((item) => {
      const itemType =
        item._itemType || (item.archiveRegId ? "file" : item.type);

      if (itemType === "file") {
        let locs = {
          physFolderId: "",
          physBoxId: "",
          physRackId: "",
          physLocationId: "",
        };
        if (targetContainer) {
          if (targetType === "folder") {
            locs.physFolderId = targetId;
            locs.physBoxId = targetContainer.parentId || "";
            const b = physRefs.find((x) => x.id === targetContainer.parentId);
            if (b) {
              locs.physRackId = b.parentId || "";
              const r = physRefs.find((x) => x.id === b.parentId);
              if (r) locs.physLocationId = r.parentId || "";
            }
          } else if (targetType === "box") {
            locs.physBoxId = targetId;
            locs.physRackId = targetContainer.parentId || "";
            const r = physRefs.find((x) => x.id === targetContainer.parentId);
            if (r) locs.physLocationId = r.parentId || "";
          } else if (targetType === "rack") {
            locs.physRackId = targetId;
            locs.physLocationId = targetContainer.parentId || "";
          } else if (targetType === "location") {
            locs.physLocationId = targetId;
          }
        }
        movedResources.push({ ...item, ...locs });
      } else {
        movedRefs.push({ ...item, parentId: targetId });
      }
    });

    if (movedResources.length > 0)
      setResources((prev) =>
        prev.map((r) => {
          const match = movedResources.find((m) => m.id === r.id);
          return match || r;
        }),
      );
    if (movedRefs.length > 0)
      setPhysRefs((prev) =>
        prev.map((r) => {
          const match = movedRefs.find((m) => m.id === r.id);
          return match || r;
        }),
      );

    // --- LOG PEMINDAHAN MASSAL DENGAN DAFTAR ITEM ---
    const moveLog = {
      id: `MV-BLK-${new Date().getTime()}-${Math.floor(Math.random() * 1000)}`,
      date: new Date().toISOString(),
      itemsCount: itemsToMove.length,
      targetName: targetContainer ? targetContainer.name : "ROOT",
      user: user?.name || "Admin",
      description: `MASSAL | Pindah massal via Scanner (${itemsToMove.length} item)`,
      // TAMBAHAN: Simpan daftar item yang dipindahkan
      movedItems: itemsToMove.map((item) => ({
        id: item.id,
        name: item.name || item.title || "Tanpa Nama",
        code: item.code || item.archiveRegId || "NO-ID",
        type: item._itemType || item.type || "file",
      })),
    };
    setMoveLogs((prev) => [moveLog, ...prev]);

    setMoveAlert({
      show: true,
      msg: `Berhasil memindahkan ${itemsToMove.length} item ke ${targetContainer ? targetContainer.name : "ROOT"}.`,
    });
    setShowBulkMoveTrigger(false); // Tutup modal pemindai
  };

  // --- KOMPONEN RENDER ---
  return (
    <div className="h-full flex flex-col w-full space-y-6">
      {/* Modal Perizinan Kamera */}
      {showCameraModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4">
          <div
            className={`p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center border-2 ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-indigo-100"}`}
          >
            <div className="w-20 h-20 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Camera size={40} className="animate-pulse" />
            </div>
            <h3
              className={`font-bold text-xl mb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}
            >
              Izin Kamera
            </h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              Fitur Smart Scan memerlukan akses kamera untuk membaca QR Code.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCameraModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-colors"
              >
                Batal
              </button>
              <button
                onClick={requestCameraAccess}
                className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-colors"
              >
                Izinkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Aktif Kamera Scanner */}
      {isCameraActive && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div
            className={`w-full max-w-md p-6 rounded-3xl shadow-2xl flex flex-col items-center border ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}
          >
            <div className="w-full flex justify-between items-center mb-6 border-b pb-4 dark:border-slate-800">
              <div>
                <h3
                  className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-slate-800"}`}
                >
                  Smart Scan QR
                </h3>
                <p className="text-xs text-slate-500">
                  Sorot QR ke dalam bingkai
                </p>
              </div>
              <button
                onClick={() => setIsCameraActive(false)}
                className="p-2 bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 dark:bg-slate-800 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div
              id="tx-qr-reader"
              className="w-full bg-black rounded-2xl overflow-hidden shadow-inner border-2 border-indigo-500 min-h-[300px] flex items-center justify-center text-slate-500 text-xs"
            >
              Memuat Kamera...
            </div>
          </div>
        </div>
      )}

      {/* PEMANGGILAN KOMPONEN BULK MOVE MODAL */}
      {showBulkMoveTrigger && (
        <BulkMoveModal
          isOpen={showBulkMoveTrigger}
          onClose={() => setShowBulkMoveTrigger(false)}
          // PERBAIKAN: Deteksi nilai 'root' agar tidak mencari ke database dan tidak menjadi undefined
          targetContainer={
            targetParentId && targetParentId !== "root"
              ? physRefs.find((r) => r.id === targetParentId)
              : {
                  id: "root",
                  name: "ROOT (Tanpa Wadah)",
                  type: "root",
                  code: "ROOT",
                }
          }
          allResources={resources}
          allRefs={physRefs}
          onExecuteMove={executeBulkMoveFromModal}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Modal Notifikasi Pindah Berhasil */}
      {moveAlert.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div
            className={`p-6 rounded-3xl w-full max-w-sm text-center border shadow-2xl ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-800"}`}
          >
            <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} />
            </div>
            <h3 className="font-bold text-lg mb-2">Pemindahan Berhasil</h3>
            <p className="text-sm text-slate-500 mb-6">{moveAlert.msg}</p>
            <button
              onClick={() => setMoveAlert({ show: false, msg: "" })}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* --- Modal Konfirmasi Aksi --- */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div
            className={`p-6 rounded-3xl w-full max-w-sm text-center border shadow-2xl ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-800"}`}
          >
            <h3 className="font-bold text-lg mb-2">{confirmModal.title}</h3>
            <p className="text-sm text-slate-500 mb-6">
              {confirmModal.message}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setConfirmModal({
                    show: false,
                    action: null,
                    title: "",
                    message: "",
                    targetId: null,
                  })
                }
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-colors"
              >
                Kembali
              </button>
              <button
                onClick={executeConfirm}
                className={`flex-1 py-3 text-white rounded-xl font-bold shadow-lg transition-colors ${confirmModal.action === "cancel" ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"}`}
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal Notifikasi (Berhasil/Gagal) --- */}
      {notifyModal.show && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div
            className={`p-6 rounded-3xl w-full max-w-sm text-center border shadow-2xl ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-800"}`}
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${notifyModal.type === "error" ? "bg-red-100 text-red-500" : "bg-emerald-100 text-emerald-500"}`}
            >
              {notifyModal.type === "error" ? (
                <X size={32} />
              ) : (
                <CheckCircle size={32} />
              )}
            </div>
            <h3 className="font-bold text-lg mb-2">
              {notifyModal.type === "error" ? "Gagal" : "Berhasil"}
            </h3>
            <p className="text-sm text-slate-500 mb-6">{notifyModal.message}</p>
            <button
              onClick={() => {
                setNotifyModal({ show: false, type: "", message: "" });
                if (activeSubTab === "borrow")
                  setTimeout(() => borrowSearchRef.current?.focus(), 100);
              }}
              className={`w-full py-3 text-white rounded-xl font-bold shadow-lg transition-colors ${notifyModal.type === "error" ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"}`}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Modal Info Container (Folder/Box) */}
      {viewContainer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div
            className={`rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${viewContainer.type === "box" ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"}`}
                >
                  {viewContainer.type === "box" ? (
                    <Box size={24} />
                  ) : (
                    <Folder size={24} />
                  )}
                </div>
                <div>
                  <h3
                    className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}
                  >
                    {viewContainer.name}
                  </h3>
                  <p className="font-mono text-sm text-slate-500">
                    {viewContainer.code}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewContainer(null)}
                className="p-2 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50 dark:bg-slate-900/50 rounded-b-3xl custom-scrollbar">
              {viewContainer.type === "box" && (
                <>
                  {physRefs
                    .filter(
                      (r) =>
                        r.parentId === viewContainer.id && r.type === "folder",
                    )
                    .map((folder) => (
                      <div key={folder.id} className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Folder size={16} className="text-blue-500" />
                          <span className="font-bold text-sm dark:text-white">
                            {folder.name}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            {folder.code}
                          </span>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                          {resources
                            .filter((f) => f.physFolderId === folder.id)
                            .map((f) => (
                              <div
                                key={f.id}
                                className="text-xs flex justify-between pl-4 py-2 border-b border-slate-50 dark:border-slate-700 last:border-0 items-center group hover:bg-slate-50 dark:hover:bg-slate-700/50"
                              >
                                <div className="flex items-center gap-2">
                                  <FileText
                                    size={14}
                                    className="text-slate-400"
                                  />{" "}
                                  <span className="font-mono text-slate-500">
                                    {f.archiveRegId}
                                  </span>{" "}
                                  <span className="line-clamp-1 font-medium dark:text-slate-200">
                                    {f.title}
                                  </span>
                                </div>
                                <div className="flex gap-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {f.url && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(f.url, "_blank");
                                      }}
                                      className="p-1.5 hover:bg-blue-100 text-blue-500 rounded transition-colors"
                                      title="Lihat File"
                                    >
                                      <Eye size={14} />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setViewContainer(null);
                                      onOpenArchiveDetail(f);
                                    }}
                                    className="p-1.5 hover:bg-indigo-100 text-indigo-500 rounded transition-colors"
                                    title="Info Detail"
                                  >
                                    <Info size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          {resources.filter((f) => f.physFolderId === folder.id)
                            .length === 0 && (
                            <div className="p-3 text-xs text-slate-400 italic">
                              Folder kosong.
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={16} className="text-amber-500" />
                      <span className="font-bold text-sm dark:text-white">
                        Arsip Lepas (Tanpa Folder)
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      {resources
                        .filter(
                          (f) =>
                            f.physBoxId === viewContainer.id && !f.physFolderId,
                        )
                        .map((f) => (
                          <div
                            key={f.id}
                            className="text-xs flex justify-between pl-4 py-2 border-b border-slate-50 dark:border-slate-700 last:border-0 items-center group hover:bg-slate-50 dark:hover:bg-slate-700/50"
                          >
                            <div className="flex items-center gap-2">
                              <FileText size={14} className="text-amber-400" />{" "}
                              <span className="font-mono text-slate-500">
                                {f.archiveRegId}
                              </span>{" "}
                              <span className="line-clamp-1 font-medium dark:text-slate-200">
                                {f.title}
                              </span>
                            </div>
                            <div className="flex gap-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {f.url && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(f.url, "_blank");
                                  }}
                                  className="p-1.5 hover:bg-blue-100 text-blue-500 rounded transition-colors"
                                  title="Lihat File"
                                >
                                  <Eye size={14} />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewContainer(null);
                                  onOpenArchiveDetail(f);
                                }}
                                className="p-1.5 hover:bg-indigo-100 text-indigo-500 rounded transition-colors"
                                title="Info Detail"
                              >
                                <Info size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      {resources.filter(
                        (f) =>
                          f.physBoxId === viewContainer.id && !f.physFolderId,
                      ).length === 0 && (
                        <div className="p-3 text-xs text-slate-400 italic">
                          Tidak ada arsip lepas.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {viewContainer.type === "folder" && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden space-y-0">
                  {resources
                    .filter((r) => r.physFolderId === viewContainer.id)
                    .map((r, i) => (
                      <div
                        key={r.id}
                        className="p-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center group hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="font-mono text-xs font-bold text-slate-400 w-6">
                            {i + 1}.
                          </div>
                          <div>
                            <p className="font-bold text-sm dark:text-slate-200 line-clamp-1">
                              {r.title}
                            </p>
                            <p className="font-mono text-[10px] text-slate-400">
                              {r.archiveRegId}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {r.url && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(r.url, "_blank");
                              }}
                              className="p-2 hover:bg-blue-100 text-blue-500 rounded-lg transition-colors"
                              title="Lihat File"
                            >
                              <Eye size={14} />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewContainer(null);
                              onOpenArchiveDetail(r);
                            }}
                            className="p-2 hover:bg-indigo-100 text-indigo-500 rounded-lg transition-colors"
                            title="Info Detail"
                          >
                            <Info size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  {resources.filter((r) => r.physFolderId === viewContainer.id)
                    .length === 0 && (
                    <div className="p-4 text-center text-sm text-slate-400 italic">
                      Folder ini kosong.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* TAMBAHAN FOOTER: Tombol Cetak Data (A4) */}
            <div
              className={`p-4 border-t flex justify-end gap-3 rounded-b-3xl ${isDarkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}
            >
              <button
                onClick={() => setPrintContainerA4(viewContainer)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg transition-colors"
              >
                <Printer size={16} /> Cetak Data (A4)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Info Eksklusif: Lokasi & Rak */}
      {viewLocationRack && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in">
          <div
            className={`rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] border border-slate-600 ${isDarkMode ? "bg-slate-900 text-white" : "bg-white text-slate-800"}`}
          >
            <div
              className={`p-6 rounded-t-3xl border-b flex justify-between items-center ${viewLocationRack.type === "location" ? "bg-emerald-900/40 border-emerald-800" : "bg-indigo-900/40 border-indigo-800"}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${viewLocationRack.type === "location" ? "bg-emerald-500 text-white" : "bg-indigo-500 text-white"}`}
                >
                  {viewLocationRack.type === "location" ? (
                    <MapPin size={24} />
                  ) : (
                    <Server size={24} />
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-widest uppercase opacity-70 text-emerald-300">
                    {viewLocationRack.type}
                  </p>
                  <h3 className="text-xl font-bold">{viewLocationRack.name}</h3>
                  <p className="font-mono text-xs opacity-60">
                    {viewLocationRack.code}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewLocationRack(null)}
                className="p-2 bg-black/20 hover:bg-red-500/80 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <p className="text-sm font-bold border-b border-slate-700 pb-2">
                Rincian Isi Penyimpanan:
              </p>

              {viewLocationRack.type === "location" &&
                physRefs
                  .filter((r) => r.parentId === viewLocationRack.id)
                  .map((rack) => (
                    <div
                      key={rack.id}
                      className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 space-y-3"
                    >
                      <div className="flex items-center gap-2 text-indigo-200 bg-indigo-900/50 p-2.5 rounded-xl font-bold w-max mb-2 border border-indigo-700/50 shadow-inner">
                        <Server size={16} className="text-indigo-400" /> Rak:{" "}
                        {rack.name}
                        <span className="text-xs font-mono bg-indigo-950 px-2 py-0.5 rounded opacity-80 ml-1">
                          {rack.code}
                        </span>
                      </div>

                      {physRefs
                        .filter((b) => b.parentId === rack.id)
                        .map((box) => (
                          <div
                            key={box.id}
                            className="ml-4 p-4 rounded-2xl bg-slate-900/90 dark:bg-[#0a1020] border border-blue-900/30 space-y-3"
                          >
                            <div className="flex items-center gap-2 text-amber-500 text-sm font-bold">
                              <Box size={14} /> Box: {box.name}
                            </div>

                            <div className="ml-4 space-y-2 border-l-2 border-slate-700/50 pl-4">
                              {physRefs
                                .filter((f) => f.parentId === box.id)
                                .map((folder) => (
                                  <div key={folder.id} className="mb-2">
                                    <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold mb-1.5">
                                      <Folder size={12} /> Map: {folder.name}
                                    </div>
                                    <div className="ml-4 space-y-1">
                                      {resources
                                        .filter(
                                          (res) =>
                                            res.physFolderId === folder.id,
                                        )
                                        .map((file) => (
                                          <div
                                            key={file.id}
                                            className="flex justify-between items-center group bg-black/40 p-2.5 rounded-xl hover:bg-indigo-900/50 transition-colors border border-transparent hover:border-indigo-800/50"
                                          >
                                            <span className="text-xs text-slate-300 line-clamp-1 flex items-center gap-2">
                                              <FileText
                                                size={12}
                                                className="text-slate-500"
                                              />{" "}
                                              {file.title}
                                            </span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              {file.url && (
                                                <button
                                                  onClick={() =>
                                                    window.open(
                                                      file.url,
                                                      "_blank",
                                                    )
                                                  }
                                                  className="p-1 hover:bg-blue-500/20 text-blue-400 rounded"
                                                >
                                                  <Eye size={14} />
                                                </button>
                                              )}
                                              <button
                                                onClick={() => {
                                                  setViewLocationRack(null);
                                                  onOpenArchiveDetail(file);
                                                }}
                                                className="p-1 hover:bg-indigo-500/20 text-indigo-400 rounded"
                                              >
                                                <Info size={14} />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                ))}
                              {resources
                                .filter(
                                  (res) =>
                                    res.physBoxId === box.id &&
                                    !res.physFolderId,
                                )
                                .map((file) => (
                                  <div
                                    key={file.id}
                                    className="flex justify-between items-center group bg-black/20 p-2 rounded-lg hover:bg-amber-900/30 transition-colors"
                                  >
                                    <span className="text-xs text-slate-300 line-clamp-1 flex items-center gap-2">
                                      <FileText
                                        size={12}
                                        className="text-amber-700"
                                      />{" "}
                                      {file.title}
                                    </span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {file.url && (
                                        <button
                                          onClick={() =>
                                            window.open(file.url, "_blank")
                                          }
                                          className="p-1 hover:bg-blue-500/20 text-blue-400 rounded"
                                        >
                                          <Eye size={12} />
                                        </button>
                                      )}
                                      <button
                                        onClick={() => {
                                          setViewLocationRack(null);
                                          onOpenArchiveDetail(file);
                                        }}
                                        className="p-1 hover:bg-amber-500/20 text-amber-400 rounded"
                                      >
                                        <Info size={12} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  ))}

              {viewLocationRack.type === "rack" &&
                physRefs
                  .filter((b) => b.parentId === viewLocationRack.id)
                  .map((box) => (
                    <div
                      key={box.id}
                      className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 space-y-2"
                    >
                      <div className="flex items-center gap-2 text-amber-500 text-sm font-bold">
                        <Box size={14} /> Box: {box.name}
                      </div>
                      <div className="ml-4 space-y-1 border-l-2 border-slate-600 pl-3">
                        {physRefs
                          .filter((f) => f.parentId === box.id)
                          .map((folder) => (
                            <div key={folder.id} className="mb-2">
                              <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold mb-1.5">
                                <Folder size={12} /> Map: {folder.name}
                              </div>
                              <div className="ml-4 space-y-1">
                                {resources
                                  .filter(
                                    (res) => res.physFolderId === folder.id,
                                  )
                                  .map((file) => (
                                    <div
                                      key={file.id}
                                      className="flex justify-between items-center group bg-black/40 p-2.5 rounded-xl hover:bg-indigo-900/50 transition-colors border border-transparent hover:border-indigo-800/50"
                                    >
                                      <span className="text-xs text-slate-300 line-clamp-1 flex items-center gap-2">
                                        <FileText
                                          size={12}
                                          className="text-slate-500"
                                        />{" "}
                                        {file.title}
                                      </span>
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {file.url && (
                                          <button
                                            onClick={() =>
                                              window.open(file.url, "_blank")
                                            }
                                            className="p-1 hover:bg-blue-500/20 text-blue-400 rounded"
                                          >
                                            <Eye size={14} />
                                          </button>
                                        )}
                                        <button
                                          onClick={() => {
                                            setViewLocationRack(null);
                                            onOpenArchiveDetail(file);
                                          }}
                                          className="p-1 hover:bg-indigo-500/20 text-indigo-400 rounded"
                                        >
                                          <Info size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Preview Label Cetak QR Khusus Wadah */}
      {printContainerQR && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-5 relative flex justify-center items-center border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-center">
                Preview Label Cetak
              </h3>
              <button
                onClick={() => setPrintContainerQR(null)}
                className="absolute right-5 text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center">
              <div className="bg-white p-4 border-2 border-black flex items-center gap-4 w-full">
                <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${printContainerQR.id}`}
                    alt="QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-black truncate">
                    {printContainerQR.code}
                  </p>
                  <div className="border-b-2 border-black my-1"></div>
                  <p className="font-black text-sm text-black truncate uppercase">
                    {printContainerQR.name}
                  </p>
                  <p className="text-[10px] font-medium uppercase text-slate-500 mt-1">
                    {printContainerQR.type}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 pt-0">
              <button
                onClick={() => window.print()}
                className="w-full py-3.5 bg-[#0f172a] hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Printer size={16} /> Cetak Label
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Print A4 Info Container (Box/Folder) */}
      {printContainerA4 && (
        <div className="fixed inset-0 z-[250] bg-slate-200 overflow-y-auto flex flex-col">
          <div className="print:hidden p-4 bg-slate-900 text-white flex justify-between items-center sticky top-0 z-10 shadow-lg">
            <p className="font-bold">Mode Pratinjau Cetak (A4)</p>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-bold flex items-center gap-2 transition-colors"
              >
                <Printer size={16} /> Cetak
              </button>
              <button
                onClick={() => setPrintContainerA4(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
          <div className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black mx-auto my-8 p-[20mm] shadow-2xl print:m-0 print:shadow-none print:w-full">
            <div className="flex justify-between items-start border-b-4 border-black pb-4 mb-6">
              <div>
                <h1 className="text-2xl font-black uppercase tracking-widest m-0">
                  DAFTAR ISI ARSIP
                </h1>
                <h2 className="text-lg font-bold uppercase m-0 mt-1">
                  {printContainerA4.type}: {printContainerA4.name}
                </h2>
                <p className="text-sm text-gray-800 mt-2">
                  KODE:{" "}
                  <span className="font-mono font-bold">
                    {printContainerA4.code}
                  </span>
                </p>
              </div>
              <div className="w-24 h-24 border-2 border-black p-1">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${printContainerA4.id}`}
                  className="w-full h-full object-contain"
                  alt="QR"
                />
              </div>
            </div>

            {/* Penggunaan table-header-group agar header otomatis berulang saat beda halaman */}
            <table
              className="w-full border-collapse border border-black text-sm mb-4"
              style={{ pageBreakInside: "auto" }}
            >
              <thead style={{ display: "table-header-group" }}>
                <tr className="bg-gray-100">
                  <th className="border border-black p-2 w-10 text-center">
                    No
                  </th>
                  {printContainerA4.type === "box" && (
                    <th className="border border-black p-2 w-1/5">Folder</th>
                  )}
                  <th className="border border-black p-2">Uraian Arsip</th>
                  <th className="border border-black p-2 w-20 text-center">
                    Tanggal
                  </th>
                  <th className="border border-black p-2 w-20 text-center">
                    Ret. Aktif
                  </th>
                  <th className="border border-black p-2 w-20 text-center">
                    Ret. Inaktif
                  </th>
                  <th className="border border-black p-2 w-24 text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody style={{ pageBreakInside: "avoid" }}>
                {(() => {
                  const isBox = printContainerA4.type === "box";
                  const folderList = isBox
                    ? physRefs.filter((r) => r.parentId === printContainerA4.id)
                    : [];
                  let no = 1;
                  const fmtDate = (d) =>
                    d ? new Date(d).toLocaleDateString("id-ID") : "-";

                  // Logika Perhitungan Status Berdasarkan Tanggal Cetak
                  const getStatus = (f) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0); // Normalisasi jam
                    const activeD = f.retentionActiveDate
                      ? new Date(f.retentionActiveDate)
                      : null;
                    const inactiveD = f.retentionInactiveDate
                      ? new Date(f.retentionInactiveDate)
                      : null;

                    if (inactiveD && today >= inactiveD)
                      return "Perlu Tindak Lanjut";
                    if (activeD && today >= activeD) return "Inaktif";
                    return "Aktif";
                  };

                  let rows = [];

                  if (isBox) {
                    folderList.forEach((folder) => {
                      const filesInFolder = resources.filter(
                        (r) => r.physFolderId === folder.id,
                      );
                      if (filesInFolder.length === 0) {
                        rows.push(
                          <tr key={`empty-${folder.id}`}>
                            <td className="border border-black p-2 text-center">
                              {no++}
                            </td>
                            <td className="border border-black p-2 font-bold">
                              {folder.name} <br />
                              <span className="text-[10px] font-normal font-mono text-gray-500">
                                {folder.code}
                              </span>
                            </td>
                            <td className="border border-black p-2 text-center">
                              -
                            </td>
                            <td className="border border-black p-2 text-center">
                              -
                            </td>
                            <td className="border border-black p-2 text-center">
                              -
                            </td>
                            <td className="border border-black p-2 text-center">
                              -
                            </td>
                            <td className="border border-black p-2 text-center">
                              -
                            </td>
                          </tr>,
                        );
                      } else {
                        filesInFolder.forEach((file) => {
                          const status = getStatus(file);
                          rows.push(
                            <tr key={file.id}>
                              <td className="border border-black p-2 text-center">
                                {no++}
                              </td>
                              <td className="border border-black p-2 font-bold">
                                {folder.name}
                              </td>
                              <td className="border border-black p-2">
                                {file.title || file.name} <br />
                                <span className="text-[10px] font-mono text-gray-500">
                                  {file.archiveRegId}
                                </span>
                              </td>
                              <td className="border border-black p-2 text-center">
                                {fmtDate(file.date)}
                              </td>
                              <td className="border border-black p-2 text-center">
                                {fmtDate(file.retentionActiveDate)}
                              </td>
                              <td className="border border-black p-2 text-center">
                                {fmtDate(file.retentionInactiveDate)}
                              </td>
                              <td
                                className={`border border-black p-2 text-center font-bold text-[10px] uppercase ${status === "Perlu Tindak Lanjut" ? "text-red-600" : status === "Inaktif" ? "text-orange-600" : "text-emerald-600"}`}
                              >
                                {status}
                              </td>
                            </tr>,
                          );
                        });
                      }
                    });
                    const looseFiles = resources.filter(
                      (r) =>
                        r.physBoxId === printContainerA4.id && !r.physFolderId,
                    );
                    looseFiles.forEach((file) => {
                      const status = getStatus(file);
                      rows.push(
                        <tr key={file.id}>
                          <td className="border border-black p-2 text-center">
                            {no++}
                          </td>
                          <td className="border border-black p-2 italic text-gray-600">
                            - (Lepas)
                          </td>
                          <td className="border border-black p-2">
                            {file.title || file.name} <br />
                            <span className="text-[10px] font-mono text-gray-500">
                              {file.archiveRegId}
                            </span>
                          </td>
                          <td className="border border-black p-2 text-center">
                            {fmtDate(file.date)}
                          </td>
                          <td className="border border-black p-2 text-center">
                            {fmtDate(file.retentionActiveDate)}
                          </td>
                          <td className="border border-black p-2 text-center">
                            {fmtDate(file.retentionInactiveDate)}
                          </td>
                          <td
                            className={`border border-black p-2 text-center font-bold text-[10px] uppercase ${status === "Perlu Tindak Lanjut" ? "text-red-600" : status === "Inaktif" ? "text-orange-600" : "text-emerald-600"}`}
                          >
                            {status}
                          </td>
                        </tr>,
                      );
                    });
                  } else {
                    const files = resources.filter(
                      (r) => r.physFolderId === printContainerA4.id,
                    );
                    files.forEach((file) => {
                      const status = getStatus(file);
                      rows.push(
                        <tr key={file.id}>
                          <td className="border border-black p-2 text-center">
                            {no++}
                          </td>
                          <td className="border border-black p-2">
                            {file.title || file.name} <br />
                            <span className="text-[10px] font-mono text-gray-500">
                              {file.archiveRegId}
                            </span>
                          </td>
                          <td className="border border-black p-2 text-center">
                            {fmtDate(file.date)}
                          </td>
                          <td className="border border-black p-2 text-center">
                            {fmtDate(file.retentionActiveDate)}
                          </td>
                          <td className="border border-black p-2 text-center">
                            {fmtDate(file.retentionInactiveDate)}
                          </td>
                          <td
                            className={`border border-black p-2 text-center font-bold text-[10px] uppercase ${status === "Perlu Tindak Lanjut" ? "text-red-600" : status === "Inaktif" ? "text-orange-600" : "text-emerald-600"}`}
                          >
                            {status}
                          </td>
                        </tr>,
                      );
                    });
                  }

                  if (rows.length === 0) {
                    rows.push(
                      <tr key="none">
                        <td
                          colSpan={isBox ? 7 : 6}
                          className="border border-black p-4 text-center italic text-gray-500"
                        >
                          Tidak ada rincian data arsip di dalam wadah ini.
                        </td>
                      </tr>,
                    );
                  }
                  return rows;
                })()}
              </tbody>
            </table>

            {/* Area Tanggal Cetak & Tanda Tangan/Pengesahan */}
            <div
              className="flex justify-end mt-12 text-sm"
              style={{ pageBreakInside: "avoid" }}
            >
              <div className="text-center w-64">
                <p className="mb-20">
                  ......................,{" "}
                  {new Date().toLocaleDateString("id-ID", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="font-bold underline uppercase">
                  {user?.name || "................................"}
                </p>
                <p className="text-xs">Pengelola Arsip</p>
                <p className="text-[10px] text-gray-500 mt-4">
                  Dicetak pada: {new Date().toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Print A4 Berita Acara */}
      {printBAP && (
        <div className="fixed inset-0 z-[200] bg-slate-200 overflow-y-auto flex flex-col">
          <div className="print:hidden p-4 bg-slate-900 text-white flex justify-between items-center sticky top-0 z-10 shadow-lg">
            <p className="font-bold">Mode Pratinjau Cetak (A4)</p>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-bold flex items-center gap-2"
              >
                <Printer size={16} /> Cetak
              </button>
              <button
                onClick={() => setPrintBAP(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
          <div className="relative w-full max-w-[210mm] min-h-[297mm] bg-white text-black mx-auto my-8 p-[20mm] shadow-2xl print:m-0 print:shadow-none">
            {/* --- TAMBAHAN: WATERMARK STATUS PEMINJAMAN --- */}
            {(printBAP.status === "cancelled" ||
              printBAP.status === "returned") && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden select-none">
                <span
                  className={`text-5xl md:text-7xl font-black uppercase tracking-widest opacity-10 -rotate-45 whitespace-nowrap ${printBAP.status === "cancelled" ? "text-red-600" : "text-emerald-600"}`}
                >
                  {printBAP.status === "cancelled"
                    ? "DIBATALKAN"
                    : "SUDAH DIKEMBALIKAN"}
                </span>
              </div>
            )}
            <div className="border-b-4 border-black pb-4 mb-8 text-center">
              <h1 className="text-2xl font-black uppercase tracking-widest">
                {printBAP.borrowerName
                  ? "BERITA ACARA PEMINJAMAN ARSIP"
                  : "BERITA ACARA PENYUSUTAN ARSIP"}
              </h1>
              <p className="text-sm mt-1">Nomor: {printBAP.id}</p>
            </div>
            <p className="text-justify mb-4">
              Pada hari ini, tanggal{" "}
              <strong>
                {new Date(
                  printBAP.date || printBAP.executedAt,
                ).toLocaleDateString("id-ID", { dateStyle: "full" })}
              </strong>
              , telah dilakukan{" "}
              {printBAP.borrowerName
                ? "penyerahan pinjaman"
                : `proses ${printBAP.type === "destroy" ? "pemusnahan" : "penyerahan statis"}`}{" "}
              arsip dengan rincian sebagai berikut:
            </p>

            {printBAP.borrowerName && (
              <table className="w-full mb-6 text-sm">
                <tbody>
                  <tr>
                    <td className="w-40 font-bold py-1">Nama Peminjam</td>
                    <td>: {printBAP.borrowerName}</td>
                  </tr>
                  <tr>
                    <td className="font-bold py-1">Unit Kerja</td>
                    <td>: {printBAP.unit}</td>
                  </tr>
                  <tr>
                    <td className="font-bold py-1">Keperluan</td>
                    <td>: {printBAP.purpose}</td>
                  </tr>
                  <tr>
                    <td className="font-bold py-1">Tgl Batas Kembali</td>
                    <td>
                      :{" "}
                      {new Date(printBAP.returnDate).toLocaleDateString(
                        "id-ID",
                        { dateStyle: "full" },
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            <p className="font-bold mb-2 text-sm">Daftar Arsip:</p>
            <table className="w-full border-collapse border border-black text-sm mb-8">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-2 w-10">No</th>
                  <th className="border border-black p-2">
                    Kode / Nomor Arsip
                  </th>
                  <th className="border border-black p-2">Judul Arsip</th>
                </tr>
              </thead>
              <tbody>
                {printBAP.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="border border-black p-2 text-center">
                      {idx + 1}
                    </td>
                    <td className="border border-black p-2 font-mono text-xs">
                      {it.archiveRegId || it.number || "-"}
                    </td>
                    <td className="border border-black p-2">{it.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="text-justify mb-16">
              Demikian berita acara ini dibuat untuk dapat dipergunakan
              sebagaimana mestinya.
            </p>

            <div className="flex justify-between text-center text-sm">
              <div className="w-48">
                <p className="mb-16">
                  {printBAP.borrowerName ? "Pihak Peminjam," : "Mengetahui,"}
                </p>
                <p className="font-bold underline">
                  {printBAP.borrowerName || "................................"}
                </p>
              </div>
              <div className="w-48">
                <p className="mb-16">Pengelola Arsip,</p>
                <p className="font-bold underline">
                  {user?.name || "Admin Arsip"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB NAVIGASI TRANSAKSI */}
      <div className="flex gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-700 pb-2 shrink-0">
        {[
          { id: "search", label: "Pencarian Global", icon: Search },
          { id: "move", label: "Pemindahan Arsip", icon: ArrowRightLeft },
          { id: "borrow", label: "Sirkulasi / Peminjaman", icon: Handshake },
          { id: "disposition", label: "Histori Penyusutan", icon: FileX },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveSubTab(t.id)}
            className={`px-4 py-2 text-sm font-bold rounded-t-xl transition-all flex items-center gap-2 ${activeSubTab === t.id ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* AREA RENDER SUB-TAB */}
      <div
        className={`flex-1 overflow-y-auto p-4 rounded-2xl border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
      >
        {/* 1. PENCARIAN GLOBAL & SMART SCANNER */}
        {activeSubTab === "search" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Smart Scanner Bar */}
            <form
              onSubmit={handleSmartScanForm}
              className={`relative overflow-hidden flex items-center gap-3 p-2 rounded-2xl border-2 shadow-[0_0_20px_rgba(79,70,229,0.15)] transition-all focus-within:shadow-[0_0_25px_rgba(79,70,229,0.3)] focus-within:border-indigo-500 ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-indigo-100"}`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent opacity-50 pointer-events-none"></div>

              <div className="w-12 h-12 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-400 z-10 shrink-0">
                <Search size={24} strokeWidth={2.5} />
              </div>

              <input
                ref={searchInputRef}
                autoFocus
                type="text"
                placeholder="Scan Barcode / Ketik ID Arsip / Nama Wadah lalu tekan Enter..."
                className="w-full bg-transparent outline-none text-base font-medium z-10 dark:text-white placeholder:text-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    processScanResult(e.target.value, false);
                  }
                }}
              />

              <button
                type="button"
                onClick={() => {
                  if (cameraStatus !== "granted") setShowCameraModal(true);
                  else setIsCameraActive(true);
                }}
                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 z-10 transition-colors shrink-0 shadow-lg"
              >
                <Scan size={18} />{" "}
                <span className="hidden md:inline">Camera Scan</span>
              </button>
            </form>

            {/* Hasil Pencarian */}
            {searchQuery && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {globalResults.map((res, i) => {
                  const t = res._itemType;
                  const theme =
                    t === "location"
                      ? {
                          color: "emerald",
                          icon: MapPin,
                          label: "LOKASI FISIK",
                        }
                      : t === "rack"
                        ? { color: "indigo", icon: Server, label: "RAK ARSIP" }
                        : t === "box"
                          ? { color: "amber", icon: Box, label: "BOKS ARSIP" }
                          : t === "folder"
                            ? {
                                color: "blue",
                                icon: Folder,
                                label: "MAP / FOLDER",
                              }
                            : {
                                color: "slate",
                                icon: FileText,
                                label: "ARSIP DOKUMEN",
                              };
                  const isFile = t === "file";

                  return (
                    <div
                      key={i}
                      onClick={() =>
                        isFile
                          ? onOpenArchiveDetail(res)
                          : t === "location" || t === "rack"
                            ? setViewLocationRack(res)
                            : setViewContainer(res)
                      }
                      className={`group relative p-5 rounded-3xl border backdrop-blur-md overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer ${isDarkMode ? "bg-slate-800/80 border-slate-700 hover:border-" + theme.color + "-500" : "bg-white/80 border-slate-200 hover:border-" + theme.color + "-300"}`}
                    >
                      <div
                        className={`absolute -right-6 -top-6 w-32 h-32 rounded-full bg-${theme.color}-500/10 blur-3xl group-hover:bg-${theme.color}-500/20 transition-colors pointer-events-none`}
                      ></div>

                      <div className="flex items-start gap-4 relative z-10">
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner shrink-0 bg-${theme.color}-100 dark:bg-${theme.color}-900/40 text-${theme.color}-600 dark:text-${theme.color}-400`}
                        >
                          <theme.icon size={28} strokeWidth={2} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-[10px] font-black tracking-widest mb-1 text-${theme.color}-500 dark:text-${theme.color}-400`}
                          >
                            {theme.label}
                          </p>
                          <h4 className="font-bold text-base line-clamp-2 leading-tight mb-2 dark:text-white group-hover:text-indigo-500 transition-colors">
                            {res.title || res.name}
                          </h4>
                          <div className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded-md">
                            <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                              {res.archiveRegId ||
                                res.code ||
                                res.number ||
                                "NO-ID"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t ${isDarkMode ? "from-slate-900/95 via-slate-900/50" : "from-white/95 via-white/50"} to-transparent opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 flex justify-end gap-2 z-20`}
                      >
                        {isFile && res.url && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(res.url, "_blank");
                            }}
                            className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-colors shadow-sm"
                            title="Preview File"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            isFile ? onPrintQR(res) : setPrintContainerQR(res);
                          }}
                          className="p-2 bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-colors shadow-sm"
                          title="Cetak QR Code"
                        >
                          <Printer size={16} />
                        </button>
                        <button
                          className={`p-2 bg-${theme.color}-100 text-${theme.color}-600 hover:bg-${theme.color}-600 hover:text-white rounded-xl transition-colors shadow-sm`}
                          title="Buka Detail"
                        >
                          <Info size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {searchQuery && globalResults.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 border-2 border-dashed border-slate-700 rounded-3xl opacity-60">
                <Scan size={48} className="mb-4 opacity-50" />
                <p className="font-bold">Tidak ada kecocokan di database.</p>
                <p className="text-xs">Pastikan barcode atau ID benar.</p>
              </div>
            )}
          </div>
        )}

        {/* 2. PEMINJAMAN */}
        {activeSubTab === "borrow" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg dark:text-white">
                Daftar Peminjaman
              </h3>
              <button
                onClick={() => setShowBorrowForm(!showBorrowForm)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700"
              >
                <Plus size={16} />{" "}
                {showBorrowForm ? "Batal" : "Buat Peminjaman"}
              </button>
            </div>

            {/* FORM PEMINJAMAN YANG DIPERINDAH */}
            {showBorrowForm && (
              <div
                className={`p-6 md:p-8 rounded-3xl border shadow-sm mb-6 ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"}`}
              >
                <div className="flex items-center gap-4 mb-6 border-b pb-5 dark:border-slate-700">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center dark:bg-indigo-900/50 dark:text-indigo-400">
                    <Handshake size={24} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xl text-slate-800 dark:text-white">
                      Formulir Peminjaman
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Catat sirkulasi keluar arsip fisik ke pihak terkait.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleBorrowSubmit} className="space-y-5">
                  {/* Baris 1: Pencarian Arsip Multi-Item */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block tracking-wider">
                      Cari & Pilih Arsip Fisik{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mb-3">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Search size={16} />
                      </div>
                      <input
                        // TAMBAHAN: Pasang Ref di sini
                        ref={borrowSearchRef}
                        type="text"
                        placeholder="Scan Barcode atau ketik kode/judul arsip..."
                        className={`w-full pl-11 p-3.5 rounded-xl border text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${isDarkMode ? "bg-slate-900 border-slate-600 text-white" : "bg-white border-slate-300 text-slate-800 focus:bg-white"}`}
                        value={borrowSearch}
                        onChange={(e) => setBorrowSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const scannedCode = e.currentTarget.value
                              .trim()
                              .toLowerCase();
                            if (!scannedCode) return;

                            const matchedFile = resources.find((r) => {
                              const isArchivalValid =
                                r.archivalStatus &&
                                r.archivalStatus !== "pending" &&
                                r.archivalStatus !== "none";
                              const fileLifecycle = (
                                r.status || ""
                              ).toLowerCase();
                              const isNotDestroyedOrStatic =
                                fileLifecycle !== "destroyed" &&
                                fileLifecycle !== "static";
                              const isMatchCode =
                                (r.archiveRegId || "").toLowerCase() ===
                                  scannedCode ||
                                (r.id || "").toLowerCase() === scannedCode;

                              return (
                                isArchivalValid &&
                                isNotDestroyedOrStatic &&
                                isMatchCode
                              );
                            });

                            if (matchedFile) {
                              if (
                                !borrowForm.items.find(
                                  (x) => x.id === matchedFile.id,
                                )
                              ) {
                                setBorrowForm({
                                  ...borrowForm,
                                  items: [...borrowForm.items, matchedFile],
                                });
                              }
                              setBorrowSearch(""); // Bersihkan input saat sukses
                              setTimeout(
                                () => borrowSearchRef.current?.focus(),
                                100,
                              ); // Fokus kembali
                            } else {
                              setNotifyModal({
                                show: true,
                                type: "error",
                                message: `Arsip dengan Barcode "${scannedCode}" tidak ditemukan, atau berstatus Statis/Musnah.`,
                              });
                              // TAMBAHAN: Bersihkan form saat gagal & kembalikan fokus
                              setBorrowSearch("");
                              setTimeout(
                                () => borrowSearchRef.current?.focus(),
                                100,
                              );
                            }
                          }
                        }}
                      />
                    </div>

                    {/* Hasil Pencarian Pop-up (Dropdown) */}
                    {borrowSearch && (
                      <div className="max-h-40 overflow-y-auto mb-4 border rounded-xl bg-white dark:bg-slate-900 dark:border-slate-600 shadow-lg p-2 space-y-1">
                        {resources
                          .filter((r) => {
                            // --- VALIDASI DROPDOWN DIPERKETAT ---
                            const isArchivalValid =
                              r.archivalStatus &&
                              r.archivalStatus !== "pending" &&
                              r.archivalStatus !== "none";

                            // GANTI `r.status` DENGAN KEY ASLI DARI FILE CONTROL ANDA
                            const fileLifecycle = (
                              r.status || ""
                            ).toLowerCase();
                            const isNotDestroyedOrStatic =
                              fileLifecycle !== "destroyed" &&
                              fileLifecycle !== "static";

                            const isMatchSearch =
                              (r.title || "")
                                .toLowerCase()
                                .includes(borrowSearch.toLowerCase()) ||
                              (r.archiveRegId || "")
                                .toLowerCase()
                                .includes(borrowSearch.toLowerCase());
                            const isNotBorrowed = !borrowings.some(
                              (b) =>
                                b.status === "active" &&
                                b.items?.some((i) => i.id === r.id),
                            );

                            return (
                              isArchivalValid &&
                              isNotDestroyedOrStatic &&
                              isMatchSearch &&
                              isNotBorrowed
                            );
                          })
                          .map((res) => (
                            <div
                              key={res.id}
                              onClick={() => {
                                if (
                                  !borrowForm.items.find((x) => x.id === res.id)
                                ) {
                                  setBorrowForm({
                                    ...borrowForm,
                                    items: [...borrowForm.items, res],
                                  });
                                }
                                setBorrowSearch("");
                              }}
                              className="p-3 text-sm cursor-pointer hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 group transition-colors border border-transparent hover:border-indigo-100 dark:hover:border-slate-700"
                            >
                              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 rounded text-[10px] font-mono font-bold">
                                {res.archiveRegId || "NO-ID"}
                              </span>
                              <span className="font-medium dark:text-slate-200 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                {res.title}
                              </span>
                            </div>
                          ))}

                        {/* Pesan Jika Kosong/Terblokir Filter */}
                        {resources.filter((r) => {
                          const isArchivalValid =
                            r.archivalStatus &&
                            r.archivalStatus !== "pending" &&
                            r.archivalStatus !== "none";
                          const fileLifecycle = (r.status || "").toLowerCase(); // GANTI r.status JUGA DI SINI JIKA PERLU
                          const isNotDestroyedOrStatic =
                            fileLifecycle !== "destroyed" &&
                            fileLifecycle !== "static";
                          const isMatchSearch =
                            (r.title || "")
                              .toLowerCase()
                              .includes(borrowSearch.toLowerCase()) ||
                            (r.archiveRegId || "")
                              .toLowerCase()
                              .includes(borrowSearch.toLowerCase());

                          return (
                            isArchivalValid &&
                            isNotDestroyedOrStatic &&
                            isMatchSearch
                          );
                        }).length === 0 && (
                          <div className="p-3 text-xs text-slate-400 italic text-center">
                            Arsip tidak ditemukan, berstatus Statis/Musnah, atau
                            sedang dipinjam.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tag Arsip Terpilih */}
                    <div className="flex flex-wrap gap-2 min-h-[44px] p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                      {borrowForm.items.length === 0 ? (
                        <span className="text-xs text-slate-400 italic flex items-center w-full justify-center">
                          Belum ada arsip yang dipilih.
                        </span>
                      ) : (
                        borrowForm.items.map((it) => (
                          <div
                            key={it.id}
                            className="text-xs bg-indigo-500 text-white pl-3 pr-1 py-1.5 rounded-lg flex items-center gap-2 shadow-sm"
                          >
                            <span className="font-medium max-w-[200px] truncate">
                              {it.title}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setBorrowForm({
                                  ...borrowForm,
                                  items: borrowForm.items.filter(
                                    (x) => x.id !== it.id,
                                  ),
                                })
                              }
                              className="p-1 hover:bg-indigo-600 rounded-md transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Baris 2: Data Peminjam & Unit */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block tracking-wider">
                        Nama Peminjam <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                          <User size={16} />
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Budi Santoso"
                          className={`w-full pl-11 p-3.5 rounded-xl border text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${isDarkMode ? "bg-slate-900 border-slate-600 text-white" : "bg-slate-50 border-slate-300 text-slate-800 focus:bg-white"}`}
                          value={borrowForm.borrowerName}
                          onChange={(e) =>
                            setBorrowForm({
                              ...borrowForm,
                              borrowerName: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block tracking-wider">
                        Unit / Instansi
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                          <Briefcase size={16} />
                        </div>
                        <input
                          type="text"
                          placeholder="Contoh: Divisi Keuangan"
                          className={`w-full pl-11 p-3.5 rounded-xl border text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${isDarkMode ? "bg-slate-900 border-slate-600 text-white" : "bg-slate-50 border-slate-300 text-slate-800 focus:bg-white"}`}
                          value={borrowForm.unit}
                          onChange={(e) =>
                            setBorrowForm({
                              ...borrowForm,
                              unit: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Baris 3: Tanggal Pinjam & Kembali */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                    <div>
                      <label className="text-[11px] font-bold text-indigo-500 uppercase mb-2 block tracking-wider">
                        Tanggal Pinjam <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          required
                          className={`w-full p-3.5 rounded-xl border text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${isDarkMode ? "bg-slate-900 border-slate-600 text-white dark:[color-scheme:dark]" : "bg-white border-indigo-200 text-slate-800"}`}
                          value={borrowForm.borrowDate}
                          onChange={(e) =>
                            setBorrowForm({
                              ...borrowForm,
                              borrowDate: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-orange-500 uppercase mb-2 block tracking-wider">
                        Target Kembali <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          required
                          className={`w-full p-3.5 rounded-xl border text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all ${isDarkMode ? "bg-slate-900 border-slate-600 text-white dark:[color-scheme:dark]" : "bg-white border-orange-200 text-slate-800"}`}
                          value={borrowForm.expectedReturnDate}
                          onChange={(e) =>
                            setBorrowForm({
                              ...borrowForm,
                              expectedReturnDate: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Baris 4: Keperluan */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block tracking-wider">
                      Keperluan / Keterangan
                    </label>
                    <textarea
                      placeholder="Tuliskan tujuan peminjaman secara singkat..."
                      rows="2"
                      className={`w-full p-4 rounded-xl border text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all ${isDarkMode ? "bg-slate-900 border-slate-600 text-white" : "bg-slate-50 border-slate-300 text-slate-800 focus:bg-white"}`}
                      value={borrowForm.purpose}
                      onChange={(e) =>
                        setBorrowForm({
                          ...borrowForm,
                          purpose: e.target.value,
                        })
                      }
                    ></textarea>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-2xl font-bold shadow-xl shadow-indigo-200 dark:shadow-none flex justify-center items-center gap-3 transition-all"
                    >
                      <Send size={18} /> Proses Peminjaman Arsip
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-3">
              {borrowings
                // Menyaring data berdasarkan halaman
                .slice(
                  borrowsPerPage === "all"
                    ? 0
                    : (borrowPage - 1) * borrowsPerPage,
                  borrowsPerPage === "all"
                    ? borrowings.length
                    : borrowPage * borrowsPerPage,
                )
                .map((b) => (
                  <div
                    key={b.id}
                    className={`p-4 rounded-xl border flex justify-between items-center ${isDarkMode ? "border-slate-700 bg-slate-900/50" : "border-slate-200 bg-white"}`}
                  >
                    <div>
                      <p className="font-bold text-sm dark:text-white">
                        {b.borrowerName}{" "}
                        <span className="text-xs font-normal text-slate-400">
                          ({b.unit})
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        Tgl Kembali:{" "}
                        {new Date(b.returnDate).toLocaleDateString()} •{" "}
                        {b.items.length} item
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPrintBAP(b)}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg dark:hover:bg-slate-700"
                        title="Cetak BAP"
                      >
                        <Printer size={16} />
                      </button>
                      {b.status === "active" ? (
                        <>
                          <button
                            onClick={() => triggerCancel(b.id)}
                            className="px-3 py-1.5 text-xs font-bold bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            Batalkan
                          </button>
                          <button
                            onClick={() => triggerReturn(b.id)}
                            className="px-3 py-1.5 text-xs font-bold bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                          >
                            Kembalikan
                          </button>
                        </>
                      ) : b.status === "cancelled" ? (
                        <span className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-500 rounded-lg flex items-center gap-1 dark:bg-slate-800 dark:text-slate-400">
                          <X size={14} /> Dibatalkan
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-lg flex items-center gap-1">
                          <CheckCircle size={14} /> Dikembalikan
                        </span>
                      )}
                    </div>
                  </div>
                ))}

              {/* KONTROL PAGINASI PEMINJAMAN */}
              {borrowings.length > 0 && (
                <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400">
                    Total: {borrowings.length} Transaksi
                  </span>
                  <div className="flex items-center gap-4">
                    <select
                      value={borrowsPerPage}
                      onChange={(e) => {
                        setBorrowsPerPage(
                          e.target.value === "all"
                            ? "all"
                            : parseInt(e.target.value),
                        );
                        setBorrowPage(1);
                      }}
                      className={`text-xs border rounded-lg px-2 py-1 outline-none ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-300"}`}
                    >
                      <option value={5}>5 Baris</option>
                      <option value={10}>10 Baris</option>
                      <option value={25}>25 Baris</option>
                      <option value="all">Semua</option>
                    </select>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setBorrowPage((p) => Math.max(1, p - 1))}
                        disabled={borrowPage === 1}
                        className="px-3 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 transition-colors"
                      >
                        Prev
                      </button>
                      <span className="text-xs font-bold text-slate-500">
                        Hal {borrowPage} dari{" "}
                        {borrowsPerPage === "all"
                          ? 1
                          : Math.max(
                              1,
                              Math.ceil(borrowings.length / borrowsPerPage),
                            )}
                      </span>
                      <button
                        onClick={() => setBorrowPage((p) => p + 1)}
                        disabled={
                          borrowsPerPage === "all" ||
                          borrowPage >=
                            Math.max(
                              1,
                              Math.ceil(borrowings.length / borrowsPerPage),
                            )
                        }
                        className="px-3 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {borrowings.length === 0 && (
                <p className="text-center text-slate-400 italic text-sm mt-10">
                  Belum ada riwayat peminjaman.
                </p>
              )}
            </div>
          </div>
        )}

        {/* 3. PEMINDAHAN MASSAL (DENGAN DROPDOWN WADAH & LOG) */}
        {activeSubTab === "move" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            {/* Area Pemilihan Tujuan (Dropdown Search) */}
            <div
              className={`p-6 rounded-3xl border ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold uppercase text-indigo-500">
                  1. Tentukan Wadah Tujuan
                </h4>
                {targetParentId && (
                  <button
                    onClick={() => {
                      if (moveStaging.length > 0) setShowResetConfirm(true);
                      else setTargetParentId("");
                    }}
                    className="text-[10px] text-red-500 hover:underline"
                  >
                    Reset Tujuan
                  </button>
                )}
              </div>

              <div className="relative">
                <SearchableDropdown
                  placeholder="Cari Wadah Tujuan (Gedung, Rak, Box, Map)..."
                  isDarkMode={isDarkMode}
                  value={targetParentId}
                  disabled={moveStaging.length > 0} // Kunci jika sudah ada antrean
                  options={[
                    { label: "ROOT (Tanpa Wadah)", value: "root" },
                    ...physRefs.map((r) => ({
                      label: `[${r.type.toUpperCase()}] ${r.code} - ${r.name}`,
                      value: r.id,
                    })),
                  ]}
                  onChange={(val) => setTargetParentId(val)}
                />
                {moveStaging.length > 0 && (
                  <p className="text-[9px] text-orange-500 mt-2 font-bold italic">
                    * Selesaikan atau reset antrean untuk mengubah tujuan.
                  </p>
                )}
              </div>
            </div>

            {/* Tombol Aksi & Header Log */}
            <div className="flex justify-between items-center pt-4">
              <div>
                <h3 className="font-bold text-lg dark:text-white">
                  Riwayat Pemindahan
                </h3>
                <p className="text-xs text-slate-500">
                  Log aktivitas penataan fisik terbaru.
                </p>
              </div>
              <button
                disabled={!targetParentId}
                onClick={() => setShowBulkMoveTrigger(true)}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-lg transition-all hover:scale-105"
              >
                <Plus size={18} /> Pindahkan
              </button>
            </div>

            {/* Tabel Log Transaksi (Perbaikan Tampilan) */}
            <div className="space-y-3 mt-4">
              {moveLogs.length > 0 ? (
                moveLogs
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .slice(
                    logsPerPage === "all" ? 0 : (logPage - 1) * logsPerPage,
                    logsPerPage === "all"
                      ? moveLogs.length
                      : logPage * logsPerPage,
                  )
                  .map((log) => {
                    // Variabel Tema (Wajib didefinisikan di dalam map)
                    const desc = log.description || "";
                    const isWadah = desc.includes("WADAH");
                    const isMassal =
                      desc.includes("MASSAL") || desc.includes("BLK");

                    const themeClass = isWadah
                      ? "bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800"
                      : isMassal
                        ? "bg-indigo-100 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800"
                        : "bg-emerald-100 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800";

                    const textTheme = isWadah
                      ? "text-amber-700 dark:text-amber-400"
                      : isMassal
                        ? "text-indigo-700 dark:text-indigo-400"
                        : "text-emerald-700 dark:text-emerald-400";

                    return (
                      <div
                        key={log.id}
                        className={`p-4 rounded-2xl border flex flex-col gap-3 transition-all ${isDarkMode ? "bg-slate-900/50" : "bg-white shadow-sm"} ${themeClass}`}
                      >
                        {/* Baris Utama Log */}
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center bg-white/50 dark:bg-black/20 shrink-0 ${textTheme}`}
                            >
                              <ArrowRightLeft size={20} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm dark:text-white">
                                  {log.id}
                                </p>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(log.date).toLocaleString("id-ID")}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                                {desc.replace(
                                  /WADAH \| |ARSIP \| |MASSAL \| /g,
                                  "",
                                )}{" "}
                                →{" "}
                                <span className="font-bold text-indigo-500">
                                  {log.targetName}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span
                              className={`text-[9px] font-bold px-2 py-1 rounded-lg uppercase tracking-tighter bg-white/50 dark:bg-black/20 ${textTheme}`}
                            >
                              Oleh: {log.user}
                            </span>
                          </div>
                        </div>

                        {/* TAMBAHAN: Area Rincian Item (Muncul jika ada movedItems) */}
                        {log.movedItems && log.movedItems.length > 0 && (
                          <div className="ml-14 pt-3 border-t border-black/5 dark:border-white/5">
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2">
                              Rincian Item Dipindahkan:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {log.movedItems.map((item, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 p-2 rounded-lg bg-white/60 dark:bg-black/20 border border-black/5 dark:border-white/5"
                                >
                                  <span className="text-[10px] font-bold bg-indigo-200 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 w-5 h-5 flex items-center justify-center rounded-full shrink-0">
                                    {i + 1}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold truncate dark:text-slate-200">
                                      {item.name}
                                    </p>
                                    <p className="text-[9px] font-mono opacity-70 truncate">
                                      {item.code}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
              ) : (
                <div className="py-10 text-center opacity-30 italic text-sm">
                  Belum ada riwayat aktivitas.
                </div>
              )}

              {/* KONTROL PAGINASI PEMINDAHAN */}
              {moveLogs && moveLogs.length > 0 && (
                <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400">
                    Total: {moveLogs.length} Aktivitas
                  </span>
                  <div className="flex items-center gap-4">
                    <select
                      value={logsPerPage}
                      onChange={(e) => {
                        setLogsPerPage(
                          e.target.value === "all"
                            ? "all"
                            : parseInt(e.target.value),
                        );
                        setLogPage(1);
                      }}
                      className={`text-xs border rounded-lg px-2 py-1 outline-none ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-300"}`}
                    >
                      <option value={5}>5 Baris</option>
                      <option value={10}>10 Baris</option>
                      <option value={25}>25 Baris</option>
                      <option value="all">Semua</option>
                    </select>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                        disabled={logPage === 1}
                        className="px-3 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 transition-colors"
                      >
                        Prev
                      </button>
                      <span className="text-xs font-bold text-slate-500">
                        Hal {logPage} dari{" "}
                        {logsPerPage === "all"
                          ? 1
                          : Math.max(
                              1,
                              Math.ceil(moveLogs.length / logsPerPage),
                            )}
                      </span>
                      <button
                        onClick={() => setLogPage((p) => p + 1)}
                        disabled={
                          logsPerPage === "all" ||
                          logPage >=
                            Math.max(
                              1,
                              Math.ceil(moveLogs.length / logsPerPage),
                            )
                        }
                        className="px-3 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. HISTORI PENYUSUTAN */}
        {activeSubTab === "disposition" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg dark:text-white">
                Berita Acara Penyusutan
              </h3>

              {/* TAMBAHAN: TOMBOL DROPDOWN PEMBUATAN BAP */}
              <div className="relative">
                <button
                  onClick={() => setManualDispMenu(!manualDispMenu)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                >
                  <Plus size={16} /> Buat BAP <ChevronDown size={14} />
                </button>
                {manualDispMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-[50] animate-in fade-in slide-in-from-top-2">
                    <button
                      onClick={() => {
                        setManualDispModal({ show: true, type: "destroy" });
                        setManualDispMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 font-bold flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 transition-colors"
                    >
                      <Trash2 size={16} /> Pemusnahan Arsip
                    </button>
                    <button
                      onClick={() => {
                        setManualDispModal({ show: true, type: "transfer" });
                        setManualDispMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 font-bold flex items-center gap-3 transition-colors"
                    >
                      <Truck size={16} /> Penyerahan (Statis)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* PEMANGGILAN MODAL PENYUSUTAN MANUAL (MASUKKAN TEPAT DI BAWAH HEADER) */}
            {manualDispModal.show && (
              <DispositionFormModal
                isOpen={manualDispModal.show}
                onClose={() => setManualDispModal({ show: false, type: "" })}
                type={manualDispModal.type}
                count={0}
                onConfirm={handleManualDispositionConfirm}
                isDarkMode={isDarkMode}
                isManualMode={true}
                resources={resources}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PENERAPAN SLICE PADA DATA PENYUSUTAN */}
              {dispositionLogs
                .sort((a, b) => new Date(b.executedAt) - new Date(a.executedAt))
                .slice(
                  dispositionsPerPage === "all"
                    ? 0
                    : (dispositionPage - 1) * dispositionsPerPage,
                  dispositionsPerPage === "all"
                    ? dispositionLogs.length
                    : dispositionPage * dispositionsPerPage,
                )
                .map((log) => (
                  <div
                    key={log.id}
                    className={`p-5 rounded-2xl border ${isDarkMode ? "border-slate-700 bg-slate-900/50" : "border-slate-200 bg-white"}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-sm dark:text-white">
                          {log.id}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(log.executedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded border ${log.type === "destroy" ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"}`}
                      >
                        {log.statusLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                      {log.items.length} arsip telah diproses berdasarkan{" "}
                      {log.formData?.dasarHukum || "keputusan pengelola"}.
                    </p>
                    <button
                      onClick={() => setPrintBAP(log)}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center justify-center gap-2 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                    >
                      <Printer size={14} /> Cetak Berita Acara
                    </button>
                  </div>
                ))}
              {dispositionLogs.length === 0 && (
                <p className="text-slate-400 italic text-sm mt-4 col-span-2">
                  Belum ada riwayat penyusutan/pemusnahan.
                </p>
              )}
            </div>

            {/* KONTROL PAGINASI PENYUSUTAN */}
            {dispositionLogs && dispositionLogs.length > 0 && (
              <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400">
                  Total: {dispositionLogs.length} Berita Acara
                </span>
                <div className="flex items-center gap-4">
                  <select
                    value={dispositionsPerPage}
                    onChange={(e) => {
                      setDispositionsPerPage(
                        e.target.value === "all"
                          ? "all"
                          : parseInt(e.target.value),
                      );
                      setDispositionPage(1);
                    }}
                    className={`text-xs border rounded-lg px-2 py-1 outline-none ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-300"}`}
                  >
                    <option value={5}>5 Baris</option>
                    <option value={10}>10 Baris</option>
                    <option value={25}>25 Baris</option>
                    <option value="all">Semua</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setDispositionPage((p) => Math.max(1, p - 1))
                      }
                      disabled={dispositionPage === 1}
                      className="px-3 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 transition-colors"
                    >
                      Prev
                    </button>
                    <span className="text-xs font-bold text-slate-500">
                      Hal {dispositionPage} dari{" "}
                      {dispositionsPerPage === "all"
                        ? 1
                        : Math.max(
                            1,
                            Math.ceil(
                              dispositionLogs.length / dispositionsPerPage,
                            ),
                          )}
                    </span>
                    <button
                      onClick={() => setDispositionPage((p) => p + 1)}
                      disabled={
                        dispositionsPerPage === "all" ||
                        dispositionPage >=
                          Math.max(
                            1,
                            Math.ceil(
                              dispositionLogs.length / dispositionsPerPage,
                            ),
                          )
                      }
                      className="px-3 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================================================================================
// 7.6. KOMPONEN UTAMA MANAJER KONTROL FILE (FILE CONTROL MANAGER)
// ==================================================================================

// STEP 1: Pastikan komponen menerima props archives dan setArchives dari Dashboard
export const FileControlManager = ({
  user,
  resources = [],
  setResources,
  archives = [],
  setArchives,
  isDarkMode,
}) => {
  // 7.6.1. Inisialisasi State Aplikasi
  const [classifications, setClassifications] = useUserAwareState(
    [],
    "lifeos-archive-classifications",
    user,
  );
  const [jraList, setJraList] = useUserAwareState(
    [],
    "lifeos-archive-jra",
    user,
  );
  const [physRefs, setPhysRefs] = useUserAwareState(
    [],
    "lifeos-archive-physical",
    user,
  );
  const [borrowings, setBorrowings] = useUserAwareState(
    [],
    "lifeos-archive-borrowings",
    user,
  );
  const [dispositionLogs, setDispositionLogs] = useUserAwareState(
    [],
    "lifeos-archive-dispositions",
    user,
  );
  const [moveLogs, setMoveLogs] = useUserAwareState(
    [],
    "lifeos-archive-movelogs",
    user,
  );

  // 7.6.2. Manajemen State Tab Navigasi
  const [activeTab, setActiveTab] = React.useState("pending");
  const [subTab, setSubTab] = React.useState("all");
  const [refSubTab, setRefSubTab] = React.useState("klasifikasi");

  // 7.6.3. Manajemen State Penomoran Halaman (Pagination)
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(100);

  // 7.6.4. Manajemen State Filter Pencarian dan Waktu
  const [timeFilter, setTimeFilter] = React.useState("all");
  const [filterDate, setFilterDate] = React.useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    start: "",
    end: "",
  });
  const [searchQuery, setSearchQuery] = React.useState("");

  // 7.6.5. Manajemen State Interaksi Komponen Modal dan Tampilan
  const [selectedResource, setSelectedResource] = React.useState(null);
  const [viewResource, setViewResource] = React.useState(null);
  const [printItem, setPrintItem] = React.useState(null);
  const [selectedIds, setSelectedIds] = React.useState(new Set());
  const [bulkModeSection, setBulkModeSection] = React.useState(null);
  const [dispositionModal, setDispositionModal] = React.useState({
    show: false,
    type: "destroy",
  });
  const [alertModal, setAlertModal] = React.useState({
    isOpen: false,
    title: "",
    message: "",
    type: "error",
  });

  // 7.6.6. Efek Samping: Reset Pagination Saat Pergantian Tab
  React.useEffect(() => {
    setCurrentPage(1);
    setSubTab("all");
    setBulkModeSection(null);
    setSelectedIds(new Set());
  }, [activeTab]);

  // ==============================================================================
  // 7.6.7. STEP 2: EKSTRAKSI DATA ARSIP DARI SISTEM PRODUCTIVITY (PARA)
  // ==============================================================================

  // A. Ambil file aktif dari resources reguler
  const activeFiles = resources
    .filter((r) => r.type === "file")
    .map((f) => ({ ...f, isArchived: false }));

  // B. Ekstrak file yang diarsipkan dari state archives (membongkar wrapper)
  const archivedFiles = archives.reduce((acc, arch) => {
    // Pengecekan dibuat lebih aman: Mengubah ke lowercase agar tidak gagal karena typo kapital huruf
    const isResource = String(arch.originalType).toLowerCase() === "resource";
    const isFile = arch.data && String(arch.data.type).toLowerCase() === "file";

    if (isResource && isFile) {
      acc.push({
        ...arch.data, // Keluarkan data resource aslinya
        isArchived: true, // Flag identifikasi untuk File Control
        archivedAt: arch.archivedAt,
        archiveWrapperId: arch.id, // Simpan ID wrapper untuk rute update state
      });
    }
    return acc;
  }, []);

  // C. Gabungkan kedua sumber data untuk diproses serentak oleh File Control
  const allFilesForControl = [...activeFiles, ...archivedFiles];
  // ==============================================================================

  // 7.6.8. STEP 3: Kalkulasi Status Dinamis Menggunakan Data Gabungan
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const processedResources = allFilesForControl.map((r) => {
    let dynamicStatus = r.status || "active";
    if (r.status === "destroyed") dynamicStatus = "destroyed";
    else if (r.status === "static") dynamicStatus = "static";
    else if (
      r.retentionActiveDate &&
      r.retentionInactiveDate &&
      r.archivalStatus !== "none"
    ) {
      const activeDate = new Date(r.retentionActiveDate);
      const inactiveDate = new Date(r.retentionInactiveDate);
      if (today > inactiveDate)
        dynamicStatus = r.isVital ? "inactive" : "expired";
      else if (today > activeDate) dynamicStatus = "inactive";
      else dynamicStatus = "active";
    }
    return { ...r, dynamicStatus };
  });

  // ==============================================================================
  // IMPLEMENTASI: PEMANTAUAN DAN EKSEKUSI OTOMATIS (AUTO-DISPOSE) ARSIP DIGITAL
  // ==============================================================================
  React.useEffect(() => {
    const todayTime = new Date();
    todayTime.setHours(0, 0, 0, 0);

    let hasUpdates = false;
    let resourcesToUpdate = [...(resources || [])];
    let archivesToUpdate = [...(archives || [])];
    let newLogs = [];

    allFilesForControl.forEach((r) => {
      // Validasi ketat: Arsip Digital, Auto-Dispose ON, Belum musnah/statis, dan punya tanggal inaktif
      if (
        r.archivalStatus === "digital" &&
        r.isAutoDispose &&
        r.status !== "destroyed" &&
        r.status !== "static" &&
        r.retentionInactiveDate
      ) {
        const inactiveDate = new Date(r.retentionInactiveDate);

        if (todayTime > inactiveDate) {
          hasUpdates = true;

          // Deteksi status akhir berdasarkan JRA
          const jra = jraList.find((j) => j.id === r.jraId);
          const isPerm = jra?.keterangan === "Permanen";
          const targetStatus = isPerm ? "static" : "destroyed";
          const statusLabel = isPerm ? "Statis" : "Musnah";
          const actionType = isPerm ? "transfer" : "destroy";

          const generatedBapId = `BAP-AUTO-${new Date().getTime()}-${r.id}`;

          const updatedRes = {
            ...r,
            status: targetStatus,
            tags: [
              ...(r.tags || []).filter((t) => t !== "Musnah" && t !== "Statis"),
              statusLabel,
            ],
            dispositionData: {
              legalNumber: `AUTO-SYS-${new Date().getFullYear()}`,
              date: todayTime.toISOString().split("T")[0],
              description:
                "Eksekusi pemusnahan/penyerahan otomatis oleh sistem (Auto-Dispose) untuk arsip digital.",
              userNote: "Eksekusi Otomatisasi via Sistem Terintegrasi",
              executedAt: new Date().toISOString(),
              type: actionType,
            },
          };

          // Routing pembaruan state presisi
          if (r.isArchived && setArchives) {
            const archIndex = archivesToUpdate.findIndex(
              (a) => a.id === r.archiveWrapperId,
            );
            if (archIndex > -1)
              archivesToUpdate[archIndex] = {
                ...archivesToUpdate[archIndex],
                data: updatedRes,
              };
          } else {
            const resIndex = resourcesToUpdate.findIndex(
              (res) => res.id === r.id,
            );
            if (resIndex > -1) resourcesToUpdate[resIndex] = updatedRes;
          }

          // Rekam Log Berita Acara Otomatis
          newLogs.push({
            id: generatedBapId,
            type: actionType,
            statusLabel: statusLabel,
            executedAt: new Date().toISOString(),
            formData: updatedRes.dispositionData,
            items: [
              {
                id: r.id,
                title: r.title,
                number: r.number,
                archiveRegId: r.archiveRegId,
              },
            ],
          });
        }
      }
    });

    // Lakukan penyimpanan massal secara senyap (tanpa notifikasi mengganggu)
    if (hasUpdates) {
      setResources(resourcesToUpdate);
      if (setArchives) setArchives(archivesToUpdate);
      if (newLogs.length > 0)
        setDispositionLogs((prev) => [...prev, ...newLogs]);
    }
     
  }, [resources, archives]); // Hanya terpicu dengan aman saat ada perubahan proporsional

  // 7.6.9. Logika Utama: Fungsi Pemfilteran Data Arsip
  const getFilteredResources = () => {
    if (activeTab === "references") return [];

    return processedResources
      .filter((r) => {
        const archivalStatus = r.archivalStatus || "pending";
        if (activeTab === "pending" && archivalStatus !== "pending")
          return false;
        if (activeTab === "digital" && archivalStatus !== "digital")
          return false;
        if (activeTab === "physical" && archivalStatus !== "physical")
          return false;
        if (activeTab === "static" && r.dynamicStatus !== "static")
          return false;
        if (activeTab === "destroyed" && r.dynamicStatus !== "destroyed")
          return false;

        const searchLower = searchQuery.toLowerCase();
        if (
          searchQuery &&
          !r.title.toLowerCase().includes(searchLower) &&
          !r.number?.toLowerCase().includes(searchLower) &&
          !r.classificationCode?.toLowerCase().includes(searchLower)
        )
          return false;

        if (activeTab === "physical" || activeTab === "digital") {
          if (r.dynamicStatus === "destroyed" || r.dynamicStatus === "static")
            return false;
          if (subTab === "active" && r.dynamicStatus !== "active") return false;
          if (
            subTab === "inactive" &&
            r.dynamicStatus !== "inactive" &&
            r.dynamicStatus !== "expired"
          )
            return false;
          if (subTab === "vital" && !r.isVital) return false;
        }

        // --- FITUR BARU: Filter Sub-Tab untuk Statis dan Musnah ---
        if (activeTab === "static" || activeTab === "destroyed") {
          if (subTab === "physical" && archivalStatus !== "physical")
            return false;
          if (subTab === "digital" && archivalStatus !== "digital")
            return false;
        }
        // ---------------------------------------------------------

        if (timeFilter !== "all" && r.date) {
          const d = new Date(r.date);
          if (
            timeFilter === "year" &&
            d.getFullYear() !== parseInt(filterDate.year)
          )
            return false;
          if (
            timeFilter === "month" &&
            (d.getMonth() !== parseInt(filterDate.month) ||
              d.getFullYear() !== parseInt(filterDate.year))
          )
            return false;
          if (
            timeFilter === "range" &&
            filterDate.start &&
            filterDate.end &&
            (d < new Date(filterDate.start) || d > new Date(filterDate.end))
          )
            return false;
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt),
      );
  };

  const filteredResources = getFilteredResources();

  // 7.6.10. Logika Pagination Data
  const indexOfLastItem =
    itemsPerPage === "all"
      ? filteredResources.length
      : currentPage * itemsPerPage;
  const indexOfFirstItem =
    itemsPerPage === "all" ? 0 : indexOfLastItem - itemsPerPage;
  const currentItems = filteredResources.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  // ==============================================================================
  // 7.6.11. STEP 4: PERBAIKAN JALUR PENYIMPANAN (STATE ROUTING) PADA HANDLER
  // ==============================================================================
  const handleSaveArchive = (updatedResource) => {
    if (updatedResource.isArchived && setArchives) {
      // Rute 1: Simpan kembali ke dalam wrapper 'archives' jika asalnya dari sana
      setArchives((prev) =>
        prev.map((a) =>
          a.id === updatedResource.archiveWrapperId
            ? { ...a, data: updatedResource }
            : a,
        ),
      );
    } else {
      // Rute 2: Simpan normal ke 'resources'
      setResources((prev) =>
        prev.map((r) => (r.id === updatedResource.id ? updatedResource : r)),
      );
    }
  };

  const handleRestoreArchive = (resource) => {
    // 1. Buang properti sementara agar tidak mengotori database
    const {
      dynamicStatus,
      isArchived,
      archiveWrapperId,
      archivedAt,
      ...pureResource
    } = resource;

    // 2. Format ulang ke siklus hidup awal & matikan Auto-Dispose
    const updatedRes = {
      ...pureResource,
      status: "active",
      isAutoDispose: false,
      tags: (pureResource.tags || []).filter(
        (t) => t.toLowerCase() !== "musnah" && t.toLowerCase() !== "statis",
      ),
      dispositionData: null,
    };

    // 3. Simpan perubahan sesuai asal data
    if (resource.isArchived && setArchives) {
      setArchives((prev) =>
        prev.map((a) =>
          a.id === resource.archiveWrapperId ? { ...a, data: updatedRes } : a,
        ),
      );
    } else {
      setResources((prev) =>
        prev.map((r) => (r.id === resource.id ? updatedRes : r)),
      );
    }

    // 4. Tutup modal & tampilkan notifikasi
    setViewResource(null);
    setAlertModal({
      isOpen: true,
      title: "Berhasil",
      message: `Arsip "${resource.title || resource.name}" berhasil dikembalikan ke status Dinamis.`,
      type: "success",
    });
  };

  const handleSelection = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSelectAll = (items) => {
    if (selectedIds.size === items.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(items.map((r) => r.id)));
  };

  // 7.6.12. Fungsi Eksekusi Penyerahan dan Pemusnahan Arsip (Disposisi)
  const initiateDisposition = (type, singleItem = null) => {
    let itemsToProcess = [];
    if (singleItem) {
      itemsToProcess = [singleItem];
      setSelectedIds(new Set([singleItem.id]));
    } else {
      itemsToProcess = processedResources.filter((r) => selectedIds.has(r.id));
      if (itemsToProcess.length === 0)
        return setAlertModal({
          isOpen: true,
          title: "Info",
          message: "Pilih minimal satu arsip.",
          type: "error",
        });
    }

    let invalidCount = 0;
    itemsToProcess.forEach((item) => {
      const jra = jraList.find((j) => j.id === item.jraId);
      const isPerm = jra?.keterangan === "Permanen";
      if (type === "destroy") {
        if (item.isVital || isPerm || item.dynamicStatus !== "expired")
          invalidCount++;
      } else if (type === "transfer") {
        if (!isPerm || item.dynamicStatus !== "expired") invalidCount++;
      }
    });

    if (invalidCount > 0)
      return setAlertModal({
        isOpen: true,
        title: "Validasi Gagal",
        message: `Terdapat ${invalidCount} arsip yang tidak memenuhi syarat.`,
        type: "error",
      });

    setDispositionModal({ show: true, type: type });
  };

  const executeDisposition = (formData) => {
    const { type } = dispositionModal;
    const targetStatus = type === "destroy" ? "destroyed" : "static";
    const statusLabel = type === "destroy" ? "Musnah" : "Statis";

    // Siapkan array clone untuk routing pembaruan multi-state serentak
    let resourcesToUpdate = [...resources];
    let archivesToUpdate = archives ? [...archives] : [];

    processedResources.forEach((r) => {
      if (selectedIds.has(r.id)) {
        const updatedRes = {
          ...r,
          status: targetStatus,
          tags: [
            ...(r.tags || []).filter((t) => t !== "Musnah" && t !== "Statis"),
            statusLabel,
          ],
          dispositionData: {
            ...formData,
            executedAt: new Date().toISOString(),
            type: type,
          },
        };

        // Lakukan Routing
        if (r.isArchived && setArchives) {
          archivesToUpdate = archivesToUpdate.map((a) =>
            a.id === r.archiveWrapperId ? { ...a, data: updatedRes } : a,
          );
        } else {
          resourcesToUpdate = resourcesToUpdate.map((res) =>
            res.id === r.id ? updatedRes : res,
          );
        }
      }
    });

    // Terapkan perubahan state
    setResources(resourcesToUpdate);
    if (setArchives) setArchives(archivesToUpdate);

    // --- SUNTIKAN BARU: SIMPAN KE DATABASE BERITA ACARA TRANSAKSI ---
    const logItems = processedResources
      .filter((r) => selectedIds.has(r.id))
      .map((r) => ({
        id: r.id,
        title: r.title,
        number: r.number,
        archiveRegId: r.archiveRegId,
      }));
    const newBAP = {
      id: `BAP-${new Date().getTime()}`,
      type: type, // 'destroy' atau 'transfer'
      statusLabel: statusLabel,
      executedAt: new Date().toISOString(),
      formData: formData,
      items: logItems,
    };
    setDispositionLogs((prev) => [...prev, newBAP]);
    // ----------------------------------------------------------------

    setDispositionModal({ show: false, type: "" });
    setSelectedIds(new Set());
    setBulkModeSection(null);
    setAlertModal({
      isOpen: true,
      title: "Berhasil",
      message: `Arsip berhasil diproses menjadi status ${statusLabel}.`,
      type: "success",
    });
  };

  // 7.6.13. Hitung Statistik menggunakan Data Gabungan
  const countStats = (type) =>
    processedResources.filter(
      (r) =>
        r.dynamicStatus === type ||
        (!r.archivalStatus && type === "pending") ||
        (r.archivalStatus === type &&
          r.dynamicStatus !== "destroyed" &&
          r.dynamicStatus !== "static"),
    ).length;

  const destroyedCount = processedResources.filter(
    (r) => r.status === "destroyed",
  ).length;
  const staticCount = processedResources.filter(
    (r) => r.status === "static",
  ).length;

  // 7.6.14. Komponen Render Helper: Kartu Tampilan Arsip
  const renderCard = (res) => {
    const isSelected = selectedIds.has(res.id);
    const isBulkActive = !!bulkModeSection;
    const jraRef = jraList.find((j) => j.id === res.jraId);
    const isExpired = res.dynamicStatus === "expired";
    const isDestroyed = res.dynamicStatus === "destroyed";
    const isActive = res.dynamicStatus === "active";
    const isStatic = res.dynamicStatus === "static";

    const dispositionTag =
      jraRef?.keterangan === "Musnah"
        ? "Non Permanen"
        : jraRef?.keterangan || "Belum Diset";

    // Explicit Dark Mode Palette
    const statusColor = isDestroyed
      ? isDarkMode
        ? "bg-slate-800 text-slate-400 border-slate-700"
        : "bg-slate-100 text-slate-500 border-slate-200"
      : isStatic
        ? isDarkMode
          ? "bg-blue-900/30 text-blue-400 border-blue-800"
          : "bg-blue-100 text-blue-700 border-blue-200"
        : isExpired
          ? isDarkMode
            ? "bg-red-900/30 text-red-400 border-red-800"
            : "bg-red-100 text-red-700 border-red-200"
          : isActive
            ? isDarkMode
              ? "bg-emerald-900/30 text-emerald-400 border-emerald-800"
              : "bg-emerald-100 text-emerald-700 border-emerald-200"
            : isDarkMode
              ? "bg-orange-900/30 text-orange-400 border-orange-800"
              : "bg-orange-100 text-orange-700 border-orange-200";

    const statusText = isDestroyed
      ? "Musnah"
      : isStatic
        ? "Statis"
        : isExpired
          ? "Perlu Tindak Lanjut"
          : isActive
            ? "Aktif"
            : "Inaktif";

    const cardBg = isBulkActive
      ? isSelected
        ? isDarkMode
          ? "bg-indigo-900/30 border-indigo-500 ring-1 ring-indigo-500"
          : "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500"
        : isDarkMode
          ? "bg-slate-800 border-slate-700 opacity-60 hover:opacity-100"
          : "bg-white border-slate-200 opacity-60 hover:opacity-100"
      : isDarkMode
        ? "bg-slate-800 border-slate-700 hover:border-indigo-500"
        : "bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md";

    return (
      <div
        key={res.id}
        onClick={() => isBulkActive && handleSelection(res.id)}
        className={`relative p-5 rounded-2xl border flex flex-col md:flex-row gap-4 transition-all ${cardBg}`}
      >
        {isBulkActive && (
          <div className="absolute top-4 right-4 z-10 pointer-events-none">
            {isSelected ? (
              <CheckSquare
                size={20}
                className={isDarkMode ? "text-indigo-400" : "text-indigo-600"}
              />
            ) : (
              <Square
                size={20}
                className={isDarkMode ? "text-slate-600" : "text-slate-300"}
              />
            )}
          </div>
        )}

        <div
          className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center ${res.type === "file" ? (isDarkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-600") : isDarkMode ? "bg-amber-900/30 text-amber-400" : "bg-amber-50 text-amber-600"}`}
        >
          {res.type === "file" ? (
            <FileText size={24} />
          ) : (
            <ExternalLink size={24} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2 items-center mb-1">
            {res.number && (
              <span
                className={`text-[10px] font-mono px-1 rounded ${isDarkMode ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-400"}`}
              >
                {res.number}
              </span>
            )}
            {res.classificationId && (
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${isDarkMode ? "bg-indigo-900/30 text-indigo-400 border-indigo-800" : "bg-indigo-50 text-indigo-700 border-indigo-100"}`}
              >
                {classifications.find((c) => c.id === res.classificationId)
                  ?.kodeItem || "CODE"}
              </span>
            )}
            {res.isVital && (
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${isDarkMode ? "bg-red-900/30 text-red-400 border-red-800" : "bg-red-50 text-red-600 border-red-100"}`}
              >
                <Shield size={8} /> VITAL
              </span>
            )}
          </div>

          <h4
            className={`font-bold text-sm truncate pr-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            {res.title || res.name}
          </h4>
          <p
            className={`text-xs line-clamp-1 mb-2 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
          >
            {res.description || res.content || "Tidak ada deskripsi."}
          </p>

          <div className="flex flex-wrap gap-2 mt-2">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${statusColor}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full bg-current`}></div>{" "}
              {statusText}
            </span>

            {/* Perbaikan Tampilan Badge JRA Kosong */}
            {jraRef ? (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${jraRef.keterangan === "Permanen" ? (isDarkMode ? "border-blue-800 text-blue-400 bg-blue-900/30" : "border-blue-200 text-blue-700 bg-blue-50") : isDarkMode ? "border-red-800 text-red-400 bg-red-900/30" : "border-red-200 text-red-700 bg-red-50"}`}
              >
                {dispositionTag}
              </span>
            ) : (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${isDarkMode ? "border-slate-700 text-slate-400 bg-slate-800" : "border-slate-200 text-slate-500 bg-slate-50"}`}
              >
                Belum Diset
              </span>
            )}

            {!isDestroyed && !isStatic && (
              <span
                className={`text-[10px] font-medium flex items-center gap-1 px-2 py-0.5 rounded ${isDarkMode ? "bg-slate-700 text-slate-300" : "bg-slate-50 text-slate-400"}`}
              >
                <History size={10} />{" "}
                {isActive
                  ? `Exp Aktif: ${res.retentionActiveDate || "-"}`
                  : `Exp Inaktif: ${res.retentionInactiveDate || "-"}`}
              </span>
            )}
            {activeTab === "physical" && (
              <span
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${isDarkMode ? "bg-slate-700 text-indigo-400" : "bg-slate-100 text-indigo-500"}`}
              >
                <MapPin size={10} />{" "}
                {physRefs.find((r) => r.id === res.physLocationId)?.name || "?"}
                /{physRefs.find((r) => r.id === res.physBoxId)?.name || "?"}
              </span>
            )}
            {activeTab === "digital" && (
              <span
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${isDarkMode ? "bg-slate-700 text-emerald-400" : "bg-slate-100 text-emerald-500"}`}
              >
                <HardDrive size={10} /> {res.digitalApp || "System"}
              </span>
            )}
          </div>
        </div>

        {!isBulkActive && (
          <div
            className={`flex flex-col gap-2 justify-center border-l pl-4 min-w-[40px] ${isDarkMode ? "border-slate-700" : "border-slate-100"}`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setViewResource(res);
              }}
              className={`p-2 rounded-lg transition-colors ${isDarkMode ? "text-slate-400 hover:text-indigo-400 hover:bg-slate-700" : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"}`}
              title="Lihat Detail"
            >
              <Info size={16} />
            </button>
            {res.archivalStatus !== "pending" && !isDestroyed && !isStatic && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPrintItem(res);
                }}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-700" : "text-slate-400 hover:text-slate-800 hover:bg-slate-100"}`}
                title="Cetak Label"
              >
                <Printer size={16} />
              </button>
            )}
            {res.archivalStatus !== "pending" &&
              (activeTab === "physical" || activeTab === "digital") &&
              !isDestroyed &&
              !isStatic && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedResource(res);
                  }}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? "text-slate-400 hover:text-indigo-400 hover:bg-slate-700" : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"}`}
                  title="Edit Data"
                >
                  <Edit3 size={16} />
                </button>
              )}
            {res.url && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(res.url, "_blank");
                }}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? "text-slate-400 hover:text-blue-400 hover:bg-slate-700" : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"}`}
                title="Buka File"
              >
                <Eye size={16} />
              </button>
            )}
            {isExpired && !res.isVital && !isDestroyed && !isStatic && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  initiateDisposition(
                    jraRef?.keterangan === "Permanen" ? "transfer" : "destroy",
                    res,
                  );
                }}
                className={`p-2 rounded-lg transition-colors ${jraRef?.keterangan === "Permanen" ? (isDarkMode ? "text-blue-400 hover:bg-slate-700" : "text-blue-400 hover:text-blue-600 hover:bg-blue-50") : isDarkMode ? "text-red-400 hover:bg-slate-700" : "text-red-400 hover:text-red-600 hover:bg-red-50"}`}
                title="Tindak Lanjut"
              >
                {jraRef?.keterangan === "Permanen" ? (
                  <Truck size={16} />
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };
  // 7.6.15. Komponen Render Helper: Bagian Daftar Arsip Berdasarkan Status
  const renderSection = (title, items, bulkType) => {
    if (items.length === 0) return null;
    const isThisBulkActive = bulkModeSection === bulkType;

    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h4
            className={`text-xs font-bold uppercase flex items-center gap-2 ${bulkType === "destroy" ? "text-red-500" : bulkType === "static" ? "text-blue-500" : "text-slate-500"}`}
          >
            {bulkType === "destroy" ? (
              <AlertTriangle size={14} />
            ) : bulkType === "static" ? (
              <Truck size={14} />
            ) : (
              <Clock size={14} />
            )}{" "}
            {title}{" "}
            <span className="bg-slate-100 px-2 rounded-full text-[10px]">
              {items.length}
            </span>
          </h4>
          {bulkType && (
            <div className="flex gap-2">
              {isThisBulkActive && (
                <>
                  <button
                    onClick={() =>
                      initiateDisposition(
                        bulkType === "destroy" ? "destroy" : "transfer",
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-md ${bulkType === "destroy" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}
                  >
                    Eksekusi ({selectedIds.size})
                  </button>
                  <button
                    onClick={() => handleSelectAll(items)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-200 text-slate-700 hover:bg-slate-300"
                  >
                    Pilih Semua
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  if (isThisBulkActive) {
                    setBulkModeSection(null);
                    setSelectedIds(new Set());
                  } else {
                    setBulkModeSection(bulkType);
                    setSelectedIds(new Set());
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${isThisBulkActive ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
              >
                {isThisBulkActive ? "Batal" : "Pilih Banyak"}
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((res) => renderCard(res))}
        </div>
        <div className="my-6 border-t border-dashed border-slate-200 dark:border-slate-700"></div>
      </div>
    );
  };

  // 7.6.16. Tampilan Antarmuka File Control Manager Utama
  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto">
      {/* Komponen Modal */}
      <ArchiveQRModal
        isOpen={!!printItem}
        onClose={() => setPrintItem(null)}
        data={printItem}
        classifications={classifications}
      />
      <ArchiveProcessModal
        isOpen={!!selectedResource}
        onClose={() => setSelectedResource(null)}
        resource={selectedResource}
        onSave={handleSaveArchive}
        isDarkMode={isDarkMode}
        classifications={classifications}
        jraList={jraList}
        physRefs={physRefs}
      />
      <ArchiveDetailModal
        isOpen={!!viewResource}
        onClose={() => setViewResource(null)}
        resource={viewResource}
        classifications={classifications}
        jraList={jraList}
        physRefs={physRefs}
        isDarkMode={isDarkMode}
        currentUser={user}
        onRestore={handleRestoreArchive}
        borrowings={borrowings}
      />
      <DispositionFormModal
        isOpen={dispositionModal.show}
        onClose={() => setDispositionModal({ show: false, type: "" })}
        type={dispositionModal.type}
        count={selectedIds.size || 1}
        onConfirm={executeDisposition}
        isDarkMode={isDarkMode}
      />
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      {/* Header & Navigasi Utama */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2
            className={`text-3xl font-extrabold ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            File Control
          </h2>
          <p
            className={`text-sm mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
          >
            Manajemen Arsip Terpadu.
          </p>
        </div>

        <div
          className={`flex p-1 rounded-2xl border overflow-x-auto max-w-full ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
        >
          {[
            {
              id: "pending",
              label: "Gantung",
              icon: ArchiveRestore,
              count: countStats("pending"),
              color: "text-orange-500",
            },
            {
              id: "physical",
              label: "Fisik",
              icon: FileBox,
              count: countStats("physical"),
              color: "text-indigo-500",
            },
            {
              id: "digital",
              label: "Digital",
              icon: HardDrive,
              count: countStats("digital"),
              color: "text-emerald-500",
            },
            {
              id: "arrangement",
              label: "Penataan",
              icon: Grid3X3,
              count: 0,
              color: "text-purple-500",
            },
            {
              id: "transactions",
              label: "Transaksi",
              icon: ArrowRightLeft,
              count: 0,
              color: "text-pink-500",
            },
            {
              id: "static",
              label: "Statis",
              icon: Truck,
              count: staticCount,
              color: "text-blue-500",
            },
            {
              id: "destroyed",
              label: "Musnah",
              icon: FileX,
              count: destroyedCount,
              color: "text-slate-400",
            },
            {
              id: "references",
              label: "Referensi",
              icon: BookOpen,
              count: 0,
              color: "text-teal-500",
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setBulkModeSection(null);
                setSelectedIds(new Set());
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === tab.id ? (isDarkMode ? "bg-slate-700 text-white shadow" : "bg-slate-900 text-white shadow") : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
            >
              <tab.icon
                size={16}
                className={activeTab === tab.id ? tab.color : ""}
              />
              <span>{tab.label}</span>
              {tab.id === "pending" && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === "references" ? (
          <div className="h-full flex flex-col">
            <div className="flex gap-2 mb-4 border-b pb-2 border-slate-200 dark:border-slate-700 overflow-x-auto">
              {[
                { id: "klasifikasi", l: "📌 Klasifikasi" },
                { id: "jra", l: "⏳ Jadwal Retensi" },
                { id: "lokasi", l: "📍 Lokasi Fisik" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setRefSubTab(t.id)}
                  className={`px-4 py-2 text-sm font-bold rounded-t-xl transition-all whitespace-nowrap ${refSubTab === t.id ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50 dark:bg-slate-800 dark:text-indigo-400" : "text-slate-500 hover:text-slate-800 dark:text-slate-400"}`}
                >
                  {t.l}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-hidden">
              {refSubTab === "klasifikasi" && (
                <ArchiveReferenceManager user={user} isDarkMode={isDarkMode} />
              )}
              {refSubTab === "jra" && (
                <JRAReferenceManager user={user} isDarkMode={isDarkMode} />
              )}
              {refSubTab === "lokasi" && (
                <PhysicalReferenceManager
                  user={user}
                  isDarkMode={isDarkMode}
                  physRefs={physRefs}
                  setPhysRefs={setPhysRefs}
                  resources={resources}
                />
              )}
            </div>
          </div>
        ) : activeTab === "transactions" ? (
          <ArchiveTransactionManager
            user={user}
            resources={allFilesForControl}
            setResources={(updater) => {
              // Interceptor yang sama untuk memecah update ke resources/archives
              const nextState =
                typeof updater === "function"
                  ? updater(allFilesForControl)
                  : updater;
              let newResources = [...(resources || [])];
              let newArchives = [...(archives || [])];
              nextState.forEach((updatedItem) => {
                if (updatedItem.isArchived) {
                  const archIndex = newArchives.findIndex(
                    (a) => a.id === updatedItem.archiveWrapperId,
                  );
                  if (archIndex > -1)
                    newArchives[archIndex] = {
                      ...newArchives[archIndex],
                      data: updatedItem,
                    };
                } else {
                  const resIndex = newResources.findIndex(
                    (r) => r.id === updatedItem.id,
                  );
                  if (resIndex > -1) newResources[resIndex] = updatedItem;
                }
              });
              setResources(newResources);
              if (setArchives) setArchives(newArchives);
            }}
            physRefs={physRefs}
            setPhysRefs={setPhysRefs}
            isDarkMode={isDarkMode}
            classifications={classifications}
            jraList={jraList}
            borrowings={borrowings}
            setBorrowings={setBorrowings}
            dispositionLogs={dispositionLogs}
            onOpenArchiveDetail={(res) => setViewResource(res)}
            onPrintQR={(res) => setPrintItem(res)}
            isDetailOpen={!!viewResource}
            moveLogs={moveLogs}
            setMoveLogs={setMoveLogs}
          />
        ) : activeTab === "arrangement" ? (
          // ==============================================================================
          // STEP 5: INTERCEPTOR SET-RESOURCES UNTUK FILE ARRANGEMENT MANAGER
          // ==============================================================================
          // Di sini kita melempar `allFilesForControl` ke komponen pengaturan agar file arsip juga bisa diatur lokasinya.
          // Kemudian kita membuat interceptor pada `setResources` agar saat selesai ditata,
          // perubahan state terpecah secara akurat kembali ke 'resources' ataupun 'archives'.
          /**
           * RENDERER: File Arrangement Manager
           * Komponen untuk mengelola tata letak fisik arsip dan wadah.
           * Dilengkapi dengan State Interceptor untuk sinkronisasi multi-tabel (Resources & Archives)
           * serta sistem Audit Trail (Move Logs).
           */

          <FileArrangementManager
            user={user}
            resources={allFilesForControl}
            physRefs={physRefs}
            isDarkMode={isDarkMode}
            classifications={classifications}
            jraList={jraList}
            borrowings={borrowings}
            // --- 1. INTERCEPTOR ARSIP (PENGELOMPOKAN LOG MASSAL) ---
            setResources={(updater) => {
              try {
                const nextState =
                  typeof updater === "function"
                    ? updater(allFilesForControl)
                    : updater;
                let newResources = [...(resources || [])];
                let newArchives = [...(archives || [])];

                let movedDocs = [];
                let lastTargetId = null;

                nextState.forEach((updatedItem) => {
                  const original = allFilesForControl.find(
                    (o) => o.id === updatedItem.id,
                  );
                  if (!original) return;

                  const isLocationChanged =
                    original.physFolderId !== updatedItem.physFolderId ||
                    original.physBoxId !== updatedItem.physBoxId ||
                    original.physRackId !== updatedItem.physRackId ||
                    original.physLocationId !== updatedItem.physLocationId;

                  if (isLocationChanged) {
                    lastTargetId =
                      updatedItem.physFolderId ||
                      updatedItem.physBoxId ||
                      updatedItem.physRackId ||
                      updatedItem.physLocationId;
                    const itemName =
                      updatedItem.title ||
                      original.title ||
                      updatedItem.name ||
                      original.name ||
                      updatedItem.archiveRegId ||
                      "Arsip Tanpa Judul";

                    // Kumpulkan item yang berpindah
                    movedDocs.push({
                      id: updatedItem.id,
                      name: itemName,
                      code: updatedItem.archiveRegId || "NO-ID",
                      type: "file",
                    });
                  }

                  if (updatedItem.isArchived) {
                    const archIndex = newArchives.findIndex(
                      (a) => a.id === updatedItem.archiveWrapperId,
                    );
                    if (archIndex > -1)
                      newArchives[archIndex] = {
                        ...newArchives[archIndex],
                        data: updatedItem,
                      };
                  } else {
                    const resIndex = newResources.findIndex(
                      (r) => r.id === updatedItem.id,
                    );
                    if (resIndex > -1) newResources[resIndex] = updatedItem;
                  }
                });

                // LOGIKA PENCATATAN LOG (Satuan vs Massal)
                if (movedDocs.length > 0) {
                  const target = physRefs.find((r) => r.id === lastTargetId);
                  const targetName = target ? target.name : "ROOT";

                  if (movedDocs.length === 1) {
                    const moveLog = {
                      id: `MV-LOG-${new Date().getTime()}-${Math.floor(Math.random() * 1000)}`,
                      date: new Date().toISOString(),
                      itemsCount: 1,
                      targetName: targetName,
                      user: user?.name || "Admin",
                      description: `ARSIP | Pindah lokasi: ${movedDocs[0].name}`,
                    };
                    setMoveLogs((prev) => [moveLog, ...prev]);
                  } else {
                    const moveLog = {
                      id: `MV-BLK-${new Date().getTime()}-${Math.floor(Math.random() * 1000)}`,
                      date: new Date().toISOString(),
                      itemsCount: movedDocs.length,
                      targetName: targetName,
                      user: user?.name || "Admin",
                      description: `MASSAL | Pindah massal (${movedDocs.length} Arsip)`,
                      movedItems: movedDocs, // Menampilkan Rincian Kotak-Kotak Item
                    };
                    setMoveLogs((prev) => [moveLog, ...prev]);
                  }
                }

                setResources(newResources);
                if (setArchives) setArchives(newArchives);
              } catch (err) {
                console.error("Gagal update arsip:", err);
              }
            }}
            // --- 2. INTERCEPTOR WADAH (PENGELOMPOKAN LOG MASSAL) ---
            setPhysRefs={(updater) => {
              try {
                const nextState =
                  typeof updater === "function" ? updater(physRefs) : updater;

                let movedWadah = [];
                let lastTargetId = null;

                nextState.forEach((updatedItem) => {
                  const original = physRefs.find(
                    (o) => o.id === updatedItem.id,
                  );
                  if (original && original.parentId !== updatedItem.parentId) {
                    lastTargetId = updatedItem.parentId;
                    const itemName =
                      updatedItem.name || updatedItem.code || "Tanpa Nama";
                    const itemType = (
                      updatedItem.type || "wadah"
                    ).toUpperCase();

                    // Kumpulkan wadah yang berpindah
                    movedWadah.push({
                      id: updatedItem.id,
                      name: itemName,
                      code: updatedItem.code || "NO-ID",
                      type: itemType,
                    });
                  }
                });

                // LOGIKA PENCATATAN LOG (Satuan vs Massal)
                if (movedWadah.length > 0) {
                  const target = nextState.find((r) => r.id === lastTargetId);
                  const targetName = target ? target.name : "ROOT";

                  if (movedWadah.length === 1) {
                    const moveLog = {
                      id: `MV-CTR-${new Date().getTime()}-${Math.floor(Math.random() * 1000)}`,
                      date: new Date().toISOString(),
                      itemsCount: 1,
                      targetName: targetName,
                      user: user?.name || "Admin",
                      description: `WADAH | Memindahkan [${movedWadah[0].type}] ${movedWadah[0].name}`,
                    };
                    setMoveLogs((prev) => [moveLog, ...prev]);
                  } else {
                    const moveLog = {
                      id: `MV-BLK-${new Date().getTime()}-${Math.floor(Math.random() * 1000)}`,
                      date: new Date().toISOString(),
                      itemsCount: movedWadah.length,
                      targetName: targetName,
                      user: user?.name || "Admin",
                      description: `MASSAL | Pindah massal (${movedWadah.length} Wadah)`,
                      movedItems: movedWadah, // Menampilkan Rincian Kotak-Kotak Item
                    };
                    setMoveLogs((prev) => [moveLog, ...prev]);
                  }
                }

                setPhysRefs(nextState);
              } catch (err) {
                console.error("Gagal update wadah:", err);
              }
            }}
          />
        ) : (
          <>
            {(activeTab === "physical" || activeTab === "digital") && (
              <div className="flex gap-2 mb-6 overflow-x-auto">
                <button
                  onClick={() => setSubTab("all")}
                  className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 whitespace-nowrap ${subTab === "all" ? "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-white dark:border-slate-600" : "bg-transparent text-slate-500 border-slate-200 dark:border-slate-700"}`}
                >
                  <Layers size={14} /> Semua
                </button>
                <button
                  onClick={() => setSubTab("active")}
                  className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 whitespace-nowrap ${subTab === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800" : "bg-transparent text-slate-500 border-slate-200 dark:border-slate-700"}`}
                >
                  <CheckCircle size={14} /> Aktif
                </button>
                <button
                  onClick={() => setSubTab("inactive")}
                  className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 whitespace-nowrap ${subTab === "inactive" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800" : "bg-transparent text-slate-500 border-slate-200 dark:border-slate-700"}`}
                >
                  <Clock size={14} /> Inaktif
                </button>
                <button
                  onClick={() => setSubTab("vital")}
                  className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 whitespace-nowrap ${subTab === "vital" ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800" : "bg-transparent text-slate-500 border-slate-200 dark:border-slate-700"}`}
                >
                  <Shield size={14} /> Arsip Vital
                </button>
              </div>
            )}

            {/* ========================================================= */}
            {/* SUB TAB STATIS DAN MUSNAH */}
            {/* ========================================================= */}
            {(activeTab === "static" || activeTab === "destroyed") && (
              <div className="flex gap-2 mb-6 overflow-x-auto animate-in fade-in slide-in-from-top-2">
                <button
                  onClick={() => setSubTab("all")}
                  className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 whitespace-nowrap ${subTab === "all" ? "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-white dark:border-slate-600" : "bg-transparent text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                >
                  <Layers size={14} /> Semua
                </button>
                <button
                  onClick={() => setSubTab("physical")}
                  className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 whitespace-nowrap ${subTab === "physical" ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800" : "bg-transparent text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                >
                  <FileBox size={14} /> Fisik
                </button>
                <button
                  onClick={() => setSubTab("digital")}
                  className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 whitespace-nowrap ${subTab === "digital" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800" : "bg-transparent text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                >
                  <HardDrive size={14} /> Digital
                </button>
              </div>
            )}
            {/* ========================================================= */}

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div
                className={`flex-1 flex items-center px-4 py-3 rounded-2xl border ${isDarkMode ? "bg-slate-800 border-slate-600" : "bg-white border-slate-200"}`}
              >
                <Search size={18} className="text-slate-400 mr-3" />
                <input
                  type="text"
                  placeholder="Cari dokumen..."
                  className={`bg-transparent border-none text-sm w-full focus:outline-none focus:ring-0 ${isDarkMode ? "text-white placeholder-slate-500" : "text-slate-900 placeholder-slate-400"}`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-2 items-center overflow-x-auto">
                <select
                  className={`px-3 py-3 rounded-2xl border text-xs font-bold ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-700"}`}
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                >
                  <option value="all">Semua Waktu</option>
                  <option value="year">Per Tahun</option>
                  <option value="month">Per Bulan</option>
                  <option value="range">Rentang</option>
                </select>

                {timeFilter === "year" && (
                  <input
                    type="number"
                    className={`w-20 px-3 py-3 rounded-2xl border text-xs ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-200"}`}
                    value={filterDate.year}
                    onChange={(e) =>
                      setFilterDate({ ...filterDate, year: e.target.value })
                    }
                  />
                )}

                {timeFilter === "month" && (
                  <input
                    type="month"
                    className={`px-3 py-3 rounded-2xl border text-xs ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-200"}`}
                    value={`${filterDate.year}-${String(filterDate.month + 1).padStart(2, "0")}`}
                    onChange={(e) => {
                      const d = new Date(e.target.value);
                      setFilterDate({
                        ...filterDate,
                        year: d.getFullYear(),
                        month: d.getMonth(),
                      });
                    }}
                  />
                )}

                {timeFilter === "range" && (
                  <div className="flex items-center gap-1">
                    <input
                      type="date"
                      className={`px-3 py-3 rounded-2xl border text-xs ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-200"}`}
                      value={filterDate.start}
                      onChange={(e) =>
                        setFilterDate({ ...filterDate, start: e.target.value })
                      }
                    />
                    <input
                      type="date"
                      className={`px-3 py-3 rounded-2xl border text-xs ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-200"}`}
                      value={filterDate.end}
                      onChange={(e) =>
                        setFilterDate({ ...filterDate, end: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
              {filteredResources.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 opacity-50 border-2 border-dashed rounded-3xl border-slate-200 dark:border-slate-700">
                  <ArchiveRestore size={48} className="mb-4 text-slate-300" />
                  <p className="italic">Tidak ada dokumen di kategori ini.</p>
                </div>
              ) : (
                <>
                  {(activeTab === "physical" || activeTab === "digital") &&
                  subTab === "inactive" ? (
                    <div>
                      {renderSection(
                        "Siap Dimusnahkan (Expired & Non-Permanen)",
                        filteredResources.filter(
                          (r) =>
                            r.dynamicStatus === "expired" &&
                            !r.isVital &&
                            jraList.find((j) => j.id === r.jraId)
                              ?.keterangan !== "Permanen",
                        ),
                        "destroy",
                      )}
                      {renderSection(
                        "Siap Diserahkan (Expired & Permanen)",
                        filteredResources.filter(
                          (r) =>
                            r.dynamicStatus === "expired" &&
                            jraList.find((j) => j.id === r.jraId)
                              ?.keterangan === "Permanen",
                        ),
                        "static",
                      )}
                      {renderSection(
                        "Menunggu Masa Retensi",
                        filteredResources.filter(
                          (r) => r.dynamicStatus === "inactive",
                        ),
                        null,
                      )}
                    </div>
                  ) : activeTab === "pending" ? (
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 pt-2">
                      {currentItems.map((res) => (
                        <div
                          key={res.id}
                          className={`relative p-5 rounded-[1.5rem] border transition-all hover:-translate-y-1 hover:shadow-xl group flex flex-col h-full justify-between ${isDarkMode ? "bg-slate-800 border-slate-700 hover:border-orange-500/50" : "bg-white border-slate-100 hover:border-orange-200 shadow-sm"}`}
                        >
                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${res.type === "file" ? "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600" : "bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600"}`}
                              >
                                {res.type === "file" ? (
                                  <FileText size={24} />
                                ) : (
                                  <ExternalLink size={24} />
                                )}
                              </div>
                              <div className="flex gap-2">
                                {res.url && (
                                  <button
                                    onClick={() =>
                                      window.open(res.url, "_blank")
                                    }
                                    className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
                                    title="Lihat File"
                                  >
                                    <Eye size={16} />
                                  </button>
                                )}
                                <span className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] font-bold px-2 py-1.5 rounded-xl uppercase tracking-wider self-start">
                                  Pending
                                </span>
                              </div>
                            </div>
                            {res.number && (
                              <p className="text-[10px] font-mono text-slate-400 mb-1">
                                No: {res.number}
                              </p>
                            )}
                            <h4
                              className={`font-bold text-base mb-2 line-clamp-2 leading-snug ${isDarkMode ? "text-white" : "text-slate-800"}`}
                            >
                              {res.title || res.name}
                            </h4>
                            <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                              {res.description ||
                                res.content ||
                                "Dokumen belum terklasifikasi."}
                            </p>
                          </div>
                          <div className="pt-4 border-t border-dashed border-slate-200 dark:border-slate-700 mt-auto">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-3 font-mono">
                              <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded-lg">
                                <CalendarIcon size={10} />{" "}
                                {res.date
                                  ? new Date(res.date).toLocaleDateString()
                                  : "-"}
                              </span>
                            </div>
                            <button
                              onClick={() => setSelectedResource(res)}
                              className="w-full py-3 bg-slate-900 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 group"
                            >
                              <ArchiveRestore
                                size={16}
                                className="group-hover:rotate-12 transition-transform"
                              />{" "}
                              Proses Pemberkasan
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                      {currentItems.map((res) => renderCard(res))}
                    </div>
                  )}

                  <div className="mt-8 pb-4">
                    <PaginationControl
                      totalItems={filteredResources.length}
                      itemsPerPage={itemsPerPage}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                      onItemsPerPageChange={setItemsPerPage}
                      isDarkMode={isDarkMode}
                    />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ==================================================================================
// 7.7. KOMPONEN MODAL PINDAH WADAH ARSIP (MOVE CONTAINER MODAL)
// ==================================================================================
export const MoveContainerModal = ({
  isOpen,
  onClose,
  item,
  currentParentId,
  allRefs,
  onMove,
  isDarkMode,
}) => {
  const [targetId, setTargetId] = React.useState("");

  // 7.7.1. Logika Penentuan Jenis Wadah Tujuan yang Valid Berdasarkan Item Saat Ini
  let targetType = "";
  let labelTarget = "";

  if (item?.type === "rack") {
    targetType = "location";
    labelTarget = "Gedung / Ruang";
  } else if (item?.type === "box") {
    targetType = "rack";
    labelTarget = "Lemari / Rak";
  } else if (item?.type === "folder") {
    targetType = "box";
    labelTarget = "Boks Arsip";
  } else if (item?.type === "file") {
    targetType = "folder";
    labelTarget = "Folder / Map";
  }

  // Filter daftar tujuan sesuai standar hierarki
  // NOTE: Anda bisa menambahkan logika di sini jika ingin mengizinkan "Loose Move"
  // Misal: File bisa masuk langsung ke Box tanpa Folder. Tapi untuk sekarang kita ikut standar dulu.
  const targetOptions = allRefs.filter((ref) => ref.type === targetType);

  // 7.7.2. Fungsi Eksekusi Pemindahan Wadah / Arsip
  const handleSubmit = () => {
    if (!targetId) return alert(`Pilih ${labelTarget} tujuan terlebih dahulu.`);
    onMove(item, targetId);
    onClose();
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
      <div
        className={`w-full max-w-sm rounded-[2rem] shadow-2xl p-6 border ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-100"}`}
      >
        {/* Header Modal Move */}
        <div className="flex justify-between items-center mb-6">
          <h3
            className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            Pindahkan {item.type === "file" ? "Arsip" : "Wadah"}
          </h3>
          <button onClick={onClose}>
            <X size={20} className="text-slate-400 hover:text-red-500" />
          </button>
        </div>

        {/* Info Box Item Yang Dipilih */}
        <div
          className={`p-4 rounded-xl mb-6 border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}
        >
          <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">
            Item yang dipindahkan
          </p>
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${item.type === "file" ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"}`}
            >
              {item.type === "file" ? (
                <FileText size={18} />
              ) : (
                <Box size={18} />
              )}
            </div>
            <div className="overflow-hidden">
              <p
                className={`font-bold text-sm truncate ${isDarkMode ? "text-white" : "text-slate-800"}`}
              >
                {item.name || item.title}
              </p>
              <p className="text-xs font-mono text-slate-500">
                {item.code || item.number || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Form Pilihan Destinasi */}
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">
              Pindahkan ke {labelTarget} Baru
            </label>
            <select
              className={`w-full px-4 py-3 rounded-xl border text-sm font-medium ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-700"}`}
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
            >
              <option value="">-- Pilih Tujuan --</option>
              {targetOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.code} - {opt.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-[1.02]"
          >
            <ArrowRightLeft size={18} /> Simpan Perpindahan
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================================================================================
// 7.8. KOMPONEN MENU KONTEKS (CONTEXT MENU) UNTUK PENATAAN ARSIP
// ==================================================================================
export const ArrangementContextMenu = ({
  position,
  target,
  onClose,
  onAction,
  clipboardMode,
  allowCreate,
  allowMoveHere,
}) => {
  if (!position) return null;

  // 7.8.1. Deteksi Jenis Target Klik Kanan
  const isFile = target?.type === "file";
  const isContainer = target && !isFile;
  const isBackground = !target;

  return (
    <div
      className="fixed z-[100] bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 w-56 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
      style={{ top: position.y, left: position.x }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 7.8.2. Menu untuk Klik di Area Kosong (Background) */}
      {isBackground && (
        <>
          {allowCreate && (
            <button
              onClick={() => {
                onAction("create");
                onClose();
              }}
              className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
            >
              <PlusSquare size={14} /> Buat Baru (Ctrl+N)
            </button>
          )}
          {clipboardMode && (
            <button
              onClick={() => {
                onAction("paste");
                onClose();
              }}
              className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-indigo-600 border-t border-slate-100 dark:border-slate-700"
            >
              <CheckSquare size={14} /> Tempel (Ctrl+V)
            </button>
          )}
        </>
      )}

      {/* 7.8.3. Menu untuk Klik pada Item (Wadah atau File) */}
      {(isContainer || isFile) && (
        <>
          {/* Header Info Item */}
          <div className="px-4 py-2 text-[10px] font-mono text-slate-400 border-b border-slate-100 dark:border-slate-700 truncate bg-slate-50 dark:bg-slate-800/50">
            {target.code || target.archiveRegId || "ITEM"}
          </div>

          {isContainer && (
            <button
              onClick={() => {
                onAction("open");
                onClose();
              }}
              className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
            >
              <FolderOpen size={14} /> Buka
            </button>
          )}

          {/* FITUR: PINDAHKAN KE SINI (Hanya di Container) */}
          {allowMoveHere && (
            <button
              onClick={() => {
                onAction("move_here");
                onClose();
              }}
              className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 border-b border-slate-100 dark:border-slate-700"
            >
              <ArrowDownToLine size={14} /> 📥 Pindahkan ke Sini...
            </button>
          )}

          {!isFile && (
            <button
              onClick={() => {
                onAction("copy");
                onClose();
              }}
              className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
            >
              <Copy size={14} /> Salin (Ctrl+C)
            </button>
          )}

          <button
            onClick={() => {
              onAction("cut");
              onClose();
            }}
            className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
          >
            <Scissors size={14} /> Potong (Ctrl+X)
          </button>

          {!isFile && (
            <button
              onClick={() => {
                onAction("move_modal");
                onClose();
              }}
              className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
            >
              <ArrowRightCircle size={14} /> Pindahkan ke...
            </button>
          )}

          <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>

          {isContainer && (
            <>
              <button
                onClick={() => {
                  onAction("edit");
                  onClose();
                }}
                className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
              >
                <MoreVertical size={14} /> Ubah Data
              </button>
              <button
                onClick={() => {
                  onAction("print");
                  onClose();
                }}
                className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
              >
                <Printer size={14} /> Cetak Label
              </button>
            </>
          )}

          {isFile && (
            <button
              onClick={() => {
                onAction("print_file");
                onClose();
              }}
              className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
            >
              <Printer size={14} /> Cetak QR Arsip
            </button>
          )}

          <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>

          <button
            onClick={() => {
              onAction("delete");
              onClose();
            }}
            className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 flex items-center gap-2"
          >
            <X size={14} /> Hapus
          </button>
        </>
      )}
    </div>
  );
};

// ==================================================================================
// 7.9. KOMPONEN PENGELOLA PENATAAN ARSIP (FILE ARRANGEMENT MANAGER)
// ==================================================================================
export const FileArrangementManager = ({
  user,
  resources,
  setResources,
  physRefs,
  setPhysRefs,
  isDarkMode,
  classifications = [],
  jraList = [],
  borrowings = [],
}) => {
  // 7.9.1. Inisialisasi State Dasar (Path, Menu, Clipboard)
  const [path, setPath] = React.useState([]);
  const [contextMenu, setContextMenu] = React.useState(null);
  const [clipboard, setClipboard] = React.useState(null);

  // 7.9.2. State Pemilihan (Selection) dan Drag-and-Drop
  const [selectedIds, setSelectedIds] = React.useState(new Set());
  const [draggedIds, setDraggedIds] = React.useState(null);

  // 7.9.3. State Penomoran Halaman (Pagination)
  const [filePage, setFilePage] = React.useState(1);
  const [filesPerPage, setFilesPerPage] = React.useState(10);
  const [containerPage, setContainerPage] = React.useState(1);
  const [containersPerPage, setContainersPerPage] = React.useState(10);

  // 7.9.4. State Jendela Modal dan Konfirmasi
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState(null);
  const [printItem, setPrintItem] = React.useState(null);
  const [printFileItem, setPrintFileItem] = React.useState(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState({
    show: false,
    items: [],
  });
  // Timestamp key untuk mereset modal Move setiap kali dibuka
  const [moveModal, setMoveModal] = React.useState({
    show: false,
    item: null,
    timestamp: 0,
  });

  // 7.9.5. State Tampilan Info dan Peringatan
  const [viewResource, setViewResource] = React.useState(null);
  const [containerInfo, setContainerInfo] = React.useState(null);
  const [hierarchyAlert, setHierarchyAlert] = React.useState({
    show: false,
    message: "",
  });
  const [bulkMoveData, setBulkMoveData] = React.useState({
    show: false,
    targetContainer: null,
  });
  // FITUR: State Pencarian Cepat Penataan
  const [searchQuery, setSearchQuery] = React.useState("");

  // NEW: State untuk menyimpan history folder agar bisa Forward
  const [forwardPath, setForwardPath] = React.useState([]);

  // TAMBAHAN: State untuk pemicu Modal Pratinjau Cetak A4
  const [printA4Data, setPrintA4Data] = React.useState(null);
  const [moveAlert, setMoveAlert] = React.useState({ show: false, message: "" });

  // 7.9.6. Fungsi Helper: Pembuatan ID dan Kode Global Berurutan
  const generateId = (prefix) =>
    `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const getMaxNumberGlobal = (type) => {
    const year = new Date().getFullYear();
    const allOfType = physRefs.filter((r) => r.type === type);
    let maxNum = 0;
    allOfType.forEach((r) => {
      const parts = (r.code || "").split("-");
      if (parts.length >= 3 && parts[1] == year) {
        const num = parseInt(parts[2]);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    return maxNum;
  };

  const generateNextCode = (type) => {
    const prefixMap = {
      location: "LOC",
      rack: "RAK",
      box: "BOX",
      folder: "MAP",
    };
    const prefix = prefixMap[type] || "ITEM";
    const year = new Date().getFullYear(); // Ambil tahun saat ini
    const padding = type === "folder" ? 4 : 3;

    // 1. Filter wadah berdasarkan tipe yang sama DAN tahun yang sama
    const itemsThisYear = physRefs.filter(
      (r) => r.type === type && r.code && r.code.includes(`-${year}-`),
    );

    // 2. Cari angka urutan terbesar (Max) khusus di tahun ini
    let maxNum = 0;
    if (itemsThisYear.length > 0) {
      // Ekstrak angka urut (misal dari "BOX-2026-015", ambil "015" dan jadikan angka 15)
      const numbers = itemsThisYear.map((item) => {
        const parts = item.code.split("-");
        const numStr = parts[parts.length - 1]; // Ambil elemen paling belakang
        return parseInt(numStr, 10) || 0;
      });
      maxNum = Math.max(...numbers);
    }

    // 3. Gabungkan Prefix - Tahun - (Angka Terbesar + 1 dengan Padding)
    return `${prefix}-${year}-${String(maxNum + 1).padStart(padding, "0")}`;
  };

  // 7.9.7. Kalkulasi Variabel Lingkungan Saat Ini (Current State Level)
  const currentContainer = path.length > 0 ? path[path.length - 1] : null;
  const currentParentId = currentContainer ? currentContainer.id : "";

  let typeToCreate = "location";
  if (currentContainer?.type === "location") typeToCreate = "rack";
  else if (currentContainer?.type === "rack") typeToCreate = "box";
  else if (currentContainer?.type === "box") typeToCreate = "folder";
  else if (currentContainer?.type === "folder") typeToCreate = null;

  // 7.9.8. Logika Pengambilan Data (Data Fetching) & Filter Pencarian
  const getContainers = () =>
    physRefs
      .filter((r) =>
        currentParentId === ""
          ? r.type === "location"
          : r.parentId === currentContainer.id,
      )
      .sort((a, b) => (a.code || a.name).localeCompare(b.code || b.name));

  const getAllFiles = () =>
    resources
      .filter((r) => {
        // IMPLEMENTASI: Mengakomodasi arsip fisik dan digital dalam penataan
        if (r.archivalStatus !== "physical" && r.archivalStatus !== "digital")
          return false;

        // FITUR: Menyembunyikan arsip fisik yang telah berakhir masa aktifnya (Musnah / Statis)
        const fileStatus = (r.status || "").toLowerCase().trim();
        if (
          r.archivalStatus === "physical" &&
          (fileStatus === "destroyed" || fileStatus === "static")
        ) {
          return false;
        }

        const myParent =
          r.physFolderId || r.physBoxId || r.physRackId || r.physLocationId;

        // Jika di Root, tampilkan file yang belum memiliki lokasi
        if (currentParentId === "") {
          return !myParent;
        } else {
          return myParent === currentContainer?.id;
        }
      })
      .sort((a, b) => (a.title || "").localeCompare(b.title || ""));

  let allContainersList = getContainers();
  let allFilesList = getAllFiles();

  // FITUR: Eksekusi Pencarian Real-time
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    allContainersList = allContainersList.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.code || "").toLowerCase().includes(q),
    );
    allFilesList = allFilesList.filter(
      (f) =>
        (f.title || f.name || "").toLowerCase().includes(q) ||
        (f.archiveRegId || "").toLowerCase().includes(q),
    );
  }

  const allItems = [...allContainersList, ...allFilesList];

  // 7.9.9. Logika Pembagian Halaman (Pagination Logic)
  // Untuk Wadah (Containers)
  const idxLastCont =
    containersPerPage === "all"
      ? allContainersList.length
      : containerPage * containersPerPage;
  const idxFirstCont =
    containersPerPage === "all" ? 0 : idxLastCont - containersPerPage;
  const currentContainers = allContainersList.slice(idxFirstCont, idxLastCont);
  const totalContainerPages =
    containersPerPage === "all"
      ? 1
      : Math.ceil(allContainersList.length / containersPerPage);

  // Untuk Berkas (Files)
  const idxLastFile =
    filesPerPage === "all" ? allFilesList.length : filePage * filesPerPage;
  const idxFirstFile = filesPerPage === "all" ? 0 : idxLastFile - filesPerPage;
  const currentFiles = allFilesList.slice(idxFirstFile, idxLastFile);
  const totalFilePages =
    filesPerPage === "all" ? 1 : Math.ceil(allFilesList.length / filesPerPage);

  // 7.9.10. Fungsi Validasi Aturan Hierarki Penataan
  const validateHierarchy = (itemType, targetType) => {
    if (itemType === "file") return true;
    const levels = { root: 0, location: 1, rack: 2, box: 3, folder: 4 };
    const itemLevel = levels[itemType];
    const targetLevel = levels[targetType || "root"];
    if (itemLevel === targetLevel + 1) return true;
    return false;
  };

  const getTypeName = (t) =>
    t === "location"
      ? "Gedung"
      : t === "rack"
        ? "Rak"
        : t === "box"
          ? "Box"
          : t === "folder"
            ? "Folder"
            : "Root";

  // 7.9.11. Fungsi Handler Navigasi Maju Mundur (Back/Forward)
  const handleBack = () => {
    if (path.length === 0) return;
    const currentItem = path[path.length - 1]; // Ambil item yang akan ditinggalkan
    const newPath = path.slice(0, -1);
    setPath(newPath);
    // Simpan item ke forwardPath (LIFO - Last In First Out)
    setForwardPath([currentItem, ...forwardPath]);
    // Reset view
    setSelectedIds(new Set());
    setFilePage(1);
    setContainerPage(1);
  };

  const handleForward = () => {
    if (forwardPath.length === 0) return;
    const nextItem = forwardPath[0]; // Ambil item tujuan maju
    const newForwardPath = forwardPath.slice(1); // Hapus dari antrian forward
    setPath([...path, nextItem]);
    setForwardPath(newForwardPath);
    // Reset view
    setSelectedIds(new Set());
    setFilePage(1);
    setContainerPage(1);
  };

  // 7.9.12. Fungsi Handler Aksi Penyimpanan dan Pemindahan
  const handleSaveContainer = (formData) => {
    if (editingItem) {
      setPhysRefs((prev) =>
        prev.map((r) => (r.id === editingItem.id ? { ...r, ...formData } : r)),
      );
    } else {
      setPhysRefs((prev) => [
        ...prev,
        {
          id: generateId("phys"),
          type: typeToCreate || "box",
          parentId: currentParentId,
          ...formData,
          code: formData.code || generateNextCode(typeToCreate || "box"),
        },
      ]);
    }
    setIsFormOpen(false);
  };

  // Helper: Mengeksekusi perpindahan banyak item dalam 1 kali render (Batch Update)
  const executeBulkMove = (dataItems, targetContainer) => {
    if (!dataItems || !Array.isArray(dataItems)) return;
    const targetId = targetContainer ? targetContainer.id : "root";
    const targetType = targetContainer ? targetContainer.type : "root";

    const movedResources = [];
    const movedRefs = [];

    dataItems.forEach((item) => {
      if (!item) return;
      if (item.id === targetId) return;

      // IDENTIFIKASI ARSIP SUPER KUAT
      const isFile = !!item.archiveRegId || item.type === "file";

      if (isFile) {
        let locs = {
          physFolderId: "",
          physBoxId: "",
          physRackId: "",
          physLocationId: "",
        };
        if (targetContainer && targetId !== "root") {
          if (targetType === "folder") {
            locs.physFolderId = targetId;
            locs.physBoxId = targetContainer.parentId || "";
            const b = physRefs.find((x) => x.id === targetContainer.parentId);
            if (b) {
              locs.physRackId = b.parentId || "";
              const r = physRefs.find((x) => x.id === b.parentId);
              if (r) locs.physLocationId = r.parentId || "";
            }
          } else if (targetType === "box") {
            locs.physBoxId = targetId;
            locs.physRackId = targetContainer.parentId || "";
            const r = physRefs.find((x) => x.id === targetContainer.parentId);
            if (r) locs.physLocationId = r.parentId || "";
          } else if (targetType === "rack") {
            locs.physRackId = targetId;
            locs.physLocationId = targetContainer.parentId || "";
          } else if (targetType === "location") {
            locs.physLocationId = targetId;
          }
        }
        movedResources.push({ ...item, ...locs });
      } else {
        movedRefs.push({
          ...item,
          parentId: targetId === "root" ? "" : targetId,
        });
      }
    });

    if (movedResources.length > 0) {
      setResources((prev) => {
        if (!prev) return prev;
        return prev.map((r) => {
          const match = movedResources.find((m) => m.id === r.id);
          return match || r;
        });
      });
    }
    if (movedRefs.length > 0) {
      setPhysRefs((prev) => {
        if (!prev) return prev;
        return prev.map((r) => {
          const match = movedRefs.find((m) => m.id === r.id);
          return match || r;
        });
      });
    }
  };

  const handleExecuteMove = (item, newParentId) => {
    const targetContainer = physRefs.find((r) => r.id === newParentId) || null;
    const targetType = targetContainer ? targetContainer.type : "root";

    if (!validateHierarchy(item.type, targetType)) {
      setHierarchyAlert({
        show: true,
        message: `Gagal Pindah. "${getTypeName(item.type)}" tidak boleh masuk ke "${getTypeName(targetType)}".`,
      });
      return;
    }
    executeBulkMove([item], targetContainer);
  };

  // 7.9.13. Logika Tempel Berurutan (Sequential Paste Logic)
  const handlePaste = () => {
    if (!clipboard || clipboard.items.length === 0) return;
    const { items, mode } = clipboard;
    const targetType = currentContainer ? currentContainer.type : "root";
    const invalidItem = items.find(
      (i) => !validateHierarchy(i.type, targetType),
    );

    if (invalidItem) {
      setHierarchyAlert({
        show: true,
        message: `Gagal Paste. "${getTypeName(invalidItem.type)}" tidak sesuai hierarki di sini.`,
      });
      return;
    }

    if (mode === "copy") {
      const newItems = [];
      const itemsByType = items.reduce((acc, item) => {
        if (item.type !== "file") {
          if (!acc[item.type]) acc[item.type] = [];
          acc[item.type].push(item);
        }
        return acc;
      }, {});

      Object.keys(itemsByType).forEach((type) => {
        const typeItems = itemsByType[type];
        const prefixMap = {
          location: "LOC",
          rack: "RAK",
          box: "BOX",
          folder: "MAP",
        };
        const prefix = prefixMap[type] || "ITEM";
        const year = new Date().getFullYear();
        const padding = type === "folder" ? 4 : 3;

        // 1. CARI ANGKA MAKSIMUM HANYA UNTUK TAHUN INI (Yearly Reset Logic)
        const itemsThisYear = physRefs.filter(
          (r) => r.type === type && r.code && r.code.includes(`-${year}-`),
        );

        let maxNum = 0;
        if (itemsThisYear.length > 0) {
          const numbers = itemsThisYear.map((item) => {
            const parts = item.code.split("-");
            const numStr = parts[parts.length - 1];
            return parseInt(numStr, 10) || 0;
          });
          maxNum = Math.max(...numbers);
        }

        // 2. LOOPING ITEM YANG DI-PASTE SECARA BERURUTAN
        typeItems.forEach((item, index) => {
          const nextNum = maxNum + 1 + index; // Tambahkan index agar tidak ada duplikat saat multi-paste
          const nextCode = `${prefix}-${year}-${String(nextNum).padStart(padding, "0")}`;

          newItems.push({
            ...item,
            id: `phys-${new Date().getTime().toString(36)}-${index}`, // Pastikan format ID internal phys- tetap terjaga
            parentId: currentParentId,
            code: nextCode,
            name: `${item.name} (Copy)`,
          });
        });
      });

      if (newItems.length > 0) setPhysRefs((prev) => [...prev, ...newItems]);
    } else {
      // MULTI-SELECT CUT & PASTE
      executeBulkMove(items, currentContainer);
    }
    setClipboard(null);
  };

  const getAllDescendantIds = (parentId) => {
    let ids = [];
    const children = physRefs.filter((r) => r.parentId === parentId);
    for (let child of children) {
      ids.push(child.id);
      ids = ids.concat(getAllDescendantIds(child.id));
    }
    return ids;
  };

  const handleDelete = () => {
    let refsToDelete = [];
    let filesToUpdate = [];

    deleteConfirm.items.forEach((i) => {
      if (i.type === "file") {
        filesToUpdate.push(i.id);
      } else {
        refsToDelete.push(i.id);
        // IMPLEMENTASI: Masukkan juga seluruh id anak cucunya untuk dihapus bersamaan
        refsToDelete = refsToDelete.concat(getAllDescendantIds(i.id));
      }
    });

    // Update State secara terpusat (Batch) untuk menghindari re-render berlebih
    if (filesToUpdate.length > 0) {
      setResources((p) =>
        p.map((r) =>
          filesToUpdate.includes(r.id)
            ? {
                ...r,
                physLocationId: "",
                physRackId: "",
                physBoxId: "",
                physFolderId: "",
              }
            : r,
        ),
      );
    }
    if (refsToDelete.length > 0) {
      setPhysRefs((p) => p.filter((r) => !refsToDelete.includes(r.id)));
    }

    setDeleteConfirm({ show: false, items: [] });
  };

  // 7.9.14. Logika Cetak Data ke Format A4 (A4 Print Logic)
  const handlePrintA4 = () => {
    if (!containerInfo) return;
    // PERBAIKAN: Menghapus window.open dan menggantinya dengan Modal UI React
    setPrintA4Data(containerInfo);
  };

  // 7.9.15. Fungsi Handler Interaksi Mouse dan Drag-Drop
  const handleItemClick = (e, item) => {
    e.stopPropagation();
    setContextMenu(null);
    const newSelected = new Set(e.ctrlKey || e.metaKey ? selectedIds : []);
    if (newSelected.has(item.id)) {
      if (e.ctrlKey || e.metaKey) newSelected.delete(item.id);
      else {
        newSelected.clear();
        newSelected.add(item.id);
      }
    } else newSelected.add(item.id);
    setSelectedIds(newSelected);
  };

  const handleItemDoubleClick = (e, item) => {
    e.stopPropagation();
    setContextMenu(null);
    if (item.type !== "file") {
      setPath([...path, item]);
      setForwardPath([]); // RESET FORWARD PATH
      setSelectedIds(new Set());
      setFilePage(1);
      setContainerPage(1);
    }
  };

  const handleBackgroundClick = (e) => {
    setContextMenu(null);
    if (e.target === e.currentTarget) setSelectedIds(new Set());
  };

  const handleContextMenu = (e, item = null) => {
    e.preventDefault();
    e.stopPropagation();
    let newSelected = new Set(selectedIds);
    if (item && !selectedIds.has(item.id)) newSelected = new Set([item.id]);
    if (!item) newSelected = new Set();
    setSelectedIds(newSelected);
    setContextMenu({ x: e.clientX, y: e.clientY, target: item });
  };

  const handleDragStart = (e, item) => {
    let ids = selectedIds;
    if (!ids.has(item.id)) {
      ids = new Set([item.id]);
      setSelectedIds(ids);
    }
    setDraggedIds(ids);
    e.dataTransfer.setData("text", item.id);
  };

  const handleDragEnd = () => setDraggedIds(null);

  const handleDrop = (e, target) => {
    e.preventDefault();
    if (!draggedIds || target.type === "file") return;

    const items = allItems.filter((i) => draggedIds.has(i.id));
    const invalid = items.find((i) => !validateHierarchy(i.type, target.type));
    if (invalid) {
      setHierarchyAlert({
        show: true,
        message: `Gagal memindahkan "${getTypeName(invalid.type)}" ke dalam "${getTypeName(target.type)}". Hierarki tidak valid.`,
      });
      setDraggedIds(null);
      return;
    }

    // MULTI-SELECT DRAG & DROP
    executeBulkMove(items, target);
    setDraggedIds(null);
  };

  const handleDragOver = (e, target) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // 7.9.16. Router Aksi dari Menu Konteks

  // Helper: Mengecek apakah container memiliki arsip (sampai level terbawah)
  const checkHasFiles = (containerId) => {
    // 1. Cek file yang menempel langsung ke id ini (entah sebagai folder, box, rak, atau gedung)
    const hasDirectFiles = resources.some(
      (r) =>
        r.physLocationId === containerId ||
        r.physRackId === containerId ||
        r.physBoxId === containerId ||
        r.physFolderId === containerId,
    );
    if (hasDirectFiles) return true;

    // 2. Cek anak-anak containernya secara rekursif
    const children = physRefs.filter((ref) => ref.parentId === containerId);
    for (let child of children) {
      if (checkHasFiles(child.id)) return true;
    }
    return false;
  };
  const handleAction = (action) => {
    const target = contextMenu?.target;
    if (action === "create") {
      if (!typeToCreate) return;
      setEditingItem(null);
      setIsFormOpen(true);
    } else if (action === "edit") {
      setEditingItem(target);
      setIsFormOpen(true);
    } else if (action === "open") {
      setPath([...path, target]);
      setFilePage(1);
      setContainerPage(1);
    } else if (action === "cut") {
      setClipboard({
        items: Array.from(selectedIds).map((id) =>
          allItems.find((x) => x.id === id),
        ),
        mode: "cut",
      });
    } else if (action === "copy") {
      setClipboard({
        items: Array.from(selectedIds).map((id) =>
          allItems.find((x) => x.id === id),
        ),
        mode: "copy",
      });
    } else if (action === "paste") handlePaste();
    else if (action === "delete") {
      const itemsToDelete = Array.from(selectedIds).map((id) =>
        allItems.find((x) => x.id === id),
      );
      let cannotDelete = false;

      // Cek setiap item yang dipilih, jika dia wadah dan berisi file, blokir!
      for (let item of itemsToDelete) {
        if (item.type !== "file" && checkHasFiles(item.id)) {
          cannotDelete = true;
          break;
        }
      }

      if (cannotDelete) {
        setHierarchyAlert({
          show: true,
          message:
            "Aksi Ditolak: Wadah ini (atau sub-wadahnya) masih berisi arsip. Pindahkan atau hapus arsip di dalamnya terlebih dahulu.",
        });
      } else {
        setDeleteConfirm({ show: true, items: itemsToDelete });
      }
    } else if (action === "print") setPrintItem(target);
    else if (action === "print_file") setPrintFileItem(target);
    else if (action === "move_modal")
      setMoveModal({ show: true, item: target, timestamp: Date.now() });
    else if (action === "move_here")
      setBulkMoveData({ show: true, targetContainer: target });
    setContextMenu(null);
  };

  // 7.9.17. Efek Samping: Pengaturan Tombol Pintasan Keyboard (Shortcuts)
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Abaikan jika sedang mengetik di input/textarea
      if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName))
        return;

      const key = e.key.toLowerCase();
      const isCtrl = e.ctrlKey || e.metaKey;

      // Copy (Ctrl + C)
      if (isCtrl && key === "c") {
        e.preventDefault();
        const items = allItems.filter((i) => selectedIds.has(i.id));
        if (items.length > 0) setClipboard({ items, mode: "copy" });
      }
      // Cut (Ctrl + X)
      if (isCtrl && key === "x") {
        e.preventDefault();
        const items = allItems.filter((i) => selectedIds.has(i.id));
        if (items.length > 0) setClipboard({ items, mode: "cut" });
      }
      // Paste (Ctrl + V)
      if (isCtrl && key === "v") {
        e.preventDefault();
        if (clipboard) handlePaste();
      }
      // Select All (Ctrl + A)
      if (isCtrl && key === "a") {
        e.preventDefault();
        setSelectedIds(new Set(allItems.map((i) => i.id)));
      }
      // Buat Baru (Ctrl + N)
      if (isCtrl && key === "n") {
        e.preventDefault();
        if (typeToCreate) {
          setEditingItem(null);
          setIsFormOpen(true);
        }
      }
      // Delete (Del)
      if (e.key === "Delete") {
        e.preventDefault();
        const items = allItems.filter((i) => selectedIds.has(i.id));
        if (items.length > 0) setDeleteConfirm({ show: true, items });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, clipboard, allItems, typeToCreate, path]); // Dependency lengkap agar responsif

  // 7.9.18. Helper Pengaturan Tema Tampilan Kartu Berdasarkan Tipe (FIXED DARK MODE)
  const getCardConfig = (type, isDark) => {
    switch (type) {
      case "location":
        return {
          bg: isDark ? "bg-emerald-900/40" : "bg-emerald-50",
          border: isDark ? "border-emerald-800" : "border-emerald-100",
          text: isDark ? "text-emerald-400" : "text-emerald-600",
          label: "LOCATION",
          icon: MapPin,
        };
      case "rack":
        return {
          bg: isDark ? "bg-indigo-900/40" : "bg-indigo-50",
          border: isDark ? "border-indigo-800" : "border-indigo-100",
          text: isDark ? "text-indigo-400" : "text-indigo-600",
          label: "RACK",
          icon: Server,
        };
      case "box":
        return {
          bg: isDark ? "bg-amber-900/40" : "bg-amber-50",
          border: isDark ? "border-amber-800" : "border-amber-100",
          text: isDark ? "text-amber-400" : "text-amber-600",
          label: "BOX",
          icon: Box,
        };
      case "folder":
        return {
          bg: isDark ? "bg-blue-900/40" : "bg-blue-50",
          border: isDark ? "border-blue-800" : "border-blue-100",
          text: isDark ? "text-blue-400" : "text-blue-600",
          label: "FOLDER",
          icon: Folder,
        };
      case "file":
        return {
          bg: isDark ? "bg-slate-800" : "bg-slate-50",
          border: isDark ? "border-slate-700" : "border-slate-200",
          text: isDark ? "text-slate-400" : "text-slate-500",
          label: "ARCHIVE",
          icon: FileText,
        };
      default:
        return {
          bg: isDark ? "bg-slate-800" : "bg-slate-50",
          border: isDark ? "border-slate-700" : "border-slate-200",
          text: isDark ? "text-slate-400" : "text-slate-500",
          label: "ITEM",
          icon: FileText,
        };
    }
  };

  // 7.9.19. Render Antarmuka Pengelola Penataan Arsip
  return (
    <div
      className="h-full flex flex-col animate-in fade-in relative outline-none"
      tabIndex={0}
      onClick={handleBackgroundClick}
      onContextMenu={(e) => handleContextMenu(e, null)}
    >
      {/* === DAFTAR MODAL TERKAIT PENATAAN === */}
      <ArrangementContextMenu
        position={contextMenu}
        target={contextMenu?.target}
        onClose={() => setContextMenu(null)}
        onAction={handleAction}
        clipboardMode={!!clipboard}
        allowCreate={!!typeToCreate}
        allowMoveHere={
          contextMenu?.target && contextMenu.target.type !== "file"
        }
      />

      {/* IMPLEMENTASI: Mengirimkan konteks lokasi saat ini dan mode kunci hierarki */}
      <PhysRefFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        data={editingItem}
        // PENYESUAIAN: Jika sedang edit, gunakan tipe aslinya. Jika buat baru, gunakan typeToCreate
        type={editingItem ? editingItem.type : typeToCreate || "location"}
        onSave={handleSaveContainer}
        allData={physRefs}
        isDarkMode={isDarkMode}
        isArrangementMode={true} // Aktifkan mode form terkunci
        fixedParentId={currentParentId} // Kirimkan ID induk tempat pengguna berada sekarang
      />
      <ReferenceQRModal
        isOpen={!!printItem}
        onClose={() => setPrintItem(null)}
        data={printItem}
      />
      <ArchiveQRModal
        isOpen={!!printFileItem}
        onClose={() => setPrintFileItem(null)}
        data={printFileItem}
        classifications={classifications}
      />
      <ConfirmationModal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, items: [] })}
        onConfirm={handleDelete}
        title="Hapus"
        message={`Hapus ${deleteConfirm.items.length} item?`}
      />

      {viewResource && (
        <ArchiveDetailModal
          isOpen={!!viewResource}
          onClose={() => setViewResource(null)}
          resource={viewResource}
          classifications={classifications}
          jraList={jraList}
          physRefs={physRefs}
          isDarkMode={isDarkMode}
          currentUser={user}
          onRestore={() => {}}
          borrowings={borrowings}
        />
      )}

      <MoveContainerModal
        key={moveModal.timestamp}
        isOpen={moveModal.show}
        onClose={() => setMoveModal({ show: false, item: null, timestamp: 0 })}
        item={moveModal.item}
        currentParentId={currentParentId}
        allRefs={physRefs}
        onMove={handleExecuteMove}
        isDarkMode={isDarkMode}
      />

      {/* Modal Pemindahan Multi-Item (Bulk Move Modal) */}
      {bulkMoveData.show && (
        <BulkMoveModal
          isOpen={bulkMoveData.show}
          onClose={() =>
            setBulkMoveData({ show: false, targetContainer: null })
          }
          targetContainer={
            bulkMoveData.targetContainer || {
              id: "root",
              type: "root",
              name: "ROOT (Tanpa Wadah)",
              code: "ROOT",
            }
          }
          allResources={resources}
          allRefs={physRefs}
          onExecuteMove={(dataItems) => {
            try {
              executeBulkMove(dataItems, bulkMoveData.targetContainer);
              // PERBAIKAN: Ganti alert browser dengan State Modal
              setMoveAlert({
                show: true,
                message: `Berhasil memindahkan ${dataItems.length} item.`,
              });
              setBulkMoveData({ show: false, targetContainer: null });
            } catch (error) {
              alert("Gagal memindahkan: " + error.message);
            }
          }}
          isDarkMode={isDarkMode}
        />
      )}

      {/* INFO MODAL (VISUAL) & A4 PRINT */}
      {containerInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div
              className={`p-6 text-white flex justify-between items-start ${containerInfo.type === "box" ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gradient-to-r from-blue-500 to-cyan-500"}`}
            >
              <div>
                <div className="flex items-center gap-2 opacity-80 mb-1">
                  {containerInfo.type === "box" ? (
                    <Box size={18} />
                  ) : (
                    <Folder size={18} />
                  )}
                  <span className="uppercase text-xs font-bold tracking-widest">
                    {containerInfo.type} INFO
                  </span>
                </div>
                <h2 className="text-3xl font-extrabold">
                  {containerInfo.name}
                </h2>
                <p className="font-mono text-sm opacity-90 mt-1">
                  {containerInfo.code}
                </p>
              </div>
              <button
                onClick={() => setContainerInfo(null)}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1 bg-slate-50">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">
                    Total Folder
                  </p>
                  <p className="text-xl font-bold text-slate-700">
                    {
                      physRefs.filter((r) => r.parentId === containerInfo.id)
                        .length
                    }
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">
                    Total Arsip
                  </p>
                  <p className="text-xl font-bold text-slate-700">
                    {
                      resources.filter(
                        (r) =>
                          r.physFolderId === containerInfo.id ||
                          r.physBoxId === containerInfo.id,
                      ).length
                    }
                  </p>
                </div>
              </div>

              {containerInfo.type === "box" ? (
                <>
                  <div>
                    <h5 className="text-xs font-bold uppercase text-slate-500 mb-3 flex items-center gap-2 border-b pb-2">
                      <Folder size={14} /> Daftar Folder
                    </h5>
                    <div className="space-y-4">
                      {physRefs
                        .filter((r) => r.parentId === containerInfo.id)
                        .map((r, i) => (
                          <div
                            key={r.id}
                            className="border rounded-xl bg-white border-slate-200 overflow-hidden"
                          >
                            <div className="bg-slate-100 p-2 flex items-center gap-2 font-bold text-sm text-slate-700 border-b border-slate-100">
                              <Folder size={14} className="text-blue-500" />{" "}
                              {r.name}{" "}
                              <span className="text-xs font-mono text-slate-400">
                                ({r.code})
                              </span>
                            </div>
                            <div className="p-2 bg-white space-y-1">
                              {resources
                                .filter((f) => f.physFolderId === r.id)
                                .map((f) => (
                                  <div
                                    key={f.id}
                                    className="text-xs flex justify-between pl-4 py-1 border-b border-slate-50 last:border-0 items-center group"
                                  >
                                    <div className="flex items-center gap-2">
                                      <FileText
                                        size={12}
                                        className="text-slate-400"
                                      />{" "}
                                      <span className="font-mono text-slate-500">
                                        {f.archiveRegId}
                                      </span>{" "}
                                      <span className="line-clamp-1">
                                        {f.title}
                                      </span>
                                    </div>
                                    <div className="flex gap-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {f.url && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(f.url, "_blank");
                                          }}
                                          className="p-1 hover:bg-blue-100 text-blue-500 rounded transition-colors"
                                          title="Lihat File"
                                        >
                                          <Eye size={12} />
                                        </button>
                                      )}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setViewResource(f);
                                        }}
                                        className="p-1 hover:bg-indigo-100 text-indigo-500 rounded transition-colors"
                                        title="Info Detail"
                                      >
                                        <Info size={12} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              {resources.filter((f) => f.physFolderId === r.id)
                                .length === 0 && (
                                <span className="text-xs text-slate-400 italic pl-4">
                                  Folder kosong
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      {physRefs.filter((r) => r.parentId === containerInfo.id)
                        .length === 0 && (
                        <p className="text-xs text-slate-400 italic">
                          Tidak ada folder.
                        </p>
                      )}
                    </div>
                  </div>
                  {resources.filter(
                    (r) => r.physBoxId === containerInfo.id && !r.physFolderId,
                  ).length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-2">
                        <FileText size={14} /> Arsip Lepas (Tanpa Folder)
                      </h5>
                      <div className="border rounded-xl bg-white border-slate-200 p-2 space-y-1">
                        {resources
                          .filter(
                            (r) =>
                              r.physBoxId === containerInfo.id &&
                              !r.physFolderId,
                          )
                          .map((f) => (
                            <div
                              key={f.id}
                              className="text-xs flex justify-between pl-2 py-1 border-b border-slate-50 last:border-0 items-center group"
                            >
                              <div className="flex items-center gap-2">
                                <FileText
                                  size={12}
                                  className="text-orange-400"
                                />{" "}
                                <span className="font-mono text-slate-500">
                                  {f.archiveRegId}
                                </span>{" "}
                                <span className="line-clamp-1">{f.title}</span>
                              </div>
                              <div className="flex gap-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {f.url && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(f.url, "_blank");
                                    }}
                                    className="p-1 hover:bg-blue-100 text-blue-500 rounded transition-colors"
                                    title="Lihat File"
                                  >
                                    <Eye size={12} />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewResource(f);
                                  }}
                                  className="p-1 hover:bg-indigo-100 text-indigo-500 rounded transition-colors"
                                  title="Info Detail"
                                >
                                  <Info size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <h5 className="text-xs font-bold uppercase text-slate-500 mb-3 flex items-center gap-2 border-b pb-2">
                    <FileText size={14} /> Daftar Arsip
                  </h5>
                  <div className="space-y-2">
                    {resources
                      .filter((r) => r.physFolderId === containerInfo.id)
                      .map((r, i) => (
                        <div
                          key={r.id}
                          className="p-3 bg-white rounded-lg border border-slate-200 flex justify-between items-center group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="font-mono text-xs font-bold text-slate-400 w-6">
                              {i + 1}.
                            </div>
                            <div>
                              <p className="font-bold text-sm text-slate-800 line-clamp-1">
                                {r.title}
                              </p>
                              <p className="font-mono text-[10px] text-slate-400">
                                {r.archiveRegId}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {r.url && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(r.url, "_blank");
                                }}
                                className="p-2 hover:bg-blue-100 text-blue-500 rounded-lg transition-colors"
                                title="Lihat File"
                              >
                                <Eye size={14} />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewResource(r);
                              }}
                              className="p-2 hover:bg-indigo-100 text-indigo-500 rounded-lg transition-colors"
                              title="Info Detail"
                            >
                              <Info size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    {resources.filter(
                      (r) => r.physFolderId === containerInfo.id,
                    ).length === 0 && (
                      <p className="text-xs text-slate-400 italic">
                        Tidak ada arsip.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3">
              <button
                onClick={handlePrintA4}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg"
              >
                <Printer size={16} /> Cetak Data (A4)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HIERARCHY ALERT */}
      {hierarchyAlert.show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center border-2 border-orange-100 dark:border-slate-700">
            <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">
              Aksi Tidak Valid
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {hierarchyAlert.message}
            </p>
            <button
              onClick={() => setHierarchyAlert({ show: false, message: "" })}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-colors"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}

      {/* AREA NAVIGASI (BREADCRUMBS) & SHORTCUT INFO */}
      <div className="mb-4 flex justify-between items-center px-1 sticky top-0 bg-transparent z-10">
        <div>
          <h3
            className={`text-2xl font-extrabold mb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            Penataan Arsip
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {/* Grup Navigasi Tombol Kembali/Maju */}
            <div
              className={`flex items-center rounded-lg border p-0.5 mr-2 ${isDarkMode ? "bg-slate-700 border-slate-600" : "bg-white border-slate-200"}`}
            >
              <button
                onClick={handleBack}
                disabled={path.length === 0}
                className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Kembali"
              >
                <ArrowLeft size={16} />
              </button>

              {/* Garis Pemisah Kecil */}
              <div
                className={`w-px h-4 mx-0.5 ${isDarkMode ? "bg-slate-600" : "bg-slate-200"}`}
              ></div>

              <button
                onClick={handleForward}
                disabled={forwardPath.length === 0}
                className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Maju"
              >
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Tombol ke Akar Hierarki (Root) */}
            <button
              onClick={() => {
                setPath([]);
                setForwardPath([]);
                setFilePage(1);
                setContainerPage(1);
              }}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-2 transition-colors ${path.length === 0 ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
            >
              <Home size={14} /> Root
            </button>

            {/* Rendering Urutan Breadcrumb */}
            {path.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2">
                <ChevronRight size={14} className="text-slate-400" />
                <button
                  onDrop={(e) => handleDrop(e, item)}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => {
                    // Logic klik breadcrumb: potong path, reset forward
                    setPath(path.slice(0, idx + 1));
                    setForwardPath([]);
                    setFilePage(1);
                    setContainerPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg font-bold flex items-center gap-2 transition-colors ${idx === path.length - 1 ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                >
                  {React.createElement(getCardConfig(item.type).icon, {
                    size: 14,
                  })}{" "}
                  {item.code || item.name}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Indikator Mode Papan Klip Aktif */}
        {clipboard && (
          <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-3 border border-orange-200 shadow-md animate-pulse">
            <Scissors size={14} />{" "}
            {clipboard.mode === "cut" ? "Memindahkan" : "Menyalin"}:{" "}
            {clipboard.items.length} item
            <button
              onClick={() => setClipboard(null)}
              className="hover:text-red-600"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* --- AREA KONTEN PENATAAN UTAMA --- */}
      <div
        className="flex-1 overflow-y-auto custom-scrollbar pt-2 pb-20 px-1"
        onClick={handleBackgroundClick}
        onContextMenu={(e) => handleContextMenu(e, null)}
      >
        {/* FITUR: Bilah Pencarian Cepat */}
        <div className="mb-4">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 shadow-sm ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}
          >
            <Search size={18} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Cari wadah atau arsip di lokasi ini..."
              className={`w-full bg-transparent outline-none text-sm font-medium ${isDarkMode ? "text-white placeholder:text-slate-500" : "text-slate-800 placeholder:text-slate-400"}`}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setFilePage(1);
                setContainerPage(1);
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-1 hover:bg-red-100 text-slate-400 hover:text-red-500 rounded-lg transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Keadaan Kosong (Empty State) */}
        {allContainersList.length === 0 && allFilesList.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 opacity-50 border-2 border-dashed rounded-3xl border-slate-200 dark:border-slate-700 m-1">
            <FolderOpen size={48} className="mb-4 text-slate-300" />
            <p className="italic">
              Folder ini kosong atau tidak ada hasil pencarian.
            </p>
            <p className="text-xs mt-2">
              {typeToCreate
                ? `Klik kanan untuk membuat ${typeToCreate} baru.`
                : "Gunakan menu 'Proses Arsip' untuk menambahkan file."}
            </p>
          </div>
        )}

        {/* BAGIAN DAFTAR WADAH (Container Section) */}
        {allContainersList.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-end mb-3 px-1">
              <h4 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-2">
                <BoxSelect size={14} /> Wadah / Folder (
                {allContainersList.length})
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {currentContainers.map((item) => {
                const conf = getCardConfig(item.type, isDarkMode); // Pass isDarkMode
                const Icon = conf.icon;
                const isSelected = selectedIds.has(item.id);

                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => {
                      let ids = selectedIds;
                      if (!ids.has(item.id)) {
                        ids = new Set([item.id]);
                        setSelectedIds(ids);
                      }
                      setDraggedIds(ids);
                      e.dataTransfer.setData("text", item.id);
                    }}
                    onDragEnd={() => setDraggedIds(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, item)}
                    onContextMenu={(e) => handleContextMenu(e, item)}
                    onClick={(e) => handleItemClick(e, item)}
                    onDoubleClick={(e) => handleItemDoubleClick(e, item)}
                    className={`
                                        relative group flex flex-col justify-between h-40 select-none rounded-2xl overflow-hidden transition-all duration-200
                                        ${conf.bg} ${conf.border} border
                                        ${isSelected ? "ring-2 ring-indigo-500 shadow-md transform scale-[1.02] z-10" : "hover:shadow-sm"}
                                        ${draggedIds?.has(item.id) ? "opacity-40" : ""}
                                    `}
                  >
                    <div className="p-4 pb-0 flex-1 relative">
                      <div className="flex justify-between items-start mb-1">
                        <span
                          className={`font-mono text-[9px] ${isDarkMode ? "bg-black/40 text-slate-300" : "bg-white/60 text-slate-600"} px-1.5 py-0.5 rounded font-bold`}
                        >
                          {item.code || "---"}
                        </span>
                        <Icon className={`w-5 h-5 opacity-40 ${conf.text}`} />
                      </div>
                      <h4
                        className={`font-bold text-sm leading-snug line-clamp-2 ${isDarkMode ? "text-white" : "text-slate-800"}`}
                      >
                        {item.name}
                      </h4>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                        {item.description || "Tidak ada deskripsi"}
                      </p>
                    </div>
                    <div className="mt-2 border-t border-black/5 dark:border-white/5 mx-4"></div>
                    <div
                      className={`px-4 py-2 flex justify-between items-center ${isDarkMode ? "bg-black/20" : "bg-white/40"} backdrop-blur-sm`}
                    >
                      <span
                        className={`text-[9px] font-black tracking-widest ${conf.text}`}
                      >
                        {conf.label}
                      </span>
                      <div className="flex gap-1">
                        {(item.type === "box" || item.type === "folder") && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setContainerInfo(item);
                            }}
                            className="p-1.5 rounded-lg hover:bg-white/50 text-slate-500 hover:text-blue-600 transition-colors"
                            title="Info"
                          >
                            <Info size={13} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPrintItem(item);
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/50 text-slate-500 hover:text-indigo-600 transition-colors"
                          title="Cetak"
                        >
                          <Printer size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Untuk Daftar Wadah */}
            {allContainersList.length > 0 && (
              <div className="mt-4 flex justify-between items-center border-t border-slate-100 dark:border-slate-700 pt-3">
                <span className="text-[10px] font-bold text-slate-400">
                  Total: {allContainersList.length}
                </span>
                <div className="flex items-center gap-2">
                  <select
                    value={containersPerPage}
                    onChange={(e) => {
                      setContainersPerPage(
                        e.target.value === "all"
                          ? "all"
                          : parseInt(e.target.value),
                      );
                      setContainerPage(1);
                    }}
                    className={`text-[10px] border rounded px-1 py-0.5 ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white"}`}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value="all">Semua</option>
                  </select>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={containerPage === 1}
                      onClick={() => setContainerPage((p) => p - 1)}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
                    >
                      <ChevronLeft size={12} />
                    </button>
                    <span className="text-[10px] px-1">
                      {containerPage}/{totalContainerPages}
                    </span>
                    <button
                      disabled={containerPage === totalContainerPages}
                      onClick={() => setContainerPage((p) => p + 1)}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BAGIAN DAFTAR BERKAS (File Section) */}
        {allFilesList.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-between items-end mb-3 border-b border-slate-100 dark:border-slate-700 pb-2 px-1">
              <h4 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-2">
                <FileText size={14} /> Daftar Arsip ({allFilesList.length})
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentFiles.map((item) => {
                const isSelected = selectedIds.has(item.id);
                const cls = classifications.find(
                  (c) => c.id === item.classificationId,
                );
                const fileCode = cls
                  ? `${cls.kodePokok}.${cls.kodeSub}.${cls.kodeItem}`
                  : item.archiveRegId || "NO-CODE";
                const conf = getCardConfig("file", isDarkMode);

                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => {
                      let ids = selectedIds;
                      if (!ids.has(item.id)) {
                        ids = new Set([item.id]);
                        setSelectedIds(ids);
                      }
                      setDraggedIds(ids);
                      e.dataTransfer.setData("text", item.id);
                    }}
                    onDragEnd={() => setDraggedIds(null)}
                    onContextMenu={(e) => handleContextMenu(e, item)}
                    onClick={(e) => handleItemClick(e, item)}
                    className={`
                                        relative group flex flex-col justify-between h-44 select-none rounded-xl overflow-hidden transition-all duration-200
                                        ${conf.bg} ${conf.border} border-l-4 border-indigo-500
                                        ${isSelected ? "ring-2 ring-indigo-500 shadow-md transform scale-[1.02] z-10" : "hover:shadow-sm border"}
                                        ${draggedIds?.has(item.id) ? "opacity-40" : ""}
                                    `}
                  >
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 cursor-grab text-slate-300">
                      <GripVertical size={14} />
                    </div>
                    <div className="p-4 flex-1">
                      <div className="flex justify-between items-start mb-2 pl-4">
                        <span className="text-[9px] font-mono font-bold bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                          {fileCode}
                        </span>
                        {item.isVital && (
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-red-100 text-red-600 border border-red-200">
                            VITAL
                          </span>
                        )}
                      </div>
                      <div className="pl-2">
                        <h4
                          className={`font-bold text-sm leading-snug line-clamp-2 ${isDarkMode ? "text-white" : "text-slate-800"}`}
                        >
                          {item.title || item.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">
                          {item.archiveRegId}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`px-3 py-2 ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-100"} border-t flex justify-between items-center`}
                    >
                      <span
                        className={`text-[9px] font-black tracking-widest ${conf.text}`}
                      >
                        ARCHIVE
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewResource(item);
                          }}
                          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                          title="Detail"
                        >
                          <Info size={13} />
                        </button>
                        {item.digitalLink && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(item.digitalLink, "_blank");
                            }}
                            className="p-1.5 rounded hover:bg-blue-100 text-blue-500"
                            title="Preview"
                          >
                            <Eye size={13} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPrintFileItem(item);
                          }}
                          className="p-1.5 rounded hover:bg-slate-200 text-slate-500"
                          title="Cetak"
                        >
                          <Printer size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Untuk Daftar Berkas */}
            <div className="mt-4 flex justify-between items-center border-t border-slate-100 dark:border-slate-700 pt-3">
              <span className="text-[10px] font-bold text-slate-400">
                Total: {allFilesList.length} Arsip
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={filesPerPage}
                  onChange={(e) => {
                    setFilesPerPage(
                      e.target.value === "all"
                        ? "all"
                        : parseInt(e.target.value),
                    );
                    setFilePage(1);
                  }}
                  className={`text-[10px] border rounded px-1 py-0.5 ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white"}`}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value="all">Semua</option>
                </select>
                <div className="flex items-center gap-1">
                  <button
                    disabled={filePage === 1}
                    onClick={() => setFilePage((p) => p - 1)}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-[10px] px-1">
                    {filePage}/{totalFilePages}
                  </span>
                  <button
                    disabled={filePage === totalFilePages}
                    onClick={() => setFilePage((p) => p + 1)}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="h-8"></div>
          </div>
        )}
      </div>

      {/* MODAL PRINT PREVIEW A4 (Gaya Berita Acara Transaksi) */}
      {printA4Data && (
        <div className="fixed inset-0 z-[200] bg-slate-200 overflow-y-auto flex flex-col">
          <div className="print:hidden p-4 bg-slate-900 text-white flex justify-between items-center sticky top-0 z-10 shadow-lg">
            <p className="font-bold">Mode Pratinjau Cetak (A4)</p>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-bold flex items-center gap-2 transition-colors"
              >
                <Printer size={16} /> Cetak
              </button>
              <button
                onClick={() => setPrintA4Data(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
          <div className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black mx-auto my-8 p-[20mm] shadow-2xl print:m-0 print:shadow-none print:w-full">
            <div className="flex justify-between items-start border-b-4 border-black pb-4 mb-6">
              <div>
                <h1 className="text-2xl font-black uppercase tracking-widest m-0">
                  DAFTAR ISI ARSIP
                </h1>
                <h2 className="text-lg font-bold uppercase m-0 mt-1">
                  {printA4Data.type}: {printA4Data.name}
                </h2>
                <p className="text-sm text-gray-800 mt-2">
                  KODE:{" "}
                  <span className="font-mono font-bold">
                    {printA4Data.code}
                  </span>
                </p>
              </div>
              <div className="w-24 h-24 border-2 border-black p-1">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${printA4Data.id}`}
                  className="w-full h-full object-contain"
                  alt="QR"
                />
              </div>
            </div>

            <table className="w-full border-collapse border border-black text-sm mb-8">
              <thead style={{ display: "table-header-group" }}>
                <tr className="bg-gray-100">
                  <th className="border border-black p-2 w-10 text-center">
                    No
                  </th>
                  {printA4Data.type === "box" && (
                    <th className="border border-black p-2 w-1/4">Folder</th>
                  )}
                  <th className="border border-black p-2">Uraian Arsip</th>
                  <th className="border border-black p-2 w-24 text-center">
                    Tanggal
                  </th>
                  <th className="border border-black p-2 w-24 text-center">
                    Ret. Aktif
                  </th>
                  <th className="border border-black p-2 w-24 text-center">
                    Ret. Inaktif
                  </th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const isBox = printA4Data.type === "box";
                  const folderList = isBox
                    ? physRefs.filter((r) => r.parentId === printA4Data.id)
                    : [];
                  let no = 1;
                  const fmtDate = (d) =>
                    d ? new Date(d).toLocaleDateString("id-ID") : "-";
                  let rows = [];

                  if (isBox) {
                    folderList.forEach((folder) => {
                      const filesInFolder = resources.filter(
                        (r) => r.physFolderId === folder.id,
                      );
                      if (filesInFolder.length === 0) {
                        rows.push(
                          <tr key={`empty-${folder.id}`}>
                            <td className="border border-black p-2 text-center">
                              {no++}
                            </td>
                            <td className="border border-black p-2 font-bold">
                              {folder.name} <br />
                              <span className="text-[10px] font-normal font-mono text-gray-500">
                                {folder.code}
                              </span>
                            </td>
                            <td className="border border-black p-2 text-center">
                              -
                            </td>
                            <td className="border border-black p-2 text-center">
                              -
                            </td>
                            <td className="border border-black p-2 text-center">
                              -
                            </td>
                            <td className="border border-black p-2 text-center">
                              -
                            </td>
                          </tr>,
                        );
                      } else {
                        filesInFolder.forEach((file) => {
                          rows.push(
                            <tr key={file.id}>
                              <td className="border border-black p-2 text-center">
                                {no++}
                              </td>
                              <td className="border border-black p-2 font-bold">
                                {folder.name}
                              </td>
                              <td className="border border-black p-2">
                                {file.title || file.name} <br />
                                <span className="text-[10px] font-mono text-gray-500">
                                  {file.archiveRegId}
                                </span>
                              </td>
                              <td className="border border-black p-2 text-center">
                                {fmtDate(file.date)}
                              </td>
                              <td className="border border-black p-2 text-center">
                                {fmtDate(file.retentionActiveDate)}
                              </td>
                              <td className="border border-black p-2 text-center">
                                {fmtDate(file.retentionInactiveDate)}
                              </td>
                            </tr>,
                          );
                        });
                      }
                    });
                    const looseFiles = resources.filter(
                      (r) => r.physBoxId === printA4Data.id && !r.physFolderId,
                    );
                    looseFiles.forEach((file) => {
                      rows.push(
                        <tr key={file.id}>
                          <td className="border border-black p-2 text-center">
                            {no++}
                          </td>
                          <td className="border border-black p-2 italic text-gray-600">
                            - (Lepas)
                          </td>
                          <td className="border border-black p-2">
                            {file.title || file.name} <br />
                            <span className="text-[10px] font-mono text-gray-500">
                              {file.archiveRegId}
                            </span>
                          </td>
                          <td className="border border-black p-2 text-center">
                            {fmtDate(file.date)}
                          </td>
                          <td className="border border-black p-2 text-center">
                            {fmtDate(file.retentionActiveDate)}
                          </td>
                          <td className="border border-black p-2 text-center">
                            {fmtDate(file.retentionInactiveDate)}
                          </td>
                        </tr>,
                      );
                    });
                  } else {
                    const files = resources.filter(
                      (r) => r.physFolderId === printA4Data.id,
                    );
                    files.forEach((file) => {
                      rows.push(
                        <tr key={file.id}>
                          <td className="border border-black p-2 text-center">
                            {no++}
                          </td>
                          <td className="border border-black p-2">
                            {file.title || file.name} <br />
                            <span className="text-[10px] font-mono text-gray-500">
                              {file.archiveRegId}
                            </span>
                          </td>
                          <td className="border border-black p-2 text-center">
                            {fmtDate(file.date)}
                          </td>
                          <td className="border border-black p-2 text-center">
                            {fmtDate(file.retentionActiveDate)}
                          </td>
                          <td className="border border-black p-2 text-center">
                            {fmtDate(file.retentionInactiveDate)}
                          </td>
                        </tr>,
                      );
                    });
                  }

                  if (rows.length === 0) {
                    rows.push(
                      <tr key="none">
                        <td
                          colSpan={isBox ? 6 : 5}
                          className="border border-black p-4 text-center italic text-gray-500"
                        >
                          Tidak ada rincian data arsip di dalam wadah ini.
                        </td>
                      </tr>,
                    );
                  }
                  return rows;
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL NOTIFIKASI BERHASIL PINDAH */}
      {moveAlert.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div
            className={`p-6 rounded-3xl w-full max-w-sm text-center border shadow-2xl ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-800"}`}
          >
            <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} />
            </div>
            <h3 className="font-bold text-xl mb-2">Berhasil!</h3>
            <p className="text-sm text-slate-500 mb-6">{moveAlert.message}</p>
            <button
              onClick={() => setMoveAlert({ show: false, message: "" })}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================================================================================
// 7.10. KOMPONEN MODAL PEMINDAHAN MASSAL (BULK MOVE MODAL) DENGAN SMART SCANNER
// ==================================================================================
export const BulkMoveModal = ({
  isOpen,
  onClose,
  targetContainer,
  allResources,
  allRefs,
  onExecuteMove,
  isDarkMode,
}) => {
  // 7.10.1. State Navigasi dan Pencarian
  const [tab, setTab] = React.useState("search");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [stagingItems, setStagingItems] = React.useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  // 7.10.2. State Validasi & Input
  const [validation, setValidation] = React.useState({ status: "all", media: "all" });
  const [barcodeInput, setBarcodeInput] = React.useState("");
  const barcodeInputRef = React.useRef(null);

  // 7.10.3. State Jendela Peringatan Ekstra
  const [alertMsg, setAlertMsg] = React.useState({ show: false, message: "" });
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);

  // 7.10.4. State Manajemen Perizinan Kamera
  const [showCameraModal, setShowCameraModal] = React.useState(false);
  const [cameraStatus, setCameraStatus] = React.useState("idle");

  // Referensi state untuk mencegah Stale Closure pada Scanner
  const stagingItemsRef = React.useRef([]);
  const validationRef = React.useRef({ status: "all", media: "all" });
  const scanLockRef = React.useRef(false);

  React.useEffect(() => {
    stagingItemsRef.current = stagingItems;
  }, [stagingItems]);
  React.useEffect(() => {
    validationRef.current = validation;
  }, [validation]);

  React.useEffect(() => {
    if (tab === "barcode" && barcodeInputRef.current)
      barcodeInputRef.current.focus();
  }, [tab]);

  // IMPLEMENTASI: Deteksi presisi menggunakan key sistem (static / destroyed)
  const isEndLifeArchive = (item) => {
    if (item.type !== "file" || item.archivalStatus !== "physical")
      return false;
    const statusKey = item.status || "";
    return statusKey === "static" || statusKey === "destroyed";
  };

  // 7.10.5. Implementasi Logika Pencarian Item Global
  const getGlobalItems = () => {
    let items = [];
    const tType = targetContainer.type;

    if (tType === "box") {
      items = allRefs.filter(
        (r) =>
          r.type === "folder" &&
          r.id !== targetContainer.id &&
          r.parentId !== targetContainer.id,
      );
    } else if (tType === "rack") {
      items = allRefs.filter(
        (r) =>
          r.type === "box" &&
          r.id !== targetContainer.id &&
          r.parentId !== targetContainer.id,
      );
    } else if (tType === "location") {
      items = allRefs.filter(
        (r) =>
          r.type === "rack" &&
          r.id !== targetContainer.id &&
          r.parentId !== targetContainer.id,
      );
    } else if (tType === "folder" || tType === "root") {
      // PERBAIKAN: ROOT juga tidak boleh menerima wadah
      items = [];
    }

    const files = allResources.filter((r) => {
      if (r.archivalStatus !== "physical" && r.archivalStatus !== "digital")
        return false;

      // IMPLEMENTASI: Blokir arsip fisik yang statusnya static atau destroyed
      if (isEndLifeArchive(r)) return false;

      const myParent =
        r.physFolderId || r.physBoxId || r.physRackId || r.physLocationId;

      // PERBAIKAN: Jika target ROOT, hanya tampilkan arsip yang saat ini punya wadah
      if (targetContainer.id === "root") return !!myParent;

      return myParent !== targetContainer.id;
    });

    const combinedItems = [...items, ...files];

    return combinedItems
      .filter((item) => {
        const textMatch =
          (item.name || item.title || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (item.code || item.archiveRegId || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const notInStaging = !stagingItems.find((s) => s.id === item.id);
        return textMatch && notInStaging;
      })
      .slice(0, 20);
  };

  const filteredDropdown = getGlobalItems();

  const findItemBySmartQR = (code) => {
    let found = [...allRefs, ...allResources].find((i) => i.id === code);
    if (found) return found;
    found = allRefs.find((r) => r.code === code);
    if (found) return found;
    found = allResources.find((r) => r.archiveRegId === code);
    return found;
  };

  const addToStaging = (item, isScanner = false) => {
    if (stagingItemsRef.current.find((s) => s.id === item.id)) {
      if (!isScanner)
        setAlertMsg({
          show: true,
          message: `"${item.name || item.title}" sudah ada di antrean.`,
        });
      return;
    }

    const val = validationRef.current;
    if (item.type === "file") {
      if (val.status === "active" && item.status !== "active") {
        if (!isScanner)
          setAlertMsg({
            show: true,
            message: `Filter Status Aktif menyala, namun arsip berstatus ${item.status}.`,
          });
        return;
      }
      if (val.status === "inactive" && item.status !== "inactive") {
        if (!isScanner)
          setAlertMsg({
            show: true,
            message: `Filter Status Inaktif menyala, namun arsip berstatus ${item.status}.`,
          });
        return;
      }
      const isPhysical = item.archivalStatus === "physical";
      if (val.media === "physical" && !isPhysical) {
        if (!isScanner)
          setAlertMsg({
            show: true,
            message: `Filter Media Fisik menyala, namun format arsip adalah Digital.`,
          });
        return;
      }
      if (val.media === "digital" && isPhysical) {
        if (!isScanner)
          setAlertMsg({
            show: true,
            message: `Filter Media Digital menyala, namun format arsip adalah Fisik.`,
          });
        return;
      }
    }

    setStagingItems((prev) => [...prev, item]);
    setIsDropdownOpen(false);
    setSearchTerm("");
  };

  const processItemForStaging = (found, isScanner = false) => {
    const itemType = found.type || "file";
    const tType = targetContainer.type;

    // A. Validasi Status Arsip
    if (itemType === "file") {
      if (
        found.archivalStatus !== "physical" &&
        found.archivalStatus !== "digital"
      ) {
        if (!isScanner)
          setAlertMsg({
            show: true,
            message: `Ditolak: Arsip "${found.title}" belum berstatus Fisik atau Digital.`,
          });
        return false;
      }

      // IMPLEMENTASI: Validasi penolakan menggunakan key sistem
      if (isEndLifeArchive(found)) {
        const label = found.status === "destroyed" ? "Musnah" : "Statis";
        setAlertMsg({
          show: true,
          message: `Ditolak: Arsip fisik "${found.title}" sudah berstatus ${label} sehingga tidak dapat ditata kembali.`,
        });
        return false;
      }
    }

    // B. Validasi Hierarki Masuk
    let isValidHierarchy = false;

    // PERBAIKAN: Logika ketat khusus ROOT
    if (tType === "root") {
      if (itemType === "file") {
        isValidHierarchy = true;
      } else {
        if (!isScanner)
          setAlertMsg({
            show: true,
            message: `Hierarki Ditolak: Hanya "Arsip" yang dapat dipindahkan ke ROOT (Tanpa Wadah).`,
          });
        return false;
      }
    } else {
      if (itemType === "file") {
        isValidHierarchy = true;
      } else {
        const levels = { root: 0, location: 1, rack: 2, box: 3, folder: 4 };
        isValidHierarchy = levels[itemType] === levels[tType] + 1;
      }
    }

    if (!isValidHierarchy) {
      setAlertMsg({
        show: true,
        message: `Hierarki Ditolak: Anda tidak dapat memasukkan tipe [${itemType.toUpperCase()}] ke dalam wadah [${tType.toUpperCase()}].`,
      });
      return false;
    }

    // C. Validasi Existing
    let isExisting = false;
    if (itemType === "file") {
      const myParent =
        found.physFolderId ||
        found.physBoxId ||
        found.physRackId ||
        found.physLocationId;
      // PERBAIKAN: Deteksi arsip yang sudah berada di ROOT
      if (targetContainer.id === "root") {
        isExisting = !myParent; // Jika tidak punya parent, berarti sudah di ROOT
      } else {
        isExisting = myParent === targetContainer.id;
      }
    } else {
      if (targetContainer.id === "root") {
        isExisting = !found.parentId;
      } else {
        isExisting = found.parentId === targetContainer.id;
      }
    }

    if (isExisting) {
      if (!isScanner)
        setAlertMsg({
          show: true,
          message: `Duplikasi Ditolak: "${found.name || found.title}" saat ini sudah berada di lokasi ini.`,
        });
      return false;
    }

    addToStaging(found, isScanner);
    return true;
  };

  const handleBarcodeKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = e.target.value.trim();
      if (!code) return;

      const found = findItemBySmartQR(code);
      if (found) {
        // Proses item (validasi akan memunculkan alert jika gagal)
        processItemForStaging(found, false);

        // PERBAIKAN 1: Reset input LANGSUNG (baik sukses masuk staging atau gagal validasi)
        setBarcodeInput("");
      } else {
        setAlertMsg({
          show: true,
          message: `Pencarian Gagal: Barcode atau ID "${code}" tidak ditemukan di database.`,
        });
        // Reset input jika item tidak ditemukan sama sekali
        setBarcodeInput("");
      }
    }
  };

  const requestCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());

      setCameraStatus("granted");
      setShowCameraModal(false);
      setTab("camera");
    } catch (error) {
      setCameraStatus("denied");
      setShowCameraModal(false);
      setAlertMsg({
        show: true,
        message: "Akses kamera ditolak oleh browser Anda.",
      });
    }
  };

  const handleTabChange = (targetTab) => {
    if (targetTab === "camera" && cameraStatus !== "granted") {
      setShowCameraModal(true);
    } else {
      setTab(targetTab);
    }
  };

  // IMPLEMENTASI: Kamera dengan metode Fallback agar tidak layar hitam
  React.useEffect(() => {
    let html5QrCode = null;
    let timeoutId = null;

    if (tab === "camera" && cameraStatus === "granted" && isOpen) {
      timeoutId = setTimeout(() => {
        try {
          // Pastikan library Html5Qrcode terdeteksi (atasi ReferenceError)
          if (typeof Html5Qrcode === "undefined") {
            setAlertMsg({
              show: true,
              message:
                "Modul pemindai belum termuat. Pastikan Anda telah mengimpor Html5Qrcode.",
            });
            return;
          }

          html5QrCode = new Html5Qrcode("qr-reader");
          const config = { fps: 10, qrbox: { width: 250, height: 250 } };

          const onScanSuccess = (decodedText) => {
            if (scanLockRef.current) return;
            const found = findItemBySmartQR(decodedText);
            if (found) {
              scanLockRef.current = true;
              processItemForStaging(found, true);
              setTimeout(() => {
                scanLockRef.current = false;
              }, 1500);
            }
          };

          Html5Qrcode.getCameras()
            .then((devices) => {
              if (devices && devices.length > 0) {
                let selectedCameraId = devices[0].id;
                const backCamera = devices.find(
                  (d) =>
                    d.label.toLowerCase().includes("back") ||
                    d.label.toLowerCase().includes("environment"),
                );
                if (backCamera) selectedCameraId = backCamera.id;

                html5QrCode
                  .start(selectedCameraId, config, onScanSuccess, () => {})
                  .catch((err) => {
                    // Fallback jika ID kamera gagal (sering terjadi di localhost)
                    html5QrCode
                      .start(
                        { facingMode: "environment" },
                        config,
                        onScanSuccess,
                        () => {},
                      )
                      .catch((e) => console.error(e));
                  });
              } else {
                // Fallback jika enumerasi kosong namun izin diberikan
                html5QrCode
                  .start(
                    { facingMode: "environment" },
                    config,
                    onScanSuccess,
                    () => {},
                  )
                  .catch((e) => console.error(e));
              }
            })
            .catch((err) => {
              // Fallback darurat
              html5QrCode
                .start(
                  { facingMode: "environment" },
                  config,
                  onScanSuccess,
                  () => {},
                )
                .catch((e) => console.error(e));
            });
        } catch (error) {
          console.error("Html5Qrcode Error:", error);
        }
      }, 300);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (html5QrCode) {
        try {
          if (html5QrCode.isScanning) {
            html5QrCode
              .stop()
              .then(() => html5QrCode.clear())
              .catch((e) => {});
          } else {
            html5QrCode.clear();
          }
        } catch (e) {
          /* silent catch */
        }
      }
    };
     
  }, [tab, cameraStatus, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div
        className={`w-full max-w-4xl h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl ${isDarkMode ? "bg-slate-900 text-white" : "bg-white text-slate-800"}`}
      >
        <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ArrowDownToLine /> Pindahkan Item ke Sini
            </h2>
            <p className="opacity-80 text-sm mt-1">
              Target: {targetContainer.name} ({targetContainer.code})
            </p>
          </div>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {showCameraModal && (
          <div className="absolute inset-0 z-[140] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in rounded-3xl">
            <div
              className={`p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center border-2 m-4 ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-indigo-100"}`}
            >
              <div className="w-20 h-20 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CameraIcon size={40} className="animate-pulse" />
              </div>
              <h3 className="font-bold text-xl mb-2">Izin Akses Kamera</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                Sistem membutuhkan akses ke kamera perangkat Anda untuk memindai
                QR Code secara langsung.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCameraModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={requestCameraAccess}
                  className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-colors"
                >
                  Berikan Izin
                </button>
              </div>
            </div>
          </div>
        )}

        {alertMsg.show && (
          <div className="absolute inset-0 z-[130] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in rounded-3xl">
            <div
              className={`p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center border-2 m-4 ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-red-100"}`}
            >
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="font-bold text-lg mb-2">Notifikasi</h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                {alertMsg.message}
              </p>
              <button
                onClick={() => {
                  setAlertMsg({ show: false, message: "" });
                  scanLockRef.current = false;

                  // PERBAIKAN 2: Kembalikan kursor ke form scanner jika di tab barcode
                  if (tab === "barcode" && barcodeInputRef.current) {
                    setTimeout(() => {
                      barcodeInputRef.current.focus();
                    }, 100);
                  }
                }}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-colors"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}

        {showResetConfirm && (
          <div className="absolute inset-0 z-[140] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in rounded-3xl">
            <div
              className={`p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center border-2 m-4 ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-orange-100"}`}
            >
              <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="font-bold text-lg mb-2">Reset Filter?</h3>
              <p className="text-sm text-slate-500 mb-6">
                Mereset filter akan menghapus semua {stagingItems.length} item
                antrean. Lanjutkan?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    setValidation({ status: "all", media: "all" });
                    setStagingItems([]);
                    setShowResetConfirm(false);
                  }}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors"
                >
                  Ya, Reset
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          <div
            className={`w-1/3 border-r p-4 flex flex-col gap-4 ${isDarkMode ? "border-slate-700 bg-slate-800/50" : "border-slate-100 bg-slate-50"}`}
          >
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-indigo-100 dark:border-slate-600 space-y-3">
              <p className="text-xs font-bold uppercase text-indigo-500 mb-2">
                Filter Validasi{" "}
                <span className="text-[9px] text-slate-400 normal-case">
                  (Khusus Arsip)
                </span>
              </p>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Status
                </label>
                <select
                  className={`w-full p-2 rounded-lg text-xs font-bold border mt-1 disabled:opacity-50 ${isDarkMode ? "bg-slate-700 border-slate-600" : "bg-slate-50 border-slate-200"}`}
                  value={validation.status}
                  onChange={(e) =>
                    setValidation({ ...validation, status: e.target.value })
                  }
                  disabled={stagingItems.length > 0}
                >
                  <option value="all">Semua</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Inaktif</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Media
                </label>
                <select
                  className={`w-full p-2 rounded-lg text-xs font-bold border mt-1 disabled:opacity-50 ${isDarkMode ? "bg-slate-700 border-slate-600" : "bg-slate-50 border-slate-200"}`}
                  value={validation.media}
                  onChange={(e) =>
                    setValidation({ ...validation, media: e.target.value })
                  }
                  disabled={stagingItems.length > 0}
                >
                  <option value="all">Semua</option>
                  <option value="physical">Fisik</option>
                  <option value="digital">Digital</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() =>
                    stagingItems.length > 0
                      ? setShowResetConfirm(true)
                      : setValidation({ status: "all", media: "all" })
                  }
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold"
                >
                  Reset Filter
                </button>
                <button
                  onClick={() =>
                    setAlertMsg({
                      show: true,
                      message: "Filter validasi diterapkan.",
                    })
                  }
                  disabled={stagingItems.length > 0}
                  className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-bold disabled:opacity-50"
                >
                  Mulai Filter
                </button>
              </div>
            </div>

            <div className="flex gap-2 bg-slate-200 dark:bg-slate-700 p-1 rounded-lg shrink-0">
              {[
                { id: "search", icon: Search, label: "Cari" },
                { id: "barcode", icon: ScanLine, label: "Scan" },
                { id: "camera", icon: Camera, label: "Cam" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTabChange(t.id)}
                  className={`flex-1 py-2 rounded-md text-xs font-bold flex flex-col items-center gap-1 transition-colors ${tab === t.id ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-600"}`}
                >
                  <t.icon size={16} /> {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              {tab === "search" && (
                <div className="space-y-4">
                  <div className="relative">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                      Cari Item Manual
                    </label>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={`w-full p-3 rounded-xl border text-sm flex justify-between items-center transition-all ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-700"}`}
                    >
                      <span className={searchTerm ? "font-bold" : "opacity-50"}>
                        {searchTerm
                          ? `Mencari: "${searchTerm}"`
                          : "Klik untuk mencari item..."}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {isDropdownOpen && (
                      <div
                        className={`absolute top-full left-0 w-full mt-2 rounded-xl border shadow-2xl z-30 overflow-hidden flex flex-col max-h-[300px] animate-in slide-in-from-top-2 ${isDarkMode ? "bg-slate-800 border-slate-600" : "bg-white border-slate-200"}`}
                      >
                        <div
                          className={`p-3 border-b sticky top-0 z-10 ${isDarkMode ? "border-slate-700 bg-slate-800" : "border-slate-100 bg-white"}`}
                        >
                          <div
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200"}`}
                          >
                            <Search size={14} className="opacity-50" />
                            <input
                              type="text"
                              placeholder="Ketik Kode / Nama..."
                              className="bg-transparent border-none outline-none text-xs w-full font-bold"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              autoFocus
                            />
                            {searchTerm && (
                              <button onClick={() => setSearchTerm("")}>
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="overflow-y-auto p-2 custom-scrollbar flex-1">
                          {filteredDropdown.length > 0 ? (
                            filteredDropdown.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => processItemForStaging(item)}
                                className={`w-full text-left p-3 mb-1 rounded-lg flex items-center gap-3 transition-colors group ${isDarkMode ? "hover:bg-indigo-900/30" : "hover:bg-indigo-50"}`}
                              >
                                <div
                                  className={`p-2 rounded-lg ${isDarkMode ? "bg-slate-700 group-hover:bg-indigo-800" : "bg-slate-100 group-hover:bg-indigo-100"}`}
                                >
                                  {item.archiveRegId ? (
                                    <FileText size={16} />
                                  ) : (
                                    <Folder size={16} />
                                  )}
                                </div>
                                <div className="flex-1 truncate">
                                  <p className="text-xs font-bold truncate">
                                    {item.name || item.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-mono opacity-70 bg-black/5 px-1 rounded">
                                      {item.code || item.archiveRegId}
                                    </span>
                                  </div>
                                </div>
                                <PlusSquare
                                  size={16}
                                  className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                />
                              </button>
                            ))
                          ) : (
                            <div className="p-8 text-center opacity-50">
                              <p className="text-xs">
                                {searchTerm
                                  ? "Item tidak ditemukan"
                                  : "Ketik untuk mencari"}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex gap-2">
                    <Info
                      size={16}
                      className="text-blue-500 flex-shrink-0 mt-0.5"
                    />
                    <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-relaxed">
                      Mode Cari Manual menampilkan item global yang belum ada di
                      sini dan cocok secara hierarki.
                    </p>
                  </div>
                </div>
              )}

              {tab === "barcode" && (
                <div className="flex flex-col h-full justify-center">
                  <div className="p-8 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center text-center text-slate-400 mb-4">
                    <ScanLine size={48} className="mb-2" />
                    <p className="text-xs">Gunakan Barcode Scanner USB</p>
                  </div>
                  <input
                    type="text"
                    ref={barcodeInputRef}
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={handleBarcodeKeyDown}
                    placeholder="Klik di sini & Scan..."
                    className="w-full p-4 text-center font-mono text-lg border-2 border-indigo-500 rounded-xl focus:ring-4 ring-indigo-200 outline-none dark:bg-slate-800"
                  />
                </div>
              )}

              {tab === "camera" && (
                <div className="flex flex-col items-center justify-center p-2 h-full">
                  <div
                    id="qr-reader"
                    className="w-full max-w-[320px] rounded-xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700 bg-black min-h-[300px] flex items-center justify-center text-slate-500 text-xs"
                  >
                    Memuat Kamera...
                  </div>
                  <p className="text-xs font-bold text-slate-400 mt-4 text-center">
                    Arahkan kamera ke QR Code Arsip atau Wadah.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 p-6 flex flex-col">
            <h3 className="font-bold text-lg mb-4 flex justify-between items-center">
              <span>Daftar Item ({stagingItems.length})</span>
              {stagingItems.length > 0 && (
                <button
                  onClick={() => setStagingItems([])}
                  className="text-xs text-red-500 hover:underline"
                >
                  Hapus Semua
                </button>
              )}
            </h3>

            <div className="flex-1 overflow-y-auto border rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2 space-y-2 custom-scrollbar">
              {stagingItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                  <UploadCloud size={48} className="mb-2" />
                  <p className="text-sm">Belum ada item ditambahkan</p>
                </div>
              ) : (
                stagingItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-3 animate-in slide-in-from-left-2"
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate text-slate-800 dark:text-white">
                        {item.name || item.title}
                      </p>
                      <p className="text-[10px] font-mono opacity-60 truncate">
                        {item.code || item.archiveRegId}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setStagingItems(
                          stagingItems.filter((_, i) => i !== idx),
                        )
                      }
                      className="text-slate-400 hover:text-red-500 shrink-0 p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => onExecuteMove(stagingItems)}
                disabled={stagingItems.length === 0}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:dark:bg-slate-700 text-white rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 transition-all"
              >
                <ArrowDownToLine size={20} /> Proses Pindahkan{" "}
                {stagingItems.length} Item
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================================================================================
// 7.11. KOMPONEN FORMULIR KLASIFIKASI (CLASSIFICATION FORM MODAL)
// ==================================================================================
export const ClassificationFormModal = ({
  isOpen,
  onClose,
  data,
  onSave,
  isDarkMode,
}) => {
  // 7.11.1. Inisialisasi State Form
  const [form, setForm] = React.useState({
    jenis: "Fasilitatif",
    kodePokok: "",
    namaPokok: "",
    kodeSub: "",
    namaSub: "",
    kodeItem: "",
    namaItem: "", // 'Jenis_Arsip' di CSV kita map ke 'namaItem'
  });

  // 7.11.2. Efek Sinkronisasi Data Saat Modal Dibuka
  React.useEffect(() => {
    if (isOpen) {
      if (data) setForm(data);
      else
        setForm({
          jenis: "Fasilitatif",
          kodePokok: "",
          namaPokok: "",
          kodeSub: "",
          namaSub: "",
          kodeItem: "",
          namaItem: "",
        });
    }
  }, [isOpen, data]);

  // 7.11.3. Handler Pengiriman Form
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  if (!isOpen) return null;

  // 7.11.4. Tampilan Antarmuka Modal Klasifikasi
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in">
      <div
        className={`w-full max-w-lg rounded-3xl shadow-2xl p-8 border ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-100"}`}
      >
        {/* Header Modal */}
        <div className="flex justify-between items-center mb-6">
          <h3
            className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            {data ? "Edit Klasifikasi" : "Tambah Klasifikasi Baru"}
          </h3>
          <button onClick={onClose}>
            <X size={20} className="text-slate-400 hover:text-red-500" />
          </button>
        </div>

        {/* Area Formulir */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Jenis Klasifikasi */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">
              Jenis Klasifikasi
            </label>
            <select
              className={`w-full px-4 py-3 rounded-xl border mt-1 text-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
              value={form.jenis}
              onChange={(e) => setForm({ ...form, jenis: e.target.value })}
            >
              <option value="Fasilitatif">Fasilitatif</option>
              <option value="Substantif">Substantif</option>
            </select>
          </div>

          {/* Kelompok Kode Pokok */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <label className="text-xs font-bold text-slate-400 uppercase">
                Kode Pokok
              </label>
              <input
                type="text"
                maxLength="2"
                placeholder="HK"
                className={`w-full px-3 py-3 rounded-xl border mt-1 text-sm uppercase font-mono ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                value={form.kodePokok}
                onChange={(e) =>
                  setForm({ ...form, kodePokok: e.target.value.toUpperCase() })
                }
                required
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase">
                Nama Pokok
              </label>
              <input
                type="text"
                placeholder="HUKUM"
                className={`w-full px-3 py-3 rounded-xl border mt-1 text-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                value={form.namaPokok}
                onChange={(e) =>
                  setForm({ ...form, namaPokok: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Kelompok Kode Sub */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <label className="text-xs font-bold text-slate-400 uppercase">
                Kode Sub
              </label>
              <input
                type="text"
                maxLength="2"
                placeholder="01"
                className={`w-full px-3 py-3 rounded-xl border mt-1 text-sm uppercase font-mono ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                value={form.kodeSub}
                onChange={(e) => setForm({ ...form, kodeSub: e.target.value })}
                required
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase">
                Nama Sub
              </label>
              <input
                type="text"
                placeholder="Perundang-undangan"
                className={`w-full px-3 py-3 rounded-xl border mt-1 text-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                value={form.namaSub}
                onChange={(e) => setForm({ ...form, namaSub: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Kelompok Kode Item */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <label className="text-xs font-bold text-slate-400 uppercase">
                Kode Item
              </label>
              <input
                type="text"
                maxLength="4"
                placeholder="001"
                className={`w-full px-3 py-3 rounded-xl border mt-1 text-sm uppercase font-mono ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                value={form.kodeItem}
                onChange={(e) => setForm({ ...form, kodeItem: e.target.value })}
                required
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase">
                Nama Item / Jenis Arsip
              </label>
              <input
                type="text"
                placeholder="UU / Perpu"
                className={`w-full px-3 py-3 rounded-xl border mt-1 text-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                value={form.namaItem}
                onChange={(e) => setForm({ ...form, namaItem: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================================================================================
// 7.12. KOMPONEN PENGELOLA REFERENSI KLASIFIKASI (ARCHIVE REFERENCE MANAGER)
// ==================================================================================
export const ArchiveReferenceManager = ({ user, isDarkMode }) => {
  // 7.12.1. Inisialisasi State Dasar
  const [classifications, setClassifications] = useUserAwareState(
    [],
    "lifeos-archive-classifications",
    user,
  );
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState({
    primary: "",
    secondary: "",
    tertiary: "",
  });
  // FITUR: State Penomoran Halaman (Default 25)
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(25);

  // 7.12.2. State Modal dan Kontrol UI
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState({
    show: false,
    id: null,
    name: "",
  });

  // 7.12.3. State Import CSV
  const [isImporting, setIsImporting] = React.useState(false);
  const fileInputRef = React.useRef(null);
  const [alertData, setAlertData] = React.useState({
    show: false,
    title: "",
    message: "",
    type: "success",
  });

  // 7.12.4. Logika Handler Impor Berkas CSV
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split("\n");
        const newItems = [];

        // Iterasi Pembacaan Baris CSV
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const cols = line.split("|");
          if (cols.length >= 7) {
            newItems.push({
              id: generateId("cls"),
              jenis: cols[0]?.trim(),
              kodePokok: cols[1]?.trim(),
              namaPokok: cols[2]?.trim(),
              kodeSub: cols[3]?.trim().padStart(2, "0"),
              namaSub: cols[4]?.trim(),
              kodeItem: cols[5]?.trim().padStart(3, "0"),
              namaItem: cols[6]?.trim(),
            });
          }
        }

        setClassifications((prev) => [...prev, ...newItems]);
        setAlertData({
          show: true,
          title: "Impor Berhasil",
          message: `Berhasil mengimpor ${newItems.length} data klasifikasi.`,
          type: "success",
        });
      } catch (err) {
        setAlertData({
          show: true,
          title: "Impor Gagal",
          message: "Terjadi kesalahan saat membaca file CSV.",
          type: "error",
        });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsText(file);
  };

  // 7.12.5. Fungsi Eksekusi Data (Simpan dan Hapus)
  const handleSave = (formData) => {
    if (editingItem) {
      setClassifications((prev) =>
        prev.map((item) =>
          item.id === editingItem.id ? { ...item, ...formData } : item,
        ),
      );
      setEditingItem(null);
    } else {
      setClassifications((prev) => [
        ...prev,
        { id: generateId("cls"), ...formData },
      ]);
    }
  };

  const confirmDelete = () => {
    setClassifications((prev) => prev.filter((c) => c.id !== deleteConfirm.id));
    setDeleteConfirm({ show: false, id: null, name: "" });
  };

  // 7.12.6. Ekstraksi Data Kategori Unik (Filter Dropdown)
  const uniquePrimary = [
    ...new Set(classifications.map((c) => `${c.kodePokok} - ${c.namaPokok}`)),
  ].sort();
  const uniqueSecondary = [
    ...new Set(
      classifications
        .filter(
          (c) =>
            !filters.primary ||
            `${c.kodePokok} - ${c.namaPokok}` === filters.primary,
        )
        .map((c) => `${c.kodeSub} - ${c.namaSub}`),
    ),
  ].sort();

  // 7.12.7. Logika Pemfilteran Data Tabel
  const filteredData = classifications.filter((item) => {
    const matchesSearch =
      (item.namaItem || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.namaSub || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.kodePokok + item.kodeSub + item.kodeItem).includes(search);
    const matchesPrimary =
      !filters.primary ||
      `${item.kodePokok} - ${item.namaPokok}` === filters.primary;
    const matchesSecondary =
      !filters.secondary ||
      `${item.kodeSub} - ${item.namaSub}` === filters.secondary;
    const matchesTertiary =
      !filters.tertiary || item.kodeItem.includes(filters.tertiary);

    return (
      matchesSearch && matchesPrimary && matchesSecondary && matchesTertiary
    );
  });

  // IMPLEMENTASI: Pemotongan data untuk halaman aktif
  const indexOfLastItem =
    itemsPerPage === "all" ? filteredData.length : currentPage * itemsPerPage;
  const indexOfFirstItem =
    itemsPerPage === "all" ? 0 : indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  // 7.12.8. Tampilan Antarmuka Manajer Referensi Klasifikasi
  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4">
      {/* Rendering Modal Form dan Konfirmasi */}
      <ClassificationFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        data={editingItem}
        onSave={handleSave}
        isDarkMode={isDarkMode}
      />
      <ConfirmationModal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false })}
        onConfirm={confirmDelete}
        title="Hapus Klasifikasi?"
        message="Data ini akan dihapus dari referensi."
        itemName={deleteConfirm.name}
      />

      {/* Modal Notifikasi Import */}
      {alertData.show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div
            className={`p-6 rounded-2xl max-w-sm w-full text-center border shadow-2xl ${isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-800"}`}
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${alertData.type === "success" ? "bg-emerald-100 text-emerald-500" : "bg-red-100 text-red-500"}`}
            >
              {alertData.type === "success" ? (
                <CheckCircle size={32} />
              ) : (
                <AlertTriangle size={32} />
              )}
            </div>
            <h3 className="font-bold text-lg mb-2">{alertData.title}</h3>
            <p className="text-sm opacity-70 mb-6">{alertData.message}</p>
            <button
              onClick={() =>
                setAlertData({
                  show: false,
                  title: "",
                  message: "",
                  type: "success",
                })
              }
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Header Utama Manajer */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
        <div>
          <h3
            className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            Referensi Klasifikasi Arsip
          </h3>
          <p
            className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
          >
            Kelola Kode Klasifikasi (Primer, Sekunder, Tersier).
          </p>
        </div>

        <div className="flex gap-2">
          {/* Tombol Import CSV */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current.click()}
            disabled={isImporting}
            className={`px-4 py-2 rounded-xl text-xs font-bold border border-dashed flex items-center gap-2 transition-all ${isDarkMode ? "border-slate-600 text-slate-300 hover:bg-slate-800" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}
          >
            {isImporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}{" "}
            Import CSV (|)
          </button>

          {/* Tombol Tambah Manual */}
          <button
            onClick={() => {
              setEditingItem(null);
              setIsFormOpen(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg"
          >
            <Plus size={16} /> Tambah Manual
          </button>
        </div>
      </div>

      {/* Area Filter Pencarian */}
      <div
        className={`p-4 rounded-2xl border mb-4 flex flex-col md:flex-row gap-3 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
      >
        {/* Input Text Global */}
        <div
          className={`flex items-center px-3 py-2 rounded-xl border flex-1 ${isDarkMode ? "bg-slate-700 border-slate-600" : "bg-slate-50 border-slate-200"}`}
        >
          <Search size={16} className="text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Cari Kode atau Nama Arsip..."
            className={`bg-transparent border-none text-xs w-full focus:outline-none ${isDarkMode ? "text-white placeholder-slate-500" : "text-slate-900"}`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value); // 1. Perintah asli Anda (menyimpan teks)
              setCurrentPage(1); // 2. TAMBAHAN BARU: Reset ke Halaman 1
            }}
          />
        </div>

        {/* Dropdown Primer */}
        <select
          className={`px-3 py-2 rounded-xl border text-xs font-bold md:w-48 ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200 text-slate-700"}`}
          value={filters.primary}
          onChange={(e) =>
            setFilters({ ...filters, primary: e.target.value, secondary: "" })
          }
        >
          <option value="">-- Semua Kode Primer --</option>
          {uniquePrimary.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {/* Dropdown Sekunder */}
        <select
          className={`px-3 py-2 rounded-xl border text-xs font-bold md:w-48 ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200 text-slate-700"}`}
          value={filters.secondary}
          onChange={(e) =>
            setFilters({ ...filters, secondary: e.target.value })
          }
          disabled={!filters.primary}
        >
          <option value="">-- Semua Kode Sekunder --</option>
          {uniqueSecondary.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Tombol Reset Filter */}
        {(filters.primary || search) && (
          <button
            onClick={() => {
              setFilters({ primary: "", secondary: "", tertiary: "" });
              setSearch("");
            }}
            className="p-2 rounded-xl bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300"
          >
            <RotateCcw size={16} />
          </button>
        )}
      </div>

      {/* Tabel Data Klasifikasi */}
      <div
        className={`flex-1 overflow-hidden rounded-2xl border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
      >
        <div className="h-full overflow-y-auto custom-scrollbar relative">
          <table
            className={`w-full text-left text-xs ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
          >
            <thead
              className={`font-bold uppercase sticky top-0 z-10 ${isDarkMode ? "bg-slate-700 text-slate-400" : "bg-slate-50 text-slate-500"}`}
            >
              <tr>
                <th className="p-4 w-28">Kode</th>
                <th className="p-4 w-24">Primer</th>
                <th className="p-4 w-40">Sekunder</th>
                <th className="p-4">Jenis Arsip (Tersier)</th>
                <th className="p-4 w-20 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredData.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="p-8 text-center text-slate-400 italic"
                  >
                    Data tidak ditemukan.
                  </td>
                </tr>
              )}

              {currentItems.map((item, index) => (
                <tr
                  key={item.id}
                  className={`transition-colors ${isDarkMode ? "hover:bg-slate-700/50" : "hover:bg-slate-50"}`}
                >
                  <td className="p-4 font-mono font-bold text-indigo-500">
                    {item.kodePokok}.{item.kodeSub}.{item.kodeItem}
                  </td>
                  <td className="p-4">
                    <span className="block font-bold">{item.kodePokok}</span>
                  </td>
                  <td className="p-4">
                    <span className="block font-bold">{item.kodeSub}</span>
                    <span className="text-[10px] opacity-70 line-clamp-1">
                      {item.namaSub}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="block font-bold text-slate-800 dark:text-slate-200">
                      {item.namaItem}
                    </span>
                  </td>

                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setIsFormOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-700"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm({
                            show: true,
                            id: item.id,
                            name: item.namaItem,
                          })
                        }
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Statistik Tabel */}
      <div className="p-2 text-right text-[10px] text-slate-400">
        Total Referensi: {filteredData.length}
      </div>

      {/* Komponen Kontrol Penomoran Halaman */}
      <div className="mt-4 pb-4">
        <PaginationControl
          totalItems={filteredData.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
};

// ==================================================================================
// 7.13. KOMPONEN FORMULIR JADWAL RETENSI ARSIP (JRA FORM MODAL)
// ==================================================================================
export const JRAFormModal = ({ isOpen, onClose, data, onSave, isDarkMode }) => {
  // 7.13.1. Inisialisasi State Form JRA
  const [form, setForm] = React.useState({
    kategoriUtama: "",
    subKategori: "",
    jenisArsip: "",
    retensiAktif: "",
    retensiInaktif: "",
    keterangan: "Musnah",
  });

  // 7.13.2. Efek Sinkronisasi Data Saat Modal Dibuka
  React.useEffect(() => {
    if (isOpen) {
      if (data) setForm(data);
      else
        setForm({
          kategoriUtama: "",
          subKategori: "",
          jenisArsip: "",
          retensiAktif: "",
          retensiInaktif: "",
          keterangan: "Musnah",
        });
    }
  }, [isOpen, data]);

  // 7.13.3. Handler Pengiriman Form
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  if (!isOpen) return null;

  // 7.13.4. Tampilan Antarmuka Modal Form JRA
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in">
      <div
        className={`w-full max-w-lg rounded-3xl shadow-2xl p-8 border ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-100"}`}
      >
        {/* Header Modal */}
        <div className="flex justify-between items-center mb-6">
          <h3
            className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            {data ? "Edit Jadwal Retensi" : "Tambah Jadwal Retensi"}
          </h3>
          <button onClick={onClose}>
            <X size={20} className="text-slate-400 hover:text-red-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input Kategori */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">
                Kategori Utama
              </label>
              <input
                type="text"
                placeholder="KEBIJAKAN"
                className={`w-full px-4 py-3 rounded-xl border mt-1 text-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                value={form.kategoriUtama}
                onChange={(e) =>
                  setForm({ ...form, kategoriUtama: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">
                Sub Kategori
              </label>
              <input
                type="text"
                placeholder="Umum"
                className={`w-full px-4 py-3 rounded-xl border mt-1 text-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                value={form.subKategori}
                onChange={(e) =>
                  setForm({ ...form, subKategori: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Input Jenis Arsip */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">
              Jenis Arsip / Uraian
            </label>
            <textarea
              rows="2"
              placeholder="Pengkajian dan pengusulan kebijakan..."
              className={`w-full px-4 py-3 rounded-xl border mt-1 text-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
              value={form.jenisArsip}
              onChange={(e) => setForm({ ...form, jenisArsip: e.target.value })}
              required
            />
          </div>

          {/* Input Nilai Retensi dan Keterangan */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">
                Aktif (Thn)
              </label>
              <input
                type="number"
                min="0"
                className={`w-full px-4 py-3 rounded-xl border mt-1 text-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                value={form.retensiAktif}
                onChange={(e) =>
                  setForm({
                    ...form,
                    retensiAktif: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">
                Inaktif (Thn)
              </label>
              <input
                type="number"
                min="0"
                className={`w-full px-4 py-3 rounded-xl border mt-1 text-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                value={form.retensiInaktif}
                onChange={(e) =>
                  setForm({
                    ...form,
                    retensiInaktif: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">
                Keterangan
              </label>
              <select
                className={`w-full px-4 py-3 rounded-xl border mt-1 text-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                value={form.keterangan}
                onChange={(e) =>
                  setForm({ ...form, keterangan: e.target.value })
                }
              >
                <option value="Musnah">Musnah</option>
                <option value="Permanen">Permanen</option>
                <option value="Dinilai Kembali">Dinilai Kembali</option>
              </select>
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================================================================================
// 7.14. KOMPONEN PENGELOLA REFERENSI JRA (JRA REFERENCE MANAGER)
// ==================================================================================
export const JRAReferenceManager = ({ user, isDarkMode }) => {
  // 7.14.1. Inisialisasi State Dasar
  const [jraList, setJraList] = useUserAwareState(
    [],
    "lifeos-archive-jra",
    user,
  );
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState({ kategori: "", keterangan: "" });
  // FITUR: State Penomoran Halaman (Default 25)
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(25);

  // 7.14.2. State Modal dan Kontrol UI
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState({
    show: false,
    id: null,
    name: "",
  });
  const [alertData, setAlertData] = React.useState({
    show: false,
    title: "",
    message: "",
    type: "success",
  });

  // 7.14.3. State Import CSV
  const [isImporting, setIsImporting] = React.useState(false);
  const fileInputRef = React.useRef(null);

  // 7.14.4. Logika Handler Impor Berkas CSV (Delimiter '|')
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split("\n");
        const newItems = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Format CSV: Kategori_Utama|Sub_Kategori|Jenis_Arsip|Retensi_Aktif_Tahun|Retensi_Inaktif_Tahun|Keterangan
          const cols = line.split("|");
          if (cols.length >= 6) {
            newItems.push({
              id: generateId("jra"),
              kategoriUtama: cols[0]?.trim(),
              subKategori: cols[1]?.trim(),
              jenisArsip: cols[2]?.trim(),
              retensiAktif: parseInt(cols[3]?.trim()) || 0,
              retensiInaktif: parseInt(cols[4]?.trim()) || 0,
              keterangan: cols[5]?.trim(),
            });
          }
        }

        setJraList((prev) => [...prev, ...newItems]);
        setAlertData({
          show: true,
          title: "Impor Berhasil",
          message: `Berhasil mengimpor ${newItems.length} data JRA.`,
          type: "success",
        });
      } catch (err) {
        setAlertData({
          show: true,
          title: "Impor Gagal",
          message:
            "Gagal membaca file CSV. Pastikan format delimiter menggunakan Pipe '|'.",
          type: "error",
        });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  // 7.14.5. Fungsi Eksekusi Data (Simpan dan Hapus)
  const handleSave = (formData) => {
    if (editingItem) {
      setJraList((prev) =>
        prev.map((item) =>
          item.id === editingItem.id ? { ...item, ...formData } : item,
        ),
      );
      setEditingItem(null);
    } else {
      setJraList((prev) => [...prev, { id: generateId("jra"), ...formData }]);
    }
  };

  const confirmDelete = () => {
    setJraList((prev) => prev.filter((c) => c.id !== deleteConfirm.id));
    setDeleteConfirm({ show: false, id: null, name: "" });
  };

  // 7.14.6. Logika Ekstraksi Data Kategori Unik dan Filter Pencarian
  const uniqueKategori = [
    ...new Set(jraList.map((c) => c.kategoriUtama)),
  ].sort();
  const filteredData = jraList.filter((item) => {
    const matchesSearch =
      (item.jenisArsip || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.subKategori || "").toLowerCase().includes(search.toLowerCase());
    const matchesKategori =
      !filters.kategori || item.kategoriUtama === filters.kategori;
    const matchesKeterangan =
      !filters.keterangan || item.keterangan === filters.keterangan;

    return matchesSearch && matchesKategori && matchesKeterangan;
  });

  // IMPLEMENTASI: Pemotongan data untuk halaman aktif
  const indexOfLastItem =
    itemsPerPage === "all" ? filteredData.length : currentPage * itemsPerPage;
  const indexOfFirstItem =
    itemsPerPage === "all" ? 0 : indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  // 7.14.7. Tampilan Antarmuka Manajer Referensi JRA
  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4">
      {/* Rendering Modal Form dan Konfirmasi */}
      <JRAFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        data={editingItem}
        onSave={handleSave}
        isDarkMode={isDarkMode}
      />
      <ConfirmationModal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false })}
        onConfirm={confirmDelete}
        title="Hapus JRA?"
        message="Data ini akan dihapus dari referensi."
        itemName={deleteConfirm.name}
      />

      {/* Modal Notifikasi Import */}
      {alertData.show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div
            className={`p-6 rounded-2xl max-w-sm w-full text-center border shadow-2xl ${isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-800"}`}
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${alertData.type === "success" ? "bg-emerald-100 text-emerald-500" : "bg-red-100 text-red-500"}`}
            >
              {alertData.type === "success" ? (
                <CheckCircle size={32} />
              ) : (
                <AlertTriangle size={32} />
              )}
            </div>
            <h3 className="font-bold text-lg mb-2">{alertData.title}</h3>
            <p className="text-sm opacity-70 mb-6">{alertData.message}</p>
            <button
              onClick={() =>
                setAlertData({
                  show: false,
                  title: "",
                  message: "",
                  type: "success",
                })
              }
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Header Utama Manajer */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
        <div>
          <h3
            className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            Referensi Jadwal Retensi Arsip (JRA)
          </h3>
          <p
            className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
          >
            Kelola masa simpan arsip aktif dan inaktif.
          </p>
        </div>

        <div className="flex gap-2">
          {/* Tombol Import CSV */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current.click()}
            disabled={isImporting}
            className={`px-4 py-2 rounded-xl text-xs font-bold border border-dashed flex items-center gap-2 transition-all ${isDarkMode ? "border-slate-600 text-slate-300 hover:bg-slate-800" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}
          >
            {isImporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}{" "}
            Import CSV (|)
          </button>

          {/* Tombol Tambah Manual */}
          <button
            onClick={() => {
              setEditingItem(null);
              setIsFormOpen(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg"
          >
            <Plus size={16} /> Tambah Manual
          </button>
        </div>
      </div>

      {/* Area Filter Pencarian (Toolbar Filter) */}
      <div
        className={`p-4 rounded-2xl border mb-4 flex flex-col md:flex-row gap-3 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
      >
        {/* Input Pencarian Teks */}
        <div
          className={`flex items-center px-3 py-2 rounded-xl border flex-1 ${isDarkMode ? "bg-slate-700 border-slate-600" : "bg-slate-50 border-slate-200"}`}
        >
          <Search size={16} className="text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Cari Kode atau Nama Arsip..."
            className={`bg-transparent border-none text-xs w-full focus:outline-none ${isDarkMode ? "text-white placeholder-slate-500" : "text-slate-900"}`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value); // 1. Perintah asli Anda (menyimpan teks)
              setCurrentPage(1); // 2. TAMBAHAN BARU: Reset ke Halaman 1
            }}
          />
        </div>

        {/* Dropdown Kategori */}
        <select
          className={`px-3 py-2 rounded-xl border text-xs font-bold md:w-48 ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200 text-slate-700"}`}
          value={filters.kategori}
          onChange={(e) => setFilters({ ...filters, kategori: e.target.value })}
        >
          <option value="">-- Semua Kategori --</option>
          {uniqueKategori.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>

        {/* Dropdown Keterangan Retensi */}
        <select
          className={`px-3 py-2 rounded-xl border text-xs font-bold md:w-40 ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200 text-slate-700"}`}
          value={filters.keterangan}
          onChange={(e) =>
            setFilters({ ...filters, keterangan: e.target.value })
          }
        >
          <option value="">-- Keterangan --</option>
          <option value="Musnah">Musnah</option>
          <option value="Permanen">Permanen</option>
          <option value="Dinilai Kembali">Dinilai Kembali</option>
        </select>

        {/* Tombol Reset Filter */}
        {(filters.kategori || filters.keterangan || search) && (
          <button
            onClick={() => {
              setFilters({ kategori: "", keterangan: "" });
              setSearch("");
            }}
            className="p-2 rounded-xl bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300"
          >
            <RotateCcw size={16} />
          </button>
        )}
      </div>

      {/* Tabel Data JRA */}
      <div
        className={`flex-1 overflow-hidden rounded-2xl border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
      >
        <div className="h-full overflow-y-auto custom-scrollbar">
          <table
            className={`w-full text-left text-xs ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
          >
            <thead
              className={`font-bold uppercase sticky top-0 z-10 ${isDarkMode ? "bg-slate-700 text-slate-400" : "bg-slate-50 text-slate-500"}`}
            >
              <tr>
                <th className="p-4 w-48">Kategori</th>
                <th className="p-4">Jenis Arsip</th>
                <th className="p-4 w-20 text-center">Aktif</th>
                <th className="p-4 w-20 text-center">Inaktif</th>
                <th className="p-4 w-32">Keterangan</th>
                <th className="p-4 w-24 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {/* Tampilan Jika Data Kosong */}
              {filteredData.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="p-8 text-center text-slate-400 italic"
                  >
                    Data JRA tidak ditemukan.
                  </td>
                </tr>
              )}

              {/* Iterasi Data JRA */}
              {currentItems.map((item, index) => (
                <tr
                  key={item.id}
                  className={`transition-colors ${isDarkMode ? "hover:bg-slate-700/50" : "hover:bg-slate-50"}`}
                >
                  <td className="p-4">
                    <span className="block font-bold text-indigo-500">
                      {item.kategoriUtama}
                    </span>
                    <span className="text-[10px] opacity-70">
                      {item.subKategori}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-slate-800 dark:text-slate-200">
                    {item.jenisArsip}
                  </td>
                  <td className="p-4 text-center font-bold">
                    {item.retensiAktif} Thn
                  </td>
                  <td className="p-4 text-center font-bold">
                    {item.retensiInaktif} Thn
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.keterangan === "Permanen" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}
                    >
                      {item.keterangan}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setIsFormOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-700"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm({
                            show: true,
                            id: item.id,
                            name: item.jenisArsip,
                          })
                        }
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Statistik Tabel */}
      <div className="p-2 text-right text-[10px] text-slate-400">
        Total JRA: {filteredData.length}
      </div>

      {/* Komponen Kontrol Penomoran Halaman */}
      <div className="mt-4 pb-4">
        <PaginationControl
          totalItems={filteredData.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
};

// ==================================================================================
// 7.15. KOMPONEN FORMULIR REFERENSI LOKASI FISIK (PHYSICAL REF FORM MODAL)
// ==================================================================================
export const PhysRefFormModal = ({
  isOpen,
  onClose,
  data,
  type,
  onSave,
  allData,
  isDarkMode,
  isArrangementMode = false,
  fixedParentId = "",
}) => {
  // 1. Inisialisasi State Form dan Dropdown Bertingkat
  const [form, setForm] = React.useState({
    code: "",
    name: "",
    description: "",
    parentId: "",
  });
  const [selectedLoc, setSelectedLoc] = React.useState("");
  const [selectedRack, setSelectedRack] = React.useState("");
  const [selectedBox, setSelectedBox] = React.useState("");

  // 2. Konfigurasi Tipe Wadah
  const typeConfig = {
    location: { prefix: "LOC", label: "Gedung / Ruang" },
    rack: { prefix: "RAK", label: "Lemari / Rak" },
    box: { prefix: "BOX", label: "Boks Arsip" },
    folder: { prefix: "MAP", label: "Folder / Map" },
  };

  // 3. Efek Sinkronisasi Data dan Jalur Hierarki (Mendukung Konteks Penataan)
  React.useEffect(() => {
    if (isOpen) {
      // IMPLEMENTASI: Tentukan parent target berdasarkan mode Edit atau Konteks Penataan
      let targetParentId = data
        ? data.parentId || ""
        : isArrangementMode
          ? fixedParentId
          : "";

      let loc = "",
        rack = "",
        box = "";
      if (type === "rack") {
        loc = targetParentId;
      } else if (type === "box") {
        rack = targetParentId;
        const rObj = allData.find((d) => d.id === rack);
        if (rObj) loc = rObj.parentId || "";
      } else if (type === "folder") {
        box = targetParentId;
        const bObj = allData.find((d) => d.id === box);
        if (bObj) {
          rack = bObj.parentId || "";
          const rObj = allData.find((d) => d.id === rack);
          if (rObj) loc = rObj.parentId || "";
        }
      }

      setSelectedLoc(loc);
      setSelectedRack(rack);
      setSelectedBox(box);

      if (data) {
        setForm({ ...data, parentId: data.parentId || "" });
      } else {
        // Generator Auto-Code
        const prefix = typeConfig[type]?.prefix || "ITEM";
        const year = new Date().getFullYear();
        const padding = type === "folder" ? 4 : 3;

        const itemsThisYear = allData.filter(
          (r) => r.type === type && r.code && r.code.includes(`-${year}-`),
        );
        let maxNum = 0;
        if (itemsThisYear.length > 0) {
          const numbers = itemsThisYear.map((item) => {
            const parts = item.code.split("-");
            const numStr = parts[parts.length - 1];
            return parseInt(numStr, 10) || 0;
          });
          maxNum = Math.max(...numbers);
        }

        const autoCode = `${prefix}-${year}-${String(maxNum + 1).padStart(padding, "0")}`;
        setForm({
          code: autoCode,
          name: "",
          description: "",
          parentId: targetParentId,
        });
      }
    }
     
  }, [isOpen, data, type, isArrangementMode, fixedParentId]);

  // 4. Handler Pengiriman Form
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  if (!isOpen) return null;

  // 5. Kalkulasi Opsi Dropdown Dinamis
  const locations = allData
    .filter((d) => d.type === "location")
    .sort((a, b) => (a.code || "").localeCompare(b.code || ""));
  const racks = allData
    .filter((d) => d.type === "rack" && d.parentId === selectedLoc)
    .sort((a, b) => (a.code || "").localeCompare(b.code || ""));
  const boxes = allData
    .filter((d) => d.type === "box" && d.parentId === selectedRack)
    .sort((a, b) => (a.code || "").localeCompare(b.code || ""));

  // 6. Antarmuka Modal
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in">
      <div
        className={`w-full max-w-md rounded-3xl shadow-2xl p-8 border overflow-y-auto max-h-[90vh] custom-scrollbar ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-100"}`}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3
              className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
            >
              {data ? "Edit Data" : "Tambah Baru"}
            </h3>
            <p className="text-xs text-slate-500">
              Referensi {typeConfig[type]?.label || "Wadah"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* IMPLEMENTASI: Dropdown Bertingkat dengan Dukungan Penguncian (Read-Only Mode) */}
          {type !== "location" && (
            <div
              className={`p-4 rounded-xl border space-y-3 ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}
            >
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <MapPin size={12} /> Penempatan (Hierarki Induk)
                </h4>
                {isArrangementMode && (
                  <span className="text-[9px] font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                    Otomatis Sesuai Konteks
                  </span>
                )}
              </div>

              {/* Level 1: Lokasi */}
              <div>
                <select
                  required={type === "rack"}
                  disabled={isArrangementMode} // PENYESUAIAN: Kunci jika dipanggil dari Penataan
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm font-bold transition-colors ${isArrangementMode ? "opacity-70 bg-slate-100 dark:bg-slate-800 cursor-not-allowed" : isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-300 text-slate-700"}`}
                  value={selectedLoc}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedLoc(val);
                    setSelectedRack("");
                    setSelectedBox("");
                    if (type === "rack") setForm({ ...form, parentId: val });
                    else setForm({ ...form, parentId: "" });
                  }}
                >
                  <option value="">-- Pilih Gedung / Ruang --</option>
                  {locations.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Level 2: Rak */}
              {(type === "box" || type === "folder") && (
                <div>
                  <select
                    required={type === "box"}
                    disabled={isArrangementMode || !selectedLoc}
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm font-bold transition-colors ${isArrangementMode || !selectedLoc ? "opacity-70 bg-slate-100 dark:bg-slate-800 cursor-not-allowed" : isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-300 text-slate-700"}`}
                    value={selectedRack}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedRack(val);
                      setSelectedBox("");
                      if (type === "box") setForm({ ...form, parentId: val });
                      else setForm({ ...form, parentId: "" });
                    }}
                  >
                    <option value="">-- Pilih Lemari / Rak --</option>
                    {racks.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Level 3: Box */}
              {type === "folder" && (
                <div>
                  <select
                    required={type === "folder"}
                    disabled={isArrangementMode || !selectedRack}
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm font-bold transition-colors ${isArrangementMode || !selectedRack ? "opacity-70 bg-slate-100 dark:bg-slate-800 cursor-not-allowed" : isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-300 text-slate-700"}`}
                    value={selectedBox}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedBox(val);
                      setForm({ ...form, parentId: val });
                    }}
                  >
                    <option value="">-- Pilih Boks Arsip --</option>
                    {boxes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Area Input Identitas Wadah */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">
                Kode
              </label>
              <input
                type="text"
                className={`w-full px-3 py-3 rounded-xl border mt-1 text-sm font-mono font-bold uppercase ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-slate-100 border-slate-200 text-slate-700"}`}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-bold uppercase text-slate-400">
                Nama / Label
              </label>
              <input
                type="text"
                autoFocus
                className={`w-full px-3 py-3 rounded-xl border mt-1 text-sm ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-200"}`}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={`Nama ${typeConfig[type]?.label || "Wadah"}...`}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400">
              Deskripsi
            </label>
            <textarea
              rows="3"
              className={`w-full px-3 py-3 rounded-xl border mt-1 text-sm custom-scrollbar ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-200"}`}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={
                !form.code ||
                !form.name ||
                (type !== "location" && !form.parentId)
              }
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              Simpan Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================================================================================
// 7.16. KOMPONEN CETAK QR REFERENSI (REFERENCE QR MODAL)
// ==================================================================================
export const ReferenceQRModal = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  // 7.16.1. Logika Handler Mencetak (Buka Jendela Baru dan Tulis HTML)
  const handlePrint = () => {
    const printContent = document.getElementById("ref-print-area").innerHTML;
    const win = window.open("", "", "height=500,width=500");

    // Injeksi Struktur HTML & Inline CSS Khusus Print
    win.document.write("<html><head><title>Cetak Label Lokasi</title>");
    win.document.write(
      "<style>body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; } .label-box { border: 3px solid black; padding: 10px; width: 300px; display: flex; gap: 10px; align-items: center; } .qr-img { width: 80px; height: 80px; border: 1px solid #ccc; } .info { flex: 1; overflow: hidden; } .code { font-size: 16px; font-weight: 900; font-family: monospace; display: block; border-bottom: 2px solid black; margin-bottom: 5px; } .name { font-size: 12px; font-weight: bold; line-height: 1.2; text-transform: uppercase; }</style>",
    );
    win.document.write("</head><body>");
    win.document.write(printContent);
    win.document.write("</body></html>");
    win.document.close();

    // Beri jeda 500ms agar window selesai merender sebelum pop-up dialog print muncul
    setTimeout(() => win.print(), 500);
  };

  // 7.16.2. Tampilan Antarmuka Modal Cetak Label Lokasi
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-red-500"
        >
          <X size={24} />
        </button>
        <h3 className="text-lg font-bold text-slate-900 mb-6 text-center">
          Preview Label Cetak
        </h3>

        {/* AREA TARGET CETAK (Disembunyikan saat normal, hanya diambil InnerHTML-nya) */}
        <div className="flex justify-center mb-8">
          <div id="ref-print-area">
            <div
              className="label-box"
              style={{
                border: "3px solid black",
                padding: "15px",
                width: "320px",
                display: "flex",
                gap: "15px",
                alignItems: "center",
                backgroundColor: "white",
                color: "black",
              }}
            >
              {/* Gambar QR */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${data.id}`}
                alt="QR"
                style={{ width: "90px", height: "90px", display: "block" }}
              />

              {/* Data Teks Lokasi Fisik */}
              <div style={{ flex: 1, overflow: "hidden" }}>
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: "900",
                    fontFamily: "monospace",
                    display: "block",
                    borderBottom: "2px solid black",
                    marginBottom: "5px",
                    paddingBottom: "2px",
                  }}
                >
                  {data.code}
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    lineHeight: "1.2",
                    textTransform: "uppercase",
                    display: "block",
                    wordWrap: "break-word",
                  }}
                >
                  {data.name}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    marginTop: "5px",
                    display: "block",
                    color: "#555",
                  }}
                >
                  {data.type.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tombol Eksekusi Print */}
        <button
          onClick={handlePrint}
          className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
        >
          <Printer size={18} /> Cetak Label
        </button>
      </div>
    </div>
  );
};

// ==================================================================================
// 7.17. KOMPONEN PENGELOLA REFERENSI LOKASI FISIK (PHYSICAL REFERENCE MANAGER)
// ==================================================================================
// IMPLEMENTASI: Terima physRefs, setPhysRefs, dan resources dari props Induk
export const PhysicalReferenceManager = ({
  user,
  isDarkMode,
  physRefs,
  setPhysRefs,
  resources,
}) => {
  // 7.17.1. Inisialisasi State Dasar
  // HAPUS BARIS INI: const [physRefs, setPhysRefs] = useUserAwareState([], 'lifeos-archive-physical', user);
  const [activeTab, setActiveTab] = React.useState("location");

  // 7.17.2. State Kontrol Penomoran Halaman (Pagination)
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(100);

  // 7.17.3. State Modal, Edit, dan Pencarian
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState(null);
  const [printItem, setPrintItem] = React.useState(null); // State untuk modal cetak
  const [deleteConfirm, setDeleteConfirm] = React.useState({
    show: false,
    id: null,
    name: "",
  });
  const [search, setSearch] = React.useState("");
  const [hierarchyAlert, setHierarchyAlert] = React.useState({
    show: false,
    message: "",
  });

  // 7.17.4. Efek Samping: Reset pagination saat tab atau pencarian berubah
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search]);

  // 7.17.5. Konfigurasi Tampilan Tipe Lokasi (Warna dan Ikon)
  const typeConfig = {
    location: {
      id: "location",
      label: "Lokasi / Gedung",
      icon: MapPin,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    rack: {
      id: "rack",
      label: "Lemari / Rak",
      icon: Server,
      color: "text-indigo-500",
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
    },
    box: {
      id: "box",
      label: "Boks Arsip",
      icon: Box,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-900/20",
    },
    folder: {
      id: "folder",
      label: "Folder / Map",
      icon: Folder,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
  };

  // 7.17.6. Fungsi Handler Eksekusi Simpan Data
  const handleSave = (formData) => {
    if (editingItem) {
      setPhysRefs((prev) =>
        prev.map((item) =>
          item.id === editingItem.id ? { ...item, ...formData } : item,
        ),
      );
      setEditingItem(null);
    } else {
      // IMPLEMENTASI: Format ID konsisten dengan FileArrangementManager
      const newId = `phys-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      setPhysRefs((prev) => [
        ...prev,
        { id: newId, type: activeTab, ...formData },
      ]);
    }
  };

  // 7.17.7. Fungsi Handler Eksekusi Hapus Data
  // IMPLEMENTASI: Pengecekan Arsip & Hapus Bertingkat (Cascading Delete)
  const checkHasFiles = (containerId) => {
    const hasDirect = resources.some(
      (r) =>
        r.physLocationId === containerId ||
        r.physRackId === containerId ||
        r.physBoxId === containerId ||
        r.physFolderId === containerId,
    );
    if (hasDirect) return true;
    return physRefs
      .filter((ref) => ref.parentId === containerId)
      .some((child) => checkHasFiles(child.id));
  };

  const getAllDescendantIds = (parentId) => {
    let ids = [];
    const children = physRefs.filter((r) => r.parentId === parentId);
    for (let child of children) {
      ids.push(child.id);
      ids = ids.concat(getAllDescendantIds(child.id));
    }
    return ids;
  };

  const confirmDelete = () => {
    // 1. Validasi: Tolak jika ada arsip di dalam wadah ini atau sub-wadahnya
    if (checkHasFiles(deleteConfirm.id)) {
      setHierarchyAlert({
        show: true,
        message:
          "Aksi Ditolak: Wadah ini (atau sub-wadahnya) masih berisi arsip. Pindahkan atau hapus arsip terlebih dahulu.",
      });
      setDeleteConfirm({ show: false, id: null, name: "" });
      return;
    }

    // 2. Eksekusi: Hapus Wadah Target + Seluruh Anak Cucunya
    const idsToDelete = [
      deleteConfirm.id,
      ...getAllDescendantIds(deleteConfirm.id),
    ];
    setPhysRefs((prev) => prev.filter((i) => !idsToDelete.includes(i.id)));
    setDeleteConfirm({ show: false, id: null, name: "" });
  };

  // 7.17.8. Logika Filter dan Pengurutan Data
  const filteredData = physRefs
    .filter((i) => i.type === activeTab)
    .filter(
      (i) =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.code?.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => a.code.localeCompare(b.code));

  // 7.17.9. Logika Kalkulasi Penomoran Halaman (Pagination)
  const indexOfLastItem =
    itemsPerPage === "all" ? filteredData.length : currentPage * itemsPerPage;
  const indexOfFirstItem =
    itemsPerPage === "all" ? 0 : indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const CurrentIcon = typeConfig[activeTab].icon;

  // 7.17.10. Tampilan Antarmuka Manajer Referensi Lokasi Fisik
  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4">
      {/* Rendering Modal Terkait */}
      <PhysRefFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        data={editingItem}
        type={activeTab}
        onSave={handleSave}
        allData={physRefs}
        isDarkMode={isDarkMode}
      />

      <ReferenceQRModal
        isOpen={!!printItem}
        onClose={() => setPrintItem(null)}
        data={printItem}
      />

      <ConfirmationModal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false })}
        onConfirm={confirmDelete}
        title="Hapus Referensi?"
        message="Data lokasi ini akan dihapus permanen."
        itemName={deleteConfirm.name}
      />

      {hierarchyAlert.show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center border-2 border-orange-100 dark:border-slate-700">
            <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">
              Penghapusan Ditolak
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {hierarchyAlert.message}
            </p>
            <button
              onClick={() => setHierarchyAlert({ show: false, message: "" })}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Bagian Header Manajer Lokasi Fisik */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
        <div>
          <h3
            className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            Referensi Lokasi Fisik
          </h3>
          <p
            className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
          >
            Manajemen struktur penyimpanan arsip fisik.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setIsFormOpen(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg"
        >
          <Plus size={16} /> Tambah {typeConfig[activeTab].label}
        </button>
      </div>

      {/* Navigasi Tab Kategori Lokasi */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {Object.values(typeConfig).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap border ${activeTab === tab.id ? `${tab.bg} ${tab.color} border-${tab.color.split("-")[1]}-200` : "bg-transparent text-slate-500 border-slate-200 dark:border-slate-700"}`}
          >
            <tab.icon size={16} /> {tab.label}
            <span
              className={`px-1.5 py-0.5 rounded-md text-[9px] bg-white/50 dark:bg-black/20`}
            >
              {physRefs.filter((r) => r.type === tab.id).length}
            </span>
          </button>
        ))}
      </div>

      {/* Baris Input Pencarian */}
      <div
        className={`flex items-center px-4 py-3 rounded-2xl border mb-6 ${isDarkMode ? "bg-slate-800 border-slate-600" : "bg-white border-slate-200"}`}
      >
        <Search size={18} className="text-slate-400 mr-3" />
        <input
          type="text"
          placeholder={`Cari kode atau nama ${typeConfig[activeTab].label.toLowerCase()}...`}
          className={`bg-transparent border-none text-sm w-full focus:outline-none focus:ring-0 ${isDarkMode ? "text-white placeholder-slate-500" : "text-slate-900 placeholder-slate-400"}`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Area Tampilan Grid Data / Keadaan Kosong */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
        {filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 opacity-50 border-2 border-dashed rounded-3xl border-slate-200 dark:border-slate-700">
            <CurrentIcon size={48} className="mb-4 text-slate-300" />
            <p className="italic text-xs">
              Belum ada data referensi {typeConfig[activeTab].label}.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {currentItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border transition-all hover:shadow-lg group flex flex-col justify-between ${isDarkMode ? "bg-slate-800 border-slate-700 hover:border-indigo-500" : "bg-white border-slate-100 hover:border-indigo-200"}`}
                >
                  {/* Informasi Item */}
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div
                        className={`p-3 rounded-xl ${typeConfig[activeTab].bg} ${typeConfig[activeTab].color}`}
                      >
                        <CurrentIcon size={20} />
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
                        >
                          {item.code || "NO-CODE"}
                        </span>
                        <button
                          onClick={() => setPrintItem(item)}
                          className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 hover:text-slate-900 hover:bg-slate-300 transition-colors"
                          title="Cetak Label"
                        >
                          <Printer size={12} />
                        </button>
                      </div>
                    </div>
                    <h4
                      className={`font-bold text-base mb-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}
                    >
                      {item.name}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 min-h-[2.5em]">
                      {item.description || "Tidak ada keterangan."}
                    </p>
                  </div>

                  {/* Tombol Aksi Item */}
                  <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-700 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setIsFormOpen(true);
                      }}
                      className="flex-1 py-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-bold transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        setDeleteConfirm({
                          show: true,
                          id: item.id,
                          name: `${item.code} - ${item.name}`,
                        })
                      }
                      className="px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Kontrol Penomoran Halaman (Pagination Controls) */}
            <div className="mt-8 pb-4">
              <PaginationControl
                totalItems={filteredData.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                isDarkMode={isDarkMode}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ==================================================================================
// 8. SETTINGS MANAGER
// ==================================================================================
