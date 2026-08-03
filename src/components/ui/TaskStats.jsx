/**
 * Task Statistics Cards
 * Displays key task metrics: Total, Completed, In Progress, Pending, High Priority, Overdue
 */
export default function TaskStats({ stats, exclude = [], onCardClick, activeFilter }) {
  if (!stats) {
    const count = 6 - exclude.length;
    const gridCols = count === 4
      ? "grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4"
      : "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6";
    return (
      <div className={gridCols}>
        {[...Array(count)].map((_, i) => (
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
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: '✅',
      color: 'green',
    },
    {
      label: 'In Progress',
      value: stats.inProgress,
      icon: '⏳',
      color: 'amber',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: '⏸️',
      color: 'slate',
    },
    {
      label: 'High Priority',
      value: stats.highPriority,
      icon: '🔴',
      color: 'red',
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      icon: '⚠️',
      color: 'red',
    },
  ].filter(card => !exclude.includes(card.label));

  const gridCols = statCards.length === 4
    ? "grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4"
    : "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6";

  const getCardStyles = (color, isActive) => {
    const styles = {
      blue: {
        active: 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-400',
        inactive: 'border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/30 hover:border-blue-300'
      },
      green: {
        active: 'border-green-500 ring-2 ring-green-500/20 bg-green-50 dark:bg-green-950/40 dark:border-green-400',
        inactive: 'border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/30 hover:border-green-300'
      },
      slate: {
        active: 'border-slate-500 ring-2 ring-slate-500/20 bg-slate-100 dark:bg-slate-800 dark:border-slate-400',
        inactive: 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 hover:border-slate-300'
      },
      red: {
        active: 'border-red-500 ring-2 ring-red-500/20 bg-red-50 dark:bg-red-950/40 dark:border-red-400',
        inactive: 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 hover:border-red-300'
      },
      amber: {
        active: 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-400',
        inactive: 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 hover:border-amber-300'
      }
    };
    return styles[color] || styles.slate;
  };

  return (
    <div className={gridCols}>
      {statCards.map((card) => {
        const isActive = activeFilter === card.label;
        const isClickable = !!onCardClick;
        const style = getCardStyles(card.color, isActive);
        return (
          <div
            key={card.label}
            onClick={() => isClickable && onCardClick(card.label)}
            className={`rounded-lg border p-3 transition-all duration-200 ${
              isClickable ? 'cursor-pointer hover:scale-102 hover:shadow-md' : ''
            } ${isActive ? style.active : style.inactive}`}
          >
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</div>
            <div className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">{card.label}</div>
          </div>
        );
      })}
    </div>
  );
}
