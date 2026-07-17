import {
  fetchGoogleSheetData,
  convertSheetRowsToObjects,
  isGoogleSheetsConfigured,
  googleSheetsConfig,
} from './googleSheetsClient';

const SECTION_ENV_KEYS = {
  students: 'VITE_GOOGLE_SHEETS_SHEET_STUDENTS',
  attendance: 'VITE_GOOGLE_SHEETS_ATTENDANCE_SHEETS',
  marks: 'VITE_GOOGLE_SHEETS_SHEET_MARKS',
  timetable: 'VITE_GOOGLE_SHEETS_SHEET_TIMETABLE',
  teachers: 'VITE_GOOGLE_SHEETS_SHEET_TEACHERS',
  newStudentInquiry: 'VITE_GOOGLE_SHEETS_SHEET_NEW_STUDENT_INQUIRY',
  exam: 'VITE_GOOGLE_SHEETS_SHEET_EXAM',
  activeSession: 'VITE_GOOGLE_SHEETS_SHEET_ACTIVE_SESSION',
  fees: 'VITE_GOOGLE_SHEETS_SHEET_FEES',
};

export const getSectionEnvKey = (section) => SECTION_ENV_KEYS[section] || '';

export const isSectionConfigured = (section) =>
  Boolean(
    isGoogleSheetsConfigured() &&
      (section === 'attendance'
        ? googleSheetsConfig.attendanceSheets.length > 0
        : googleSheetsConfig.sheets[section])
  );

export const fetchSectionData = async (section) => {
  const sheetName =
    section === 'attendance'
      ? googleSheetsConfig.attendanceSheets[0] || ''
      : googleSheetsConfig.sheets[section];

  if (!isGoogleSheetsConfigured()) {
    return {
      rows: [],
      status: 'no_token',
      message: 'Google Sheets API Key or Spreadsheet ID is missing. Add VITE_GOOGLE_SHEETS_API_KEY and VITE_GOOGLE_SHEETS_ID in .env file (project root).',
    };
  }

  if (!sheetName) {
    return {
      rows: [],
      status: 'no_table',
      message: `Sheet name configuration missing. Add ${getSectionEnvKey(section)}=sheet_name in .env.`,
      envKey: getSectionEnvKey(section),
    };
  }

  try {
    const rawRows = await fetchGoogleSheetData(sheetName);
    const rows = convertSheetRowsToObjects(rawRows);
    return {
      rows,
      status: 'ok',
      tableId: sheetName,
      source: 'google-sheets',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    return {
      rows: [],
      status: 'error',
      message: error.message || 'Failed to fetch from Google Sheets',
      tableId: sheetName,
    };
  }
};

