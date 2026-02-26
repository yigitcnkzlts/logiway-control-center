# 🚀 Logiway Control Center - Lojistik Yönetim Paneli

![Vercel](https://img.shields.io/badge/Vercel-Deployed-000?logo=vercel)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?logo=vite)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4.19-06B6D4?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

Lojistik ve kargo işletmeleri için **sıfırdan geliştirilen**, tam teşekküllü web tabanlı yönetim ve kontrol paneli. Şoförler, araçlar, yükler ve eşleşme sistemi entegrasyonu ile merkezi yönetim imkanı.

> **[🌐 Canlı Demo](https://logiway-control-center.vercel.app)** | **[📚 Bileşen Dokümentasyonu](./COMPONENTS.md)**

---

## ✨ Temel Özellikler

### 📊 Dashboard
- **KPI Kartları** - Gerçek zamanlı metrikler ve trend göstergeleri
- **İstatistik Özeti** - Aktif şoförler, araçlar, yükler
- **Activity Timeline** - Son işlemler ve olaylar
- **Sistem Durumu** - System health ve alerts
- **Pending Queue** - Bekleyen işlemler sırası

### 👥 Kullanıcı Yönetimi
- Kullanıcı listesi, filtreleme, arama, pagination
- Profil detay sayfası
- Doğrulama bekleyen kullanıcılar (Pending Users)
- CSV/JSON export
- Bulk operations (delete, status change)

### 📦 Yük/İlan Yönetimi
- Ilanlar oluştur/güncelle/sil
- Durum takibi (Açık, Eşleşmiş, Tamamlanmış, İptal)
- Şehir kombinleri ve rotalar
- Real-time search ve filtering
- Export to CSV

### 🚗 Araç Yönetimi
- Araç envanteri
- Müsaitlik durumu:
  - 🟢 **Müsait** (Available)
  - 🟡 **Yüklü** (Loaded)
  - 🔴 **Bakımda** (Maintenance)
  - ⚫ **Offline**
- Şoför atama ve kapasite yönetimi
- Araç türleri ve özellikleri

### 👨‍✈️ Şoför Yönetimi
- Şoför profilleri ve belge durumu
- Online/Offline tracking
- Müsaitlik durumu (Müsait, Yolda, Kantin, Dinlenme)
- Rating ve review sistemi
- Çalışma saatleri yönetimi

### ⚙️ Eşleşme Sistemi (Matching)
- Otomatik matching engine
- Algoritmik şoför-İlan eşleştirme
- Manual override seçeneği
- Match timeline ve detayları

### ⚡ Ayarlar
- Sistem konfigürasyonu
- Kategori yönetimi
- Bildirim tercihleir
- User roles ve permissions

---

## 🛠️ Teknoloji Stack

### Core Technologies
| Teknoloji | Versiyon | Açıklama |
|-----------|----------|----------|
| **React** | 19.2.0 | Modern JavaScript UI kütüphanesi |
| **React Router** | 7.13.0 | İstemci tarafı routing |
| **Vite** | 7.2.4 | Lightning-fast build tool |
| **TailwindCSS** | 3.4.19 | Utility-first CSS framework |
| **Lucide React** | 0.563.0 | 563+ vektör ikonlar |

### State Management
- **React Context API** - Global Toast notification sistemi
- **Custom Hooks** - useToast, useConfirm, useState, useEffect

### Development Tools
- **ESLint** - Kod kalitesi kontrolü
- **PostCSS** - CSS işleme (Tailwind)
- **Autoprefixer** - Otomatik vendor prefixleri

### Deployment
- **Vercel** - Continuous deployment
- **GitHub** - Version control

---

## 📱 Responsive Design

- ✅ **Mobil** (320px+)
- ✅ **Tablet** (768px+)
- ✅ **Desktop** (1920px+)
- ✅ Sidebar collapse (hamburger menu)
- ✅ Touch-friendly buttons

---

## 🎨 UI Komponenler (20+ Bileşen)

### Form Komponentleri
```
✅ Input          - Text input alanları
✅ Select         - Dropdown menüler, click-outside detection
✅ Checkbox       - Seçim kutuları
✅ Radio          - Radyo butonlar
✅ Textarea       - Çok satırlı metin alanları
✅ FormGroup      - Label + Error + Help text wrapper
✅ FormModal      - Modal içinde form
```

### Interactive Components
```
✅ Modal          - Dialog pencereler
✅ Toast          - Notifications (Success/Error/Warning/Info)
✅ ConfirmDialog  - Onay diyalogları
✅ Dropdown       - Açılır menüler
✅ Tabs           - Sekme navigasyonu
✅ Tooltip        - Bilgi ipuçları (4 position)
✅ Avatar         - Profil görseli + online status
```

### Data Display
```
✅ Table          - Sıralama, seçim, pagination
✅ DataTable      - Integrated (search, filter, sort, pagination)
✅ Card           - İçerik konteynerı
✅ Badge          - Renkli etiketler
✅ StatusBadge    - Durum rozetleri
✅ Timeline       - Zaman çizelgesi
✅ ProgressBar    - İlerleme göstergesi
✅ Stat           - İstatistik kartları
✅ InfoGroup      - Bilgi grupları
```

### Feedback & Loading
```
✅ Skeleton       - CardSkeleton, TableSkeleton, TextSkeleton
✅ ShimmerEffect  - Loading animasyonu
✅ AlertBanner    - Sayfa başında alertler
✅ EmptyState     - Boş durum görseli
```

### Layout Components
```
✅ Sidebar        - Profesyonel sol navigasyon
✅ Navbar         - Üst navigasyon
✅ MainLayout     - Ana layout wrapper
✅ PanelLayout    - Panel sayfaları layout'u
✅ Section, Grid, Container, Flex - Utility layoutlar
```

---

## 🚀 Kurulum & Çalıştırma

### Gereksinimler
- Node.js 16+
- npm veya yarn

### Adımlar

1. **Projeyi klonla**
```bash
git clone https://github.com/yourusername/logiway-control-center.git
cd logiway-control-center
```

2. **Bağımlılıkları yükle**
```bash
npm install
```

3. **Development server'ı başlat**
```bash
npm run dev
```
Server açılacak: `http://localhost:5175`

4. **Production build oluştur**
```bash
npm run build
```

5. **Build'i preview et**
```bash
npm run preview
```

---

## 📁 Proje Yapısı

```
logiway-control-center/
├── src/
│   ├── components/
│   │   ├── common/              # Genel UI komponentleri (20+)
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── DataTable.jsx
│   │   │   ├── Toast.jsx
│   │   │   └── ... (14+ daha)
│   │   ├── dashboard/           # Dashboard özgü komponentler
│   │   │   ├── MetricCard.jsx
│   │   │   ├── SectionHeader.jsx
│   │   │   └── PanelToolbar.jsx
│   │   └── layout/              # Layout komponentleri
│   │       ├── Sidebar.jsx
│   │       ├── Navbar.jsx
│   │       ├── MainLayout.jsx
│   │       └── PanelLayout.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx        # Analytics dashboard
│   │   ├── Users/               # Kullanıcı modülü
│   │   │   ├── UsersList.jsx
│   │   │   ├── PendingUsers.jsx
│   │   │   └── UserDetail.jsx
│   │   ├── Loads.jsx            # Yük/İlan yönetimi
│   │   ├── Drivers.jsx          # Şoför yönetimi
│   │   ├── Vehicles.jsx         # Araç yönetimi
│   │   ├── Matches.jsx          # Eşleşme sistemi
│   │   ├── Settings.jsx         # Ayarlar
│   │   ├── TemplatePanel.jsx    # Panel template
│   │   └── NotFound.jsx         # 404 sayfası
│   ├── hooks/
│   │   ├── useToast.js          # Toast hook
│   │   └── useConfirm.js        # Confirm dialog hook
│   ├── context/
│   │   └── ToastContext.jsx     # Toast provider
│   ├── utils/
│   │   ├── statusHelpers.js     # Status/role mappings
│   │   └── exportHelpers.js     # CSV/JSON export
│   ├── api/
│   │   ├── authService.js
│   │   ├── userService.js
│   │   └── axiosInstance.js
│   ├── App.jsx                  # Main component
│   ├── App.css                  # Global styles
│   ├── main.jsx                 # Entry point
│   └── index.css                # Base styles
├── public/                       # Static assets
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind configuration
├── postcss.config.js           # PostCSS configuration
├── package.json
├── README.md
└── COMPONENTS.md               # Bileşen dokümentasyonu
```

---

## 🎯 Tüm Butonlar & Fonksiyonlar ✅

### CRUD İşlemleri
- ✅ **Oluştur** - Modal formla yeni kayıt ekleme
- ✅ **Oku** - Detay sayfasında görüntüleme
- ✅ **Güncelle** - Modal veya inline edit
- ✅ **Sil** - Confirmation dialog ile güvenli silme

### Search & Filter
- ✅ Real-time search (tüm tablolarda)
- ✅ Advanced filtering (multiple columns)
- ✅ Column-based sorting (ascending/descending)
- ✅ Search across multiple fields

### Pagination & Display
- ✅ Page navigation
- ✅ Items per page seçenek (10, 20, 50, 100)
- ✅ Total items gösterimi
- ✅ Disabled state handling

### Bulk Operations
- ✅ Multiple row select (checkbox)
- ✅ Bulk delete
- ✅ Bulk status change
- ✅ Select all / Deselect all

### Notifications
- ✅ Success toast
- ✅ Error toast
- ✅ Warning toast
- ✅ Info toast
- ✅ Auto-dismiss (3 saniye)
- ✅ Manual close

### Form Features
- ✅ Validation
- ✅ Required field marking
- ✅ Error messages
- ✅ Help text
- ✅ Focus management

### Export Features
- ✅ Export to CSV
- ✅ Export to JSON
- ✅ Custom filename
- ✅ Complete data export

### Status Management
- ✅ Color-coded badges
- ✅ Online/Offline indicator
- ✅ Müsaitlik durumları (4 states)
- ✅ Status transitions

---

## 🔧 Kullanım Örnekleri

### Toast Kulllanımı
```jsx
import { useToast } from "./hooks/useToast";

function MyComponent() {
  const toast = useToast();

  const handleSave = async () => {
    try {
      // Bur işlemi yap
      await saveData();
      toast.success("Kaydedildi!");
    } catch (error) {
      toast.error("Hata oluştu: " + error.message);
    }
  };

  return <button onClick={handleSave}>Kaydet</button>;
}
```

### DataTable Kullanımı
```jsx
import DataTable from "./components/common/DataTable";

<DataTable
  columns={[
    { key: "id", label: "ID", sortable: true },
    { key: "name", label: "Ad", sortable: true },
    { key: "status", label: "Durum" },
  ]}
  data={usersData}
  searchFields={["name", "email"]}
  filters={[
    {
      key: "status",
      label: "Durum",
      options: [
        { label: "Aktif", value: "active" },
        { label: "Pasif", value: "inactive" },
      ],
    },
  ]}
  onRowClick={(row) => navigate(`/users/${row.id}`)}
/>
```

### Confirmation Dialog
```jsx
import { useConfirm } from "./hooks/useConfirm";

function DeleteUser({ userId }) {
  const confirm = useConfirm();

  const handleDelete = async () => {
    const confirmed = await confirm.confirm({
      title: "Kullanıcıyı Sil",
      message: "Bu işlem geri alınamaz.",
      danger: true,
    });

    if (confirmed) {
      await deleteUser(userId);
      toast.success("Silindi!");
    }
  };

  return <button onClick={handleDelete}>Sil</button>;
}
```

---

## 📊 Renk Sistemi

### Status Renkleri
```
🟢 Aktif/Success    - Emerald (#10B981)
🔴 Error/Danger     - Rose (#F43F5E)
🟡 Warning          - Amber (#F59E0B)
🔵 Info             - Blue (#3B82F6)
⚫ Neutral           - Slate (#64748B)
```

### UI Renkleri
```
Arka Plan: White (#FFFFFF)
Metin: Slate-900 (#0F172A)
Kenar: Slate-200 (#E2E8F0)
```

---

## 🌍 Deployment (Vercel)

Proje otomatik olarak **GitHub push** yapılmıştır **Vercel**'e deploy edilir.

### Canlı Link
🔗 **[https://logiway-control-center.vercel.app](https://logiway-control-center.vercel.app)**

### Deploy Prosesi
1. Kod **GitHub**'a push edilir
2. **Vercel** otomatik olarak build başlatır
3. Build başarılı olursa **deploy** edilir
4. Live URL'ye erişim mümkün

---

## 📚 Api Integration Ready

Panel tamamen **Backend API** entegrasyonuna hazırdır:

```javascript
// src/api/
├── axiosInstance.js    - Base HTTP client
├── authService.js      - Authentication API
└── userService.js      - User API endpoints
```

**Hazırlanmış:** Error handling, Loading states, Retry logic

---

## 🎓 Best Practices

- ✅ **Component Reusability** - Modular yapı
- ✅ **Custom Hooks** - State logic ayrıştırması
- ✅ **Context API** - Global state management
- ✅ **Performance** - Lazy loading, code splitting
- ✅ **Accessibility** - ARIA labels, semantic HTML
- ✅ **Responsive** - Mobile-first design
- ✅ **Clean Code** - Türkçe comments, profesyonel yapı

---

## 🤝 Katkıda Bulunma

1. Fork et
2. Feature branch oluştur (`git checkout -b feature/AmazingFeature`)
3. Değişiklikleri commit et (`git commit -m 'Yeni özellik: AmazingFeature'`)
4. Branch'i push et (`git push origin feature/AmazingFeature`)
5. Pull Request aç

---

## 📝 Lisans

Bu proje **MIT** lisansı altında dağıtılmaktadır.

---

## 📞 İletişim

**Geliştirici:** Can Yılmaz

**Email:** [your-email@example.com](mailto:your-email@example.com)

**LinkedIn:** [LinkedIn Profile](https://linkedin.com)

**GitHub:** [GitHub Profile](https://github.com)

---

## 🙏 Teşekkürler

- **React** - Mükemmel UI kütüphanesi
- **Vite** - Süper hızlı build tool
- **TailwindCSS** - Güzel UI styling
- **Lucide** - Harika ikonlar
- **Vercel** - Kolay deployment

---

**Son güncelleme:** 26 Şubat 2026

⭐ Beğendiysen star ver! 🚀
