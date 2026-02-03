import { useMemo, useState } from "react";
import PageHeader from "../components/layout/PageHeader";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import Pagination from "../components/common/Pagination";

const INITIAL_VEHICLES = [
  {
    id: "V-4001",
    plate: "34 ABC 123",
    type: "Tır",
    capacityKg: 24000,
    status: "Müsait",
    city: "İstanbul",
    driverName: "Mustafa Yıldız",
    driverId: "D-3001",
    lastSeen: "2026-02-03",
    createdAt: "2026-02-02",
  },
  {
    id: "V-4002",
    plate: "06 KDR 060",
    type: "Kamyon",
    capacityKg: 12000,
    status: "Seferde",
    city: "Ankara",
    driverName: "Kadir Şen",
    driverId: "D-3002",
    lastSeen: "2026-02-02",
    createdAt: "2026-02-01",
  },
  {
    id: "V-4003",
    plate: "35 EMR 535",
    type: "Kamyonet",
    capacityKg: 3000,
    status: "Müsait",
    city: "İzmir",
    driverName: "Emre Kaya",
    driverId: "D-3003",
    lastSeen: "2026-02-03",
    createdAt: "2026-01-30",
  },
  {
    id: "V-4004",
    plate: "16 SRK 016",
    type: "Panelvan",
    capacityKg: 1500,
    status: "Bakımda",
    city: "Bursa",
    driverName: "Serkan Aydın",
    driverId: "D-3004",
    lastSeen: "2026-01-31",
    createdAt: "2026-01-29",
  },
];

const TYPE_OPTIONS = ["Tır", "Kamyon", "Kamyonet", "Panelvan"];
const TYPE_FILTER = ["Hepsi", ...TYPE_OPTIONS];

const STATUS_OPTIONS = ["Müsait", "Seferde", "Bakımda", "Pasif"];
const STATUS_FILTER = ["Hepsi", ...STATUS_OPTIONS];

