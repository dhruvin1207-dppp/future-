const {
  setCors, getSheetsClient, SPREADSHEET_ID, mapMarksBodyToRow, deleteSheetRows
} = require('./_lib/sheetsClient');

const SHEET_NAME = process.env.VITE_GOOGLE_SHEETS_SHEET_MARKS || 'marks';

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const data = req.body;
    try {
      const sheets = getSheetsClient();
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
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: newRows },
      });
      return res.status(201).json({ success: true, message: 'Marks Added Successfully', timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Error adding marks:', error);
      return res.status(500).json({ success: false, message: error.message || 'Unable to save changes.' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
};
