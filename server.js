import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const ALLOWED_ORIGINS = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : '*';

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
}));
app.use(express.json());

// Health Check Endpoint for cloud hosting (e.g. Render, Railway)
app.get('/', (req, res) => {
  res.json({ status: 'online', message: 'Future Learning Backend API is running', timestamp: new Date().toISOString() });
});

const SPREADSHEET_ID = process.env.VITE_GOOGLE_SHEETS_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

let sheetsClient = null;

// Initialize Google Sheets auth client if credentials are provided
if (SERVICE_ACCOUNT_EMAIL && PRIVATE_KEY) {
  try {
    const auth = new google.auth.JWT({
      email: SERVICE_ACCOUNT_EMAIL,
      key: PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    sheetsClient = google.sheets({ version: 'v4', auth });
    console.log('Google Sheets service account authenticated successfully.');
  } catch (error) {
    console.error('Failed to initialize Google Sheets client:', error.message);
  }
} else {
  console.warn(
    'WARNING: GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY are missing in .env. CRUD operations will run in mock mode.'
  );
}

// Helper: Ensure Sheets Client is active
const getSheetsClient = () => {
  if (!sheetsClient) {
    throw new Error(
      'Google Sheets Service Account Credentials are missing from your .env file. Please add GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY.'
    );
  }
  return sheetsClient;
};

// Helper: Map form fields dynamically to sheet headers
const STUDENT_FIELD_MAP = {
  student_id: { keys: ['studentId', 'student_id'] },
  'academic year': { keys: ['academicYear', 'academic_year'] },
  'roll number': { keys: ['rollNumber', 'roll_number'] },
  student_name: { keys: ['studentName', 'student_name'], upper: true },
  'father name': { keys: ['fatherName', 'father_name'], upper: true },
  surname: { keys: ['surname'], upper: true },
  'mother name': { keys: ['motherName', 'mother_name'], upper: true },
  'date of birth': { keys: ['dateOfBirth', 'date_of_birth'] },
  gender: { keys: ['gender'], upper: true },
  class: { keys: ['class'] },
  section: { keys: ['section'] },
  board: { keys: ['board'], defaultVal: 'GSEB', upper: true },
  medium: { keys: ['medium'], defaultVal: 'GM', upper: true },
  course: { keys: ['course', 'group'] },
  parent_phone: { keys: ['parentPhone', 'parentMobile'] },
  student_phone: { keys: ['studentPhone', 'mobileNumber'] },
  address: { keys: ['address'] },
  email: { keys: ['email'] },
  'fees paid': { keys: ['feesPaid'], defaultVal: '0' },
  'pending fees': { keys: ['pendingFees'], defaultVal: '0' },
  'total fees': { keys: ['totalFees'], defaultVal: '0' },
  discount: { keys: ['discount'], defaultVal: '0' },
  'original fees': { keys: ['originalFees'], defaultVal: '0' },
  'admission date': { keys: ['admissionDate'] },
};

const pickDefinedField = (body, keys) => {
  for (const k of keys) {
    if (body[k] !== undefined) return body[k];
  }
  return undefined;
};

const mapBodyToRow = (body, headers, nextId = null, existingRow = null) => {
  return headers.map((header, idx) => {
    const key = header.toLowerCase().trim();
    const existingVal = existingRow ? String(existingRow[idx] ?? '').trim() : undefined;

    if (key === 'id') return String(nextId || body.id || '').trim();

    if (key === 'active') {
      if (existingRow && body.active === undefined && body.status === undefined) {
        return existingVal;
      }
      return body.active !== false && String(body.status).toLowerCase() !== 'inactive' ? 'TRUE' : 'FALSE';
    }

    const config = STUDENT_FIELD_MAP[key];
    if (config) {
      const provided = pickDefinedField(body, config.keys);
      if (existingRow && provided === undefined) return existingVal;
      const raw = config.defaultVal !== undefined ? (provided || config.defaultVal) : (provided ?? '');
      const trimmed = String(raw).trim();
      return config.upper ? trimmed.toUpperCase() : trimmed;
    }

    if (existingRow && body[header] === undefined) return existingVal;
    return String(body[header] ?? '').trim();
  });
};

// Helper: Ensure the headers are clean and contain custom columns
const ensureAndGetHeaders = async (sheets, sheetName) => {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1:AZ1`,
  });

  const headers = res.data.values[0] || [];
  let modified = false;

  // Overwrite the empty column index 17 with 'Admission Date' if empty
  if (headers[17] === '') {
    headers[17] = 'Admission Date';
    modified = true;
  }

  // Ensure 'Active' is present
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
      requestBody: {
        values: [headers],
      },
    });
  }

  return headers;
};

// 1. CREATE Student
app.post('/api/students', async (req, res) => {
  console.log('POST /api/students - Request Body:', req.body);
  const student = req.body;

  if (!student.studentId || !student.studentName) {
    return res.status(400).json({ success: false, message: 'Student ID and Student Name are required.' });
  }

  try {
    const sheets = getSheetsClient();
    const sheetName = 'student_info';

    // Fetch existing records to check for duplicates and get next ID
    const currentData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:AZ`,
    });

    const rows = currentData.data.values || [];
    const headers = await ensureAndGetHeaders(sheets, sheetName);

    const idColIdx = headers.findIndex(h => String(h).toLowerCase().trim() === 'id');
    const studentIdColIdx = headers.findIndex(h => String(h).toLowerCase().trim() === 'student_id');

    // Duplicate Check
    if (studentIdColIdx !== -1) {
      const duplicate = rows.slice(1).find(r => String(r[studentIdColIdx]).trim().toLowerCase() === String(student.studentId).trim().toLowerCase());
      if (duplicate) {
        return res.status(400).json({ success: false, message: `Student ID "${student.studentId}" already exists.` });
      }
    }

    // Auto Increment sequential ID
    let maxId = 0;
    if (idColIdx !== -1) {
      rows.slice(1).forEach(r => {
        const idVal = parseInt(r[idColIdx]) || 0;
        if (idVal > maxId) maxId = idVal;
      });
    }
    const nextId = maxId + 1;

    const newRow = mapBodyToRow(student, headers, nextId);

    // Append to sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow],
      },
    });

    console.log(`Successfully added student ${student.studentId} to row ${rows.length + 1}`);

    res.status(201).json({
      success: true,
      message: 'Student Added Successfully',
      updatedRecord: { ...student, id: nextId },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to save changes. Please try again.' });
  }
});

