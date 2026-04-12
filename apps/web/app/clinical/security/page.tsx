'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Shield, Users, Activity, Lock, RefreshCw, X, Loader2,
  CheckCircle2, AlertTriangle, Eye, EyeOff, Clock, User,
  FileText, Trash2, Download,
} from 'lucide-react';

type Tab = 'overview' | 'users' | 'audit' | 'compliance';

const ROLES = ['ADMIN','DOCTOR','RECEPTIONIST','BILLING_STAFF','MARKETING_USER','LAB_TECHNICIAN','PHARMACIST','NURSE'];
const ROLE_COLORS: Record<string, string> = {
  ADMIN:'bg-red-100 text-red-700', DOCTOR:'bg-blue-100 text-blue-700',
  RECEPTIONIST:'bg-green-100 text-green-700', BILLING_STAFF:'bg-amber-100 text-amber-700',
  MARKETING_USER:'bg-purple-100 text-purple-700', LAB_TECHNICIAN:'bg-cyan-100 text-cyan-700',
  PHARMACIST:'bg-emerald-100 text-emerald-700', NURSE:'bg-pink-100 text-pink-700',
};

const ACTION_COLORS: Record<string, string> = {
  CREATE:'bg-emerald-100 text-emerald-700', READ:'bg-blue-100 text-blue-700',
  UPDATE:'bg-amber-100 text-amber-700', DELETE:'bg-red-100 text-red-700',
  EXPORT:'bg-purple-100 text-purple-700', LOGIN:'bg-slate-100 text-slate-600',
  ERASURE_REQUEST:'bg-red-200 text-red-800',
};

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] focus:ring-2 focus:ring-[#0D7C66]/10 outline-none transition-all placeholder:text-slate-400';

function RoleEditModal({ user, permissions, onClose, onUpdated }: {
  user: any; permissions: any[]; onClose: () => void; onUpdated: () => void;
}) {
  const [selectedRole, setRole] = useState(user.role);
  const [customPerms, setCustomPerms] = useState<string[]>([]);
  const [useCustom, setUseCustom] = useState(false);
  const [rolePerms, setRolePerms] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/security/permissions/roles/${selectedRole}`)
      .then(r => setRolePerms(r.data.permissions || []))
      .catch(() => {});
  }, [selectedRole]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.put(`/security/users/${user.id}/role`, {
        role: selectedRole,
        customPermissions: useCustom ? customPerms : undefined,
      });
      toast.success(`${user.firstName}'s role updated to ${selectedRole}`);
      onUpdated(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update role');
    } finally { setSubmitting(false); }
  };

  const togglePerm = (perm: string) => {
    setCustomPerms(p => p.includes(perm) ? p.filter(x => x !== perm) : [...p, perm]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Edit Role & Permissions</h2>
            <p className="text-xs text-slate-400 mt-0.5">{user.firstName} {user.lastName} · {user.email}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-4 h-4"/></button>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Role</label>
            <div className="grid grid-cols-4 gap-2">
              {ROLES.map(role => (
                <button key={role} onClick={() => setRole(role)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                    selectedRole === role ? 'border-[#0D7C66] bg-[#E8F5F0] text-[#0D7C66]' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}>
                  {role.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#E8F5F0] rounded-xl p-4 border border-[#0D7C66]/20">
            <p className="text-xs font-bold text-[#0D7C66] mb-2">DEFAULT PERMISSIONS FOR {selectedRole}</p>
            <div className="flex flex-wrap gap-1.5">
              {rolePerms.map(p => (
                <span key={p} className="text-[10px] font-medium bg-white text-[#0D7C66] px-2 py-0.5 rounded-full border border-[#0D7C66]/20">{p}</span>
              ))}
              {rolePerms.length === 0 && <span className="text-xs text-slate-400">Loading…</span>}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={useCustom} onChange={e => { setUseCustom(e.target.checked); if(e.target.checked) setCustomPerms(rolePerms); }}
              className="w-4 h-4 accent-[#0D7C66]" />
            <span className="text-sm font-medium text-slate-900">Customise permissions (override role defaults)</span>
          </label>

          {useCustom && (
            <div>
              <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wide">Select Individual Permissions</p>
              <div className="grid grid-cols-2 gap-2">
                {permissions.map(perm => (
                  <label key={perm.key} className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    customPerms.includes(perm.key) ? 'border-[#0D7C66] bg-[#E8F5F0]' : 'border-slate-100 hover:border-slate-200'
                  }`}>
                    <input type="checkbox" checked={customPerms.includes(perm.key)} onChange={() => togglePerm(perm.key)} className="w-3.5 h-3.5 mt-0.5 accent-[#0D7C66]" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{perm.key}</p>
                      <p className="text-[10px] text-slate-400">{perm.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting}
            className="bg-[#0D7C66] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-50 transition-colors flex items-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Role & Permissions
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SecurityPage() {
  const [tab, setTab]           = useState<Tab>('overview');
  const [stats, setStats]       = useState<any>(null);
  const [users, setUsers]       = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [editUser, setEditUser] = useState<any>(null);
  const [auditFilters, setAuditFilters] = useState({ entity: '', action: '' });
  const [auditMeta, setAuditMeta] = useState({ page: 1, total: 0, totalPages: 1 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, permsRes] = await Promise.all([
        api.get('/security/stats'),
        api.get('/security/users'),
        api.get('/security/permissions'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data ?? []);
      setPermissions(permsRes.data.permissions ?? []);
    } catch { toast.error('Failed to load security data'); }
    finally { setLoading(false); }
  }, []);

  const loadAudit = useCallback(async (page = 1) => {
    try {
      const params: any = { page, limit: 30 };
      if (auditFilters.entity) params.entity = auditFilters.entity;
      if (auditFilters.action) params.action = auditFilters.action;
      const res = await api.get('/security/audit-logs', { params });
      setAuditLogs(res.data.data ?? []);
      setAuditMeta(res.data.meta ?? { page: 1, total: 0, totalPages: 1 });
    } catch { /* ignore */ }
  }, [auditFilters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === 'audit') loadAudit(1); }, [tab, loadAudit]);

  const deactivateUser = async (userId: string, name: string) => {
    if (!window.confirm(`Deactivate ${name}? They will lose access immediately.`)) return;
    try {
      await api.put(`/security/users/${userId}/deactivate`);
      toast.success(`${name} deactivated`);
      load();
    } catch { toast.error('Failed to deactivate user'); }
  };

  const tabs = [
    { key: 'overview'    as Tab, label: 'Overview',    icon: Shield },
    { key: 'users'       as Tab, label: 'Team & RBAC', icon: Users },
    { key: 'audit'       as Tab, label: 'Audit Log',   icon: Activity },
    { key: 'compliance'  as Tab, label: 'Compliance',  icon: FileText },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-[#0D7C66]" /> Security & Compliance
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">User management, audit trails, and DPDPA compliance</p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 text-sm font-medium px-4 py-1.5 rounded-lg transition-all ${tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-4 gap-4">{Array.from({length:4}).map((_,i)=><div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-24"/>)}</div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Team Members',   value: stats?.totalUsers || 0,    icon: Users,         color: '#0D7C66' },
                { label: 'Logins (30d)',   value: stats?.recentLogins || 0,  icon: Lock,          color: '#3B82F6' },
                { label: 'Actions (30d)', value: stats?.recentActions || 0, icon: Activity,      color: '#F59E0B' },
                { label: 'Security Level', value: 'High',                    icon: Shield,        color: '#10B981' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5">
                  <div className="flex items-center gap-2 mb-2"><s.icon className="w-4 h-4" style={{color:s.color}}/><p className="text-xs text-slate-500">{s.label}</p></div>
                  <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Role breakdown */}
          {stats?.roleBreakdown && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Team by Role</h3>
              <div className="flex flex-wrap gap-3">
                {stats.roleBreakdown.map((r: any) => (
                  <div key={r.role} className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2.5">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${ROLE_COLORS[r.role] || 'bg-slate-100 text-slate-600'}`}>{r.role.replace('_', ' ')}</span>
                    <span className="text-sm font-bold text-slate-900">{r._count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security checklist */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Security Checklist</h3>
            <div className="space-y-3">
              {[
                { label: 'Row-Level Security (RLS)',    status: 'enabled',  desc: 'All data isolated by tenant_id at database level' },
                { label: 'JWT Authentication',          status: 'enabled',  desc: 'Short-lived access tokens with refresh rotation' },
                { label: 'RBAC Access Control',         status: 'enabled',  desc: 'Role-based permissions on all API endpoints' },
                { label: 'Audit Trail',                 status: 'enabled',  desc: 'All data access and modifications logged immutably' },
                { label: 'Data Encryption (Transit)',   status: 'enabled',  desc: 'TLS 1.3 on all API communication' },
                { label: 'Consent Management (DPDPA)',  status: 'enabled',  desc: 'Patient consent required for cross-provider data sharing' },
                { label: 'WhatsApp OTP (MFA)',          status: 'available', desc: 'Enable two-factor authentication via WhatsApp OTP' },
                { label: 'HIPAA BAA',                   status: 'pending',  desc: 'Business Associate Agreement for US healthcare clients' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-4 py-2.5 border-b border-slate-50 last:border-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    item.status === 'enabled' ? 'bg-emerald-100 text-emerald-700' : item.status === 'available' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.status === 'enabled' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    item.status === 'enabled' ? 'bg-emerald-100 text-emerald-700' : item.status === 'available' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Team & RBAC */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="bg-[#E8F5F0] border border-[#0D7C66]/20 rounded-xl px-4 py-3 text-xs text-[#0A5E4F]">
            <strong>Role-Based Access Control:</strong> Each team member has a role with default permissions. You can customise permissions per user by clicking Edit.
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Team Members ({users.length})</h3>
              <button onClick={load} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {loading ? (
              <div className="p-5 space-y-3">{Array.from({length:4}).map((_,i)=><div key={i} className="animate-pulse bg-slate-200 rounded-xl h-14"/>)}</div>
            ) : users.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">No team members found</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {users.map(u => {
                  const permCount = u.permissions ? Object.keys(u.permissions).length : 0;
                  return (
                    <div key={u.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group">
                      <div className="w-10 h-10 rounded-full bg-[#E8F5F0] text-[#0D7C66] flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {u.firstName?.[0]}{u.lastName?.[0] || ''}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{u.firstName} {u.lastName || ''}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${ROLE_COLORS[u.role] || 'bg-slate-100 text-slate-600'}`}>
                          {u.role?.replace('_', ' ')}
                        </span>
                        {permCount > 0 && (
                          <span className="text-[10px] text-slate-400">{permCount} custom perms</span>
                        )}
                        {u.lastLoginAt && (
                          <span className="text-[10px] text-slate-400">Last login: {formatDate(u.lastLoginAt)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => setEditUser(u)}
                          className="text-[10px] font-semibold text-[#0D7C66] bg-[#E8F5F0] border border-[#0D7C66]/30 px-2.5 py-1.5 rounded-lg hover:bg-[#0D7C66]/10 transition-colors">
                          Edit Role
                        </button>
                        <button onClick={() => deactivateUser(u.id, `${u.firstName} ${u.lastName || ''}`)}
                          className="text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
                          Deactivate
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Log */}
      {tab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
            <select value={auditFilters.entity} onChange={e => setAuditFilters(f => ({ ...f, entity: e.target.value }))}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none cursor-pointer">
              <option value="">All Entities</option>
              {['patient','appointment','invoice','user','setting','lead','automation_rule'].map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <select value={auditFilters.action} onChange={e => setAuditFilters(f => ({ ...f, action: e.target.value }))}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none cursor-pointer">
              <option value="">All Actions</option>
              {['CREATE','READ','UPDATE','DELETE','EXPORT','LOGIN','ERASURE_REQUEST'].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <button onClick={() => loadAudit(1)}
              className="px-3 py-2 bg-[#0D7C66] text-white text-sm font-medium rounded-xl hover:bg-[#0A5E4F] transition-colors">
              Filter
            </button>
            <span className="text-xs text-slate-400 ml-auto">{auditMeta.total.toLocaleString('en-IN')} events</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Time', 'User', 'Action', 'Entity', 'Record', 'IP'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {auditLogs.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-slate-400 text-sm">No audit logs found</td></tr>
                ) : auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3 text-xs text-slate-700">
                      {log.user ? `${log.user.firstName} ${log.user.lastName || ''}` : 'System'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-600'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs font-semibold text-slate-700">{log.entity}</td>
                    <td className="px-5 py-3 text-xs text-slate-400 font-mono truncate max-w-24">{log.entityId?.slice(0,8)}…</td>
                    <td className="px-5 py-3 text-xs text-slate-400">{log.ipAddress || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Compliance */}
      {tab === 'compliance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { title: 'DPDPA (India)', status: 'Active', color: '#10B981', desc: 'Digital Personal Data Protection Act compliance. Consent management, right to erasure, data minimisation enforced through the Health Vault module.' },
              { title: 'NABH Alignment', status: 'Partial', color: '#F59E0B', desc: 'HospiBot supports NABH-aligned clinical documentation, patient safety workflows, and quality management. Full certification assistance available on Enterprise plan.' },
              { title: 'ISO 27001', status: 'Roadmap', color: '#3B82F6', desc: 'Information security management system certification planned. Security controls, access management, and audit trails are in place.' },
              { title: 'HIPAA (USA)', status: 'Roadmap', color: '#6B7280', desc: 'Business Associate Agreements and HIPAA-compliant data handling planned for international expansion. Encryption and audit logs already in place.' },
            ].map(item => (
              <div key={item.title} className="bg-white rounded-2xl border border-slate-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900">{item.title}</h3>
                  <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ background: item.color }}>
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* DPDPA Actions */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">DPDPA Patient Rights</h3>
            <div className="space-y-3">
              {[
                { right: 'Right to Information', desc: 'Patients are informed when their data is collected via WhatsApp registration message', status: '✅ Enforced' },
                { right: 'Right to Consent', desc: 'WhatsApp consent flow before any cross-provider data sharing via Health Vault', status: '✅ Enforced' },
                { right: 'Right to Correction', desc: 'Staff can update patient demographics through the patient edit form', status: '✅ Available' },
                { right: 'Right to Erasure', desc: 'Patient data anonymisation via API with audit trail', status: '✅ Available' },
                { right: 'Right to Portability', desc: 'Full patient data export available via Security API', status: '✅ Available' },
                { right: 'Right to Grievance', desc: 'Grievance redressal officer contact required — configure in Settings', status: '⚠️ Configure' },
              ].map(item => (
                <div key={item.right} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.right}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 ml-4 flex-shrink-0">{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {editUser && (
        <RoleEditModal
          user={editUser}
          permissions={permissions}
          onClose={() => setEditUser(null)}
          onUpdated={load}
        />
      )}
    </div>
  );
}
