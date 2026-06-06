import assert from "node:assert/strict";
import { moveSelectedId, selectedRowsInOrder } from "../selectedOrder.js";

const rows = [
  { id: "high-score", score: 100 },
  { id: "first-added", score: 20 },
  { id: "second-added", score: 80 },
];

const selectedIds = new Set(["first-added", "second-added", "missing-id", "high-score"]);

assert.deepEqual(
  selectedRowsInOrder(selectedIds, rows).map((row) => row.id),
  ["first-added", "second-added", "high-score"],
);

assert.deepEqual([...moveSelectedId(new Set(["a", "b", "c"]), "c", 0)], ["c", "a", "b"]);
assert.deepEqual([...moveSelectedId(new Set(["a", "b", "c"]), "a", 2)], ["b", "c", "a"]);
assert.deepEqual([...moveSelectedId(new Set(["a", "b", "c"]), "missing", 1)], ["a", "b", "c"]);
assert.deepEqual([...moveSelectedId(new Set(["a", "b", "c"]), "b", 20)], ["a", "c", "b"]);
assert.deepEqual([...moveSelectedId(new Set(["a", "b", "c"]), "b", -3)], ["b", "a", "c"]);

console.log("selected order is preserved");
