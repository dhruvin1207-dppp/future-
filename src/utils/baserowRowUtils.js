const HIDDEN_KEYS = new Set(['order', 'created_on', 'updated_on', 'last_modified']);

export const rowToDisplayColumns = (rows) => {
  if (!rows?.length) return { columns: [], rows: [] };

  const sample = rows[0];
  const columns = Object.keys(sample).filter((k) => !HIDDEN_KEYS.has(k) && k !== 'id');

  const displayRows = rows.map((row) => {
    const cells = {};
    columns.forEach((col) => {
      const val = row[col];
      cells[col] =
        val === null || val === undefined
          ? '—'
          : typeof val === 'object'
            ? JSON.stringify(val)
            : String(val);
    });
    return { id: row.id, cells };
  });

  return { columns, rows: displayRows };
};
