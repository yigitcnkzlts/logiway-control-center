import { useMemo, useState } from "react";
import PageHeader from "../components/layout/PageHeader";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import Pagination from "../components/common/Pagination";

const INITIAL_LOADS = [
  { id: "L-2001", owner: "Kaya Lojistik", from: "İstanbul", to: "Ankara", vehicle: "Tır", weight: 24000, price: 38000, status: "Onay Bekliyor", offers: 6, createdAt: "2026-02-01" },
  { id: "L-2002", owner: "Demir Nakliyat", from: "İzmir", to: "Bursa", vehicle: "Kamyon", weight: 12000, price: 17500, status: "Aktif", offers: 3, createdAt: "2026-02-01" },
  { id: "L-2003", owner: "Arslan Depo", from: "Kocaeli", to: "Adana", vehicle: "Tır", weight: 22000, price: 42000, status: "Aktif", offers: 9, createdAt: "2026-01-31" },
  { id: "L-2004", owner: "Güneş Ticaret", from: "Antalya", to: "Konya", vehicle: "Panelvan", weight: 1500, price: 6200, status: "Tamamlandı", offers: 2, createdAt: "2026-01-30" },
  { id: "L-2005", owner: "Ege Gıda", from: "Manisa", to: "İstanbul", vehicle: "Kamyonet", weight: 3000, price: 9800, status: "İptal", offers: 0, createdAt: "2026-01-29" },
  { id: "L-2006", owner: "Marmara İnşaat", from: "Sakarya", to: "Eskişehir", vehicle: "Kamyon", weight: 8000, price: 14500, status: "Onay Bekliyor", offers: 1, createdAt: "2026-02-02" },
  { id: "L-2007", owner: "Tekirdağ Sanayi", from: "Tekirdağ", to: "Çorlu", vehicle: "Kamyonet", weight: 2000, price: 4500, status: "Aktif", offers: 4, createdAt: "2026-02-02" },
];

const STATUS_OPTIONS = ["Onay Bekliyor", "Aktif", "Tamamlandı", "İptal"];
const VEHICLE_OPTIONS = ["Hepsi", "Tır", "Kamyon", "Kamyonet", "Panelvan"];
const STATUS_FILTER = ["Hepsi", ...STATUS_OPTIONS];

