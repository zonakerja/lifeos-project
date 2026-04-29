import React from "react";
import { CalendarIcon, CheckCircle, Plus, Trash2, ChevronLeft, RefreshCw, Settings, Edit3, X, LinkIcon, FileText, Eye, ListTodo, StickyNote, Sparkles, Bot, Mic, StopCircle, Upload, Paperclip, Archive, Pencil, Trash, Loader2, Key, List } from "lucide-react";
import { fileToGenerativePart, callGeminiAI } from "../../lib/lifeosUtils";
import { ConfirmationModal, AlertModal, MarkdownRenderer } from "../../components/shared";
import { SummaryStyleModal } from "./components/NotesModals";
import { Planner } from "../planner/Planner";

export const NotesManager = ({
  schedules,
  isDarkMode,
  geminiApiKey,
  freeNotes,
  setFreeNotes,
  aiNotes,
  setAiNotes,
  lists,
  setLists,
}) => {
  const [activeTab, setActiveTab] = React.useState("free");
  // STATE BARU: Menampung Alert Modal Kustom
  const [alertModal, setAlertModal] = React.useState({
    isOpen: false,
    title: "",
    message: "",
    type: "error",
  });

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* RENDER BARU: Menampilkan Alert Modal di atas Notes Space */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2
            className={`text-3xl font-extrabold ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            Notes Space
          </h2>
          <p
            className={`${isDarkMode ? "text-slate-400" : "text-slate-500"} mt-1`}
          >
            Area bebas untuk mencatat dan merencanakan.
          </p>
        </div>

        <div
          className={`flex p-1.5 rounded-2xl shadow-sm border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
        >
          {[
            { id: "free", label: "Catatan Bebas", icon: StickyNote },
            { id: "ai", label: "Notes AI", icon: Bot },
            { id: "lists", label: "List Bebas", icon: ListTodo },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === tab.id ? "bg-slate-900 text-white shadow-md" : isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-700" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        {activeTab === "free" && (
          <FreeNotes
            notes={freeNotes}
            setNotes={setFreeNotes}
            isDarkMode={isDarkMode}
          />
        )}
        {/* OPER PROPS: Kirim setAlertModal ke AINotes */}
        {activeTab === "ai" && (
          <AINotes
            notes={aiNotes}
            setNotes={setAiNotes}
            schedules={schedules}
            isDarkMode={isDarkMode}
            apiKey={geminiApiKey}
            setAlertModal={setAlertModal}
          />
        )}
        {activeTab === "lists" && (
          <FreeLists
            lists={lists}
            setLists={setLists}
            isDarkMode={isDarkMode}
          />
        )}
      </div>
    </div>
  );
};

