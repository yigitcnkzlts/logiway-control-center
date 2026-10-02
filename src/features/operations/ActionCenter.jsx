import { AlertTriangle, ArrowRight, MessageCircle, Package, Route, Truck, Wallet } from "lucide-react";

/**
 * ActionCenter
 *
 * Role-specific actionable items. Every row is clickable and navigates.
 *
 * Props:
 *   role       – "yuk-veren" | "lojistik" | "sofor"
 *   counts     – { offers, counterOffers, activeShipments, delayed, unread, availableLoads, pendingAssignment }
 *   onNavigate – (target: string) => void
 */

const SHIPPER_ITEMS = [
  {
    key: "offers",
    icon: Wallet,
    label: (n) => `${n} yeni teklif`,
    sublabel: "Değerlendirme bekliyor",
    target: "Teklifler",
    variant: "primary",
  },
  {
    key: "counterOffers",
    icon: Wallet,
    label: (n) => `${n} karşı teklif`,
    sublabel: "Yanıt bekleniyor",
    target: "Teklifler",
    variant: "warning",
  },
  {
    key: "activeShipments",
    icon: Route,
    label: (n) => `${n} aktif sevkiyat`,
    sublabel: "Operasyon takibinde",
    target: "Aktif Sevkiyatlar",
    variant: "default",
  },
  {
    key: "delayed",
    icon: AlertTriangle,
    label: (n) => `${n} gecikmeli sevkiyat`,
    sublabel: "Müdahale gerekebilir",
    target: "Aktif Sevkiyatlar",
    variant: "danger",
  },
  {
    key: "unread",
    icon: MessageCircle,
    label: (n) => `${n} okunmamış mesaj`,
    sublabel: "Hızlı yanıt ver",
    target: "Mesajlar",
    variant: "default",
  },
];

const CARRIER_ITEMS = [
  {
    key: "availableLoads",
    icon: Package,
    label: (n) => `${n} uygun yük`,
    sublabel: "Yük pazarında seni bekliyor",
    target: "Yük pazarı",
    variant: "primary",
  },
  {
    key: "counterOffers",
    icon: Wallet,
    label: (n) => `${n} karşı teklif`,
    sublabel: "Yük veren yanıt bekliyor",
    target: "Tekliflerim",
    variant: "warning",
  },
  {
    key: "pendingAssignment",
    icon: Truck,
    label: (n) => `${n} araç ataması gerekiyor`,
    sublabel: "Kabul edilen sevkiyatlara araç ata",
    target: "Sevkiyatlar",
    variant: "warning",
  },
  {
    key: "unread",
    icon: MessageCircle,
    label: (n) => `${n} okunmamış mesaj`,
    sublabel: "Hızlı yanıt ver",
    target: "Mesajlar",
    variant: "default",
  },
];

const DRIVER_ITEMS = [
  {
    key: "activeShipments",
    icon: Route,
    label: (n) => `${n} aktif görev`,
    sublabel: "Atanmış seferin devam ediyor",
    target: "Atanmış iş",
    variant: "primary",
  },
  {
    key: "unread",
    icon: MessageCircle,
    label: (n) => `${n} okunmamış mesaj`,
    sublabel: "Hızlı yanıt ver",
    target: "Mesajlar",
    variant: "default",
  },
];

// Default counts (demo) — real counts should be derived from state in parent
const DEFAULT_COUNTS = {
  offers: 3,
  counterOffers: 1,
  activeShipments: 2,
  delayed: 0,
  unread: 2,
  availableLoads: 4,
  pendingAssignment: 1,
};

export default function ActionCenter({ role, counts: countsProp, onNavigate }) {
  const counts = { ...DEFAULT_COUNTS, ...countsProp };

  const itemDefs =
    role === "yuk-veren" ? SHIPPER_ITEMS
    : role === "lojistik" ? CARRIER_ITEMS
    : DRIVER_ITEMS;

  // Only show items where count > 0
  const visible = itemDefs.filter((item) => (counts[item.key] || 0) > 0);

  if (!visible.length) {
    return (
      <section className="action-center action-center--empty" aria-label="Aksiyon merkezi">
        <div className="ac-header">
          <span className="section-kicker">AKSİYON MERKEZİ</span>
          <h2>Sizi bekleyenler</h2>
        </div>
        <p className="ac-all-clear">
          Şu an bekleyen bir aksiyon yok. Harika!
        </p>
      </section>
    );
  }

  return (
    <section className="action-center" aria-label="Aksiyon merkezi">
      <div className="ac-header">
        <span className="section-kicker">AKSİYON MERKEZİ</span>
        <h2>Sizi bekleyenler</h2>
      </div>

      <div className="ac-list" role="list">
        {visible.map((item) => {
          const count = counts[item.key] || 0;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              role="listitem"
              className={`ac-item ac-item--${item.variant}`}
              onClick={() => onNavigate?.(item.target)}
              aria-label={`${item.label(count)} — ${item.sublabel}`}
            >
              <span className={`ac-icon ac-icon--${item.variant}`} aria-hidden="true">
                <Icon size={16} />
              </span>
              <div className="ac-text">
                <strong>{item.label(count)}</strong>
                <small>{item.sublabel}</small>
              </div>
              <span className="ac-count" aria-hidden="true">{count}</span>
              <ArrowRight size={15} className="ac-arrow" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