// 2. UPDATE Student
app.put('/api/students/:studentId', async (req, res) => {
  const { studentId } = req.params;
  console.log(`PUT /api/students/${studentId} - Request Body:`, req.body);
  const student = req.body;

  try {
    const sheets = getSheetsClient();
    const sheetName = 'student_info';

    // Fetch existing records to locate the correct row
    const currentData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:AZ`,
    });

    const rows = currentData.data.values || [];
    const headers = await ensureAndGetHeaders(sheets, sheetName);

    const studentIdColIdx = headers.findIndex(h => String(h).toLowerCase().trim() === 'student_id');

    if (studentIdColIdx === -1) {
      throw new Error('Student ID column not found in sheet.');
    }

    // Locate Row (1-based sheet row number is rowIndex + 1, skip header row 0)
    const rowIndex = rows.findIndex(
      (r, idx) => idx > 0 && String(r[studentIdColIdx] || '').trim().toLowerCase() === String(studentId).trim().toLowerCase()
    );

    if (rowIndex === -1) {
      return res.status(404).json({ success: false, message: `Student ID "${studentId}" not found.` });
    }

    const rowNumber = rowIndex + 1;
    const existingRow = rows[rowIndex];
    const existingId = existingRow[0]; // Preserve internal sequence id

    const updatedRow = mapBodyToRow(student, headers, existingId, existingRow);

    // Update row
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${rowNumber}:AZ${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [updatedRow],
      },
    });

    console.log(`Successfully updated student ${studentId} at row ${rowNumber}`);

    res.json({
      success: true,
      message: 'Student Updated Successfully',
      updatedRecord: student,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to save changes. Please try again.' });
  }
});

// 3. DELETE Student(s) (supports comma-separated list of IDs)
app.delete('/api/students/:studentId', async (req, res) => {
  const { studentId } = req.params;
  console.log(`DELETE /api/students/${studentId}`);

  try {
    const sheets = getSheetsClient();
    const sheetName = 'student_info';

    // Parse list of IDs to delete
    const studentIds = studentId.split(',').map(id => id.trim().toLowerCase());

    // Fetch existing records to locate their rows
    const currentData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:AZ`,
    });

    const rows = currentData.data.values || [];
    const headers = await ensureAndGetHeaders(sheets, sheetName);

    const studentIdColIdx = headers.findIndex(h => String(h).toLowerCase().trim() === 'student_id');

    if (studentIdColIdx === -1) {
      throw new Error('Student ID column not found in sheet.');
    }

    // Locate rows to delete
    const rowNumbersToDelete = [];
    rows.forEach((row, idx) => {
      const val = String(row[studentIdColIdx] || '').trim().toLowerCase();
      if (studentIds.includes(val)) {
        rowNumbersToDelete.push(idx + 1); // 1-based row number
      }
    });

    if (rowNumbersToDelete.length === 0) {
      return res.status(404).json({ success: false, message: `None of the Student IDs were found.` });
    }

    // Get Sheet numeric ID dynamically to perform deleteDimension batchUpdate
    const spreadsheetMeta = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    const sheet = spreadsheetMeta.data.sheets.find(s => s.properties.title === sheetName);

    if (!sheet) {
      throw new Error(`Sheet ${sheetName} not found.`);
    }
    const sheetId = sheet.properties.sheetId;

    // VERY IMPORTANT: Sort indices in descending order before deleting dimension
    // to prevent shifting issues during delete!
    rowNumbersToDelete.sort((a, b) => b - a);

    const requests = rowNumbersToDelete.map(rowNum => ({
      deleteDimension: {
        range: {
          sheetId: sheetId,
          dimension: 'ROWS',
          startIndex: rowNum - 1, // 0-based inclusive
          endIndex: rowNum,       // 0-based exclusive
        },
      },
    }));

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests,
      },
    });

    console.log(`Successfully deleted rows: ${rowNumbersToDelete.join(', ')}`);

    res.json({
      success: true,
      message: 'Student Deleted Successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to delete student. Please try again.' });
  }
});

// ---------------- TIMETABLE ENDPOINTS ----------------

// Helper to map timetable request body to sheet columns
const mapTimetableBodyToRow = (body) => {
  return [
    String(body.day || '').toUpperCase().trim(),
    String(body.lecture || '').trim(),
    String(body.classType || '').toUpperCase().trim(),
    String(body.className || '').toUpperCase().trim(),
    String(body.time || '').trim(),
    String(body.subject || '').toUpperCase().trim(),
  ];
};

// 1. CREATE Timetable Entry
app.post('/api/timetable', async (req, res) => {
  console.log('POST /api/timetable - Request Body:', req.body);
  const entry = req.body;

  if (!entry.day || !entry.lecture || !entry.className) {
    return res.status(400).json({ success: false, message: 'Day, Lecture, and Class are required.' });
  }

  try {
    const sheets = getSheetsClient();
    const sheetName = 'TimeTable';

    const newRow = mapTimetableBodyToRow(entry);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow],
      },
    });

    res.status(201).json({
      success: true,
      message: 'Timetable Entry Added Successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error adding timetable entry:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to save changes. Please try again.' });
  }
});

// 2. UPDATE Timetable Entry
app.put('/api/timetable/:rowId', async (req, res) => {
  const { rowId } = req.params;
  console.log(`PUT /api/timetable/${rowId} - Request Body:`, req.body);
  const entry = req.body;

  try {
    const sheets = getSheetsClient();
    const sheetName = 'TimeTable';

    const rowNumber = parseInt(rowId);
    if (isNaN(rowNumber) || rowNumber < 1) {
      return res.status(400).json({ success: false, message: 'Invalid row ID.' });
    }

    const updatedRow = mapTimetableBodyToRow(entry);

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${rowNumber}:F${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [updatedRow],
      },
    });

    res.json({
      success: true,
      message: 'Timetable Entry Updated Successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating timetable entry:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to save changes. Please try again.' });
  }
});

// 3. DELETE Timetable Entry (supports comma-separated list of row IDs)
app.delete('/api/timetable/:rowId', async (req, res) => {
  const { rowId } = req.params;
  console.log(`DELETE /api/timetable/${rowId}`);

  try {
    const sheets = getSheetsClient();
    const sheetName = 'TimeTable';

    // Parse list of row IDs to delete, convert to 1-based spreadsheet row numbers
    const rowNumbersToDelete = rowId.split(',')
      .map(id => parseInt(id.trim()))
      .filter(num => !isNaN(num) && num >= 1);

    if (rowNumbersToDelete.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid row ID(s).' });
    }

    // Get Sheet numeric ID dynamically to perform deleteDimension batchUpdate
    const spreadsheetMeta = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    const sheet = spreadsheetMeta.data.sheets.find(s => s.properties.title === sheetName);

    if (!sheet) {
      throw new Error(`Sheet ${sheetName} not found.`);
    }
    const sheetId = sheet.properties.sheetId;

    // Sort indices in descending order before deleting dimension
    rowNumbersToDelete.sort((a, b) => b - a);

    const requests = rowNumbersToDelete.map(rowNum => ({
      deleteDimension: {
        range: {
          sheetId: sheetId,
          dimension: 'ROWS',
          startIndex: rowNum - 1, // 0-based inclusive
          endIndex: rowNum,       // 0-based exclusive
        },
      },
    }));

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests,
      },
    });

    res.json({
      success: true,
      message: 'Timetable Entry Deleted Successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error deleting timetable entry:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to delete timetable entry. Please try again.' });
  }
});

