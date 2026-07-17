import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const SPREADSHEET_ID = process.env.VITE_GOOGLE_SHEETS_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
  console.error('Error: Credentials missing in .env');
  process.exit(1);
}

const auth = new google.auth.JWT({
  email: SERVICE_ACCOUNT_EMAIL,
  key: PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const MARKS_SHEET_NAME = process.env.VITE_GOOGLE_SHEETS_SHEET_MARKS || 'marks';

async function main() {
  try {
    console.log(`Fetching values from sheet "${MARKS_SHEET_NAME}"...`);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${MARKS_SHEET_NAME}!A1:H2000`,
    });

    const rows = res.data.values || [];
    console.log(`Retrieved ${rows.length} rows.`);

    if (rows.length === 0) {
      console.log('Sheet is empty. Nothing to fix.');
      return;
    }

    const firstRow = rows[0];
    console.log('First row of sheet:', firstRow);

    // Check if the first row is data or headers
    // Data indicator: column 1 (index 1) is a date, column 4 (index 4) starts with F/roll no, column 6/7 are numbers
    const isDate = /^\d{1,4}[-/]\d{1,2}[-/]\d{2,4}$/.test(String(firstRow[1]).trim());
    const isStudentId = /^[A-Z0-9]+$/i.test(String(firstRow[4]).trim()) && !String(firstRow[4]).toLowerCase().includes('student');
    const isObtainedMarks = /^(AB|NA|\d+)$/i.test(String(firstRow[7]).trim()) && !String(firstRow[7]).toLowerCase().includes('obtained');

    console.log('Heuristics:', { isDate, isStudentId, isObtainedMarks });

    if (isDate || isStudentId || isObtainedMarks) {
      console.log('First row detected as DATA. Inserting headers...');
      const headers = ["", "Date", "Subject", "Exam Type", "Student ID", "Student Name", "Total Marks", "Obtained Marks"];
      const updatedRows = [headers, ...rows];

      console.log('Updating spreadsheet with headers...');
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${MARKS_SHEET_NAME}!A1:H${updatedRows.length}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: updatedRows,
        },
      });

      console.log('Successfully updated sheet with headers!');
    } else {
      console.log('First row seems to be headers already. No changes made.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
