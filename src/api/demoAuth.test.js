import test from "node:test";
import assert from "node:assert/strict";
import {
  createDemoSession,
  validateDemoCredentials,
  enterDemoSession,
  isDemoSession,
  clearDemoSession,
} from "./demoAuth.js";

// ── Node test environment: polyfill localStorage ──────────────────
const store = {};
globalThis.localStorage = {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};

// ── Original tests (unchanged) ────────────────────────────────────
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

// ── New: enterDemoSession ─────────────────────────────────────────
test("enterDemoSession writes session to localStorage for each role", () => {
  for (const role of ["yuk-veren", "lojistik", "sofor"]) {
    clearDemoSession();
    const session = enterDemoSession(role);
    assert.equal(session.demo, true);
    assert.equal(session.selectedRole, role);

    const stored = JSON.parse(localStorage.getItem("guc-session"));
    assert.deepEqual(stored, session);
  }
});

// ── New: isDemoSession ────────────────────────────────────────────
test("isDemoSession returns true after enterDemoSession", () => {
  enterDemoSession("yuk-veren");
  assert.equal(isDemoSession(), true);
});

test("isDemoSession returns false after clearDemoSession", () => {
  enterDemoSession("lojistik");
  clearDemoSession();
  assert.equal(isDemoSession(), false);
});

test("isDemoSession returns false when session is absent", () => {
  clearDemoSession();
  assert.equal(isDemoSession(), false);
});

// ── New: session persistence (page reload simulation) ─────────────
test("demo session survives simulated page reload (localStorage persists)", () => {
  enterDemoSession("sofor");
  // Re-read from storage as a fresh parse (simulates reload)
  const raw = localStorage.getItem("guc-session");
  assert.ok(raw, "session should be stored");
  const parsed = JSON.parse(raw);
  assert.equal(parsed.demo, true);
  assert.equal(parsed.selectedRole, "sofor");
});

// ── New: createDemoSession adds enteredAt ─────────────────────────
test("createDemoSession includes enteredAt ISO timestamp", () => {
  const before = Date.now();
  const session = createDemoSession("yuk-veren");
  const after = Date.now();
  const ts = new Date(session.enteredAt).getTime();
  assert.ok(ts >= before && ts <= after, "enteredAt should be recent");
});

// ── New: role-specific company name ──────────────────────────────
test("createDemoSession sets role-specific companyName", () => {
  assert.match(createDemoSession("yuk-veren").companyName, /Yük Veren/);
  assert.match(createDemoSession("lojistik").companyName, /Lojistik/);
  assert.match(createDemoSession("sofor").companyName, /Şoför/);
});
