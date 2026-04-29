import React from "react";
import { RECORD_TYPE_BY_STORAGE_KEY, api, apiUrl } from "./apiClient";

const resolveDefaultValue = (defaultValue) =>
  typeof defaultValue === "function" ? defaultValue() : defaultValue;

const getApiCacheKey = (userId, key) => `lifeos-api-cache:${userId}:${key}`;

const readApiCache = (userId, key, fallback) => {
  if (!userId) return fallback;
  try {
    const cached = window.localStorage.getItem(getApiCacheKey(userId, key));
    return cached ? JSON.parse(cached) : fallback;
  } catch {
    return fallback;
  }
};

const writeApiCache = (userId, key, value) => {
  if (!userId) return;
  try {
    window.localStorage.setItem(
      getApiCacheKey(userId, key),
      JSON.stringify(value),
    );
  } catch {
    // Cache write is best-effort.
  }
};

export const simpleHash = (str) => {
  try {
    return btoa(str);
  } catch {
    return str;
  }
};

// 1.3. Generator ID - Membuat ID unik dengan prefix, timestamp, dan random string
export const generateId = (prefix) => {
  const randomPart = Math.random().toString(36).substr(2, 9);
  const timePart = Date.now().toString(36);
  return `${prefix}-${timePart}-${randomPart}`;
};

// 1.4. Generator Warna Project - Menentukan warna dinamis berdasarkan ID
export const getProjectColorClass = (id) => {
  const PROJECT_COLORS = [
    "bg-blue-500",
    "bg-indigo-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-rose-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-lime-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
  ];
  if (!id) return "bg-slate-500";
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length];
};

// 1.5. Hook: useStickyState - Sinkronisasi state React dengan LocalStorage
export const useStickyState = (defaultValue, key) => {
  const [value, setValue] = React.useState(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null
        ? JSON.parse(stickyValue)
        : resolveDefaultValue(defaultValue);
    } catch {
      return resolveDefaultValue(defaultValue);
    }
  });

  React.useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
};

// 1.6. Hook: useUserAwareState - Hook khusus untuk manajemen Multi-User / Data Isolation
export const useUserAwareState = (defaultValue, key, currentUser) => {
  const recordType = RECORD_TYPE_BY_STORAGE_KEY[key];
  const defaultValueRef = React.useRef(defaultValue);
  const [globalState, setGlobalState] = React.useState(() =>
    resolveDefaultValue(defaultValue),
  );
  const [isServerHydrated, setIsServerHydrated] = React.useState(false);
  const safeGlobalState = React.useMemo(
    () => (Array.isArray(globalState) ? globalState : []),
    [globalState],
  );
  const isSuperAdmin = currentUser?.role === "super_admin";

  const userState = isSuperAdmin
    ? safeGlobalState
    : safeGlobalState.filter(
        (item) => !item.userId || item.userId === currentUser?.id,
      );

  const setUserState = (updater) => {
    setGlobalState((prevGlobal) => {
      const safePrev = Array.isArray(prevGlobal) ? prevGlobal : [];

      // PERBAIKAN: Kalkulasi ulang state paling baru (fresh) tepat di dalam callback
      // Ini mencegah proses latar belakang (AI) menimpa data yang baru saja disave pengguna
      const freshUserState = isSuperAdmin
        ? safePrev
        : safePrev.filter(
            (item) => !item.userId || item.userId === currentUser?.id,
          );

      const nextUserState =
        typeof updater === "function" ? updater(freshUserState) : updater;

      if (isSuperAdmin) {
        return nextUserState.map((item) => ({
          ...item,
          userId: item.userId || currentUser?.id,
        }));
      }

      const otherUsersData = safePrev.filter(
        (item) => item.userId && item.userId !== currentUser?.id,
      );
      const myNextData = nextUserState.map((item) => ({
        ...item,
        userId: item.userId || currentUser?.id,
      }));

      return [...otherUsersData, ...myNextData];
    });
  };

  React.useEffect(() => {
    if (!recordType || !currentUser?.id) {
      setIsServerHydrated(false);
      return;
    }

    let cancelled = false;
    const fallback = resolveDefaultValue(defaultValueRef.current);
    const cachedState = readApiCache(currentUser.id, key, fallback);
    setGlobalState(Array.isArray(cachedState) ? cachedState : fallback);

    const hydrate = async () => {
      try {
        const records = await api.listRecords(recordType);
        if (cancelled) return;

        const serverState = records.map((record) => record.payload);
        setGlobalState(serverState);
        writeApiCache(currentUser.id, key, serverState);
      } catch (error) {
        console.warn(`Gagal sync ${key} dari API, memakai cache API lokal.`, error);
      } finally {
        if (!cancelled) setIsServerHydrated(true);
      }
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [recordType, currentUser?.id, key]);

  React.useEffect(() => {
    if (!recordType || !currentUser?.id || !isServerHydrated) return;

    const timeout = window.setTimeout(() => {
      const itemsToSync = isSuperAdmin
        ? safeGlobalState
        : safeGlobalState.filter(
            (item) => !item.userId || item.userId === currentUser.id,
          );

      api
        .bulkReplaceRecords(recordType, itemsToSync)
        .then((records) => {
          const serverState = records.map((record) => record.payload);
          writeApiCache(currentUser.id, key, serverState);
        })
        .catch((error) =>
          console.warn(`Gagal sync ${key} ke API, cache lokal tersimpan.`, error),
        );
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [
    recordType,
    key,
    currentUser?.id,
    isSuperAdmin,
    isServerHydrated,
    safeGlobalState,
  ]);

  return [userState, setUserState];
};

// 1.7. Format Date Utility - Mengubah objek Date menjadi format string YYYY-MM-DD
export const formatLocalYMD = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split("T")[0];
};

// 1.8. Parse Date Utility - Mengubah string YYYY-MM-DD menjadi objek Date
export const parseLocalYMD = (dateStr) => {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

// 1.9. Waktu & Kalender Utilities
export const getMonthRange = () => {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
  };
};

export const getYearRange = () => {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), 0, 1),
    end: new Date(now.getFullYear(), 11, 31),
  };
};

export const generateCalendarDays = (year, month) => {
  const date = new Date(year, month, 1);
  const days = [];
  const firstDayIndex = date.getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDayIndex; i++) days.push(null);
  for (let i = 1; i <= lastDay; i++) days.push(i);

  return days;
};

