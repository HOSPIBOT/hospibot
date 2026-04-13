'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Users, Plus, Search, RefreshCw, X, Loader2,
  Star, Clock, Phone, ChevronLeft, ChevronRight,
  AlertTriangle, CheckCircle2, Calendar,
} from 'lucide-react';

const COLOR = '#BE185D';
const PLANS = ['Basic', 'Silver', 'Gold', 'Platinum', 'Corporate'];
const PLAN_COLORS: Record<string, string> = {
  Basic: 'bg-slate-100 text-slate-600', Silver: 'bg-slate-200 text-slate-700',
  Gold: 'bg-amber-100 text-amber-700', Platinum: 'bg-purple-100 text-purple-700', Corporate: 'bg-blue-100 text-blue-700',
};
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#BE185D] outline-none transition-all placeholder:text-slate-400';

function expiryStatus(expiry: string | null | undefined) {
  if (!expiry) return { label: 'No expiry', color: 'text-slate-400', icon: null };
  const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000);
  if (days < 0)  return { label: 'Expired',       color: 'text-red-500',    icon: AlertTriangle };
  if (days < 30) return { label: `${days}d left`,  color: 'text-amber-600',  icon: AlertTriangle };
  return          { label: formatDate(expiry),     color: 'text-emerald-600', icon: CheckCircle2 };
}

