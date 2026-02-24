export default function InfoGroup({
  items = [],
  columns = 2,
  className = "",
}) {
  const colClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  };

  return (
    <div className={`grid ${colClasses[columns]} gap-4 ${className}`}>
      {items.map((item, idx) => (
        <div key={idx} className="space-y-1">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            {item.label}
          </p>
          <p className="text-sm font-medium text-slate-900">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
