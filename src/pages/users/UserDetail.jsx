import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function UserDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = useMemo(() => {
    return {
      id,
      adSoyad: "Mehmet Kaya",
      email: "mehmet@gmail.com",
      rol: "Şoför",
      durum: "Doğrulama Bekliyor",
      createdAt: "2026-01-28",
      phone: "+90 5xx xxx xx xx",
    };
  }, [id]);

  return (
    <div className="p-6 space-y-4">
      {/* Üst bar */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Kullanıcı Detay</h1>
          <p className="text-sm text-gray-500">Kullanıcı ID: {user.id}</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="px-4 py-2 rounded-lg border hover:bg-gray-50"
            onClick={() => navigate("/kullanicilar")}
          >
            Geri Dön
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg border hover:bg-gray-50"
            onClick={() => alert("MVP: Blokla aksiyonu sonra eklenecek")}
          >
            Blokla
          </button>
        </div>
      </div>

      {/* Kartlar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Profil */}
        <div className="border rounded-lg p-4 space-y-2">
          <h2 className="font-semibold">Profil</h2>
          <div className="text-sm text-gray-600">
            <div>
              <span className="text-gray-500">Ad Soyad:</span> {user.adSoyad}
            </div>
            <div>
              <span className="text-gray-500">Email:</span> {user.email}
            </div>
            <div>
              <span className="text-gray-500">Telefon:</span> {user.phone}
            </div>
          </div>
        </div>

        {/* Rol & Durum */}
        <div className="border rounded-lg p-4 space-y-2">
          <h2 className="font-semibold">Rol & Durum</h2>
          <div className="text-sm text-gray-600">
            <div>
              <span className="text-gray-500">Rol:</span> {user.rol}
            </div>
            <div>
              <span className="text-gray-500">Durum:</span> {user.durum}
            </div>
            <div>
              <span className="text-gray-500">Kayıt Tarihi:</span>{" "}
              {user.createdAt}
            </div>
          </div>
        </div>

        {/* Güvenlik */}
        <div className="border rounded-lg p-4 space-y-2">
          <h2 className="font-semibold">Güvenlik</h2>
          <p className="text-sm text-gray-500">
            MVP: Güvenlik alanı placeholder.
          </p>
        </div>

        {/* Aktivite */}
        <div className="border rounded-lg p-4 space-y-2">
          <h2 className="font-semibold">Aktivite</h2>
          <p className="text-sm text-gray-500">
            {/* Türkçe not: Kullanıcının ilanları, eşleşmeleri, işlem logları */}
            MVP: Aktivite alanı placeholder.
          </p>
        </div>
      </div>
    </div>
  );
}
