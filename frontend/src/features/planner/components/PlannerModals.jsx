import React from "react";
import { Trash2, CheckSquare, Edit3, X, ClipboardList, Snowflake, Info } from "lucide-react";
import { formatLocalYMD, parseLocalYMD } from "../../../lib/lifeosUtils";

export const EditReferenceModal = ({
  isOpen,
  onClose,
  onSave,
  initialValue,
  title,
}) => {
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSave(value);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
              <Edit3 size={20} />
            </div>
            {title || "Ubah Referensi"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Nama Baru
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 shadow-sm"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
          >
            Simpan Perubahan
          </button>
        </form>
      </div>
    </div>
  );
};

// 2.5. Komponen: Modal Pengaturan Gaya Ringkasan AI

export const AddTodoModal = ({ isOpen, onClose, onSave, editingItem }) => {
  const [title, setTitle] = React.useState("");
  const [priority, setPriority] = React.useState("medium");

  React.useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        setTitle(editingItem.title);
        setPriority(editingItem.priority);
      } else {
        setTitle("");
        setPriority("medium");
      }
    }
  }, [isOpen, editingItem]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(title, priority);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
              <CheckSquare size={20} />
            </div>
            {editingItem ? "Ubah Tugas" : "Tambah Tugas"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Nama Tugas
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Buat Laporan..."
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 shadow-sm"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Prioritas
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["low", "medium", "high"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-2 rounded-xl text-sm font-bold capitalize transition-all border-2 ${priority === p ? (p === "high" ? "border-red-500 bg-red-50 text-red-600" : p === "medium" ? "border-orange-500 bg-orange-50 text-orange-600" : "border-slate-500 bg-slate-50 text-slate-600") : "border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
          >
            {editingItem ? "Simpan Perubahan" : "Simpan Tugas"}
          </button>
        </form>
      </div>
    </div>
  );
};

// 2.7. Komponen: Modal Log Aktivitas Aktual

export const ActivityLogModal = ({
  isOpen,
  onClose,
  onSave,
  scheduledDate,
}) => {
  const [actualDate, setActualDate] = React.useState("");
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    if (isOpen && scheduledDate) {
      setActualDate(formatLocalYMD(scheduledDate));
      setNote("");
    }
  }, [isOpen, scheduledDate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
              <ClipboardList size={20} />
            </div>
            Log Aktual
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Dilakukan Pada
            </label>
            <input
              type="date"
              value={actualDate}
              onChange={(e) => setActualDate(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Catatan
            </label>
            <textarea
              rows="3"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ada kendala?"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 resize-none shadow-sm"
            />
          </div>
          <button
            onClick={() => onSave(actualDate, note)}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
          >
            Simpan Log
          </button>
        </div>
      </div>
    </div>
  );
};

// 2.8. Komponen: Modal Pembekuan Rutinitas (Freeze Routine)

export const FreezeRoutineModal = ({ isOpen, onClose, onSave, routineTitle }) => {
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      setStartDate("");
      setEndDate("");
      setReason("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason)
      return alert("Mohon lengkapi semua data");
    if (new Date(endDate) < new Date(startDate))
      return alert("Tanggal selesai tidak boleh sebelum tanggal mulai");

    onSave({ startDate, endDate, reason });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
              <Snowflake size={20} />
            </div>
            Freeze Rutinitas
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        <div className="mb-4 bg-blue-50 text-blue-700 p-3 rounded-xl text-xs">
          <p className="font-bold">Info:</p>
          Rutinitas "{routineTitle}" tidak akan muncul di agenda dan tidak
          memengaruhi performa selama periode ini.
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Mulai
              </label>
              <input
                type="date"
                className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Selesai
              </label>
              <input
                type="date"
                className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Alasan
            </label>
            <input
              type="text"
              placeholder="Sakit, Liburan, Mudik..."
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 shadow-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-xl shadow-blue-200 transition-all active:scale-[0.98]"
          >
            Simpan Freeze
          </button>
        </form>
      </div>
    </div>
  );
};

// 2.9. Komponen: Modal Riwayat & Edit Pembekuan Rutinitas

export const FreezeHistoryModal = ({
  isOpen,
  onClose,
  routine,
  onEditFreeze,
  onDeleteFreeze,
}) => {
  const [editingIndex, setEditingIndex] = React.useState(null);
  const [editForm, setEditForm] = React.useState({
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [deleteConfirm, setDeleteConfirm] = React.useState({
    show: false,
    index: null,
  });

  React.useEffect(() => {
    if (isOpen) {
      setEditingIndex(null);
      setDeleteConfirm({ show: false, index: null });
    }
  }, [isOpen]);

  if (!isOpen || !routine) return null;

  // Trik: Menyimpan index asli sebelum array di-sort agar kita tidak salah mengedit/menghapus data
  const periods = (routine.freezePeriods || [])
    .map((p, idx) => ({ ...p, originalIndex: idx }))
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  const handleEditClick = (period) => {
    setEditingIndex(period.originalIndex);
    setEditForm({
      startDate: period.startDate,
      endDate: period.endDate,
      reason: period.reason,
    });
  };

  const handleSaveEdit = (e, originalIndex) => {
    e.preventDefault();
    // Validasi: pastikan tanggal masuk akal
    if (new Date(editForm.endDate) < new Date(editForm.startDate)) return;
    if (onEditFreeze) onEditFreeze(routine.id, originalIndex, editForm);
    setEditingIndex(null);
  };

  const handleDeleteClick = (originalIndex) => {
    setDeleteConfirm({ show: true, index: originalIndex });
  };

  const executeDelete = () => {
    if (onDeleteFreeze && deleteConfirm.index !== null) {
      onDeleteFreeze(routine.id, deleteConfirm.index);
    }
    setDeleteConfirm({ show: false, index: null });
  };

  return (
    <>
      {/* Memanggil Modal Konfirmasi Kustom untuk menghapus riwayat freeze */}
      <ConfirmationModal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, index: null })}
        onConfirm={executeDelete}
        title="Hapus Riwayat Freeze?"
        message="Data pembekuan rutinitas ini akan dihapus permanen. Performa rutinitas di masa lalu mungkin akan terpengaruh."
        confirmText="Konfirmasi Hapus"
        confirmColor="bg-red-500 hover:bg-red-600 shadow-red-200"
      />

      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 border border-slate-100 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Snowflake size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">
                Riwayat Freeze
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-[150px]">
                {routine.title}
              </p>
            </div>
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {periods.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p className="text-sm italic">Belum ada data pembekuan.</p>
              </div>
            ) : (
              periods.map((p) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const start = parseLocalYMD(p.startDate);
                const end = parseLocalYMD(p.endDate);
                end.setHours(23, 59, 59, 999);

                const isActive = today >= start && today <= end;
                const isValid = start <= end;

                if (editingIndex === p.originalIndex) {
                  return (
                    <form
                      key={p.originalIndex}
                      onSubmit={(e) => handleSaveEdit(e, p.originalIndex)}
                      className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-blue-200 shadow-sm animate-in fade-in"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">
                            Mulai
                          </label>
                          <input
                            type="date"
                            required
                            className="w-full px-2 py-1.5 text-xs rounded-xl border border-slate-200"
                            value={editForm.startDate}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                startDate: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">
                            Selesai
                          </label>
                          <input
                            type="date"
                            required
                            className="w-full px-2 py-1.5 text-xs rounded-xl border border-slate-200"
                            value={editForm.endDate}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                endDate: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          Alasan
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                          value={editForm.reason}
                          onChange={(e) =>
                            setEditForm({ ...editForm, reason: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingIndex(null)}
                          className="flex-1 bg-slate-200 text-slate-600 text-xs py-2 rounded-xl font-bold hover:bg-slate-300 transition-colors"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-blue-600 text-white text-xs py-2 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors"
                        >
                          Simpan
                        </button>
                      </div>
                    </form>
                  );
                }

                return (
                  <div
                    key={p.originalIndex}
                    className={`p-4 rounded-2xl border group relative transition-all ${isActive ? "bg-blue-50 border-blue-200 shadow-sm" : "bg-white border-slate-100 hover:border-slate-200"}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span
                        className={`text-xs font-bold pr-10 ${isActive ? "text-blue-700" : "text-slate-700"}`}
                      >
                        {isValid ? (
                          `${start.toLocaleDateString("id-ID", { day: "numeric", month: "short" })} - ${end.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`
                        ) : (
                          <span className="line-through opacity-50">
                            {start.toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                            })}{" "}
                            (Dibatalkan)
                          </span>
                        )}
                      </span>
                      {isActive && (
                        <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold shadow-sm">
                          Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 italic">
                      "{p.reason}"
                    </p>

                    {/* Tombol Edit dan Delete (Hanya muncul saat di-hover) */}
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-slate-100">
                      <button
                        onClick={() => handleEditClick(p)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                        title="Edit Data Freeze"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(p.originalIndex)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                        title="Hapus Riwayat Freeze"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// 2.10. Komponen Kontrol Penomoran Halaman (Pagination)

/**
 * Komponen antarmuka untuk navigasi halaman dan pembatasan jumlah baris data.
 * Merupakan shared component yang digunakan juga pada menu File Control.
 */
