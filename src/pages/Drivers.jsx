import { useMemo, useState } from "react";
import PageHeader from "../components/layout/PageHeader";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import Pagination from "../components/common/Pagination";

const INITIAL_DRIVERS = [
  {
    id: "D-3001",
    name: "Mustafa Yıldız",
    phone: "05xx xxx xx 12",
    city: "İstanbul",
    vehicle: "Tır",
    plate: "34 ABC 123",
    verification: "İncelemede",
    score: 4.7,
    trips: 128,
    createdAt: "2026-02-02",
    docs: { ehliyet: "Var", src: "Var", psikoteknik: "Yok", ruhsat: "Var" },
  },
  {
    id: "D-3002",
    name: "Kadir Şen",
    phone: "05xx xxx xx 44",
    city: "Ankara",
    vehicle: "Kamyon",
    plate: "06 KDR 060",
    verification: "Doğrulanmadı",
    score: 4.2,
    trips: 42,
    createdAt: "2026-02-01",
    docs: { ehliyet: "Var", src: "Yok", psikoteknik: "Yok", ruhsat: "Var" },
  },
  {
    id: "D-3003",
    name: "Emre Kaya",
    phone: "05xx xxx xx 78",
    city: "İzmir",
    vehicle: "Kamyonet",
    plate: "35 EMR 535",
    verification: "Doğrulandı",
    score: 4.9,
    trips: 210,
    createdAt: "2026-01-30",
    docs: { ehliyet: "Var", src: "Var", psikoteknik: "Var", ruhsat: "Var" },
  },
  {
    id: "D-3004",
    name: "Serkan Aydın",
    phone: "05xx xxx xx 99",
    city: "Bursa",
    vehicle: "Panelvan",
    plate: "16 SRK 016",
    verification: "Reddedildi",
    score: 3.8,
    trips: 16,
    createdAt: "2026-01-29",
    docs: { ehliyet: "Var", src: "Yok", psikoteknik: "Yok", ruhsat: "Yok" },
  },
];

const VERIFY_FILTER = ["Hepsi", "Doğrulanmadı", "İncelemede", "Doğrulandı", "Reddedildi"];
const VEHICLE_FILTER = ["Hepsi", "Tır", "Kamyon", "Kamyonet", "Panelvan"];

