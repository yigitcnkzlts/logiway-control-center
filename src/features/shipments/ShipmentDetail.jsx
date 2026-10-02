import { useEffect, useState } from "react";
import {
  AlertTriangle, Check, ChevronRight, Clock3, FileText,
  Mail, MapPin, MessageCircle, Phone, Truck, UserRound,
} from "lucide-react";
import { loadLatestMatchPosition } from "../../api/operationsClient";
import { isApiConfigured, isDemoMode } from "../../api/apiClient";

// ── Demo shipment data ─────────────────────────────────────────────────────
const DEMO_SHIPMENT = {
  id: "SHP-2847",
  loadRef: "LW-2847",
  route: { from: "Bergen, Norveç", to: "Milano, İtalya" },
  status: "Yolda",
  statusKey: "IN_TRANSIT",
  cargo: "Soğuk zincir somon",
  weight: "18 ton",
  vehicle: "Frigorifik",
  pickupEta: "12 Eyl · 08:00",
  deliveryEta: "14 Eyl · 18:30",
  carrier: "ABC Logistics",
  vehiclePlate: "34 ABC 123 · Volvo FH",
  driver: "Ahmet Yılmaz",
  shipper: "NordCargo AS",
  agreedAmount: "4.650 €",
  currency: "EUR",
  operationContact: { name: "Mehmet Kaya", phone: "+905000000000", email: "operasyon@firma.com" },
  driverContact: { name: "Ahmet Yılmaz", phone: "+905111111111", plate: "34 ABC 123" },
};

const STEPS = [
  { key: "PLANNED",        label: "Planlandı" },
  { key: "VEHICLE_ASSIGNED", label: "Araç Atandı" },
  { key: "HEADING_TO_PICKUP", label: "Yüklemeye Gidiyor" },
  { key: "LOADED",         label: "Yüklendi" },
  { key: "IN_TRANSIT",     label: "Yolda" },
  { key: "AT_DELIVERY",    label: "Teslim Noktasında" },
  { key: "DELIVERED",      label: "Teslim Edildi" },
];

const TABS = ["Genel Bakış", "Takip", "Mesajlar", "Belgeler", "Aktivite"];

// ── Helpers ────────────────────────────────────────────────────────────────
function stepIndex(key) {
  const i = STEPS.findIndex((s) => s.key === key);
  return i === -1 ? 0 : i;
}

function timeAgo(isoString) {
  if (!isoString) return null;
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60) return `${diff} sn önce`;
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
  return `${Math.floor(diff / 86400)} gün önce`;
}

// ── Sub-components ─────────────────────────────────────────────────────────
function StatusStepper({ currentKey }) {
  const current = stepIndex(currentKey);
  return (
    <div className="sd-stepper" role="list" aria-label="Sevkiyat ilerleme adımları">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div
            key={step.key}
            role="listitem"
            className={`sd-step ${done ? "sd-step--done" : ""} ${active ? "sd-step--active" : ""}`}
          >
            <div className="sd-step-icon" aria-hidden="true">
              {done ? <Check size={13} /> : <span>{i + 1}</span>}
            </div>
            <span className="sd-step-label">{step.label}</span>
            {i < STEPS.length - 1 && <div className="sd-step-line" aria-hidden="true" />}
          </div>
        );
      })}
    </div>
  );
}

