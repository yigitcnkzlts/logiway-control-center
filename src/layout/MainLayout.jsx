import { NavLink } from "react-router-dom";
import { LayoutDashboard, PackageSearch, Route, Settings, Truck } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import Footer from "../components/layout/Footer";

const mobileNav = [
  ["/dashboard", "Özet", <LayoutDashboard size={19}/>],
  ["/yuk-ilanlari", "Yükler", <PackageSearch size={19}/>],
  ["/eslesmeler", "Eşleşme", <Route size={19}/>],
  ["/soforler", "Sürücüler", <Truck size={19}/>],
  ["/ayarlar", "Ayarlar", <Settings size={19}/>],
];

export default function MainLayout({ children }) {
  return <div className="flex min-h-screen bg-[#f5f7f4] text-slate-900">
    <div className="hidden shrink-0 lg:block"><Sidebar /></div>
    <div className="flex min-w-0 flex-1 flex-col">
      <Navbar />
      <main className="flex-1 pb-24 lg:pb-0"><div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">{children}</div></main>
      <div className="hidden lg:block"><Footer /></div>
      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-2xl shadow-slate-900/15 backdrop-blur lg:hidden" aria-label="Mobil uygulama menüsü">
        {mobileNav.map(([to,label,icon]) => <NavLink key={to} to={to} className={({isActive}) => `flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold ${isActive ? "bg-[#102a20] text-[#c8f368]" : "text-slate-500"}`}>{icon}<span className="truncate">{label}</span></NavLink>)}
      </nav>
    </div>
  </div>;
}