export default function WellnessMembersPage() {
  const [members,  setMembers]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [deb,      setDeb]      = useState('');
  const [planTab,  setPlanTab]  = useState('');
  const [meta,     setMeta]     = useState({ page: 1, total: 0, totalPages: 1 });
  const [showAdd,  setShowAdd]  = useState(false);
  const [patSearch, setPatSearch] = useState('');
  const [patSuggestions, setSuggestions] = useState<any[]>([]);
  const [form, setForm] = useState({ patId: '', patName: '', plan: 'Gold', sessions: 12, validUntil: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { const t = setTimeout(() => setDeb(search), 400); return () => clearTimeout(t); }, [search]);

  useEffect(() => {
    if (patSearch.length < 2) { setSuggestions([]); return; }
    api.get('/patients', { params: { search: patSearch, limit: 6 } })
      .then(r => setSuggestions(r.data.data || [])).catch(() => {});
  }, [patSearch]);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20, hasMembership: true };
      if (deb)    params.search = deb;
      if (planTab) params.membershipPlan = planTab;
      const res = await api.get('/patients', { params });
      setMembers(res.data.data ?? []);
      setMeta(res.data.meta ?? { page: 1, total: 0, totalPages: 1 });
    } catch { }
    finally { setLoading(false); }
  }, [deb, planTab]);

  useEffect(() => { load(1); }, [load]);

  const enroll = async () => {
    if (!form.patId) { toast.error('Select a patient'); return; }
    setSaving(true);
    try {
      const expiry = form.validUntil || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
      await api.patch(`/patients/${form.patId}`, {
        membershipPlan: form.plan, membershipExpiry: expiry, membershipSessions: form.sessions,
      });
      toast.success(`${form.patName} enrolled on ${form.plan} plan!`);
      setShowAdd(false);
      setForm({ patId: '', patName: '', plan: 'Gold', sessions: 12, validUntil: '' });
      setPatSearch(''); setSuggestions([]); load(1);
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Enrollment failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6" style={{ color: COLOR }} /> Membership Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{loading ? 'Loading…' : `${meta.total} enrolled members`}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(meta.page)} className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl" style={{ background: COLOR }}>
            <Plus className="w-4 h-4" /> Enroll Member
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400" placeholder="Search members…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')}><X className="w-3 h-3 text-slate-400" /></button>}
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {['', ...PLANS].map(p => (
            <button key={p} onClick={() => setPlanTab(p)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${planTab === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {p || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-32" />)}</div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
          <Star className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">{planTab ? `No ${planTab} plan members` : 'No enrolled members yet'}</p>
          {!planTab && <button onClick={() => setShowAdd(true)} className="mt-4 text-sm font-semibold hover:opacity-80" style={{ color: COLOR }}>Enroll first member →</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map(m => {
            const exp = expiryStatus(m.membershipExpiry);
            const ExpIcon = exp.icon;
            return (
              <div key={m.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: COLOR }}>
                      {m.firstName?.[0]}{m.lastName?.[0] || ''}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{m.firstName} {m.lastName || ''}</p>
                      <p className="text-xs text-slate-400">{m.phone}</p>
                    </div>
                  </div>
                  {m.membershipPlan && (
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${PLAN_COLORS[m.membershipPlan] ?? 'bg-slate-100 text-slate-600'}`}>
                      <Star className="w-2.5 h-2.5" /> {m.membershipPlan}
                    </span>
                  )}
                </div>
                <div className="space-y-1 mb-3">
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${exp.color}`}>
                    {ExpIcon && <ExpIcon className="w-3 h-3 flex-shrink-0" />}
                    {exp.label === formatDate(m.membershipExpiry) ? `Valid until ${exp.label}` : exp.label}
                  </div>
                  {m.membershipSessions && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" /> {m.membershipSessions} sessions
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <a href={`/clinical/patients/${m.id}`} className="flex-1 text-center text-xs font-medium border border-slate-200 text-slate-600 py-2 rounded-xl hover:bg-slate-50 transition-colors">View Profile</a>
                  <a href={`tel:${m.phone}`} className="flex items-center gap-1 text-xs font-medium text-slate-500 border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"><Phone className="w-3.5 h-3.5" /></a>
                  <button onClick={() => { setForm({ patId: m.id, patName: `${m.firstName} ${m.lastName || ''}`.trim(), plan: m.membershipPlan ?? 'Gold', sessions: m.membershipSessions ?? 12, validUntil: m.membershipExpiry?.slice(0, 10) ?? '' }); setShowAdd(true); }}
                    className="text-xs font-medium px-3 py-2 rounded-xl border transition-colors hover:opacity-80" style={{ borderColor: `${COLOR}40`, color: COLOR, background: `${COLOR}08` }}>Renew</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Page {meta.page} / {meta.totalPages}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => load(meta.page - 1)} disabled={meta.page === 1} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => load(meta.page + 1)} disabled={meta.page >= meta.totalPages} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{form.patId && members.some(m => m.id === form.patId) ? 'Renew Membership' : 'Enroll Member'}</h2>
              <button onClick={() => { setShowAdd(false); setForm({ patId: '', patName: '', plan: 'Gold', sessions: 12, validUntil: '' }); setPatSearch(''); }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {!form.patId ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Patient *</label>
                  <div className="relative">
                    <input className={inputCls} placeholder="Search patient…" value={patSearch} onChange={e => setPatSearch(e.target.value)} autoFocus />
                    {patSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                        {patSuggestions.map(p => (
                          <button key={p.id} onClick={() => { setForm(f => ({ ...f, patId: p.id, patName: `${p.firstName} ${p.lastName || ''}`.trim() })); setPatSearch(''); setSuggestions([]); }} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm">{p.firstName} {p.lastName || ''} · {p.phone}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-pink-50 rounded-xl px-4 py-2.5 border border-pink-200">
                  <span className="text-sm font-semibold text-pink-900">{form.patName}</span>
                  <button onClick={() => setForm(f => ({ ...f, patId: '', patName: '' }))}><X className="w-3.5 h-3.5 text-pink-400" /></button>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Plan</label>
                <select className={inputCls} value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}>{PLANS.map(p => <option key={p}>{p}</option>)}</select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Sessions</label><input type="number" min={1} className={inputCls} value={form.sessions} onChange={e => setForm(f => ({ ...f, sessions: Number(e.target.value) }))} /></div>
                <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Valid Until</label><input type="date" className={inputCls} value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} /></div>
              </div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button onClick={() => setShowAdd(false)} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
              <button onClick={enroll} disabled={saving} className="text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50 flex items-center gap-2" style={{ background: COLOR }}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />} {saving ? 'Saving…' : 'Enroll'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
