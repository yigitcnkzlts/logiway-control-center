import { useMemo, useState } from "react";
import PageHeader from "../components/layout/PageHeader";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import Pagination from "../components/common/Pagination";

const INITIAL_USERS = [
  { id: "U-1001", name: "Ahmet Kaya", email: "ahmet.kaya@mail.com", role: "Admin", status: "Aktif", city: "İstanbul", createdAt: "2026-01-12" },
  { id: "U-1002", name: "Zeynep Demir", email: "zeynep.demir@mail.com", role: "Operasyon", status: "Aktif", city: "Ankara", createdAt: "2026-01-18" },
  { id: "U-1003", name: "Mehmet Çetin", email: "mehmet.cetin@mail.com", role: "İlan Veren", status: "Aktif", city: "Bursa", createdAt: "2026-01-22" },
  { id: "U-1004", name: "Elif Yılmaz", email: "elif.yilmaz@mail.com", role: "Şoför", status: "Aktif", city: "İzmir", createdAt: "2026-01-25" },
  { id: "U-1005", name: "Can K.", email: "can.k@mail.com", role: "Admin", status: "Pasif", city: "Tekirdağ", createdAt: "2026-01-28" },
  { id: "U-1006", name: "Seda Arslan", email: "seda.arslan@mail.com", role: "Şoför", status: "Aktif", city: "Kocaeli", createdAt: "2026-01-29" },
  { id: "U-1007", name: "Murat Şahin", email: "murat.sahin@mail.com", role: "İlan Veren", status: "Aktif", city: "Konya", createdAt: "2026-01-30" },
  { id: "U-1008", name: "Ayşe Koç", email: "ayse.koc@mail.com", role: "Operasyon", status: "Pasif", city: "Antalya", createdAt: "2026-01-31" },
  { id: "U-1009", name: "Hakan Aydın", email: "hakan.aydin@mail.com", role: "Şoför", status: "Aktif", city: "Adana", createdAt: "2026-02-01" },
  { id: "U-1010", name: "Derya Güneş", email: "derya.gunes@mail.com", role: "İlan Veren", status: "Aktif", city: "Eskişehir", createdAt: "2026-02-01" },
];

const ROLE_OPTIONS = ["Admin", "Operasyon", "İlan Veren", "Şoför"];
const STATUS_OPTIONS = ["Aktif", "Pasif"];

