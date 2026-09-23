import { useCallback, useEffect, useState } from 'react';
import { Users, ShieldCheck, UserPlus } from 'lucide-react';
import { teamDirectory, teamCommand, teamImpact } from './teamApi';
import { teamRoles, capabilityLabels, roleName } from './permissions';
import { accountEmail } from './accountEmail';
import { Button, Field, Select, Check, Modal, Alert, Empty, useAction } from './ui';

export default function Team({ organizationId, location, locations, operators = [], corporate, onChanged }) {
  const [data, setData] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState('');
  const { busy, error, run, setError } = useAction();
  const reload = useCallback(async () => setData(await teamDirectory(organizationId)), [organizationId]);
  useEffect(() => {
    let active = true;
    teamDirectory(organizationId).then(value => { if (active) setData(value); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [organizationId, setError]);
  const rows = (data?.members || []).filter(m =>
    (filter === 'all' || (filter === 'active' ? m.active : !m.active)) &&
    `${m.name} ${m.email} ${m.location_name}`.toLowerCase().includes(query.toLowerCase()));
  const changed = async () => { await reload(); await onChanged?.(); };
  return <section className="retail-section retail-team retail-setup-target retail-store-scroll-target" id="retail-team" tabIndex={-1} aria-label="Team & permissions">
    <div className="team-heading"><div><span className="retail-eyebrow">PEOPLE & ACCESS</span><h2>Team & permissions</h2><p>Give each employee the tools and access they need.</p></div><Button primary onClick={() => setEditing({})}><UserPlus size={16} />Invite employee</Button></div>
    <Alert error={error} />{notice && <p role="status">{notice}</p>}
    <div className="team-toolbar"><Field label="Find an employee" value={query} onChange={setQuery} placeholder="Name, email or store" /><Select label="Status" value={filter} onChange={setFilter}><option value="all">All employees</option><option value="active">Active</option><option value="suspended">Suspended</option></Select></div>
    {!data ? <p role="status">Loading team…</p> : !rows.length ? <Empty><Users size={24} /><h3>{query ? 'No matching employees' : 'Build your team'}</h3><p>Invite employees using their work email.</p></Empty> : <div className="team-directory">{rows.map(m => <article className="team-person" key={m.id}><div className="team-avatar">{(m.name || m.email || '?').slice(0, 1).toUpperCase()}</div><div><strong>{m.name || m.email}</strong><p>{m.email}</p><small>{roleName(m)} · {m.location_name || 'Company / operator scope'}</small></div><span className="retail-badge">{m.active ? 'Active' : 'Suspended'}</span><Button onClick={() => setEditing(m)}>Manage access</Button></article>)}</div>}
    {!!data?.invitations?.length && <details className="team-history"><summary>Invitations · {data.invitations.length}</summary>{data.invitations.filter(i => `${i.email}`.toLowerCase().includes(query.toLowerCase())).map(i => <div className="retail-row" key={i.id}><div><strong>{i.email}</strong><p>{roleName(i)} · {i.location_ids?.length || (i.location_id ? 1 : 'Company')} stores · {i.accepted_at ? 'Accepted' : i.canceled_at ? 'Canceled' : new Date(i.expires_at) < new Date() ? 'Expired' : 'Invited'}</p></div>{!i.accepted_at && <div className="retail-actions"><Button disabled={busy} onClick={() => run(async () => { await teamCommand('renew', { organization_id: organizationId, id: i.id }); await accountEmail('invite', { invitation_id: i.id }); await reload(); setNotice('Invitation email sent.'); })}>Resend</Button>{!i.canceled_at && <Button disabled={busy} onClick={() => run(async () => { await teamCommand('cancel', { organization_id: organizationId, id: i.id }); await reload(); })}>Cancel invitation</Button>}</div>}</div>)}</details>}
    {!!data?.activity?.length && <details className="team-history"><summary>Recent access changes</summary>{data.activity.map((a, i) => <div className="retail-row" key={i}><span>{a.action.replace('team_', '').replaceAll('_', ' ')}</span><time>{new Date(a.created_at).toLocaleString()}</time></div>)}</details>}
    {editing && <EmployeeEditor key={editing.id || 'invite'} initial={editing} members={data?.members || []} corporate={corporate} organizationId={organizationId} location={location} locations={locations} operators={operators} onClose={() => setEditing(null)} onSaved={changed} />}
  </section>;
}

function EmployeeEditor({ initial, members, corporate, organizationId, location, locations, operators, onClose, onSaved }) {
  const [role, setRole] = useState(initial.access_role || initial.role || 'associate');
  const [email, setEmail] = useState(initial.email || '');
  const [locationIds, setLocationIds] = useState(initial.location_id ? [initial.location_id] : [location.id]);
  const [operatorId, setOperatorId] = useState(initial.operator_id || operators[0]?.id || '');
  const [permissions, setPermissions] = useState(initial.permissions || {});
  const [review, setReview] = useState(false);
  const [suspending, setSuspending] = useState(false);
  const [replacement, setReplacement] = useState('');
  const [unassigned, setUnassigned] = useState(false);
  const [impact, setImpact] = useState(null);
  const [inviteId, setInviteId] = useState(null);
  const { busy, error, run, setError } = useAction();
  useEffect(() => {
    if (!initial.id) return;
    let active = true;
    teamImpact(initial.id).then(value => { if (active) setImpact(value); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [initial.id, setError]);
  const currentStore = locationIds[0] || location.id;
  const worksAtStore = role !== 'organization_admin' && role !== 'operator';
  const transferNeeded = !!initial.id && !suspending && (role === 'reviewer' || permissions.customer_write === false) && (impact?.customers || impact?.tasks || impact?.conversations);
  const payload = { organization_id: organizationId, id: initial.id, revision: initial.revision, access_role: role, permissions, location_id: currentStore, location_ids: locationIds, operator_id: operatorId, email, reassign_to: replacement || null, confirm_unassigned: unassigned };
  const save = () => run(async () => {
    const created = initial.id ? null : inviteId || (await teamCommand('invite', payload)).id;
    if (created) {
      setInviteId(created);
      try { await accountEmail('invite', { invitation_id: created }); }
      catch (e) { throw new Error(`Invitation created, but email delivery failed: ${e.message}. Use Retry email.`, { cause: e }); }
    } else await teamCommand('update', payload);
    await onSaved(); onClose();
  });
  const roleOptions = Object.entries(teamRoles).filter(([key]) => {
    if (!corporate) return ['specialist', 'associate', 'reviewer'].includes(key);
    if (initial.id && ['organization_admin', 'operator'].includes(role)) return key === role;
    return true;
  });
  return <Modal wide title={initial.id ? 'Employee access' : 'Invite employee'} onClose={onClose}><div className="team-editor">
    <Alert error={error} />
    {suspending ? <>
      <h3>Suspend {initial.name || initial.email}</h3>
      <p>Access to this membership stops immediately. The employee currently owns {impact?.customers || 0} customers, {impact?.tasks || 0} open tasks and {impact?.conversations || 0} conversations.</p>
      {initial.location_id && <Select label="Reassign work to" value={replacement} onChange={setReplacement}><option value="">Unassigned queue</option>{members.filter(m => m.active && m.location_id === initial.location_id && m.user_id !== initial.user_id && !['reviewer'].includes(m.access_role)).map(m => <option key={m.id} value={m.user_id}>{m.name || m.email}</option>)}</Select>}
      {!replacement && <Check checked={unassigned} onChange={setUnassigned}>Move open work to the unassigned queue</Check>}
      <div className="retail-actions"><Button primary disabled={busy || (!replacement && !unassigned)} onClick={() => run(async () => { await teamCommand('suspend', payload); await onSaved(); onClose(); })}>Suspend access</Button><Button onClick={() => setSuspending(false)}>Back</Button></div>
    </> : review ? <>
      <ShieldCheck size={28} /><h3>Review access</h3><p><strong>{initial.name || email}</strong></p><p>{teamRoles[role].label} · {worksAtStore ? `${locationIds.length} ${locationIds.length === 1 ? 'store' : 'stores'}` : role === 'operator' ? 'Operator scope' : 'Company scope'}</p><p>{teamRoles[role].description}</p>
      {worksAtStore && <p>{locationIds.map(id => locations.find(l => l.id === id)?.name).filter(Boolean).join(', ')}</p>}
      {Object.entries(permissions).map(([key, value]) => <p key={key}>{capabilityLabels[key]}: {value ? 'Allowed' : 'Not allowed'}</p>)}
      {transferNeeded && <><p>Their assigned work needs a new owner because this role can no longer update customers.</p>{initial.location_id && <Select label="Reassign work to" value={replacement} onChange={setReplacement}><option value="">Unassigned queue</option>{members.filter(m => m.active && m.location_id === initial.location_id && m.user_id !== initial.user_id && m.access_role !== 'reviewer').map(m => <option key={m.id} value={m.user_id}>{m.name || m.email}</option>)}</Select>}{!replacement && <Check checked={unassigned} onChange={setUnassigned}>Move open work to the unassigned queue</Check>}</>}
      <div className="retail-actions"><Button primary disabled={busy || (transferNeeded && !replacement && !unassigned)} onClick={save}>{busy ? 'Saving…' : inviteId ? 'Retry email' : initial.id ? 'Save changes' : 'Send invitation'}</Button><Button disabled={busy} onClick={() => setReview(false)}>Back</Button></div>
    </> : <>
      <p>{initial.id ? initial.email : 'We’ll email an invitation. The employee must verify their work email before opening the workspace.'}</p>
      {!initial.id && <Field label="Work email" type="email" value={email} onChange={setEmail} required />}
      <Select label="Role" value={role} onChange={v => { setRole(v); setPermissions({}); }} >{roleOptions.map(([key, value]) => <option value={key} key={key}>{value.label}</option>)}</Select>
      <p className="retail-muted">{teamRoles[role]?.description}</p>
      {role === 'operator' && <Select label="Franchise or operator" value={operatorId} onChange={setOperatorId}>{operators.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</Select>}
      {worksAtStore && <div><h3>Store access</h3>{initial.id ? <p>{locations.find(l => l.id === initial.location_id)?.name || 'Assigned store'} · Invite them separately to additional stores.</p> : <div className="team-scope-list">{locations.map(l => <Check key={l.id} checked={locationIds.includes(l.id)} onChange={checked => setLocationIds(ids => checked ? [...ids, l.id] : ids.filter(id => id !== l.id))}>{l.name}</Check>)}</div>}</div>}
      <details><summary>Advanced permissions</summary><div className="team-permissions">{Object.entries(capabilityLabels).filter(([key]) => role !== 'reviewer' || ['customers', 'reports', 'exports'].includes(key)).map(([key, label]) => <Select key={key} label={label} value={permissions[key] === undefined ? 'default' : String(permissions[key])} onChange={v => setPermissions(p => { const next = { ...p }; if (v === 'default') delete next[key]; else next[key] = v === 'true'; return next; })}><option value="default">Role default</option><option value="true">Allow</option><option value="false">Deny</option></Select>)}</div></details>
      <div className="retail-actions"><Button primary disabled={busy || (!initial.id && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || (worksAtStore && !locationIds.length)))} onClick={() => setReview(true)}>Review access →</Button>{initial.id && (initial.active ? <Button onClick={() => setSuspending(true)}>Suspend access</Button> : <Button disabled={busy} onClick={() => run(async () => { await teamCommand('reactivate', payload); await onSaved(); onClose(); })}>Reactivate</Button>)}</div>
    </>}
  </div></Modal>;
}
