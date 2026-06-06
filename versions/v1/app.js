const DATA_URL = "../../data/iit_only_analysis.json";
const DEFAULT_RANK = 1948;

const state = {
  rows: [],
  selectedIds: new Set(),
};

const els = {
  rankInput: document.querySelector("#rankInput"),
  priorityMode: document.querySelector("#priorityMode"),
  chanceFilter: document.querySelector("#chanceFilter"),
  branchFilter: document.querySelector("#branchFilter"),
  collegeFilter: document.querySelector("#collegeFilter"),
  searchInput: document.querySelector("#searchInput"),
  showOnlyBtech: document.querySelector("#showOnlyBtech"),
  realisticCount: document.querySelector("#realisticCount"),
  borderlineCount: document.querySelector("#borderlineCount"),
  reachCount: document.querySelector("#reachCount"),
  bestRealistic: document.querySelector("#bestRealistic"),
  bestRealisticCourse: document.querySelector("#bestRealisticCourse"),
  realisticLabel: document.querySelector("#realisticLabel"),
  reachLabel: document.querySelector("#reachLabel"),
  realisticTable: document.querySelector("#realisticTable"),
  reachTable: document.querySelector("#reachTable"),
  selectedList: document.querySelector("#selectedList"),
  clearSelected: document.querySelector("#clearSelected"),
  branchMix: document.querySelector("#branchMix"),
};

init();

async function init() {
  const response = await fetch(DATA_URL);
  if (!response.ok) {
    throw new Error(`Could not load dashboard data: ${response.status}`);
  }
  const data = await response.json();
  state.rows = data.all_rows.map((row, index) => normalizeRow(row, index));
  populateFilters(state.rows);
  bindEvents();
  render();
}

function normalizeRow(row, index) {
  return {
    id: `${row.Institute}|${row["Academic Program Name"]}|${index}`,
    college: row.Institute.replace("Indian Institute of Technology", "IIT").trim(),
    fullCollege: row.Institute,
    course: row["Academic Program Name"],
    branch: row["Branch Group"],
    opening: Number(row["Opening Rank"]),
    closing: Number(row["Closing Rank"]),
    instituteScore: Number(row["Institute Score"]),
    branchScore: Number(row["Branch Score"]),
    collegeFirstScore: Number(row["College First Score"]),
    branchFirstScore: Number(row["Branch First Score"]),
    note: row["Recommendation Note"] || "",
  };
}

function populateFilters(rows) {
  addOptions(
    els.branchFilter,
    unique(rows.map((row) => row.branch)).sort(),
  );
  addOptions(
    els.collegeFilter,
    unique(rows.map((row) => row.college)).sort((a, b) => a.localeCompare(b)),
  );
  addOptions(els.chanceFilter, ["Likely", "Good chance", "Borderline", "Close reach", "Reach", "High reach"]);
}

function addOptions(select, values) {
  for (const value of values) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.append(option);
  }
}

function bindEvents() {
  [
    els.rankInput,
    els.priorityMode,
    els.chanceFilter,
    els.branchFilter,
    els.collegeFilter,
    els.searchInput,
    els.showOnlyBtech,
  ].forEach((element) => element.addEventListener("input", render));

  els.clearSelected.addEventListener("click", () => {
    state.selectedIds.clear();
    render();
  });
}

function render() {
  const rank = currentRank();
  const rows = filteredRows(rank);
  const sorted = rows.toSorted((a, b) => sortValue(b, rank) - sortValue(a, rank));
  const realistic = sorted.filter((row) => margin(row, rank) >= 0);
  const reaches = sorted.filter((row) => {
    const rowMargin = margin(row, rank);
    return rowMargin < 0 && rowMargin >= -650;
  });
  const closeReaches = rows.filter((row) => {
    const rowMargin = margin(row, rank);
    return rowMargin < 0 && rowMargin >= -300;
  });

  els.realisticCount.textContent = realistic.length;
  els.borderlineCount.textContent = rows.filter((row) => {
    const rowMargin = margin(row, rank);
    return rowMargin >= 0 && rowMargin <= 150;
  }).length;
  els.reachCount.textContent = closeReaches.length;

  const best = realistic[0];
  els.bestRealistic.textContent = best ? best.college : "-";
  els.bestRealisticCourse.textContent = best ? trimCourse(best.course) : "No matching option";

  els.realisticLabel.textContent = `${realistic.length} rows`;
  els.reachLabel.textContent = `${reaches.length} rows`;

  renderTable(els.realisticTable, realistic.slice(0, 80), rank);
  renderTable(els.reachTable, reaches.slice(0, 60), rank);
  renderSelected(rank);
  renderBranchMix(realistic);
}

