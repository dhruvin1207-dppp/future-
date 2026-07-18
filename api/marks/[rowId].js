import {
  setCors, getSheetsClient, SPREADSHEET_ID, mapMarksBodyToRow, deleteSheetRows
} from '../_lib/sheetsClient.js';

const SHEET_NAME = process.env.VITE_GOOGLE_SHEETS_SHEET_MARKS || 'marks';

export default async function handler(req, res) {
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
        range: `${SHEET_NAME}!A${rowNumber}:H${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [mapMarksBodyToRow(entry)] },
      });
      return res.json({ success: true, message: 'Marks Updated Successfully', timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Error updating marks:', error);
      return res.status(500).json({ success: false, message: error.message || 'Unable to update marks.' });
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
      return res.json({ success: true, message: 'Marks Deleted Successfully', timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Error deleting marks:', error);
      return res.status(500).json({ success: false, message: error.message || 'Unable to delete marks.' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