function OverviewTab({ shipment }) {
  const s = shipment;
  return (
    <div className="sd-overview">
      {/* Yük */}
      <section className="sd-group">
        <h3 className="sd-group-title">Yük</h3>
        <div className="sd-facts">
          <div><small>Yük adı</small><strong>{s.cargo}</strong></div>
          <div><small>Ağırlık</small><strong>{s.weight}</strong></div>
          <div><small>Araç tipi</small><strong>{s.vehicle}</strong></div>
        </div>
      </section>

      {/* Rota */}
      <section className="sd-group">
        <h3 className="sd-group-title">Rota</h3>
        <div className="sd-route-row">
          <div className="sd-route-node">
            <span className="sd-route-dot sd-route-dot--a">A</span>
            <div>
              <small>YÜKLEME</small>
              <strong>{s.route.from}</strong>
              <span>Pickup ETA: {s.pickupEta}</span>
            </div>
          </div>
          <div className="sd-route-line-h" aria-hidden="true" />
          <div className="sd-route-node">
            <span className="sd-route-dot sd-route-dot--b">B</span>
            <div>
              <small>TESLİMAT</small>
              <strong>{s.route.to}</strong>
              <span>Delivery ETA: {s.deliveryEta}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Taraflar */}
      <section className="sd-group">
        <h3 className="sd-group-title">Taraflar</h3>
        <div className="sd-facts">
          <div><small>Yük Veren</small><strong>{s.shipper}</strong></div>
          <div><small>Taşıyıcı</small><strong>{s.carrier}</strong></div>
        </div>
      </section>

      {/* Operasyon */}
      <section className="sd-group">
        <h3 className="sd-group-title">Operasyon</h3>
        <div className="sd-facts">
          <div><small>Araç</small><strong>{s.vehiclePlate}</strong></div>
          <div><small>Şoför</small><strong>{s.driver}</strong></div>
          <div><small>Durum</small><strong>{s.status}</strong></div>
        </div>
      </section>

      {/* Ticari */}
      <section className="sd-group">
        <h3 className="sd-group-title">Ticari</h3>
        <div className="sd-facts">
          <div><small>Anlaşılan Tutar</small><strong>{s.agreedAmount}</strong></div>
          <div><small>Para Birimi</small><strong>{s.currency}</strong></div>
        </div>
      </section>
    </div>
  );
}

