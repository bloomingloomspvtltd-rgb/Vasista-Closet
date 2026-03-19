const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

export function setToken(token) {
  if (typeof window === "undefined") return;
  localStorage.setItem("admin_token", token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("admin_token");
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = "";
    try {
      const data = await response.json();
      message = data?.detail ? JSON.stringify(data.detail) : JSON.stringify(data);
    } catch (err) {
      message = await response.text();
    }
    const error = new Error(message || "Request failed");
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function uploadAdminImage(file) {
  const token = getToken();
  const form = new FormData();
  form.append("file", file);

  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/admin/upload`, {
    method: "POST",
    headers,
    body: form,
  });

  if (!response.ok) {
    let message = "";
    try {
      const data = await response.json();
      message = data?.detail ? JSON.stringify(data.detail) : JSON.stringify(data);
    } catch (err) {
      message = await response.text();
    }
    const error = new Error(message || "Upload failed");
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function loginAdmin(email, password) {
  const result = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (result?.access_token) {
    setToken(result.access_token);
  }
  return result;
}
