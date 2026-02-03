import PageHeader from "../components/layout/PageHeader";

export default function Dashboard() {
  return (
    <>
      <PageHeader
        breadcrumb="Ana Sayfa / Gösterge Paneli"
        title="Gösterge Paneli"
        description="Genel sistem durumu ve özet bilgiler"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Toplam Kullanıcı" value="1.284" sub="Son 7 gün +4%" />
        <StatCard title="Aktif İlan" value="312" sub="Bugün +12" />
        <StatCard title="Şoför Sayısı" value="487" sub="Doğrulanmış 410" />
        <StatCard title="Eşleşme Oranı" value="%62" sub="Haftalık +3 puan" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 xl:col-span-2">
          <div className="text-sm font-semibold text-slate-900">Son Aktiviteler</div>
          <div className="mt-4 space-y-3">
            <ActivityRow text="Yeni ilan eklendi: İstanbul → Ankara" time="2 dk önce" />
            <ActivityRow text="Şoför doğrulandı: Ahmet K." time="18 dk önce" />
            <ActivityRow text="Eşleşme tamamlandı: #LW-1024" time="1 saat önce" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-semibold text-slate-900">Hızlı Özet</div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Bekleyen onay</span>
              <span className="font-semibold text-slate-900">9</span>
            </div>
            <div className="flex items-center justify-between">
              <span>İptal edilen</span>
              <span className="font-semibold text-slate-900">3</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Bugün giriş</span>
              <span className="font-semibold text-slate-900">56</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ title, value, sub }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{sub}</div>
    </div>
  );
}

function ActivityRow({ text, time }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
      <div className="text-sm text-slate-700">{text}</div>
      <div className="text-xs text-slate-500">{time}</div>
    </div>
  );
}
