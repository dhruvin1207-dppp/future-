const {
  setCors, getSheetsClient, SPREADSHEET_ID
} = require('./_lib/sheetsClient');

const TEACHER_SHEET_NAME = process.env.VITE_GOOGLE_SHEETS_SHEET_TEACHERS || 'teacher_info';

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const sheets = getSheetsClient();
      const result = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${TEACHER_SHEET_NAME}!A1:Z500`,
      });
      const rows = result.data.values || [];
      if (rows.length < 2) return res.json({ success: true, teachers: [] });

      const headers = (rows[0] || []).map(h => String(h || '').toLowerCase().trim());
      const idIdx = headers.findIndex(h => h === 'id' || h === 'teacher_id' || (h.includes('id') && !h.includes('name')));
      const nameIdx = headers.findIndex(h => h.includes('name'));

      const teachers = rows.slice(1).filter(r => r.length).map(row => ({
        id: idIdx >= 0 ? String(row[idIdx] || '').trim() : '',
        name: nameIdx >= 0 ? String(row[nameIdx] || '').trim() : '',
      })).filter(t => t.id);

      return res.json({ success: true, teachers });
    } catch (error) {
      console.error('Error fetching teachers list:', error);
      return res.status(500).json({ success: false, teachers: [], message: error.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
};
