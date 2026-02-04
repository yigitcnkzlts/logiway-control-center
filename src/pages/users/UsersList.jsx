import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import UsersFilters from "./components/UsersFilters";
import UsersTable from "./components/UsersTable";

export default function UsersList() {
  const navigate = useNavigate();
  const [users] = useState([
    {
      id: "u-1001",
      adSoyad: "Ahmet Yılmaz",
      email: "ahmet@gmail.com",
      rol: "İlan Veren",
      durum: "Aktif",
      createdAt: "2026-01-20",
    },
    {
      id: "u-1002",
      adSoyad: "Mehmet Kaya",
      email: "mehmet@gmail.com",
      rol: "Şoför",
      durum: "Doğrulama Bekliyor",
      createdAt: "2026-01-28",
    },
    {
      id: "u-1003",
      adSoyad: "Ayşe Demir",
      email: "ayse@gmail.com",
      rol: "Admin",
      durum: "Aktif",
      createdAt: "2025-12-10",
    },
  ]);

  // Filtre state'i
  const [filters, setFilters] = useState({
    q: "",
    rol: "Tümü",
    durum: "Tümü",
  });

  // Listeyi filtrele
  const filteredUsers = useMemo(() => {
    const q = filters.q.trim().toLowerCase();

    return users.filter((u) => {
      const matchesQ =
        !q ||
        u.adSoyad.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q);

      const matchesRol = filters.rol === "Tümü" ? true : u.rol === filters.rol;
      const matchesDurum =
        filters.durum === "Tümü" ? true : u.durum === filters.durum;

      return matchesQ && matchesRol && matchesDurum;
    });
  }, [users, filters]);

  // Satıra tıklayınca detay sayfasına git
  const handleRowClick = (userId) => {
    // Kullanıcı detay route: /kullanicilar/:id
    navigate(`/kullanicilar/${userId}`);
  };

  return (
    <div className="p-6 space-y-4">
      {/* Sayfa başlığı */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Tüm Kullanıcılar</h1>
          <p className="text-sm text-gray-500">
            Arama / filtreleme yap, kullanıcıyı seç ve detaya git.
          </p>
        </div>

        {/* Hızlı aksiyonlar (ileride: kullanıcı ekle, dışa aktar vs.) */}
        <button
          type="button"
          className="px-4 py-2 rounded-lg border hover:bg-gray-50"
          onClick={() => navigate("/kullanicilar/dogrulama")}
        >
          Doğrulama Bekleyenler
        </button>
      </div>

      {/* Filtre bar */}
      <UsersFilters value={filters} onChange={setFilters} />

      {/* Tablo */}
      <UsersTable rows={filteredUsers} onRowClick={handleRowClick} />
    </div>
  );
}
