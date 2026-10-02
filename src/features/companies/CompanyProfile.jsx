import { useState } from "react";
import {
  Building2, ChevronDown, ChevronUp,
  MessageCircle, ShieldCheck, Truck,
} from "lucide-react";

const VEHICLE_TYPES = ["Tenteli", "Frigo", "Mega", "Lowbed", "Kamyon", "Van"];
const COUNTRY_LIMIT = 4;

/**
 * CompanyProfile
 *
 * Props:
 *   company   – string name  OR  object { name, country, verified, fleet, completedShipments, rating, onTimeRate, cancellationRate, vehicleTypes, operatingCountries }
 *   context   – "drawer" | "matched"  — controls which actions are shown
 *   onMessage – () => void
 *   onOffers  – () => void
 *   onShipment – () => void
 */
export default function CompanyProfile({
  company: companyProp = "Doğrulanmış Firma",
  context = "drawer",
  onMessage,
  onOffers,
  onShipment,
}) {
  const [showAllCountries, setShowAllCountries] = useState(false);

  // Accept string (legacy) or object
  const c =
    typeof companyProp === "string"
      ? { name: companyProp, verified: true }
      : companyProp;

  const {
    name = "Firma",
    country,
    verified = false,
    fleet,
    completedShipments,
    rating,
    onTimeRate,
    cancellationRate,
    vehicleTypes,
    operatingCountries,
  } = c;

  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const countries = operatingCountries || [];
  const visibleCountries = showAllCountries ? countries : countries.slice(0, COUNTRY_LIMIT);
  const hiddenCount = countries.length - COUNTRY_LIMIT;

  // Only show metrics that backend actually provides
  const metrics = [
    fleet             != null  && { label: "Filo büyüklüğü",     value: `${fleet} araç` },
    completedShipments != null && { label: "Tamamlanan sevkiyat", value: completedShipments },
    rating            != null  && { label: "Puan",                value: `${rating} / 5` },
    onTimeRate        != null  && { label: "Zamanında teslimat",  value: `%${onTimeRate}` },
    cancellationRate  != null  && { label: "İptal oranı",         value: `%${cancellationRate}` },
  ].filter(Boolean);

  const types = vehicleTypes || [];

  // Actions depend on context
  // "drawer" = marketplace browsing → no contact info, no phone
  // "matched" = after offer acceptance / active shipment → full contact available
  const showContactActions = context === "matched";

  return (
    <div className="company-profile">
      {/* ── Header ── */}
      <div className="cp-header">
        <span className="cp-avatar" aria-hidden="true">{initials}</span>
        <div className="cp-header-info">
          <h3 className="cp-name">{name}</h3>
          <div className="cp-meta">
            {country && (
              <span className="cp-country">
                <Building2 size={12} aria-hidden="true" /> {country}
              </span>
            )}
            {verified && (
              <span className="cp-verified" aria-label="Doğrulanmış firma">
                <ShieldCheck size={12} aria-hidden="true" /> Doğrulanmış Firma
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Trust metrics (only real data) ── */}
      {metrics.length > 0 && (
        <div className="cp-metrics" aria-label="Firma metrikleri">
          {metrics.map(({ label, value }) => (
            <div key={label} className="cp-metric">
              <small>{label}</small>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      )}

      {/* ── Vehicle types ── */}
      {types.length > 0 && (
        <div className="cp-vehicles" aria-label="Desteklenen araç tipleri">
          <span className="cp-section-label">Araç tipleri</span>
          <div className="cp-vehicle-chips">
            {types.map((t) => (
              <span key={t} className="cp-chip">
                <Truck size={11} aria-hidden="true" /> {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Operating countries ── */}
      {countries.length > 0 && (
        <div className="cp-countries" aria-label="Operasyon ülkeleri">
          <span className="cp-section-label">Operasyon ülkeleri</span>
          <div className="cp-country-chips">
            {visibleCountries.map((ct) => (
              <span key={ct} className="cp-chip">{ct}</span>
            ))}
            {!showAllCountries && hiddenCount > 0 && (
              <button
                className="cp-chip cp-chip--more"
                onClick={() => setShowAllCountries(true)}
                aria-label={`${hiddenCount} ülke daha göster`}
              >
                +{hiddenCount} ülke
              </button>
            )}
            {showAllCountries && countries.length > COUNTRY_LIMIT && (
              <button
                className="cp-chip cp-chip--more"
                onClick={() => setShowAllCountries(false)}
                aria-label="Ülkeleri daralt"
              >
                <ChevronUp size={11} /> Kapat
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="cp-actions">
        {onMessage && showContactActions && (
          <button className="cp-btn cp-btn--primary" onClick={onMessage} aria-label={`${name} ile mesajlaş`}>
            <MessageCircle size={14} aria-hidden="true" /> Mesaj Gönder
          </button>
        )}
        {onOffers && context !== "drawer" && (
          <button className="cp-btn cp-btn--secondary" onClick={onOffers} aria-label={`${name} tekliflerini gör`}>
            Tekliflerini Gör
          </button>
        )}
        {onShipment && showContactActions && (
          <button className="cp-btn cp-btn--secondary" onClick={onShipment} aria-label="Aktif sevkiyatı aç">
            Aktif Sevkiyatı Aç
          </button>
        )}
      </div>

      {/* ── Privacy note ── */}
      {!showContactActions && (
        <p className="cp-privacy-note">
          Telefon ve doğrudan iletişim bilgileri yalnızca teklif kabulü ve sevkiyat oluşturulmasından sonra açılır.
        </p>
      )}
    </div>
  );
}

// Re-export for internal use where only name string is passed
export { VEHICLE_TYPES };
