import {
  setCors, getSheetsClient, SPREADSHEET_ID, mapFeesBodyToRow, deleteSheetRows
} from '../_lib/sheetsClient.js';

const FEES_SHEET_NAME = process.env.VITE_GOOGLE_SHEETS_SHEET_FEES || 'fees_info';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { rowId } = req.query;

  // PUT /api/fees/:rowId — Update
  if (req.method === 'PUT') {
    const rowNumber = parseInt(rowId);
    if (isNaN(rowNumber) || rowNumber <= 1) {
      return res.status(400).json({ success: false, message: 'Invalid row ID (must be > 1 to avoid header row).' });
    }
    try {
      const sheets = getSheetsClient();
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${FEES_SHEET_NAME}!A${rowNumber}:W${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [mapFeesBodyToRow(req.body)] },
      });
      return res.json({ success: true, message: 'Fee Record Updated Successfully', timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Error updating fee record:', error);
      return res.status(500).json({ success: false, message: error.message || 'Unable to update fee record.' });
    }
  }

  // DELETE /api/fees/:rowId — Delete (supports comma-separated IDs)
  if (req.method === 'DELETE') {
    const rowNumbers = rowId.split(',')
      .map(id => parseInt(id.trim()))
      .filter(num => !isNaN(num) && num > 1);
    if (rowNumbers.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid row ID(s).' });
    }
    try {
      const sheets = getSheetsClient();
      await deleteSheetRows(sheets, FEES_SHEET_NAME, rowNumbers);
      return res.json({ success: true, message: 'Fee Record Deleted Successfully', timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Error deleting fee record:', error);
      return res.status(500).json({ success: false, message: error.message || 'Unable to delete fee record.' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
