// Where the API lives.
//
// VITE_API_URL wins when it is set, which is what a split deployment needs.
// With nothing set, a developer's machine talks to the API on port 5000 and
// anywhere else the client and the API share an origin, so "/api" is right.
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]", "::1"];

const API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" && !LOCAL_HOSTS.includes(window.location.hostname)
    ? "/api"
    : "http://localhost:5000/api");

export function getToken() {
  return localStorage.getItem("tourgenie_token");
}

// A login lasts a week, and changing the password ends it early. Either way
// every request starts coming back 401; the first such answer ends the
// session cleanly and sends the traveller to the login screen with a note
// saying why, instead of leaving an error banner on the page they were on.
export const SESSION_EXPIRED_EVENT = "tourgenie:session-expired";
const EXPIRY_NOTICE_KEY = "tourgenie_session_expired";

let expiring = false;

function endExpiredSession() {
  // A page that fired six requests at once gets six 401s; only the first
  // should do anything.
  if (expiring) return;
  expiring = true;
  try {
    localStorage.removeItem("tourgenie_token");
    // Read and cleared by the login screen, so it can say why you're there.
    sessionStorage.setItem(EXPIRY_NOTICE_KEY, "1");
  } catch {
    // Storage blocked — the event below still signs the user out in memory.
  }
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  setTimeout(() => {
    expiring = false;
  }, 1000);
}

/** True once, for the login screen; the notice doesn't survive a reload. */
export function consumeSessionExpiredNotice() {
  try {
    const flag = sessionStorage.getItem(EXPIRY_NOTICE_KEY);
    if (flag) sessionStorage.removeItem(EXPIRY_NOTICE_KEY);
    return Boolean(flag);
  } catch {
    return false;
  }
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
    // Only when a token was actually sent: a 401 from the login form means
    // "wrong password", not "your session ended", and must stay on the page.
    if (response.status === 401 && auth && token) endExpiredSession();

    const error = new Error(data?.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    // The whole body, for callers that read fields the API puts at the top
    // level — `retry_after` on a rate-limited request, `expired` on a code.
    error.body = data;
    throw error;
  }

  return data;
}

export const authApi = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload, auth: false }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload, auth: false }),
  me: () => request("/auth/me"),
  changePassword: (current_password, new_password) =>
    request("/auth/change-password", { method: "POST", body: { current_password, new_password } }),
  // Password recovery. forgotPassword is also the resend — the server applies
  // its own cooldown, so the UI only has to mirror it.
  forgotPassword: (email) => request("/auth/forgot-password", { method: "POST", body: { email }, auth: false }),
  verifyOtp: (email, otp) => request("/auth/verify-otp", { method: "POST", body: { email, otp }, auth: false }),
  resetPassword: (reset_token, password) =>
    request("/auth/reset-password", { method: "POST", body: { reset_token, password }, auth: false }),
};

export const tripsApi = {
  list: () => request("/trips"),
};

function toQuery(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  }
  const text = query.toString();
  return text ? `?${text}` : "";
}

// The public catalogue. Readable without signing in.
export const destinationsApi = {
  list: (params) => request(`/destinations${toQuery(params)}`, { auth: false }),
  get: (idOrSlug) => request(`/destinations/${encodeURIComponent(idOrSlug)}`, { auth: false }),
};

export const referenceApi = {
  countries: () => request("/reference/countries", { auth: false }),
  interestTags: () => request("/reference/interest-tags", { auth: false }),
};
