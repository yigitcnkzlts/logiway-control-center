import { apiJson } from "./apiClient.js";
import { getSession } from "./authClient.js";

export const ASSIGNABLE_TEAM_ROLES = [
  { value: "ADMIN", label: "Yönetici" },
  { value: "OPERATIONS", label: "Operasyon" },
  { value: "FINANCE", label: "Finans" },
  { value: "VIEWER", label: "Görüntüleyici" },
];

export const TEAM_ROLE_LABELS = {
  OWNER: "Sahip",
  ADMIN: "Yönetici",
  MEMBER: "Operasyon",
  OPERATIONS: "Operasyon",
  FINANCE: "Finans",
  VIEWER: "Görüntüleyici",
};

export const INVITATION_STATUS_LABELS = {
  PENDING: "Davet bekliyor",
  ACCEPTED: "Kabul edildi",
  REVOKED: "İptal edildi",
  EXPIRED: "Süresi doldu",
};

function preferredShipperCompany(companies, session = getSession()) {
  const sessionCompany = companies.find((company) => company.id === session?.companyId);
  return sessionCompany?.type === "SHIPPER"
    ? sessionCompany
    : companies.find((company) => company.type === "SHIPPER");
}

export async function resolveShipperCompany() {
  const companies = await apiJson("/api/v1/companies/mine");
  const company = preferredShipperCompany(companies);
  if (!company) throw new Error("Yük Veren firma hesabı bulunamadı.");
  return company;
}

export async function loadCompanyTeam() {
  const company = await resolveShipperCompany();
  const [members, invitations, myInvitations] = await Promise.all([
    apiJson(`/api/v1/companies/${company.id}/members`),
    apiJson(`/api/v1/companies/${company.id}/invitations`).catch((error) => {
      if (error.status === 403) return [];
      throw error;
    }),
    apiJson("/api/v1/companies/invitations/mine"),
  ]);
  return { company, members, invitations, myInvitations };
}

export async function inviteCompanyMember(companyId, { email, role }) {
  return apiJson(`/api/v1/companies/${companyId}/invitations`, {
    method: "POST",
    body: JSON.stringify({ email: email.trim(), role }),
  });
}

export async function updateCompanyMemberRole(companyId, userId, role) {
  return apiJson(`/api/v1/companies/${companyId}/members/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function removeCompanyMember(companyId, userId) {
  return apiJson(`/api/v1/companies/${companyId}/members/${userId}`, { method: "DELETE" });
}

export async function revokeCompanyInvitation(companyId, invitationId) {
  return apiJson(`/api/v1/companies/${companyId}/invitations/${invitationId}`, { method: "DELETE" });
}

export async function acceptCompanyInvitation(invitationId) {
  return apiJson(`/api/v1/companies/invitations/${invitationId}/accept`, { method: "POST" });
}

export function companyDisplayName(company) {
  return company?.tradeName || company?.legalName || "Firma";
}

export function roleLabel(role) {
  return TEAM_ROLE_LABELS[role] || role || "—";
}

export function invitationStatusLabel(status) {
  return INVITATION_STATUS_LABELS[status] || status || "—";
}