function currentRank() {
  const parsed = Number(els.rankInput.value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : DEFAULT_RANK;
}

function filteredRows(rank) {
  const query = els.searchInput.value.trim().toLowerCase();
  const chanceFilter = els.chanceFilter.value;
  const branchFilter = els.branchFilter.value;
  const collegeFilter = els.collegeFilter.value;

  return state.rows.filter((row) => {
    const rowChance = classifyChance(margin(row, rank));
    const btechOk = !els.showOnlyBtech.checked || row.course.toLowerCase().includes("bachelor of technology");
    const chanceOk = chanceFilter === "all" || rowChance === chanceFilter;
    const branchOk = branchFilter === "all" || row.branch === branchFilter;
    const collegeOk = collegeFilter === "all" || row.college === collegeFilter;
    const searchOk =
      query.length === 0 ||
      row.course.toLowerCase().includes(query) ||
      row.college.toLowerCase().includes(query);

    return btechOk && chanceOk && branchOk && collegeOk && searchOk;
  });
}

function sortValue(row, rank) {
  const rowMargin = margin(row, rank);
  const confidence = confidenceScore(rowMargin);
  if (els.priorityMode.value === "branch") {
    return row.branchScore * 0.56 + row.instituteScore * 0.32 + confidence * 0.12;
  }
  if (els.priorityMode.value === "safety") {
    return confidence * 0.58 + row.instituteScore * 0.26 + row.branchScore * 0.16;
  }
  return row.instituteScore * 0.72 + row.branchScore * 0.2 + confidence * 0.08;
}

function confidenceScore(rowMargin) {
  if (rowMargin < -800) return 5;
  if (rowMargin < -300) return 20;
  if (rowMargin < 0) return 38;
  if (rowMargin <= 150) return 55;
  if (rowMargin <= 600) return 75;
  return 92;
}

function margin(row, rank) {
  return row.closing - rank;
}

function classifyChance(rowMargin) {
  if (rowMargin < -800) return "High reach";
  if (rowMargin < -300) return "Reach";
  if (rowMargin < 0) return "Close reach";
  if (rowMargin <= 150) return "Borderline";
  if (rowMargin <= 600) return "Good chance";
  return "Likely";
}

function renderTable(target, rows, rank) {
  target.innerHTML = "";
  if (rows.length === 0) {
    target.append(document.querySelector("#emptyRowTemplate").content.cloneNode(true));
    return;
  }

  for (const row of rows) {
    const rowMargin = margin(row, rank);
    const chance = classifyChance(rowMargin);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="college">${escapeHtml(row.college)}</td>
      <td class="course">${escapeHtml(trimCourse(row.course))}</td>
      <td><span class="pill">${escapeHtml(row.branch)}</span></td>
      <td>${row.closing}</td>
      <td class="${rowMargin >= 0 ? "margin-positive" : "margin-negative"}">${formatMargin(rowMargin)}</td>
      <td><span class="pill ${chanceClass(chance)}">${chance}</span></td>
      <td>${sortValue(row, rank).toFixed(1)}</td>
      <td><button class="select-btn ${state.selectedIds.has(row.id) ? "active" : ""}" type="button" data-id="${escapeHtml(row.id)}">${state.selectedIds.has(row.id) ? "Added" : "Add"}</button></td>
    `;
    tr.querySelector("button").addEventListener("click", () => toggleSelected(row.id));
    target.append(tr);
  }
}

function toggleSelected(id) {
  if (state.selectedIds.has(id)) {
    state.selectedIds.delete(id);
  } else {
    state.selectedIds.add(id);
  }
  render();
}

function renderSelected(rank) {
  els.selectedList.innerHTML = "";
  const selected = [...state.selectedIds]
    .map((id) => state.rows.find((row) => row.id === id))
    .filter(Boolean)
    .toSorted((a, b) => sortValue(b, rank) - sortValue(a, rank));

  if (selected.length === 0) {
    const li = document.createElement("li");
    li.innerHTML = "<strong>No choices selected yet.</strong><small>Add options from either table to compare a provisional list.</small>";
    els.selectedList.append(li);
    return;
  }

  for (const row of selected) {
    const rowMargin = margin(row, rank);
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${escapeHtml(row.college)} - ${escapeHtml(trimCourse(row.course))}</strong>
      <small>${row.branch} | closing ${row.closing} | margin ${formatMargin(rowMargin)} | ${classifyChance(rowMargin)}</small>
    `;
    els.selectedList.append(li);
  }
}

function renderBranchMix(realistic) {
  els.branchMix.innerHTML = "";
  const counts = new Map();
  for (const row of realistic) {
    counts.set(row.branch, (counts.get(row.branch) || 0) + 1);
  }
  const rows = [...counts.entries()].toSorted((a, b) => b[1] - a[1]).slice(0, 10);
  const max = Math.max(1, ...rows.map(([, count]) => count));

  if (rows.length === 0) {
    els.branchMix.innerHTML = '<p class="empty">No realistic options match these filters.</p>';
    return;
  }

  for (const [branch, count] of rows) {
    const div = document.createElement("div");
    div.className = "branch-row";
    div.innerHTML = `
      <span>${escapeHtml(branch)}</span>
      <div class="bar"><i style="width: ${(count / max) * 100}%"></i></div>
      <strong>${count}</strong>
    `;
    els.branchMix.append(div);
  }
}

function chanceClass(chance) {
  if (chance === "Likely") return "chance-likely";
  if (chance === "Good chance") return "chance-good";
  if (chance === "Borderline") return "chance-borderline";
  if (chance === "Close reach") return "chance-reach";
  if (chance === "Reach") return "chance-reach";
  return "chance-high";
}

function trimCourse(course) {
  return course.replace(/\s*\([^)]*Years,?\s*/i, " (").replace("Bachelor of Technology", "B.Tech").replace("Bachelor of Science", "BS");
}

function formatMargin(value) {
  return value > 0 ? `+${value}` : String(value);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
