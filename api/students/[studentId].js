import {
  setCors, getSheetsClient, SPREADSHEET_ID,
  mapBodyToRow, ensureAndGetHeaders, deleteSheetRows
} from '../_lib/sheetsClient.js';

const SHEET_NAME = 'student_info';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { studentId } = req.query;

  if (req.method === 'PUT') {
    const student = req.body;
    try {
      const sheets = getSheetsClient();
      const currentData = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1:AZ2000`,
      });
      const rows = currentData.data.values || [];
      const headers = await ensureAndGetHeaders(sheets, SHEET_NAME);
      const studentIdColIdx = headers.findIndex(h => String(h).toLowerCase().trim() === 'student_id');

      if (studentIdColIdx === -1) throw new Error('Student ID column not found in sheet.');

      const rowIndex = rows.findIndex(r =>
        String(r[studentIdColIdx]).trim().toLowerCase() === String(studentId).trim().toLowerCase()
      );
      if (rowIndex === -1) {
        return res.status(404).json({ success: false, message: `Student ID "${studentId}" not found.` });
      }

      const rowNumber = rowIndex + 1;
      const existingId = rows[rowIndex][0];
      const updatedRow = mapBodyToRow(student, headers, existingId);

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A${rowNumber}:AZ${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [updatedRow] },
      });

      return res.json({
        success: true,
        message: 'Student Updated Successfully',
        updatedRecord: student,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating student:', error);
      return res.status(500).json({ success: false, message: error.message || 'Unable to save changes.' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const sheets = getSheetsClient();
      const studentIds = studentId.split(',').map(id => id.trim().toLowerCase());

      const currentData = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1:AZ2000`,
      });
      const rows = currentData.data.values || [];
      const headers = await ensureAndGetHeaders(sheets, SHEET_NAME);
      const studentIdColIdx = headers.findIndex(h => String(h).toLowerCase().trim() === 'student_id');

      if (studentIdColIdx === -1) throw new Error('Student ID column not found in sheet.');

      const rowNumbers = [];
      rows.forEach((row, idx) => {
        const val = String(row[studentIdColIdx] || '').trim().toLowerCase();
        if (studentIds.includes(val)) rowNumbers.push(idx + 1);
      });

      if (rowNumbers.length === 0) {
        return res.status(404).json({ success: false, message: 'None of the Student IDs were found.' });
      }

      await deleteSheetRows(sheets, SHEET_NAME, rowNumbers);

      return res.json({
        success: true,
        message: 'Student Deleted Successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error deleting student:', error);
      return res.status(500).json({ success: false, message: error.message || 'Unable to delete student.' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
