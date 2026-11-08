const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]", "::1"];

const API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" && !LOCAL_HOSTS.includes(window.location.hostname)
    ? "/api"
    : "http://localhost:5000/api");

export const SESSION_EXPIRED_EVENT = "tourgenie:session-expired";

export function getToken() {
  return localStorage.getItem("tourgenie_token");
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Empty responses are valid for delete operations.
  }

  if (!response.ok) {
    if (response.status === 401 && auth && token) {
      localStorage.removeItem("tourgenie_token");
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }
    throw new Error(data?.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const authApi = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload, auth: false }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload, auth: false }),
  me: () => request("/auth/me"),
};

export const tripsApi = {
  list: () => request("/trips"),
};
