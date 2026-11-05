export const LOAD_STATUS_FILTERS = [
  ["ALL", "Tümü"],
  ["DRAFT", "Taslak"],
  ["PUBLISHED", "Yayında / Teklif alıyor"],
  ["MATCHED", "Taşıyıcı seçildi"],
  ["COMPLETED", "Tamamlandı"],
  ["CANCELLED", "İptal"],
];

export function normalizeLoadStatus(status) {
  const map = {
    DRAFT: "DRAFT",
    PUBLISHED: "PUBLISHED",
    "Teklif alıyor": "PUBLISHED",
    MATCHED: "MATCHED",
    "Şoför eşleşti": "MATCHED",
    COMPLETED: "COMPLETED",
    DELIVERED: "COMPLETED",
    Tamamlandı: "COMPLETED",
    CANCELLED: "CANCELLED",
  };
  return map[status] || status || "UNKNOWN";
}

export function filterAndSortLoads(loads, filters = {}) {
  const query = String(filters.search || "").trim().toLocaleLowerCase("tr-TR");
  const filtered = loads.filter((load) => {
    const statusMatches = !filters.status || filters.status === "ALL" ||
      normalizeLoadStatus(load.status) === filters.status;
    const queryMatches = !query || [load.id, load.cargo, load.from, load.to, load.vehicle]
      .some((value) => String(value || "").toLocaleLowerCase("tr-TR").includes(query));
    return statusMatches && queryMatches;
  });
  const dateValue = (load, field) => new Date(load[field] || 0).getTime() || 0;
  return [...filtered].sort((a, b) => {
    if (filters.sort === "oldest") return dateValue(a, "createdAt") - dateValue(b, "createdAt");
    if (filters.sort === "pickup") return dateValue(a, "pickupDate") - dateValue(b, "pickupDate");
    if (filters.sort === "offers") return Number(b.offers || 0) - Number(a.offers || 0);
    return dateValue(b, "createdAt") - dateValue(a, "createdAt");
  });
}

export function missingDraftFields(load) {
  const required = [
    ["cargo", "yük adı"], ["fromCity", "kalkış şehri"], ["toCity", "varış şehri"],
    ["pickupDate", "yükleme tarihi"], ["deliveryDate", "teslim tarihi"],
    ["vehicle", "araç tipi"], ["weight", "ağırlık"],
  ];
  return required.filter(([key]) => !String(load[key] || "").trim()).map(([, label]) => label);
}

export function buildShipperSearchItems({ loads = [], offers = [], shipments = [], matches = [] }) {
  const loadItems = loads.map((load) => ({
    type: "Yük", id: load.id, label: `${load.id} · ${load.cargo || "Yük ilanı"}`,
    sub: `${load.from || ""} → ${load.to || ""}`, target: "Yük İlanlarım",
    keywords: [load.vehicle, load.details?.plate].filter(Boolean).join(" "),
  }));
  const offerItems = offers.map((offer) => ({
    type: "Firma", id: offer.id, label: offer.company || offer.driver || "Taşıyıcı",
    sub: `${offer.amount || ""} · ${offer.vehicle || ""}`, target: "Gelen Teklifler",
    keywords: [offer.load, offer.vehicle].filter(Boolean).join(" "),
  }));
  const shipmentItems = [...shipments, ...matches]
    .filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index)
    .map((shipment) => ({
      type: "Sevkiyat", id: shipment.id, label: String(shipment.id),
      sub: shipment.route || shipment.cargo || "Sevkiyat", target: "Sevkiyatlarım",
      keywords: [shipment.vehiclePlate, shipment.vehicleId, shipment.carrier].filter(Boolean).join(" "),
    }));
  return [...loadItems, ...offerItems, ...shipmentItems];
}

export function buildShipperNotifications({ offers = [], loads = [], shipments = [], unread = 0, payments = [], documents = [] }) {
  const items = [];
  const pendingOffers = offers.filter((offer) => ["Bekliyor", "PENDING", "COUNTERED"].includes(offer.status));
  if (pendingOffers.length) items.push({ id: "offers", title: `${pendingOffers.length} teklif değerlendirme bekliyor`, detail: "Teklifleri karşılaştırın ve yanıtlayın.", target: "Gelen Teklifler" });
  if (unread > 0) items.push({ id: "messages", title: `${unread} okunmamış mesaj`, detail: "Operasyon görüşmelerinizi kontrol edin.", target: "Mesajlar" });
  const dueSoon = payments.filter((payment) => payment.status === "DUE_SOON");
  if (dueSoon.length) items.push({ id: "payments", title: `${dueSoon.length} ödemenin vadesi yaklaşıyor`, detail: "Finans kayıtlarını kontrol edin.", target: "Ödemeler" });
  const missingDocs = payments.filter((payment) => payment.documentStatus === "MISSING");
  if (missingDocs.length) items.push({ id: "documents", title: `${missingDocs.length} kayıtta belge bekleniyor`, detail: "Eksik dekont veya taşıma belgesini inceleyin.", target: "Belgeler" });
  const soon = Date.now() + 3 * 86400000;
  const approaching = loads.filter((load) => {
    const time = new Date(load.pickupDate || 0).getTime();
    return time > Date.now() && time <= soon && normalizeLoadStatus(load.status) !== "CANCELLED";
  });
  if (approaching.length) items.push({ id: "pickup", title: `${approaching.length} yükleme yaklaşıyor`, detail: "Planlanan yüklemeleri kontrol edin.", target: "Yük İlanlarım" });
  const delayed = shipments.filter((shipment) => shipment.delayed === true || shipment.status === "DELAYED");
  if (delayed.length) items.push({ id: "delayed", title: `${delayed.length} geciken sevkiyat`, detail: "Operasyon müdahalesi gerekebilir.", target: "Sevkiyatlarım" });
  const documentEvents = documents.filter((document) => document.status === "İnceleniyor");
  if (documentEvents.length) items.push({ id: "doc-review", title: `${documentEvents.length} belge inceleniyor`, detail: "Belge durumlarını görüntüleyin.", target: "Belgeler" });
  return items;
}
