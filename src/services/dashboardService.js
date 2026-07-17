import { mockDashboardData } from '../data/mockData';
import { parseAttendanceByStudentId } from '../utils/attendanceParser';
import { parseMarksByStudentId, parseMarksRecords } from '../utils/marksParser';
import {
  isGoogleSheetsConfigured,
  fetchLiveAttendanceData,
  getAttendanceSummaryByStudent,
  getOverallAttendancePercentage,
  googleSheetsConfig,
  fetchGoogleSheetData,
  convertSheetRowsToObjects,
} from './googleSheetsClient';
import { normalizeStudentId } from '../utils/studentId';
import * as XLSX from 'xlsx';

const pick = (row, keys) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return row[key];
    }
  }
  return null;
};

const normalizeStudent = (row) => ({
  id: row.id,
  studentId: pick(row, ['student_id', 'Student ID', 'roll_no', 'Roll No']) || '—',
  name: pick(row, ['student_name', 'Student Name', 'name', 'Name']) || 'Unknown',
  className: pick(row, ['class', 'Class', 'course', 'Course']) || '—',
  section: pick(row, ['section', 'Section']) || '—',
  joiningDate: pick(row, ['Joining Date', 'joining_date', 'date_joined']) || '—',
  active: pick(row, ['Active', 'active', 'is_active']) !== false,
});

const aggregateFromTables = ({
  students = [],
  teachers = [],
  attendance = [],
  marks = [],
  newStudentInquiry = [],
  exam = [],
}) => {
  const studentList = students.map(normalizeStudent);
  const activeStudents = studentList.filter((s) => s.active !== false).length;
  const totalTeachers = teachers.length;
  const newInquiries = newStudentInquiry.length;
  const totalExams = exam.length;

  let attendancePercentage = 0;
  if (attendance.length) {
    const byStudentCols = parseAttendanceByStudentId(attendance);
    if (byStudentCols.length) {
      attendancePercentage = Math.round(
        byStudentCols.reduce((a, s) => a + s.percentage, 0) / byStudentCols.length
      );
    }
  }

  const attendanceByStudent = attendance.length
    ? parseAttendanceByStudentId(attendance).map((s) => ({
        studentId: s.studentId,
        value: s.percentage,
        present: s.present,
        total: s.total,
      }))
    : mockDashboardData.charts.attendanceByStudent;

  const marksRecords = marks.length ? parseMarksRecords(marks) : mockDashboardData.charts.marksRecords;
  const marksParsed = marks.length ? parseMarksByStudentId(marks) : [];
  const marksByStudent = marksParsed.length
    ? marksParsed.map((s) => ({
        studentId: s.studentId,
        value: s.averagePercent,
        examCount: s.examCount,
        averageObtained: s.averageObtained,
      }))
    : mockDashboardData.charts.marksByStudent;

  const averageMarks = marksParsed.length
    ? Math.round(marksParsed.reduce((a, s) => a + s.averagePercent, 0) / marksParsed.length)
    : 0;

  const classNames = [...new Set(studentList.map((s) => s.className).filter((c) => c && c !== '—'))];

  return {
    stats: {
      totalStudents: studentList.length,
      activeStudents,
      totalTeachers,
      newInquiries,
      totalExams,
      attendancePercentage,
      averageMarks,
    },
    allStudents: studentList,
    recentStudents: studentList.slice(0, 10),
    charts: {
      attendancePercentage: attendancePercentage || mockDashboardData.charts.attendancePercentage,
      attendanceByStudent,
      marksByStudent,
      marksRecords: marks.length ? marksRecords : mockDashboardData.charts.marksRecords,
    },
    classFilters: ['All Classes', ...classNames],
    lastUpdated: new Date().toISOString(),
  };
};

const dashboardSheets = () => ({
  students: googleSheetsConfig.sheets.students,
  teachers: googleSheetsConfig.sheets.teachers,
  marks: googleSheetsConfig.sheets.marks,
  newStudentInquiry: googleSheetsConfig.sheets.newStudentInquiry,
  exam: googleSheetsConfig.sheets.exam,
});

