import { useTableSection } from '../hooks/useTableSection';
import BaserowDataTable from '../components/tables/BaserowDataTable';
import GoogleSheetsAttendanceTable from './GoogleSheetsAttendancePage';
import { getSectionEnvKey } from '../services/sectionService';
import { isGoogleSheetsConfigured } from '../config/env';
import { useState, useMemo } from 'react';
import StudentIdFilter from '../components/ui/StudentIdFilter';
import { normalizeStudentId } from '../utils/studentId';

const SECTION_HINTS = {
  attendance: {
    note: 'In Baserow the table can have any display name. In .env use only VITE_BASEROW_TABLE_ATTENDANCE=number from the URL.',
  },
};

export default function SectionTablePage({
  section,
  title,
  selectedRows = [],
  setSelectedRows = null,
  refreshTrigger = 0,
  dashboardData = null,
}) {
  // Use Google Sheets for attendance if configured
  if (section === 'attendance' && isGoogleSheetsConfigured()) {
    return <GoogleSheetsAttendanceTable />;
  }

  const { data, loading } = useTableSection(section, refreshTrigger);
  const hint = SECTION_HINTS[section];
  const envKey = getSectionEnvKey(section);

  const getRowStudentId = (row) => {
    if (!row) return '';
    const keys = Object.keys(row);
    const studentIdKey = keys.find((k) => {
      const lower = k.toLowerCase().trim();
      return lower === 'student_id' || lower === 'student id' || lower === 'studentid';
    });
    return studentIdKey ? String(row[studentIdKey]).trim() : String(row.id);
  };

  // BaserowDataTable always passes String(row.id) as the rowKey
  const getRowKey = (row) => (row ? String(row.id) : '');

  const selectedRowKeys = selectedRows.filter(Boolean).map(getRowKey);

  const onSelectToggle = (rowKey) => {
    if (!setSelectedRows) return;
    const rowObj = filteredRows.find(r => getRowKey(r) === rowKey);
    if (!rowObj) return; // guard: row not found in current view
    setSelectedRows(prev => {
      if (prev.some(r => getRowKey(r) === rowKey)) {
        return prev.filter(r => getRowKey(r) !== rowKey);
      } else {
        return [...prev, rowObj];
      }
    });
  };

  const onSelectAll = () => {
    if (!setSelectedRows) return;

    const keysInView = filteredRows.map(getRowKey);
    const allSelectedInView = keysInView.every(k => selectedRowKeys.includes(k));

    if (allSelectedInView) {
      setSelectedRows(prev => prev.filter(r => !keysInView.includes(getRowKey(r))));
    } else {
      setSelectedRows(prev => {
        const rowsToAdd = filteredRows.filter(r => !prev.some(p => getRowKey(p) === getRowKey(r)));
        return [...prev, ...rowsToAdd];
      });
    }
  };

  // Marks filter state (search combined ID+Name or subject)
  const [query, setQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  
  // Exam filters: class dropdown and subject search
  const [classFilter, setClassFilter] = useState('All Classes');
  const [examSubject, setExamSubject] = useState('');

  // Extract student options for marks filter
  const students = useMemo(() => {
    if (dashboardData?.allStudents && dashboardData.allStudents.length > 0) {
      return dashboardData.allStudents;
    }
    // Fallback: extract unique students from marks rows
    const rowsSrc = data?.rows || [];
    const studentMap = new Map();
    rowsSrc.forEach((row) => {
      const id = row['Student id'] || row['Student ID'] || row['student_id'] || row['studentId'] || row['roll_no'] || row['Roll No'];
      const name = row['Name'] || row['student_name'] || row['Student Name'] || row['name'] || '';
      if (id) {
        const normId = String(id).trim();
        if (!studentMap.has(normId)) {
          studentMap.set(normId, { studentId: normId, name: String(name).trim() });
        }
      }
    });
    return Array.from(studentMap.values()).sort((a, b) => a.studentId.localeCompare(b.studentId, undefined, { numeric: true }));
  }, [dashboardData?.allStudents, data?.rows]);

  const effectiveStudentId = useMemo(() => {
    if (selectedStudentId !== undefined && selectedStudentId !== null && selectedStudentId !== '') {
      return selectedStudentId;
    }
    // Default to the first student to avoid displaying all rows at once
    return students[0]?.studentId || '';
  }, [selectedStudentId, students]);

  const availableClasses = useMemo(() => {
    const rowsSrc = data?.rows || [];
    const set = new Set();
    rowsSrc.forEach((row) => {
      const c = row['class'] || row['Class'] || row['className'] || row['Class Name'] || row['ClassName'];
      if (c) set.add(String(c).trim());
    });
    return Array.from(set).sort();
  }, [data?.rows]);

  const filteredRows = useMemo(() => {
    const rowsSrc = data?.rows || [];
    let rowsFiltered = rowsSrc;

    if (section === 'marks') {
      if (effectiveStudentId) {
        rowsFiltered = rowsSrc.filter((row) => {
          const id = (
            row['Student ID'] || row['Student id'] || row['student_id'] || row['studentId'] || row['roll_no'] || row['Roll No'] || ''
          ).toString().trim();
          return normalizeStudentId(id) === normalizeStudentId(effectiveStudentId);
        });
      }

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

      rowsFiltered = [...rowsFiltered].sort((a, b) => {
        const dateA = parseMarksDate(a['date'] || a['Date']);
        const dateB = parseMarksDate(b['date'] || b['Date']);
        return dateB - dateA;
      });

      if (query) {
        const q = String(query).trim().toLowerCase();
        rowsFiltered = rowsFiltered.filter((row) => {
          const subject = (row['subject'] || row['Subject'] || '').toString().toLowerCase();
          return subject.includes(q);
        });
      }
    } else if (section === 'exam' && (classFilter !== 'All Classes' || examSubject)) {
      const subj = String(examSubject || '').trim().toLowerCase();
      rowsFiltered = rowsSrc.filter((row) => {
        try {
          const classVal = String(row['class'] || row['Class'] || row['className'] || row['Class Name'] || '').trim();
          if (classFilter !== 'All Classes' && classVal !== classFilter) return false;
          if (!subj) return true;
          const subject = String(row['subject'] || row['Subject'] || '').toLowerCase();
          if (subject.includes(subj)) return true;
          return JSON.stringify(row).toLowerCase().includes(subj);
        } catch (e) {
          return JSON.stringify(row).toLowerCase().includes(subj);
        }
      });
    }

    if (section === 'exam') {
      const parseDate = (dateStr) => {
        if (!dateStr) return new Date(0);
        const parts = String(dateStr).trim().split('-');
        if (parts.length !== 3) return new Date(0);
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
      };

      rowsFiltered = [...rowsFiltered].sort((a, b) => {
        const dateA = parseDate(a['exam_date'] || a['exam date'] || a['Exam Date'] || a['Exam_Date']);
        const dateB = parseDate(b['exam_date'] || b['exam date'] || b['Exam Date'] || b['Exam_Date']);
        return dateB - dateA;
      });
    }

    return rowsFiltered;
  }, [data?.rows, query, section, classFilter, examSubject, effectiveStudentId, students]);
  

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-blue border-t-transparent" />
      </div>
    );
  }

  if (data?.status !== 'ok') {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/50 dark:bg-amber-950/30 sm:p-8">
        <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-200">
          {title} — not connected to Google Sheets yet
        </h2>
        <p className="mt-2 text-sm text-amber-800 dark:text-amber-300/90">{data?.message}</p>

        <div className="mt-4 rounded-lg bg-white/80 p-4 text-sm dark:bg-slate-900/80">
          <p className="font-medium text-slate-800 dark:text-slate-200">Fix in 3 steps:</p>
          <ol className="mt-2 list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-400">
            <li>
              Create file <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">.env</code>{' '}
              in project root (copy from <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">.env.example</code>)
              — editing <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">.env.example</code> alone does not work.
            </li>
            <li>
              Configure Google Sheets API Credentials in <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">.env</code>:
              <br />
              <code className="text-xs">VITE_GOOGLE_SHEETS_API_KEY</code> and <code className="text-xs">VITE_GOOGLE_SHEETS_ID</code>
            </li>
            <li>
              Add the sheet name for this section to <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">.env</code>:
              <code className="block mt-1 rounded bg-slate-100 p-2 text-xs dark:bg-slate-800">
                {envKey}=your_sheet_name
              </code>
              Then restart: <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">npm run dev</code>
            </li>
          </ol>
          {hint?.note && <p className="mt-3 text-xs text-slate-500">{hint.note}</p>}
        </div>

        {!isGoogleSheetsConfigured() && (
          <p className="mt-4 text-xs text-slate-500">
            Header shows &quot;Demo data&quot; until <code>VITE_GOOGLE_SHEETS_API_KEY</code> and{' '}
            <code>VITE_GOOGLE_SHEETS_ID</code> are set in <code>.env</code>.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
        <span>
          Live data from Google Sheets · Sheet: <strong>{data?.tableId}</strong> · {data?.rows?.length || 0} rows
        </span>
        <span className="text-xs opacity-80">
          Updated {new Date(data.lastUpdated).toLocaleTimeString()}
        </span>
      </div>

      {/* Marks filter: dropdown selector for Student ID + Name and subject search */}
      {section === 'marks' && (
        <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6 flex-1">
              <div>
                <StudentIdFilter
                  label="Student ID"
                  value={effectiveStudentId}
                  onChange={setSelectedStudentId}
                  students={students}
                  studentIds={students.map((s) => s.studentId)}
                />
              </div>

              <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">Search Subject</label>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type subject name"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="text-sm text-slate-500 whitespace-nowrap self-center">
              {filteredRows.length} matches
            </div>
          </div>
        </div>
      )}

      {/* Exam filters: class dropdown + subject search */}
      {section === 'exam' && (
        <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
            <div className="w-full sm:w-56">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Filter by class</label>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option>All Classes</option>
                {availableClasses.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 mt-3 sm:mt-0">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Search Subject</label>
              <input
                type="search"
                value={examSubject}
                onChange={(e) => setExamSubject(e.target.value)}
                placeholder="Type subject name"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="mt-3 sm:mt-6 sm:ml-4 flex items-end">
              <div className="text-sm text-slate-500">{filteredRows.length} matches</div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900 dark:shadow-card-dark">
        <BaserowDataTable
          rows={filteredRows}
          selectable={section === 'students' || section === 'timetable' || section === 'exam' || section === 'marks' || section === 'activeSession' || section === 'fees'}
          selectedRowKeys={selectedRowKeys}
          onSelectToggle={onSelectToggle}
          onSelectAll={onSelectAll}
        />
      </div>
    </div>
  );
}
