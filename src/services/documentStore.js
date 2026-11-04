/**
 * documentStore.js
 * Demo-mode local persistence for shipment/load document metadata.
 *
 * SECURITY DESIGN:
 *  - Only metadata (name, type, size, date, loadId, shipmentId, uploader)
 *    is stored in localStorage. Actual file bytes are kept in a module-level
 *    Map so they are never persisted to storage (prevents localStorage quota
 *    exhaustion and avoids storing binary data in a shared store).
 *  - All localStorage keys are scoped to the authenticated user's userId so
 *    different demo accounts cannot see each other's documents.
 *  - In live/API mode this store is NOT used; the caller must check
 *    liveMarketplaceEnabled() before calling these functions.
 *
 * BACKEND CONTRACT (for future integration):
 *  POST   /api/v1/loads/{loadId}/documents          → upload
 *  GET    /api/v1/loads/{loadId}/documents           → list
 *  DELETE /api/v1/loads/{loadId}/documents/{docId}  → delete
 *  GET    /api/v1/documents/{docId}/download         → download (pre-signed URL)
 *  Access is enforced server-side per company membership.
 */

// ── Constants ──────────────────────────────────────────────────────
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];
export const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const DOC_TYPES = [
  "Sevk irsaliyesi",
  "Teslimat belgesi",
  "Fatura",
  "Taşıma sözleşmesi",
  "Diğer",
];

// ── In-memory file blob store (never persisted) ────────────────────
// docId → { blob: Blob, fileName: string }
const FILE_BLOBS = new Map();

// ── Key helpers ────────────────────────────────────────────────────
/** Resolve the current user id without hard-importing authClient at module level.
 *  This keeps the module testable in Node without a DOM/browser environment. */
function uid() {
  try {
    // Dynamic import-like lazy resolution: check localStorage directly
    const raw = (typeof localStorage !== "undefined")
      ? localStorage.getItem("guc-session")
      : null;
    const session = raw ? JSON.parse(raw) : null;
    return session?.userId || "anon";
  } catch {
    return "anon";
  }
}
const DOCS_KEY = () => `logiway-docs-${uid()}`;

// ── Low-level storage ──────────────────────────────────────────────
function readDocs() {
  try {
    const raw = localStorage.getItem(DOCS_KEY());
    const parsed = JSON.parse(raw || "null");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDocs(docs) {
  try {
    localStorage.setItem(DOCS_KEY(), JSON.stringify(docs));
  } catch {
    // Storage quota exceeded — silently fail; in-memory state still works
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("logiway-documents-change", { detail: { key: DOCS_KEY() } }),
    );
  }
  return docs;
}

// ── Validation ─────────────────────────────────────────────────────
/**
 * Validate a File object before adding it to the store.
 * Returns { ok: true } or { ok: false, error: string }.
 */
export function validateFile(file) {
  if (!file) return { ok: false, error: "Dosya seçilmedi." };

  const ext = ("." + file.name.split(".").pop()).toLowerCase();
  const mimeOk = ALLOWED_MIME_TYPES.includes(file.type);
  const extOk = ALLOWED_EXTENSIONS.includes(ext);

  if (!mimeOk && !extOk) {
    return {
      ok: false,
      error: `Desteklenmeyen format. Yalnızca PDF, JPG ve PNG yüklenebilir.`,
    };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return {
      ok: false,
      error: `Dosya çok büyük (${mb} MB). En fazla 10 MB yüklenebilir.`,
    };
  }
  return { ok: true };
}

// ── CRUD ───────────────────────────────────────────────────────────
/** List all documents for the current user. */
export function getDocs() {
  return readDocs();
}

/**
 * Add a document record. The file blob is kept in memory only.
 * @param {{
 *   docType: string,
 *   loadId?: string,
 *   shipmentId?: string,
 *   uploader?: string,
 * }} meta
 * @param {File} file
 * @returns {{ ok: boolean, doc?: object, error?: string }}
 */
export function addDoc(meta, file) {
  const validation = validateFile(file);
  if (!validation.ok) return validation;

  const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const doc = {
    id,
    name: file.name,
    docType: meta.docType || "Diğer",
    loadId: meta.loadId || null,
    shipmentId: meta.shipmentId || null,
    uploader: meta.uploader || "Siz",
    uploadedAt: new Date().toLocaleDateString("tr-TR"),
    uploadedAtISO: new Date().toISOString(),
    size: file.size,
    sizeFmt: formatBytes(file.size),
    demo: true,
  };

  // Store blob in memory (not localStorage)
  FILE_BLOBS.set(id, { blob: file, fileName: file.name });

  const next = [doc, ...readDocs()];
  writeDocs(next);
  return { ok: true, doc };
}

/** Delete a document by id. */
export function deleteDoc(id) {
  FILE_BLOBS.delete(id);
  const next = readDocs().filter((d) => d.id !== id);
  writeDocs(next);
}

/**
 * Download (or open in new tab) a previously added document.
 * Returns { ok: boolean, error?: string }.
 */
export function downloadDoc(doc) {
  const entry = FILE_BLOBS.get(doc.id);
  if (!entry) {
    return {
      ok: false,
      error:
        "Dosya bu oturumda yüklenmedi. Sayfayı yenilediyseniz dosyayı tekrar yükleyin.",
    };
  }
  const url = URL.createObjectURL(entry.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = entry.fileName;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 150);
  return { ok: true };
}

/** Subscribe to document changes (same-tab and cross-tab). */
export function subscribeDocs(callback) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("logiway-documents-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("logiway-documents-change", callback);
    window.removeEventListener("storage", callback);
  };
}

/** True if a blob is available in memory for this docId. */
export function hasBlobInMemory(docId) {
  return FILE_BLOBS.has(docId);
}

// ── Utility ────────────────────────────────────────────────────────
export function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
