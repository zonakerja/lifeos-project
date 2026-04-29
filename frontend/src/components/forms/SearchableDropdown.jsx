import React from "react";
import { ChevronDown, Box, Filter, Search, List } from "lucide-react";

export const SearchableDropdown = ({
  options,
  value,
  onChange,
  placeholder,
  isDarkMode,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const wrapperRef = React.useRef(null);

  // Effect: Menutup dropdown jika user klik di luar elemen
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter opsi berdasarkan input pencarian user
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()),
  );
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-2 px-3 rounded-xl border text-sm flex justify-between items-center cursor-pointer transition-all ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200 hover:border-indigo-300"}`}
      >
        <span className={`truncate ${selectedOption ? "" : "text-slate-400"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {/* Dropdown Content */}
      {isOpen && (
        <div
          className={`absolute z-20 w-full mt-1 max-h-60 overflow-y-auto rounded-xl border shadow-xl ${isDarkMode ? "bg-slate-800 border-slate-600" : "bg-white border-slate-200"}`}
        >
          {/* Search Input Box */}
          <div
            className={`p-2 sticky top-0 border-b z-10 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
          >
            <div className="flex items-center px-2 rounded-lg border focus-within:ring-1 focus-within:ring-indigo-500 overflow-hidden">
              <Search size={12} className="text-slate-400 mr-1" />
              <input
                type="text"
                className={`w-full p-1.5 text-xs outline-none bg-transparent ${isDarkMode ? "text-white" : "text-slate-900"}`}
                placeholder="Cari..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options List */}
          {filteredOptions.length > 0 ? (
            <div className="py-1">
              {filteredOptions.map((opt, idx) => (
                <div
                  key={`${opt.value}-${idx}`}
                  className={`px-3 py-2 text-xs cursor-pointer transition-colors ${value === opt.value ? "bg-indigo-50 text-indigo-600 font-bold dark:bg-indigo-900/30 dark:text-indigo-300" : isDarkMode ? "text-slate-300 hover:bg-slate-700" : "text-slate-600 hover:bg-slate-50"}`}
                  onClick={() => {
                    if (!opt.disabled) {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch("");
                    }
                  }}
                  style={
                    opt.disabled ? { opacity: 0.5, cursor: "default" } : {}
                  }
                >
                  {opt.label}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-400 italic">
              Tidak ditemukan
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==================================================================================
// 6.3. RESOURCE AI & MANAGEMENT
// ==================================================================================

// 6.3.1. Resource AI Modal
// Modal untuk menampilkan dan menghasilkan ringkasan AI dari file/resource