// 1.10. Validator Logika Rutinitas (Routine)
export const isRoutineActiveOnDate = (routine, date) => {
  if (!routine.active && !routine.archived) return false;
  if (routine.archived) return false;

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  // PERUBAHAN: Gunakan startDate jika ada, jika tidak gunakan createdAt
  const startStr = routine.startDate || routine.createdAt;
  const start = new Date(startStr);
  start.setHours(0, 0, 0, 0);

  if (targetDate < start) return false;

  if (routine.freezePeriods && routine.freezePeriods.length > 0) {
    const isFrozen = routine.freezePeriods.some((period) => {
      const freezeStart = parseLocalYMD(period.startDate);
      const freezeEnd = parseLocalYMD(period.endDate);
      freezeEnd.setHours(23, 59, 59, 999);
      return targetDate >= freezeStart && targetDate <= freezeEnd;
    });
    if (isFrozen) return false;
  }

  if (routine.frequency === "daily") return true;
  if (routine.frequency === "weekly")
    return routine.days?.includes(targetDate.getDay());
  if (routine.frequency === "monthly")
    return routine.monthDates?.includes(targetDate.getDate().toString());

  if (routine.frequency === "interval") {
    const diffTime = Math.abs(targetDate - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const interval = routine.interval || 1;
    const intervalType = routine.intervalType || "days";

    if (intervalType === "days") return diffDays % interval === 0;
    if (intervalType === "weeks") return diffDays % (interval * 7) === 0;
    if (intervalType === "months") {
      if (targetDate.getDate() !== start.getDate()) return false;
      const diffMonths =
        (targetDate.getFullYear() - start.getFullYear()) * 12 +
        (targetDate.getMonth() - start.getMonth());
      return diffMonths >= 0 && diffMonths % interval === 0;
    }
    if (intervalType === "years") {
      if (
        targetDate.getDate() !== start.getDate() ||
        targetDate.getMonth() !== start.getMonth()
      )
        return false;
      const diffYears = targetDate.getFullYear() - start.getFullYear();
      return diffYears >= 0 && diffYears % interval === 0;
    }
  }
  return false;
};

// 1.11. Validator Logika Jadwal (Schedule)
export const isScheduleOnDate = (schedule, targetDateStr) => {
  return (
    targetDateStr >= (schedule.startDate || schedule.date) &&
    targetDateStr <= (schedule.endDate || schedule.date)
  );
};

// 1.12. Update State Sumber Daya Global (Resources)
export const updateGlobalResources = (prevResources, newAttachments, contextTag) => {
  let updatedResources = [...prevResources];
  newAttachments.forEach((att) => {
    if (att.addToGlobal) {
      const existingIndex = updatedResources.findIndex(
        (r) =>
          (att.existingId && r.id === att.existingId) ||
          (att.type === "link" && r.url && r.url === att.url) ||
          (att.type === "file" && r.title === att.name),
      );

      if (existingIndex >= 0) {
        const existingRes = updatedResources[existingIndex];
        const currentTags = Array.isArray(existingRes.tags)
          ? existingRes.tags
          : existingRes.sourceTag
            ? [existingRes.sourceTag]
            : [];

        if (!currentTags.includes(contextTag)) {
          updatedResources[existingIndex] = {
            ...existingRes,
            tags: [...currentTags, contextTag],
            aiSummary: att.aiSummary || existingRes.aiSummary,
          };
        } else if (att.aiSummary && !existingRes.aiSummary) {
          updatedResources[existingIndex] = {
            ...existingRes,
            aiSummary: att.aiSummary,
          };
        }
      } else {
        if (!att.existingId) {
          updatedResources.push({
            id: generateId("res"),
            number: att.number,
            title: att.name,
            content: att.description,
            type: att.type,
            url: att.url,
            date: att.date || new Date().toISOString(),
            createdAt: new Date(),
            tags: [contextTag],
            aiSummary: att.aiSummary,
          });
        }
      }
    }
  });
  return updatedResources;
};

// 1.13. Helper AI & Generative Data
export const fileToGenerativePart = async (file) => {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const uploadFileToBackend = async (file) => {
  const upload = await api.uploadFile(file);
  return {
    file: null,
    uploadId: upload.id,
    url: apiUrl(upload.url),
    name: upload.originalName,
    title: upload.originalName,
    size: upload.size,
    mimeType: upload.mimeType,
  };
};

export const callGeminiAI = async (apiKey, prompt, inlineParts = []) => {
  if (!apiKey)
    throw new Error("API Key Gemini belum disetting di menu Settings.");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }, ...inlineParts] }],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Gagal menghubungi Gemini AI");
  }

  const data = await response.json();
  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Maaf, AI tidak memberikan respons."
  );
};

// ==================================================================================
// 2. SHARED COMPONENTS & MODALS, PAGINATION
// ==================================================================================

// 2.1. Komponen: Modal Konfirmasi Universal
