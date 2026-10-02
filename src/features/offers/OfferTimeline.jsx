import { Check, TrendingDown, TrendingUp } from "lucide-react";

/**
 * OfferTimeline
 * Müzakere geçmişini ticari kayıt olarak gösterir.
 * Chat mesajlarından ayrı tutulur.
 *
 * rounds: [{ id, senderRole, amount, currency, message, createdAt, status }]
 */
export default function OfferTimeline({ rounds = [], shipperName = "Yük Veren", carrierName = "Taşıyıcı" }) {
  if (!rounds.length) {
    return (
      <div className="ot-empty" role="status">
        <p>Henüz müzakere geçmişi bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="offer-timeline" aria-label="Teklif müzakere geçmişi">
      <div className="ot-header">
        <span className="section-kicker">MÜZAKİRE GEÇMİŞİ</span>
        <small>{rounds.length} adım</small>
      </div>

      <ol className="ot-list">
        {rounds.map((round, i) => {
          const prev = rounds[i - 1];
          const isMine = round.senderRole === "SHIPPER";
          const label = isMine ? shipperName : carrierName;
          const amt = Number(round.amount);
          const prevAmt = prev ? Number(prev.amount) : null;
          const diff = prevAmt !== null ? amt - prevAmt : null;
          const sym = round.currency === "EUR" ? "€" : (round.currency || "€");
          const fmtAmt = `${amt.toLocaleString("tr-TR")} ${sym}`;
          const fmtDiff = diff !== null
            ? `${diff > 0 ? "+" : ""}${diff.toLocaleString("tr-TR")} ${sym}`
            : null;
          const accepted = round.status === "ACCEPTED" || round.status === "Kabul edildi";
          const rejected = round.status === "REJECTED" || round.status === "Reddedildi";

          return (
            <li
              key={round.id || i}
              className={[
                "ot-item",
                isMine ? "ot-item--mine" : "ot-item--theirs",
                accepted ? "ot-item--accepted" : "",
                rejected ? "ot-item--rejected" : "",
              ].filter(Boolean).join(" ")}
            >
              <div className="ot-bubble">
                <span className="ot-sender">{label}</span>

                {accepted ? (
                  <span className="ot-pill ot-pill--accepted">
                    <Check size={11} aria-hidden="true" /> Kabul edildi
                  </span>
                ) : rejected ? (
                  <span className="ot-pill ot-pill--rejected">Reddedildi</span>
                ) : (
                  <span className="ot-amount">{fmtAmt}</span>
                )}

                {!accepted && !rejected && fmtDiff && (
                  <span className={`ot-diff ${diff < 0 ? "ot-diff--down" : "ot-diff--up"}`} aria-label={`Önceki teklife göre ${fmtDiff}`}>
                    {diff < 0
                      ? <TrendingDown size={11} aria-hidden="true" />
                      : <TrendingUp size={11} aria-hidden="true" />}
                    {fmtDiff}
                  </span>
                )}

                {round.message && <p className="ot-note">{round.message}</p>}

                <time className="ot-time" dateTime={round.createdAt}>
                  {round.createdAt
                    ? new Date(round.createdAt).toLocaleString("tr-TR", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })
                    : ""}
                </time>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
