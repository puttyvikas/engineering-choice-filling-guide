import assert from "node:assert/strict";
import { sortTableRows } from "../tableSort.js";

const rows = [
  { college: "IIT B", course: "Physics", branch: "Science", closing: 2840, score: 72, margin: 892, chance: "Likely" },
  { college: "IIT A", course: "Chemistry", branch: "Chemical", closing: 1359, score: 91, margin: -589, chance: "Reach" },
  { college: "IIT C", course: "Economics", branch: "Economics", closing: 1877, score: 83, margin: -71, chance: "Close reach" },
];

assert.deepEqual(
  sortTableRows(rows, { key: "college", direction: "asc" }).map((row) => row.college),
  ["IIT A", "IIT B", "IIT C"],
);

assert.deepEqual(
  sortTableRows(rows, { key: "closing", direction: "desc" }).map((row) => row.closing),
  [2840, 1877, 1359],
);

assert.deepEqual(
  sortTableRows(rows, { key: "margin", direction: "asc" }).map((row) => row.margin),
  [-589, -71, 892],
);

assert.deepEqual(
  sortTableRows(rows, { key: "score", direction: "desc" }).map((row) => row.score),
  [91, 83, 72],
);

console.log("table sorting works");
