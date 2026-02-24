// Durum/Status buluşları - tutarlı renk ve ikon seçimi için

export const statusMap = {
  // Genel durumlar
  active: {
    label: "Aktif",
    color: "bg-emerald-100",
    textColor: "text-emerald-700",
    badgeColor: "emerald",
    icon: "✓",
  },
  inactive: {
    label: "Pasif",
    color: "bg-slate-100",
    textColor: "text-slate-700",
    badgeColor: "default",
    icon: "−",
  },
  pending: {
    label: "Beklemede",
    color: "bg-amber-100",
    textColor: "text-amber-700",
    badgeColor: "warning",
    icon: "◐",
  },
  error: {
    label: "Hata",
    color: "bg-rose-100",
    textColor: "text-rose-700",
    badgeColor: "error",
    icon: "✕",
  },
  verified: {
    label: "Doğrulandı",
    color: "bg-blue-100",
    textColor: "text-blue-700",
    badgeColor: "info",
    icon: "✓",
  },
  rejected: {
    label: "Reddedildi",
    color: "bg-rose-100",
    textColor: "text-rose-700",
    badgeColor: "error",
    icon: "✕",
  },

  // Şoför durumları
  online: {
    label: "Çevrimiçi",
    color: "bg-emerald-100",
    textColor: "text-emerald-700",
    badgeColor: "success",
  },
  offline: {
    label: "Çevrimdışı",
    color: "bg-slate-100",
    textColor: "text-slate-700",
    badgeColor: "default",
  },
  onTrip: {
    label: "Yolda",
    color: "bg-blue-100",
    textColor: "text-blue-700",
    badgeColor: "info",
  },

  // İlan durumları
  open: {
    label: "Açık",
    color: "bg-emerald-100",
    textColor: "text-emerald-700",
    badgeColor: "success",
  },
  matched: {
    label: "Eşleşti",
    color: "bg-blue-100",
    textColor: "text-blue-700",
    badgeColor: "info",
  },
  completed: {
    label: "Tamamlandı",
    color: "bg-purple-100",
    textColor: "text-purple-700",
    badgeColor: "purple",
  },
  cancelled: {
    label: "İptal",
    color: "bg-rose-100",
    textColor: "text-rose-700",
    badgeColor: "error",
  },
};

export const roleMap = {
  admin: { label: "Yönetici", color: "default" },
  operator: { label: "Operatör", color: "indigo" },
  shipper: { label: "İlan Veren", color: "warning" },
  driver: { label: "Şoför", color: "cyan" },
};

export const priorityMap = {
  low: { label: "Düşük", color: "slate" },
  medium: { label: "Orta", color: "amber" },
  high: { label: "Yüksek", color: "rose" },
  critical: { label: "Kritik", color: "error" },
};

export function getStatus(status) {
  return statusMap[status] || statusMap.inactive;
}

export function getRole(role) {
  return roleMap[role] || roleMap.operator;
}

export function getPriority(priority) {
  return priorityMap[priority] || priorityMap.medium;
}
