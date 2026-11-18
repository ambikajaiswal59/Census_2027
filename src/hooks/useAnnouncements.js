
import { useEffect, useState } from "react";
import { getAnnouncements, hasBackend } from "../api.js";

// ─────────────────────────────────────────────────────────────
// Announcements for the moving line on the Home page.
//
// Backend: GET /censusapi/api/announcements
//   { count, data: [{ id, serial_number, title, link, created_at }] }
// The call itself lives in src/api/api.js (getAnnouncements).
//
// The ticker only ever sees the shape normalizeAnnouncement() returns:
//   { id, text, isNew, href }
// so a change in the API only ever needs a change in this file.
// ─────────────────────────────────────────────────────────────

// An announcement counts as "New" for this many days after it was created.
const NEW_FOR_DAYS = 7;

// Used only when no backend URL is configured (VITE_API_BASE_URL is empty).
const DUMMY_ANNOUNCEMENTS = [
  {
    id: 1,
    text: "(i) Dummy: Census of India 2027 — house listing schedule",
    isNew: true,
  },
  {
    id: 2,
    text: "(ii) Dummy: Notification on Census amendment rules, 2026",
    isNew: true,
  },
  {
    id: 3,
    text: "(iii) Dummy: Self-enumeration portal guidance for households",
    isNew: false,
  },
];

function isRecent(createdAt) {
  const time = Date.parse(createdAt);
  if (Number.isNaN(time)) return false;
  return Date.now() - time < NEW_FOR_DAYS * 24 * 60 * 60 * 1000;
}

// One backend record -> what the ticker draws, e.g. "(ii) ORGI Gazette Notification…"
function normalizeAnnouncement(raw) {
  const title = String(raw.title ?? "").trim();
  const serial = String(raw.serial_number ?? "").trim();

  return {
    id: raw.id,
    text: serial ? `(${serial}) ${title}` : title,
    isNew: isRecent(raw.created_at),
    href: raw.link || undefined,
  };
}

async function fetchAnnouncements(signal) {
  // No backend configured: show the dummy list.
  if (!hasBackend) return DUMMY_ANNOUNCEMENTS;

  const json = await getAnnouncements(signal);
  const list = Array.isArray(json) ? json : json?.data || [];

  return list
    .map(normalizeAnnouncement)
    .filter((item) => item.text)
    .sort((a, b) => a.id - b.id); // the API list is not in order (…5, 9, 6…)
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
