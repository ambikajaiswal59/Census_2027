// Feature switches. Flip a value to true when that feature is ready to publish.

// Population Dashboard (Census 2011): the /population-dashboard page and the
// "Forerunner Census 2011" button on the Home page. Hidden until it is complete.
export const SHOW_POPULATION_DASHBOARD = true;

// ───────────── Content protection (see hooks/useContentProtection.js) ─────────────

// Master switch: right click, text selection, copy / cut / drag and the save /
// view-source / print shortcuts are blocked on the pages that use the hook.
// Set to false to turn all of it off.
export const CONTENT_PROTECTION = true;

// Developer tools (F12, Ctrl+Shift+I / J / C). Allowed while you run `npm run dev`
// so you can test, and blocked automatically in the published build (`npm run build`).
// Set to true to allow them in the published site too (not recommended).
export const ALLOW_DEVTOOLS =import.meta.env.DEV;