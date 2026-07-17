/**
 * Task Statistics Cards
 * Displays key task metrics: Total, Completed, In Progress, Pending, High Priority, Overdue
 */
export default function TaskStats({ stats }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
        ))}
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Tasks',
      value: stats.total,
      icon: '📋',
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: '✅',
      color: 'green',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
    },
    {
      label: 'In Progress',
      value: stats.inProgress,
      icon: '⏳',
      color: 'amber',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: '⏸️',
      color: 'slate',
      bgColor: 'bg-slate-50 dark:bg-slate-800',
    },
    {
      label: 'High Priority',
      value: stats.highPriority,
      icon: '🔴',
      color: 'red',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      icon: '⚠️',
      color: 'red',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {statCards.map((card) => (
        <div
          key={card.label}
          className={`rounded-lg border border-${card.color}-200 ${card.bgColor} p-3 dark:border-${card.color}-900/50`}
        >
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</div>
          <div className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
