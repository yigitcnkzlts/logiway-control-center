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
  LogOut,
  Bell,
  Activity,
  TrendingUp,
} from "lucide-react";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const [openUsers, setOpenUsers] = useState(
    location.pathname.startsWith("/kullanicilar")
  );

  const menuSections = useMemo(
    () => [
      {
        title: "GENEL",
        items: [
          { to: "/dashboard", label: "Gösterge Paneli", icon: LayoutDashboard },
        ],
      },
      {
        title: "LOJİSTİK YÖNETİMİ",
        items: [
          { to: "/yuk-ilanlari", label: "Yük / İlanlar", icon: PackageSearch },
          { to: "/soforler", label: "Şoförler", icon: Truck },
          { to: "/araclar", label: "Araçlar", icon: Car },
          { to: "/eslesmeler", label: "Eşleşmeler", icon: Link2 },
        ],
      },
      {
        title: "YÖNETİM",
        items: [
          {
            label: "Kullanıcılar",
            icon: Users,
            children: [
              { to: "/kullanicilar", label: "Tüm Kullanıcılar" },
              { to: "/kullanicilar/dogrulama", label: "Doğrulama Bekleyenler" },
            ],
          },
          { to: "/ayarlar", label: "Ayarlar", icon: Settings },
        ],
      },
    ],
    []
  );

  // Admin profil verisi - daha sonra API'den çekip state'e atacağız
  const currentUser = {
    name: "Admin Kullanıcı",
    role: "Sistem Yöneticisi",
    avatar: "👤",
  };

  // İstatistik kartları - yapı hazır, sonra backend bağlantısı yapacağız
  const stats = useMemo(
    () => [
      { label: "Aktif Şoför", value: "247", icon: Truck },
      { label: "Bekleyen Yük", value: "32", icon: PackageSearch },
    ],
    []
  );

  return (
    <aside
      className={[
        "min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white border-r border-white/10",
        "flex flex-col",
        collapsed ? "w-[88px]" : "w-72",
        "transition-[width] duration-200",
      ].join(" ")}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 font-bold text-white text-xs">
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
          className="rounded-lg p-2 hover:bg-white/10 transition"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Stats Section - Sadece açıkken göster */}
      {!collapsed && (
        <div className="px-4 py-4 space-y-2 border-b border-white/5">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="bg-white/5 hover:bg-white/10 rounded-lg p-3 transition cursor-pointer border border-white/10"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white/70 font-medium">
                    {stat.label}
                  </span>
                  <Icon size={14} className="text-blue-400" />
                </div>
                <div className="text-lg font-bold text-white">{stat.value}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Menü - Scroll yapılabilir */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <nav className="space-y-6">
          {menuSections.map((section) => (
            <div key={section.title}>
              {/* Bölüm Başlığı */}
              {!collapsed && (
                <div className="px-3 py-2 mb-3">
                  <div className="text-xs font-semibold text-white/50 tracking-wider">
                    {section.title}
                  </div>
                </div>
              )}

              {/* Menü Öğeleri */}
              <div className="space-y-1">
                {section.items.map((item) => {
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
                          title={collapsed ? item.label : ""}
                        >
                          <Icon size={18} className="flex-shrink-0" />
                          {!collapsed && (
                            <>
                              <span className="text-sm">{item.label}</span>
                              <ChevronDown
                                size={16}
                                className={[
                                  "ml-auto transition flex-shrink-0",
                                  openUsers ? "rotate-180" : "",
                                ].join(" ")}
                              />
                            </>
                          )}
                        </button>

                        {!collapsed && openUsers && (
                          <div className="ml-8 mt-1 space-y-1 border-l border-white/10 pl-3">
                            {item.children.map((child) => (
                              <NavLink
                                key={child.to}
                                to={child.to}
                                className={({ isActive }) =>
                                  [
                                    "block rounded-lg px-3 py-2 text-sm",
                                    "hover:bg-white/10 transition",
                                    isActive
                                      ? "bg-blue-500/20 text-blue-300 border-l-2 border-blue-500"
                                      : "text-white/70 border-l-2 border-transparent",
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
                      title={collapsed ? item.label : ""}
                    >
                      <Icon size={18} className="flex-shrink-0" />
                      {!collapsed && <span className="text-sm">{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* User Profile Section - Alt kısım */}
      <div className="border-t border-white/5 p-3 space-y-3">
        {/* Bildirim / Sistem Durumu */}
        {!collapsed && (
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition cursor-pointer">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-white/70 flex-1">Sistem Aktif</span>
            <Activity size={14} className="text-green-500" />
          </div>
        )}

        {/* Kullanıcı Profili */}
        <div className="group">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition cursor-pointer">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">
              {currentUser.avatar}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">
                  {currentUser.name}
                </div>
                <div className="text-xs text-white/60 truncate">
                  {currentUser.role}
                </div>
              </div>
            )}
          </div>

          {/* Dropdown Menu - Sadece açıkken göster */}
          {!collapsed && (
            <div className="hidden group-hover:block absolute bottom-20 left-3 right-3 bg-slate-800 border border-white/10 rounded-lg shadow-lg z-50">
              <button className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition rounded-lg flex items-center gap-2 text-white/80">
                <Settings size={16} />
                Profil Ayarları
              </button>
              <button className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition rounded-lg flex items-center gap-2 text-red-400 border-t border-white/5">
                <LogOut size={16} />
                Çıkış Yap
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
