export const normalizeStudentId = (id) =>
  String(id || '')
    .trim()
    .replace(/\s+/g, '')
    .toLowerCase();

export const collectStudentIds = (...sources) => {
  const ids = new Map();
  sources.flat().forEach((item) => {
    const raw = item?.studentId ?? item;
    if (!raw || raw === '—') return;
    const norm = normalizeStudentId(raw);
    if (!ids.has(norm)) ids.set(norm, String(raw).trim().replace(/\s+/g, '') || raw);
  });
  return Array.from(ids.values()).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );
};
