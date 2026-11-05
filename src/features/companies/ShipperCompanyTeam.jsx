import { useEffect, useState } from "react";
import { Building2, Check, Mail, MapPin, Phone, Plus, ShieldCheck, UserRound, X } from "lucide-react";
import { TEAM_PERMISSIONS, TEAM_ROLES, getCompanyTeam, inviteTeamMember } from "../../services/companyTeamStore";

export default function ShipperCompanyTeam() {
  const [data, setData] = useState(() => getCompanyTeam());
  const [inviteOpen, setInviteOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const refresh = () => setData(getCompanyTeam());
    window.addEventListener("logiway-company-team-change", refresh);
    return () => window.removeEventListener("logiway-company-team-change", refresh);
  }, []);
  useEffect(() => {
    if (!inviteOpen) return;
    const close = (event) => event.key === "Escape" && setInviteOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [inviteOpen]);

  function invite(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      setData(inviteTeamMember(data, { name: form.get("name"), email: form.get("email"), role: form.get("role") }));
      setInviteOpen(false); setError("");
    } catch (reason) { setError(reason.message); }
  }

  return <section className="team-center">
    <div className="team-heading">
      <div><span>FİRMA YÖNETİMİ</span><h1>Firma ve Ekip</h1><p>Firma profilinizi, ekip üyelerini ve rol bazlı erişimleri yönetin.</p></div>
      <button className="portal-primary" onClick={() => setInviteOpen(true)}><Plus size={16}/> Üye Davet Et</button>
    </div>
    <article className="team-profile">
      <header><span><Building2/></span><div><small>FİRMA PROFİLİ</small><h2>{data.profile.name}</h2><p>{data.profile.type}</p></div><em>DEMO</em></header>
      <dl>
        <div><dt>Konum</dt><dd><MapPin/>{data.profile.city}, {data.profile.country}</dd></div>
        <div><dt>Adres</dt><dd>{data.profile.address}</dd></div>
        <div><dt>Telefon</dt><dd><Phone/>{data.profile.phone}</dd></div>
        <div><dt>E-posta</dt><dd><Mail/>{data.profile.email}</dd></div>
        <div><dt>Operasyon yetkilisi</dt><dd><UserRound/>{data.profile.operationContact}</dd></div>
      </dl>
    </article>
    <div className="team-grid">
      <section className="team-members"><header><div><span>EKİP ÜYELERİ</span><h2>{data.members.length} kullanıcı</h2></div></header>
        {data.members.map((member) => <article key={member.id}><span className="team-avatar">{member.name.split(" ").map((part) => part[0]).join("").slice(0,2)}</span><div><strong>{member.name}</strong><small>{member.email}</small></div><b>{member.role}</b><div className="team-state"><em>{member.status}</em><small>Son giriş: {member.lastLogin}</small><small>Davet: {member.inviteStatus}</small></div></article>)}
      </section>
      <section className="team-permissions"><header><span>YETKİ MATRİSİ</span><h2>Rol erişimleri</h2></header><div className="team-permission-table"><table><thead><tr><th>Yetki</th>{TEAM_ROLES.map((role) => <th key={role}>{role}</th>)}</tr></thead><tbody>{TEAM_PERMISSIONS.map(([permission, roles]) => <tr key={permission}><td>{permission}</td>{TEAM_ROLES.map((role) => <td key={role}>{roles.includes(role) ? <Check aria-label="Yetkili"/> : <span aria-label="Yetkisiz">—</span>}</td>)}</tr>)}</tbody></table></div></section>
    </div>
    {inviteOpen && <div className="team-modal" role="dialog" aria-modal="true" aria-labelledby="team-invite-title" onMouseDown={(event) => event.target === event.currentTarget && setInviteOpen(false)}><form onSubmit={invite}><header><div><span>EKİP DAVETİ</span><h2 id="team-invite-title">Yeni ekip üyesi</h2></div><button type="button" onClick={() => setInviteOpen(false)} aria-label="Davet penceresini kapat"><X/></button></header>{error && <p role="alert">{error}</p>}<label>Ad soyad<input name="name" required autoFocus/></label><label>E-posta<input name="email" type="email" required/></label><label>Rol<select name="role">{TEAM_ROLES.map((role) => <option key={role}>{role}</option>)}</select></label><small><ShieldCheck/> Demo daveti yalnızca bu tarayıcıda saklanır; gerçek e-posta gönderilmez.</small><button className="portal-primary" type="submit">Demo daveti oluştur</button></form></div>}
  </section>;
}
