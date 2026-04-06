"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";

import { getRuntimeApiBase } from "@/lib/apiBase";
import { getCustomerSession } from "@/lib/customerSession";

const SESSION_KEY = "visista_session_id";
const HEARTBEAT_MS = 30000;

function generateSessionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `sess-${Math.random().toString(36).slice(2)}${Date.now()}`;
}

function getSessionId() {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const next = generateSessionId();
    window.localStorage.setItem(SESSION_KEY, next);
    return next;
  } catch (err) {
    return generateSessionId();
  }
}

async function sendVisit(payload) {
  try {
    await fetch(`${getRuntimeApiBase()}/analytics/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Ignore analytics errors so they never block the UI.
  }
}

export default function VisitTracker() {
  const pathname = usePathname();
  const heartbeatRef = useRef(null);
  const sessionId = useMemo(() => getSessionId(), []);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return undefined;

    const customer = getCustomerSession();
    const payload = {
      session_id: sessionId,
      member_id: customer?.id || null,
      path: pathname,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    };

    sendVisit(payload);
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    heartbeatRef.current = setInterval(() => sendVisit(payload), HEARTBEAT_MS);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [pathname, sessionId]);

  return null;
}
