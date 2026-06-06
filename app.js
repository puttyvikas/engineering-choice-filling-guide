import { sortTableRows } from "./tableSort.js";
import { loadSelectedIds, saveSelectedIds } from "./selectionStorage.js";
import { CHANCE_LABELS, classifyChance, confidenceScore } from "./admissionModel.js";
import { bufferVisualClass } from "./bufferVisuals.js";
import { isBtechCourse, isFiveYearDualDegreeCourse } from "./courseFilters.js";
import { moveSelectedId, selectedRowsInOrder } from "./selectedOrder.js";

const DATA_URLS = ["../analysis_build/combined_choice_analysis.json", "./data/combined_choice_analysis.json"];
const DEFAULT_ADVANCED_RANK = 1948;
const DEFAULT_MAIN_RANK = 7316;
const FILTER_NAMES = ["chance", "instituteType", "quota", "branch", "college"];

const state = {
  rows: [],
  selectedIds: loadSelectedIds(),
  tableSort: {
    realistic: { key: "score", direction: "desc" },
    reach: { key: "margin", direction: "desc" },
  },
  filters: {
    chance: new Set(),
    instituteType: new Set(),
    quota: new Set(),
    branch: new Set(),
    college: new Set(),
  },
};

const els = {
  advancedRankInput: document.querySelector("#advancedRankInput"),
  mainRankInput: document.querySelector("#mainRankInput"),
  priorityMode: document.querySelector("#priorityMode"),
  chanceFilterButton: document.querySelector("#chanceFilterButton"),
  chanceFilterPanel: document.querySelector("#chanceFilterPanel"),
  instituteTypeFilterButton: document.querySelector("#instituteTypeFilterButton"),
  instituteTypeFilterPanel: document.querySelector("#instituteTypeFilterPanel"),
  quotaFilterButton: document.querySelector("#quotaFilterButton"),
  quotaFilterPanel: document.querySelector("#quotaFilterPanel"),
  branchFilterButton: document.querySelector("#branchFilterButton"),
  branchFilterPanel: document.querySelector("#branchFilterPanel"),
  collegeFilterButton: document.querySelector("#collegeFilterButton"),
  collegeFilterPanel: document.querySelector("#collegeFilterPanel"),
  searchInput: document.querySelector("#searchInput"),
  showOnlyBtech: document.querySelector("#showOnlyBtech"),
  showOnlyDualDegree: document.querySelector("#showOnlyDualDegree"),
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
  const data = await loadDashboardData();
  state.rows = data.all_rows.map((row, index) => normalizeRow(row, index));
  populateFilters(state.rows);
  bindEvents();
  render();
}

async function loadDashboardData() {
  for (const url of DATA_URLS) {
    const response = await fetch(url);
    if (response.ok) {
      return response.json();
    }
  }
  throw new Error("Could not load dashboard data from local or deploy paths.");
}

function normalizeRow(row, index) {
  return {
    id: `${row.Institute}|${row["Academic Program Name"]}|${index}`,
    instituteType: row["Institute Type"] || "IIT",
    quota: row.Quota || "AI",
    quotaNote: row["Quota Note"] || "",
    rankBasis: row["Rank Basis"] || "JEE Advanced SC",
    defaultRankUsed: Number(row["Rank Used"]),
    college: shortCollegeName(row.Institute),
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
  renderMultiFilter("chance", CHANCE_LABELS);
  renderMultiFilter("instituteType", ["IIT", "NIT", "IIIT"]);
  renderMultiFilter(
    "quota",
    unique(rows.map((row) => row.quota)).sort(),
  );
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
    els.advancedRankInput,
    els.mainRankInput,
    els.priorityMode,
    els.searchInput,
    els.showOnlyBtech,
    els.showOnlyDualDegree,
  ].forEach((element) => element.addEventListener("input", render));

  FILTER_NAMES.forEach((filterName) => {
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
    saveSelectedIds(state.selectedIds);
    render();
  });

  els.copySelected.addEventListener("click", copySelectedChoices);
  els.downloadSelected.addEventListener("click", downloadSelectedChoices);
  document.querySelectorAll("[data-sort-table][data-sort-key]").forEach((button) => {
    button.addEventListener("click", () => updateTableSort(button.dataset.sortTable, button.dataset.sortKey));
  });
}