// Helper: Format date strictly to DD-MM-YYYY (with hyphens) converting MM-DD-YYYY to DD-MM-YYYY
const formatDateToDDMMYYYY = (input) => {
  if (input === null || input === undefined) return '';
  const str = String(input).trim();
  if (!str || str === '—') return str;
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}`;
  }
  const partsMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (partsMatch) {
    const p1 = parseInt(partsMatch[1], 10);
    const p2 = parseInt(partsMatch[2], 10);
    const year = partsMatch[3];
    if (p1 > 12) {
      return `${String(p1).padStart(2, '0')}-${String(p2).padStart(2, '0')}-${year}`;
    }
    if (p2 > 12) {
      return `${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}-${year}`;
    }
    const day = String(p1).padStart(2, '0');
    const month = String(p2).padStart(2, '0');
    return `${day}-${month}-${year}`;
  }
  const dateObj = new Date(str);
  if (!isNaN(dateObj.getTime())) {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}-${month}-${year}`;
  }
  return str;
};

// ---------------- EXAM ENDPOINTS ----------------

// Helper to map exam request body to sheet columns
const mapExamBodyToRow = (body) => {
  return [
    '', // Column A (empty)
    formatDateToDDMMYYYY(body.examDate || ''),
    String(body.day || '').trim(),
    String(body.time || '').trim(),
    String(body.subject || '').trim(),
    String(body.examType || '').trim(),
    String(body.totalMarks || '').trim(),
    String(body.className || '').toUpperCase().trim(),
    String(body.section || '').trim(),
  ];
};

// 1. CREATE Exam Entry
app.post('/api/exam', async (req, res) => {
  console.log('POST /api/exam - Request Body:', req.body);
  const entry = req.body;

  if (!entry.examDate || !entry.subject || !entry.className) {
    return res.status(400).json({ success: false, message: 'Exam Date, Subject, and Class are required.' });
  }

  try {
    const sheets = getSheetsClient();
    const sheetName = 'exam_schedule';

    const newRow = mapExamBodyToRow(entry).slice(1); // Exclude empty Column A from append search

    const currentData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!B:B`,
    });
    const currentRows = currentData.data.values || [];
    const nextRowNumber = currentRows.length + 1;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!B${nextRowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow],
      },
    });

    res.status(201).json({
      success: true,
      message: 'Exam Schedule Entry Added Successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error adding exam entry:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to save changes. Please try again.' });
  }
});

// 2. UPDATE Exam Entry
app.put('/api/exam/:rowId', async (req, res) => {
  const { rowId } = req.params;
  console.log(`PUT /api/exam/${rowId} - Request Body:`, req.body);
  const entry = req.body;

  try {
    const sheets = getSheetsClient();
    const sheetName = 'exam_schedule';

    const rowNumber = parseInt(rowId);
    if (isNaN(rowNumber) || rowNumber < 1) {
      return res.status(400).json({ success: false, message: 'Invalid row ID.' });
    }

    const updatedRow = mapExamBodyToRow(entry);

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${rowNumber}:I${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [updatedRow],
      },
    });

    res.json({
      success: true,
      message: 'Exam Schedule Entry Updated Successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating exam entry:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to save changes. Please try again.' });
  }
});

// 3. DELETE Exam Entry (supports comma-separated list of row IDs)
app.delete('/api/exam/:rowId', async (req, res) => {
  const { rowId } = req.params;
  console.log(`DELETE /api/exam/${rowId}`);

  try {
    const sheets = getSheetsClient();
    const sheetName = 'exam_schedule';

    // Parse list of row IDs to delete, convert to 1-based spreadsheet row numbers
    const rowNumbersToDelete = rowId.split(',')
      .map(id => parseInt(id.trim()))
      .filter(num => !isNaN(num) && num >= 1);

    if (rowNumbersToDelete.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid row ID(s).' });
    }

    // Get Sheet numeric ID dynamically to perform deleteDimension batchUpdate
    const spreadsheetMeta = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    const sheet = spreadsheetMeta.data.sheets.find(s => s.properties.title === sheetName);

    if (!sheet) {
      throw new Error(`Sheet ${sheetName} not found.`);
    }
    const sheetId = sheet.properties.sheetId;

    // Sort indices in descending order before deleting dimension
    rowNumbersToDelete.sort((a, b) => b - a);

    const requests = rowNumbersToDelete.map(rowNum => ({
      deleteDimension: {
        range: {
          sheetId: sheetId,
          dimension: 'ROWS',
          startIndex: rowNum - 1, // 0-based inclusive
          endIndex: rowNum,       // 0-based exclusive
        },
      },
    }));

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests,
      },
    });

    res.json({
      success: true,
      message: 'Exam Schedule Entry Deleted Successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error deleting exam entry:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to delete exam entry. Please try again.' });
  }
});


// ---------------- MARKS ENDPOINTS ----------------

// Read the marks sheet name from .env (same key the frontend uses)
const MARKS_SHEET_NAME = process.env.VITE_GOOGLE_SHEETS_SHEET_MARKS || 'marks';
console.log('Marks sheet name:', MARKS_SHEET_NAME);

// Helper to map marks request body to sheet columns
const mapMarksBodyToRow = (body) => {
  return [
    '', // Column A (empty)
    formatDateToDDMMYYYY(body.date || ''),
    String(body.subject || '').trim(),
    String(body.examType || '').trim(),
    String(body.studentId || '').trim(),
    String(body.name || '').toUpperCase().trim(),
    String(body.totalMarks || '').trim(),
    String(body.obtainMarks || '').trim(),
  ];
};

// 1. CREATE Marks Records
app.post('/api/marks', async (req, res) => {
  console.log('POST /api/marks - Request Body:', req.body);
  const data = req.body;

  try {
    const sheets = getSheetsClient();
    const sheetName = MARKS_SHEET_NAME;

    let newRows = [];
    if (Array.isArray(data)) {
      newRows = data.map(mapMarksBodyToRow);
    } else if (data.entries && Array.isArray(data.entries)) {
      newRows = data.entries.map(mapMarksBodyToRow);
    } else {
      newRows = [mapMarksBodyToRow(data)];
    }

    const currentData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!B:B`,
    });
    const currentRows = currentData.data.values || [];
    const nextRowNumber = currentRows.length + 1;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!B${nextRowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: newRows.map(r => r.slice(1)), // Exclude empty Column A to append after last populated row in Column B (Date)
      },
    });

    res.status(201).json({
      success: true,
      message: 'Marks Added Successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error adding marks:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to save changes. Please try again.' });
  }
});

// 2. UPDATE Marks Record
app.put('/api/marks/:rowId', async (req, res) => {
  const { rowId } = req.params;
  console.log(`PUT /api/marks/${rowId} - Request Body:`, req.body);
  const entry = req.body;

  try {
    const sheets = getSheetsClient();
    const sheetName = MARKS_SHEET_NAME;

    const rowNumber = parseInt(rowId); // id IS the 1-based spreadsheet row number
    if (isNaN(rowNumber) || rowNumber < 1) {
      return res.status(400).json({ success: false, message: 'Invalid row ID.' });
    }

    const updatedRow = mapMarksBodyToRow(entry);

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${rowNumber}:H${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [updatedRow],
      },
    });

    res.json({
      success: true,
      message: 'Marks Updated Successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating marks:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to update marks.' });
  }
});

