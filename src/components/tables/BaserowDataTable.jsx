import { rowToDisplayColumns } from '../../utils/baserowRowUtils';

export default function BaserowDataTable({
  rows,
  selectable = false,
  selectedRowKeys = [],
  onSelectToggle = null,
  onSelectAll = null,
}) {
  const { columns, rows: displayRows } = rowToDisplayColumns(rows);

  if (!displayRows.length) {
    return (
      <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
        No rows in this table yet.
      </p>
    );
  }

  // Always use the unique row.id as the key — the parent (SectionTablePage / App.jsx)
  // is responsible for computing the right display/selection key per section.
  const allSelected =
    displayRows.length > 0 &&
    displayRows.every((row) => selectedRowKeys.includes(String(row.id)));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead className="sticky top-0 bg-slate-50/95 backdrop-blur dark:bg-slate-900/95 z-10 border-b border-slate-100 dark:border-slate-800">
          <tr className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {selectable && (
              <th className="w-12 px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  className="h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue dark:border-slate-700 dark:bg-slate-800"
                />
              </th>
            )}
            {columns.map((col) => (
              <th key={col} className="px-4 py-3 font-semibold whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row) => {
            const rowKey = String(row.id);
            const isSelected = selectedRowKeys.includes(rowKey);

            return (
              <tr
                key={row.id}
                className={`border-b border-slate-50 transition-colors dark:border-slate-800/80 ${
                  isSelected
                    ? 'bg-blue-50/50 hover:bg-blue-50 dark:bg-slate-800/60 dark:hover:bg-slate-800/80'
                    : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                }`}
              >
                {selectable && (
                  <td className="w-12 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelectToggle?.(rowKey)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue dark:border-slate-700 dark:bg-slate-800"
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={col}
                    className="px-4 py-3.5 text-slate-700 dark:text-slate-300 whitespace-nowrap"
                  >
                    {row.cells[col]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
