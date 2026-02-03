import { useState } from "react";
import { Bell, Search, LogOut, User } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="h-16 w-full border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold text-slate-900">
            Logiway Control Center
          </div>
          <span className="hidden rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 md:inline">
            v0.1
          </span>
        </div>

        <div className="hidden w-[420px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
          <Search size={16} className="text-slate-500" />
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            placeholder="Ara: kullanıcı, ilan, şoför..."
          />
        </div>

        <div className="relative flex items-center gap-2">
          <button className="rounded-xl p-2 hover:bg-slate-100" aria-label="Bildirimler">
            <Bell size={18} className="text-slate-700" />
          </button>

          <button
            onClick={() => setOpen((p) => !p)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-slate-100"
          >
            <div className="h-8 w-8 rounded-full bg-slate-200 grid place-items-center text-xs font-semibold text-slate-700">
              G
            </div>
            <div className="hidden text-left md:block">
              <div className="text-sm font-semibold text-slate-900">GÜÇ</div>
              <div className="text-xs text-slate-500">Admin</div>
            </div>
          </button>

          {open && (
            <div className="absolute right-0 top-[56px] w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
              <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-slate-100">
                <User size={16} /> Profil
              </button>
              <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-slate-100">
                <LogOut size={16} /> Çıkış
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
