import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Shield,
  Settings as SettingsIcon,
  Users,
  Database,
  Save,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";

// Ayarları tarayıcıda saklayacağım key
const STORAGE_KEY = "logiway_settings_v1";

// Sistem ilk açıldığında kullanılacak varsayılan ayarlar
const defaultSettings = {
  general: {
    brandName: "Logiway Control Center",
    timezone: "Europe/Istanbul",
    language: "tr-TR",
    dateFormat: "DD.MM.YYYY",
    theme: "system", // system | light | dark
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    dailySummary: true,
    incidentAlerts: true,
  },
  security: {
    twoFactorAuth: false,
    sessionTimeoutMinutes: 30,
    passwordMinLength: 8,
    passwordRequireNumbers: true,
    passwordRequireSymbols: false,
    loginIpRestriction: false,
  },
  matching: {
    autoMatchEnabled: true,
    minScore: 60,
    maxDistanceKm: 700,
    capacityTolerancePercent: 8,
  },
  roles: {
    allowNewAdmins: false,
    defaultRole: "operator", // admin | operator | viewer
  },
  system: {
    environment: "dev", // dev | staging | prod
    apiBaseUrl: "",
    logLevel: "info", // debug | info | warn | error
    maintenanceMode: false,
  },
};

// State referans problemleri yaşamamak için derin kopya
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Sayısal değerleri mantıklı aralıkta tutmak için
function clamp(n, min, max) {
  const x = Number(n);
  if (Number.isNaN(x)) return min;
  return Math.min(Math.max(x, min), max);
}

