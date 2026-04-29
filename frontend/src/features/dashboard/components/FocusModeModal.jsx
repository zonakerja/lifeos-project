import React from "react";
import { Settings, X, Timer, Play, Pause, RotateCcw } from "lucide-react";

export const FocusModeModal = ({ isOpen, onClose, isDarkMode }) => {
  const [mode, setMode] = React.useState("focus");
  const [durations, setDurations] = React.useState({
    focus: 25,
    shortBreak: 5,
    longBreak: 15,
  });
  const [timeLeft, setTimeLeft] = React.useState(durations.focus * 60);
  const [isActive, setIsActive] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);

  const labels = {
    focus: "Fokus",
    shortBreak: "Rehat",
    longBreak: "Istirahat",
  };

  React.useEffect(() => {
    if (!isActive) setTimeLeft(durations[mode] * 60);
  }, [durations, mode, isActive]);

  React.useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className={`rounded-[2.5rem] shadow-2xl w-full max-w-sm p-8 relative transition-all ${isDarkMode ? "bg-slate-800 text-white" : "bg-white text-slate-900"}`}
      >
        <button
          onClick={onClose}
          className={`absolute top-6 right-6 transition-colors ${isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-600"}`}
        >
          <X size={20} />
        </button>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`absolute top-6 left-6 transition-colors ${isDarkMode ? "text-slate-400 hover:text-indigo-400" : "text-slate-400 hover:text-indigo-600"}`}
          title="Ubah Durasi"
        >
          <Settings size={20} />
        </button>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2 text-indigo-600">
            <Timer size={24} />
            <h3
              className={`text-2xl font-extrabold ${isDarkMode ? "text-white" : "text-slate-900"}`}
            >
              Focus Mode
            </h3>
          </div>
          <p className="text-slate-500 text-sm font-medium">
            {isEditing
              ? "Atur durasi (menit)"
              : "Kerjakan tugas tanpa gangguan."}
          </p>
        </div>

        <div
          className={`flex p-1 rounded-2xl mb-8 ${isDarkMode ? "bg-slate-700" : "bg-slate-100"}`}
        >
          {Object.keys(labels).map((key) => (
            <button
              key={key}
              onClick={() => {
                setMode(key);
                setTimeLeft(durations[key] * 60);
                setIsActive(false);
                setIsEditing(false);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${mode === key ? (isDarkMode ? "bg-slate-600 text-white shadow-sm" : "bg-white text-indigo-600 shadow-sm") : "text-slate-500 hover:text-slate-400"}`}
            >
              {labels[key]}
            </button>
          ))}
        </div>

        <div className="text-center mb-10 min-h-[5rem] flex items-center justify-center">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={durations[mode]}
                onChange={(e) =>
                  setDurations((prev) => ({
                    ...prev,
                    [mode]: parseInt(e.target.value) || 1,
                  }))
                }
                className={`w-32 text-center text-5xl font-extrabold text-indigo-600 border-b-2 border-indigo-200 focus:border-indigo-600 outline-none bg-transparent`}
              />
              <span className="text-xl font-bold text-slate-400">mnt</span>
            </div>
          ) : (
            <span
              className={`text-7xl font-extrabold tracking-tighter tabular-nums ${isDarkMode ? "text-white" : "text-slate-800"}`}
            >
              {formatTime(timeLeft)}
            </span>
          )}
        </div>

        {!isEditing && (
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all ${isActive ? "bg-indigo-100 text-indigo-600" : "bg-indigo-600 text-white shadow-indigo-300"}`}
            >
              {isActive ? (
                <Pause size={32} fill="currentColor" />
              ) : (
                <Play size={32} fill="currentColor" className="ml-1" />
              )}
            </button>
            <button
              onClick={() => {
                setIsActive(false);
                setTimeLeft(durations[mode] * 60);
              }}
              className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${isDarkMode ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"}`}
            >
              <RotateCcw size={28} />
            </button>
          </div>
        )}

        {isEditing && (
          <button
            onClick={() => setIsEditing(false)}
            className={`w-full py-3 rounded-xl font-bold transition-all ${isDarkMode ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-slate-900 text-white hover:bg-slate-800"}`}
          >
            Simpan Pengaturan
          </button>
        )}
      </div>
    </div>
  );
};

// 2.4. Komponen: Modal Edit Referensi
