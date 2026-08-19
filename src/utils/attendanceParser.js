/** Columns like st101, st102, st 104 with present/absent per class row */
const STUDENT_COLUMN_PATTERN = /^st\s*\d+$/i;

const normalizeStudentKey = (key) => key.trim().replace(/\s+/g, '').toLowerCase();

export const parseAttendanceByStudentId = (rows) => {
  const stats = {};

  rows.forEach((row) => {
    Object.entries(row).forEach(([key, value]) => {
      if (!STUDENT_COLUMN_PATTERN.test(key.trim())) return;
      if (value === null || value === undefined || value === '') return;

      const status = String(value).toLowerCase().trim();
      if (
        status === 'na' ||
        status === 'n/a' ||
        status === 'n.a' ||
        status === 'n.a.' ||
        status === 'na.' ||
        status === '-' ||
        status === '--' ||
        status === 'not applicable'
      ) {
        return; // Skip NA values from total class count
      }

      const id = normalizeStudentKey(key);
      if (!stats[id]) {
        stats[id] = { present: 0, total: 0, displayId: key.trim().replace(/\s+/g, '') };
      }

      stats[id].total += 1;
      if (status.includes('present') || status === 'p') stats[id].present += 1;
    });
  });

  return Object.values(stats)
    .map((s) => ({
      studentId: s.displayId,
      percentage: s.total ? Math.round((s.present / s.total) * 100) : 0,
      present: s.present,
      total: s.total,
    }))
    .sort((a, b) => a.studentId.localeCompare(b.studentId, undefined, { numeric: true }));
};