export default function Loads() {
  const [loads, setLoads] = useState(INITIAL_LOADS);

  // Filters
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Hepsi");
  const [vehicle, setVehicle] = useState("Hepsi");

  // Sorting
  const [sort, setSort] = useState({ key: "createdAt", dir: "desc" });

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [selected, setSelected] = useState(null); // detail/edit
  const [confirm, setConfirm] = useState(null); // approve/cancel/status

  // Form
  const [form, setForm] = useState(null);

  function resetToFirstPage() {
    setPage(1);
  }

  function onChangePageSize(n) {
    setPageSize(n);
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return loads.filter((l) => {
      const matchQuery =
        !q ||
        l.id.toLowerCase().includes(q) ||
        l.owner.toLowerCase().includes(q) ||
        l.from.toLowerCase().includes(q) ||
        l.to.toLowerCase().includes(q);

      const matchStatus = status === "Hepsi" ? true : l.status === status;
      const matchVehicle = vehicle === "Hepsi" ? true : l.vehicle === vehicle;

      return matchQuery && matchStatus && matchVehicle;
    });
  }, [loads, query, status, vehicle]);

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

      // numeric sorts
      if (["weight", "price", "offers"].includes(key)) {
        return dir === "asc" ? Number(va) - Number(vb) : Number(vb) - Number(va);
      }

      // string sorts
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

  function statusBadge(s) {
    const map = {
      "Onay Bekliyor": "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
      Aktif: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
      Tamamlandı: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
      İptal: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    };
    return map[s] || "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }

  function openNewLoad() {
    const draft = {
      id: nextLoadId(loads),
      owner: "",
      from: "",
      to: "",
      vehicle: "Kamyon",
      weight: 0,
      price: 0,
      status: "Onay Bekliyor",
      offers: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setSelected({ mode: "create", load: draft });
    setForm(draft);
  }

  function openEditLoad(load) {
    setSelected({ mode: "edit", load });
    setForm({ ...load });
  }

  function closeLoadModal() {
    setSelected(null);
    setForm(null);
  }

  function saveLoad() {
    const errors = validate(form);
    if (errors.length) {
      alert(errors.join("\n"));
      return;
    }

    if (selected?.mode === "create") {
      setLoads((prev) => [form, ...prev]);
    } else if (selected?.mode === "edit") {
      setLoads((prev) => prev.map((x) => (x.id === form.id ? form : x)));
    }

    closeLoadModal();
  }

  function askApprove(load) {
    setConfirm({ type: "approve", load });
  }

  function askCancel(load) {
    setConfirm({ type: "cancel", load });
  }

  function askSetStatus(load) {
    setConfirm({ type: "status", load });
  }

  function applyConfirm(actionStatus) {
    if (!confirm?.load) return;

    const target = confirm.load;

    if (confirm.type === "approve") {
      setLoads((prev) => prev.map((x) => (x.id === target.id ? { ...x, status: "Aktif" } : x)));
    }

    if (confirm.type === "cancel") {
      setLoads((prev) => prev.map((x) => (x.id === target.id ? { ...x, status: "İptal" } : x)));
    }

    if (confirm.type === "status") {
      setLoads((prev) => prev.map((x) => (x.id === target.id ? { ...x, status: actionStatus } : x)));
    }

    setConfirm(null);
  }

  return (
    <>
      <PageHeader
        breadcrumb="Ana Sayfa / Yük - İlanlar"
        title="Yük / İlanlar"
        description="İlanları incele, filtrele, onayla ve yönet"
        right={<Button onClick={openNewLoad}>Yeni İlan</Button>}
      />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Filter Bar */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
            <div className="w-full md:w-[360px]">
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  resetToFirstPage();
                }}
                placeholder="Ara: ilan ID, firma, kalkış, varış..."
              />
            </div>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                resetToFirstPage();
              }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
            >
              {STATUS_FILTER.map((x) => (
                <option key={x} value={x}>
                  Durum: {x}
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
              {VEHICLE_OPTIONS.map((x) => (
                <option key={x} value={x}>
                  Araç: {x}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-500">
            Gösterilen: <span className="font-semibold text-slate-900">{total}</span> ilan
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold text-slate-600">
                <Th label="İlan" onClick={() => toggleSort("id")} icon={sortIcon("id")} />
                <Th label="Firma" onClick={() => toggleSort("owner")} icon={sortIcon("owner")} />
                <Th label="Rota" onClick={() => toggleSort("from")} icon={sortIcon("from")} />
                <Th label="Araç" onClick={() => toggleSort("vehicle")} icon={sortIcon("vehicle")} />
                <Th label="Ağırlık" onClick={() => toggleSort("weight")} icon={sortIcon("weight")} />
                <Th label="Fiyat" onClick={() => toggleSort("price")} icon={sortIcon("price")} />
                <Th label="Teklif" onClick={() => toggleSort("offers")} icon={sortIcon("offers")} />
                <Th label="Durum" onClick={() => toggleSort("status")} icon={sortIcon("status")} />
                <Th label="Tarih" onClick={() => toggleSort("createdAt")} icon={sortIcon("createdAt")} />
                <th className="px-4 py-3 text-right">İşlemler</th>
              </tr>
            </thead>

            <tbody>
              {pageData.map((l) => (
                <tr
                  key={l.id}
                  className="border-t border-slate-100 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{l.id}</div>
                    <div className="text-xs text-slate-500">#{slug(l.from)}-{slug(l.to)}</div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{l.owner}</div>
                    <div className="text-xs text-slate-500">{l.from} → {l.to}</div>
                  </td>

                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                      {l.from} → {l.to}
                    </span>
                  </td>

                  <td className="px-4 py-3">{l.vehicle}</td>
                  <td className="px-4 py-3">{formatKg(l.weight)}</td>
                  <td className="px-4 py-3">{formatTry(l.price)}</td>
                  <td className="px-4 py-3">{l.offers}</td>

                  <td className="px-4 py-3">
                    <span className={["inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", statusBadge(l.status)].join(" ")}>
                      {l.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-slate-500">{formatDate(l.createdAt)}</td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditLoad(l)}>
                        Düzenle
                      </Button>

                      {l.status === "Onay Bekliyor" && (
                        <Button size="sm" onClick={() => askApprove(l)}>
                          Onayla
                        </Button>
                      )}

                      {l.status !== "İptal" && (
                        <Button variant="danger" size="sm" onClick={() => askCancel(l)}>
                          İptal
                        </Button>
                      )}

                      <Button variant="secondary" size="sm" onClick={() => askSetStatus(l)}>
                        Durum
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {pageData.length === 0 && (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={10}>
                    Sonuç bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
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

      {/* Load Modal */}
      <Modal
        open={!!selected}
        title={selected?.mode === "create" ? "Yeni İlan" : "İlan Düzenle"}
        onClose={closeLoadModal}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeLoadModal}>İptal</Button>
            <Button onClick={saveLoad}>Kaydet</Button>
          </div>
        }
      >
        {form && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Firma</Label>
              <Input value={form.owner} onChange={(e) => setForm((p) => ({ ...p, owner: e.target.value }))} placeholder="Örn: Kaya Lojistik" />
            </div>

            <div>
              <Label>Kalkış</Label>
              <Input value={form.from} onChange={(e) => setForm((p) => ({ ...p, from: e.target.value }))} placeholder="Örn: İstanbul" />
            </div>

            <div>
              <Label>Varış</Label>
              <Input value={form.to} onChange={(e) => setForm((p) => ({ ...p, to: e.target.value }))} placeholder="Örn: Ankara" />
            </div>

            <div>
              <Label>Araç Tipi</Label>
              <select
                value={form.vehicle}
                onChange={(e) => setForm((p) => ({ ...p, vehicle: e.target.value }))}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
              >
                {VEHICLE_OPTIONS.filter((x) => x !== "Hepsi").map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Ağırlık (kg)</Label>
              <Input
                type="number"
                value={form.weight}
                onChange={(e) => setForm((p) => ({ ...p, weight: Number(e.target.value) }))}
                placeholder="Örn: 12000"
              />
            </div>

            <div>
              <Label>Fiyat (₺)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))}
                placeholder="Örn: 17500"
              />
            </div>

            <div>
              <Label>Durum</Label>
              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
              >
                {STATUS_OPTIONS.map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              Bu ekran demo/mock çalışıyor. Backend geldiğinde ilanlar API üzerinden yönetilecek.
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

            {confirm?.type === "status" ? null : (
              <Button
                variant={confirm?.type === "cancel" ? "danger" : "primary"}
                onClick={() => applyConfirm()}
              >
                Onayla
              </Button>
            )}
          </div>
        }
      >
        {confirm?.type === "approve" && (
          <div className="text-sm text-slate-700">
            <span className="font-semibold">{confirm?.load?.id}</span> ilanını <b>aktif</b> yapmak istiyor musun?
          </div>
        )}

        {confirm?.type === "cancel" && (
          <div className="text-sm text-slate-700">
            <span className="font-semibold">{confirm?.load?.id}</span> ilanını <b>iptal</b> etmek istiyor musun?
          </div>
        )}

        {confirm?.type === "status" && (
          <div className="space-y-3">
            <div className="text-sm text-slate-700">
              <span className="font-semibold">{confirm?.load?.id}</span> için durum seç:
            </div>

            <div className="grid gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => applyConfirm(s)}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm hover:bg-slate-50"
                >
                  <span>{s}</span>
                  <span className={["rounded-full px-2.5 py-1 text-xs font-semibold", statusBadge(s)].join(" ")}>
                    {s}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
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

function Label({ children }) {
  return <div className="mb-1 text-xs font-semibold text-slate-600">{children}</div>;
}

function formatDate(iso) {
  if (!iso) return "-";
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}

function formatKg(n) {
  const x = Number(n || 0);
  return `${x.toLocaleString("tr-TR")} kg`;
}

function formatTry(n) {
  const x = Number(n || 0);
  return `${x.toLocaleString("tr-TR")} ₺`;
}

function nextLoadId(loads) {
  const nums = loads
    .map((x) => Number(String(x.id).replace("L-", "")))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 2000;
  return `L-${max + 1}`;
}

function slug(s) {
  return String(s || "").toLowerCase().replaceAll(" ", "-").slice(0, 10);
}

function validate(l) {
  const errors = [];
  if (!l?.owner?.trim()) errors.push("Firma zorunlu.");
  if (!l?.from?.trim()) errors.push("Kalkış zorunlu.");
  if (!l?.to?.trim()) errors.push("Varış zorunlu.");
  if (!l?.vehicle?.trim()) errors.push("Araç tipi zorunlu.");
  if (Number(l?.weight) <= 0) errors.push("Ağırlık 0'dan büyük olmalı.");
  if (Number(l?.price) <= 0) errors.push("Fiyat 0'dan büyük olmalı.");
  return errors;
}
