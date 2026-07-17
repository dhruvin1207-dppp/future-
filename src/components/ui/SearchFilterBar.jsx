export default function SearchFilterBar({
  search,
  onSearchChange,
  classFilter,
  onClassChange,
  classes,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 sm:max-w-xs">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          placeholder="Search by name or student ID..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none ring-brand-blue/20 transition focus:border-brand-blue focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-brand-purple"
        />
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="class-filter" className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
          Filter by Class
        </label>
        <select
          id="class-filter"
          value={classFilter}
          onChange={(e) => onClassChange(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          {classes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
