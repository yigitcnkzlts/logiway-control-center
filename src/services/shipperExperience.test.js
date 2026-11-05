import test from "node:test";
import assert from "node:assert/strict";
import {
  buildShipperNotifications,
  buildShipperSearchItems,
  filterAndSortLoads,
  missingDraftFields,
  normalizeLoadStatus,
} from "./shipperExperience.js";

test("yük durumları tek filtre sözlüğünde normalize edilir", () => {
  assert.equal(normalizeLoadStatus("Teklif alıyor"), "PUBLISHED");
  assert.equal(normalizeLoadStatus("Şoför eşleşti"), "MATCHED");
  assert.equal(normalizeLoadStatus("DELIVERED"), "COMPLETED");
});

test("yük arama, durum filtresi ve teklif sıralaması aynı veri kümesinde çalışır", () => {
  const loads = [
    { id: "LW-1", cargo: "Makine", from: "Bursa", to: "Köln", status: "Teklif alıyor", offers: 2 },
    { id: "LW-2", cargo: "Tekstil", from: "İzmir", to: "Berlin", status: "Teklif alıyor", offers: 5 },
    { id: "LW-3", cargo: "Gıda", status: "DRAFT", offers: 0 },
  ];
  assert.deepEqual(filterAndSortLoads(loads, { status: "PUBLISHED", search: "berlin", sort: "offers" }).map((x) => x.id), ["LW-2"]);
  assert.deepEqual(filterAndSortLoads(loads, { status: "PUBLISHED", sort: "offers" }).map((x) => x.id), ["LW-2", "LW-1"]);
});

test("eksik taslak zorunlu alanları açıklanabilir biçimde döndürür", () => {
  const missing = missingDraftFields({ cargo: "Makine", fromCity: "Bursa" });
  assert.ok(missing.includes("varış şehri"));
  assert.ok(missing.includes("yükleme tarihi"));
});

test("global arama sadece verilen yetkili veri kümesinden sonuç üretir", () => {
  const items = buildShipperSearchItems({
    loads: [{ id: "LW-1", cargo: "Makine", from: "Bursa", to: "Köln", vehicle: "Tenteli" }],
    offers: [{ id: "OF-1", company: "Mars Lojistik", amount: "2.000 EUR", load: "LW-1" }],
    shipments: [{ id: "SHP-1", route: "Bursa → Köln", vehiclePlate: "34 ABC 123" }],
  });
  assert.equal(items.length, 3);
  assert.ok(items.some((item) => item.keywords?.includes("34 ABC 123")));
});

test("aksiyon bildirimi yalnızca gerçek sayaç sıfırdan büyükse üretilir", () => {
  assert.deepEqual(buildShipperNotifications({ offers: [], unread: 0, payments: [], loads: [], shipments: [], documents: [] }), []);
  const items = buildShipperNotifications({
    offers: [{ status: "PENDING" }], unread: 2,
    payments: [{ status: "DUE_SOON", documentStatus: "MISSING" }],
    loads: [], shipments: [], documents: [],
  });
  assert.deepEqual(items.map((item) => item.target), ["Gelen Teklifler", "Mesajlar", "Ödemeler", "Belgeler"]);
});