export default function Drivers() {
  const [drivers, setDrivers] = useState(INITIAL_DRIVERS);

  // Filters
  const [query, setQuery] = useState("");
  const [verification, setVerification] = useState("Hepsi");
  const [vehicle, setVehicle] = useState("Hepsi");

  // Sorting
  const [sort, setSort] = useState({ key: "createdAt", dir: "desc" });

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [selected, setSelected] = useState(null); // driver detail
  const [confirm, setConfirm] = useState(null); // approve/reject

  function resetToFirstPage() {
    setPage(1);
  }

  function onChangePageSize(n) {
    setPageSize(n);
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return drivers.filter((d) => {
      const matchQuery =
        !q ||
        d.id.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q) ||
        d.plate.toLowerCase().includes(q);

      const matchVerification = verification === "Hepsi" ? true : d.verification === verification;
      const matchVehicle = vehicle === "Hepsi" ? true : d.vehicle === vehicle;

      return matchQuery && matchVerification && matchVehicle;
    });
  }, [drivers, query, verification, vehicle]);

  const sorted = useMemo(() => {
    const { key, dir } = sort;
    const clone = [...filtered];

    clone.sort((a, b) => {
      const va = a[key];
      const vb = b[key];

      if (key === "createdAt") {
        return dir === "asc"
          ? String(va).localeCompare(String(vb))
          : String(vb).localeCompare(String(va));
      }

      if (["score", "trips"].includes(key)) {
        return dir === "asc" ? Number(va) - Number(vb) : Number(vb) - Number(va);
      }

      return dir === "asc"
        ? String(va).localeCompare(String(vb), "tr")
        : String(vb).localeCompare(String(va), "tr");
    });

    return clone;
  }, [filtered, sort]);

  const total = sorted.length;

  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  function toggleSort(key) {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" };
      return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
    });
    resetToFirstPage();
  }

  function sortIcon(key) {
    if (sort.key !== key) return "↕";
    return sort.dir === "asc" ? "↑" : "↓";
  }

  function verifyBadge(s) {
    const map = {
      "Doğrulanmadı": "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
      "İncelemede": "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
      "Doğrulandı": "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
      "Reddedildi": "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    };
    return map[s] || "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }

  function openDetail(d) {
    setSelected(d);
  }

  function askApprove(d) {
    setConfirm({ type: "approve", driver: d });
  }

  function askReject(d) {
    setConfirm({ type: "reject", driver: d });
  }

  function applyConfirm() {
    if (!confirm?.driver) return;

    const target = confirm.driver;
    const next = confirm.type === "approve" ? "Doğrulandı" : "Reddedildi";

    setDrivers((prev) => prev.map((x) => (x.id === target.id ? { ...x, verification: next } : x)));
    setConfirm(null);
    setSelected(null);
  }

  return (
    <>
      <PageHeader
        breadcrumb="Ana Sayfa / Şoförler"
        title="Şoförler"
        description="Şoför kayıtlarını doğrula, filtrele ve yönet"
        right={
          <Button variant="outline" onClick={() => alert("Demo: Dışa aktarım (CSV) sonra eklenecek")}>
            Dışa Aktar
          </Button>
        }
      />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
            <div className="w-full md:w-[360px]">
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  resetToFirstPage();
                }}
                placeholder="Ara: ID, ad, şehir, plaka..."
              />
            </div>

            <select
              value={verification}
              onChange={(e) => {
                setVerification(e.target.value);
                resetToFirstPage();
              }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
            >
              {VERIFY_FILTER.map((x) => (
                <option key={x} value={x}>
                  Doğrulama: {x}
                </option>
              ))}
            </select>

            <select
              value={vehicle}
              onChange={(e) => {
                setVehicle(e.target.value);
                resetToFirstPage();
              }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
            >
              {VEHICLE_FILTER.map((x) => (
                <option key={x} value={x}>
                  Araç: {x}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-500">
            Gösterilen: <span className="font-semibold text-slate-900">{total}</span> şoför
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold text-slate-600">
                <Th label="Şoför" onClick={() => toggleSort("name")} icon={sortIcon("name")} />
                <Th label="Şehir" onClick={() => toggleSort("city")} icon={sortIcon("city")} />
                <Th label="Araç" onClick={() => toggleSort("vehicle")} icon={sortIcon("vehicle")} />
                <Th label="Plaka" onClick={() => toggleSort("plate")} icon={sortIcon("plate")} />
                <Th label="Puan" onClick={() => toggleSort("score")} icon={sortIcon("score")} />
                <Th label="Sefer" onClick={() => toggleSort("trips")} icon={sortIcon("trips")} />
                <Th label="Doğrulama" onClick={() => toggleSort("verification")} icon={sortIcon("verification")} />
                <Th label="Kayıt" onClick={() => toggleSort("createdAt")} icon={sortIcon("createdAt")} />
                <th className="px-4 py-3 text-right">İşlemler</th>
              </tr>
            </thead>

            <tbody>
              {pageData.map((d) => (
                <tr key={d.id} className="border-t border-slate-100 text-sm text-slate-700 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{d.name}</div>
                    <div className="text-xs text-slate-500">
                      <span className="font-mono">{d.id}</span> • {d.phone}
                    </div>
                  </td>

                  <td className="px-4 py-3">{d.city}</td>
                  <td className="px-4 py-3">{d.vehicle}</td>
                  <td className="px-4 py-3 font-mono">{d.plate}</td>
                  <td className="px-4 py-3">{Number(d.score).toFixed(1)}</td>
                  <td className="px-4 py-3">{d.trips}</td>

                  <td className="px-4 py-3">
                    <span className={["inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", verifyBadge(d.verification)].join(" ")}>
                      {d.verification}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-slate-500">{formatDate(d.createdAt)}</td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openDetail(d)}>
                        Detay
                      </Button>

                      {d.verification !== "Doğrulandı" && (
                        <Button size="sm" onClick={() => askApprove(d)}>
                          Onayla
                        </Button>
                      )}

                      {d.verification !== "Reddedildi" && (
                        <Button variant="danger" size="sm" onClick={() => askReject(d)}>
                          Reddet
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {pageData.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-500">
                    Sonuç bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-slate-200 p-4">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={onChangePageSize}
          />
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        open={!!selected}
        title="Şoför Detayı"
        onClose={() => setSelected(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelected(null)}>Kapat</Button>
            {selected?.verification !== "Doğrulandı" && (
              <Button onClick={() => askApprove(selected)}>Onayla</Button>
            )}
            {selected?.verification !== "Reddedildi" && (
              <Button variant="danger" onClick={() => askReject(selected)}>Reddet</Button>
            )}
          </div>
        }
      >
        {selected && (
          <div className="grid gap-4 md:grid-cols-2">
            <Info label="Ad Soyad" value={selected.name} />
            <Info label="Telefon" value={selected.phone} />
            <Info label="Şehir" value={selected.city} />
            <Info label="Araç Tipi" value={selected.vehicle} />
            <Info label="Plaka" value={selected.plate} />
            <Info label="Puan / Sefer" value={`${Number(selected.score).toFixed(1)} • ${selected.trips}`} />

            <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-xs text-slate-500">Belgeler</div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <Doc label="Ehliyet" value={selected.docs.ehliyet} />
                <Doc label="SRC" value={selected.docs.src} />
                <Doc label="Psikoteknik" value={selected.docs.psikoteknik} />
                <Doc label="Ruhsat" value={selected.docs.ruhsat} />
              </div>
            </div>

            <div className="md:col-span-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              Bu modül demo/mock çalışıyor. Backend geldiğinde belge dosyaları ve doğrulama akışı API’dan gelecek.
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Modal */}
      <Modal
        open={!!confirm}
        title="Onay"
        onClose={() => setConfirm(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirm(null)}>Vazgeç</Button>
            <Button variant={confirm?.type === "reject" ? "danger" : "primary"} onClick={applyConfirm}>
              Onayla
            </Button>
          </div>
        }
      >
        <div className="text-sm text-slate-700">
          <span className="font-semibold">{confirm?.driver?.name}</span>{" "}
          şoförünü{" "}
          {confirm?.type === "approve" ? "doğrulamak" : "reddetmek"} istiyor musun?
        </div>
      </Modal>
    </>
  );
}

function Th({ label, icon, onClick }) {
  return (
    <th className="px-4 py-3">
      <button
        onClick={onClick}
        className="inline-flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-100"
        title="Sırala"
      >
        <span>{label}</span>
        <span className="text-[11px] text-slate-400">{icon}</span>
      </button>
    </th>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value || "-"}</div>
    </div>
  );
}

function Doc({ label, value }) {
  const ok = value === "Var";
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
      <div className="text-sm text-slate-700">{label}</div>
      <span
        className={[
          "rounded-full px-2.5 py-1 text-xs font-semibold",
          ok
            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
            : "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return "-";
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}