function render() {
  const ranks = currentRanks();
  const rows = filteredRows(ranks);
  const sorted = [...rows].sort((a, b) => sortValue(b, ranks) - sortValue(a, ranks));
  const realistic = sorted.filter((row) => margin(row, ranks) >= 0);
  const reaches = sorted.filter((row) => {
    const rowMargin = margin(row, ranks);
    return rowMargin < 0 && rowMargin >= -650;
  });
  const closeReaches = rows.filter((row) => {
    const rowMargin = margin(row, ranks);
    return rowMargin < 0 && rowMargin >= -300;
  });

  els.realisticCount.textContent = realistic.length;
  els.borderlineCount.textContent = rows.filter((row) => {
    const rowMargin = margin(row, ranks);
    return rowMargin >= 0 && rowMargin <= 150;
  }).length;
  els.reachCount.textContent = closeReaches.length;

  const best = realistic[0];
  els.bestRealistic.textContent = best ? best.college : "-";
  els.bestRealisticCourse.textContent = best ? trimCourse(best.course) : "No matching option";

  els.realisticLabel.textContent = `${realistic.length} rows`;
  els.reachLabel.textContent = `${reaches.length} rows`;

  renderTable(els.realisticTable, sortRowsForTable(realistic, ranks, "realistic").slice(0, 80), ranks);
  renderTable(els.reachTable, sortRowsForTable(reaches, ranks, "reach").slice(0, 60), ranks);
  updateSortButtons();
  renderChips();
  renderSelected(ranks);
  renderBranchMix(realistic);
}

