import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import ExportButton from "../components/ExportButton";
import ShipperCompanyTeam from "../features/companies/ShipperCompanyTeam";
import {
  exportCSV,
  exportXLSX,
  exportPDF,
  loadsExportData,
  shipmentsExportData,
  historyExportData,
  paymentsExportData,
} from "../services/exportService";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bell,
  Building2,
  Check,
  ChevronRight,
  ClipboardList,
  Clock3,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  FileCheck2,
  FileText,
  Languages,
  LogOut,
  Map,
  MapPin,
  MessageCircle,
  Navigation,
  Package,
  PackageCheck,
  PauseCircle,
  Pencil,
  Plus,
  Route,
  Search,
  Send,
  ShieldCheck,
  Timer,
  TrendingDown,
  TrendingUp,
  Truck,
  UploadCloud,
  UserRound,
  Users,
  Wallet,
  Warehouse,
  Weight,
  X,
} from "lucide-react";
import {
  deleteDraft,
  getLoads,
  getMatches,
  getOffers,
  loadToJob,
  saveDraft,
  saveLoads,
  saveMatches,
  saveOffers,
  subscribeMarketplace,
} from "../services/marketplaceStore";
import {
  ensureConversation,
  subscribeMessages,
  totalUnread,
} from "../services/messageStore";
import {
  PAYMENT_STATUSES,
  filterPayments,
  formatPaymentAmount,
  getPayments,
  paymentDocumentLabel,
  paymentStatusClass,
  paymentStatusLabel,
  paymentSummary,
  mapPaymentLedger,
  subscribePayments,
} from "../services/paymentStore";
import { listPaymentLedger } from "../api/operationsClient";
import {
  LOAD_STATUS_FILTERS,
  buildShipperNotifications,
  buildShipperSearchItems,
  filterAndSortLoads,
  missingDraftFields,
  normalizeLoadStatus,
} from "../services/shipperExperience";
import {
  addDoc,
  deleteDoc,
  downloadDoc,
  getDocs,
  hasBlobInMemory,
  subscribeDocs,
  validateFile,
  DOC_TYPES,
  ALLOWED_EXTENSIONS,
} from "../services/documentStore";
import {
  demoCompanyDashboard,
  getCompanyDashboard,
} from "../api/companyDashboardClient";
import {
  getSession,
  isBackendConfigured,
  loginUser,
  registerUser,
  verifyMfa,
} from "../api/authClient";
import { clearSession, isDemoMode } from "../api/apiClient";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
  PASSWORD_REQUIREMENTS,
} from "../api/authValidation";
import { DEMO_CREDENTIALS, enterDemoSession, isDemoSession } from "../api/demoAuth";
import {
  cancelLiveLoad,
  createAndPublishLoad,
  duplicateLiveLoadAsDraft,
  liveMarketplaceEnabled,
  loadMarketplace,
  loadIncomingOffers,
  loadMyLoads,
  loadMyMatches,
  loadMyShipments,
  myOffers as loadMyOffers,
  offersForLoad,
  submitLiveOffer,
} from "../api/marketplaceClient";
import {
  ActionCenter,
  DriverWorkspace,
  LoadDetailDrawer,
  MarketplaceFilters,
  MessagesCenter,
  NotificationCenter,
  ShipmentDetail,
} from "../features/operations/OperationsPanels";
import OfferComparison from "../features/offers/OfferComparison";
import { CommandPalette } from "../features/operations/CommandPalette";
import { SavedLoads, BookmarkButton } from "../features/marketplace/SavedLoads";
import { SavedFilters } from "../features/marketplace/SavedFilters";
import {
  RecentSearchBadges,
  RecentlyViewed,
} from "../features/marketplace/RecentActivity";
import { usePreferences } from "../hooks/usePreferences";
import "./Portal.css";

const EUROPEAN_COUNTRIES = [
  "Almanya",
  "Andorra",
  "Arnavutluk",
  "Avusturya",
  "Azerbaycan",
  "Belarus",
  "Belçika",
  "Birleşik Krallık",
  "Bosna-Hersek",
  "Bulgaristan",
  "Çekya",
  "Danimarka",
  "Ermenistan",
  "Estonya",
  "Finlandiya",
  "Fransa",
  "Gürcistan",
  "Hırvatistan",
  "Hollanda",
  "İrlanda",
  "İspanya",
  "İsveç",
  "İsviçre",
  "İtalya",
  "İzlanda",
  "Karadağ",
  "Kazakistan",
  "Kıbrıs",
  "Kosova",
  "Kuzey Makedonya",
  "Letonya",
  "Lihtenştayn",
  "Litvanya",
  "Lüksemburg",
  "Macaristan",
  "Malta",
  "Moldova",
  "Monako",
  "Norveç",
  "Polonya",
  "Portekiz",
  "Romanya",
  "Rusya",
  "San Marino",
  "Sırbistan",
  "Slovakya",
  "Slovenya",
  "Türkiye",
  "Ukrayna",
  "Vatikan",
  "Yunanistan",
];
const makeRecordId = (prefix) => `${prefix}-${Date.now().toString().slice(-6)}`;
const SHIPPER_SECTION_SLUGS = {
  "Genel Bakış": "genel-bakis",
  "Yük İlanlarım": "yuk-ilanlarim",
  "Gelen Teklifler": "gelen-teklifler",
  "Sevkiyatlarım": "sevkiyatlarim",
  Mesajlar: "mesajlar",
  Geçmiş: "gecmis",
  Belgeler: "belgeler",
  Ödemeler: "odemeler",
  "Firma ve Ekip": "firma-ekip",
};
const SHIPPER_SLUG_SECTIONS = Object.fromEntries(
  Object.entries(SHIPPER_SECTION_SLUGS).map(([section, slug]) => [slug, section]),
);

const seedLoads = [
  {
    id: "LW-2847",
    cargo: "Soğuk zincir somon",
    from: "Bergen, Norveç",
    to: "Milano, İtalya",
    vehicle: "Frigorifik",
    weight: "18 ton",
    price: "4.850 €",
    date: "12 Eyl",
    status: "Teklif alıyor",
    offers: 6,
  },
  {
    id: "LW-2844",
    cargo: "Paletli otomotiv parçası",
    from: "Göteborg, İsveç",
    to: "Münih, Almanya",
    vehicle: "Tır",
    weight: "21 ton",
    price: "3.900 €",
    date: "13 Eyl",
    status: "Teklif alıyor",
    offers: 3,
  },
  {
    id: "LW-2838",
    cargo: "Ambalajlı makine ekipmanı",
    from: "Rotterdam, Hollanda",
    to: "Torino, İtalya",
    vehicle: "Tır",
    weight: "22 ton",
    price: "3.650 €",
    date: "14 Eyl",
    status: "Planlandı",
    offers: 9,
  },
];
const jobs = [
  {
    id: "LW-2847",
    cargo: "Soğuk zincir somon",
    from: "Bergen, Norveç",
    to: "Milano, İtalya",
    originCountry: "Norveç",
    destinationCountry: "İtalya",
    vehicle: "Frigorifik",
    weight: "18 ton",
    price: "4.850 €",
    date: "12 Eylül",
    distance: "2.430 km",
    company: "NordCargo AS",
    match: 98,
  },
  {
    id: "LW-2844",
    cargo: "Paletli otomotiv parçası",
    from: "Oslo, Norveç",
    to: "Verona, İtalya",
    originCountry: "Norveç",
    destinationCountry: "İtalya",
    vehicle: "Tır",
    weight: "21 ton",
    price: "4.400 €",
    date: "13 Eylül",
    distance: "2.050 km",
    company: "Scandic Freight",
    match: 95,
  },
  {
    id: "LW-2838",
    cargo: "Ambalajlı makine ekipmanı",
    from: "Göteborg, İsveç",
    to: "Torino, İtalya",
    originCountry: "İsveç",
    destinationCountry: "İtalya",
    vehicle: "Tır",
    weight: "22 ton",
    price: "3.650 €",
    date: "14 Eylül",
    distance: "1.780 km",
    company: "EuroLink AB",
    match: 89,
  },
  {
    id: "LW-2832",
    cargo: "Mobilya ve ev eşyası",
    from: "Trondheim, Norveç",
    to: "Hamburg, Almanya",
    originCountry: "Norveç",
    destinationCountry: "Almanya",
    vehicle: "Tır",
    weight: "16 ton",
    price: "3.200 €",
    date: "15 Eylül",
    distance: "1.520 km",
    company: "Norse Move AS",
    match: 86,
  },
];
const roleInfo = {
  "yuk-veren": {
    title: "Yük Veren",
    description: "Tüm taşıma operasyonunuzu tek merkezden yönetin.",
    features: [
      "Yük ilanı oluşturma",
      "Teklifleri karşılaştırma",
      "Sevkiyat takibi",
    ],
    icon: Building2,
  },
  lojistik: {
    title: "Lojistik Firması",
    description: "Filonuzu verimli işlerle buluşturun ve büyütün.",
    features: [
      "Yük bulma",
      "Araç ve şoför yönetimi",
      "Sefer ve kazanç yönetimi",
    ],
    icon: Users,
  },
  sofor: {
    title: "Şoför",
    description: "Yoldaki işlerinize hızlı ve kolay erişin.",
    features: [
      "Uygun yükleri görüntüleme",
      "Teklif gönderme",
      "Sefer yönetimi",
    ],
    icon: Truck,
  },
};
const roleSelectionInfo = {
  "yuk-veren": {
    title: "Yük Veren",
    description:
      "Taşıma ihtiyaçlarınızı tek merkezden yönetin ve doğru taşıyıcıyla hızlıca eşleşin.",
    features: [
      "Yük ilanı oluşturma",
      "Teklifleri karşılaştırma",
      "Sevkiyat takibi",
    ],
    buttonLabel: "Yük Veren olarak devam et",
    icon: PackageCheck,
  },
  lojistik: {
    title: "Lojistik Firması",
    description:
      "Filonuzu verimli işlerle buluşturun, tekliflerinizi yönetin ve operasyonunuzu büyütün.",
    features: [
      "Uygun yükleri bulma",
      "Araç ve şoför yönetimi",
      "Sefer ve kazanç yönetimi",
    ],
    buttonLabel: "Lojistik Firması olarak devam et",
    icon: Warehouse,
  },
  sofor: {
    title: "Şoför",
    description:
      "Yoldaki işlerinize hızlı erişin, seferlerinizi takip edin ve teslimat sürecini yönetin.",
    features: [
      "Uygun yükleri görüntüleme",
      "Teklif gönderme",
      "Sefer yönetimi",
    ],
    buttonLabel: "Şoför olarak devam et",
    icon: Truck,
  },
};
const seedOffers = [
  {
    id: 1,
    load: "LW-2847",
    driver: "Lars Johansen",
    vehicle: "Frigorifik · NO DR 847",
    score: "4.9",
    trips: 184,
    amount: "4.650 €",
    eta: "Bugün 14:30",
  },
  {
    id: 2,
    load: "LW-2847",
    driver: "Marco Bianchi",
    vehicle: "Frigorifik · IT MB 144",
    score: "4.8",
    trips: 126,
    amount: "4.780 €",
    eta: "Bugün 16:00",
  },
  {
    id: 3,
    load: "LW-2844",
    driver: "Erik Lund",
    vehicle: "Tır · SE EL 615",
    score: "4.7",
    trips: 98,
    amount: "3.760 €",
    eta: "Yarın 09:00",
  },
];

function Brand() {
  return (
    <Link className="portal-brand" to="/">
      <span>
        <Route size={19} />
      </span>
      logiway
    </Link>
  );
}

