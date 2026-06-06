export function sortTableRows(rows, sort) {
  if (!sort?.key) {
    return [...rows];
  }

  const direction = sort.direction === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => compareValues(valueForSort(a, sort.key), valueForSort(b, sort.key)) * direction);
}

function valueForSort(row, key) {
  if (key === "score") return Number(row.score);
  if (key === "closing") return Number(row.closing);
  if (key === "margin") return Number(row.margin);
  if (key === "chance") return chanceRank(row.chance);
  return String(row[key] || "").toLowerCase();
}

function compareValues(a, b) {
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  return String(a).localeCompare(String(b));
}

function chanceRank(chance) {
  const order = {
    Likely: 1,
    "Good chance": 2,
    Borderline: 3,
    "Close reach": 4,
    Reach: 5,
    "High reach": 6,
  };
  return order[chance] || 99;
}
