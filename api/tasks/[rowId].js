const {
  setCors, getSheetsClient, SPREADSHEET_ID, mapTaskBodyToRow, deleteSheetRows
} = require('../_lib/sheetsClient');

const TASK_SHEET_NAME = process.env.VITE_GOOGLE_SHEETS_TASK_SHEET || 'task_management';

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { rowId } = req.query;

  if (req.method === 'PUT') {
    const rowNumber = parseInt(rowId);
    if (isNaN(rowNumber) || rowNumber <= 1) {
      return res.status(400).json({ success: false, message: 'Invalid row ID.' });
    }
    try {
      const sheets = getSheetsClient();
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${TASK_SHEET_NAME}!A${rowNumber}:E${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [mapTaskBodyToRow(req.body)] },
      });
      return res.json({ success: true, message: 'Task Updated Successfully', timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Error updating task:', error);
      return res.status(500).json({ success: false, message: error.message || 'Unable to update task.' });
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
      await deleteSheetRows(sheets, TASK_SHEET_NAME, rowNumbers);
      return res.json({ success: true, message: 'Task Deleted Successfully', timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Error deleting task:', error);
      return res.status(500).json({ success: false, message: error.message || 'Unable to delete task.' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
};
