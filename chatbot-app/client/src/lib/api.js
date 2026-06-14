const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function getToken() {
  return localStorage.getItem("foxbot_token");
}

export function setSession(token, user) {
  localStorage.setItem("foxbot_token", token);
  localStorage.setItem("foxbot_user", JSON.stringify(user));
}

export function getUser() {
  return JSON.parse(localStorage.getItem("foxbot_user") || "null");
}

export function clearSession() {
  localStorage.removeItem("foxbot_token");
  localStorage.removeItem("foxbot_user");
}

export async function api(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Error de red");
  return data;
}
