import { getStatusColor, getPriorityColor } from '../../services/taskManagementService';

/**
 * Task Table Component
 * Displays tasks with status and priority badges
 */
export default function TaskTable({ tasks = [] }) {
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
    if (s.includes('pending')) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
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
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
