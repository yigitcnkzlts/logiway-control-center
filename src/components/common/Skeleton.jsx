export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex gap-4 p-4 bg-white border border-slate-200 rounded-lg"
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <div
              key={colIdx}
              className="flex-1 h-4 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded animate-pulse"
              style={{
                animationDelay: `${colIdx * 50}ms`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 4, columns = 2 }) {
  return (
    <div className={`grid grid-cols-${columns} gap-4`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="p-4 bg-white border border-slate-200 rounded-lg space-y-3"
        >
          <div className="h-6 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded animate-pulse" />
          <div className="h-4 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded animate-pulse w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function TextSkeleton({ lines = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, idx) => (
        <div
          key={idx}
          className="h-4 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded animate-pulse"
          style={{
            width: idx === lines - 1 ? "80%" : "100%",
            animationDelay: `${idx * 50}ms`,
          }}
        />
      ))}
    </div>
  );
}
