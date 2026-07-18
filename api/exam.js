const {
  setCors, getSheetsClient, SPREADSHEET_ID, mapExamBodyToRow, deleteSheetRows
} = require('./_lib/sheetsClient');

const SHEET_NAME = 'exam_schedule';

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const entry = req.body;
    if (!entry.examDate || !entry.subject || !entry.className) {
      return res.status(400).json({ success: false, message: 'Exam Date, Subject, and Class are required.' });
    }
    try {
      const sheets = getSheetsClient();
      const newRow = mapExamBodyToRow(entry).slice(1);
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!B1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [newRow] },
      });
      return res.status(201).json({ success: true, message: 'Exam Schedule Entry Added Successfully', timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Error adding exam entry:', error);
      return res.status(500).json({ success: false, message: error.message || 'Unable to save changes.' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
};
