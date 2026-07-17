import fs from 'fs';
import path from 'path';

// Read .env file
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (key) => {
  const match = envContent.match(new RegExp(`^\\s*${key}\\s*=\\s*(.*)$`, 'm'));
  return match ? match[1].trim() : null;
};

const apiKey = getEnvVar('VITE_GOOGLE_SHEETS_API_KEY');
const sheetId = getEnvVar('VITE_GOOGLE_SHEETS_ID');
const sheetMarks = getEnvVar('VITE_GOOGLE_SHEETS_SHEET_MARKS') || 'marks';
const sheetExam = getEnvVar('VITE_GOOGLE_SHEETS_SHEET_EXAM') || 'exam_schedule';

const fetchSheet = async (sheetName) => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/'${encodeURIComponent(sheetName)}'?key=${apiKey}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) {
      console.error(`Error fetching ${sheetName}:`, data);
      return null;
    }
    return data.values;
  } catch (err) {
    console.error(`Network error fetching ${sheetName}:`, err);
    return null;
  }
};

const run = async () => {
  console.log('Fetching Marks columns...');
  const marks = await fetchSheet(sheetMarks);
  if (marks && marks.length > 0) {
    console.log('Marks Headers:', marks[0]);
    console.log('First 3 Marks rows:', marks.slice(1, 4));
  } else {
    console.log('No marks data or error.');
  }

  console.log('\nFetching Exam columns...');
  const exams = await fetchSheet(sheetExam);
  if (exams && exams.length > 0) {
    console.log('Exams Headers:', exams[0]);
    console.log('First 3 Exams rows:', exams.slice(1, 4));
  } else {
    console.log('No exams data or error.');
  }
};

run();
