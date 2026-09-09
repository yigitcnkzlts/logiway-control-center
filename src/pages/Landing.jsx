import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Check, ChevronDown, Clock3, Gauge, Menu, PackageCheck, Route, ShieldCheck, Sparkles, Truck, X, Zap } from "lucide-react";
import "./Landing.css";

const features = [
  [<Route key="route"/>, "Akıllı eşleştirme", "Yük, rota, araç tipi ve kapasiteyi saniyeler içinde eşleştirin."],
  [<Gauge key="gauge"/>, "Tek ekranda operasyon", "Aktif seferleri, bekleyen işleri ve kritik uyarıları anlık takip edin."],
  [<ShieldCheck key="shield"/>, "Doğrulanmış ağ", "Sürücü, belge ve araç kontrollerini düzenli ve güvenli yönetin."],
];
const faqs = [
  ["Logiway kimler için?", "Nakliye firmaları, filo yöneticileri, yük sahipleri ve operasyon ekipleri için tasarlandı."],
  ["Kurulum ne kadar sürer?", "Ekibinizi ve araçlarınızı ekledikten sonra aynı gün operasyon takibine başlayabilirsiniz."],
  ["Mobil uygulamayla birlikte çalışır mı?", "Evet. Web paneli operasyon ekibine, mobil deneyim ise sahadaki sürücülere göre kurgulandı."],
];

