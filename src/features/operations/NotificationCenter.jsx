import { useEffect, useState } from "react";
import { isApiConfigured, isDemoMode } from "../../api/apiClient";
import { listNotifications, markNotificationRead } from "../../api/operationsClient";

export function NotificationCenter({ onNavigate, demo = !isApiConfigured() || isDemoMode() }) {
  const demoItems = [
    { title: "Yeni teklif geldi",  detail: "LW-3012 için ABC Logistics teklif verdi", target: "Teklifler",          time: "4 dk" },
    { title: "Yeni mesaj geldi",   detail: "ABC Logistics size bir mesaj gönderdi",   target: "Mesajlar",           time: "18 dk" },
    { title: "Şoför atandı",       detail: "SHP-2847 · Ahmet Yılmaz",                target: "Aktif Sevkiyatlar",  time: "1 sa" },
  ];

  const [state, setState] = useState({
    items: demo ? demoItems : [],
    loading: !demo,
    error: "",
  });

  useEffect(() => {
    if (demo) return;
    let active = true;
    listNotifications()
      .then((result) => active && setState({ items: result.items, loading: false, error: "" }))
      .catch(() => active && setState({ items: [], loading: false, error: "Bildirimler yüklenemedi." }));
    return () => { active = false; };
  }, [demo]);

  async function open(item) {
    if (!demo && item.id && !item.readAt) {
      try { await markNotificationRead(item.id); } catch { return; }
    }
    const payload = item.payloadJson || {};
    onNavigate(
      item.target ||
      ({ OFFER: "Teklifler", SHIPMENT: "Aktif Sevkiyatlar", MESSAGE: "Mesajlar" }[payload.entityType] || "Özet")
    );
  }

  const unread = state.items.filter((i) => !i.readAt).length;

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

      {state.items.map((item) => (
        <button key={item.id || item.title} onClick={() => open(item)}>
          <i aria-hidden="true" />
          <span>
            <strong>{item.title}</strong>
            <small>{item.body || item.detail}</small>
          </span>
          <time>{item.time || new Date(item.createdAt).toLocaleDateString("tr-TR")}</time>
        </button>
      ))}

      {!state.loading && !state.error && !state.items.length && (
        <p className="panel-state">Yeni bildiriminiz yok.</p>
      )}

      <footer>{demo ? "Demo bildirimleri" : "Son bildirimler"}</footer>
    </div>
  );
}
