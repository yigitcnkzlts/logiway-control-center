import { useMemo, useState } from "react";
import { ArrowLeft, Bell, Check, ChevronRight, FileText, MapPin, MessageCircle, Paperclip, Phone, Search, Send, ShieldCheck, Truck, UserRound, X } from "lucide-react";

const demoConversations = [
  { id: "conv-1", company: "ABC Logistics", reference: "LW-3012 · Tekirdağ → Berlin", verified: true, unread: 2, last: "Aracı yükleme için planladık.", time: "10:42", kind: "load", referenceId: "LW-3012", loadId: "LW-3012", offerId: "OF-8821", shipmentId: null },
  { id: "conv-2", company: "NordCargo AS", reference: "SHP-2847 · Bergen → Milano", verified: true, unread: 0, last: "ETA güncellendi: 18:30", time: "Dün", kind: "shipment", referenceId: "SHP-2847", loadId: "LW-2847", offerId: "OF-7734", shipmentId: "SHP-2847" },
];

export function MessagesCenter({ demo = true }) {
  const [selected, setSelected] = useState(demoConversations[0]?.id);
  const [messages, setMessages] = useState({
    "conv-1": [{ id: 1, mine: false, text: "Merhaba, teklifimizle ilgili sorularınızı yanıtlayabiliriz.", time: "10:31" }, { id: 2, mine: true, text: "Araç ve şoför atamasını ne zaman paylaşabilirsiniz?", time: "10:38" }, { id: 3, mine: false, text: "Aracı yükleme için planladık.", time: "10:42" }],
    "conv-2": [{ id: 1, mine: false, text: "ETA güncellendi: 18:30", time: "Dün" }],
  });
  const current = demoConversations.find((item) => item.id === selected);
  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = String(form.get("message") || "").trim();
    if (!text || !current) return;
    setMessages((value) => ({ ...value, [current.id]: [...(value[current.id] || []), { id: Date.now(), mine: true, text, time: "Şimdi" }] }));
    event.currentTarget.reset();
  }
  return <section className={`messages-center ${selected ? "has-selection" : ""}`}>
    <aside className="conversation-list">
      <div className="messages-title"><div><span>İLETİŞİM MERKEZİ</span><h2>Mesajlar</h2></div>{demo && <em>DEMO</em>}</div>
      <label className="conversation-search"><Search/><input placeholder="Firma veya yük ara"/></label>
      {demoConversations.map((conversation) => <button key={conversation.id} className={selected === conversation.id ? "active" : ""} onClick={() => setSelected(conversation.id)}>
        <span className="conversation-avatar">{conversation.company.slice(0, 2).toUpperCase()}</span><span><strong>{conversation.company}</strong><small>{conversation.reference}</small><p>{conversation.last}</p></span><span className="conversation-meta"><small>{conversation.time}</small>{conversation.unread > 0 && <b>{conversation.unread}</b>}</span>
      </button>)}
    </aside>
    <div className="conversation-detail">
      {current ? <><header><button className="mobile-back" onClick={() => setSelected(null)}><ArrowLeft/></button><div><strong>{current.company} {current.verified && <ShieldCheck/>}</strong><small>{current.reference}</small></div><button aria-label="Konuşmayı kapat" onClick={() => setSelected(null)}><X/></button></header>
        <div className="reference-banner"><FileText/><span><small>{current.kind === "shipment" ? "SEVKİYAT" : "YÜK"} REFERANSI</small><strong>{current.referenceId}</strong></span><button>Detayı aç <ChevronRight/></button></div>
        <div className="message-history">{(messages[current.id] || []).map((message) => <div className={message.mine ? "message mine" : "message"} key={message.id}><p>{message.text}</p><small>{message.time}</small></div>)}</div>
        <form className="message-composer" onSubmit={submit}><button type="button" aria-label="Dosya ekle"><Paperclip/></button><input name="message" placeholder="Mesajınızı yazın…" autoComplete="off"/><button aria-label="Mesaj gönder"><Send/></button></form>
      </> : <div className="conversation-placeholder"><MessageCircle/><h3>Bir konuşma seçin</h3><p>Yük, teklif veya sevkiyata bağlı mesajları burada yönetin.</p></div>}
    </div>
  </section>;
}

