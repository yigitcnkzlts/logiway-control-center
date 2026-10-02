import { useState } from "react";

export function MarketplaceFilters({ filters, onChange }) {
  const [more, setMore] = useState(false);

  return (
    <section className="market-filters" aria-label="Yük pazarı filtreleri">
      <div className="main-filters">
        <label>
          Kalkış
          <input
            value={filters.origin}
            onChange={(e) => onChange({ ...filters, origin: e.target.value })}
            placeholder="Şehir veya ülke"
            aria-label="Kalkış şehri veya ülkesi"
          />
        </label>
        <label>
          Varış
          <input
            value={filters.destination}
            onChange={(e) => onChange({ ...filters, destination: e.target.value })}
            placeholder="Şehir veya ülke"
            aria-label="Varış şehri veya ülkesi"
          />
        </label>
        <label>
          Yükleme tarihi
          <input
            type="date"
            value={filters.date}
            onChange={(e) => onChange({ ...filters, date: e.target.value })}
            aria-label="Yükleme tarihi"
          />
        </label>
        <label>
          Araç tipi
          <select
            value={filters.vehicle}
            onChange={(e) => onChange({ ...filters, vehicle: e.target.value })}
            aria-label="Araç tipi"
          >
            <option>Tümü</option>
            <option>Tenteli</option>
            <option>Frigo</option>
            <option>Mega</option>
            <option>Lowbed</option>
            <option>Kamyon</option>
            <option>Van</option>
          </select>
        </label>
        <button
          onClick={() => setMore((v) => !v)}
          aria-expanded={more}
          aria-controls="more-filters"
        >
          {more ? "Daha az" : "Daha fazla"} filtre
        </button>
      </div>

      {more && (
        <div id="more-filters" className="more-filters">
          <label>
            Maks. ağırlık
            <input type="number" placeholder="24 ton" aria-label="Maksimum ağırlık (ton)" />
          </label>
          <label>
            Fiyat aralığı
            <input placeholder="2.000 – 5.000" aria-label="Fiyat aralığı" />
          </label>
          <label>
            Para birimi
            <select aria-label="Para birimi">
              <option>EUR</option>
              <option>TRY</option>
              <option>GBP</option>
            </select>
          </label>
        </div>
      )}
    </section>
  );
}
