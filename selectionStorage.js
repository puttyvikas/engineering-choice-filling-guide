export const SELECTED_CHOICES_STORAGE_KEY = "iit-choice-dashboard:selected-ids:v1";

export function loadSelectedIds(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(SELECTED_CHOICES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

export function saveSelectedIds(selectedIds, storage = globalThis.localStorage) {
  try {
    storage?.setItem(SELECTED_CHOICES_STORAGE_KEY, JSON.stringify([...selectedIds]));
  } catch {
    // localStorage can be unavailable or full; selection still works for the current session.
  }
}
