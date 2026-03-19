const STORAGE_KEY = "visista_customer";

export function getCustomerSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

export function setCustomerSession(customer) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(customer));
  } catch (err) {
    // Ignore storage errors in private mode.
  }
}

export function clearCustomerSession() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    // Ignore storage errors in private mode.
  }
}
