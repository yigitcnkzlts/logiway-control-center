import { useEffect, useState } from "react";
import {
  Check, ChevronDown, ChevronUp, MessageCircle, ShieldCheck, Truck, X, Zap,
} from "lucide-react";
import { acceptLiveOffer, counterLiveOffer, loadOfferRounds, rejectLiveOffer } from "../../api/marketplaceClient";
import { liveMarketplaceEnabled } from "../../api/marketplaceClient";
import OfferTimeline from "./OfferTimeline";

const MAX_COMPARE = 4;

/**
 * OfferComparison
 *
 * Props:
 *   offers       – normalized offer objects from ShipperPortal
 *   loadId       – the load these offers belong to
 *   onAccept     – (offer) => void
 *   onMessage    – (offer) => void
 *   onClose      – () => void  (used when shown as a panel)
 */
export default function OfferComparison({ offers = [], onAccept, onMessage }) {
  const [selected, setSelected] = useState(() => offers.slice(0, 2).map((o) => o.id));
  const [counterTarget, setCounterTarget] = useState(null); // offer id
  const [counterAmount, setCounterAmount] = useState("");
  const [counterNote, setCounterNote]   = useState("");
  const [busy, setBusy]   = useState("");
  const [notice, setNotice] = useState("");
  const [rounds, setRounds] = useState({}); // offerId → round[]
  const [expandedTimeline, setExpandedTimeline] = useState(null);
  const [expandDetail, setExpandDetail] = useState(null);

  // Load offer rounds when available
  useEffect(() => {
    if (!liveMarketplaceEnabled()) return;
    offers.forEach((o) => {
      if (o.id && !rounds[o.id]) {
        loadOfferRounds(o.id)
          .then((r) => setRounds((prev) => ({ ...prev, [o.id]: Array.isArray(r) ? r : [] })))
          .catch(() => {});
      }
    });
  }, [offers]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleSelect(id) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < MAX_COMPARE
          ? [...prev, id]
          : prev
    );
  }

  const comparing = offers.filter((o) => selected.includes(o.id));

  async function handleAccept(offer) {
    if (busy) return;
    setBusy(offer.id);
    try {
      if (liveMarketplaceEnabled()) await acceptLiveOffer(offer.id);
      onAccept?.(offer);
      setNotice(`${offer.company || offer.driver} ile eşleşme tamamlandı.`);
    } catch (e) {
      setNotice(e.message || "Kabul işlemi başarısız.");
    } finally {
      setBusy("");
      setTimeout(() => setNotice(""), 3500);
    }
  }

  async function handleReject(offer) {
    if (busy) return;
    setBusy(offer.id + "-reject");
    try {
      if (liveMarketplaceEnabled()) await rejectLiveOffer(offer.id);
      setNotice(`Teklif reddedildi.`);
      onAccept?.({ ...offer, status: "Reddedildi" });
    } catch (e) {
      setNotice(e.message || "Reddetme işlemi başarısız.");
    } finally {
      setBusy("");
      setTimeout(() => setNotice(""), 3500);
    }
  }

  async function handleCounter(offer) {
    if (!counterAmount || busy) return;
    setBusy(offer.id + "-counter");
    try {
      if (liveMarketplaceEnabled()) {
        await counterLiveOffer(offer.id, { amount: counterAmount, message: counterNote, expectedOfferVersion: offer.version });
      }
      setNotice(`Karşı teklif gönderildi: ${Number(counterAmount).toLocaleString("tr-TR")} €`);
      setCounterTarget(null);
      setCounterAmount("");
      setCounterNote("");
    } catch (e) {
      setNotice(e.message || "Karşı teklif gönderilemedi.");
    } finally {
      setBusy("");
      setTimeout(() => setNotice(""), 3500);
    }
  }

  const isAccepted = (o) => o.status === "Kabul edildi" || o.status === "ACCEPTED";
  const isRejected = (o) => o.status === "Reddedildi" || o.status === "REJECTED";

  // ── EMPTY ──
  if (!offers.length) {
    return (
      <div className="oc-empty">
        <Truck size={32} aria-hidden="true" />
        <h3>Henüz teklif gelmedi</h3>
        <p>Yük ilanınız aktif. Uygun taşıyıcıların teklifleri burada görünecek.</p>
      </div>
    );
  }

  return (
    <div className="offer-comparison">
      {notice && (
        <div className="oc-notice" role="status" aria-live="polite">
          <Check size={15} aria-hidden="true" /> {notice}
        </div>
      )}

      {/* ── SELECTOR ── */}
      <div className="oc-selector" aria-label="Karşılaştırılacak teklifler">
        <span className="section-kicker">TEKLİF KARŞILAŞTIRMA</span>
        <p>En fazla {MAX_COMPARE} teklifi aynı anda karşılaştırabilirsiniz.</p>
        <div className="oc-selector-chips" role="group" aria-label="Teklif seçimi">
          {offers.map((o) => {
            const active = selected.includes(o.id);
            return (
              <button
                key={o.id}
                className={`oc-chip ${active ? "oc-chip--active" : ""} ${isAccepted(o) ? "oc-chip--accepted" : ""} ${isRejected(o) ? "oc-chip--rejected" : ""}`}
                onClick={() => toggleSelect(o.id)}
                aria-pressed={active}
                aria-label={`${o.company || o.driver} teklifini ${active ? "karşılaştırmadan çıkar" : "karşılaştırmaya ekle"}`}
              >
                <span className="oc-chip-avatar">{(o.company || o.driver || "?").slice(0, 2).toUpperCase()}</span>
                <span>
                  <strong>{o.company || o.driver}</strong>
                  <small>{o.amount}</small>
                </span>
                {isAccepted(o) && <Check size={13} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── DESKTOP COMPARISON TABLE ── */}
      {comparing.length > 0 && (
        <div className="oc-table-wrap" role="region" aria-label="Teklif karşılaştırma tablosu">
          <table className="oc-table">
            <thead>
              <tr>
                <th scope="col" className="oc-label-col">Kriter</th>
                {comparing.map((o) => (
                  <th key={o.id} scope="col">
                    <div className="oc-th-firm">
                      <span className="oc-firm-avatar">{(o.company || o.driver || "?").slice(0, 2).toUpperCase()}</span>
                      <div>
                        <strong>{o.company || o.driver}</strong>
                        {o.verified !== false && (
                          <span className="oc-verified" aria-label="Doğrulanmış firma">
                            <ShieldCheck size={12} aria-hidden="true" /> Doğrulandı
                          </span>
                        )}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* 1 – Fiyat (hero row) */}
              <tr className="oc-row oc-row--hero">
                <th scope="row">Teklif Fiyatı</th>
                {comparing.map((o) => (
                  <td key={o.id} className="oc-cell--price">
                    <strong>{o.amount}</strong>
                    {o.currency && <small>{o.currency}</small>}
                  </td>
                ))}
              </tr>

              {/* 2 – Pickup ETA */}
              <tr className="oc-row">
                <th scope="row">Pickup ETA</th>
                {comparing.map((o) => (
                  <td key={o.id}>{o.eta || "—"}</td>
                ))}
              </tr>

              {/* 3 – Araç */}
              <tr className="oc-row">
                <th scope="row">Araç Tipi</th>
                {comparing.map((o) => (
                  <td key={o.id}>
                    <span className="oc-vehicle">
                      <Truck size={13} aria-hidden="true" /> {o.vehicle || "—"}
                    </span>
                  </td>
                ))}
              </tr>

              {/* 4 – Match score (only if available) */}
              {comparing.some((o) => o.score && o.score !== "—") && (
                <tr className="oc-row">
                  <th scope="row">Uyum Skoru</th>
                  {comparing.map((o) => (
                    <td key={o.id}>
                      {o.score && o.score !== "—" ? (
                        <span className="oc-match">
                          <Zap size={12} aria-hidden="true" /> {o.score}
                        </span>
                      ) : "—"}
                    </td>
                  ))}
                </tr>
              )}

              {/* 5 – Completed trips (only if any offer has it) */}
              {comparing.some((o) => o.trips > 0) && (
                <tr className="oc-row">
                  <th scope="row">Tamamlanan Sefer</th>
                  {comparing.map((o) => (
                    <td key={o.id}>{o.trips > 0 ? `${o.trips} sefer` : "—"}</td>
                  ))}
                </tr>
              )}

              {/* 6 – Status */}
              <tr className="oc-row">
                <th scope="row">Durum</th>
                {comparing.map((o) => (
                  <td key={o.id}>
                    <span className={`oc-status-badge ${isAccepted(o) ? "accepted" : isRejected(o) ? "rejected" : "pending"}`}>
                      {o.status || "Bekliyor"}
                    </span>
                  </td>
                ))}
              </tr>

              {/* 7 – Offer time */}
              {comparing.some((o) => o.createdAt) && (
                <tr className="oc-row">
                  <th scope="row">Teklif Zamanı</th>
                  {comparing.map((o) => (
                    <td key={o.id}>
                      {o.createdAt
                        ? new Date(o.createdAt).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </td>
                  ))}
                </tr>
              )}

              {/* ACTIONS ROW */}
              <tr className="oc-row oc-row--actions">
                <th scope="row">İşlemler</th>
                {comparing.map((o) => (
                  <td key={o.id}>
                    <div className="oc-actions">
                      {!isAccepted(o) && !isRejected(o) && (
                        <>
                          {/* Primary */}
                          <button
                            className="oc-btn oc-btn--primary"
                            onClick={() => handleAccept(o)}
                            disabled={!!busy}
                            aria-label={`${o.company || o.driver} teklifini kabul et`}
                          >
                            <Check size={14} aria-hidden="true" />
                            {busy === o.id ? "İşleniyor…" : "Kabul Et"}
                          </button>

                          {/* Secondary */}
                          <button
                            className="oc-btn oc-btn--secondary"
                            onClick={() => setCounterTarget(counterTarget === o.id ? null : o.id)}
                            aria-expanded={counterTarget === o.id}
                            aria-label={`${o.company || o.driver} için karşı teklif gir`}
                          >
                            Karşı Teklif
                          </button>

                          {/* Ghost */}
                          <button
                            className="oc-btn oc-btn--ghost"
                            onClick={() => onMessage?.(o)}
                            aria-label={`${o.company || o.driver} ile mesajlaş`}
                          >
                            <MessageCircle size={13} aria-hidden="true" /> Mesaj
                          </button>

                          {/* Danger */}
                          <button
                            className="oc-btn oc-btn--danger"
                            onClick={() => handleReject(o)}
                            disabled={!!busy}
                            aria-label={`${o.company || o.driver} teklifini reddet`}
                          >
                            <X size={13} aria-hidden="true" /> Reddet
                          </button>
                        </>
                      )}

                      {isAccepted(o) && (
                        <span className="oc-accepted-label">
                          <Check size={14} aria-hidden="true" /> Eşleşildi
                        </span>
                      )}
                      {isRejected(o) && (
                        <span className="oc-rejected-label">Reddedildi</span>
                      )}
                    </div>

                    {/* Counter-offer inline form */}
                    {counterTarget === o.id && (
                      <div className="oc-counter" role="form" aria-label="Karşı teklif formu">
                        <label>
                          <span>Teklifiniz (€)</span>
                          <input
                            type="number"
                            min="1"
                            value={counterAmount}
                            onChange={(e) => setCounterAmount(e.target.value)}
                            placeholder="Örn. 4200"
                            aria-label="Karşı teklif tutarı"
                          />
                        </label>
                        <label>
                          <span>Not (opsiyonel)</span>
                          <input
                            type="text"
                            value={counterNote}
                            onChange={(e) => setCounterNote(e.target.value)}
                            placeholder="Koşul veya açıklama"
                            aria-label="Karşı teklif notu"
                          />
                        </label>
                        <div className="oc-counter-actions">
                          <button
                            className="oc-btn oc-btn--primary"
                            onClick={() => handleCounter(o)}
                            disabled={!counterAmount || !!busy}
                          >
                            {busy === o.id + "-counter" ? "Gönderiliyor…" : "Gönder"}
                          </button>
                          <button
                            className="oc-btn oc-btn--ghost"
                            onClick={() => { setCounterTarget(null); setCounterAmount(""); setCounterNote(""); }}
                            aria-label="Karşı teklif formunu kapat"
                          >
                            Vazgeç
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ── MOBILE STACKED CARDS ── */}
      <div className="oc-mobile-cards" aria-label="Teklif kartları">
        {offers.map((o) => {
          const open = expandDetail === o.id;
          return (
            <div
              key={o.id}
              className={[
                "oc-card",
                isAccepted(o) ? "oc-card--accepted" : "",
                isRejected(o) ? "oc-card--rejected" : "",
              ].filter(Boolean).join(" ")}
            >
              {/* Card header */}
              <div className="oc-card-head">
                <span className="oc-firm-avatar">{(o.company || o.driver || "?").slice(0, 2).toUpperCase()}</span>
                <div className="oc-card-firm">
                  <strong>{o.company || o.driver}</strong>
                  {o.verified !== false && (
                    <span className="oc-verified">
                      <ShieldCheck size={11} aria-hidden="true" /> Doğrulandı
                    </span>
                  )}
                </div>
                <span className={`oc-status-badge ${isAccepted(o) ? "accepted" : isRejected(o) ? "rejected" : "pending"}`}>
                  {o.status || "Bekliyor"}
                </span>
              </div>

              {/* Key metrics */}
              <div className="oc-card-metrics">
                <div className="oc-metric oc-metric--primary">
                  <small>Teklif</small>
                  <strong>{o.amount}</strong>
                </div>
                <div className="oc-metric">
                  <small>ETA</small>
                  <span>{o.eta || "—"}</span>
                </div>
                {o.score && o.score !== "—" && (
                  <div className="oc-metric">
                    <small>Uyum</small>
                    <span className="oc-match"><Zap size={11} aria-hidden="true" /> {o.score}</span>
                  </div>
                )}
              </div>

              {/* Expand detail */}
              <button
                className="oc-card-toggle"
                onClick={() => setExpandDetail(open ? null : o.id)}
                aria-expanded={open}
                aria-controls={`oc-card-detail-${o.id}`}
              >
                {open ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
                {open ? "Kapat" : "Detay"}
              </button>

              {open && (
                <div id={`oc-card-detail-${o.id}`} className="oc-card-detail">
                  {o.vehicle && <div><small>Araç</small><span><Truck size={12} aria-hidden="true" /> {o.vehicle}</span></div>}
                  {o.trips > 0 && <div><small>Sefer</small><span>{o.trips} tamamlanan</span></div>}
                  {o.createdAt && (
                    <div><small>Teklif tarihi</small>
                      <span>{new Date(o.createdAt).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  )}

                  {/* Timeline */}
                  {rounds[o.id] && rounds[o.id].length > 0 && (
                    <div className="oc-card-timeline">
                      <button
                        className="oc-card-toggle"
                        onClick={() => setExpandedTimeline(expandedTimeline === o.id ? null : o.id)}
                        aria-expanded={expandedTimeline === o.id}
                      >
                        {expandedTimeline === o.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        Müzakere geçmişi
                      </button>
                      {expandedTimeline === o.id && <OfferTimeline rounds={rounds[o.id]} />}
                    </div>
                  )}
                </div>
              )}

              {/* CTA row */}
              {!isAccepted(o) && !isRejected(o) && (
                <div className="oc-card-cta">
                  <button className="oc-btn oc-btn--primary" onClick={() => handleAccept(o)} disabled={!!busy} aria-label={`${o.company || o.driver} teklifini kabul et`}>
                    <Check size={13} aria-hidden="true" /> Kabul Et
                  </button>
                  <button className="oc-btn oc-btn--secondary" onClick={() => setCounterTarget(counterTarget === o.id ? null : o.id)} aria-expanded={counterTarget === o.id}>
                    Karşı Teklif
                  </button>
                  <button className="oc-btn oc-btn--ghost" onClick={() => onMessage?.(o)} aria-label="Mesaj gönder">
                    <MessageCircle size={13} aria-hidden="true" />
                  </button>
                  <button className="oc-btn oc-btn--danger" onClick={() => handleReject(o)} disabled={!!busy} aria-label="Reddet">
                    <X size={13} aria-hidden="true" />
                  </button>
                </div>
              )}

              {/* Counter form (mobile) */}
              {counterTarget === o.id && (
                <div className="oc-counter" role="form" aria-label="Karşı teklif formu">
                  <label>
                    <span>Teklifiniz (€)</span>
                    <input type="number" min="1" value={counterAmount} onChange={(e) => setCounterAmount(e.target.value)} placeholder="Örn. 4200" />
                  </label>
                  <label>
                    <span>Not</span>
                    <input type="text" value={counterNote} onChange={(e) => setCounterNote(e.target.value)} placeholder="Koşul veya açıklama" />
                  </label>
                  <div className="oc-counter-actions">
                    <button className="oc-btn oc-btn--primary" onClick={() => handleCounter(o)} disabled={!counterAmount || !!busy}>
                      {busy === o.id + "-counter" ? "Gönderiliyor…" : "Gönder"}
                    </button>
                    <button className="oc-btn oc-btn--ghost" onClick={() => { setCounterTarget(null); setCounterAmount(""); setCounterNote(""); }}>Vazgeç</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── NEGOTIATION HISTORY (desktop) ── */}
      {comparing.length > 0 && Object.keys(rounds).length > 0 && (
        <div className="oc-timelines">
          <div className="oc-timelines-header">
            <span className="section-kicker">MÜZAKİRE GEÇMİŞİ</span>
            <small>Teklif geçmişi chat mesajlarından ayrı ticari kayıttır.</small>
          </div>
          <div className="oc-timelines-grid">
            {comparing.map((o) =>
              rounds[o.id] && rounds[o.id].length > 0 ? (
                <div key={o.id} className="oc-timelines-col">
                  <strong className="oc-timelines-firm">{o.company || o.driver}</strong>
                  <OfferTimeline rounds={rounds[o.id]} />
                </div>
              ) : null
            )}
          </div>
        </div>
      )}
    </div>
  );
}
