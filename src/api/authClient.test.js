import test from "node:test";
import assert from "node:assert/strict";
import { hydrateCompany, panelPathForRoles } from "./authClient.js";
import { saveSessionTokens } from "./apiClient.js";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

test("server roles map to the authorized panel", () => {
  assert.equal(panelPathForRoles(["SHIPPER"]), "/yuk-veren/panel");
  assert.equal(panelPathForRoles(["LOGISTICS_COMPANY"]), "/lojistik/panel");
  assert.equal(panelPathForRoles(["INDEPENDENT_DRIVER"]), "/sofor/panel");
  assert.equal(panelPathForRoles(["UNKNOWN"]), "/giris");
});

test("company hydration retries a transient timeout and preserves the authenticated session", async () => {
  const storage = memoryStorage({
    "guc-access-token": "test-access",
    "guc-session": JSON.stringify({ userId: "u-1", roles: ["SHIPPER"] }),
  });
  let attempts = 0;
  const company = await hydrateCompany({
    storage,
    apiConfigured: () => true,
    maxAttempts: 2,
    request: async () => {
      attempts += 1;
      if (attempts === 1) throw Object.assign(new Error("timeout"), { status: 408 });
      return [{ id: "c-1", type: "SHIPPER", legalName: "Test Shipper", country: "TR" }];
    },
  });
  assert.equal(attempts, 2);
  assert.equal(company.id, "c-1");
  assert.deepEqual(JSON.parse(storage.getItem("guc-session")), {
    userId: "u-1",
    roles: ["SHIPPER"],
    companyId: "c-1",
    companyName: "Test Shipper",
    companyCountry: "TR",
  });
});

test("company hydration does not retry authorization failures", async () => {
  const storage = memoryStorage({
    "guc-access-token": "test-access",
    "guc-session": JSON.stringify({ roles: ["SHIPPER"] }),
  });
  let attempts = 0;
  await assert.rejects(
    hydrateCompany({
      storage,
      apiConfigured: () => true,
      request: async () => {
        attempts += 1;
        throw Object.assign(new Error("forbidden"), { status: 403 });
      },
    }),
    /forbidden/,
  );
  assert.equal(attempts, 1);
  assert.ok(storage.getItem("guc-access-token"));
});

test("rotated tokens refresh session expiry and keep roles", () => {
  const previousStorage = globalThis.localStorage;
  const storage = memoryStorage({
    "guc-session": JSON.stringify({ userId: "u-1", roles: ["SHIPPER"] }),
  });
  globalThis.localStorage = storage;
  try {
    const before = Date.now();
    saveSessionTokens({ accessToken: "new-access", refreshToken: "new-refresh", expiresInSeconds: 900 });
    const session = JSON.parse(storage.getItem("guc-session"));
    assert.equal(storage.getItem("guc-access-token"), "new-access");
    assert.equal(storage.getItem("guc-refresh-token"), "new-refresh");
    assert.deepEqual(session.roles, ["SHIPPER"]);
    assert.ok(session.expiresAt >= before + 899_000);
  } finally {
    globalThis.localStorage = previousStorage;
  }
});

test("a corrupted stored session cannot turn a successful token response into a login error", () => {
  const previousStorage = globalThis.localStorage;
  const storage = memoryStorage({ "guc-session": "not-json" });
  globalThis.localStorage = storage;
  try {
    saveSessionTokens({ accessToken: "access", refreshToken: "refresh", userId: "u-2", roles: ["LOGISTICS_COMPANY"], expiresInSeconds: 900 });
    assert.deepEqual(JSON.parse(storage.getItem("guc-session")).roles, ["LOGISTICS_COMPANY"]);
  } finally {
    globalThis.localStorage = previousStorage;
  }
});
