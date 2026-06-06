import assert from "node:assert/strict";
import { loadSelectedIds, saveSelectedIds, SELECTED_CHOICES_STORAGE_KEY } from "../selectionStorage.js";

function memoryStorage(initialValue = null) {
  const values = new Map();
  if (initialValue !== null) {
    values.set(SELECTED_CHOICES_STORAGE_KEY, initialValue);
  }
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

const storage = memoryStorage();
saveSelectedIds(new Set(["choice-1", "choice-2"]), storage);
assert.equal(storage.getItem(SELECTED_CHOICES_STORAGE_KEY), '["choice-1","choice-2"]');

assert.deepEqual([...loadSelectedIds(memoryStorage('["choice-3",9,null,"choice-4"]'))], ["choice-3", "choice-4"]);
assert.deepEqual([...loadSelectedIds(memoryStorage("{broken json"))], []);

console.log("selection persistence works");
