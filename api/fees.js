import {
  setCors, getSheetsClient, SPREADSHEET_ID, mapFeesBodyToRow, deleteSheetRows
} from './_lib/sheetsClient.js';

const FEES_SHEET_NAME = process.env.VITE_GOOGLE_SHEETS_SHEET_FEES || 'fees_info';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    try {
      const sheets = getSheetsClient();
      const newRows = Array.isArray(req.body)
        ? req.body.map(mapFeesBodyToRow)
        : [mapFeesBodyToRow(req.body)];
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${FEES_SHEET_NAME}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: newRows },
      });
      return res.status(201).json({ success: true, message: 'Fee Record Added Successfully', timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Error adding fee record:', error);
      return res.status(500).json({ success: false, message: error.message || 'Unable to save fee record.' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
