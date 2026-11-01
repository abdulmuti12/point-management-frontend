/**
 * Frontend auth helpers.
 *
 * After the BFF migration:
 * - Admin tokens live in the `admin_auth` HttpOnly cookie (set by /api/bff/login).
 * - Customer tokens live in the `customer_auth` HttpOnly cookie (set by /api/bff/customer/login).
 *
 * The browser NEVER sees the JWT. All API calls go through /api/bff/admin/<endpoint>
 * or /api/bff/customer/<endpoint>, and the BFF route handler injects the Bearer token
 * from the cookie server-side.
 *
 * User profile data (name, email, menus) is still stored in localStorage for UI
 * display purposes — it's non-sensitive metadata, not a credential.
 */

/* ── Fetch helpers ────────────────────────────────────────────── */

// Debounce 401 redirect so multiple parallel customerFetch calls that
// all time out simultaneously don't stack redirect calls — only one
// page-level redirect fires, even if 5 fetches fail in the same tick.
let customerRedirectScheduled = false

export function scheduleCustomerRedirect() {
  if (customerRedirectScheduled || typeof window === "undefined") return
  customerRedirectScheduled = true

  // Clear local session hints immediately so checkAuth in layout doesn't
  // fight us on the next render.
  localStorage.removeItem("customer_name")
  localStorage.removeItem("customer_email")
  localStorage.removeItem("customer_token")

  // Call the logout endpoint to clear the HttpOnly cookie on the server side,
  // then hard-navigate to login after a short delay so in-flight fetches
  // can settle before the page unmounts.
  fetch("/api/bff/customer/logout", {
    method: "POST",
    credentials: "same-origin",
  }).catch(() => {
    /* ignore — navigate regardless */
  }).finally(() => {
    customerRedirectScheduled = false
    window.location.href = "/customer/login"
  })
}

/**
 * Make an authenticated admin API call through the BFF.
 * The cookie is sent automatically by the browser (same-origin).
 */
export async function adminFetch(endpoint: string, options: RequestInit = {}) {
  const { headers: customHeaders, ...rest } = options;
  const url = endpoint.startsWith("/api/bff/admin")
    ? endpoint
    : `/api/bff/admin/${endpoint.replace(/^\//, "")}`;

  const headers: Record<string, string> = { ...(customHeaders as Record<string, string>) };
  if (typeof rest.body === "string" && !("Content-Type" in headers)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    ...rest,
    credentials: "same-origin", // ensure HttpOnly cookies are sent
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    // Session expired — redirect to login. Clear the local session hints
    // before navigating so the layout auth-check doesn't bounce back.
    if (typeof window !== "undefined") {
      localStorage.removeItem("user_menus")
      localStorage.removeItem("user_name")
      localStorage.removeItem("user_email")
      window.location.href = "/login"
    }
    throw new Error("Unauthenticated")
  }

  return { ok: res.ok, status: res.status, data };
}

/**
 * Make an authenticated customer API call through the BFF.
 */
export async function customerFetch(endpoint: string, options: RequestInit = {}) {
  const { headers: customHeaders, ...rest } = options;
  const url = endpoint.startsWith("/api/bff/customer")
    ? endpoint
    : `/api/bff/customer/${endpoint.replace(/^\//, "")}`;

  const headers: Record<string, string> = { ...(customHeaders as Record<string, string>) };
  if (typeof rest.body === "string" && !("Content-Type" in headers)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    ...rest,
    credentials: "same-origin",
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    scheduleCustomerRedirect()
    throw new Error("Unauthenticated")
  }

  return { ok: res.ok, status: res.status, data };
}

/**
 * Check if the user has a valid session (cookie present on the server side).
 * Returns a sentinel unauthenticated result on 401/5xx so callers can
 * reliably detect "no valid session" without parsing a possibly-empty body.
 */
export async function checkAuth(): Promise<{
  authenticated: boolean;
  role: "admin" | "customer" | null;
}> {
  try {
    const res = await fetch("/api/bff/me", { credentials: "same-origin" });
    if (res.status === 401 || res.status >= 500) {
      return { authenticated: false, role: null };
    }
    return await res.json();
  } catch {
    return { authenticated: false, role: null };
  }
}

/* ── Logout helpers ───────────────────────────────────────────── */

export async function logoutAdmin() {
  await fetch("/api/bff/logout", { method: "POST", credentials: "same-origin" });
  localStorage.removeItem("user_menus");
  localStorage.removeItem("user_name");
  localStorage.removeItem("user_email");
}

export async function logoutCustomer() {
  await fetch("/api/bff/customer/logout", { method: "POST", credentials: "same-origin" });
  localStorage.removeItem("customer_name");
  localStorage.removeItem("customer_email");
}
