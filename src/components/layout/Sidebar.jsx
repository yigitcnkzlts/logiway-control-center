import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  PackageSearch,
  Truck,
  Car,
  Link2,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  const items = useMemo(
    () => [
      { to: "/dashboard", label: "Gösterge Paneli", icon: LayoutDashboard },
      { to: "/kullanicilar", label: "Kullanıcılar", icon: Users },
      { to: "/yuk-ilanlari", label: "Yük / İlanlar", icon: PackageSearch },
      { to: "/soforler", label: "Şoförler", icon: Truck },

      // ✅ Araçlar aktif
      { to: "/araclar", label: "Araçlar", icon: Car },

      // ✅ Eşleşmeler aktif (disabled kaldırıldı)
      { to: "/eslesmeler", label: "Eşleşmeler", icon: Link2 },

      // ⏳ Sonra açılacaklar
      { to: "/ayarlar", label: "Ayarlar", icon: Settings, disabled: true },
    ],
    []
  );

  return (
    <aside
      className={[
        "min-h-screen bg-slate-900 text-white border-r border-white/10",
        collapsed ? "w-[88px]" : "w-72",
        "transition-[width] duration-200",
      ].join(" ")}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 font-bold">
            LW
          </div>

          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-semibold">Logiway</div>
              <div className="text-xs text-white/60">Control Center</div>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed((p) => !p)}
          className="rounded-lg p-2 hover:bg-white/10"
          aria-label="Sidebar daralt"
          title="Sidebar daralt"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Menü */}
      <div className="px-3">
        {!collapsed && (
          <div className="mb-3 px-2 text-[11px] uppercase tracking-wider text-white/50">
            Menü
          </div>
        )}

        <nav className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;

            if (item.disabled) {
              return (
                <div
                  key={item.to}
                  className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 opacity-40"
                  title="Bu modül yakında eklenecek"
                >
                  <Icon size={18} />
                  {!collapsed && <span className="text-sm">{item.label}</span>}
                </div>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition",
                    "hover:bg-white/10",
                    isActive ? "bg-white/15 ring-1 ring-white/10" : "",
                  ].join(" ")
                }
              >
                <Icon size={18} className="opacity-90" />
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Alt bilgi */}
      <div className="mt-6 px-4">
        <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          {!collapsed ? (
            <>
              <div className="text-xs text-white/60">Hatırlatma</div>
              <div className="mt-1 text-sm font-semibold">
                Bekleyen onayları kontrol et
              </div>
            </>
          ) : (
            <div className="text-center text-xs text-white/60">İpucu</div>
          )}
        </div>
      </div>
    </aside>
  );
}
