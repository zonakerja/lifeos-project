const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";

const AUTH_KEY = "lifeos-auth";

export const RECORD_TYPE_BY_STORAGE_KEY = {
  "lifeos-types": "agenda_type",
  "lifeos-routines": "routine",
  "lifeos-schedules": "schedule",
  "lifeos-todos": "todo",
  "lifeos-completions": "completion",
  "lifeos-freenotes": "free_note",
  "lifeos-ainotes": "ai_note",
  "lifeos-lists": "list",
  "lifeos-para-projects": "para_project",
  "lifeos-para-areas": "para_area",
  "lifeos-para-tasks": "para_task",
  "lifeos-para-activities": "para_activity",
  "lifeos-para-resources": "para_resource",
  "lifeos-para-archives": "para_archive",
  "lifeos-archive-classifications": "archive_classification",
  "lifeos-archive-jra": "archive_jra",
  "lifeos-archive-physical": "archive_physical_reference",
  "lifeos-archive-borrowings": "archive_borrowing",
  "lifeos-archive-dispositions": "archive_disposition",
  "lifeos-archive-movelogs": "archive_move_log",
};

export const getAuthSession = () => {
  try {
    return JSON.parse(window.localStorage.getItem(AUTH_KEY) || "null");
  } catch {
    return null;
  }
};

export const setAuthSession = (session) => {
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(session));
};

export const clearAuthSession = () => {
  window.localStorage.removeItem(AUTH_KEY);
};

export const apiUrl = (path) => {
  if (!path) return API_BASE_URL;
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

const request = async (path, options = {}) => {
  const session = getAuthSession();
  const headers = new Headers(options.headers || {});
  const isFormData = options.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (session?.accessToken) {
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }

  const response = await fetch(apiUrl(path), {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = "Request API gagal.";
    try {
      const error = await response.json();
      message = error.message || message;
    } catch {
      // Keep default message.
    }
    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  if (response.status === 204) return null;
  return response.json();
};

export const api = {
  login: async (email, password) => {
    const session = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const clientSession = {
      ...session,
      user: {
        ...session.user,
        password: btoa(password),
      },
    };
    setAuthSession(clientSession);
    window.localStorage.setItem("lifeos-user", JSON.stringify(clientSession.user));
    return clientSession;
  },

  logout: async () => {
    const session = getAuthSession();
    if (session?.refreshToken) {
      try {
        await request("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken: session.refreshToken }),
        });
      } catch {
        // Local logout should still proceed when server is unreachable.
      }
    }
    clearAuthSession();
    window.localStorage.removeItem("lifeos-user");
  },

  getUsers: () => request("/users"),
  getAppSettings: () => request("/settings/app"),
  updateAppSettings: (settings) =>
    request("/settings/app", {
      method: "PATCH",
      body: JSON.stringify(settings),
    }),

  listRecords: (type) => request(`/records/${type}`),
  bulkReplaceRecords: (type, items) =>
    request(`/records/${type}/bulk`, {
      method: "POST",
      body: JSON.stringify({ items }),
    }),

  uploadFile: (file) => {
    const form = new FormData();
    form.append("file", file);
    return request("/uploads", {
      method: "POST",
      body: form,
    });
  },

  listUploads: (take = 50) => request(`/uploads?take=${take}`),
  getUploadMetadata: (id) => request(`/uploads/${id}/metadata`),
  deleteUpload: (id) =>
    request(`/uploads/${id}`, {
      method: "DELETE",
    }),
};
