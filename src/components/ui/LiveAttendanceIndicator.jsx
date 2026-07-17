import { useEffect, useState } from 'react';

/**
 * Live Attendance Status Indicator
 * Shows real-time status from Google Sheets with last update timestamp
 */
export default function LiveAttendanceIndicator({ data, loading, refreshing }) {
  const [displayText, setDisplayText] = useState('Initializing...');
  const isFromGoogleSheets = data?.liveAttendanceSource === 'google-sheets';
  const lastUpdate = data?.lastAttendanceUpdate;

  useEffect(() => {
    if (loading) {
      setDisplayText('Loading attendance data...');
    } else if (refreshing) {
      setDisplayText('Refreshing...');
    } else if (lastUpdate) {
      const date = new Date(lastUpdate);
      const now = new Date();
      const diffMs = now - date;
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);

      if (diffSecs < 60) {
        setDisplayText(`Updated ${diffSecs}s ago`);
      } else if (diffMins < 60) {
        setDisplayText(`Updated ${diffMins}m ago`);
      } else {
        setDisplayText(`Updated ${date.toLocaleTimeString()}`);
      }
    }
  }, [loading, refreshing, lastUpdate]);

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
        loading
          ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          : isFromGoogleSheets
            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
      }`}
    >
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          refreshing
            ? 'animate-pulse bg-current'
            : isFromGoogleSheets
              ? 'bg-green-500'
              : 'bg-amber-500'
        }`}
      />
      <span>
        {isFromGoogleSheets && '🔴 Live Sheets: '}
        {data?.liveAttendanceSource === 'baserow-fallback' && '⚠️ Baserow: '}
        {displayText}
      </span>
    </div>
  );
}