function Logo({ dark = false }) {
  return <Link to="/" className={`brand ${dark ? "brand-dark" : ""}`} aria-label="Logiway ana sayfa"><span className="brand-mark"><Route size={19}/></span><span>logiway</span></Link>;
}

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  return <div className="landing-page">
    <header className="landing-nav">
      <Logo />
      <nav className={menuOpen ? "nav-links is-open" : "nav-links"} aria-label="Ana menü">
        <a href="#urun" onClick={() => setMenuOpen(false)}>Ürün</a><a href="#nasil" onClick={() => setMenuOpen(false)}>Nasıl çalışır?</a><a href="#fiyat" onClick={() => setMenuOpen(false)}>Fiyatlandırma</a><a href="#sss" onClick={() => setMenuOpen(false)}>SSS</a>
      </nav>
      <div className="nav-actions"><Link to="/giris" className="text-link">Giriş yap</Link><Link to="/giris" className="nav-cta">Ücretsiz dene <ArrowRight size={16}/></Link></div>
      <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menüyü aç" aria-expanded={menuOpen}>{menuOpen ? <X/> : <Menu/>}</button>
    </header>

    <main>
      <section className="hero" id="urun">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={14}/> Avrupa lojistiğinin daha akıllı yolu</div>
          <h1>Yükünüz yolda.<br/><span>Kontrol sizde.</span></h1>
          <p>Avrupa genelindeki yükleri, sürücüleri ve filonuzu tek merkezden yönetin. Boş dönüşü azaltın, doğru sınır ötesi eşleşmeyi hızlandırın.</p>
          <div className="hero-actions"><Link to="/giris" className="primary-cta">Ücretsiz başlayın <ArrowRight size={18}/></Link><a href="#nasil" className="secondary-cta">Nasıl çalıştığını görün</a></div>
          <div className="trust-row"><span><Check size={15}/> Kredi kartı gerekmez</span><span><Check size={15}/> 14 gün ücretsiz</span><span><Check size={15}/> 5 dakikada kurulum</span></div>
        </div>
        <div className="hero-product" aria-label="Logiway operasyon paneli önizlemesi">
          <div className="product-glow"/><div className="app-window">
            <div className="app-rail"><div className="mini-logo"><Route size={17}/></div>{[BarChart3,PackageCheck,Truck,Route].map((Icon,i)=><span className={i===0?"rail-icon active":"rail-icon"} key={i}><Icon size={17}/></span>)}</div>
            <div className="app-content"><div className="app-top"><div><small>GÜNAYDIN, CAN</small><strong>Operasyon merkezi</strong></div><span className="live-pill"><i/> Canlı</span></div>
              <div className="metric-grid"><div className="metric"><span>Aktif yük</span><strong>128</strong><small>↗ %12 bu hafta</small></div><div className="metric"><span>Yoldaki araç</span><strong>46</strong><small>38 zamanında</small></div><div className="metric dark"><span>Eşleşme oranı</span><strong>%94</strong><small>+8 puan</small></div></div>
              <div className="map-card"><div className="map-head"><strong>Canlı Avrupa operasyonu</strong><span>Son 24 saat</span></div><div className="route-map"><svg viewBox="0 0 520 150" role="img" aria-label="Bergen'den Milano'ya aktif rota"><path className="map-line muted" d="M25 105 C110 15,175 125,265 61 S405 16,500 80"/><path className="map-line active" d="M25 105 C110 15,175 125,265 61 S405 16,500 80"/></svg><span className="city city-one">Bergen</span><span className="city city-two">Milano</span><span className="truck-pin"><Truck size={15}/></span></div></div>
              <div className="shipment-row"><span className="shipment-icon"><PackageCheck size={18}/></span><span><strong>LW-2847</strong><small>Bergen → Milano</small></span><b>Yolda</b><span className="eta"><Clock3 size={13}/> 1g 18s</span></div>
            </div>
          </div><div className="float-card"><span className="float-icon"><Zap size={18}/></span><div><small>Yeni eşleşme</small><strong>3.2 saniyede bulundu</strong></div><Check size={17}/></div>
        </div>
      </section>

      <section className="proof-strip"><span>Avrupa operasyonunun her adımında</span><div><b>7/24</b><small>sınır ötesi görünürlük</small></div><div><b>Tek hesap</b><small>web ve mobil için ortak operasyon</small></div><div><b>51 ülke</b><small>Türkiye dahil rota eşleştirme</small></div></section>

      <section className="features section" id="nasil"><div className="section-heading"><span>DAHA AZ KARMAŞA, DAHA ÇOK HAREKET</span><h2>Operasyonunuz<br/>tek bir ritimde çalışsın.</h2><p>Dağınık tablolar ve telefon trafiği yerine herkesin aynı bilgiyle hareket ettiği sade bir merkez.</p></div><div className="feature-grid">{features.map(([icon,title,text],i)=><article className="feature-card" key={title}><span className="feature-number">0{i+1}</span><span className="feature-icon">{icon}</span><h3>{title}</h3><p>{text}</p><Link to="/dashboard">Panelde incele <ArrowRight size={15}/></Link></article>)}</div></section>

      <section className="workflow section"><div className="workflow-card"><div className="workflow-copy"><span className="section-kicker">BAŞTAN SONA GÖRÜNÜRLÜK</span><h2>Bir yük ilanından<br/>teslimata kadar.</h2><p>Logiway doğru aracı bulur, rotayı izler ve ekibinize yalnızca gerçekten önemli olanı gösterir.</p><Link to="/dashboard" className="light-cta">Canlı demoyu aç <ArrowRight size={17}/></Link></div><div className="workflow-steps">{[["01","Yükü oluştur","Rota, ağırlık ve teslimat bilgisini girin."],["02","Akıllı eşleşme","Uygun sürücü ve araçlar otomatik sıralansın."],["03","Canlı takip","Süreci tek ekrandan güvenle yönetin."]].map(([n,t,d],i)=><div className={i===1?"workflow-step active":"workflow-step"} key={n}><span>{n}</span><div><strong>{t}</strong><small>{d}</small></div>{i===1&&<Zap size={18}/>}</div>)}</div></div></section>

      <section className="pricing section" id="fiyat"><div className="pricing-copy"><span className="section-kicker">BÜYÜDÜKÇE SİZİNLE BÜYÜR</span><h2>Net fiyat.<br/>Sürpriz yok.</h2><p>Küçük filolardan yoğun Avrupa operasyon ekiplerine kadar ihtiyacınız olan her şey.</p><div className="price"><sup>€</sup><strong>49</strong><span>/ ay<br/><small>+ vergi</small></span></div><Link to="/giris" className="primary-cta">14 gün ücretsiz deneyin <ArrowRight size={18}/></Link></div><div className="price-list"><h3>Profesyonel plana dahil</h3>{["Sınırsız yük ve ilan yönetimi","Avrupa koridoru eşleştirme","Canlı operasyon paneli","Ekip rolleri ve yetkilendirme","Çok para birimli raporlama","Öncelikli destek"].map(x=><div key={x}><Check size={17}/><span>{x}</span></div>)}<small>İstediğiniz zaman iptal edebilirsiniz.</small></div></section>

      <section className="faq section" id="sss"><div><span className="section-kicker">AKLINIZDA KALMASIN</span><h2>Sık sorulanlar.</h2></div><div className="faq-list">{faqs.map(([q,a],i)=><button key={q} onClick={()=>setOpenFaq(openFaq===i?-1:i)} className={openFaq===i?"faq-item open":"faq-item"} aria-expanded={openFaq===i}><span><strong>{q}</strong>{openFaq===i&&<p>{a}</p>}</span><ChevronDown size={19}/></button>)}</div></section>
      <section className="final-cta"><div><span className="eyebrow"><Sparkles size={14}/> İlk seferinizi bugün yönetin</span><h2>Lojistik operasyonunuz<br/>bir adım öne geçsin.</h2></div><Link to="/giris" className="primary-cta light">Ücretsiz başlayın <ArrowRight size={18}/></Link></section>
    </main>
    <footer className="landing-footer"><Logo dark/><p>Yükleri, filoları ve ekipleri aynı yolda buluşturur.</p><span>© 2026 Logiway. Tüm hakları saklıdır.</span></footer>
  </div>;
}
