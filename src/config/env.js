export const googleSheetsConfig = {
  apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || '',
  sheetId: import.meta.env.VITE_GOOGLE_SHEETS_ID || '',
  attendanceSheets: (import.meta.env.VITE_GOOGLE_SHEETS_ATTENDANCE_SHEETS || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0),
  sheets: {
    students: import.meta.env.VITE_GOOGLE_SHEETS_SHEET_STUDENTS || 'student_info',
    marks: import.meta.env.VITE_GOOGLE_SHEETS_SHEET_MARKS || 'marks',
    timetable: import.meta.env.VITE_GOOGLE_SHEETS_SHEET_TIMETABLE || 'TimeTable',
    teachers: import.meta.env.VITE_GOOGLE_SHEETS_SHEET_TEACHERS || 'teacher_info',
    newStudentInquiry: import.meta.env.VITE_GOOGLE_SHEETS_SHEET_NEW_STUDENT_INQUIRY || 'new inquiry',
    exam: import.meta.env.VITE_GOOGLE_SHEETS_SHEET_EXAM || 'exam_schedule',
    activeSession: import.meta.env.VITE_GOOGLE_SHEETS_SHEET_ACTIVE_SESSION || 'act_session',
  },
  refreshInterval: Number(import.meta.env.VITE_GOOGLE_SHEETS_REFRESH_INTERVAL) || 5000,
};

export const isGoogleSheetsConfigured = () =>
  Boolean(googleSheetsConfig.apiKey && googleSheetsConfig.sheetId);

export const getConfiguredTableKeys = () =>
  Object.entries(googleSheetsConfig.sheets)
    .filter(([, name]) => Boolean(name))
    .map(([key]) => key);

