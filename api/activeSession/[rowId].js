import {
  setCors, getSheetsClient, SPREADSHEET_ID, mapActiveSessionBodyToRow, deleteSheetRows
} from '../_lib/sheetsClient.js';

const SHEET_NAME = process.env.VITE_GOOGLE_SHEETS_SHEET_ACTIVE_SESSION || 'act_session';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { rowId } = req.query;

  if (req.method === 'PUT') {
    const entry = req.body;
    const rowNumber = parseInt(rowId);
    if (isNaN(rowNumber) || rowNumber <= 1) {
      return res.status(400).json({ success: false, message: 'Invalid row ID (must be > 1 to avoid header row).' });
    }
    try {
      const sheets = getSheetsClient();
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!B${rowNumber}:D${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [mapActiveSessionBodyToRow(entry)] },
      });
      return res.json({ success: true, message: 'Active Session Updated Successfully', timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Error updating active session:', error);
      return res.status(500).json({ success: false, message: error.message || 'Unable to update active session.' });
    }
  }

  if (req.method === 'DELETE') {
    const rowNumbers = rowId.split(',')
      .map(id => parseInt(id.trim()))
      .filter(num => !isNaN(num) && num > 1);
    if (rowNumbers.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid row ID(s).' });
    }
    try {
      const sheets = getSheetsClient();
      await deleteSheetRows(sheets, SHEET_NAME, rowNumbers);
      return res.json({ success: true, message: 'Active Session Deleted Successfully', timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Error deleting active session:', error);
      return res.status(500).json({ success: false, message: error.message || 'Unable to delete active session.' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
