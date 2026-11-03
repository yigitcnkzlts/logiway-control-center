import test from "node:test";
import assert from "node:assert/strict";
import { loadToCreatePayload, mapLoad } from "./marketplaceClient.js";

test("live loads preserve API fields and map published status for the UI", () => {
  const mapped = mapLoad({
    id: "load-1",
    title: "Makine parçası",
    pickupCountry: "TR",
    pickupCity: "İstanbul",
    dropoffCountry: "DE",
    dropoffCity: "Berlin",
    readyFrom: "2026-11-04T08:00:00Z",
    weightKg: 12000,
    expectedPrice: 2400,
    currency: "EUR",
    status: "PUBLISHED",
  });

  assert.equal(mapped.cargo, "Makine parçası");
  assert.equal(mapped.status, "Teklif alıyor");
  assert.equal(mapped.weight, "12 ton");
  assert.equal(mapped.title, "Makine parçası");
});

test("duplicate payload keeps business fields and drops identity and lifecycle fields", () => {
  const payload = loadToCreatePayload({
    id: "original-id",
    shipperCompanyId: "company-1",
    title: "Paletli ürün",
    pickupCountry: "TR",
    pickupCity: "Bursa",
    dropoffCountry: "DE",
    dropoffCity: "Hamburg",
    readyFrom: "2026-11-05T08:00:00Z",
    readyTo: "2026-11-06T18:00:00Z",
    weightKg: 8000,
    currency: "EUR",
    status: "PUBLISHED",
    version: 7,
    createdAt: "2026-11-03T10:00:00Z",
  });

  assert.equal(payload.shipperCompanyId, "company-1");
  assert.equal(payload.title, "Paletli ürün");
  assert.equal("id" in payload, false);
  assert.equal("status" in payload, false);
  assert.equal("version" in payload, false);
  assert.equal("createdAt" in payload, false);
});
