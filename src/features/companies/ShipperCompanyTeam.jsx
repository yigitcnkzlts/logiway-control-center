import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Check, LoaderCircle, Plus, RefreshCw, ShieldCheck, Trash2, UserRound, X } from "lucide-react";
import { getSession } from "../../api/authClient.js";
import {
  ASSIGNABLE_TEAM_ROLES,
  acceptCompanyInvitation,
  companyDisplayName,
  invitationStatusLabel,
  inviteCompanyMember,
  loadCompanyTeam,
  removeCompanyMember,
  revokeCompanyInvitation,
  roleLabel,
  updateCompanyMemberRole,
} from "../../api/companyTeamClient.js";
import { TEAM_PERMISSIONS, TEAM_ROLES, getCompanyTeam, inviteTeamMember } from "../../services/companyTeamStore.js";

const initials = (value = "") => value.split(/[\s@._-]+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "?";

export default function ShipperCompanyTeam({ live = false }) {
  const [data, setData] = useState(() => live ? null : getCompanyTeam());
  const [inviteOpen, setInviteOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(live);
  const [busy, setBusy] = useState("");

  const refresh = useCallback(async () => {
    if (!live) {
      setData(getCompanyTeam());
      return;
    }
    setLoading(true);
    setError("");
    try { setData(await loadCompanyTeam()); }
    catch (reason) { setError(reason.message || "Firma ve ekip bilgileri yüklenemedi."); }
    finally { setLoading(false); }
  }, [live]);

  useEffect(() => {
    if (live) { void refresh(); return undefined; }
    const update = () => setData(getCompanyTeam());
    window.addEventListener("logiway-company-team-change", update);
    return () => window.removeEventListener("logiway-company-team-change", update);
  }, [live, refresh]);

  useEffect(() => {
    if (!inviteOpen) return undefined;
    const close = (event) => event.key === "Escape" && setInviteOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [inviteOpen]);

  const actor = useMemo(() => {
    if (!live || !data) return null;
    return data.members.find((member) => member.userId === getSession()?.userId);
  }, [data, live]);
  const canManage = !live || ["OWNER", "ADMIN"].includes(actor?.role);

  async function invite(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy("invite");
    setError("");
    try {
      if (live) {
        await inviteCompanyMember(data.company.id, { email: form.get("email"), role: form.get("role") });
        await refresh();
      } else {
        setData(inviteTeamMember(data, { name: form.get("name"), email: form.get("email"), role: form.get("role") }));
      }
      setInviteOpen(false);
    } catch (reason) { setError(reason.message || "Davet oluşturulamadı."); }
    finally { setBusy(""); }
  }

  async function changeRole(member, role) {
    if (role === member.role) return;
    setBusy(member.userId); setError("");
    try { await updateCompanyMemberRole(data.company.id, member.userId, role); await refresh(); }
    catch (reason) { setError(reason.message || "Üye rolü güncellenemedi."); }
    finally { setBusy(""); }
  }

  async function removeMember(member) {
    if (!window.confirm(`${member.email} kullanıcısını ekipten çıkarmak istiyor musunuz?`)) return;
    setBusy(member.userId); setError("");
    try { await removeCompanyMember(data.company.id, member.userId); await refresh(); }
    catch (reason) { setError(reason.message || "Üye ekipten çıkarılamadı."); }
    finally { setBusy(""); }
  }

  async function revokeInvitation(invitation) {
    if (!window.confirm(`${invitation.email} adresine gönderilen daveti iptal etmek istiyor musunuz?`)) return;
    setBusy(invitation.id); setError("");
    try { await revokeCompanyInvitation(data.company.id, invitation.id); await refresh(); }
    catch (reason) { setError(reason.message || "Davet iptal edilemedi."); }
    finally { setBusy(""); }
  }

  async function acceptInvitation(invitation) {
    setBusy(invitation.id); setError("");
    try { await acceptCompanyInvitation(invitation.id); await refresh(); }
    catch (reason) { setError(reason.message || "Davet kabul edilemedi."); }
    finally { setBusy(""); }
  }

  const profile = live ? data?.company : data?.profile;
  const members = data?.members || [];
  const pendingInvitations = live ? (data?.invitations || []).filter((invitation) => invitation.status === "PENDING") : [];
  const myInvitations = live ? data?.myInvitations || [] : [];

  return <section className="team-center">
    <div className="team-heading">
      <div><span>FİRMA YÖNETİMİ</span><h1>Firma ve Ekip</h1><p>Firma profilinizi, ekip üyelerini ve rol bazlı erişimleri yönetin.</p></div>
      {canManage && <button className="portal-primary" onClick={() => { setError(""); setInviteOpen(true); }} disabled={loading}><Plus size={16}/> Üye Davet Et</button>}
    </div>
    {error && <div className="team-error" role="alert"><span>{error}</span><button type="button" onClick={() => void refresh()}><RefreshCw/> Yeniden dene</button></div>}
    {loading && !data ? <div className="team-loading" role="status"><LoaderCircle className="spin"/> Firma ve ekip bilgileri yükleniyor…</div> : profile && <>
      {myInvitations.length > 0 && <section className="team-my-invitations" aria-labelledby="my-team-invitations"><div><span>BEKLEYEN ÜYELİK DAVETLERİ</span><h2 id="my-team-invitations">Katılabileceğiniz {myInvitations.length} firma var</h2></div>{myInvitations.map((invitation) => <article key={invitation.id}><div><strong>Firma daveti</strong><small>{invitation.companyId} · {roleLabel(invitation.role)} · {new Date(invitation.expiresAt).toLocaleDateString("tr-TR")} tarihine kadar</small></div><button className="portal-primary" type="button" onClick={() => void acceptInvitation(invitation)} disabled={busy === invitation.id}>{busy === invitation.id ? "Kabul ediliyor…" : "Daveti kabul et"}</button></article>)}</section>}
      <article className="team-profile">
        <header><span><Building2/></span><div><small>FİRMA PROFİLİ</small><h2>{live ? companyDisplayName(profile) : profile.name}</h2><p>{live ? "Yük Veren" : profile.type}</p></div><em>{live ? profile.status : "DEMO"}</em></header>
        <dl>
          <div><dt>Ülke</dt><dd>{profile.country}</dd></div>
          <div><dt>Yasal unvan</dt><dd>{live ? profile.legalName : profile.name}</dd></div>
          <div><dt>Vergi numarası</dt><dd>{live ? profile.vatNumber || "—" : "Demo veri"}</dd></div>
          <div><dt>Firma durumu</dt><dd><ShieldCheck/>{live ? profile.status : "Demo"}</dd></div>
          <div><dt>Üyeliğiniz</dt><dd><UserRound/>{live ? roleLabel(actor?.role) : "Yönetici"}</dd></div>
        </dl>
      </article>
      <div className="team-grid">
        <section className="team-members"><header><div><span>EKİP ÜYELERİ</span><h2>{members.length} kullanıcı{pendingInvitations.length ? ` · ${pendingInvitations.length} bekleyen davet` : ""}</h2></div></header>
          {!members.length && !pendingInvitations.length && <p className="team-empty">Henüz ekip üyesi veya bekleyen davet bulunmuyor.</p>}
          {members.map((member) => {
            const email = member.email;
            const locked = live && member.role === "OWNER";
            return <article key={live ? member.userId : member.id}><span className="team-avatar">{initials(live ? email : member.name)}</span><div><strong>{live ? email : member.name}</strong><small>{live ? member.phone || "Telefon bilgisi yok" : member.email}</small></div>
              {live && canManage && !locked ? <select className="team-role-select" value={member.role === "MEMBER" ? "OPERATIONS" : member.role} disabled={busy === member.userId} onChange={(event) => void changeRole(member, event.target.value)} aria-label={`${email} rolü`}>{ASSIGNABLE_TEAM_ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select> : <b>{live ? roleLabel(member.role) : member.role}</b>}
              <div className="team-state"><em>{live ? "Aktif" : member.status}</em>{live && canManage && !locked && <button type="button" className="team-remove" onClick={() => void removeMember(member)} disabled={busy === member.userId}><Trash2/> Ekipten çıkar</button>}{!live && <><small>Son giriş: {member.lastLogin}</small><small>Davet: {member.inviteStatus}</small></>}</div></article>;
          })}
          {pendingInvitations.map((invitation) => <article key={invitation.id}><span className="team-avatar">{initials(invitation.email)}</span><div><strong>{invitation.email}</strong><small>{new Date(invitation.expiresAt).toLocaleDateString("tr-TR")} tarihine kadar geçerli</small></div><b>{roleLabel(invitation.role)}</b><div className="team-state"><em>{invitationStatusLabel(invitation.status)}</em>{canManage && <button type="button" className="team-remove" onClick={() => void revokeInvitation(invitation)} disabled={busy === invitation.id}><X/> Daveti iptal et</button>}</div></article>)}
        </section>
        <section className="team-permissions"><header><span>YETKİ MATRİSİ</span><h2>Rol erişimleri</h2></header><div className="team-permission-table"><table><thead><tr><th>Yetki</th>{TEAM_ROLES.map((role) => <th key={role}>{role}</th>)}</tr></thead><tbody>{TEAM_PERMISSIONS.map(([permission, roles]) => <tr key={permission}><td>{permission}</td>{TEAM_ROLES.map((role) => <td key={role}>{roles.includes(role) ? <Check aria-label="Yetkili"/> : <span aria-label="Yetkisiz">—</span>}</td>)}</tr>)}</tbody></table></div></section>
      </div>
    </>}
    {inviteOpen && <div className="team-modal" role="dialog" aria-modal="true" aria-labelledby="team-invite-title" onMouseDown={(event) => event.target === event.currentTarget && !busy && setInviteOpen(false)}><form onSubmit={invite}><header><div><span>EKİP DAVETİ</span><h2 id="team-invite-title">Yeni ekip üyesi</h2></div><button type="button" onClick={() => setInviteOpen(false)} aria-label="Davet penceresini kapat" disabled={Boolean(busy)}><X/></button></header>{error && <p role="alert">{error}</p>}{!live && <label>Ad soyad<input name="name" required autoFocus/></label>}<label>E-posta<input name="email" type="email" required autoFocus={live} autoComplete="email"/></label><label>Rol<select name="role">{live ? ASSIGNABLE_TEAM_ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>) : TEAM_ROLES.map((role) => <option key={role}>{role}</option>)}</select></label><small><ShieldCheck/> {live ? "Davet yalnızca bu e-posta adresiyle giriş yapan kullanıcı tarafından kabul edilebilir." : "Demo daveti yalnızca bu tarayıcıda saklanır; gerçek e-posta gönderilmez."}</small><button className="portal-primary" type="submit" disabled={Boolean(busy)}>{busy === "invite" ? <><LoaderCircle className="spin"/> Gönderiliyor…</> : live ? "Davet oluştur" : "Demo daveti oluştur"}</button></form></div>}
  </section>;
}
