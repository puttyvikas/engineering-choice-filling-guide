export const CHANCE_LABELS = [
  "Large cutoff buffer",
  "Medium cutoff buffer",
  "Small cutoff buffer",
  "Small cutoff gap",
  "Medium cutoff gap",
  "Large cutoff gap",
];

export function confidenceScore(rowMargin) {
  if (rowMargin < -800) return 5;
  if (rowMargin < -300) return 20;
  if (rowMargin < 0) return 35;
  if (rowMargin <= 150) return 55;
  if (rowMargin <= 600) return 75;
  return 92;
}

export function classifyChance(rowMargin) {
  if (rowMargin < -800) return "Large cutoff gap";
  if (rowMargin < -300) return "Medium cutoff gap";
  if (rowMargin < 0) return "Small cutoff gap";
  if (rowMargin <= 150) return "Small cutoff buffer";
  if (rowMargin <= 600) return "Medium cutoff buffer";
  return "Large cutoff buffer";
}
