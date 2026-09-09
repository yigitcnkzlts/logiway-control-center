import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Building2, Check, ChevronRight, ClipboardList, Clock3, LogOut, MapPin, Package, Route, ShieldCheck, Truck, UserRound, Wallet, Weight, X } from "lucide-react";
import "./Portal.css";

const seedLoads = [
  { id:"LW-2847", from:"İstanbul", to:"Ankara", vehicle:"Tır", weight:"24 ton", price:"38.000 ₺", date:"12 Eyl", status:"Teklif alıyor", offers:6 },
  { id:"LW-2844", from:"İzmir", to:"Bursa", vehicle:"Kamyon", weight:"12 ton", price:"17.500 ₺", date:"13 Eyl", status:"Teklif alıyor", offers:3 },
  { id:"LW-2838", from:"Kocaeli", to:"Adana", vehicle:"Tır", weight:"22 ton", price:"42.000 ₺", date:"14 Eyl", status:"Planlandı", offers:9 },
];

const jobs = [
  { id:"LW-2847", from:"İstanbul / Tuzla", to:"Ankara / Sincan", vehicle:"Tır", weight:"24 ton", price:"38.000 ₺", date:"12 Eylül", distance:"452 km", company:"Kaya Lojistik" },
  { id:"LW-2844", from:"İzmir / Bornova", to:"Bursa / Nilüfer", vehicle:"Kamyon", weight:"12 ton", price:"17.500 ₺", date:"13 Eylül", distance:"331 km", company:"Demir Nakliyat" },
  { id:"LW-2838", from:"Kocaeli / Gebze", to:"Adana / Seyhan", vehicle:"Tır", weight:"22 ton", price:"42.000 ₺", date:"14 Eylül", distance:"831 km", company:"Arslan Depo" },
];

const roleInfo = {
  "yuk-veren": { title:"Yük Veren", description:"İlan yayınlayın, teklifleri karşılaştırın ve sevkiyatınızı takip edin.", icon:Building2 },
  sofor: { title:"Şoför", description:"Size uygun yükleri bulun, teklif verin ve seferlerinizi yönetin.", icon:Truck },
};

function Brand() { return <Link className="portal-brand" to="/"><span><Route size={19}/></span>logiway</Link>; }

export function RoleSelect() {
  return <div className="role-page"><header><Brand/><Link to="/" className="back-link"><ArrowLeft size={16}/> Ana sayfa</Link></header><main><div className="role-intro"><span>LOGIWAY’E HOŞ GELDİNİZ</span><h1>Nasıl devam etmek<br/>istiyorsunuz?</h1><p>Size özel çalışma alanını açmak için rolünüzü seçin.</p></div><div className="role-cards">{Object.entries(roleInfo).map(([key,info])=>{const Icon=info.icon;return <Link to={`/giris/${key}`} className="role-card" key={key}><span className="role-icon"><Icon/></span><div><h2>{info.title} olarak devam et</h2><p>{info.description}</p></div><ChevronRight/></Link>})}<Link to="/dashboard" className="admin-access"><ShieldCheck size={18}/><span><strong>Yönetici girişi</strong><small>Operasyon kontrol merkezi</small></span><ChevronRight size={18}/></Link></div></main></div>;
}

export function PortalLogin() {
  const { role } = useParams(); const navigate=useNavigate(); const info=roleInfo[role]; const [busy,setBusy]=useState(false);
  if(!info) return <Navigate to="/giris" replace/>;
  const Icon=info.icon;
  function submit(e){e.preventDefault();setBusy(true);setTimeout(()=>navigate(`/${role}/panel`),450)}
  return <div className="login-page"><div className="login-aside"><Brand/><div><span className="aside-icon"><Icon/></span><h1>{info.title} çalışma alanı</h1><p>{info.description}</p><ul><li><Check/> Ayrı ve güvenli hesap</li><li><Check/> Role özel araçlar</li><li><Check/> Mobil uyumlu kullanım</li></ul></div><small>© 2026 Logiway</small></div><main className="login-main"><Link to="/giris" className="back-link"><ArrowLeft size={16}/> Rol seçimine dön</Link><form onSubmit={submit}><span className="form-kicker">{info.title.toUpperCase()} GİRİŞİ</span><h2>Tekrar hoş geldiniz.</h2><p>Çalışma alanınıza erişmek için bilgilerinizi girin.</p><label>E-posta adresi<input required type="email" defaultValue={role==="sofor"?"sofor@logiway.com":"operasyon@logiway.com"}/></label><label>Şifre<input required type="password" defaultValue="logiwaydemo"/></label><div className="form-row"><label className="check-label"><input type="checkbox"/> Beni hatırla</label><button type="button">Şifremi unuttum</button></div><button className="login-button" disabled={busy}>{busy?"Giriş yapılıyor…":"Giriş yap"}<ArrowRight size={18}/></button><div className="demo-note">Demo için bilgiler hazır girildi.</div></form></main></div>;
}

function PortalShell({ role, children, active="Özet" }) {
  const info=roleInfo[role]; const Icon=info.icon;
  const menu=role==="yuk-veren"?[["Özet",<ClipboardList size={18}/>],["İlanlarım",<Package size={18}/>],["Teklifler",<Wallet size={18}/>]]:[["Uygun işler",<Package size={18}/>],["Seferlerim",<Route size={18}/>],["Kazançlar",<Wallet size={18}/>]];
  return <div className="portal-shell"><aside><Brand/><div className="workspace-badge"><span><Icon/></span><div><small>ÇALIŞMA ALANI</small><strong>{info.title}</strong></div></div><nav>{menu.map(([label,icon])=><button className={active===label?"active":""} key={label}>{icon}{label}</button>)}</nav><Link to="/giris" className="logout"><LogOut size={17}/> Çıkış yap</Link></aside><main className="portal-main"><header><div><small>{info.title.toUpperCase()} PANELİ</small><strong>Merhaba, {role==="sofor"?"Ahmet":"Kaya Lojistik"}</strong></div><span className="user-avatar"><UserRound/></span></header>{children}</main></div>;
}

