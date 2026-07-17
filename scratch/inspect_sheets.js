async function test() {
  const apiKey = 'AIzaSyC7w__YyosHgV0wz3VIcLtGUM0dhV3zReU';
  const sheetId = '1tQLPp3rPMtwD5nVUKJtehg_vAD3cqnZu_-FdCt3RteA';

  // Fetch students
  const studentsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/'student_info'!A1:Z2000?key=${apiKey}`;
  const studentsRes = await fetch(studentsUrl);
  const studentsData = await studentsRes.json();
  const studentRows = studentsData.values || [];
  console.log(`student_info total rows: ${studentRows.length}`);

  // Fetch marks with a larger range (e.g. A1:Z5000)
  const marksUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/'marks'!A1:Z5000?key=${apiKey}`;
  const marksRes = await fetch(marksUrl);
  const marksData = await marksRes.json();
  const marksRows = marksData.values || [];
  console.log(`marks total rows: ${marksRows.length}`);

  // Print first few headers of marks
  console.log('Marks headers:', marksRows[0]);

  // Look for occurrences of last 9 student IDs in the marks sheet
  const targetIds = [
    'F2627122001', 'F2627122002', 'F2627122003', 'F2627122004',
    'F2627122005', 'F2627122006', 'F2627122007', 'F2627122008',
    'F2627122009'
  ];

  console.log('Searching for target student IDs in marks sheet rows...');
  // Find column index for Student ID in marks
  const headers = marksRows[0] || [];
  const idColIdx = headers.findIndex(h => /student/i.test(h) || /roll/i.test(h));
  console.log(`Student ID column index in marks sheet: ${idColIdx}`);

  if (idColIdx !== -1) {
    const matchedRows = {};
    marksRows.slice(1).forEach((row, idx) => {
      const val = String(row[idColIdx] || '').trim();
      targetIds.forEach(id => {
        if (val.toLowerCase().includes(id.toLowerCase())) {
          if (!matchedRows[id]) matchedRows[id] = 0;
          matchedRows[id]++;
        }
      });
      // Also log if there are rows beyond 1000
      if (idx === 999) {
        console.log(`Row 1000 student ID: ${row[idColIdx]}`);
      }
      if (idx >= 1000 && val.toLowerCase().includes('f2627122')) {
        console.log(`Row ${idx+1} has student ID: ${val}`);
      }
    });
    console.log('Match counts in marks:', matchedRows);
  }
}

test().catch(console.error);
