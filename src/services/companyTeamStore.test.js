import test from "node:test";
import assert from "node:assert/strict";
import { TEAM_ROLES, roleCan } from "./companyTeamStore.js";

test("ekip rolleri beklenen dört rolü içerir", () => {
  assert.deepEqual(TEAM_ROLES, ["Yönetici", "Operasyon", "Finans", "Görüntüleyici"]);
});

test("yetki matrisi kritik işlemleri role göre sınırlar", () => {
  assert.equal(roleCan("Yönetici", "Ekip yönetme"), true);
  assert.equal(roleCan("Operasyon", "Teklif kabul / ret"), true);
  assert.equal(roleCan("Finans", "Teklif kabul / ret"), false);
  assert.equal(roleCan("Görüntüleyici", "Belge yükleme"), false);
});
