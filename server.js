import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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
const mapBodyToRow = (body, headers, nextId = null) => {
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
      range: `${sheetName}!A1:AZ2000`,
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
      range: `${sheetName}!A1:AZ2000`,
    });

    const rows = currentData.data.values || [];
    const headers = await ensureAndGetHeaders(sheets, sheetName);
    
    const studentIdColIdx = headers.findIndex(h => String(h).toLowerCase().trim() === 'student_id');

    if (studentIdColIdx === -1) {
      throw new Error('Student ID column not found in sheet.');
    }

    // Locate Row (1-based sheet row number is rowIndex + 1)
    const rowIndex = rows.findIndex(r => String(r[studentIdColIdx]).trim().toLowerCase() === String(studentId).trim().toLowerCase());
    
    if (rowIndex === -1) {
      return res.status(404).json({ success: false, message: `Student ID "${studentId}" not found.` });
    }

    const rowNumber = rowIndex + 1;
    const existingRow = rows[rowIndex];
    const existingId = existingRow[0]; // Preserve internal sequence id

    const updatedRow = mapBodyToRow(student, headers, existingId);

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
      range: `${sheetName}!A1:AZ2000`,
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

    const rowNumber = parseInt(rowId) + 1;
    if (isNaN(rowNumber) || rowNumber <= 1) {
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
      .map(id => parseInt(id.trim()) + 1)
      .filter(num => !isNaN(num) && num > 1);

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

// ---------------- EXAM ENDPOINTS ----------------

// Helper to map exam request body to sheet columns
const mapExamBodyToRow = (body) => {
  return [
    '', // Column A (empty)
    String(body.examDate || '').trim(),
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

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!B1`, // Use B1 (date column) for table boundary check
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

    const rowNumber = parseInt(rowId) + 1;
    if (isNaN(rowNumber) || rowNumber <= 1) {
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
      .map(id => parseInt(id.trim()) + 1)
      .filter(num => !isNaN(num) && num > 1);

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
    String(body.date || '').trim(),
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

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: newRows,
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

    const rowNumber = parseInt(rowId) + 1; // 1-based spreadsheet row
    if (isNaN(rowNumber) || rowNumber <= 1) {
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
      .map(id => parseInt(id.trim()) + 1)
      .filter(num => !isNaN(num) && num > 1);

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

// Start Server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