// 3. DELETE Marks Record(s) (supports comma-separated list of row IDs)
app.delete('/api/marks/:rowId', async (req, res) => {
  const { rowId } = req.params;
  console.log(`DELETE /api/marks/${rowId}`);

  try {
    const sheets = getSheetsClient();
    const sheetName = MARKS_SHEET_NAME;

    // Parse list of row IDs to delete, convert to 1-based spreadsheet row numbers
    const rowNumbersToDelete = rowId.split(',')
      .map(id => parseInt(id.trim()))
      .filter(num => !isNaN(num) && num >= 1);

    if (rowNumbersToDelete.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid row ID(s).' });
    }

    // Get Sheet numeric ID dynamically to perform deleteDimension batchUpdate
    const spreadsheetMeta = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    const sheet = spreadsheetMeta.data.sheets.find(s => s.properties.title === sheetName);

    if (!sheet) {
      throw new Error(`Sheet ${sheetName} not found.`);
    }
    const sheetId = sheet.properties.sheetId;

    // Sort indices in descending order before deleting dimension
    rowNumbersToDelete.sort((a, b) => b - a);

    const requests = rowNumbersToDelete.map(rowNum => ({
      deleteDimension: {
        range: {
          sheetId: sheetId,
          dimension: 'ROWS',
          startIndex: rowNum - 1, // 0-based inclusive
          endIndex: rowNum,       // 0-based exclusive
        },
      },
    }));

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests,
      },
    });

    res.json({
      success: true,
      message: 'Marks Deleted Successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error deleting marks:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to delete marks. Please try again.' });
  }
});

// ---------------- ACTIVE SESSION ENDPOINTS ----------------

const ACTIVE_SESSION_SHEET_NAME = process.env.VITE_GOOGLE_SHEETS_SHEET_ACTIVE_SESSION || 'act_session';
console.log('Active Session sheet name:', ACTIVE_SESSION_SHEET_NAME);

// Helper to map active session request body to sheet columns (Column B, C, D)
const mapActiveSessionBodyToRow = (body) => {
  return [
    String(body.phone || '').trim(),
    String(body.activeRole || body.Active_role || body.active_role || '').trim(),
    String(body.activeStudentId || body.Active_student_id || body.active_student_id || '').trim(),
  ];
};

// 1. CREATE Active Session Record
app.post('/api/activeSession', async (req, res) => {
  console.log('POST /api/activeSession - Request Body:', req.body);
  const data = req.body;

  try {
    const sheets = getSheetsClient();
    const sheetName = ACTIVE_SESSION_SHEET_NAME;

    let newRows = [];
    if (Array.isArray(data)) {
      newRows = data.map(mapActiveSessionBodyToRow);
    } else {
      newRows = [mapActiveSessionBodyToRow(data)];
    }

    const currentData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!B:B`,
    });
    const currentRows = currentData.data.values || [];
    const nextRowNumber = currentRows.length + 1;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!B${nextRowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: newRows,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Active Session Added Successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error adding active session:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to save changes. Please try again.' });
  }
});

// 2. UPDATE Active Session Record
app.put('/api/activeSession/:rowId', async (req, res) => {
  const { rowId } = req.params;
  console.log(`PUT /api/activeSession/${rowId} - Request Body:`, req.body);
  const entry = req.body;

  try {
    const sheets = getSheetsClient();
    const sheetName = ACTIVE_SESSION_SHEET_NAME;

    const rowNumber = parseInt(rowId); // id IS the 1-based spreadsheet row number
    if (isNaN(rowNumber) || rowNumber < 1) {
      return res.status(400).json({ success: false, message: 'Invalid row ID.' });
    }

    const updatedRow = mapActiveSessionBodyToRow(entry);

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!B${rowNumber}:D${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [updatedRow],
      },
    });

    res.json({
      success: true,
      message: 'Active Session Updated Successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating active session:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to update active session.' });
  }
});

// 3. DELETE Active Session Record(s) (supports comma-separated list of row IDs)
app.delete('/api/activeSession/:rowId', async (req, res) => {
  const { rowId } = req.params;
  console.log(`DELETE /api/activeSession/${rowId}`);

  try {
    const sheets = getSheetsClient();
    const sheetName = ACTIVE_SESSION_SHEET_NAME;

    // Parse list of row IDs to delete, convert to 1-based spreadsheet row numbers
    const rowNumbersToDelete = rowId.split(',')
      .map(id => parseInt(id.trim()))
      .filter(num => !isNaN(num) && num >= 1);

    if (rowNumbersToDelete.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid row ID(s).' });
    }

    // Get Sheet numeric ID dynamically to perform deleteDimension batchUpdate
    const spreadsheetMeta = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    const sheet = spreadsheetMeta.data.sheets.find(s => s.properties.title === sheetName);

    if (!sheet) {
      throw new Error(`Sheet ${sheetName} not found.`);
    }
    const sheetId = sheet.properties.sheetId;

    // Sort indices in descending order before deleting dimension
    rowNumbersToDelete.sort((a, b) => b - a);

    const requests = rowNumbersToDelete.map(rowNum => ({
      deleteDimension: {
        range: {
          sheetId: sheetId,
          dimension: 'ROWS',
          startIndex: rowNum - 1, // 0-based inclusive
          endIndex: rowNum,       // 0-based exclusive
        },
      },
    }));

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests,
      },
    });

    res.json({
      success: true,
      message: 'Active Session Deleted Successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error deleting active session:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to delete active session. Please try again.' });
  }
});
// ---------------- TASK MANAGEMENT ENDPOINTS ----------------

const TASK_SHEET_NAME = process.env.VITE_GOOGLE_SHEETS_TASK_SHEET || 'task_management';
const TEACHER_SHEET_NAME = process.env.VITE_GOOGLE_SHEETS_SHEET_TEACHERS || 'teacher_info';
const RECEPTION_SHEET_NAME = process.env.VITE_GOOGLE_SHEETS_SHEET_RECEPTION || 'Reception';
console.log('Task sheet name:', TASK_SHEET_NAME);

/** Map task body to a row array using sheet headers (fallback: [task, assignee_id, due_date, due_time, priority, status]) */
const mapTaskBodyToRow = (body, headers = []) => {
  if (!headers.length) {
    return [
      String(body.name || body.task || '').trim(),
      String(body.assigneeId || body.assign || '').trim(),
      String(body.dueDate || body.due || '').trim(),
      String(body.dueTime || '').trim(),
      String(body.priority || 'Normal').trim(),
      String(body.status || 'Pending').trim(),
    ];
  }

  return headers.map((header) => {
    const h = String(header || '').toLowerCase().trim();
    if (h.includes('task') && !h.includes('assign')) return String(body.name ?? body.task ?? '').trim();
    if (h.includes('assign')) return String(body.assigneeId ?? body.assign ?? '').trim();
    if (h.includes('due') && h.includes('time')) return String(body.dueTime ?? '').trim();
    if (h.includes('due')) return String(body.dueDate ?? body.due ?? '').trim();
    if (h.includes('priority')) return String(body.priority || 'Normal').trim();
    if (h.includes('status')) return String(body.status || 'Pending').trim();
    return String(body[header] ?? '').trim();
  });
};

// GET teachers list for assignee dropdown
app.get('/api/teachers-list', async (req, res) => {
  try {
    const sheets = getSheetsClient();
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TEACHER_SHEET_NAME}!A1:Z500`,
    });
    const rows = result.data.values || [];
    if (rows.length < 2) return res.json({ success: true, teachers: [] });

    const headers = (rows[0] || []).map(h => String(h || '').toLowerCase().trim());
    // idIdx: prefer exact "id" column or "teacher_id" — avoid matching "name" columns
    const idIdx = headers.findIndex(h => h === 'id' || h === 'teacher_id' || (h.includes('id') && !h.includes('name')));
    // nameIdx: look for 'name' keyword only — never 'teacher' which also appears in the ID column
    const nameIdx = headers.findIndex(h => h.includes('name'));

    const teachers = rows.slice(1).filter(r => r.length).map(row => ({
      id: idIdx >= 0 ? String(row[idIdx] || '').trim() : '',
      name: nameIdx >= 0 ? String(row[nameIdx] || '').trim() : '',
    })).filter(t => t.id);

    res.json({ success: true, teachers });
  } catch (error) {
    console.error('Error fetching teachers list:', error);
    res.status(500).json({ success: false, teachers: [], message: error.message });
  }
});

