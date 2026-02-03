export default function Input({ className = "", ...props }) {
  return (
    <input
      className={[
        "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm",
        "outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
        "placeholder:text-slate-400",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
