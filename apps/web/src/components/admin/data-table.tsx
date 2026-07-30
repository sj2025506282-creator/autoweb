"use client";
interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

export function DataTable<T>({
  columns, data, onRowClick, idKey
}: {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  /** Optional key for stable row identity. Falls back to array index if omitted. */
  idKey?: keyof T;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.map((item, i) => (
            <tr key={idKey ? String(item[idKey]) : i} onClick={() => onRowClick?.(item)}
              className={onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}>
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm">
                  {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
