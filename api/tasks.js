const {
  setCors, getSheetsClient, SPREADSHEET_ID, mapTaskBodyToRow, deleteSheetRows
} = require('./_lib/sheetsClient');

const TASK_SHEET_NAME = process.env.VITE_GOOGLE_SHEETS_TASK_SHEET || 'task_management';

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    try {
      const sheets = getSheetsClient();
      const newRows = Array.isArray(req.body)
        ? req.body.map(mapTaskBodyToRow)
        : [mapTaskBodyToRow(req.body)];
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${TASK_SHEET_NAME}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: newRows },
      });
      return res.status(201).json({ success: true, message: 'Task Added Successfully', timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Error adding task:', error);
      return res.status(500).json({ success: false, message: error.message || 'Unable to add task.' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
};
