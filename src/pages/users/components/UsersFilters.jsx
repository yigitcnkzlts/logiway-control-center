export default function UsersFilters({ value, onChange }) {
  const handleChange = (field, nextValue) => {
    onChange((prev) => ({ ...prev, [field]: nextValue }));
  };

  return (
    <div className="border rounded-lg p-4 flex flex-col md:flex-row gap-3 md:items-center">
      {/* Arama */}
      <input
        className="border rounded-lg px-3 py-2 w-full md:w-72"
        placeholder="Ara: ad, email, id..."
        value={value.q}
        onChange={(e) => handleChange("q", e.target.value)}
      />

      {/* Rol filtresi */}
      <select
        className="border rounded-lg px-3 py-2 w-full md:w-56"
        value={value.rol}
        onChange={(e) => handleChange("rol", e.target.value)}
      >
        <option value="Tümü">Rol: Tümü</option>
        <option value="İlan Veren">İlan Veren</option>
        <option value="Şoför">Şoför</option>
        <option value="Admin">Admin</option>
      </select>

      {/* Durum filtresi */}
      <select
        className="border rounded-lg px-3 py-2 w-full md:w-64"
        value={value.durum}
        onChange={(e) => handleChange("durum", e.target.value)}
      >
        <option value="Tümü">Durum: Tümü</option>
        <option value="Aktif">Aktif</option>
        <option value="Doğrulama Bekliyor">Doğrulama Bekliyor</option>
        <option value="Bloklu">Bloklu</option>
      </select>
    </div>
  );
}
