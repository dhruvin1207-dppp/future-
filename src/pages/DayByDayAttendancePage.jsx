import { useState, useMemo } from 'react';
import { useLiveAttendance } from '../hooks/useLiveAttendance';
import { getAvailableAttendanceSheets } from '../services/googleSheetsClient';
import StudentIdFilter from '../components/ui/StudentIdFilter';

export default function DayByDayAttendancePage() {
  const {
    attendanceData,
    loading,
    error,
    lastUpdated,
    isConfigured,
    currentSheetName,
    selectSheet,
  } = useLiveAttendance();

  const availableSheets = getAvailableAttendanceSheets();

  // Filters State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [subjectQuery, setSubjectQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'present' | 'absent' | 'other'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Flatten raw Google Sheet attendance records to a flat list of individual student entries
  const allRecords = useMemo(() => {
    if (!attendanceData?.processed) return [];

    const list = [];
    let entryId = 1;

    attendanceData.processed.forEach((record) => {
      // each record has: timestamp, lectureTime, subject, attendanceByStudent
      record.attendanceByStudent?.forEach((student) => {
        list.push({
          id: entryId++,
          date: record.timestamp,
          lectureTime: record.lectureTime,
          subject: record.subject,
          studentId: student.studentId,
          studentName: student.studentName,
          status: student.status,
          present: student.present,
        });
      });
    });

    const parseDateString = (dateStr) => {
      if (!dateStr) return new Date(0);
      const str = String(dateStr).trim();
      const normalized = str.replace(/\//g, '-');
      const parts = normalized.split('-');
      if (parts.length === 3) {
        let day, month, year;
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          year = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10) - 1;
          day = parseInt(parts[2], 10);
        } else {
          // DD-MM-YYYY
          day = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10) - 1;
          year = parseInt(parts[2], 10);
          if (year < 100) {
            year += 2000;
          }
        }
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) {
          return d;
        }
      }
      const d = new Date(str);
      return isNaN(d.getTime()) ? new Date(0) : d;
    };

    // Sort descending by date/time (latest first)
    return list.sort((a, b) => {
      const dateA = parseDateString(a.date);
      const dateB = parseDateString(b.date);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateB - dateA;
      }
      return b.id - a.id;
    });
  }, [attendanceData]);

  // Extract unique students lists for the dropdown filter
  const uniqueStudents = useMemo(() => {
    const map = new Map();
    allRecords.forEach((r) => {
      if (r.studentId) {
        map.set(r.studentId, r.studentName);
      }
    });
    return Array.from(map.entries())
      .map(([studentId, name]) => ({ studentId, name }))
      .sort((a, b) => a.studentId.localeCompare(b.studentId, undefined, { numeric: true }));
  }, [allRecords]);

  // Apply filters
  const filteredRecords = useMemo(() => {
    return allRecords.filter((r) => {
      // Student filter
      if (selectedStudentId && r.studentId !== selectedStudentId) {
        return false;
      }

      // Subject filter
      if (subjectQuery) {
        const q = subjectQuery.toLowerCase().trim();
        if (!r.subject?.toLowerCase().includes(q)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all') {
        const isPresent = r.present;
        const statusLower = String(r.status || '').toLowerCase().trim();
        
        if (statusFilter === 'present') {
          if (!isPresent) return false;
        } else if (statusFilter === 'absent') {
          // Absent usually means present is false, but make sure it isn't leave/other if those are tracked
          if (isPresent || statusLower === 'leave' || statusLower === 'late' || statusLower === 'sick') return false;
        } else if (statusFilter === 'other') {
          // Leave or sick etc
          if (isPresent || statusLower === 'absent' || statusLower === '') return false;
        }
      }

      return true;
    });
  }, [allRecords, selectedStudentId, subjectQuery, statusFilter]);

  // Stats for the filtered selection
  const stats = useMemo(() => {
    const total = filteredRecords.length;
    let present = 0;
    let absent = 0;
    let other = 0;

    filteredRecords.forEach((r) => {
      if (r.present) {
        present++;
      } else {
        const statusLower = String(r.status || '').toLowerCase().trim();
        if (statusLower === 'absent' || statusLower === '') {
          absent++;
        } else {
          other++;
        }
      }
    });

    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, other, percentage };
  }, [filteredRecords]);

  // Pagination logic
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRecords.slice(startIndex, startIndex + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;

  // Handle filter changes (reset page to 1)
  const handleStudentChange = (id) => {
    setSelectedStudentId(id);
    setCurrentPage(1);
  };

  const handleSubjectChange = (e) => {
    setSubjectQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedStudentId('');
    setSubjectQuery('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = selectedStudentId || subjectQuery || statusFilter !== 'all';

  if (!isConfigured) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/50 dark:bg-amber-950/30 sm:p-8">
        <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-200">
          Google Sheets Not Configured
        </h2>
        <p className="mt-2 text-sm text-amber-800 dark:text-amber-300/90">
          Attendance data requires Google Sheets API credentials in .env
        </p>
      </div>
    );
  }

  if (loading && !allRecords.length) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-blue border-t-transparent" />
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading day by day attendance…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/30 sm:p-8">
        <h2 className="text-lg font-semibold text-red-900 dark:text-red-200">Error Loading Attendance</h2>
        <p className="mt-2 text-sm text-red-800 dark:text-red-300/90">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Filter Attendance</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Class Select Dropdown (Sheet selector) */}
          {availableSheets.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Select Class</label>
              <select
                value={currentSheetName}
                onChange={(e) => {
                  selectSheet(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-850 dark:text-white"
              >
                {availableSheets.map((sheet) => (
                  <option key={sheet} value={sheet}>
                    {sheet}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Student Filter */}
          <StudentIdFilter
            label="Select Student"
            value={selectedStudentId}
            onChange={handleStudentChange}
            students={uniqueStudents}
            layout="vertical"
          />

          {/* Subject Search */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Search Subject</label>
            <input
              type="text"
              placeholder="e.g. Physics, Chemistry"
              value={subjectQuery}
              onChange={handleSubjectChange}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-850 dark:text-white"
            />
          </div>

          {/* Status Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Status</label>
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-850 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="other">Other (Leave, Late, etc.)</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex justify-end pt-1">
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Sync Status Banner */}
      <div className="flex flex-col gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3.5 text-sm text-green-800 dark:border-green-900/40 dark:bg-green-950/20 dark:text-green-300 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
          </span>
          <span className="font-medium">
            Live Google Sheets Sync · {allRecords.length} total entries loaded for {currentSheetName}
          </span>
        </div>
        <span className="text-xs opacity-80">
          {lastUpdated ? `Last updated: ${new Date(lastUpdated).toLocaleTimeString()}` : 'Initializing...'}
        </span>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Selected Count</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Presents</p>
          <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">{stats.present}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Absents</p>
          <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.absent}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Attendance Rate</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.percentage}%</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900 dark:shadow-card-dark">
        <div className="overflow-x-auto">
          {paginatedRecords.length > 0 ? (
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Date</th>
                  <th className="px-5 py-3.5 font-semibold">Lecture Time</th>
                  <th className="px-5 py-3.5 font-semibold">Subject</th>
                  <th className="px-5 py-3.5 font-semibold">Student ID</th>
                  <th className="px-5 py-3.5 font-semibold">Student Name</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {paginatedRecords.map((record) => {
                  const isPresent = record.present;
                  const statusLower = String(record.status || '').toLowerCase().trim();

                  let statusBadgeClass = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-350';
                  if (isPresent) {
                    statusBadgeClass = 'bg-green-50 text-green-700 border border-green-100 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30';
                  } else if (statusLower === 'absent' || statusLower === '') {
                    statusBadgeClass = 'bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30';
                  } else {
                    // Leave, sick, late, etc.
                    statusBadgeClass = 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
                  }

                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-900 dark:text-white">
                        {record.date}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-655 dark:text-slate-350">
                        {record.lectureTime || '—'}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-655 dark:text-slate-350">
                        {record.subject || '—'}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-655 dark:text-slate-350">
                        {record.studentId}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-900 dark:text-white font-medium">
                        {record.studentName}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass}`}>
                          {record.status || (isPresent ? 'Present' : 'Absent')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 dark:text-slate-400">
              <svg
                className="h-10 w-10 text-slate-300 dark:text-slate-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="mt-3 text-sm font-semibold">No attendance entries match these criteria</p>
              <p className="mt-1 text-xs text-slate-400">Try adjusting your filters or selecting a different class.</p>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {filteredRecords.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/50 sm:flex-row">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries per page</span>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredRecords.length)} of {filteredRecords.length}{' '}
              entries
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-700 dark:disabled:hover:bg-slate-800 transition"
              >
                Previous
              </button>
              <div className="flex items-center px-1 text-xs font-semibold text-slate-750 dark:text-slate-300">
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-700 dark:disabled:hover:bg-slate-800 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
