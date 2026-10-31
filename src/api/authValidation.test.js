import assert from "node:assert/strict";
import test from "node:test";
import {
  apiErrorMessage,
  PASSWORD_REQUIREMENTS,
  registrationValidationMessage,
  validateRegistration,
} from "./authValidation.js";

const validRegistration = {
  email: "user@example.com",
  password: "SecurePass123!",
  phone: "0555 111 22 33",
  role: "yuk-veren",
  company: "Örnek Taşımacılık",
  country: "Türkiye",
};

test("all three registration roles accept backend-compatible fields", () => {
  for (const role of ["yuk-veren", "lojistik", "sofor"]) {
    assert.deepEqual(validateRegistration({ ...validRegistration, role, company: role === "sofor" ? "Ada Sürücü" : validRegistration.company }), {});
  }
});

test("registration rejects passwords that Spring validation rejects", () => {
  const fields = validateRegistration({ ...validRegistration, password: "short" });
  assert.equal(fields.password, PASSWORD_REQUIREMENTS);
  assert.equal(registrationValidationMessage(fields), PASSWORD_REQUIREMENTS);
});

test("company roles require a backend-compatible company name", () => {
  assert.ok(validateRegistration({ ...validRegistration, company: "A" }).companyName);
  assert.equal(validateRegistration({ ...validRegistration, role: "sofor", company: "A" }).companyName, undefined);
});

test("RFC 7807 validation fields are translated to a Turkish message", () => {
  assert.equal(apiErrorMessage({ errorCode: "VALIDATION_FAILED", detail: "Validation failed", fields: { password: "Size must be between 12 and 128" } }, 400), PASSWORD_REQUIREMENTS);
  assert.equal(apiErrorMessage({ errorCode: "RATE_LIMITED", detail: "Too many requests" }, 429), "Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.");
});
