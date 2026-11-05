import { useEffect, useState } from "react";
import { isApiConfigured, isDemoMode } from "../../api/apiClient";
import { listNotifications, markNotificationRead } from "../../api/operationsClient";

const LEGACY_DEMO_ITEMS = [
  { id: "legacy-offer", title: "Yeni teklif geldi", detail: "Yeni bir teklif değerlendirme bekliyor", target: "Teklifler", time: "4 dk" },
  { id: "legacy-message", title: "Yeni mesaj geldi", detail: "Yeni bir operasyon mesajınız var", target: "Mesajlar", time: "18 dk" },
];

export function NotificationCenter({ onNavigate, items: suppliedItems = null, onUnreadChange, onRead, demo = !isApiConfigured() || isDemoMode() }) {
  const demoItems = suppliedItems ?? LEGACY_DEMO_ITEMS;
  const [state, setState] = useState({
    items: [],
    loading: !demo,
    error: "",
  });
  const [readDemoIds, setReadDemoIds] = useState([]);
  const visibleItems = demo
    ? demoItems.map((item) => readDemoIds.includes(item.id) ? { ...item, readAt: item.readAt || "read" } : item)
    : state.items;
  const unread = visibleItems.filter((item) => !item.readAt).length;

  useEffect(() => {
    if (demo) return undefined;
    let active = true;
    listNotifications()
      .then((result) => active && setState({ items: result.items, loading: false, error: "" }))
      .catch(() => active && setState({ items: [], loading: false, error: "Bildirimler yüklenemedi." }));
    return () => { active = false; };
  }, [demo]);

  useEffect(() => {
    onUnreadChange?.(unread);
  }, [unread, onUnreadChange]);

  async function open(item) {
    if (!demo && item.id && !item.readAt) {
      try { await markNotificationRead(item.id); } catch { return; }
    }
    if (demo) {
      setReadDemoIds((current) => current.includes(item.id) ? current : [...current, item.id]);
    }
    onRead?.(item);
    const payload = item.payloadJson || {};
    onNavigate(
      item.target ||
      ({ OFFER: "Teklifler", SHIPMENT: "Aktif Sevkiyatlar", MESSAGE: "Mesajlar" }[payload.entityType] || "Özet")
    );
  }

  return (
    <div className="notification-panel" role="dialog" aria-label="Bildirimler" aria-modal="true">
      <header>
        <div>
          <strong>Bildirimler</strong>
          <small>{unread} okunmamış</small>
        </div>
      </header>

      {state.loading && <p className="panel-state">Bildirimler yükleniyor…</p>}
      {state.error  && <p className="panel-state error">{state.error}</p>}

      {visibleItems.map((item) => (
        <button key={item.id || item.title} onClick={() => open(item)}>
          <i aria-hidden="true" />
          <span>
            <strong>{item.title}</strong>
            <small>{item.body || item.detail}</small>
          </span>
          <time>{item.time || new Date(item.createdAt).toLocaleDateString("tr-TR")}</time>
        </button>
      ))}

      {!state.loading && !state.error && !visibleItems.length && (
        <p className="panel-state">Yeni bildiriminiz yok.</p>
      )}

      <footer>{demo ? "Demo bildirimleri" : "Son bildirimler"}</footer>
    </div>
  );
}
