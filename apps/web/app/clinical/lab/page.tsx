'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { FlaskConical, Plus, Search, RefreshCw, X, Loader2, ChevronLeft, ChevronRight, Download } from 'lucide-react';

const STATUS_COLORS: Record<string,string> = {
  ORDERED:          'bg-blue-100 text-blue-700',
  SAMPLE_COLLECTED: 'bg-violet-100 text-violet-700',
  PROCESSING:       'bg-amber-100 text-amber-700',
  COMPLETED:        'bg-emerald-100 text-emerald-700',
  DELIVERED:        'bg-teal-100 text-teal-700',
};

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none transition-all placeholder:text-slate-400';

export default function ClinicalLabPage() {
  const [orders, setOrders]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [deb, setDeb]           = useState('');
  const [meta, setMeta]         = useState({ page: 1, total: 0, totalPages: 1, limit: 20 });
  const [showOrder, setShow]    = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [exporting, setExporting] = useState(false);

  const exportCSV = async () => {
    setExporting(true);
    try {
      const params: any = { limit: 5000 };
      if (deb)            params.search   = deb;
      if (statusFilter)   params.status   = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      const res = await api.get('/lab/orders', { params });
      const all: any[] = res.data.data ?? orders;
      const header = ['Order #', 'Patient', 'Phone', 'Tests', 'Priority', 'Status', 'Date'];
      const rows = all.map((o: any) => [
        o.id?.slice(0, 8).toUpperCase() ?? '',
        `${o.patient?.firstName ?? ''} ${o.patient?.lastName ?? ''}`.trim(),
        o.patient?.phone ?? '',
        (o.tests as any[])?.map((t: any) => t.testName).join('; ') ?? '',
        o.priority ?? 'ROUTINE',
        o.status ?? '',
        o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : '',
      ]);
      const csv  = [header, ...rows].map((r: any) => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `lab-orders-${new Date().toISOString().slice(0,10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast.success(`Exported ${all.length} lab orders`);
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  // New order form state
  const [patSearch, setPatSearch] = useState('');
  const [patients, setPatients]   = useState<any[]>([]);
  const [selPat, setSelPat]       = useState<any>(null);
  const [catalog, setCatalog]     = useState<any[]>([]);
  const [selTests, setSelTests]   = useState<string[]>([]);
  const [priority, setPriority]   = useState('ROUTINE');
  const [notes, setNotes]         = useState('');
  const [saving, setSaving]       = useState(false);

  useEffect(() => { const t = setTimeout(()=>setDeb(search), 350); return ()=>clearTimeout(t); }, [search]);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (deb)            params.search   = deb;
      if (statusFilter)   params.status   = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      const res = await api.get('/lab/orders', { params });
      setOrders(res.data.data ?? []);
      setMeta(res.data.meta ?? { page: 1, total: 0, totalPages: 1, limit: 20 });
    } catch { toast.error('Failed to load lab orders'); }
    finally { setLoading(false); }
  }, [deb, statusFilter, priorityFilter]);

  useEffect(() => { load(1); }, [load]);

  useEffect(() => {
    if (!patSearch || patSearch.length < 2) { setPatients([]); return; }
    const t = setTimeout(() =>
      api.get('/patients', { params: { search: patSearch, limit: 6 } })
        .then(r => setPatients(r.data.data ?? [])).catch(()=>{}), 300);
    return ()=>clearTimeout(t);
  }, [patSearch]);

  useEffect(() => {
    if (showOrder)
      api.get('/lab/catalog').then(r => setCatalog(r.data ?? [])).catch(()=>{});
  }, [showOrder]);

  const toggleTest = (id: string) =>
    setSelTests(p => p.includes(id) ? p.filter((x: any) =>x!==id) : [...p, id]);

  const createOrder = async () => {
    if (!selPat) { toast.error('Select a patient'); return; }
    if (!selTests.length) { toast.error('Select at least one test'); return; }
    setSaving(true);
    try {
      const tests = catalog.filter((c: any) => selTests.includes(c.id)).map((c: any) => ({ testId: c.id, testName: c.name, price: c.price }));
      await api.post('/lab/orders', { patientId: selPat.id, tests, priority, notes: notes || undefined });
      toast.success('Lab order created!');
      setShow(false); setSelPat(null); setSelTests([]); setNotes(''); setPatSearch('');
      load(1);
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-[#0D7C66]" /> Lab Orders
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{meta.total.toLocaleString('en-IN')} orders</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>load(meta.page)} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/>
          </button>
          <button onClick={exportCSV} disabled={exporting}
            className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
            <Download className="w-4 h-4"/> {exporting ? 'Exporting…' : 'Export'}
          </button>
          <button onClick={()=>setShow(true)}
            className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#0A5E4F]">
            <Plus className="w-4 h-4"/> New Order
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0"/>
          <input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400"
            placeholder="Search by patient name or order number…" value={search} onChange={e=>setSearch(e.target.value)}/>
          {search && <button onClick={() => setSearch('')}><X className="w-3 h-3 text-slate-400" /></button>}
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {[
              { key: '',                 label: 'All'       },
              { key: 'ORDERED',          label: 'Ordered'   },
              { key: 'SAMPLE_COLLECTED', label: 'Collected' },
              { key: 'PROCESSING',       label: 'Processing'},
              { key: 'COMPLETED',        label: 'Ready'     },
              { key: 'DELIVERED',        label: 'Delivered' },
            ].map((s: any) => (
              <button key={s.key} onClick={() => setStatusFilter(s.key)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === s.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>{s.label}</button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {[
              { key: '',        label: 'All'     },
              { key: 'ROUTINE', label: 'Routine' },
              { key: 'URGENT',  label: '⚡ Urgent'},
              { key: 'STAT',    label: '🔴 STAT'  },
            ].map((p: any) => (
              <button key={p.key} onClick={() => setPriorityFilter(p.key)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                  priorityFilter === p.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>{p.label}</button>
            ))}
          </div>
          {(statusFilter || priorityFilter) && (
            <button onClick={() => { setStatusFilter(''); setPriorityFilter(''); }}
              className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 px-2 py-1.5">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-20"/>)}</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
          <FlaskConical className="w-12 h-12 text-slate-200 mx-auto mb-3"/>
          <p className="text-slate-400 text-sm">No lab orders found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-slate-50 border-b border-slate-100">
              {['Order #','Patient','Tests','Priority','Date','Status',''].map((h: any) =>(
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map((o: any) =>{
                const tests = (o.tests as any[]) ?? [];
                return (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600">{o.orderNumber}</td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold text-slate-900">{o.patient?.firstName} {o.patient?.lastName||''}</p>
                      <p className="text-xs text-slate-400">{o.patient?.phone}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600">{tests.slice(0,2).map((t:any)=>t.testName||t).join(', ')}{tests.length>2&&` +${tests.length-2}`}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${o.priority==='URGENT'?'bg-red-100 text-red-700':'bg-slate-100 text-slate-600'}`}>
                        {o.priority||'ROUTINE'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{formatDate(o.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[o.status]||'bg-slate-100 text-slate-600'}`}>
                        {o.status?.replace('_',' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <a href={`/diagnostic/lab-orders/${o.id}`}
                        className="text-[11px] font-semibold text-[#0D7C66] hover:underline">View →</a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {meta.totalPages>1&&(
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">{(meta.page-1)*meta.limit+1}–{Math.min(meta.page*meta.limit,meta.total)} of {meta.total}</p>
          <div className="flex items-center gap-1">
            <button onClick={()=>load(meta.page-1)} disabled={meta.page===1} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4"/></button>
            <span className="text-xs text-slate-600 px-3">{meta.page}/{meta.totalPages}</span>
            <button onClick={()=>load(meta.page+1)} disabled={meta.page>=meta.totalPages} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"><ChevronRight className="w-4 h-4"/></button>
          </div>
        </div>
      )}

      {showOrder&&(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&setShow(false)}>
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">New Lab Order</h2>
              <button onClick={()=>setShow(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4"/></button>
            </div>
            <div className="overflow-y-auto px-6 py-5 space-y-4 flex-1">
              {/* Patient search */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Patient *</label>
                {selPat ? (
                  <div className="flex items-center justify-between bg-[#E8F5F0] border border-[#0D7C66]/20 rounded-xl px-4 py-2.5">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{selPat.firstName} {selPat.lastName||''}</p>
                      <p className="text-xs text-slate-500">{selPat.phone} · {selPat.healthId}</p>
                    </div>
                    <button onClick={()=>setSelPat(null)} className="text-xs text-[#0D7C66] hover:underline">Change</button>
                  </div>
                ) : (
                  <div className="relative">
                    <input className={inputCls} placeholder="Search patient by name or phone…"
                      value={patSearch} onChange={e=>setPatSearch(e.target.value)} autoFocus/>
                    {patients.length>0&&(
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                        {patients.map((p: any) =>(
                          <button key={p.id} onClick={()=>{setSelPat(p);setPatSearch('');setPatients([]);}}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                            <p className="text-sm font-semibold text-slate-900">{p.firstName} {p.lastName||''}</p>
                            <p className="text-xs text-slate-400">{p.phone} · {p.healthId}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Test selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Tests * ({selTests.length} selected)</label>
                {catalog.length===0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">Loading catalog…</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-50">
                    {catalog.map((t: any) =>{
                      const sel = selTests.includes(t.id);
                      return (
                        <label key={t.id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 ${sel?'bg-[#E8F5F0]':''}`}>
                          <input type="checkbox" checked={sel} onChange={()=>toggleTest(t.id)} className="accent-[#0D7C66]"/>
                          <span className="flex-1 text-sm text-slate-800">{t.name}</span>
                          {t.code&&<span className="text-[10px] font-mono text-slate-400">{t.code}</span>}
                          {t.price&&<span className="text-xs font-semibold text-slate-600">₹{t.price/100}</span>}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Priority</label>
                  <select className={inputCls} value={priority} onChange={e=>setPriority(e.target.value)}>
                    <option value="ROUTINE">Routine</option>
                    <option value="URGENT">Urgent</option>
                    <option value="STAT">STAT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Notes</label>
                  <input className={inputCls} placeholder="Fasting, special instructions…" value={notes} onChange={e=>setNotes(e.target.value)}/>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button onClick={()=>setShow(false)} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
              <button onClick={createOrder} disabled={saving||!selPat||!selTests.length}
                className="bg-[#0D7C66] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-50 flex items-center gap-2">
                {saving&&<Loader2 className="w-4 h-4 animate-spin"/>}
                Create Order{selTests.length>0?` (${selTests.length} tests)`:''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
