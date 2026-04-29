import React from "react";
import { CheckCircle, Trash2, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle, Sparkles, Archive, Timer, Snowflake, Info, List } from "lucide-react";

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  message,
  confirmText,
  confirmColor,
}) => {
  if (!isOpen) return null;

  let theme = "red";
  let Icon = Trash2;
  let defaultConfirmText = "Hapus";
  const safeTitle = title || "";

  if (safeTitle.includes("Cairkan") || safeTitle.includes("Unfreeze")) {
    theme = "blue";
    Icon = Snowflake;
    defaultConfirmText = "Ya, Unfreeze";
  } else if (safeTitle.includes("Aktifkan")) {
    theme = "emerald";
    Icon = RefreshCw;
    defaultConfirmText = "Ya, Aktifkan";
  } else if (safeTitle.includes("Arsip")) {
    theme = "orange";
    Icon = Archive;
    defaultConfirmText = "Arsipkan";
  } else if (safeTitle.includes("Berhasil")) {
    theme = "emerald";
    Icon = CheckCircle;
    defaultConfirmText = "OK";
  }

  const colorClasses = {
    red: {
      bgIcon: "bg-red-50 text-red-500 shadow-red-100",
      bgBorder: "bg-red-50 border-red-100",
      text: "text-red-700",
      btn: "bg-red-500 hover:bg-red-600 shadow-red-200",
    },
    blue: {
      bgIcon: "bg-blue-50 text-blue-500 shadow-blue-100",
      bgBorder: "bg-blue-50 border-blue-100",
      text: "text-blue-700",
      btn: "bg-blue-600 hover:bg-blue-700 shadow-blue-200",
    },
    emerald: {
      bgIcon: "bg-emerald-50 text-emerald-600 shadow-emerald-100",
      bgBorder: "bg-emerald-50 border-emerald-100",
      text: "text-emerald-700",
      btn: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200",
    },
    orange: {
      bgIcon: "bg-orange-50 text-orange-500 shadow-orange-100",
      bgBorder: "bg-orange-50 border-orange-100",
      text: "text-orange-700",
      btn: "bg-orange-500 hover:bg-orange-600 shadow-orange-200",
    },
  };

  const style = colorClasses[theme] || colorClasses.red;
  const finalBtnClass = confirmColor || style.btn;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-100">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg ${style.bgIcon}`}
        >
          <Icon size={24} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 text-center mb-2">
          {title}
        </h3>
        <p className="text-slate-500 text-center text-sm mb-4">{message}</p>

        {itemName && (
          <div
            className={`border p-3 rounded-xl text-center mb-6 ${style.bgBorder}`}
          >
            <span className={`font-bold block truncate ${style.text}`}>
              {itemName}
            </span>
          </div>
        )}

        <div className="flex gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-50 text-slate-700 font-bold rounded-2xl hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 font-bold rounded-2xl text-white transition-colors shadow-lg ${finalBtnClass}`}
          >
            {confirmText || defaultConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// 2.2. Komponen: Modal Alert Sederhana

export const AlertModal = ({ isOpen, onClose, title, message, type = "error" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-100 text-center">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 mx-auto shadow-sm ${type === "error" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}
        >
          {type === "error" ? <AlertTriangle size={24} /> : <Info size={24} />}
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          {title || "Peringatan"}
        </h3>
        <p className="text-slate-500 text-sm mb-6">{message}</p>
        <button
          onClick={onClose}
          className="w-full px-4 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-colors"
        >
          Mengerti
        </button>
      </div>
    </div>
  );
};

// 2.3. Komponen: Modal Mode Fokus (Timer Pomodoro)

export const PaginationControl = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  onItemsPerPageChange,
  isDarkMode,
}) => {
  if (totalItems === 0) return null;

  const totalPages =
    itemsPerPage === "all" ? 1 : Math.ceil(totalItems / itemsPerPage);
  const startItem =
    itemsPerPage === "all" ? 1 : (currentPage - 1) * itemsPerPage + 1;
  const endItem =
    itemsPerPage === "all"
      ? totalItems
      : Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div
      className={`flex flex-col md:flex-row justify-between items-center gap-4 p-4 border-t mt-auto ${isDarkMode ? "border-slate-700 text-slate-400" : "border-slate-200 text-slate-600"}`}
    >
      <div className="text-xs font-medium">
        Menampilkan {startItem}-{endItem} dari {totalItems} data
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs">Baris:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              onItemsPerPageChange(
                e.target.value === "all" ? "all" : Number(e.target.value),
              );
              onPageChange(1);
            }}
            className={`text-xs p-1 rounded border cursor-pointer ${isDarkMode ? "bg-slate-800 border-slate-600" : "bg-white border-slate-300"}`}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value="all">Semua</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30`}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-mono px-2">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================================================================================
// 3. MARKDOWN RENDERER
// ==================================================================================

export const MarkdownRenderer = ({ content, isDarkMode }) => {
  if (!content) {
    return (
      <p className="text-slate-400 italic flex flex-col items-center justify-center h-full gap-2 opacity-60">
        <Sparkles size={24} />
        <span>Belum ada konten ringkasan.</span>
      </p>
    );
  }

  // 3.1. Fungsi Helper: Render String Matematika (LaTeX ke HTML entity/span)
  const renderMathStr = (str) => {
    let html = str
      .replace(
        /\\text\{([^}]+)\}/g,
        '<span class="font-sans normal-case tracking-normal">$1</span>',
      )
      .replace(/\\\\/g, "<br/>")
      .replace(/\\quad/g, "&nbsp;&nbsp;&nbsp;&nbsp;")
      .replace(/\\qquad/g, "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;")
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold">$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')
      .replace(
        /\\sqrt\{([^}]+)\}/g,
        '&radic;<span class="border-t border-current uppercase pl-px">$1</span>',
      )
      .replace(
        /\\frac\{([^}]+)\}\{([^}]+)\}/g,
        '<span class="inline-flex flex-col text-center align-middle mx-1" style="font-size: 0.8em; line-height: 1.2;"><span class="border-b border-current pb-px">$1</span><span class="pt-px">$2</span></span>',
      )
      .replace(/\^\{([^}]+)\}/g, "<sup>$1</sup>")
      .replace(/\^([a-zA-Z0-9])/g, "<sup>$1</sup>")
      .replace(/_\{([^}]+)\}/g, "<sub>$1</sub>")
      .replace(/_([a-zA-Z0-9])/g, "<sub>$1</sub>")
      .replace(/\\(sin|cos|tan|log|ln|lim)/g, "$1")
      .replace(/\\sum/g, "&sum;")
      .replace(/\\int/g, "&int;")
      .replace(/\\infty/g, "&infin;")
      .replace(/\\partial/g, "&part;")
      .replace(/\\nabla/g, "&nabla;")
      .replace(/\\in\b/g, "&isin;")
      .replace(/\\notin\b/g, "&notin;")
      .replace(/\\cup/g, "&cup;")
      .replace(/\\cap/g, "&cap;")
      .replace(/\\subset/g, "&sub;")
      .replace(/\\supset/g, "&sup;")
      .replace(/\\emptyset/g, "&empty;")
      .replace(/\\exists/g, "&exist;")
      .replace(/\\forall/g, "&forall;")
      .replace(/\\times/g, "&times;")
      .replace(/\\div/g, "&divide;")
      .replace(/\\pm/g, "&plusmn;")
      .replace(/\\mp/g, "&#8723;")
      .replace(/\\leq/g, "&le;")
      .replace(/\\geq/g, "&ge;")
      .replace(/\\neq/g, "&ne;")
      .replace(/\\approx/g, "&approx;")
      .replace(/\\equiv/g, "&equiv;")
      .replace(/\\propto/g, "&prop;")
      .replace(/\\cdot/g, "&sdot;")
      .replace(/\\alpha/g, "&alpha;")
      .replace(/\\beta/g, "&beta;")
      .replace(/\\gamma/g, "&gamma;")
      .replace(/\\Gamma/g, "&Gamma;")
      .replace(/\\delta/g, "&delta;")
      .replace(/\\Delta/g, "&Delta;")
      .replace(/\\theta/g, "&theta;")
      .replace(/\\Theta/g, "&Theta;")
      .replace(/\\pi/g, "&pi;")
      .replace(/\\lambda/g, "&lambda;")
      .replace(/\\mu/g, "&mu;")
      .replace(/\\sigma/g, "&sigma;")
      .replace(/\\omega/g, "&omega;")
      .replace(/\\Omega/g, "&Omega;")
      .replace(/\\phi/g, "&phi;")
      .replace(/\\rho/g, "&rho;")
      .replace(/\\rightarrow/g, "&rarr;")
      .replace(/\\Rightarrow/g, "&rArr;")
      .replace(/\\leftarrow/g, "&larr;")
      .replace(/\\Leftarrow/g, "&lArr;")
      .replace(/\\leftrightarrow/g, "&harr;")
      .replace(/\\Leftrightarrow/g, "&hArr;");
    return { __html: html };
  };

  const blocks = content.split(/(\$\$[\s\S]*?\$\$)/g);

  // 3.2. Fungsi Helper: Parse Inline Styles (Bold, Italic, Link, Code, Inline Math)
  const parseInline = (text) => {
    // PERBAIKAN REGEX 1: Mendukung kurung siku bersarang (nested brackets) di dalam label link
    const parts = text.split(
      /(\*\*.*?\*\*|\*.*?\*|`.*?`|\$.*?\$|\[(?:[^\]]|\](?!\())*\]\([^)]+\))/g,
    );
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return (
          <strong
            key={i}
            className={`font-bold ${isDarkMode ? "text-indigo-400" : "text-indigo-700"}`}
          >
            {part.slice(2, -2)}
          </strong>
        );
      if (part.startsWith("*") && part.endsWith("*"))
        return (
          <em key={i} className="italic opacity-80">
            {part.slice(1, -1)}
          </em>
        );
      if (part.startsWith("`") && part.endsWith("`"))
        return (
          <code
            key={i}
            className={`px-1.5 py-0.5 rounded font-mono text-xs border ${isDarkMode ? "bg-slate-700 text-red-300 border-slate-600" : "bg-slate-100 text-red-600 border-slate-200"}`}
          >
            {part.slice(1, -1)}
          </code>
        );
      if (part.startsWith("$") && part.endsWith("$"))
        return (
          <span
            key={i}
            dangerouslySetInnerHTML={renderMathStr(part.slice(1, -1))}
            className={`font-serif italic px-1.5 py-0.5 rounded mx-0.5 font-bold tracking-wide ${isDarkMode ? "bg-slate-800 text-teal-400 border border-slate-700" : "bg-slate-100 text-teal-700 border border-slate-200"}`}
          />
        );

      // PERBAIKAN REGEX 2: Mengekstrak teks dan URL dengan lebih akurat
      const linkMatch = part.match(/^\[((?:[^\]]|\](?!\())*)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const label = linkMatch[1];
        const url = linkMatch[2];
        if (url.startsWith("app:")) {
          return (
            <button
              key={i}
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("app-navigate", { detail: url }),
                )
              }
              className={`text-[11px] font-bold px-2 py-0.5 rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1 mx-1 shadow-sm border ${isDarkMode ? "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 border-indigo-500/30" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-200"}`}
            >
              🔗 {label}
            </button>
          );
        }
        return (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline inline-flex items-center gap-1"
          >
            🔗 {label}
          </a>
        );
      }
      return part;
    });
  };

  // 3.3. Fungsi Helper: Parse Baris Tabel Markdown
  const parseTableRow = (rowStr) => {
    let s = rowStr.trim();
    if (s.startsWith("|")) s = s.substring(1);
    if (s.endsWith("|")) s = s.substring(0, s.length - 1);
    return s.split("|").map((c) => c.trim());
  };

  return (
    <div
      className={`space-y-3 text-sm leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
    >
      {blocks.map((block, blockIndex) => {
        // 3.4. Rendering Block Math ($$ ... $$)
        if (block.startsWith("$$") && block.endsWith("$$")) {
          const mathContent = block.slice(2, -2).trim();
          return (
            <div
              key={blockIndex}
              className={`p-4 rounded-xl text-center font-serif text-lg my-4 overflow-x-auto shadow-sm border ${isDarkMode ? "bg-slate-900/80 text-teal-400 border-slate-700" : "bg-slate-50 text-teal-700 border-slate-200"}`}
            >
              {mathContent.split("\n").map((line, i) => (
                <div
                  key={i}
                  dangerouslySetInnerHTML={renderMathStr(line)}
                  className="my-1 tracking-wider"
                />
              ))}
            </div>
          );
        }

        const lines = block.split("\n");
        const elements = [];
        let tableRows = [];

        // 3.5. Logika Render Tabel
        const flushTable = () => {
          if (tableRows.length > 0) {
            const headers = parseTableRow(tableRows[0]);
            const bodyRows =
              tableRows.length > 1 && tableRows[1].includes("---")
                ? tableRows.slice(2)
                : tableRows.slice(1);
            elements.push(
              <div
                key={`table-${blockIndex}-${elements.length}`}
                className={`overflow-x-auto my-4 rounded-xl border ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}
              >
                <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
                  <thead
                    className={
                      isDarkMode
                        ? "bg-slate-800 text-slate-300"
                        : "bg-slate-50 text-slate-600"
                    }
                  >
                    <tr>
                      {headers.map((h, i) => (
                        <th
                          key={i}
                          className={`p-3 font-bold border-b ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}
                        >
                          {parseInline(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y ${isDarkMode ? "divide-slate-700" : "divide-slate-100"}`}
                  >
                    {bodyRows.map((row, i) => (
                      <tr
                        key={i}
                        className={
                          isDarkMode
                            ? "hover:bg-slate-800/50"
                            : "hover:bg-slate-50/50"
                        }
                      >
                        {parseTableRow(row).map((cell, j) => (
                          <td key={j} className="p-3">
                            {parseInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>,
            );
            tableRows = [];
          }
        };

        // 3.6. Loop Baris per Baris
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trim();

          // Deteksi Tabel
          if (trimmed.startsWith("|") && trimmed.includes("|", 1)) {
            tableRows.push(trimmed);
            continue;
          } else {
            flushTable();
          }

          if (!trimmed) {
            elements.push(<div key={`${blockIndex}-${i}`} className="h-2" />);
            continue;
          }

          // Deteksi Headings (H1, H2, H3)
          if (line.startsWith("# ")) {
            elements.push(
              <h1
                key={`${blockIndex}-${i}`}
                className={`text-2xl font-extrabold mt-6 mb-3 border-b pb-2 ${isDarkMode ? "text-white border-slate-700" : "text-slate-900 border-slate-200"}`}
              >
                {parseInline(line.slice(2))}
              </h1>,
            );
            continue;
          }
          if (line.startsWith("## ")) {
            elements.push(
              <h2
                key={`${blockIndex}-${i}`}
                className={`text-xl font-bold mt-5 mb-2 ${isDarkMode ? "text-white" : "text-slate-800"}`}
              >
                {parseInline(line.slice(3))}
              </h2>,
            );
            continue;
          }
          if (line.startsWith("### ")) {
            elements.push(
              <h3
                key={`${blockIndex}-${i}`}
                className={`text-lg font-bold mt-4 mb-1 ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`}
              >
                {parseInline(line.slice(4))}
              </h3>,
            );
            continue;
          }

          // Deteksi Blockquote
          if (line.startsWith("> ")) {
            elements.push(
              <blockquote
                key={`${blockIndex}-${i}`}
                className={`border-l-4 pl-4 py-1 my-2 italic ${isDarkMode ? "border-indigo-500 text-slate-400" : "border-indigo-300 text-slate-600"}`}
              >
                {parseInline(line.slice(2))}
              </blockquote>,
            );
            continue;
          }

          // Deteksi Unordered List
          if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            elements.push(
              <div
                key={`${blockIndex}-${i}`}
                className="flex items-start gap-2 ml-2"
              >
                <span
                  className={`mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0 ${isDarkMode ? "bg-indigo-500" : "bg-indigo-600"}`}
                ></span>
                <span className="flex-1">{parseInline(trimmed.slice(2))}</span>
              </div>,
            );
            continue;
          }

          // Deteksi Ordered List
          if (/^\d+\./.test(trimmed)) {
            const number = trimmed.match(/^\d+/)[0];
            const text = trimmed.replace(/^\d+\.\s*/, "");
            elements.push(
              <div
                key={`${blockIndex}-${i}`}
                className="flex items-start gap-2 ml-2"
              >
                <span
                  className={`font-bold font-mono ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`}
                >
                  {number}.
                </span>
                <span className="flex-1">{parseInline(text)}</span>
              </div>,
            );
            continue;
          }

          // Deteksi Horizontal Rule
          if (trimmed === "---" || trimmed === "***") {
            elements.push(
              <hr
                key={`${blockIndex}-${i}`}
                className={`my-6 ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}
              />,
            );
            continue;
          }

          // Default: Paragraf
          elements.push(<p key={`${blockIndex}-${i}`}>{parseInline(line)}</p>);
        }
        flushTable();

        return <React.Fragment key={blockIndex}>{elements}</React.Fragment>;
      })}
    </div>
  );
};

// ==================================================================================
// 4. NOTES SPACE & AI ASSISTANT
// ==================================================================================

// 4.1. Komponen Utama: Notes Manager (Container)
