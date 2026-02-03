import { useMemo, useState } from "react";
import { Filter, Link2, TrendingUp } from "lucide-react";
import { matches as allMatches } from "../data/matches";
import Modal from "../components/common/Modal";

const statusMap = {
  uygun: { label: "Uygun", badge: "bg-emerald-100 text-emerald-700" },
  kismi: { label: "Kısmi", badge: "bg-amber-100 text-amber-700" },
  uygun_degil: { label: "Uygun Değil", badge: "bg-rose-100 text-rose-700" },
};

function ScoreBar({ score }) {
  const color =
    score >= 80
      ? "bg-emerald-500"
      : score >= 50
      ? "bg-amber-500"
      : "bg-rose-500";

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-28 overflow-hidden rounded-full bg-gray-200">
        <div className={`h-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium">{score}%</span>
    </div>
  );
}

function SummaryCard({ title, value, tone }) {
  const toneMap = {
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
  };

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className={`mt-2 text-2xl font-semibold ${toneMap[tone] || ""}`}>
        {value}
      </div>
    </div>
  );
}

function FilterButton({ active, children, onClick }) {
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

function formatTimeMatch(timeMatch) {
  if (timeMatch === "uygun") return "Uygun";
  if (timeMatch === "kismi") return "Kısmi";
  return "Uygun Değil";
}

export default function Matches() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMatch, setSelectedMatch] = useState(null);

  const filteredMatches = useMemo(() => {
    if (statusFilter === "all") return allMatches;
    return allMatches.filter((m) => m.status === statusFilter);
  }, [statusFilter]);

  const stats = useMemo(() => {
    return {
      total: allMatches.length,
      uygun: allMatches.filter((m) => m.status === "uygun").length,
      kismi: allMatches.filter((m) => m.status === "kismi").length,
      uygunDegil: allMatches.filter((m) => m.status === "uygun_degil").length,
    };
  }, []);

  const modalTitle = selectedMatch
    ? `Eşleşme Detayı – ${selectedMatch.id}`
    : "";

  const modalFooter = (
    <div className="flex justify-end gap-2">
      <button
        onClick={() => setSelectedMatch(null)}
        className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
      >
        Kapat
      </button>
      <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800">
        İncele
      </button>
    </div>
  );

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Eşleşmeler</h1>
          <p className="mt-1 text-sm text-gray-500">
            Araçlar ile yük ilanları arasındaki uyum analizleri
          </p>
        </div>

        <button className="flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm text-white hover:bg-black/90">
          <TrendingUp size={16} />
          Skora Göre Yenile
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Toplam Eşleşme" value={stats.total} />
        <SummaryCard title="Uygun" value={stats.uygun} tone="emerald" />
        <SummaryCard title="Kısmi" value={stats.kismi} tone="amber" />
        <SummaryCard title="Uygun Değil" value={stats.uygunDegil} tone="rose" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter size={16} className="text-gray-400" />
        <FilterButton
          active={statusFilter === "all"}
          onClick={() => setStatusFilter("all")}
        >
          Tümü
        </FilterButton>
        <FilterButton
          active={statusFilter === "uygun"}
          onClick={() => setStatusFilter("uygun")}
        >
          Uygun
        </FilterButton>
        <FilterButton
          active={statusFilter === "kismi"}
          onClick={() => setStatusFilter("kismi")}
        >
          Kısmi
        </FilterButton>
        <FilterButton
          active={statusFilter === "uygun_degil"}
          onClick={() => setStatusFilter("uygun_degil")}
        >
          Uygun Değil
        </FilterButton>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Eşleşme</th>
                <th className="px-4 py-3 font-medium">Güzergâh</th>
                <th className="px-4 py-3 font-medium">Araç</th>
                <th className="px-4 py-3 font-medium">Yük</th>
                <th className="px-4 py-3 font-medium">Uyum</th>
                <th className="px-4 py-3 font-medium">Sebep</th>
                <th className="px-4 py-3 font-medium">Tarih</th>
              </tr>
            </thead>

            <tbody>
              {filteredMatches.map((m) => {
                const status = statusMap[m.status];

                return (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedMatch(m)}
                    className="border-b last:border-b-0 hover:bg-gray-50 transition cursor-pointer"
                    title="Detay görmek için tıkla"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-medium">
                        <Link2 size={14} className="text-gray-400" />
                        {m.id}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        Mesafe: {m.distanceKm} km
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium">{m.route}</div>
                      <div className="mt-1 text-xs text-gray-500">
                        Zaman: {formatTimeMatch(m.timeMatch)}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium">{m.vehiclePlate}</div>
                      <div className="mt-1 text-xs text-gray-500">
                        {m.vehicleType} • Kap: {m.vehicleCapacityKg} kg
                      </div>
                      <div className="mt-1 text-xs">
                        <span
                          className={[
                            "rounded-full px-2 py-0.5",
                            m.vehicleTypeMatch
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700",
                          ].join(" ")}
                        >
                          {m.vehicleTypeMatch
                            ? "Araç tipi uyumlu"
                            : "Araç tipi uyumsuz"}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium">{m.loadTitle}</div>
                      <div className="mt-1 text-xs text-gray-500">
                        Ağırlık: {m.loadWeightKg} kg
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="mb-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${status.badge}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <ScoreBar score={m.score} />
                    </td>

                    <td className="px-4 py-3 text-gray-600">{m.reason}</td>

                    <td className="px-4 py-3 text-gray-500">{m.createdAt}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredMatches.length === 0 && (
          <div className="p-6 text-center text-sm text-gray-500">
            Filtreye uygun eşleşme bulunamadı.
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="rounded-xl border bg-white p-4 text-sm text-gray-600">
        <div className="mb-1 font-medium text-gray-800">
          Eşleşme Skoru Nasıl Hesaplanır?
        </div>
        <ul className="list-disc space-y-1 pl-5">
          <li>Mesafe ve rota uyumu</li>
          <li>Araç tipi – yük türü uygunluğu</li>
          <li>Kapasite ve ağırlık toleransı</li>
          <li>Teslim zamanı ve operasyon uygunluğu</li>
        </ul>
      </div>

      {/* Modal (Detail) */}
      <Modal
        open={!!selectedMatch}
        title={modalTitle}
        onClose={() => setSelectedMatch(null)}
        footer={modalFooter}
      >
        {selectedMatch && (
          <div className="space-y-4">
            {/* quick badge + score */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-slate-500">Durum</div>
                <div className="mt-1">
                  <span
                    className={[
                      "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                      statusMap[selectedMatch.status]?.badge || "bg-gray-100 text-gray-700",
                    ].join(" ")}
                  >
                    {statusMap[selectedMatch.status]?.label || selectedMatch.status}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-500">Skor</div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">
                  {selectedMatch.score}%
                </div>
                <div className="mt-2">
                  <ScoreBar score={selectedMatch.score} />
                </div>
              </div>
            </div>

            {/* main grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-xs text-slate-500">Araç</div>
                <div className="mt-1 font-semibold text-slate-900">
                  {selectedMatch.vehiclePlate}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  {selectedMatch.vehicleType} • Kapasite:{" "}
                  {selectedMatch.vehicleCapacityKg} kg
                </div>
                <div className="mt-2">
                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-xs",
                      selectedMatch.vehicleTypeMatch
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700",
                    ].join(" ")}
                  >
                    {selectedMatch.vehicleTypeMatch
                      ? "Araç tipi uyumlu"
                      : "Araç tipi uyumsuz"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-xs text-slate-500">Yük</div>
                <div className="mt-1 font-semibold text-slate-900">
                  {selectedMatch.loadTitle}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  Ağırlık: {selectedMatch.loadWeightKg} kg
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-3">
              <div className="text-xs text-slate-500">Güzergâh</div>
              <div className="mt-1 font-semibold text-slate-900">
                {selectedMatch.route}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Mesafe: {selectedMatch.distanceKm} km • Zaman:{" "}
                {formatTimeMatch(selectedMatch.timeMatch)}
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs font-medium text-slate-900">Not</div>
              <div className="mt-1 text-sm text-slate-700">
                {selectedMatch.reason}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
