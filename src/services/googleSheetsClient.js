import { googleSheetsConfig, isGoogleSheetsConfigured } from '../config/env';

export { googleSheetsConfig, isGoogleSheetsConfigured };

const GOOGLE_SHEETS_API_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

/**
 * Convert raw Google Sheets rows (2D array where index 0 is headers) to an array of objects
 * @param {Array<Array>} rows - Raw rows
 * @returns {Array<Object>} Converted objects with sequential 'id' field
 */
export const convertSheetRowsToObjects = (rows) => {
  if (!rows || rows.length === 0) return [];

  let headers = rows[0];
  let startIndex = 1;

  // Check if activeSession headers or data
  const isActiveSessionHeaders = (h) => {
    if (!h || h.length < 3) return false;
    const col1 = String(h[1]).toLowerCase().trim();
    const col2 = String(h[2]).toLowerCase().trim();
    return (
      col1.includes('phone') || col1 === '919876500000' ||
      col2.includes('role') || col2 === 'student' || col2 === 'admin' || col2 === 'teacher' || col2 === 'reception'
    );
  };

  // Resilient check if headers are missing for marks sheet data format
  const isMarksDataRow = (row) => {
    if (!row || row.length < 8) return false;
    const isDate = /^\d{1,4}[-/]\d{1,2}[-/]\d{2,4}$/.test(String(row[1]).trim());
    const isStudentId = /^[A-Z0-9]+$/i.test(String(row[4]).trim()) && !String(row[4]).toLowerCase().includes('student');
    return isDate && isStudentId;
  };

  if (isMarksDataRow(rows[0])) {
    headers = ["", "Date", "Subject", "Exam Type", "Student ID", "Student Name", "Total Marks", "Obtained Marks"];
    startIndex = 0;
  } else if (isActiveSessionHeaders(rows[0])) {
    headers = ["", "Phone Number", "Active Role", "Active ID"];
    const isPhoneData = /^\+?\d{8,15}$/.test(String(rows[0][1]).trim());
    startIndex = isPhoneData ? 0 : 1;
  }

  const objects = [];
  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    // id = actual 1-based spreadsheet row number so backend can use it directly
    const obj = { id: i + 1 };
    headers.forEach((header, index) => {
      let val = row[index];
      if (val === undefined || val === null) {
        val = '';
      } else if (typeof val === 'string') {
        const valTrim = val.trim();
        const valUpper = valTrim.toUpperCase();
        if (valUpper === 'TRUE') val = true;
        else if (valUpper === 'FALSE') val = false;
        else val = valTrim;
      }
      if (header) {
        obj[header] = val;
      }
    });
    objects.push(obj);
  }
  return objects;
};


/**
 * Get available attendance sheet names
 * @returns {Array<string>} List of sheet names
 */
export const getAvailableAttendanceSheets = () => googleSheetsConfig.attendanceSheets;

const apiCache = new Map();
const CACHE_DURATION_MS = 25000; // Cache responses for 25 seconds to prevent 429 errors

/** Clear cached data for a specific sheet range (or all cache if no key given) */
export const clearSheetCache = (range) => {
  if (range) {
    apiCache.delete(String(range).trim());
  } else {
    apiCache.clear();
  }
};

export const fetchGoogleSheetData = async (range) => {
  if (!isGoogleSheetsConfigured()) {
    throw new Error('Google Sheets not configured');
  }

  const cacheKey = String(range).trim();
  const cached = apiCache.get(cacheKey);
  const now = Date.now();

  // If we have cached data and it's not expired, use it
  if (cached && (now - cached.timestamp < CACHE_DURATION_MS)) {
    console.log(`[Google Sheets Cache Hit] for: ${range}`);
    return cached.data;
  }

  // If there's an ongoing fetch for this range, reuse the promise to avoid duplicate parallel requests
  if (cached && cached.promise) {
    console.log(`[Google Sheets Parallel De-duplication] for: ${range}`);
    return cached.promise;
  }

  // Define fetch execution
  const fetchPromise = (async () => {
    try {
      let formattedRange = range;
      if (!range.includes('!')) {
        // Sheet name with spaces needs to be quoted
        formattedRange = `'${range}'`;
      }

      const url = `${GOOGLE_SHEETS_API_URL}/${googleSheetsConfig.sheetId}/values/${encodeURIComponent(formattedRange)}?key=${googleSheetsConfig.apiKey}`;

      console.log('Google Sheets API Request:', {
        range: formattedRange,
        sheetId: googleSheetsConfig.sheetId,
        url: url.replace(googleSheetsConfig.apiKey, 'HIDDEN_API_KEY'),
      });

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        console.error('Google Sheets API Error:', data);
        throw new Error(`Google Sheets API error: ${response.status} ${response.statusText} - ${data.error?.message || ''}`);
      }

      console.log('Google Sheets API Response:', { rowCount: data.values?.length || 0 });
      const values = data.values || [];

      // Save successful result in cache and clear the promise
      apiCache.set(cacheKey, {
        timestamp: Date.now(),
        data: values,
        promise: null,
      });

      return values;
    } catch (error) {
      // Clear cache on error so next attempt can retry fresh
      apiCache.delete(cacheKey);
      console.error('Error fetching Google Sheets data:', error);
      throw error;
    }
  })();

  // Save the pending promise in cache
  apiCache.set(cacheKey, {
    timestamp: now,
    data: null,
    promise: fetchPromise,
  });

  return fetchPromise;
};

/**
 * Fetch attendance data from Google Sheets
 * @param {string} sheetName - Name of the sheet to fetch (default: first sheet)
 * @returns {Promise<Object>} Processed attendance data
 */