// GET reception list for assignee dropdown
app.get('/api/reception-list', async (req, res) => {
  try {
    const sheets = getSheetsClient();
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${RECEPTION_SHEET_NAME}!A1:Z500`,
    });
    const rows = result.data.values || [];
    if (rows.length < 2) return res.json({ success: true, receptionists: [] });

    const headers = (rows[0] || []).map(h => String(h || '').toLowerCase().trim());
    const idIdx = headers.findIndex(h => h === 'id' || h === 'reception_id' || (h.includes('id') && !h.includes('name')));
    const nameIdx = headers.findIndex(h => h.includes('name'));
    const phoneIdx = headers.findIndex(h => h === 'number' || h.includes('phone'));

    const receptionists = rows.slice(1).filter(r => r.length).map(row => {
      const id = idIdx >= 0 ? String(row[idIdx] || '').trim() : '';
      let name = nameIdx >= 0 ? String(row[nameIdx] || '').trim() : '';
      
      // Fallback: check if column A has content even if A1 header is empty
      if (!name && row[0] && headers[0] === '') {
        name = String(row[0] || '').trim();
      }
      
      const phone = phoneIdx >= 0 ? String(row[phoneIdx] || '').trim() : '';
      return {
        id: id || phone,
        name: name || `Receptionist ${id || phone || ''}`.trim(),
      };
    }).filter(r => r.id);

    res.json({ success: true, receptionists });
  } catch (error) {
    console.error('Error fetching reception list:', error);
    res.status(500).json({ success: false, receptionists: [], message: error.message });
  }
});

// 1. CREATE Task
app.post('/api/tasks', async (req, res) => {
  try {
    const sheets = getSheetsClient();
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TASK_SHEET_NAME}!A1:Z1`,
    });
    const headers = headerRes.data.values?.[0] || [];
    const newRows = Array.isArray(req.body)
      ? req.body.map((item) => mapTaskBodyToRow(item, headers))
      : [mapTaskBodyToRow(req.body, headers)];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TASK_SHEET_NAME}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: newRows },
    });
    res.status(201).json({ success: true, message: 'Task Added Successfully', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to add task.' });
  }
});

