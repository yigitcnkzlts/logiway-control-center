import { useMemo, useState } from "react";
import PageHeader from "../components/layout/PageHeader";

import KpiCard from "../components/dashboard/KpiCard.jsx";
import StatusSummary from "../components/dashboard/StatusSummary.jsx";
import ActivityList from "../components/dashboard/ActivityList.jsx";
import QuickActions from "../components/dashboard/QuickActions.jsx";
import DashboardToolbar from "../components/dashboard/DashboardToolbar.jsx";
import RecentLoadsTable from "../components/dashboard/RecentLoadsTable.jsx";
import PendingQueue from "../components/dashboard/PendingQueue.jsx";
import AlertsPanel from "../components/dashboard/AlertsPanel.jsx";

import "../components/dashboard/Dashboard.css";
import { Link2, PackageSearch, Truck, Users } from "lucide-react";

export default function Dashboard() {
  const [range, setRange] = useState("7d");

  const kpis = useMemo(() => {
    if (range === "today") {
      return [
        { title: "Toplam Kullanıcı", value: "1.284", helper: "Bugün +8", icon: <Users size={17}/> },
        { title: "Aktif İlan", value: "312", helper: "Bugün +12", icon: <PackageSearch size={17}/> },
        { title: "Şoför Sayısı", value: "487", helper: "Online 54", icon: <Truck size={17}/> },
        { title: "Eşleşme Oranı", value: "%62", helper: "Bugün +1 puan", icon: <Link2 size={17}/> },
      ];
    }
    if (range === "30d") {
      return [
        { title: "Toplam Kullanıcı", value: "1.284", helper: "30 günde +9%", icon: <Users size={17}/> },
        { title: "Aktif İlan", value: "312", helper: "30 günde +168", icon: <PackageSearch size={17}/> },
        { title: "Şoför Sayısı", value: "487", helper: "Doğrulanmış 410", icon: <Truck size={17}/> },
        { title: "Eşleşme Oranı", value: "%62", helper: "30 günde +5 puan", icon: <Link2 size={17}/> },
      ];
    }
    return [
      { title: "Toplam Kullanıcı", value: "1.284", helper: "Son 7 gün +4%", icon: <Users size={17}/> },
      { title: "Aktif İlan", value: "312", helper: "Son 7 gün +48", icon: <PackageSearch size={17}/> },
      { title: "Şoför Sayısı", value: "487", helper: "Doğrulanmış 410", icon: <Truck size={17}/> },
      { title: "Eşleşme Oranı", value: "%62", helper: "Haftalık +3 puan", icon: <Link2 size={17}/> },
    ];
  }, [range]);

  const statusItems = useMemo(
    () => [
      { key: "active", label: "Aktif", value: 312 },
      { key: "pending", label: "Onay Bekliyor", value: 9 },
      { key: "matched", label: "Eşleşti", value: 194 },
      { key: "cancelled", label: "İptal", value: 3 },
    ],
    []
  );

  const activities = useMemo(
    () => [
      { id: 1, text: "Yeni ilan eklendi: İstanbul → Ankara", time: "2 dk önce" },
      { id: 2, text: "Şoför doğrulandı: Ahmet K.", time: "18 dk önce" },
      { id: 3, text: "Eşleşme tamamlandı: #LW-1024", time: "1 saat önce" },
      { id: 4, text: "Araç durumu güncellendi: 34 ABC 123", time: "2 saat önce" },
    ],
    []
  );

  const recentLoads = useMemo(
    () => [
      {
        id: 1,
        code: "LW-1284",
        route: "İstanbul → Ankara",
        weight: "12 ton",
        statusText: "Aktif",
        statusTone: "tone-green",
        date: "04.02.2026",
      },
      {
        id: 2,
        code: "LW-1283",
        route: "İzmir → Bursa",
        weight: "8 ton",
        statusText: "Onay Bekliyor",
        statusTone: "tone-amber",
        date: "04.02.2026",
      },
      {
        id: 3,
        code: "LW-1282",
        route: "Kocaeli → Adana",
        weight: "20 ton",
        statusText: "Eşleşti",
        statusTone: "tone-blue",
        date: "03.02.2026",
      },
      {
        id: 4,
        code: "LW-1281",
        route: "Tekirdağ → İstanbul",
        weight: "5 ton",
        statusText: "İptal",
        statusTone: "tone-red",
        date: "03.02.2026",
      },
    ],
    []
  );

  const pendingItems = useMemo(
    () => [
      { id: 1, title: "İlan Onayı", sub: "İzmir → Bursa • 8 ton", badge: "Onay", tone: "tone-amber" },
      { id: 2, title: "Şoför Evrak Kontrol", sub: "Mehmet Y. • SRC / Ehliyet", badge: "Kontrol", tone: "tone-blue" },
      { id: 3, title: "Araç Bakım Uyarısı", sub: "34 ABC 123 • Bakım tarihi yaklaşıyor", badge: "Uyarı", tone: "tone-red" },
    ],
    []
  );

  const alerts = useMemo(
    () => [
      { id: 1, title: "Evrak eksiği", sub: "2 şoför doğrulama bekliyor", level: "Orta", tone: "tone-amber" },
      { id: 2, title: "Bakım gecikmesi", sub: "1 araç bakım tarihi geçmiş", level: "Kritik", tone: "tone-red" },
      { id: 3, title: "İptal artışı", sub: "Son 24 saatte 3 iptal", level: "Düşük", tone: "tone-blue" },
    ],
    []
  );

  const openLoad = (x) => {
    console.log("Detay:", x);
  };

  return (
    <>
      <PageHeader
        breadcrumb="Ana Sayfa / Gösterge Paneli"
        title="Gösterge Paneli"
        description="Genel sistem durumu ve operasyonel özet"
      />

      <div className="lw-dashboard">
        <DashboardToolbar range={range} onChangeRange={setRange} />

        <div className="lw-grid">
          <div className="lw-col-3"><KpiCard {...kpis[0]} /></div>
          <div className="lw-col-3"><KpiCard {...kpis[1]} /></div>
          <div className="lw-col-3"><KpiCard {...kpis[2]} /></div>
          <div className="lw-col-3"><KpiCard {...kpis[3]} /></div>

          <div className="lw-col-6"><StatusSummary items={statusItems} /></div>
          <div className="lw-col-6"><ActivityList items={activities} /></div>

          <div className="lw-col-8"><RecentLoadsTable items={recentLoads} onOpen={openLoad} /></div>
          <div className="lw-col-4"><AlertsPanel items={alerts} /></div>

          <div className="lw-col-8"><PendingQueue items={pendingItems} /></div>
          <div className="lw-col-4"><QuickActions /></div>
        </div>
      </div>
    </>
  );
}