export default function Settings() {
  // Sol menüde hangi sekmedeyim
  const [tab, setTab] = useState("general");

  // Kaydedildi bildirimi + hata mesajı
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Mevcut ayarlar ve en son kaydedilmiş snapshot
  const [settings, setSettings] = useState(() => deepClone(defaultSettings));
  const [initialSnapshot, setInitialSnapshot] = useState(() =>
    deepClone(defaultSettings)
  );

  // Sayfa açılınca localStorage'dan ayar varsa çekiyorum
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);

      // Eski sürüm/eksik alanlar varsa default ile merge ediyorum
      const merged = {
        ...deepClone(defaultSettings),
        ...parsed,
        general: {
          ...deepClone(defaultSettings.general),
          ...(parsed.general || {}),
        },
        notifications: {
          ...deepClone(defaultSettings.notifications),
          ...(parsed.notifications || {}),
        },
        security: {
          ...deepClone(defaultSettings.security),
          ...(parsed.security || {}),
        },
        matching: {
          ...deepClone(defaultSettings.matching),
          ...(parsed.matching || {}),
        },
        roles: { ...deepClone(defaultSettings.roles), ...(parsed.roles || {}) },
        system: {
          ...deepClone(defaultSettings.system),
          ...(parsed.system || {}),
        },
      };

      setSettings(merged);
      setInitialSnapshot(deepClone(merged));
    } catch {
      // Bozuk JSON varsa takılmadan default ile devam
    }
  }, []);

  // Kullanıcı bir şey değiştirmiş mi kontrolü (Kaydet/Geri Al için)
  const isDirty = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(initialSnapshot);
  }, [settings, initialSnapshot]);

  // "general.brandName" gibi path ile merkezi güncelleme
  function update(path, value) {
    const [group, key] = path.split(".");
    setSettings((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: value,
      },
    }));
  }

  // Validasyonlardan sonra ayarları kalıcı hale getiriyorum
  function save() {
    setSaveError("");

    if (!settings.general.brandName.trim()) {
      setSaveError("Marka adı boş olamaz.");
      return;
    }
    if (settings.security.passwordMinLength < 6) {
      setSaveError("Minimum şifre uzunluğu en az 6 olmalı.");
      return;
    }
    if (settings.security.sessionTimeoutMinutes < 5) {
      setSaveError("Oturum süresi en az 5 dk olmalı.");
      return;
    }
    if (settings.matching.minScore < 0 || settings.matching.minScore > 100) {
      setSaveError("Minimum skor 0–100 arasında olmalı.");
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setInitialSnapshot(deepClone(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  // Kaydedilmemiş değişiklikleri geri alıyorum
  function discardChanges() {
    setSettings(deepClone(initialSnapshot));
    setSaveError("");
  }

  // Her şeyi varsayılan ayarlara çekiyorum (kaydetmeden)
  function resetDefaults() {
    setSettings(deepClone(defaultSettings));
    setSaveError("");
  }

  return (
    <div className="space-y-6 p-4">
      {/* Üst başlık + aksiyonlar */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Ayarlar</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sistem davranışı, güvenlik, bildirim ve eşleşme kuralları
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={discardChanges}
            disabled={!isDirty}
            className={[
              "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition",
              !isDirty ? "cursor-not-allowed opacity-50" : "hover:bg-gray-50",
            ].join(" ")}
            title="Kaydedilmemiş değişiklikleri geri al"
          >
            <RotateCcw size={16} />
            Geri Al
          </button>

          <button
            onClick={save}
            disabled={!isDirty}
            className={[
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white transition",
              !isDirty
                ? "cursor-not-allowed bg-slate-400"
                : "bg-slate-900 hover:bg-slate-800",
            ].join(" ")}
            title="Ayarları kaydet"
          >
            <Save size={16} />
            Kaydet
          </button>
        </div>
      </div>

      {/* Durum göstergeleri */}
      <div className="flex flex-wrap items-center gap-3">
        <StatusPill
          type={saved ? "success" : isDirty ? "info" : "neutral"}
          text={
            saved
              ? "Kaydedildi"
              : isDirty
              ? "Kaydedilmemiş değişiklikler var"
              : "Tüm ayarlar güncel"
          }
        />
        {saveError && <StatusPill type="error" text={saveError} />}
      </div>

      {/* Sol sekmeler + sağ içerik */}
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="rounded-2xl border bg-white p-3 shadow-sm">
          <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Modüller
          </div>

          <TabButton
            active={tab === "general"}
            icon={<SettingsIcon size={16} />}
            label="Genel"
            onClick={() => setTab("general")}
          />
          <TabButton
            active={tab === "notifications"}
            icon={<Bell size={16} />}
            label="Bildirimler"
            onClick={() => setTab("notifications")}
          />
          <TabButton
            active={tab === "security"}
            icon={<Shield size={16} />}
            label="Güvenlik"
            onClick={() => setTab("security")}
          />
          <TabButton
            active={tab === "matching"}
            icon={<Info size={16} />}
            label="Eşleşme Kuralları"
            onClick={() => setTab("matching")}
          />
          <TabButton
            active={tab === "roles"}
            icon={<Users size={16} />}
            label="Roller & Yetkiler"
            onClick={() => setTab("roles")}
          />
          <TabButton
            active={tab === "system"}
            icon={<Database size={16} />}
            label="Sistem"
            onClick={() => setTab("system")}
          />

          <div className="mt-3 border-t pt-3">
            <button
              onClick={resetDefaults}
              className="w-full rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
              title="Varsayılan ayarlara dön"
            >
              Varsayılanlara Dön
            </button>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          {tab === "general" && (
            <Section
              title="Genel Ayarlar"
              desc="Panel ismi, dil ve görünüm gibi temel seçenekler."
            >
              <Row>
                <TextInput
                  label="Panel / Marka Adı"
                  value={settings.general.brandName}
                  onChange={(v) => update("general.brandName", v)}
                  placeholder="Örn: Logiway Control Center"
                />
              </Row>

              <Row cols={3}>
                <Select
                  label="Dil"
                  value={settings.general.language}
                  onChange={(v) => update("general.language", v)}
                  options={[
                    { value: "tr-TR", label: "Türkçe (TR)" },
                    { value: "en-US", label: "English (US)" },
                  ]}
                />
                <Select
                  label="Saat Dilimi"
                  value={settings.general.timezone}
                  onChange={(v) => update("general.timezone", v)}
                  options={[
                    { value: "Europe/Istanbul", label: "Europe/Istanbul" },
                    { value: "Europe/Berlin", label: "Europe/Berlin" },
                    { value: "UTC", label: "UTC" },
                  ]}
                />
                <Select
                  label="Tema"
                  value={settings.general.theme}
                  onChange={(v) => update("general.theme", v)}
                  options={[
                    { value: "system", label: "Sistem" },
                    { value: "light", label: "Açık" },
                    { value: "dark", label: "Koyu" },
                  ]}
                />
              </Row>

              <Row>
                <Select
                  label="Tarih Formatı"
                  value={settings.general.dateFormat}
                  onChange={(v) => update("general.dateFormat", v)}
                  options={[
                    { value: "DD.MM.YYYY", label: "DD.MM.YYYY (03.02.2026)" },
                    { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2026-02-03)" },
                  ]}
                />
              </Row>
            </Section>
          )}

          {tab === "notifications" && (
            <Section
              title="Bildirim Ayarları"
              desc="Operasyon uyarıları ve günlük özet gibi bildirimleri yönet."
            >
              <ToggleRow
                label="E-posta Bildirimleri"
                value={settings.notifications.emailEnabled}
                onChange={() =>
                  update(
                    "notifications.emailEnabled",
                    !settings.notifications.emailEnabled
                  )
                }
              />
              <ToggleRow
                label="SMS Bildirimleri"
                value={settings.notifications.smsEnabled}
                onChange={() =>
                  update(
                    "notifications.smsEnabled",
                    !settings.notifications.smsEnabled
                  )
                }
              />
              <ToggleRow
                label="Push Bildirimleri"
                value={settings.notifications.pushEnabled}
                onChange={() =>
                  update(
                    "notifications.pushEnabled",
                    !settings.notifications.pushEnabled
                  )
                }
              />

              <div className="mt-4 border-t pt-4">
                <ToggleRow
                  label="Günlük Özet (09:00)"
                  value={settings.notifications.dailySummary}
                  onChange={() =>
                    update(
                      "notifications.dailySummary",
                      !settings.notifications.dailySummary
                    )
                  }
                />
                <ToggleRow
                  label="Olay / Hata Uyarıları"
                  value={settings.notifications.incidentAlerts}
                  onChange={() =>
                    update(
                      "notifications.incidentAlerts",
                      !settings.notifications.incidentAlerts
                    )
                  }
                />
              </div>
            </Section>
          )}

          {tab === "security" && (
            <Section
              title="Güvenlik"
              desc="Oturum ve şifre politikalarını burada yönet."
            >
              <ToggleRow
                label="İki Adımlı Doğrulama (2FA)"
                value={settings.security.twoFactorAuth}
                onChange={() =>
                  update(
                    "security.twoFactorAuth",
                    !settings.security.twoFactorAuth
                  )
                }
              />

              <Row cols={2}>
                <NumberInput
                  label="Oturum Süresi (dk)"
                  value={settings.security.sessionTimeoutMinutes}
                  min={5}
                  max={240}
                  onChange={(v) =>
                    update(
                      "security.sessionTimeoutMinutes",
                      clamp(v, 5, 240)
                    )
                  }
                />
                <NumberInput
                  label="Min. Şifre Uzunluğu"
                  value={settings.security.passwordMinLength}
                  min={6}
                  max={32}
                  onChange={(v) =>
                    update("security.passwordMinLength", clamp(v, 6, 32))
                  }
                />
              </Row>

              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <ToggleRow
                  label="Şifre: sayı zorunlu"
                  value={settings.security.passwordRequireNumbers}
                  onChange={() =>
                    update(
                      "security.passwordRequireNumbers",
                      !settings.security.passwordRequireNumbers
                    )
                  }
                />
                <ToggleRow
                  label="Şifre: sembol zorunlu"
                  value={settings.security.passwordRequireSymbols}
                  onChange={() =>
                    update(
                      "security.passwordRequireSymbols",
                      !settings.security.passwordRequireSymbols
                    )
                  }
                />
              </div>

              <div className="mt-4 border-t pt-4">
                <ToggleRow
                  label="Girişlerde IP kısıtı (opsiyonel)"
                  value={settings.security.loginIpRestriction}
                  onChange={() =>
                    update(
                      "security.loginIpRestriction",
                      !settings.security.loginIpRestriction
                    )
                  }
                />
                <p className="mt-2 text-xs text-gray-500">
                  Not: IP whitelist/blacklist backend ile entegre edilir.
                </p>
              </div>
            </Section>
          )}

          {tab === "matching" && (
            <Section
              title="Eşleşme Kuralları"
              desc="Eşleşme skoruna göre otomatik eşleşme kriterlerini belirle."
            >
              <ToggleRow
                label="Otomatik Eşleşme Aktif"
                value={settings.matching.autoMatchEnabled}
                onChange={() =>
                  update(
                    "matching.autoMatchEnabled",
                    !settings.matching.autoMatchEnabled
                  )
                }
              />

              <Row cols={3}>
                <NumberInput
                  label="Min. Skor"
                  value={settings.matching.minScore}
                  min={0}
                  max={100}
                  onChange={(v) =>
                    update("matching.minScore", clamp(v, 0, 100))
                  }
                />
                <NumberInput
                  label="Max. Mesafe (km)"
                  value={settings.matching.maxDistanceKm}
                  min={50}
                  max={5000}
                  onChange={(v) =>
                    update("matching.maxDistanceKm", clamp(v, 50, 5000))
                  }
                />
                <NumberInput
                  label="Kapasite Toleransı (%)"
                  value={settings.matching.capacityTolerancePercent}
                  min={0}
                  max={25}
                  onChange={(v) =>
                    update(
                      "matching.capacityTolerancePercent",
                      clamp(v, 0, 25)
                    )
                  }
                />
              </Row>

              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <Info size={16} />
                  Örnek Kural
                </div>
                <div className="mt-2">
                  Min skor <b>{settings.matching.minScore}</b> altındaysa eşleşme{" "}
                  <b>otomatik</b> önerilmez. Max mesafe{" "}
                  <b>{settings.matching.maxDistanceKm} km</b>.
                </div>
              </div>
            </Section>
          )}

          {tab === "roles" && (
            <Section
              title="Roller & Yetkiler"
              desc="Temel rol politikalarını belirle (detaylı yetki matrisi ileride)."
            >
              <Row cols={2}>
                <Select
                  label="Varsayılan Rol"
                  value={settings.roles.defaultRole}
                  onChange={(v) => update("roles.defaultRole", v)}
                  options={[
                    { value: "admin", label: "Admin" },
                    { value: "operator", label: "Operasyon" },
                    { value: "viewer", label: "İzleyici" },
                  ]}
                />
                <ToggleRow
                  label="Yeni Admin eklemeye izin ver"
                  value={settings.roles.allowNewAdmins}
                  onChange={() =>
                    update(
                      "roles.allowNewAdmins",
                      !settings.roles.allowNewAdmins
                    )
                  }
                />
              </Row>

              <div className="mt-4 rounded-xl border p-4">
                <div className="text-sm font-semibold">Rol açıklamaları</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
                  <li>
                    <b>Admin:</b> tüm modüller + ayarlar
                  </li>
                  <li>
                    <b>Operasyon:</b> eşleşmeler/ilanlar yönetimi
                  </li>
                  <li>
                    <b>İzleyici:</b> sadece görüntüleme
                  </li>
                </ul>
              </div>
            </Section>
          )}

          {tab === "system" && (
            <Section
              title="Sistem"
              desc="Ortam, log seviyesi ve bakım modu gibi sistem ayarları."
            >
              <Row cols={2}>
                <Select
                  label="Ortam"
                  value={settings.system.environment}
                  onChange={(v) => update("system.environment", v)}
                  options={[
                    { value: "dev", label: "Development" },
                    { value: "staging", label: "Staging" },
                    { value: "prod", label: "Production" },
                  ]}
                />
                <Select
                  label="Log Seviyesi"
                  value={settings.system.logLevel}
                  onChange={(v) => update("system.logLevel", v)}
                  options={[
                    { value: "debug", label: "debug" },
                    { value: "info", label: "info" },
                    { value: "warn", label: "warn" },
                    { value: "error", label: "error" },
                  ]}
                />
              </Row>

              <Row>
                <TextInput
                  label="API Base URL (opsiyonel)"
                  value={settings.system.apiBaseUrl}
                  onChange={(v) => update("system.apiBaseUrl", v)}
                  placeholder="Örn: https://api.logiway.com"
                />
              </Row>

              <ToggleRow
                label="Bakım Modu"
                value={settings.system.maintenanceMode}
                onChange={() =>
                  update(
                    "system.maintenanceMode",
                    !settings.system.maintenanceMode
                  )
                }
              />

              <p className="mt-2 text-xs text-gray-500">
                Not: Bakım modu aktifken kullanıcı tarafı girişleri kısıtlanabilir
                (backend kuralı).
              </p>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- UI Helpers ---------------- */

function TabButton({ active, icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
        active ? "bg-slate-900 text-white" : "hover:bg-slate-50 text-slate-700",
      ].join(" ")}
    >
      <span className={active ? "opacity-100" : "opacity-70"}>{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );
}

function Section({ title, desc, children }) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-semibold text-slate-900">{title}</div>
        <div className="mt-1 text-sm text-slate-500">{desc}</div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Row({ children, cols = 1 }) {
  const grid =
    cols === 1
      ? "grid grid-cols-1 gap-4"
      : cols === 2
      ? "grid grid-cols-1 gap-4 sm:grid-cols-2"
      : "grid grid-cols-1 gap-4 sm:grid-cols-3";
  return <div className={grid}>{children}</div>;
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium text-slate-900">{label}</div>
      {children}
      {hint && <div className="text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder }) {
  return (
    <Field label={label}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
      />
    </Field>
  );
}

function NumberInput({ label, value, onChange, min, max }) {
  return (
    <Field label={label} hint={`Aralık: ${min} – ${max}`}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
      />
    </Field>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function ToggleRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
      <div className="text-sm font-medium text-slate-900">{label}</div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={onChange}
      className={[
        "relative h-6 w-11 rounded-full transition",
        value ? "bg-emerald-500" : "bg-gray-300",
      ].join(" ")}
      aria-pressed={value}
    >
      <span
        className={[
          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition",
          value ? "left-5" : "left-0.5",
        ].join(" ")}
      />
    </button>
  );
}

function StatusPill({ type, text }) {
  const map = {
    neutral: { icon: <Info size={16} />, cls: "bg-slate-100 text-slate-700" },
    info: { icon: <Info size={16} />, cls: "bg-amber-100 text-amber-800" },
    success: {
      icon: <CheckCircle2 size={16} />,
      cls: "bg-emerald-100 text-emerald-800",
    },
    error: { icon: <XCircle size={16} />, cls: "bg-rose-100 text-rose-800" },
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${map[type].cls}`}
    >
      {map[type].icon}
      <span>{text}</span>
    </div>
  );
}