// 2. UPDATE Task
app.put('/api/tasks/:rowId', async (req, res) => {
  const { rowId } = req.params;
  try {
    const sheets = getSheetsClient();
    const rowNumber = parseInt(rowId);
    if (isNaN(rowNumber) || rowNumber < 1) {
      return res.status(400).json({ success: false, message: 'Invalid row ID.' });
    }
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TASK_SHEET_NAME}!A1:Z1`,
    });
    const headers = headerRes.data.values?.[0] || [];
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TASK_SHEET_NAME}!A${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [mapTaskBodyToRow(req.body, headers)] },
    });
    res.json({ success: true, message: 'Task Updated Successfully', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to update task.' });
  }
});

// 3. DELETE Task(s)
app.delete('/api/tasks/:rowId', async (req, res) => {
  const { rowId } = req.params;
  try {
    const sheets = getSheetsClient();
    const rowNumbersToDelete = rowId.split(',')
      .map(id => parseInt(id.trim()))
      .filter(num => !isNaN(num) && num >= 1);

    if (rowNumbersToDelete.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid row ID(s).' });
    }

    const spreadsheetMeta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = spreadsheetMeta.data.sheets.find(s => s.properties.title === TASK_SHEET_NAME);
    if (!sheet) throw new Error(`Sheet ${TASK_SHEET_NAME} not found.`);
    const sheetId = sheet.properties.sheetId;

    rowNumbersToDelete.sort((a, b) => b - a);
    const requests = rowNumbersToDelete.map(rowNum => ({
      deleteDimension: {
        range: { sheetId, dimension: 'ROWS', startIndex: rowNum - 1, endIndex: rowNum },
      },
    }));

    await sheets.spreadsheets.batchUpdate({ spreadsheetId: SPREADSHEET_ID, requestBody: { requests } });
    res.json({ success: true, message: 'Task Deleted Successfully', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to delete task.' });
  }
});

// ---------------- FEES ENDPOINTS ----------------

const FEES_SHEET_NAME = process.env.VITE_GOOGLE_SHEETS_SHEET_FEES || 'fees_info';
console.log('Fees sheet name:', FEES_SHEET_NAME);

// Helper: Map fees request body dynamically to spreadsheet headers
const INACTIVE_FEE_TX_REGEX = /\b(failed|fail|cancelled|canceled|cancel|pending|bounced|rejected|reversed)\b/i;
const recentFeeSubmissions = new Map();

const MAX_FEE_INSTALLMENTS = 10;

const sanitizeFeePayload = (body) => {
  const installments = Array.from({ length: MAX_FEE_INSTALLMENTS }, (_, idx) => {
    const num = idx + 1;
    return {
      num,
      amtKey: `amount${num}`,
      detailsKey: `details${num}`,
      altDetailsKey: `detials${num}`,
      refKey: `ref${num}`,
    };
  });

  const seenRefs = new Map();
  let installmentSum = 0;
  let hasInstallments = false;

  for (const inst of installments) {
    const rawAmt = String(body[inst.amtKey] ?? '').trim();
    if (rawAmt !== '') {
      const amt = Number(rawAmt);
      if (!Number.isFinite(amt) || amt < 0) {
        return { error: `Installment ${inst.num} amount must be a valid non-negative number.` };
      }
      if (amt > 0) {
        hasInstallments = true;
        const details = String(body[inst.detailsKey] ?? body[inst.altDetailsKey] ?? '').trim();
        const ref = String(body[inst.refKey] ?? '').trim();
        const isInactive = INACTIVE_FEE_TX_REGEX.test(`${details} ${ref}`);
        if (!isInactive) {
          installmentSum += amt;
        }
      }
    }
    const ref = String(body[inst.refKey] ?? '').trim();
    if (ref) {
      const normRef = ref.toLowerCase();
      if (seenRefs.has(normRef)) {
        return { error: `Duplicate Reference No. "${ref}" across installments.` };
      }
      seenRefs.set(normRef, inst.num);
    }
  }

  const grossStr = String(body.totalGrossFee ?? body['TOTAL GROSS FEE'] ?? '').trim();
  const discStr = String(body.discount ?? body.DISCOUNT ?? '').trim();
  const gross = grossStr !== '' ? Number(grossStr) : 0;
  const disc = discStr !== '' ? Number(discStr) : 0;
  if (grossStr !== '' && (!Number.isFinite(gross) || gross < 0)) {
    return { error: 'Total Gross Fee must be a valid non-negative number.' };
  }
  if (discStr !== '' && (!Number.isFinite(disc) || disc < 0)) {
    return { error: 'Discount must be a valid non-negative number.' };
  }
  if (grossStr !== '' && discStr !== '' && disc > gross) {
    return { error: 'Discount cannot exceed Total Gross Fee.' };
  }

  const hasNetSource = grossStr !== '' || discStr !== '';
  const totalNetFee = hasNetSource
    ? Math.max(0, gross - disc)
    : (Number(body.totalNetFee ?? body['TOTAL NET FEE'] ?? 0) || 0);

  const manualPaidStr = String(body.paidFee ?? body['PAID FEE'] ?? '').trim();
  const paidFee = hasInstallments
    ? installmentSum
    : (manualPaidStr !== '' ? Number(manualPaidStr) : 0);

  if (!Number.isFinite(paidFee) || paidFee < 0) {
    return { error: 'Paid Fee must be a valid non-negative number.' };
  }
  if (paidFee > totalNetFee && (totalNetFee > 0 || grossStr !== '' || paidFee > 0)) {
    return { error: `Paid Fee (${paidFee}) cannot exceed Total Net Fee (${totalNetFee}).` };
  }

  const pendingFee = Math.max(0, totalNetFee - paidFee);
  return {
    normalizedBody: {
      ...body,
      totalNetFee: hasNetSource || String(body.totalNetFee ?? '').trim() !== '' ? String(totalNetFee) : '',
      paidFee: String(paidFee),
      pendingFee: String(pendingFee),
    },
  };
};

const isDuplicateFeeSubmission = (key, payload) => {
  const now = Date.now();
  const signature = JSON.stringify(payload);
  const prev = recentFeeSubmissions.get(key);
  for (const [k, v] of recentFeeSubmissions.entries()) {
    if (now - v.ts > 5000) recentFeeSubmissions.delete(k);
  }
  if (prev && prev.signature === signature && now - prev.ts < 5000) {
    return true;
  }
  recentFeeSubmissions.set(key, { signature, ts: now });
  return false;
};

const mapFeesBodyToRowWithHeaders = (body, headers, existingRow = null) => {
  return headers.map((header, idx) => {
    const key = header.toLowerCase().replace(/[\s_-]+/g, '');
    const existingVal = existingRow ? String(existingRow[idx] ?? '').trim() : '';
    if (!key) return existingRow ? existingVal : ''; // Preserve empty/unlabeled columns like col H

    if (key === 'studentid' || key === 'student_id') return String(body.studentId ?? body.Student_ID ?? '').trim();
    if (key === 'name') return String(body.name ?? body.Name ?? '').trim();
    if (key === 'totalgrossfee') return String(body.totalGrossFee ?? body['TOTAL GROSS FEE'] ?? '').trim();
    if (key === 'discount') return String(body.discount ?? '').trim();
    if (key === 'totalnetfee') return String(body.totalNetFee ?? body['TOTAL NET FEE'] ?? '').trim();
    if (key === 'paidfee') return String(body.paidFee ?? body['PAID FEE'] ?? '').trim();
    if (key === 'pendingfee') return String(body.pendingFee ?? body['PENDING FEE'] ?? '').trim();

    // Installments 1..10
    if (key === 'date') return String(body.date ?? body.Date ?? '').trim();
    const dateMatch = key.match(/^date(\d+)$/);
    if (dateMatch) return String(body[`date${dateMatch[1]}`] ?? '').trim();

    const detailsMatch = key.match(/^(?:detials|details)(\d+)$/);
    if (detailsMatch) {
      const n = detailsMatch[1];
      return String(body[`details${n}`] ?? body[`detials${n}`] ?? '').trim();
    }

    const refMatch = key.match(/^ref(\d+)$/);
    if (refMatch) return String(body[`ref${refMatch[1]}`] ?? '').trim();

    const amtMatch = key.match(/^amount(\d+)$/);
    if (amtMatch) return String(body[`amount${amtMatch[1]}`] ?? '').trim();

    if (existingRow && body[header] === undefined) return existingVal;
    return String(body[header] ?? '').trim();
  });
};

// 1. CREATE Fees Record
app.post('/api/fees', async (req, res) => {
  console.log('POST /api/fees - Body:', req.body);
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    const sanitizedItems = [];
    for (const item of items) {
      const { error, normalizedBody } = sanitizeFeePayload(item || {});
      if (error) return res.status(400).json({ success: false, message: error });
      sanitizedItems.push(normalizedBody);
    }

    if (isDuplicateFeeSubmission('POST', sanitizedItems)) {
      return res.status(409).json({ success: false, message: 'Duplicate fee submission detected. Please wait a moment.' });
    }

    const sheets = getSheetsClient();

    // Fetch headers first
    const headerData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${FEES_SHEET_NAME}!A1:AZ1`,
    });
    const headers = headerData.data.values[0] || [];

    const newRows = sanitizedItems.map(item => mapFeesBodyToRowWithHeaders(item, headers));

    // Append after last populated row in column A (Student_ID)
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${FEES_SHEET_NAME}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: newRows },
    });

    res.status(201).json({ success: true, message: 'Fee Record Added Successfully', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error adding fee record:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to save fee record.' });
  }
});

