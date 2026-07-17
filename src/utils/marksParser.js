import { normalizeStudentId } from './studentId';

/** Exam types from Baserow — not subjects (e.g. weekly, mid term) */
const NOT_SUBJECTS = new Set([
  'weekly',
  'mid term',
  'mid serm',
  'mid semester',
  'final',
  'unit test',
  'quarterly',
  'annual',
]);

const normalizeSubjectName = (name) => {
  if (!name) return '';
  const trimmed = String(name).trim();
  const lower = trimmed.toLowerCase().replace(/\.+$/, '');
  
  if (
    lower === 'maths' ||
    lower === 'biology' ||
    lower === 'maths/biology' ||
    lower === 'maths/biolopgy' ||
    lower === 'math' ||
    lower === 'biolopgy' ||
    lower === 'math/biology' ||
    lower === 'maths/biology.' ||
    lower === 'maths/biolopgy.' ||
    lower === 'biology.'
  ) {
    return 'maths/biology';
  }
  
  return trimmed;
};

const isValidSubject = (name) => {
  const key = String(name).trim().toLowerCase();
  return key.length > 0 && !NOT_SUBJECTS.has(key);
};

const pick = (row, keys) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return row[key];
    }
  }
  return null;
};

export const parseMarksRecords = (rows) => {
  const records = [];

  rows.forEach((row) => {
    const rawId = pick(row, ['Student id', 'Student ID', 'student_id', 'studentId', 'roll_no', 'Roll No']);
    const rawSubject = pick(row, ['subject', 'Subject']);
    const rawObtained = pick(row, ['obtain marks', 'obtained_marks', 'Obtained Marks', 'obtained marks', 'marks', 'score']);
    const rawTotal = pick(row, ['total makrs', 'total_marks', 'Total Marks', 'total marks', 'total']);

    if (!rawId || !rawSubject || !isValidSubject(rawSubject)) {
      return;
    }

    const subject = normalizeSubjectName(rawSubject);

    let obtained = NaN;
    if (rawObtained !== null && rawObtained !== undefined) {
      const sVal = String(rawObtained).trim().toUpperCase();
      if (sVal === 'AB') {
        obtained = 0;
      } else if (sVal === 'NA' || sVal === '' || sVal === '-') {
        return; // skip records with NA/empty obtain marks
      } else {
        obtained = Number(sVal);
      }
    }

    let total = NaN;
    if (rawTotal !== null && rawTotal !== undefined) {
      const sVal = String(rawTotal).trim().toUpperCase();
      if (sVal === '' || sVal === 'NA' || sVal === '-') {
        return; // skip records with empty/invalid total marks
      }
      total = Number(sVal);
    }

    if (!Number.isFinite(obtained) || !Number.isFinite(total) || total <= 0) {
      return;
    }

    records.push({
      studentId: normalizeStudentId(rawId),
      displayId: String(rawId).trim(),
      subject,
      percent: Math.round((obtained / total) * 100),
      obtained,
      total,
    });
  });

  return records;
};

export const parseMarksByStudentId = (rows) => {
  const records = parseMarksRecords(rows);
  const byStudent = {};

  records.forEach((r) => {
    if (!byStudent[r.studentId]) {
      byStudent[r.studentId] = { displayId: r.displayId, percentages: [], obtainedSum: 0, examCount: 0 };
    }
    byStudent[r.studentId].percentages.push(r.percent);
    byStudent[r.studentId].obtainedSum += r.obtained;
    byStudent[r.studentId].examCount += 1;
  });

  return Object.entries(byStudent)
    .map(([studentId, s]) => ({
      studentId: s.displayId,
      averagePercent: Math.round(
        s.percentages.reduce((a, b) => a + b, 0) / s.percentages.length
      ),
      averageObtained: Math.round(s.obtainedSum / s.examCount),
      examCount: s.examCount,
    }))
    .sort((a, b) => a.studentId.localeCompare(b.studentId, undefined, { numeric: true }));
};

/** Pie chart data: average mark % per subject, optionally for one student */
export const groupMarksBySubject = (records, studentFilter = 'all') => {
  const filtered =
    studentFilter === 'all'
      ? records
      : records.filter(
        (r) => normalizeStudentId(r.studentId) === normalizeStudentId(studentFilter)
      );

  const bySubject = {};
  filtered.forEach((r) => {
    if (!isValidSubject(r.subject)) return;
    if (!bySubject[r.subject]) bySubject[r.subject] = [];
    bySubject[r.subject].push(r.percent);
  });
  return Object.entries(bySubject)
    .map(([subject, pcts]) => ({
      subject,
      value: Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length),
      examCount: pcts.length,
    }))
    .sort((a, b) => b.value - a.value);
};
