export const DEMO_CREDENTIALS = Object.freeze({
  email: "demo@logiway.com",
  password: "123456",
});

export const DEMO_ROLE_CODES = Object.freeze({
  "yuk-veren": "SHIPPER",
  lojistik: "LOGISTICS_COMPANY",
  sofor: "INDEPENDENT_DRIVER",
});

export function validateDemoCredentials(email, password) {
  return email.trim().toLowerCase() === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password;
}

export function createDemoSession(role) {
  const roleCode = DEMO_ROLE_CODES[role];
  if (!roleCode) throw new Error("Geçersiz demo rolü.");

  return {
    userId: "logiway-demo-user",
    roles: [roleCode],
    companyName: "Logiway Demo",
    demo: true,
    selectedRole: role,
  };
}