function TrackingTab({ matchId }) {
  const [position, setPosition] = useState(null);
  const [loading, setLoading]   = useState(() => Boolean(matchId && isApiConfigured() && !isDemoMode()));
  const [error, setError]       = useState("");

  const isLive = isApiConfigured() && !isDemoMode();

  useEffect(() => {
    if (!isLive || !matchId) return;
    loadLatestMatchPosition(matchId)
      .then((p) => { setPosition(p); setLoading(false); })
      .catch(() => { setError("Konum bilgisi alınamadı."); setLoading(false); });
  }, [matchId, isLive]);

  const ago = position?.timestamp ? timeAgo(position.timestamp) : null;

  return (
    <div className="sd-tracking">
      {/* Map placeholder — no fake live map */}
      <div className="sd-map-placeholder" role="img" aria-label="Harita entegrasyonu bekleniyor">
        <MapPin size={28} aria-hidden="true" />
        <strong>Harita entegrasyonu bekleniyor</strong>
        <small>Telematik ve harita sağlayıcısı API sözleşmesi tamamlandığında canlı konum burada görüntülenecektir.</small>
      </div>

      {/* Live position block */}
      {loading && <p className="sd-tracking-state">Konum yükleniyor…</p>}
      {error   && <p className="sd-tracking-state sd-tracking-state--error"><AlertTriangle size={14} /> {error}</p>}

      {position && (
        <div className="sd-position-card">
          <div className="sd-position-main">
            <MapPin size={16} aria-hidden="true" />
            <div>
              <strong>Son konum</strong>
              <span>
                {position.city || position.lat
                  ? `${position.city || ""}${position.city && position.country ? ", " : ""}${position.country || ""}`.trim() || `${position.lat}, ${position.lng}`
                  : "Bilinmiyor"}
              </span>
              {ago && (
                <small className={`sd-freshness ${parseInt(ago) > 60 ? "sd-freshness--stale" : ""}`}>
                  <Clock3 size={11} aria-hidden="true" /> {ago} güncellendi
                </small>
              )}
            </div>
          </div>

          <div className="sd-tracking-facts">
            {position.remainingKm != null && (
              <div><small>Kalan mesafe</small><strong>{position.remainingKm} km</strong></div>
            )}
            {position.eta && (
              <div><small>ETA</small><strong>{new Date(position.eta).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</strong></div>
            )}
          </div>
        </div>
      )}

      {/* No live data — static known info */}
      {!isLive && (
        <div className="sd-position-card sd-position-card--demo">
          <div className="sd-position-main">
            <MapPin size={16} aria-hidden="true" />
            <div>
              <strong>Son konum</strong>
              <span>Hamburg, Almanya</span>
              <small className="sd-freshness sd-freshness--stale">
                <Clock3 size={11} aria-hidden="true" /> 8 dk önce güncellendi
              </small>
            </div>
          </div>
          <div className="sd-tracking-facts">
            <div><small>Kalan mesafe</small><strong>~980 km</strong></div>
            <div>
              <small>Delivery ETA</small>
              <strong>14 Eyl · 18:30</strong>
            </div>
          </div>
          <p className="sd-tracking-note">
            <AlertTriangle size={12} aria-hidden="true" />
            Telematik API bağlantısı bekleniyor. Gösterilen veri demo modundadır.
          </p>
        </div>
      )}
    </div>
  );
}

function DocumentsTab() {
  const docs = ["CMR", "Fatura", "POD / Teslim belgesi", "Fotoğraflar", "Gümrük belgesi"];
  return (
    <div className="sd-docs">
      {docs.map((doc) => (
        <button key={doc} className="sd-doc-row" aria-label={`${doc} belgesini görüntüle`}>
          <FileText size={16} aria-hidden="true" />
          <span>{doc}</span>
          <em className="sd-doc-status">Bekleniyor</em>
          <ChevronRight size={14} aria-hidden="true" />
        </button>
      ))}
      <p className="sd-docs-note">Belge yükleme API&#39;si bekleniyor.</p>
    </div>
  );
}

function ActivityTab({ shipment }) {
  // Build activity from real shipment status key — no fake timestamps
  const currentIdx = stepIndex(shipment.statusKey);
  const events = STEPS.slice(0, currentIdx + 1).map((step, i) => ({
    key: step.key,
    label: stepLabel(step.key, shipment),
    done: i <= currentIdx,
  }));

  return (
    <ol className="sd-activity" aria-label="Sevkiyat aktivite geçmişi">
      {events.map((ev) => (
        <li key={ev.key} className={`sd-activity-item ${ev.done ? "sd-activity-item--done" : ""}`}>
          <span className="sd-activity-dot" aria-hidden="true">
            {ev.done ? <Check size={11} /> : null}
          </span>
          <div className="sd-activity-body">
            <strong>{ev.label}</strong>
          </div>
        </li>
      ))}
    </ol>
  );
}

function stepLabel(key, s) {
  const map = {
    PLANNED: "Sevkiyat oluşturuldu",
    VEHICLE_ASSIGNED: `${s.carrier} aracı atadı`,
    HEADING_TO_PICKUP: `${s.vehiclePlate} yüklemeye gidiyor`,
    LOADED: "Yük yüklendi",
    IN_TRANSIT: "Yola çıktı",
    AT_DELIVERY: "Teslim noktasına ulaşıldı",
    DELIVERED: "Teslim edildi",
  };
  return map[key] || key;
}

function ContactBlock({ shipment, onMessage }) {
  const { operationContact: op, driverContact: dr } = shipment;
  return (
    <aside className="sd-contact" aria-label="Operasyon iletişim bilgileri">
      <h3 className="sd-contact-title">Operasyon Yetkilisi</h3>
      <div className="sd-contact-person">
        <span className="sd-contact-avatar" aria-hidden="true">
          <UserRound size={18} />
        </span>
        <div>
          <strong>{op.name}</strong>
          {op.email && <a href={`mailto:${op.email}`} className="sd-contact-link"><Mail size={12} aria-hidden="true" /> {op.email}</a>}
        </div>
      </div>
      <div className="sd-contact-actions">
        <a href={`tel:${op.phone}`} className="sd-contact-btn sd-contact-btn--call" aria-label={`${op.name}'ı ara`}>
          <Phone size={14} aria-hidden="true" /> Ara
        </a>
        <button className="sd-contact-btn sd-contact-btn--msg" onClick={onMessage} aria-label={`${op.name}'a mesaj gönder`}>
          <MessageCircle size={14} aria-hidden="true" /> Mesaj
        </button>
      </div>

      <hr className="sd-contact-divider" aria-hidden="true" />

      <h3 className="sd-contact-title">Şoför</h3>
      <div className="sd-contact-person">
        <span className="sd-contact-avatar" aria-hidden="true">
          <Truck size={18} />
        </span>
        <div>
          <strong>{dr.name}</strong>
          <small>{dr.plate}</small>
        </div>
      </div>
      <div className="sd-contact-actions">
        <a href={`tel:${dr.phone}`} className="sd-contact-btn sd-contact-btn--call" aria-label={`${dr.name}'ı ara`}>
          <Phone size={14} aria-hidden="true" /> Ara
        </a>
        <button className="sd-contact-btn sd-contact-btn--msg" onClick={onMessage} aria-label={`${dr.name}'a mesaj gönder`}>
          <MessageCircle size={14} aria-hidden="true" /> Mesaj
        </button>
      </div>
    </aside>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
/**
 * ShipmentDetail
 * Props:
 *   shipment  – shipment object (falls back to DEMO_SHIPMENT)
 *   matchId   – for live tracking API
 *   onMessage – () => void
 */
export default function ShipmentDetail({ shipment: shipmentProp, matchId, onMessage }) {
  const [tab, setTab] = useState("Genel Bakış");
  const shipment = shipmentProp || DEMO_SHIPMENT;

  function handleTabKey(e, tabName) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setTab(tabName); }
    if (e.key === "ArrowRight") {
      const idx = TABS.indexOf(tabName);
      const next = TABS[(idx + 1) % TABS.length];
      setTab(next);
      document.getElementById(`sd-tab-${next}`)?.focus();
    }
    if (e.key === "ArrowLeft") {
      const idx = TABS.indexOf(tabName);
      const prev = TABS[(idx - 1 + TABS.length) % TABS.length];
      setTab(prev);
      document.getElementById(`sd-tab-${prev}`)?.focus();
    }
  }

  return (
    <section className="shipment-detail" aria-label={`Sevkiyat ${shipment.id}`}>
      {/* ── HEADER ── */}
      <div className="sd-header">
        <div className="sd-header-id">
          <span className="sd-id-badge">{shipment.id}</span>
          <span className={`sd-status-badge sd-status-badge--${shipment.statusKey?.toLowerCase() || "planned"}`}>
            {shipment.status}
          </span>
        </div>
        <h2 className="sd-route-title">
          {shipment.route.from} <span aria-hidden="true">→</span> {shipment.route.to}
        </h2>
        <div className="sd-header-meta">
          <div className="sd-header-meta-item">
            <small>Pickup ETA</small>
            <strong>{shipment.pickupEta}</strong>
          </div>
          <div className="sd-header-meta-item">
            <small>Delivery ETA</small>
            <strong>{shipment.deliveryEta}</strong>
          </div>
          <div className="sd-header-meta-item">
            <small>Taşıyıcı</small>
            <strong>{shipment.carrier}</strong>
          </div>
          <div className="sd-header-meta-item">
            <small>Araç</small>
            <strong>{shipment.vehiclePlate}</strong>
          </div>
          <div className="sd-header-meta-item">
            <small>Şoför</small>
            <strong>{shipment.driver}</strong>
          </div>
        </div>
      </div>

      {/* ── STATUS STEPPER ── */}
      <StatusStepper currentKey={shipment.statusKey} />

      {/* ── TABS ── */}
      <div className="sd-tabs" role="tablist" aria-label="Sevkiyat sekmeleri">
        {TABS.map((t) => (
          <button
            key={t}
            id={`sd-tab-${t}`}
            role="tab"
            aria-selected={tab === t}
            aria-controls={`sd-panel-${t}`}
            className={`sd-tab ${tab === t ? "sd-tab--active" : ""}`}
            onClick={() => t === "Mesajlar" ? onMessage?.() : setTab(t)}
            onKeyDown={(e) => handleTabKey(e, t)}
            tabIndex={tab === t ? 0 : -1}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── PANELS ── */}
      <div className="sd-body">
        {tab !== "Mesajlar" && (
          <div
            id={`sd-panel-${tab}`}
            role="tabpanel"
            aria-labelledby={`sd-tab-${tab}`}
            className="sd-panel"
          >
            {tab === "Genel Bakış" && (
              <div className="sd-panel-inner sd-panel-inner--overview">
                <OverviewTab shipment={shipment} />
                <ContactBlock shipment={shipment} onMessage={onMessage} />
              </div>
            )}
            {tab === "Takip"      && <TrackingTab matchId={matchId} />}
            {tab === "Belgeler"   && <DocumentsTab />}
            {tab === "Aktivite"   && <ActivityTab shipment={shipment} />}
          </div>
        )}
      </div>
    </section>
  );
}
