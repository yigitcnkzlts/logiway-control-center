import { useState, useMemo } from "react";
import Table from "./Table";
import Pagination from "./Pagination";
import SearchInput from "./SearchInput";
import Select from "./Select";

export default function DataTable({
  columns = [],
  data = [],
  searchFields = ["id", "name"],
  filters = [],
  selectable = false,
  onRowAction,
  pageSize = 10,
  loading = false,
}) {
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValues, setFilterValues] = useState(
    Object.fromEntries(filters.map((f) => [f.key, f.defaultValue || ""]))
  );
  const [sortBy, setSortBy] = useState(null);
  const [page, setPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState([]);

  // Filtreleme
  const filtered = useMemo(() => {
    let result = [...data];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((row) =>
        searchFields.some((field) =>
          String(row[field])
            .toLowerCase()
            .includes(q)
        )
      );
    }

    // Custom filters
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value) {
        result = result.filter((row) => row[key] == value);
      }
    });

    return result;
  }, [data, searchQuery, filterValues, searchFields]);

  // Sorting
  const sorted = useMemo(() => {
    if (!sortBy) return filtered;

    const clone = [...filtered];
    clone.sort((a, b) => {
      const aVal = a[sortBy.key];
      const bVal = b[sortBy.key];

      if (typeof aVal === "string") {
        return sortBy.dir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortBy.dir === "asc" ? aVal - bVal : bVal - aVal;
    });

    return clone;
  }, [filtered, sortBy]);

  // Pagination
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const totalPages = Math.ceil(sorted.length / pageSize);

  const handleSort = (key) => {
    if (sortBy?.key === key) {
      setSortBy({
        key,
        dir: sortBy.dir === "asc" ? "desc" : "asc",
      });
    } else {
      setSortBy({ key, dir: "asc" });
    }
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="space-y-3">
        <SearchInput
          placeholder="Ara..."
          value={searchQuery}
          onChange={setSearchQuery}
        />

        {filters.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filters.map((filter) => (
              <Select
                key={filter.key}
                placeholder={filter.label}
                options={filter.options || []}
                value={filterValues[filter.key]}
                onChange={(val) =>
                  setFilterValues((prev) => ({ ...prev, [filter.key]: val }))
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <Table
        columns={columns}
        rows={paged}
        selectable={selectable}
        selectedRows={selectedRows}
        onSelectRows={setSelectedRows}
        sortBy={sortBy}
        onSort={handleSort}
        onRowClick={onRowAction}
        isLoading={loading}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Info */}
      <div className="text-xs text-slate-600">
        Toplam: <span className="font-semibold">{sorted.length}</span> |{" "}
        Gösterilen: {paged.length}
      </div>
    </div>
  );
}