function sortRowsForTable(rows, ranks, tableName) {
  const withSortValues = rows.map((row) => {
    const rankUsed = rowRank(row, ranks);
    const rowMargin = margin(row, ranks);
    return {
      ...row,
      rankUsed,
      margin: rowMargin,
      chance: classifyChance(rowMargin),
      confidence: confidenceScore(rowMargin),
      score: sortValue(row, ranks),
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

function currentRanks() {
  return {
    advanced: rankFromInput(els.advancedRankInput, DEFAULT_ADVANCED_RANK),
    main: rankFromInput(els.mainRankInput, DEFAULT_MAIN_RANK),
  };
}

function rankFromInput(input, fallback) {
  const parsed = Number(input.value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function filteredRows(ranks) {
  const query = els.searchInput.value.trim().toLowerCase();

  return state.rows.filter((row) => {
    const rowChance = classifyChance(margin(row, ranks));
    const btechOk = !els.showOnlyBtech.checked || isBtechCourse(row.course);
    const dualDegreeOk = !els.showOnlyDualDegree.checked || isFiveYearDualDegreeCourse(row.course);
    const chanceOk = state.filters.chance.size === 0 || state.filters.chance.has(rowChance);
    const typeOk = state.filters.instituteType.size === 0 || state.filters.instituteType.has(row.instituteType);
    const quotaOk = state.filters.quota.size === 0 || state.filters.quota.has(row.quota);
    const branchOk = state.filters.branch.size === 0 || state.filters.branch.has(row.branch);
    const collegeOk = state.filters.college.size === 0 || state.filters.college.has(row.college);
    const searchOk =
      query.length === 0 ||
      row.course.toLowerCase().includes(query) ||
      row.college.toLowerCase().includes(query) ||
      row.instituteType.toLowerCase().includes(query) ||
      row.quota.toLowerCase().includes(query);

    return btechOk && dualDegreeOk && chanceOk && typeOk && quotaOk && branchOk && collegeOk && searchOk;
  });
}

function sortValue(row, ranks) {
  const rowMargin = margin(row, ranks);
  const confidence = confidenceScore(rowMargin);
  if (els.priorityMode.value === "branch") {
    return row.branchScore * 0.56 + row.instituteScore * 0.3 + confidence * 0.14;
  }
  if (els.priorityMode.value === "safety") {
    return confidence * 0.58 + row.instituteScore * 0.26 + row.branchScore * 0.16;
  }
  return row.instituteScore * 0.7 + row.branchScore * 0.2 + confidence * 0.1;
}

function margin(row, ranks) {
  return row.closing - rowRank(row, ranks);
}

function rowRank(row, ranks) {
  if (row.instituteType === "IIT") {
    return ranks.advanced;
  }
  return ranks.main;
}

function renderTable(target, rows, ranks) {
  target.innerHTML = "";
  if (rows.length === 0) {
    target.append(document.querySelector("#emptyRowTemplate").content.cloneNode(true));
    return;
  }

  for (const row of rows) {
    const rankUsed = rowRank(row, ranks);
    const rowMargin = margin(row, ranks);
    const chance = classifyChance(rowMargin);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="college">${escapeHtml(row.college)}</td>
      <td><span class="pill type-pill ${typePillClass(row.instituteType)}">${escapeHtml(row.instituteType)}</span></td>
      <td><span class="pill quota-pill" title="${escapeHtml(row.quotaNote)}">${escapeHtml(row.quota)}</span></td>
      <td class="course">${escapeHtml(trimCourse(row.course))}</td>
      <td><span class="pill">${escapeHtml(row.branch)}</span></td>
      <td><span title="${escapeHtml(row.rankBasis)}">${rankUsed}</span></td>
      <td>${row.closing}</td>
      <td class="${rowMargin >= 0 ? "margin-positive" : "margin-negative"}">${formatMargin(rowMargin)}</td>
      <td><span class="pill buffer-pill ${bufferVisualClass(chance)}">${chance}</span></td>
      <td><span class="confidence ${bufferVisualClass(chance)}">${confidenceScore(rowMargin)}%</span></td>
      <td>${sortValue(row, ranks).toFixed(1)}</td>
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
  saveSelectedIds(state.selectedIds);
  render();
}

function renderSelected(ranks) {
  els.selectedList.innerHTML = "";
  const selected = selectedRowsInOrder(state.selectedIds, state.rows);
  els.selectedCount.textContent = selected.length;

  if (selected.length === 0) {
    const li = document.createElement("li");
    li.innerHTML = "<strong>No choices selected yet.</strong><small>Add options from either table to compare a provisional list.</small>";
    els.selectedList.append(li);
    return;
  }

  selected.forEach((row, index) => {
    const rowMargin = margin(row, ranks);
    const rankUsed = rowRank(row, ranks);
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${index + 1}. ${escapeHtml(row.college)} - ${escapeHtml(trimCourse(row.course))}</strong>
      <small>${row.instituteType} | ${row.quota} | ${row.branch} | ${row.rankBasis} ${rankUsed} | closing ${row.closing} | margin ${formatMargin(rowMargin)} | ${classifyChance(rowMargin)} | buffer ${confidenceScore(rowMargin)}%</small>
      <div class="choice-actions">
        <button class="move-choice" type="button" data-action="up" ${index === 0 ? "disabled" : ""}>Up</button>
        <button class="move-choice" type="button" data-action="down" ${index === selected.length - 1 ? "disabled" : ""}>Down</button>
        <label class="move-position">
          <span>Move to</span>
          <input type="number" min="1" max="${selected.length}" value="${index + 1}" />
        </label>
        <button class="remove-choice" type="button">Remove</button>
      </div>
    `;
    li.querySelector('[data-action="up"]').addEventListener("click", () => reorderSelected(row.id, index - 1));
    li.querySelector('[data-action="down"]').addEventListener("click", () => reorderSelected(row.id, index + 1));
    li.querySelector(".move-position input").addEventListener("change", (event) => {
      reorderSelected(row.id, Number(event.target.value) - 1);
    });
    li.querySelector(".remove-choice").addEventListener("click", () => {
      state.selectedIds.delete(row.id);
      saveSelectedIds(state.selectedIds);
      render();
    });
    els.selectedList.append(li);
  });
}

function reorderSelected(id, targetIndex) {
  state.selectedIds = moveSelectedId(state.selectedIds, id, targetIndex);
  saveSelectedIds(state.selectedIds);
  render();
}

function renderChips() {
  els.activeChips.innerHTML = "";
  const chips = [];
  for (const filterName of FILTER_NAMES) {
    for (const value of state.filters[filterName]) {
      chips.push({ type: filterName, value });
    }
  }
  if (els.showOnlyBtech.checked) {
    chips.push({ type: "btech", value: "BTech only" });
  }
  if (els.showOnlyDualDegree.checked) {
    chips.push({ type: "dual", value: "5Y dual degree" });
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
  } else if (chip.type === "dual") {
    els.showOnlyDualDegree.checked = false;
  } else if (chip.type === "search") {
    els.searchInput.value = "";
  }
  updateFilterButtons();
  render();
}

function labelForFilter(type) {
  if (type === "btech") return "Type";
  if (type === "dual") return "Type";
  if (type === "instituteType") return "Institute";
  if (type === "quota") return "Quota";
  if (type === "chance") return "Cutoff";
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
  FILTER_NAMES.forEach((filterName) => {
    els[`${filterName}FilterPanel`].hidden = true;
    els[`${filterName}FilterButton`].setAttribute("aria-expanded", "false");
  });
}

function updateFilterButtons() {
  setButtonLabel("chance", "All buffers");
  setButtonLabel("instituteType", "All types");
  setButtonLabel("quota", "All quotas");
  setButtonLabel("branch", "All branches");
  setButtonLabel("college", "All colleges");
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
  FILTER_NAMES.forEach(syncPanelCheckboxes);
  updateFilterButtons();
}

function clearFilters() {
  state.filters.chance.clear();
  state.filters.instituteType.clear();
  state.filters.quota.clear();
  state.filters.branch.clear();
  state.filters.college.clear();
  els.searchInput.value = "";
  els.showOnlyBtech.checked = false;
  els.showOnlyDualDegree.checked = false;
  syncAllPanels();
}

function applyPreset(preset) {
  clearFilters();
  if (preset === "top-brand") {
    state.filters.instituteType.add("IIT");
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
    ["Large cutoff buffer", "Medium cutoff buffer"].forEach((chance) => state.filters.chance.add(chance));
    els.priorityMode.value = "safety";
  }
  if (preset === "close-reach") {
    state.filters.chance.add("Small cutoff gap");
  }
  syncAllPanels();
  render();
}

function selectedRows() {
  return selectedRowsInOrder(state.selectedIds, state.rows);
}

async function copySelectedChoices() {
  const ranks = currentRanks();
  const rows = selectedRows();
  const text = rows.length
    ? rows
        .map((row, index) => {
          const rowMargin = margin(row, ranks);
          const rankUsed = rowRank(row, ranks);
          return `${index + 1}. ${row.college} - ${trimCourse(row.course)} | ${row.instituteType} | ${row.quota} | ${row.branch} | ${row.rankBasis} ${rankUsed} | closing ${row.closing} | margin ${formatMargin(rowMargin)} | ${classifyChance(rowMargin)} | buffer ${confidenceScore(rowMargin)}%`;
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
  const ranks = currentRanks();
  const rows = selectedRows();
  const header = ["Order", "Institute Type", "College", "Quota", "Course", "Branch", "Rank Basis", "Rank Used", "Closing Rank", "Margin", "Cutoff Buffer", "Buffer %"];
  const body = rows.map((row, index) => {
    const rowMargin = margin(row, ranks);
    const rankUsed = rowRank(row, ranks);
    return [index + 1, row.instituteType, row.college, row.quota, trimCourse(row.course), row.branch, row.rankBasis, rankUsed, row.closing, rowMargin, classifyChance(rowMargin), `${confidenceScore(rowMargin)}%`];
  });
  const csv = [header, ...body].map((line) => line.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `josaa-selected-choices-advanced-${ranks.advanced}-main-${ranks.main}.csv`;
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
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
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

function trimCourse(course) {
  return course.replace(/\s*\([^)]*Years,?\s*/i, " (").replace("Bachelor of Technology", "B.Tech").replace("Bachelor of Science", "BS");
}

function shortCollegeName(college) {
  return String(college)
    .replace("Indian Institute of Technology", "IIT")
    .replace("National Institute of Technology", "NIT")
    .replace("Indian Institute of Information Technology", "IIIT")
    .replace("INDIAN INSTITUTE OF INFORMATION TECHNOLOGY", "IIIT")
    .replace("Indian institute of information technology", "IIIT")
    .replace("Atal Bihari Vajpayee IIIT and Management", "ABV-IIITM")
    .replace("Pt. Dwarka Prasad Mishra IIIT,", "IIIT")
    .replace(/\s+/g, " ")
    .trim();
}

function formatMargin(value) {
  return value > 0 ? `+${value}` : String(value);
}

function typePillClass(type) {
  const normalized = String(type).toLowerCase();
  if (normalized === "iit") return "type-iit";
  if (normalized === "nit") return "type-nit";
  if (normalized === "iiit") return "type-iiit";
  return "type-other";
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
