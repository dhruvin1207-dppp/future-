import { getStatusColor, getPriorityColor } from '../../services/taskManagementService';

/**
 * Task Table Component — with inline Edit and Delete buttons per row
 */
export default function TaskTable({ tasks = [], onEdit, onDelete }) {
  if (!tasks.length) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-slate-500 dark:text-slate-400">
        No tasks found
      </div>
    );
  }

  const getStatusBgColor = (status) => {
    const s = String(status).toLowerCase();
    if (s.includes('completed') || s.includes('done')) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    if (s.includes('progress')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    if (s.includes('hold')) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  };

  const getPriorityBgColor = (priority) => {
    const p = String(priority).toLowerCase();
    if (p.includes('urgent') || p.includes('critical')) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    if (p.includes('high')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    if (p.includes('medium')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Task</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Assignee ID</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Due Date</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Priority</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Status</th>
            {(onEdit || onDelete) && (
              <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="group border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
              <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                <div className="max-w-xs truncate font-medium">{task.name}</div>
              </td>
              <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                {task.assigneeId || '—'}
              </td>
              <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                {task.dueDate || '—'}
              </td>
              <td className="px-4 py-3 text-sm">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getPriorityBgColor(task.priority)}`}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
              </td>
              <td className="px-4 py-3 text-sm">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBgColor(task.status)}`}>
                  {task.rawStatus}
                </span>
              </td>
              {(onEdit || onDelete) && (
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(task)}
                        title="Edit task"
                        className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 hover:border-brand-blue hover:text-brand-blue dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-brand-blue transition-colors"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(task)}
                        title="Delete task"
                        className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 hover:border-rose-500 hover:text-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-rose-500 transition-colors"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
