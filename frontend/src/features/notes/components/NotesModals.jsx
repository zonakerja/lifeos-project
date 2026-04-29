import React from "react";
import { CheckCircle, X, Bot } from "lucide-react";

export const SummaryStyleModal = ({ isOpen, onClose, onConfirm, isDarkMode }) => {
  const styles = [
    { id: "default", label: "Default", desc: "Ringkasan standar, seimbang." },
    {
      id: "academic",
      label: "Akademis",
      desc: "Formal, detail, dan terstruktur rapi.",
    },
    {
      id: "meeting",
      label: "Risalah Rapat",
      desc: "Fokus pada poin keputusan & action items.",
    },
    {
      id: "simple",
      label: "Catatan Mudah",
      desc: "Bahasa santai dan poin-poin singkat.",
    },
    { id: "custom", label: "Lainnya", desc: "Gaya bebas sesuai konteks." },
  ];
  const [selected, setSelected] = React.useState("default");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className={`rounded-3xl shadow-2xl max-w-sm w-full p-8 border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3
            className={`text-xl font-bold flex items-center gap-3 ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
              <Bot size={20} />
            </div>
            Gaya Ringkasan AI
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${isDarkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-400"}`}
          >
            <X size={20} />
          </button>
        </div>
        <div className="space-y-3 mb-6">
          {styles.map((style) => (
            <button
              key={style.id}
              onClick={() => setSelected(style.id)}
              className={`w-full text-left p-4 rounded-2xl border transition-all ${selected === style.id ? "bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500" : isDarkMode ? "bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-300" : "bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50 text-slate-800"}`}
            >
              <div className="font-bold text-sm flex justify-between items-center">
                {style.label}
                {selected === style.id && (
                  <CheckCircle size={16} className="text-indigo-600" />
                )}
              </div>
              <div
                className={`text-xs mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
              >
                {style.desc}
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={() => onConfirm(selected)}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-xl shadow-indigo-200 transition-all active:scale-[0.98]"
        >
          Proses Ringkasan
        </button>
      </div>
    </div>
  );
};

// 2.6. Komponen: Modal Tambah/Edit Todo Tugas
