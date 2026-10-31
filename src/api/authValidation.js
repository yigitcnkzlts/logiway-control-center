export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_PATTERN = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$";
export const PASSWORD_REQUIREMENTS = "En az 12 karakter; büyük harf, küçük harf, rakam ve özel karakter kullanın.";

const FIELD_MESSAGES = {
  email: "Geçerli bir e-posta adresi girin.",
  password: PASSWORD_REQUIREMENTS,
  phone: "Telefon numarası en fazla 32 karakter olabilir.",
  role: "Geçerli bir hesap türü seçin.",
  companyName: "Firma unvanı 2–255 karakter arasında olmalıdır.",
  companyCountry: "Geçerli bir ülke seçin.",
  deviceFingerprint: "Cihaz bilgisi oluşturulamadı. Sayfayı yenileyip tekrar deneyin.",
  platform: "Platform bilgisi geçersiz.",
  deviceName: "Cihaz adı çok uzun.",
  locale: "Dil bilgisi geçersiz.",
  timezone: "Saat dilimi bilgisi geçersiz.",
};

const ERROR_CODE_MESSAGES = {
  VALIDATION_FAILED: "Lütfen kayıt bilgilerinizi kontrol edin.",
  CONFLICT: "Bu e-posta adresiyle daha önce hesap oluşturulmuş.",
  INVALID_CREDENTIALS: "E-posta adresi veya şifre hatalı.",
  RATE_LIMITED: "Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.",
  ACCOUNT_LOCKED: "Hesabınız geçici olarak kilitlendi. Lütfen daha sonra tekrar deneyin.",
};

export function validateRegistration({ email, password, phone, role, company, country }) {
  const fields = {};
  const normalizedEmail = email?.trim() || "";
  const normalizedCompany = company?.trim() || "";

  if (!normalizedEmail || normalizedEmail.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    fields.email = FIELD_MESSAGES.email;
  }
  if (!password || password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH || !new RegExp(PASSWORD_PATTERN).test(password)) {
    fields.password = FIELD_MESSAGES.password;
  }
  if ((phone || "").length > 32) fields.phone = FIELD_MESSAGES.phone;
  if (!["yuk-veren", "lojistik", "sofor"].includes(role)) fields.role = FIELD_MESSAGES.role;
  if (role !== "sofor" && (normalizedCompany.length < 2 || normalizedCompany.length > 255)) {
    fields.companyName = FIELD_MESSAGES.companyName;
  }
  if (!country) fields.companyCountry = FIELD_MESSAGES.companyCountry;

  return fields;
}

export function registrationValidationMessage(fields) {
  return Object.values(fields)[0] || "Lütfen kayıt bilgilerinizi kontrol edin.";
}

export function apiErrorMessage(body = {}, status = 0) {
  const fieldName = Object.keys(body.fields || {})[0];
  if (fieldName && FIELD_MESSAGES[fieldName]) return FIELD_MESSAGES[fieldName];
  if (body.errorCode && ERROR_CODE_MESSAGES[body.errorCode]) return ERROR_CODE_MESSAGES[body.errorCode];
  if (status === 400) return "Gönderilen bilgiler geçersiz. Lütfen formu kontrol edin.";
  if (status === 409) return ERROR_CODE_MESSAGES.CONFLICT;
  if (status === 429) return ERROR_CODE_MESSAGES.RATE_LIMITED;
  if (status >= 500) return "Sunucuda geçici bir sorun oluştu. Lütfen tekrar deneyin.";
  return body.detail || body.message || `API ${status}`;
}
