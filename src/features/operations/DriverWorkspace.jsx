import { useState } from "react";
import { Check, MessageCircle, Phone, Truck, UserRound } from "lucide-react";

export function DriverWorkspace({ onMessage }) {
  const [status, setStatus] = useState("Atandı");
  const steps = [
    "Yüklemeye gidiyorum",
    "Yükleme noktasındayım",
    "Yüklendi",
    "Yola çıktım",
    "Teslim noktasındayım",
    "Teslim edildi",
  ];

  return (
    <section className="driver-workspace" aria-label="Sürücü çalışma alanı">
      <header>
        <div>
          <span>ATANMIŞ GÖREV · SHP-2847</span>
          <h1>Bergen → Milano</h1>
          <p>12 Eylül · Frigorifik · 18 ton</p>
        </div>
        <em aria-live="polite">{status}</em>
      </header>

      <div className="driver-job-grid">
        <article className="driver-route-card">
          <div>
            <i aria-hidden="true">A</i>
            <span>
              <small>YÜKLEME</small>
              <strong>Bergen, Norveç</strong>
              <p>Nordnesveien 12 · 08:00–10:00</p>
            </span>
          </div>
          <div className="driver-route-line" aria-hidden="true" />
          <div>
            <i aria-hidden="true">B</i>
            <span>
              <small>TESLİMAT</small>
              <strong>Milano, İtalya</strong>
              <p>Via Torino 84 · 14:00–18:00</p>
            </span>
          </div>
        </article>

        <article>
          <Truck size={22} aria-hidden="true" />
          <small>ARAÇ</small>
          <strong>34 ABC 123</strong>
          <p>Volvo FH · Frigorifik</p>
        </article>

        <article>
          <UserRound size={22} aria-hidden="true" />
          <small>OPERASYON YETKİLİSİ</small>
          <strong>Mehmet Kaya</strong>
          <p>ABC Logistics</p>
          <div>
            <a href="tel:+905000000000" aria-label="Mehmet Kaya'yı ara">
              <Phone size={12} aria-hidden="true" /> Ara
            </a>
            <button onClick={onMessage} aria-label="Operasyon yetkilisine mesaj gönder">
              <MessageCircle size={12} aria-hidden="true" /> Mesaj
            </button>
          </div>
        </article>
      </div>

      <div className="driver-status">
        <span>SEFER DURUMUNU GÜNCELLE</span>
        <div role="group" aria-label="Durum seçimi">
          {steps.map((step) => (
            <button
              key={step}
              className={status === step ? "active" : ""}
              onClick={() => setStatus(step)}
              aria-pressed={status === step}
            >
              <Check size={14} aria-hidden="true" />
              {step}
            </button>
          ))}
        </div>
        <small>
          Durum güncellemeleri canlı API sözleşmesi tamamlandığında operasyon merkezine
          gönderilecektir.
        </small>
      </div>
    </section>
  );
}
