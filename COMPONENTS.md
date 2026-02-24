# 📋 Logiway Control Center - Frontend Komponentleri

## ✅ Tamamlanan Komponentler

### 🎨 Temel UI Komponentleri

- **Button** - 4 varyant (primary, secondary, outline, danger)
- **Input** - Form input alanları
- **Select** - Dropdown seçim
- **Checkbox** - Seçim kutuları
- **Radio** - Radio butonlar
- **Textarea** - Metin alanları
- **Modal** - Açılır pencereleri
- **Card** - İçerik kartları

### 📊 Gelişmiş Komponentler

- **Table** - Sıralama ve seçim desteği
- **DataTable** - Arama, filtreleme, sıralama, pagination
- **ProgressBar** - İlerleme göstergeleri
- **Timeline** - Zaman çizelgesi
- **Avatar** - Kullanıcı profil görseli
- **Tooltip** - Bilgi uçları
- **Dropdown** - Açılır menüler

### 📢 Bildirim Sistemi

- **Toast** - Success, Error, Warning, Info mesajları
- **AlertBanner** - Sayfa başında uyarılar
- **ConfirmDialog** - Onay diyalogları

### 🎯 Dashboard Komponentleri

- **MetricCard** - İstatistik kartları
- **SectionHeader** - Bölüm başlıkları
- **PanelToolbar** - Panel araç çubukları
- **ShimmerEffect** - Loading animasyonu

### 📦 Utility Komponentleri

- **FormGroup** - Form alan gruplayıcısı
- **FormModal** - Form modalı (Create/Edit)
- **Tabs** - Sekme kontrolü
- **Divider** - Ayırıcı çizgiler
- **StatusBadge** - Durum rozetleri
- **Badge** - Renkli etiketler
- **Stat** - İstatistik blokları
- **InfoGroup** - Bilgi grupları
- **EmptyState** - Boş durum görseli
- **Skeleton** - Loading placeholder'ları

### 🎨 Layout Komponentleri

- **PanelLayout** - Panel temel layout'u
- **Sidebar** - Profesyonel sidebar
- **Navbar** - Üst navigasyon
- **MainLayout** - Ana layout

## 🚀 Hızlı Başlangıç

### 1. Toast Kullanımı

```jsx
import { useToast } from "../hooks/useToast";

function MyComponent() {
  const toast = useToast();

  return <button onClick={() => toast.success("Başarılı!")}>Test Et</button>;
}
```

### 2. DataTable Kullanımı

```jsx
import DataTable from "../components/common/DataTable";

<DataTable
  columns={[
    { key: "id", label: "ID", sortable: true },
    { key: "name", label: "Ad" },
    { key: "status", label: "Durum" },
  ]}
  data={myData}
  searchFields={["name", "id"]}
  filters={[
    {
      key: "status",
      label: "Durum",
      options: [{ label: "Aktif", value: "active" }],
    },
  ]}
/>;
```

### 3. Panel Sayfası Template

Tüm panel sayfaları için:

- `src/pages/TemplatePanel.jsx` dosyasını inceyin
- Kendi verilerinizle adapt edin
- Toast, Modal, Export hepsi hazır!

## 📁 Dosya Yapısı

```
src/
├── components/
│   ├── common/          # Genel UI komponentleri
│   ├── dashboard/       # Dashboard özgü komponentleri
│   └── layout/          # Layout komponentleri
├── pages/               # Sayfa komponentleri
├── hooks/               # Custom React hooks
├── context/             # Context API (Toast)
├── utils/               # Yardımcı fonksiyonlar
│   ├── statusHelpers.js # Durum haritaları
│   └── exportHelpers.js # CSV/JSON export
└── App.jsx              # Ana komponent
```

## 🎨 Renk Sistemi

### Status Renkleri

- **Aktif**: Emerald (yeşil)
- **Pasif**: Slate (gri)
- **Beklemede**: Amber (sarı)
- **Hata**: Rose (kırmızı)
- **Bilgi**: Blue (mavi)

## 🔧 Türkçe Commit Mesajları

Tüm commit'ler Türkçe yazılmıştır:

```bash
git log --oneline
```

## 📝 Not

- Tüm komponentler Tailwind CSS ile styled
- Lucide React ikonları kullanılmıştır
- Mobile responsive tasarım
- Accessibility (a11y) benimsenmiştir

---

**Son güncelleme**: Feb 25, 2026
