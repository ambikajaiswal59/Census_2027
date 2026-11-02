import { useEffect } from "react";

// Makes the page harder to copy from: no text selection, no right click, no copy /
// cut / drag, and no common "save / view source / print" shortcuts. Typing and
// pasting inside text boxes (like the table search) still works.
// Active only while the page that calls it is open.
//
// Note: this is a deterrent only. A browser always has the page's code, so it can
// not stop a determined person, and it can never block screenshots.
export default function useContentProtection() {
  useEffect(() => {
    const isField = (target) =>
      target instanceof Element &&
      Boolean(target.closest("input, textarea, [contenteditable='true']"));

    const block = (event) => {
      if (!isField(event.target)) event.preventDefault();
    };

    // Right click: blocked everywhere, including inside text boxes.
    const blockMenu = (event) => event.preventDefault();

    const blockKeys = (event) => {
      const key = event.key?.toLowerCase();
      const mod = event.ctrlKey || event.metaKey;

      const devTools =
        key === "f12" ||
        (mod && event.shiftKey && ["i", "j", "c"].includes(key));
      const pageShortcuts = mod && ["u", "s", "p"].includes(key);
      const copyShortcuts =
        mod && ["c", "x", "a"].includes(key) && !isField(event.target);

      if (devTools || pageShortcuts || copyShortcuts) event.preventDefault();
    };

    document.addEventListener("contextmenu", blockMenu);
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("dragstart", block);
    document.addEventListener("selectstart", block);
    document.addEventListener("keydown", blockKeys);

    return () => {
      document.removeEventListener("contextmenu", blockMenu);
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("dragstart", block);
      document.removeEventListener("selectstart", block);
      document.removeEventListener("keydown", blockKeys);
    };
  }, []);
}