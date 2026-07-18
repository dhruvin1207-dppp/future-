const {
  setCors, getSheetsClient, SPREADSHEET_ID, mapTimetableBodyToRow, deleteSheetRows
} = require('./_lib/sheetsClient');

const SHEET_NAME = 'TimeTable';

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const entry = req.body;
    if (!entry.day || !entry.lecture || !entry.className) {
      return res.status(400).json({ success: false, message: 'Day, Lecture, and Class are required.' });
    }
    try {
      const sheets = getSheetsClient();
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [mapTimetableBodyToRow(entry)] },
      });
      return res.status(201).json({ success: true, message: 'Timetable Entry Added Successfully', timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Error adding timetable entry:', error);
      return res.status(500).json({ success: false, message: error.message || 'Unable to save changes.' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
};
