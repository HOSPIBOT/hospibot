'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Building2, Plus, X, Loader2, CheckCircle2, Search } from 'lucide-react';

const NAVY = '#1E3A5F';
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none transition-all placeholder:text-slate-400';
const labelCls = 'block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide';

function AddModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ companyName: '', hrContactMobile: '', hrContactName: '', hrContactEmail: '', gstin: '', billingAddress: '', creditLimit: '', creditDays: '30' });
  const [saving, setSaving] = useState(false);
  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.companyName || !form.hrContactMobile) { toast.error('Company name and HR mobile required'); return; }
    setSaving(true);
    try {
      await api.post('/diagnostic/crm/corporates', { ...form, creditLimit: form.creditLimit ? +form.creditLimit * 100 : 0, creditDays: +form.creditDays });
      toast.success('Corporate client added');
      onSaved(); onClose();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-slate-900">Add Corporate Client</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className={labelCls}>Company Name *</label><input className={inputCls} placeholder="Infosys Ltd." value={form.companyName} onChange={setF('companyName')} /></div>
          <div><label className={labelCls}>HR Contact Name</label><input className={inputCls} placeholder="Meera Reddy" value={form.hrContactName} onChange={setF('hrContactName')} /></div>
          <div><label className={labelCls}>HR Mobile *</label><input className={inputCls} placeholder="9876543210" value={form.hrContactMobile} onChange={setF('hrContactMobile')} /></div>
          <div><label className={labelCls}>HR Email</label><input className={inputCls} placeholder="hr@infosys.com" value={form.hrContactEmail} onChange={setF('hrContactEmail')} /></div>
          <div><label className={labelCls}>GSTIN</label><input className={inputCls} placeholder="29AAACI1681G1ZJ" value={form.gstin} onChange={setF('gstin')} /></div>
          <div><label className={labelCls}>Credit Limit (₹)</label><input className={inputCls} type="number" placeholder="50000" value={form.creditLimit} onChange={setF('creditLimit')} /></div>
          <div><label className={labelCls}>Credit Days</label><input className={inputCls} type="number" placeholder="30" value={form.creditDays} onChange={setF('creditDays')} /></div>
          <div className="col-span-2"><label className={labelCls}>Billing Address</label><input className={inputCls} placeholder="Infosys Campus, Electronic City, Bengaluru" value={form.billingAddress} onChange={setF('billingAddress')} /></div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-[2] flex items-center justify-center gap-2 py-3 text-white font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-50" style={{ background: NAVY }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Add Client
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CorporatePage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get('/diagnostic/crm/corporates'); setClients(res.data ?? []); }
    finally { setLoading(false); }
  }, [refreshKey]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-900">Corporate Clients</h1><p className="text-sm text-slate-500">{clients.length} clients</p></div>
        <button onClick={() => setAdding(true)} className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity" style={{ background: NAVY }}>
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-36" />)}</div>
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center text-slate-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="font-semibold text-slate-500">No corporate clients yet</p>
          <p className="text-sm mt-1">Add companies for bulk health check management and credit billing</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {clients.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center text-[#1E3A5F] font-black">{c.companyName?.[0]}</div>
                <div className="flex-1 min-w-0"><p className="font-bold text-slate-900 truncate">{c.companyName}</p><p className="text-xs text-slate-400">{c.hrContactName ?? '—'}</p></div>
              </div>
              <div className="space-y-1 text-xs text-slate-500">
                <p>📱 {c.hrContactMobile}</p>
                {c.creditLimit > 0 && <p>💳 Credit: ₹{(c.creditLimit / 100).toLocaleString('en-IN')} ({c.creditDays}d)</p>}
                {c.gstin && <p>🏛️ {c.gstin}</p>}
                {c.contractExpiry && <p>📅 Exp: {new Date(c.contractExpiry).toLocaleDateString('en-IN')}</p>}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-50 flex gap-2">
                <a href={`https://wa.me/91${c.hrContactMobile?.slice(-10)}`} target="_blank" rel="noreferrer"
                  className="flex-1 py-2 text-xs font-bold text-center text-white rounded-xl hover:opacity-90" style={{ background: '#25D366' }}>
                  WhatsApp HR
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
      {adding && <AddModal onClose={() => setAdding(false)} onSaved={() => setRefreshKey(k => k + 1)} />}
    </div>
  );
}
