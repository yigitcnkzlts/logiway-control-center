import Button from "./Button";

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-xs text-slate-500">
        Toplam <span className="font-semibold text-slate-900">{total}</span> kayıt •
        Sayfa <span className="font-semibold text-slate-900">{page}</span> /{" "}
        <span className="font-semibold text-slate-900">{totalPages}</span>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
        >
          {[5, 10, 20, 50].map((n) => (
            <option key={n} value={n}>
              {n} / sayfa
            </option>
          ))}
        </select>

        <Button variant="outline" onClick={() => onPageChange(1)} disabled={!canPrev}>
          İlk
        </Button>
        <Button variant="outline" onClick={() => onPageChange(page - 1)} disabled={!canPrev}>
          Geri
        </Button>
        <Button variant="outline" onClick={() => onPageChange(page + 1)} disabled={!canNext}>
          İleri
        </Button>
        <Button variant="outline" onClick={() => onPageChange(totalPages)} disabled={!canNext}>
          Son
        </Button>
      </div>
    </div>
  );
}