export function ShipperPortal() {
  const [loads,setLoads]=useState(seedLoads); const [modal,setModal]=useState(false); const [success,setSuccess]=useState(false);
  function addLoad(e){e.preventDefault();const fd=new FormData(e.currentTarget);const next={id:`LW-${2850+loads.length}`,from:fd.get("from"),to:fd.get("to"),vehicle:fd.get("vehicle"),weight:`${fd.get("weight")} ton`,price:`${Number(fd.get("price")).toLocaleString("tr-TR")} ₺`,date:"Yeni",status:"Onay bekliyor",offers:0};setLoads([next,...loads]);setModal(false);setSuccess(true);setTimeout(()=>setSuccess(false),3000)}
  return <PortalShell role="yuk-veren"><section className="portal-heading"><div><span>OPERASYON ÖZETİ</span><h1>Yükleriniz kontrol altında.</h1><p>İlanlarınızı yayınlayın, gelen teklifleri tek ekrandan yönetin.</p></div><button className="portal-primary" onClick={()=>setModal(true)}>Yeni yük ilanı <Package size={18}/></button></section>{success&&<div className="success-banner"><Check/> İlanınız oluşturuldu ve onaya gönderildi.</div>}<div className="portal-stats"><article><span>Aktif ilan</span><strong>{loads.filter(x=>x.status==="Teklif alıyor").length}</strong><small>Şu anda yayında</small></article><article><span>Toplam teklif</span><strong>{loads.reduce((a,x)=>a+x.offers,0)}</strong><small>İlanlarınıza gelen</small></article><article className="dark"><span>Devam eden taşıma</span><strong>4</strong><small>3'ü zamanında</small></article></div><section className="portal-list"><div className="list-head"><div><h2>Son yük ilanları</h2><p>Yayınladığınız ilanların güncel durumu</p></div><button>Tümünü gör <ArrowRight size={15}/></button></div>{loads.map(x=><article className="load-row" key={x.id}><span className="load-box"><Package/></span><div className="load-route"><strong>{x.from} <ArrowRight/> {x.to}</strong><small>{x.id} · {x.vehicle} · {x.weight}</small></div><div><small>HEDEF BÜTÇE</small><strong>{x.price}</strong></div><div><small>TEKLİFLER</small><strong>{x.offers} teklif</strong></div><span className={`portal-status ${x.status==="Teklif alıyor"?"green":""}`}>{x.status}</span><button className="row-action"><ChevronRight/></button></article>)}</section>{modal&&<div className="portal-modal" role="dialog" aria-modal="true"><form onSubmit={addLoad}><div className="modal-head"><div><span>YENİ İLAN</span><h2>Yük bilgilerini girin</h2></div><button type="button" onClick={()=>setModal(false)} aria-label="Kapat"><X/></button></div><div className="form-grid"><label>Kalkış noktası<input required name="from" placeholder="Örn. İstanbul / Tuzla"/></label><label>Varış noktası<input required name="to" placeholder="Örn. Ankara / Sincan"/></label><label>Araç tipi<select name="vehicle"><option>Tır</option><option>Kamyon</option><option>Kamyonet</option><option>Panelvan</option></select></label><label>Ağırlık (ton)<input required name="weight" type="number" min="1" placeholder="24"/></label><label className="wide">Hedef bütçe (₺)<input required name="price" type="number" min="1" placeholder="38000"/></label></div><button className="login-button">İlanı yayınla <ArrowRight/></button></form></div>}</PortalShell>;
}

export function DriverPortal() {
  const [accepted,setAccepted]=useState([]); const [filter,setFilter]=useState("Tümü");
  const visible=useMemo(()=>filter==="Tümü"?jobs:jobs.filter(x=>x.vehicle===filter),[filter]);
  return <PortalShell role="sofor" active="Uygun işler"><section className="portal-heading"><div><span>SİZE UYGUN İŞLER</span><h1>Rotanıza uygun yükler.</h1><p>Güncel ilanları inceleyin, tek dokunuşla teklif verin.</p></div><div className="driver-online"><i/> İş almaya açıksınız</div></section><div className="driver-toolbar"><div>{["Tümü","Tır","Kamyon"].map(x=><button className={filter===x?"active":""} onClick={()=>setFilter(x)} key={x}>{x}</button>)}</div><span>{visible.length} uygun iş</span></div><section className="job-grid">{visible.map(job=><article className="job-card" key={job.id}><div className="job-top"><span>{job.id}</span><strong>{job.price}</strong></div><div className="job-route"><div><i/><span><small>KALKIŞ</small><strong>{job.from}</strong></span></div><div className="route-line"/><div><i/><span><small>VARIŞ</small><strong>{job.to}</strong></span></div></div><div className="job-meta"><span><Truck/> {job.vehicle}</span><span><Weight/> {job.weight}</span><span><MapPin/> {job.distance}</span><span><Clock3/> {job.date}</span></div><div className="job-company"><span>{job.company.slice(0,1)}</span><div><strong>{job.company}</strong><small><ShieldCheck/> Doğrulanmış firma</small></div></div><button disabled={accepted.includes(job.id)} onClick={()=>setAccepted([...accepted,job.id])} className={accepted.includes(job.id)?"accepted":""}>{accepted.includes(job.id)?<><Check/> Teklif gönderildi</>:<>İşi incele ve teklif ver <ArrowRight/></>}</button></article>)}</section></PortalShell>;
}
