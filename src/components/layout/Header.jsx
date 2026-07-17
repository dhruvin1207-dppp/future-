import { useTheme } from '../../context/ThemeContext';
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

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">{title}</h1>
            {subtitle && (
              <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {dashboardData?.liveAttendanceSource === 'google-sheets' && (
            <LiveAttendanceIndicator
              data={dashboardData}
              loading={loading}
              refreshing={refreshing}
            />
          )}
          {refreshing && (
            <span className="flex items-center gap-1.5 text-xs text-brand-blue dark:text-brand-purple-light">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-blue" />
              Updating…
            </span>
          )}
          {lastUpdated && (
            <span className="hidden text-xs text-slate-400 sm:inline">
              Updated {new Date(lastUpdated).toLocaleTimeString()}
              {dataSource === 'mock' && ' · Demo data'}
            </span>
          )}
          
          {(activePage === 'students' || activePage === 'timetable' || activePage === 'exam' || activePage === 'marks') && (
            <>
              <button
                type="button"
                onClick={onAddClick}
                disabled={crudLoading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">
                  {activePage === 'students' ? 'Add Student' : activePage === 'exam' ? 'Add Exam' : activePage === 'marks' ? 'Add Marks' : 'Add Entry'}
                </span>
              </button>
              
              <button
                type="button"
                onClick={onEditClick}
                disabled={crudLoading || selectedRowKeys.length !== 1}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span className="hidden sm:inline">Edit</span>
              </button>
              
              <button
                type="button"
                onClick={onDeleteClick}
                disabled={crudLoading || selectedRowKeys.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="hidden sm:inline">Delete</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onExport}
            className="rounded-lg border border-brand-blue/30 bg-brand-blue/5 px-3 py-2 text-sm font-medium text-brand-blue transition hover:bg-brand-blue/10 dark:border-brand-purple/40 dark:bg-brand-purple/10 dark:text-brand-purple-light"
          >
            Export Report
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
    </header>
  );
}
