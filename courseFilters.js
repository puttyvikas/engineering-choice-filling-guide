export function isBtechCourse(course) {
  return String(course).toLowerCase().includes("bachelor of technology");
}

export function isFiveYearDualDegreeCourse(course) {
  const normalized = String(course).toLowerCase();
  return normalized.includes("5 years") && normalized.includes("dual degree");
}
