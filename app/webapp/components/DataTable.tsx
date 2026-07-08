import type { ReactNode } from 'react';

export type Column<T> = {
  key: string;
  header: string;
  align?: 'right' | 'center';
  render?: (row: T) => ReactNode;
};

function alignClass(align?: 'right' | 'center'): string | undefined {
  if (align === 'right') return 'ta-right';
  if (align === 'center') return 'ta-center';
  return undefined;
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
}: {
  columns: Column<T>[];
  rows: T[];
}) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={alignClass(c.align)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c.key} className={alignClass(c.align)}>
                  {c.render ? c.render(row) : (row[c.key] as ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
