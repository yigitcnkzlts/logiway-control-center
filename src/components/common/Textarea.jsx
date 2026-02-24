export default function Textarea({
  className = "",
  placeholder = "",
  rows = 4,
  ...props
}) {
  return (
    <textarea
      className={[
        "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm",
        "outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
        "placeholder:text-slate-400 resize-none",
        className,
      ].join(" ")}
      placeholder={placeholder}
      rows={rows}
      {...props}
    />
  );
}
