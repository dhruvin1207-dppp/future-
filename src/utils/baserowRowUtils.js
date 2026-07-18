import { formatDateToDDMMYYYY } from './dateUtils';

const HIDDEN_KEYS = new Set(['order', 'created_on', 'updated_on', 'last_modified']);

const DATE_COLUMN_NAMES = new Set([
  'date', 'Date', 'DATE',
  'exam_date', 'Exam Date', 'exam date',
  'admission_date', 'Admission Date', 'admission date',
  'date_of_birth', 'Date of Birth', 'date of birth', 'DOB', 'dob',
  'due_date', 'Due Date', 'due date',
  'Date2', 'Date3', 'Date4', 'DATE2', 'DATE3', 'DATE4', 'date2', 'date3', 'date4'
]);

const isDateColumn = (colName) => {
  if (DATE_COLUMN_NAMES.has(colName)) return true;
  const lower = String(colName).toLowerCase();
  return lower.includes('date') || lower === 'dob';
};

export const rowToDisplayColumns = (rows) => {
  if (!rows?.length) return { columns: [], rows: [] };

  const sample = rows[0];
  const columns = Object.keys(sample).filter((k) => !HIDDEN_KEYS.has(k) && k !== 'id');

  const displayRows = rows.map((row) => {
    const cells = {};
    columns.forEach((col) => {
      const val = row[col];
      if (val === null || val === undefined) {
        cells[col] = '—';
      } else if (typeof val === 'object') {
        cells[col] = JSON.stringify(val);
      } else if (isDateColumn(col)) {
        cells[col] = formatDateToDDMMYYYY(val);
      } else {
        cells[col] = String(val);
      }
    });
    return { id: row.id, cells };
  });

  return { columns, rows: displayRows };
};
