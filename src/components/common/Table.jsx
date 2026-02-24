import { ChevronUp, ChevronDown, Minus } from "lucide-react";
import Checkbox from "./Checkbox";

export default function Table({
  columns = [],
  rows = [],
  isLoading = false,
  selectable = false,
  selectedRows = [],
  onSelectRows,
  sortBy,
  onSort,
  onRowClick,
  hoverable = true,
}) {
  const handleSelectAll = () => {
    if (selectedRows.length === rows.length) {
      onSelectRows([]);
    } else {
      onSelectRows(rows.map((_, idx) => idx));
    }
  };

  const handleSelectRow = (idx) => {
    if (selectedRows.includes(idx)) {
      onSelectRows(selectedRows.filter((i) => i !== idx));
    } else {
      onSelectRows([...selectedRows, idx]);
    }
  };

  const getSortIcon = (columnKey) => {
    if (sortBy?.key !== columnKey) return null;
    return sortBy.dir === "asc" ? (
      <ChevronUp size={14} />
    ) : (
      <ChevronDown size={14} />
    );
  };

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {selectable && (
              <th className="w-12 px-4 py-3">
                <Checkbox
                  checked={selectedRows.length === rows.length && rows.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={`text-left px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider ${
                  col.sortable ? "cursor-pointer hover:bg-slate-100" : ""
                }`}
                onClick={() => col.sortable && onSort?.(col.key)}
                style={{ width: col.width }}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && getSortIcon(col.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="px-4 py-8 text-center text-slate-500"
              >
                Veri bulunamadı
              </td>
            </tr>
          ) : (
            rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={`border-b border-slate-200 ${
                  hoverable ? "hover:bg-slate-50" : ""
                } cursor-pointer transition`}
                onClick={() => onRowClick?.(row, rowIdx)}
              >
                {selectable && (
                  <td className="w-12 px-4 py-3">
                    <Checkbox
                      checked={selectedRows.includes(rowIdx)}
                      onChange={() => handleSelectRow(rowIdx)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-3 text-sm text-slate-900"
                    style={{ width: col.width }}
                  >
                    {col.render
                      ? col.render(row[col.key], row, rowIdx)
                      : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
