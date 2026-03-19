const DEFAULT_API_BASE = "https://vasista-closet-1.onrender.com";

export function getApiBase() {
  const env = process.env.NEXT_PUBLIC_API_URL;
  if (env && env.trim()) return env.trim();
  return DEFAULT_API_BASE;
}

export function getRuntimeApiBase() {
  const base = getApiBase();
  if (typeof window === "undefined") return base;
  const host = window.location.hostname;
  if (!host || host === "localhost" || host === "127.0.0.1") return base;
  try {
    const parsed = new URL(base);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      return DEFAULT_API_BASE;
    }
  } catch (err) {
    return base;
  }
  return base;
}
