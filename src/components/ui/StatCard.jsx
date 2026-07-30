const colorMap = {
  blue: 'from-blue-500/10 to-blue-600/5 text-brand-blue border-blue-200/60 dark:border-blue-800/50',
  purple: 'from-purple-500/10 to-purple-600/5 text-brand-purple border-purple-200/60 dark:border-purple-800/50',
  green: 'from-emerald-500/10 to-emerald-600/5 text-emerald-600 border-emerald-200/60',
  amber: 'from-amber-500/10 to-amber-600/5 text-amber-600 border-amber-200/60',
  rose: 'from-rose-500/10 to-rose-600/5 text-rose-600 border-rose-200/60',
  indigo: 'from-indigo-500/10 to-indigo-600/5 text-indigo-600 border-indigo-200/60',
};

export default function StatCard({ title, value, icon, accent = 'blue', format, onClick }) {
  const display =
    typeof value !== 'number' && isNaN(Number(value))
      ? value
      : format === 'currency'
      ? `₹${Number(value).toLocaleString('en-IN')}`
      : Number(value).toLocaleString('en-IN');

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border bg-gradient-to-br p-3.5 sm:p-5 shadow-card transition hover:shadow-md dark:shadow-card-dark ${colorMap[accent]} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">{title}</p>
          <p className="mt-1.5 text-xl font-bold text-slate-900 dark:text-white sm:mt-2 sm:text-3xl">
            {display}
          </p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/80 text-current shadow-sm dark:bg-slate-800/80 sm:h-11 sm:w-11">
          {icon}
        </div>
      </div>
    </div>
  );
}
