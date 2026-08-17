export const normalizeStudentId = (id) => {
  if (!id) return '';
  let str = String(id).trim().replace(/\s+/g, '').toLowerCase().replace(/\]+$/, '');
  
  // Standardize student IDs formatted as F + 7 digits + roll number (e.g., F26271120010 -> f2627112010)
  const match = str.match(/^(f\d{7})0*(\d+)$/i);
  if (match) {
    const prefix = match[1].toLowerCase();
    const rollNum = parseInt(match[2], 10);
    const paddedRoll = String(rollNum).padStart(3, '0');
    return `${prefix}${paddedRoll}`;
  }
  
  return str;
};

export const collectStudentIds = (...sources) => {
  const ids = new Map();
  sources.flat().forEach((item) => {
    const raw = item?.studentId ?? item;
    if (!raw || raw === '—') return;
    const norm = normalizeStudentId(raw);
    if (!ids.has(norm)) ids.set(norm, String(raw).trim().replace(/\s+/g, '').replace(/\]+$/, '') || raw);
  });
  return Array.from(ids.values()).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );
};

