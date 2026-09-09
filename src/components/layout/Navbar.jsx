import { useState } from "react";
import { Bell, ExternalLink, LogOut, Search, User } from "lucide-react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [open,setOpen]=useState(false);
  return <header className="sticky top-0 z-40 h-[76px] w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
    <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
      <div className="min-w-0"><div className="text-[10px] font-bold tracking-[.15em] text-slate-400">OPERASYON MERKEZİ</div><div className="mt-1 truncate text-sm font-bold text-slate-900">Logiway Yönetim Paneli</div></div>
      <div className="hidden max-w-[460px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 md:flex"><Search size={17} className="text-slate-400"/><input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="İlan, şoför, plaka veya kullanıcı ara…"/><kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">⌘ K</kbd></div>
      <div className="relative flex items-center gap-1.5"><Link to="/" className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 lg:flex">Siteyi görüntüle <ExternalLink size={14}/></Link><button className="relative rounded-xl p-2.5 hover:bg-slate-100" aria-label="Bildirimler"><Bell size={19} className="text-slate-600"/><i className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-rose-500"/></button><button onClick={()=>setOpen(!open)} className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-100"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#102a20] text-xs font-bold text-[#c8f368]">YC</span><span className="hidden text-left md:block"><strong className="block text-xs text-slate-900">Yiğit Can Kızıltaş</strong><small className="text-[10px] text-slate-500">Sistem yöneticisi</small></span></button>{open&&<div className="absolute right-0 top-[54px] w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/10"><div className="border-b border-slate-100 px-3 py-2"><strong className="block text-xs">Yönetici hesabı</strong><small className="text-[10px] text-slate-500">Tüm yetkiler açık</small></div><button className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-slate-100"><User size={16}/> Profil ve güvenlik</button><button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"><LogOut size={16}/> Çıkış yap</button></div>}</div>
    </div>
  </header>
}
