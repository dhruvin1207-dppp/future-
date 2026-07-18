import {
  setCors, getSheetsClient, SPREADSHEET_ID, mapActiveSessionBodyToRow, deleteSheetRows
} from './_lib/sheetsClient.js';

const SHEET_NAME = process.env.VITE_GOOGLE_SHEETS_SHEET_ACTIVE_SESSION || 'act_session';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const data = req.body;
    try {
      const sheets = getSheetsClient();
      const newRows = Array.isArray(data)
        ? data.map(mapActiveSessionBodyToRow)
        : [mapActiveSessionBodyToRow(data)];
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!B1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: newRows },
      });
      return res.status(201).json({ success: true, message: 'Active Session Added Successfully', timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Error adding active session:', error);
      return res.status(500).json({ success: false, message: error.message || 'Unable to save changes.' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
