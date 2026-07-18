const {
  setCors, getSheetsClient, SPREADSHEET_ID, mapTimetableBodyToRow, deleteSheetRows
} = require('../_lib/sheetsClient');

const SHEET_NAME = 'TimeTable';

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { rowId } = req.query;

  if (req.method === 'PUT') {
    const entry = req.body;
    const rowNumber = parseInt(rowId) + 1;
    if (isNaN(rowNumber) || rowNumber <= 1) {
      return res.status(400).json({ success: false, message: 'Invalid row ID.' });
    }
    try {
      const sheets = getSheetsClient();
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A${rowNumber}:F${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [mapTimetableBodyToRow(entry)] },
      });
      return res.json({ success: true, message: 'Timetable Entry Updated Successfully', timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Error updating timetable:', error);
      return res.status(500).json({ success: false, message: error.message || 'Unable to save changes.' });
    }
  }

  if (req.method === 'DELETE') {
    const rowNumbers = rowId.split(',')
      .map(id => parseInt(id.trim()) + 1)
      .filter(num => !isNaN(num) && num > 1);
    if (rowNumbers.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid row ID(s).' });
    }
    try {
      const sheets = getSheetsClient();
      await deleteSheetRows(sheets, SHEET_NAME, rowNumbers);
      return res.json({ success: true, message: 'Timetable Entry Deleted Successfully', timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Error deleting timetable:', error);
      return res.status(500).json({ success: false, message: error.message || 'Unable to delete.' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
};