export function RoleSelect() {
  return (
    <div className="role-page">
      <header>
        <Brand />
        <Link to="/" className="back-link">
          <ArrowLeft size={16} /> Ana sayfa
        </Link>
      </header>
      <main>
        <div className="role-intro">
          <span>LOGIWAY&apos;E HOŞ GELDİNİZ</span>
          <h1>Çalışma alanınızı seçin.</h1>
          <p>
            Rolünüze uygun paneli seçin ve lojistik operasyonlarınızı yönetmeye
            başlayın.
          </p>
        </div>
        <div className="role-cards">
          {Object.entries(roleSelectionInfo).map(([key, info], index) => {
            const Icon = info.icon;
            return (
              <article className={`role-card role-card--${key}`} key={key}>
                <div className="role-card-top">
                  <span className="role-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <span className="role-card-number" aria-hidden="true">
                    0{index + 1}
                  </span>
                </div>
                <div className="role-card-copy">
                  <h2>{info.title}</h2>
                  <p>{info.description}</p>
                  <ul>
                    {info.features.map((feature) => (
                      <li key={feature}>
                        <Check size={15} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link to={`/giris/${key}`} className="role-continue">
                  {info.buttonLabel} <ArrowRight size={17} />
                </Link>
              </article>
            );
          })}
        </div>
        <Link to="/dashboard" className="admin-access">
          <ShieldCheck size={18} />
          <span>
            <strong>Yönetici girişi</strong>
            <small>Operasyon kontrol merkezi</small>
          </span>
          <ChevronRight size={18} />
        </Link>
      </main>
    </div>
  );
}

export function PortalLogin() {
  const { role } = useParams();
  const navigate = useNavigate();
  const info = roleInfo[role];
  const [busy, setBusy] = useState(false);
  const [register, setRegister] = useState(false);
  const [error, setError] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shipperPassword, setShipperPassword] = useState("");
  if (!info) return <Navigate to="/giris" replace />;
  const Icon = info.icon;
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const form = e.currentTarget;
    const f = new FormData(form);
    const submittedEmail =
      form.elements.namedItem("email")?.value || f.get("email");
    const submittedPassword =
      form.elements.namedItem("password")?.value || f.get("password");
    try {
      let authResult;
      if (mfaToken) {
        authResult = await verifyMfa({ mfaToken, code: f.get("mfaCode"), rememberMe });
      } else if (register) {
        authResult = await registerUser({
          email: submittedEmail,
          password: submittedPassword,
          phone: f.get("phone"),
          role,
          company: f.get("displayName"),
          country: f.get("country"),
        });
        if (authResult.mode === "demo") {
          const current = JSON.parse(
            localStorage.getItem("logiway-registrations") || "[]",
          );
          const accountRole =
            role === "sofor"
              ? "Şoför"
              : role === "lojistik"
                ? "Lojistik firması"
                : "Yük veren";
          const entry = {
            id: makeRecordId("USR"),
            name: f.get("displayName"),
            email: submittedEmail,
            phone: f.get("phone"),
            role: accountRole,
            company:
              role === "sofor"
                ? f.get("company") || "Bağımsız taşıyıcı"
                : f.get("displayName"),
            country: f.get("country"),
            vehicle: f.get("vehicle") || "—",
            status: "İnceleniyor",
            joined: new Date().toLocaleDateString("tr-TR"),
            createdAt: new Date().toISOString(),
          };
          localStorage.setItem(
            "logiway-registrations",
            JSON.stringify([entry, ...current]),
          );
          window.dispatchEvent(new CustomEvent("logiway-marketplace-change"));
        }
      } else {
        authResult = await loginUser({
          email: submittedEmail,
          password: submittedPassword,
          role,
          rememberMe,
        });
        if (authResult.mode === "mfa") {
          setMfaToken(authResult.mfaToken);
          return;
        }
      }
      navigate(authResult?.panelPath || `/${role}/panel`);
    } catch (reason) {
      setError(reason.message || "Giriş tamamlanamadı.");
    } finally {
      setBusy(false);
    }
  }
  function selectAuthMode(nextRegister) {
    setRegister(nextRegister);
    setError("");
    setMfaToken("");
    setShipperPassword("");
  }
  const demoCredentials =
    isDemoMode() && !register ? DEMO_CREDENTIALS : { email: "", password: "" };
  if (role === "yuk-veren")
    return (
      <div className="login-page login-page--shipper">
        <div className="login-aside">
          <Brand />
          <div>
            <span className="aside-icon">
              <Building2 />
            </span>
            <h1>Yük Veren Paneli</h1>
            <p>
              Yüklerinizi yayınlayın, taşıyıcı tekliflerini karşılaştırın ve
              sevkiyatlarınızı tek yerden yönetin.
            </p>
            <ul>
              {roleInfo[role].features.map((feature) => (
                <li key={feature}>
                  <Check /> {feature}
                </li>
              ))}
            </ul>
          </div>
          <small>© 2026 Logiway</small>
        </div>
        <main className="login-main">
          <Link to="/giris" className="back-link">
            <ArrowLeft size={16} /> Rol seçimine dön
          </Link>
          <form
            key={register ? "shipper-register" : "shipper-login"}
            onSubmit={submit}
          >
            {!mfaToken && (
              <div
                className="auth-tabs"
                role="tablist"
                aria-label="Hesap işlemi"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={!register}
                  className={!register ? "active" : ""}
                  onClick={() => selectAuthMode(false)}
                >
                  Giriş yap
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={register}
                  className={register ? "active" : ""}
                  onClick={() => selectAuthMode(true)}
                >
                  Hesap oluştur
                </button>
              </div>
            )}
            {mfaToken ? (
              <>
                <span className="form-kicker">GÜVENLİK DOĞRULAMASI</span>
                <h2>Doğrulama kodunu girin.</h2>
                <p>Authenticator uygulamanızdaki 6 haneli kodu kullanın.</p>
                <label>
                  Tek kullanımlık kod
                  <input
                    required
                    name="mfaCode"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    minLength="6"
                    maxLength="12"
                    placeholder="000000"
                    autoFocus
                  />
                </label>
              </>
            ) : register ? (
              <>
                <span className="form-kicker">YÜK VEREN KAYDI</span>
                <h2>Yük Veren hesabınızı oluşturun</h2>
                <p>Firma ve hesap bilgilerinizi eksiksiz tamamlayın.</p>
                <label>
                  Firma unvanı
                  <input
                    required
                    name="displayName"
                    minLength="2"
                    maxLength="255"
                    autoComplete="organization"
                    placeholder="Firmanızın resmi unvanı"
                  />
                </label>
                <label>
                  Telefon numarası
                  <input
                    name="phone"
                    type="tel"
                    maxLength="32"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="05xx xxx xx xx"
                  />
                </label>
                <label>
                  Ülke
                  <select
                    required
                    name="country"
                    defaultValue="Türkiye"
                    autoComplete="country-name"
                  >
                    {EUROPEAN_COUNTRIES.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <label>
                  E-posta adresi
                  <input
                    required
                    name="email"
                    type="email"
                    maxLength="320"
                    autoComplete="email"
                    placeholder="ornek@firma.com"
                  />
                </label>
                <label>
                  Şifre
                  <div className="password-field">
                    <input
                      required
                      name="password"
                      type={showPassword ? "text" : "password"}
                      minLength={PASSWORD_MIN_LENGTH}
                      maxLength={PASSWORD_MAX_LENGTH}
                      pattern={PASSWORD_PATTERN}
                      title={PASSWORD_REQUIREMENTS}
                      autoComplete="new-password"
                      value={shipperPassword}
                      onChange={(event) =>
                        setShipperPassword(event.target.value)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={
                        showPassword ? "Şifreyi gizle" : "Şifreyi göster"
                      }
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </label>
                <PasswordChecklist password={shipperPassword} />
              </>
            ) : (
              <>
                <span className="form-kicker">YÜK VEREN GİRİŞİ</span>
                <h2>Yük Veren hesabınıza giriş yapın</h2>
                <p>
                  Yüklerinizi ve sevkiyatlarınızı yönetmek için hesabınıza
                  erişin.
                </p>
                <label>
                  E-posta adresi
                  <input
                    required
                    name="email"
                    type="email"
                    maxLength="320"
                    autoComplete="email"
                    placeholder="ornek@firma.com"
                    defaultValue={demoCredentials.email}
                  />
                </label>
                <label>
                  Şifre
                  <div className="password-field">
                    <input
                      required
                      name="password"
                      type={showPassword ? "text" : "password"}
                      maxLength={PASSWORD_MAX_LENGTH}
                      autoComplete="current-password"
                      defaultValue={demoCredentials.password}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={
                        showPassword ? "Şifreyi gizle" : "Şifreyi göster"
                      }
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </label>
                <RememberMeCheckbox
                  checked={rememberMe}
                  onChange={setRememberMe}
                />
              </>
            )}
            {error && (
              <div className="auth-error" role="alert">
                <AlertTriangle /> <span>{error}</span>
              </div>
            )}
            <button className="login-button" disabled={busy} aria-busy={busy}>
                {busy ? (
                  <>
                    <span className="button-spinner" /> {register ? "Hesabınız oluşturuluyor…" : "İşlem yapılıyor…"}
                  </>
                ) : (
                  <>
                    {mfaToken ? "Güvenli girişi tamamla" : register ? "Hesabımı oluştur" : "Giriş yap"}
                    <ArrowRight size={18} />
                  </>
                )}
            </button>
            {mfaToken && (
              <button
                type="button"
                className="mfa-back"
                onClick={() => setMfaToken("")}
              >
                E-posta ve şifre ekranına dön
              </button>
            )}
            {isDemoMode() && !mfaToken && (
              <div className="demo-divider"><span>ya da</span></div>
            )}
            {isDemoMode() && !mfaToken && (
              <button
                type="button"
                className="demo-continue-btn"
                onClick={() => { enterDemoSession(role); navigate(`/${role}/panel`); }}
                aria-label={`Demo olarak ${role} paneline gir`}
              >
                <span className="demo-badge-inline">DEMO</span>
                Demo olarak devam et
              </button>
            )}
            <div className="demo-note">
              {isBackendConfigured() ? (
                "Güvenli API bağlantısı etkin."
              ) : isDemoMode() ? (
                "Demo modu: gerçek hesap veya backend gerekmez."
              ) : (
                "Canlı backend bağlantısı bekleniyor."
              )}
            </div>
          </form>
        </main>
      </div>
    );
  return (
    <div className="login-page">
      <div className="login-aside">
        <Brand />
        <div>
          <span className="aside-icon">
            <Icon />
          </span>
          <h1>{info.title} çalışma alanı</h1>
          <p>{info.description}</p>
          <ul>
            {info.features.map((feature) => (
              <li key={feature}>
                <Check /> {feature}
              </li>
            ))}
          </ul>
        </div>
        <small>© 2026 Logiway</small>
      </div>
      <main className="login-main">
        <Link to="/giris" className="back-link">
          <ArrowLeft size={16} /> Rol seçimine dön
        </Link>
        <form key={register ? "register" : "login"} onSubmit={submit}>
          {!mfaToken && (
            <div className="auth-tabs">
              <button
                type="button"
                className={!register ? "active" : ""}
                onClick={() => {
                  setRegister(false);
                  setError("");
                }}
              >
                Giriş yap
              </button>
              <button
                type="button"
                className={register ? "active" : ""}
                onClick={() => {
                  setRegister(true);
                  setError("");
                }}
              >
                Hesap oluştur
              </button>
            </div>
          )}
          <span className="form-kicker">
            {info.title.toUpperCase()}{" "}
            {mfaToken ? "GÜVENLİK DOĞRULAMASI" : register ? "KAYDI" : "GİRİŞİ"}
          </span>
          <h2>
            {mfaToken
              ? "Doğrulama kodunu girin."
              : register
                ? "Bilgilerinizi tamamlayın."
                : "Tekrar hoş geldiniz."}
          </h2>
          <p>
            {mfaToken
              ? "Authenticator uygulamanızdaki 6 haneli kodu kullanın."
              : register
                ? "Size uygun çalışma alanını birkaç adımda hazırlayalım."
                : "Çalışma alanınıza erişmek için bilgilerinizi girin."}
          </p>
          {mfaToken ? (
            <label>
              Tek kullanımlık kod
              <input
                required
                name="mfaCode"
                inputMode="numeric"
                autoComplete="one-time-code"
                minLength="6"
                maxLength="12"
                placeholder="000000"
                autoFocus
              />
            </label>
          ) : (
            <>
              {register && (
                <>
                  <label>
                    {role === "sofor" ? "Ad soyad" : "Firma unvanı"}
                    <input
                      required
                      name="displayName"
                      minLength="2"
                      maxLength="255"
                      placeholder={
                        role === "sofor" ? "Adınız ve soyadınız" : "Firma adı"
                      }
                    />
                  </label>
                  <label>
                    Telefon numarası
                    <input
                      required
                      name="phone"
                      type="tel"
                      maxLength="32"
                      placeholder="05xx xxx xx xx"
                    />
                  </label>
                  <label>
                    Ülke
                    <select required name="country" defaultValue="Türkiye">
                      {EUROPEAN_COUNTRIES.map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                  {role === "sofor" && (
                    <>
                      <label>
                        Taşıyıcı firma
                        <input
                          name="company"
                          maxLength="255"
                          placeholder="Firma adı veya bağımsız taşıyıcı"
                        />
                      </label>
                      <label>
                        Araç ve plaka
                        <input
                          required
                          name="vehicle"
                          placeholder="Örn. Tır · 34 ABC 123"
                        />
                      </label>
                    </>
                  )}
                </>
              )}
              <label>
                E-posta adresi
                <input
                  required
                  name="email"
                  type="email"
                  maxLength="320"
                  autoComplete="email"
                  defaultValue={demoCredentials.email}
                />
              </label>
              <label>
                Şifre
                <div className="password-field">
                  <input
                    required
                    name="password"
                    type={showPassword ? "text" : "password"}
                    minLength={register ? PASSWORD_MIN_LENGTH : undefined}
                    maxLength={PASSWORD_MAX_LENGTH}
                    pattern={register ? PASSWORD_PATTERN : undefined}
                    title={register ? PASSWORD_REQUIREMENTS : undefined}
                    aria-describedby={
                      register ? "password-requirements" : undefined
                    }
                    autoComplete={
                      register ? "new-password" : "current-password"
                    }
                    defaultValue={demoCredentials.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? "Şifreyi gizle" : "Şifreyi göster"
                    }
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {register && (
                  <small
                    id="password-requirements"
                    className="password-requirements"
                  >
                    {PASSWORD_REQUIREMENTS}
                  </small>
                )}
              </label>
              {!register && (
                <RememberMeCheckbox
                  checked={rememberMe}
                  onChange={setRememberMe}
                />
              )}
            </>
          )}
          {error && (
            <div className="auth-error" role="alert">
              <AlertTriangle /> {error}
            </div>
          )}
          <button className="login-button" disabled={busy} aria-busy={busy}>
            {busy ? (
              <>
                <span className="button-spinner" /> İşlem yapılıyor…
              </>
            ) : (
              <>
                {mfaToken
                  ? "Güvenli girişi tamamla"
                  : register
                    ? "Hesabımı oluştur"
                    : "Giriş yap"}
                <ArrowRight size={18} />
              </>
            )}
          </button>
          {mfaToken && (
            <button
              type="button"
              className="mfa-back"
              onClick={() => setMfaToken("")}
            >
              E-posta ve şifre ekranına dön
            </button>
          )}
          {isDemoMode() && !mfaToken && (
            <div className="demo-divider"><span>ya da</span></div>
          )}
          {isDemoMode() && !mfaToken && (
            <button
              type="button"
              className="demo-continue-btn"
              onClick={() => { enterDemoSession(role); navigate(`/${role}/panel`); }}
              aria-label={`Demo olarak ${role} paneline gir`}
            >
              <span className="demo-badge-inline">DEMO</span>
              Demo olarak devam et
            </button>
          )}
          <div className="demo-note">
            {isBackendConfigured() ? (
              "Güvenli API bağlantısı etkin."
            ) : isDemoMode() ? (
              "Demo modu: gerçek hesap veya backend gerekmez."
            ) : (
              "Canlı backend bağlantısı bekleniyor."
            )}
          </div>
        </form>
      </main>
    </div>
  );
}

function RememberMeCheckbox({ checked, onChange }) {
  return (
    <label className="remember-me">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>Beni hatırla</span>
    </label>
  );
}

function PasswordChecklist({ password }) {
  const checks = [
    [password.length >= PASSWORD_MIN_LENGTH, "En az 12 karakter"],
    [/[A-Z]/.test(password), "Büyük harf"],
    [/[a-z]/.test(password), "Küçük harf"],
    [/\d/.test(password), "Rakam"],
    [/[^A-Za-z0-9]/.test(password), "Özel karakter"],
  ];
  return (
    <div className="password-checklist" aria-live="polite">
      {checks.map(([valid, label]) => (
        <span className={valid ? "valid" : ""} key={label}>
          <Check size={13} />
          {label}
        </span>
      ))}
    </div>
  );
}

function PortalShell({ role, children, active, onSelect, navCounts = {}, searchItems = [], notifications = null }) {
  const routerNavigate = useNavigate();
  const info = roleInfo[role];
  const Icon = info.icon;
  const [lang, setLang] = useState(
    () => localStorage.getItem("logiway-language") || "TR",
  );
  const [overlay, setOverlay] = useState(null);
  const [notificationUnread, setNotificationUnread] = useState(
    () => Array.isArray(notifications) ? notifications.filter((item) => !item.readAt).length : 0,
  );
  // Track IDs that the user has clicked (demo read state)
  const [readNotifIds, setReadNotifIds] = useState([]);
  const visibleNotificationUnread = Array.isArray(notifications)
    ? Math.max(0, notifications.filter((item) => !item.readAt).length - readNotifIds.filter((id) =>
        notifications.some((n) => n.id === id && !n.readAt)
      ).length)
    : notificationUnread;
  const session = getSession() || {};
  const companyName = session.companyName || "Firma çalışma alanı";
  const { prefs, addRecentSearch, clearRecentSearches } = usePreferences();

  // Ctrl+K / Cmd+K → open command palette
  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOverlay((v) => (v === "search" ? null : "search"));
      }
      if (e.key === "Escape" && overlay) {
        setOverlay(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlay]);

  const labels = {
    EN: {
      "Genel Bakış": "Overview",
      "Yük İlanlarım": "My loads",
      "Gelen Teklifler": "Offers",
      "Sevkiyatlarım": "My shipments",
      "Firma ve Ekip": "Company & team",
      Geçmiş: "History",
      Belgeler: "Documents",
      Ödemeler: "Payments",
      "Uygun işler": "Available jobs",
      Seferlerim: "My trips",
      Kazançlar: "Earnings",
      "Canlı rota": "Live route",
      Takograf: "Tachograph",
    },
    DE: {
      "Genel Bakış": "Übersicht",
      "Yük İlanlarım": "Meine Ladungen",
      "Gelen Teklifler": "Angebote",
      "Sevkiyatlarım": "Meine Sendungen",
      "Firma ve Ekip": "Unternehmen & Team",
      Geçmiş: "Verlauf",
      Belgeler: "Dokumente",
      Ödemeler: "Zahlungen",
      "Uygun işler": "Verfügbare Aufträge",
      Seferlerim: "Meine Fahrten",
      Kazançlar: "Einnahmen",
      "Canlı rota": "Live-Route",
      Takograf: "Tachograph",
    },
    IT: {
      "Genel Bakış": "Panoramica",
      "Yük İlanlarım": "I miei carichi",
      "Gelen Teklifler": "Offerte",
      "Sevkiyatlarım": "Le mie spedizioni",
      "Firma ve Ekip": "Azienda e team",
      Geçmiş: "Storico",
      Belgeler: "Documenti",
      Ödemeler: "Pagamenti",
      "Uygun işler": "Lavori disponibili",
      Seferlerim: "I miei viaggi",
      Kazançlar: "Guadagni",
      "Canlı rota": "Percorso live",
      Takograf: "Tachigrafo",
    },
  };
  const menu =
    role === "yuk-veren"
      ? [
          ["Genel Bakış", <ClipboardList size={18} />, null, "Operasyon"],
          ["Yük İlanlarım", <Package size={18} />, navCounts.loads, "Operasyon"],
          ["Gelen Teklifler", <Wallet size={18} />, navCounts.offers, "Operasyon"],
          ["Sevkiyatlarım", <Route size={18} />, navCounts.shipments, "Operasyon"],
          ["Mesajlar", <MessageCircle size={18} />, navCounts.messages, "Operasyon"],
          ["Geçmiş", <Clock3 size={18} />, null, "Finans ve Kayıtlar"],
          ["Belgeler", <FileText size={18} />, null, "Finans ve Kayıtlar"],
          ["Ödemeler", <CreditCard size={18} />, null, "Finans ve Kayıtlar"],
          ["Firma ve Ekip", <Users size={18} />, null, "Yönetim"],
        ]
      : role === "lojistik"
        ? [
            ["Firma özeti", <BarChart3 size={18} />],
            ["Yük pazarı", <Package size={18} />],
            ["Kaydedilen Yükler", <Wallet size={18} />],
            ["Tekliflerim", <Wallet size={18} />],
            ["Sevkiyatlar", <Route size={18} />],
            ["Mesajlar", <MessageCircle size={18} />],
            ["Araçlar", <Truck size={18} />],
            ["Şoförler", <Users size={18} />],
            ["Canlı Harita", <Map size={18} />],
            ["Kazançlar", <TrendingUp size={18} />],
            ["Faturalar", <CreditCard size={18} />],
            ["Belgeler", <FileText size={18} />],
            ["Ekip", <Users size={18} />],
          ]
        : [
            ["Atanmış iş", <Package size={18} />],
            ["Rota", <Map size={18} />],
            ["Mesajlar", <MessageCircle size={18} />],
            ["Belgeler", <FileText size={18} />],
          ];
  const menuSections = menu.reduce((sections, item) => {
    const sectionName = item[3] || "";
    const section = sections.find((candidate) => candidate.name === sectionName);
    if (section) section.items.push(item);
    else sections.push({ name: sectionName, items: [item] });
    return sections;
  }, []);
  function changeLanguage(e) {
    setLang(e.target.value);
    localStorage.setItem("logiway-language", e.target.value);
  }
  const quickLabel =
    role === "yuk-veren"
      ? "Yeni yük ilanı"
      : role === "lojistik"
        ? "Yük Bul"
        : "Durum güncelle";
  function navigate(target) {
    setOverlay(null);
    onSelect(target);
  }
  function logout() {
    clearSession();
    routerNavigate("/giris", { replace: true });
  }
  function handleSearch(q) {
    addRecentSearch(q);
  }

  return (
    <div
      className={`portal-shell ${prefs.density === "compact" ? "density-compact" : ""}`}
    >
      <aside>
        <Brand />
        <div className="workspace-badge">
          <span>
            <Icon />
          </span>
          <div>
            <small>ÇALIŞMA ALANI</small>
            <strong>{companyName}</strong>
          </div>
        </div>
        <button
          className="sidebar-cta"
          onClick={() =>
            navigate(
              role === "yuk-veren"
                ? "Yeni Yük"
                : role === "lojistik"
                  ? "Yük pazarı"
                  : "Atanmış iş",
            )
          }
        >
          <Plus />{" "}
          {role === "yuk-veren"
            ? "Yük Oluştur"
            : role === "lojistik"
              ? "Yük Bul"
              : "Görevi Aç"}
        </button>
        <nav aria-label={`${info.title} panel menüsü`}>
          {menuSections.map((section) => (
            <div className="portal-nav-group" key={section.name || "main"}>
              {section.name && <small className="portal-nav-label">{section.name}</small>}
              {section.items.map(([label, icon, badge]) => (
                <button
                  type="button"
                  onClick={() => navigate(label)}
                  className={active === label ? "active" : ""}
                  aria-current={active === label ? "page" : undefined}
                  key={label}
                >
                  {icon}
                  <span>{labels[lang]?.[label] || label}</span>
                  {Number(badge) > 0 && <b aria-label={`${badge} kayıt`}>{badge > 99 ? "99+" : badge}</b>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <button type="button" className="logout" onClick={logout}>
          <LogOut size={17} /> Çıkış yap
        </button>
      </aside>
      <main className="portal-main">
        <header>
          <button
            className="global-search-trigger"
            onClick={() => setOverlay(overlay === "search" ? null : "search")}
            aria-label="Ara veya komut gir"
            aria-expanded={overlay === "search"}
            aria-controls="command-palette"
          >
            <Search />
            <span>Yük, firma, plaka veya sevkiyat ara...</span>
            <kbd>⌘ K</kbd>
          </button>
          <div className="portal-header-actions">
            <button
              className="quick-action"
              onClick={() =>
                navigate(
                  role === "yuk-veren"
                    ? "Yeni Yük"
                    : role === "lojistik"
                      ? "Yük pazarı"
                      : "Atanmış iş",
                )
              }
            >
              <Plus /> <span>{quickLabel}</span>
            </button>
            <button
              className="header-icon"
              onClick={() => navigate("Mesajlar")}
              aria-label="Mesajlar"
            >
              <MessageCircle />
            </button>
            <button
              className="header-icon"
              onClick={() =>
                setOverlay(overlay === "notifications" ? null : "notifications")
              }
              aria-label="Bildirimler"
              aria-expanded={overlay === "notifications"}
            >
              <Bell />
              {visibleNotificationUnread > 0 && <b aria-label={`${visibleNotificationUnread} okunmamış bildirim`}>{visibleNotificationUnread > 9 ? "9+" : visibleNotificationUnread}</b>}
            </button>
            <label className="language-picker">
              <Languages size={15} />
              <select
                value={lang}
                onChange={changeLanguage}
                aria-label="Dil seçin"
              >
                <option>TR</option>
                <option>EN</option>
                <option>DE</option>
                <option>IT</option>
              </select>
            </label>
            <button
              className="user-avatar"
              onClick={() =>
                navigate(
                  role === "yuk-veren"
                    ? "Firma ve Ekip"
                    : role === "lojistik"
                      ? "Ekip"
                      : "Belgeler",
                )
              }
              aria-label="Profil bilgileri"
            >
              <UserRound />
            </button>
          </div>
          {overlay === "notifications" && (
            <NotificationCenter onNavigate={navigate} items={notifications} onUnreadChange={setNotificationUnread}
              onRead={(item) => setReadNotifIds((prev) => prev.includes(item.id) ? prev : [...prev, item.id])} />
          )}
        </header>

        {/* Command Palette — full-screen overlay, outside header */}
        {overlay === "search" && (
          <CommandPalette
            role={role}
            onNavigate={navigate}
            onClose={() => setOverlay(null)}
            recentSearches={prefs.recentSearches}
            onSearch={handleSearch}
            onClearSearches={clearRecentSearches}
            recentlyViewed={prefs.recentlyViewed}
            searchItems={searchItems}
          />
        )}

        {isDemoSession() && (
          <div className="demo-mode-banner" role="status" aria-live="polite">
            <span className="demo-badge-inline">DEMO</span>
            Bu oturum demo modunda çalışıyor. Veriler gerçek değildir.{" "}
            <button
              className="demo-banner-exit"
              onClick={() => { logout(); }}
              aria-label="Demo oturumunu sonlandır ve giriş sayfasına dön"
            >
              Çıkış Yap
            </button>
          </div>
        )}

        {children}
      </main>
    </div>
  );
}

function PageHeading({ kicker, title, text, action }) {
  return (
    <section className="portal-heading">
      <div>
        <span>{kicker}</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      {action}
    </section>
  );
}

/* ─── Shipper Overview ──────────────────────────────────────────────────────
 * Yük Veren Genel Bakış ekranı.
 * Tüm veriler ShipperPortal'dan props olarak gelir — gerçek API veya demo.
 * ─────────────────────────────────────────────────────────────────────────── */
function ShipperOverview({
  loads,
  marketOffers,
  matches,
  onNavigate,
  onNewLoad,
  onCancelLoad,
  liveMode,
  unreadMessages = 0,
  actionCounts = {},
}) {
  const activeLoads = loads.filter((load) => normalizeLoadStatus(load.status) === "PUBLISHED").length;
  const pendingOffers = marketOffers.filter((offer) => ["Bekliyor", "PENDING", "COUNTERED"].includes(offer.status)).length;
  const completedMatches = matches.filter(
    (x) => x.status === "Tamamlandı" || x.status === "COMPLETED",
  ).length;
  const activeShipments = Math.max(0, matches.length - completedMatches);

  const recentLoads = loads.slice(0, 5);

  const stats = [
    {
      label: "Aktif Yük İlanları",
      value: activeLoads,
      sub: activeLoads === 1 ? "ilan yayında" : "ilan yayında",
      dark: false,
    },
    {
      label: "Bekleyen Teklifler",
      value: pendingOffers,
      sub: "değerlendirme bekliyor",
      dark: false,
      urgent: pendingOffers > 0,
    },
    {
      label: "Devam Eden Sevkiyatlar",
      value: activeShipments,
      sub: "operasyon takibinde",
      dark: true,
    },
    {
      label: "Tamamlanan Taşımalar",
      value: completedMatches,
      sub: "başarıyla teslim edildi",
      dark: false,
    },
  ];

  return (
    <div className="shipper-overview">
      {/* Başlık */}
      <section className="portal-heading">
        <div>
          <span>OPERASYON MERKEZİ</span>
          <h1>Operasyon Merkezi</h1>
          <p>Yüklerinizi, tekliflerinizi ve sevkiyatlarınızı tek merkezden yönetin.</p>
        </div>
        <button className="portal-primary" onClick={onNewLoad} aria-label="Yeni yük ilanı oluştur">
          Yeni Yük İlanı <Package size={18} aria-hidden="true" />
        </button>
      </section>

      {/* İstatistik kartları */}
      <div className="so-stats" role="list" aria-label="Operasyon özeti">
        {stats.map((s) => (
          <article
            key={s.label}
            className={`so-stat ${s.dark ? "so-stat--dark" : ""} ${s.urgent ? "so-stat--urgent" : ""}`}
            role="listitem"
          >
            <span className="so-stat-label">{s.label}</span>
            <strong className="so-stat-value">{s.value}</strong>
            <small className="so-stat-sub">{s.sub}</small>
          </article>
        ))}
      </div>

      {/* Aksiyon merkezi — sadece gerçekten bekleyen işler */}
      <ActionCenter
        role="yuk-veren"
        counts={{
          offers: pendingOffers,
          counterOffers: marketOffers.filter((offer) => offer.status === "COUNTERED" || offer.status === "Karşı teklif").length,
          activeShipments,
          unread: unreadMessages,
          ...actionCounts,
        }}
        onNavigate={onNavigate}
      />

      {/* Hızlı işlemler */}
      <div className="so-quick-actions" aria-label="Hızlı işlemler">
        <span className="section-kicker">HIZLI İŞLEMLER</span>
        <div className="so-qa-grid">
          <button
            className="so-qa-btn so-qa-btn--primary"
            onClick={() => onNavigate("Gelen Teklifler")}
            aria-label="Gelen teklifleri incele"
          >
            <Wallet size={18} aria-hidden="true" />
            <div>
              <strong>Teklifleri İncele</strong>
              <small>
                {pendingOffers > 0
                  ? `${pendingOffers} teklif bekliyor`
                  : "Teklif bekleniyor"}
              </small>
            </div>
            <ArrowRight size={15} aria-hidden="true" />
          </button>
          <button className="so-qa-btn" onClick={() => onNavigate("Sevkiyatlarım")} aria-label="Sevkiyatları görüntüle">
            <Route size={18} aria-hidden="true" />
            <div><strong>Sevkiyatları İzle</strong><small>{activeShipments ? `${activeShipments} operasyon sürüyor` : "Aktif operasyon yok"}</small></div>
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Son Yük İlanları */}
      <div className="so-recent-loads">
        <div className="so-section-head">
          <span className="section-kicker">SON YÜK İLANLARI</span>
          {loads.length > 5 && (
            <button
              className="so-see-all"
              onClick={() => onNavigate("Yük İlanlarım")}
              aria-label="Tüm ilanları gör"
            >
              Tümünü gör <ChevronRight size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        {recentLoads.length === 0 ? (
          /* Boş durum */
          <div className="so-empty" role="status">
            <Package size={32} aria-hidden="true" />
            <h3>Henüz yük ilanı oluşturmadınız</h3>
            <p>
              {liveMode
                ? "İlk ilanınızı oluşturun; doğrulanmış taşıyıcılar tekliflerini göndersin."
                : "İlk ilanınızı oluşturun ve taşıyıcı tekliflerini karşılaştırın."}
            </p>
            <button
              className="portal-primary"
              onClick={onNewLoad}
              aria-label="İlk yük ilanını oluştur"
            >
              İlk İlanı Oluştur <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="so-load-list" role="list">
            {recentLoads.map((load) => (
              <article key={load.id} className="so-load-row" role="listitem">
                <div className="so-load-icon" aria-hidden="true">
                  <Package size={16} />
                </div>
                <div className="so-load-route">
                  <strong>
                    {load.from} <span aria-hidden="true">→</span> {load.to}
                  </strong>
                  <small>
                    {load.id} · {load.cargo} · {load.vehicle} · {load.weight}
                  </small>
                </div>
                <div className="so-load-meta">
                  <small>TARİH</small>
                  <span>{load.date || load.pickupDate || "—"}</span>
                </div>
                <div className="so-load-meta">
                  <small>TEKLİF</small>
                  <span>{load.offers ?? 0} teklif</span>
                </div>
                <span
                  className={`portal-status ${load.status === "Teklif alıyor" ? "green" : ""}`}
                >
                  {load.status}
                </span>
                {onCancelLoad &&
                  (load.status === "Teklif alıyor" ||
                    load.status === "DRAFT") && (
                    <button
                      className="row-action"
                      onClick={() => onCancelLoad(load)}
                      aria-label={`${load.id} ilanını iptal et`}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  )}
                <button className="so-load-detail" onClick={() => onNavigate("Yük İlanlarım")} aria-label={`${load.id} ilan detayına git`}>
                  Detay <ChevronRight size={13} />
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ShipperPortal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const active = SHIPPER_SLUG_SECTIONS[searchParams.get("section")] || "Genel Bakış";
  function setActive(section) {
    const slug = SHIPPER_SECTION_SLUGS[section];
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (!slug || section === "Genel Bakış") next.delete("section");
      else next.set("section", slug);
      return next;
    });
  }
  const [loads, setLoads] = useState(() =>
    liveMarketplaceEnabled() ? [] : getLoads(seedLoads),
  );
  const [marketOffers, setMarketOffers] = useState(() =>
    liveMarketplaceEnabled() ? [] : getOffers(seedOffers),
  );
  const [matches, setMatches] = useState(() =>
    liveMarketplaceEnabled() ? [] : getMatches(),
  );
  const [shipments, setShipments] = useState([]);
  const [modal, setModal] = useState(false);
  const [editingLoad, setEditingLoad] = useState(null); // load being edited/drafted
  const [success, setSuccess] = useState("");
  const [loadFilters, setLoadFilters] = useState({ status: "ALL", search: "", sort: "newest" });
  const [confirmCancel, setConfirmCancel] = useState(null); // load object pending cancel
  const [unreadMessages, setUnreadMessages] = useState(() => liveMarketplaceEnabled() ? 0 : totalUnread());
  const [loadRequest, setLoadRequest] = useState({
    loading: liveMarketplaceEnabled(),
    error: "",
  });
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedOfferLoad, setSelectedOfferLoad] = useState("");
  useEffect(
    () =>
      subscribeMarketplace(() => {
        setLoads(getLoads(seedLoads));
        setMarketOffers(getOffers(seedOffers));
        setMatches(getMatches());
      }),
    [],
  );
  // Track unread message count for nav badge
  useEffect(() => {
    if (liveMarketplaceEnabled()) return;
    return subscribeMessages(() => setUnreadMessages(totalUnread()));
  }, []);
  useEffect(() => {
    if (!liveMarketplaceEnabled()) return;
    let mounted = true;
    loadMyLoads()
      .then(async (remoteLoads) => {
        if (!mounted) return;
        const [incomingOffers, remoteMatches, remoteShipments] = await Promise.all([
          loadIncomingOffers().catch(async () => {
            const perLoad = await Promise.all(
              remoteLoads.map((load) => offersForLoad(load.id)),
            );
            return perLoad.flat();
          }),
          loadMyMatches().catch(() => []),
          loadMyShipments().catch(() => []),
        ]);
        const groups = remoteLoads.map((load) =>
          incomingOffers.filter((offer) => offer.loadId === load.id),
        );
        const loadsWithOfferCounts = remoteLoads.map((load, index) => ({
          ...load,
          offers: groups[index]?.length || 0,
        }));
        const normalizedOffers = groups
          .flat()
          .map((o) => ({
            id: o.id,
            load: o.loadId,
            driver: o.driverName || "Atanmamış şoför",
            company:
              o.offererType === "COMPANY"
                ? "Lojistik firması"
                : o.driverName || "Bağımsız şoför",
            verified: false,
            vehicle: `${o.vehicleType} · ${o.vehiclePlate}`,
            score: "—",
            trips: 0,
            amount: `${Number(o.amount).toLocaleString("tr-TR")} ${o.currency}`,
            amountValue: Number(o.amount),
            eta: o.availableAt
              ? new Date(o.availableAt).toLocaleString("tr-TR")
              : "Belirtilmedi",
            status: o.status === "PENDING" ? "Bekliyor" : o.status,
            currency: o.currency,
            version: o.version,
            validUntil: o.validUntil,
            availableAt: o.availableAt,
            createdAt: o.createdAt,
            estimatedTransitHours: o.estimatedTransitHours,
            message: o.message,
          }));
        if (mounted) {
          setLoads(loadsWithOfferCounts);
          setMarketOffers(normalizedOffers);
          setMatches(
            remoteMatches.map((match) => {
              const load = loadsWithOfferCounts.find((x) => x.id === match.loadId);
              const offer = normalizedOffers.find(
                (x) => x.id === match.offerId,
              );
              return {
                ...match,
                cargo: load?.cargo || match.loadId,
                route: load ? `${load.from} → ${load.to}` : "Sefer rotası",
                driver: offer?.driver || "Atanmış şoför",
                carrier: offer?.company || "Taşıyıcı",
                amount: offer?.amount || "—",
                matchedAt: match.matchedAt || match.createdAt,
              };
            }),
          );
          setShipments(remoteShipments);
          setLoadRequest({ loading: false, error: "" });
        }
      })
      .catch((reason) => {
        if (mounted) {
          setLoadRequest({
            loading: false,
            error: reason.message || "Yük ilanları alınamadı.",
          });
        }
      });
    return () => {
      mounted = false;
    };
  }, [reloadKey]);
  /** Build a load object from FormData (shared by addLoad + saveDraftLoad). */
  function buildLoadFromForm(f, status = "Teklif alıyor", existingId = null) {
    const symbol =
      f.get("currency") === "EUR" ? "€"
      : f.get("currency") === "GBP" ? "£"
      : "₺";
    return {
      id: existingId || makeRecordId("LW"),
      cargo: f.get("cargo"),
      from: `${f.get("fromCity")}, ${f.get("fromCountry")} · ${f.get("fromPostal")}`,
      to: `${f.get("toCity")}, ${f.get("toCountry")} · ${f.get("toPostal")}`,
      originCountry: f.get("fromCountry"),
      destinationCountry: f.get("toCountry"),
      fromCity: f.get("fromCity"),
      toCity: f.get("toCity"),
      pickupDate: f.get("pickupDate"),
      deliveryDate: f.get("deliveryDate"),
      company: "Kaya Lojistik",
      pickupAddress: f.get("pickupAddress"),
      deliveryAddress: f.get("deliveryAddress"),
      vehicle: f.get("vehicle"),
      weight: `${f.get("weight")} ${f.get("unit") || "ton"}`,
      price: f.get("price")
        ? `${Number(f.get("price")).toLocaleString("de-DE")} ${symbol}`
        : "Bütçe belirtilmedi",
      date: f.get("pickupDate")
        ? f.get("pickupDate").split("-").reverse().slice(0, 2).join(".")
        : "—",
      status,
      offers: 0,
      createdAt: new Date().toISOString(),
      demo: !liveMarketplaceEnabled() || undefined,
      packaging: f.get("packaging"),
      payment: f.get("payment"),
      notes: f.get("notes"),
      loadType: f.get("loadType"),
      details: {
        pickupContact: f.get("pickupContact"),
        pickupPhone: f.get("pickupPhone"),
        pickupWindow: `${f.get("pickupStart") || ""}–${f.get("pickupEnd") || ""}`,
        deliveryContact: f.get("deliveryContact"),
        deliveryPhone: f.get("deliveryPhone"),
        deliveryDate: f.get("deliveryDate"),
        deliveryWindow: `${f.get("deliveryStart") || ""}–${f.get("deliveryEnd") || ""}`,
        volume: f.get("volume"),
        pallets: f.get("pallets"),
        stackable: f.get("stackable"),
        temperature: f.get("temperatureControl"),
        adr: f.get("adr"),
        insurance: f.get("insurance"),
        tracking: f.get("tracking"),
      },
    };
  }

  async function addLoad(e) {
    e.preventDefault();
    if (liveMarketplaceEnabled()) {
      try {
        await createAndPublishLoad(new FormData(e.currentTarget));
        const remoteLoads = await loadMyLoads();
        setLoads(remoteLoads);
        setModal(false);
        setEditingLoad(null);
        setActive("Yük İlanlarım");
        setSuccess("İlan merkezi veritabanına kaydedildi ve eşleştirme havuzunda yayınlandı.");
        setTimeout(() => setSuccess(""), 3500);
        return;
      } catch (reason) {
        setSuccess(reason.message);
        return;
      }
    }
    const f = new FormData(e.currentTarget);
    const existingId = editingLoad?.id || null;
    const next = buildLoadFromForm(f, "Teklif alıyor", existingId);
    // If editing a draft, remove old draft entry
    if (existingId) {
      deleteDraft(existingId);
    }
    const nextLoads = existingId
      ? loads.map((x) => (x.id === existingId ? next : x))
      : [next, ...loads];
    setLoads(nextLoads);
    saveLoads(nextLoads);
    setModal(false);
    setEditingLoad(null);
    setActive("Yük İlanlarım");
    setSuccess("İlan yayınlandı; şoför eşleştirme havuzuna anında eklendi.");
    setTimeout(() => setSuccess(""), 3500);
  }

  /** Save current form as a DRAFT (no validation, called from LoadModal). */
  function saveDraftLoad(f, existingId = null) {
    const draft = buildLoadFromForm(f, "DRAFT", existingId || makeRecordId("LW"));
    // Persist in separate drafts key AND in main loads list
    saveDraft(draft);
    const inLoads = loads.some((x) => x.id === draft.id);
    const nextLoads = inLoads
      ? loads.map((x) => (x.id === draft.id ? draft : x))
      : [draft, ...loads];
    setLoads(nextLoads);
    saveLoads(nextLoads);
    setModal(false);
    setEditingLoad(null);
    setActive("Yük İlanlarım");
    setSuccess("Taslak kaydedildi. İstediğinizde düzenleyip yayınlayabilirsiniz.");
    setTimeout(() => setSuccess(""), 4000);
  }

  /** Publish an existing DRAFT load by id. */
  function publishDraft(load) {
    const missing = missingDraftFields(load);
    if (missing.length) {
      setSuccess(`Taslak yayınlanamadı. Eksik alanlar: ${missing.join(", ")}.`);
      setTimeout(() => setSuccess(""), 5000);
      openEditModal(load);
      return;
    }
    const next = loads.map((x) =>
      x.id === load.id ? { ...x, status: "Teklif alıyor" } : x,
    );
    deleteDraft(load.id);
    setLoads(next);
    saveLoads(next);
    setSuccess(`"${load.cargo}" ilanı yayınlandı; taşıyıcılara açıldı.`);
    setTimeout(() => setSuccess(""), 3500);
  }

  /** Open LoadModal pre-filled with an existing load for editing. */
  function openEditModal(load) {
    setEditingLoad(load);
    setModal(true);
  }
  function handleOfferChange(action, o) {
    const load = loads.find((x) => x.id === o.load);
    if (!load) return;
    if (liveMarketplaceEnabled()) {
      setLoadRequest({ loading: true, error: "" });
      setReloadKey((value) => value + 1);
      if (action === "accepted") setSuccess(`${o.company || o.driver} ile eşleşme tamamlandı.`);
      return;
    }
    const updatedOffers = marketOffers.map((x) => {
      if (x.id === o.id && action === "rejected") return { ...x, status: "Reddedildi" };
      if (x.load === o.load && action === "accepted") {
        return { ...x, status: x.id === o.id ? "Kabul edildi" : "Reddedildi" };
      }
      return x;
    });
    const updatedLoads = action === "accepted"
      ? loads.map((x) => x.id === o.load ? { ...x, status: "Şoför eşleşti" } : x)
      : loads;
    setMarketOffers(updatedOffers);
    setLoads(updatedLoads);
    saveOffers(updatedOffers);
    saveLoads(updatedLoads);
    if (action === "accepted") {
      const shipment = {
        id: makeRecordId("SHP"), loadId: load.id, offerId: o.id, acceptedOfferId: o.id,
        matchId: makeRecordId("MT"), status: "ASSIGNED", cargo: load.cargo,
        route: `${load.from} → ${load.to}`, carrier: o.company || "Taşıyıcı",
        driver: o.driver || "Atama bekleniyor", amount: o.amount, vehicle: o.vehicle,
        vehicleId: o.vehicleId || null, driverProfileId: o.driverProfileId || null,
        matchedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        demo: true,
      };
      const nextMatches = [shipment, ...matches.filter((match) => match.loadId !== load.id)];
      setMatches(nextMatches);
      saveMatches(nextMatches);
      setSuccess(`${o.company || o.driver} ile eşleşme tamamlandı; sevkiyat oluşturuldu.`);
    }
    setTimeout(() => setSuccess(""), 3500);
  }
  async function cancelLoad(load) {
    try {
      if (liveMarketplaceEnabled()) await cancelLiveLoad(load.id);
      const next = loads.map((item) =>
        item.id === load.id ? { ...item, status: "CANCELLED" } : item,
      );
      if (!liveMarketplaceEnabled()) saveLoads(next);
      setLoads(liveMarketplaceEnabled() ? await loadMyLoads() : next);
      setSuccess("İlan iptal edildi.");
      setTimeout(() => setSuccess(""), 3500);
    } catch (reason) {
      setSuccess(reason.message);
    }
  }
  async function copyLoad(load) {
    if (liveMarketplaceEnabled()) {
      try {
        await duplicateLiveLoadAsDraft(load.id);
        setLoadRequest({ loading: true, error: "" });
        setReloadKey((value) => value + 1);
        setSuccess(`${load.cargo} ilanının taslak kopyası oluşturuldu. Tarih ve bilgileri kontrol edip yayınlayın.`);
        setTimeout(() => setSuccess(""), 3500);
      } catch (reason) {
        setSuccess(reason.message);
      }
      return;
    }
    const copy = {
      ...load,
      id: makeRecordId("LW"),
      status: "DRAFT",          // ← demo'da da DRAFT olarak başlasın
      offers: 0,
      createdAt: new Date().toISOString(),
      date: new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" }).replace("/", "."),
      demo: true,
    };
    saveDraft(copy);
    const next = [copy, ...loads];
    setLoads(next);
    saveLoads(next);
    setSuccess(`"${load.cargo}" ilanı taslak olarak kopyalandı. Düzenleyip yayınlayabilirsiniz.`);
    setTimeout(() => setSuccess(""), 3500);
  }
  const offerLoads = loads.filter((load) =>
    marketOffers.some((offer) => offer.load === load.id),
  );
  const activeOfferLoadId = offerLoads.some((load) => load.id === selectedOfferLoad)
    ? selectedOfferLoad
    : offerLoads[0]?.id || "";
  const displayedOffers = marketOffers.filter((offer) => offer.load === activeOfferLoadId);
  const demoMode = !liveMarketplaceEnabled();
  const shipperPayments = demoMode ? getPayments() : [];
  const shipperDocuments = demoMode ? getDocs() : [];
  const shipperSearchItems = buildShipperSearchItems({ loads, offers: marketOffers, shipments, matches });
  const shipperNotifications = buildShipperNotifications({
    offers: marketOffers,
    loads,
    shipments,
    unread: unreadMessages,
    payments: shipperPayments,
    documents: shipperDocuments,
  });
  const overviewActionCounts = {
    dueSoonPayments: shipperPayments.filter((payment) => payment.status === "DUE_SOON").length,
    missingDocuments: shipperPayments.filter((payment) => payment.documentStatus === "MISSING").length,
    delayed: shipments.filter((shipment) => shipment.delayed || shipment.status === "DELAYED").length,
  };
  return (
    <PortalShell
      role="yuk-veren"
      active={active}
      navCounts={{
        loads: loads.filter((x) => !["CANCELLED", "COMPLETED", "DELIVERED"].includes(
          normalizeLoadStatus(x.status)
        )).length,
        offers: marketOffers.filter((offer) =>
          ["Bekliyor", "PENDING", "COUNTERED", "Karşı teklif"].includes(offer.status),
        ).length,
        shipments: matches.filter((m) =>
          m.status !== "Tamamlandı" && m.status !== "COMPLETED" && m.status !== "DELIVERED",
        ).length,
        messages: unreadMessages,
      }}
      onSelect={(next) =>
        next === "Yeni Yük" ? setModal(true) : setActive(next)
      }
      searchItems={shipperSearchItems}
      notifications={shipperNotifications}
    >
      {success && (
        <div className="success-banner portal-toast">
          <Check /> {success}
        </div>
      )}
      {active === "Genel Bakış" && (
        <ShipperOverview
          loads={loads}
          marketOffers={marketOffers}
          matches={matches}
          onNavigate={setActive}
          onNewLoad={() => setModal(true)}
          onCancelLoad={cancelLoad}
          liveMode={liveMarketplaceEnabled()}
          unreadMessages={unreadMessages}
          actionCounts={overviewActionCounts}
        />
      )}
      {active === "Yük İlanlarım" && (
        <>
          <PageHeading
            kicker="İLAN YÖNETİMİ"
            title="Yük İlanlarım"
            text="Oluşturduğunuz ilanları yönetin, filtreleyin ve takip edin."
            action={
              <button className="portal-primary" onClick={() => setModal(true)}>
                Yeni yük ilanı <Package size={18} />
              </button>
            }
          />
          <LoadListFull
            loads={loads}
            filters={loadFilters}
            onFilterChange={setLoadFilters}
            onCancel={(load) => setConfirmCancel(load)}
            onCopy={copyLoad}
            onEdit={openEditModal}
            onPublish={publishDraft}
            onViewOffers={(load) => { setSelectedOfferLoad(load.id); setActive("Gelen Teklifler"); }}
            isDemo={!liveMarketplaceEnabled()}
            loading={loadRequest.loading}
            error={loadRequest.error}
            onRetry={() => {
              setLoadRequest({ loading: true, error: "" });
              setReloadKey((value) => value + 1);
            }}
          />
          {confirmCancel && (
            <ConfirmCancelDialog
              load={confirmCancel}
              onConfirm={() => { cancelLoad(confirmCancel); setConfirmCancel(null); }}
              onClose={() => setConfirmCancel(null)}
            />
          )}
        </>
      )}
      {active === "Gelen Teklifler" && (
        <>
          <PageHeading
            kicker="TEKLİF MERKEZİ"
            title="Gelen Teklifler"
            text="Teklifleri karşılaştırın, mesajlaşın ve kabul edilen işi sevkiyata dönüştürün."
          />
          {offerLoads.length > 0 && (
            <div className="offer-load-picker" role="group" aria-label="Teklifleri görüntülenecek yük ilanı">
              <div>
                <small>YÜK İLANI</small>
                <strong>Karşılaştırmak istediğiniz ilanı seçin</strong>
              </div>
              <div className="offer-load-picker__items">
                {offerLoads.map((load) => {
                  const count = marketOffers.filter((offer) => offer.load === load.id).length;
                  return (
                    <button
                      type="button"
                      key={load.id}
                      className={activeOfferLoadId === load.id ? "active" : ""}
                      aria-pressed={activeOfferLoadId === load.id}
                      onClick={() => setSelectedOfferLoad(load.id)}
                    >
                      <span>{load.cargo}</span>
                      <small>{load.from} → {load.to}</small>
                      <b>{count} teklif</b>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <OfferComparison
            key={activeOfferLoadId || "no-offers"}
            offers={displayedOffers}
            targetBudget={(() => {
              const load = loads.find((l) => l.id === activeOfferLoadId);
              if (!load) return undefined;
              if (load.expectedPrice != null) return Number(load.expectedPrice);
              // parse from display string e.g. "4.850 €" → 4850
              const raw = String(load.price || "").replace(/[^0-9,]/g, "").replace(",", ".");
              const n = parseFloat(raw);
              return Number.isFinite(n) ? n : undefined;
            })()}
            onChange={handleOfferChange}
            onMessage={(offer) => {
              if (!liveMarketplaceEnabled()) {
                const load = loads.find((item) => item.id === (offer.load || activeOfferLoadId));
                ensureConversation({
                  loadId: load?.id || activeOfferLoadId,
                  loadRef: load?.reference || load?.id,
                  route: load ? `${load.from || load.fromCity || ""} → ${load.to || load.toCity || ""}` : "",
                  company: offer.company || offer.driver,
                  amount: offer.amount,
                  offerStatus: offer.status,
                  offerId: offer.id,
                });
              }
              setActive("Mesajlar");
            }}
          />
        </>
      )}
      {active === "Sevkiyatlarım" &&
        (liveMarketplaceEnabled() ? (
          <ShipperShipmentList
            shipments={shipments}
            loads={loads}
            offers={marketOffers}
            onMessage={() => setActive("Mesajlar")}
            onDocuments={() => setActive("Belgeler")}
          />
        ) : (
          <ShipperShipmentList
            shipments={matches.filter((match) => match.acceptedOfferId || match.offerId).map((match) => ({ ...match, acceptedOfferId: match.acceptedOfferId || match.offerId, updatedAt: match.updatedAt || match.matchedAt || match.createdAt }))}
            loads={loads}
            offers={marketOffers}
            onMessage={() => setActive("Mesajlar")}
            onDocuments={() => setActive("Belgeler")}
          />
        ))}{" "}
      {active === "Mesajlar" && (
        <MessagesCenter
          demo={!liveMarketplaceEnabled()}
          onOpenShipment={() => setActive("Sevkiyatlarım")}
          onOpenOffers={() => setActive("Gelen Teklifler")}
          loads={loads}
          offers={marketOffers}
        />
      )}{" "}
      {active === "Geçmiş" && (
        <MonthlyHistory role="yuk-veren" matches={matches} enableExport />
      )}{" "}
      {active === "Belgeler" && <DocumentCenter loads={loads} shipments={shipments} />}
      {active === "Ödemeler" &&
        <PaymentCenter
          loads={loads}
          shipments={shipments}
          matches={matches}
          onNavigate={setActive}
          live={liveMarketplaceEnabled()}
        />}
      {active === "Firma ve Ekip" && (
        <ShipperCompanyTeam live={liveMarketplaceEnabled()} />
      )}
      {modal && (
        <LoadModal
          onClose={() => { setModal(false); setEditingLoad(null); }}
          onSubmit={addLoad}
          onSaveDraft={saveDraftLoad}
          initialData={editingLoad}
        />
      )}
    </PortalShell>
  );
}

const SHIPMENT_STEPS = ["ASSIGNED", "HEADING_TO_PICKUP", "PICKUP_PENDING", "PICKED_UP", "IN_TRANSIT", "DELIVERED"];
const SHIPMENT_LABELS = {
  CREATED: "Oluşturuldu",
  ASSIGNED: "Araç ve şoför atandı",
  HEADING_TO_PICKUP: "Yüklemeye gidiyor",
  PICKUP_PENDING: "Yükleme bekleniyor",
  PICKED_UP: "Yük alındı",
  IN_TRANSIT: "Yolda",
  DELIVERED: "Teslim edildi",
  CANCELLED: "İptal edildi",
};

function ShipperShipmentList({ shipments, loads, offers, onMessage, onDocuments }) {
  const [expanded, setExpanded] = useState(null);
  const activeCount = shipments.filter((shipment) =>
    !["DELIVERED", "CANCELLED"].includes(shipment.status),
  ).length;

  async function handleShipmentExport(format) {
    const { headers, rows } = shipmentsExportData(shipments, loads, offers);
    const file = "logiway-sevkiyatlar";
    if (format === "csv")  return exportCSV(headers, rows, file);
    if (format === "xlsx") return exportXLSX("Sevkiyatlarım", headers, rows, file);
    if (format === "pdf")  return exportPDF("Sevkiyatlarım", headers, rows, file);
  }

  return (
    <>
      <PageHeading
        kicker="SEVKİYAT YÖNETİMİ"
        title="Sevkiyatlarım"
        text="Kabul edilen tekliflerden oluşan gerçek taşıma operasyonlarını takip edin."
      />
      {!shipments.length ? (
        <EmptyState
          icon={<Route />}
          title="Henüz aktif sevkiyat yok"
          text="Bir teklifi kabul ettiğinizde sevkiyat otomatik oluşacak ve burada takip edebileceksiniz."
        />
      ) : (
        <section className="shipper-shipments" aria-label="Sevkiyat listesi">
          <div className="shipper-shipments__summary">
            <span><strong>{activeCount}</strong> devam eden</span>
            <span><strong>{shipments.filter((item) => item.status === "DELIVERED").length}</strong> tamamlanan</span>
            <span><strong>{shipments.length}</strong> toplam sevkiyat</span>
            <div style={{ marginLeft: "auto" }}>
              <ExportButton onExport={handleShipmentExport} disabled={shipments.length === 0} />
            </div>
          </div>
          <div className="shipper-shipments__list">
            {shipments.map((shipment) => {
              const load = loads.find((item) => item.id === shipment.loadId);
              const offer = offers.find((item) => item.id === shipment.acceptedOfferId);
              const currentStep = SHIPMENT_STEPS.indexOf(shipment.status);
              const isOpen = expanded === shipment.id;
              return (
                <article className="shipper-shipment-card" key={shipment.id}>
                  <header>
                    <div><small>SEVKİYAT</small><strong>{shipment.id}</strong></div>
                    <span className={`shipment-state shipment-state--${shipment.status.toLowerCase()}`}>
                      {SHIPMENT_LABELS[shipment.status] || shipment.status}
                    </span>
                  </header>
                  <div className="shipper-shipment-card__route">
                    <span><i /><small>YÜKLEME</small><strong>{load?.from || "Rota bilgisi yükleniyor"}</strong></span>
                    <ArrowRight aria-hidden="true" />
                    <span><i /><small>TESLİMAT</small><strong>{load?.to || "Rota bilgisi yükleniyor"}</strong></span>
                  </div>
                  <div className="shipper-shipment-card__meta">
                    <span><small>Yük</small><strong>{load?.cargo || shipment.loadId}</strong></span>
                    <span><small>Taşıyıcı</small><strong>{offer?.company || offer?.driver || "Kabul edilen taşıyıcı"}</strong></span>
                    <span><small>Teklif</small><strong>{offer?.amount || "—"}</strong></span>
                    <span><small>Araç / şoför</small><strong>{offer?.vehicle || shipment.vehicle || "Atama bekleniyor"} · {offer?.driver || shipment.driver || "—"}</strong></span>
                    <span><small>Planlanan yükleme</small><strong>{load?.pickupDate || "—"}</strong></span>
                    <span><small>Planlanan teslim</small><strong>{load?.deliveryDate || "—"}</strong></span>
                    <span><small>Son güncelleme</small><strong>{new Date(shipment.updatedAt).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</strong></span>
                  </div>
                  {shipment.status !== "CANCELLED" && (
                    <div className="shipper-shipment-card__steps" aria-label="Sevkiyat ilerlemesi">
                      {SHIPMENT_STEPS.map((step, index) => (
                        <span className={index <= currentStep ? "done" : ""} key={step}>
                          <i>{index < currentStep ? <Check size={11} /> : index + 1}</i>
                          <small>{SHIPMENT_LABELS[step]}</small>
                        </span>
                      ))}
                    </div>
                  )}
                  <footer>
                    <button type="button" className="portal-secondary" onClick={() => setExpanded(isOpen ? null : shipment.id)} aria-expanded={isOpen}>
                      {isOpen ? "Detayı kapat" : "Detayı göster"}
                    </button>
                    <button type="button" className="portal-primary" onClick={onMessage}>
                      <MessageCircle size={15} /> Mesajlar
                    </button>
                    <button type="button" className="portal-secondary" onClick={onDocuments}>
                      <FileText size={15} /> Belgeler
                    </button>
                  </footer>
                  {isOpen && (
                    <div className="shipper-shipment-card__detail">
                      <span><small>Yük ID</small><code>{shipment.loadId}</code></span>
                      <span><small>Eşleşme ID</small><code>{shipment.matchId}</code></span>
                      <span><small>Araç ID</small><code>{shipment.vehicleId}</code></span>
                      <span><small>Şoför profili ID</small><code>{shipment.driverProfileId}</code></span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}

// ─── ConfirmCancelDialog ──────────────────────────────────────────────────────
function ConfirmCancelDialog({ load, onConfirm, onClose }) {
  return (
    <div className="portal-modal" role="dialog" aria-modal="true" aria-labelledby="cancel-dialog-title">
      <div className="confirm-dialog">
        <h3 id="cancel-dialog-title">İlanı iptal et</h3>
        <p>
          <strong>{load.cargo}</strong> ilanını iptal etmek istediğinizden emin misiniz?
          Bu işlem geri alınamaz.
        </p>
        <div className="confirm-dialog-actions">
          <button className="confirm-btn confirm-btn--danger" onClick={onConfirm}>
            Evet, iptal et
          </button>
          <button className="confirm-btn" onClick={onClose}>
            Vazgeç
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── LoadListFull ─────────────────────────────────────────────────────────────

/** Map raw status values (backend enum or demo strings) to Turkish display labels. */
function statusLabel(status) {
  const MAP = {
    DRAFT:            "Taslak",
    PUBLISHED:        "Teklif alıyor",
    "Teklif alıyor":  "Teklif alıyor",
    "Şoför eşleşti":  "Taşıyıcı seçildi",
    MATCHED:          "Taşıyıcı seçildi",
    CANCELLED:        "İptal edildi",
    IN_TRANSIT:       "Yolda",
    DELIVERED:        "Teslim edildi",
    COMPLETED:        "Tamamlandı",
    Planlandı:        "Planlandı",
  };
  return MAP[status] || status;
}

function LoadListFull({ loads, filters, onFilterChange, onCancel, onCopy, onEdit, onPublish, onViewOffers, isDemo, loading, error, onRetry }) {
  const [expanded, setExpanded] = useState(null);

  const visible = filterAndSortLoads(loads, filters);

  function statusClass(status) {
    if (status === "Teklif alıyor" || status === "PUBLISHED") return "portal-status green";
    if (status === "Şoför eşleşti" || status === "MATCHED")   return "portal-status blue";
    if (status === "CANCELLED")                                return "portal-status cancelled";
    if (status === "DRAFT")                                    return "portal-status draft";
    if (status === "DELIVERED" || status === "COMPLETED")     return "portal-status green";
    return "portal-status";
  }

  // ── Export handler ──────────────────────────────────────────────
  async function handleLoadExport(format) {
    const { headers, rows } = loadsExportData(visible);
    const file = "logiway-yuk-ilanlari";
    if (format === "csv")  return exportCSV(headers, rows, file);
    if (format === "xlsx") return exportXLSX("Yük İlanlarım", headers, rows, file);
    if (format === "pdf")  return exportPDF("Yük İlanlarım", headers, rows, file);
  }

  return (
    <section className="portal-list load-list-full">
      {/* Filter bar */}
      <div className="llf-filters">
        <label className="llf-search" aria-label="İlan ara">
          <Search size={14} aria-hidden="true" />
          <input
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            placeholder="Yük adı, güzergah veya ID ara"
            aria-label="Yük ara"
          />
          {filters.search && (
            <button onClick={() => onFilterChange({ ...filters, search: "" })} aria-label="Aramayı temizle">
              <X size={13} />
            </button>
          )}
        </label>
        <div className="llf-status-tabs" role="group" aria-label="Durum filtresi">
          {LOAD_STATUS_FILTERS.map(([value, label]) => (
            <button
              key={value}
              className={filters.status === value ? "llf-tab active" : "llf-tab"}
              onClick={() => onFilterChange({ ...filters, status: value })}
              aria-pressed={filters.status === value}
            >
              {label}
              {value !== "ALL" && (
                <span className="llf-tab-count">
                  {loads.filter((load) => normalizeLoadStatus(load.status) === value).length}
                </span>
              )}
              {value === "ALL" && <span className="llf-tab-count">{loads.length}</span>}
            </button>
          ))}
        </div>
        <label className="llf-sort">
          <span>Sırala</span>
          <select value={filters.sort} onChange={(event) => onFilterChange({ ...filters, sort: event.target.value })}>
            <option value="newest">En yeni</option>
            <option value="oldest">En eski</option>
            <option value="pickup">Yükleme tarihi</option>
            <option value="offers">En çok teklif</option>
          </select>
        </label>
      </div>

      {/* Export row */}
      {!loading && !error && (
        <div className="section-export-row">
          <small>{visible.length} ilan{filters.search || filters.status !== "ALL" ? " (filtrelenmiş)" : ""}</small>
          <ExportButton
            onExport={handleLoadExport}
            disabled={visible.length === 0}
          />
        </div>
      )}

      {loading && (
        <div className="llf-request-state" role="status" aria-live="polite">
          <div className="skel skel-text skel-text--lg" />
          <div className="skel skel-text" />
          <div className="skel skel-text skel-text--sm" />
          <span>Yük ilanlarınız getiriliyor…</span>
        </div>
      )}

      {!loading && error && (
        <div className="llf-request-state llf-request-state--error" role="alert">
          <AlertTriangle size={26} aria-hidden="true" />
          <h3>Yük ilanları yüklenemedi</h3>
          <p>{error}</p>
          <button type="button" onClick={onRetry}>Tekrar dene</button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && visible.length === 0 && (
        <div className="llf-empty" role="status">
          <Package size={28} aria-hidden="true" />
          <h3>
            {loads.length === 0
              ? "Henüz yük ilanı oluşturmadınız"
              : "Filtreyle eşleşen ilan bulunamadı"}
          </h3>
          <p>
            {loads.length === 0
              ? "İlk ilanınızı oluşturun; doğrulanmış taşıyıcılar tekliflerini göndersin."
              : "Farklı bir arama veya durum filtresi deneyin."}
          </p>
        </div>
      )}

      {/* Load rows */}
      {!loading && !error && visible.map((x) => (
        <div className="load-entry" key={x.id}>
          <article className="load-row llf-row">
            <span className="load-box"><Package /></span>

            <div className="load-route">
              <strong>
                {x.from} <ArrowRight size={13} aria-hidden="true" /> {x.to}
              </strong>
              <small>
                {x.id}
                {x.cargo ? ` · ${x.cargo}` : ""}
                {x.vehicle ? ` · ${x.vehicle}` : ""}
                {x.weight ? ` · ${x.weight}` : ""}
                {x.loadType ? ` · ${x.loadType}` : ""}
              </small>
              {x.pickupDate && (
                <em className="llf-date">
                  <Clock3 size={11} aria-hidden="true" /> {x.date || x.pickupDate}
                </em>
              )}
            </div>

            <div className="llf-meta">
              <small>BÜTÇE</small>
              <strong>{x.price || "Belirtilmedi"}</strong>
            </div>

            <div className="llf-meta">
              <small>TEKLİF</small>
              <strong>{x.offers ?? 0}</strong>
            </div>

            <div className="llf-badges">
              <span className={statusClass(x.status)}>{statusLabel(x.status)}</span>
              {isDemo && x.demo !== false && (
                <span className="demo-badge-inline" title="Demo ilanı">DEMO</span>
              )}
              {x.status === "DRAFT" && (
                <span className="draft-badge" title="Taslak ilan">TASLAK</span>
              )}
            </div>

            {/* Action buttons */}
            <div className="llf-actions">
              <button
                className="llf-action-btn"
                title="Detaylar"
                aria-label={`${x.cargo || x.id} detaylarını ${expanded === x.id ? "kapat" : "aç"}`}
                onClick={() => setExpanded(expanded === x.id ? null : x.id)}
              >
                <ChevronRight size={15} className={expanded === x.id ? "llf-chevron open" : "llf-chevron"} />
              </button>
              {Number(x.offers || 0) > 0 && onViewOffers && (
                <button className="llf-action-btn llf-action-btn--offers" title="Teklifleri gör" aria-label={`${x.cargo || x.id} tekliflerini gör`} onClick={() => onViewOffers(x)}>
                  <Wallet size={14} />
                </button>
              )}
              {x.status === "DRAFT" && onEdit && (
                <button
                  className="llf-action-btn llf-action-btn--edit"
                  title="Düzenle"
                  aria-label={`${x.cargo || x.id} taslağını düzenle`}
                  onClick={() => onEdit(x)}
                >
                  <Pencil size={14} />
                </button>
              )}
              {x.status === "DRAFT" && onPublish && (
                <button
                  className="llf-action-btn llf-action-btn--publish"
                  title="Yayınla"
                  aria-label={`${x.cargo || x.id} ilanını yayınla`}
                  onClick={() => onPublish(x)}
                >
                  <Send size={14} />
                </button>
              )}
              <button
                className="llf-action-btn"
                title="Kopyala"
                aria-label={`${x.cargo || x.id} ilanını kopyala`}
                onClick={() => onCopy(x)}
              >
                <Copy size={14} />
              </button>
              {(x.status === "Teklif alıyor" || x.status === "DRAFT" || x.status === "PUBLISHED") && (
                <button
                  className="llf-action-btn llf-action-btn--danger"
                  title="İptal et"
                  aria-label={`${x.cargo || x.id} ilanını iptal et`}
                  onClick={() => onCancel(x)}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </article>

          {expanded === x.id && <LoadDetails load={x} />}
        </div>
      ))}
    </section>
  );
}

function LoadList({ loads, onAll, onCancel }) {
  const [expanded, setExpanded] = useState(null);
  return (
    <section className="portal-list">
      <div className="list-head">
        <div>
          <h2>Yük ilanları</h2>
          <p>Yayınladığınız ilanların güncel durumu ve adres detayları</p>
        </div>
        {onAll && (
          <button onClick={onAll}>
            Tümünü gör <ArrowRight size={15} />
          </button>
        )}
      </div>
      {loads.map((x) => (
        <div className="load-entry" key={x.id}>
          <article className="load-row">
            <span className="load-box">
              <Package />
            </span>
            <div className="load-route">
              <strong>
                {x.from} <ArrowRight /> {x.to}
              </strong>
              <small>
                {x.id} · {x.cargo} · {x.vehicle} · {x.weight}
              </small>
              {x.pickupAddress && (
                <em>
                  <MapPin /> {x.pickupAddress} → {x.deliveryAddress}
                </em>
              )}
            </div>
            <div>
              <small>HEDEF BÜTÇE</small>
              <strong>{x.price}</strong>
            </div>
            <div>
              <small>TEKLİFLER</small>
              <strong>{x.offers} teklif</strong>
            </div>
            <span
              className={`portal-status ${x.status === "Teklif alıyor" ? "green" : ""}`}
            >
              {x.status}
            </span>
            {onCancel &&
              (x.status === "Teklif alıyor" || x.status === "DRAFT") && (
                <button
                  className="row-action"
                  onClick={() => onCancel(x)}
                  aria-label="İlanı iptal et"
                >
                  <X />
                </button>
              )}
            <button
              className={expanded === x.id ? "row-action open" : "row-action"}
              onClick={() => setExpanded(expanded === x.id ? null : x.id)}
              aria-label="İlan detaylarını aç"
            >
              <ChevronRight />
            </button>
          </article>
          {expanded === x.id && <LoadDetails load={x} />}
        </div>
      ))}
    </section>
  );
}

function LoadDetails({ load }) {
  const d = load.details || {};
  const pickupQuery = encodeURIComponent(
    `${load.pickupAddress || ""}, ${load.from}`,
  );
  const deliveryQuery = encodeURIComponent(
    `${load.deliveryAddress || ""}, ${load.to}`,
  );
  const facts = [
    ["Yükleme penceresi", d.pickupWindow],
    ["Yükleme yetkilisi", d.pickupContact],
    ["Yükleme telefonu", d.pickupPhone],
    ["Yükleme referansı", d.pickupReference],
    ["Teslim penceresi", d.deliveryWindow],
    ["Teslim yetkilisi", d.deliveryContact],
    ["Teslim telefonu", d.deliveryPhone],
    ["Ölçüler", d.dimensions],
    ["Hacim", d.volume && `${d.volume} m³`],
    ["Palet", d.pallets],
    ["İstiflenebilir", d.stackable],
    ["Sıcaklık", d.temperature],
    ["ADR", d.adr],
    ["Yük değeri", d.cargoValue],
    ["Sigorta", d.insurance],
    ["EORI / gümrük", d.eori],
    ["Takip tercihi", d.tracking],
    ["Ödeme", load.payment],
  ];
  return (
    <div className="load-details">
      <div className="address-cards">
        <article>
          <span>A</span>
          <div>
            <small>TAM YÜKLEME KONUMU</small>
            <strong>{load.pickupAddress || load.from}</strong>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${pickupQuery}`}
              target="_blank"
              rel="noreferrer"
            >
              <MapPin /> Adresi haritada aç
            </a>
          </div>
        </article>
        <article>
          <span>B</span>
          <div>
            <small>TAM TESLİMAT KONUMU</small>
            <strong>{load.deliveryAddress || load.to}</strong>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${deliveryQuery}`}
              target="_blank"
              rel="noreferrer"
            >
              <MapPin /> Adresi haritada aç
            </a>
          </div>
        </article>
      </div>
      <div className="load-facts">
        {facts
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label}>
              <small>{label}</small>
              <strong>{value}</strong>
            </div>
          ))}
      </div>
      {load.notes && (
        <p className="load-notes">
          <FileText />{" "}
          <span>
            <strong>Operasyon notu</strong>
            {load.notes}
          </span>
        </p>
      )}
    </div>
  );
}

function LoadModal({ onClose, onSubmit, onSaveDraft, initialData }) {
  // If editing an existing load/draft, pre-fill formData from initialData
  const [step, setStep] = useState(0);
  const [loadType, setLoadType] = useState(initialData?.loadType || "Genel kargo");
  const [formData, setFormData] = useState(() => {
    if (!initialData) return {};
    // Flatten initialData + details into formData shape
    const d = initialData.details || {};
    return {
      fromCity:      initialData.fromCity       || "",
      fromCountry:   initialData.originCountry  || "Türkiye",
      fromPostal:    initialData.fromPostal      || "",
      pickupAddress: initialData.pickupAddress   || "",
      pickupDate:    initialData.pickupDate      || "",
      pickupStart:   d.pickupWindow?.split("–")[0] || "",
      pickupEnd:     d.pickupWindow?.split("–")[1] || "",
      pickupContact: d.pickupContact             || "",
      pickupPhone:   d.pickupPhone               || "",
      toCity:        initialData.toCity          || "",
      toCountry:     initialData.destinationCountry || "Almanya",
      toPostal:      initialData.toPostal        || "",
      deliveryAddress: initialData.deliveryAddress || "",
      deliveryDate:  d.deliveryDate              || initialData.deliveryDate || "",
      deliveryStart: d.deliveryWindow?.split("–")[0] || "",
      deliveryEnd:   d.deliveryWindow?.split("–")[1] || "",
      deliveryContact: d.deliveryContact         || "",
      deliveryPhone: d.deliveryPhone             || "",
      cargo:         initialData.cargo           || "",
      loadType:      initialData.loadType        || "Genel kargo",
      weight:        initialData.weight?.split(" ")[0] || "",
      notes:         initialData.notes           || "",
      vehicle:       initialData.vehicle         || "",
      adr:           d.adr                       || "",
      temperatureControl: d.temperature          || "",
      insurance:     d.insurance                 || "",
      tracking:      d.tracking                  || "",
      price:         initialData._rawPrice       || "",
      currency:      initialData.currency        || "TRY",
      payment:       initialData.payment         || "Teslimatta ödeme",
    };
  });
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef(null);
  const steps = [
    "Rota",
    "Yük bilgileri",
    "Araç gereksinimi",
    "Ticari bilgiler",
    "Kontrol ve yayınla",
  ];

  /** Capture current step's form values into formData state */
  function captureStep(form) {
    const active = form.querySelector(".wizard-step.active");
    if (!active) return;
    const entries = {};
    active.querySelectorAll("[name]").forEach((el) => {
      if (el.type === "checkbox") {
        if (el.checked) entries[el.name] = el.value;
      } else if (el.type === "radio") {
        if (el.checked) entries[el.name] = el.value;
      } else {
        entries[el.name] = el.value;
      }
    });
    setFormData((prev) => ({ ...prev, ...entries }));
  }

  function next(event) {
    event.preventDefault();
    const form = event.currentTarget.closest("form");
    const current = form.querySelector(".wizard-step.active");
    const invalid = current.querySelector(":invalid");
    if (invalid) { invalid.reportValidity(); return; }
    captureStep(form);
    setStep((value) => Math.min(steps.length - 1, value + 1));
  }

  function goToStep(index) {
    setStep(index);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try { await onSubmit(e); } finally { setSubmitting(false); }
  }

  function handleSaveDraft(e) {
    e.preventDefault();
    if (!formRef.current) return;
    const f = new FormData(formRef.current);
    onSaveDraft(f, initialData?.id || null);
  }
  return (
    <div className="portal-modal" role="dialog" aria-modal="true">
      <form onSubmit={handleSubmit} ref={formRef}>
        <div className="modal-head">
          <div>
            <span>{initialData?.status === "DRAFT" ? "TASLAK DÜZENLE" : "YENİ YÜK İLANI"}</span>
            <h2>{steps[step]}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Kapat">
            <X />
          </button>
        </div>
        <div className="load-stepper">
          {steps.map((label, index) => (
            <button
              type="button"
              className={index === step ? "active" : index < step ? "done" : ""}
              onClick={() => index < step && setStep(index)}
              key={label}
            >
              <i>{index < step ? <Check /> : index + 1}</i>
              <span>{label}</span>
            </button>
          ))}
        </div>
        <div className={step === 0 ? "wizard-step active" : "wizard-step"}>
          <div className="form-section-title">
            Yükleme <span>Adres bilgileri</span>
          </div>
          <div className="form-grid form-grid-3">
            <label>
              Ülke
              <select name="fromCountry" defaultValue={formData.fromCountry || "Türkiye"}>
                {EUROPEAN_COUNTRIES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Şehir
              <input required name="fromCity" placeholder="Tekirdağ" defaultValue={formData.fromCity || ""} />
            </label>
            <label>
              Posta kodu
              <input required name="fromPostal" placeholder="59000" defaultValue={formData.fromPostal || ""} />
            </label>
            <label className="wide">
              Açık adres
              <input
                required
                name="pickupAddress"
                placeholder="Cadde, bina/depo adı ve kapı numarası"
                defaultValue={formData.pickupAddress || ""}
              />
            </label>
            <label>
              Yükleme tarihi
              <input required name="pickupDate" type="date" defaultValue={formData.pickupDate || ""} />
            </label>
            <label>
              Saat başlangıcı
              <input required name="pickupStart" type="time" defaultValue={formData.pickupStart || ""} />
            </label>
            <label>
              Saat bitişi
              <input required name="pickupEnd" type="time" defaultValue={formData.pickupEnd || ""} />
            </label>
            <label>
              Yetkili kişi
              <input required name="pickupContact" defaultValue={formData.pickupContact || ""} />
            </label>
            <label>
              Telefon
              <input required name="pickupPhone" type="tel" defaultValue={formData.pickupPhone || ""} />
            </label>
          </div>
          <div className="form-section-title">
            Teslimat <span>Adres bilgileri</span>
          </div>
          <div className="form-grid form-grid-3">
            <label>
              Ülke
              <select name="toCountry" defaultValue={formData.toCountry || "Almanya"}>
                {EUROPEAN_COUNTRIES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Şehir
              <input required name="toCity" placeholder="Berlin" defaultValue={formData.toCity || ""} />
            </label>
            <label>
              Posta kodu
              <input required name="toPostal" placeholder="10115" defaultValue={formData.toPostal || ""} />
            </label>
            <label className="wide">
              Açık adres
              <input
                required
                name="deliveryAddress"
                placeholder="Cadde, tesis/depo adı ve kapı numarası"
                defaultValue={formData.deliveryAddress || ""}
              />
            </label>
            <label>
              Teslim tarihi
              <input required name="deliveryDate" type="date" defaultValue={formData.deliveryDate || ""} />
            </label>
            <label>
              Saat başlangıcı
              <input required name="deliveryStart" type="time" defaultValue={formData.deliveryStart || ""} />
            </label>
            <label>
              Saat bitişi
              <input required name="deliveryEnd" type="time" defaultValue={formData.deliveryEnd || ""} />
            </label>
            <label>
              Yetkili kişi
              <input required name="deliveryContact" defaultValue={formData.deliveryContact || ""} />
            </label>
            <label>
              Telefon
              <input required name="deliveryPhone" type="tel" defaultValue={formData.deliveryPhone || ""} />
            </label>
          </div>
        </div>
        <div className={step === 1 ? "wizard-step active" : "wizard-step"}>
          <div className="form-grid">
            <label className="wide">
              Yük adı
              <input
                required
                name="cargo"
                placeholder="Örn. Coca-Cola içecek sevkiyatı, çelik bobin, tekstil ürünleri"
                defaultValue={formData.cargo || ""}
              />
            </label>
            <label>
              Yük tipi
              <select name="loadType" required defaultValue={formData.loadType || "Genel kargo"} onChange={(e) => setLoadType(e.target.value)}>
                <option value="Genel kargo">Genel kargo</option>
                <option value="Soğuk zincir">Soğuk zincir</option>
                <option value="Tehlikeli madde">Tehlikeli madde</option>
                <option value="Proje yükü">Proje yükü</option>
              </select>
            </label>
            <label>
              Ağırlık (ton)
              <input
                required
                name="weight"
                type="number"
                min="0.1"
                step="0.1"
                placeholder="Örn. 20"
                defaultValue={formData.weight || ""}
              />
              <input type="hidden" name="unit" value="ton" />
            </label>
            <label className="wide">
              Açıklama / Not
              <textarea
                name="notes"
                rows="3"
                placeholder="Örn. Paletli içecek ürünleri taşınacaktır."
                defaultValue={formData.notes || ""}
              />
            </label>
          </div>
        </div>
        <div className={step === 2 ? "wizard-step active" : "wizard-step"}>
          {/* Akıllı öneri — yük tipine göre, seçimi değiştirmez */}
          {loadType === "Soğuk zincir" && (
            <div className="vehicle-suggestion vehicle-suggestion--info">
              <ShieldCheck size={15} aria-hidden="true" />
              <span><strong>Öneri:</strong> Soğuk zincir yükler için genellikle <strong>Frigo</strong> araç kullanılır.</span>
            </div>
          )}
          {loadType === "Tehlikeli madde" && (
            <div className="vehicle-suggestion vehicle-suggestion--warn">
              <AlertTriangle size={15} aria-hidden="true" />
              <span><strong>Hatırlatma:</strong> Tehlikeli madde taşımacılığında ADR gerekliliklerini etkinleştirmeyi unutmayın.</span>
            </div>
          )}
          {loadType === "Proje yükü" && (
            <div className="vehicle-suggestion vehicle-suggestion--info">
              <ShieldCheck size={15} aria-hidden="true" />
              <span><strong>Öneri:</strong> Proje yükleri için <strong>Lowbed</strong> veya özel araç değerlendirilebilir.</span>
            </div>
          )}
          {loadType === "Genel kargo" && (
            <div className="vehicle-suggestion vehicle-suggestion--info">
              <ShieldCheck size={15} aria-hidden="true" />
              <span><strong>Öneri:</strong> Standart genel kargo için genellikle <strong>Tenteli</strong> araç tercih edilir.</span>
            </div>
          )}

          <div className="vehicle-options">
            {[
              { value: "Tenteli",  label: "Tenteli",  desc: "Standart paletli ve genel yükler için." },
              { value: "Frigo",    label: "Frigo",    desc: "Soğutmalı veya sıcaklık kontrollü taşımalar için." },
              { value: "Mega",     label: "Mega",     desc: "Yüksek hacimli yükler için." },
              { value: "Lowbed",   label: "Lowbed",   desc: "İş makineleri ve ağır ekipmanlar için." },
              { value: "Kamyon",   label: "Kamyon",   desc: "Orta ölçekli taşımalar için." },
              { value: "Panelvan", label: "Panelvan", desc: "Küçük yükler ve hızlı teslimatlar için." },
              { value: "Diğer",   label: "Diğer",   desc: "Özel araç ihtiyacı olan taşımalar için." },
            ].map(({ value, label, desc }) => (
              <label key={value} className="vehicle-card">
                <input required type="radio" name="vehicle" value={value} defaultChecked={formData.vehicle === value} />
                <Truck size={24} aria-hidden="true" />
                <span className="vehicle-card-name">{label}</span>
                <span className="vehicle-card-desc">{desc}</span>
              </label>
            ))}
          </div>

          <div className="special-requirements">
            <label className="req-item">
              <input type="checkbox" name="adr" value="Evet" defaultChecked={formData.adr === "Evet"} />
              <span className="req-label">
                ADR
                <small>Tehlikeli madde taşımacılığı için gerekli uygunluk ve yetkinlikler.</small>
              </span>
            </label>
            <label className="req-item">
              <input type="checkbox" name="temperatureControl" value="Evet" defaultChecked={formData.temperatureControl === "Evet"} />
              <span className="req-label">
                Sıcaklık kontrolü
                <small>Yükün belirlenen sıcaklık koşullarında taşınması.</small>
              </span>
            </label>
            <label className="req-item">
              <input type="checkbox" name="insurance" value="Evet" defaultChecked={formData.insurance === "Evet"} />
              <span className="req-label">
                Ek sigorta
                <small>Taşıma için ilave sigorta teminatı talebi.</small>
              </span>
            </label>
            <label className="req-item">
              <input type="checkbox" name="tracking" value="Zorunlu" defaultChecked={formData.tracking === "Zorunlu"} />
              <span className="req-label">
                Takip zorunluluğu
                <small>Sevkiyat konumunun takip edilmesi talebi.</small>
              </span>
            </label>
          </div>
        </div>
        <div className={step === 3 ? "wizard-step active" : "wizard-step"}>
          <div className="form-grid commercial-grid">
            {/* Bütçe + para birimi yan yana */}
            <label>
              Hedef taşıma bütçesi
              <span className="field-hint">İsteğe bağlı — boş bırakırsanız tüm teklifler gelir.</span>
              <input
                name="price"
                type="number"
                min="1"
                step="any"
                placeholder="Örn. 15000"
                defaultValue={formData.price || ""}
              />
            </label>
            <label>
              Para birimi
              <select name="currency" defaultValue={formData.currency || "TRY"}>
                <option value="TRY">Türk Lirası (TRY)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">Sterlin (GBP)</option>
              </select>
            </label>
            <label className="wide">
              Ödeme koşulu
              <span className="field-hint">Vade, teslimattan itibaren hesaplanır.</span>
              <select name="payment" defaultValue={formData.payment || "Teslimatta ödeme"}>
                <option>Teslimatta ödeme</option>
                <option>7 gün vadeli</option>
                <option>15 gün vadeli</option>
                <option>30 gün vadeli</option>
              </select>
            </label>
          </div>
          <p className="commercial-info">
            Hedef bütçeniz referans tutardır. Taşıyıcı firmalar farklı fiyatlarla teklif sunabilir.
          </p>
        </div>
        <div className={step === 4 ? "wizard-step active" : "wizard-step"}>
          <div className="review-summary">
            {/* Rota */}
            <div className="rs-section">
              <div className="rs-section-head">
                <span className="rs-section-title">Rota</span>
                <button type="button" className="rs-edit" onClick={() => goToStep(0)} aria-label="Rota adımına dön">
                  Düzenle
                </button>
              </div>
              <div className="rs-facts">
                {formData.fromCity && (
                  <div><small>KALKIŞ</small><strong>{formData.fromCity}{formData.fromCountry ? `, ${formData.fromCountry}` : ""}</strong></div>
                )}
                {formData.toCity && (
                  <div><small>VARIŞ</small><strong>{formData.toCity}{formData.toCountry ? `, ${formData.toCountry}` : ""}</strong></div>
                )}
                {formData.pickupDate && (
                  <div><small>YÜKLEME TARİHİ</small><strong>{formData.pickupDate}</strong></div>
                )}
              </div>
            </div>

            {/* Yük bilgileri */}
            <div className="rs-section">
              <div className="rs-section-head">
                <span className="rs-section-title">Yük Bilgileri</span>
                <button type="button" className="rs-edit" onClick={() => goToStep(1)} aria-label="Yük bilgileri adımına dön">
                  Düzenle
                </button>
              </div>
              <div className="rs-facts">
                {formData.cargo && <div><small>YÜK ADI</small><strong>{formData.cargo}</strong></div>}
                {formData.loadType && <div><small>YÜK TİPİ</small><strong>{formData.loadType}</strong></div>}
                {formData.weight && <div><small>AĞIRLIK</small><strong>{formData.weight} ton</strong></div>}
                {formData.notes && <div className="rs-wide"><small>AÇIKLAMA</small><strong>{formData.notes}</strong></div>}
              </div>
            </div>

            {/* Araç gereksinimi */}
            <div className="rs-section">
              <div className="rs-section-head">
                <span className="rs-section-title">Araç Gereksinimi</span>
                <button type="button" className="rs-edit" onClick={() => goToStep(2)} aria-label="Araç gereksinimi adımına dön">
                  Düzenle
                </button>
              </div>
              <div className="rs-facts">
                {formData.vehicle && <div><small>ARAÇ TİPİ</small><strong>{formData.vehicle}</strong></div>}
                {(formData.adr || formData.temperatureControl || formData.insurance || formData.tracking) && (
                  <div className="rs-wide">
                    <small>EK GEREKSİNİMLER</small>
                    <strong>
                      {[
                        formData.adr === "Evet" && "ADR",
                        formData.temperatureControl === "Evet" && "Sıcaklık kontrolü",
                        formData.insurance === "Evet" && "Ek sigorta",
                        formData.tracking === "Zorunlu" && "Takip zorunluluğu",
                      ].filter(Boolean).join(", ") || "—"}
                    </strong>
                  </div>
                )}
              </div>
            </div>

            {/* Ticari bilgiler */}
            <div className="rs-section">
              <div className="rs-section-head">
                <span className="rs-section-title">Ticari Bilgiler</span>
                <button type="button" className="rs-edit" onClick={() => goToStep(3)} aria-label="Ticari bilgiler adımına dön">
                  Düzenle
                </button>
              </div>
              <div className="rs-facts">
                {formData.price
                  ? <div><small>HEDEF BÜTÇE</small><strong>{Number(formData.price).toLocaleString("tr-TR")} {formData.currency || "TRY"}</strong></div>
                  : <div><small>HEDEF BÜTÇE</small><strong>Belirtilmedi — tüm teklifler alınır</strong></div>
                }
                {formData.payment && <div><small>ÖDEME KOŞULU</small><strong>{formData.payment}</strong></div>}
              </div>
            </div>

            <div className="rs-mode-note">
              {liveMarketplaceEnabled()
                ? <><BadgeCheck size={14} aria-hidden="true" /> Canlı API üzerinden yayınlanacak.</>
                : <><span className="demo-badge-inline">DEMO</span> Demo ilanı olarak kaydedilecek. Gerçek taşıyıcılara görünmez.</>
              }
            </div>
          </div>
        </div>
        <div className="modal-actions">
          <button
            type="button"
            onClick={() => (step ? setStep(step - 1) : onClose())}
          >
            {step ? "Geri" : "Vazgeç"}
          </button>
          {onSaveDraft && (
            <button
              type="button"
              className="draft-save-btn"
              onClick={handleSaveDraft}
              title="Taslak olarak kaydet, sonra yayınlayabilirsiniz"
            >
              Taslak Kaydet
            </button>
          )}
          {step < steps.length - 1 ? (
            <button type="button" className="login-button" onClick={next}>
              Devam et <ArrowRight />
            </button>
          ) : (
            <button className="login-button" disabled={submitting} aria-busy={submitting}>
              {submitting ? <><span className="button-spinner" /> Yayınlanıyor…</> : <>İlanı yayınla <ArrowRight /></>}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export function CompanyPortal() {
  const [active, setActive] = useState("Firma özeti");
  const [data, setData] = useState(() =>
    isBackendConfigured() ? null : demoCompanyDashboard,
  );
  const [notice, setNotice] = useState("");
  const [filters, setFilters] = useState({
    origin: "",
    destination: "",
    date: "",
    vehicle: "Tümü",
  });
  const [marketLoads, setMarketLoads] = useState(() =>
    liveMarketplaceEnabled() ? [] : getLoads(seedLoads),
  );
  const [marketOffers, setMarketOffers] = useState(() =>
    liveMarketplaceEnabled() ? [] : getOffers(seedOffers),
  );
  const [matches, setMatches] = useState(() =>
    liveMarketplaceEnabled() ? [] : getMatches(),
  );
  const { prefs, toggleSavedLoad, saveFilter, removeFilter } = usePreferences();
  useEffect(() => {
    let mounted = true;
    getCompanyDashboard()
      .then((result) => mounted && setData(result))
      .catch((error) => mounted && setNotice(error.message));
    if (liveMarketplaceEnabled()) {
      Promise.all([loadMarketplace(), loadMyOffers(), loadMyMatches()])
        .then(([loads, offers, remoteMatches]) => {
          if (!mounted) return;
          const normalized = offers.map((o) => ({
            id: o.id,
            load: o.loadId,
            driver: o.driverName || "Atanmamış şoför",
            company: "Firma hesabı",
            vehicle: `${o.vehicleType} · ${o.vehiclePlate}`,
            amount: `${Number(o.amount).toLocaleString("tr-TR")} ${o.currency}`,
            status: o.status === "PENDING" ? "Bekliyor" : o.status,
            createdAt: o.createdAt,
          }));
          setMarketLoads(loads);
          setMarketOffers(normalized);
          setMatches(
            remoteMatches.map((match) => {
              const offer = normalized.find((x) => x.id === match.offerId);
              return {
                ...match,
                cargo: match.loadId,
                route: "Backend seferi",
                driver: offer?.driver || "Atanmış şoför",
                carrier: "Firma hesabı",
                vehicle: offer?.vehicle,
                amount: offer?.amount || "—",
                matchedAt: match.matchedAt || match.createdAt,
              };
            }),
          );
        })
        .catch((error) => mounted && setNotice(error.message));
      return () => {
        mounted = false;
      };
    }
    const unsubscribe = subscribeMarketplace(() => {
      setMarketLoads(getLoads(seedLoads));
      setMarketOffers(getOffers(seedOffers));
      setMatches(getMatches());
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);
  if (!data)
    return (
      <PortalShell role="lojistik" active={active} onSelect={setActive}>
        <section className="portal-heading">
          <div>
            <span>ERİŞİM KONTROLÜ</span>
            <h1>Firma üyeliği doğrulanamadı.</h1>
            <p>
              {notice ||
                "Şirket paneli yalnızca kayıtlı şirket üyelerine açıktır."}
            </p>
          </div>
        </section>
      </PortalShell>
    );
  const companyOffers = liveMarketplaceEnabled()
    ? marketOffers
    : marketOffers.filter((x) => x.company === "Horoz Lojistik");
  const offeredIds = companyOffers.map((x) => x.load);
  const companyMatches = liveMarketplaceEnabled()
    ? matches
    : matches.filter((x) => x.carrier === "Horoz Lojistik");
  const available = marketLoads
    .filter((x) => x.status === "Teklif alıyor")
    .map((x) =>
      loadToJob(x, {
        origin: "Tümü",
        destination: "Tümü",
        vehicle: filters.vehicle,
      }),
    )
    .filter(
      (x) =>
        (!filters.origin ||
          x.from
            .toLocaleLowerCase("tr")
            .includes(filters.origin.toLocaleLowerCase("tr"))) &&
        (!filters.destination ||
          x.to
            .toLocaleLowerCase("tr")
            .includes(filters.destination.toLocaleLowerCase("tr"))) &&
        (filters.vehicle === "Tümü" || x.vehicle === filters.vehicle) &&
        (!filters.date || x.pickupDate === filters.date),
    );
  const totalRevenue =
    (data.kpis.grossRevenue || 0) +
    companyMatches.reduce(
      (sum, x) => sum + (Number(String(x.amount).replace(/[^0-9]/g, "")) || 0),
      0,
    );
  async function offer(job) {
    if (offeredIds.includes(job.id)) return;
    if (liveMarketplaceEnabled()) {
      try {
        const created = await submitLiveOffer(job);
        setMarketOffers((current) => [
          {
            id: created.id,
            load: created.loadId,
            driver: created.driverName || "Atanmamış şoför",
            company: data.company.name,
            vehicle: `${created.vehicleType} · ${created.vehiclePlate}`,
            amount: `${Number(created.amount).toLocaleString("tr-TR")} ${created.currency}`,
            status: "Bekliyor",
            createdAt: created.createdAt,
          },
          ...current,
        ]);
        setNotice(`${job.id} için firma teklifi merkezi sisteme gönderildi.`);
        return;
      } catch (error) {
        setNotice(error.message);
        return;
      }
    }
    const item = {
      id: makeRecordId("OF"),
      load: job.id,
      driver: "Mehmet Yılmaz",
      company: "Horoz Lojistik",
      vehicle: "Tır · 34 HRZ 196",
      score: "4.9",
      trips: 184,
      amount: job.price,
      eta: "Bugün 15:30",
      status: "Bekliyor",
      createdAt: new Date().toISOString(),
    };
    const nextOffers = [item, ...marketOffers];
    const nextLoads = marketLoads.map((x) =>
      x.id === job.id ? { ...x, offers: (x.offers || 0) + 1 } : x,
    );
    setMarketOffers(nextOffers);
    setMarketLoads(nextLoads);
    saveOffers(nextOffers);
    saveLoads(nextLoads);
    setNotice(`${job.id} için Horoz Lojistik teklifi gönderildi.`);
    setTimeout(() => setNotice(""), 3500);
  }
  const kpis = [
    ...Object.entries({
      "Aktif şoför": data.kpis.drivers,
      "Kayıtlı araç": data.kpis.vehicles,
      "Bu ay bulunan yük": data.kpis.loads,
      "Gönderilen teklif": data.kpis.offers,
      "Aktif sefer": data.kpis.activeTrips + companyMatches.length,
      "Tamamlanan sefer": data.kpis.completedTrips,
    }),
  ];
  return (
    <PortalShell role="lojistik" active={active} onSelect={setActive}>
      {notice && (
        <div className="success-banner portal-toast">
          <Check /> {notice}
        </div>
      )}
      {active === "Firma özeti" && (
        <>
          <PageHeading
            kicker="FİRMA OPERASYON MERKEZİ"
            title={`${data.company.name} kontrol paneli.`}
            text="Filo, teklifler ve sevkiyatlar tek operasyon görünümünde."
            action={
              <span className={`company-source ${data.source}`}>
                {data.source === "live" ? "CANLI VERİ" : "DEMO VERİ"}
              </span>
            }
          />
          <div className="company-kpis">
            {kpis.map(([label, value]) => (
              <article key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <small>Son güncel şirket verisi</small>
              </article>
            ))}
            <article className="revenue">
              <span>Son 12 ay brüt kazanç</span>
              <strong>{totalRevenue.toLocaleString("tr-TR")} €</strong>
              <small>Kabul edilen taşıma işleri</small>
            </article>
          </div>
          <ActionCenter
            role="lojistik"
            counts={{ availableLoads: available.length, unread: 0 }}
            onNavigate={setActive}
          />
          <CompanyTrips
            trips={[
              ...companyMatches.map((x) => ({
                id: x.id,
                loadTitle: x.cargo,
                route: x.route,
                driverName: x.driver,
                amount: Number(String(x.amount).replace(/[^0-9]/g, "")),
                currency: "EUR",
                status: x.status,
                matchedAt: x.matchedAt,
              })),
              ...data.recentTrips,
            ].slice(0, 6)}
          />
        </>
      )}
      {active === "Yük pazarı" && (
        <>
          <PageHeading
            kicker="AVRUPA YÜK PAZARI"
            title="Filonuza yeni yük bulun."
            text="Rota, tarih ve araç uyumuna göre sıralanan doğrulanmış yükler."
          />
          <SavedFilters
            filters={prefs.savedFilters}
            activeFilters={filters}
            onApply={setFilters}
            onSave={saveFilter}
            onRemove={removeFilter}
          />
          <MarketplaceFilters filters={filters} onChange={setFilters} />
          <JobGrid
            data={available}
            accepted={offeredIds}
            onAccept={offer}
            savedLoadIds={prefs.savedLoadIds}
            onToggleSave={toggleSavedLoad}
            onView={() => {}}
          />
        </>
      )}
      {active === "Kaydedilen Yükler" && (
        <>
          <PageHeading
            kicker="KAYDEDILEN YÜKLER"
            title="Takip ettiğiniz yükler."
            text="Kaydettiğiniz yükleri buradan hızlıca açabilirsiniz."
          />
          <SavedLoads
            loads={[
              ...marketLoads,
              ...jobs.filter((j) => !marketLoads.find((m) => m.id === j.id)),
            ]}
            savedIds={prefs.savedLoadIds}
            onToggleSave={toggleSavedLoad}
            onView={() => setActive("Yük pazarı")}
          />
        </>
      )}
      {active === "Tekliflerim" && (
        <>
          <PageHeading
            kicker="FİRMA TEKLİFLERİ"
            title="Gönderilen teklifleri yönetin."
            text="Yük detayını açın, mesajlaşın, teklifi güncelleyin veya geri çekin."
          />
          <section className="company-table">
            <div className="company-table-head">
              <span>İlan</span>
              <span>Atanan şoför</span>
              <span>Araç</span>
              <span>Tutar</span>
              <span>Durum</span>
            </div>
            {companyOffers.map((x) => (
              <article key={x.id}>
                <strong>{x.load}</strong>
                <span>{x.driver}</span>
                <span>{x.vehicle}</span>
                <b>{x.amount}</b>
                <em>{x.status}</em>
              </article>
            ))}
          </section>
        </>
      )}
      {active === "Sevkiyatlar" &&
        (liveMarketplaceEnabled() ? (
          <EmptyState
            icon={<Route />}
            title={
              companyMatches.length
                ? "Sevkiyat detay bağlantısı hazırlanıyor"
                : "Aktif sevkiyat bulunmuyor"
            }
            text="Gerçek sevkiyat detayları bağlanana kadar örnek operasyon verisi gösterilmiyor."
          />
        ) : (
          <ShipmentDetail onMessage={() => setActive("Mesajlar")} />
        ))}{" "}
      {active === "Mesajlar" && (
        <MessagesCenter
          demo={!liveMarketplaceEnabled()}
          onOpenShipment={() => setActive("Sevkiyatlar")}
        />
      )}{" "}
      {active === "Şoförler" && (
        <>
          <PageHeading
            kicker="FİLO EKİBİ"
            title="Şoförler ve atamalar."
            text="Şoför uygunluğu, doğrulama ve aktif görevleri yönetin."
          />
          <CompanyDrivers drivers={data.drivers} />
        </>
      )}
      {active === "Kazançlar" && (
        <>
          <PageHeading
            kicker="FİNANS"
            title="Kazanç görünümü."
            text="Tamamlanan taşımalardan oluşan gelir özeti."
          />
          <CompanyMonthlyChart months={data.monthly} />
        </>
      )}
      {["Araçlar", "Canlı Harita", "Faturalar", "Belgeler", "Ekip"].includes(
        active,
      ) && (
        <EmptyState
          icon={<Truck />}
          title={`${active} alanı entegrasyona hazır`}
          text="Bu ekran için ilgili backend endpoint sözleşmesi bekleniyor."
        />
      )}
    </PortalShell>
  );
}

function CompanyMonthlyChart({ months }) {
  const max = Math.max(...months.map((x) => x.revenue), 1);
  return (
    <section className="company-chart">
      <div>
        <h2>12 aylık kazanç ve operasyon</h2>
        <p>Yeşil sütun gelir, sayı tamamlanan seferdir.</p>
      </div>
      <div className="company-bars">
        {months.map((x) => (
          <article key={x.month}>
            <span>
              <i style={{ height: `${(x.revenue / max) * 100}%` }} />
            </span>
            <strong>{x.trips}</strong>
            <small>{x.month}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
function CompanyDrivers({ drivers }) {
  return (
    <section className="company-table drivers">
      <div className="company-table-head">
        <span>Şoför</span>
        <span>Durum</span>
        <span>Deneyim</span>
        <span>Sefer</span>
        <span>Gelir</span>
      </div>
      {drivers.map((x) => (
        <article key={x.id}>
          <span>
            <strong>{x.name}</strong>
            <small>{x.email}</small>
          </span>
          <em>{x.status}</em>
          <span>{x.yearsExperience} yıl</span>
          <b>{x.completedTrips}</b>
          <strong>{x.revenue.toLocaleString("tr-TR")} €</strong>
        </article>
      ))}
    </section>
  );
}
function CompanyTrips({ trips }) {
  return (
    <section className="company-table trips">
      <div className="company-table-head">
        <span>Sefer / yük</span>
        <span>Rota</span>
        <span>Şoför</span>
        <span>Tutar</span>
        <span>Durum</span>
      </div>
      {trips.map((x) => (
        <article key={x.id}>
          <span>
            <strong>{x.id}</strong>
            <small>{x.loadTitle}</small>
          </span>
          <strong>{x.route}</strong>
          <span>{x.driverName}</span>
          <b>
            {Number(x.amount || 0).toLocaleString("tr-TR")} {x.currency}
          </b>
          <em>{x.status}</em>
        </article>
      ))}
    </section>
  );
}

export function DriverPortal() {
  const [active, setActive] = useState("Atanmış iş");
  const live = liveMarketplaceEnabled();
  return (
    <PortalShell role="sofor" active={active} onSelect={setActive}>
      {active === "Atanmış iş" &&
        (live ? (
          <EmptyState
            icon={<Package />}
            title="Atanmış görev bulunmuyor"
            text="Size bir sevkiyat atandığında gerçek rota ve iletişim bilgileri burada gösterilecek."
          />
        ) : (
          <DriverWorkspace onMessage={() => setActive("Mesajlar")} />
        ))}{" "}
      {active === "Rota" &&
        (live ? (
          <EmptyState
            icon={<Map />}
            title="Aktif rota bulunmuyor"
            text="Atanmış sevkiyat olmadan örnek konum veya ETA gösterilmiyor."
          />
        ) : (
          <LiveRoute />
        ))}{" "}
      {active === "Mesajlar" && <MessagesCenter demo={!live} />}{" "}
      {active === "Belgeler" && <DocumentCenter role="sofor" />}
    </PortalShell>
  );
}

export function LegacyDriverPortal() {
  const [active, setActive] = useState("Uygun işler");
  const [filter, setFilter] = useState("Tümü");
  const [origin, setOrigin] = useState("Norveç");
  const [destination, setDestination] = useState("İtalya");
  const [notice, setNotice] = useState("");
  const [marketLoads, setMarketLoads] = useState(() =>
    liveMarketplaceEnabled() ? [] : getLoads(seedLoads),
  );
  const [marketOffers, setMarketOffers] = useState(() =>
    liveMarketplaceEnabled() ? [] : getOffers(seedOffers),
  );
  const [matches, setMatches] = useState(() =>
    liveMarketplaceEnabled() ? [] : getMatches(),
  );
  useEffect(
    () =>
      subscribeMarketplace(() => {
        setMarketLoads(getLoads(seedLoads));
        setMarketOffers(getOffers(seedOffers));
        setMatches(getMatches());
      }),
    [],
  );
  useEffect(() => {
    if (!liveMarketplaceEnabled()) return;
    let active = true;
    Promise.all([loadMarketplace(), loadMyOffers(), loadMyMatches()])
      .then(([remoteLoads, offers, remoteMatches]) => {
        if (!active) return;
        setMarketLoads(remoteLoads);
        const normalizedOffers = offers.map((o) => ({
          id: o.id,
          load: o.loadId,
          driver: o.driverName || "Ahmet Yılmaz",
          company:
            o.offererType === "COMPANY"
              ? "Lojistik firması"
              : "Bağımsız taşıyıcı",
          vehicle: `${o.vehicleType} · ${o.vehiclePlate}`,
          amount: `${Number(o.amount).toLocaleString("tr-TR")} ${o.currency}`,
          status: o.status === "PENDING" ? "Bekliyor" : o.status,
          createdAt: o.createdAt,
        }));
        setMarketOffers(normalizedOffers);
        setMatches(
          remoteMatches.map((match) => {
            const offer = normalizedOffers.find((x) => x.id === match.offerId);
            return {
              ...match,
              cargo: match.loadId,
              route: "Backend seferi",
              driver: offer?.driver || "Ahmet Yılmaz",
              carrier: offer?.company || "Taşıyıcı",
              vehicle: offer?.vehicle,
              amount: offer?.amount || "—",
              matchedAt: match.matchedAt || match.createdAt,
            };
          }),
        );
      })
      .catch((reason) => active && setNotice(reason.message));
    return () => {
      active = false;
    };
  }, []);
  const allJobs = useMemo(() => {
    const dynamic = marketLoads
      .filter((x) => x.status === "Teklif alıyor")
      .map((x) => loadToJob(x, { origin, destination, vehicle: filter }));
    if (liveMarketplaceEnabled())
      return dynamic.sort((a, b) => b.match - a.match);
    const ids = new Set(dynamic.map((x) => x.id));
    return [
      ...dynamic,
      ...jobs
        .filter((x) => !ids.has(x.id))
        .map((x) => loadToJob(x, { origin, destination, vehicle: filter })),
    ].sort((a, b) => b.match - a.match);
  }, [marketLoads, origin, destination, filter]);
  const visible = useMemo(
    () =>
      allJobs.filter(
        (x) =>
          (filter === "Tümü" || x.vehicle === filter) &&
          (origin === "Tümü" || x.originCountry === origin) &&
          (destination === "Tümü" || x.destinationCountry === destination),
      ),
    [allJobs, filter, origin, destination],
  );
  const myOffers = liveMarketplaceEnabled()
    ? marketOffers
    : marketOffers.filter((x) => x.driver === "Ahmet Yılmaz");
  const offeredIds = myOffers.map((x) => x.load);
  const acceptedMatches = liveMarketplaceEnabled()
    ? matches
    : matches.filter((x) => x.driver === "Ahmet Yılmaz");
  async function accept(job) {
    if (offeredIds.includes(job.id)) return;
    if (liveMarketplaceEnabled()) {
      try {
        const created = await submitLiveOffer(job);
        const offer = {
          id: created.id,
          load: created.loadId,
          driver: created.driverName,
          company:
            created.offererType === "COMPANY"
              ? "Lojistik firması"
              : "Bağımsız taşıyıcı",
          vehicle: `${created.vehicleType} · ${created.vehiclePlate}`,
          amount: `${Number(created.amount).toLocaleString("tr-TR")} ${created.currency}`,
          status: "Bekliyor",
          createdAt: created.createdAt,
        };
        setMarketOffers((current) => [offer, ...current]);
        setNotice(`${job.id} için teklifiniz merkezi sisteme gönderildi.`);
        setTimeout(() => setNotice(""), 3500);
        return;
      } catch (reason) {
        setNotice(reason.message);
        return;
      }
    }
    const offer = {
      id: makeRecordId("OF"),
      load: job.id,
      driver: "Ahmet Yılmaz",
      company: "Anadolu Filo",
      vehicle: "Tır · 34 LOG 2026",
      score: "4.9",
      trips: 128,
      amount: job.price,
      eta: "Bugün 16:30",
      status: "Bekliyor",
      createdAt: new Date().toISOString(),
    };
    const updatedOffers = [offer, ...marketOffers];
    const updatedLoads = marketLoads.map((x) =>
      x.id === job.id ? { ...x, offers: (x.offers || 0) + 1 } : x,
    );
    setMarketOffers(updatedOffers);
    setMarketLoads(updatedLoads);
    saveOffers(updatedOffers);
    saveLoads(updatedLoads);
    setNotice(`${job.id} için teklifiniz yük verene gönderildi.`);
    setTimeout(() => setNotice(""), 3500);
  }
  const pendingJobs = allJobs.filter((x) => offeredIds.includes(x.id));
  const totalEarnings = acceptedMatches.reduce(
    (sum, x) => sum + (Number(String(x.amount).replace(/[^0-9]/g, "")) || 0),
    0,
  );
  return (
    <PortalShell role="sofor" active={active} onSelect={setActive}>
      {notice && (
        <div className="success-banner portal-toast">
          <Check /> {notice}
        </div>
      )}
      {active === "Uygun işler" && (
        <>
          <PageHeading
            kicker="51 ÜLKEDE ROTA EŞLEŞTİRMESİ"
            title="Sonraki rotanızı siz seçin."
            text="Konum, hedef rota ve araç uyumuna göre ilanlar otomatik puanlanır."
            action={
              <div className="driver-online">
                <i /> Avrupa genelinde iş almaya açık
              </div>
            }
          />
          <section className="route-preference">
            <div>
              <span className="route-step">A</span>
              <label>
                Şu anda neredesiniz?
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                >
                  <option>Tümü</option>
                  {EUROPEAN_COUNTRIES.map((country) => (
                    <option key={country}>{country}</option>
                  ))}
                </select>
                <small>51 ülkeden mevcut konumunuzu seçin</small>
              </label>
            </div>
            <ArrowRight />
            <div>
              <span className="route-step destination">B</span>
              <label>
                Nereye gitmek istiyorsunuz?
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                >
                  <option>Tümü</option>
                  {EUROPEAN_COUNTRIES.map((country) => (
                    <option key={country}>{country}</option>
                  ))}
                </select>
                <small>Boş dönüşü azaltacak hedef ülkeyi seçin</small>
              </label>
            </div>
            <button
              onClick={() =>
                setNotice(
                  `${origin} → ${destination} koridorunda ${visible.length} uygun yük bulundu.`,
                )
              }
            >
              Rotamı eşleştir
            </button>
          </section>
          <div className="driver-toolbar">
            <div>
              {[
                "Tümü",
                "Tır",
                "Frigorifik",
                "Kamyon",
                "Kamyonet",
                "Panelvan",
              ].map((x) => (
                <button
                  className={filter === x ? "active" : ""}
                  onClick={() => setFilter(x)}
                  key={x}
                >
                  {x}
                </button>
              ))}
            </div>
            <span>{visible.length} uygun Avrupa işi</span>
          </div>
          {visible.length ? (
            <JobGrid data={visible} accepted={offeredIds} onAccept={accept} />
          ) : (
            <EmptyState
              icon={<Route />}
              title="Bu koridorda aktif yük bulunamadı"
              text="Konum veya araç filtresini genişleterek çevre rotalardaki işleri görebilirsiniz."
            />
          )}
        </>
      )}
      {active === "Seferlerim" && (
        <>
          <PageHeading
            kicker="TEKLİF & SEFER TAKİBİ"
            title="Tüm işleriniz tek ekranda."
            text="Bekleyen tekliflerinizi ve kabul edilen seferlerinizi takip edin."
          />
          <div className="portal-stats">
            <article>
              <span>Bekleyen teklif</span>
              <strong>
                {myOffers.filter((x) => x.status === "Bekliyor").length}
              </strong>
              <small>Yük veren yanıtı bekleniyor</small>
            </article>
            <article>
              <span>Planlanan sefer</span>
              <strong>{acceptedMatches.length}</strong>
              <small>Eşleşmesi tamamlandı</small>
            </article>
            <article className="dark">
              <span>Başarı oranı</span>
              <strong>
                {myOffers.length
                  ? `%${Math.round((acceptedMatches.length / myOffers.length) * 100)}`
                  : "%0"}
              </strong>
              <small>Kabul edilen teklifler</small>
            </article>
          </div>
          <section className="trip-board">
            {pendingJobs.length ? (
              <JobGrid
                data={pendingJobs}
                accepted={offeredIds}
                onAccept={accept}
              />
            ) : (
              <EmptyState
                icon={<Route />}
                title="Henüz teklifiniz yok"
                text="Uygun işler ekranından bir Avrupa yüküne teklif vererek başlayın."
                action={() => setActive("Uygun işler")}
              />
            )}
          </section>
        </>
      )}
      {active === "Geçmiş" && (
        <MonthlyHistory role="sofor" matches={acceptedMatches} />
      )}{" "}
      {active === "Canlı rota" && <LiveRoute />}
      {active === "Belgeler" && <DocumentCenter role="sofor" />}
      {active === "Takograf" && <TachographCenter />}
      {active === "Kazançlar" && (
        <>
          <PageHeading
            kicker="AVRUPA KAZANÇ ÖZETİ"
            title="Kazançlarınızı Euro bazında izleyin."
            text="Eşleşen seferler ve bekleyen ödemeler gerçek iş akışından hesaplanır."
          />
          <div className="earnings-grid">
            <article>
              <span>Planlanan kazanç</span>
              <strong>{totalEarnings.toLocaleString("tr-TR")} €</strong>
              <small>{acceptedMatches.length} eşleşmiş sefer</small>
            </article>
            <article>
              <span>Bekleyen teklif</span>
              <strong>
                {myOffers.filter((x) => x.status === "Bekliyor").length}
              </strong>
              <small>Yük veren onayı bekliyor</small>
            </article>
            <article className="dark">
              <span>Toplam sefer</span>
              <strong>{acceptedMatches.length}</strong>
              <small>Logiway eşleşmeleri</small>
            </article>
          </div>
          <MonthlyHistory role="sofor" matches={acceptedMatches} />
        </>
      )}
    </PortalShell>
  );
}

const demoHistory = [
  {
    id: "MT-2505",
    loadId: "LW-2798",
    route: "Bursa, Türkiye → Hamburg, Almanya",
    cargo: "Otomotiv parçası",
    driver: "Ahmet Yılmaz",
    carrier: "Anadolu Filo",
    amount: "3.720 €",
    status: "Tamamlandı",
    matchedAt: "2026-05-26T10:00:00.000Z",
  },
  {
    id: "MT-2504",
    loadId: "LW-2742",
    route: "Göteborg, İsveç → Paris, Fransa",
    cargo: "Makine ekipmanı",
    driver: "Ahmet Yılmaz",
    carrier: "Anadolu Filo",
    amount: "3.240 €",
    status: "Tamamlandı",
    matchedAt: "2026-04-20T10:00:00.000Z",
  },
  {
    id: "MT-2503",
    loadId: "LW-2688",
    route: "Ankara, Türkiye → Varşova, Polonya",
    cargo: "Tekstil paletleri",
    driver: "Ahmet Yılmaz",
    carrier: "Anadolu Filo",
    amount: "2.850 €",
    status: "Tamamlandı",
    matchedAt: "2026-03-17T10:00:00.000Z",
  },
];

function MonthlyHistory({ role, matches, enableExport = false }) {
  const records = liveMarketplaceEnabled()
    ? matches
    : [
        ...matches,
        ...demoHistory.filter((seed) => !matches.some((x) => x.id === seed.id)),
      ];
  const months = [
    ...new Set(
      records.map((x) => (x.matchedAt || new Date().toISOString()).slice(0, 7)),
    ),
  ]
    .sort()
    .reverse();
  const [month, setMonth] = useState(months[0] || "all");
  const [archiveFilters, setArchiveFilters] = useState({ query: "", from: "", to: "", carrier: "ALL", status: "ALL", currency: "ALL" });
  const [selectedRecord, setSelectedRecord] = useState(null);
  useEffect(() => {
    if (!selectedRecord) return;
    const close = (event) => event.key === "Escape" && setSelectedRecord(null);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [selectedRecord]);
  const monthRecords =
    month === "all"
      ? records
      : records.filter((x) => (x.matchedAt || "").startsWith(month));
  const recordCurrency = (record) => record.currency || String(record.amount || "").match(/(EUR|GBP|TRY|NOK|USD|€|£|₺|\$)/)?.[1] || "—";
  const carriers = [...new Set(records.map((record) => record.carrier).filter(Boolean))].sort();
  const statuses = [...new Set(records.map((record) => record.status).filter(Boolean))].sort();
  const currencies = [...new Set(records.map(recordCurrency).filter((value) => value !== "—"))].sort();
  const visible = monthRecords.filter((record) => {
    if (!enableExport) return true;
    const date = String(record.matchedAt || "").slice(0, 10);
    const query = archiveFilters.query.trim().toLocaleLowerCase("tr-TR");
    return (!archiveFilters.from || date >= archiveFilters.from) &&
      (!archiveFilters.to || date <= archiveFilters.to) &&
      (archiveFilters.carrier === "ALL" || record.carrier === archiveFilters.carrier) &&
      (archiveFilters.status === "ALL" || record.status === archiveFilters.status) &&
      (archiveFilters.currency === "ALL" || recordCurrency(record) === archiveFilters.currency) &&
      (!query || [record.id, record.loadId, record.cargo, record.route, record.carrier].some((value) => String(value || "").toLocaleLowerCase("tr-TR").includes(query)));
  });
  // Currency-aware totals — never mix EUR + GBP + NOK etc.
  const currencyTotals = visible.reduce((acc, x) => {
    const cur = x.currency || recordCurrency(x);
    const amt = Number(String(x.amount).replace(/[^0-9,.]/g, "").replace(",", ".")) || 0;
    acc[cur] = (acc[cur] || 0) + amt;
    return acc;
  }, {});

  async function handleHistoryExport(format) {
    const { headers, rows } = historyExportData(visible, role);
    const file = "logiway-gecmis";
    if (format === "csv")  return exportCSV(headers, rows, file);
    if (format === "xlsx") return exportXLSX("Geçmiş", headers, rows, file);
    // PDF not in formats — only csv/xlsx for history per spec
  }

  return (
    <section className="history-page">
      <PageHeading
        kicker="AYLIK OPERASYON ARŞİVİ"
        title={
          role === "sofor"
            ? "Sefer ve kazanç geçmişiniz."
            : "İlan ve taşıma geçmişiniz."
        }
        text="Önceki aylarda gerçekleşen eşleşmeleri, rotaları ve tutarları inceleyin."
        action={
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <select
              className="history-select"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              <option value="all">Tüm aylar</option>
              {months.map((x) => (
                <option value={x} key={x}>
                  {new Date(`${x}-01`).toLocaleDateString("tr-TR", {
                    month: "long",
                    year: "numeric",
                  })}
                </option>
              ))}
            </select>
            {enableExport && (
              <ExportButton
                formats={["csv", "xlsx"]}
                onExport={handleHistoryExport}
                disabled={visible.length === 0}
              />
            )}
          </div>
        }
      />
      {enableExport && (
        <div className="history-filters">
          <label className="history-search"><Search size={14}/><input value={archiveFilters.query} onChange={(event) => setArchiveFilters((current) => ({ ...current, query: event.target.value }))} placeholder="Yük, rota, taşıyıcı veya sevkiyat ara" aria-label="Geçmişte ara" /></label>
          <label><span>Başlangıç</span><input type="date" value={archiveFilters.from} onChange={(event) => setArchiveFilters((current) => ({ ...current, from: event.target.value }))}/></label>
          <label><span>Bitiş</span><input type="date" value={archiveFilters.to} onChange={(event) => setArchiveFilters((current) => ({ ...current, to: event.target.value }))}/></label>
          <label><span>Taşıyıcı</span><select value={archiveFilters.carrier} onChange={(event) => setArchiveFilters((current) => ({ ...current, carrier: event.target.value }))}><option value="ALL">Tümü</option>{carriers.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Durum</span><select value={archiveFilters.status} onChange={(event) => setArchiveFilters((current) => ({ ...current, status: event.target.value }))}><option value="ALL">Tümü</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Para birimi</span><select value={archiveFilters.currency} onChange={(event) => setArchiveFilters((current) => ({ ...current, currency: event.target.value }))}><option value="ALL">Tümü</option>{currencies.map((value) => <option key={value}>{value}</option>)}</select></label>
        </div>
      )}
      <div className="history-summary">
        <article>
          <span>Toplam sefer</span>
          <strong>{visible.length}</strong>
        </article>
        <article>
          <span>{role === "sofor" ? "Toplam kazanç" : "Taşıma hacmi"}</span>
          {Object.entries(currencyTotals).length ? (
            Object.entries(currencyTotals).map(([cur, val]) => (
              <strong key={cur}>{val.toLocaleString("tr-TR")} {cur}</strong>
            ))
          ) : (
            <strong>—</strong>
          )}
        </article>
        <article>
          <span>Tamamlanma</span>
          <strong>
            %
            {visible.length
              ? Math.round(
                  (visible.filter((x) => x.status === "Tamamlandı").length /
                    visible.length) *
                    100,
                )
              : 0}
          </strong>
        </article>
      </div>
      <div className="history-table">
        <div className="history-head">
          <span>Sefer</span>
          <span>Rota ve yük</span>
          <span>{role === "sofor" ? "Taşıyıcı" : "Şoför"}</span>
          <span>Tutar</span>
          <span>Durum</span>
        </div>
        {visible.map((x) => (
          <article key={x.id}>
            <span>
              <strong>{x.loadId}</strong>
              <small>{x.matchedAt ? new Date(x.matchedAt).toLocaleDateString("tr-TR") : "—"}</small>
            </span>
            <span>
              <strong>{x.route || `${x.from} → ${x.to}`}</strong>
              <small>{x.cargo}</small>
            </span>
            <span>
              <strong>{role === "sofor" ? x.carrier : x.driver}</strong>
              <small>{role === "sofor" ? x.driver : x.vehicle}</small>
            </span>
            <b>{x.amount}</b>
            <em>{x.status}</em>
            {enableExport && <button className="history-detail-btn" onClick={() => setSelectedRecord(x)} aria-label={`${x.id} taşıma detayını aç`}>Detay <ChevronRight size={13}/></button>}
          </article>
        ))}
      </div>
      {enableExport && selectedRecord && (
        <div className="history-detail-backdrop" role="presentation" onMouseDown={() => setSelectedRecord(null)}>
          <section className="history-detail-modal" role="dialog" aria-modal="true" aria-labelledby="history-detail-title" onMouseDown={(event) => event.stopPropagation()}>
            <header><div><span>TAŞIMA ARŞİVİ</span><h2 id="history-detail-title">{selectedRecord.id}</h2></div><button onClick={() => setSelectedRecord(null)} aria-label="Detayı kapat"><X/></button></header>
            <dl><div><dt>Yük</dt><dd>{selectedRecord.cargo || selectedRecord.loadId}</dd></div><div><dt>Sevkiyat</dt><dd>{selectedRecord.id}</dd></div><div><dt>Rota</dt><dd>{selectedRecord.route}</dd></div><div><dt>Taşıyıcı</dt><dd>{selectedRecord.carrier}</dd></div><div><dt>Fiyat</dt><dd>{selectedRecord.amount}</dd></div><div><dt>Para birimi</dt><dd>{recordCurrency(selectedRecord)}</dd></div><div><dt>Tarih</dt><dd>{selectedRecord.matchedAt ? new Date(selectedRecord.matchedAt).toLocaleDateString("tr-TR") : "—"}</dd></div><div><dt>Durum</dt><dd>{selectedRecord.status}</dd></div></dl>
          </section>
        </div>
      )}
    </section>
  );
}

function DocumentCenter({ loads = [], shipments = [] }) {
  const live = liveMarketplaceEnabled();

  // ── State ────────────────────────────────────────────────────────
  const [docs, setDocs]         = useState(() => (live ? [] : getDocs()));
  const [query, setQuery]       = useState("");
  const [typeFilter, setTypeFilter] = useState("Tümü");
  const [loadFilter, setLoadFilter] = useState("Tümü");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [notice, setNotice]     = useState({ text: "", error: false });
  const fileInputRef            = useRef(null);

  // Reload when another tab writes
  useEffect(() => {
    if (live) return;
    return subscribeDocs(() => setDocs(getDocs()));
  }, [live]);

  // ── Upload form state ────────────────────────────────────────────
  const [form, setForm] = useState({
    docType: DOC_TYPES[0],
    loadId: "",
    shipmentId: "",
  });

  // ── Computed ─────────────────────────────────────────────────────
  const loadOptions = [
    ...new Set([
      ...loads.map((l) => l.id),
      ...docs.map((d) => d.loadId).filter(Boolean),
    ]),
  ];
  const shipmentOptions = [
    ...new Set([
      ...shipments.map((s) => s.id),
      ...docs.map((d) => d.shipmentId).filter(Boolean),
    ]),
  ];

  const visible = docs.filter((d) => {
    if (typeFilter !== "Tümü" && d.docType !== typeFilter) return false;
    if (loadFilter !== "Tümü" && d.loadId !== loadFilter) return false;
    const q = query.toLocaleLowerCase("tr");
    if (q && !([d.name, d.docType, d.loadId, d.shipmentId, d.uploader]
      .map((v) => String(v || "").toLocaleLowerCase("tr"))
      .some((v) => v.includes(q)))) return false;
    return true;
  });

  // ── Handlers ─────────────────────────────────────────────────────
  function showNotice(text, error = false) {
    setNotice({ text, error });
    setTimeout(() => setNotice({ text: "", error: false }), 4000);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const { ok, error } = validateFile(file);
    if (!ok) { showNotice(error, true); e.target.value = ""; return; }

    const result = addDoc(
      {
        docType: form.docType,
        loadId: form.loadId || null,
        shipmentId: form.shipmentId || null,
        uploader: "Siz",
      },
      file,
    );
    if (!result.ok) { showNotice(result.error, true); e.target.value = ""; return; }

    setDocs(getDocs());
    setUploadOpen(false);
    setForm({ docType: DOC_TYPES[0], loadId: "", shipmentId: "" });
    e.target.value = "";
    showNotice(`"${file.name}" başarıyla yüklendi.`);
  }

  function handleDownload(doc) {
    const { ok, error } = downloadDoc(doc);
    if (!ok) showNotice(error, true);
  }

  function handleDelete(doc) {
    deleteDoc(doc.id);
    setDocs(getDocs());
    showNotice(`"${doc.name}" silindi.`);
  }

  // ── Live mode guard ──────────────────────────────────────────────
  if (live) {
    return (
      <EmptyState
        icon={<FileText />}
        title="Belge yönetimi henüz etkin değil"
        text="Belge yönetimi entegrasyonu tamamlandığında burada sevk irsaliyesi, teslimat belgesi, fatura ve sözleşmelerinizi yöneteceksiniz."
      />
    );
  }

  return (
    <section className="feature-page docs-center">
      {/* ── Heading ── */}
      <PageHeading
        kicker="BELGE YÖNETİMİ"
        title="Belgelerinizi tek merkezde yönetin."
        text="Yük ilanlarına ve sevkiyatlara ait belgeleri yükleyin, görüntüleyin ve indirin."
        action={
          <button
            className="portal-primary"
            onClick={() => setUploadOpen(true)}
          >
            <UploadCloud size={16} aria-hidden="true" /> Belge Yükle
          </button>
        }
      />

      {/* ── Notice banner ── */}
      {notice.text && (
        <div
          className={`docs-notice ${notice.error ? "docs-notice--error" : "docs-notice--ok"}`}
          role="status"
          aria-live="polite"
        >
          {notice.error
            ? <AlertTriangle size={14} aria-hidden="true" />
            : <Check size={14} aria-hidden="true" />}
          {notice.text}
        </div>
      )}

      {/* ── Upload panel ── */}
      {uploadOpen && (
        <div className="docs-upload-panel">
          <div className="docs-upload-panel__head">
            <strong>Yeni Belge Yükle</strong>
            <button
              className="docs-upload-close"
              onClick={() => setUploadOpen(false)}
              aria-label="Kapat"
            >
              <X size={15} />
            </button>
          </div>
          <div className="docs-upload-panel__body">
            <label className="docs-field">
              <span>Belge türü</span>
              <select
                value={form.docType}
                onChange={(e) => setForm((p) => ({ ...p, docType: e.target.value }))}
              >
                {DOC_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="docs-field">
              <span>İlgili yük ilanı <em>(opsiyonel)</em></span>
              <select
                value={form.loadId}
                onChange={(e) => setForm((p) => ({ ...p, loadId: e.target.value }))}
              >
                <option value="">— Seçiniz —</option>
                {loadOptions.map((id) => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </label>
            {shipmentOptions.length > 0 && (
              <label className="docs-field">
                <span>İlgili sevkiyat <em>(opsiyonel)</em></span>
                <select
                  value={form.shipmentId}
                  onChange={(e) => setForm((p) => ({ ...p, shipmentId: e.target.value }))}
                >
                  <option value="">— Seçiniz —</option>
                  {shipmentOptions.map((id) => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </select>
              </label>
            )}
            <div className="docs-upload-area">
              <UploadCloud size={22} aria-hidden="true" />
              <p>
                {ALLOWED_EXTENSIONS.join(", ")} · En fazla 10 MB
              </p>
              <label className="portal-primary docs-file-btn">
                Dosya Seç
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_EXTENSIONS.map((e) => e).join(",")}
                  onChange={handleFileChange}
                  aria-label="Belge dosyası seç"
                />
              </label>
            </div>
            <p className="docs-security-note">
              <ShieldCheck size={11} aria-hidden="true" />
              Demo modunda dosyalar yalnızca bu tarayıcı oturumunda tutulur. Sayfa kapatıldığında içerik silinir, yalnızca isim ve tarih bilgisi saklanır.
            </p>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="docs-filters">
        <label className="llf-search docs-search" aria-label="Belge ara">
          <Search size={14} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Belge adı, tür veya ilan no ara"
            aria-label="Belge ara"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Aramayı temizle">
              <X size={13} />
            </button>
          )}
        </label>

        <div className="docs-filter-row">
          <label className="docs-filter-label">
            <span>Tür</span>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="Tümü">Tüm türler</option>
              {DOC_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>

          {loadOptions.length > 0 && (
            <label className="docs-filter-label">
              <span>Yük ilanı</span>
              <select value={loadFilter} onChange={(e) => setLoadFilter(e.target.value)}>
                <option value="Tümü">Tüm ilanlar</option>
                {loadOptions.map((id) => (
                  <option key={id}>{id}</option>
                ))}
              </select>
            </label>
          )}

          <small className="docs-count">
            {visible.length} belge{(query || typeFilter !== "Tümü" || loadFilter !== "Tümü") ? " (filtrelenmiş)" : ""}
          </small>
        </div>
      </div>

      {/* ── Empty state ── */}
      {visible.length === 0 && (
        <div className="llf-empty" role="status">
          <FileText size={28} aria-hidden="true" />
          <h3>
            {docs.length === 0
              ? "Henüz belge yüklenmedi"
              : "Filtreyle eşleşen belge bulunamadı"}
          </h3>
          <p>
            {docs.length === 0
              ? "Yük ilanlarınıza ve sevkiyatlarınıza ait belgeleri buradan yönetin."
              : "Farklı bir arama veya filtre deneyin."}
          </p>
        </div>
      )}

      {/* ── Documents table ── */}
      {visible.length > 0 && (
        <div className="docs-table-wrap" role="region" aria-label="Belgeler tablosu">
          <table className="docs-table">
            <thead>
              <tr>
                <th scope="col">Belge Adı</th>
                <th scope="col">Tür</th>
                <th scope="col">Yük / Sevkiyat</th>
                <th scope="col">Yükleyen</th>
                <th scope="col">Tarih</th>
                <th scope="col">Boyut</th>
                <th scope="col">Durum</th>
                <th scope="col" aria-label="İşlemler" />
              </tr>
            </thead>
            <tbody>
              {visible.map((doc) => {
                const hasBlob = hasBlobInMemory(doc.id);
                return (
                  <tr key={doc.id} className="docs-row">
                    <td className="docs-name-cell">
                      <FileText size={13} aria-hidden="true" className="docs-file-icon" />
                      <span>{doc.name}</span>
                      {doc.demo && (
                        <span className="demo-badge-inline" title="Demo belgesi">DEMO</span>
                      )}
                    </td>
                    <td>
                      <span className="docs-type-badge">{doc.docType}</span>
                    </td>
                    <td className="docs-ref-cell">
                      {doc.loadId && (
                        <span className="docs-ref-chip">
                          <Package size={10} aria-hidden="true" /> {doc.loadId}
                        </span>
                      )}
                      {doc.shipmentId && (
                        <span className="docs-ref-chip docs-ref-chip--ship">
                          <Route size={10} aria-hidden="true" /> {doc.shipmentId}
                        </span>
                      )}
                      {!doc.loadId && !doc.shipmentId && (
                        <span className="docs-ref-none">—</span>
                      )}
                    </td>
                    <td>{doc.uploader}</td>
                    <td>
                      <time dateTime={doc.uploadedAtISO} title={doc.uploadedAtISO}>
                        {doc.uploadedAt}
                      </time>
                    </td>
                    <td>{doc.sizeFmt}</td>
                    <td>
                      {hasBlob ? (
                        <span className="docs-status docs-status--ok">
                          <Check size={11} aria-hidden="true" /> Mevcut
                        </span>
                      ) : (
                        <span className="docs-status docs-status--stale" title="Dosya içeriği bu oturumda yüklenmedi">
                          <Clock3 size={11} aria-hidden="true" /> Kayıtlı
                        </span>
                      )}
                    </td>
                    <td className="docs-actions-cell">
                      <button
                        className="llf-action-btn"
                        title={hasBlob ? "İndir" : "Bu oturumda dosya mevcut değil"}
                        aria-label={`${doc.name} dosyasını indir`}
                        disabled={!hasBlob}
                        onClick={() => handleDownload(doc)}
                      >
                        <ArrowRight size={13} style={{ transform: "rotate(90deg)" }} aria-hidden="true" />
                      </button>
                      <button
                        className="llf-action-btn llf-action-btn--danger"
                        title="Sil"
                        aria-label={`${doc.name} belgesini sil`}
                        onClick={() => handleDelete(doc)}
                      >
                        <X size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const EMPTY_PAYMENT_FILTERS = {
  status: "ALL",
  date: "",
  carrier: "ALL",
  currency: "ALL",
  query: "",
};

function PaymentCenter({ loads = [], shipments = [], matches = [], onNavigate, live = false }) {
  const [payments, setPayments] = useState(() => live ? [] : getPayments());
  const [filters, setFilters] = useState(EMPTY_PAYMENT_FILTERS);
  const [sortKey, setSortKey] = useState("newest"); // newest | oldest | amount-asc | amount-desc | due
  const [selected, setSelected] = useState(null);
  const [loadingPayments, setLoadingPayments] = useState(live);
  const [paymentError, setPaymentError] = useState("");

  useEffect(() => {
    if (live) return undefined;
    return subscribePayments(() => setPayments(getPayments()));
  }, [live]);

  useEffect(() => {
    if (!live) return undefined;
    let cancelled = false;
    listPaymentLedger()
      .then((rows) => { if (!cancelled) { setPaymentError(""); setPayments(mapPaymentLedger(rows, { matches, shipments, loads })); } })
      .catch((reason) => { if (!cancelled) setPaymentError(reason.message || "Finans kayıtları yüklenemedi."); })
      .finally(() => { if (!cancelled) setLoadingPayments(false); });
    return () => { cancelled = true; };
  }, [live, loads, matches, shipments]);

  // Merge live shipments + demo matches for detail lookup
  const allShipments = useMemo(
    () => [
      ...shipments,
      ...matches.filter((m) => !shipments.some((s) => s.id === m.id)),
    ],
    [shipments, matches],
  );

  const carriers = useMemo(
    () => [...new Set(payments.map((payment) => payment.carrier).filter(Boolean))].sort(),
    [payments],
  );
  const currencies = useMemo(
    () => [...new Set(payments.map((payment) => payment.currency).filter(Boolean))].sort(),
    [payments],
  );
  const visiblePayments = useMemo(() => {
    const filtered = filterPayments(payments, filters);
    return [...filtered].sort((a, b) => {
      if (sortKey === "oldest") return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
      if (sortKey === "amount-asc") return Number(a.amount || 0) - Number(b.amount || 0);
      if (sortKey === "amount-desc") return Number(b.amount || 0) - Number(a.amount || 0);
      if (sortKey === "due") return new Date(a.dueDate || "9999") - new Date(b.dueDate || "9999");
      // newest first (default)
      return new Date(b.dueDate || 0) - new Date(a.dueDate || 0);
    });
  }, [payments, filters, sortKey]);
  const summary = useMemo(() => paymentSummary(payments), [payments]);

  const summaryCards = [
    { key: "pending", title: "Bekleyen ödeme", text: "Henüz tamamlanmamış toplam", icon: <Clock3 /> },
    { key: "paid", title: "Ödenen toplam", text: live ? "Yalnızca gerçek ödeme kayıtları" : "Tamamlanan demo kayıtları", icon: <Check /> },
    { key: "dueSoon", title: "Vadesi yaklaşan", text: "Yakında işlem gerektiriyor", icon: <Timer /> },
    { key: "overdue", title: "Vadesi geçen", text: "Öncelikli kontrol gerekli", icon: <TrendingDown /> },
  ];

  async function handlePaymentExport(format) {
    const { headers, rows } = paymentsExportData(visiblePayments);
    const file = "logiway-odemeler";
    if (format === "xlsx") return exportXLSX("Ödemeler", headers, rows, file);
    if (format === "pdf") return exportPDF("Ödemeler", headers, rows, file);
  }

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  const selectedLoad = selected
    ? loads.find((load) => load.id === selected.loadId)
    : null;
  const selectedShipment = selected
    ? allShipments.find((s) => s.id === selected.shipmentId)
    : null;

  return (
    <section className="feature-page payment-center">
      <PageHeading
        kicker="FİNANSAL TAKİP"
        title="Ödemeler ve vadeler"
        text="Taşıma anlaşmalarınıza ait tutarları, vadeleri ve dekont durumlarını para birimlerini karıştırmadan izleyin."
        action={<span className="pay-demo-badge">{live ? "CANLI LEDGER" : "DEMO VERİLERİ"}</span>}
      />

      {paymentError && <div className="pay-empty pay-empty--error" role="alert"><AlertTriangle/><h3>Finans kayıtları yüklenemedi</h3><p>{paymentError}</p></div>}

      <div className="pay-summary" aria-label="Ödeme özeti">
        {summaryCards.map((card) => {
          const amounts = Object.entries(summary).filter(([, values]) => values[card.key] > 0);
          return (
            <article className={card.key === "overdue" ? "pay-summary-card pay-summary-card--alert" : "pay-summary-card"} key={card.key}>
              <header><span>{card.icon}</span><small>{card.title}</small></header>
              <div className="pay-summary-card__amounts">
                {amounts.length ? amounts.map(([currency, values]) => (
                  <strong key={currency}>{formatPaymentAmount(values[card.key], currency)}</strong>
                )) : <strong>0</strong>}
              </div>
              <p>{card.text}</p>
            </article>
          );
        })}
      </div>

      <section className="pay-records" aria-label="Ödeme kayıtları">
        <div className="pay-records__head">
          <div>
            <span className="section-kicker">ÖDEME KAYITLARI</span>
            <h2>Taşıma finans hareketleri</h2>
            <p>{visiblePayments.length} kayıt gösteriliyor</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <label className="pay-sort-label">
              <span>Sırala</span>
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} aria-label="Ödemeleri sırala">
                <option value="newest">Vadeye göre (yakın önce)</option>
                <option value="oldest">Vadeye göre (uzak önce)</option>
                <option value="amount-desc">Tutara göre (yüksek)</option>
                <option value="amount-asc">Tutara göre (düşük)</option>
                <option value="due">En yakın vade</option>
              </select>
            </label>
            <ExportButton
              formats={["xlsx", "pdf"]}
              onExport={handlePaymentExport}
              disabled={visiblePayments.length === 0}
            />
          </div>
        </div>

        <div className="pay-filters">
          <label className="pay-search">
            <Search size={15} aria-hidden="true" />
            <input
              value={filters.query}
              onChange={(event) => updateFilter("query", event.target.value)}
              placeholder="Yük, sevkiyat veya işlem no ara"
              aria-label="Ödeme kayıtlarında ara"
            />
            {filters.query && <button onClick={() => updateFilter("query", "")} aria-label="Aramayı temizle"><X size={13} /></button>}
          </label>
          <label><span>Durum</span><select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}><option value="ALL">Tümü</option>{Object.entries(PAYMENT_STATUSES).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label><span>Vade / ödeme tarihi</span><input type="date" value={filters.date} onChange={(event) => updateFilter("date", event.target.value)} /></label>
          <label><span>Taşıyıcı</span><select value={filters.carrier} onChange={(event) => updateFilter("carrier", event.target.value)}><option value="ALL">Tümü</option>{carriers.map((carrier) => <option key={carrier}>{carrier}</option>)}</select></label>
          <label><span>Para birimi</span><select value={filters.currency} onChange={(event) => updateFilter("currency", event.target.value)}><option value="ALL">Tümü</option>{currencies.map((currency) => <option key={currency}>{currency}</option>)}</select></label>
          <button className="pay-reset" type="button" onClick={() => setFilters(EMPTY_PAYMENT_FILTERS)}>Filtreleri temizle</button>
        </div>

        {loadingPayments ? (
          <div className="pay-empty" role="status"><Clock3/><h3>Finans kayıtları yükleniyor</h3><p>Yetkili ledger kayıtlarınız hazırlanıyor.</p></div>
        ) : !visiblePayments.length ? (
          <div className="pay-empty" role="status">
            <CreditCard />
            <h3>{payments.length ? "Filtrelerle eşleşen ödeme bulunamadı" : "Henüz finans kaydı bulunmuyor"}</h3>
            <p>{payments.length ? "Arama ölçütlerini temizleyerek diğer kayıtları görüntüleyebilirsiniz." : live ? "Bir ödeme güvence kaydı oluştuğunda burada gösterilecek; sahte production verisi üretilmez." : "Henüz demo ödeme kaydı bulunmuyor."}</p>
            {payments.length > 0 && <button type="button" onClick={() => setFilters(EMPTY_PAYMENT_FILTERS)}>Filtreleri temizle</button>}
          </div>
        ) : (
          <div className="pay-table-wrap">
            <table className="pay-table">
              <thead><tr><th>İşlem</th><th>Yük / sevkiyat</th><th>Taşıyıcı</th><th>Tutar</th><th>Koşul ve vade</th><th>Durum</th><th>Dekont</th><th><span className="sr-only">Detay</span></th></tr></thead>
              <tbody>
                {visiblePayments.map((payment) => (
                  <tr key={payment.id}>
                    <td data-label="İşlem"><strong>{payment.id}</strong><small>{payment.demo ? "Demo kayıt" : "Finans kaydı"}</small></td>
                    <td data-label="Yük / sevkiyat"><strong>{payment.loadTitle || payment.loadId}</strong><small>{payment.loadId} · {payment.shipmentId}</small></td>
                    <td data-label="Taşıyıcı"><strong>{payment.carrier}</strong><small>{payment.route}</small></td>
                    <td data-label="Tutar"><strong>{formatPaymentAmount(payment.amount, payment.currency)}</strong><small>{payment.currency}</small></td>
                    <td data-label="Koşul ve tarihler">
                      <strong>{payment.paymentTerm}</strong>
                      <small>Vade: {payment.dueDate ? new Date(`${payment.dueDate}T00:00:00`).toLocaleDateString("tr-TR") : "Tanımlanmadı"}</small>
                      <small>Ödeme: {payment.paidDate ? new Date(`${payment.paidDate}T00:00:00`).toLocaleDateString("tr-TR") : "—"}</small>
                      {payment.createdDate && <small>Kayıt: {new Date(`${payment.createdDate}T00:00:00`).toLocaleDateString("tr-TR")}</small>}
                    </td>
                    <td data-label="Durum"><span className={paymentStatusClass(payment.status)}>{paymentStatusLabel(payment.status)}</span></td>
                    <td data-label="Dekont"><span className={`pay-doc pay-doc--${String(payment.documentStatus || "missing").toLowerCase()}`}>{paymentDocumentLabel(payment.documentStatus)}</span></td>
                    <td><button className="pay-detail-button" type="button" onClick={() => setSelected(payment)} aria-label={`${payment.id} ödeme detayını aç`}>Detay <ChevronRight size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="pay-demo-note"><ShieldCheck size={14} /> {live ? "Canlı ledger yalnızca ödeme hazırlığı ve güvence durumunu gösterir; SECURED durumu taşıyıcıya ödeme yapıldığı anlamına gelmez." : "Bu ekran yalnızca demo finans kayıtlarını gösterir; para transferi yapmaz ve banka/kart bilgisi istemez."}</p>

      {selected && (
        <div className="pay-detail-backdrop" role="presentation" onMouseDown={() => setSelected(null)}>
          <aside className="pay-detail" role="dialog" aria-modal="true" aria-labelledby="payment-detail-title" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div><span className="section-kicker">ÖDEME DETAYI</span><h2 id="payment-detail-title">{selected.id}</h2></div>
              <button onClick={() => setSelected(null)} aria-label="Ödeme detayını kapat"><X /></button>
            </header>
            <div className="pay-detail__hero"><span>{formatPaymentAmount(selected.amount, selected.currency)}</span><b className={paymentStatusClass(selected.status)}>{paymentStatusLabel(selected.status)}</b></div>
            <dl>
              <div><dt>İlgili yük</dt><dd>{selectedLoad?.cargo || selected.loadTitle || selected.loadId}<small>{selected.loadId}</small></dd></div>
              <div><dt>Sevkiyat</dt><dd>{selectedShipment?.id || selected.shipmentId}</dd></div>
              <div><dt>Kabul edilen teklif</dt><dd>{selected.offerId || "—"}</dd></div>
              <div><dt>Taşıyıcı</dt><dd>{selected.carrier}</dd></div>
              <div><dt>Güzergâh</dt><dd>{selectedLoad ? `${selectedLoad.from} → ${selectedLoad.to}` : selected.route}</dd></div>
              <div><dt>Ödeme koşulu</dt><dd>{selected.paymentTerm}</dd></div>
              <div><dt>Vade tarihi</dt><dd>{selected.dueDate ? new Date(`${selected.dueDate}T00:00:00`).toLocaleDateString("tr-TR") : "Tanımlanmadı"}</dd></div>
              <div><dt>Ödeme tarihi</dt><dd>{selected.paidDate ? new Date(`${selected.paidDate}T00:00:00`).toLocaleDateString("tr-TR") : "Henüz ödenmedi"}</dd></div>
              {selected.providerReference && <div><dt>Sağlayıcı referansı</dt><dd>{selected.providerReference}</dd></div>}
            </dl>
            <section className="pay-detail__document">
              <FileText />
              <div><small>BELGE / DEKONT</small><strong>{paymentDocumentLabel(selected.documentStatus)}</strong></div>
              {["AVAILABLE", "PENDING_REVIEW"].includes(selected.documentStatus) && <button type="button" onClick={() => { setSelected(null); onNavigate?.("Belgeler"); }}>Belgeler bölümüne git <ArrowRight size={13} /></button>}
            </section>
            {selected.note && <p className="pay-detail__note"><AlertTriangle size={14} /> {selected.note}</p>}
          </aside>
        </div>
      )}
    </section>
  );
}

function LiveRoute() {
  const stops = [
    { city: "Bergen", country: "Norveç", time: "Tamamlandı" },
    { city: "Oslo", country: "Norveç", time: "Bugün 16:40" },
    { city: "Hamburg", country: "Almanya", time: "Yarın 14:10" },
    { city: "Münih", country: "Almanya", time: "12 Eyl · 08:30" },
    { city: "Milano", country: "İtalya", time: "12 Eyl · 15:20" },
  ];
  return (
    <section className="feature-page">
      <PageHeading
        kicker="CANLI ROTA & ETA"
        title="Bergen'den Milano'ya, her adım görünür."
        text="Konum, sınır geçişleri ve tahmini teslimat zamanı operasyon ekibiyle paylaşılır."
        action={
          <div className="driver-online">
            <i /> Konum paylaşımı açık
          </div>
        }
      />
      <div className="live-route-card">
        <div className="map-stage">
          <div className="map-grid" />
          <div className="map-route">
            <span className="map-pin start">Bergen</span>
            <i />
            <i />
            <span className="truck-marker">
              <Truck />
            </span>
            <i />
            <span className="map-pin finish">Milano</span>
          </div>
          <div className="eta-card">
            <small>TAHMİNİ VARIŞ</small>
            <strong>12 Eylül · 15:20</strong>
            <span>1.846 km kaldı · 24 sa 40 dk</span>
          </div>
        </div>
        <div className="route-stops">
          <h2>Rota zaman çizelgesi</h2>
          {stops.map((stop, index) => (
            <div
              className={
                index === 0
                  ? "route-stop done"
                  : index === 1
                    ? "route-stop current"
                    : "route-stop"
              }
              key={stop.city}
            >
              <span>
                {index === 0 ? (
                  <Check />
                ) : index === 1 ? (
                  <Navigation />
                ) : (
                  index + 1
                )}
              </span>
              <div>
                <strong>
                  {stop.city}, {stop.country}
                </strong>
                <small>{stop.time}</small>
              </div>
            </div>
          ))}
          <div className="route-alert">
            <AlertTriangle />
            <div>
              <strong>Hamburg çevresinde yoğunluk</strong>
              <small>ETA otomatik olarak 25 dakika güncellendi.</small>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TachographCenter() {
  const [resting, setResting] = useState(false);
  const [minutes, setMinutes] = useState(255);
  function toggle() {
    setResting((x) => !x);
    if (resting) setMinutes((x) => Math.max(0, x - 15));
  }
  const hours = Math.floor(minutes / 60),
    mins = minutes % 60;
  return (
    <section className="feature-page">
      <PageHeading
        kicker="SÜRÜŞ & DİNLENME UYUMU"
        title="Takograf sürenizi kontrol altında tutun."
        text="Günlük sürüş, mola ve haftalık dinlenme limitlerini rota planıyla birlikte izleyin."
      />
      <div className="tachograph-grid">
        <article className="tacho-main">
          <div className="tacho-top">
            <span className={resting ? "tacho-state resting" : "tacho-state"}>
              {resting ? <PauseCircle /> : <Truck />}
              {resting ? "Molada" : "Sürüşte"}
            </span>
            <span className="integration-note">
              Takograf API entegrasyonuna hazır
            </span>
          </div>
          <small>KALAN GÜNLÜK SÜRÜŞ</small>
          <strong>
            {hours} sa {mins} dk
          </strong>
          <div className="tacho-progress">
            <i style={{ width: `${Math.min(100, (minutes / 540) * 100)}%` }} />
          </div>
          <button className="portal-primary" onClick={toggle}>
            {resting ? "Sürüşü yeniden başlat" : "Molayı başlat"}
          </button>
        </article>
        <article className="tacho-stat">
          <Clock3 />
          <span>Sonraki zorunlu mola</span>
          <strong>1 sa 12 dk</strong>
          <small>45 dakika dinlenme gerekli</small>
        </article>
        <article className="tacho-stat">
          <Timer />
          <span>Haftalık sürüş</span>
          <strong>31 sa 20 dk</strong>
          <small>56 saat sınırının altında</small>
        </article>
        <article className="tacho-stat safe">
          <ShieldCheck />
          <span>Uyum durumu</span>
          <strong>Uygun</strong>
          <small>Aktif ihlal bulunmuyor</small>
        </article>
      </div>
      <div className="compliance-alert">
        <BadgeCheck />
        <div>
          <strong>Rota mola planıyla uyumlu</strong>
          <p>
            Oslo sonrası planlanan durak, AB sürüş ve dinlenme kurgusuna göre
            rota zaman çizelgesine eklendi.
          </p>
        </div>
      </div>
    </section>
  );
}

function JobGrid({
  data,
  accepted,
  onAccept,
  savedLoadIds = [],
  onToggleSave,
  onView,
}) {
  const [detail, setDetail] = useState(null);
  return (
    <>
      <section className="job-grid">
        {data.map((job) => (
          <article
            className="job-card"
            key={job.id}
            onClick={() => {
              setDetail(job);
              onView?.(job);
            }}
          >
            <div className="job-card-header">
              <div className="match-score">%{job.match} uygun</div>
              <BookmarkButton
                loadId={job.id}
                saved={savedLoadIds.includes(job.id)}
                onToggle={onToggleSave}
              />
            </div>
            <div className="job-top">
              <span>{job.id}</span>
              <strong>{job.price}</strong>
            </div>
            <h3>{job.cargo}</h3>
            <div className="job-route">
              <div>
                <i />
                <span>
                  <small>KALKIŞ</small>
                  <strong>{job.from}</strong>
                </span>
              </div>
              <div className="route-line" />
              <div>
                <i />
                <span>
                  <small>VARIŞ</small>
                  <strong>{job.to}</strong>
                </span>
              </div>
            </div>
            {job.matchReasons && (
              <div className="match-reasons">
                {job.matchReasons.slice(0, 3).map((reason) => (
                  <span key={reason}>
                    <Check /> {reason}
                  </span>
                ))}
              </div>
            )}
            <div className="job-meta">
              <span>
                <Truck /> {job.vehicle}
              </span>
              <span>
                <Weight /> {job.weight}
              </span>
              <span>
                <MapPin /> {job.distance}
              </span>
              <span>
                <Clock3 /> {job.date}
              </span>
            </div>
            <div className="job-company">
              <span>{job.company[0]}</span>
              <div>
                <strong>{job.company}</strong>
                <small>
                  <ShieldCheck /> Doğrulanmış firma
                </small>
              </div>
            </div>
            <button
              disabled={accepted.includes(job.id)}
              onClick={(event) => {
                event.stopPropagation();
                onAccept(job);
              }}
              className={accepted.includes(job.id) ? "accepted" : ""}
            >
              {accepted.includes(job.id) ? (
                <>
                  <Check /> Teklif gönderildi
                </>
              ) : (
                <>
                  Teklif ver <ArrowRight />
                </>
              )}
            </button>
          </article>
        ))}
      </section>
      {detail && (
        <LoadDetailDrawer
          load={detail}
          onClose={() => setDetail(null)}
          onOffer={(job) => {
            onAccept(job);
            setDetail(null);
          }}
          onMessage={() => setDetail(null)}
        />
      )}
    </>
  );
}
function EmptyState({ icon, title, text, action }) {
  return (
    <div className="portal-empty">
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action && (
        <button onClick={action}>
          Uygun işleri gör <ArrowRight />
        </button>
      )}
    </div>
  );
}