// 4.2. Komponen: Free Notes (Catatan Bebas / Sticky Notes)
export const FreeNotes = ({ notes, setNotes, isDarkMode }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [currentNote, setCurrentNote] = React.useState({
    id: null,
    title: "",
    content: "",
    color: "bg-yellow-50",
  });
  const [deleteNoteId, setDeleteNoteId] = React.useState(null);

  const themeColors = [
    {
      id: "bg-yellow-50",
      bgLight: "bg-yellow-50",
      bgDark: "bg-yellow-900/30",
      borderLight: "hover:border-yellow-200",
      borderDark: "hover:border-yellow-700",
      textLight: "text-slate-800",
      textDark: "text-yellow-50",
    },
    {
      id: "bg-blue-50",
      bgLight: "bg-blue-50",
      bgDark: "bg-blue-900/30",
      borderLight: "hover:border-blue-200",
      borderDark: "hover:border-blue-700",
      textLight: "text-slate-800",
      textDark: "text-blue-50",
    },
    {
      id: "bg-green-50",
      bgLight: "bg-emerald-50",
      bgDark: "bg-emerald-900/30",
      borderLight: "hover:border-emerald-200",
      borderDark: "hover:border-emerald-700",
      textLight: "text-slate-800",
      textDark: "text-emerald-50",
    },
    {
      id: "bg-pink-50",
      bgLight: "bg-pink-50",
      bgDark: "bg-pink-900/30",
      borderLight: "hover:border-pink-200",
      borderDark: "hover:border-pink-700",
      textLight: "text-slate-800",
      textDark: "text-pink-50",
    },
    {
      id: "bg-purple-50",
      bgLight: "bg-purple-50",
      bgDark: "bg-purple-900/30",
      borderLight: "hover:border-purple-200",
      borderDark: "hover:border-purple-700",
      textLight: "text-slate-800",
      textDark: "text-purple-50",
    },
  ];

  const getTheme = (colorId) => {
    const theme = themeColors.find((t) => t.id === colorId) || themeColors[0];
    return isDarkMode
      ? `${theme.bgDark} ${theme.borderDark} ${theme.textDark} border border-transparent`
      : `${theme.bgLight} ${theme.borderLight} ${theme.textLight} border border-transparent`;
  };

  const handleSave = () => {
    if (!currentNote.title && !currentNote.content) return setIsEditing(false);
    setNotes(
      currentNote.id
        ? notes.map((n) =>
            n.id === currentNote.id
              ? { ...currentNote, updatedAt: new Date() }
              : n,
          )
        : [...notes, { ...currentNote, id: Date.now(), updatedAt: new Date() }],
    );
    setIsEditing(false);
    setCurrentNote({ id: null, title: "", content: "", color: "bg-yellow-50" });
  };

  const confirmDelete = () => {
    setNotes(notes.filter((n) => n.id !== deleteNoteId));
    setDeleteNoteId(null);
  };

  return (
    <div className="h-full flex flex-col">
      <ConfirmationModal
        isOpen={!!deleteNoteId}
        onClose={() => setDeleteNoteId(null)}
        onConfirm={confirmDelete}
        title="Hapus Catatan?"
        message="Catatan ini akan dihapus permanen."
        itemName={
          notes.find((n) => n.id === deleteNoteId)?.title || "Tanpa Judul"
        }
      />
      {!isEditing ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px]">
          <button
            onClick={() => {
              setCurrentNote({
                id: null,
                title: "",
                content: "",
                color: "bg-yellow-50",
              });
              setIsEditing(true);
            }}
            className={`border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all h-full min-h-[200px] ${isDarkMode ? "border-slate-600 text-slate-500 hover:border-indigo-400 hover:text-indigo-400 hover:bg-slate-800" : "border-slate-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50"}`}
          >
            <Plus size={32} />
            <span className="font-bold mt-2">Catatan Baru</span>
          </button>
          {notes.map((note) => (
            <div
              key={note.id}
              className={`p-6 rounded-3xl shadow-sm hover:shadow-md transition-all cursor-pointer relative group flex flex-col min-h-[200px] ${getTheme(note.color)}`}
              onClick={() => {
                setCurrentNote(note);
                setIsEditing(true);
              }}
            >
              <h4 className="font-bold text-lg mb-2 line-clamp-1">
                {note.title || "Tanpa Judul"}
              </h4>
              <p className="text-sm line-clamp-5 flex-1 whitespace-pre-wrap opacity-90">
                {note.content}
              </p>
              <div className="text-[10px] mt-3 font-medium opacity-50">
                {new Date(note.updatedAt).toLocaleDateString()}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteNoteId(note.id);
                }}
                className={`absolute top-4 right-4 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${isDarkMode ? "bg-slate-900/50 hover:text-red-400" : "bg-white/50 hover:text-red-500"}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div
          className={`rounded-[2.5rem] shadow-sm border p-8 flex-1 flex flex-col animate-in fade-in zoom-in-95 duration-200 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
        >
          <div
            className={`flex justify-between items-center mb-6 pb-4 border-b ${isDarkMode ? "border-slate-700" : "border-slate-100"}`}
          >
            <div className="flex gap-2 items-center">
              <button
                onClick={handleSave}
                className={`p-2 rounded-full ${isDarkMode ? "hover:bg-slate-700 text-white" : "hover:bg-slate-100 text-slate-600"}`}
              >
                <ChevronLeft size={24} />
              </button>
              <div
                className={`flex gap-1.5 ml-2 pl-4 border-l ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}
              >
                {themeColors.map((c) => (
                  <button
                    key={c.id}
                    onClick={() =>
                      setCurrentNote({ ...currentNote, color: c.id })
                    }
                    className={`w-6 h-6 rounded-full border shadow-sm transition-all ${isDarkMode ? c.bgDark : c.bgLight} ${currentNote.color === c.id ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-800 scale-110" : "border-slate-200 dark:border-slate-600"}`}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={handleSave}
              className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              Selesai
            </button>
          </div>
          <input
            type="text"
            placeholder="Judul Catatan..."
            className={`text-3xl font-extrabold placeholder:text-slate-300 dark:placeholder:text-slate-600 border-none outline-none focus:outline-none focus:ring-0 w-full mb-2 px-0 bg-transparent ${isDarkMode ? "text-white" : "text-slate-800"}`}
            value={currentNote.title}
            onChange={(e) =>
              setCurrentNote({ ...currentNote, title: e.target.value })
            }
          />
          <div
            className={`w-full h-px mb-2 ${isDarkMode ? "bg-slate-700" : "bg-slate-100"}`}
          ></div>
          <textarea
            placeholder="Ketik catatan Anda di sini..."
            className={`flex-1 w-full resize-none border-none outline-none focus:outline-none focus:ring-0 text-lg px-0 bg-transparent ${isDarkMode ? "text-slate-300 placeholder:text-slate-600" : "text-slate-700 placeholder:text-slate-300"}`}
            value={currentNote.content}
            onChange={(e) =>
              setCurrentNote({ ...currentNote, content: e.target.value })
            }
            style={{
              backgroundImage: isDarkMode
                ? "linear-gradient(transparent 95%, #334155 95%)"
                : "linear-gradient(transparent 95%, #e2e8f0 95%)",
              backgroundSize: "100% 2.5rem",
              lineHeight: "2.5rem",
              backgroundAttachment: "local",
              paddingTop: "0.5rem",
            }}
          />
        </div>
      )}
    </div>
  );
};

// 4.3. Komponen: AI Notes (Catatan Cerdas dengan Audio & File)
export const AINotes = ({
  notes,
  setNotes,
  schedules,
  isDarkMode,
  apiKey,
  setAlertModal,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [viewMode, setViewMode] = React.useState("preview");
  const [currentNote, setCurrentNote] = React.useState({
    id: null,
    title: "",
    date: "",
    linkedScheduleId: "",
    content: "",
    aiSummary: "",
    audioTranscript: "",
    fileContext: "",
    hasAudio: false,
    fileAttachment: null,
    audioPreview: null,
  });
  const [audioStatus, setAudioStatus] = React.useState("idle");
  const [fileStatus, setFileStatus] = React.useState("idle");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const [deleteModal, setDeleteModal] = React.useState({ show: false, noteId: null });
  const [showStyleModal, setShowStyleModal] = React.useState(false);
  const mediaRecorderRef = React.useRef(null);
  const audioChunksRef = React.useRef([]);

  const handleSave = () => {
    if (!currentNote.title) {
      if (setAlertModal)
        setAlertModal({
          isOpen: true,
          title: "Validasi",
          message: "Judul notes wajib diisi",
          type: "error",
        });
      return;
    }
    const noteData = {
      ...currentNote,
      id: currentNote.id || Date.now(),
      updatedAt: new Date(),
    };
    setNotes(
      currentNote.id
        ? notes.map((n) => (n.id === currentNote.id ? noteData : n))
        : [...notes, noteData],
    );
    setIsEditing(false);
    resetCurrentNote();
  };

  const resetCurrentNote = () => {
    setCurrentNote({
      id: null,
      title: "",
      date: "",
      linkedScheduleId: "",
      content: "",
      aiSummary: "",
      audioTranscript: "",
      fileContext: "",
      hasAudio: false,
      fileAttachment: null,
      audioPreview: null,
    });
    setIsRecording(false);
    setAudioStatus("idle");
    setFileStatus("idle");
  };

  const confirmDelete = () => {
    setNotes(notes.filter((n) => n.id !== deleteModal.noteId));
    setDeleteModal({ show: false, noteId: null });
  };

  // FUNGSI BARU: Untuk menghapus lampiran
  const handleRemoveAudio = () => {
    setCurrentNote((prev) => ({
      ...prev,
      hasAudio: false,
      audioPreview: null,
      audioTranscript: "",
    }));
    setAudioStatus("idle");
  };
  const handleRemoveFile = () => {
    setCurrentNote((prev) => ({
      ...prev,
      fileAttachment: null,
      fileContext: "",
    }));
    setFileStatus("idle");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const url = URL.createObjectURL(audioBlob);
        setCurrentNote((prev) => ({
          ...prev,
          hasAudio: true,
          audioPreview: url,
        }));
        processAudioWithGemini(audioBlob);
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      if (setAlertModal)
        setAlertModal({
          isOpen: true,
          title: "Error Mikrofon",
          message: "Gagal mengakses mikrofon: " + err.message,
          type: "error",
        });
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    setIsRecording(false);
  };
  const toggleRecording = () =>
    isRecording ? stopRecording() : startRecording();

  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCurrentNote((prev) => ({ ...prev, hasAudio: true, audioPreview: url }));
    processAudioWithGemini(file);
  };

  const processAudioWithGemini = async (audioData) => {
    if (!apiKey) {
      setAudioStatus("error");
      if (setAlertModal)
        setAlertModal({
          isOpen: true,
          title: "API Key Missing",
          message: "API Key Gemini belum disetting di menu Settings!",
          type: "error",
        });
      return;
    }
    setAudioStatus("processing");
    try {
      const file =
        audioData instanceof File
          ? audioData
          : new File([audioData], "recording.webm", { type: "audio/webm" });
      const audioPart = await fileToGenerativePart(file);
      const transcript = await callGeminiAI(
        apiKey,
        "Transkripkan audio ini secara verbatim dan rapi. Jika ada beberapa pembicara, pisahkan. Output HANYA transkrip teks tanpa komentar lain.",
        [audioPart],
      );
      setCurrentNote((prev) => ({ ...prev, audioTranscript: transcript }));
      setAudioStatus("done");
    } catch (error) {
      setAudioStatus("error");
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
              "⚠️ Limit API Gemini Anda Tercapai.\n\nAudio tetap berhasil dilampirkan dengan status 'Error'. Silakan hapus lampiran dan upload ulang nanti.",
            type: "error",
          });
      } else {
        if (setAlertModal)
          setAlertModal({
            isOpen: true,
            title: "Gagal Transkrip",
            message: "Gagal mentranskrip audio: " + errMsg,
            type: "error",
          });
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCurrentNote((prev) => ({ ...prev, fileAttachment: file }));
    if (!apiKey) {
      setFileStatus("error");
      if (setAlertModal)
        setAlertModal({
          isOpen: true,
          title: "API Key Missing",
          message: "API Key Gemini belum disetting di menu Settings!",
          type: "error",
        });
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
        const extractedText = await callGeminiAI(
          apiKey,
          "Ekstrak seluruh teks/informasi penting dari dokumen ini. JANGAN diringkas, cukup salin isi mentahnya untuk referensi utama.",
          [filePart],
        );
        setCurrentNote((prev) => ({ ...prev, fileContext: extractedText }));
        setFileStatus("done");
      } else {
        setFileStatus("error");
        if (setAlertModal)
          setAlertModal({
            isOpen: true,
            title: "Format Tidak Didukung",
            message:
              "Format file belum didukung untuk ekstraksi (Gunakan PDF/Image/Txt).",
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
              "⚠️ Limit API Gemini Anda Tercapai.\n\nFile Anda tetap berhasil dilampirkan dengan status 'Error'. Silakan hapus lampiran dan upload ulang nanti.",
            type: "error",
          });
      } else {
        if (setAlertModal)
          setAlertModal({
            isOpen: true,
            title: "Ekstraksi Gagal",
            message: "Gagal mengekstrak file: " + errMsg,
            type: "error",
          });
      }
    }
  };

  const handleGenerateClick = () => {
    if (
      !currentNote.content.trim() &&
      !currentNote.audioTranscript.trim() &&
      !currentNote.fileContext.trim()
    ) {
      if (setAlertModal)
        setAlertModal({
          isOpen: true,
          title: "Data Kurang",
          message:
            "Syarat pembuatan ringkasan:\n\nMohon isi minimal 'Catatan Kasar' ATAU sediakan 'Rekaman/Upload Audio' / 'Upload File' (dan pastikan status sudah Ready) terlebih dahulu.",
          type: "error",
        });
      return;
    }
    if (audioStatus === "processing" || fileStatus === "processing") {
      if (setAlertModal)
        setAlertModal({
          isOpen: true,
          title: "Proses Berjalan",
          message:
            "Proses latar belakang (Transkrip Audio / Ekstraksi File) sedang berjalan. Mohon tunggu hingga status menjadi 'Ready'!",
          type: "error",
        });
      return;
    }
    setShowStyleModal(true);
  };

  const generateSummary = async (style) => {
    setShowStyleModal(false);
    setIsGenerating(true);
    setViewMode("preview");
    const stylePrompt =
      style === "academic"
        ? "Akademis/Formal"
        : style === "meeting"
          ? "Risalah Rapat (Action Items & Decisions)"
          : style === "simple"
            ? "Sederhana & Mudah Dimengerti"
            : "Standar";
    let prompt = `Buatlah ringkasan komprehensif dari materi berikut dengan gaya bahasa: ${stylePrompt}.\n\n`;
    if (currentNote.content)
      prompt += `--- CATATAN KASAR USER ---\n${currentNote.content}\n\n`;
    if (currentNote.audioTranscript)
      prompt += `--- TRANSKRIP AUDIO (SUMBER UTAMA) ---\n${currentNote.audioTranscript}\n\n`;
    if (currentNote.fileContext)
      prompt += `--- ISI DOKUMEN TAMBAHAN (REFERENSI) ---\n${currentNote.fileContext}\n\n`;
    prompt += `Instruksi Formatting (Wajib):\n1. Gunakan Markdown standard.\n2. Gunakan '#' untuk Judul Besar, '##' untuk Sub-judul.\n3. Gunakan bullet points '-' untuk list.\n4. Jika ada rumus matematika, Wajib gunakan format blok dengan delimiter '$$' untuk dipisah per baris, dan '$' untuk inline.\n5. Gunakan '**teks**' untuk bold pada poin penting.\n6. Prioritaskan dan kombinasikan informasi dari semua sumber yang diberikan di atas.`;

    try {
      const summary = await callGeminiAI(apiKey, prompt);
      setCurrentNote((prev) => ({ ...prev, aiSummary: summary }));
    } catch (error) {
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
              "⚠️ Limit API Gemini Anda Tercapai.\n\nSilakan coba Generate AI kembali setelah beberapa saat.",
            type: "error",
          });
      } else {
        if (setAlertModal)
          setAlertModal({
            isOpen: true,
            title: "Gagal Membuat Ringkasan",
            message: "Gagal membuat ringkasan: " + errMsg,
            type: "error",
          });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full">
      <ConfirmationModal
        isOpen={deleteModal.show}
        onClose={() => setDeleteModal({ show: false, noteId: null })}
        onConfirm={confirmDelete}
        title="Hapus Catatan?"
        message="Catatan ini akan dihapus permanen."
        itemName={
          notes.find((n) => n.id === deleteModal.noteId)?.title || "Tanpa Judul"
        }
      />
      <SummaryStyleModal
        isOpen={showStyleModal}
        onClose={() => setShowStyleModal(false)}
        onConfirm={generateSummary}
        isDarkMode={isDarkMode}
      />

      {!isEditing ? (
        <div className="space-y-4">
          <button
            onClick={() => {
              resetCurrentNote();
              setCurrentNote((prev) => ({
                ...prev,
                date: new Date().toISOString().split("T")[0],
              }));
              setIsEditing(true);
            }}
            className={`w-full py-4 border-2 border-dashed rounded-2xl flex items-center justify-center font-bold transition-all ${isDarkMode ? "border-slate-600 text-slate-400 hover:bg-slate-800 hover:border-indigo-400 hover:text-indigo-400" : "border-slate-300 text-slate-400 hover:bg-slate-50 hover:border-indigo-400 hover:text-indigo-500"}`}
          >
            <Plus size={20} className="mr-2" /> Buat Notes AI Baru
          </button>
          {notes.map((n) => (
            <div
              key={n.id}
              className={`p-6 rounded-2xl border transition-all cursor-pointer group relative ${isDarkMode ? "bg-slate-800 border-slate-700 hover:border-slate-500" : "bg-white border-slate-100 hover:shadow-lg"}`}
              onClick={() => {
                setCurrentNote(n);
                setIsEditing(true);
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4
                    className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-slate-800"}`}
                  >
                    {n.title}
                  </h4>
                  <div className="flex gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <CalendarIcon size={12} /> {n.date}
                    </span>
                    {n.linkedScheduleId && (
                      <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                        <LinkIcon size={10} /> Linked
                      </span>
                    )}
                  </div>
                </div>
                {n.aiSummary && (
                  <div className="bg-indigo-100 text-indigo-600 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1">
                    <Sparkles size={10} /> AI Ready
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-3 mb-2">
                {n.hasAudio && (
                  <span className="text-[10px] flex items-center gap-1 bg-red-50 text-red-500 px-2 py-1 rounded-full border border-red-100">
                    <Mic size={10} /> Audio
                  </span>
                )}
                {n.fileAttachment && (
                  <span className="text-[10px] flex items-center gap-1 bg-orange-50 text-orange-600 px-2 py-1 rounded-full border border-orange-100">
                    <Paperclip size={10} /> File
                  </span>
                )}
                {n.content && (
                  <span
                    className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded-full border ${isDarkMode ? "bg-slate-700 text-slate-300 border-slate-600" : "bg-slate-50 text-slate-500 border-slate-200"}`}
                  >
                    <FileText size={10} /> Notes
                  </span>
                )}
              </div>
              <p
                className={`text-sm line-clamp-2 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
              >
                {n.aiSummary
                  ? n.aiSummary.replace(/[*#]/g, "")
                  : n.content || "Tidak ada preview konten."}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteModal({ show: true, noteId: n.id });
                }}
                className="absolute bottom-6 right-6 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div
          className={`rounded-[2.5rem] shadow-sm border p-8 h-full flex flex-col animate-in slide-in-from-right-8 duration-300 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
        >
          <div
            className={`flex justify-between items-center mb-6 border-b pb-4 ${isDarkMode ? "border-slate-700" : "border-slate-100"}`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className={`p-2 rounded-full ${isDarkMode ? "hover:bg-slate-700 text-white" : "hover:bg-slate-100 text-slate-600"}`}
              >
                <ChevronLeft size={24} />
              </button>
              <h3
                className={`font-bold text-xl ${isDarkMode ? "text-white" : "text-slate-800"}`}
              >
                Detail Notes AI
              </h3>
            </div>
            <button
              onClick={handleSave}
              className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-slate-800 shadow-lg"
            >
              Simpan
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase pl-1">
                Judul / Topik
              </label>
              <input
                type="text"
                className={`w-full px-4 py-3 rounded-xl border ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-200"}`}
                value={currentNote.title}
                onChange={(e) =>
                  setCurrentNote({ ...currentNote, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase pl-1">
                Tanggal
              </label>
              <input
                type="date"
                className={`w-full px-4 py-3 rounded-xl border ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-200"}`}
                value={currentNote.date}
                onChange={(e) =>
                  setCurrentNote({ ...currentNote, date: e.target.value })
                }
              />
            </div>
            <div className="col-span-1 md:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase pl-1">
                Link Agenda (Opsional)
              </label>
              <select
                className={`w-full px-4 py-3 rounded-xl border ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-200"}`}
                value={currentNote.linkedScheduleId || ""}
                onChange={(e) => {
                  const selected = schedules.find(
                    (s) => s.id === e.target.value,
                  );
                  setCurrentNote((prev) => ({
                    ...prev,
                    linkedScheduleId: e.target.value,
                    title: prev.title || (selected ? selected.title : ""),
                  }));
                }}
              >
                <option value="">-- Pilih Agenda Planner --</option>
                {schedules &&
                  schedules.map((sch) => (
                    <option key={sch.id} value={sch.id}>
                      {sch.title} (
                      {new Date(sch.startDate || sch.date).toLocaleDateString(
                        "id-ID",
                        { day: "numeric", month: "short" },
                      )}
                      )
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
              {/* AREA AUDIO */}
              <div
                className={`p-4 rounded-xl border transition-all ${isRecording ? "bg-red-50 border-red-200" : isDarkMode ? "bg-slate-700 border-slate-600" : "bg-slate-50 border-slate-200"}`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Mic size={14} /> Audio Sumber
                  </span>
                  <div className="flex gap-2 items-center">
                    {audioStatus === "processing" && (
                      <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex gap-1 items-center">
                        <Loader2 size={10} className="animate-spin" />{" "}
                        Transcribing...
                      </span>
                    )}
                    {audioStatus === "error" && (
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        Error
                      </span>
                    )}
                    {audioStatus === "done" && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex gap-1 items-center">
                        <CheckCircle size={10} /> Ready
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={toggleRecording}
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${isRecording ? "bg-red-500 text-white shadow-lg shadow-red-200 animate-pulse" : "bg-white border border-slate-300 text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-500"}`}
                    title="Rekam Suara"
                  >
                    {isRecording ? <StopCircle size={24} /> : <Mic size={24} />}
                  </button>
                  <label
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer transition-all bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-indigo-500 hover:border-indigo-300`}
                    title="Upload Audio File"
                  >
                    <Upload size={20} />
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={handleAudioUpload}
                    />
                  </label>

                  {/* TOMBOL HAPUS AUDIO */}
                  {currentNote.audioPreview && !isRecording && (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <audio
                        controls
                        src={currentNote.audioPreview}
                        className="h-10 w-full"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveAudio}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
                        title="Hapus Audio"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                {currentNote.audioTranscript && (
                  <div
                    className={`mt-3 p-3 rounded-lg text-xs leading-relaxed max-h-24 overflow-y-auto ${isDarkMode ? "bg-slate-900/50 text-slate-400" : "bg-black/5 text-slate-600"}`}
                  >
                    <span className="font-bold block mb-1">Transkrip:</span>
                    {currentNote.audioTranscript}
                  </div>
                )}
              </div>

              {/* AREA FILE */}
              <div
                className={`p-4 rounded-xl border ${isDarkMode ? "bg-slate-700 border-slate-600" : "bg-slate-50 border-slate-200"}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Paperclip size={14} /> Upload Dokumen Tambahan
                  </span>
                  <div className="flex gap-2 items-center">
                    {fileStatus === "processing" && (
                      <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex gap-1 items-center">
                        <Loader2 size={10} className="animate-spin" />{" "}
                        Extracting...
                      </span>
                    )}
                    {fileStatus === "error" && (
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        Error
                      </span>
                    )}
                    {fileStatus === "done" && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex gap-1 items-center">
                        <CheckCircle size={10} /> Ready
                      </span>
                    )}
                  </div>
                </div>

                <label
                  className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDarkMode ? "border-slate-500 hover:bg-slate-600 bg-slate-800" : "border-slate-300 hover:bg-slate-50 bg-white"}`}
                >
                  <div className="flex flex-col items-center justify-center pt-2 pb-3">
                    {currentNote.fileAttachment ? (
                      <div className="flex items-center gap-2 text-indigo-600">
                        <FileText size={20} />
                        <span className="text-sm font-medium">
                          {currentNote.fileAttachment.name}
                        </span>
                      </div>
                    ) : (
                      <>
                        <Upload size={20} className="text-slate-400 mb-1" />
                        <p className="text-xs text-slate-500">
                          Klik upload Dokumen (PDF/Gambar/Teks)
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.txt,image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>

                {/* TOMBOL HAPUS FILE */}
                {currentNote.fileAttachment && (
                  <div className="mt-2 flex justify-between items-center bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                    <span className="text-xs text-indigo-900 truncate flex-1">
                      {currentNote.fileAttachment.name}
                    </span>
                    <div className="flex items-center gap-3 ml-2">
                      <a
                        href={URL.createObjectURL(currentNote.fileAttachment)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
                      >
                        <Eye size={12} /> Buka
                      </a>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        title="Hapus File"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col min-h-[150px]">
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 flex justify-between">
                  <span>Catatan Kasar</span>
                  <span className="text-[10px] opacity-70 normal-case">
                    (Syarat Utama AI, jika tanpa Audio)
                  </span>
                </label>
                <textarea
                  className={`flex-1 w-full p-4 rounded-xl border resize-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? "bg-slate-700 border-slate-600 text-white placeholder-slate-500" : "bg-white border-slate-200 placeholder-slate-400"}`}
                  placeholder="Ketik ide, coretan rapat, atau ringkasan manual di sini..."
                  value={currentNote.content}
                  onChange={(e) =>
                    setCurrentNote({ ...currentNote, content: e.target.value })
                  }
                />
              </div>
            </div>
            <div
              className={`flex-1 flex flex-col rounded-xl border relative overflow-hidden ${isDarkMode ? "bg-indigo-900/10 border-indigo-800" : "bg-indigo-50/30 border-indigo-100"}`}
            >
              <div
                className={`flex justify-between items-center p-3 border-b ${isDarkMode ? "bg-slate-800/50 border-indigo-900" : "bg-white/50 border-indigo-100"}`}
              >
                <label className="text-xs font-bold text-indigo-500 uppercase flex items-center gap-2">
                  <Bot size={14} /> AI Summary
                </label>
                <div className="flex gap-2">
                  {currentNote.aiSummary && (
                    <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                      <button
                        onClick={() => setViewMode("preview")}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${viewMode === "preview" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                      >
                        <Eye size={10} /> View
                      </button>
                      <button
                        onClick={() => setViewMode("edit")}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${viewMode === "edit" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                      >
                        <Edit3 size={10} /> Edit
                      </button>
                    </div>
                  )}
                  <button
                    onClick={handleGenerateClick}
                    disabled={isGenerating}
                    className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-all shadow-md shadow-indigo-200"
                  >
                    {isGenerating ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Sparkles size={12} />
                    )}
                    {isGenerating ? "Memproses AI..." : "Generate AI"}
                  </button>
                </div>
              </div>
              <div
                className={`flex-1 overflow-y-auto custom-scrollbar p-4 ${isDarkMode ? "bg-slate-800 text-slate-200" : "bg-white text-slate-700"}`}
              >
                {currentNote.aiSummary ? (
                  viewMode === "preview" ? (
                    <MarkdownRenderer
                      content={currentNote.aiSummary}
                      isDarkMode={isDarkMode}
                    />
                  ) : (
                    <textarea
                      className={`w-full h-full resize-none border-none focus:ring-0 bg-transparent font-mono text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
                      value={currentNote.aiSummary}
                      onChange={(e) =>
                        setCurrentNote({
                          ...currentNote,
                          aiSummary: e.target.value,
                        })
                      }
                    />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 space-y-2 opacity-60">
                    <Sparkles size={32} />
                    <p className="text-xs max-w-[200px] leading-relaxed">
                      Isi catatan kasar ATAU unggah/rekam audio (tunggu
                      "Ready"), lalu klik "Generate AI".
                    </p>
                    {!apiKey && (
                      <p className="text-[10px] text-red-400 font-bold bg-red-50 p-2 rounded mt-2">
                        API Key belum disetting. Silakan atur di menu Settings.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 4.4. Komponen: Free Lists (To-Do List Sederhana)
export const FreeLists = ({ lists, setLists, isDarkMode }) => {
  const [view, setView] = React.useState("active");
  const [newListName, setNewListName] = React.useState("");
  const [editingList, setEditingList] = React.useState({ id: null, title: "" });
  const [editingItem, setEditingItem] = React.useState({
    listId: null,
    itemId: null,
    text: "",
  });
  const [deleteListModal, setDeleteListModal] = React.useState({
    show: false,
    list: null,
  });
  // STATE BARU: Untuk konfirmasi arsip/pulihkan
  const [archiveListModal, setArchiveListModal] = React.useState({
    show: false,
    list: null,
    isRestore: false,
  });

  const handleAddList = (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    setLists([
      ...lists,
      { id: Date.now(), title: newListName, items: [], archived: false },
    ]);
    setNewListName("");
  };

  const handleUpdateListTitle = (e) => {
    e.preventDefault();
    if (!editingList.title.trim()) return;
    setLists(
      lists.map((l) =>
        l.id === editingList.id ? { ...l, title: editingList.title } : l,
      ),
    );
    setEditingList({ id: null, title: "" });
  };

  const deleteList = () => {
    setLists(lists.filter((l) => l.id !== deleteListModal.list.id));
    setDeleteListModal({ show: false, list: null });
  };

  // FUNGSI BARU: Konfirmasi Arsip List
  const confirmArchiveList = () => {
    setLists(
      lists.map((l) =>
        l.id === archiveListModal.list.id
          ? { ...l, archived: !archiveListModal.list.archived }
          : l,
      ),
    );
    setArchiveListModal({ show: false, list: null, isRestore: false });
  };

  const addItem = (listId, text) => {
    if (!text.trim()) return;
    setLists(
      lists.map((l) =>
        l.id === listId
          ? {
              ...l,
              items: [...l.items, { id: Date.now(), text, checked: false }],
            }
          : l,
      ),
    );
  };

  const handleUpdateItemText = (e) => {
    e.preventDefault();
    if (!editingItem.text.trim()) return;
    setLists(
      lists.map((l) =>
        l.id === editingItem.listId
          ? {
              ...l,
              items: l.items.map((i) =>
                i.id === editingItem.itemId
                  ? { ...i, text: editingItem.text }
                  : i,
              ),
            }
          : l,
      ),
    );
    setEditingItem({ listId: null, itemId: null, text: "" });
  };

  const deleteItem = (listId, itemId) => {
    setLists(
      lists.map((l) =>
        l.id === listId
          ? { ...l, items: l.items.filter((i) => i.id !== itemId) }
          : l,
      ),
    );
  };

  const toggleItem = (listId, itemId) => {
    setLists(
      lists.map((l) =>
        l.id === listId
          ? {
              ...l,
              items: l.items.map((i) =>
                i.id === itemId ? { ...i, checked: !i.checked } : i,
              ),
            }
          : l,
      ),
    );
  };

  const displayedLists = lists.filter((l) =>
    view === "active" ? !l.archived : l.archived,
  );

  return (
    <div className="h-full flex flex-col">
      <ConfirmationModal
        isOpen={deleteListModal.show}
        onClose={() => setDeleteListModal({ show: false, list: null })}
        onConfirm={deleteList}
        title="Hapus List?"
        message="List dan semua item di dalamnya akan dihapus permanen."
        itemName={deleteListModal.list?.title}
      />

      <ConfirmationModal
        isOpen={archiveListModal.show}
        onClose={() =>
          setArchiveListModal({ show: false, list: null, isRestore: false })
        }
        onConfirm={confirmArchiveList}
        title={archiveListModal.isRestore ? "Aktifkan List?" : "Arsipkan List?"}
        message={
          archiveListModal.isRestore
            ? "List ini akan dikembalikan ke daftar aktif utama."
            : "List ini akan dipindahkan ke dalam arsip untuk menyembunyikannya."
        }
        itemName={archiveListModal.list?.title}
        confirmText={archiveListModal.isRestore ? "Aktifkan" : "Arsipkan"}
        confirmColor={
          archiveListModal.isRestore
            ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
            : "bg-orange-500 hover:bg-orange-600 shadow-orange-200"
        }
      />

      <div className="flex justify-between items-center mb-6">
        <form
          onSubmit={handleAddList}
          className={`flex gap-2 p-1.5 rounded-xl border shadow-sm w-full max-w-md ${isDarkMode ? "bg-slate-700 border-slate-600" : "bg-white border-slate-200"}`}
        >
          <input
            type="text"
            placeholder="Judul List Baru..."
            className={`flex-1 px-4 py-2 bg-transparent border-none text-sm focus:outline-none ${isDarkMode ? "text-white placeholder-slate-400" : "text-slate-800"}`}
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
          />
          <button className="bg-slate-900 text-white px-4 rounded-lg font-bold hover:bg-slate-800">
            <Plus size={18} />
          </button>
        </form>
        <button
          onClick={() => setView(view === "active" ? "archived" : "active")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${view === "archived" ? "bg-orange-100 text-orange-700" : isDarkMode ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          {view === "active" ? (
            <>
              <Archive size={16} /> Lihat Arsip
            </>
          ) : (
            <>
              <ListTodo size={16} /> Kembali ke List
            </>
          )}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
        {displayedLists.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400">
            <ListTodo size={48} className="mx-auto mb-2 opacity-20" />
            <p>Tidak ada list {view === "active" ? "aktif" : "diarsipkan"}.</p>
          </div>
        )}
        {displayedLists.map((list) => (
          <div
            key={list.id}
            className={`rounded-3xl border shadow-sm flex flex-col overflow-hidden transition-all hover:shadow-md ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"} ${list.archived ? "opacity-75 grayscale" : ""}`}
          >
            <div
              className={`p-5 border-b flex justify-between items-center ${isDarkMode ? "bg-slate-700/50 border-slate-700" : "bg-slate-50/50 border-slate-50"}`}
            >
              {editingList.id === list.id ? (
                <form
                  onSubmit={handleUpdateListTitle}
                  className="flex-1 flex gap-2 mr-2"
                >
                  <input
                    className="flex-1 px-2 py-1 rounded border border-slate-200 text-sm font-bold"
                    autoFocus
                    value={editingList.title}
                    onChange={(e) =>
                      setEditingList({ ...editingList, title: e.target.value })
                    }
                    onBlur={() => setEditingList({ id: null, title: "" })}
                  />
                </form>
              ) : (
                <h4
                  className={`font-bold text-lg flex items-center gap-2 group ${isDarkMode ? "text-white" : "text-slate-800"}`}
                >
                  {list.title}
                  {!list.archived && (
                    <button
                      onClick={() =>
                        setEditingList({ id: list.id, title: list.title })
                      }
                      className="text-slate-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                </h4>
              )}
              <div className="flex gap-1">
                <button
                  onClick={() =>
                    setArchiveListModal({
                      show: true,
                      list: list,
                      isRestore: list.archived,
                    })
                  }
                  title={list.archived ? "Aktifkan Kembali" : "Arsipkan"}
                  className={`p-2 rounded-lg transition-colors ${list.archived ? "text-emerald-500 hover:bg-emerald-50" : "text-slate-400 hover:text-orange-500 hover:bg-orange-50"}`}
                >
                  {list.archived ? (
                    <RefreshCw size={16} />
                  ) : (
                    <Archive size={16} />
                  )}
                </button>
                <button
                  onClick={() => setDeleteListModal({ show: true, list: list })}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash size={16} />
                </button>
              </div>
            </div>
            <div className="p-5 flex-1 min-h-[150px]">
              <div className="space-y-2 mb-4">
                {list.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 group relative pr-6"
                  >
                    <button
                      onClick={() => toggleItem(list.id, item.id)}
                      className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${item.checked ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 hover:border-emerald-400"}`}
                    >
                      {item.checked && <CheckCircle size={12} />}
                    </button>
                    {editingItem.listId === list.id &&
                    editingItem.itemId === item.id ? (
                      <form onSubmit={handleUpdateItemText} className="flex-1">
                        <input
                          className="w-full px-2 py-0.5 rounded border border-indigo-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          autoFocus
                          value={editingItem.text}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              text: e.target.value,
                            })
                          }
                          onBlur={() =>
                            setEditingItem({
                              listId: null,
                              itemId: null,
                              text: "",
                            })
                          }
                        />
                      </form>
                    ) : (
                      <span
                        className={`text-sm flex-1 ${item.checked ? "line-through text-slate-400" : isDarkMode ? "text-slate-300" : "text-slate-700"}`}
                        onDoubleClick={() =>
                          !list.archived &&
                          setEditingItem({
                            listId: list.id,
                            itemId: item.id,
                            text: item.text,
                          })
                        }
                      >
                        {item.text}
                      </span>
                    )}
                    {!list.archived && editingItem.itemId !== item.id && (
                      <div
                        className={`hidden group-hover:flex absolute right-0 top-0 gap-1 pl-2 ${isDarkMode ? "bg-slate-800" : "bg-white"}`}
                      >
                        <button
                          onClick={() =>
                            setEditingItem({
                              listId: list.id,
                              itemId: item.id,
                              text: item.text,
                            })
                          }
                          className="text-slate-300 hover:text-indigo-500"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => deleteItem(list.id, item.id)}
                          className="text-slate-300 hover:text-red-500"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {view === "active" &&
                  list.items.every((i) => i.checked) &&
                  list.items.length > 0 && (
                    <p className="text-center text-xs text-emerald-600 font-bold bg-emerald-50 py-2 rounded-lg">
                      Semua tugas selesai! 🎉
                    </p>
                  )}
                {list.items.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center">
                    Belum ada item.
                  </p>
                )}
              </div>
            </div>
            {!list.archived && (
              <div
                className={`p-3 border-t ${isDarkMode ? "border-slate-700" : "border-slate-50"}`}
              >
                <input
                  type="text"
                  placeholder="+ Tambah item..."
                  className={`w-full px-4 py-2 rounded-xl text-sm border-none focus:ring-2 focus:ring-indigo-500/20 ${isDarkMode ? "bg-slate-700 text-white placeholder-slate-400" : "bg-slate-50 text-slate-800"}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addItem(list.id, e.target.value);
                      e.target.value = "";
                    }
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ==================================================================================
// 5. PLANNER COMPONENTS
// ==================================================================================

// 5.1. Komponen: Kalender yang Ditingkatkan (Enhanced Calendar)
// Menampilkan indikator visual untuk Jadwal, Todo, Rutinitas, dan Task
