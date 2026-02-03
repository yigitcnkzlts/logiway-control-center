import { useEffect, useState } from "react";
import { Bell, Shield, Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    twoFactorAuth: false,
    autoMatch: true,
  });
  useEffect(() => {
    const saved = localStorage.getItem("logiway_settings");
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  function toggle(key) {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function saveSettings() {
    localStorage.setItem("logiway_settings", JSON.stringify(settings));
    alert("Ayarlar kaydedildi");
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Ayarlar</h1>
        <p className="mt-1 text-sm text-gray-500">
          Sistem davranışı ve bildirim tercihleri
        </p>
      </div>

      {/* Notification Settings */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 font-semibold">
          <Bell size={18} />
          Bildirimler
        </div>

        <Toggle
          label="E-posta bildirimleri"
          value={settings.emailNotifications}
          onChange={() => toggle("emailNotifications")}
        />

        <Toggle
          label="SMS bildirimleri"
          value={settings.smsNotifications}
          onChange={() => toggle("smsNotifications")}
        />
      </div>

      {/* Security Settings */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 font-semibold">
          <Shield size={18} />
          Güvenlik
        </div>

        <Toggle
          label="İki adımlı doğrulama (2FA)"
          value={settings.twoFactorAuth}
          onChange={() => toggle("twoFactorAuth")}
        />
      </div>

      {/* System Settings */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 font-semibold">
          <SettingsIcon size={18} />
          Sistem
        </div>

        <Toggle
          label="Otomatik eşleşme aktif"
          value={settings.autoMatch}
          onChange={() => toggle("autoMatch")}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
        >
          Kaydet
        </button>
      </div>
    </div>
  );
}

/* ---------- küçük toggle component ---------- */
function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">{label}</span>
      <button
        onClick={onChange}
        className={[
          "relative h-6 w-11 rounded-full transition",
          value ? "bg-emerald-500" : "bg-gray-300",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-5 w-5 rounded-full bg-white transition",
            value ? "left-5" : "left-0.5",
          ].join(" ")}
        />
      </button>
    </div>
  );
}
 