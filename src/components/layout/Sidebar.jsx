import { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
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
  ChevronDown,
} from "lucide-react";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const [openUsers, setOpenUsers] = useState(
    location.pathname.startsWith("/kullanicilar")
  );

  const items = useMemo(
    () => [
      { to: "/dashboard", label: "Gösterge Paneli", icon: LayoutDashboard },

      {
        label: "Kullanıcılar",
        icon: Users,
        children: [
          { to: "/kullanicilar", label: "Tüm Kullanıcılar" },
          { to: "/kullanicilar/dogrulama", label: "Doğrulama Bekleyenler" },
        ],
      },

      { to: "/yuk-ilanlari", label: "Yük / İlanlar", icon: PackageSearch },
      { to: "/soforler", label: "Şoförler", icon: Truck },
      { to: "/araclar", label: "Araçlar", icon: Car },
      { to: "/eslesmeler", label: "Eşleşmeler", icon: Link2 },
      { to: "/ayarlar", label: "Ayarlar", icon: Settings },
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
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Menü */}
      <div className="px-3">
        <nav className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;

            if (item.children) {
              const active = location.pathname.startsWith("/kullanicilar");

              return (
                <div key={item.label}>
                  <button
                    onClick={() => setOpenUsers((p) => !p)}
                    className={[
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5",
                      "hover:bg-white/10 transition",
                      active ? "bg-white/15 ring-1 ring-white/10" : "",
                    ].join(" ")}
                  >
                    <Icon size={18} />
                    {!collapsed && (
                      <>
                        <span className="text-sm">{item.label}</span>
                        <ChevronDown
                          size={16}
                          className={[
                            "ml-auto transition",
                            openUsers ? "rotate-180" : "",
                          ].join(" ")}
                        />
                      </>
                    )}
                  </button>

                  {!collapsed && openUsers && (
                    <div className="ml-11 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          className={({ isActive }) =>
                            [
                              "block rounded-xl px-3 py-2 text-sm",
                              "hover:bg-white/10 transition",
                              isActive
                                ? "bg-white/15 ring-1 ring-white/10"
                                : "text-white/80",
                            ].join(" ")
                          }
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5",
                    "hover:bg-white/10 transition",
                    isActive ? "bg-white/15 ring-1 ring-white/10" : "",
                  ].join(" ")
                }
              >
                <Icon size={18} />
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
