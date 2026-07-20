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

async function test() {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = meta.data.sheets.find(s => s.properties.title === 'marks');
  console.log('Sheet title:', sheet.properties.title);

  // Read current rows
  const getRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'marks!A1:H10',
  });
  console.log('Top 10 rows currently:', getRes.data.values);
}

test().catch(console.error);