const searchItems = [
  ["Araç", "34 ABC 123", "Volvo FH"], ["Şoför", "Ahmet Yılmaz", "Aktif görevde"], ["Sevkiyat", "SHP-2847", "Bergen → Milano"], ["Yük", "LW-3012", "Tekirdağ → Berlin"], ["Firma", "ABC Logistics", "Doğrulanmış taşıyıcı"],
];

export function GlobalSearch({ onClose }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => query.trim() ? searchItems.filter((item) => item.join(" ").toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr"))) : searchItems.slice(0, 3), [query]);
  return <div className="command-panel"><label><Search/><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Yük, firma, plaka veya sevkiyat ara..."/><button onClick={onClose}><X/></button></label><div>{results.map(([type, title, detail]) => <button key={`${type}-${title}`} onClick={onClose}><span>{type}</span><strong>{title}</strong><small>{detail}</small><ChevronRight/></button>)}{!results.length && <p>Aramanızla eşleşen kayıt bulunamadı.</p>}</div><footer>Arama sonuçları erişim rolünüze göre sınırlandırılır.</footer></div>;
}

export function NotificationCenter({ onNavigate }) {
  const items = [
    { title: "Yeni teklif geldi", detail: "LW-3012 için ABC Logistics teklif verdi", target: "Teklifler", time: "4 dk" },
    { title: "Yeni mesaj geldi", detail: "ABC Logistics size bir mesaj gönderdi", target: "Mesajlar", time: "18 dk" },
    { title: "Şoför atandı", detail: "SHP-2847 · Ahmet Yılmaz", target: "Aktif Sevkiyatlar", time: "1 sa" },
  ];
  return <div className="notification-panel"><header><div><strong>Bildirimler</strong><small>{items.length} okunmamış</small></div><button>Tümünü okundu işaretle</button></header>{items.map((item) => <button key={item.title} onClick={() => onNavigate(item.target)}><i/><span><strong>{item.title}</strong><small>{item.detail}</small></span><time>{item.time}</time></button>)}<footer>Bildirim API entegrasyonu bekleniyor · demo içerik</footer></div>;
}

export function ActionCenter({ role, onNavigate }) {
  const shipper = [["3", "Yeni teklif", "Teklifler"], ["1", "Geciken sevkiyat", "Aktif Sevkiyatlar"], ["2", "Yeni mesaj", "Mesajlar"], ["1", "Eksik belge", "Belgeler"]];
  const carrier = [["4", "Uygun yeni yük", "Yük pazarı"], ["2", "Karşı teklif", "Tekliflerim"], ["1", "Araç / şoför ataması", "Sevkiyatlar"], ["3", "Yeni mesaj", "Mesajlar"]];
  return <section className="action-center"><div><span>AKSİYON MERKEZİ</span><h2>Sizi bekleyenler</h2></div><div>{(role === "yuk-veren" ? shipper : carrier).map(([count, label, target]) => <button key={label} onClick={() => onNavigate(target)}><b>{count}</b><span>{label}</span><ChevronRight/></button>)}</div></section>;
}

export function ShipmentDetail({ onMessage }) {
  const [tab, setTab] = useState("Genel Bakış");
  const tabs = ["Genel Bakış", "Takip", "Mesajlar", "Belgeler", "Aktivite"];
  return <section className="shipment-detail"><div className="shipment-hero"><div><span>AKTİF SEVKİYAT · SHP-2847</span><h2>Bergen → Milano</h2><p>Soğuk zincir somon · Frigorifik · 18 ton</p></div><em>Yolda</em></div><nav>{tabs.map((item) => <button className={tab === item ? "active" : ""} onClick={() => item === "Mesajlar" ? onMessage() : setTab(item)} key={item}>{item}</button>)}</nav>{tab === "Genel Bakış" && <div className="shipment-overview"><div className="shipment-facts">{[["Yük veren", "NordCargo AS"], ["Taşıyıcı", "ABC Logistics"], ["Şoför", "Ahmet Yılmaz"], ["Araç", "34 ABC 123 · Volvo FH"], ["Anlaşılan fiyat", "4.650 €"], ["Teslimat ETA", "12 Eylül · 18:30"]].map(([label, value]) => <article key={label}><small>{label}</small><strong>{value}</strong></article>)}</div><ContactCard/></div>}{tab === "Takip" && <div className="tracking-placeholder"><MapPin/><div><strong>Canlı harita entegrasyon alanı</strong><p>Son konum: Hamburg, Almanya · 8 dakika önce</p><small>Harita sağlayıcısı ve telematik API sözleşmesi bekleniyor.</small></div></div>}{tab === "Belgeler" && <div className="document-placeholder">{["CMR", "Fatura", "POD / teslim belgesi", "Fotoğraflar", "Gümrük belgesi"].map((item) => <button key={item}><FileText/><span>{item}</span><em>Bekleniyor</em></button>)}</div>}{tab === "Aktivite" && <ol className="activity-timeline">{["Teklif oluşturuldu", "Karşı teklif geldi", "Teklif kabul edildi", "Sevkiyat oluşturuldu", "Araç ve şoför atandı", "Yüklendi", "Yola çıktı"].map((item, index) => <li className={index < 7 ? "done" : ""} key={item}><i>{index < 7 && <Check/>}</i><span><strong>{item}</strong><small>{index < 5 ? "Tamamlandı" : "Bugün"}</small></span></li>)}</ol>}</section>;
}

function ContactCard() {
  return <aside className="contact-card"><span>EŞLEŞME SONRASI İLETİŞİM</span><h3>Operasyon Yetkilisi</h3><div><UserRound/><span><strong>Mehmet Kaya</strong><a href="mailto:operasyon@firma.com">operasyon@firma.com</a></span></div><a href="tel:+905000000000"><Phone/> Ara</a><button><MessageCircle/> Mesaj Gönder</button><hr/><h3>Şoför</h3><p><strong>Ahmet Yılmaz</strong><small>34 ABC 123</small></p></aside>;
}

export function MarketplaceFilters({ filters, onChange }) {
  const [more, setMore] = useState(false);
  return <section className="market-filters"><div className="main-filters"><label>Kalkış<input value={filters.origin} onChange={(e) => onChange({ ...filters, origin: e.target.value })} placeholder="Şehir veya ülke"/></label><label>Varış<input value={filters.destination} onChange={(e) => onChange({ ...filters, destination: e.target.value })} placeholder="Şehir veya ülke"/></label><label>Yükleme tarihi<input type="date" value={filters.date} onChange={(e) => onChange({ ...filters, date: e.target.value })}/></label><label>Araç tipi<select value={filters.vehicle} onChange={(e) => onChange({ ...filters, vehicle: e.target.value })}><option>Tümü</option><option>Tenteli</option><option>Frigo</option><option>Mega</option><option>Lowbed</option><option>Kamyon</option><option>Van</option></select></label><button onClick={() => setMore((value) => !value)}>Daha fazla filtre</button></div>{more && <div className="more-filters"><label>Maks. ağırlık<input type="number" placeholder="24 ton"/></label><label>Fiyat aralığı<input placeholder="2.000 – 5.000"/></label><label>Para birimi<select><option>EUR</option><option>TRY</option><option>GBP</option></select></label></div>}</section>;
}

export function DriverWorkspace({ onMessage }) {
  const [status, setStatus] = useState("Atandı");
  const steps = ["Yüklemeye gidiyorum", "Yükleme noktasındayım", "Yüklendi", "Yola çıktım", "Teslim noktasındayım", "Teslim edildi"];
  return <section className="driver-workspace">
    <header><div><span>ATANMIŞ GÖREV · SHP-2847</span><h1>Bergen → Milano</h1><p>12 Eylül · Frigorifik · 18 ton</p></div><em>{status}</em></header>
    <div className="driver-job-grid"><article className="driver-route-card"><div><i>A</i><span><small>YÜKLEME</small><strong>Bergen, Norveç</strong><p>Nordnesveien 12 · 08:00–10:00</p></span></div><div className="driver-route-line"/><div><i>B</i><span><small>TESLİMAT</small><strong>Milano, İtalya</strong><p>Via Torino 84 · 14:00–18:00</p></span></div></article><article><Truck/><small>ARAÇ</small><strong>34 ABC 123</strong><p>Volvo FH · Frigorifik</p></article><article><UserRound/><small>OPERASYON YETKİLİSİ</small><strong>Mehmet Kaya</strong><p>ABC Logistics</p><div><a href="tel:+905000000000"><Phone/> Ara</a><button onClick={onMessage}><MessageCircle/> Mesaj</button></div></article></div>
    <div className="driver-status"><span>SEFER DURUMUNU GÜNCELLE</span><div>{steps.map((step) => <button className={status === step ? "active" : ""} onClick={() => setStatus(step)} key={step}><Check/>{step}</button>)}</div><small>Durum güncellemeleri canlı API sözleşmesi tamamlandığında operasyon merkezine gönderilecektir.</small></div>
  </section>;
}

export function LoadDetailDrawer({ load, onClose, onOffer, onMessage }) {
  const [tab, setTab] = useState("Genel Bakış");
  if (!load) return null;
  const reasons = load.matchReasons || ["Araç tipi uygun", "Kapasite yeterli", "Pickup bölgesine yakın", "Rota uyumlu", "Tarih uygun"];
  return <div className="drawer-backdrop" onMouseDown={onClose}><aside className="load-drawer" onMouseDown={(event) => event.stopPropagation()}><header><div><span>{load.id}</span><h2>{load.cargo}</h2><p>{load.from} → {load.to}</p></div><button onClick={onClose}><X/></button></header><nav>{["Genel Bakış", "Rota", "Firma", "Teklif"].map((item) => <button className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item}>{item}</button>)}</nav>{tab === "Genel Bakış" && <div className="drawer-content"><div className="drawer-score"><strong>%{load.match} uygun</strong><span>{reasons.map((reason) => <em key={reason}><Check/>{reason}</em>)}</span></div><dl>{[["Yükleme tarihi", load.date], ["Araç", load.vehicle], ["Ağırlık", load.weight], ["Bütçe", load.price], ["Mesafe", load.distance], ["Özel şartlar", load.specialRequirements || "Standart taşıma"]].map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value || "—"}</dd></div>)}</dl></div>}{tab === "Rota" && <div className="drawer-content"><div className="drawer-route"><MapPin/><div><small>YÜKLEME</small><strong>{load.from}</strong><p>{load.pickupAddress || "Açık adres teklif kabulünden sonra paylaşılır."}</p></div></div><div className="drawer-route"><MapPin/><div><small>TESLİMAT</small><strong>{load.to}</strong><p>{load.deliveryAddress || "Açık adres teklif kabulünden sonra paylaşılır."}</p></div></div></div>}{tab === "Firma" && <CompanyProfile company={load.company}/>} {tab === "Teklif" && <div className="drawer-content drawer-offer"><h3>Taşıma teklifinizi oluşturun</h3><p>Tutar ve operasyon notu, teklif API sözleşmesindeki mevcut alanlarla gönderilir.</p><button onClick={() => onOffer(load)}>Teklif Ver</button><button className="secondary" onClick={() => onMessage(load)}>Mesaj Gönder</button></div>}<footer><button onClick={() => onMessage(load)}><MessageCircle/> Mesaj Gönder</button><button onClick={() => onOffer(load)}>Teklif Ver</button></footer></aside></div>;
}

function CompanyProfile({ company = "Doğrulanmış Yük Veren" }) {
  return <div className="company-profile"><div className="company-profile-head"><span>{company.slice(0, 2).toUpperCase()}</span><div><h3>{company}</h3><p><ShieldCheck/> Doğrulanmış firma</p></div></div><dl>{[["Ülke", "Türkiye"], ["Tamamlanan sevkiyat", "128"], ["Puan", "4.9 / 5"], ["Zamanında teslimat", "%96"], ["Operasyon ülkeleri", "Türkiye, Almanya, İtalya"], ["Belgeler", "Doğrulandı"]].map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><p className="privacy-note">Telefon ve doğrudan iletişim bilgileri yalnızca teklif kabulü ve sevkiyat oluşturulmasından sonra açılır.</p></div>;
}
