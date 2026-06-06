import { sortTableRows } from "./tableSort.js";

const DATA_URL = "./data/iit_only_analysis.json";
const DEFAULT_RANK = 1948;

const state = {
  rows: [],
  selectedIds: new Set(),
  tableSort: {
    realistic: { key: "score", direction: "desc" },
    reach: { key: "margin", direction: "desc" },
  },
  filters: {
    chance: new Set(),
    branch: new Set(),
    college: new Set(),
  },
};

const els = {
  rankInput: document.querySelector("#rankInput"),
  priorityMode: document.querySelector("#priorityMode"),
  chanceFilterButton: document.querySelector("#chanceFilterButton"),
  chanceFilterPanel: document.querySelector("#chanceFilterPanel"),
  branchFilterButton: document.querySelector("#branchFilterButton"),
  branchFilterPanel: document.querySelector("#branchFilterPanel"),
  collegeFilterButton: document.querySelector("#collegeFilterButton"),
  collegeFilterPanel: document.querySelector("#collegeFilterPanel"),
  searchInput: document.querySelector("#searchInput"),
  showOnlyBtech: document.querySelector("#showOnlyBtech"),
  activeChips: document.querySelector("#activeChips"),
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
  selectedCount: document.querySelector("#selectedCount"),
  clearSelected: document.querySelector("#clearSelected"),
  copySelected: document.querySelector("#copySelected"),
  downloadSelected: document.querySelector("#downloadSelected"),
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
  renderMultiFilter("chance", ["Likely", "Good chance", "Borderline", "Close reach", "Reach", "High reach"]);
  renderMultiFilter(
    "branch",
    unique(rows.map((row) => row.branch)).sort(),
  );
  renderMultiFilter(
    "college",
    unique(rows.map((row) => row.college)).sort((a, b) => a.localeCompare(b)),
  );
}

function renderMultiFilter(filterName, values) {
  const panel = els[`${filterName}FilterPanel`];
  panel.innerHTML = "";
  for (const value of values) {
    const option = document.createElement("label");
    option.className = "multi-option";
    option.innerHTML = `
      <input type="checkbox" value="${escapeHtml(value)}" />
      <span>${escapeHtml(value)}</span>
    `;
    option.querySelector("input").addEventListener("change", (event) => {
      if (event.target.checked) {
        state.filters[filterName].add(value);
      } else {
        state.filters[filterName].delete(value);
      }
      updateFilterButtons();
      render();
    });
    panel.append(option);
  }
}

