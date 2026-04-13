'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  CreditCard, RefreshCw, Download, Search, TrendingUp,
  CheckCircle2, AlertTriangle, Clock, ChevronLeft, ChevronRight,
  IndianRupee, Users, Building2, Zap,
} from 'lucide-react';

const PLANS = [
  { id: 'STARTER',    name: 'Starter',    price: 4900,   maxUsers: 5,  maxBranches: 1, features: ['WhatsApp Inbox', 'Appointments', 'Basic Billing'] },
  { id: 'GROWTH',     name: 'Growth',     price: 9900,   maxUsers: 15, maxBranches: 2, features: ['All Starter', 'CRM', 'Automation', 'Lab Module'] },
  { id: 'PROFESSIONAL',name:'Professional',price: 19900,  maxUsers: 50, maxBranches: 5, features: ['All Growth', 'Pharmacy', 'Bed Mgmt', 'FHIR API'] },
  { id: 'ENTERPRISE', name: 'Enterprise', price: 49900,  maxUsers: -1, maxBranches: -1,features: ['All Professional', 'Unlimited users', 'Custom integrations', 'Dedicated support'] },
];

const STATUS_COLORS: Record<string,string> = {
  ACTIVE:   'bg-emerald-100 text-emerald-700',
  TRIAL:    'bg-blue-100 text-blue-700',
  EXPIRED:  'bg-red-100 text-red-700',
  CANCELLED:'bg-slate-100 text-slate-600',
  PAUSED:   'bg-amber-100 text-amber-700',
};

