import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.VITE_GOOGLE_SHEETS_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

// CORS helper — call at the top of every handler
export function setCors(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
}

// Build and return the Google Sheets client
export function getSheetsClient() {
  if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
    throw new Error(
      'Google Sheets Service Account Credentials are missing. ' +
      'Please add GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY to your Vercel environment variables.'
    );
  }
  const auth = new google.auth.JWT({
    email: SERVICE_ACCOUNT_EMAIL,
    key: PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

export { SPREADSHEET_ID };

// --------------- ROW MAPPERS ---------------

export const mapBodyToRow = (body, headers, nextId = null) => {
  return headers.map(header => {
    const key = header.toLowerCase().trim();
    if (key === 'id') return String(nextId || body.id || '').trim();
    if (key === 'student_id') return String(body.studentId || body.student_id || '').trim();
    if (key === 'academic year') return String(body.academicYear || body.academic_year || '').trim();
    if (key === 'roll number') return String(body.rollNumber || body.roll_number || '').trim();
    if (key === 'student_name') return String(body.studentName || body.student_name || '').toUpperCase().trim();
    if (key === 'father name') return String(body.fatherName || body.father_name || '').toUpperCase().trim();
    if (key === 'surname') return String(body.surname || '').toUpperCase().trim();
    if (key === 'mother name') return String(body.motherName || body.mother_name || '').toUpperCase().trim();
    if (key === 'date of birth') return String(body.dateOfBirth || body.date_of_birth || '').trim();
    if (key === 'gender') return String(body.gender || '').toUpperCase().trim();
    if (key === 'class') return String(body.class || '').trim();
    if (key === 'section') return String(body.section || '').trim();
    if (key === 'board') return String(body.board || 'GSEB').toUpperCase().trim();
    if (key === 'medium') return String(body.medium || 'GM').toUpperCase().trim();
    if (key === 'course') return String(body.course || body.group || '').trim();
    if (key === 'parent_phone') return String(body.parentPhone || body.parentMobile || '').trim();
    if (key === 'student_phone') return String(body.studentPhone || body.mobileNumber || '').trim();
    if (key === 'address') return String(body.address || '').trim();
    if (key === 'email') return String(body.email || '').trim();
    if (key === 'fees paid') return String(body.feesPaid || '0').trim();
    if (key === 'pending fees') return String(body.pendingFees || '0').trim();
    if (key === 'total fees') return String(body.totalFees || '0').trim();
    if (key === 'discount') return String(body.discount || '0').trim();
    if (key === 'original fees') return String(body.originalFees || '0').trim();
    if (key === 'admission date') return String(body.admissionDate || '').trim();
    if (key === 'active') return body.active !== false && String(body.status).toLowerCase() !== 'inactive' ? 'TRUE' : 'FALSE';
    return String(body[header] || '').trim();
  });
};

export const mapTimetableBodyToRow = (body) => [
  String(body.day || '').toUpperCase().trim(),
  String(body.lecture || '').trim(),
  String(body.classType || '').toUpperCase().trim(),
  String(body.className || '').toUpperCase().trim(),
  String(body.time || '').trim(),
  String(body.subject || '').toUpperCase().trim(),
];

export const mapExamBodyToRow = (body) => [
  '',
  String(body.examDate || '').trim(),
  String(body.day || '').trim(),
  String(body.time || '').trim(),
  String(body.subject || '').trim(),
  String(body.examType || '').trim(),
  String(body.totalMarks || '').trim(),
  String(body.className || '').toUpperCase().trim(),
  String(body.section || '').trim(),
];

export const mapMarksBodyToRow = (body) => [
  '',
  String(body.date || '').trim(),
  String(body.subject || '').trim(),
  String(body.examType || '').trim(),
  String(body.studentId || '').trim(),
  String(body.name || '').toUpperCase().trim(),
  String(body.totalMarks || '').trim(),
  String(body.obtainMarks || '').trim(),
];

export const mapActiveSessionBodyToRow = (body) => [
  String(body.phone || '').trim(),
  String(body.activeRole || body.Active_role || body.active_role || '').trim(),
  String(body.activeStudentId || body.Active_student_id || body.active_student_id || '').trim(),
];

export const mapTaskBodyToRow = (body) => [
  String(body.name || body.task || '').trim(),
  String(body.assigneeId || body.assign || '').trim(),
  String(body.dueDate || body.due || '').trim(),
  String(body.priority || 'Normal').trim(),
  String(body.status || 'Pending').trim(),
];

export const mapFeesBodyToRow = (body) => [
  String(body.studentId || body.Student_ID || body['Student ID'] || '').trim(),
  String(body.name || body.Name || '').trim(),
  String(body.totalGrossFee || body['TOTAL GROSS FEE'] || body.total_gross_fee || '').trim(),
  String(body.discount || body.DISCOUNT || '').trim(),
  String(body.totalNetFee || body['TOTAL NET FEE'] || body.total_net_fee || '').trim(),
  String(body.paidFee || body['PAID FEE'] || body.paid_fee || '').trim(),
  String(body.pendingFee || body['PENDING FEE'] || body.pending_fee || '').trim(),
  String(body.date || body.Date || body.DATE || '').trim(),
  String(body.details1 || body.detials1 || body.DETIALS1 || '').trim(),
  String(body.ref1 || body.REF1 || body.Ref1 || '').trim(),
  String(body.amount1 || body.AMOUNT1 || body.Amount1 || '').trim(),
  String(body.date2 || body.Date2 || body.DATE2 || '').trim(),
  String(body.details2 || body.detials2 || body.DETIALS2 || '').trim(),
  String(body.ref2 || body.REF2 || body.Ref2 || '').trim(),
  String(body.amount2 || body.AMOUNT2 || body.Amount2 || '').trim(),
  String(body.date3 || body.Date3 || body.DATE3 || '').trim(),
  String(body.details3 || body.detials3 || body.DETIALS3 || '').trim(),
  String(body.ref3 || body.REF3 || body.Ref3 || '').trim(),
  String(body.amount3 || body.AMOUNT3 || body.Amount3 || '').trim(),
  String(body.date4 || body.Date4 || body.DATE4 || '').trim(),
  String(body.details4 || body.detials4 || body.DETIALS4 || '').trim(),
  String(body.ref4 || body.REF4 || body.Ref4 || '').trim(),
  String(body.amount4 || body.AMOUNT4 || body.Amount4 || '').trim(),
];

// --------------- SHARED HELPERS ---------------

export const ensureAndGetHeaders = async (sheets, sheetName) => {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1:AZ1`,
  });
  const headers = res.data.values[0] || [];
  let modified = false;
  if (headers[17] === '') {
    headers[17] = 'Admission Date';
    modified = true;
  }
  const hasActive = headers.some(h => String(h).toLowerCase().trim() === 'active');
  if (!hasActive) {
    headers.push('Active');
    modified = true;
  }
  if (modified) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:AZ1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [headers] },
    });
  }
  return headers;
};

export const deleteSheetRows = async (sheets, sheetName, rowNumbers) => {
  const spreadsheetMeta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheet = spreadsheetMeta.data.sheets.find(s => s.properties.title === sheetName);
  if (!sheet) throw new Error(`Sheet "${sheetName}" not found.`);
  const sheetId = sheet.properties.sheetId;

  const sorted = [...rowNumbers].sort((a, b) => b - a);
  const requests = sorted.map(rowNum => ({
    deleteDimension: {
      range: { sheetId, dimension: 'ROWS', startIndex: rowNum - 1, endIndex: rowNum },
    },
  }));
  await sheets.spreadsheets.batchUpdate({ spreadsheetId: SPREADSHEET_ID, requestBody: { requests } });
};
