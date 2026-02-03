import { matches } from "../data/matches";
import { Link2, TrendingUp } from "lucide-react";

const statusMap = {
  uygun: {
    label: "Uygun",
    badge: "bg-emerald-100 text-emerald-700",
  },
  kismi: {
    label: "Kısmi",
    badge: "bg-amber-100 text-amber-700",
  },
  uygun_degil: {
    label: "Uygun Değil",
    badge: "bg-rose-100 text-rose-700",
  },
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
      <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-medium">{score}%</span>
    </div>
  );
}

export default function Matches() {
  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
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

      {/* Content */}
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 font-medium">Eşleşme</th>
              <th className="px-4 py-3 font-medium">Araç</th>
              <th className="px-4 py-3 font-medium">Yük</th>
              <th className="px-4 py-3 font-medium">Uyum Skoru</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 font-medium">Tarih</th>
            </tr>
          </thead>

          <tbody>
            {matches.map((m) => {
              const status = statusMap[m.status];

              return (
                <tr
                  key={m.id}
                  className="group border-b last:border-b-0 hover:bg-gray-50 transition cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-medium">
                      <Link2 size={14} className="text-gray-400" />
                      {m.id}
                    </div>
                  </td>

                  <td className="px-4 py-3 font-medium">
                    {m.vehiclePlate}
                  </td>

                  <td className="px-4 py-3 text-gray-700">
                    {m.loadTitle}
                  </td>

                  <td className="px-4 py-3">
                    <ScoreBar score={m.score} />
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${status.badge}`}
                    >
                      {status.label}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-gray-500">
                    {m.createdAt}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {matches.length === 0 && (
          <div className="p-6 text-center text-sm text-gray-500">
            Henüz eşleşme bulunmuyor.
          </div>
        )}
      </div>
    </div>
  );
}
