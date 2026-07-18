const {
  setCors, getSheetsClient, SPREADSHEET_ID,
  mapBodyToRow, ensureAndGetHeaders, deleteSheetRows
} = require('./_lib/sheetsClient');

const SHEET_NAME = 'student_info';

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const student = req.body;
    if (!student.studentId || !student.studentName) {
      return res.status(400).json({ success: false, message: 'Student ID and Student Name are required.' });
    }
    try {
      const sheets = getSheetsClient();
      const currentData = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1:AZ2000`,
      });
      const rows = currentData.data.values || [];
      const headers = await ensureAndGetHeaders(sheets, SHEET_NAME);
      const idColIdx = headers.findIndex(h => String(h).toLowerCase().trim() === 'id');
      const studentIdColIdx = headers.findIndex(h => String(h).toLowerCase().trim() === 'student_id');

      if (studentIdColIdx !== -1) {
        const duplicate = rows.slice(1).find(r =>
          String(r[studentIdColIdx]).trim().toLowerCase() === String(student.studentId).trim().toLowerCase()
        );
        if (duplicate) {
          return res.status(400).json({ success: false, message: `Student ID "${student.studentId}" already exists.` });
        }
      }

      let maxId = 0;
      if (idColIdx !== -1) {
        rows.slice(1).forEach(r => {
          const idVal = parseInt(r[idColIdx]) || 0;
          if (idVal > maxId) maxId = idVal;
        });
      }
      const nextId = maxId + 1;
      const newRow = mapBodyToRow(student, headers, nextId);

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [newRow] },
      });

      return res.status(201).json({
        success: true,
        message: 'Student Added Successfully',
        updatedRecord: { ...student, id: nextId },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error adding student:', error);
      return res.status(500).json({ success: false, message: error.message || 'Unable to save changes.' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
};
