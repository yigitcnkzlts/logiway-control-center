import { getSession } from "../api/authClient.js";

export const TEAM_ROLES = ["Yönetici", "Operasyon", "Finans", "Görüntüleyici"];
export const TEAM_PERMISSIONS = [
  ["Yük oluşturma", ["Yönetici", "Operasyon"]],
  ["Yük düzenleme", ["Yönetici", "Operasyon"]],
  ["Teklif kabul / ret", ["Yönetici", "Operasyon"]],
  ["Mesajlaşma", ["Yönetici", "Operasyon"]],
  ["Belge görüntüleme", TEAM_ROLES],
  ["Belge yükleme", ["Yönetici", "Operasyon", "Finans"]],
  ["Ödeme görüntüleme", ["Yönetici", "Finans", "Görüntüleyici"]],
  ["Rapor indirme", ["Yönetici", "Operasyon", "Finans"]],
  ["Ekip yönetme", ["Yönetici"]],
];

const demoProfile = {
  name: "Kaya Dış Ticaret A.Ş.", type: "Yük Veren", country: "Türkiye", city: "İstanbul",
  address: "Ataşehir, İstanbul", phone: "+90 212 555 01 20", email: "operasyon@kaya.example",
  operationContact: "Deniz Kaya",
};
const demoMembers = [
  { id: "MEM-1", name: "Deniz Kaya", email: "deniz@kaya.example", role: "Yönetici", status: "Aktif", lastLogin: "Bugün 09:42", inviteStatus: "Kabul edildi" },
  { id: "MEM-2", name: "Selin Aras", email: "selin@kaya.example", role: "Operasyon", status: "Aktif", lastLogin: "Dün 17:18", inviteStatus: "Kabul edildi" },
  { id: "MEM-3", name: "Mert Acar", email: "mert@kaya.example", role: "Finans", status: "Davet bekliyor", lastLogin: "—", inviteStatus: "Gönderildi" },
];

function key() {
  let userId = "anon";
  try { userId = getSession()?.userId || "anon"; } catch { /* noop */ }
  return `logiway-company-team-${userId}`;
}

export function getCompanyTeam() {
  try {
    const stored = JSON.parse(localStorage.getItem(key()) || "null");
    if (stored?.profile && Array.isArray(stored.members)) return stored;
  } catch { /* seed below */ }
  return { profile: demoProfile, members: demoMembers };
}

export function saveCompanyTeam(data) {
  localStorage.setItem(key(), JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("logiway-company-team-change"));
  return data;
}

export function inviteTeamMember(data, member) {
  const normalizedEmail = String(member.email || "").trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) throw new Error("Geçerli bir e-posta adresi girin.");
  if (data.members.some((item) => item.email.toLowerCase() === normalizedEmail)) throw new Error("Bu e-posta zaten ekipte bulunuyor.");
  const next = {
    ...data,
    members: [...data.members, {
      id: `MEM-${Date.now()}`, name: String(member.name || "").trim(), email: normalizedEmail,
      role: TEAM_ROLES.includes(member.role) ? member.role : "Görüntüleyici",
      status: "Davet bekliyor", lastLogin: "—", inviteStatus: "Gönderildi", demo: true,
    }],
  };
  return saveCompanyTeam(next);
}

export function roleCan(role, permission) {
  return TEAM_PERMISSIONS.find(([name]) => name === permission)?.[1].includes(role) || false;
}
