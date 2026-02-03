import { useMemo, useState } from "react";
import {
  Link2,
  TrendingUp,
  Filter,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { matches as allMatches } from "../data/matches";

/* ---------------- CONFIG ---------------- */

const statusMap = {
  uygun: { label: "Uygun", badge: "bg-emerald-100 text-emerald-700" },
  kismi: { label: "Kısmi", badge: "bg-amber-100 text-amber-700" },
  uygun_degil: { label: "Uygun Değil", badge: "bg-rose-100 text-rose-700" },
};

/* ---------------- SMALL UI ---------------- */

function ScoreBar({ score }) {
  const color =
    score >= 80
      ? "bg-emerald-500"
      : score >= 50
      ? "bg-amber-500"
      : "bg-rose-500";

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-28 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium">{score}%</span>
    </div>
  );
}

function SummaryCard({ title, value, tone }) {
  const tones = {
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
  };

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className={`mt-2 text-2xl font-semibold ${tones[tone] || ""}`}>
        {value}
      </div>
    </div>
  );
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-full px-3 py-1.5 text-sm transition",
        active
          ? "bg-black text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/* ---------------- PAGE ---------------- */

export default function Matches() {
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredMatches = useMemo(() => {
    if (statusFilter === "all") return allMatches;
    return allMatches.filter((m) => m.status === statusFilter);
  }, [statusFilter]);

  const stats = useMemo(
    () => ({
      total: allMatches.length,
      uygun: allMatches.filter((m) => m.status === "uygun").length,
      kismi: allMatches.filter((m) => m.status === "kismi").length,
      uygunDegil: allMatches.filter((m) => m.status === "uygun_degil").length,
    }),
    []
  );

  return (
    <div className="space-y-8 p-4">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Eşleşmeler</h1>
          <p className="mt-1 text-sm text-gray-500">
            Araçlar ile yük ilanları arasındaki uyum analizleri
          </p>
        </div>

        <button className="flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm text-white">
          <TrendingUp size={16} />
          Skora Göre Yenile
        </button>
      </div>

      {/* SUMMARY */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Toplam Eşleşme" value={stats.total} />
        <SummaryCard title="Uygun" value={stats.uygun} tone="emerald" />
        <SummaryCard title="Kısmi" value={stats.kismi} tone="amber" />
        <SummaryCard title="Uygun Değil" value={stats.uygunDegil} tone="rose" />
      </div>

      {/* INSIGHTS */}
      <div className="grid gap-4 md:grid-cols-3">
        <Insight
          icon={<Activity />}
          title="Yüksek Uyum Oranı"
          desc="Eşleşmelerin %60'ı yüksek uyumlu."
        />
        <Insight
          icon={<AlertTriangle />}
          title="Düşük Skor Uyarısı"
          desc="Bazı eşleşmeler manuel kontrol gerektiriyor."
        />
        <Insight
          icon={<TrendingUp />}
          title="Algoritma Verimliliği"
          desc="Son 24 saatte eşleşme kalitesi arttı."
        />
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter size={16} className="text-gray-400" />
        <FilterButton active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
          Tümü
        </FilterButton>
        <FilterButton active={statusFilter === "uygun"} onClick={() => setStatusFilter("uygun")}>
          Uygun
        </FilterButton>
        <FilterButton active={statusFilter === "kismi"} onClick={() => setStatusFilter("kismi")}>
          Kısmi
        </FilterButton>
        <FilterButton
          active={statusFilter === "uygun_degil"}
          onClick={() => setStatusFilter("uygun_degil")}
        >
          Uygun Değil
        </FilterButton>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3">Eşleşme</th>
              <th className="px-4 py-3">Araç</th>
              <th className="px-4 py-3">Yük</th>
              <th className="px-4 py-3">Skor</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Tarih</th>
            </tr>
          </thead>

          <tbody>
            {filteredMatches.map((m) => {
              const status = statusMap[m.status];
              return (
                <tr
                  key={m.id}
                  className="border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium flex items-center gap-2">
                    <Link2 size={14} className="text-gray-400" />
                    {m.id}
                  </td>
                  <td className="px-4 py-3">{m.vehiclePlate}</td>
                  <td className="px-4 py-3">{m.loadTitle}</td>
                  <td className="px-4 py-3">
                    <ScoreBar score={m.score} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs ${status.badge}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{m.createdAt}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* FOOT INFO */}
      <div className="rounded-xl border bg-white p-4 text-sm text-gray-600">
        <strong>Eşleşme Skoru Nasıl Hesaplanır?</strong>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>Mesafe ve rota uyumu</li>
          <li>Araç tipi – yük türü uygunluğu</li>
          <li>Kapasite ve ağırlık toleransı</li>
        </ul>
      </div>
    </div>
  );
}

/* ---------------- INSIGHT CARD ---------------- */

function Insight({ icon, title, desc }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-sm">
      <div className="rounded-lg bg-gray-100 p-2">{icon}</div>
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm text-gray-500">{desc}</div>
      </div>
    </div>
  );
}
