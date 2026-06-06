export function sortTableRows(rows, sort) {
  if (!sort?.key) {
    return [...rows];
  }

  const direction = sort.direction === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => compareValues(valueForSort(a, sort.key), valueForSort(b, sort.key)) * direction);
}

function valueForSort(row, key) {
  if (key === "score") return Number(row.score);
  if (key === "confidence") return Number(row.confidence);
  if (key === "closing") return Number(row.closing);
  if (key === "margin") return Number(row.margin);
  if (key === "rankUsed") return Number(row.rankUsed);
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
    "Large cutoff buffer": 1,
    "Medium cutoff buffer": 2,
    "Small cutoff buffer": 3,
    "Small cutoff gap": 4,
    "Medium cutoff gap": 5,
    "Large cutoff gap": 6,
  };
  return order[chance] || 99;
}
