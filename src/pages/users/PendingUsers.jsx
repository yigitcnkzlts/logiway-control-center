import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import UsersTable from "./components/UsersTable";

export default function PendingUsers() {
  const navigate = useNavigate();
  const [users] = useState([
    {
      id: "u-1002",
      adSoyad: "Mehmet Kaya",
      email: "mehmet@gmail.com",
      rol: "Şoför",
      durum: "Doğrulama Bekliyor",
      createdAt: "2026-01-28",
    },
    {
      id: "u-1009",
      adSoyad: "Ece Kılıç",
      email: "ece@gmail.com",
      rol: "İlan Veren",
      durum: "Doğrulama Bekliyor",
      createdAt: "2026-02-01",
    },
  ]);

  const pendingList = useMemo(
    () => users.filter((u) => u.durum === "Doğrulama Bekliyor"),
    [users]
  );

  return (
    <div className="p-6 space-y-4">
      {/* Başlık */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Doğrulama Bekleyenler</h1>
          <p className="text-sm text-gray-500">
            Telefon / email / evrak doğrulaması bekleyen kullanıcılar.
          </p>
        </div>

        <button
          type="button"
          className="px-4 py-2 rounded-lg border hover:bg-gray-50"
          onClick={() => navigate("/kullanicilar")}
        >
          Tüm Kullanıcılar
        </button>
      </div>

      {/* Liste */}
      <UsersTable
        rows={pendingList}
        onRowClick={(id) => navigate(`/kullanicilar/${id}`)}
      />
      <div className="text-sm text-gray-500">
        MVP: Şimdilik sadece liste. Sonra “Onayla / Reddet / Evrak İste” gelecek.
      </div>
    </div>
  );
}
