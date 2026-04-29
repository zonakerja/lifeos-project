import React from "react";
import { CheckCircle, Trash2, Settings, Edit3, X, FileText, Eye, Tag, Sparkles, Bot, Upload, Loader2, Key, ExternalLink, List } from "lucide-react";
import { fileToGenerativePart, callGeminiAI } from "../../lib/lifeosUtils";
import { MarkdownRenderer } from "../../components/shared";
import { SearchableDropdown } from "../../components/forms/SearchableDropdown";

export const ResourceAIModal = ({
  isOpen,
  onClose,
  resource,
  onSave,
  apiKey,
  isDarkMode,
}) => {
  const [summary, setSummary] = React.useState("");
  const [viewMode, setViewMode] = React.useState("preview"); // 'preview' (markdown) atau 'edit' (textarea)
  const [isGenerating, setIsGenerating] = React.useState(false);

  // Load summary yang sudah ada jika resource dibuka
  React.useEffect(() => {
    if (isOpen && resource) {
      setSummary(resource.aiSummary || "");
      setViewMode("preview");
    }
  }, [isOpen, resource, resource?.aiSummary]);

  // Handler: Generate Summary via Gemini API
  const handleGenerate = async () => {
    if (!apiKey)
      return alert("API Key Gemini belum disetting di menu Settings.");

    setIsGenerating(true);
    setViewMode("preview");

    try {
      let filePart = null;
      // Proses file jika tipe didukung (PDF, Image, Text)
      if (
        resource.file &&
        (resource.file.type === "application/pdf" ||
          resource.file.type.startsWith("image/") ||
          resource.file.type === "text/plain")
      ) {
        filePart = await fileToGenerativePart(resource.file);
      }

      const prompt = `Buat ringkasan komprehensif untuk resource berikut untuk keperluan knowledge-base AI masa depan.\nJudul: ${resource.title || resource.name}\nDeskripsi: ${resource.description || resource.content || "-"}\nTipe Referensi: ${resource.type}\n\nEkstrak informasi utama dan sajikan dalam format Markdown yang rapi. Sertakan poin-poin penting. Gunakan delimiter $$ untuk blok rumus matematika.`;

      const parts = filePart ? [filePart] : [];
      const res = await callGeminiAI(apiKey, prompt, parts);
      setSummary(res);
    } catch (error) {
      alert("Gagal membuat ringkasan: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen || !resource) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in">
      <div
        className={`w-full max-w-2xl rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-100"}`}
      >
        {/* Modal Header */}
        <div
          className={`p-5 border-b flex justify-between items-center ${isDarkMode ? "border-slate-700" : "border-slate-100"}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
              <Bot size={20} />
            </div>
            <div>
              <h3
                className={`font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
              >
                AI Knowledge Summary
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-sm">
                {resource.title || resource.name}
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {/* View/Edit Toggle */}
            {summary && (
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 mr-2">
                <button
                  onClick={() => setViewMode("preview")}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${viewMode === "preview" ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
                >
                  <Eye size={10} /> View
                </button>
                <button
                  onClick={() => setViewMode("edit")}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${viewMode === "edit" ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
                >
                  <Edit3 size={10} /> Edit
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${isDarkMode ? "text-slate-400 hover:bg-slate-800" : "text-slate-400 hover:bg-slate-100"}`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div
          className={`p-6 min-h-[300px] max-h-[60vh] overflow-y-auto custom-scrollbar ${isDarkMode ? "bg-slate-800" : "bg-slate-50"}`}
        >
          {summary ? (
            viewMode === "preview" ? (
              <MarkdownRenderer content={summary} isDarkMode={isDarkMode} />
            ) : (
              <textarea
                className={`w-full h-full min-h-[250px] resize-none border-none focus:ring-0 bg-transparent font-mono text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60 mt-10">
              <Sparkles size={48} className="mb-4" />
              <p className="text-sm font-bold">
                Belum ada ringkasan AI untuk resource ini.
              </p>
              <p className="text-xs mt-2 max-w-[250px] text-center leading-relaxed">
                Pilih file saat upload untuk ekstraksi otomatis (Mohon tunggu
                beberapa detik), atau klik Generate AI di bawah untuk meringkas
                manual.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className={`p-5 border-t flex justify-between items-center ${isDarkMode ? "border-slate-700" : "border-slate-100"}`}
        >
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 font-bold text-sm rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}{" "}
            Generate AI
          </button>
          <button
            onClick={() => {
              onSave(resource.id, summary);
              onClose();
            }}
            className="px-6 py-2 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-colors shadow-lg"
          >
            Simpan Hasil
          </button>
        </div>
      </div>
    </div>
  );
};

// 6.3.2. Resource Input Section
// Form untuk menambahkan Link, File, Note, atau Resource Global ke dalam Task/Project

export const ResourceInputSection = ({
  isDarkMode,
  tempResource,
  setTempResource,
  handleAddResource,
  fileStatus,
  handleFileSelect,
  freeNotes,
  aiNotes,
  lists,
  resources,
  onCancel,
}) => {
  // Opsi dropdown untuk memilih catatan internal
  const noteOptions = [
    { label: "--- Free Notes ---", value: "header-1", disabled: true },
    ...freeNotes.map((n) => ({ label: n.title, value: `free-${n.id}` })),
    { label: "--- AI Notes ---", value: "header-2", disabled: true },
    ...aiNotes.map((n) => ({ label: n.title, value: `ai-${n.id}` })),
    { label: "--- List Bebas ---", value: "header-3", disabled: true },
    ...lists.map((l) => ({ label: l.title, value: `list-${l.id}` })),
  ];

  const resourceOptions = resources.map((r) => ({
    label: r.title,
    value: r.id,
  }));

  return (
    <div
      className={`p-4 rounded-xl mb-4 border ${isDarkMode ? "bg-slate-800 border-slate-600" : "bg-white border-indigo-100 shadow-sm"}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
        {/* Input No */}
        <div className="md:col-span-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">
            Nomor
          </label>
          <input
            type="text"
            className={`w-full p-2 rounded-lg border text-sm ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
            value={tempResource.number || ""}
            onChange={(e) =>
              setTempResource({ ...tempResource, number: e.target.value })
            }
            placeholder="No."
          />
        </div>

        {/* Select Tipe Resource */}
        <div className="md:col-span-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">
            Tipe
          </label>
          <select
            className={`w-full p-2 rounded-lg border text-sm ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
            value={tempResource.type || "link"}
            onChange={(e) =>
              setTempResource({ ...tempResource, type: e.target.value })
            }
          >
            <option value="link">Web Link</option>
            <option value="file">Upload File</option>
            <option value="note">Pilih Catatan / List</option>
            <option value="existing">Resource Global</option>
          </select>
        </div>

        {/* Input Nama Resource */}
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase">
            Nama Resource (Input)
          </label>
          <input
            type="text"
            className={`w-full p-2 rounded-lg border text-sm ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200"}`}
            value={tempResource.name || ""}
            onChange={(e) =>
              setTempResource({ ...tempResource, name: e.target.value })
            }
            placeholder="Judul Dokumen..."
          />
        </div>
      </div>

      <div className="mb-3">
        {/* Kondisional Input berdasarkan Tipe */}
        {tempResource.type === "link" && (
          <div>
            <input
              type="url"
              placeholder="https://..."
              className={`w-full p-2 rounded-lg border text-sm ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50"}`}
              value={tempResource.url || ""}
              onChange={(e) =>
                setTempResource({ ...tempResource, url: e.target.value })
              }
            />
            {tempResource.url && (
              <p
                className={`text-[10px] mt-1 truncate ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`}
              >
                Link saat ini: {String(tempResource.url)}
              </p>
            )}
          </div>
        )}

        {tempResource.type === "file" && (
          <div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                className={`w-full p-2 rounded-lg border text-sm ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-white"}`}
                onChange={handleFileSelect}
              />
              {fileStatus === "processing" && (
                <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full flex gap-1 items-center whitespace-nowrap">
                  <Loader2 size={10} className="animate-spin" /> AI Extracting
                </span>
              )}
              {fileStatus === "error" && (
                <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded-full whitespace-nowrap">
                  No AI
                </span>
              )}
              {fileStatus === "done" && (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full flex gap-1 items-center whitespace-nowrap">
                  <CheckCircle size={10} /> AI Ready
                </span>
              )}
            </div>
            {tempResource.name && tempResource.url && (
              <p
                className={`text-[10px] mt-1 truncate ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`}
              >
                File saat ini: {String(tempResource.name)}
              </p>
            )}
          </div>
        )}

        {tempResource.type === "note" && (
          <SearchableDropdown
            options={noteOptions.filter((o) => !o.disabled)}
            value={tempResource.noteId}
            onChange={(val) => {
              let noteTitle = "Linked Note / List";
              let importedSummary = "";
              if (val.startsWith("free-"))
                noteTitle = freeNotes.find(
                  (n) => `free-${n.id}` === val,
                )?.title;
              else if (val.startsWith("ai-")) {
                const aiNote = aiNotes.find((n) => `ai-${n.id}` === val);
                noteTitle = aiNote?.title;
                importedSummary = aiNote?.aiSummary || "";
              } else if (val.startsWith("list-"))
                noteTitle = lists.find((l) => `list-${l.id}` === val)?.title;

              if (noteTitle)
                setTempResource({
                  ...tempResource,
                  noteId: val,
                  name: tempResource.name || noteTitle,
                  description: "Linked Note / List",
                  aiSummary: importedSummary,
                });
            }}
            placeholder="Cari & Pilih Catatan/List..."
            isDarkMode={isDarkMode}
          />
        )}

        {tempResource.type === "existing" && (
          <SearchableDropdown
            options={resourceOptions}
            value={tempResource.existingId}
            onChange={(val) => {
              const res = resources.find((r) => r.id === val);
              if (res)
                setTempResource({
                  ...tempResource,
                  existingId: val,
                  name: tempResource.name || res.title,
                  description: res.content,
                  number: res.number,
                  aiSummary: res.aiSummary,
                  addToGlobal: true,
                });
            }}
            placeholder="Cari Resource Global..."
            isDarkMode={isDarkMode}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="col-span-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">
            Tanggal
          </label>
          <input
            type="date"
            className={`w-full p-2 rounded-lg border text-sm ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50"}`}
            value={tempResource.date || ""}
            onChange={(e) =>
              setTempResource({ ...tempResource, date: e.target.value })
            }
          />
        </div>
        <div className="col-span-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">
            Deskripsi
          </label>
          <input
            type="text"
            className={`w-full p-2 rounded-lg border text-sm ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50"}`}
            value={tempResource.description || ""}
            onChange={(e) =>
              setTempResource({ ...tempResource, description: e.target.value })
            }
            placeholder="Keterangan..."
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="addToGlobal"
            className="rounded"
            checked={tempResource.addToGlobal || false}
            onChange={(e) =>
              setTempResource({
                ...tempResource,
                addToGlobal: e.target.checked,
              })
            }
          />
          <label htmlFor="addToGlobal" className="text-xs text-slate-500">
            Simpan/Tag ke Resource Global
          </label>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="bg-slate-100 text-slate-600 px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-200"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleAddResource}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800"
          >
            Tambahkan
          </button>
        </div>
      </div>
    </div>
  );
};

// 6.3.3. Resource List Table
// Menampilkan daftar resource yang sudah ditambahkan dalam format tabel

export const ResourceListTable = ({
  resources,
  isDarkMode,
  openResource,
  removeResource,
  openAIView,
}) => {
  if (!resources || resources.length === 0)
    return (
      <div className="text-center py-4 text-slate-400 text-sm italic">
        Belum ada resource/dasar pelaksanaan dilampirkan.
      </div>
    );

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table
        className={`w-full text-left text-xs ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
      >
        <thead
          className={`font-bold uppercase ${isDarkMode ? "bg-slate-700 text-slate-400" : "bg-slate-50 text-slate-500"}`}
        >
          <tr>
            <th className="p-3">No</th>
            <th className="p-3">Nama</th>
            <th className="p-3">Deskripsi</th>
            <th className="p-3">Tanggal</th>
            <th className="p-3">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {resources.map((res, idx) => (
            <tr
              key={`${res.id || idx}-${idx}`}
              className={
                isDarkMode ? "hover:bg-slate-800" : "hover:bg-slate-50"
              }
            >
              <td className="p-3 font-mono">{res.number || "-"}</td>
              <td
                className="p-3 font-bold text-indigo-500 cursor-pointer hover:underline flex items-center gap-2"
                onClick={() => openResource(res)}
              >
                {res.type === "file" ? (
                  <FileText size={12} />
                ) : (
                  <ExternalLink size={12} />
                )}
                {String(res.name || res.title || "Untitled")}
              </td>
              <td className="p-3">
                {typeof res.description === "string"
                  ? res.description
                  : typeof res.content === "string"
                    ? res.content
                    : "-"}
              </td>
              <td className="p-3">
                {res.date ? new Date(res.date).toLocaleDateString() : "-"}
              </td>
              <td className="p-3 flex gap-2">
                {openAIView && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      openAIView(res);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${res.aiSummary ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 dark:text-indigo-300" : "text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-700"}`}
                    title="AI Knowledge Summary"
                  >
                    <Bot size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    removeResource(res.id);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ==================================================================================
// 6.4. CALENDAR & AGENDA WIDGETS
// ==================================================================================

// 6.4.1. Day Detail Modal
// Modal popup untuk melihat detail agenda pada tanggal tertentu di kalender
