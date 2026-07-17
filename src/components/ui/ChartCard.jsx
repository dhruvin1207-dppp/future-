export default function ChartCard({ title, subtitle, toolbar, children, className = '' }) {
  return (
    <div
      className={`flex flex-col rounded-xl border border-slate-100 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900 dark:shadow-card-dark sm:p-5 ${className}`}
    >
      <div className="shrink-0">
        <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
        {toolbar && <div className="mt-3">{toolbar}</div>}
      </div>
      <div className="relative mt-3 min-h-[220px] flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