export const fetchDashboardData = async () => {
  if (!isGoogleSheetsConfigured()) {
    return { ...mockDashboardData, source: 'mock' };
  }

  try {
    const sheetsMap = dashboardSheets();
    const sheetResults = await Promise.allSettled(
      Object.entries(sheetsMap).map(async ([key, sheetName]) => {
        const rawRows = await fetchGoogleSheetData(sheetName);
        return [key, convertSheetRowsToObjects(rawRows)];
      })
    );

    const payload = {
      students: [],
      teachers: [],
      attendance: [],
      marks: [],
      newStudentInquiry: [],
      exam: [],
    };

    for (const result of sheetResults) {
      if (result.status === 'fulfilled') {
        const [key, rows] = result.value;
        payload[key] = rows;
      } else {
        console.warn('Google Sheets fetch failed:', result.reason?.message);
      }
    }

    // Attempt to merge live attendance from Sheets if configured
    let attendanceSummary = [];
    let overallAttendancePercentage = 0;
    try {
      const liveAttendance = await fetchLiveAttendanceFromSheets();
      attendanceSummary = liveAttendance.summaryByStudent || [];
      overallAttendancePercentage = liveAttendance.overallPercentage || 0;
    } catch (err) {
      console.warn('Failed to fetch live attendance during dashboard fetch:', err.message);
    }

    const aggregated = aggregateFromTables(payload);

    // Merge live attendance data into aggregation
    if (attendanceSummary.length > 0) {
      aggregated.stats.attendancePercentage = overallAttendancePercentage;
      aggregated.charts.attendancePercentage = overallAttendancePercentage;
      aggregated.charts.attendanceByStudent = attendanceSummary.map((s) => ({
        studentId: s.studentId,
        value: s.percentage,
        present: s.presentCount,
        total: s.totalCount,
      }));
      aggregated.liveAttendanceSource = 'google-sheets';
    }

    if (!payload.students.length) {
      return { ...mockDashboardData, source: 'mock', error: 'No rows returned from students sheet' };
    }

    return {
      ...aggregated,
      source: 'google-sheets',
      rawMarks: payload.marks || [],
      tablesUsed: Object.keys(sheetsMap).filter((k) => sheetsMap[k]),
    };
  } catch (error) {
    console.error('Google Sheets fetch failed, using mock data:', error.message);
    return { ...mockDashboardData, source: 'mock', error: error.message };
  }
};

