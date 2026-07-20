import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = process.env.VITE_GOOGLE_SHEETS_ID;

async function fixAndTest() {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = meta.data.sheets.find(s => s.properties.title === 'marks');
  const sheetId = sheet.properties.sheetId;

  // 1. Get Row 1
  const row1Res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'marks!A1:H1',
  });
  const row1Data = row1Res.data.values ? row1Res.data.values[0] : null;

  if (row1Data && row1Data[1] === '30-07-2026') {
    console.log('Row 1 is 30-07-2026. Deleting Row 1 and appending 30-07-2026 to the end using range: marks!B1...');

    // Delete Row 1
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: 0,
              endIndex: 1
            }
          }
        }]
      }
    });

    // Append at the END using range: 'marks!B1'
    const newRowNoColA = row1Data.slice(1); // ['30-07-2026', 'Maths', 'Board', ...]
    const appendRes = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'marks!B1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRowNoColA]
      }
    });

    console.log('Append response updatedRange:', appendRes.data.updates.updatedRange);
  }
}

fixAndTest().catch(console.error);