function bindEvents() {
  [
    els.rankInput,
    els.priorityMode,
    els.searchInput,
    els.showOnlyBtech,
  ].forEach((element) => element.addEventListener("input", render));

  ["chance", "branch", "college"].forEach((filterName) => {
    const button = els[`${filterName}FilterButton`];
    const panel = els[`${filterName}FilterPanel`];
    button.addEventListener("click", () => togglePanel(filterName));
    panel.addEventListener("click", (event) => event.stopPropagation());
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".multi-filter")) {
      closePanels();
    }
  });

  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => applyPreset(button.dataset.preset));
  });

  els.clearSelected.addEventListener("click", () => {
    state.selectedIds.clear();
    render();
  });

  els.copySelected.addEventListener("click", copySelectedChoices);
  els.downloadSelected.addEventListener("click", downloadSelectedChoices);
  document.querySelectorAll("[data-sort-table][data-sort-key]").forEach((button) => {
    button.addEventListener("click", () => updateTableSort(button.dataset.sortTable, button.dataset.sortKey));
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

  renderTable(els.realisticTable, sortRowsForTable(realistic, rank, "realistic").slice(0, 80), rank);
  renderTable(els.reachTable, sortRowsForTable(reaches, rank, "reach").slice(0, 60), rank);
  updateSortButtons();
  renderChips();
  renderSelected(rank);
  renderBranchMix(realistic);
}

function sortRowsForTable(rows, rank, tableName) {
  const withSortValues = rows.map((row) => {
    const rowMargin = margin(row, rank);
    return {
      ...row,
      margin: rowMargin,
      chance: classifyChance(rowMargin),
      score: sortValue(row, rank),
    };
  });
  return sortTableRows(withSortValues, state.tableSort[tableName]);
}

function updateTableSort(tableName, key) {
  const current = state.tableSort[tableName];
  const nextDirection = current.key === key && current.direction === "asc" ? "desc" : "asc";
  state.tableSort[tableName] = { key, direction: nextDirection };
  render();
}

function updateSortButtons() {
  document.querySelectorAll("[data-sort-table][data-sort-key]").forEach((button) => {
    const current = state.tableSort[button.dataset.sortTable];
    const active = current.key === button.dataset.sortKey;
    button.classList.toggle("active", active);
    button.textContent = `${button.dataset.sortLabel} ${active ? (current.direction === "asc" ? "↑" : "↓") : "↕"}`;
    button.setAttribute("aria-sort", active ? (current.direction === "asc" ? "ascending" : "descending") : "none");
  });
}

function currentRank() {
  const parsed = Number(els.rankInput.value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : DEFAULT_RANK;
}

function filteredRows(rank) {
  const query = els.searchInput.value.trim().toLowerCase();

  return state.rows.filter((row) => {
    const rowChance = classifyChance(margin(row, rank));
    const btechOk = !els.showOnlyBtech.checked || row.course.toLowerCase().includes("bachelor of technology");
    const chanceOk = state.filters.chance.size === 0 || state.filters.chance.has(rowChance);
    const branchOk = state.filters.branch.size === 0 || state.filters.branch.has(row.branch);
    const collegeOk = state.filters.college.size === 0 || state.filters.college.has(row.college);
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
  els.selectedCount.textContent = selected.length;

  if (selected.length === 0) {
    const li = document.createElement("li");
    li.innerHTML = "<strong>No choices selected yet.</strong><small>Add options from either table to compare a provisional list.</small>";
    els.selectedList.append(li);
    return;
  }

  selected.forEach((row, index) => {
    const rowMargin = margin(row, rank);
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${index + 1}. ${escapeHtml(row.college)} - ${escapeHtml(trimCourse(row.course))}</strong>
      <small>${row.branch} | closing ${row.closing} | margin ${formatMargin(rowMargin)} | ${classifyChance(rowMargin)}</small>
      <br />
      <button class="remove-choice" type="button">Remove</button>
    `;
    li.querySelector("button").addEventListener("click", () => {
      state.selectedIds.delete(row.id);
      render();
    });
    els.selectedList.append(li);
  });
}

function renderChips() {
  els.activeChips.innerHTML = "";
  const chips = [];
  for (const filterName of ["chance", "branch", "college"]) {
    for (const value of state.filters[filterName]) {
      chips.push({ type: filterName, value });
    }
  }
  if (els.showOnlyBtech.checked) {
    chips.push({ type: "btech", value: "BTech only" });
  }
  if (els.searchInput.value.trim()) {
    chips.push({ type: "search", value: els.searchInput.value.trim() });
  }

  if (chips.length === 0) {
    const empty = document.createElement("span");
    empty.className = "chip";
    empty.dataset.empty = "true";
    empty.textContent = "No active filters";
    els.activeChips.append(empty);
    return;
  }

  chips.forEach((chip) => {
    const button = document.createElement("button");
    button.className = `chip chip-${chip.type}`;
    button.type = "button";
    button.innerHTML = `<span class="chip-dot" aria-hidden="true"></span><b>${labelForFilter(chip.type)}:</b> ${escapeHtml(chip.value)} ×`;
    button.addEventListener("click", () => removeChip(chip));
    els.activeChips.append(button);
  });
}

function removeChip(chip) {
  if (state.filters[chip.type]) {
    state.filters[chip.type].delete(chip.value);
    syncPanelCheckboxes(chip.type);
  } else if (chip.type === "btech") {
    els.showOnlyBtech.checked = false;
  } else if (chip.type === "search") {
    els.searchInput.value = "";
  }
  updateFilterButtons();
  render();
}

function labelForFilter(type) {
  if (type === "btech") return "Type";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function togglePanel(filterName) {
  const panel = els[`${filterName}FilterPanel`];
  const willOpen = panel.hidden;
  closePanels();
  panel.hidden = !willOpen;
  els[`${filterName}FilterButton`].setAttribute("aria-expanded", String(willOpen));
}

function closePanels() {
  ["chance", "branch", "college"].forEach((filterName) => {
    els[`${filterName}FilterPanel`].hidden = true;
    els[`${filterName}FilterButton`].setAttribute("aria-expanded", "false");
  });
}

function updateFilterButtons() {
  setButtonLabel("chance", "All chances");
  setButtonLabel("branch", "All branches");
  setButtonLabel("college", "All IITs");
}

function setButtonLabel(filterName, emptyLabel) {
  const values = [...state.filters[filterName]];
  els[`${filterName}FilterButton`].textContent =
    values.length === 0 ? emptyLabel : values.length === 1 ? values[0] : `${values.length} selected`;
}

function syncPanelCheckboxes(filterName) {
  const selected = state.filters[filterName];
  els[`${filterName}FilterPanel`].querySelectorAll("input").forEach((input) => {
    input.checked = selected.has(input.value);
  });
}

function syncAllPanels() {
  ["chance", "branch", "college"].forEach(syncPanelCheckboxes);
  updateFilterButtons();
}

function clearFilters() {
  state.filters.chance.clear();
  state.filters.branch.clear();
  state.filters.college.clear();
  els.searchInput.value = "";
  els.showOnlyBtech.checked = false;
  syncAllPanels();
}

function applyPreset(preset) {
  clearFilters();
  if (preset === "top-brand") {
    ["IIT Bombay", "IIT Delhi", "IIT Madras", "IIT Kanpur", "IIT Kharagpur", "IIT Roorkee", "IIT Guwahati"].forEach((college) =>
      state.filters.college.add(college),
    );
    els.priorityMode.value = "college";
  }
  if (preset === "circuit") {
    ["CSE", "AI / Data", "Math / Computing", "Electronics", "Electrical"].forEach((branch) => state.filters.branch.add(branch));
    els.priorityMode.value = "branch";
    els.showOnlyBtech.checked = true;
  }
  if (preset === "btech") {
    els.showOnlyBtech.checked = true;
  }
  if (preset === "safe") {
    ["Likely", "Good chance"].forEach((chance) => state.filters.chance.add(chance));
    els.priorityMode.value = "safety";
  }
  if (preset === "close-reach") {
    state.filters.chance.add("Close reach");
  }
  syncAllPanels();
  render();
}

function selectedRows(rank = currentRank()) {
  return [...state.selectedIds]
    .map((id) => state.rows.find((row) => row.id === id))
    .filter(Boolean)
    .toSorted((a, b) => sortValue(b, rank) - sortValue(a, rank));
}

async function copySelectedChoices() {
  const rank = currentRank();
  const rows = selectedRows(rank);
  const text = rows.length
    ? rows
        .map((row, index) => {
          const rowMargin = margin(row, rank);
          return `${index + 1}. ${row.college} - ${trimCourse(row.course)} | ${row.branch} | closing ${row.closing} | margin ${formatMargin(rowMargin)} | ${classifyChance(rowMargin)}`;
        })
        .join("\n")
    : "No choices selected.";
  await navigator.clipboard.writeText(text);
  els.copySelected.textContent = "Copied";
  setTimeout(() => {
    els.copySelected.textContent = "Copy list";
  }, 1200);
}

function downloadSelectedChoices() {
  const rank = currentRank();
  const rows = selectedRows(rank);
  const header = ["Order", "College", "Course", "Branch", "Closing Rank", "Margin", "Chance"];
  const body = rows.map((row, index) => {
    const rowMargin = margin(row, rank);
    return [index + 1, row.college, trimCourse(row.course), row.branch, row.closing, rowMargin, classifyChance(rowMargin)];
  });
  const csv = [header, ...body].map((line) => line.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `iit-selected-choices-rank-${rank}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
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