// 2. UPDATE Fees Record
app.put('/api/fees/:rowId', async (req, res) => {
  const { rowId } = req.params;
  console.log(`PUT /api/fees/${rowId} - Body:`, req.body);
  try {
    const rowNumber = parseInt(rowId); // id IS the 1-based spreadsheet row number
    if (isNaN(rowNumber) || rowNumber < 2) {
      return res.status(400).json({ success: false, message: 'Invalid row ID.' });
    }

    const { error, normalizedBody } = sanitizeFeePayload(req.body || {});
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    if (isDuplicateFeeSubmission(`PUT:${rowNumber}`, normalizedBody)) {
      return res.status(409).json({ success: false, message: 'Duplicate fee update detected. Please wait a moment.' });
    }

    const sheets = getSheetsClient();

    // Fetch headers and existing row so unlabeled/unmodified columns are preserved
    const [headerData, existingRowRes] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${FEES_SHEET_NAME}!A1:AZ1`,
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${FEES_SHEET_NAME}!A${rowNumber}:AZ${rowNumber}`,
      }),
    ]);
    const headers = headerData.data.values?.[0] || [];
    const existingRow = existingRowRes.data.values?.[0] || [];

    const updatedRow = mapFeesBodyToRowWithHeaders(normalizedBody, headers, existingRow);

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${FEES_SHEET_NAME}!A${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [updatedRow] },
    });

    res.json({ success: true, message: 'Fee Record Updated Successfully', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error updating fee record:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to update fee record.' });
  }
});

// 3. DELETE Fees Record(s)
app.delete('/api/fees/:rowId', async (req, res) => {
  const { rowId } = req.params;
  console.log(`DELETE /api/fees/${rowId}`);
  try {
    const sheets = getSheetsClient();

    const rowNumbersToDelete = rowId.split(',')
      .map(id => parseInt(id.trim()))
      .filter(num => !isNaN(num) && num >= 1); // > 1 to protect header row

    if (rowNumbersToDelete.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid row ID(s).' });
    }

    const spreadsheetMeta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = spreadsheetMeta.data.sheets.find(s => s.properties.title === FEES_SHEET_NAME);
    if (!sheet) throw new Error(`Sheet ${FEES_SHEET_NAME} not found.`);
    const sheetId = sheet.properties.sheetId;

    // Delete in descending order so row indices don't shift
    rowNumbersToDelete.sort((a, b) => b - a);

    const requests = rowNumbersToDelete.map(rowNum => ({
      deleteDimension: {
        range: {
          sheetId,
          dimension: 'ROWS',
          startIndex: rowNum - 1, // 0-based inclusive
          endIndex: rowNum,       // 0-based exclusive
        },
      },
    }));

    await sheets.spreadsheets.batchUpdate({ spreadsheetId: SPREADSHEET_ID, requestBody: { requests } });

    res.json({ success: true, message: 'Fee Record Deleted Successfully', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error deleting fee record:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to delete fee record.' });
  }
});

// ================= TEACHERS CRUD ENDPOINTS =================

// Helper to map teacher body to row
const mapTeacherBodyToRow = (body) => [
  String(body.teacherId || '').trim(),
  String(body.name || body.teacherName || '').trim(),
  String(body.subject || '').trim(),
  String(body.phone || body.phoneNumber || '').trim(),
  String(body.email || '').trim(),
  String(body.joiningDate || '').trim(),
];

// 1. CREATE Teacher Record
app.post('/api/teachers', async (req, res) => {
  console.log('POST /api/teachers - Body:', req.body);
  try {
    const sheets = getSheetsClient();
    const sheetName = TEACHER_SHEET_NAME;

    // Get current rows
    const currentData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`,
    });
    const currentRows = currentData.data.values || [];

    let teacherId = req.body.teacherId ? String(req.body.teacherId).trim() : '';
    if (!teacherId) {
      // Find max numeric part from existing IDs (e.g. FT1004 -> 1004)
      let maxIdNum = 1000;
      if (currentRows.length > 1) {
        currentRows.slice(1).forEach(row => {
          const idStr = String(row[0] || '').trim();
          const numPart = parseInt(idStr.replace(/^FT/i, ''));
          if (!isNaN(numPart) && numPart > maxIdNum) {
            maxIdNum = numPart;
          }
        });
      }
      teacherId = `FT${maxIdNum + 1}`;
    }

    const body = { ...req.body, teacherId };
    const newRow = mapTeacherBodyToRow(body);
    const nextRowNumber = currentRows.length + 1;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${nextRowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow],
      },
    });

    res.status(201).json({ success: true, message: 'Teacher Record Added Successfully', teacherId, id: nextRowNumber });
  } catch (error) {
    console.error('Error adding teacher record:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to save teacher record.' });
  }
});

// 2. UPDATE Teacher Record
app.put('/api/teachers/:rowId', async (req, res) => {
  const { rowId } = req.params;
  console.log(`PUT /api/teachers/${rowId} - Body:`, req.body);
  try {
    const sheets = getSheetsClient();
    const sheetName = TEACHER_SHEET_NAME;
    const rowNumber = parseInt(rowId);

    if (isNaN(rowNumber) || rowNumber < 1) {
      return res.status(400).json({ success: false, message: 'Invalid row ID.' });
    }

    const updatedRow = mapTeacherBodyToRow(req.body);

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [updatedRow],
      },
    });

    res.json({ success: true, message: 'Teacher Record Updated Successfully' });
  } catch (error) {
    console.error('Error updating teacher record:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to update teacher record.' });
  }
});

// 3. DELETE Teacher Record(s)
app.delete('/api/teachers/:rowId', async (req, res) => {
  const { rowId } = req.params;
  console.log(`DELETE /api/teachers/${rowId}`);
  try {
    const sheets = getSheetsClient();
    const sheetName = TEACHER_SHEET_NAME;

    const rowNumbersToDelete = rowId.split(',')
      .map(id => parseInt(id.trim()))
      .filter(num => !isNaN(num) && num >= 2); // protect header row

    if (rowNumbersToDelete.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid row ID(s).' });
    }

    const spreadsheetMeta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = spreadsheetMeta.data.sheets.find(s => s.properties.title === sheetName);
    if (!sheet) throw new Error(`Sheet ${sheetName} not found.`);
    const sheetId = sheet.properties.sheetId;

    rowNumbersToDelete.sort((a, b) => b - a);

    const requests = rowNumbersToDelete.map(rowNum => ({
      deleteDimension: {
        range: {
          sheetId,
          dimension: 'ROWS',
          startIndex: rowNum - 1,
          endIndex: rowNum,
        },
      },
    }));

    await sheets.spreadsheets.batchUpdate({ spreadsheetId: SPREADSHEET_ID, requestBody: { requests } });

    res.json({ success: true, message: 'Teacher Record Deleted Successfully' });
  } catch (error) {
    console.error('Error deleting teacher record:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to delete teacher record.' });
  }
});

// ================= NEW STUDENT INQUIRY CRUD ENDPOINTS =================

const INQUIRY_SHEET_NAME = process.env.VITE_GOOGLE_SHEETS_SHEET_NEW_STUDENT_INQUIRY || 'new inquiry';

// Helper to map inquiry body to row
const mapInquiryBodyToRow = (body) => [
  String(body.name || body.studentName || '').trim(),
  String(body.board || '').trim(),
  String(body.medium || '').trim(),
  String(body.standard || '').trim(),
  String(body.group || '').trim(),
  String(body.phone || body.phoneNumber || '').trim(),
];

// 1. CREATE Inquiry Record
app.post('/api/inquiry', async (req, res) => {
  console.log('POST /api/inquiry - Body:', req.body);
  try {
    const sheets = getSheetsClient();
    const sheetName = INQUIRY_SHEET_NAME;

    const currentData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`,
    });
    const currentRows = currentData.data.values || [];
    const nextRowNumber = currentRows.length + 1;

    const newRow = mapInquiryBodyToRow(req.body);

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${nextRowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow],
      },
    });

    res.status(201).json({ success: true, message: 'Inquiry Record Added Successfully', id: nextRowNumber });
  } catch (error) {
    console.error('Error adding inquiry record:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to save inquiry record.' });
  }
});