export const exportReportCsv = (data) => {
  const headers = ['Student ID', 'Name', 'Class', 'Section'];
  const rows = (data.recentStudents || []).map((s) =>
    [s.studentId, s.name, s.className, s.section].map((v) => `"${v}"`).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `students-report-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportMarksToExcel = (data) => {
  const allStudents = data.allStudents || [];
  const rawMarks = data.rawMarks || [];

  // Helper parser for Excel marks records to preserve raw values and date
  const parseExcelMarksRecords = (rows) => {
    const records = [];
    rows.forEach((row) => {
      const rawId = pick(row, ['Student id', 'Student ID', 'student_id', 'studentId', 'roll_no', 'Roll No']);
      const rawSubject = pick(row, ['subject', 'Subject']);
      const rawObtained = pick(row, ['obtain marks', 'obtained_marks', 'Obtained Marks', 'obtained marks', 'marks', 'score']);
      const rawTotal = pick(row, ['total makrs', 'total_marks', 'Total Marks', 'total marks', 'total']);
      const rawDate = pick(row, ['date', 'Date']);

      if (!rawId || !rawSubject) return;

      let obtained = '—';
      let isNumeric = false;
      let numericObtained = NaN;

      if (rawObtained !== null && rawObtained !== undefined) {
        const sVal = String(rawObtained).trim().toUpperCase();
        if (sVal === 'AB' || sVal === 'NA' || sVal === '-') {
          obtained = sVal;
        } else if (sVal === '') {
          obtained = '—';
        } else {
          const num = Number(sVal);
          if (Number.isFinite(num)) {
            obtained = num;
            numericObtained = num;
            isNumeric = true;
          } else {
            obtained = sVal;
          }
        }
      }

      let total = NaN;
      if (rawTotal !== null && rawTotal !== undefined) {
        const sVal = String(rawTotal).trim();
        total = Number(sVal);
      }

      let percent = '—';
      if (isNumeric && Number.isFinite(total) && total > 0) {
        percent = Math.round((numericObtained / total) * 100);
      }

      records.push({
        studentId: normalizeStudentId(rawId),
        displayId: String(rawId).trim(),
        subject: rawSubject,
        date: rawDate ? String(rawDate).trim() : '—',
        obtained,
        total: Number.isFinite(total) ? total : '—',
        percent: percent === '—' ? '—' : `${percent}%`,
        numericPercent: isNumeric ? percent : null
      });
    });
    return records;
  };

  let marksRecords = [];
  if (rawMarks.length > 0) {
    marksRecords = parseExcelMarksRecords(rawMarks);
  } else {
    // Fallback if rawMarks is empty (mock data)
    const chartsRecords = data.charts?.marksRecords || [];
    marksRecords = chartsRecords.map((r) => ({
      studentId: normalizeStudentId(r.studentId),
      displayId: String(r.displayId || r.studentId).trim(),
      subject: r.subject,
      date: '—',
      obtained: r.obtained,
      total: r.total,
      percent: `${r.percent}%`,
      numericPercent: r.percent
    }));
  }

  // Group marks records by studentId
  const marksByStudent = {};
  marksRecords.forEach((record) => {
    const normId = normalizeStudentId(record.studentId);
    if (!marksByStudent[normId]) {
      marksByStudent[normId] = [];
    }
    marksByStudent[normId].push(record);
  });

  const wb = XLSX.utils.book_new();
  const allStudentsMap = new Map();
  allStudents.forEach((s) => {
    allStudentsMap.set(normalizeStudentId(s.studentId), s);
  });

  // Ensure sheet names are unique and valid (max 31 characters, avoid special characters)
  const usedSheetNames = new Set();
  const getUniqueSheetName = (name, studentId) => {
    let sanitized = String(name || studentId)
      .replace(/[\\/?*:[\]]/g, '')
      .trim();
    if (sanitized.length > 25) {
      sanitized = sanitized.substring(0, 25);
    }
    let candidate = sanitized || studentId;
    let counter = 1;
    while (usedSheetNames.has(candidate.toLowerCase())) {
      const suffix = ` (${counter})`;
      candidate = sanitized.substring(0, 31 - suffix.length) + suffix;
      counter++;
    }
    usedSheetNames.add(candidate.toLowerCase());
    return candidate;
  };

  // Combine all student IDs from the students table and any who have marks records
  const allStudentIds = new Set([
    ...allStudents.map((s) => normalizeStudentId(s.studentId)),
    ...Object.keys(marksByStudent),
  ]);

  allStudentIds.forEach((normId) => {
    const studentInfo = allStudentsMap.get(normId) || { studentId: normId, name: normId };
    const studentMarks = marksByStudent[normId] || [];

    // Parse helper for Excel date sorting
    const parseMarksDate = (dateStr) => {
      if (!dateStr) return new Date(0);
      const str = String(dateStr).trim();
      
      if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 3) {
          let month = parseInt(parts[0], 10) - 1;
          let day = parseInt(parts[1], 10);
          let year = parseInt(parts[2], 10);
          if (year < 100) year += 2000;
          return new Date(year, month, day);
        }
      }
      
      if (str.includes('-')) {
        const parts = str.split('-');
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            let year = parseInt(parts[0], 10);
            let month = parseInt(parts[1], 10) - 1;
            let day = parseInt(parts[2], 10);
            return new Date(year, month, day);
          } else {
            let day = parseInt(parts[0], 10);
            let month = parseInt(parts[1], 10) - 1;
            let year = parseInt(parts[2], 10);
            if (year < 100) year += 2000;
            return new Date(year, month, day);
          }
        }
      }
      
      const d = new Date(str);
      return isNaN(d.getTime()) ? new Date(0) : d;
    };

    const sortedStudentMarks = [...studentMarks].sort((a, b) => {
      return parseMarksDate(b.date) - parseMarksDate(a.date);
    });

    // Calculate student average percent only based on numeric percentages
    const numericPercentages = sortedStudentMarks
      .map((m) => m.numericPercent)
      .filter((p) => p !== null && p !== undefined && !isNaN(p));
    
    const avgPercent = numericPercentages.length > 0
      ? Math.round(numericPercentages.reduce((a, b) => a + b, 0) / numericPercentages.length)
      : '—';

    const dataRows = [
      ['FUTURE LEARNING ARTS - STUDENT PERFORMANCE REPORT'],
      [],
      ['STUDENT DETAILS'],
      ['Student Name:', studentInfo.name || 'Unknown'],
      ['Student ID:', studentInfo.studentId],
      ['Class:', studentInfo.className || '—'],
      ['Section:', studentInfo.section || '—'],
      ['Academic Status:', studentInfo.active ? 'Active' : 'Inactive'],
      [],
      ['PERFORMANCE SUMMARY'],
      ['Total Exams Taken:', sortedStudentMarks.length],
      ['Average Percentage:', avgPercent === '—' ? '—' : `${avgPercent}%`],
      [],
      ['EXAM SCORES'],
      ['Date', 'Subject', 'Obtained Marks', 'Total Marks', 'Percentage'],
    ];

    if (sortedStudentMarks.length === 0) {
      dataRows.push(['No marks records found for this student.', '', '', '', '']);
    } else {
      sortedStudentMarks.forEach((m) => {
        dataRows.push([m.date, m.subject, m.obtained, m.total, m.percent]);
      });
    }

    const ws = XLSX.utils.aoa_to_sheet(dataRows);
    const sheetName = getUniqueSheetName(studentInfo.name, studentInfo.studentId);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  if (wb.SheetNames.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([['No data available']]);
    XLSX.utils.book_append_sheet(wb, ws, 'No Data');
  }

  XLSX.writeFile(wb, `student-marks-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
};

/**
 * Fetch and process live attendance data from Google Sheets
 * Formats it compatible with the dashboard
 * @param {string} sheetName - Name of the sheet to fetch (optional, defaults to first sheet)
 * @returns {Promise<Object>} Processed attendance data for dashboard
 */
export const fetchLiveAttendanceFromSheets = async (sheetName) => {
  if (!isGoogleSheetsConfigured()) {
    throw new Error('Google Sheets not configured');
  }

  try {
    if (sheetName) {
      const sheetsData = await fetchLiveAttendanceData(sheetName);
      const summaryByStudent = getAttendanceSummaryByStudent(sheetsData.processed);
      const overallPercentage = getOverallAttendancePercentage(summaryByStudent);

      return {
        summaryByStudent,
        overallPercentage,
        rawRecords: sheetsData.processed,
        lastFetched: sheetsData.lastFetched,
        sheetName: sheetsData.sheetName,
        source: 'google-sheets',
      };
    }

    // Fetch all configured attendance sheets in parallel when no sheet name is specified
    const sheets = googleSheetsConfig.attendanceSheets || [];
    const results = await Promise.all(
      sheets.map(async (name) => {
        try {
          const sheetsData = await fetchLiveAttendanceData(name);
          return sheetsData;
        } catch (err) {
          console.warn(`Failed to fetch live attendance for sheet ${name}:`, err);
          return null;
        }
      })
    );

    // Combine all processed records from all fetched sheets
    let allProcessed = [];
    let latestFetched = null;
    const fetchedSheetNames = [];

    results.forEach((data) => {
      if (data && data.processed) {
        allProcessed = allProcessed.concat(data.processed);
        fetchedSheetNames.push(data.sheetName);
        if (!latestFetched || new Date(data.lastFetched) > new Date(latestFetched)) {
          latestFetched = data.lastFetched;
        }
      }
    });

    const summaryByStudent = getAttendanceSummaryByStudent(allProcessed);
    const overallPercentage = getOverallAttendancePercentage(summaryByStudent);

    return {
      summaryByStudent,
      overallPercentage,
      rawRecords: allProcessed,
      lastFetched: latestFetched || new Date().toISOString(),
      sheetName: fetchedSheetNames.join(', ') || 'All Sheets',
      source: 'google-sheets',
    };
  } catch (error) {
    console.error('Error fetching live attendance from Sheets:', error);
    throw error;
  }
};

/**
 * Format Google Sheets attendance data for dashboard charts
 * @param {Array<Object>} summaryByStudent - Attendance summary by student
 * @returns {Object} Formatted data for AttendanceDonutChart and other components
 */
export const formatLiveAttendanceForDashboard = (summaryByStudent) => {
  const attendanceByStudent = summaryByStudent.map((s) => ({
    studentId: s.studentId,
    value: s.percentage,
    present: s.presentCount,
    total: s.totalCount,
  }));

  const overallPercentage = getOverallAttendancePercentage(summaryByStudent);

  return {
    attendancePercentage: overallPercentage,
    attendanceByStudent,
  };
};
