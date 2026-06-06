export function selectedRowsInOrder(selectedIds, rows) {
  return [...selectedIds]
    .map((id) => rows.find((row) => row.id === id))
    .filter(Boolean);
}

export function moveSelectedId(selectedIds, id, targetIndex) {
  const ids = [...selectedIds];
  const currentIndex = ids.indexOf(id);
  if (currentIndex === -1) {
    return new Set(ids);
  }

  const [moved] = ids.splice(currentIndex, 1);
  const boundedIndex = Math.max(0, Math.min(Number(targetIndex), ids.length));
  ids.splice(boundedIndex, 0, moved);
  return new Set(ids);
}
