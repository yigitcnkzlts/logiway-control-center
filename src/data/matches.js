// Mock matches data (temporary)
// Later: this will come from API (e.g. /matches endpoint)

export const matches = [
  {
    id: "M-1001",
    route: "Tekirdağ → İstanbul",
    distanceKm: 135,

    vehiclePlate: "34 ABC 123",
    vehicleType: "Tır",
    vehicleCapacityKg: 24000,

    loadTitle: "Paletli Gıda Yükü",
    loadWeightKg: 22000,

    // Match hints
    timeMatch: "uygun", // uygun | kismi | degil
    vehicleTypeMatch: true,

    score: 92,
    status: "uygun", // uygun | kismi | uygun_degil
    reason: "Kapasite ve rota tamamen uyumlu",
    createdAt: "2026-02-03",
  },
  {
    id: "M-1002",
    route: "Tekirdağ → Ankara",
    distanceKm: 540,

    vehiclePlate: "59 XYZ 777",
    vehicleType: "Kamyon",
    vehicleCapacityKg: 15000,

    loadTitle: "Parsiyel Tekstil",
    loadWeightKg: 13000,

    timeMatch: "kismi",
    vehicleTypeMatch: true,

    score: 68,
    status: "kismi",
    reason: "Teslim süresi sınırda",
    createdAt: "2026-02-03",
  },
  {
    id: "M-1003",
    route: "İzmir → Diyarbakır",
    distanceKm: 1180,

    vehiclePlate: "06 MNO 456",
    vehicleType: "Kamyonet",
    vehicleCapacityKg: 3500,

    loadTitle: "Soğuk Zincir",
    loadWeightKg: 5000,

    timeMatch: "degil",
    vehicleTypeMatch: false,

    score: 34,
    status: "uygun_degil",
    reason: "Araç kapasitesi yetersiz",
    createdAt: "2026-02-02",
  },

  // Extra entries to make the table feel “alive”
  {
    id: "M-1004",
    route: "İstanbul → Bursa",
    distanceKm: 155,
    vehiclePlate: "34 KLM 908",
    vehicleType: "Kamyon",
    vehicleCapacityKg: 12000,
    loadTitle: "Mobilya Sevkiyatı",
    loadWeightKg: 9800,
    timeMatch: "uygun",
    vehicleTypeMatch: true,
    score: 84,
    status: "uygun",
    reason: "Mesafe kısa ve kapasite uygun",
    createdAt: "2026-02-03",
  },
  {
    id: "M-1005",
    route: "Kocaeli → İzmir",
    distanceKm: 470,
    vehiclePlate: "41 TRK 411",
    vehicleType: "Tır",
    vehicleCapacityKg: 26000,
    loadTitle: "Sanayi Malzemesi",
    loadWeightKg: 25500,
    timeMatch: "kismi",
    vehicleTypeMatch: true,
    score: 74,
    status: "kismi",
    reason: "Kapasite sınırda, yükleme süresi kritik",
    createdAt: "2026-02-03",
  },
  {
    id: "M-1006",
    route: "Ankara → Adana",
    distanceKm: 490,
    vehiclePlate: "06 ADR 606",
    vehicleType: "Kamyonet",
    vehicleCapacityKg: 3500,
    loadTitle: "Koli Gıda",
    loadWeightKg: 4100,
    timeMatch: "degil",
    vehicleTypeMatch: true,
    score: 41,
    status: "uygun_degil",
    reason: "Yük ağırlığı kapasiteyi aşıyor",
    createdAt: "2026-02-02",
  },
  {
    id: "M-1007",
    route: "Bursa → Antalya",
    distanceKm: 530,
    vehiclePlate: "16 BRS 1616",
    vehicleType: "Tır",
    vehicleCapacityKg: 24000,
    loadTitle: "Soğuk Zincir",
    loadWeightKg: 18000,
    timeMatch: "uygun",
    vehicleTypeMatch: true,
    score: 88,
    status: "uygun",
    reason: "Araç tipi ve teslim planı uyumlu",
    createdAt: "2026-02-03",
  },
  {
    id: "M-1008",
    route: "Edirne → İstanbul",
    distanceKm: 240,
    vehiclePlate: "22 EDR 222",
    vehicleType: "Kamyon",
    vehicleCapacityKg: 14000,
    loadTitle: "İçecek Sevkiyatı",
    loadWeightKg: 13900,
    timeMatch: "kismi",
    vehicleTypeMatch: true,
    score: 70,
    status: "kismi",
    reason: "Kapasite çok yakın, risk payı düşük",
    createdAt: "2026-02-03",
  },
];

