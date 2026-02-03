export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 text-sm text-slate-500">
        <span>© {new Date().getFullYear()} Logiway Control Center</span>
        <span className="hidden md:inline">Durum: Online</span>
      </div>
    </footer>
  );
}