import { useLiveAttendance } from '../hooks/useLiveAttendance';
import { getAvailableAttendanceSheets } from '../services/googleSheetsClient';
import BaserowDataTable from '../components/tables/BaserowDataTable';

/**
 * Attendance Table from Google Sheets
 * Shows live attendance data with real-time refresh
 * Supports multiple attendance sheets
 */
export default function GoogleSheetsAttendanceTable() {
  const { summaryByStudent, loading, error, lastUpdated, isConfigured, currentSheetName, selectSheet } =
    useLiveAttendance();
  const availableSheets = getAvailableAttendanceSheets();

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

  if (loading && !summaryByStudent.length) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-blue border-t-transparent" />
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading attendance…</p>
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

  // Format data for BaserowDataTable
  const rows = (summaryByStudent || []).map((student) => ({
    student_id: student.studentId,
    student_name: student.studentName,
    present_count: student.presentCount,
    total_classes: student.totalCount,
    attendance_percentage: `${student.percentage}%`,
  }));

  return (
    <div className="space-y-4">
      {/* Sheet Selector */}
      {availableSheets.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Select Class:</label>
          <select
            value={currentSheetName}
            onChange={(e) => selectSheet(e.target.value)}
            className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:border-slate-500"
          >
            {availableSheets.map((sheet) => (
              <option key={sheet} value={sheet}>
                {sheet}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300">
        <span>
          🔴 Live data from Google Sheets · {summaryByStudent.length} students · Real-time sync
        </span>
        <span className="text-xs opacity-80">
          {lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleTimeString()}` : 'Initializing...'}
        </span>
      </div>

      {/* Data Table */}
      <div className="rounded-xl border border-slate-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900 dark:shadow-card-dark">
        {rows.length ? (
          <BaserowDataTable rows={rows} />
        ) : (
          <div className="flex min-h-[200px] items-center justify-center text-slate-500 dark:text-slate-400">
            No attendance data yet
          </div>
        )}
      </div>
    </div>
  );
}
