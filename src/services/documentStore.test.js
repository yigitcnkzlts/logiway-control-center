/**
 * documentStore.test.js
 * Tests for the document metadata store and validation logic.
 * Runs in Node.js (no DOM) so Blob and URL.createObjectURL are polyfilled.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  validateFile,
  addDoc,
  getDocs,
  deleteDoc,
  hasBlobInMemory,
  formatBytes,
  DOC_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
} from "./documentStore.js";

// ── Node environment polyfills ────────────────────────────────────
const _store = {};
globalThis.localStorage = {
  getItem: (k) => _store[k] ?? null,
  setItem: (k, v) => { _store[k] = String(v); },
  removeItem: (k) => { delete _store[k]; },
};
globalThis.CustomEvent = class CustomEvent {
  constructor(type, init) { this.type = type; this.detail = init?.detail; }
};
globalThis.window = { dispatchEvent: () => {} };

// Minimal Blob polyfill (Node 18+ has Blob but the file mock below uses it)
// File is also available in Node 20+; fall back to a plain object if not.
function makeFile(name, type, size) {
  try {
    // Node 20+ has File. We pass a tiny buffer but override the size
    // by wrapping in a Proxy so validateFile sees the correct size.
    const buf = new Uint8Array(4);
    const real = new File([buf], name, { type });
    if (real.size === size) return real;
    // Proxy override for size property
    return new Proxy(real, {
      get(target, prop) {
        if (prop === "size") return size;
        const v = target[prop];
        return typeof v === "function" ? v.bind(target) : v;
      },
    });
  } catch {
    return { name, type, size };
  }
}

// Wipe the localStorage key before each logical group
function resetStore() {
  for (const k of Object.keys(_store)) delete _store[k];
}

// ── validateFile ──────────────────────────────────────────────────
test("PDF dosyası geçerlidir", () => {
  const file = makeFile("belge.pdf", "application/pdf", 1024);
  assert.deepEqual(validateFile(file), { ok: true });
});

test("JPG dosyası geçerlidir", () => {
  const file = makeFile("foto.jpg", "image/jpeg", 2048);
  assert.deepEqual(validateFile(file), { ok: true });
});

test("PNG dosyası geçerlidir", () => {
  const file = makeFile("ekran.png", "image/png", 512);
  assert.deepEqual(validateFile(file), { ok: true });
});

test("Desteklenmeyen format reddedilir", () => {
  const file = makeFile("data.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 1024);
  const result = validateFile(file);
  assert.equal(result.ok, false);
  assert.match(result.error, /Desteklenmeyen format/);
});

test("Boyut sınırını aşan dosya reddedilir", () => {
  const over = MAX_FILE_SIZE_BYTES + 1;
  const file = makeFile("buyuk.pdf", "application/pdf", over);
  const result = validateFile(file);
  assert.equal(result.ok, false);
  assert.match(result.error, /çok büyük/);
});

test("Dosya seçilmemişse (null) hata döner", () => {
  const result = validateFile(null);
  assert.equal(result.ok, false);
  assert.match(result.error, /seçilmedi/);
});

// ── addDoc / getDocs / deleteDoc ──────────────────────────────────
test("Geçerli PDF belgesi eklenir ve getDocs ile alınabilir", () => {
  resetStore();
  const file = makeFile("irsaliye.pdf", "application/pdf", 2000);
  const result = addDoc({ docType: "Sevk irsaliyesi", loadId: "LW-001" }, file);
  assert.equal(result.ok, true);
  assert.equal(typeof result.doc.id, "string");
  assert.equal(result.doc.docType, "Sevk irsaliyesi");
  assert.equal(result.doc.loadId, "LW-001");
  assert.equal(result.doc.demo, true);

  const docs = getDocs();
  assert.equal(docs.length, 1);
  assert.equal(docs[0].name, "irsaliye.pdf");
});

test("addDoc geçersiz dosyada kayıt oluşturmaz", () => {
  resetStore();
  const file = makeFile("trojan.exe", "application/octet-stream", 100);
  const result = addDoc({ docType: "Diğer" }, file);
  assert.equal(result.ok, false);
  assert.equal(getDocs().length, 0);
});

test("deleteDoc belgeyi listeden kaldırır", () => {
  resetStore();
  const file = makeFile("fatura.pdf", "application/pdf", 1500);
  const { doc } = addDoc({ docType: "Fatura" }, file);
  assert.equal(getDocs().length, 1);

  deleteDoc(doc.id);
  assert.equal(getDocs().length, 0);
});

test("hasBlobInMemory eklenen belge için true döner", () => {
  resetStore();
  const file = makeFile("sozlesme.pdf", "application/pdf", 800);
  const { doc } = addDoc({ docType: "Taşıma sözleşmesi" }, file);
  assert.equal(hasBlobInMemory(doc.id), true);
});

test("hasBlobInMemory silinmiş belge için false döner", () => {
  resetStore();
  const file = makeFile("teslim.png", "image/png", 300);
  const { doc } = addDoc({ docType: "Teslimat belgesi" }, file);
  deleteDoc(doc.id);
  assert.equal(hasBlobInMemory(doc.id), false);
});

test("Birden fazla belge doğru sırayla listelenir (en yeni önce)", () => {
  resetStore();
  const f1 = makeFile("a.pdf", "application/pdf", 100);
  const f2 = makeFile("b.pdf", "application/pdf", 200);
  const { doc: d1 } = addDoc({ docType: "Fatura" }, f1);
  const { doc: d2 } = addDoc({ docType: "Sevk irsaliyesi" }, f2);
  const docs = getDocs();
  assert.equal(docs.length, 2);
  // En son eklenen başta (addDoc prepend eder)
  assert.equal(docs[0].id, d2.id);
  assert.equal(docs[1].id, d1.id);
});

// ── formatBytes ───────────────────────────────────────────────────
test("formatBytes sıfır baytı düzgün formatlar", () => {
  assert.equal(formatBytes(0), "0 B");
});

test("formatBytes kilobaytı düzgün formatlar", () => {
  assert.equal(formatBytes(1024), "1.0 KB");
});

test("formatBytes megabaytı düzgün formatlar", () => {
  assert.equal(formatBytes(1024 * 1024), "1.0 MB");
});

// ── Constants ──────────────────────────────────────────────────────
test("DOC_TYPES dizisi beklenen belge türlerini içerir", () => {
  assert.ok(DOC_TYPES.includes("Sevk irsaliyesi"));
  assert.ok(DOC_TYPES.includes("Fatura"));
  assert.ok(DOC_TYPES.includes("Teslimat belgesi"));
  assert.ok(DOC_TYPES.includes("Taşıma sözleşmesi"));
  assert.ok(DOC_TYPES.includes("Diğer"));
});

test("ALLOWED_EXTENSIONS yalnızca güvenli formatları içerir", () => {
  assert.ok(ALLOWED_EXTENSIONS.includes(".pdf"));
  assert.ok(ALLOWED_EXTENSIONS.includes(".jpg"));
  assert.ok(ALLOWED_EXTENSIONS.includes(".png"));
  assert.ok(!ALLOWED_EXTENSIONS.includes(".exe"));
  assert.ok(!ALLOWED_EXTENSIONS.includes(".xlsx"));
});
