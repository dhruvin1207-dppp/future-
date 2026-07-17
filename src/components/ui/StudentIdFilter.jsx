export default function StudentIdFilter({ label, value, onChange, studentIds = [], students = [] }) {
  // Build options from `students` if provided (shows "ID - Name"), otherwise fallback to `studentIds`.
  const options = (students && students.length)
    ? students.map((s) => ({ id: s.studentId, name: s.name }))
    : (studentIds || []).map((id) => ({ id, name: null }));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      >
        <option value="">All Students</option>
        {options.map(({ id, name }) => (
          <option key={id} value={id}>
            {name ? `${id} - ${name}` : id}
          </option>
        ))}
      </select>
    </div>
  );
}
