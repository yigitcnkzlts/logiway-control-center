import { useState } from "react";
import { Check, MapPin, MessageCircle, X } from "lucide-react";
import CompanyProfile from "../companies/CompanyProfile";

export function LoadDetailDrawer({ load, onClose, onOffer, onMessage }) {
  const [tab, setTab] = useState("Genel Bakış");
  if (!load) return null;

  const reasons = load.matchReasons || [
    "Araç tipi uygun",
    "Kapasite yeterli",
    "Pickup bölgesine yakın",
    "Rota uyumlu",
    "Tarih uygun",
  ];

  function handleKey(e) {
    if (e.key === "Escape") onClose?.();
  }

  return (
    <div
      className="drawer-backdrop"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${load.cargo} yük detayı`}
      onKeyDown={handleKey}
    >
      <aside className="load-drawer" onMouseDown={(e) => e.stopPropagation()}>
        <header>
          <div>
            <span>{load.id}</span>
            <h2>{load.cargo}</h2>
            <p>{load.from} → {load.to}</p>
          </div>
          <button onClick={onClose} aria-label="Çekmeceyi kapat">
            <X size={18} />
          </button>
        </header>

        <nav role="tablist" aria-label="Yük detay sekmeleri">
          {["Genel Bakış", "Rota", "Firma", "Teklif"].map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className={tab === t ? "active" : ""}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </nav>

        {tab === "Genel Bakış" && (
          <div className="drawer-content" role="tabpanel">
            <div className="drawer-score">
              <strong>%{load.match} uygun</strong>
              <span>
                {reasons.map((r) => (
                  <em key={r}>
                    <Check size={10} aria-hidden="true" />
                    {r}
                  </em>
                ))}
              </span>
            </div>
            <dl>
              {[
                ["Yükleme tarihi", load.date],
                ["Araç", load.vehicle],
                ["Ağırlık", load.weight],
                ["Bütçe", load.price],
                ["Mesafe", load.distance],
                ["Özel şartlar", load.specialRequirements || "Standart taşıma"],
              ].map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{value || "—"}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {tab === "Rota" && (
          <div className="drawer-content" role="tabpanel">
            <div className="drawer-route">
              <MapPin size={16} aria-hidden="true" />
              <div>
                <small>YÜKLEME</small>
                <strong>{load.from}</strong>
                <p>{load.pickupAddress || "Açık adres teklif kabulünden sonra paylaşılır."}</p>
              </div>
            </div>
            <div className="drawer-route">
              <MapPin size={16} aria-hidden="true" />
              <div>
                <small>TESLİMAT</small>
                <strong>{load.to}</strong>
                <p>{load.deliveryAddress || "Açık adres teklif kabulünden sonra paylaşılır."}</p>
              </div>
            </div>
          </div>
        )}

        {tab === "Firma" && (
          <div role="tabpanel">
            <CompanyProfile company={load.company} context="drawer" />
          </div>
        )}

        {tab === "Teklif" && (
          <div className="drawer-content drawer-offer" role="tabpanel">
            <h3>Taşıma teklifinizi oluşturun</h3>
            <p>Tutar ve operasyon notu, teklif API sözleşmesindeki mevcut alanlarla gönderilir.</p>
            <button onClick={() => onOffer(load)}>Teklif Ver</button>
            <button className="secondary" onClick={() => onMessage(load)}>
              Mesaj Gönder
            </button>
          </div>
        )}

        <footer>
          <button onClick={() => onMessage(load)} aria-label="Mesaj gönder">
            <MessageCircle size={14} aria-hidden="true" /> Mesaj Gönder
          </button>
          <button onClick={() => onOffer(load)} aria-label="Teklif ver">
            Teklif Ver
          </button>
        </footer>
      </aside>
    </div>
  );
}
