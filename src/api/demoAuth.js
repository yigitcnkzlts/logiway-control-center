export const DEMO_CREDENTIALS = Object.freeze({
  email: "demo@logiway.com",
  password: "123456",
});

export const DEMO_ROLE_CODES = Object.freeze({
  "yuk-veren": "SHIPPER",
  lojistik: "LOGISTICS_COMPANY",
  sofor: "INDEPENDENT_DRIVER",
});

export const DEMO_ROLE_NAMES = Object.freeze({
  "yuk-veren": "Yük Veren",
  lojistik: "Lojistik Firması",
  sofor: "Şoför",
});

export function validateDemoCredentials(email, password) {
  return (
    email.trim().toLowerCase() === DEMO_CREDENTIALS.email &&
    password === DEMO_CREDENTIALS.password
  );
}

export function createDemoSession(role) {
  const roleCode = DEMO_ROLE_CODES[role];
  if (!roleCode) throw new Error("Geçersiz demo rolü.");
  return {
    userId: "logiway-demo-user",
    roles: [roleCode],
    companyName: `${DEMO_ROLE_NAMES[role] ?? "Demo"} Çalışma Alanı`,
    demo: true,
    selectedRole: role,
    enteredAt: new Date().toISOString(),
  };
}

/**
 * enterDemoSession — Tek çağrıyla demo oturumu oluşturur ve localStorage'a yazar.
 * Portal login formundaki "Demo olarak devam et" butonu bunu kullanır.
 * Gerçek JWT üretmez, backend'e istek göndermez.
 */
export function enterDemoSession(role) {
  const session = createDemoSession(role);
  localStorage.setItem("guc-session", JSON.stringify(session));
  return session;
}

/** Demo oturumunu temizler (live clearSession ile aynı anahtar). */
export function clearDemoSession() {
  localStorage.removeItem("guc-session");
}

/** Mevcut oturumun demo olup olmadığını kontrol eder. */
export function isDemoSession() {
  try {
    const s = JSON.parse(localStorage.getItem("guc-session") || "null");
    return s?.demo === true;
  } catch {
    return false;
  }
}
