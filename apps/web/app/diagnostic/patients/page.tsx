'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatINR } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Users, Search, RefreshCw, Plus, ChevronRight, X, Loader2,
  FlaskConical, Phone, Calendar, CheckCircle2, AlertTriangle,
} from 'lucide-react';

const NAVY = '#1E3A5F';
const TEAL = '#0D7C66';
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none transition-all placeholder:text-slate-400';
const labelCls = 'block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide';

function AddPatientModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', gender: 'Male', dateOfBirth: '', email: '', address: '', bloodGroup: '' });
  const [saving, setSaving] = useState(false);
  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.firstName || !form.phone) { toast.error('Name and phone required'); return; }
    setSaving(true);
    try {
      await api.post('/patients', form);
      toast.success('Patient registered!'); onCreated(); onClose();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-slate-900">Register Patient</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div><label className={labelCls}>First Name *</label><input className={inputCls} placeholder="Ramesh" value={form.firstName} onChange={setF('firstName')} /></div>
          <div><label className={labelCls}>Last Name</label><input className={inputCls} placeholder="Kumar" value={form.lastName} onChange={setF('lastName')} /></div>
          <div><label className={labelCls}>Phone *</label><input className={inputCls} type="tel" placeholder="9876543210" value={form.phone} onChange={setF('phone')} /></div>
          <div><label className={labelCls}>Gender</label>
            <select className={inputCls} value={form.gender} onChange={setF('gender')}>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
          <div><label className={labelCls}>Date of Birth</label><input className={inputCls} type="date" value={form.dateOfBirth} onChange={setF('dateOfBirth')} /></div>
          <div><label className={labelCls}>Blood Group</label>
            <select className={inputCls} value={form.bloodGroup} onChange={setF('bloodGroup')}>
              <option value="">Unknown</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((bg: any) => <option key={bg}>{bg}</option>)}
            </select>
          </div>
          <div><label className={labelCls}>Email</label><input className={inputCls} type="email" placeholder="optional" value={form.email} onChange={setF('email')} /></div>
          <div className="col-span-2"><label className={labelCls}>Address</label><input className={inputCls} placeholder="Flat 4B, Kondapur" value={form.address} onChange={setF('address')} /></div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-[2] flex items-center justify-center gap-2 py-3 text-white font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-50"
            style={{ background: NAVY }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Register Patient
          </button>
        </div>
      </div>
    </div>
  );
}

function PatientCard({ p, onNewOrder }: { p: any; onNewOrder: (p: any) => void }) {
  const router = useRouter();
  const name = `${p.firstName} ${p.lastName || ''}`.trim();
  const age = p.dateOfBirth ? Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / (365.25 * 86400000)) : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all group">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0"
          style={{ background: NAVY }}>
          {name[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900">{name}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {p.gender}{age ? ` · ${age}y` : ''}{p.bloodGroup ? ` · ${p.bloodGroup}` : ''}
          </p>
        </div>
      </div>
      <div className="space-y-1.5 text-xs text-slate-500 mb-4">
        <p className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" />{p.phone}</p>
        {p.dateOfBirth && <p className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-slate-400" />{new Date(p.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
        {p.healthId && <p className="font-mono text-slate-400">🏥 {p.healthId}</p>}
      </div>
      <div className="flex gap-2">
        <button onClick={() => onNewOrder(p)}
          className="flex-1 flex items-center justify-center gap-1.5 text-white text-xs font-bold py-2 rounded-xl hover:opacity-90 transition-opacity"
          style={{ background: NAVY }}>
          <FlaskConical className="w-3.5 h-3.5" /> New Order
        </button>
        <button onClick={() => router.push(`/diagnostic/lab-orders?search=${encodeURIComponent(p.phone)}`)}
          className="px-3 py-2 text-xs font-bold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
          History
        </button>
      </div>
    </div>
  );
}

export default function DiagnosticPatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 24, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 24 };
      if (search) params.search = search;
      const res = await api.get('/patients', { params });
      setPatients(res.data.data ?? []);
      setMeta(res.data.meta ?? { total: 0, page: 1, limit: 24, totalPages: 1 });
    } finally { setLoading(false); }
  }, [page, search, refreshKey]);

  useEffect(() => { load(); }, [load]);

  const handleNewOrder = (p: any) => {
    router.push(`/diagnostic/lab-orders/new?patientId=${p.id}`);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Patients</h1>
          <p className="text-sm text-slate-500">{meta.total.toLocaleString('en-IN')} registered patients</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setRefreshKey(k => k + 1)}
            className="p-2.5 text-slate-500 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            style={{ background: NAVY }}>
            <Plus className="w-4 h-4" /> Register Patient
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input className={`${inputCls} pl-10`} placeholder="Search by name, phone, or Health ID…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        {search && (
          <button className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            onClick={() => setSearch('')}>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {Array.from({length:12}).map((_,i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-40" />)}
        </div>
      ) : patients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="font-semibold text-slate-500">{search ? `No patients found for "${search}"` : 'No patients yet'}</p>
          {!search && (
            <button onClick={() => setAdding(true)}
              className="mt-4 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 mx-auto flex items-center gap-2"
              style={{ background: NAVY }}>
              <Plus className="w-4 h-4" /> Register First Patient
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {patients.map((p: any) => <PatientCard key={p.id} p={p} onNewOrder={handleNewOrder} />)}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-500">Showing {(page-1)*meta.limit+1}–{Math.min(page*meta.limit, meta.total)} of {meta.total}</p>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-sm text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40">
              Previous
            </button>
            <span className="text-sm text-slate-500">{page} / {meta.totalPages}</span>
            <button disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-sm text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40">
              Next
            </button>
          </div>
        </div>
      )}

      {adding && <AddPatientModal onClose={() => setAdding(false)} onCreated={() => setRefreshKey(k => k + 1)} />}
    </div>
  );
}