export default function Vehicles() {
  const [vehicles, setVehicles] = useState(INITIAL_VEHICLES);

  // Filters
  const [query, setQuery] = useState("");
  const [type, setType] = useState("Hepsi");
  const [status, setStatus] = useState("Hepsi");

  // Sorting
  const [sort, setSort] = useState({ key: "createdAt", dir: "desc" });

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [selected, setSelected] = useState(null); // create/edit
  const [confirm, setConfirm] = useState(null); // status change

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

    return vehicles.filter((v) => {
      const matchQuery =
        !q ||
        v.id.toLowerCase().includes(q) ||
        v.plate.toLowerCase().includes(q) ||
        v.city.toLowerCase().includes(q) ||
        v.driverName.toLowerCase().includes(q);

      const matchType = type === "Hepsi" ? true : v.type === type;
      const matchStatus = status === "Hepsi" ? true : v.status === status;

      return matchQuery && matchType && matchStatus;
    });
  }, [vehicles, query, type, status]);

  const sorted = useMemo(() => {
    const { key, dir } = sort;
    const clone = [...filtered];

    clone.sort((a, b) => {
      const va = a[key];
      const vb = b[key];

      if (key === "createdAt" || key === "lastSeen") {
        return dir === "asc"
          ? String(va).localeCompare(String(vb))
          : String(vb).localeCompare(String(va));
      }

      if (key === "capacityKg") {
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

  function statusBadge(s) {
    const map = {
      Müsait: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
      Seferde: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
      Bakımda: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
      Pasif: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    };
    return map[s] || "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }

  function openCreate() {
    const draft = {
      id: nextVehicleId(vehicles),
      plate: "",
      type: "Kamyon",
      capacityKg: 0,
      status: "Müsait",
      city: "",
      driverName: "",
      driverId: "",
      lastSeen: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setSelected({ mode: "create" });
    setForm(draft);
  }

  function openEdit(v) {
    setSelected({ mode: "edit", vehicle: v });
    setForm({ ...v });
  }

  function closeModal() {
    setSelected(null);
    setForm(null);
  }

  function saveVehicle() {
    const errors = validate(form);
    if (errors.length) {
      alert(errors.join("\n"));
      return;
    }

    if (selected?.mode === "create") {
      setVehicles((prev) => [form, ...prev]);
    } else {
      setVehicles((prev) => prev.map((x) => (x.id === form.id ? form : x)));
    }

    closeModal();
  }

  function askStatus(v) {
    setConfirm({ type: "status", vehicle: v });
  }

  function applyStatus(nextStatus) {
    if (!confirm?.vehicle) return;

    const target = confirm.vehicle;

    setVehicles((prev) =>
      prev.map((x) => (x.id === target.id ? { ...x, status: nextStatus } : x))
    );

    setConfirm(null);
  }

  return (
    <>
      <PageHeader
        breadcrumb="Ana Sayfa / Araçlar"
        title="Araçlar"
        description="Araç filosunu yönet, durum değiştir ve filtrele"
        right={<Button onClick={openCreate}>Yeni Araç</Button>}
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
                placeholder="Ara: ID, plaka, şehir, şoför..."
              />
            </div>

            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                resetToFirstPage();
              }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
            >
              {TYPE_FILTER.map((x) => (
                <option key={x} value={x}>
                  Tip: {x}
                </option>
              ))}
            </select>

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
          </div>

          <div className="text-xs text-slate-500">
            Gösterilen: <span className="font-semibold text-slate-900">{total}</span> araç
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold text-slate-600">
                <Th label="Araç" onClick={() => toggleSort("plate")} icon={sortIcon("plate")} />
                <Th label="Tip" onClick={() => toggleSort("type")} icon={sortIcon("type")} />
                <Th label="Kapasite" onClick={() => toggleSort("capacityKg")} icon={sortIcon("capacityKg")} />
                <Th label="Şehir" onClick={() => toggleSort("city")} icon={sortIcon("city")} />
                <Th label="Şoför" onClick={() => toggleSort("driverName")} icon={sortIcon("driverName")} />
                <Th label="Son Görülme" onClick={() => toggleSort("lastSeen")} icon={sortIcon("lastSeen")} />
                <Th label="Durum" onClick={() => toggleSort("status")} icon={sortIcon("status")} />
                <th className="px-4 py-3 text-right">İşlemler</th>
              </tr>
            </thead>

            <tbody>
              {pageData.map((v) => (
                <tr key={v.id} className="border-t border-slate-100 text-sm text-slate-700 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{v.plate}</div>
                    <div className="text-xs text-slate-500 font-mono">{v.id}</div>
                  </td>

                  <td className="px-4 py-3">{v.type}</td>
                  <td className="px-4 py-3">{formatKg(v.capacityKg)}</td>
                  <td className="px-4 py-3">{v.city}</td>

                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{v.driverName || "-"}</div>
                    <div className="text-xs text-slate-500 font-mono">{v.driverId || ""}</div>
                  </td>

                  <td className="px-4 py-3 text-slate-500">{formatDate(v.lastSeen)}</td>

                  <td className="px-4 py-3">
                    <span className={["inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", statusBadge(v.status)].join(" ")}>
                      {v.status}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(v)}>
                        Düzenle
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => askStatus(v)}>
                        Durum
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {pageData.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
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
            onPageSizeChange={(n) => {
              setPageSize(n);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={!!selected}
        title={selected?.mode === "create" ? "Yeni Araç" : "Araç Düzenle"}
        onClose={closeModal}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeModal}>İptal</Button>
            <Button onClick={saveVehicle}>Kaydet</Button>
          </div>
        }
      >
        {form && (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Plaka</Label>
              <Input
                value={form.plate}
                onChange={(e) => setForm((p) => ({ ...p, plate: e.target.value }))}
                placeholder="Örn: 34 ABC 123"
              />
            </div>

            <div>
              <Label>Araç Tipi</Label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
              >
                {TYPE_OPTIONS.map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Kapasite (kg)</Label>
              <Input
                type="number"
                value={form.capacityKg}
                onChange={(e) => setForm((p) => ({ ...p, capacityKg: Number(e.target.value) }))}
                placeholder="Örn: 12000"
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

            <div className="md:col-span-2">
              <Label>Şehir</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                placeholder="Örn: İstanbul"
              />
            </div>

            <div>
              <Label>Şoför Adı</Label>
              <Input
                value={form.driverName}
                onChange={(e) => setForm((p) => ({ ...p, driverName: e.target.value }))}
                placeholder="Örn: Mustafa Yıldız"
              />
            </div>

            <div>
              <Label>Şoför ID</Label>
              <Input
                value={form.driverId}
                onChange={(e) => setForm((p) => ({ ...p, driverId: e.target.value }))}
                placeholder="Örn: D-3001"
              />
            </div>

            <div className="md:col-span-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              Bu ekran demo/mock çalışıyor. Backend geldiğinde araçlar API üzerinden yönetilecek.
            </div>
          </div>
        )}
      </Modal>

      {/* Status Modal */}
      <Modal
        open={!!confirm}
        title="Durum Değiştir"
        onClose={() => setConfirm(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirm(null)}>Kapat</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="text-sm text-slate-700">
            <span className="font-semibold">{confirm?.vehicle?.plate}</span> için yeni durum seç:
          </div>

          <div className="grid gap-2">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => applyStatus(s)}
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

function nextVehicleId(vehicles) {
  const nums = vehicles
    .map((x) => Number(String(x.id).replace("V-", "")))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 4000;
  return `V-${max + 1}`;
}

function validate(v) {
  const errors = [];
  if (!v?.plate?.trim()) errors.push("Plaka zorunlu.");
  if (!v?.city?.trim()) errors.push("Şehir zorunlu.");
  if (!v?.type?.trim()) errors.push("Araç tipi zorunlu.");
  if (Number(v?.capacityKg) <= 0) errors.push("Kapasite 0'dan büyük olmalı.");
  return errors;
}