// 2. UPDATE Inquiry Record
app.put('/api/inquiry/:rowId', async (req, res) => {
  const { rowId } = req.params;
  console.log(`PUT /api/inquiry/${rowId} - Body:`, req.body);
  try {
    const sheets = getSheetsClient();
    const sheetName = INQUIRY_SHEET_NAME;
    const rowNumber = parseInt(rowId);

    if (isNaN(rowNumber) || rowNumber < 1) {
      return res.status(400).json({ success: false, message: 'Invalid row ID.' });
    }

    const updatedRow = mapInquiryBodyToRow(req.body);

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [updatedRow],
      },
    });

    res.json({ success: true, message: 'Inquiry Record Updated Successfully' });
  } catch (error) {
    console.error('Error updating inquiry record:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to update inquiry record.' });
  }
});

// 3. DELETE Inquiry Record(s)
app.delete('/api/inquiry/:rowId', async (req, res) => {
  const { rowId } = req.params;
  console.log(`DELETE /api/inquiry/${rowId}`);
  try {
    const sheets = getSheetsClient();
    const sheetName = INQUIRY_SHEET_NAME;

    const rowNumbersToDelete = rowId.split(',')
      .map(id => parseInt(id.trim()))
      .filter(num => !isNaN(num) && num >= 2); // protect header row

    if (rowNumbersToDelete.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid row ID(s).' });
    }

    const spreadsheetMeta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = spreadsheetMeta.data.sheets.find(s => s.properties.title === sheetName);
    if (!sheet) throw new Error(`Sheet ${sheetName} not found.`);
    const sheetId = sheet.properties.sheetId;

    rowNumbersToDelete.sort((a, b) => b - a);

    const requests = rowNumbersToDelete.map(rowNum => ({
      deleteDimension: {
        range: {
          sheetId,
          dimension: 'ROWS',
          startIndex: rowNum - 1,
          endIndex: rowNum,
        },
      },
    }));

    await sheets.spreadsheets.batchUpdate({ spreadsheetId: SPREADSHEET_ID, requestBody: { requests } });

    res.json({ success: true, message: 'Inquiry Record Deleted Successfully' });
  } catch (error) {
    console.error('Error deleting inquiry record:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to delete inquiry record.' });
  }
});

// ================= RECEPTION CRUD ENDPOINTS =================

// Helper to map reception body to row: A=empty, B=Number, C=Name, D=ID
const mapReceptionBodyToRow = (body) => [
  '',
  String(body.number || body.Number || '').trim(),
  String(body.name || body.Name || '').trim(),
  String(body.receptionId || body.id || body.ID || '').trim(),
];

// 1. CREATE Reception Record
app.post('/api/reception', async (req, res) => {
  console.log('POST /api/reception - Body:', req.body);
  try {
    const sheets = getSheetsClient();
    const sheetName = RECEPTION_SHEET_NAME;

    // Get current rows to check existing IDs
    const currentData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`,
    });
    const currentRows = currentData.data.values || [];

    let receptionId = req.body.receptionId || req.body.id || req.body.ID ? String(req.body.receptionId || req.body.id || req.body.ID).trim() : '';
    if (!receptionId) {
      // Find max numeric part from existing IDs (e.g. FR2001 -> 2001)
      let maxIdNum = 2000;
      if (currentRows.length > 1) {
        currentRows.slice(1).forEach(row => {
          const idStr = String(row[3] || '').trim(); // Column D is index 3
          const numPart = parseInt(idStr.replace(/^FR/i, ''));
          if (!isNaN(numPart) && numPart > maxIdNum) {
            maxIdNum = numPart;
          }
        });
      }
      receptionId = `FR${maxIdNum + 1}`;
    }

    const body = { ...req.body, receptionId };
    const newRow = mapReceptionBodyToRow(body);
    const nextRowNumber = currentRows.length + 1;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${nextRowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow],
      },
    });

    res.status(201).json({ success: true, message: 'Reception Record Added Successfully', receptionId, id: nextRowNumber });
  } catch (error) {
    console.error('Error adding reception record:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to save reception record.' });
  }
});

// 2. UPDATE Reception Record
app.put('/api/reception/:rowId', async (req, res) => {
  const { rowId } = req.params;
  console.log(`PUT /api/reception/${rowId} - Body:`, req.body);
  try {
    const sheets = getSheetsClient();
    const sheetName = RECEPTION_SHEET_NAME;
    const rowNumber = parseInt(rowId);

    if (isNaN(rowNumber) || rowNumber < 1) {
      return res.status(400).json({ success: false, message: 'Invalid row ID.' });
    }

    const updatedRow = mapReceptionBodyToRow(req.body);

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [updatedRow],
      },
    });

    res.json({ success: true, message: 'Reception Record Updated Successfully' });
  } catch (error) {
    console.error('Error updating reception record:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to update reception record.' });
  }
});

// 3. DELETE Reception Record(s)
app.delete('/api/reception/:rowId', async (req, res) => {
  const { rowId } = req.params;
  console.log(`DELETE /api/reception/${rowId}`);
  try {
    const sheets = getSheetsClient();
    const sheetName = RECEPTION_SHEET_NAME;

    const rowNumbersToDelete = rowId.split(',')
      .map(id => parseInt(id.trim()))
      .filter(num => !isNaN(num) && num >= 2); // protect header row

    if (rowNumbersToDelete.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid row ID(s).' });
    }

    const spreadsheetMeta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = spreadsheetMeta.data.sheets.find(s => s.properties.title === sheetName);
    if (!sheet) throw new Error(`Sheet ${sheetName} not found.`);
    const sheetId = sheet.properties.sheetId;

    rowNumbersToDelete.sort((a, b) => b - a);

    const requests = rowNumbersToDelete.map(rowNum => ({
      deleteDimension: {
        range: {
          sheetId,
          dimension: 'ROWS',
          startIndex: rowNum - 1,
          endIndex: rowNum,
        },
      },
    }));

    await sheets.spreadsheets.batchUpdate({ spreadsheetId: SPREADSHEET_ID, requestBody: { requests } });

    res.json({ success: true, message: 'Reception Record Deleted Successfully' });
  } catch (error) {
    console.error('Error deleting reception record:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to delete reception record.' });
  }
});


// Start Server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

