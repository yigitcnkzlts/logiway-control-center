export default function ShimmerEffect({ className = "" }) {
  return (
    <div className={`
      animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200
      bg-[length:200%_100%] animate-shimmer
      ${className}
    `} />
  );
}

export function ShimmerLine({ width = "w-full", height = "h-4", className = "" }) {
  return <ShimmerEffect className={`rounded ${width} ${height} mb-2 ${className}`} />;
}

export function ShimmerBlock({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <ShimmerLine width="w-1/4" height="h-3" />
          <ShimmerLine width="w-full" height="h-4" />
          <ShimmerLine width="w-3/4" height="h-4" />
        </div>
      ))}
    </div>
  );
}
