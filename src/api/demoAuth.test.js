import test from "node:test";
import assert from "node:assert/strict";
import { createDemoSession, validateDemoCredentials } from "./demoAuth.js";

test("shared demo credentials work for all three roles", () => {
  const expectedRoles = {
    "yuk-veren": "SHIPPER",
    lojistik: "LOGISTICS_COMPANY",
    sofor: "INDEPENDENT_DRIVER",
  };

  for (const [role, roleCode] of Object.entries(expectedRoles)) {
    assert.equal(validateDemoCredentials("demo@logiway.com", "123456"), true);
    assert.deepEqual(createDemoSession(role).roles, [roleCode]);
    assert.equal(createDemoSession(role).selectedRole, role);
  }
});

test("wrong demo password is rejected", () => {
  assert.equal(validateDemoCredentials("demo@logiway.com", "wrong-password"), false);
});

test("unknown demo role is rejected", () => {
  assert.throws(() => createDemoSession("admin"), /Geçersiz demo rolü/);
});
