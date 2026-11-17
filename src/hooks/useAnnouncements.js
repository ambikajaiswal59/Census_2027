import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────
// Announcements for the moving line on the Home page.
//
// Today: dummy data. Later: set ANNOUNCEMENTS_URL (or change fetchAnnouncements)
// and nothing else in the app changes — the ticker only ever sees the shape that
// normalizeAnnouncement() returns:
//   { id: string|number, text: string, isNew: boolean, href?: string }
// ─────────────────────────────────────────────────────────────

// Set this to the backend endpoint when it is ready, e.g. in .env:
//   VITE_ANNOUNCEMENTS_URL=http://192.168.1.28:6999/announcements
const ANNOUNCEMENTS_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env?.VITE_ANNOUNCEMENTS_URL) ||
  "";

const DUMMY_ANNOUNCEMENTS = [
  { id: 1, text: "Dummy: Census of India 2027 — house listing schedule", isNew: true },
  { id: 2, text: "Dummy: Notification on Census amendment rules, 2026", isNew: true },
  { id: 3, text: "Dummy: Self-enumeration portal guidance for households", isNew: false },
  { id: 4, text: "Dummy: Training schedule for enumerators released", isNew: false },
];

// Turns one backend record into the shape the ticker uses. Adjust the field names
// here when the real API is known — this is the only place that has to change.
function normalizeAnnouncement(raw, index) {
  return {
    id: raw.id ?? index,
    text: String(raw.text ?? raw.title ?? "").trim(),
    isNew: Boolean(raw.isNew ?? raw.is_new ?? raw.new),
    href: raw.href ?? raw.url ?? raw.link ?? undefined,
  };
}

async function fetchAnnouncements(signal) {
  // No endpoint yet: use the dummy list.
  if (!ANNOUNCEMENTS_URL) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return DUMMY_ANNOUNCEMENTS;
  }

  const res = await fetch(ANNOUNCEMENTS_URL, { signal });
  if (!res.ok) throw new Error(`Announcements request failed (${res.status})`);

  const json = await res.json();
  // Accept either a plain array or { items: [...] } / { data: [...] }.
  const list = Array.isArray(json) ? json : json.items || json.data || [];
  return list.map(normalizeAnnouncement).filter((item) => item.text);
}

export default function useAnnouncements() {
  const [state, setState] = useState({ items: [], loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();

    fetchAnnouncements(controller.signal)
      .then((items) => setState({ items, loading: false, error: null }))
      .catch((error) => {
        if (error.name === "AbortError") return;
        setState({ items: [], loading: false, error });
      });

    return () => controller.abort();
  }, []);

  return state;
}