import test from "node:test";
import assert from "node:assert/strict";
import {
  ASSIGNABLE_TEAM_ROLES,
  companyDisplayName,
  invitationStatusLabel,
  roleLabel,
} from "./companyTeamClient.js";

test("backend ekip rolleri Türkçe etiketlenir", () => {
  assert.equal(roleLabel("OWNER"), "Sahip");
  assert.equal(roleLabel("OPERATIONS"), "Operasyon");
  assert.equal(roleLabel("FINANCE"), "Finans");
  assert.deepEqual(ASSIGNABLE_TEAM_ROLES.map((role) => role.value), ["ADMIN", "OPERATIONS", "FINANCE", "VIEWER"]);
});

test("davet durumları ve firma adı güvenli biçimde gösterilir", () => {
  assert.equal(invitationStatusLabel("PENDING"), "Davet bekliyor");
  assert.equal(invitationStatusLabel("EXPIRED"), "Süresi doldu");
  assert.equal(companyDisplayName({ legalName: "Logiway A.Ş.", tradeName: "Logiway" }), "Logiway");
  assert.equal(companyDisplayName({ legalName: "Logiway A.Ş." }), "Logiway A.Ş.");
});
