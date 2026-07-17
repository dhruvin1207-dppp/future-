const labels = {
  students: 'Students',
  courses: 'Courses',
  teachers: 'Teachers',
  attendance: 'Attendance',
  fees: 'Fees',
  exams: 'Exams',
  reports: 'Reports',
};

export default function PlaceholderPage({ section }) {
  const title = labels[section] || section;

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-accent text-2xl text-white">
        {title.charAt(0)}
      </div>
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
        This section is ready for your Google Sheets data. Connect your API credentials in the{' '}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">.env</code>{' '}
        file to load live records.
      </p>
    </div>
  );
}