export default function Users() {
  
  const [users, setUsers] = useState(INITIAL_USERS);

  // Filters
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("Hepsi");
  const [status, setStatus] = useState("Hepsi");

  // Sorting
  const [sort, setSort] = useState({ key: "createdAt", dir: "desc" });

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [selected, setSelected] = useState(null); 
  const [confirm, setConfirm] = useState(null); 

  // Form state (modal içi)
  const [form, setForm] = useState(null);

  function resetToFirstPage() {
    setPage(1);
  }

  function onChangePageSize(n) {
    setPageSize(n);
    setPage(1);
  }

  function badgeStatus(s) {
    return s === "Aktif"
      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
      : "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
  }

  function badgeRole(r) {
    const map = {
      Admin: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
      Operasyon: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
      "İlan Veren": "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
      Şoför: "bg-cyan-50 text-cyan-800 ring-1 ring-cyan-200",
    };
    return map[r] || "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return users.filter((u) => {
      const matchQuery =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        u.city.toLowerCase().includes(q);

      const matchRole = role === "Hepsi" ? true : u.role === role;
      const matchStatus = status === "Hepsi" ? true : u.status === status;

      return matchQuery && matchRole && matchStatus;
    });
  }, [users, query, role, status]);

  const sorted = useMemo(() => {
    const { key, dir } = sort;

    const clone = [...filtered];
    clone.sort((a, b) => {
      const va = a[key];
      const vb = b[key];

      // date string sort
      if (key === "createdAt") {
        return dir === "asc"
          ? String(va).localeCompare(String(vb))
          : String(vb).localeCompare(String(va));
      }

      // generic string sort
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

  function openNewUser() {
    const nextId = nextUserId(users);

    const draft = {
      id: nextId,
      name: "",
      email: "",
      role: "İlan Veren",
      status: "Aktif",
      city: "",
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setSelected({ mode: "create", user: draft });
    setForm(draft);
  }

  function openEditUser(user) {
    setSelected({ mode: "edit", user });
    setForm({ ...user });
  }

  function closeUserModal() {
    setSelected(null);
    setForm(null);
  }

  function saveUser() {
    const errors = validate(form);
    if (errors.length) {
      alert(errors.join("\n"));
      return;
    }

    if (selected?.mode === "create") {
      setUsers((prev) => [form, ...prev]);
    } else if (selected?.mode === "edit") {
      setUsers((prev) => prev.map((u) => (u.id === form.id ? form : u)));
    }

    closeUserModal();
  }

  function confirmStatusChange(user) {
    setConfirm({
      type: user.status === "Aktif" ? "deactivate" : "activate",
      user,
    });
  }

  function applyStatusChange() {
    if (!confirm?.user) return;

    const target = confirm.user;
    const nextStatus = confirm.type === "deactivate" ? "Pasif" : "Aktif";

    setUsers((prev) =>
      prev.map((u) => (u.id === target.id ? { ...u, status: nextStatus } : u))
    );

    setConfirm(null);
  }

  return (
    <>
      <PageHeader
        breadcrumb="Ana Sayfa / Kullanıcılar"
        title="Kullanıcılar"
        description="Kullanıcıları listele, filtrele, düzenle ve yönet"
        right={<Button onClick={openNewUser}>Yeni Kullanıcı</Button>}
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
                placeholder="Ara: ad, e-posta, ID, şehir..."
              />
            </div>

            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                resetToFirstPage();
              }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
            >
              <option value="Hepsi">Rol: Hepsi</option>
              {ROLE_OPTIONS.map((x) => (
                <option key={x} value={x}>
                  Rol: {x}
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
              <option value="Hepsi">Durum: Hepsi</option>
              {STATUS_OPTIONS.map((x) => (
                <option key={x} value={x}>
                  Durum: {x}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-500">
            Gösterilen:{" "}
            <span className="font-semibold text-slate-900">{total}</span> kullanıcı
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold text-slate-600">
                <Th label="Kullanıcı" onClick={() => toggleSort("name")} icon={sortIcon("name")} />
                <Th label="Rol" onClick={() => toggleSort("role")} icon={sortIcon("role")} />
                <Th label="Durum" onClick={() => toggleSort("status")} icon={sortIcon("status")} />
                <Th label="Şehir" onClick={() => toggleSort("city")} icon={sortIcon("city")} />
                <Th label="Kayıt" onClick={() => toggleSort("createdAt")} icon={sortIcon("createdAt")} />
                <th className="px-4 py-3 text-right">İşlemler</th>
              </tr>
            </thead>

            <tbody>
              {pageData.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-slate-100 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 grid place-items-center text-xs font-bold text-slate-700">
                        {initials(u.name)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{u.name}</div>
                        <div className="text-xs text-slate-500">
                          {u.email} • <span className="font-mono">{u.id}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className={["inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", badgeRole(u.role)].join(" ")}>
                      {u.role}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className={["inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", badgeStatus(u.status)].join(" ")}>
                      {u.status}
                    </span>
                  </td>

                  <td className="px-4 py-3">{u.city}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditUser(u)}>
                        Düzenle
                      </Button>

                      <Button
                        variant={u.status === "Aktif" ? "danger" : "secondary"}
                        size="sm"
                        onClick={() => confirmStatusChange(u)}
                      >
                        {u.status === "Aktif" ? "Pasif Et" : "Aktif Et"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {pageData.length === 0 && (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={6}>
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

      {/* User Modal */}
      <Modal
        open={!!selected}
        title={selected?.mode === "create" ? "Yeni Kullanıcı" : "Kullanıcı Düzenle"}
        onClose={closeUserModal}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeUserModal}>
              İptal
            </Button>
            <Button onClick={saveUser}>Kaydet</Button>
          </div>
        }
      >
        {form && (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Ad Soyad</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Örn: Ali Veli" />
            </div>

            <div>
              <Label>E-posta</Label>
              <Input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="ornek@mail.com" />
            </div>

            <div>
              <Label>Rol</Label>
              <select
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
              >
                {ROLE_OPTIONS.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Durum</Label>
              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
              >
                {STATUS_OPTIONS.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <Label>Şehir</Label>
              <Input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} placeholder="Örn: İstanbul" />
            </div>

            <div className="md:col-span-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              Bu modül demo/mock çalışıyor. Backend geldiğinde “Kaydet” gerçek API çağrısı olacak.
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
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Vazgeç
            </Button>
            <Button
              variant={confirm?.type === "deactivate" ? "danger" : "primary"}
              onClick={applyStatusChange}
            >
              Onayla
            </Button>
          </div>
        }
      >
        <div className="text-sm text-slate-700">
          <span className="font-semibold">{confirm?.user?.name}</span>{" "}
          kullanıcısını{" "}
          {confirm?.type === "deactivate" ? "pasif" : "aktif"} etmek istiyor musun?
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

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/);
  const a = parts[0]?.[0] || "U";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase();
}

function formatDate(iso) {
  if (!iso) return "-";
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}

function nextUserId(users) {
  const nums = users
    .map((u) => Number(String(u.id).replace("U-", "")))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 1000;
  return `U-${max + 1}`;
}

function validate(u) {
  const errors = [];
  if (!u?.name?.trim()) errors.push("Ad Soyad zorunlu.");
  if (!u?.email?.trim()) errors.push("E-posta zorunlu.");
  if (u?.email && !/^\S+@\S+\.\S+$/.test(u.email)) errors.push("E-posta formatı geçersiz.");
  if (!u?.city?.trim()) errors.push("Şehir zorunlu.");
  return errors;
}
