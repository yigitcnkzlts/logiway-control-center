export default function Timeline({ items = [] }) {
  return (
    <div className="space-y-4">
      {items.map((item, idx) => (
        <div key={idx} className="flex gap-4">
          {/* Timeline dot */}
          <div className="flex flex-col items-center gap-2">
            <div className={`
              w-3 h-3 rounded-full border-2 border-white
              ${item.color || "bg-slate-400"}
            `} />
            {idx !== items.length - 1 && (
              <div className={`w-0.5 h-12 ${item.color || "bg-slate-300"}`} />
            )}
          </div>

          {/* Content */}
          <div className="pt-0.5 pb-4">
            <h4 className="text-sm font-semibold text-slate-900">
              {item.title}
            </h4>
            {item.description && (
              <p className="text-xs text-slate-600 mt-1">{item.description}</p>
            )}
            {item.time && (
              <p className="text-xs text-slate-500 mt-2">{item.time}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