export default function PlatformBillingPage() {
  const [tenants,   setTenants]   = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [page,      setPage]      = useState(1);
  const [meta,      setMeta]      = useState({ total:0, totalPages:1 });
  const [selected,  setSelected]  = useState<any>(null);
  const [planUpdate, setPlanUpdate] = useState('');
  const [saving,    setSaving]    = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/tenants', { params: { page: p, limit: 15, search: search || undefined } });
      setTenants(res.data.data ?? []);
      setMeta(res.data.meta ?? { total:0, totalPages:1 });
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { const t = setTimeout(() => load(1), 300); return () => clearTimeout(t); }, [search]);
  useEffect(() => { load(page); }, [page]);

  // Billing aggregates
  const totalMRR    = tenants.reduce((s,t) => s + (PLANS.find(p=>p.id===t.plan)?.price||0), 0);
  const activeCount = tenants.filter(t => t.status === 'ACTIVE').length;
  const trialCount  = tenants.filter(t => t.status === 'TRIAL').length;
  const churnCount  = tenants.filter(t => ['CANCELLED','EXPIRED'].includes(t.status)).length;

  const startCheckout = async (tenantId: string, plan: string) => {
    setSaving(true);
    try {
      const res = await api.post('/subscriptions/checkout', {
        plan, returnUrl: window.location.href,
      }, { headers: { 'x-tenant-id': tenantId } });
      if (res.data?.url) window.open(res.data.url, '_blank');
      else toast.success(res.data?.message || 'Checkout initiated');
    } catch { toast.error('Failed to create checkout'); }
    finally { setSaving(false); }
  };

  const updatePlan = async (tenantId: string, plan: string) => {
    setSaving(true);
    try {
      await api.patch(`/super-admin/tenants/${tenantId}/plan`, { plan });
      toast.success('Plan updated');
      setSelected(null); load();
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const exportCSV = async () => {
    setExporting(true);
    try {
      const res = await api.get('/super-admin/tenants', { params: { limit: 5000 } });
      const all: any[] = res.data.data ?? [];
      const header = ['Tenant','Plan','Status','MRR','Branches','Users','Joined'];
      const rows = all.map(t => [
        t.name, t.plan, t.status,
        `₹${(PLANS.find(p=>p.id===t.plan)?.price||0)/100}/mo`,
        t._count?.branches||0, t._count?.users||0,
        formatDate(t.createdAt),
      ]);
      const csv = [header,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob);
      const a=document.createElement('a'); a.href=url; a.download=`platform-billing-${new Date().toISOString().slice(0,10)}.csv`;
      a.click(); URL.revokeObjectURL(url); toast.success(`Exported ${all.length} tenants`);
    } catch { toast.error('Export failed'); } finally { setExporting(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#0D7C66]" /> Platform Billing
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Subscription management for all HospiBot tenants</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} disabled={exporting}
            className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-slate-50 disabled:opacity-50">
            <Download className="w-4 h-4"/> {exporting?'Exporting…':'Export'}
          </button>
          <button onClick={()=>load()} className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label:'Monthly Recurring Revenue', value:`₹${(totalMRR/100).toLocaleString('en-IN')}`, color:'#0D7C66', icon: IndianRupee },
          { label:'Active Tenants',            value: activeCount,                                  color:'#10B981', icon: Building2   },
          { label:'On Trial',                  value: trialCount,                                   color:'#3B82F6', icon: Clock       },
          { label:'Churned (This Month)',       value: churnCount,                                   color:'#EF4444', icon: AlertTriangle },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{background:`${k.color}15`}}>
              <k.icon className="w-5 h-5" style={{color:k.color}} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{k.label}</p>
              <p className="text-2xl font-bold mt-0.5" style={{color:k.color}}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Plans reference */}
      <div className="grid grid-cols-4 gap-4">
        {PLANS.map(plan => (
          <div key={plan.id} className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-slate-900">{plan.name}</p>
              <span className="text-xs font-bold text-[#0D7C66]">₹{plan.price/100}/mo</span>
            </div>
            <p className="text-xs text-slate-400 mb-2">{plan.maxUsers === -1 ? 'Unlimited' : `Up to ${plan.maxUsers}`} users · {plan.maxBranches === -1 ? 'Unlimited' : plan.maxBranches} branch{plan.maxBranches!==1?'es':''}</p>
            <div className="space-y-1">
              {plan.features.map(f => (
                <div key={f} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" /> {f}
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-900">{tenants.filter(t=>t.plan===plan.id).length} tenants</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tenants table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">All Tenants</h3>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
            <Search className="w-4 h-4 text-slate-400" />
            <input className="bg-transparent text-sm outline-none placeholder:text-slate-400 w-48" placeholder="Search tenant…" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
        </div>
        <table className="w-full">
          <thead><tr className="border-b border-slate-100">
            {['Tenant','Plan','Status','MRR','Branches','Users','Joined','Actions'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? Array.from({length:6}).map((_,i)=>(
              <tr key={i}>{Array.from({length:8}).map((__,j)=><td key={j} className="px-4 py-3"><div className="animate-pulse bg-slate-200 rounded h-4"/></td>)}</tr>
            )) : tenants.length===0 ? (
              <tr><td colSpan={8} className="py-16 text-center text-slate-400 text-sm">No tenants found</td></tr>
            ) : tenants.map(t => {
              const plan = PLANS.find(p => p.id === t.plan);
              const mrr = plan?.price || 0;
              return (
                <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#E8F5F0] text-[#0D7C66]">{t.plan||'FREE'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[t.status]||'bg-slate-100 text-slate-600'}`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">₹{mrr/100}/mo</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{t._count?.branches||0}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{t._count?.users||0}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(t.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setSelected(t); setPlanUpdate(t.plan||'STARTER'); }}
                      className="text-[11px] font-semibold text-[#0D7C66] bg-[#E8F5F0] px-2.5 py-1 rounded-lg hover:bg-[#0D7C66]/20">
                      Change Plan
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {meta.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
            <span>{meta.total} tenants</span>
            <div className="flex gap-1.5">
              <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="p-1.5 rounded-xl border border-slate-200 disabled:opacity-40"><ChevronLeft className="w-4 h-4"/></button>
              <button disabled={page>=meta.totalPages} onClick={()=>setPage(p=>p+1)} className="p-1.5 rounded-xl border border-slate-200 disabled:opacity-40"><ChevronRight className="w-4 h-4"/></button>
            </div>
          </div>
        )}
      </div>

      {/* Change Plan Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&setSelected(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Change Plan</h2>
                <p className="text-xs text-slate-400 mt-0.5">{selected.name} · Current: {selected.plan}</p>
              </div>
              <button onClick={()=>setSelected(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl">✕</button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {PLANS.map(plan => (
                <button key={plan.id} onClick={() => setPlanUpdate(plan.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${planUpdate===plan.id ? 'border-[#0D7C66] bg-[#E8F5F0]' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900">{plan.name}</p>
                    <p className="text-xs text-slate-400">{plan.features.slice(0,2).join(' · ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#0D7C66]">₹{plan.price/100}/mo</p>
                    {planUpdate===plan.id && <CheckCircle2 className="w-4 h-4 text-[#0D7C66] ml-auto mt-1" />}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button onClick={()=>setSelected(null)} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
              <button onClick={() => updatePlan(selected.id, planUpdate)} disabled={saving||planUpdate===selected.plan}
                className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50">
                {saving ? 'Updating…' : 'Update Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
