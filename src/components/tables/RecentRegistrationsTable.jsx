export default function RecentRegistrationsTable({ students }) {
  if (!students.length) {
    return (
      <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        No students match your search or filter.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <th className="px-4 py-3 font-semibold">Student ID</th>
            <th className="px-4 py-3 font-semibold">Name</th>
            <th className="px-4 py-3 font-semibold">Class</th>
            <th className="px-4 py-3 font-semibold">Section</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr
              key={student.id}
              className="border-b border-slate-50 transition hover:bg-slate-50/80 dark:border-slate-800/80 dark:hover:bg-slate-800/50"
            >
              <td className="px-4 py-3.5 font-medium text-brand-blue dark:text-brand-purple-light">
                {student.studentId}
              </td>
              <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-white">
                {student.name}
              </td>
              <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">{student.className}</td>
              <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">{student.section}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
