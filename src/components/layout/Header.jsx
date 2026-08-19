import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import LiveAttendanceIndicator from '../ui/LiveAttendanceIndicator';

export default function Header({
  title,
  subtitle,
  onMenuClick,
  onExport,
  refreshing,
  lastUpdated,
  dataSource,
  dashboardData,
  loading,
  activePage,
  selectedRowKeys = [],
  onAddClick,
  onEditClick,
  onDeleteClick,
  crudLoading = false,
}) {
  const { darkMode, toggleDarkMode } = useTheme();
  const { user, logout } = useAuth();

  const isCrudPage =
    activePage === 'students' ||
    activePage === 'timetable' ||
    activePage === 'exam' ||
    activePage === 'activeSession' ||
    activePage === 'fees' ||
    activePage === 'marks' ||
    activePage === 'teachers' ||
    activePage === 'newStudentInquiry' ||
    activePage === 'reception';

  const addLabel =
    activePage === 'students'
      ? 'Add Student'
      : activePage === 'exam'
      ? 'Add Exam'
      : activePage === 'marks'
      ? 'Add Marks'
      : activePage === 'activeSession'
      ? 'Add Session'
      : activePage === 'fees'
      ? 'Add Fee'
      : activePage === 'teachers'
      ? 'Add Teacher'
      : activePage === 'newStudentInquiry'
      ? 'Add Inquiry'
      : activePage === 'reception'
      ? 'Add Reception'
      : 'Add Entry';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      {/* Top row: menu toggle + title + utility buttons */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 sm:px-6 lg:px-8">
        {/* Left: hamburger + title */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="shrink-0 rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-slate-900 dark:text-white sm:text-2xl">{title}</h1>
            {subtitle && (
              <p className="hidden text-sm text-slate-500 dark:text-slate-400 sm:block">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right: utility controls */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {dashboardData?.liveAttendanceSource === 'google-sheets' && (
            <LiveAttendanceIndicator
              data={dashboardData}
              loading={loading}
              refreshing={refreshing}
            />
          )}
          {refreshing && (
            <span className="hidden items-center gap-1.5 text-xs text-brand-blue dark:text-brand-purple-light sm:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-blue" />
              Updating…
            </span>
          )}
          {lastUpdated && (
            <span className="hidden text-xs text-slate-400 xl:inline">
              Updated {new Date(lastUpdated).toLocaleTimeString()}
              {dataSource === 'mock' && ' · Demo data'}
            </span>
          )}

          {user && (
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                user.role === 'admin'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${user.role === 'admin' ? 'bg-indigo-600' : 'bg-emerald-600'}`} />
                {user.name} ({user.role.toUpperCase()})
              </span>
              <button
                type="button"
                onClick={logout}
                className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Logout
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onExport}
            className="hidden rounded-lg border border-brand-blue/30 bg-brand-blue/5 px-3 py-2 text-xs font-medium text-brand-blue transition hover:bg-brand-blue/10 dark:border-brand-purple/40 dark:bg-brand-purple/10 dark:text-brand-purple-light sm:block sm:text-sm"
          >
            Export
          </button>
          <button
            type="button"
            onClick={toggleDarkMode}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* CRUD action bar — second row on mobile for table pages */}
      {isCrudPage && (
        <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-2.5 dark:border-slate-800 sm:px-6 lg:px-8">
          {/* Add */}
          <button
            type="button"
            onClick={onAddClick}
            disabled={crudLoading}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none sm:flex-none sm:px-3.5 sm:text-sm"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>{addLabel}</span>
          </button>

          {/* Edit */}
          <button
            type="button"
            onClick={onEditClick}
            disabled={crudLoading || selectedRowKeys.length !== 1}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none sm:flex-none sm:px-3.5 sm:text-sm"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span>Edit</span>
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={onDeleteClick}
            disabled={crudLoading || selectedRowKeys.length === 0}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-500 shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none sm:flex-none sm:px-3.5 sm:text-sm"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Delete</span>
          </button>

          {/* Export — mobile only in this row */}
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center justify-center rounded-lg border border-brand-blue/30 bg-brand-blue/5 px-3 py-2 text-xs font-medium text-brand-blue transition hover:bg-brand-blue/10 dark:border-brand-purple/40 dark:bg-brand-purple/10 dark:text-brand-purple-light sm:hidden"
          >
            ↓
          </button>
        </div>
      )}
    </header>
  );
}