export const fetchLiveAttendanceData = async (sheetName) => {
  try {
    // Use provided sheet name or default to first available sheet
    const attendanceSheetName = sheetName || googleSheetsConfig.attendanceSheets[0];

    if (!attendanceSheetName) {
      throw new Error('No attendance sheet configured');
    }

    // Fetch entire sheet to get all data
    const range = `${attendanceSheetName}`;
    const rows = await fetchGoogleSheetData(range);

    if (rows.length < 2) {
      console.warn('Attendance sheet has no data');
      return { raw: rows, processed: [], sheetName: attendanceSheetName };
    }

    return {
      raw: rows,
      processed: processAttendanceRows(rows),
      sheetName: attendanceSheetName,
      lastFetched: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching live attendance:', error);
    throw error;
  }
};

// Helper: Check if status represents NA / Not Applicable / Empty
const isNAStatus = (statusStr) => {
  if (!statusStr) return true;
  const s = String(statusStr).toLowerCase().trim();
  return (
    s === 'na' ||
    s === 'n/a' ||
    s === 'n.a' ||
    s === 'n.a.' ||
    s === 'na.' ||
    s === '-' ||
    s === '--' ||
    s === 'not applicable' ||
    s === 'none'
  );
};

/**
 * Process raw Google Sheets attendance data
 * Extracts student attendance from the dynamic column structure
 * Columns: Timestamp, Lecture time, Subject, then "Student info [ID - Name]" columns
 *
 * @param {Array<Array>} rows - Raw rows from Google Sheets
 * @returns {Array<Object>} Processed attendance records
 */
export const processAttendanceRows = (rows) => {
  if (rows.length < 2) return [];

  const headers = rows[0] || [];
  const studentColumns = [];
  let timestampIdx = -1;
  let lectureTimeIdx = -1;
  let subjectIdx = -1;

  // Parse headers to identify columns
  headers.forEach((header, idx) => {
    const headerStr = String(header || '').toLowerCase().trim();

    if (headerStr.includes('timestamp')) {
      timestampIdx = idx;
    } else if (headerStr.includes('lecture time') || headerStr.includes('lecture')) {
      lectureTimeIdx = idx;
    } else if (headerStr.includes('subject')) {
      subjectIdx = idx;
    } else if (headerStr.includes('student info')) {
      // Extract student ID and name from "Student info [ID - Name]"
      const match = String(header).match(/\[([^\s-]+)\s*-\s*([^\]]+)\]/);
      if (match) {
        studentColumns.push({
          columnIndex: idx,
          studentId: match[1].trim().replace(/\]+$/, ''),
          studentName: match[2].trim().replace(/\]+$/, ''),
        });
      }
    }
  });

  // Process each row (skip header)
  const processedRecords = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const timestamp = timestampIdx >= 0 ? row[timestampIdx] : '';
    const lectureTime = lectureTimeIdx >= 0 ? row[lectureTimeIdx] : '';
    const subject = subjectIdx >= 0 ? row[subjectIdx] : '';

    // Skip empty rows
    if (!timestamp && !lectureTime && !subject) continue;

    const attendanceRecord = {
      timestamp,
      lectureTime,
      subject,
      attendanceByStudent: [],
    };

    // Extract attendance for each student
    studentColumns.forEach((student) => {
      const status = row[student.columnIndex] || '';
      const normStatus = String(status).toLowerCase().trim();
      const isPresent = normStatus === 'present' || normStatus === 'p';
      const isNA = isNAStatus(status);

      attendanceRecord.attendanceByStudent.push({
        studentId: student.studentId,
        studentName: student.studentName,
        status: status,
        present: isPresent,
        isNA: isNA,
      });
    });

    processedRecords.push(attendanceRecord);
  }

  return processedRecords;
};

/**
 * Get attendance summary by student
 * @param {Array<Object>} processedRecords - Processed attendance records
 * @returns {Array<Object>} Summary of attendance per student
 */
export const getAttendanceSummaryByStudent = (processedRecords) => {
  const summaryMap = {};

  processedRecords.forEach((record) => {
    record.attendanceByStudent?.forEach((attendance) => {
      const key = `${attendance.studentId}`;
      if (!summaryMap[key]) {
        summaryMap[key] = {
          studentId: attendance.studentId,
          studentName: attendance.studentName,
          presentCount: 0,
          totalCount: 0,
          percentage: 0,
        };
      }

      // Option B: If status is NA / N/A, exclude from total class count
      if (!attendance.isNA) {
        summaryMap[key].totalCount += 1;
        if (attendance.present) {
          summaryMap[key].presentCount += 1;
        }
      }

      if (summaryMap[key].totalCount > 0) {
        summaryMap[key].percentage = Math.round(
          (summaryMap[key].presentCount / summaryMap[key].totalCount) * 100
        );
      } else {
        summaryMap[key].percentage = 0;
      }
    });
  });

  return Object.values(summaryMap).sort((a, b) => {
    const aId = parseInt(a.studentId) || 0;
    const bId = parseInt(b.studentId) || 0;
    return aId - bId;
  });
};

/**
 * Get overall attendance percentage
 * @param {Array<Object>} summaryByStudent - Summary by student
 * @returns {number} Overall attendance percentage
 */
export const getOverallAttendancePercentage = (summaryByStudent) => {
  if (!summaryByStudent.length) return 0;
  const total = summaryByStudent.reduce((sum, s) => sum + s.percentage, 0);
  return Math.round(total / summaryByStudent.length);
};
